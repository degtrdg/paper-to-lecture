import modal
from fastapi import UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import io
import tempfile

from marker.convert import convert_single_pdf
from marker.models import load_all_models

app = modal.App("pdf-to-markdown-endpoint")

from functools import lru_cache

@lru_cache(maxsize=1)
def load_models_cached():
    return load_all_models()

@app.function()
@modal.web_endpoint(method="POST")
def pdf_to_markdown(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    try:
        pdf_bytes = file.file.read()
        with io.BytesIO(pdf_bytes) as pdf_stream:
            with tempfile.NamedTemporaryFile(suffix=".pdf") as temp_pdf:
                temp_pdf.write(pdf_stream.read())
                temp_pdf.seek(0)
                filename = temp_pdf.name

                # Load models
                model_lst = load_models_cached()

                full_text, _, _ = convert_single_pdf(
                    filename, 
                    model_lst, 
                    max_pages=None, 
                    langs=None, 
                    ocr_all_pages=False
                )

        return JSONResponse(content={"markdown": full_text})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
