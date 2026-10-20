export const websiteCategories = [
  { id: 'learning', name: '课程与学习', icon: 'book', note: '学习，也动手' },
  { id: 'campus', name: '校园入口', icon: 'globe', note: '在浙大的日常' },
  { id: 'media', name: '影像与音乐', icon: 'record', note: '看见，也听见' },
  { id: 'work', name: '工作与协作', icon: 'grid', note: '把事情做好' },
] as const;
export type WebsiteCategory = typeof websiteCategories[number]['id'];
export const websiteIcons = ['guitar', 'graduation', 'compass', 'lecture', 'terminal', 'television', 'koala', 'index', 'ice', 'code-book', 'circuit'] as const;
export type WebsiteIconName = typeof websiteIcons[number];
export const websiteBrands = ["learning-in-zju","zjuers","icourse","pta","bilibili","koala-oa","zju-cs-asio","zju-icicles","csdiy","turing-courses"] as const;
export type WebsiteBrandName = typeof websiteBrands[number];
export interface Website {
  id: string;
  name: string;
  url: string;
  description: string;
  category: WebsiteCategory;
  tags?: readonly string[];
  icon: WebsiteIconName;
  featured?: boolean;
  portrait?: 'li-zhi';
  brand?: WebsiteBrandName;
}
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
