let videoElement = document.querySelector("video");
let audioSelect = document.getElementById("audioSource");
let videoSelect = document.getElementById("videoSource");

//set constrains on change in audio or video select element
audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream().then(getDevices);

// get all the available audio/video devices;
async function getDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    for (const device of devices) {
      const option = document.createElement("option");
      option.value = device.deviceId;
      if (device.kind === "audioinput") {
        option.text = device.label;
        audioSelect.appendChild(option);
      }
      if (device.kind === "videoinput") {
        option.text = device.label;
        videoSelect.appendChild(option);
      }
    }
  } catch (error) {
    handelError(error);
  }
}

async function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  console.log("sources", audioSource, videoSource);
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    gotStream(stream);
  } catch (error) {
    handelError(error);
  }
}

//pass stream to video
function gotStream(stream) {
  window.stream = stream;
  //   audioSelect.selectedIndex = [...audioSelect.options].findIndex(
  //     (option) => option.text == stream.getAudioTracks()[0]?.label
  //   );

  //   videoSelect.selectedIndex = [...videoSelect.options].findIndex(
  //     (option) => option.text == stream.getVideoTracks()[0]?.label
  //   );

  videoElement.srcObject = stream;
}

function handelError(error) {
  console.log("something went wrong", error);
}
