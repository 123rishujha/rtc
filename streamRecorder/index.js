let mediaRecorder;
let recordedBlobs;

const codecPreferences = document.getElementById("codecPreferences");
const errorMsgElement = document.getElementById("errorMsg");
const recordedVideo = document.getElementById("recorded");
const recordButton = document.getElementById("record");
const playButton = document.getElementById("play");
const downloadButton = document.getElementById("download");

recordButton.addEventListener("click", () => {
  if (recordButton.textContent === "Start Recording") {
    startRecording();
  } else {
    recordButton.textContent = "Start Recording";
    stopRecording();
    playButton.disabled = false;
    downloadButton.disabled = false;
    codecPreferences.disabled = false;
  }
});

//start recording
function startRecording() {
  recordedBlobs = [];
  const mimeType =
    codecPreferences.options[codecPreferences.selectedIndex].value;

  try {
    mediaRecorder = new MediaRecorder(window.stream, { mimeType });
  } catch (error) {
    console.log("error while starting recording", error);
    return;
  }
  recordButton.textContent = "Stop Recording";
  playButton.disabled = true;
  downloadButton.disabled = true;
  codecPreferences.disabled = true;

  //adding event listener to mediaRecoder to list if any data is avaiable
  mediaRecorder.addEventListener("dataavailable", (e) => {
    console.log("availabledata", e);
    if (e.data && e.data.size > 0) {
      recordedBlobs.push(e.data);
    }
  });

  mediaRecorder.addEventListener("stop", (event) => {
    console.log("Recorder stopped: ", event);
    console.log("Recorded Blobs: ", recordedBlobs);
  });

  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}

//get supported mime types for videos
function getSupportedMimeType() {
  const possibleTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/mp4;codecs=h264,aac",
    "video/webm;codecs=av01,opus",
  ];
  return possibleTypes.filter((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType)
  );
}

// get stream and start video
async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    window.stream = stream;
    recordButton.disabled = false; // now user can start recording
    document.querySelector("#gum").srcObject = stream;

    getSupportedMimeType().forEach((mimeType) => {
      const option = document.createElement("option");
      option.value = mimeType;
      option.innerHTML = mimeType;
      codecPreferences.appendChild(option);
    });
    codecPreferences.disabled = false; // now user can select the preferred video format for recording
  } catch (error) {
    console.log("error", error);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${error.toString()}`;
  }
}

//start video recordin
document.querySelector("#start").addEventListener("click", async () => {
  document.querySelector("#start").disabled = true;
  const hasEchoCancellation =
    document.querySelector("#echoCancellation").checked;

  const constraints = {
    video: {
      width: 1280,
      height: 720,
    },
    audio: {
      echoCancellation: { exact: hasEchoCancellation },
    },
  };

  await init(constraints);
});
