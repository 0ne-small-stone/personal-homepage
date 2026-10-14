export const musicConfig = {
  cloudUrl: 'https://pan.koala-studio.org.cn/',
  lxInstallUrl: 'https://github.com/lyswhut/lx-music-desktop/releases',
  lxSourceUrl: 'https://github.com/guoyue2010/lxmusic-/releases',
  playlistId: '18476425375',
  playlistUrl: 'https://music.163.com/#/playlist?id=18476425375',
  playlistEmbedUrl: 'https://music.163.com/outchain/player?type=0&id=18476425375&auto=0&height=430',
  // A remote catalog must allow this site's origin. Keep account credentials server-side.
  catalogUrl: import.meta.env.PUBLIC_MUSIC_CATALOG_URL || `${import.meta.env.BASE_URL}music/catalog.json`,
  recommendationApi: import.meta.env.PUBLIC_MUSIC_RECOMMENDATION_API || `${import.meta.env.BASE_URL}api/music`,
};
