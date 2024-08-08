const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

const welcome = document.getElementById("welcome");
const call = document.getElementById("call")

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

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
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
        .getSenders()
        .find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm = welcome.querySelector("form");

muteBtn.addEventListener("click", handleMuteBtnClick);
cameraBtn.addEventListener("click", handleCameraBtnClick);
cameraSelect.addEventListener("input", handleCameraChange);
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket code

socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", roomName, offer);
});

socket.on("offer", async(offer) => {
    console.log("get an offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    console.log("emit the answer");
    socket.emit("answer", roomName, answer);
});

socket.on("answer", (answer) => {
    console.log(answer);
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

// RTC code

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", roomName, data.candidate);
}

function handleAddStream(data) {
    const peersFace = document.getElementById("peersFace");
    peersFace.srcObject = data.stream;
}

function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
    .getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream));
}

