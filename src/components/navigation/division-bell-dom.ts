import { divisionBellGlyph } from './division-bell-glyph';
import { installDivisionBellReturn } from './division-bell-return';
import '../../styles/division-bell-return.css';

/** Preserve the existing element, href, ID and business handlers. Install before binding new handlers. */
export function decorateDivisionBellReturn(control: HTMLElement, { label, compact = false, iconOnly = false }: { label: string; compact?: boolean; iconOnly?: boolean }) {
  control.classList.add('db-return');
  control.toggleAttribute('data-compact', compact);
  control.toggleAttribute('data-icon-only', iconOnly);
  if (iconOnly) control.removeAttribute('title');
  const icon = control.ownerDocument.createElement('span'); icon.className = 'db-return-glyph-slot';
  icon.innerHTML = divisionBellGlyph(crypto.randomUUID());
  const word = control.ownerDocument.createElement('span'); word.className = 'db-return-label'; word.dataset.db = 'word'; word.textContent = label; word.hidden = iconOnly;
  control.replaceChildren(icon, word); control.setAttribute('aria-label', label);
  return installDivisionBellReturn(control);
}
export function updateDivisionBellReturnLabel(control: HTMLElement, label: string, ariaLabel = label) {
  const word = control.querySelector<HTMLElement>('.db-return-label');
  if (word) { word.textContent = label; word.hidden = control.hasAttribute('data-icon-only'); }
  control.setAttribute('aria-label', ariaLabel);
}
