import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { getLocalFiles, processLocalFile } from '../utils/api';
import './LocalFilesView.css';

const ENGINES = ['AssemblyAI', 'ElevenLabs'];

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const LocalFilesView = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState('');
  const [openingEditor, setOpeningEditor] = useState('');
  const [engine, setEngine] = useState('AssemblyAI');

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + (file.size_bytes || 0), 0),
    [files]
  );

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLocalFiles();
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch local files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleProcess = async (filename) => {
    setProcessing(filename);
    setError('');
    try {
      const result = await processLocalFile(filename, engine);
      route(`/transcript/${encodeURIComponent(result.transcript_id)}`);
    } catch (err) {
      setError(err.message || 'Failed to process local file.');
    } finally {
      setProcessing('');
    }
  };

  const handleEdit = (filename) => {
    setOpeningEditor(filename);
    route(`/local-files/edit/${encodeURIComponent(filename)}`);
  };

  if (loading) return <div className="centered-text-container">Loading...</div>;
  if (error) return <div className="centered-text-container error-text">{error}</div>;

  return (
    <div className="local-files-container">
      <div className="local-files-header-row">
        <div>
          <h1 className="local-files-header">Local Files</h1>
          <p className="local-files-subtitle">
            Process audio/video files directly from `LOCAL_INPUT_DIRECTORY`.
          </p>
        </div>
        <div className="local-files-summary">
          <span className="local-files-summary-label">Total size</span>
          <span className="local-files-summary-value">{formatBytes(totalSize)}</span>
        </div>
      </div>
      <label className="local-files-engine">
        <span>Transcription engine</span>
        <select
          value={engine}
          onChange={e => setEngine(e.target.value)}
          disabled={Boolean(processing)}
        >
          {ENGINES.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>

      {files.length === 0 ? (
        <div className="no-transcripts-container">
          <p className="no-transcripts-text">No compatible files found in the local directory.</p>
        </div>
      ) : (
        <table className="local-files-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Last Modified</th>
              <th>Size</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr key={file.filename}>
                <td className="local-files-name">{file.filename}</td>
                <td>{new Date(file.modified_at).toLocaleString()}</td>
                <td>{formatBytes(file.size_bytes || 0)}</td>
                <td>
                  <div className="local-files-actions">
                    <button
                      className="local-files-action-btn local-files-action-btn--ghost"
                      onClick={() => handleEdit(file.filename)}
                      disabled={openingEditor === file.filename}
                    >
                      {openingEditor === file.filename ? 'Opening…' : 'Edit'}
                    </button>
                    <button
                      className="local-files-action-btn"
                      onClick={() => handleProcess(file.filename)}
                      disabled={processing === file.filename}
                    >
                      {processing === file.filename ? 'Processing…' : 'Process'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LocalFilesView;
