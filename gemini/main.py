import google.generativeai as genai
import os
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
from typing import Optional
from PIL import Image

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")
app = FastAPI()

@app.post("/generate")
async def generate_content(
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    content = []

    if text:
        content.append(text)

    if image:
        temp_file = f"temp_{image.filename}"
        with open(temp_file, "wb") as buffer:
            buffer.write(await image.read())
        img = Image.open(temp_file)
        content.append(img)
        os.remove(temp_file)

    if not content:
        return JSONResponse(status_code=400, content={"error": "No input provided"})

    response = model.generate_content(content)
    return {"response": response.text}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
