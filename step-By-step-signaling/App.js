// react js  app.js code
// create offer (local)
// set remote description (remote)
// create answer (remote)
// set remote description (local)
// add ice candidate (remote)

import { useEffect, useRef } from "react";
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
  const candidateRef = useRef([]);

  useEffect(() => {
    socket.on("connection-success", (success) => {
      console.log(success);
    });

    socket.on("sdp-frontend", ({ sdp }) => {
      console.log("sdp", sdp);
      textRef.current.value = JSON.stringify(sdp);
      // setRemoteDescription();
    });

    socket.on("candidate-frontend", (candidate) => {
      candidateRef.current = [...candidateRef.current, candidate];
      console.log(
        "got candidate from signaling server",
        candidate,
        candidateRef.current
      );
    });

    const _pc = new RTCPeerConnection(null);
    _pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log(JSON.stringify(e.candidate));
        socket.emit("candidate-backend", e.candidate);
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


  const createOffer = async () => {
    try {
      const sdp = await pc.current.createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      });
      await pc.current.setLocalDescription(sdp);
      console.log(JSON.stringify(sdp));
      socket.emit("sdp-backend", { sdp });
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
      await pc.current.setLocalDescription(sdp);
      console.log(JSON.stringify(sdp));
      socket.emit("sdp-backend", { sdp });
    } catch (error) {
      console.error("Error creating answer:", error);
    }
  };

  const setRemoteDescription = async () => {
    try {
      const sdp = JSON.parse(textRef.current.value);
      console.log(sdp);
      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (error) {
      console.error("Error setting remote description:", error);
    }
  };

  const addCandidate = async () => {
    try {
      // const candidate = JSON.parse(textRef.current.value);
      // console.log("Adding Candidate ...", candidate);
      console.log("candidate", candidateRef.current);
      candidateRef.current.forEach(async (candidate) => {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      });
    } catch (error) {
      console.error("Error adding candidate:", error);
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
      <button onClick={createOffer}>Create Offer</button>
      <button onClick={createAnswer}>Create Answer</button>
      <br />
      <textarea ref={textRef}></textarea>
      <br />
      <button onClick={setRemoteDescription}>Set Remote Description</button>
      <button onClick={addCandidate}>Add Candidates</button>
    </div>
  );
}

export default App;
