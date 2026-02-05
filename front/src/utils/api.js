export async function getTranscripts() {
  const response = await fetch('http://localhost:8000/api/transcripts');
  if (!response.ok) {
    throw new Error('Failed to fetch transcripts');
  }
  return response.json();
}

// Update transcript name
export async function updateTranscriptName(transcriptId, name) {
  const response = await fetch('http://localhost:8000/api/transcript/name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript_id: transcriptId, name })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update transcript name');
  }
  return response.json();
}
// Rename a speaker in a transcript
export async function renameSpeaker(transcriptId, currentName, newName) {
  const response = await fetch(`http://localhost:8000/api/transcript/speakers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript_id: transcriptId,
      current_name: currentName,
      new_name: newName
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to rename speaker');
  }
  return response.json();
}
// API utility for uploading files and fetching transcripts

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('http://localhost:8000/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json(); // expects { transcript_id }
}

export async function fetchTranscript(fileId) {
  const response = await fetch(`http://localhost:8000/api/transcript/${encodeURIComponent(fileId)}`);
  if (!response.ok) throw new Error('Transcript fetch failed');
  return response.json(); 
  // expects: 
  // {
  //   status: "completed" | "pending" | "failed",
  //   transcript: "Speaker A: text...",
  //   metadata: {
  //     id: string,
  //     language: string,
  //     duration: string,
  //     upload_date: string,
  //     engine: string,
  //     speakers: string[]
  //   }
  // }
}

export async function deleteTranscript(transcriptId) {
  const response = await fetch(`http://localhost:8000/api/transcript/${encodeURIComponent(transcriptId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete transcript');
  }
  // No JSON body is returned on a 204 No Content response
  return;
}

export async function getAudioFiles() {
  const response = await fetch('http://localhost:8000/api/audio-files');
  if (!response.ok) {
    throw new Error('Failed to fetch audio files');
  }
  return response.json();
}

export async function deleteAudioFile(fileId) {
  const response = await fetch(`http://localhost:8000/api/audio-files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete audio file');
  }
  return;
}

export async function getLocalFiles() {
  const response = await fetch('http://localhost:8000/api/local-files');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch local files');
  }
  return response.json();
}

export async function processLocalFile(filename) {
  const response = await fetch('http://localhost:8000/api/local-files/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to process local file');
  }
  return response.json();
}

export async function fetchLocalFileBlob(filename) {
  const response = await fetch(`http://localhost:8000/api/local-files/${encodeURIComponent(filename)}/content`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch local file content');
  }
  return response.blob();
}

export async function saveEditedLocalFile(filename, file) {
  const formData = new FormData();
  formData.append('filename', filename);
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/api/local-files/save-edited', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save edited local file');
  }

  return response.json();
}
