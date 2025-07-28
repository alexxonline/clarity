import { h } from 'preact';
import { Link } from 'preact-router/match';
import Router from 'preact-router';
import UploadView from './views/UploadView';
import TranscriptView from './views/TranscriptView';
import TranscriptsView from './views/TranscriptsView'; // Import the new view
import './app.css';

export function App() {
  return (
    <div>
      <header className="bg-gray-800 text-white p-4">
        <nav className="container mx-auto flex justify-between">
          <Link href="/" className="text-lg font-bold">Transcript Creator</Link>
          <div>
            <Link href="/" activeClassName="font-bold" className="mr-4">Upload</Link>
            <Link href="/transcripts" activeClassName="font-bold">All Transcripts</Link>
          </div>
        </nav>
      </header>
      <main>
        <Router>
          <UploadView path="/" />
          <TranscriptsView path="/transcripts" />
          <TranscriptView path="/transcript/:fileId" />
        </Router>
      </main>
    </div>
  );
}
