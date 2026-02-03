export const formatDuration = (duration) => {
  if (duration == null) return 'unknown';

  const raw = String(duration).trim();
  if (raw.length === 0) return 'unknown';
  if (raw.toLowerCase() === 'unknown') return 'unknown';

  const normalized = raw.replace(/\s*(s|sec|secs|seconds)\s*$/i, '');
  const seconds = Number.parseFloat(normalized);

  if (!Number.isFinite(seconds)) return raw;

  if (seconds > 60) {
    const minutes = seconds / 60;
    const formatted = minutes.toFixed(1).replace(/\.0$/, '');
    return `${formatted} min`;
  }

  const formatted = seconds.toFixed(1).replace(/\.0$/, '');
  return `${formatted}s`;
};
