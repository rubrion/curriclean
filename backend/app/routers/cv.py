from __future__ import annotations

import io
import re

import logfire
import pypdf
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth import get_current_user
from app.config import get_settings
from app.models import User
from app.schemas import CvParseResponse

router = APIRouter(prefix="/cv", tags=["cv"])

_WHITESPACE_RE = re.compile(r"[ \t\f\v]+")
_NEWLINE_RE = re.compile(r"\n{3,}")
_MIN_EXTRACTED_CHARS = 50


def _normalize(text: str) -> str:
    text = _WHITESPACE_RE.sub(" ", text)
    text = _NEWLINE_RE.sub("\n\n", text)
    return text.strip()


@router.post("/parse-pdf", response_model=CvParseResponse)
async def parse_pdf(
    file: UploadFile = File(...),
    _user: User = Depends(get_current_user),
) -> CvParseResponse:
    if not file.content_type or not file.content_type.startswith("application/pdf"):
        raise HTTPException(status_code=400, detail="INVALID_CONTENT_TYPE")

    max_bytes = get_settings().CV_PDF_MAX_BYTES
    chunks: list[bytes] = []
    read = 0
    while True:
        chunk = await file.read(64 * 1024)
        if not chunk:
            break
        read += len(chunk)
        if read > max_bytes:
            raise HTTPException(status_code=400, detail="FILE_TOO_LARGE")
        chunks.append(chunk)

    raw = b"".join(chunks)

    try:
        reader = pypdf.PdfReader(io.BytesIO(raw))
    except Exception as exc:
        logfire.warn("cv.parse_pdf_open_failed", error=str(exc))
        raise HTTPException(status_code=400, detail="INVALID_PDF") from exc

    pages: list[str] = []
    try:
        for page in reader.pages:
            pages.append(page.extract_text() or "")
    except Exception as exc:
        logfire.warn("cv.parse_pdf_extract_failed", error=str(exc))
        raise HTTPException(status_code=400, detail="INVALID_PDF") from exc

    text = _normalize("\n\n".join(pages))

    if len(text) < _MIN_EXTRACTED_CHARS:
        raise HTTPException(status_code=400, detail="EMPTY_EXTRACTION")

    logfire.info(
        "cv.parse_pdf_ok",
        bytes_read=read,
        pages=len(reader.pages),
        text_len=len(text),
    )

    return CvParseResponse(text=text)
