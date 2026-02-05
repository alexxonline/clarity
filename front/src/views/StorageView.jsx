import React, { useEffect, useMemo, useState } from 'react';
import { deleteAudioFile, getAudioFiles } from '../utils/api';
import './StorageView.css';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const StorageView = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + (file.size_bytes || 0), 0),
    [files]
  );

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAudioFiles();
      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to fetch audio files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (fileId) => {
    const confirmed = window.confirm('Delete this audio file? This will only remove the upload.');
    if (!confirmed) return;
    setDeletingId(fileId);
    setDeleteError(null);
    try {
      await deleteAudioFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete audio file.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="centered-text-container">Loading...</div>;
  if (error) return <div className="centered-text-container error-text">{error}</div>;

  return (
    <div className="storage-view-container">
      <div className="storage-header-row">
        <h1 className="storage-view-header">Storage Manager</h1>
        <div className="storage-summary">
          <span className="storage-summary-label">Total used</span>
          <span className="storage-summary-value">{formatBytes(totalSize)}</span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="no-transcripts-container">
          <p className="no-transcripts-text">No audio files found in uploads.</p>
        </div>
      ) : (
        <table className="storage-table">
          <thead>
            <tr>
              <th>File</th>
              <th>File ID</th>
              <th>Size</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr key={file.id}>
                <td className="storage-file-name">{file.filename}</td>
                <td className="storage-file-id">{file.id}</td>
                <td>{formatBytes(file.size_bytes || 0)}</td>
                <td>
                  <button
                    className="storage-delete-btn"
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                  >
                    {deletingId === file.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteError && (
        <div className="storage-error">{deleteError}</div>
      )}
    </div>
  );
};

export default StorageView;
