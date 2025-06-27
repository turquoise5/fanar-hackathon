import './App.css';
import axios from "axios";
import React, { useRef, useState, useEffect, useCallback } from "react";
import TranscriptionUI from './translation'

function App() {
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [cleanedMSA, setCleanedMSA] = useState("");
  const [translation, setTranslation] = useState("");
  const transcriptRef = useRef(transcript); 
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedRef = useRef("");

  const clearAll = () => {
      // Reset states
      setTranscript("");
      setCleanedMSA("");
      setTranslation("");
      transcriptRef.current = "";
  }

  // live recording and transcription
  const startLiveSimulation = async () => {
    clearAll()
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

  const stopLiveSimulation = async () => {
    clearInterval(intervalRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setRecording(false);
    
    await processTranscript(transcriptRef.current);
  };
  

  const processTranscript = useCallback(
    async (text) => {
      const trimmed = text.trim(); 

      // Skip if no new content (prevents duplicate processing)
      if (trimmed.length < 10 || trimmed === lastProcessedRef.current) return;

      setIsProcessing(true);

      try {
        const res = await axios.post("http://localhost:4000/process", { text });
        setCleanedMSA(res.data.msa);
        setTranslation(res.data.english);
        lastProcessedRef.current = trimmed; // track last processed
      } catch (err) {
        console.error("Processing failed:", err);
      } finally {
        setIsProcessing(false); // stop loading
      }
    }, 
    []
  );  

  // Sync ref with state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);


  useEffect(() => {
    if (!recording) return;

    const interval = setInterval(() => {
      // Use ref to get latest transcript
      processTranscript(transcriptRef.current); 
    }, 15000);
    
    return () => clearInterval(interval);
  }, [recording, processTranscript]);
  

  return (
    <TranscriptionUI 
      transcript={transcript}
      cleanedMSA={cleanedMSA}
      translation={translation}
      recording={recording}
      startLiveSimulation={startLiveSimulation}
      stopLiveSimulation={stopLiveSimulation}
      isProcessing={isProcessing}
      clearAll={clearAll}
    />
  );
}
export default App;

// translate to english; say them in english 