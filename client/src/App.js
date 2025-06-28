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
  const [summary, setSummary] = useState("");
  const [englishSummary, setEnglishSummary] = useState("");
  const [showEnglishSummary, setShowEnglishSummary] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [context, setContext] = useState("");

  const clearAll = () => {
      // Reset states
      setTranscript("");
      setCleanedMSA("");
      setTranslation("");
      transcriptRef.current = "";
      setSummary(""); 
      setEnglishSummary(""); 
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

      // Only process new text
      let newText = trimmed;
      if (lastProcessedRef.current && trimmed.startsWith(lastProcessedRef.current)) {
        newText = trimmed.slice(lastProcessedRef.current.length).trim();
      }

      if (newText.length < 1) return; // process even small new chunks

      setIsProcessing(true);

      try {
        // 1. Clean to MSA
        const cleanRes = await axios.post("http://localhost:4000/clean", { text: newText, context });
        setCleanedMSA((prev) => prev + " " + cleanRes.data.msa);

        // 2. Translate to English
        const translateRes = await axios.post("http://localhost:4000/translate", { msa: cleanRes.data.msa });
        setTranslation((prev) => prev + " " + translateRes.data.english);

        lastProcessedRef.current = trimmed;      
    } catch (err) {
        console.error("Processing failed:", err);
      } finally {
        setIsProcessing(false);
      }
    }, 
    [context]
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
    }, 30000);
    
    return () => clearInterval(interval);
  }, [recording, processTranscript]);
  

  const generateSummary = async () => {
    setIsSummarizing(true);
    try {
      // Arabic summary
      const res = await axios.post("http://localhost:4000/summarize", { text: transcript });
      setSummary(res.data.summary);
  
      // English summary if toggled
      if (showEnglishSummary) {
        const enRes = await axios.post("http://localhost:4000/translate", { msa: res.data.summary});
        setEnglishSummary(enRes.data.english);
      }
    } catch (err) {
      console.log("error translating:", err);
      setSummary("Summary failed.");
      setEnglishSummary("");
      console.error("Summary failed:", err);
    } finally {
      setIsSummarizing(false);
    }
  };


  return (
    <TranscriptionUI 
      transcript={transcript}
      cleanedMSA={cleanedMSA}
      translation={translation}
      recording={recording}
      startLiveSimulation={startLiveSimulation}
      stopLiveSimulation={stopLiveSimulation}
      isProcessing={isProcessing}
      summary={summary}
      englishSummary={englishSummary}
      showEnglishSummary={showEnglishSummary}
      setShowEnglishSummary={setShowEnglishSummary}
      generateSummary={generateSummary}
      isSummarizing={isSummarizing}
      clearAll={clearAll}
      context={context}
      setContext={setContext}
    />
  );
}
export default App;

// translate to english; say them in english 