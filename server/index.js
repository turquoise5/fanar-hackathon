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
            content: `You are an intent-driven Modern Standard Arabic (MSA) translator. Your only task is to translate the given text to Modern Standard Arabic (MSA). 
            If there is any ambiguity or unclear words, use the provided context to infer the meaning. Add appropriate punctuation. 
            Do not add any commentary, explanation, or extra text—just output the MSA translation.
            
            Intent: Translate to Modern Standard Arabic (MSA).
            
            ${context ? `Context: ${context}\n` : ""}
            Text:
            ${text}`
            
            // content: `ترجم النص التالي إلى اللغة العربية الفصحى الحديثة فقط. إذا كان هناك أي غموض في الكلمات أو كان النص غير واضح بسبب مشاكل في النسخ، استخدم السياق المقدم لمحاولة فهم المعنى الصحيح. أضف علامات الترقيم المناسبة. دورك هو مترجم إلى العربية الفصحى، ويجب أن تخرج فقط الترجمة النهائية دون أي شرح أو تعليق أو إضافات أخرى.
            //           سياق إضافي: ${context}

            //           النص:
            //           ${text}`
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
  const engPrompt = `You are an intent-driven summarizer. Your only task is to summarize the given text in English using bullet points for clarity. Highlight key terms. If any relevant concepts, organizations, or terms are mentioned, include a relevant link from Wikipedia (if possible) for each. Only output the summary in this format, with no extra commentary.
  
  Intent: Summarize in English with bullet points, key terms, and Wikipedia links.
  
  Text:
  ${text}`;
  
  const arPrompt = `أنت ملخص يعتمد على النية. مهمتك الوحيدة هي تلخيص النص التالي باللغة العربية الفصحى باستخدام النقاط لتوضيح الأفكار. أبرز المصطلحات الرئيسية. إذا تم ذكر مفاهيم أو منظمات أو مصطلحات مهمة، أضف رابطًا من ويكيبيديا (إن أمكن) لكل منها. أخرج الملخص فقط بهذا التنسيق، دون أي تعليقات إضافية.
  النية: تلخيص النص بالنقاط والمصطلحات وروابط ويكيبيديا.
  النص:
  ${text}`;
  
  // const engPrompt = `Summarize the following text in English using bullet points for clarity. Highlight key terms. If any relevant concepts, organizations, or terms are mentioned, include a relevant link from Wikipedia (if possible). Only output the summary in this format, with no extra commentary.\n\nText:\n${text}`;
  // const arPrompt = `لخص النص التالي باللغة العربية الفصحى باستخدام النقاط لتوضيح الأفكار. أبرز المصطلحات الرئيسية. إذا تم ذكر مفاهيم أو منظمات أو مصطلحات مهمة، أضف رابطًا من ويكيبيديا (إن أمكن) . أخرج الملخص فقط بهذا التنسيق، دون أي تعليقات إضافية.\n\nالنص:\n${text}`;
  const prompt = lang === "en" ? engPrompt : arPrompt;
  
  try {
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

app.post("/speak", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const ttsResponse = await axios.post(
      "https://api.fanar.qa/v1/audio/speech",
      {
        model: "Fanar-Aura-TTS-1",
        input: text,
        voice: "default",
      },
      {
        headers: {
          Authorization: `Bearer ${FANAR_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(ttsResponse.data);
  } catch (err) {
    alert("Text-to-Speech failed. Please try again.");
    if (err.response && err.response.data) {
      const errorString = Buffer.from(err.response.data).toString("utf-8");
      console.error("API error data:", errorString);
      console.error("API error status:", err.response.status);
    } else {
      console.error("Error:", err.message);
    }

    res.status(500).json({ error: "Text-to-speech failed." });
  }
});


app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});