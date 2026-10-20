/** Keep the site's session cookie on same-origin music API requests only. */
export function musicApiFetch(input: RequestInfo | URL, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<Response> {
  return fetcher(input, { ...init, credentials: 'same-origin', cache: 'no-store' });
}
