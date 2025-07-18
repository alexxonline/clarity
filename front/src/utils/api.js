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
  return response.json(); // expects { fileName, paragraphs }
}
