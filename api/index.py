from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from PIL import Image, ImageDraw, ImageFont
import markdown
from io import BytesIO
import requests
from bs4 import BeautifulSoup
import base64
import os
import PyPDF2
import uvicorn
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
import json
import uuid
import shutil

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder
STATIC_FOLDER = "static"
if not os.path.exists(STATIC_FOLDER):
    os.makedirs(STATIC_FOLDER)

app.mount("/static", StaticFiles(directory=STATIC_FOLDER), name="static")

class SlideRequest(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    image_subtitle: Optional[str] = None

@app.post("/api/extract_pdf_text")
async def extract_pdf_text(pdf_file: UploadFile = File(...)):
    try:
        # Read the uploaded PDF file
        pdf_content = await pdf_file.read()

        # Create a PDF reader object
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))

        # Initialize an empty string to store all the text
        all_text = ""

        # Iterate through all pages and extract text
        for page in pdf_reader.pages:
            all_text += page.extract_text()

        # Prepare the response
        response = {
            "total_pages": len(pdf_reader.pages),
            "total_characters": len(all_text),
            "extracted_text": all_text,
            "full_text": all_text,
        }

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create_slide")
async def create_slide_endpoint(slide_request: SlideRequest):
    try:
        slide = create_slide(
            slide_request.title,
            slide_request.content,
            slide_request.image_url,
            slide_request.image_subtitle,
        )

        # Convert the slide to base64
        buffered = BytesIO()
        slide.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return {"slide_image": img_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def create_slide(
    title, content, image_url=None, image_subtitle=None, width=1920, height=1080
):
    # Create a blank white image
    slide = Image.new("RGB", (width, height), color="white")
    draw = ImageDraw.Draw(slide)

    # Load fonts
    title_font = ImageFont.truetype("Arial", 60)
    content_font = ImageFont.truetype("Arial", 30)
    subtitle_font = ImageFont.truetype("Arial", 24)

    # Draw title
    draw.text((50, 50), title, font=title_font, fill="black")

    # Parse and draw content (Markdown)
    html = markdown.markdown(content)
    soup = BeautifulSoup(html, "html.parser")

    content_width = width // 2 - 100  # Limit content width
    y_offset = 150
    for element in soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol"]):
        if element.name == "p":
            lines = wrap_text(element.text, content_font, content_width)
            for line in lines:
                draw.text((50, y_offset), line, font=content_font, fill="black")
                y_offset += 40
        elif element.name.startswith("h"):
            size = 50 - int(element.name[1]) * 5  # Adjust size based on heading level
            header_font = ImageFont.truetype("Arial", size)
            draw.text((50, y_offset), element.text, font=header_font, fill="black")
            y_offset += size + 10
        elif element.name in ["ul", "ol"]:
            for li in element.find_all("li"):
                bullet_lines = wrap_text(
                    "• " + li.text, content_font, content_width - 20
                )
                for line in bullet_lines:
                    draw.text((70, y_offset), line, font=content_font, fill="black")
                    y_offset += 40

    # Add image if provided
    if image_url:
        try:
            response = requests.get(image_url)
            img = Image.open(BytesIO(response.content))
            img_width = width // 2 - 100
            img_height = height - 300
            img.thumbnail((img_width, img_height))
            slide.paste(img, (width // 2 + 50, 150))

            if image_subtitle:
                draw.text(
                    (width // 2 + 50, height - 100),
                    image_subtitle,
                    font=subtitle_font,
                    fill="black",
                )
        except Exception as e:
            print(f"Error loading image: {e}")

    return slide


def wrap_text(text, font, max_width):
    words = text.split()
    lines = []
    current_line = words[0]

    for word in words[1:]:
        if font.getlength(current_line + " " + word) <= max_width:
            current_line += " " + word
        else:
            lines.append(current_line)
            current_line = word

    lines.append(current_line)
    return lines


@app.post("/api/create_video")
async def create_video(
    slides: UploadFile = File(...),
    voiceovers: List[UploadFile] = File(...),
):
    """
    Create a video from slides JSON and corresponding MP3 voiceover files.

    Args:
        slides (UploadFile): JSON file containing slide information.
        voiceovers (List[UploadFile]): List of MP3 files for each slide.

    Returns:
        dict: Link to the generated video.
    """
    try:
        # Read and parse the slides JSON
        slides_content = await slides.read()
        slides_data = json.loads(slides_content)

        if len(slides_data) != len(voiceovers):
            raise HTTPException(
                status_code=400,
                detail="Number of voiceover files must match number of slides.",
            )

        video_clips = []

        for index, (slide, voiceover) in enumerate(zip(slides_data, voiceovers)):
            # Create slide image
            slide_image = create_slide(
                slide["title"],
                slide["markdownContent"],
                slide.get("image_url"),
                slide.get("image_subtitle"),
            )
            image_path = os.path.join(STATIC_FOLDER, f"slide_{index}.png")
            slide_image.save(image_path)

            # Save voiceover
            voiceover_path = os.path.join(STATIC_FOLDER, f"voiceover_{index}.mp3")
            with open(voiceover_path, "wb") as vo_file:
                vo_file.write(await voiceover.read())

            # Create video clip with image and audio
            audio_clip = AudioFileClip(voiceover_path)
            image_clip = ImageClip(image_path).set_duration(audio_clip.duration)
            image_clip = image_clip.set_audio(audio_clip)

            video_clips.append(image_clip)

        # Concatenate all clips
        final_clip = concatenate_videoclips(video_clips, method="compose")
        video_filename = f"video_{uuid.uuid4().hex}.mp4"
        video_path = os.path.join(STATIC_FOLDER, video_filename)
        final_clip.write_videofile(video_path, fps=24)

        # Clean up individual slide images and voiceovers
        for index in range(len(slides_data)):
            os.remove(os.path.join(STATIC_FOLDER, f"slide_{index}.png"))
            os.remove(os.path.join(STATIC_FOLDER, f"voiceover_{index}.mp3"))

        video_url = f"/static/{video_filename}"
        return {"video_url": video_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clear_static")
async def clear_static():
    """
    Clear all files in the static folder.

    Returns:
        dict: Confirmation message.
    """
    try:
        shutil.rmtree(STATIC_FOLDER)
        os.makedirs(STATIC_FOLDER)
        return {"detail": "Static folder cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/get_video/{filename}")
async def get_video(filename: str):
    """
    Retrieve a video file from the static folder.

    Args:
        filename (str): Name of the video file.

    Returns:
        FileResponse: The requested video file.
    """
    file_path = os.path.join(STATIC_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video not found.")
    return FileResponse(file_path, media_type="video/mp4")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
