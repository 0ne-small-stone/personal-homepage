# 个人主页技术调研来源和候选方案

2026-10-14 T09.04修订5：用户中文输入法反馈后，核对[KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)的物理位置语义与[keydown的IME说明](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event)。仅在沉浸阅读且非输入控件接管物理F/数字，组合键保留；字符key回退。自由排布继续使用本机PDF.js6.4.299的Wrapped原始inline-block/换行CSS，固定网格只在明确列数属性存在时覆盖，不改vendor。没有新依赖或素材；中文事件形状测试与真实OS输入法验证分别记录。

2026-10-14 P13/T25.24：复用Microsoft [ProtectedData.Protect / DPAPI](https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.protecteddata.protect?view=windowsdesktop-9.0)，按当前Windows用户范围加密本机登录；既有Windows加密辅助脚本增加独立网易云用途标签，上传用途保持原默认值与原熵。实际加密读回、恢复/删除和权限边界见[本片](iterations/t25-p13-2026-10-14-saved-login.md)。

2026-10-14 P13/T25.23：复核已安装API Enhanced4.41.1的`login_qr_key`、`login_qr_create`、`login_qr_check`、`login_status`及标准音源模块。维护者[标准播放源码](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced/blob/main/module/song_url_v1.js)和[接口文档入口](https://neteasecloudmusicapienhanced.js.org/)作为技术来源；当前实现明确不启用源码中的解锁分支，个人账号许可只按真实返回验证。实际源码/测试、私有内存索引与本机限定见[本片](iterations/t25-p13-2026-10-14-account-playback.md)。

2026-10-13 T25.11悬窗能力预研：[Chrome Document PiP](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)可承载任意HTML并置顶但不能由站点指定桌面位置；[媒体自动PiP](https://developer.chrome.com/blog/automatic-picture-in-picture-media-playback)从Chrome134起需播放/音频焦点/Media Session回调与浏览器权限等条件。只读核对，不代表IAB/手机或正式运行已通过；站内路由浮层先沿用T25.02，视觉选择与研究边界见[本轮](../design/iterations/u12-p13-2026-10-13-floating-player-research.md)。

## P13持续播放与推歌验证（2026-10-13）

- [Astro持久岛/ClientRouter](https://docs.astro.build/en/guides/view-transitions/)、[Starlight官方组件扩展](https://starlight.astro.build/guides/overriding-components/)：三种布局唯一audio，iframe无法按同方式保持。
- [Pagefind默认UI](https://pagefind.app/docs/ui-usage/)：复用初始化/destroy；Starlight0.42.5默认DOMContentLoaded在首次客户端进入失效，实际适配page-load和监听销毁，副本含MIT完整许可。
- [API Enhanced维护仓库](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)、[npm4.41.1](https://www.npmjs.com/package/@neteasecloudmusicapienhanced/api)：MIT，Node24二维码/账号/歌曲/歌单读写通过，未开通用服务/解锁插件；实际10首添加与部署限制见[T22–T24](iterations/t22-t24-p13-2026-10-13-recommendations.md)。

2026-10-14 T09.04修订4：继续复用固定PDF.js6.4.299的PDFDocumentProxy.getPage、PDFPageProxy.getViewport和原生缩放/渲染队列。[官方视口说明](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html)承接纸张尺寸与旋转，实际契约以已提交版本实读为准；[CSS Grid固定列](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns)和[行尺寸](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-auto-rows)承接独立页数及每组至少一屏。现成Wrapped缺少固定1–4页模式，只补最小布局和输入策略，取当前组最多4页尺寸、异步请求失效保护；手动翻组也读目标尺寸并保持比例。能力缺口、实际测试与边界见[修订4](iterations/t09-04-page-modes-2026-10-14.md)，新增依赖/素材0。

2026-10-13 T09.04修订3：沿用本机固定PDF.js6.4.299的getPageView、PageViewport尺寸/convertToPdfPoint和scrollPageIntoView的XYZ目的地，未更换版本。[官方页视口说明](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html)提供尺度/比例依据，[官方示例](https://mozilla.github.io/pdf.js/examples/index.html)说明原始viewport与旋转；本站采用固定源码实读而非把在线draft视为当前包契约。[Resize Observer](https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API)观察阅读区尺寸，合并回调以避免反复布局。现成能力不足之处及最小适配范围见[修订3记录](iterations/t09-04-adaptive-2026-10-13.md)；新增依赖与设计资源为0。

2026-10-13 T09.04修订2：实读vendored PDF.js6.4.299的scrollMode/spreadMode、Wrapped CSS、键盘缩放与ViewHistory事件；复用[官方PDFViewer源码](https://github.com/mozilla/pdf.js/blob/master/web/pdf_viewer.js)的布局/渲染队列，避免PresentationMode单页限制。结合[Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)的请求/退出及事件，一键耦合恢复。版本查询避免旧viewer/style缓存，公开守卫按同源路径和唯一文件参数检查；原排列pagehide恢复，正式结论见[记录](iterations/t09-04-pure-2026-10-13.md)。

2026-10-13 T09.04：复用[Starlight组件覆盖](https://starlight.astro.build/guides/overriding-components/)；实读0.42.5 PageFrame/TwoColumnContent/ContentPanel及博客原生MarkdownContent，沿用既有组合扩展控制和布局。[MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)说明原生请求/退出、fullscreenchange、fullscreenEnabled与Esc退出；实现以真实事件为状态源，不自动开启。PDF.js同源iframe保留节点，捕获已打开内部面板后交还原生Esc；[实际结果](iterations/t09-04-2026-10-13.md)分别记录成功与未验边界。

## 学习区收尾来源（2026-10-12）

- [Pages CMS 原生集合与目录/排除配置](https://pagescms.org/docs/configuration/content/)、[静态select](https://pagescms.org/docs/configuration/fields/select/)：复用原生笔记新建、正文和关联；沿用此前固定MIT源码及ConfigSchema，未引入新依赖。
- [Pagefind 过滤元数据](https://pagefind.app/docs/filtering/)、[Starlight搜索配置](https://starlight.astro.build/reference/configuration/#pagefind)：head meta 的属性值支持过滤与多主题；复用安装版本原生Pagefind UI，不另写搜索界面。
- [GitHub workflow触发规则](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)：GITHUB_TOKEN写入不会普通push触发，workflow_dispatch是例外。自动回写方案因此需要检查新提交的触发权限，审批拒绝后未接入；当前仅只读派生。

## T13.13 笔记说明编辑来源（2026-10-10）

复用[Pages CMS collection](https://pagescms.org/docs/configuration/content/)的subfolders/operations与[原生字段](https://pagescms.org/docs/configuration/content/fields/)的string/text/list/description；沿用T13.12固定官方6f4e860a35d934406580287e7042e5e111e207a1的merge与序列化来源（MIT，本机缓存已读）。只增加配置，不复制后台代码。托管版本未知，source作者/URL/PDF信息及Markdown文字通过实际Save读回；原生YAML/首空行规范化与最终字节恢复分别记录。前台沿用已接入的查询、自动侧栏与外部笔记直达，不新增阅读器或抓取外站正文。

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

## ALCHE 首页实现来源（2026-10-08）

| 技术问题 | 主要依据 | 本项目结论及验证状态 |
| --- | --- | --- |
| 保留 Astro、单独客户端场景 | [Astro 框架组件](https://docs.astro.build/en/guides/framework-components/)、[React 集成](https://docs.astro.build/en/guides/integrations-guide/react/) | 静态 DOM + 首页单 React island；已有框架不更换，集成待安装验证 |
| React/Three 配对 | [R3F 官方安装](https://r3f.docs.pmnd.rs/getting-started/installation) | Fiber 9 配 React 19、Fiber 8 配 React 18；实际 peer 与锁文件仍在施工时核对 |
| 透射与性能 | [Drei MeshTransmissionMaterial](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material) | 支持厚度、折射、色差和独立 buffer；会增加 render pass，需实测 samples/resolution |
| 分段进度与平滑输入 | [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)、[Lenis 官方仓库](https://github.com/darkroomengineering/lenis) | 2026-10-08 为复刻用户指定的原站行为，采用一个 Lenis 实例与现有 GSAP 协作；官方有 RAF/GSAP 接入说明，MIT。当前包版本与兼容性由开发核对，禁止双时钟和嵌套区抢滚动 |
| 源站实际实现 | [ALCHE](https://alche.studio/)、[官网依赖许可](https://alche.studio/license/)；具体脚本与哈希见[研究](../design/iterations/u03-p01-2026-10-08-10.md) | 源站也采用 Astro/Three/GSAP；其版本、Swup、定制 shader 为研究证据，不机械复制依赖表 |
| 字体与代码来源 | [IBM Plex](https://github.com/IBM/plex)、[GSAP 许可](https://gsap.com/community/standard-license/) | 本地部署明确许可的字体；Plex OFL、Three/Drei MIT、GSAP 自身许可分别登记 |

架构边界见技术 SPEC，施工队列见 PLAN 和 [任务单](HOMEPAGE_ALCHE_HANDOFF.md)。React/Three/GSAP 与最小透射已有局部结果，Lenis、精确时间编排及其完整验收尚未完成；最新原站源码/动态证据见 [17 轮研究](../design/iterations/u03-p01-2026-10-08-17.md)，不得沿用初轮“全部未安装”的快照。

## GitHub #34 光路依据（2026-10-11）

- [Three Raycaster](https://threejs.org/docs/pages/Raycaster.html)：复用实际三角面求交；注意背面检测、归一化方向和共享边重复交点。45单色与46七波长已复用Three Ray及三角面求交，无新增依赖。
- [OpenStax Snell与全反射](https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection)：每个界面使用n1/n2，全反射后光仍在介质中传播，不能在第一个全反射点直接宣称整条光消失。
- [OpenStax色散](https://openstax.org/books/university-physics-volume-3/pages/1-5-dispersion)：波长决定折射率，普通玻璃中紫光偏折更大；连续光谱不能等同七根固定方向装饰条。
- [SCHOTT N-BK7官方数据表](https://media.schott.com/api/public/content/41e799d0bf874807a0bb8e702fbb75b5?v=54856406)：46采用的色散斜率参考，nF约1.52238（486.1nm）、nC约1.51432（656.3nm）。实际Cauchy斜率据F/C计算，再平移至既有绿色IOR；这是虚拟材质近似，不是N-BK7全谱实测。采用参数只在SYSTEM9.3.13维护，验证见[46工程记录](../design/iterations/u03-p01-2026-10-11-46-implementation.md)。

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

### P13 双模式本轮来源（2026-10-11）

2026-10-13播放地址修复：已核对安装版本API Enhanced4.41.1及[标准音质播放模块源码](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced/blob/main/module/song_url_v1.js)。实际匿名/无解锁请求的月之暗面10首返回freeTrialInfo结束30秒，Echoes返回完整音源；短期URL再经MIME/MP3头核验，生成索引不提交音频或地址。HTTP200的outer/url返回HTML失败和原页面解码/试听结束均实际留证，见[修复记录](iterations/t25-p13-2026-10-13-netease-playback-fix.md)。

2026-10-13 新外观接入：用户选择与源代码/资产许可统一见设计 REFERENCES REF-09。实际已读取官方公开 `https://music.163.com/api/v6/playlist/detail?id=18476425375`（HTTP200、code200、1首）用于目录快照，清理为歌曲ID/标题/歌手/专辑/时长/HTTPS封面及读取日期，不含账号或音频地址；`tools/music/sync-playlist.mjs` 可重新生成，不宣称已自动更新。指定曲目2016710373的官方 `song/media/outer/url` HEAD 返回audio/mpeg，浏览器实际解码/启动与跳转已验，首次媒体等待超时和后续成功分别记录，不外推所有网易云歌曲或平台接口长期稳定性。`music-metadata` 改为读取内嵌封面，复用已装 sharp 转WebP；私有索引仅标记封面存在，本机 GET/HEAD 按索引ID和回环来源提供图片，生产地址为null，不上传到公开仓库或云盘。

| 来源 | 已核对能力与采用范围 |
| --- | --- |
| [洛雪 Scheme URL](https://lxmusic.toside.cn/desktop/scheme-url) | 官方 `lxmusic://music/search` 接收编码JSON关键词；用于直接唤起搜索，下载及最高可用档位仍在洛雪选择 |
| [洛雪开放API](https://lxmusic.toside.cn/desktop/open-api) | 状态、歌词和播放控制，没有下载文件库读取；未为这项缺口搭建另一套音乐服务器 |
| [music-metadata](https://github.com/Borewit/music-metadata) | 本轮采用12.1.0，MIT；本地parseFile提取真实标签、时长和格式。2026-10-13读取内嵌封面并用已装sharp生成私有WebP，不把封面二进制/本机路径写进公开清单 |
| [Nextcloud 官方同步客户端](https://docs.nextcloud.com/server/latest/user_manual/en/files/desktop_mobile_sync.html) | 优先复用目录同步；目前尚未配置真实账户同步，不把索引工具当成上传器 |
| [Nextcloud Login Flow v2](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/LoginFlow/index.html) | 使用官方浏览器授权与轮询返回的一次性内存凭证；实际考拉OCS认证失败，未保存长期凭证 |
| [WebDAV 基础接口](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/WebDAV/basic.html)与[OCS分享接口](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/OCS/ocs-share-api.html) | MKCOL与只读公开分享permissions=1的最小配置工具；本次身份认证前置失败，创建/读回尚未执行 |
| [Echoes 网易云官方外链播放器](https://music.163.com/outchain/player?type=0&id=18476425375&auto=0&height=430) | 用户指定18476425375；HTTP200、实际歌单标题/曲目及点击后音频206响应分别验证。全部曲目的权限、完整播放及跨页持续播放另验 |
| [Astro Integration API — astro:server:setup](https://docs.astro.build/en/reference/integrations-reference/#astroserversetup) | 2026-10-12 官方钩子允许向开发服务器添加中间件；仅用于本机已索引音频的 GET/HEAD/Range。实际安装源码 `vite-plugin-astro-server/base.js`、`trailing-slash.js` 表明 middleware 前会剥离 base 并校验尾斜杠，因此公开音频 URL 保留 base 与尾斜杠，处理器匹配剥离后的路径；首次404及修正后的真实FLAC验证留证 |

下载来源沿用用户仓库根`洛雪音乐.txt`中的[音源更新入口](https://github.com/guoyue2010/lxmusic-/releases)，实际应用安装入口采用[洛雪官方发行页](https://github.com/lyswhut/lx-music-desktop/releases)。第三方音源仓库只作为用户提供的跳转链接，未下载、执行其代码或宣称其音源均可用。公开音乐清单不授予音频再分发许可；本轮无音频上传或提交。

| 来源 | 关键事实 |
| --- | --- |
| [Giscus 中文说明](https://giscus.app/zh-CN) | 留言存于 GitHub Discussions；需公开仓库、开启 Discussions、安装应用；访客需要 GitHub 登录及授权 |
| [GitHub 讨论管理](https://docs.github.com/en/discussions/managing-discussions-for-your-community/moderating-discussions) | 所有者可以管理讨论，常规工作方式不是公开前审核队列 |
| [GitHub Actions 事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#discussion_comment) | 评论创建、编辑、删除可触发工作流；文件需位于默认分支，相关讨论事件处于公开预览 |
| [网易云第三方 API 候选](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced) | 候选服务端接口，尚未完成本项目账号与运行时验证 |
| [歌单添加接口源码](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced/blob/main/module/playlist_tracks.js) | 可研究歌曲加入歌单的实现；代码存在不代表真实授权和写入一定成功 |
| [考拉云盘](https://pan.koala-studio.org.cn/) | 用户账号下音乐目录与只读分享已创建；2026-10-13真实FLAC/Range206、18首清单和18封面已核验。音频不进入仓库；手机/线上部署另验 |

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

### 考拉专用上传采用依据（2026-10-13）

T25.08歌词：已安装music-metadata的lyrics类型及洛雪同目录LRC作为本地来源；[洛雪官方源文件读取策略](https://github.com/lyswhut/lx-music-desktop/blob/master/src/renderer/utils/music.ts)说明同名LRC优先。[LRCLIB官方接口](https://lrclib.net/docs)实际读取匿名/CORS、时长±2秒、声明客户端与Retry-After规则；本站额外严格校验标题/歌手/专辑，避免错用时间轴。不安装新库、不经第三方代理登录，也不绕过网易云官网浏览限制。

- [Nextcloud File Drop 官方手册](https://docs.nextcloud.com/server/latest/user_manual/en/files/file_drop.html)：复用官方上传专用分享，访客不能查看或改变已有文件。
- [Nextcloud 33.0.3 FilesDropPlugin 官方源码](https://github.com/nextcloud/server/blob/v33.0.3/apps/dav/lib/Files/Sharing/FilesDropPlugin.php)：文件请求要求 `X-NC-Nickname`，昵称形成子目录，PUT 自动创建路径并保留既有文件；本项目只适配请求头和不可变目录快照，不复制插件源码。
- [官方公共 WebDAV 接口](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/WebDAV/basic.html)：采用29+公共分享端点、非GET请求的 `X-Requested-With`、上传mtime及SHA256校验头。考拉33.0.3实测只读PROPFIND207、File Request禁列举405、真实音频PUT201/Range206；MKCOL没有昵称400保留为早期协议失败。
- 成熟客户端优先路线已实试：官方Nextcloud35数字签名/MSI安装成功，但客户端初始化HTTP429，未保存有效账户。用户明确选择File Request替代，无常驻服务端依赖；上传凭据仅Windows当前用户可解密。

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

## P01 物理光传输渲染调研（2026-10-12）

> 历史研究与需求证据；当前首页运行范围以56玻璃/柔晕及F02为准，不据此恢复光谱或流体。

入射界面依据：[PBRT 4 镜面反射与透射](https://www.pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission)说明波长相关IOR产生各自折射方向，Snell与Fresnel分别描述方向及能量分配；[光谱分布表示](https://www.pbr-book.org/4ed/Radiometry,_Spectra,_and_Color/Representing_Spectral_Distributions)说明多波长采样及能量表示。由此结合本站源码推断：同源有限截面的重叠能量应参与颜色合成，共同入射点的屏幕彩带分层不能代证物理光束截面。此为51诊断与验收依据，不意味着已采用PBRT作为浏览器引擎。

对应 R12、T03.05/T26.02/T27.01。用户否定当前平面光带的渲染机制；已有几何求解测试只证明方向，不能证明辐射传输。以下候选尚未接入首页。

| 候选与原始来源 | 能力、缺口与本轮状态 |
| --- | --- |
| [three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer)、[当前包](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/package.json) | MIT，0.0.27，Three ≥0.185、BVH ≥0.9.15；与现有0.186.1版本要求相符。GPU 路径追踪、BSDF、透射。仅在忽略的 `.ci-tmp/optics-engine` 固定安装，未改主站依赖 |
| [作者待办 #777](https://github.com/gkjohnson/three-gpu-pathtracer/issues/777)、[材质数据结构](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/src/shader/structs/material_struct.glsl.js) | 新WebGPU分支的雾仍列待办，谱渲染、MNEE焦散和介质栈列未来工作；WebGL材质只有单一IOR，不能因Three材质存在dispersion属性就声称引擎支持真实色散 |
| [WebGL体积雾样本](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/example/fog.js)、[引擎源码](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/src/core/WebGLPathTracer.js) | 旧WebGL支持FogVolumeMaterial与渐进累积；0.0.27已弃用WebGLPathTracer。先用独立白光/玻璃样本验证散射、接收面与收敛；若采用，须固定兼容版本并处理后续维护。未证明适合连续旋转首页 |
| [Erich Loftis 路径追踪渲染器](https://github.com/erichlof/THREE.js-PathTracing-Renderer)、[体积样本源码](https://raw.githubusercontent.com/erichlof/THREE.js-PathTracing-Renderer/gh-pages/shaders/Volumetric_Rendering_Fragment.glsl)、[CC0许可](https://raw.githubusercontent.com/erichlof/THREE.js-PathTracing-Renderer/gh-pages/LICENSE) | 真实反射/折射与体积路径样本可供算法参考；该体积样本是球体场景、固定IOR，并有明确人为焦散增益与选择性路径，不能不经改造当作本项目物理完整引擎。原站FPS宣称不作为本站真机证据 |
| [Snellytracer](https://github.com/jamportz/snellytracer) | 仓库原portsmouth地址已重定向；API读回master为a9017c3d4520404445a3a6e0c4f2987de52b01a1。光谱激光、介电模型、fluence累积有针对性，但未找到完整代码许可证，且fluence并非完整散射辐射。只作研究，不复制源码、不列为已采用 |
| [CAUSTIC//VOLUME](https://github.com/ScottieFox/caustic-volume)、[MIT许可](https://raw.githubusercontent.com/ScottieFox/caustic-volume/main/LICENSE)、[光树](https://raw.githubusercontent.com/ScottieFox/caustic-volume/main/sandbox/src/28_laser.js) | Three r186，光子/激光体积算法可参考；水箱、薄壁玻璃与固定水面近似不能原样替代本站实体棱镜。源代码已读，未运行本项目兼容样本，不列为成熟已验证核心引擎 |
| [光子点/光子束体积辐射估计论文](https://graphics.ucsd.edu/~henrik/papers/volumetric_radiance_using_photon_points_and_beams.pdf) | 若完整现成引擎确实不能覆盖，作为针对折射体积焦散的算法依据；需保留密度估计、核宽/偏差、介质与观察积分的具体精度边界，不能将路径线条直接命名为物理光子束 |
| [Mitsuba积分器文档](https://mitsuba.readthedocs.io/en/stable/src/generated/plugins_integrators.html) | 原理/参考渲染候选；当前ptracer文档明确不支持介质，不能仅凭有光子追踪便宣称可同时解决此场景。未安装，不新增服务端运行依赖 |

采用原则：先复用能覆盖需求的完整渲染器；现成谱渲染、体积折射焦散或实时交互确有缺口时，先记录缺口及最小扩展，再施工。光束在空气中可见需要散射介质；调节散射密度必须改变实际传输。渲染应包含Fresnel能量分配、传播衰减、受光遮挡及累积重置，结果由真实GPU画面核对。七色调色板或RGB通道位移仍是显示近似，不能称为连续光谱传输。

51独立WebGL首样实际512 samples：有介质可见白束，无介质白束消失，受光点仍存在；但玻璃后主束仍近似直行，核心目标失败。[完整记录](../design/iterations/u03-p01-2026-10-12-51.md)。[attenuateHit源码](https://raw.githubusercontent.com/gkjohnson/three-gpu-pathtracer/main/src/materials/pathtracing/glsl/attenuate_hit_function.glsl.js)包含折射/PDF待处理注释，透射阴影未改变ray.direction；据此不能直接采用当前候选替换主页。

随后在独立样本复用现有PrismRaySolver与Three实例化/浮点target，最小实现白光局部单散射光子束估计：真实三角面、Fresnel分支、Beer衰减、世界Gaussian密度核与HG相函数/观察积分。8项传输检查与桌面/手机CSS实际画面留证；有玻璃折转、移去后直行。**仍未通过完整白光目标**：观察射线未完整折射、无接收面、有限核偏差与单散射、无连续谱/首页接入。方法候选依据为上表光子束论文，未复制许可未知源码或声称完整物理引擎，参数为诊断值。[51工程记录](../design/iterations/u03-p01-2026-10-12-51-implementation.md)。

2026-10-13白光接收面续片：[PBRT 4 漫反射](https://www.pbr-book.org/4ed/Reflection_Models/Diffuse_Reflection)的Lambert BRDF为反射率/π；[体积传输方程](https://www.pbr-book.org/4ed/Light_Transport_II_Volume_Rendering/The_Equation_of_Transfer)把最近接收面的出射辐射与表面之前的空气积分相加，表面之后的贡献应被遮挡。本片据此在实际光路与有限平面交点估计受光功率，世界Gaussian核包含投影余弦，直接观察段Beer衰减；没有复制PBRT代码。10项接收检查和实际桌面/手机CSS留证，只确认局部接收面因果；观察玻璃折射仍待完成，非完整引擎或首页采用结论，见[51工程记录](../design/iterations/u03-p01-2026-10-12-51-implementation.md)。
