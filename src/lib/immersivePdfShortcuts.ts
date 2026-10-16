interface ReadingKey {
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  keyCode?: number;
}
export type PdfShortcut = { kind: 'fit' | 'free' } | { kind: 'mode'; columns: number };

export function immersivePdfShortcut(event: ReadingKey): PdfShortcut | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  // An IME may report key="Process" while code still identifies the physical key.
  if (event.code === 'KeyF' || event.key.toLowerCase() === 'f' || (!event.code && event.keyCode === 70)) return { kind: 'fit' };
  if (event.shiftKey) return;
  if (event.code.startsWith('Numpad') && !/^[0-9]$/.test(event.key)
    && !['Process', 'Unidentified'].includes(event.key)) return;
  const digit = /^(?:Digit|Numpad)([0-9])$/.exec(event.code)?.[1]
    ?? (/^[0-9]$/.test(event.key) ? event.key : undefined)
    ?? (!event.code && event.keyCode && event.keyCode >= 48 && event.keyCode <= 57 ? String(event.keyCode - 48) : undefined)
    ?? (!event.code && event.keyCode && event.keyCode >= 96 && event.keyCode <= 105 ? String(event.keyCode - 96) : undefined);
  if (digit === undefined) return;
  const columns = Number(digit);
  return columns >= 1 && columns <= 4 ? { kind: 'mode', columns } : { kind: 'free' };
}
