// Utility to generate mocked transcript data
export function generateMockTranscript(fileName) {
  const speakers = ["Alice", "Bob", "Carol", "Dave"];
  const paragraphs = [];
  const numBlocks = Math.floor(Math.random() * 4) + 3;
  for (let i = 0; i < numBlocks; i++) {
    const speaker = Math.random() > 0.5 ? speakers[Math.floor(Math.random() * speakers.length)] : null;
    const text = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () =>
      Math.random().toString(36).substring(2, 15)
    ).join(" ");
    paragraphs.push({ speaker, text });
  }
  return {
    fileName,
    paragraphs,
  };
}
