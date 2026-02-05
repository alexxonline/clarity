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
- Local file shortcut feature uses `LOCAL_INPUT_DIRECTORY`; if it is missing or invalid, local file endpoints return a `400` error.
- Local file listing is served by `GET /api/local-files`, which only includes supported audio/video extensions.
- Local processing is triggered by `POST /api/local-files/process` with `{ "filename": "..." }`, and starts transcription without browser upload.
- Processing a local file copies it into the app upload storage (`data/audio`) before transcription, so downstream flow matches normal uploads.
- Frontend exposes this shortcut on `/local-files` and includes a top bar link named `Local Files`.
