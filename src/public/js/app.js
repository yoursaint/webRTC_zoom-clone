const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getAudioTracks()[0];

        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user"}
    };
    const cameraConstrains = {
        audio:true,
        video: {deviceId: {exact: deviceId}}
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch(e){
        console.log(e);
    }
}

function handleMuteBtnClick() {
    myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

    if(!muted) {
        muteBtn.innerText="Mute";
        muted = true;
    } else {
        muteBtn.innerText="Unmute";
        muted = false;
    }
}

function handleCameraBtnClick() {
    myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));

    if(!cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = true;
        myStream.video = false;
    } else {
        cameraBtn.innerText = "Turn Camera On"
        cameraOff = false;
        myStream.video = true;
    }
}

async function handleCameraChange() {
    await getMedia(cameraSelect.value);
}

getMedia();

muteBtn.addEventListener("click", handleMuteBtnClick);
cameraBtn.addEventListener("click", handleCameraBtnClick);
cameraSelect.addEventListener("input", handleCameraChange);