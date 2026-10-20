import type { APIRoute } from 'astro';
import { loadMusicCatalog } from '../../../lib/music-server';
import { lyricAssetId } from '../../../lib/music-payload';

export async function getStaticPaths() {
  const catalog = await loadMusicCatalog();
  return catalog.tracks.filter(track => track.lyrics).map(track => ({ params: { id: lyricAssetId(track) }, props: { text: track.lyrics } }));
}
export const GET: APIRoute = ({ props }) => new Response(JSON.stringify({ text: props.text }), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' },
});
