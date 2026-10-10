# 个人主页技术调研来源和候选方案

## T13.12 资料说明编辑来源（2026-10-10）

资料样本侧栏复用 [Starlight sidebar](https://starlight.astro.build/guides/sidebar/) 的原生 slug 配置，从条目标题生成名称；取消该样本固定 label，其他科目仍采用原生 autogenerate。真实构建及浏览器验证标题同步，不复制导航组件。Pages CMS 原生序列化会展开 YAML 列表并去掉正文前一个空行；真实 Save 后正文文字与未开放字段保留，最终原样恢复功能样本，不能声称每次 Save 都字节不变。

已读 [Pages CMS content](https://pagescms.org/docs/configuration/content/) 与[fields](https://pagescms.org/docs/configuration/content/fields/)的 collection、subfolders、operations、string/text/list、description 配置。复用原生目录和三个元数据字段，不复制后台代码。固定官方 6f4e860a35d934406580287e7042e5e111e207a1（MIT，本机缓存已读）的 files POST 在 settings.content.merge:true 时先 parse 既有文件，再 mergeWith 合并；传入数组整体替换，未配置 source 和 body 保留。托管版本未知，实际 Save 后的字段、正文与PDF指纹分别核对，源码能力不代替真实证据。

## T13.11 原生关联选择来源（2026-10-10）

已读 [Pages CMS reference](https://pagescms.org/docs/configuration/fields/reference/) 与 [select](https://pagescms.org/docs/configuration/fields/select/)。托管 reference 根目录只有三个文件夹、候选为空；固定官方 6f4e860a35d934406580287e7042e5e111e207a1（MIT）的 [getCollectionCache](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/lib/github-cache-file.ts) 按 parentPath 等值读取，subfolders 不会递归聚合 reference。原先根目录查询方案已撤回。

采用官方 [Select EditComponent](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/fields/core/select/edit-component.tsx)：multiple 映射字符串 value 数组，label 搜索、选中 chip 与移除由原生 Combobox 承担。少量适配仅递归读取既有内容、生成原生 values 参数与检查过期；复用已安装 @astrojs/markdown-remark 的 parseFrontmatter，不另增 YAML 库。新内容进入候选需同步配置，后台托管版本未知，实际 Save 独立验收。

## T07.05 标签浏览开关来源（2026-10-10）

已读本机锁定 starlight-blog 0.30.0（MIT）的 `libs/config.ts`、`libs/tags.ts`、`components/PostTags.astro`、`middleware.ts` 和 `routes/Tags.astro`。无标签禁用配置；标签列表、侧栏和静态路径均读取原生有效 tags，因此仅在 article schema 读取时按开关清空 tags，保留源文件，不复制插件或新建路由。Astro 7.3.6 的 `content/loaders/glob.js` 按 digest 复用已解析数据，`content/utils.js` 仅计算内容配置文件摘要；将设置值纳入原生 loader 的 generateDigest，保证仅改变 JSON 时缓存也更新。相同输出目录与已有缓存的开/关/再开构建独立验收。

Pages CMS 复用既有固定官方源码 `6f4e860a35d934406580287e7042e5e111e207a1` 的 ConfigSchema、boolean 注册和 JSON 序列化（MIT，缓存已读）；本机校验后再验证托管实际 Save。托管版本未知，不将源码能力当成真实网页证据。

## T13.07 图片选择取消来源（2026-10-09）

复用 [Pages CMS rich-text](https://pagescms.org/docs/configuration/fields/rich-text/) 的 Markdown、Editor/Source 和命名媒体源。[固定官方 MediaDialog](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/media/media-dialog.tsx)的关闭会清空 selectedImages，只有 Select 才调用正文插入；[rich-text 接入](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/fields/core/rich-text/edit-component.tsx)在关闭时取消待选择结果。本机缓存已读，MIT；不复制到应用源码，托管部署版本未知。

[固定官方 MediaUpload](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/media/media-upload.tsx)在选中文件后发起媒体 POST；关闭选择弹窗不构成该写入的撤回。本轮没有新上传，不以源码推断已验中止或回滚；[T13.02](iterations/t13-02-hosted-2026-10-08.md)已有单张真实上传证据。

[字段 description](https://pagescms.org/docs/configuration/content/fields/)承接入口与取消边界的最小说明。当前 rich-text 公开配置未找到关闭后恢复正文焦点的开关；实测焦点是 BODY，因此保留该缺口，不另建上传器或在托管后台注入脚本。[真实记录](iterations/t13-07-2026-10-09.md)区分 Close/Esc、工具控制的文件选择打开和未验的系统取消按钮。

## T13.06 保存冲突与恢复来源（2026-10-09）

[GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)要求更新时提供当前 blob SHA，并列出 409 Conflict。本轮只推进工作分支已有测试草稿的服务器版本，真实旧 SHA Save 失败后未产生提交；没有更改主分支保护或权限。

固定官方源码 [Entry](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/entry/entry.tsx)的 POST 传递 sha，显示保存中/成功/错误，并在 finally 恢复保存状态；[官方固定版本源码](https://github.com/hunvreus/pagescms/tree/6f4e860a35d934406580287e7042e5e111e207a1)的 files/[path]/route.ts 对旧 SHA 返回文件已改变的错误，新建重名则可能自动改名。仅用于选取可控失败场景，不复制组件或将源码版本称为线上版本。托管部署版本仍未知，最终结论取自实际 UI 与仓库读回。

[原生字段 description](https://pagescms.org/docs/configuration/content/fields/)覆盖本轮恢复说明需求；Source/Editor 已有，本轮不另建导出、自动备份或合并器。[实际验证](iterations/t13-06-2026-10-09.md)只覆盖旧版本冲突，不能推断断网、超时、403 或上传错误同样保留输入。

## T13.05 未保存说明与原生边界（2026-10-09）

[官方字段配置](https://pagescms.org/docs/configuration/content/fields/)提供 `description` 作为字段下方说明，覆盖本轮两个 title 字段的最小提示需求。[官方 settings](https://pagescms.org/docs/configuration/settings/)及已缓存的固定版本 [ConfigSchema](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/lib/config-schema.ts)中没有找到未保存导航拦截开关；这是当前公开配置核对结果，不是对所有内部能力的断言。托管部署版本仍未知。缓存的 [EntryForm](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/entry/entry-form.tsx)可读 dirty 状态，但不以源码推断线上已保护导航。

真实托管侧栏/面包屑返回直接放弃输入，原文未误写；工具 reload 也恢复已存标题，所有刷新/关闭手势未验。配置只能承接清楚说明，本轮不新建后台或注入脚本，留在编辑/继续离开的二次确认继续列为缺口。[实际记录](iterations/t13-05-2026-10-09.md)。

## T13.04 原生文章集合来源（2026-10-09）

复用 Pages CMS 官方的 [content/collection](https://pagescms.org/docs/configuration/content/)、[filename 模板](https://pagescms.org/docs/configuration/content/filename/)、[列表 view](https://pagescms.org/docs/configuration/content/view/)、[operations](https://pagescms.org/docs/configuration/content/operations/) 和 [字段 pattern](https://pagescms.org/docs/configuration/content/fields/)。原生集合覆盖同目录的列表、新建、搜索与再编辑；采用 `{fields.entryId}.md`、默认草稿及现有图片配置，无额外后台、依赖或路由主题。

源代码核对固定在官方 `hunvreus/pagescms` 的 `6f4e860a35d934406580287e7042e5e111e207a1`（仓库声明 2.1.8、MIT）；托管部署版本未读回，不把源码版本称为线上版本。[UUID 字段源码](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/fields/core/uuid/index.tsx)要求合法 UUID，会拒绝当前文章的语义 ID；本轮采用必填字符串与小写英文/数字/短横线校验，避免迁移原条目。[配置 schema 与原生初始化](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/lib/schema.ts)用于本机隔离校验，未复制进应用源码。实际托管新建、重开和提交/CI 结果见[本轮记录](iterations/t13-04-2026-10-09.md)。

## T08.02 PDF 侧栏收起（2026-10-08）

已安装 PDF.js 6.4.299 的 Sidebar/ViewsManager 与 viewer.html 实读：关闭由外部 viewsManagerToggleButton 管理，标题内 viewsManagerSelectorButton 只切换视图，没有关闭入口。本轮以独立 lssh-controls.mjs 调用原生开关，不编辑发行版 viewer.mjs/viewer.css、不自管状态；关闭历史和aria继续由原生实现维护。具体改造及Apache-2.0声明见[资源登记](../../public/pdfjs/README.md)，行为和尺寸见[本轮证据](iterations/t08-02-2026-10-08.md)。

## T07.04 学习总览排序复用（2026-10-08）

原生 Starlight 导航不提供跨类型统一业务列表排序，starlight-blog 的日期列表仅覆盖文章；本轮复用已发布查询、原生 HTML select 和 URL/history，以构建期中文自然标题序号补充该最小缺口。浏览器只移动已有列表节点，无新主题、集合、排序库或数据服务。相同标题按稳定 ID 排序，降序为完整升序的反转；默认恢复现有主题序号。

实际源码、自然章节/同名边界、204 种组合和来源返回见[工程记录](iterations/t07-04-2026-10-08.md)。单控件 UX 使用既有本机 ui-ux-pro-max Web 焦点/键盘规则，颜色字体仍由 SYSTEM 决定。这个静态排序不增加搜索过滤、PDF 全文、日期或总览分页能力。

## T06.01 单个公开 PDF 来源（2026-10-08）

复用 Astro public 静态复制与已接入的 PDF.js 6.4.299，同源路径覆盖阅读和下载；原生 docs schema 增加两个配对字段即可，无资源服务、集合或 npm 依赖。现有 Git 文件与发布预算足以承载本次 65,959 字节样本。

正文由项目生成，采用 [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)；嵌入中文字体采用 [Google Fonts Noto Sans SC](https://github.com/google/fonts/blob/main/ofl/notosanssc/upstream_info.md) 及独立 [OFL-1.1](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt)，版本和实际哈希见[登记](../../public/materials/README.md)。本机静态 OTF 为 CFF 轮廓，ReportLab 不支持，因此使用已有可变 TrueType 经 fontTools 实例化 400/600 字重后子集嵌入。PDF 制作工具仅用于生成和复验，网站及 CI 使用已提交 PDF，不安装 Python 或网页字体。

干净构建的阅读／下载及 SHA 校验、7 种坏附件拒绝、独立 Edge 17 组见[本轮记录](iterations/t06-01-2026-10-08.md)。PDF 内中文搜索实测可用；Pagefind 只检索条目 HTML，不增加 PDF 全文或 OCR 承诺。远程文件可访问和正式站部署分别验收。

## T26.01 阅读返回与 PDF 原生历史（2026-10-08）

- [MDN pageshow](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event) 与 [History.back](https://developer.mozilla.org/en-US/docs/Web/API/History/back)：复用真实浏览器历史，pageshow/popstate 恢复来源状态；章节 hash 另建历史时直接沿来源 href 并交接焦点，不用一次 back 猜测目的地。
- [PDF.js ViewHistory 源码](https://github.com/mozilla/pdf.js/blob/master/web/view_history.js)为能力参考；实际核对仓库已锁定 6.4.299 的 `public/pdfjs/web/viewer.mjs` 中 ViewHistory、storedHash/setInitialView/updateviewarea 和嵌入时不创建 PDFHistory 的条件。当前原生按 fingerprint 持久 page/zoom，固定 zoom hash 会优先覆盖该状态；只删除应用 URL 中的强制 fragment，不改 vendor 文件或新增 PDF 状态依赖。
- 复用已有发布查询、来源适配及 PDF.js 的 Apache-2.0，外部笔记地址只取已发布 source.url。新依赖为 0；[本轮记录](iterations/t26-01-2026-10-08.md)登记真实浏览器结果、改前基线和持久能力限制。浏览器外站回退测试与外站可达性分别记录。

## T07.02 原生主题选择与 URL（2026-10-08）

- [Astro 内容集合](https://docs.astro.build/en/guides/content-collections/)：继续使用现有 getCollection/docs loader 和 publishedKnowledge，主题来自同一公开查询，不新建索引集合或迁移内容字段。
- [原生 select](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select)：可见 label 和 option/value 提供单主题选择；没有自定义下拉、React 或新控件依赖。实际 Edge 键盘/触摸目标、手机与文字放大分别验证。
- [URLSearchParams.set](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/set)：原生编码中文、空格、& 和引号，保留其他参数；沿用 history/popstate 并补 pageshow 恢复。主题值精确匹配实际成员，不拼接选择器或作为 HTML 输出。
- [本轮记录](iterations/t07-02-2026-10-08.md)含 76 种独立内容对照、19 组浏览器结果和可复现隔离样稿；现有依赖/许可沿用，新增依赖为 0。

## T02.01 公共目录与前缀（2026-10-08）

- [Starlight 组件扩展](https://starlight.astro.build/reference/overrides/)：只覆盖 SiteTitle，在组合层复用原生 SiteTitle；已实查 0.42.5 的 `dist/components/SiteTitle.astro`、Header、Sidebar、PageFrame 和 MIT 许可，保留原生搜索、主题与移动学习导航。适配 title-wrapper 的局部裁切，不替换整个 Header。
- [Starlight sidebar](https://starlight.astro.build/guides/sidebar/)：手写内部链接交给原生路由处理 base，修复此前三处手动重复前缀；主站共享路径继续由已有 sitePath 生成。实际产物与点击验收支持本轮配置结论。
- [原生 details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) 提供无脚本展开/关闭与 summary 键盘行为；[ARIA current](https://www.w3.org/TR/wai-aria-1.2/#aria-current) 区分栏目首页 page 和子页所属 location。仅补项目要求的关闭、焦点和生命周期，不新增 React 控件库。
- [本轮记录](iterations/t02-01-2026-10-08.md)保存 16 组浏览器结果和重复前缀失败证据；CI 增加构建产物检查，不修改工作流触发和部署条件。

## T09.01 稳定 ID 与原生链接（2026-10-08）

- [Astro 集合引用](https://docs.astro.build/en/guides/content-collections/#defining-collection-references)：原生 reference 按集合条目 ID 引用；当前 `related` 已存业务 `entryId`，两者不同。沿用 getCollection 和现有 loader/schema，补小范围 ID 映射，避免迁移现有内容或替换路由。
- [Starlight MarkdownContent 覆盖](https://starlight.astro.build/reference/overrides/#markdowncontent)：继续在既有覆盖中组合静态正文与关联 nav，保留博客原生 MarkdownContent；没有新主题或客户端依赖。
- 目标地址使用已有 `sitePath`，明暗模式使用 Starlight 语义色。实际版本沿用锁文件；未知 ID 失败、草稿排除、当前 426 条关联和浏览器证据见 [本轮记录](iterations/t09-01-2026-10-08.md)。

## T07.03 原生标签与分页（2026-10-08）

- [starlight-blog 配置](https://starlight-blog-docs.vercel.app/configuration/#postcount)：`postCount` 控制主文章列表每页数量，默认 5；本轮显式设为 5。原生静态页地址和前后链接通过本机生产构建验证。
- [标签和草稿 frontmatter](https://starlight-blog-docs.vercel.app/guides/frontmatter/)：沿用原生 `tags` 和 `draft`，同一已发布查询参与列表/标签。已安装 0.30.0 的 `libs/content.ts`、`libs/tags.ts`、`routes/Blog.astro` 和 `routes/Tags.astro` 实查：主列表分页，标签一页显示全部匹配文章，不能把主列表 `postCount` 描述为标签分页配置。
- 原生路由、Posts 与 PrevNextLinks 未修改；唯一标签适配在已有来源返回中辨认 `data-blog-page="tag"`。19 组结果和样本来源见 [T07.03 证据](iterations/t07-03-2026-10-08.md)。没有新增依赖或候选主题。

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

## T13.10 原生正文链接来源（2026-10-09）

- [Pages CMS 富文本配置](https://pagescms.org/docs/configuration/fields/rich-text/)和[固定官方编辑器](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/ui/editor/index.tsx)：MIT；原生 Link `openOnClick: false`、已有地址预填、`Set link`/Enter 应用、`extendMarkRange` 更新链接；[富文本适配](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/fields/core/rich-text/edit-component.tsx)承接 Markdown，不复制代码或换编辑器。
- 托管版本未读回，实际选择/插入/修改、原生 GitHub 保存/刷新、网站草稿点击到正确文章和官方文档构成验收；只验证本轮有效相对地址和 HTTPS 地址，不扩大为所有协议、空/非法地址、移除/取消或手机已验。[实际记录](iterations/t13-10-2026-10-09.md)。

## T13.09 原生图片替代文本来源（2026-10-09）

- [Pages CMS 原生富文本配置](https://pagescms.org/docs/configuration/fields/rich-text/)：继续使用既有 Markdown、Editor/Source 与命名媒体源，只补操作说明。
- [固定官方编辑器源码](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/ui/editor/index.tsx)：MIT；原生 `Image alt text` 按钮显示 ALT，`Describe image` 输入通过 Enter 或 `Save alt text` 应用，`updateAttributes` 保存图片 alt；[原生富文本适配](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/fields/core/rich-text/edit-component.tsx)承接 Markdown。未复制源码、引入新编辑器或依赖。
- 托管版版本未读回，实际按钮、Enter、Source、原生 GitHub 提交和刷新重开构成验收；源码存在删除入口不等于删除已验。[记录](iterations/t13-09-2026-10-09.md)。

## T13.08 上传格式拦截来源（2026-10-09）

- [Pages CMS 媒体配置](https://pagescms.org/docs/configuration/media/)与[原生富文本](https://pagescms.org/docs/configuration/fields/rich-text/)：继续使用同一命名媒体源和已配置五种图片扩展名，不新建上传器、后端或依赖。
- [固定官方 MediaUpload 源码](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/media/media-upload.tsx)：MIT；`filterAcceptedFiles` 在 `handleFiles`/媒体 POST 前按扩展名拦截，toast 列出允许格式；合规文件使用原生上传路径。[MediaDialog](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/media/media-dialog.tsx)负责成功后选择，Select 才插入正文。只研究和复用配置，没有复制源码到产品。
- 托管版版本未读回，因此以本轮真实 TXT 提示、同一弹窗 PNG 恢复、GitHub 文件提交和未保存内容保护作为验收。只验扩展名，不将图片真实编码校验、网络/API 错误或上传中止称为已验。[记录](iterations/t13-08-2026-10-09.md)。

## T13.02 原生图片接入来源（2026-10-08）

- [Pages CMS 媒体源](https://pagescms.org/docs/configuration/media/)：仓库存储 input、正文 output、格式过滤、随机重命名与媒体提交模板。
- [原生富文本图片](https://pagescms.org/docs/configuration/fields/rich-text/)：命名媒体源、Markdown 与 Editor/Source；[图片字段](https://pagescms.org/docs/configuration/fields/image/)仅作为候选，本轮正文插图无需另设字段。
- [固定官方源码](https://github.com/hunvreus/pagescms/tree/6f4e860a35d934406580287e7042e5e111e207a1)：`lib/config-schema.ts`、`lib/github-image.ts`、`fields/core/rich-text/edit-component.tsx`、`components/ui/editor/index.tsx`。核对相对路径往返和原生 alt 控件；来源 MIT，本轮不复制组件到产品代码。托管部署版本未读回。
- [Astro 原生 Markdown 图片](https://docs.astro.build/en/guides/images/#images-in-markdown-files)：使用 src 中的相对路径，处理尺寸和构建资源；public 原样复制。当前 7.3.6 实测草稿引用的图片仍会被输出，页面排除不代表图片二进制私密。
- [Starlight-blog 草稿](https://starlight-blog-docs.vercel.app/guides/frontmatter/#draft)：原生开发模式预览、生产排除，本机 0.30.0 已用 Edge 核验。

## T13.03 发布状态与构建来源（2026-10-08）

- [Pages CMS 原生 boolean](https://pagescms.org/docs/configuration/fields/boolean/)：复用 `draft` 开关，默认开启；实际字段/保存规则沿用现有固定文件与 merge 配置。
- [GitHub 工作流分支过滤](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushbranchesbranches-ignore)：当前新增 `codex/t13-03-*` 的 push 构建验证。部署条件继续读取默认分支，工作分支只能生成候选产物。
- [原生 CMS actions](https://pagescms.org/docs/configuration/actions/)需要 workflow_dispatch payload；已有 push 工作流覆盖当前保存后构建目标，因此本轮不新增后台 action、workflow 或额外授权。
- [Starlight-blog draft](https://starlight-blog-docs.vercel.app/guides/frontmatter/#draft)及已安装 0.30.0：三份原生生产构建实际验证关闭草稿、修改内容、再次开启的各视图结果。

## T09.02 反向关系与验收来源（2026-10-08）

- [Starlight 组件扩展](https://starlight.astro.build/guides/overriding-components/)：在既有 MarkdownContent 扩展中保留原生正文并追加静态导航，本轮不改路由或 loader。已安装 Starlight 0.42.5 / starlight-blog 0.30.0；现有业务 `entryId` 关系仍由上一轮最小适配承接。
- [Quartz 反向链接](https://quartz.jzhao.xyz/features/backlinks)：借鉴来源链接列表和空列表隐藏。其插件面向 Quartz，本轮已有 Astro/Starlight 工程，因此只参考体验，不引入另一个站点框架或复制源码；同一公开关系的反转约 6 行，无额外依赖。
- [Astro cacheDir](https://docs.astro.build/en/reference/configuration-reference/#cachedir)：默认缓存位于 `node_modules/.astro`。本机样稿共享依赖 junction 时，首次并行构建出现 51/54 页不一致；已核对安装源码的内容数据缓存路径。验收生成器为自身设置独立 Astro/Vite 缓存，逐快照检查三个来源页与目标列表；重建两份均为 54 页。正式工程的配置未改。
