// Match existing local previews unless the Pages workflow or a local test supplies a site URL.
export const pagesSite = new URL(process.env.PAGES_SITE_URL || 'https://0ne-small-stone.github.io/personal-homepage/');
export const pagesBase = pagesSite.pathname.replace(/\/?$/, '/');
