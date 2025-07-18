import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

export default function TranscriptView({ fileId }) {
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState(null);

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      const data = window.sessionStorage.getItem('transcript_' + decodeURIComponent(fileId));
      if (!data) {
        route('/upload');
        return;
      }
      setTranscript(JSON.parse(data));
      setLoading(false);
    }, 0);
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
