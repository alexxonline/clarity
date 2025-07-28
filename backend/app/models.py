from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
# Request and response models for updating transcript metadata name
class MetadataNameRequest(BaseModel):
    transcript_id: str
    name: str

class MetadataNameResponse(BaseModel):
    success: bool
    message: str



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
    name: Optional[str] = None


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
