const callButton = document.getElementById("callButton");
const acceptButton = document.getElementById("acceptButton");
const hangUpButton = document.getElementById("hangUpButton");

callButton.onclick = call;
acceptButton.onclick = acceptCall;
hangUpButton.onclick = callCut;

const localVideo = document.getElementById("vid1");
const remoteVideo = document.getElementById("vid2");

let pc1 = null;
let pc2 = null;
let localStream;
const remoteStream = new MediaStream();

const offerOptions = {
  offerToReceiveVideo: 1,
  offerToReceiveAudio: 1,
};

async function call() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  localStream = stream;
  localVideo.srcObject = stream;
  const servers = null;
  pc1 = new RTCPeerConnection(servers);
  pc1.onicecandidate = (e) => onIceCandidate(pc2, e);

  pc2 = new RTCPeerConnection(servers);
  pc2.onicecandidate = (e) => onIceCandidate(pc1, e);
  pc2.ontrack = (e) => {
    console.log("on track called -------------------------------------");
    // remoteStream = e.streams[0];
    // remoteVideo.srcObject = remoteStream;
    remoteVideo.srcObject = remoteStream;
    remoteStream.addTrack(e.track, remoteStream);
  };

  localStream.getTracks().forEach((track) => pc1.addTrack(track, localStream));

  //create offer
  const offer = await pc1.createOffer(offerOptions);
  gotOffer(offer);
}

async function onIceCandidate(peer, event) {
  try {
    await peer.addIceCandidate(event.candidate);
  } catch (error) {
    console.log("candidate error", error);
  }
}

async function gotOffer(offer) {
  try {
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    gotProvisionalAnswer(answer);
    callButton.disabled = true;
    acceptButton.disabled = false;
  } catch (error) {
    console.log("error offer", error);
  }
}

// setting answer as provisional answer
async function gotProvisionalAnswer(answer) {
  console.log("first answer sdp", answer.sdp);
  answer.sdp = answer.sdp.replace(/a=recvonly/g, "a=inactive");
  answer.type = "pranswer";
  try {
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);
    acceptButton.disabled = false;
    callButton.disabled = true;
  } catch (error) {
    console.log("error", error);
  }
}

async function acceptCall() {
  try {
    const answer = await pc2.createAnswer();
    console.log("second answer sdp", answer.sdp);
    answer.sdp = answer.sdp.replace(/a=inactive/g, "a=recvonly");
    answer.type = "answer";
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);
    acceptButton.disabled = true;
    hangUpButton.disabled = false;
  } catch (error) {
    console.error(error);
  }
}

async function callCut() {
  localStream.getTracks().forEach((elem) => elem.stop());
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  callButton.disabled = false;
}
