export const websiteCategories = [
  { id: 'learning', name: '课程与学习', icon: 'book', note: '学习，也动手' },
  { id: 'campus', name: '校园入口', icon: 'globe', note: '在浙大的日常' },
  { id: 'media', name: '影像与音乐', icon: 'record', note: '看见，也听见' },
  { id: 'work', name: '工作与协作', icon: 'grid', note: '把事情做好' },
] as const;
export type WebsiteCategory = typeof websiteCategories[number]['id'];
export type WebsiteIconName = 'guitar' | 'graduation' | 'compass' | 'lecture' | 'terminal' | 'television' | 'koala' | 'index' | 'ice' | 'code-book' | 'circuit';
export interface Website {
  id: string;
  name: string;
  url: string;
  description: string;
  category: WebsiteCategory;
  tags?: readonly string[];
  icon: WebsiteIconName;
  featured?: boolean;
}
// User supplied these eleven URLs on 2026-10-16. Preserve paths and query strings.
export const websites: readonly Website[] = [
  { id: 'aboutbb', name: 'aboutbb', url: 'https://www.lizhinb.com/', description: '关于李志的记忆。音乐、演出影像与相关资料。', category: 'media', tags: ['李志', '音乐', '演出', '视频'], icon: 'guitar' },
  { id: 'learning-in-zju', name: '学在浙大', url: 'https://course.zju.edu.cn/learninginzju?locale=zh-CN', description: '浙江大学课程学习入口，回到正在进行的学习。', category: 'learning', tags: ['ZJU', '浙江大学', '课程', '学习'], icon: 'graduation' },
  { id: 'zjuers', name: 'ZJUers 轻首页', url: 'https://zjuers.com/', description: '浙江大学专属导航，把校园常用入口放在一起。', category: 'campus', tags: ['浙江大学', '校园', '导航'], icon: 'compass' },
  { id: 'icourse', name: '中国大学 MOOC', url: 'https://www.icourse163.org/', description: '高校在线课程。从感兴趣的主题，开始一门课。', category: 'learning', tags: ['慕课', '网课', '学习', 'MOOC'], icon: 'lecture' },
  { id: 'pta', name: 'PTA', url: 'https://pintia.cn/home', description: '程序设计类实验辅助教学平台，练习代码与解题。', category: 'learning', tags: ['编程', '算法', '代码', '练习', '拼题A'], icon: 'terminal' },
  { id: 'bilibili', name: '哔哩哔哩', url: 'https://www.bilibili.com/', description: '视频、音乐与感兴趣的内容，换一个视角看看。', category: 'media', tags: ['B站', 'bilibili', '视频', '音乐'], icon: 'television' },
  { id: 'koala-oa', name: '考拉工作室 OA', url: 'https://oa.koala-studio.org.cn/', description: '考拉工作室的 OA 入口。', category: 'work', tags: ['考拉', '办公', '协作', 'OA'], icon: 'koala' },
  { id: 'zju-cs-asio', name: 'ZJU CS · All Sum in One', url: 'https://isshikihugh.github.io/zju-cs-asio/', description: '浙大计算机学习资料索引，连接课程笔记、教程与学生组织资源。', category: 'learning', tags: ['浙江大学', '计算机', '课程', '笔记', 'ASIO'], icon: 'index' },
  { id: 'zju-icicles', name: '浙大课程攻略共享计划', url: 'https://qsctech.github.io/zju-icicles/', description: '浙江大学课程攻略与共享资料，查找课程相关经验。', category: 'learning', tags: ['浙江大学', '课程', '攻略', '资料', 'icicles'], icon: 'ice' },
  { id: 'csdiy', name: 'CS 自学指南', url: 'https://csdiy.wiki/', description: '计算机自学指南，沿着课程与主题探索学习路线。', category: 'learning', tags: ['计算机', 'CS', '自学', '课程', '路线'], icon: 'code-book' },
  { id: 'turing-courses', name: '图灵班学习指南', url: 'https://zju-turing.github.io/TuringCourses/', description: '图灵班课程学习指南，查看课程内容与学习经验。', category: 'learning', tags: ['浙江大学', '图灵', '课程', 'TuringCourses'], icon: 'circuit' },
];
export function websiteDomain(url: string): string { return new URL(url).hostname.replace(/^www\./, ''); }
export function searchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('zh-CN').trim().replace(/\s+/gu, ' ');
}
export function websiteSearchText(site: Website): string {
  return searchText([site.name, websiteDomain(site.url), site.description, ...(site.tags ?? [])].join(' '));
}
export function matchesWebsite(text: string, query: string): boolean {
  return searchText(query).split(' ').filter(Boolean).every(word => text.includes(word));
}
export function readWebsiteFilter(url: URL) {
  const category = url.searchParams.get('category') ?? 'all';
  return { category: websiteCategories.some(item => item.id === category) ? category : 'all', query: (url.searchParams.get('q') ?? '').slice(0, 160) };
}
export function validateWebsites(entries: readonly Website[]): void {
  const ids = new Set<string>(); const urls = new Set<string>();
  for (const entry of entries) {
    const url = new URL(entry.url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`Invalid website protocol: ${entry.id}`);
    if (url.username || url.password) throw new Error(`Website URL contains credentials: ${entry.id}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || ids.has(entry.id)) throw new Error(`Invalid or duplicate website ID: ${entry.id}`);
    if (urls.has(url.href)) throw new Error(`Duplicate website URL: ${entry.id}`);
    if (!entry.name.trim() || !entry.description.trim() || !websiteCategories.some(item => item.id === entry.category)) throw new Error(`Incomplete website: ${entry.id}`);
    ids.add(entry.id); urls.add(url.href);
  }
}
