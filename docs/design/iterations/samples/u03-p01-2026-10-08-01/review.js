if (new URLSearchParams(location.search).has('export')) {
  document.body.classList.add('export');
  document.querySelector('footer p').textContent = '黑底 · 单色 · 16 / 24 / 48px 对照';
}
document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById('detail-' + button.dataset.open);
    dialog.showModal();
    dialog.addEventListener('close', () => button.focus(), { once: true });
  });
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});
const theme = document.getElementById('theme');
theme.addEventListener('click', () => {
  const light = document.body.classList.toggle('light');
  theme.textContent = light ? '切换深底' : '切换浅底';
  theme.setAttribute('aria-pressed', String(light));
});
