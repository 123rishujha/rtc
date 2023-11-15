const videoElem = document.querySelector("video");
const buttonElem = document.querySelector("button");
const canvasElem = document.querySelector("canvas");
const download = document.querySelector("#download");
canvasElem.width = "480pxs";
canvasElem.height = "370px";

buttonElem.addEventListener("click", async (e) => {
  canvasElem.width = videoElem.videoWidth;
  canvasElem.height = videoElem.videoHeight;
  canvasElem
    .getContext("2d")
    .drawImage(videoElem, 0, 0, canvasElem.width, canvasElem.height);
});

download.addEventListener("click", (e) => {
  canvasElem.toBlob((blob) => {
    const anchorElem = document.createElement("a");
    const url = URL.createObjectURL(blob);

    anchorElem.href = url;
    anchorElem.download = "image.jpg";
    anchorElem.click();

    // Release the object URL
    URL.revokeObjectURL(url);

    console.log("url", url);
  }, "image/jpeg"); // Specify the desired image format
});
navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then((stream) => {
    videoElem.srcObject = stream;
  })
  .catch((error) => {
    console.log("error", error);
  });
