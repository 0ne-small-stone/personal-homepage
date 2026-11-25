type MusicMode = 'cloud' | 'netease';

export function musicEntryMode(url: URL, source: MusicMode | undefined, development: boolean): MusicMode {
  const mode = url.searchParams.get('mode');
  if (mode === 'cloud' || mode === 'netease') return mode;
  const view = url.searchParams.get('view');
  if (view === 'discover' || view === 'songs' || view === 'albums' || url.hash === '#radio-download') return 'cloud';
  return source ?? (development ? 'cloud' : 'netease');
}

export function listeningModeLoginPrompt(view: string, authorized: boolean, persistenceError?: string) {
  if (authorized) return '';
  const names = {daily: '每日推荐', heart: '心动模式', fm: '私人漫游'} as const;
  if (!Object.hasOwn(names, view)) return '';
  if (persistenceError?.includes('登录已失效')) return '网易云登录已失效，请重新扫码。';
  return `登录网易云后即可使用${names[view as keyof typeof names]}。`;
}
