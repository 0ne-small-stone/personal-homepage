interface DialogScope {
  owners: Set<HTMLDialogElement>;
  body: HTMLElement;
  overflow: string;
  priority: string;
  origin: HTMLElement | null;
}
const scopes = new WeakMap<Document, DialogScope>();

/** React bubbles cancel synthetically; dismiss only the current native window. */
export function cancelNativeDialog(event: Pick<Event, 'preventDefault' | 'stopPropagation'>, dismiss: () => void) {
  event.preventDefault();
  event.stopPropagation();
  dismiss();
}

/** Native dialog owns modal focus/inert behavior. This only adapts its lifetime. */
export function mountNativeDialog(dialog: HTMLDialogElement, initialFocus?: HTMLElement | null): () => void {
  if (!dialog.isConnected || dialog.open) return () => {};
  const doc = dialog.ownerDocument;
  const origin = doc.activeElement instanceof doc.defaultView!.HTMLElement ? doc.activeElement : null;
  let scope = scopes.get(doc);
  if (!scope || scope.body !== doc.body) {
    scope = { owners: new Set(), body: doc.body, overflow: doc.body.style.getPropertyValue('overflow'), priority: doc.body.style.getPropertyPriority('overflow'), origin };
    scopes.set(doc, scope);
    doc.body.style.setProperty('overflow', 'hidden');
  }
  const owner = scope;
  owner.owners.add(dialog);
  let disposed = false;
  const restore = () => {
    if (disposed) return;
    disposed = true;
    owner.owners.delete(dialog);
    if (dialog.open) dialog.close();
    if (!owner.owners.size) {
      if (owner.overflow) owner.body.style.setProperty('overflow', owner.overflow, owner.priority);
      else owner.body.style.removeProperty('overflow');
      if (scopes.get(doc) === owner) scopes.delete(doc);
    }
    if (doc.body !== owner.body) return;
    const available = (target: HTMLElement | null) => target?.isConnected && !target.closest('[hidden], [inert], dialog:not([open])');
    const target = available(origin) ? origin : owner.owners.size ? null : owner.origin;
    if (!available(target)) return;
    if ([...owner.owners].some(other => other.open && other.isConnected && !other.contains(target))) return;
    const activeDialog = doc.activeElement?.closest('dialog[open]');
    if (activeDialog && !activeDialog.contains(target)) return;
    target!.focus({ preventScroll: true });
  };
  try {
    dialog.showModal();
    initialFocus?.focus({ preventScroll: true });
  } catch (error) { restore(); throw error; }
  return restore;
}
