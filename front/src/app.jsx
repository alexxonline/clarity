import { h } from 'preact';
import Router from 'preact-router';
import UploadView from './views/UploadView';
import TranscriptView from './views/TranscriptView';
import './app.css';

export function App() {
  return (
    <Router>
      <UploadView path="/upload" />
      <TranscriptView path="/transcript/:fileId" />
      <UploadView default />
    </Router>
  );
}
