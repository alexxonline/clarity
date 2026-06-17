# Audio Transcription API

An asynchronous audio transcription API built with FastAPI that allows users to transcribe audio files with AssemblyAI or ElevenLabs and retrieve transcriptions with speaker labels.

## Features

- **Asynchronous Processing**: Upload audio files and get transcriptions processed in the background
- **Speaker Labeling**: Automatic speaker identification and labeling
- **Engine Selection**: Choose AssemblyAI or ElevenLabs per transcription request
- **Multiple Formats**: Supports MP3, WAV, M4A, FLAC, and AAC files
- **Speaker Renaming**: Rename speakers in completed transcripts
- **Docker Support**: Fully containerized with Docker and docker-compose
- **Local Storage**: Stores audio files and transcripts locally

## Tech Stack

- **Python 3.13+**
- **FastAPI** - Web framework
- **AssemblyAI / ElevenLabs** - Transcription services
- **Docker** - Containerization
- **Uvicorn** - ASGI server

## Quick Start

### 1. Clone and Setup

```bash
cd backend
cp .env.example .env
```

### 2. Get API Keys

1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Sign up at [ElevenLabs](https://elevenlabs.io/)
3. Get your API keys from each dashboard
4. Update the `.env` file with the keys for the engines you plan to use:

```env
ASSEMBLYAI_API_KEY=your_actual_api_key_here
ELEVENLABS_API_KEY=your_actual_api_key_here
ELEVENLABS_TIMEOUT_SECONDS=1800
```

### 3. Run with Docker (Recommended)

```bash
docker-compose up --build
```

### 4. Run Locally (Alternative)

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

The API will be available at `http://localhost:8000`

### 1. Upload Audio File

**POST** `/api/upload`

Upload an audio file for transcription.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Audio file (mp3, wav, m4a, flac, aac) and optional `engine` field (`AssemblyAI` or `ElevenLabs`)

**Response:**
```json
{
  "transcript_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "engine=ElevenLabs" \
  -F "file=@audio.mp3"
```

### 2. Get Transcript

**GET** `/api/transcript/{id}`

Retrieve a transcript by ID.

**Response (Completed):**
```json
{
  "status": "completed",
  "transcript": "Speaker 1: Hello there!\nSpeaker 2: Hi, how are you?",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "language": "en",
    "duration": "30.2s",
    "upload_date": "2025-07-17",
    "engine": "AssemblyAI",
    "speakers": ["Speaker 1", "Speaker 2"]
  }
}
```

**Response (Pending):**
```json
{
  "status": "pending"
}
```

### 3. Rename Speaker

**POST** `/api/transcript/speakers`

Rename a speaker in a completed transcript.

**Request:**
```json
{
  "transcript_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_name": "Speaker 1",
  "new_name": "Alice"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully renamed 'Speaker 1' to 'Alice'"
}
```

### 4. Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Audio Transcription API is running"
}
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## File Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── models.py               # Pydantic models
│   ├── services/
│   │   ├── transcription.py    # Transcription engine integrations
│   │   └── file_manager.py     # File operations
│   └── data/
│       ├── audio/              # Uploaded audio files
│       └── transcripts/        # Generated transcripts
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose setup
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Storage Format

### Audio Files
- Stored in `app/data/audio/` with UUID filenames
- Original extensions preserved

### Transcripts
- **Text**: `app/data/transcripts/{id}.txt` - Formatted transcript with speaker labels
- **Metadata**: `app/data/transcripts/{id}.json` - Metadata including speakers, duration, etc.

## Error Handling

The API handles various error scenarios:
- Invalid file types (returns 400)
- Missing files (returns 404)
- Transcription failures (returns 500)
- Server errors (returns 500)

## Development

### Running Tests
```bash
# Add test dependencies to requirements.txt first
pip install pytest pytest-asyncio httpx
pytest
```

### Logs
The application logs to console with timestamps. In Docker, view logs with:
```bash
docker-compose logs -f transcription-api
```

### Debugging
For development, you can run with hot reload:
```bash
cd app
uvicorn main:app --reload --log-level debug
```

## Production Considerations

1. **API Key Security**: Use proper secrets management
2. **File Storage**: Consider cloud storage for production
3. **Database**: Add database for transcript metadata
4. **Authentication**: Implement proper authentication
5. **Rate Limiting**: Add rate limiting for uploads
6. **Monitoring**: Add health checks and monitoring
7. **Backup**: Implement backup for stored files

## Troubleshooting

### Common Issues

1. **Transcription API Key**: Make sure the selected engine's API key is set, valid, and has sufficient credits
2. **ElevenLabs Read Timeout**: For large files, increase `ELEVENLABS_TIMEOUT_SECONDS`
3. **File Permissions**: Ensure Docker has permission to mount volumes
4. **Port Conflicts**: Make sure port 8000 is available
5. **Memory**: Large audio files may require more memory

### Support

For issues related to:
- **AssemblyAI**: Check [AssemblyAI Documentation](https://www.assemblyai.com/docs/)
- **ElevenLabs**: Check [ElevenLabs Documentation](https://elevenlabs.io/docs)
- **FastAPI**: Check [FastAPI Documentation](https://fastapi.tiangolo.com/)
- **Docker**: Check [Docker Documentation](https://docs.docker.com/)
