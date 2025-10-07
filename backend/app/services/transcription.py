import os
import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime
import assemblyai as aai
from .file_manager import FileManager

logger = logging.getLogger(__name__)


class TranscriptionService:
    def __init__(self, api_key: str, file_manager: FileManager):
        self.api_key = api_key
        self.file_manager = file_manager
        self.transcription_status = {}  # In-memory status tracking
        aai.settings.api_key = api_key
    
    async def start_transcription(self, transcript_id: str, audio_file_path: str) -> bool:
        """Start transcription process asynchronously"""
        try:
            # Set status to pending
            self.transcription_status[transcript_id] = "pending"
            
            # Start transcription in background
            asyncio.create_task(self._process_transcription(transcript_id, audio_file_path))
            
            return True
            
        except Exception as e:
            logger.error(f"Error starting transcription for {transcript_id}: {e}")
            self.transcription_status[transcript_id] = "failed"
            return False
    
    async def _process_transcription(self, transcript_id: str, audio_file_path: str):
        """Process the transcription asynchronously"""
        try:
            logger.info(f"Starting transcription for {transcript_id}")
            
            # Configure transcription settings
            config = aai.TranscriptionConfig(
                speaker_labels=True,
                language_code="es"
            )
            
            # Create transcriber
            transcriber = aai.Transcriber()
            
            # Submit transcription job
            transcript = await asyncio.to_thread(transcriber.transcribe, audio_file_path, config)
                                                 
            
            # Wait for completion
            if transcript.status == aai.TranscriptStatus.error:
                logger.error(f"Transcription failed for {transcript_id}: {transcript.error}")
                self.transcription_status[transcript_id] = "failed"
                return
            
            # Process the transcript
            await self._save_transcript_results(transcript_id, transcript)
            
            logger.info(f"Transcription completed for {transcript_id}")
            self.transcription_status[transcript_id] = "completed"
            
        except Exception as e:
            logger.error(f"Error processing transcription for {transcript_id}: {e}")
            self.transcription_status[transcript_id] = "failed"
    
    async def _save_transcript_results(self, transcript_id: str, transcript):
        """Save transcript results to files"""
        try:
            # Format transcript with speaker labels
            formatted_transcript = self._format_transcript_with_speakers(transcript)
            
            # Extract speakers list
            speakers = self._extract_speakers(transcript)
            
            # Create metadata
            metadata = {
                "id": transcript_id,
                "language": transcript.json_response["language_code"] or "en",
                "duration": f"{transcript.audio_duration:.1f}s" if transcript.audio_duration else "unknown",
                "upload_date": datetime.now().strftime("%Y-%m-%d"),
                "engine": "AssemblyAI",
                "speakers": speakers
            }
            
            # Save to files
            self.file_manager.save_transcript(transcript_id, formatted_transcript, metadata)
            
        except Exception as e:
            logger.error(f"Error saving transcript results for {transcript_id}: {e}")
            raise
    
    def _format_transcript_with_speakers(self, transcript) -> str:
        """Format transcript text with speaker labels"""
        if not transcript.utterances:
            return transcript.text or ""
        
        formatted_lines = []
        for utterance in transcript.utterances:
            speaker = f"Speaker {utterance.speaker}"
            text = utterance.text
            formatted_lines.append(f"{speaker}: {text}")
        
        return "\n".join(formatted_lines)
    
    def _extract_speakers(self, transcript) -> list:
        """Extract unique speakers from transcript"""
        if not transcript.utterances:
            return []
        
        speakers = set()
        for utterance in transcript.utterances:
            speakers.add(f"Speaker {utterance.speaker}")
        
        return sorted(list(speakers))
    
    def get_status(self, transcript_id: str) -> str:
        """Get current transcription status"""
        return self.transcription_status.get(transcript_id, "not_found")
    
    def is_completed(self, transcript_id: str) -> bool:
        """Check if transcription is completed"""
        return self.get_status(transcript_id) == "completed"
    
    def is_pending(self, transcript_id: str) -> bool:
        """Check if transcription is pending"""
        return self.get_status(transcript_id) == "pending"
