/** Public profile, adapted from the user's ITP application and confirmed site identity. */
export interface ProfileExperience {
  id: string;
  period: string;
  title: string;
  role: string;
  paragraphs: string[];
}

export const profile = {
  name: 'Zhang Xuanshi',
  nickname: 'Little Stone',
  university: 'Zhejiang University',
  major: 'Software Engineering',
  email: '3400489513@qq.com',
  github: 'https://github.com/0ne-small-stone',
  introduction: [
    'I study software engineering at Zhejiang University and turn ideas into things people can use. My projects bring together software, interface design and hardware, often with people from different disciplines.',
    'Little Stone Still Here is where I keep what I learn, what I make and bits of everyday life. I hope these things give you a sense of who I am.',
  ],
  experiences: [
    { id: 'software', period: 'Aug 2026 — Present', title: 'Software development', role: 'Internet startup project', paragraphs: ['I work on custom platforms and systems for government clients, translating requirements into software and gaining experience with real-world needs.'] },
    { id: 'suikong', period: 'Apr 2026 — Present', title: 'Suikong Desk', role: 'Founder / Product and brand', paragraphs: ['A consumer electronics venture focused on smart desk setups. I handle product definition, brand design, software and hardware project management, and business development.', 'Hardware development stalled after a key team member left. While learning more and looking for new engineering collaborators, I have been working on better knowledge sharing and handovers within the team.'] },
    { id: 'game', period: 'Feb 2026 — Present', title: 'Independent game', role: 'Co-initiator / Game design and music', paragraphs: ['I am developing a game for Steam with a team, contributing to game balance, mechanics, audience research and product positioning. I also plan to work on its soundtrack arrangements and sound effects.'] },
    { id: 'robot', period: 'Nov 2025 — Oct 2026', title: 'Power grid inspection robot', role: 'Zhilian Dianwei project team', paragraphs: ['A robotics project for enterprise and government clients. I worked on the business plan, pitch presentation, and the fabrication and testing of the first enclosure.'] },
    { id: 'shaoguang', period: 'Volunteering', title: 'Shaoguang volunteer team', role: 'Co-founder / Event planning', paragraphs: ['I helped establish the team and organize more than 40 activities supporting and spending time with older adults across over 10 communities. Through SQTP, we brought volunteering into class activities and involved more than 10 classes from different majors.', 'I care about whether an approach can keep working when someone else takes it forward. During organizational changes, I try to leave both new teams and existing collaborators with work they can continue.'] },
  ] satisfies ProfileExperience[],
  capabilities: [
    { title: 'Software and making', items: ['Full-stack development', 'Requirements', '3D printing'], description: 'Connecting software implementation with physical prototypes.' },
    { title: 'Design and communication', items: ['UI/UX design', 'Graphic and brand design', 'Product positioning'], description: 'Turning a problem into a clear interface and a product people can understand.' },
    { title: 'Projects and collaboration', items: ['Project management', 'Cross-disciplinary collaboration', 'Finding collaborators'], description: 'Breaking ideas into tasks, bringing the right people together and following through.' },
  ],
  learning: 'PCB design and mechanical design are areas I am still learning. I want to understand design tradeoffs, spot schedule risks earlier and make sure important decisions are shared across the team.',
  life: [
    'I love Pink Floyd and things that feel psychedelic, expansive and gentle. I play bass and erhu, sing and arrange music. As a regular band member in the university electric music ensemble, I have played at music festivals on and off campus.',
    'Away from the screen, I swim and enjoy ball sports. Making things, listening to music and volunteering are all parts of my everyday life.',
  ],
  traces: [
    { name: 'Becoming', label: 'Learning and notes', path: 'knowledge' },
    { name: 'Afterimage', label: 'Projects and work', path: 'showcase' },
    { name: 'A Moment Remains', label: 'Photos and albums', path: 'gallery' },
    { name: 'Echoes', label: 'Music radio', path: 'music' },
  ],
};

export type SomeoneLanguage = 'en' | 'zh-CN';

export const profiles: Record<SomeoneLanguage, typeof profile> = {
  en: profile,
  'zh-CN': {
    name: '张轩石',
    nickname: '小石',
    university: '浙江大学',
    major: '软件工程',
    email: profile.email,
    github: profile.github,
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
    ],
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
  },
};
