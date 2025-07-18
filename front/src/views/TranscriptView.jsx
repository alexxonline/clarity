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
        setTranscript(data);
        setLoading(false);
      })
      .catch(() => {
        route('/upload');
      });
  }, [fileId]);

  if (loading) return <div className="loading">Loading transcript…</div>;
  if (!transcript) return null;

  return (
    <div className="transcript-container">
      <h2>Transcript for {transcript.fileName}</h2>
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
