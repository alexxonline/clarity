import os
import asyncio
import logging
import re
from typing import Dict, Optional
from datetime import datetime
import assemblyai as aai
from .file_manager import FileManager

logger = logging.getLogger(__name__)


class TranscriptionService:
    DEFAULT_ELEVENLABS_TIMEOUT_SECONDS = 1800

    SUPPORTED_ENGINES = {
        "assemblyai": "AssemblyAI",
        "elevenlabs": "ElevenLabs",
    }

    def __init__(
        self,
        assemblyai_api_key: str,
        elevenlabs_api_key: str,
        file_manager: FileManager,
        elevenlabs_timeout_seconds: Optional[int] = None
    ):
        self.assemblyai_api_key = assemblyai_api_key
        self.elevenlabs_api_key = elevenlabs_api_key
        self.file_manager = file_manager
        self.elevenlabs_timeout_seconds = (
            elevenlabs_timeout_seconds
            or self.DEFAULT_ELEVENLABS_TIMEOUT_SECONDS
        )
        self.transcription_status = {}  # In-memory status tracking

    def normalize_engine(self, engine: Optional[str]) -> str:
        """Normalize a user-provided engine label."""
        normalized = (engine or "AssemblyAI").strip().lower()
        if normalized not in self.SUPPORTED_ENGINES:
            supported = ", ".join(self.SUPPORTED_ENGINES.values())
            raise ValueError(f"Unsupported transcription engine. Supported: {supported}")
        return self.SUPPORTED_ENGINES[normalized]

    def require_engine_configuration(self, engine: str):
        """Ensure the selected engine has the required API key."""
        if engine == "AssemblyAI" and not self.assemblyai_api_key:
            raise ValueError("ASSEMBLYAI_API_KEY is not configured")
        if engine == "ElevenLabs" and not self.elevenlabs_api_key:
            raise ValueError("ELEVENLABS_API_KEY is not configured")

    async def start_transcription(self, transcript_id: str, audio_file_path: str, engine: Optional[str] = None) -> bool:
        """Start transcription process asynchronously"""
        try:
            engine = self.normalize_engine(engine)
            self.require_engine_configuration(engine)

            # Set status to pending
            self.transcription_status[transcript_id] = "pending"
            
            # Start transcription in background
            asyncio.create_task(self._process_transcription(transcript_id, audio_file_path, engine))
            
            return True
            
        except Exception as e:
            logger.error(f"Error starting transcription for {transcript_id}: {e}")
            self.transcription_status[transcript_id] = "failed"
            return False
    
    async def _process_transcription(self, transcript_id: str, audio_file_path: str, engine: str):
        """Process the transcription asynchronously"""
        try:
            logger.info(f"Starting transcription for {transcript_id} with {engine}")

            if engine == "AssemblyAI":
                transcript = await self._transcribe_with_assemblyai(audio_file_path)
                if transcript.status == aai.TranscriptStatus.error:
                    logger.error(f"Transcription failed for {transcript_id}: {transcript.error}")
                    self.transcription_status[transcript_id] = "failed"
                    return
                await self._save_assemblyai_transcript_results(transcript_id, transcript)
            else:
                transcript = await self._transcribe_with_elevenlabs(audio_file_path)
                await self._save_elevenlabs_transcript_results(transcript_id, transcript)
            
            logger.info(f"Transcription completed for {transcript_id}")
            self.transcription_status[transcript_id] = "completed"
            
        except Exception as e:
            logger.error(f"Error processing transcription for {transcript_id}: {e}")
            self.transcription_status[transcript_id] = "failed"

    async def _transcribe_with_assemblyai(self, audio_file_path: str):
        """Run AssemblyAI transcription."""
        aai.settings.api_key = self.assemblyai_api_key
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            language_code="es"
        )
        transcriber = aai.Transcriber()
        return await asyncio.to_thread(transcriber.transcribe, audio_file_path, config)

    async def _transcribe_with_elevenlabs(self, audio_file_path: str):
        """Run ElevenLabs speech-to-text transcription."""
        from elevenlabs import ElevenLabs

        def transcribe():
            client = ElevenLabs(api_key=self.elevenlabs_api_key)
            with open(audio_file_path, "rb") as audio_file:
                logger.info(
                    "Submitting ElevenLabs transcription for %s with %ss timeout",
                    audio_file_path,
                    self.elevenlabs_timeout_seconds
                )
                return client.speech_to_text.convert(
                    file=(os.path.basename(audio_file_path), audio_file, "application/octet-stream"),
                    model_id="scribe_v2",
                    language_code="es",
                    diarize=True,
                    timestamps_granularity="word",
                    request_options={
                        "timeout_in_seconds": self.elevenlabs_timeout_seconds,
                    },
                )

        return await asyncio.to_thread(transcribe)

    async def _save_assemblyai_transcript_results(self, transcript_id: str, transcript):
        """Save transcript results to files"""
        try:
            # Format transcript with speaker labels
            formatted_transcript = self._format_assemblyai_transcript_with_speakers(transcript)
            
            # Extract speakers list
            speakers = self._extract_assemblyai_speakers(transcript)
            
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

    async def _save_elevenlabs_transcript_results(self, transcript_id: str, transcript):
        """Save ElevenLabs transcript results to files."""
        try:
            formatted_transcript = self._format_elevenlabs_transcript_with_speakers(transcript)
            speakers = self._extract_elevenlabs_speakers(transcript)
            duration = self._extract_elevenlabs_duration(transcript)

            metadata = {
                "id": transcript_id,
                "language": getattr(transcript, "language_code", None) or "en",
                "duration": f"{duration:.1f}s" if duration else "unknown",
                "upload_date": datetime.now().strftime("%Y-%m-%d"),
                "engine": "ElevenLabs",
                "speakers": speakers
            }

            self.file_manager.save_transcript(transcript_id, formatted_transcript, metadata)
        except Exception as e:
            logger.error(f"Error saving ElevenLabs transcript results for {transcript_id}: {e}")
            raise

    def _format_assemblyai_transcript_with_speakers(self, transcript) -> str:
        """Format transcript text with speaker labels"""
        if not transcript.utterances:
            return transcript.text or ""
        
        formatted_lines = []
        for utterance in transcript.utterances:
            speaker = f"Speaker {utterance.speaker}"
            text = utterance.text
            formatted_lines.append(f"{speaker}: {text}")
        
        return "\n".join(formatted_lines)
    
    def _extract_assemblyai_speakers(self, transcript) -> list:
        """Extract unique speakers from transcript"""
        if not transcript.utterances:
            return []
        
        speakers = set()
        for utterance in transcript.utterances:
            speakers.add(f"Speaker {utterance.speaker}")
        
        return sorted(list(speakers))

    def _format_elevenlabs_transcript_with_speakers(self, transcript) -> str:
        """Format ElevenLabs word-level diarization into speaker blocks."""
        words = getattr(transcript, "words", None) or []
        if not words:
            return getattr(transcript, "text", None) or ""

        speaker_map = self._get_elevenlabs_speaker_map(words)
        lines = []
        current_speaker_id = None
        current_words = []

        for word in words:
            text = getattr(word, "text", "")
            if not text:
                continue
            speaker_id = getattr(word, "speaker_id", None) or "speaker_0"
            if current_speaker_id is not None and speaker_id != current_speaker_id:
                lines.append(f"{speaker_map[current_speaker_id]}: {self._join_words(current_words)}")
                current_words = []
            current_speaker_id = speaker_id
            current_words.append(text)

        if current_speaker_id is not None and current_words:
            lines.append(f"{speaker_map[current_speaker_id]}: {self._join_words(current_words)}")

        return "\n".join(lines) or getattr(transcript, "text", None) or ""

    def _extract_elevenlabs_speakers(self, transcript) -> list:
        """Extract normalized speaker names from ElevenLabs words."""
        words = getattr(transcript, "words", None) or []
        speaker_map = self._get_elevenlabs_speaker_map(words)
        return [speaker_map[speaker_id] for speaker_id in sorted(speaker_map, key=self._speaker_sort_key)]

    def _extract_elevenlabs_duration(self, transcript) -> Optional[float]:
        """Use the last word end timestamp as the transcript duration."""
        words = getattr(transcript, "words", None) or []
        end_times = [
            getattr(word, "end", None)
            for word in words
            if getattr(word, "end", None) is not None
        ]
        if not end_times:
            return None
        return max(end_times)

    def _get_elevenlabs_speaker_map(self, words) -> Dict[str, str]:
        """Map ElevenLabs speaker IDs like speaker_0 to app labels like Speaker 1."""
        speaker_ids = []
        for word in words:
            speaker_id = getattr(word, "speaker_id", None) or "speaker_0"
            if speaker_id not in speaker_ids:
                speaker_ids.append(speaker_id)

        speaker_ids.sort(key=self._speaker_sort_key)
        return {
            speaker_id: f"Speaker {index + 1}"
            for index, speaker_id in enumerate(speaker_ids)
        }

    def _speaker_sort_key(self, speaker_id: str):
        match = re.search(r"(\d+)$", speaker_id)
        if match:
            return (0, int(match.group(1)))
        return (1, speaker_id)

    def _join_words(self, words) -> str:
        """Join word tokens while keeping punctuation tight."""
        text = ""
        no_leading_space = {".", ",", "!", "?", ":", ";", "%", ")", "]", "}"}
        no_trailing_space = {"(", "[", "{", "$", "#"}

        for word in words:
            if not text:
                text = word
            elif word in no_leading_space or word.startswith("'"):
                text += word
            elif text[-1] in no_trailing_space:
                text += word
            else:
                text += f" {word}"

        return text
    
    def get_status(self, transcript_id: str) -> str:
        """Get current transcription status"""
        return self.transcription_status.get(transcript_id, "not_found")
    
    def is_completed(self, transcript_id: str) -> bool:
        """Check if transcription is completed"""
        return self.get_status(transcript_id) == "completed"
    
    def is_pending(self, transcript_id: str) -> bool:
        """Check if transcription is pending"""
        return self.get_status(transcript_id) == "pending"
