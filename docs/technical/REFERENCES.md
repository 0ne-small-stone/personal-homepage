# 个人主页技术调研来源和候选方案

文档对应（2026-10-07 整理）：本文件为技术侧 `REFERENCES.md`，对应[设计复用与素材来源](../design/REFERENCES.md)。本文维护依赖能力、官方文档与运行条件，设计侧维护体验参考、素材许可和改造范围；职责映射见[文档对应表](../README.md)。原调研日期与未验证边界沿用。

本文件保存 2026-10-02 的基础调研，以及 2026-10-03 对 Starlight、博客和搜索说明的补充核对，供实施时定位官方文档和候选项目。链接存在和文档描述可支持选型，不能代替实际版本兼容、账号权限、网络表现和部署验证。

2026-10-07 已安装 Astro、Starlight 和博客插件，采用清单见下文。未列为已采用的依赖仍属于实施候选，决策边界见 [技术方案](SPEC.md)；组件与素材的许可、改造范围见[设计复用与素材来源](../design/REFERENCES.md)，接入阶段见[技术实施计划](PLAN.md)。

2026-10-03 方案更新：学习资料、博客和数字花园合并为知识库，现成方案优先。先沿用框架与插件原生集合和路由，再配置统一入口、检索和引用；对实际缺口做最小扩展。

2026-10-07 候选范围调整：按用户最新需求移除知识关系图及其插件、接入文档；学习内容通过总览、搜索和普通引用浏览。原有其余来源与未验证状态沿用。

## Astro 官方能力

### T01 工程采用记录（2026-10-07）

从 [Starlight 官方快速开始](https://starlight.astro.build/getting-started/) 的模板初始化，保留原生 docs loader/schema、阅读导航、目录和 Pagefind。自定义主站页面使用 Astro 静态组件，学习总览使用官方 [StarlightPage](https://starlight.astro.build/guides/pages/#starlightpage-component)。博客按插件的 [配置](https://starlight-blog-docs.vercel.app/configuration/) 设置 `knowledge/blog` 前缀；演示阶段关闭 RSS 与结构化个人信息，正式内容接入后再启用。

| 直接依赖 | 锁定版本 | 安装包许可 | 本轮用途 |
| --- | --- | --- | --- |
| astro | 7.3.6 | MIT | 静态页面、开发与预览服务 |
| @astrojs/starlight | 0.42.5 | MIT | 知识阅读与原生搜索 |
| @astrojs/markdown-remark | 7.3.2 | MIT | Starlight 要求的官方 peer 依赖 |
| starlight-blog | 0.30.0 | MIT | 原生文章列表和标签 |
| sharp | 0.35.3 | Apache-2.0 | 官方模板的图片处理依赖 |
| @astrojs/check | 0.9.10 | MIT | Astro 类型检查 |
| typescript | 5.9.3 | Apache-2.0 | 严格类型配置 |

版本、peer 范围与许可已通过 npm 官方注册表及已安装包核对，完整依赖树锁定于根 `package-lock.json`。这些许可不扩展到个人正文、照片或本地教材。当前页面没有需要 React 的复杂交互，未提前安装 React、动画、3D、CMS 或播放器候选。兼容与浏览器实际结果另记于 PLAN。

| 来源 | 用于什么 |
| --- | --- |
| [岛屿架构](https://docs.astro.build/en/concepts/islands/) | 内容静态生成，交互区域按需加载 |
| [React 集成](https://docs.astro.build/en/guides/integrations-guide/react/) | 接入 React 交互组件 |
| [Content Collections](https://docs.astro.build/en/guides/content-collections/) | 结构化内容与校验 |
| [View Transitions](https://docs.astro.build/en/guides/view-transitions/) | 页面转场、持久组件和生命周期 |
| [图片处理](https://docs.astro.build/en/guides/images/) | 构建时图片优化与合适尺寸 |
| [CMS 接入](https://docs.astro.build/en/guides/cms/) | 网页内容编辑的接入方式 |
| [部署文档](https://docs.astro.build/en/guides/deploy/) | 静态产物及各平台配置 |
| [Server Islands](https://docs.astro.build/en/guides/server-islands/) | 需要适配器和执行环境的动态渲染 |

Astro 的交互组件可用于静态主站，但服务端动作和延迟服务端渲染不能仅靠静态文件执行。持久组件也不能保证外部 iframe 不重载，见转场文档中的限制。

## 内容管理和阅读

2026-10-08 T09.03：继续使用已锁定的 Astro/Starlight/blog/Expressive Code，不增加依赖。已核对已安装的 `Search.astro`、blog `Preview.astro`、`Metadata.astro` 与条件 MarkdownContent 包装；原生支持正文、目录、列表、代码及检索。按 [Starlight 组件覆盖](https://starlight.astro.build/guides/overriding-components/)保留原生 slot；按 [博客 UI 翻译](https://starlight-blog-docs.vercel.app/guides/i18n/)及 [Starlight 翻译集合](https://starlight.astro.build/zh-cn/guides/i18n/)补中文日期/标签和检索文案。插件不内置中文，已安装源码与官方文档一致。本轮最小缺口适配仅涉及来源返回和原生搜索状态恢复，实际验收见 [T09.03](iterations/t09-03-2026-10-08.md)。

| 项目 | 适用范围和取舍 |
| --- | --- |
| [Pages CMS](https://github.com/hunvreus/pagescms) | GitHub 内容与媒体编辑；默认考虑官方托管版，自托管当前需要 PostgreSQL 等依赖 |
| [Pages CMS 配置](https://pagescms.org/docs/configuration/) | 配置 .pages.yml、内容集合、字段、媒体与工作流按钮 |
| [内容字段](https://pagescms.org/docs/configuration/content/fields/)、[操作范围](https://pagescms.org/docs/configuration/content/operations/) | T13.01 固定文件、隐藏/只读字段及关闭创建/改名/删除；readonly 是表单行为 |
| [合并及提交配置](https://pagescms.org/docs/configuration/settings/)、[日期字段](https://pagescms.org/docs/configuration/fields/date/) | `merge: true` 保留未建模字段；保存提交与 PR/发布区分；日期字符串需兼容博客 Date |
| [富文本](https://pagescms.org/docs/configuration/fields/rich-text/)、[快速开始](https://pagescms.org/docs/quick-start/) | 原生 Markdown/Source、关闭媒体；官方托管版登录和仓库授权步骤 |
| [Pages CMS 工作流按钮](https://pagescms.org/docs/configuration/actions/) | 可配置自定义 Actions 入口 |
| [Pages CMS Astro 示例](https://github.com/pagescms/astro-blog-template) | 参考 Astro 内容与 CMS 配置，不盲目继承旧依赖 |
| [Starlight](https://starlight.astro.build/zh-cn/) | 当前优先验证的知识库基础方案；提供导航、搜索、代码高亮等原生能力 |
| [Starlight 搜索](https://starlight.astro.build/zh-cn/guides/site-search/) | 默认集成 Pagefind；复用搜索入口与构建流程，避免再搭一套搜索 |
| [starlight-blog](https://github.com/HiDeoo/starlight-blog) | 为 Starlight 增加文章列表、分页、标签及 RSS |
| [博客接入说明](https://starlight-blog-docs.vercel.app/getting-started/) | 扩展 Starlight 原生 docs schema，沿用博客目录与日期字段；可与业务字段组合 |
| [Starlight 插件目录](https://starlight.astro.build/zh-cn/resources/plugins/) | 链接检查、图像缩放、博客等候选 |
| [starlight-obsidian](https://github.com/HiDeoo/starlight-obsidian) | 以后从 Obsidian 笔记库发布内容的可选入口 |
| [Pagefind 索引配置](https://pagefind.app/docs/indexing/) | 统一知识库静态 HTML 搜索；PDF 全文需要另行提取和接入 |
| [PDF.js](https://github.com/mozilla/pdf.js) | 浏览器 PDF 阅读能力 |

## 模板、交互组件与兼容性参考

| 项目 | 适用范围和取舍 |
| --- | --- |
| [AstroPaper](https://github.com/satnaing/astro-paper) | 博客模板备选；若 Starlight 博客方案满足需求，不再引入第二套完整博客主题 |
| [Fuwari](https://github.com/saicaca/fuwari) | 动画、页面转场、主题和搜索参考；不要同时叠加其整套路由与另一套转场方案 |
| [React Bits](https://github.com/DavidHDev/react-bits) | 可定制 React 动效组件；许可为 MIT 加 Commons Clause |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | React 3D 交互基础 |
| [Drei](https://drei.docs.pmnd.rs/) | R3F 辅助库；透射材质等现成能力，用于首页棱镜候选 |
| [3D 性能指南](https://r3f.docs.pmnd.rs/advanced/scaling-performance) | 按需渲染、资源管理和性能调节 |
| [PhotoSwipe](https://photoswipe.com/) | 照片与相册的展开、缩放和触摸浏览；MIT 许可 |
| [APlayer](https://github.com/DIYgod/APlayer) | 音乐播放器候选；HTML5 音频、列表与歌词；MIT 许可 |
| [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) | 展开层与对话框的焦点管理和 Esc 关闭；按需引入 |
| [Lucide](https://lucide.dev/license) | 成套界面图标；ISC 及部分源自 Feather 的 MIT |
| [Quartz 反向引用](https://quartz.jzhao.xyz/features/backlinks) | 跨内容引用与连续阅读体验参考；Quartz 是独立框架 |

先尝试成熟完整方案，再选取确有需要的组件。代码及附带素材的使用许可分别核对；自研前记录具体候选、实际能力缺口与最小实现范围。

在线演示曾未能完成浏览器交互检查，未验证本项目中的运行时兼容性和手机性能。不能将上述候选描述为已测试可直接组合的成品。

## 留言和音乐

| 来源 | 关键事实 |
| --- | --- |
| [Giscus 中文说明](https://giscus.app/zh-CN) | 留言存于 GitHub Discussions；需公开仓库、开启 Discussions、安装应用；访客需要 GitHub 登录及授权 |
| [GitHub 讨论管理](https://docs.github.com/en/discussions/managing-discussions-for-your-community/moderating-discussions) | 所有者可以管理讨论，常规工作方式不是公开前审核队列 |
| [GitHub Actions 事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#discussion_comment) | 评论创建、编辑、删除可触发工作流；文件需位于默认分支，相关讨论事件处于公开预览 |
| [网易云第三方 API 候选](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced) | 候选服务端接口，尚未完成本项目账号与运行时验证 |
| [歌单添加接口源码](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced/blob/main/module/playlist_tracks.js) | 可研究歌曲加入歌单的实现；代码存在不代表真实授权和写入一定成功 |

Waline 曾作为匿名留言候选。当前用户已接受 Giscus，Waline 不再是默认留言方案。

## 部署和文件限制

2026-10-07 T08.01：复用 [PDF.js 官方 generic 发行版](https://mozilla.github.io/pdf.js/getting_started/)及[官方 6.4.299 附件](https://github.com/mozilla/pdf.js/releases/download/v6.4.299/pdfjs-6.4.299-dist.zip)，Apache-2.0；运行代码、worker、CMap/字体、WASM 与本地语言完整接入，来源校验见 [vendor 登记](../../public/pdfjs/README.md)。成熟阅读器已覆盖分页、缩放、搜索、下载；适配代码只承接结构化来源 ID、当前条目 iframe、加载/失败反馈和本地副本准备，不重写 PDF 渲染。PDF 全文未进入 Pagefind，扫描文件无文字层时不提供 OCR 搜索。

2026-10-07 仓库管理规范依据：[Issue/PR 模板](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates)、[Issue 表单语法](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)、[仓库 REST API](https://docs.github.com/en/rest/repos/repos)、[分支保护 API](https://docs.github.com/en/rest/branches/branch-protection)、[Actions 权限 API](https://docs.github.com/en/rest/actions/permissions)与[Pages 设置 API](https://docs.github.com/en/rest/pages/pages)。本地模板和期望值已建立，实际设置必须应用后读回验证，记录在技术计划。

2026-10-07 用户已选择 GitHub Pages。本轮工作流相关来源如下；当前检查工具已在本地安装验证，远程运行与网站发布仍待接入。

| 来源 | 本轮用途 |
| --- | --- |
| [Astro 的 GitHub Pages 部署说明](https://docs.astro.build/en/guides/deploy/github/) | Pages 部署流程及 `site`、`base` 配置 |
| [actions/checkout](https://github.com/actions/checkout) 与 [actions/setup-node](https://github.com/actions/setup-node) | 官方源码检出与 Node.js/依赖缓存 |
| [upload-pages-artifact](https://github.com/actions/upload-pages-artifact) 与 [deploy-pages](https://github.com/actions/deploy-pages) | 官方静态产物上传与 Pages 部署 |
| [actionlint](https://github.com/rhysd/actionlint) | MIT；工作流语法、表达式和依赖检查，使用 v1.7.12 |
| [remark-validate-links](https://github.com/remarkjs/remark-validate-links) 与 [unified-engine](https://github.com/unifiedjs/unified-engine) | MIT；配置 remark/GFM 并检查本地链接与跨文档锚点，原生多文件处理 |
| [GitHub Pages 使用条件](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) | 公开范围与账号计划对 Pages 的影响 |

| 来源 | 当前用途 |
| --- | --- |
| [GitHub 大文件限制](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) | 普通 Git 超过 50 MiB 提示、超过 100 MiB 阻止；浏览器上传单文件最多 25 MiB |
| [GitHub Pages 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | 发布前核对站点与流量等限制 |
| [EdgeOne 限制](https://pages.edgeone.ai/document/limits-and-quotas) | 候选静态平台当前单文件最大 25 MB；Blob 的单值同样为 25 MB，不能当作大 PDF 的直接解决方案 |
| [EdgeOne Actions 部署](https://pages.edgeone.ai/document/use-github-actions) | CI 构建后上传产物的官方参考 |
| [EdgeOne 定价](https://pages.edgeone.ai/pricing) | 部署前重新核对免费额度、收费和区域条件 |

2026-10-07 用户已选择 GitHub Pages；EdgeOne 保留为历史候选。不要把免费额度写成永久承诺，也不要把外部服务对大陆访客的可用性写成已验证结论。
