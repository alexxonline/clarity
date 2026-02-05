import { h } from 'preact';
import { Link } from 'preact-router/match';
import Router from 'preact-router';
import UploadView from './views/UploadView';
import TranscriptView from './views/TranscriptView';
import TranscriptsView from './views/TranscriptsView'; // Import the new view
import StorageView from './views/StorageView';
import './app.css';

export function App() {
  return (
    <div>
      <header className="app-header">
        <nav className="app-nav">
          <Link href="/" className="brand-link">Transcript Creator</Link>
          <div class="nav-links">
            <Link href="/" activeClassName="active">Upload</Link>
            <Link href="/transcripts" activeClassName="active">All Transcripts</Link>
            <Link href="/storage" activeClassName="active">Storage</Link>
          </div>
        </nav>
      </header>
      <main>
        <Router>
          <UploadView path="/" />
          <TranscriptsView path="/transcripts" />
          <TranscriptView path="/transcript/:fileId" />
          <StorageView path="/storage" />
        </Router>
      </main>
    </div>
  );
}
