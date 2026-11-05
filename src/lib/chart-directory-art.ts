import rising from '../assets/music/charts/directory/rising.webp';
import newMusic from '../assets/music/charts/directory/new.webp';
import original from '../assets/music/charts/directory/original.webp';
import hits from '../assets/music/charts/directory/hits.webp';
import classical from '../assets/music/charts/directory/classical.webp';
import electronic from '../assets/music/charts/directory/electronic.webp';
import rap from '../assets/music/charts/directory/rap.webp';
import chorus from '../assets/music/charts/directory/chorus.webp';
import play from '../assets/music/charts/directory/play.webp';
import sharing from '../assets/music/charts/directory/sharing.webp';
import vinyl from '../assets/music/charts/directory/vinyl.webp';
import world from '../assets/music/charts/directory/world.webp';
import wonder from '../assets/music/charts/directory/wonder.webp';
import journey from '../assets/music/charts/directory/journey.webp';

// Themes follow titles, so changing live ranking order never changes their artwork.
export function directoryPainting(title: string) {
  const name = title.replace(/\s+/g, '');
  if (/小天才|蛋仔/.test(name)) return play;
  if (/车友/.test(name)) return journey;
  if (/ACG|VOCALOID|AI歌曲|星云/.test(name)) return wonder;
  if (/黑胶VIP/.test(name)) return vinyl;
  if (/全球说唱|摇滚/.test(name)) return rap;
  if (/电[音子]|舞曲|DJ|BEAT|Beatport|潮流风向/.test(name)) return electronic;
  if (/韩语|日语|俄语|越南语|泰语|Oricon|UK排行|Billboard|法国|俄罗斯/.test(name)) return world;
  if (/民谣/.test(name)) return journey;
  if (/国风/.test(name)) return newMusic;
  if (/KTV|直播|留名/.test(name)) return chorus;
  if (/赏音/.test(name)) return classical;
  if (/识曲/.test(name)) return vinyl;
  if (/高分新歌|欧美新歌/.test(name)) return newMusic;
  if (/潜力|实时热度/.test(name)) return rising;
  if (/高分榜|R&B/.test(name)) return original;
  if (/热歌|乐夏/.test(name)) return hits;
  return sharing;
}
