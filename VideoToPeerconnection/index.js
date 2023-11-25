const leftVideo = document.getElementById("leftVideo");
const rightVideo = document.getElementById("rightVideo");

let stream;
let pc1;
let pc2;

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1,
};

// ----------------------stream capture --------------------

function maybeCreateStream() {
  console.log("may be create stream called");
  if (stream) return;
  if (leftVideo.captureStream) {
    stream = leftVideo.captureStream();
    makeConnection();
  } else if (leftVideo.mozCaptureStream) {
    stream = leftVideo.mozCaptureStream();
    makeConnection();
  }
}

leftVideo.oncanplay = maybeCreateStream;

if (leftVideo.readyState >= 3) {
  maybeCreateStream();
}

leftVideo.play();

//------------------------- RTC connection------------------------
function makeConnection() {
  console.log("make connection called");
  const server = null;
  pc1 = new RTCPeerConnection(server); // remote
  pc1.onicecandidate = (e) => onIceCandidate(pc1, e);

  pc2 = new RTCPeerConnection(server); // lacal
  pc2.onicecandidate = (e) => onIceCandidate(pc2, e);

  pc2.ontrack = function (event) {
    console.log("onTrack event called event:", event);
    if (rightVideo.srcObject !== event.streams[0]) {
      rightVideo.srcObject = event.streams[0];
      console.log("pc2 received remote stream", event);
    }
  };

  //adding stream/tracks to peerconnection;
  stream.getTracks().forEach((track) => {
    console.log("getTracks called");
    pc1.addTrack(track, stream);
  });

  pc1.createOffer(
    onCreateOfferSuccess,
    (error) =>
      console.log(`Failed to create session description: ${error.toString()}`),
    offerOptions
  );
}

function onCreateOfferSuccess(desc) {
  pc1.setLocalDescription(
    desc,
    () => console.log("pc1 Local Description complete"),
    (error) => console.log("failed to set session description on pc1:", error)
  );

  pc2.setRemoteDescription(
    desc,
    () => console.log("pc2 remote Description complete"),
    (error) => console.log("failed to set session description on pc1:", error)
  );
  pc2.createAnswer(onCreateAnswerSuccess, (error) =>
    console.log(`Failed to create session description: ${error.toString()}`)
  );
}

function onCreateAnswerSuccess(desc) {
  pc2.setLocalDescription(
    desc,
    () => console.log("pc2 remote Description answer"),
    (error) =>
      console.log("failed to set session description on pc2 error:", error)
  );

  pc1.setRemoteDescription(
    desc,
    () => console.log("pc1 remote Description answer"),
    (error) =>
      console.log("failed to set session description on pc1 error:", error)
  );
}

function onIceCandidate(pc, event) {
  let otherPeerConnection = pc === pc1 ? pc2 : pc1;
  otherPeerConnection
    .addIceCandidate(event.candidate)
    .then(() =>
      console.log(
        otherPeerConnection == pc1 ? "pc2 ICE candidate" : "pc1 ICE candidate"
      )
    )
    .catch((error) => {
      console.log(
        otherPeerConnection == pc1
          ? "pc2 failed to ICE candidate"
          : "pc1 failed to ICE candidate"
      );
    });
}
