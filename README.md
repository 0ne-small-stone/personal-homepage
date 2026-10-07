# 个人主页项目

这是一个包含知识库、个人作品、照片与音乐互动的个人主页项目。学习资料、博客和数字花园合并为同一个知识库，共享分类、搜索、引用关系和编辑入口。当前工作路线是 Astro 静态主站、GitHub 内容仓库、Giscus 留言，以及音乐同步和未来 AI 所需的按需服务端功能。

实施策略：优先复用成熟框架、主题、插件和托管服务，配置与集成优先，只补实际缺少的业务能力。知识库优先验证 Starlight 及其博客插件，以学习总览、分类、搜索与普通引用链接浏览，内容结构和路由沿用现成方案的约定。

设计顺序：先分页与功能，再定义各页 UI/UX、页面关系及转场，最后统一主题表达。UI/UX 和素材同样优先复用、配置与改造优质现成资源；确有需求缺口时再二创或原创。当前方向为黑色首页、四组光路入口，以及通过棱镜靠近的白色留痕墙。

## 文档入口

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

- 文档目录整理日期：2026-10-07；原规划基线日期：2026-10-03。
- 已完成 8 份规划文档：页面规格、概念施工说明、小步迭代工作流、设计规范 v0.1、复用与素材来源，以及技术方案、技术实施计划、技术调研来源。已核算规范色值的静态对比度；真实合成画面仍待原型验证。
- T01 Astro 基础工程已建立，T04 的 Starlight/博客组合与本地生产构建通过。U01 四入口与学习阅读旅程已核验，实际截图与限制见[迭代记录](docs/design/iterations/u01-p01-2026-10-07-01.md)；其余功能和设计进度以两侧计划为准。
- 根目录 package.json 管理网站命令与锁定依赖，`tools/ci/package.json` 单独管理仓库校验。主站为静态 Astro 页面，知识阅读与搜索沿用 Starlight。
- T07.01 学习类型筛选已实现并通过执行者验证，待用户体验；选择资料、文章、笔记只显示对应条目，类型参数支持刷新和前进后退。[本轮记录与证据](docs/design/iterations/u09-p03-t07-01-2026-10-07-01.md)和[所需设计资源](docs/design/REFERENCES.md#t0701-学习类型筛选资源清单)已登记，新增下载素材及依赖均为 0。
- 已创建并上传公开仓库 [0ne-small-stone/personal-homepage](https://github.com/0ne-small-stone/personal-homepage)。main 已保护，PR 必须通过仓库与工作流检查后 Squash 合并；Issues/Discussions 已开启，Wiki 已关闭。
- Astro 工程已接入现有 CI，[草稿 PR #2](https://github.com/0ne-small-stone/personal-homepage/pull/2) 的首次 Actions 仓库、语法和 Astro 构建全部通过，main 已要求三项检查。Pages 来源已设为 GitHub Actions，PR 不部署，网站尚未上线。
- GitHub 登录身份及本机 Git 凭证均核对为 `0ne-small-stone`；可通过 Git/官方 API 管理仓库。GitHub 插件的目标仓库 App 授权仍待补充，不影响本次 Git 接入。
- 已有本地素材：大二上学习资源目录；本次检查为 38 个文件（36 PDF、2 TXT），共约 507.9 MiB。文件保持原目录，大小与存储边界见技术方案。
- T06.02 已分类接入六个科目的 34 条资料与 5 条笔记收藏，来源为 36 PDF 与 2 TXT（含三个外部笔记链接）。T08.01 接入本地 PDF 直接阅读和外部笔记直接跳转；原件完整保留，三条结构演示保持草稿。[分类清单](docs/technical/content/LEARNING_MATERIALS.md)可逐项核对。
- 公开 PDF 附件存储、作品与其他个人内容尚未接入；CMS、Giscus、音乐同步、棱镜场景和 AI 功能均未接入。当前 4322 可阅读本地 PDF，不能当作网上附件已发布。
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

2026-10-07 当前独立验证地址为 `http://127.0.0.1:4322/personal-homepage/knowledge/`。T06.02 接入后，资料为 34 条、笔记为 5 条、全部为 39 条，文章当前为空；刷新、复制参数地址及前进后退保持 T07.01 类型状态。展开目录的“学习资料”和“笔记”按科目核对，再从条目进入同科目内容。独立工作目录后台预览保留原 4321 基础预览；恢复时在切片目录运行 `npm run preview -- --background --host 127.0.0.1 --port 4322`。

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
