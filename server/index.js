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

// Clean endpoint: returns MSA only
app.post("/clean", async (req, res) => {
  const { text,  context} = req.body;
  try {
    const chatResponse = await axios.post(
      "https://api.fanar.qa/v1/chat/completions",
      {
        model: "Fanar",
        messages: [
          {
            role: "user",
            content: `ترجم النص التالي إلى اللغة العربية الفصحى الحديثة فقط. إذا كان هناك أي غموض في الكلمات أو كان النص غير واضح بسبب مشاكل في النسخ، استخدم السياق المقدم لمحاولة فهم المعنى الصحيح. أضف علامات الترقيم المناسبة. دورك هو مترجم إلى العربية الفصحى، ويجب أن تخرج فقط الترجمة النهائية دون أي شرح أو تعليق أو إضافات أخرى.
                      سياق إضافي: ${context}

                      النص:
                      ${text}`
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
    res.json({ msa });
  } catch (err) {
    console.error("Fanar clean error:", err.message);
    res.status(500).json({ error: "MSA cleaning failed." });
  }
});

// Translate endpoint: returns English translation from MSA
app.post("/translate", async (req, res) => {
  const { msa } = req.body;
  try {
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
      }
    );
    let english = translateResponse.data.text;
    res.json({ english });
  } catch (err) {
    console.error("Fanar translate error:", err.message);
    res.status(500).json({ error: "Translation failed." });
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


app.post("/summarize", async (req, res) => {
  const { text, lang } = req.body; 
  try {
    const prompt = 
      lang === "en" 
      ? `Summarize the following text in concise English. If the text has any mistakes or is unclear, do not add any commentary or explanation, just do your best to understand from context and show only the summary itself. Do not add any introduction or extra phrases.\n\n${text}`
      : `لا تضع أي شيء آخر في ردك إلا التلخيص. إذا كان في النص أي أخطاء أو غموض، لا تضف أي تعليق أو شرح أو تصحيح إضافي، فقط حاول فهم المقصود من السياق وأعد كتابة التلخيص كما هو بأفضل صورة ممكنة. لا تكتب أي مقدمة أو شرح أو عبارات إضافية:\n\n${text}`;
    const summaryResponse = await axios.post(
      "https://api.fanar.qa/v1/chat/completions",
      {
        model: "Fanar",
        messages: [
          {
            role: "user",
            content: prompt,
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
    const summary = summaryResponse.data.choices[0].message.content;
    res.json({ summary });
  } catch (err) {
    if (err.response) {
      console.error("Fanar summary error:", err.response.data);
    } else {
      console.error("Fanar summary error:", err.message);
    }
    res.status(500).json({ error: "Summary failed." });
  }
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});