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

app.use(express.json()); // For parsing application/json
app.use(cors());

app.post("/process", async (req, res) => {
  const { text } = req.body;

  try {
    const chatResponse = await axios.post(
      "https://api.fanar.qa/v1/chat/completions",
        {
        model: "Fanar",
        messages: [
            {
            role: "user",
            content: `صحح النص التالي نحوياً واملائياً، وحوله إلى الفصحى مع الحفاظ على المعنى. لا تكتب أي شيء غير النص المصحح، لا تكتب مقدمة أو شرح أو أي عبارات إضافية:\n\n${text}`
            }
        ]
        }, 
        {
            headers: {
            Authorization: `Bearer ${FANAR_API_KEY}`,
            "Content-Type": "application/json",
            },
        }
    );

    const msa = chatResponse.data.choices[0].message.content;

    // 2. Translate to English
    const translateResponse = await axios.post(
      "https://api.fanar.qa/v1/translations",
      {
        model: "Fanar-Shaheen-MT-1",
        text: msa,
        langpair: "ar-en",
        preprocessing: "default",
      },
      {
        headers: {
          Authorization: `Bearer ${FANAR_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000
      }
    );

    console.log("Translation response:", translateResponse.data);
    let english = "";
    if (translateResponse.data.translated) {
      english = translateResponse.data.translated;
    } else if (translateResponse.data.translations && translateResponse.data.translations.length > 0) {
      english = translateResponse.data.translations[0].translated;
    } else {
      throw new Error("Unexpected translation response structure");
    }

    res.json({ msa, english });
  } catch (err) {
    console.error("Fanar processing error:", err.message);
    res.status(500).json({ error: "Post-processing failed." });
  }
});

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