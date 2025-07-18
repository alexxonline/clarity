# Transcript Creator SPA (Frontend Only)

A Preact + Vite single page app for uploading audio/video files and viewing mocked transcripts. No backend required.

## Features
- Drag-and-drop or browse to upload a single audio/video file (.mp3, .mp4, .aac, .wav)
- Upload progress bar and file name display
- Client-side routing with preact-router
- Dedicated transcript screen per file, with speaker-labeled paragraphs (mocked)
- Blue color scheme, white background

## Getting Started

### Install dependencies
```bash
npm install
```

### Run in development mode
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Project Structure
- `src/components/` — reusable UI components
- `src/views/` — main app views (Upload, Transcript)
- `src/utils/` — utility functions (mock transcript generator)
- `src/app.jsx` — app entry and router
- `src/app.css` — custom styles

## Notes
- All transcript data is mocked and stored in sessionStorage
- No external CSS frameworks used
- Browser navigation (back/forward) works with client-side routing

---

For any issues or suggestions, feel free to open an issue or contribute!
