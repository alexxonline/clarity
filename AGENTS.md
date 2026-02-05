# AGENTS

## Instructions
- Always use virtual environment when running using ./backend/.venv folder.

## Context
- Frontend is using preact with jsx.
- Backend is using FastApi Python

## Learnings 
- The backend must be restarted after adding new FastAPI routes; otherwise new endpoints like `GET /api/audio-files` return 404.
- The Storage page uses `/api/audio-files` and `/api/audio-files/{file_id}` for listing and deleting uploaded audio files.
- Deleting from Storage only removes the uploaded audio file, not the transcript metadata or transcript text files.
