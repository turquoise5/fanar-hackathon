from fastapi import FastAPI, File, UploadFile, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import os
import numpy as np
import pickle
import mediapipe as mp
from fastapi.responses import StreamingResponse
import requests
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

FANAR_API_KEY = os.getenv("FANAR_KEY")

# Allow CORS from your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model_dict = pickle.load(open('./model.p', 'rb'))
model = model_dict['model']

# Mediapipe setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

# Arabic labels
labels_dict = {
    0: 'ا', 1: 'ب', 2: 'ت', 3: "ث", 4: "ج", 5: "ح", 6: "خ",
    7: "د", 8: "ذ", 9: "ر", 10: "ز", 11: "س", 12: "ش", 13: "ص",
    14: "ض", 15: "ط", 16: "ظ", 17: "ع", 18: "غ", 19: "ف", 20: "ق",
    21: "ك", 22: "ل", 23: "م", 24: "ن", 25: "ه", 26: "و", 27: "ي", 28: "stop"
}

# === GLOBAL BUFFER to store characters ===
letter_buffer = []

@app.post("/detect-sign/")
async def detect_sign(file: UploadFile = File(...)):
    global letter_buffer

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Invalid image"}

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            x_, y_ = [], []
            data_aux = []

            for lm in hand_landmarks.landmark:
                x, y = lm.x, lm.y
                x_.append(x)
                y_.append(y)

            for lm in hand_landmarks.landmark:
                data_aux.append(lm.x - min(x_))
                data_aux.append(lm.y - min(y_))

            prediction = model.predict([np.asarray(data_aux)])
            predicted_index = int(prediction[0])
            predicted_character = labels_dict[predicted_index]

            # Handle buffering
            if predicted_character == "stop":
                final_word = ''.join(letter_buffer)
                letter_buffer = []  # Clear buffer
                return {"predicted_sign": "stop", "assembled_word": final_word}
            else:
                letter_buffer.append(predicted_character)
                return {"predicted_sign": predicted_character, "assembled_word": ''.join(letter_buffer)}

    return {"predicted_sign": None, "assembled_word": ''.join(letter_buffer)}

@app.post("/tts")
async def generate_tts(request: Request):
    data = await request.json()
    text = data.get("text", "")

    tts_payload = {
        "model": "Fanar-Aura-TTS-1",
        "input": text,
        "voice": "default"
    }

    headers = {
        "Authorization": f"Bearer {FANAR_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post("https://api.fanar.qa/v1/audio/speech", headers=headers, json=tts_payload)
    if response.status_code == 200:
        return StreamingResponse(BytesIO(response.content), media_type="audio/mpeg")
    else:
        # raise HTTPException(status_code=500, detail="Text-to-Speech failed. Please try again.")
        print("Fanar API Error:")
        print("Status:", response.status_code)
        print("Response:", response.text)
        return {"error": "TTS generation failed", "details": response.json()}
