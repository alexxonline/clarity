import React, { useState, useEffect } from 'react';
import { Link } from 'preact-router';
import { getTranscripts } from '../utils/api';
import { formatDuration } from '../utils/format';
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
                <table className="transcripts-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Duration</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transcripts.map(transcript => (
                            <tr key={transcript.id}>
                                <td>
                                    <Link href={`/transcript/${transcript.id}`} className="transcript-link">
                                        {transcript.name || 'Untitled Transcript'}
                                    </Link>
                                </td>
                                <td>{transcript.id}</td>
                                <td>{new Date(transcript.upload_date).toLocaleDateString()}</td>
                                <td>{formatDuration(transcript.duration)}</td>
                                <td>
                                    <span className={`status-badge ${transcript.status === 'completed' ? 'status-completed' : 'status-processing'}`}>
                                        {transcript.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TranscriptsView;
