/** Build multiple instances from the approved six-path asset without changing its geometry. */
export function buildDivisionBellGlyph(source: string, key: string) {
  const id = `db-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const paths = source.match(/<path\b[^>]*\/>/g);
  if (!paths || paths.length !== 6) throw new Error('Division Bell requires the approved six paths');
  return `<svg class="db-return-glyph" viewBox="0 0 160 172" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs><g id="${id}-face" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${paths.slice(0,4).join('')}</g>
    <g id="${id}-pupil-l" fill="currentColor" fill-rule="evenodd">${paths[4]}</g><g id="${id}-pupil-r" fill="currentColor" fill-rule="evenodd">${paths[5]}</g>
    <g id="${id}-portrait"><use href="#${id}-face"/><use href="#${id}-face" transform="translate(160 0) scale(-1 1)"/><use href="#${id}-pupil-l"/><use href="#${id}-pupil-r"/></g></defs>
    <g data-db="echoA" opacity="0"><use href="#${id}-portrait"/></g><g data-db="echoB" opacity="0"><use href="#${id}-portrait"/></g>
    <g data-db="drift"><g class="db-return-left" data-db="left"><use href="#${id}-face"/><g class="db-return-eye-left" data-db="eyeLeft"><use href="#${id}-pupil-l"/></g></g>
    <g class="db-return-right" data-db="right"><use href="#${id}-face" transform="translate(160 0) scale(-1 1)"/><g class="db-return-eye-right" data-db="eyeRight"><use href="#${id}-pupil-r"/></g></g>
    <line data-db="signal" x1="94" y1="134" x2="66" y2="134" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="7 28" stroke-dashoffset="-28" opacity="0"/></g></svg>`;
}
