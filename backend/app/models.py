from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TranscriptUploadResponse(BaseModel):
    transcript_id: str
    status: str


class TranscriptMetadata(BaseModel):
    id: str
    language: str
    duration: str
    upload_date: str
    engine: str
    speakers: List[str]


class TranscriptResponse(BaseModel):
    status: str
    transcript: Optional[str] = None
    metadata: Optional[TranscriptMetadata] = None


class SpeakerRenameRequest(BaseModel):
    transcript_id: str
    current_name: str
    new_name: str


class SpeakerRenameResponse(BaseModel):
    success: bool
    message: str
