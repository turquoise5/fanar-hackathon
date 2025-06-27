const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

const FANAR_API_KEY = process.env.FANAR_KEY;

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const audioFilePath = req.file.path;

    const form = new FormData();
    form.append("file", fs.createReadStream(audioFilePath));
    form.append("model", "Fanar-Aura-STT-1");

    const response = await axios.post("https://api.fanar.qa/v1/audio/transcriptions", form, {
      headers: {
        Authorization: `Bearer ${FANAR_API_KEY}`,
        ...form.getHeaders()
      }
    });

    fs.unlinkSync(audioFilePath); // Clean up

    res.json({ transcript: response.data.text });
  } catch (err) {
    console.error("Fanar API error:", err.message);
    res.status(500).json({ error: "Transcription failed." });
  }
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});