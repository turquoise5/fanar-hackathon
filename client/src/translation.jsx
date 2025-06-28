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
  generateSummary,
  showEnglishSummary, 
  englishSummary, 
  setShowEnglishSummary, 
  context, 
  setContext
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
      <h1 className="app-title">Nasma3</h1>

      <div className="controls">
        <div> 
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
      
      <div>
        <label>
          <h2>Context For the Transcription:</h2>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Add any context to help transcribe/translate more accurately..."
            rows={3}
            style={{ width: "100%", marginTop: 4, resize: "vertical" }}
          />
        </label>
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
      <button
        style={{ marginLeft: 10 }}
        onClick={() => setShowEnglishSummary((prev) => !prev)}
        disabled={isSummarizing}
      >
        {showEnglishSummary ? "Hide English Summary" : "Show English Summary"}
      </button>
      <div className="box arabic" style={{ marginTop: "10px" }}>
        {summary}
      </div>
      {showEnglishSummary && (
        <div className="box english" style={{ marginTop: "10px" }}>
          {englishSummary}
        </div>
      )}
    </div>
  </div>
  );
};

export default TranscriptionUI;