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


class PDFBase64Request(BaseModel):
    pdf_base64: str


@app.post("/api/extract_pdf_text")
async def extract_pdf_text(request: PDFBase64Request):
    try:
        # Decode the base64 PDF
        pdf_content = base64.b64decode(request.pdf_base64)

        # Create a PDF reader object
        pdf_file = BytesIO(pdf_content)

        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
        except PyPDF2.errors.PdfReadError as e:
            print(f"PyPDF2 error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")

        # Initialize an empty string to store all the text
        all_text = ""

        # Iterate through all pages and extract text
        for page in pdf_reader.pages:
            all_text += page.extract_text()

        # Prepare the response
        response = {
            "total_pages": len(pdf_reader.pages),
            "total_characters": len(all_text),
            "extracted_text": all_text[
                :1000
            ],  # Return first 1000 characters as a sample
            "full_text": all_text,
        }

        return response
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

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

def get_default_font(size):
    try:
        return ImageFont.truetype("Arial", size)
    except IOError:
        return ImageFont.load_default()

def create_slide(title, content, image_url=None, image_subtitle=None, width=1600, height=900):
    print(f"Creating slide: {title}")
    try:
        # Create a blank white image with double the resolution
        slide = Image.new("RGB", (width, height), color="white")
        draw = ImageDraw.Draw(slide)

        # Load fonts with much larger sizes
        print("Loading fonts...")
        title_font = get_default_font(1400)  # Dramatically increased
        content_font = get_default_font(800)  # Dramatically increased
        subtitle_font = get_default_font(600)  # Dramatically increased

        # Draw title
        print("Drawing title...")
        title_lines = wrap_text(title, title_font, width - 200)
        y_offset = 20
        for line in title_lines:
            draw.text((100, y_offset), line, font=title_font, fill="black")
            y_offset += 100  # Increased spacing for title lines

        # Parse and draw content (Markdown)
        print("Parsing and drawing content...")
        html = markdown.markdown(content)
        soup = BeautifulSoup(html, "html.parser")

        content_width = width - 200
        y_offset += 100  # Add some space after the title

        for element in soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol"]):
            if element.name == "p":
                lines = wrap_text(element.text, content_font, content_width)
                for line in lines:
                    draw.text((100, y_offset), line, font=content_font, fill="black")
                    y_offset += 200  # Increased spacing between lines
            elif element.name.startswith("h"):
                size = 240 - int(element.name[1]) * 20  # Increased base size for headers
                header_font = get_default_font(size)
                header_lines = wrap_text(element.text, header_font, content_width)
                for line in header_lines:
                    draw.text((100, y_offset), line, font=header_font, fill="black")
                    y_offset += size + 40
            elif element.name in ["ul", "ol"]:
                for li in element.find_all("li"):
                    bullet_lines = wrap_text("• " + li.text, content_font, content_width - 100)
                    for line in bullet_lines:
                        draw.text((200, y_offset), line, font=content_font, fill="black")
                        y_offset += 200  # Increased spacing for list items

        # Add image if provided (adjusted to fit with larger text)
        if image_url:
            try:
                response = requests.get(image_url)
                img = Image.open(BytesIO(response.content))
                img_width = width // 3
                img_height = height // 3
                img.thumbnail((img_width, img_height))
                slide.paste(img, (width - img_width - 100, height - img_height - 100))

                if image_subtitle:
                    subtitle_lines = wrap_text(image_subtitle, subtitle_font, img_width)
                    subtitle_y = height - 100 - (len(subtitle_lines) * 140)
                    for line in subtitle_lines:
                        draw.text((width - img_width - 100, subtitle_y), line, font=subtitle_font, fill="black")
                        subtitle_y += 140
            except Exception as e:
                print(f"Error loading image: {e}")

        print("Slide created successfully")
        return slide
    except Exception as e:
        print(f"Error in create_slide: {str(e)}")
        raise


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
        print(f"Slides data: {slides_data}")
        for index, (slide, voiceover) in enumerate(zip(slides_data, voiceovers)):
            # Create slide image
            slide_image = create_slide(
                slide["title"],
                slide["markdownContent"],
                slide.get("image_url"),
                slide.get("image_subtitle"),
            )
            print(f"Slide: {slide['title']}")
            image_path = os.path.join(STATIC_FOLDER, f"slide_{index}.png")
            slide_image.save(image_path)
            print(f"Saved slide image to {image_path}")
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
        print(f"Error creating video: {e}")
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
