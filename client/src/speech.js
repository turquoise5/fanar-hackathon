// const speakText = async (text) => {
//   if (!text) return;

//   try {
//     const response = await fetch("http://localhost:4000/speak", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text })
//     });

//     if (response.ok) {
//       const blob = await response.blob();
//       const audioUrl = URL.createObjectURL(blob);
//       const audio = new Audio(audioUrl);
//       audio.play();
//     } else {
//       console.error("TTS request failed.");
//     }
//   } catch (error) {
//     console.error("Error playing audio:", error);
//   }
// };

// export default speakText;
let audio = null;
let isPaused = true;

const loadAndPlay = async (text) => {
  if (!text) return;

  if (audio) {
    audio.pause();
    audio = null;
  }

  try {
    const response = await fetch("http://localhost:4000/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      audio = new Audio(audioUrl);

      audio.onended = () => {
        isPaused = true;
        if (onAudioEnd) onAudioEnd(); // external callback
      };

      isPaused = false;
      audio.play();
    } else {
      console.error("TTS request failed.");
    }
  } catch (err) {
    console.error("Error playing audio:", err);
  }
};

let onAudioEnd = null;
export const setOnAudioEnd = (cb) => {
  onAudioEnd = cb;
};

export const toggleAudio = async (text) => {
  if (!audio) {
    await loadAndPlay(text);
  } else if (isPaused) {
    audio.play();
    isPaused = false;
  } else {
    audio.pause();
    isPaused = true;
  }
};

export const stopAudio = () => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    isPaused = true;
  }
};
