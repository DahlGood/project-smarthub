import axios from 'axios';

export function startMotionDetection(params: any){
    if (params.device_ip !== 'petepicam1234.zapto.org' && params.device_ip !== "leohescamera.ddns.net"
        && params.device_ip !== 'lukessmarthub.ddns.net' && params.device_ip !== '192.168.86.244') {
        return;
    }
    var collection = {
        user_email: params.user_email,
        profile_name: params.profile_name,
        component_name: "Motion",
        profile_id: params.profile_id,
        device_id: params.device_id,
        phone_number: params.phone_number
    }
    console.log(collection)
    var url = 'http://' + params.device_ip + ':4000/video/start_motion_detection';
    axios.post(url, collection).then((response: any) => {
        console.log("motion detection starting");
        console.log(response.status);
    }, (error) => {
        console.log("error starting motion detection");
        console.log(error);
    })
}

export function stopMotionDetection(deviceIP: String){
    if (deviceIP !== 'petepicam1234.zapto.org' && deviceIP !== "leohescamera.ddns.net"
        && deviceIP !== 'lukessmarthub.ddns.net' && deviceIP !== '192.168.86.244') {
        return;
    }
    var url = 'http://' + deviceIP + ':4000/video/stop_motion_detection';
    axios.post(url).then((response: any) => {
        console.log("motion detection stopping");
        console.log(response.status);
    }, (error) => {
        console.log("error stopping motion detection");
        console.log(error);
    })
}