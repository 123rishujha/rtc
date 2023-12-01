const startButton = document.getElementById("startButton");
const callButton = document.getElementById("callButton");
const hangupButton = document.getElementById("hangupButton");

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

const video1 = document.getElementById("video1");
const video2 = document.getElementById("video2");
const video3 = document.getElementById("video3");

let localStream;
let pc1Local;
let pc1Remote;
let pc2Local;
let pc2Remote;

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1,
};

async function start() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStream = stream;
    video1.srcObject = stream;
  } catch (error) {
    console.log("error in start", error);
  }
}

async function call() {
  const servers = null;
  pc1Local = new RTCPeerConnection(servers);
  pc1Remote = new RTCPeerConnection(servers);
  pc1Remote.ontrack = function (e) {
    console.log("ontrack called");
    if (video2.srcObject !== e.streams[0]) {
      video2.srcObject = e.streams[0];
      console.log("pc1: received remote stream");
    }
  };
  pc1Local.onicecandidate = function (event) {
    console.log("ice candidate called for pc1Local");
    handleCandidate(event.candidate, pc1Remote, "pc1:", `local`);
  };
  pc1Remote.onicecandidate = function (event) {
    handleCandidate(event.candidate, pc1Local, "pc1", "remote");
  };
  console.log("created local and remote peer connection:1 objects");

  // peer connection second-----------------------------------
  pc2Local = new RTCPeerConnection(servers);
  pc2Remote = new RTCPeerConnection(servers);
  pc2Remote.ontrack = function (e) {
    console.log("ontrack called");
    if (video3.srcObject !== e.streams[0]) {
      video3.srcObject = e.streams[0];
      console.log("pc2: received remote stream");
    }
  };
  pc2Local.onicecandidate = function (event) {
    handleCandidate(event.candidate, pc2Remote, "pc1:", `local`);
  };
  pc1Remote.onicecandidate = function (event) {
    handleCandidate(event.candidate, pc2Local, "pc1", "remote");
  };
  // console.log("created local and remote peer connection:2 objects");

  //add tracks
  localStream.getTracks().forEach((track) => {
    pc1Local.addTrack(track, localStream);
    pc2Local.addTrack(track, localStream);
  });
  //----------------------------------------------------------------

  //create offer;
  pc1Local.createOffer(offerOptions).then((desc) => {
    pc1Local.setLocalDescription(desc);
    console.log(`offer from pc1Local\n ${desc.sdp}`);
    pc1Remote.setRemoteDescription(desc);
    console.log("pc1 remote description: ------------------------");
    pc1Remote
      .createAnswer()
      .then(gotDescription1Remote, (error) =>
        console.log("answer err: pc1R", error)
      );
  });

  //create offer;
  pc2Local.createOffer(offerOptions).then((desc) => {
    pc2Local.setLocalDescription(desc);
    console.log(`offer from pc1Local\n ${desc.sdp}`);
    pc2Remote.setRemoteDescription(desc);
    pc2Remote
      .createAnswer()
      .then(gotDescription2Remote, (error) =>
        console.log("answer err: pc1R", error)
      );
  });
}

function gotDescription1Remote(answer) {
  pc1Remote.setLocalDescription(answer);
  console.log(`answer from pc1Remote\n ${answer.sdp}`);
  pc1Local.setRemoteDescription(answer);
}

function gotDescription2Remote(answer) {
  pc2Remote.setLocalDescription(answer);
  console.log(`answer from pc2Remote\n ${answer.sdp}`);
  pc2Local.setRemoteDescription(answer);
}

function hangup() {
  pc1Local.close();
  pc1Remote.close();
  pc2Local.close();
  pc2Remote.close();
  pc1Local = pc1Remote = null;
  pc2Local = pc2Remote = null;
}

async function handleCandidate(candidate, peerConnection, prefix, type) {
  await peerConnection.addIceCandidate(candidate);
  console.log(
    `${prefix}New ${type} ICE candidate: ${
      candidate ? candidate.candidate : "(null)"
    }`
  );
}
