import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

const SignLanguageDetector = () => {
  const webcamRef = useRef(null);
  const [detectedSign, setDetectedSign] = useState(null);
  const [assembledWord, setAssembledWord] = useState("");
  const [wordHistory, setWordHistory] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [webcamOn, setWebcamOn] = useState(false);
  const [speechToSignGif, setSpeechToSignGif] = useState(null); // NEW

  const captureAndSend = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsDetecting(true);

    try {
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append("file", blob, "frame.png");

      const response = await axios.post("http://localhost:8000/detect-sign/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const predicted = response.data.predicted_sign;
      const fullWord = response.data.assembled_word;

      setDetectedSign(predicted || "No sign detected");
      setAssembledWord(fullWord || "");

      if (predicted === "stop") {
        if (fullWord.trim()) {
          setWordHistory((prev) => [...prev, fullWord]);
        }
        console.log(`Sending to TTS: ${fullWord}`);
        try {
          const ttsResponse = await fetch("http://localhost:8000/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: fullWord }),
          });

          const contentType = ttsResponse.headers.get("Content-Type");
          if (!ttsResponse.ok || !contentType.includes("audio")) {
            throw new Error("Invalid TTS response or content type");
          }

          const blob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.play();
        } catch (e) {
          console.error("TTS failed:", e);
        }

        setAssembledWord("");
        setDetectedSign(null);
      }
    } catch (error) {
      console.error("Detection error:", error);
      setDetectedSign("Error detecting sign");
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const speakSentence = async () => {
    const sentence = wordHistory.join(" ");
    if (!sentence) return;

    try {
      const ttsResponse = await fetch("http://localhost:8000/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: sentence }),
      });

      const contentType = ttsResponse.headers.get("Content-Type");
      if (!ttsResponse.ok || !contentType.includes("audio")) {
        throw new Error("Invalid TTS response or content type");
      }
      const blob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("TTS failed:", error);
    }
  };

  const handleSpeechToSign = async () => {
    const arabicText = prompt("🎙️ Enter Arabic text to translate to sign:");
    if (!arabicText) return;

    try {
      const res = await fetch("http://localhost:3001/api/generate-gif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: arabicText }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "❌ Failed to generate GIF");
        return;
      }

      const blob = await res.blob();
      const gifUrl = URL.createObjectURL(blob);
      setSpeechToSignGif(gifUrl);
    } catch (error) {
      console.error("Speech-to-sign error:", error);
    }
  };

  useEffect(() => {
    if (!webcamOn) return;
    const intervalId = setInterval(() => {
      captureAndSend();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [captureAndSend, webcamOn]);

  const toggleWebcam = () => {
    setWebcamOn((prev) => !prev);
    if (!webcamOn) {
      setDetectedSign(null);
      setAssembledWord("");
    }
  };

  return (
    <div>
      <button className="webcam-toggle-btn" onClick={toggleWebcam} style={{ marginBottom: "10px" }}>
        {webcamOn ? "Stop Webcam" : "Sign2Speech"}
      </button>

      <button onClick={handleSpeechToSign} style={{ marginLeft: "10px" }}>
        🗣️ Speech to Sign
      </button>

      {webcamOn && (
        <div className="webcam-container">
          <Webcam
            audio={false}
            height={480}
            ref={webcamRef}
            screenshotFormat="image/png"
            width={640}
            videoConstraints={videoConstraints}
          />
        </div>
      )}

      <div style={{ marginTop: "10px" }}>
        {isDetecting ? "Detecting..." : webcamOn ? "Detection paused" : "Webcam is off"}
      </div>

      <div style={{ marginTop: "10px" }}>
        <strong>Detected Sign:</strong> {detectedSign || "None"}
      </div>

      <div style={{ marginTop: "10px" }}>
        <strong>Assembled Word:</strong> {assembledWord || "None"}
      </div>

      <div style={{ marginTop: "20px" }}>
        <strong>Sentence:</strong> {wordHistory.join(" ") || "None"}

        <div style={{ marginTop: "10px" }}>
          <button onClick={() => setWordHistory([])}>Reset Sentence</button>
          <button onClick={speakSentence} style={{ marginLeft: "10px" }}>
            Speak Sentence
          </button>
        </div>
      </div>

      {speechToSignGif && (
        <div style={{ marginTop: "20px" }}>
          <strong>Generated Sign:</strong>
          <br />
          <img src={speechToSignGif} alt="Generated Sign GIF" width={300} />
        </div>
      )}
    </div>
  );
};

export default SignLanguageDetector;
