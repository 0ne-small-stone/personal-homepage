// Reuse PDF.js's native toggle so visibility, aria and saved view stay in sync.
const panel = document.getElementById('viewsManager');
const toggle = document.getElementById('viewsManagerToggleButton');

if (panel && toggle) {
  const syncToggleLabel = () => {
    const label = toggle.getAttribute('aria-expanded') === 'true'
      ? '返回 PDF 正文'
      : '打开 PDF 侧栏';
    toggle.title = label;
    toggle.setAttribute('aria-label', label);
    toggle.querySelector('span').textContent = label;
  };
  syncToggleLabel();
  // Native PDF.js owns visibility and aria-expanded, including saved sidebar state.
  new MutationObserver(syncToggleLabel).observe(toggle, {
    attributes: true,
    attributeFilter: ['aria-expanded'],
  });
  const collapse = () => {
    if (panel.hidden) return;
    toggle.click();
    if (panel.hidden) toggle.focus();
  };
  panel.addEventListener('keydown', (event) => {
    // Let a nested view selector consume its first Escape before the sidebar.
    if (event.key !== 'Escape' || event.defaultPrevented || panel.querySelector('[aria-haspopup][aria-expanded="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    collapse();
  }, { capture: true });
}
