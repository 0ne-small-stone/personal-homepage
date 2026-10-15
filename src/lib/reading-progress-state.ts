export interface ReadingProgress {
  version: 1;
  block: number;
  signature: string;
  fraction: number;
  gap: number;
  ratio: number;
  start: boolean;
  heading?: string;
}

export function readingSignature(text: string): string {
  let hash = 2166136261;
  for (const char of text.replace(/\s+/g, ' ').trim()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function parseReadingProgress(raw: string | null): ReadingProgress | undefined {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || value.version !== 1 || !Number.isInteger(value.block) || value.block < 0 || value.block > 100_000 ||
      typeof value.signature !== 'string' || !/^[a-f0-9]{8}$/.test(value.signature) ||
      !Number.isFinite(value.fraction) || value.fraction < 0 || value.fraction > 1 ||
      !Number.isFinite(value.gap) || value.gap < 0 || value.gap > 10_000 ||
      !Number.isFinite(value.ratio) || value.ratio < 0 || value.ratio > 1 || typeof value.start !== 'boolean' ||
      (value.heading !== undefined && (typeof value.heading !== 'string' || value.heading.length > 200))) return;
    return value;
  } catch { return; }
}

export function shouldResumeReading(hash: string, navigationType?: string, persisted = false): boolean {
  if (persisted || navigationType === 'traverse') return false;
  try {
    const fragment = decodeURIComponent(hash.replace(/^#/, ''));
    return fragment === '' || fragment === '_top';
  } catch { return false; }
}

export function readingBlockIndex(signatures: string[], progress: ReadingProgress): number | undefined {
  if (signatures[progress.block] === progress.signature) return progress.block;
  let closest: number | undefined;
  signatures.forEach((signature, index) => {
    if (signature === progress.signature && (closest === undefined || Math.abs(index - progress.block) < Math.abs(closest - progress.block))) closest = index;
  });
  return closest;
}
