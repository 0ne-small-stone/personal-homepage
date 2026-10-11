import type { APIRoute } from 'astro';
import { loadMusicCatalog } from '../../lib/music-server';

export const GET: APIRoute = async () => new Response(JSON.stringify(await loadMusicCatalog()), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' },
});
