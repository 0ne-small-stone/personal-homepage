import type { APIRoute } from 'astro';
import { musicSummary } from '../../lib/music-payload';
import { loadMusicCatalog } from '../../lib/music-server';

export const GET: APIRoute = async () => new Response(JSON.stringify(musicSummary(await loadMusicCatalog())), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
});
