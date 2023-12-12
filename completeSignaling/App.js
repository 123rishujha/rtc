// create offer (local)
// set remote description (remote)
// create answer (remote)
// set remote description (local)
// add ice candidate (remote)

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

// const socket = io.connect("/webRTCPeers", {
//   path: "/webrtc",
// });

const socket = io.connect("http://localhost:8080");

function App() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pc = useRef(null);
  const textRef = useRef();
  // const candidateRef = useRef([]);
  const [offerVisible, setOfferVisible] = useState(true);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [status, setStatue] = useState("Make a call now");

  useEffect(() => {
    socket.on("connection-success", (success) => {
      console.log(success);
    });

    socket.on("sdp-frontend", async ({ sdp }) => {
      console.log("sdp", sdp);
      // textRef.current.value = JSON.stringify(sdp);
      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
      // setRemoteDescription();
      if (sdp.type === "offer") {
        setAnswerVisible(true);
        setOfferVisible(false);
        setStatue("Incomming call...");
      } else {
        setStatue("connection established");
      }
    });

    socket.on("candidate-frontend", async (candidate) => {
      // candidateRef.current = [...candidateRef.current, candidate];
      await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    const _pc = new RTCPeerConnection(null);
    _pc.onicecandidate = (e) => {
      if (e.candidate) {
        // console.log(JSON.stringify(e.candidate));
        // socket.emit("candidate-backend", e.candidate);
        sendToPeer("candidate-backend", e.candidate);
      }
    };

    _pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    };
    _pc.ontrack = (e) => {
      // got remote stream;
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    pc.current = _pc;

    const constraints = {
      audio: false,
      video: true,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => {
          _pc.addTrack(track, stream);
        });
      })
      .catch((e) => {
        console.log("getMedia Error...", e);
      });
  }, []);

  // const createOffer = () => {
  //   pc.current
  //     .createOffer({
  //       offerToReceiveAudio: 1,
  //       offerToReceiveVideo: 1,
  //     })
  //     .then((sdp) => {
  //       console.log(JSON.stringify(sdp));
  //       pc.current.setLocalDescription(sdp);
  //     })
  //     .catch((error) => console.log(error));
  // };

  // const createAnswer = () => {
  //   pc.current
  //     .createAnswer({
  //       offerToReceiveAudio: 1,
  //       offerToReceiveVideo: 1,
  //     })
  //     .then((sdp) => {
  //       console.log(JSON.stringify(sdp));
  //       pc.current.setLocalDescription(sdp);
  //     })
  //     .catch((error) => console.log(error));
  // };

  // const setRemoteDescription = () => {
  //   const sdp = JSON.parse(textRef.current.value);
  //   console.log(sdp);
  //   pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
  // };

  // const addCandidate = () => {
  //   const candidate = JSON.parse(textRef.current.value);
  //   console.log("Adding Candidate ...", candidate);
  //   pc.current.addIceCandidate(new RTCIceCandidate(candidate));
  // };

  const sendToPeer = (eventType, payload) => {
    socket.emit(eventType, payload);
  };

  // send offer to signaling server
  const processSdp = async (sdp) => {
    await pc.current.setLocalDescription(sdp);
    sendToPeer("sdp-backend", { sdp });
  };

  const createOffer = async () => {
    try {
      const sdp = await pc.current.createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      });
      // await pc.current.setLocalDescription(sdp);
      // console.log(JSON.stringify(sdp));
      // socket.emit("sdp-backend", { sdp });
      processSdp(sdp);
      setOfferVisible(false);
      // setAnswerVisible(true);
      setStatue("calling ...");
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  const createAnswer = async () => {
    try {
      const sdp = await pc.current.createAnswer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      });
      // await pc.current.setLocalDescription(sdp);
      // console.log(JSON.stringify(sdp));
      // socket.emit("sdp-backend", { sdp });
      processSdp(sdp);
      // setOfferVisible(false);
      setAnswerVisible(false);
      setStatue("call established");
    } catch (error) {
      console.error("Error creating answer:", error);
    }
  };

  // const setRemoteDescription = async () => {
  //   try {
  //     const sdp = JSON.parse(textRef.current.value);
  //     console.log(sdp);
  //     await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
  //   } catch (error) {
  //     console.error("Error setting remote description:", error);
  //   }
  // };

  // const addCandidate = async () => {
  //   try {
  //     // const candidate = JSON.parse(textRef.current.value);
  //     // console.log("Adding Candidate ...", candidate);
  //     console.log("candidate", candidateRef.current);
  //     candidateRef.current.forEach(async (candidate) => {
  //       await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
  //     });
  //   } catch (error) {
  //     console.error("Error adding candidate:", error);
  //   }
  // };

  const showHideButtons = () => {
    if (offerVisible) {
      return <button onClick={createOffer}>Call</button>;
    } else if (answerVisible) {
      return <button onClick={createAnswer}>Accept</button>;
    }
  };

  return (
    <div>
      <video
        style={{ width: 240, height: 240, backgroundColor: "black", margin: 5 }}
        ref={localVideoRef}
        autoPlay
      ></video>
      <video
        style={{ width: 240, height: 240, backgroundColor: "black", margin: 5 }}
        ref={remoteVideoRef}
        autoPlay
      ></video>
      <br />
      {showHideButtons()}
      {/* <button onClick={createOffer}>Create Offer</button>
      <button onClick={createAnswer}>Create Answer</button> */}
      <div>{status}</div>
      <br />
      <textarea ref={textRef}></textarea>
      <br />
      {/* <button onClick={setRemoteDescription}>Set Remote Description</button> */}
      {/* <button onClick={addCandidate}>Add Candidates</button> */}
    </div>
  );
}

export default App;
