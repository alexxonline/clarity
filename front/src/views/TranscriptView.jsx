import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchTranscript, renameSpeaker, updateTranscriptName, deleteTranscript } from '../utils/api';

export default function TranscriptView({ fileId }) {
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState(null);
  const [editingSpeaker, setEditingSpeaker] = useState(null); // speaker name being edited
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [renaming, setRenaming] = useState(false); // loading state for rename
  const [renameError, setRenameError] = useState(null);
  const [editingName, setEditingName] = useState(false); // name editing state
  const [newTranscriptName, setNewTranscriptName] = useState('');
  const [nameUpdateError, setNameUpdateError] = useState(null);
  const [updatingName, setUpdatingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
useEffect(() => {
  setLoading(true);
  
  const pollTranscript = async () => {
    try {
      const data = await fetchTranscript(fileId);
      
      if (data.status === 'completed' && data.transcript) {
        const parsedTranscript = parseTranscriptText(data.transcript);
        setTranscript({
          fileName: data.metadata?.id || fileId,
          paragraphs: parsedTranscript,
          metadata: data.metadata
        });
        setLoading(false);
      } else if (data.status === 'pending') {
        // Continue polling every 2 seconds until complete
        setTimeout(pollTranscript, 2000);
      } else {
        // Failed or invalid response
        route('/upload');
      }
    } catch (error) {
      route('/upload');
    }
  };
  
  pollTranscript();
}, [fileId]);

  // Handler for clicking a speaker name
  const handleSpeakerClick = (speaker) => {
    setEditingSpeaker(speaker);
    setNewSpeakerName(speaker);
    setRenameError(null);
  };

  // Handler for canceling rename
  const handleCancelRename = () => {
    setEditingSpeaker(null);
    setNewSpeakerName('');
    setRenameError(null);
  };

  // Handler for confirming rename
  const handleConfirmRename = async () => {
    if (!newSpeakerName.trim() || newSpeakerName === editingSpeaker) {
      setEditingSpeaker(null);
      setNewSpeakerName('');
      setRenameError(null);
      return;
    }
    setRenaming(true);
    setRenameError(null);
    try {
      await renameSpeaker(fileId, editingSpeaker, newSpeakerName.trim());
      // Refresh transcript after rename
      fetchTranscript(fileId).then(data => {
        if (data.status === 'completed' && data.transcript) {
          const parsedTranscript = parseTranscriptText(data.transcript);
          setTranscript({
            fileName: data.metadata?.id || fileId,
            paragraphs: parsedTranscript,
            metadata: data.metadata
          });
        }
        setEditingSpeaker(null);
        setNewSpeakerName('');
        setRenameError(null);
      });
    } catch (e) {
      setRenameError(e.message || 'Failed to rename speaker');
    } finally {
      setRenaming(false);
    }
  };

  // Handler for starting name edit
  const handleNameClick = () => {
    setEditingName(true);
    setNewTranscriptName(transcript.metadata?.name || '');
    setNameUpdateError(null);
  };

  // Handler for canceling name edit
  const handleCancelNameEdit = () => {
    setEditingName(false);
    setNewTranscriptName('');
    setNameUpdateError(null);
  };

  // Handler for confirming name update
  const handleConfirmNameUpdate = async () => {
    const trimmedName = newTranscriptName.trim();
    if (!trimmedName || trimmedName === transcript.metadata?.name) {
      setEditingName(false);
      setNewTranscriptName('');
      setNameUpdateError(null);
      return;
    }
    setUpdatingName(true);
    setNameUpdateError(null);
    try {
      await updateTranscriptName(fileId, trimmedName);
      // Refresh transcript after name update
      fetchTranscript(fileId).then(data => {
        if (data.status === 'completed' && data.transcript) {
          const parsedTranscript = parseTranscriptText(data.transcript);
          setTranscript({
            fileName: data.metadata?.id || fileId,
            paragraphs: parsedTranscript,
            metadata: data.metadata
          });
        }
        setEditingName(false);
        setNewTranscriptName('');
        setNameUpdateError(null);
      });
    } catch (e) {
      setNameUpdateError(e.message || 'Failed to update transcript name');
    } finally {
      setUpdatingName(false);
    }
  };

  // Handler for deleting a transcript
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTranscript(fileId);
      route('/transcripts');
    } catch (e) {
      setDeleteError(e.message || 'Failed to delete transcript');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Helper function to parse transcript text into paragraphs
  const parseTranscriptText = (transcriptText) => {
    if (!transcriptText) return [];
    
    const lines = transcriptText.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const speakerMatch = line.match(/^(Speaker [A-Z]|[^:]+):\s*(.*)$/);
      if (speakerMatch) {
        return {
          speaker: speakerMatch[1],
          text: speakerMatch[2]
        };
      } else {
        return {
          speaker: null,
          text: line
        };
      }
    });
  };

  if (loading) return <div className="loading">Loading transcript…</div>;
  if (!transcript) return null;

  return (
    <div className="transcript-container">
      <h2>Transcript for {transcript.fileName}</h2>
      {transcript.metadata && (
        <div className="transcript-metadata">
          <p><strong>Name:</strong> {
            editingName ? (
              <>
                <input
                  type="text"
                  value={newTranscriptName}
                  onInput={e => setNewTranscriptName(e.target.value)}
                  disabled={updatingName}
                  style={{ marginLeft: 8, marginRight: 4 }}
                  autoFocus
                />
                <button onClick={handleConfirmNameUpdate} disabled={updatingName} style={{ marginRight: 2 }}>OK</button>
                <button onClick={handleCancelNameEdit} disabled={updatingName}>Cancel</button>
              </>
            ) : transcript.metadata.name ? (
              <span
                className="editable-name"
                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#1976d2', marginLeft: 8 }}
                onClick={handleNameClick}
              >
                {transcript.metadata.name}
              </span>
            ) : (
              <button 
                onClick={handleNameClick}
                style={{ marginLeft: 8, padding: '2px 8px', fontSize: '12px' }}
              >
                Add Name
              </button>
            )
          }</p>
          {nameUpdateError && <p style={{ color: '#d32f2f', marginTop: 4 }}>{nameUpdateError}</p>}
          <p><strong>Duration:</strong> {transcript.metadata.duration}</p>
          <p><strong>Language:</strong> {transcript.metadata.language}</p>
          <p><strong>Engine:</strong> {transcript.metadata.engine}</p>
          <p><strong>Date:</strong> {transcript.metadata.upload_date}</p>
          {Array.isArray(transcript.metadata.speakers) && transcript.metadata.speakers.length > 0 && (
            <p><strong>Speakers:</strong> {transcript.metadata.speakers.map((speaker, idx) => (
              <span key={speaker} style={{ marginRight: 8 }}>
                {editingSpeaker === speaker ? (
                  <>
                    <input
                      type="text"
                      value={newSpeakerName}
                      onInput={e => setNewSpeakerName(e.target.value)}
                      disabled={renaming}
                      style={{ marginRight: 4 }}
                      autoFocus
                    />
                    <button onClick={handleConfirmRename} disabled={renaming} style={{ marginRight: 2 }}>OK</button>
                    <button onClick={handleCancelRename} disabled={renaming}>Cancel</button>
                  </>
                ) : (
                  <span
                    className="editable-speaker"
                    style={{ cursor: 'pointer', textDecoration: 'underline', color: '#1976d2' }}
                    onClick={() => handleSpeakerClick(speaker)}
                  >
                    {speaker}
                  </span>
                )}
                {idx < transcript.metadata.speakers.length - 1 && ', '}
              </span>
            ))}</p>
          )}
          {renameError && <p style={{ color: '#d32f2f', marginTop: 4 }}>{renameError}</p>}
        </div>
      )}
      {transcript.paragraphs.map((block, idx) => (
        <div key={idx} className="paragraph-block">
          {block.speaker ? (
            <strong className="speaker-label">{block.speaker}:</strong>
          ) : null}
          <span className="paragraph-text"> {block.text}</span>
        </div>
      ))}
      <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
        <button 
          onClick={handleDeleteClick} 
          style={{ backgroundColor: '#d32f2f', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Delete Transcript
        </button>
        {showDeleteConfirm && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #d32f2f', borderRadius: '4px' }}>
            <p>Are you sure you want to delete this transcript? This action cannot be undone.</p>
            <button onClick={handleConfirmDelete} disabled={deleting} style={{ marginRight: '1rem' }}>
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
            {deleteError && <p style={{ color: '#d32f2f', marginTop: '0.5rem' }}>{deleteError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
