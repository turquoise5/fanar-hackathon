import React from "react";
import "./App.css";

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
  setShowEnglishSummary
}) => (
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
      <div className="box english">
        {isProcessing ? (
            <div className="spinner" />
        ) : (
            translation || ""
        )}
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

export default TranscriptionUI;