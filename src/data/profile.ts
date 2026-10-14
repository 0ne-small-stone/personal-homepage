/** Public profile, adapted from the user's ITP application and confirmed site identity. */
export interface ProfileExperience {
  id: string;
  period: string;
  title: string;
  role: string;
  paragraphs: string[];
}

export const profile = {
  name: '张轩石',
  nickname: '小石',
  university: '浙江大学',
  major: '软件工程',
  email: '3400489513@qq.com',
  introduction: [
    '我在浙江大学读软件工程，也在尝试把想法变成能用的产品。做软件、设计界面、推进硬件项目，常常需要在不同专业之间找到合适的伙伴。',
    'Little Stone Still Here 是我放下学习、作品和日常的地方。希望这些留下的东西，能让你慢慢认识我。',
  ],
  experiences: [
    { id: 'software', period: '2026.08 — 至今', title: '软件开发与需求对接', role: '互联网初创项目', paragraphs: ['参与面向政府的平台与系统定制，负责需求对接和开发。在真实需求中积累软件实践经验。'] },
    { id: 'suikong', period: '2026.04 — 至今', title: '随控 Desk', role: '项目发起人 / 产品与品牌', paragraphs: ['围绕智能桌搭展开消费电子创业尝试，负责产品定义、品牌设计、软硬件项目管理和商务事务。', '硬件研发曾因核心成员离开而停滞。我一边学习相关知识，一边寻找新的工程伙伴，也开始更认真地处理团队中的知识共享与交接。'] },
    { id: 'game', period: '2026.02 — 至今', title: '独立游戏', role: '项目发起 / 策划与音乐', paragraphs: ['与伙伴面向 Steam 开发游戏，参与数值策划、玩法设计、用户分析和产品定位，后续负责配乐编曲与音效设计。'] },
    { id: 'robot', period: '2025.11 — 2026.10', title: '智联电卫', role: '机器人项目组', paragraphs: ['参与面向企业与政府的电网巡检机器人项目，负责商业计划书、路演演示设计，以及初代外壳制作与测试。'] },
    { id: 'shaoguang', period: '志愿服务', title: '韶光共夕阳', role: '韶光专项队联合创建 / 组织策划', paragraphs: ['参与创建韶光专项队，组织策划40余场助老伴老活动，拓展十余个社区。通过 SQTP 项目，将志愿服务引入班级建设，吸引十余个不同专业的班级参与。', '比起头衔，我更在意一种做法能否继续被别人采用。组织调整时，也需要为新团队和原有伙伴都留下可以继续投入的工作。'] },
  ] satisfies ProfileExperience[],
  capabilities: [
    { title: '软件与制作', items: ['全栈开发', '需求对接', '3D 打印'], description: '从软件实现到原型制作，连接产品的不同部分。' },
    { title: '设计与表达', items: ['UI/UX 设计', '平面与品牌设计', '产品定位'], description: '把需要解决的问题，转成清楚的界面与产品表达。' },
    { title: '项目与协作', items: ['项目管理', '跨专业协作', '资源联络'], description: '把想法拆成工作，找到合适的伙伴，持续跟进。' },
  ],
  learning: 'PCB 与硬件结构设计仍是我需要补足的部分。我在学习理解设计取舍、识别进度风险，也希望让关键方案在团队里充分共享。',
  life: [
    '喜欢 Pink Floyd，也喜欢迷幻、辽阔而温柔的事物。音乐里，我演奏贝斯和二胡，唱歌、编曲，也作为电声乐团常驻乐队成员参加过校内外音乐节。',
    '屏幕之外，我会游泳，也喜欢球类运动。做项目、听音乐、参与服务，都是日常里不同的部分。',
  ],
  traces: [
    { name: 'Becoming', label: '学习与笔记', path: 'knowledge' },
    { name: 'Afterimage', label: '项目与作品', path: 'showcase' },
    { name: 'A Moment Remains', label: '照片与相册', path: 'gallery' },
    { name: 'Echoes', label: '音乐电台', path: 'music' },
  ],
};
