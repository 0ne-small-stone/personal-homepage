import type {CSSProperties} from 'react';
import type {NetEaseView} from '../../lib/netease-core';
import '../../styles/music-feature-cards.css';

type FeatureView = Extract<NetEaseView, 'daily' | 'heart' | 'fm'>;

const features = [
  {view: 'daily', title: '每日推荐', caption: '每天，新的聆听', compact: '每日更新', artwork: 'interval-daily.webp', cx: 619.5, cy: 505, height: 651},
  {view: 'heart', title: '心动模式', caption: '从喜欢，听见更多', compact: '依喜好播放', artwork: 'interval-heart.webp', cx: 625, cy: 512, height: 667},
  {view: 'fm', title: '私人漫游', caption: '让下一首，自然发生', compact: '随心发现', artwork: 'interval-roam.webp', cx: 609.5, cy: 486, height: 683},
] satisfies {view: FeatureView; title: string; caption: string; compact: string; artwork: string; cx: number; cy: number; height: number}[];

// Align the visible reliefs, whose margins differ in the original square masters.
function placement({cx, cy, height}: typeof features[number]): CSSProperties {
  const values = (size: number, center: number) => ({
    width: `${1254 * size / height * 100}%`,
    left: `${(0.5 - cx * size / height) * 100}%`,
    top: `${(center - cy * size / height) * 100}%`,
  });
  const desktop = values(.6, .36), mobile = values(.6, .35);
  return {
    '--entry-image-width': desktop.width, '--entry-image-left': desktop.left, '--entry-image-top': desktop.top,
    '--entry-mobile-image-width': mobile.width, '--entry-mobile-image-left': mobile.left, '--entry-mobile-image-top': mobile.top,
  } as CSSProperties;
}

export default function NetEaseFeatureCards({onSelect}: {onSelect: (view: FeatureView) => void}) {
  return <div className="ne-entry-grid">
    {features.map(feature => <button key={feature.view} type="button" className="ne-entry" style={placement(feature)} onClick={() => onSelect(feature.view)}>
      <span className="ne-entry-art" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}music/features/${feature.artwork}`} width="800" height="800" alt="" decoding="async" draggable={false} onError={event => {event.currentTarget.style.visibility = 'hidden';}} />
      </span>
      <span className="ne-entry-copy">
        <strong>{feature.title}</strong>
        <span className="ne-entry-caption">{feature.caption}</span>
        <span className="ne-entry-compact">{feature.compact}</span>
      </span>
      <span className="ne-entry-indicator" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg></span>
    </button>)}
  </div>;
}
