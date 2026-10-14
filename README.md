# 个人主页项目

2026-10-14 当前发布：**首页、知识库与音乐界面已整合部署至 GitHub Pages**；[正式主页](https://0ne-small-stone.github.io/personal-homepage/)、[音乐](https://0ne-small-stone.github.io/personal-homepage/music/)、[本轮验收](docs/technical/acceptance/release-2026-10-14.md)。PR #48/#50/#51 保护检查及 Pages 通过，公网曲库20首/5专辑、手机首次点击修复已定向确认；143项风险测试、122文件零诊断、53页构建通过。**现有云盘音源与封面为内网依赖，最新公网播放未通过，仍需公网可访问来源。**

- 首页保留中央玻璃三棱体和柔晕，终章在近方形后错落落砖、展开至全屏；取消入射光、光谱/流体和整墙上移。F02 工程结果、独立复核和用户确认分别记录，当前没有用户通过结论，不启动 F03。
- 学习区保留 main 的内容、筛选、搜索、关联、网页编辑、公开 PDF 与沉浸阅读，不用旧首页工作分支覆盖。
- 音乐可发布静态曲库、现有云盘链接（内网访问）和现有单音频播放器；现行元数据快照20首/5专辑已冻结；最新公网音频被浏览器内网访问策略阻止，早先播放及跨页成功证据仅保留历史，不作为当前公网播放通过结论。网易云账号登录、短期音源续期、推荐审核与歌单写入目前仅在本机服务完成，GitHub Pages 不承载这些接口。
- 球面相册、无限空间和单图浏览仍是独立设计原型，尚未接入正式相册路由。照片/教材原件、音频、凭据和临时产物保留本机。

本轮文件组织与整合边界见[仓库整合记录](docs/technical/iterations/repository-integration-2026-10-14.md)。下文保留历次交付证据，历史“待接入/未上线”不作为最新状态。

2026-10-13 收口：**已发布 GitHub Pages**，首页与学习区已整合；[正式主页](https://0ne-small-stone.github.io/personal-homepage/)、[学习总览](https://0ne-small-stone.github.io/personal-homepage/knowledge/)、[网页编辑](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Fcontent-editor/collection/writing-notes)。内容分支保存后自动回写关联候选并验证新提交，经PR合并main后发布。正式首页首帧问题已通过独立PR修复，桌面/390px、公网搜索及PDF第三页/侧栏通过；原48内容、教材原件和本地音乐未改或上传。[完整证据](docs/technical/iterations/pages-release-2026-10-12.md)。后文保留各轮历史状态。

这是一个包含知识库、个人作品、照片与音乐互动的个人主页项目。学习资料、博客和数字花园合并为同一个知识库，共享分类、搜索、引用关系和编辑入口。当前工作路线是 Astro 静态主站、GitHub 内容仓库、Giscus 留言，以及音乐同步和未来 AI 所需的按需服务端功能。

实施策略：优先复用成熟框架、主题、插件和托管服务，配置与集成优先，只补实际缺少的业务能力。知识库优先验证 Starlight 及其博客插件，以学习总览、分类、搜索与普通引用链接浏览，内容结构和路由沿用现成方案的约定。

设计顺序：先分页与功能，再定义各页 UI/UX、页面关系及转场，最后统一主题表达。UI/UX 和素材同样优先复用、配置与改造优质现成资源；确有需求缺口时再二创或原创。当前首页按用户要求复刻 ALCHE 的交互与动画：黑色玻璃三角体、四入口连续弧线浏览、末段 The Wall 升起；站名 Little Stone Still Here，简称 LSSH。参数、连续证据及逐片任务见[最新研究](docs/design/iterations/u03-p01-2026-10-08-17.md)。

## 文档入口

2026-10-12 整合发布：用户授权自动回写与 GitHub Pages 上线，发布分支 `codex/learning-pages-release` 整合首页第50轮和学习区收尾。CMS 关联候选已实际验证回写与新提交检查；首页复用学习区全站目录，原始教材与本地音乐不发布。[本轮记录](docs/technical/iterations/pages-release-2026-10-12.md)维护正式部署、PR 和验收的实际状态。以下本机链接及“尚未部署”为各轮历史记录。

2026-10-12 学习区收尾：自写笔记的原生新建/正文/共用插图/草稿/关联已接入，搜索增加类型、主题和可选文章标签，返回恢复筛选与焦点；网页保存后的 CI 在只读检出中派生候选，不再因候选过期阻断构建。类型检查、干净生产构建、真实 Save/重开和桌面/390px阅读通过；原48内容与公开PDF未改。两个功能笔记保持草稿。[统一验收与剩余项](docs/technical/LEARNING_ACCEPTANCE.md)、[当前学习区](http://127.0.0.1:4386/personal-homepage/knowledge/)、[含功能笔记的冻结验收快照](http://127.0.0.1:4387/personal-homepage/knowledge/?type=note&topic=%E9%98%85%E8%AF%BB%E4%B8%8E%E6%95%B4%E7%90%86)、[后台](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Flearning-wrapup/collection/writing-notes)。快照服务重启后需重新启动，不是正式部署；此分支首页为旧入口占位，最新首页由首页开发聊天独立接入。

本轮 **T13.13 已有笔记说明网页编辑**：原生后台按科目编辑标题、摘要和主题；真实保存/重开/恢复、前台筛选与目录标题同步通过，实际点击仍直达作者原站。全部48内容与公开PDF恢复基线，素材/依赖新增0。[后台入口](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-13-note-editor/collection/notes)、[冻结验收快照](http://127.0.0.1:4385/personal-homepage/knowledge/?type=note&topic=%E7%AC%94%E8%AE%B0%E7%BC%96%E8%BE%91%E9%AA%8C%E8%AF%81)、[记录与限制](docs/technical/iterations/t13-13-2026-10-10.md)。笔记新建/正文编辑、候选自动同步及部署另片。

本轮 **T13.12 已有资料说明网页编辑**：原生后台可按科目编辑标题、摘要和主题，真实保存/重开与前台一致；侧栏名称读内容标题，原四页PDF及正文/来源保留。验证样本已恢复，素材/依赖新增0。[后台](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-12-resource-editor/collection/resources)、[冻结验收页](http://127.0.0.1:4384/personal-homepage/knowledge/?type=resource&topic=%E7%BD%91%E9%A1%B5%E7%BC%96%E8%BE%91%E9%AA%8C%E8%AF%81)、[证据与限制](docs/technical/iterations/t13-12-2026-10-10.md)。标题/主题变动需开发者同步候选，未合并或上线。

本轮 **T13.11 网页关联内容选择**：文章后台可搜索并多选已有资料、文章和笔记，保存稳定ID后复用关联与反向引用。真实保存、重开及移除恢复通过；41个候选，新增设计素材/依赖0。[后台验证](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-11-related-picker/collection/articles)、[前台三类关联候选](http://127.0.0.1:4382/personal-homepage/knowledge/blog/editor-draft-check/#related-knowledge-title)、[本轮证据与限制](docs/technical/iterations/t13-11-2026-10-10.md)。新内容/标题/主题变化后需 npm run cms:sync-related；测试稿仍为草稿，未正式部署。

本轮 **T08.02 PDF 侧栏收起**：侧栏右上新增“收起”，支持鼠标、Enter/Space及Esc，关闭后可从原生工具栏再打开，保持页码和缩放。刷新[当前资料](http://127.0.0.1:4322/personal-homepage/knowledge/resources/computer-systems/computer-organization-risc-v-fifth-edition/)即可体验。11组独立Edge、26文件类型检查和52页构建通过，[复现与实际截图](docs/technical/iterations/t08-02-2026-10-08.md)。

本轮 **T07.04 学习总览标题排序**：可按主题（默认）、标题升序、标题降序浏览，与类型/主题组合；刷新、前进后退与阅读返回保持，清空筛选保留排序。204 种组合与当前/隔离 Edge 16/17 组通过。[物理资料排序体验](http://127.0.0.1:4322/personal-homepage/knowledge/?type=resource&topic=%E5%A4%A7%E5%AD%A6%E7%89%A9%E7%90%86%E2%85%A1&sort=title-asc)、[复现与证据](docs/technical/iterations/t07-04-2026-10-08.md)。总览一并正确统计公开 PDF；内容与原件未改，CMS 真实上传及正式部署继续待验。

本轮 **T06.01 单个公开 PDF**：新增《PDF 阅读验证说明》四页功能样本，随静态产物发布，可直接阅读和下载；不依赖本机附件目录。[干净构建体验](http://127.0.0.1:4366/personal-homepage/knowledge/resources/reading-guide/)、[筛选入口](http://127.0.0.1:4366/personal-homepage/knowledge/?type=resource&topic=%E9%98%85%E8%AF%BB%E4%B8%8E%E6%95%B4%E7%90%86)、[复现与证据](docs/technical/iterations/t06-01-2026-10-08.md)。52 页构建、Edge 17 组、7 种坏附件拒绝已通过；原有 44 个内容文件保持原状。此为公开通路功能样本，网站正式部署仍待 T16。

本轮 **T26.01 三类阅读返回**已接入资料、文章和笔记：返回保留类型/主题、位置及原链接焦点，直达详情有明确栏目入口；PDF 页码和缩放复用原生持久历史，刷新和阅读往返已验。类型检查、51 页构建、29 组 Edge 行为/状态及 37 个站内详情静态核对通过。[概率资料体验](http://127.0.0.1:4322/personal-homepage/knowledge/?type=resource&topic=%E6%A6%82%E7%8E%87%E8%AE%BA%E4%B8%8E%E6%95%B0%E7%90%86%E7%BB%9F%E8%AE%A1)、[笔记体验](http://127.0.0.1:4322/personal-homepage/knowledge/?type=note&topic=%E9%AB%98%E7%BA%A7%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E4%B8%8E%E7%AE%97%E6%B3%95%E5%88%86%E6%9E%90)、[复现与证据](docs/technical/iterations/t26-01-2026-10-08.md)。外部笔记仍直达作者原站；用户体验、公开附件与正式部署另验。

本轮 **T07.02 主题与类型组合筛选**已接入学习总览：主题选择读取同一批已发布内容，与类型取交集；topic/type 保留在地址中，清空、无结果与未知条件有明确反馈。类型检查、51 页构建及 Edge 19 组通过，76 种组合与独立读取的内容字段一致。[概率资料](http://127.0.0.1:4322/personal-homepage/knowledge/?type=resource&topic=%E6%A6%82%E7%8E%87%E8%AE%BA%E4%B8%8E%E6%95%B0%E7%90%86%E7%BB%9F%E8%AE%A1)、[计算机系统笔记](http://127.0.0.1:4322/personal-homepage/knowledge/?type=note&topic=%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%B3%BB%E7%BB%9F)、[复现与证据](docs/technical/iterations/t07-02-2026-10-08.md)。正式内容未修改，用户体验与部署待验。

本轮 **T02.01 公共目录**已接入主站与学习区：展开“全站目录”可直达学习、展示、常用网站、音乐电台、关于我、留言墙，区分当前页与当前栏目；修复学习侧栏三处重复部署前缀。类型检查、51 页生产构建、Edge 16 组及产物路由检查通过。[从文章体验](http://127.0.0.1:4322/personal-homepage/knowledge/blog/article-reading-check/)、[从首页体验](http://127.0.0.1:4322/personal-homepage/)、[步骤与证据](docs/technical/iterations/t02-01-2026-10-08.md)。4322 使用本轮产物，4363/4364 继续保留上一轮关联快照。用户体验与正式部署分别待验。

本轮 T09.02 反向列表已接入：在同一公开关联基础上显示“哪些内容关联了它”，列出真实来源类型和标题；草稿两端排除、无来源隐藏，增删关联后重新构建两端一致。当前 426 条反向链接、类型/生产构建、33 项内容测试与 Edge 15 组通过。[现有 PDF 的来源](http://127.0.0.1:4322/personal-homepage/knowledge/resources/probability/probability-lecture-0/#backlinks-knowledge-title)、[新增关联样本](http://127.0.0.1:4363/personal-homepage/knowledge/blog/article-reading-check/#backlinks-knowledge-title)、[移除关联样本](http://127.0.0.1:4364/personal-homepage/knowledge/blog/article-reading-check/)、[复现和证据](docs/technical/iterations/t09-02-2026-10-08.md)。现有内容未修改，正式部署仍待验；[上一轮正向关联](docs/technical/iterations/t09-01-2026-10-08.md)保留独立记录。

[文档导航与对应表](docs/README.md)是统一入口，包含完整目录、P 页面与 R 需求、U 设计任务、T 技术任务的对应关系。[AGENTS.md](AGENTS.md)维护后续 AI 的工作约定和阅读顺序。

| 层级 | 设计：`docs/design/` | 技术：`docs/technical/` |
| --- | --- | --- |
| 规格 `SPEC.md` | [页面与交互](docs/design/SPEC.md)：16 个页面／界面目标、功能、导航、体验 | [技术方案](docs/technical/SPEC.md)：R01–R13、架构、数据、接口 |
| 计划 `PLAN.md` | [设计计划与工作流](docs/design/PLAN.md)：U01–U14、小步迭代、体验验收 | [技术实施计划](docs/technical/PLAN.md)：T01–T29、工程依赖、技术验收 |
| 来源 `REFERENCES.md` | [设计复用与素材](docs/design/REFERENCES.md)：案例、组件、素材与许可 | [技术调研与候选](docs/technical/REFERENCES.md)：官方能力、依赖、平台约束 |
| 专项依据 | [概念施工](docs/design/CONCEPT.md)与[设计规范](docs/design/SYSTEM.md)：场景、控件、统一参数 | 由技术规格中的组件、运行时与资源约束承接，详见[对应表](docs/README.md) |

GitHub 的触发方式、各 job 和本地检查命令见[工作流说明](docs/technical/GITHUB_WORKFLOW.md)。

开始修改见 [CONTRIBUTING.md](CONTRIBUTING.md)。目录职责、文件命名、分支、提交与 GitHub 设置统一维护在[仓库管理规范](docs/technical/REPOSITORY_CONVENTIONS.md)。

## 当前状态

**2026-10-12 本机音乐播放修复：**[Echoes 开发入口](http://127.0.0.1:4343/personal-homepage/music/?mode=cloud)可播放洛雪已下载的18首音频，页面明确显示“本机播放 · 考拉云盘待连接”。真实 FLAC 播放、暂停、跳转、模式切换和390px核对通过；生产预览仍需考拉分享地址。命令与状态边界见[接入工具](tools/music/README.md)，证据见[修复记录](docs/design/iterations/u12-p13-2026-10-12-local-playback.md)。

- 2026-10-08 T13.03 发布状态与修改已配置：同一文章的草稿可编辑，保存本轮工作分支自动构建；三份隔离生产快照与 Edge 10 组通过。原文保留草稿，真实托管操作与正式上线仍待验。[体验步骤](docs/technical/CMS_WORKFLOW.md#t1303-文章发布状态与修改)、[本轮证据](docs/technical/iterations/t13-03-2026-10-08.md)。

- 2026-10-08 T07.03 标签与分页已验：文章列表每页 5 篇，标签阅读返回明确显示“返回标签结果”；类型/生产构建及 Edge 19 组通过。[第二页本机样本](http://127.0.0.1:4361/personal-homepage/knowledge/blog/2/)用于体验 5/5/2 三页边界，测试文章不进入仓库内容。当前公开功能文章仍为 1 篇，正式文章 0，用户反馈与正式部署待验。[复现与证据](docs/technical/iterations/t07-03-2026-10-08.md)。

- 2026-10-08 T13.02 图片上传配置与本地预览已准备：同一草稿的原生正文支持图片、alt 和说明，开发模式可体验图片；官方配置 6 项、类型/生产构建、Edge 7 组通过。开发者样本不替代真实网页上传，任务继续进行中。[上传步骤](docs/technical/CMS_WORKFLOW.md#t1302-图片上传与预览)、[本轮证据](docs/technical/iterations/t13-02-2026-10-08.md)。

- 2026-10-08 T13.01 首次网页保存草稿闭环完成：用户修改标题并实际保存为 `f324538`；稳定字段及正文保留，保存后的生产页面和搜索仍排除草稿。类型检查、日期 15 项、51 页构建及 Edge 六组通过。[后台体验步骤](docs/technical/CMS_WORKFLOW.md)、[本轮结果](docs/technical/iterations/t13-01-2026-10-08.md)。图片上传进展见 T13.02，实际发布尚未开发。

- 2026-10-08 按用户纠正：大学物理Ⅱ第 9 章的 5 页资料为（上），4 页资料为（下）；详情、同科目链接、侧栏、总览与搜索名称同步，原件校验一致。[纠正记录](docs/technical/iterations/t06-02-2026-10-08-correction.md)。

- 2026-10-08 T09.03 博客第 1 步已实现并通过执行者验证：一篇明确标注的功能验证样稿，从文章列表、学习总览和搜索进入同一正文，返回恢复类型、位置、焦点与原搜索词。目录、中文日期/标签、代码复制和两条 PDF 链接已验；正式文章 0，知识条目共 40。复现和真实证据见[本轮交付](docs/technical/iterations/t09-03-2026-10-08.md)。下一步为 T13.01 网页编辑与草稿。

**2026-10-11 音乐电台首片：**[Echoes 本地体验](http://127.0.0.1:4321/personal-homepage/music/)已提供两种音源模式、直接打开洛雪的下载入口，以及真实18首/3专辑清单。网易云指定共享歌单已实际嵌入并启动播放。本地目录监听可更新开发页面；考拉两次官方授权后接口仍返回401，文件夹、音频上传与线上自动同步未完成，跨页持续播放及推歌另验。工程结果与原始失败见[首片记录](docs/design/iterations/u12-p13-2026-10-11-01.md)，命令与限制见[接入工具](tools/music/README.md)。

**2026-10-08 首页增量：**静态品牌与六章语义入口已通过无 JS 检查；玻璃透射的桌面/手机、固定背景对照、减少动画与图形失败局部工程证据见 [14 轮交付](docs/design/iterations/u03-p01-2026-10-08-14.md)。其他滚动章节虽有工作代码，完整操作验收尚未完成。设计复核、用户审美确认、Giscus 授权、真机性能和部署分别保持未完成；没有真实音乐播放、推歌或同步能力。实际体验入口：[本机生产预览](http://127.0.0.1:4321/personal-homepage/)。

- 文档目录整理日期：2026-10-07；原规划基线日期：2026-10-03。
- 已完成 8 份规划文档：页面规格、概念施工说明、小步迭代工作流、设计规范 v0.1、复用与素材来源，以及技术方案、技术实施计划、技术调研来源。已核算规范色值的静态对比度；真实合成画面仍待原型验证。
- T01 Astro 基础工程已建立，T04 的 Starlight/博客组合与本地生产构建通过。U01 四入口与学习阅读旅程已核验，实际截图与限制见[迭代记录](docs/design/iterations/u01-p01-2026-10-07-01.md)；其余功能和设计进度以两侧计划为准。
- 根目录 package.json 管理网站命令与锁定依赖，`tools/ci/package.json` 单独管理仓库校验。主站为静态 Astro 页面，知识阅读与搜索沿用 Starlight。
- T07.01 学习类型筛选已实现并通过执行者验证，待用户体验；选择资料、文章、笔记只显示对应条目，类型参数支持刷新和前进后退。[本轮记录与证据](docs/design/iterations/u09-p03-t07-01-2026-10-07-01.md)和[所需设计资源](docs/design/REFERENCES.md#t0701-学习类型筛选资源清单)已登记，新增下载素材及依赖均为 0。
- 已创建并上传公开仓库 [0ne-small-stone/personal-homepage](https://github.com/0ne-small-stone/personal-homepage)。main 已保护，PR 必须通过仓库与工作流检查后 Squash 合并；Issues/Discussions 已开启，Wiki 已关闭。
- Astro 工程已接入现有 CI，[草稿 PR #2](https://github.com/0ne-small-stone/personal-homepage/pull/2) 的首次 Actions 仓库、语法和 Astro 构建全部通过，main 已要求三项检查。Pages 来源已设为 GitHub Actions，PR 不部署，网站尚未上线。
- GitHub 登录身份及本机 Git 凭证均核对为 `0ne-small-stone`；可通过 Git/官方 API 管理仓库。GitHub 插件的目标仓库 App 授权仍待补充，不影响本次 Git 接入。
- 2026-10-07 GitHub 连续服务器错误后，使用仓库本地 HTTP/1.1 设置恢复推送；资料分类 [PR #4](https://github.com/0ne-small-stone/personal-homepage/pull/4) 的三项构建检查已通过，阅读切片 [PR #5](https://github.com/0ne-small-stone/personal-homepage/pull/5) 已创建供独立审查，远程结果见其 Checks。
- 已有本地素材：大二上学习资源目录；本次检查为 38 个文件（36 PDF、2 TXT），共约 507.9 MiB。文件保持原目录，大小与存储边界见技术方案。
- 该2026-10-07基线的正式内容和服务状态保留历史；后续知识库、首页与音乐实施以各计划最新交付为准。音乐实际云盘同步和AI仍未接入。
- 文档中的技术候选、内容模型和目录结构是拟实施方案。

## 本地预览与验收

使用 Node.js 24，在项目根目录执行：

```powershell
npm ci --no-audit --no-fund
npm run dev
```

打开 `http://localhost:4321/personal-homepage/`。本分支提供四组首页入口、学习总览、已分类资料及笔记收藏，以及其他页面的待配置状态；没有课程、学习路线或知识关系图。

验收搜索时使用生产预览，Pagefind 由 Starlight 在构建中生成：

```powershell
npm run check
npm run build
npm run preview
```

需要在关闭临时命令会话后继续访问预览时，使用 Astro 原生后台模式（仅监听本机）：

```powershell
npm run preview -- --background --host 127.0.0.1 --port 4321
npm run preview -- status
```

停止后台预览用 `npm run preview -- stop`。后台预览仍读取 `dist/`；修改页面后重新构建即可查看新产物。

可以先走“首页 → 学习 → 展开科目 → PDF 直接阅读 / 笔记原站”，再试搜索“概率论”或“NoughtQ”、浏览器返回、深链刷新和手机宽度。按[设计计划](docs/design/PLAN.md)每轮记录一个主要变量，CI 检查与实际体验分别验收。

2026-10-08 当前独立验证地址为 `http://127.0.0.1:4322/personal-homepage/knowledge/`。资料 34 条、笔记 5 条、文章功能验证样稿 1 篇，全部 40 条；刷新、复制参数地址及前进后退保持 T07.01 类型状态。展开“学习资料”和“笔记”按科目核对。T09.03 可从[文章列表](http://127.0.0.1:4322/personal-homepage/knowledge/blog/)打开样稿，或搜索“博客阅读验证”；正文上方返回来处，搜索返回恢复原词和对应结果。独立工作目录后台预览保留原 4321 基础预览；恢复时在切片目录运行 `npm run preview -- --background --host 127.0.0.1 --port 4322`。

资料分类使用 `docs/technical/content/learning-materials.json` 保存来源、稳定 ID、大小、页数与 SHA-256。运行 `npm run content:import` 可重复生成原生 Markdown 条目与分类清单；追加 `-- --source <原始资料目录>` 核对原件。导入只读取原件，不移动、改名或复制 PDF。

本地 PDF 阅读另运行以下步骤；副本与原件 SHA-256 一致，副本目录被 Git 忽略。项目根目录没有原始资料时，第一步追加 `-- --source <原始资料目录>`：

```powershell
npm run materials:prepare
npm run build
node tools/ci/dist.mjs --local-preview
```

阅读器复用 [PDF.js 官方发行版](public/pdfjs/README.md)，直接显示当前条目，保留翻页、缩放、文字层搜索和下载。PDF 缺失时显示待配置状态；读取失败可重试；关闭 JavaScript 后可打开原文件。附件不在 CI 检出内容中，默认产物检查拒绝 `local-materials`，避免本地预览副本误上传。[T08.01 实际记录](docs/technical/iterations/t08-01-2026-10-07.md)包含浏览器证据及公开存储边界。

## 从哪里开始

后续 AI 先读 AGENTS.md，再读技术方案和技术实施计划。当前工程已初始化；从[单页与跨页开发盘点](docs/technical/PLAN.md#页面与跨页开发盘点2026-10-07)领取一个可独立验收的切片。T07.01、T06.02 与 T08.01 本地阅读已交付供用户体验，公开附件存储仍归 T06.01，其他切片按用户后续范围领取。平台授权、域名和音乐账号配置在对应功能需要时解决。

涉及页面与交互时，按下面的最短路径施工：

1. 从当前未完成的 U/T 任务或切片开始，明确本轮唯一主要变量，不重复初始化或把整页塞入一轮。
2. 在页面规格找到 P 编号及功能，在概念说明找到对应 C 规则、动作和控件。
3. 取设计规范的参数，从复用清单选择现成组件/素材，制作一个可操作样本。
4. 留下同条件对照、实际操作结果与下一步；通过后再组合到页面及跨页旅程。

真实迭代记录与证据已放入 `docs/design/iterations/`；基础页面结构通过不代表最终场景视觉或外部服务完成。

设计与技术文档按分类维护；后续提交可通过 GitHub 工作流检查。真实构建、账号接入与发布结果按技术计划的证据记录。

2026-10-13 音乐电台已接通考拉只读音源，现有18首/3专辑/18封面可播放；洛雪已完成下载通过音乐目录专用上传入口自动同步，本机用户登录后后台启动。当前监控 `E:\音乐\声音玩具`，上传后才发布目录快照；音频与上传授权不进入仓库。在线静态部署仍需重新构建发布。运行/停用说明见 [音乐接入工具](tools/music/README.md)，实际授权与证据见 [本轮记录](docs/technical/iterations/t21-p13-2026-10-13-cloud-sync.md)。
