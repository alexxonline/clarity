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

class Transcript(BaseModel):
    id: str
    text: str
    speaker: str
    timestamp: float
    
class TranscriptData(BaseModel):
    transcript: str
    metadata: TranscriptMetadata
    
class TranscriptFile(BaseModel):
    transcript_id: str
    file_path: str
    transcript_data: Optional[TranscriptData] = None
    
class TranscriptionJob(BaseModel):
    id: str
    status: str
    file_path: str
    transcript_id: str
    created_at: datetime
    updated_at: datetime

class TranscriptMetadataResponse(BaseModel):
    id: str
    name: Optional[str] = None
    upload_date: str
    duration: str
    status: str

class TranscriptsResponse(BaseModel):
    transcripts: List[TranscriptMetadataResponse]

class AudioFileInfo(BaseModel):
    id: str
    filename: str
    size_bytes: int

class AudioFilesResponse(BaseModel):
    files: List[AudioFileInfo]

class LocalFileInfo(BaseModel):
    filename: str
    size_bytes: int
    modified_at: str

class LocalFilesResponse(BaseModel):
    files: List[LocalFileInfo]

class LocalFileProcessRequest(BaseModel):
    filename: str
