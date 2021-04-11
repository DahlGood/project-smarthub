import express from 'express';
import { spawn } from 'child_process';
import * as socketio from 'socket.io';
import { exec } from 'child_process';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { VideoController } from '../controllers/VideoController';
const Faces = require('../db/faces');
const Images = require('../db/images');
const youauth = require('youauth');
const { createFolder, uploadVideo, uploadImage, storeImage, generateSignedURL } = require('../aws/amazon_s3');
import { v4 as uuidv4 } from 'uuid';

let live_browser: any;
let browserIsLive: boolean = false;
const PORT = 4000;

const OSplatform = process.platform;
const localStoragePath = path.resolve(__dirname, "../output/output.webm");
const imageLocalStoragePath = path.resolve(__dirname, "../output/output.png");

const controller = new VideoController();
const recognizer = new youauth.FaceRecognizer();

const faceIntervalIDs: any = [];

const routes = express.Router({
	mergeParams: true
});

/*
		Use: Stops the video stream on the pi.
		Params: none
*/
routes.post("/stop_stream", async (req: any, res: any) => {

	console.log("stop_stream route: Stream closing...");

	try {
		await live_browser.close();
	}
	catch (error) {
		console.log("stop_stream route error: " + error);
	}
	finally {
		await live_browser.close();
	}

	console.log("stop_stream route: Stream stopped.");
	return res.status(200).send("Stream Closing.");
});

/*
		Use: Starts the video stream on the pi.
		Params: none
*/
routes.post("/start_stream", (req: any, res: any) => {
	console.log("start_stream route: Stream starting...");
	runLive();
	console.log("start_stream route: Stream started.");
	return res.status(200).send("Stream Starting.");
});

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

	console.log("stop_recording route: Starting upload to " + localStoragePath);

	await uploadVideo(accountName, profileName, componentName, localStoragePath);

	console.log("stop_recording route: recording stopping...");

	if (OSplatform === 'win32') {
		exec('del ' + localStoragePath);
	}
	else {
		exec('rm ' + localStoragePath);
	}

	console.log("stop_recording_route: cleaned local storage.");

	return res.status(200).send("Recording Stopping.");
});

/*
		Use: Takes a picture of the current video stream, then saves it to a file.
		Params: user_email, profile_name, component_name.
*/
routes.post('/take_image', async (req: any, res: any) => {

	const accountName = req.body.user_email;
	const profileName = req.body.profile_name;
	const componentName = req.body.component_name;

	controller.takePicture();

	await createFolder(accountName, profileName, componentName);

	console.log("take_image route: Starting upload to " + imageLocalStoragePath);

	await uploadImage(accountName, profileName, componentName, imageLocalStoragePath);

	console.log("take_image route: image taken...");

	if (OSplatform === 'win32') {
		exec('del ' + imageLocalStoragePath);
	}
	else {
		exec('rm ' + imageLocalStoragePath);
	}

	console.log("take_image route: cleaned local storage.");

	return res.status(200).send("Images saved.");
});

/*
		Use: Takes a picture of the current video stream and try to use it as a face image.
		Params: user_email, profile_name, component_name, profile_id.
*/
routes.post("/takeFaceImage", async (req: any, res: any) => {

	const profileId: number = req.body.profile_id;
	const accountName: string = req.body.user_email;
	const profileName: string = req.body.profile_name;
	const componentName: string = req.body.component_name;

	controller.getPicture(printData);
	let dataURI: string = "";

	async function printData(dataURI: any) {

		const tensor = await recognizer.loadImage(dataURI);

		const detections = await recognizer.detect(tensor);
		if(detections.length === 0) {
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
		Faces.addFace(defaultName, JSON.stringify(labeledFaceDescriptors), profileId).then( (face: any) => {
			if(!face) {
					return res.status(500).json({message: "Unable to insert face."});
				}
		}).catch( (err: any) => {
				console.log(err);
				return res.status(500).json({message: err});
		});

		const obj = await storeImage(accountName, profileName, componentName, dataURI);

		const imageLink = await generateSignedURL(obj.key);

		Images.addImage(defaultName, imageLink, 1, obj.key, profileId).then( (image: any) => {
				if(!image) {
					return res.status(500).json({message: "Unable to insert image."});
				}
		}).catch( (err: any) => {
				console.log(err);
				return res.status(500).json({message: err});
		});

		return res.status(200).send("Face Capture Successful!");
	}

});

/*
		Use: Starts face reg.
		Params: profile_id.
*/
routes.post('/start_face_reg', async (req: any, res: any) => {

	const profileId: number = req.body.profile_id;

	controller.startFaceReg();

	Faces.getFaces(profileId).then( (faces: any) => {

		let labeledFaceDescriptors: any = [];

		const objList: any = parseFacesData(faces);

		if(objList.length !== 0) {
				labeledFaceDescriptors = recognizer.loadDescriptors(objList);
		}

		getDetections(processDetections, profileId);

		function processDetections(detections: any) {

			// If there are faces to detect.
			if(labeledFaceDescriptors.length !== 0) {

					let matches: any = recognizer.getMatches(detections, labeledFaceDescriptors);
					let matchedLabels: any = recognizer.getMatchedLabels(matches);
					// If something is detected. Matched labels is an array that contains the names detected.
					// Example: ["fred", "ashley"]
					console.log(matchedLabels);
			}
			else {

					// Alert user with image that face was detected on.

			}
		}

	}).catch( (err: any) => {
			console.log(err);
			return res.status(500).json({message: err});
	});

	return res.status(200).send("Face Recognition Started.");
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
	clearInterval(faceIntervalIDs[profileId]);

	return res.status(200).send("Face Recognition Stopped for Profile.");
});

/*
		Use: Starts the headless chromium browser to utilize WebRTC.
		Params: none
*/
async function runLive() {
	// For now some safety to avoid multiple browser processes open.
	if (!browserIsLive) {
		// The boolean might be slow to update, but front-end can also control access to the route.
		browserIsLive = true;
		// Launch the chromium browser in headless mode.
		live_browser = await puppeteer.launch({
			executablePath: 'chromium-browser',
			headless: true,
			args: ['--use-fake-ui-for-media-stream', '--mute-audio']
		});
		// Create a new page in the browser.
		const page = await live_browser.newPage();

		await page.goto("http://localhost:" + PORT + "/broadcast.html");

		console.log("Chromium is live.");

		live_browser._process.once('close', () => {
			console.log("Browser has closed.");
			browserIsLive = false;
		});
	}
}

// Function that starts continous fetching of face images from controller.
function getDetections (callback: any, profileId: number) {
	// Current face reg functionality. Checks every interval for face data in controller.
	faceIntervalIDs[profileId] = setInterval( async () => {
		// Get face data.
		const faceData = await controller.getFaceData();
		// console.log("I am active!");
		// If face data.
		if(faceData.length !== 0) {
			// Use youauth to detect faces.
			const tensor = await recognizer.loadImage(faceData);
			const detections = await recognizer.detect(tensor);
			callback(detections);
		}
		// Reset face data to avoid repetitive face data.
		controller.setFaceData("");
	}
	, 100);
}

// Function just for parsing the array passed
function parseFacesData(faces: any) {
	const objList: any = [];
	for(var i = 0; i < faces.length; i++) {
		objList[i] = faces[i].face_data[0];
	}
	return objList;
}


module.exports = {
	routes,
	controller
};
