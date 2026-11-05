import {useEffect, useRef, type ReactNode} from 'react';
import {mountMusicSidebarScroll} from '../../lib/music-sidebar-scroll';
import '../../styles/music-sidebar-scroll.css';

export default function MusicSidebarScroll({children}: {children: ReactNode}) {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => frame.current ? mountMusicSidebarScroll(frame.current) : undefined, []);
  return <div className="ne-sidebar-scroll" ref={frame}>{children}</div>;
}
