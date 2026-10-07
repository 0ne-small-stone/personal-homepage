# GitHub 仓库管理、目录与命名规范

更新：2026-10-07。适用于 `0ne-small-stone/personal-homepage`。用户要求按现有规划自主建立个人主页仓库及管理规范；本规范以 [AGENTS.md](../../AGENTS.md)、[技术规格](SPEC.md)、[技术计划](PLAN.md)和[设计与技术对应表](../README.md)为依据。

## 仓库定位与公开范围

- 仓库名为 `personal-homepage`，默认分支为 `main`，用于个人主页代码、允许公开的内容与项目文档。
- 采用公开仓库，配合已选择的 GitHub Pages 与低成本路线。公开仓库的文件和历史均可被读取；网站的 `draft` 字段不能隐藏仓库中的私密草稿。[Pages 使用条件](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- 本地 `大二上学习资源/` 完整保留且不上传；发布资料时另行核对公开范围、许可与大小，选择派生文件或外部地址。
- 已开始搭建 Astro 网站工程；具体功能与验收以两侧 PLAN 的真实证据为准。模板、账号登录和 Pages 设置均不能作为网站全部功能完成的证据。
- 不自动为整仓库添加 MIT 等通用许可证。代码、正文、照片、教材与第三方素材分别记录使用条件，采用资源时在设计或技术参考文档保留来源和许可。

## 文件层级与职责

当前纳入 Git 的目录：

```text
personal-homepage/
├── README.md                         项目入口与真实状态
├── AGENTS.md                         AI 工作约定
├── CONTRIBUTING.md                   开始修改和提交的入口
├── .editorconfig                     UTF-8、换行与缩进
├── .gitattributes                    Git 文本换行
├── .gitignore                        本地资料、凭证及生成文件排除
├── .node-version                     Node.js 版本
├── package.json / package-lock.json  网站命令与锁定依赖
├── astro.config.mjs / tsconfig.json  静态路径、插件及类型约束
├── src/                             页面、布局、内容、主题与少量适配
├── .github/
│   ├── workflows/site.yml            检查、条件构建及 Pages 发布
│   ├── dependabot.yml                依赖更新 PR
│   ├── pull_request_template.md      改动、关联编号与验证证据
│   ├── ISSUE_TEMPLATE/               故障与变更表单
│   └── repository-settings.json      远程设置的期望值快照
├── docs/
│   ├── README.md                     文档导航及 P/R/U/T 对应表
│   ├── design/                       页面、体验、概念、视觉参数与素材
│   └── technical/                    架构、任务、来源、CI 与本规范
└── tools/ci/                         独立安装、锁定的仓库校验工具
```

网站按官方 Astro/Starlight 模板建立下列目录；只创建实际需要的路径，不用空目录或半套配置代替可运行工程：

| 工程路径 | 职责与约束 |
| --- | --- |
| `src/pages/` | Astro 文件路由；以框架路由规则为准 |
| `src/layouts/` | 页面骨架及通用布局 |
| `src/components/` | 可复用控件；按功能拆目录，避免复制同类状态逻辑 |
| `src/content/` | 原生内容集合；知识库优先沿用 Starlight 的 `docs` 集合及博客插件要求，不强制另建 knowledgeEntries |
| `src/assets/` | 交由 Astro 处理的图片等资源 |
| `src/styles/` | 统一主题与样式；视觉数值以设计 SYSTEM 为唯一文档依据 |
| `src/lib/` | 框架与插件未覆盖的少量共享适配代码 |
| `public/` | 必须原样公开的静态文件；进入前核对许可和公开范围 |
| 根 `package.json` 与锁文件 | 网站依赖及 dev/check/build/preview 四个真实命令 |

`node_modules/`、`dist/`、`.astro/`、`.ci-tmp/`、`.local-tools/` 为本地产物或工具目录，不提交。真实功能需要时再建立目录，避免提前建立空数据库、服务端工程或多套主题。

设计与技术继续对应维护 `SPEC.md`、`PLAN.md`、`REFERENCES.md`。设计的 `CONCEPT.md`、`SYSTEM.md` 各自维护空间动作与统一参数；技术的 `GITHUB_WORKFLOW.md` 维护实际流水线。本规范只管理仓库，不另写一套页面设计或数据方案。

## 命名与稳定标识

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| 普通目录、路由、脚本、资源文件 | 小写英文 `kebab-case`，不含空格 | `knowledge/`、`prism-motion.mjs`、`prism-cover.webp` |
| Astro/React 组件与布局 | `PascalCase`，扩展名遵循框架 | `PrismEntrance.astro`、`MusicPlayer.tsx` |
| JS/TS 变量、函数及业务字段 | `camelCase`；保留框架原生名称 | `assetId`、`reviewStatus`、`loadPlaylist` |
| 常驻规范文档 | 沿用大写文件名；单词用下划线 | `SPEC.md`、`REPOSITORY_CONVENTIONS.md` |
| GitHub 与工具约定文件 | 精确沿用官方约定 | `.github/pull_request_template.md`、`package-lock.json` |
| 正式设计迭代记录 | `u编号-p编号-日期-轮次.md` | `u03-p01-2026-10-07-01.md` |
| 验证截图和派生文件 | 关联编号、日期、状态或用途 | `u03-p01-2026-10-07-01-selected.webp` |
| 内容正文 | 简短、可读的小写英文文件名；日期按插件需要 | `astro-static-deploy.md` |
| 内容稳定 ID | 原生 ID 可用时沿用；扩展业务 ID 后保持唯一且不随标题变化 | `article-astro-static-deploy` |

正文、页面标题和说明使用中文。原始资料保留原文件名，不为满足命名规范批量改名；第三方资源需保留的名称与许可文件也不改写。Windows 与 Linux 大小写行为不同，不创建只在大小写上不同的两个文件。

P、R、U、T 编号沿用现有文档；P04、P07 已停用，不重新分配。代码路径不强制使用页面编号，PR 和验收记录引用编号实现追溯。新增页面或任务先同步对应表，再实施。

内容的 id、slug、文件名分工遵循技术规格：id 维持关联，slug 决定规范地址，文件名便于维护。改路径时同步正文链接和资源引用；已发布地址的变更需要在工程中处理迁移。资料、文章、笔记使用 resource/article/note 类型，不恢复已取消的课程、路线或知识图谱。

## 分支、提交与合并

采用一个正式分支 `main` 加短期工作分支，不设长期 `develop`。初始化允许一次直接推送，随后开启保护：

1. 根据实际问题建立 Issue；小型文档或维护修改可以直接开 PR。
2. 从最新 `main` 建立一个范围明确的工作分支。
3. 修改对应规范和实际文件，运行相关检查，向 `main` 提交 PR。
4. PR 写明 P/R/U/T 编号、变更后的行为、真实验证和未完成项。
5. 必需检查通过、分支更新到最新 `main`、讨论解决后，以 Squash 合并并自动删除远程工作分支。

分支格式为 `<类型>/<编号或范围>-<说明>`：`feature/t07-knowledge-overview`、`fix/pdf-download`、`design/u03-prism-motion`、`docs/repository-conventions`、`content/first-note`、`chore/update-ci-tools`。

提交和 PR 标题使用 `<类型>(<范围>): <中文说明>`，例如 `docs(repository): 建立目录与命名规范`、`fix(knowledge): 修复资料下载地址`。类型采用 feat、fix、docs、style、refactor、test、chore；style 表示代码格式，视觉功能变化按 feat/fix 描述。每次提交有完整意义，不使用“最终版2”“update”等难以定位的名称。

单人维护要求 PR 与检查，但不强制第二人批准，避免作者无法批准自己的 PR。多人协作后再调整审批人数及 CODEOWNERS。任何人（含管理员）不得常规直接推送、强制推送或删除 `main`；回退通过 `git revert` 的新 PR 完成。[分支保护](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

未来 Pages CMS 默认采用工作分支及 PR；若托管版不支持受保护分支流程，先验证其能力并调整集成，不能为了接入直接关闭主分支保护。CMS 接入仍属于 T13，当前尚未配置。

## GitHub 功能与标签

- Issues 用于项目问题、需求和工程任务；故障使用故障表单，设计/技术/内容需求使用变更表单。Issue 是工作记录，任务状态的依据仍是两侧 PLAN 中的实际证据。
- 标签使用 `bug`、`enhancement`、`documentation` 和 `area:design`、`area:technical`、`area:content`、`area:ci`；一项问题标明类型和主要领域即可。
- Discussions 为后续 Giscus 留言准备。开启 Discussions 不代表 Giscus 已安装、分类已绑定或留言已接通；推歌审核仍是独立功能。
- Wiki 关闭，项目资料统一保存在 `docs/`；当前不另建 Projects 看板，不重复维护同一任务状态。
- Dependabot 的更新进入 PR，检查后人工合并，不自动更新正式分支。根网站依赖与 tools/ci 的 npm 更新分别配置。
- 首个真正可用版本验证后再打 `v0.1.0` 标签与发布记录，后续版本记录新增、修复和限制。当前不创建表示网站已完成的版本。

## 检查、发布与资源边界

PR 必需检查为 `Repository checks`、`Workflow syntax` 和 `Astro build`。2026-10-07 网站工程首次远程构建成功后，第三项已加入并读回，证据记录在技术 PLAN。不以跳过代替成功构建。

```powershell
npm ci --prefix tools/ci --ignore-scripts --no-audit --no-fund
npm --prefix tools/ci run check
npm --prefix tools/ci test
```

网站初始化后追加 `npm ci`、`npm run check`、`npm run build`，并按改动验证浏览器交互或外部服务。设计单轮一个主要变量，记录控件/页面编号、概念依据、产物、实际证据和下一步；不为低风险文案或规范修改增加机械测试。

单个仓库文件上限为项目约定的 50 MiB；静态产物预算为 900 MiB。原始学习资料、真实 `.env`、服务端密钥和本机路径不进入公开仓库或网站产物；`.env.example` 只能有占位值。第三方素材记录 URL、作者、许可、采用状态与必要改造，许可未确认的候选不能直接发布。

Actions 默认令牌只读，Pages 部署 job 单独申请 pages/id-token 写权限；PR 不部署。只有默认分支的成功构建可发布。详细触发和恢复方法见 [GitHub 工作流说明](GITHUB_WORKFLOW.md)。

## 远程配置与实际验收

[repository-settings.json](../../.github/repository-settings.json) 保存本阶段远程设置的期望值，GitHub 不会自动读取这个文件。远程应用与读回验证的日期和结果记录在 [技术计划](PLAN.md)，状态不得只凭本文件判断。

2026-10-07 已通过官方 API 应用并读回下列设置；初始化 CI 两项检查均成功，绑定的 GitHub Actions App ID 为 15368。Astro 基础工程正在功能分支建立，Pages 尚未部署。

| 设置 | 本阶段期望值 |
| --- | --- |
| 可见性、默认分支 | public、main |
| 合并 | 仅 Squash；合并后删除工作分支；自动合并关闭 |
| 主分支保护 | 必须 PR；0 个强制审批；管理员同样受约束；不允许强推与删除；要求解决讨论与线性历史 |
| 必需检查 | Repository checks、Workflow syntax、Astro build；来源由已运行的 GitHub Actions 核对，均绑定 App 15368 |
| Actions 默认权限 | read；不允许 Actions 自动批准 PR |
| Pages 来源 | GitHub Actions；无网站工程时不发布 |
| Issues / Discussions / Wiki | 开启 / 开启（待接 Giscus）/ 关闭 |

后续调整规范时，同时修改本文件、相关配置和实际远程设置，记录证据；需求变更仍以最新用户指令优先。
