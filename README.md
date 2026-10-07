# 个人主页项目

这是一个包含知识库、个人作品、照片与音乐互动的个人主页项目。学习资料、博客和数字花园合并为同一个知识库，共享分类、搜索、引用关系和编辑入口。当前工作路线是 Astro 静态主站、GitHub 内容仓库、Giscus 留言，以及音乐同步和未来 AI 所需的按需服务端功能。

实施策略：优先复用成熟框架、主题、插件和托管服务，配置与集成优先，只补实际缺少的业务能力。知识库优先验证 Starlight 及其博客插件，以学习总览、分类、搜索与普通引用链接浏览，内容结构和路由沿用现成方案的约定。

设计顺序：先分页与功能，再定义各页 UI/UX、页面关系及转场，最后统一主题表达。UI/UX 和素材同样优先复用、配置与改造优质现成资源；确有需求缺口时再二创或原创。当前方向为黑色首页、四组光路入口，以及通过棱镜靠近的白色留痕墙。

## 文档入口

[文档导航与对应表](docs/README.md)是统一入口，包含完整目录、P 页面与 R 需求、U 设计任务、T 技术任务的对应关系。[AGENTS.md](AGENTS.md)维护后续 AI 的工作约定和阅读顺序。

| 层级 | 设计：`docs/design/` | 技术：`docs/technical/` |
| --- | --- | --- |
| 规格 `SPEC.md` | [页面与交互](docs/design/SPEC.md)：16 个页面、功能、导航、体验 | [技术方案](docs/technical/SPEC.md)：R01–R13、架构、数据、接口 |
| 计划 `PLAN.md` | [设计计划与工作流](docs/design/PLAN.md)：U01–U14、小步迭代、体验验收 | [技术实施计划](docs/technical/PLAN.md)：T01–T29、工程依赖、技术验收 |
| 来源 `REFERENCES.md` | [设计复用与素材](docs/design/REFERENCES.md)：案例、组件、素材与许可 | [技术调研与候选](docs/technical/REFERENCES.md)：官方能力、依赖、平台约束 |
| 专项依据 | [概念施工](docs/design/CONCEPT.md)与[设计规范](docs/design/SYSTEM.md)：场景、控件、统一参数 | 由技术规格中的组件、运行时与资源约束承接，详见[对应表](docs/README.md) |

GitHub 的触发方式、各 job 和本地检查命令见[工作流说明](docs/technical/GITHUB_WORKFLOW.md)。

开始修改见 [CONTRIBUTING.md](CONTRIBUTING.md)。目录职责、文件命名、分支、提交与 GitHub 设置统一维护在[仓库管理规范](docs/technical/REPOSITORY_CONVENTIONS.md)。

## 当前状态

- 文档目录整理日期：2026-10-07；原规划基线日期：2026-10-03。
- 已完成 8 份规划文档：页面规格、概念施工说明、小步迭代工作流、设计规范 v0.1、复用与素材来源，以及技术方案、技术实施计划、技术调研来源。已核算规范色值的静态对比度；真实合成画面仍待原型验证。
- 设计任务的实际进度见[设计计划](docs/design/PLAN.md)；T01 已完成 Git 与 CI 工具准备，T15 已验证仓库 CI，T16 已设置 Pages 来源。网站工程与各功能的后续进度按对应计划记录，文档和 CI 配置完成不代表网站已经实现。
- 已初始化本地 Git `main` 分支，建立 GitHub 检查、构建和 Pages 发布配置。网站应用代码和根目录 package.json 尚未创建；`tools/ci/package.json` 只管理校验工具。
- 已创建并上传公开仓库 [0ne-small-stone/personal-homepage](https://github.com/0ne-small-stone/personal-homepage)。main 已保护，PR 必须通过仓库与工作流检查后 Squash 合并；Issues/Discussions 已开启，Wiki 已关闭。
- [首轮 GitHub Actions](https://github.com/0ne-small-stone/personal-homepage/actions/runs/37596208177) 的仓库与语法检查通过；Pages 来源已设为 GitHub Actions。Astro 工程尚未建立，网站构建和部署明确跳过，网站尚未上线。
- GitHub 登录身份及本机 Git 凭证均核对为 `0ne-small-stone`；可通过 Git/官方 API 管理仓库。GitHub 插件的目标仓库 App 授权仍待补充，不影响本次 Git 接入。
- 已有本地素材：大二上学习资源目录；本次检查为 38 个文件（36 PDF、2 TXT），共约 507.9 MiB。文件保持原目录，大小与存储边界见技术方案。
- Astro、CMS、Giscus、音乐同步和 AI 功能均尚未实现或接入。
- 文档中的技术候选、内容模型和目录结构是拟实施方案。

## 从哪里开始

后续 AI 先读 AGENTS.md，再读技术方案和技术实施计划。从官方模板开始，验证知识库插件组合、统一搜索及资料、文章、笔记的关联浏览。平台授权、域名和音乐账号配置在对应功能需要时解决。

涉及页面与交互时，按下面的最短路径施工：

1. 从工作流的 U01 或当前未完成任务开始，明确本轮唯一主要变量。
2. 在页面规格找到 P 编号及功能，在概念说明找到对应 C 规则、动作和控件。
3. 取设计规范的参数，从复用清单选择现成组件/素材，制作一个可操作样本。
4. 留下同条件对照、实际操作结果与下一步；通过后再组合到页面及跨页旅程。

会话试作仅用于设计探索，不能视为正式网站已经实现。后续真实迭代记录按工作流放入 `docs/design/iterations/`；当前尚未创建该证据目录。

设计与技术文档按分类维护；后续提交可通过 GitHub 工作流检查。真实构建、账号接入与发布结果按技术计划的证据记录。
