import "./App.css";
import React, { useState, useEffect } from "react";
import { toggleAudio, stopAudio, setOnAudioEnd } from "./speech";

const TranscriptionUI = ({
  transcript,
  cleanedMSA,
  translation,
  recording,
  startLiveSimulation,
  stopLiveSimulation, 
  isProcessing, 
  clearAll, 
  summary, 
  isSummarizing, 
  generateSummary
}) => {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
      // Stop UI play icon when audio ends
      setOnAudioEnd(() => {
        setIsPlaying(false);
      });
    }, []);

  return (
    <div className="transcription-container">
      <h1 className="app-title">Simulated Live Transcription by Fanar</h1>

      <div className="controls">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={startLiveSimulation} 
            disabled={recording}
            style={{ padding: '8px 16px' }}
          >
            Start Recording
          </button>
          <button 
            onClick={stopLiveSimulation} 
            disabled={!recording}
            style={{ padding: '8px 16px' }}
          >
            Stop Recording
          </button>
          <button 
            onClick={clearAll}
            disabled={recording}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f44336', 
              color: 'white',
              border: 'none'
            }}
          >
            Clear All
          </button>
        </div>

      </div>

      <div className="section">
        <h2>Transcription: </h2>
        <div className="box transcript arabic">
          {transcript || ""}
        </div>
      </div>

      <div className="section">
        <h2>Modern Standard Arabic: </h2>
        <div className="box arabic">
          {isProcessing ? (
              <div className="spinner" />
          ) : (
              cleanedMSA || ""
          )}
        </div>
      </div>
      
      <div className="section">
        <h2>English Translation</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="box english" style={{ flex: 1 }}>
            {isProcessing ? (
              <div className="spinner" />
            ) : (
              translation || ""
            )}
          </div>

          <button
            onClick={async () => {
              await toggleAudio(translation);
              setIsPlaying((prev) => !prev);
            }}
            disabled={!translation || isProcessing}
            style={{
              padding: "8px 12px",
              height: "40px",
              whiteSpace: "nowrap",
              cursor: "pointer"
            }}
          >
            {isPlaying ? "⏸ Pause" : "🔊 Play"}
          </button>

          <button
            onClick={() => {
              stopAudio();
              setIsPlaying(false);
            }}
            disabled={!translation}
            style={{
              padding: "8px 12px",
              height: "40px",
              whiteSpace: "nowrap",
              cursor: "pointer"
            }}
          >
            ⏹ Stop
          </button>
        </div>
      </div>
      
      <div className="section">
        <h2>Summary</h2>
        <button onClick={generateSummary} disabled={isSummarizing || !transcript}>
          {isSummarizing ? "Summarizing..." : "Generate Summary"}
        </button>
        <div className="box arabic" style={{ marginTop: "10px" }}>
          {summary}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionUI;