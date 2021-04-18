import express from 'express';
import { spawn } from 'child_process';
import * as socketio from 'socket.io';
import { exec } from 'child_process';
import path from 'path';
import { StreamController } from '../controllers/StreamController';
const Faces = require('../db/faces');
const Images = require('../db/images');
const Devices = require('../db/devices');
const youauth = require('youauth');
const { createFolder, uploadVideo, storeImage, storeRecording, generateSignedURL } = require('../aws/amazon_s3');
const { sendSMS } = require('../notifications/twilioPushNotification');
import { v4 as uuidv4 } from 'uuid';

const recordingLocalStoragePath = path.resolve(__dirname, "../output/output.webm");

const controller = new StreamController();
const recognizer = new youauth.FaceRecognizer();
let nextCallTime: Date = new Date(-8640000000000000);

const routes = express.Router({
	mergeParams: true
});

// ======================================================================================================
//											STREAM
// ======================================================================================================

/*
		Use: Stops the specific media stream on the pi.
		Params: none
*/
routes.post("/stop_stream", async (req: any, res: any) => {
	controller.stopStream();
	return res.status(200).send("Stream Closing...");
});

/*
		Use: Starts the media streams. Optional if using sockets.
		Params: constraints
*/
routes.post("/start_stream", (req: any, res: any) => {
	// constraints = {video: boolean, audio: boolean};
	let constraints: any = req.body.constraints;
	controller.startStream(constraints);
	return res.status(200).send("Stream Starting...");
});

/*
		Use: Checks for the stream status.
		Params: none
*/
routes.post("/stream_check", (req: any, res: any) => {

	controller.getStreamStatus( (status: any) => {
		if(status.video) {
			return res.status(200).send({ message: "The stream is already live", streaming: status.video });
		}
		else {
			return res.status(200).send({ message: "The stream is not live", streaming: status.video });
		}
	});

});

// ======================================================================================================
//											RECORDING
// ======================================================================================================

/*
		Use: Starts recording on the video stream.
		Params: none
*/
routes.post('/start_recording', (req: any, res: any) => {

	controller.startRecording();
	console.log("start_recording route: recording starting...");
	return res.status(200).send("Recording Starting.");
});

/*
		Use: Stops recording and upload file to S3.
		Params: user_email, profile_name, component_name.
*/
routes.post('/stop_recording', async (req: any, res: any) => {

	const accountName = req.body.user_email;
	const profileName = req.body.profile_name;
	const componentName = req.body.component_name;

	controller.stopRecording();

	console.log("stop_recording route: Creating folder...");

	await createFolder(accountName, profileName, componentName);

	console.log("stop_recording route: Starting upload to " + recordingLocalStoragePath );

	await uploadVideo(accountName, profileName, componentName, recordingLocalStoragePath );

	console.log("stop_recording route: recording stopping...");

	deleteLocalFile(recordingLocalStoragePath );

	console.log("stop_recording_route: cleaned local storage.");

	return res.status(200).send("Recording Stopping.");
});

// ======================================================================================================
//											TAKE PICTURE
// ======================================================================================================

/*
		Use: Takes a picture of the current video stream, then saves it to a file.
		Params: user_email, profile_name, component_name.
*/
routes.post('/take_image', async (req: any, res: any) => {

	const accountName = req.body.user_email;
	const profileName = req.body.profile_name;
	const componentName = req.body.component_name;

	controller.getPicture( async (data: string) => {

		await storeImage(accountName, profileName, componentName, data);

		return res.status(200).send("Images saved.");
	});

});

// ======================================================================================================
//											FACIAL RECOGNITION
// ======================================================================================================

/*
		Use: Takes a picture of the current video stream and try to use it as a face image.
		Params: user_email, profile_name, component_name, profile_id.
*/
routes.post("/takeFaceImage", async (req: any, res: any) => {

	const profileId: number = req.body.profile_id;
	const accountName: string = req.body.user_email;
	const profileName: string = req.body.profile_name;
	const componentName: string = req.body.component_name;

	controller.getPicture(processImage);

	async function processImage(dataURI: any) {

		const tensor = await recognizer.loadImage(dataURI);

		const detections = await recognizer.detect(tensor);
		if (detections.length === 0) {
			return res.status(500).send("No faces detected!");
		}
		else if (detections.length !== 1) {
			return res.status(500).send("Too many faces detected!");
		}

		const refImages = [dataURI];
		const defaultName: string = "face_" + uuidv4();
		const labels = [defaultName];

		const labeledFaceDescriptors = await recognizer.labelDescriptors(labels, refImages);

		// Add image face data to faces table.
		Faces.addFace(defaultName, JSON.stringify(labeledFaceDescriptors), profileId).then((face: any) => {
			if (!face) {
				return res.status(500).json({ message: "Unable to insert face." });
			}
		}).catch((err: any) => {
			console.log(err);
			return res.status(500).json({ message: err });
		});

		const obj = await storeImage(accountName, profileName, componentName, dataURI);

		const imageLink = await generateSignedURL(obj.key);

		Images.addImage(defaultName, imageLink, 1, obj.key, profileId).then((image: any) => {
			if (!image) {
				return res.status(500).json({ message: "Unable to insert image." });
			}
		}).catch((err: any) => {
			console.log(err);
			return res.status(500).json({ message: err });
		});

		return res.status(200).send("Face Capture Successful!");
	}

});

/*
		Use: Stops face reg.
		Params: none.
*/
routes.post('/stop_face_reg', async (req: any, res: any) => {

	controller.stopFaceReg();

	return res.status(200).send("Face Recognition Stopped.");
});

/*
		Use: Stops face reg for a specific profile.
		Params: profile_id.
*/
routes.post('/stop_face_reg_profile', async (req: any, res: any) => {

	const profileId: number = req.body.profile_id;

	controller.removeFaceCallback(profileId + "");

	return res.status(200).send("Face Recognition Stopped for Profile.");
});

/*
		Use: Starts face reg.
		Params: profile_id.
*/
routes.post('/start_face_reg', async (req: any, res: any) => {

	const profileId: number = req.body.profile_id;
	const accountName: string = req.body.user_email;
	const profileName: string = req.body.profile_name;
	const componentName: string = req.body.component_name;
	const deviceId: number = req.body.device_id;
	const phoneNumber: string = req.body.phone_number;

	controller.startFaceReg();

	Faces.getFaces(profileId).then((faces: any) => {

		let labeledFaceDescriptors: any = [];

		const objList: any = parseFacesData(faces);

		if (objList.length !== 0) {
			labeledFaceDescriptors = recognizer.loadDescriptors(objList);
		}

		getDetections(function (detections: any, tensor: any) {

			let matches: any = [];
			let matchedLabels: any = [];

			// If there are faces to detect.
			if(labeledFaceDescriptors.length !== 0) {
					matches = recognizer.getMatches(detections, labeledFaceDescriptors);
					matchedLabels = recognizer.getMatchedLabels(matches);
			}

			const currentCallTime: Date = new Date();
			if(currentCallTime >= nextCallTime) {
				processDetections( {
					"matches": matches,
					"matchedLabels": matchedLabels,
					"detections": detections,
					"image": tensor,
					"profileId": profileId,
					"accountName": accountName,
					"profileName": profileName,
					"componentName": componentName,
					"phoneNumber": phoneNumber,
					"deviceId": deviceId
				});
				nextCallTime = new Date(currentCallTime.getTime() + 1 * 60000);
			}

		}, profileId);

	}).catch((err: any) => {
		console.log(err);
		return res.status(500).json({ message: err });
	});

	return res.status(200).send("Face Recognition Started.");
});

async function processDetections (params: any) {

	const deviceConfig: any = await Devices.getConfig(params.deviceId);

	const dataURI = await recognizer.drawFaceDetections(params.matches, params.detections, params.image, true);

	const defaultName: string = "face_detect_" + uuidv4();

	const obj = await storeImage(params.accountName, params.profileName, params.componentName, dataURI);

	const imageLink = await generateSignedURL(obj.key);

	const response = await Images.addImage(defaultName, imageLink, 2, obj.key, params.profileId);

	const message = params.matchedLabels.toString() || "unknown face(s)";

	if(deviceConfig.device_config.notifications) {
		sendSMS({
			messageBody: "smartHub image: Face(s) Detected! - " + message,
			phoneNumber: params.phoneNumber,
			mediaContent: imageLink
		});
	}
}

// ======================================================================================================
//											MOTION DETECTION
// ======================================================================================================

routes.post('/start_motion_detection', async (req: any, res: any) => {

	const profileId: number = req.body.profile_id;
	const accountName: string = req.body.user_email;
	const profileName: string = req.body.profile_name;
	const componentName: string = req.body.component_name;
	const deviceId: number = req.body.device_id;
	const phoneNumber: string = req.body.phone_number;

	controller.startMotionDetection();

	const deviceConfig: any = await Devices.getConfig(deviceId);

	console.log("start motion detection route.");
	controller.getMotionData(async function (data: any) {

		console.log("Hey, motion was detected :) ");
		console.log(accountName);
		console.log(componentName);
		console.log(profileName);

		const defaultName: string = "motion_detect_" + uuidv4();

		const obj = await storeImage(accountName, profileName, componentName, data);

		const imageLink = await generateSignedURL(obj.key);

		const response = await Images.addImage(defaultName, imageLink, 3, obj.key, profileId);

		if (deviceConfig.device_config.notifications) {
			sendSMS({
				messageBody: "smartHub image: Motion Detected!",
				phoneNumber: phoneNumber,
				mediaContent: imageLink
			});
		}
	}, profileId + "");

	return res.status(200).send("Motion Detection Started.");
});

routes.post('/stop_motion_detection', async (req: any, res: any) => {

	controller.stopMotionDetection();
	return res.status(200).send("Motion Detection Stopped.");
});

// ======================================================================================================
//											HELPER FUNCTIONS
// ======================================================================================================

// Function that starts continous fetching of face images from controller.
function getDetections(callback: any, profileId: number) {

	const newCallback = async function processFaceImage(faceImage: any) {
		const tensor = await recognizer.loadImage(faceImage);
		const detections = await recognizer.detect(tensor);
		if (detections.length !== 0) callback(detections, tensor);
	}
	controller.getFaceData(newCallback, profileId + "");
}

// Function just for parsing the array passed
function parseFacesData(faces: any) {
	const objList: any = [];
	for (var i = 0; i < faces.length; i++) {
		objList[i] = faces[i].face_data[0];
	}
	return objList;
}

// Function for deleting a local media file.
function deleteLocalFile(path: string) {
	if (process.platform === 'win32') {
		exec('del ' + path);
	}
	else {
		exec('rm ' + path);
	}
}

module.exports = {
	routes,
	controller
};