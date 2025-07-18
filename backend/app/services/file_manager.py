import os
import json
import uuid
import logging
from typing import Optional, Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)


class FileManager:
    def update_metadata_name(self, transcript_id: str, name: str) -> bool:
        """Update the 'name' field in the transcript's metadata JSON file."""
        json_path = os.path.join(self.transcript_dir, f"{transcript_id}.json")
        if not os.path.exists(json_path):
            return False
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            metadata["name"] = name
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            logger.info(f"Updated metadata name in {transcript_id}: {name}")
            return True
        except Exception as e:
            logger.error(f"Error updating metadata name in {transcript_id}: {e}")
            return False
    def __init__(self, audio_dir: str = "data/audio", transcript_dir: str = "data/transcripts"):
        self.audio_dir = audio_dir
        self.transcript_dir = transcript_dir
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create directories if they don't exist"""
        os.makedirs(self.audio_dir, exist_ok=True)
        os.makedirs(self.transcript_dir, exist_ok=True)
    
    def save_audio_file(self, file_content: bytes, original_filename: str) -> str:
        """Save audio file and return the generated ID"""
        # Generate unique ID for the file
        file_id = str(uuid.uuid4())
        
        # Get file extension
        file_extension = os.path.splitext(original_filename)[1].lower()
        
        # Save file with unique ID
        file_path = os.path.join(self.audio_dir, f"{file_id}{file_extension}")
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.info(f"Saved audio file: {file_path}")
        return file_id
    
    def get_audio_file_path(self, file_id: str) -> Optional[str]:
        """Get the path to an audio file by ID"""
        # Find file with matching ID (any extension)
        for filename in os.listdir(self.audio_dir):
            if filename.startswith(file_id + "."):
                return os.path.join(self.audio_dir, filename)
        return None
    
    def save_transcript(self, transcript_id: str, transcript_text: str, metadata: Dict):
        """Save transcript in both .txt and .json formats"""
        # Save .txt file
        txt_path = os.path.join(self.transcript_dir, f"{transcript_id}.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(transcript_text)
        
        # Save .json metadata file
        json_path = os.path.join(self.transcript_dir, f"{transcript_id}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved transcript files: {txt_path}, {json_path}")
    
    def get_transcript(self, transcript_id: str) -> Optional[Dict]:
        """Get transcript text and metadata"""
        txt_path = os.path.join(self.transcript_dir, f"{transcript_id}.txt")
        json_path = os.path.join(self.transcript_dir, f"{transcript_id}.json")
        
        if not (os.path.exists(txt_path) and os.path.exists(json_path)):
            return None
        
        try:
            # Read transcript text
            with open(txt_path, "r", encoding="utf-8") as f:
                transcript_text = f.read()
            
            # Read metadata
            with open(json_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            
            return {
                "transcript": transcript_text,
                "metadata": metadata
            }
        except Exception as e:
            logger.error(f"Error reading transcript {transcript_id}: {e}")
            return None
    
    def update_speaker_names(self, transcript_id: str, current_name: str, new_name: str) -> bool:
        """Update speaker names in both .txt and .json files"""
        txt_path = os.path.join(self.transcript_dir, f"{transcript_id}.txt")
        json_path = os.path.join(self.transcript_dir, f"{transcript_id}.json")
        
        if not (os.path.exists(txt_path) and os.path.exists(json_path)):
            return False
        
        try:
            # Update .txt file
            with open(txt_path, "r", encoding="utf-8") as f:
                transcript_text = f.read()
            
            updated_text = transcript_text.replace(f"{current_name}:", f"{new_name}:")
            
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(updated_text)
            
            # Update .json file
            with open(json_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            
            # Update speakers list
            if "speakers" in metadata:
                metadata["speakers"] = [new_name if speaker == current_name else speaker 
                                     for speaker in metadata["speakers"]]
            
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Updated speaker names in {transcript_id}: {current_name} -> {new_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating speaker names in {transcript_id}: {e}")
            return False
    
    def transcript_exists(self, transcript_id: str) -> bool:
        """Check if transcript files exist"""
        txt_path = os.path.join(self.transcript_dir, f"{transcript_id}.txt")
        json_path = os.path.join(self.transcript_dir, f"{transcript_id}.json")
        return os.path.exists(txt_path) and os.path.exists(json_path)
