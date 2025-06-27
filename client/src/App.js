import './App.css';
import axios from "axios";
import React, { useRef, useState } from "react";


function App() {
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const startLiveSimulation = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    setRecording(true);

    const startChunkRecorder = () => {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "chunk.webm");

        try {
          const res = await axios.post("http://localhost:4000/transcribe", formData);
          setTranscript((prev) => prev + " " + res.data.transcript);
        } catch (err) {
          console.error("Error sending chunk:", err);
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 5000); // 5 sec chunk

      mediaRecorderRef.current = mediaRecorder;
    };

    // Start recording chunks every 5s
    startChunkRecorder();
    intervalRef.current = setInterval(startChunkRecorder, 6000); // buffer before next
  };

  const stopLiveSimulation = () => {
    clearInterval(intervalRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setRecording(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1> Simulated Live Transcription (Fanar)</h1>
      <button onClick={startLiveSimulation} disabled={recording}>Start</button>
      <button onClick={stopLiveSimulation} disabled={!recording}>Stop</button>

      <div style={{ marginTop: 24, direction: "rtl", fontSize: 18 }}>
        {transcript || "ابدأ التحدث وسنقوم بالنسخ كل ٥ ثوانٍ"}
      </div>
    </div>
  );
}

export default App;

// translate to english; say them in english 