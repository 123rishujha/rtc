"use strict";

async function init() {
  try {
    const sourceInfos = await navigator.mediaDevices.enumerateDevices();
    gotSources(sourceInfos);
  } catch (error) {
    console.log(error);
  }
}
init();

const getMediaButton = document.getElementById("getMedia");
const createPeerConnectionButton = document.getElementById(
  "createPeerConnection"
);
const createOfferButton = document.getElementById("createOffer");
const setOfferButton = document.getElementById("setOffer");
const createAnswerButton = document.getElementById("createAnswer");
const setAnswerButton = document.getElementById("setAnswer");
const hangupButton = document.getElementById("hangup");

let dataChannelDataReceived;

getMediaButton.onclick = getMedia;
createPeerConnectionButton.onclick = createPeerConnection;
createOfferButton.onclick = createOffer;
setOfferButton.onclick = setOffer;
createAnswerButton.onclick = createAnswer;
setAnswerButton.onclick = setAnswer;
// hangupButton.onclick = hangup;

const offerSdpTextarea = document.querySelector("div#local textarea");
const answerSdpTextarea = document.querySelector("div#remote textarea");

const audioSelect = document.querySelector("select#audioSrc");
const videoSelect = document.querySelector("select#videoSrc");

audioSelect.onchange = getMedia;
videoSelect.onchange = getMedia;

const localVideo = document.querySelector("div#local video");
const remoteVideo = document.querySelector("div#remote video");

let localPeerConnection;
let remotePeerConnection;
let localStream;
let sendChannel;
let receiveChannel;
const dataChannelOptions = { ordered: true };
let dataChannelCounter = 0;
let sendDataLoop;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1,
};

function gotSources(sourceInfos) {
  console.log("gotSources called");
  for (let i = 0; i < sourceInfos.length; i++) {
    const option = document.createElement("option");
    option.value = sourceInfos[i].deviceId;
    option.innerHTML = sourceInfos[i].label;
    if (sourceInfos[i].kind === "audioinput") {
      audioSelect.appendChild(option);
    } else if (sourceInfos[i].kind === "videoinput") {
      videoSelect.appendChild(option);
    }
  }
}

async function getMedia() {
  getMediaButton.disabled = true;
  if (localStream) {
    localVideo.srcObject = null;
    localStream.getTracks().forEach((elem) => elem.stop());
  }

  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;

  const constrains = {
    audio: {
      optional: [{ sourceId: audioSource }],
    },
    video: {
      optional: [{ sourceId: videoSource }],
    },
  };

  try {
    const userMedia = await navigator.mediaDevices.getUserMedia(constrains);
    localStream = userMedia;
    localVideo.srcObject = userMedia;
    createPeerConnectionButton.disabled = false;
  } catch (error) {
    console.log("navigator.getuserMedia:", error);
  }
}

function createPeerConnection() {
  createPeerConnectionButton.disabled = true;
  createOfferButton.disabled = false;
  const servers = null;
  localPeerConnection = new RTCPeerConnection(servers);
  console.log("local peer created", localPeerConnection);
  localPeerConnection.onicecandidate = (e) =>
    onIceCandidate(remotePeerConnection, e);
  sendChannel = localPeerConnection.createDataChannel(
    "sendDataChannel",
    dataChannelOptions
  );
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;
  sendChannel.onerror = onSendChannelStateChange;

  remotePeerConnection = new RTCPeerConnection(servers);
  console.log("remote peer created", remotePeerConnection);
  remotePeerConnection.onicecandidate = (e) =>
    onIceCandidate(localPeerConnection, e);
  remotePeerConnection.ontrack = function (event) {
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      console.log("Received remote stream", event);
    }
  };
  remotePeerConnection.ondatachannel = receiveChannelCallback;

  localStream.getTracks().forEach((track) => {
    localPeerConnection.addTrack(track, localStream);
  });
}

function receiveChannelCallback(event) {
  receiveChannel = event.channel;
  receiveChannel.onmessage = function (event) {
    dataChannelDataReceived = event.data;
    console.log(`DataChannel receive counter: ${dataChannelDataReceived}`);
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
  };
}

function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log("send channel state is: ", readyState);
  if (readyState === "open") {
    sendDataLoop = setInterval(sendData, 1000);
  } else {
    clearInterval(sendDataLoop);
  }
}

function sendData() {
  sendChannel.send(dataChannelCounter);
  dataChannelCounter++;
}

function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}

async function onIceCandidate(peer, event) {
  try {
    await peer.addIceCandidate(event.candidate);
  } catch (error) {
    console.error("Ice error", error);
  }
}

function onSendChannelStateChange() {
  if (sendChannel.readyState === "open") {
    sendChannel.send(dataChannelCounter);
    console.log("DataChannel send counter:", dataChannelCounter);
    dataChannelCounter++;
  }
}

async function createOffer() {
  try {
    const offer = await localPeerConnection.createOffer(offerOptions);
    offerSdpTextarea.disabled = false;
    offerSdpTextarea.value = offer.sdp;
    createOfferButton.disabled = true;
    setOfferButton.disabled = false;
  } catch (error) {
    console.log("error", error);
  }
}

async function createAnswer() {
  try {
    const answer = await remotePeerConnection.createAnswer();
    answerSdpTextarea.disabled = false;
    answerSdpTextarea.value = answer.sdp;
    createAnswerButton.disabled = true;
    setAnswerButton.disabled = false;
  } catch (error) {
    console.log("error", error);
  }
}

async function setOffer() {
  const sdp = offerSdpTextarea.value
    .split("\n")
    .map((el) => el.trim())
    .join("\r\n");
  const offer = { sdp: sdp, type: "offer" };
  try {
    await localPeerConnection.setLocalDescription(offer);
    await remotePeerConnection.setRemoteDescription(offer);
  } catch (error) {
    console.log("error while setting offer", error);
  }
  setOfferButton.disabled = true;
  createAnswerButton.disabled = false;
}

async function setAnswer() {
  const sdp = answerSdpTextarea.value
    .split("\n")
    .map((elem) => elem.trim())
    .join("\r\n");
  const answer = { type: "answer", sdp: sdp };
  try {
    await remotePeerConnection.setLocalDescription(answer);
    console.log("remote peer answer setted: localDescription=");
    await localPeerConnection.setRemoteDescription(answer);
    console.log("local peer answer setted: remoteDescription=");
    hangupButton.disabled = false;
    setAnswerButton.disabled = true;
  } catch (error) {
    console.log("error while setting answer", error);
  }
}
