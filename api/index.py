from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageDraw, ImageFont
import markdown
from io import BytesIO
import requests
from bs4 import BeautifulSoup
import base64
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
import os

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SlideRequest(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    image_subtitle: Optional[str] = None

class VideoUploadRequest(BaseModel):
    title: str
    description: str
    tags: Optional[list[str]] = None
    privacy_status: str = "private"

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

@app.post("/api/upload_video")
async def upload_video_endpoint(video: UploadFile = File(...), request: VideoUploadRequest = None):
    try:
        # Save the uploaded file temporarily
        temp_file_path = f"temp_{video.filename}"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await video.read())

        # Upload to YouTube
        video_id = upload_to_youtube(temp_file_path, request.title, request.description, request.tags, request.privacy_status)

        # Clean up the temporary file
        os.remove(temp_file_path)

        return {"video_id": video_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def upload_to_youtube(file_path, title, description, tags, privacy_status):
    # Set up credentials (You need to handle OAuth 2.0 flow separately)
    credentials = Credentials.from_authorized_user_file('path/to/your/credentials.json')

    youtube = build('youtube', 'v3', credentials=credentials)

    request_body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': tags,
            'categoryId': '22'  # You might want to adjust this category ID
        },
        'status': {
            'privacyStatus': privacy_status
        }
    }

    media_file = MediaFileUpload(file_path)

    response = youtube.videos().insert(
        part='snippet,status',
        body=request_body,
        media_body=media_file
    ).execute()

    return response['id']

def create_slide(title, content, image_url=None, image_subtitle=None, width=1920, height=1080):
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
