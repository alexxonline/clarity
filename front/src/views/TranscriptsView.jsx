import React, { useState, useEffect } from 'react';
import { Link } from 'preact-router';
import { getTranscripts } from '../utils/api';
import './TranscriptsView.css';

const TranscriptsView = () => {
    const [transcripts, setTranscripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const data = await getTranscripts();
                setTranscripts(data.transcripts);
            } catch (err) {
                setError('Failed to fetch transcripts.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchTranscripts();
    }, []);

    if (loading) return <div className="centered-text-container">Loading...</div>;
    if (error) return <div className="centered-text-container error-text">{error}</div>;

    return (
        <div className="transcripts-view-container">
            <h1 className="transcripts-view-header">All Transcripts</h1>
            
            {transcripts.length === 0 ? (
                <div className="no-transcripts-container">
                    <p className="no-transcripts-text">No transcripts found.</p>
                    <Link href="/" className="upload-link">
                        Upload a New Audio File
                    </Link>
                </div>
            ) : (
                <div className="transcripts-grid">
                    {transcripts.map(transcript => (
                        <Link href={`/transcript/${transcript.id}`} key={transcript.id} className="transcript-card">
                            <h2 className="transcript-name">{transcript.name || 'Untitled Transcript'}</h2>
                            <p className="transcript-details"><strong>ID:</strong> {transcript.id}</p>
                            <p className="transcript-details"><strong>Date:</strong> {new Date(transcript.upload_date).toLocaleDateString()}</p>
                            <p className="transcript-details"><strong>Duration:</strong> {transcript.duration}</p>
                            <p className="status-container">
                                <span className={`status-badge ${transcript.status === 'completed' ? 'status-completed' : 'status-processing'}`}>
                                    {transcript.status}
                                </span>
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TranscriptsView;
