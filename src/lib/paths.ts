/** The only custom URL helper; native Starlight routes use its own routing. */
export function sitePath(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const suffix = path.replace(/^\/+|\/+$/g, '');
  return suffix ? `${base}/${suffix}/` : `${base}/`;
}
