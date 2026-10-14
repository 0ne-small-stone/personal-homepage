import { useState } from 'react';

export default function AlbumArtwork({ src, title, artist, className = '' }: { src?: string | null; title: string; artist: string; className?: string }) {
  const [failed, setFailed] = useState('');
  return <span className={`album-artwork ${className}`}>
    {src && failed !== src ? <img src={src} alt={`${title} 专辑封面`} loading="lazy" onError={() => setFailed(src)} /> : <span className="album-artwork-fallback"><span>{artist.slice(0, 1) || '♪'}</span><strong>{title}</strong><small>{artist}</small></span>}
  </span>;
}
