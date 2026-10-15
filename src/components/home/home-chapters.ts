export const homeChapters = [
  { id: 'intro', label: '序章', title: 'Little Stone Still Here' },
  { id: 'album', label: '相册', title: 'A Moment Remains', description: '把目光停留过的地方，慢慢收集起来。', action: '浏览相册', path: 'gallery' },
  { id: 'radio', label: '音乐', title: 'Echoes', description: '有些声音，会在很久以后再次响起。', action: '进入音乐电台', path: 'music' },
  { id: 'projects', label: '项目', title: 'Afterimage', description: '从一个念头，到可以触碰的东西。', action: '浏览项目与作品', path: 'showcase' },
  { id: 'wall', label: '留言墙', title: 'The Wall' },
] as const;
export type ChapterId = typeof homeChapters[number]['id'];
export const homeWorkChapters = homeChapters.filter(chapter => 'path' in chapter);
export const photoCredit = { author: 'Annie Spratt', url: 'https://unsplash.com/photos/a-black-and-white-photo-of-the-ocean-waves-D_JoXCsiRW4' };
export const selectedLinks = [
  { title: 'Awwwards', detail: '设计与交互', url: 'https://www.awwwards.com/' },
  { title: 'React Bits', detail: '动效组件', url: 'https://reactbits.dev/' },
  { title: 'CS 自学指南', detail: '学习与探索', url: 'https://csdiy.wiki/' },
];
