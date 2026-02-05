import os
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    TranscriptUploadResponse, 
    TranscriptResponse, 
    SpeakerRenameRequest, 
    SpeakerRenameResponse,
    MetadataNameRequest,
    MetadataNameResponse,
    TranscriptsResponse,
    AudioFilesResponse
)
from services.file_manager import FileManager
from services.transcription import TranscriptionService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Audio Transcription API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
file_manager = FileManager()
transcription_service = TranscriptionService(
    api_key=os.getenv("ASSEMBLYAI_API_KEY"),
    file_manager=file_manager
)

# Allowed file extensions
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".aac", "mp4"}


# Endpoint to update transcript metadata with a name
@app.get("/api/transcripts", response_model=TranscriptsResponse)
async def get_transcripts():
    """Get all transcripts metadata"""
    try:
        transcripts_metadata = file_manager.get_all_transcripts_metadata()
        return TranscriptsResponse(transcripts=transcripts_metadata)
    except Exception as e:
        logger.error(f"Error getting all transcripts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/transcript/name", response_model=MetadataNameResponse)
async def update_metadata_name(request: MetadataNameRequest):
    """Update transcript metadata with a name"""
    try:
        # Check if transcript exists
        if not file_manager.transcript_exists(request.transcript_id):
            raise HTTPException(status_code=404, detail="Transcript not found")

        # Update metadata name
        success = file_manager.update_metadata_name(
            request.transcript_id,
            request.name
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to update metadata name")

        logger.info(f"Updated metadata name in {request.transcript_id}: {request.name}")

        return MetadataNameResponse(
            success=True,
            message=f"Successfully updated metadata name to '{request.name}'"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating metadata name: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def validate_audio_file(filename: str) -> bool:
    """Validate if file has allowed extension"""
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)


@app.post("/api/upload", response_model=TranscriptUploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    """Upload audio file and start transcription"""
    try:
        # Validate file type
        if not validate_audio_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Save audio file
        transcript_id = file_manager.save_audio_file(file_content, file.filename)
        
        # Get audio file path
        audio_file_path = file_manager.get_audio_file_path(transcript_id)
        if not audio_file_path:
            raise HTTPException(status_code=500, detail="Failed to save audio file")
        
        # Start transcription
        success = await transcription_service.start_transcription(transcript_id, audio_file_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to start transcription")
        
        logger.info(f"Started transcription for file: {file.filename}, ID: {transcript_id}")
        
        return TranscriptUploadResponse(
            transcript_id=transcript_id,
            status="pending"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/transcript/{transcript_id}", response_model=TranscriptResponse)
async def get_transcript(transcript_id: str):
    """Get transcript by ID"""
    try:
        # Check if transcription is completed
        if transcription_service.is_completed(transcript_id):
            # Get transcript data
            transcript_data = file_manager.get_transcript(transcript_id)
            
            if not transcript_data:
                raise HTTPException(status_code=404, detail="Transcript not found")
            
            return TranscriptResponse(
                status="completed",
                transcript=transcript_data["transcript"],
                metadata=transcript_data["metadata"]
            )
        
        elif transcription_service.is_pending(transcript_id):
            return TranscriptResponse(status="pending")
        
        else:
            # Check if transcript exists (for cases where service was restarted)
            if file_manager.transcript_exists(transcript_id):
                transcript_data = file_manager.get_transcript(transcript_id)
                return TranscriptResponse(
                    status="completed",
                    transcript=transcript_data["transcript"],
                    metadata=transcript_data["metadata"]
                )
            
            raise HTTPException(status_code=404, detail="Transcript not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transcript {transcript_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/transcript/speakers", response_model=SpeakerRenameResponse)
async def rename_speaker(request: SpeakerRenameRequest):
    """Rename speaker in transcript"""
    try:
        # Check if transcript exists
        if not file_manager.transcript_exists(request.transcript_id):
            raise HTTPException(status_code=404, detail="Transcript not found")
        
        # Update speaker names
        success = file_manager.update_speaker_names(
            request.transcript_id,
            request.current_name,
            request.new_name
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update speaker names")
        
        logger.info(f"Updated speaker in {request.transcript_id}: {request.current_name} -> {request.new_name}")
        
        return SpeakerRenameResponse(
            success=True,
            message=f"Successfully renamed '{request.current_name}' to '{request.new_name}'"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renaming speaker: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/api/transcript/{transcript_id}", status_code=204)
async def delete_transcript(transcript_id: str):
    """Delete a transcript and its associated files"""
    try:
        # Check if transcript exists before attempting deletion
        if not file_manager.transcript_exists(transcript_id):
            raise HTTPException(status_code=404, detail="Transcript not found")

        # Delete all associated files
        success = file_manager.delete_transcript(transcript_id)

        if not success:
            # This case might indicate a partial deletion or other issues
            raise HTTPException(status_code=500, detail="Failed to delete all transcript files")

        logger.info(f"Successfully deleted transcript and all associated files for ID: {transcript_id}")

        # No content to return on successful deletion
        return

    except HTTPException:
        raise  # Re-raise HTTPException to ensure FastAPI handles it
    except Exception as e:
        logger.error(f"Error deleting transcript {transcript_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/audio-files", response_model=AudioFilesResponse)
async def get_audio_files():
    """List uploaded audio files with size"""
    try:
        files = file_manager.list_audio_files()
        return AudioFilesResponse(files=files)
    except Exception as e:
        logger.error(f"Error listing audio files: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/api/audio-files/{file_id}", status_code=204)
async def delete_audio_file(file_id: str):
    """Delete an uploaded audio file by ID"""
    try:
        if not file_manager.audio_file_exists(file_id):
            raise HTTPException(status_code=404, detail="Audio file not found")

        success = file_manager.delete_audio_file(file_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete audio file")

        logger.info(f"Successfully deleted audio file for ID: {file_id}")
        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting audio file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Audio Transcription API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
