export const siteSections = [
  { label: '学习', path: 'knowledge' },
  { label: '展示', path: 'showcase' },
  { label: '常用网站', path: 'links' },
  { label: '音乐电台', path: 'music' },
  { label: '关于我', path: 'about' },
  { label: '留言墙', path: 'guestbook' },
] as const;

/** A section landing page and one of its descendants are different destinations. */
export function sectionCurrent(pathname: string, href: string): 'page' | 'location' | undefined {
  if (pathname === href) return 'page';
  if (pathname.startsWith(href)) return 'location';
  return undefined;
}
