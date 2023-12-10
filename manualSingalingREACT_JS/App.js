import { useEffect, useRef } from "react";

// create offer (local)
// set remote description (remote)
// create answer (remote)
// set remote description (local)
// add ice candidate (remote)

function App() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pc = useRef(null);
  const textRef = useRef();

  useEffect(() => {
    const _pc = new RTCPeerConnection(null);
    _pc.onicecandidate = (e) => {
      if (e.candidate) console.log(JSON.stringify(e.candidate));
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

  const createOffer = () => {
    pc.current
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.current.setLocalDescription(sdp);
      })
      .catch((error) => console.log(error));
  };

  const createAnswer = () => {
    pc.current
      .createAnswer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.current.setLocalDescription(sdp);
      })
      .catch((error) => console.log(error));
  };

  const setRemoteDescription = () => {
    const sdp = JSON.parse(textRef.current.value);
    console.log(sdp);
    pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
  };

  const addCandidate = () => {
    const candidate = JSON.parse(textRef.current.value);
    console.log("Adding Candidate ...", candidate);
    pc.current.addIceCandidate(new RTCIceCandidate(candidate));
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
