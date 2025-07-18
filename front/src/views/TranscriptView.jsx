import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchTranscript } from '../utils/api';

export default function TranscriptView({ fileId }) {
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchTranscript(fileId)
      .then(data => {
        // Parse the new API response format
        if (data.status === 'completed' && data.transcript) {
          const parsedTranscript = parseTranscriptText(data.transcript);
          setTranscript({
            fileName: data.metadata?.id || fileId,
            paragraphs: parsedTranscript,
            metadata: data.metadata
          });
        } else if (data.status === 'pending') {
          // If still processing, show loading state
          setTimeout(() => {
            fetchTranscript(fileId)
              .then(updatedData => {
                if (updatedData.status === 'completed') {
                  const parsedTranscript = parseTranscriptText(updatedData.transcript);
                  setTranscript({
                    fileName: updatedData.metadata?.id || fileId,
                    paragraphs: parsedTranscript,
                    metadata: updatedData.metadata
                  });
                  setLoading(false);
                }
              });
          }, 2000); // Poll every 2 seconds
          return;
        } else {
          // Failed or invalid response
          route('/upload');
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        route('/upload');
      });
  }, [fileId]);

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
          <p><strong>Duration:</strong> {transcript.metadata.duration}</p>
          <p><strong>Language:</strong> {transcript.metadata.language}</p>
          <p><strong>Engine:</strong> {transcript.metadata.engine}</p>
          <p><strong>Date:</strong> {transcript.metadata.upload_date}</p>
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
    </div>
  );
}
