import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { fetchLocalFileBlob, saveEditedLocalFile } from '../utils/api';
import './LocalFileEditorView.css';

const WAVEFORM_BARS = 240;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;

const formatSeconds = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const encodeWavFromChannelData = (channels, sampleRate) => {
  const numChannels = channels.length;
  const numFrames = channels[0]?.length || 0;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i += 1) {
    for (let ch = 0; ch < numChannels; ch += 1) {
      const sample = clamp(channels[ch][i] || 0, -1, 1);
      const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, pcm, true);
      offset += 2;
    }
  }

  return buffer;
};

const LocalFileEditorView = ({ filename }) => {
  const decodedFilename = decodeURIComponent(filename || '');
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const playbackNodeRef = useRef(null);
  const playStartContextTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  const [audioBuffer, setAudioBuffer] = useState(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [playingSelection, setPlayingSelection] = useState(false);
  const [saveFilename, setSaveFilename] = useState('');
  const [playbackPosition, setPlaybackPosition] = useState(0);

  useEffect(() => {
    let objectUrl = '';
    let isMounted = true;

    const loadAudio = async () => {
      setLoading(true);
      setError('');
      try {
        if (!AudioContextClass) {
          throw new Error('This browser does not support audio editing features.');
        }
        const blob = await fetchLocalFileBlob(decodedFilename);
        objectUrl = URL.createObjectURL(blob);
        const arrayBuffer = await blob.arrayBuffer();
        const context = audioContextRef.current || new AudioContextClass();
        audioContextRef.current = context;
        const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
        if (!isMounted) return;

        setAudioBuffer(decoded);
        setDuration(decoded.duration);
        setStartTime(0);
        setEndTime(decoded.duration);
        setPlaybackPosition(0);

        const dotIndex = decodedFilename.lastIndexOf('.');
        const baseName = dotIndex > 0 ? decodedFilename.slice(0, dotIndex) : decodedFilename;
        setSaveFilename(`${baseName}-trimmed.wav`);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load local audio file.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (playbackNodeRef.current) {
        playbackNodeRef.current.stop();
        playbackNodeRef.current.disconnect();
        playbackNodeRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [decodedFilename]);

  const peaks = useMemo(() => {
    if (!audioBuffer) return [];
    const channelData = audioBuffer.getChannelData(0);
    const bars = Math.min(WAVEFORM_BARS, channelData.length);
    const blockSize = Math.floor(channelData.length / bars) || 1;
    const values = new Array(bars).fill(0);

    for (let i = 0; i < bars; i += 1) {
      const start = i * blockSize;
      const end = Math.min(channelData.length, start + blockSize);
      let max = 0;
      for (let j = start; j < end; j += 1) {
        const amplitude = Math.abs(channelData[j]);
        if (amplitude > max) max = amplitude;
      }
      values[i] = max;
    }

    return values;
  }, [audioBuffer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0 || duration === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);

    const selectionStartX = (startTime / duration) * width;
    const selectionEndX = (endTime / duration) * width;
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(selectionStartX, 0, Math.max(selectionEndX - selectionStartX, 2), height);

    const barWidth = width / peaks.length;
    const midY = height / 2;
    ctx.fillStyle = '#0f172a';
    for (let i = 0; i < peaks.length; i += 1) {
      const normalized = peaks[i];
      const barHeight = Math.max(1, normalized * (height * 0.48));
      const x = i * barWidth;
      ctx.fillRect(x, midY - barHeight, Math.max(1, barWidth - 1), barHeight * 2);
    }

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(selectionStartX, 0);
    ctx.lineTo(selectionStartX, height);
    ctx.moveTo(selectionEndX, 0);
    ctx.lineTo(selectionEndX, height);
    ctx.stroke();

    const playheadX = (clamp(playbackPosition, 0, duration) / duration) * width;
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [peaks, duration, startTime, endTime, playbackPosition]);

  const trimDuration = Math.max(0, endTime - startTime);
  const playheadWithinSelection = clamp(playbackPosition - startTime, 0, trimDuration);

  const stopPlayback = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (playbackNodeRef.current) {
      playbackNodeRef.current.stop();
      playbackNodeRef.current.disconnect();
      playbackNodeRef.current = null;
      setPlayingSelection(false);
    }
  };

  useEffect(() => {
    if (!playingSelection) {
      setPlaybackPosition((current) => {
        if (current < startTime || current > endTime) {
          return startTime;
        }
        return current;
      });
    }
  }, [startTime, endTime, playingSelection]);

  const handlePlaySelection = async () => {
    if (!audioBuffer || trimDuration <= 0) return;
    if (!AudioContextClass) return;
    const context = audioContextRef.current || new AudioContextClass();
    audioContextRef.current = context;
    if (context.state === 'suspended') {
      await context.resume();
    }

    stopPlayback();

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.onended = () => {
      if (playbackNodeRef.current === source) {
        playbackNodeRef.current = null;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setPlaybackPosition(endTime);
        setPlayingSelection(false);
      }
    };
    playStartContextTimeRef.current = context.currentTime;
    setPlaybackPosition(startTime);
    source.start(0, startTime, trimDuration);
    playbackNodeRef.current = source;
    setPlayingSelection(true);

    const tick = () => {
      if (!audioContextRef.current || !playbackNodeRef.current) return;
      const elapsed = audioContextRef.current.currentTime - playStartContextTimeRef.current;
      const nextPosition = Math.min(endTime, startTime + Math.max(0, elapsed));
      setPlaybackPosition(nextPosition);

      if (nextPosition < endTime) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleSave = async () => {
    if (!audioBuffer || trimDuration <= 0) return;

    const targetName = (saveFilename || '').trim();
    if (!targetName) {
      setSaveError('File name is required.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const frameCount = Math.max(0, endSample - startSample);
      const channelCount = audioBuffer.numberOfChannels;

      const channels = [];
      for (let ch = 0; ch < channelCount; ch += 1) {
        const source = audioBuffer.getChannelData(ch);
        channels.push(source.slice(startSample, endSample));
      }

      if (frameCount === 0) {
        throw new Error('Trimmed selection is empty.');
      }

      const wavBuffer = encodeWavFromChannelData(channels, sampleRate);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      const wavFile = new File([wavBlob], targetName, { type: 'audio/wav' });
      const response = await saveEditedLocalFile(targetName, wavFile);
      setSaveMessage(`Saved ${response.filename}`);
    } catch (err) {
      setSaveError(err.message || 'Failed to save edited file.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="centered-text-container">Loading editor...</div>;
  if (error) return <div className="centered-text-container error-text">{error}</div>;

  return (
    <div className="local-editor-container">
      <div className="local-editor-header-row">
        <div>
          <h1 className="local-editor-title">Edit Local File</h1>
          <p className="local-editor-subtitle">{decodedFilename}</p>
        </div>
        <button className="local-editor-secondary-btn" onClick={() => route('/local-files')}>
          Back to Local Files
        </button>
      </div>

      <div className="local-editor-card">
        <canvas
          ref={canvasRef}
          className="local-editor-waveform"
          width={1200}
          height={220}
        />

        <div className="local-editor-times">
          <span>Start: {formatSeconds(startTime)}</span>
          <span>End: {formatSeconds(endTime)}</span>
          <span>Selection: {formatSeconds(trimDuration)}</span>
          <span>Total: {formatSeconds(duration)}</span>
          <span>Playhead: {formatSeconds(playbackPosition)}</span>
          <span>Selection Time: {formatSeconds(playheadWithinSelection)}</span>
        </div>

        <div className="local-editor-control">
          <label htmlFor="trim-start">Trim Start</label>
          <input
            id="trim-start"
            type="range"
            min="0"
            max={duration}
            step="0.01"
            value={startTime}
            onInput={(e) => {
              const value = parseFloat(e.currentTarget.value || '0');
              setStartTime(Math.min(value, Math.max(0, endTime - 0.05)));
            }}
          />
        </div>

        <div className="local-editor-control">
          <label htmlFor="trim-end">Trim End</label>
          <input
            id="trim-end"
            type="range"
            min="0"
            max={duration}
            step="0.01"
            value={endTime}
            onInput={(e) => {
              const value = parseFloat(e.currentTarget.value || '0');
              setEndTime(Math.max(value, Math.min(duration, startTime + 0.05)));
            }}
          />
        </div>

        <div className="local-editor-actions">
          <button className="local-editor-primary-btn" onClick={handlePlaySelection} disabled={playingSelection || trimDuration <= 0}>
            {playingSelection ? 'Playing...' : 'Play Selection'}
          </button>
          <button className="local-editor-secondary-btn" onClick={stopPlayback} disabled={!playingSelection}>
            Stop
          </button>
        </div>
      </div>

      <div className="local-editor-save-card">
        <label htmlFor="save-filename">Save As</label>
        <input
          id="save-filename"
          type="text"
          value={saveFilename}
          onInput={(e) => setSaveFilename(e.currentTarget.value)}
          placeholder="trimmed-audio.wav"
        />
        <button className="local-editor-primary-btn" onClick={handleSave} disabled={saving || trimDuration <= 0}>
          {saving ? 'Saving...' : 'Save Trimmed Audio'}
        </button>
      </div>

      {saveError && <div className="local-editor-error">{saveError}</div>}
      {saveMessage && <div className="local-editor-success">{saveMessage}</div>}
    </div>
  );
};

export default LocalFileEditorView;
