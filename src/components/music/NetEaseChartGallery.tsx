import { useState } from 'react';
import type { NetEaseCard } from '../../lib/netease-core';
import AlbumArtwork from './AlbumArtwork';
import rising from '../../assets/music/charts/chart-rising.webp';
import newMusic from '../../assets/music/charts/chart-new.webp';
import original from '../../assets/music/charts/chart-original.webp';
import hits from '../../assets/music/charts/chart-hits.webp';
import classical from '../../assets/music/charts/chart-classical.webp';
import electronic from '../../assets/music/charts/chart-electronic.webp';
import rap from '../../assets/music/charts/chart-rap.webp';
import chorus from '../../assets/music/charts/chart-chorus.webp';
import '../../styles/music-chart-gallery.css';

const paintings: Record<string, { src: string; caption: string }> = {
  '飙升榜': { src: rising.src, caption: '向上，听见新的浪潮' },
  '新歌榜': { src: newMusic.src, caption: '新声音，正在盛开' },
  '原创榜': { src: original.src, caption: '让灵感，自由生长' },
  '热歌榜': { src: hits.src, caption: '此刻，一起随声起舞' },
  '网易云古典榜': { src: classical.src, caption: '弦与弓之间的诗' },
  '网易云电音榜': { src: electronic.src, caption: '身体，跟着节拍走' },
  '网易云中文说唱榜': { src: rap.src, caption: '把态度，唱进节奏' },
  '荣耀音乐热歌榜': { src: chorus.src, caption: '让每一种声音相遇' },
};

function ChartPainting({ item, src }: { item: NetEaseCard; src: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="ne-chart-painting" aria-hidden="true">
    {failed
      ? <AlbumArtwork src={item.coverUrl} title={item.title} artist={item.subtitle} />
      : <img src={src} alt="" width={1254} height={1254} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
  </span>;
}

export default function NetEaseChartGallery({ items, onSelect }: {
  items: NetEaseCard[];
  onSelect: (item: NetEaseCard) => void;
}) {
  const featured = items.filter(item => Object.hasOwn(paintings, item.title));
  const more = items.filter(item => !Object.hasOwn(paintings, item.title));
  return <div className="ne-chart-gallery">
    {featured.length > 0 && <ul className="ne-chart-paintings" aria-label="精选排行榜">
      {featured.map(item => <li key={`${item.kind}:${item.id}`}>
        <button type="button" className="ne-chart-card" aria-label={`打开${item.title}`} onClick={() => onSelect(item)}>
          <ChartPainting item={item} src={paintings[item.title].src} />
          <span className="ne-chart-caption"><strong>{item.title}</strong><span aria-hidden="true">↗</span></span>
          <small>{paintings[item.title].caption}</small>
        </button>
      </li>)}
    </ul>}
    {more.length > 0 && <section className="ne-chart-more" aria-labelledby="ne-chart-more-title">
      <div className="ne-chart-more-heading"><h2 id="ne-chart-more-title">更多榜单</h2><span>{more.length} 个榜单</span></div>
      <ul className="ne-chart-directory">
        {more.map(item => <li key={`${item.kind}:${item.id}`}>
          <button type="button" className="ne-chart-directory-item" aria-label={`打开${item.title}`} onClick={() => onSelect(item)}>
            <span className="ne-chart-directory-art" aria-hidden="true"><AlbumArtwork src={item.coverUrl} title={item.title} artist={item.subtitle} /></span>
            <span className="ne-chart-directory-copy"><strong>{item.title}</strong><small>{item.count > 0 ? `${item.count} 首歌曲` : '探索榜单'}</small></span>
            <span className="ne-chart-directory-arrow" aria-hidden="true">↗</span>
          </button>
        </li>)}
      </ul>
    </section>}
  </div>;
}
