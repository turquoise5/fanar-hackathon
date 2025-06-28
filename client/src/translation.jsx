import "./App.css";
import React, { useState, useEffect } from "react";
import { toggleAudio, stopAudio, setOnAudioEnd } from "./speech";

function formatSummary(summary) {
  if (!summary) return null;
  return summary.split('\n').map((line, idx) => {
    // Match bullet points with bold: - **bold** rest of line
    const bulletBoldMatch = line.match(/^- \*\*(.+?)\*\*(.*)/);
    if (bulletBoldMatch) {
      const restParts = bulletBoldMatch[2].split(/(https?:\/\/[^\s]+)/g).filter(Boolean);
      return (
        <div key={idx} style={{ marginLeft: 10 }}>
          <span style={{ fontWeight: 'bold' }}>• {bulletBoldMatch[1]}</span>
          {restParts.map((part, i) =>
            part.startsWith('http') ? (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer">
                Wikipedia
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      );
    }
    // Match normal bullet points: - rest of line
    if (line.trim().startsWith('- ')) {
      const restParts = line.slice(2).split(/(https?:\/\/[^\s]+)/g).filter(Boolean);
      return (
        <div key={idx} style={{ marginLeft: 10 }}>
          • {restParts.map((part, i) =>
            part.startsWith('http') ? (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer">
                Wikipedia
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      );
    }
    // For lines with links but no bullets
    const lineParts = line.split(/(https?:\/\/[^\s]+)/g).filter(Boolean);
    return (
      <div key={idx}>
        {lineParts.map((part, i) =>
          part.startsWith('http') ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer">
              Wikipedia
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  });
}

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
    setOnAudioEnd(() => {
      setIsPlaying(false);
    });
  }, []);

  return (
    <div className="transcription-container">
      <h1 className="app-title">Nasma3</h1>

      <div className="controls">
        <button 
          onClick={startLiveSimulation} 
          disabled={recording}
          className="btn start"
          aria-label="Start recording audio"
        >
          Start Recording
        </button>
        <button 
          onClick={stopLiveSimulation} 
          disabled={!recording}
          className="btn stop"
          aria-label="Stop recording audio"
        >
          Stop Recording
        </button>
        <button 
          onClick={clearAll}
          disabled={recording}
          className="btn"
          style={{ backgroundColor: '#f44336', color: 'white' }}
          aria-label="Clear all text and reset"
        >
          Clear All
        </button>
      </div>

      <div className="section">
        <label htmlFor="contextInput" style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>
          Context for the Transcription:
        </label>
        <textarea
          id="contextInput"
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Add any context to help transcribe/translate more accurately..."
          rows={3}
          style={{ width: "100%", marginTop: 4, resize: "vertical" }}
          aria-label="Context for transcription"
        />
      </div>

      <div className="section">
        <h2>Transcription</h2>
        <div className="box transcript arabic" aria-live="polite">
          {transcript || ""}
        </div>
      </div>

      <div className="section">
        <h2>Modern Standard Arabic</h2>
        <div className="box arabic" aria-live="polite">
          {isProcessing ? <div className="spinner" aria-label="Processing..." /> : cleanedMSA || ""}
        </div>
      </div>

      <div className="section">
        <h2>English Translation</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="box english" style={{ flex: 1 }} aria-live="polite">
            {isProcessing ? <div className="spinner" aria-label="Processing..." /> : translation || ""}
          </div>

          <button
            onClick={async () => {
              await toggleAudio(translation);
              setIsPlaying(prev => !prev);
            }}
            disabled={!translation || isProcessing}
            className="btn"
            aria-label={isPlaying ? "Pause translation playback" : "Play translation"}
          >
            {isPlaying ? "⏸ Pause" : "🔊 Play"}
          </button>

          <button
            onClick={() => {
              stopAudio();
              setIsPlaying(false);
            }}
            disabled={!translation}
            className="btn"
            aria-label="Stop audio playback"
          >
            ⏹ Stop
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Summary</h2>
        <div style={{ marginBottom: 10 }}>
          <button 
            onClick={generateSummary} 
            disabled={isSummarizing || !transcript}
            className="btn"
            aria-label="Generate summary of transcription"
          >
            {isSummarizing ? "Summarizing..." : "Generate Summary"}
          </button>
          <button
            onClick={() => setShowEnglishSummary(prev => !prev)}
            disabled={isSummarizing}
            className="btn"
            style={{ marginLeft: 10 }}
            aria-label={showEnglishSummary ? "Hide English summary" : "Show English summary"}
          >
            {showEnglishSummary ? "Hide English Summary" : "Show English Summary"}
          </button>
        </div>
        <div className="box arabic" aria-live="polite">
          {formatSummary(summary)}
        </div>
        {showEnglishSummary && (
          <div className="box english" style={{ marginTop: 10 }} aria-live="polite">
            {formatSummary(englishSummary)}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionUI;
