import {useEffect, useRef, useState} from 'react';
import InviteMark from '../navigation/InviteMark';
import {mountInviteMarks} from '../../lib/invite-motion';
import type {NetEaseView} from '../../lib/netease-core';
import dailyArt from '../../assets/music/jazz/jazz-daily.webp?url';
import heartArt from '../../assets/music/jazz/jazz-heart.webp?url';
import roamArt from '../../assets/music/jazz/jazz-roam.webp?url';
import '../../styles/music-feature-cards.css';

type FeatureView = Extract<NetEaseView, 'daily' | 'heart' | 'fm'>;
const features = [
  {view: 'daily', title: '每日推荐', caption: '每天，新的聆听', artwork: dailyArt},
  {view: 'heart', title: '心动模式', caption: '从喜欢，听见更多', artwork: heartArt},
  {view: 'fm', title: '私人漫游', caption: '让下一首自然发生', artwork: roamArt},
] satisfies {view: FeatureView; title: string; caption: string; artwork: string}[];

function ModeArtwork({artwork}: {artwork: string}) {
  const [failed, setFailed] = useState(false);
  return <span className={`ne-mode-art${failed ? ' is-unavailable' : ''}`} aria-hidden="true">
    {!failed && <img src={artwork} alt="" width="1254" height="1254" decoding="async" onError={() => setFailed(true)} />}
  </span>;
}

export default function NetEaseFeatureCards({onSelect}: {onSelect: (view: FeatureView) => void}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => root.current ? mountInviteMarks(root.current) : undefined, []);
  return <div className="ne-listening-modes" ref={root}>
    <ul className="ne-listening-grid">
      {features.map(feature => <li key={feature.view}>
        <button type="button" className={`ne-listening-mode ne-listening-mode-${feature.view}`} onClick={() => onSelect(feature.view)} aria-label={`打开${feature.title}`}>
          <ModeArtwork artwork={feature.artwork} />
          <span className="ne-listening-meta">
            <span className="ne-listening-copy"><strong>{feature.title}</strong><span>{feature.caption}</span></span>
            <span className="ne-listening-arrow" aria-hidden="true"><InviteMark /></span>
          </span>
        </button>
      </li>)}
    </ul>
  </div>;
}
