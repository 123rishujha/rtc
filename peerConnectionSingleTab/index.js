const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const startButton = document.getElementById("startButton");
const callButton = document.getElementById("callButton");
const hangupButton = document.getElementById("hangupButton");

let localStream;
let pc1; // local stream
let pc2; // remote stream
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1,
};

startButton.addEventListener("click", start);
callButton.addEventListener("click", call);
hangupButton.addEventListener("click", hangUP);

const getName = (pc) => {
  return pc === pc1 ? "pc1" : "pc2";
};

const getOtherPc = (pc) => {
  return pc === pc1 ? pc2 : pc1;
};

async function start() {
  console.log("start called:- Requesting local stream");
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    console.log("received local Stream: ", stream);
    localStream = stream;
    localVideo.srcObject = stream;
    callButton.disabled = false;
  } catch (error) {
    console.log(`getUserMedia failed: ${error}`);
  }
}

async function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  const configuration = {};
  pc1 = new RTCPeerConnection(configuration); // local peer connection;
  console.log("created local peer connection object", pc1);
  pc1.addEventListener("icecandidate", (e) => onIceCandiate(pc1, e));

  pc2 = new RTCPeerConnection(configuration); // remote peer connection;
  console.log("created remote peer connection object", pc2);
  pc2.addEventListener("icecandidate", (e) => onIceCandiate(pc2, e));

  pc2.addEventListener("track", gotRemoteStream);

  localStream.getTracks()?.forEach((track) => pc1.addTrack(track, localStream));
  console.log("added local stream to pc1");

  try {
    console.log("create offer start by pc1");
    const offer = await pc1.createOffer(offerOptions);
    await onCreateOfferSuccess(offer);
  } catch (error) {
    console.log("error while creating offer:", error);
  }
}

async function onIceCandiate(pc, event) {
  try {
    await getOtherPc(pc).addIceCandidate(event.candidate);
    console.log(`${getName(pc)} addIceCandidate success`);
  } catch (error) {
    console.log("onIce candidate error", error);
  }
}

function gotRemoteStream(event) {
  if (remoteVideo.srcObject !== event.streams[0]) {
    remoteVideo.srcObject = event.streams[0];
    console.log("peerconnection pc2 received remote stream");
  }
}

//create answer;
async function onCreateOfferSuccess(desc) {
  console.log(`Offer from pc1\n${desc.sdp}`);
  try {
    await pc1.setLocalDescription(desc);
    console.log("local description setted successfully in pc1");

    await pc2.setRemoteDescription(desc);
    console.log("remote description setted successfully in pc2");
  } catch (error) {
    console.log("error while setting localDescription", error);
  }
  //create answer;
  console.log("create answer start");
  try {
    const answer = await pc2.createAnswer();
    await onCreateAnswerSuccess(answer);
  } catch (error) {
    console.log("error while creating answer", error);
  }
}

async function onCreateAnswerSuccess(answer) {
  console.log(`Offer/answer from pc2\n${answer.sdp}`);
  try {
    await pc2.setLocalDescription(answer);
    console.log("answer:- pc2 local description setted");
    await pc1.setRemoteDescription(answer);
    console.log("answer:- pc1 remote description setted");
  } catch (error) {
    console.log("on create answer success error", error);
  }
}

//close connection;
async function hangUP() {
  console.log("Ending call");
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}
