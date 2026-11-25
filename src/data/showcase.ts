export type WorkKind = 'project' | 'video' | 'writing';
export interface ShowcaseWork {
  slug: string;
  title: string;
  kind: WorkKind;
  discipline: string;
  period: string;
  status: string;
  description: string;
  cover: string;
  coverNote: string;
  coverSize?: { width: number; height: number };
  contribution?: string;
  sections: { title: string; paragraphs: string[] }[];
  destination?: { label: string; path: string; hash?: string };
  video?: { bvid: string; owner: string; duration: string };
}

const workKinds = [
  { id: 'all', label: '全部' },
  { id: 'project', label: '项目' },
  { id: 'video', label: '视频' },
  { id: 'writing', label: '文字' },
] as const;

export function publishedWorkFilters(works: readonly Pick<ShowcaseWork, 'kind'>[]) {
  return workKinds.map(({ id, label }) => ({
    id, label, count: id === 'all' ? works.length : works.filter(work => work.kind === id).length,
  })).filter(kind => kind.id === 'all' || kind.count > 0);
}

// Project facts come from profile.ts; video roles were confirmed by the user on 2026-10-16.
// A personal contribution does not imply ownership of the publishing account or footage.
export const showcaseWorks: ShowcaseWork[] = [
  {
    slug: 'opening-performance', title: '如果说开幕式唱《国际歌》呢？', kind: 'video',
    discipline: '舞台演出 / 乐队统筹与方阵策划', period: 'B站视频', status: '可观看',
    description: '我以乐社社长的身份统筹乐队排练和设备布置，也以班长的身份策划班级方阵。',
    contribution: '乐社社长：乐队排练与设备统筹；班长：班级方阵总策划',
    cover: 'https://i0.hdslb.com/bfs/archive/ca88c983c8b3c9dd5e0c072928a6c909b8572f54.jpg',
    coverSize: { width: 1024, height: 576 },
    coverNote: '封面来自 B站 · lonelyheartsband',
    video: { bvid: 'BV1gu4y1s7YC', owner: 'lonelyheartsband', duration: '03:26' },
    sections: [
      { title: '乐队排练与设备布置', paragraphs: ['作为乐社社长，我统筹乐队排练与设备布置。'] },
      { title: '班级方阵策划', paragraphs: ['我同时担任班长，负责班级方阵的整体策划。'] },
    ],
  },
  {
    slug: 'little-stone-still-here', title: 'Little Stone Still Here', kind: 'project',
    discipline: '个人网站 / 交互设计', period: '2026', status: '持续建造',
    description: '把学习、作品和日常，留在同一个地方。',
    cover: 'prism.svg', coverNote: '本站视觉概念示意',
    contribution: '个人网站的概念、内容与持续建设',
    destination: { label: '进入主页', path: '' },
    sections: [
      { title: '一个可以慢慢认识我的地方', paragraphs: ['Little Stone Still Here 把学习、创作、影像、音乐与日常放在同一个网站里。Afterimage 是其中的作品入口，既容纳项目，也为视频与独立文字保留位置。'] },
      { title: '从空间进入内容', paragraphs: ['首页以玻璃三角体和黑灰空间作为入口，经过影像、音乐与项目，再向白色的 The Wall 展开。不同栏目保留各自的观看和阅读方式，共同连接回这个入口。', '展示画面可以有空间感，真正阅读时则需要清楚的标题、稳定的正文和可返回的路径。这也是 Afterimage 展览与目录两种浏览方式的出发点。'] },
      { title: '还在生长', paragraphs: ['网站正在分功能建设与体验调整。本页描述目前的设计方向，不把尚未接入的个人内容或后续功能写成已经完成。'] },
    ],
  },
  {
    slug: 'the-wolf', title: '抽象艺术巅峰：英语话剧《狼》·蒲松龄', kind: 'video',
    discipline: '话剧 / 导演与主演', period: 'B站视频', status: '可观看',
    description: '把《狼》搬进英语话剧的现场。',
    contribution: '导演 / 主演',
    cover: 'https://i0.hdslb.com/bfs/archive/8c7ce9bc4feb7b741f3368d24ff6f75066d61ebb.jpg',
    coverNote: '封面来自 B站 · M42_THU',
    video: { bvid: 'BV1tU411o7Na', owner: 'M42_THU', duration: '07:06' },
    sections: [{ title: '从导演到台前', paragraphs: ['在这部英语话剧《狼》中，我担任导演，也作为主演参与演出。'] }],
  },
  {
    slug: 'suikong-desk', title: '随控 Desk', kind: 'project',
    discipline: '智能桌搭 / 产品与品牌', period: '2026.04 — 至今', status: '推进中',
    description: '为开发、剪辑和日常工作设计的桌面控制器，用可视快捷键和旋钮操作，按任务切换预设。',
    cover: 'desk.svg', coverNote: '原创视觉示意，非实物图',
    contribution: '产品定义、品牌设计、软硬件项目管理与商务',
    destination: { label: '查看我的项目经历', path: 'zh/about', hash: 'experience-suikong' },
    sections: [
      { title: '为什么按任务切换预设', paragraphs: ['写代码和剪录屏可能发生在同一张桌子上，两件事需要的常用操作却不同。随控 Desk（Flow Desk）把这些操作组织成预设。换一项任务，人仍然用手边的快捷键和旋钮，控件的用途随预设改变。'] },
      { title: '我在项目中负责什么', paragraphs: ['我发起了随控 Desk，负责产品定义和品牌设计。项目里有软件和硬件两部分，我负责协调两边的开发进度，也负责商务对接。'] },
      { title: '一次中断之后', paragraphs: ['一位核心成员离开后，硬件研发一度停了下来。我开始补 PCB 和结构设计的知识，也在寻找新的工程伙伴。这次中断让我重新考虑如何交接工作，让团队里接手的人也能了解关键方案的取舍。'] },
    ],
  },
  {
    slug: 'independent-game', title: '独立游戏', kind: 'project',
    discipline: '游戏 / 策划与音乐', period: '2026.02 — 至今', status: '开发中',
    description: '在玩法、声音与想象之间，搭建一个世界。',
    cover: 'game.svg', coverNote: '原创视觉示意，非游戏画面',
    contribution: '数值策划、玩法设计、用户分析与产品定位',
    destination: { label: '了解我的项目经历', path: 'zh/about', hash: 'experience-game' },
    sections: [
      { title: '和伙伴一起做游戏', paragraphs: ['与伙伴面向 Steam 开发独立游戏，小石参与数值策划、玩法设计、用户分析和产品定位。'] },
      { title: '声音也是其中一部分', paragraphs: ['配乐编曲与音效设计是后续计划参与的工作。目前不把这些计划写成已经完成的音乐成品。'] },
      { title: '还没有公开的世界', paragraphs: ['游戏名称、玩法影像与公开体验地址尚未整理。本页封面仅是抽象视觉示意，不代表游戏的实际美术或关卡。'] },
    ],
  },
  {
    slug: 'inspection-robot', title: '智联电卫', kind: 'project',
    discipline: '机器人 / 原型与表达', period: '2025.11 — 2026.10', status: '项目记录',
    description: '让一个设想，走向能够制作和测试的原型。',
    cover: 'robot.svg', coverNote: '原创视觉示意，非实物图',
    contribution: '商业计划书、路演设计、初代外壳制作与测试',
    destination: { label: '了解我的项目经历', path: 'zh/about', hash: 'experience-robot' },
    sections: [
      { title: '电网巡检机器人', paragraphs: ['智联电卫是面向企业与政府的电网巡检机器人项目。小石参与项目组工作，负责商业计划书、路演演示设计，以及初代外壳制作与测试。'] },
      { title: '从表达走向制作', paragraphs: ['这一段经历同时涉及项目表达与实体原型。当前仅整理已确认的个人参与范围，未公开的技术指标、产品照片与商业材料不在本页补写。'] },
    ],
  },
];

export function workImageSize(work: ShowcaseWork) {
  const size = work.coverSize || { width: 1600, height: 900 };
  if (![size.width, size.height].every(value => Number.isFinite(value) && value > 0)) throw new Error('Invalid cover size');
  return { ...size, format: size.width / size.height < .85 ? 'portrait' : size.width / size.height < 1.2 ? 'square' : 'landscape' };
}

export function workCover(work: ShowcaseWork, base: string) {
  return work.cover.startsWith('https://') ? work.cover : `${base.replace(/\/$/, '')}/showcase/covers/${work.cover}`;
}

export function videoSource(bvid: string) {
  if (!/^BV[0-9A-Za-z]{10}$/.test(bvid)) throw new Error('Invalid B站 video ID');
  return `https://player.bilibili.com/player.html?bvid=${bvid}&p=1&autoplay=0&danmaku=0&poster=1`;
}
