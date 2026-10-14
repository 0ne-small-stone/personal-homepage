interface ReadingKey {
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}
type PdfShortcut = { kind: 'fit' | 'free' } | { kind: 'mode'; columns: number };

export function immersivePdfShortcut(event: ReadingKey): PdfShortcut | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  // An IME may report key="Process" while code still identifies the physical key.
  if (event.code === 'KeyF' || event.key.toLowerCase() === 'f') return { kind: 'fit' };
  if (event.shiftKey) return;
  const digit = /^(?:Digit|Numpad)([0-9])$/.exec(event.code)?.[1]
    ?? (/^[0-9]$/.test(event.key) ? event.key : undefined);
  if (digit === undefined) return;
  const columns = Number(digit);
  return columns >= 1 && columns <= 4 ? { kind: 'mode', columns } : { kind: 'free' };
}
