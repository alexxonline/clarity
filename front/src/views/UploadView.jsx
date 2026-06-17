import { h } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { uploadFile } from '../utils/api';

const ACCEPTED_TYPES = ['audio/mp3', 'audio/aac', 'audio/wav', 'video/mp4'];
const ACCEPTED_EXTS = ['.mp3', '.mp4', '.aac', '.wav'];
const ENGINES = ['AssemblyAI', 'ElevenLabs'];

export default function UploadView() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [engine, setEngine] = useState('AssemblyAI');

  function handleDrop(e) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }


  async function handleFile(selectedFile) {
    if (!selectedFile) return;
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      setError('Invalid file type.');
      return;
    }
    setError('');
    setFile(selectedFile);
    setProgress(10);
    try {
      const result = await uploadFile(selectedFile, engine);
      setProgress(100);
      route(`/transcript/${encodeURIComponent(result.transcript_id)}`);
    } catch (err) {
      setError(err.message || 'Upload failed.');
      setProgress(0);
    }
  }

  // simulateUpload removed, now handled by backend

  function handleBrowse(e) {
    handleFile(e.target.files[0]);
  }

  return (
    <div className="upload-container">
      <h2>Upload Audio/Video File</h2>
      <div
        className="drop-area"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        Drag & Drop file here
      </div>
      <label className="engine-field">
        <span>Transcription engine</span>
        <select
          value={engine}
          onChange={e => setEngine(e.target.value)}
          disabled={progress > 0 && progress < 100}
        >
          {ENGINES.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
      <input
        type="file"
        accept={ACCEPTED_EXTS.join(',')}
        style={{ display: 'none' }}
        id="fileInput"
        onChange={handleBrowse}
      />
      <label htmlFor="fileInput" className="browse-btn">Browse</label>
      {file && (
        <div className="progress">
          <span>{file.name}</span>
          <progress value={progress} max="100" />
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
