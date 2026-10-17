import { immersivePdfShortcut, type PdfShortcut } from './immersivePdfShortcuts.ts';

// The viewer has its own Window and editable controls. Capture before its native
// handlers, and use keyup when an IME consumes or obscures the initial keydown.
export function bindImmersivePdfInput(doc: Document, options: {
  signal: AbortSignal;
  active(): boolean;
  run(shortcut: PdfShortcut): void;
}) {
  const target = doc.defaultView ?? doc;
  const handled = new Set<string>();
  const identity = (event: KeyboardEvent) => event.code || String((event as { keyCode?: number }).keyCode || event.key);
  const editing = (event: KeyboardEvent) => {
    const element = event.target as Element | null;
    if (element?.nodeType !== 1) return false;
    const field = element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    // A hidden PDF toolbar can retain focus. It must not swallow reading keys.
    return !!field && field.getClientRects().length > 0;
  };
  const down = (event: KeyboardEvent) => {
    if (options.signal.aborted) return;
    if (!options.active() || editing(event) || event.ctrlKey || event.metaKey || event.altKey) { handled.add(identity(event)); return; }
    const shortcut = immersivePdfShortcut(event);
    // An unrecognized IME keydown is not a handled command: its keyup may
    // supply the first usable F/digit identity.
    if (!shortcut) { handled.delete(identity(event)); return; }
    handled.add(identity(event));
    event.preventDefault(); event.stopImmediatePropagation();
    options.run(shortcut);
  };
  const up = (event: KeyboardEvent) => {
    if (handled.delete(identity(event))) return;
    if (options.signal.aborted || !options.active() || editing(event)) return;
    const shortcut = immersivePdfShortcut(event);
    if (!shortcut) return;
    event.preventDefault(); event.stopImmediatePropagation();
    options.run(shortcut);
  };
  const clear = () => handled.clear();
  const stop = () => {
    target.removeEventListener('keydown', down as EventListener, { capture: true });
    target.removeEventListener('keyup', up as EventListener, { capture: true });
    target.removeEventListener('blur', clear);
    clear();
  };
  if (options.signal.aborted) return;
  target.addEventListener('keydown', down as EventListener, { capture: true });
  target.addEventListener('keyup', up as EventListener, { capture: true });
  target.addEventListener('blur', clear);
  options.signal.addEventListener('abort', stop, { once: true });
}
