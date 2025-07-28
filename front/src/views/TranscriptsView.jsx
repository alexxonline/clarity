import React, { useState, useEffect } from 'react';
import { Link } from 'preact-router';
import { getTranscripts } from '../utils/api';

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

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">All Transcripts</h1>
            
            {transcripts.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                    <p className="text-gray-500">No transcripts found.</p>
                    <Link href="/" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        Upload a New Audio File
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transcripts.map(transcript => (
                        <Link href={`/transcript/${transcript.id}`} key={transcript.id} className="block p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-semibold mb-2 truncate">{transcript.name || 'Untitled Transcript'}</h2>
                            <p className="text-gray-600 mb-1"><strong>ID:</strong> {transcript.id}</p>
                            <p className="text-gray-600 mb-1"><strong>Date:</strong> {new Date(transcript.upload_date).toLocaleDateString()}</p>
                            <p className="text-gray-600 mb-1"><strong>Duration:</strong> {transcript.duration}</p>
                            <p className="capitalize mt-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${transcript.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
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
