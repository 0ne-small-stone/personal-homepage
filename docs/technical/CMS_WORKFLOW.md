# 网页编辑与草稿验证

## T13.06 保存冲突后的输入保留与重试

当前验证入口为[新建表单](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-06-save-recovery/collection/articles/new)与[文章列表](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-06-save-recovery/collection/articles)，分支 `codex/t13-06-save-recovery`。标题旁的恢复说明在新建、编辑及固定验证稿都可见；仅增加操作指引，后台没有自动备份或自动合并。

遇到 **File has changed since you last loaded it**（文件版本冲突）时：

1. 留在表单，先把所有已改字段复制到本机文本文件；正文切到 **Source**，复制完整 Markdown。标题、摘要、日期、主题、标签、草稿状态及其他改动一起记录。
2. 完成备份后再刷新。重新加载的是服务器最新版本，未保存输入会被放弃。
3. 对照最新内容与备份，保留需要的双方修改，再填回表单。不要直接把他人的新版本覆盖为旧全文。
4. **Save**，看到成功后重新打开核对标题、正文、草稿状态与分支提交；在 Actions 检查该笔提交。保存成功、构建通过和正式部署分别判断。

2026-10-09 实测：两次真实版本冲突都保留标题/摘要/正文，直接重试仍失败且未误写；先备份再重载并填回后真实保存 `e2a3b94` 成功。重开正文标记保留，连续空行会被原生富文本规范化。测试后恢复 `ea77f28`，48 个内容文件与原文完全一致；两次成功提交各自三项 CI 通过，Deploy 跳过。[完整证据](iterations/t13-06-2026-10-09.md)。

本轮未核验断网/超时、授权失败、上传失败或手机后台，不能套用“所有失败都未写入、都能直接重试”的结论。若结果不明确，先备份，再核对实际分支内容与提交。离开确认仍未实现；这份说明不能替代自动恢复。设计资源新增 0，没有合并或部署。

## T13.05 未保存离开验证与提示

本轮[文章列表](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-05-unsaved-exit/collection/articles)及[新建入口](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-05-unsaved-exit/collection/articles/new)使用 `codex/t13-05-unsaved-exit`。新建、已有文章及固定验证稿的标题旁都提示：“需要保留修改时先点击 Save，再离开。返回列表会放弃未保存内容。”

- **保留修改**：先 Save，刷新核对值仍在，再离开。保存会写入工作分支并触发既有三项检查；正式网站仍需 PR 合并和成功部署。
- **放弃修改/取消新建**：不 Save，点击左侧或面包屑“文章”回列表。当前托管界面直接放弃，没有二次确认；重开已有文章读取已存原文，再点 Add an entry 是空的新建表单。需要保留但尚未保存时，留在当前表单继续编辑。
- **验证本轮**：打开新建入口，在标题旁核对提示；填一段明确的测试文字，不 Save，再回“文章”。列表应仍为四篇，重新新建标题/地址应为空。也可只在“网页新建文章验证（测试草稿 · 已重开）”上改标题后不 Save，返回并重开，标题应恢复。别用尚未保存的正式正文做这项测试。

2026-10-09 已实测侧栏返回、面包屑返回及重新打开；本轮没有点击 Save，测试前后远程 head `682b994`、原稿 blob `889cbde` 不变。配置推送后远程 src 树与基线相同，48 个内容文件均未变，`demo-article-unsaved-exit-check.md` 没有创建。CUA 的 reload 后恢复原标题，未观察到提示；没有因此验证所有浏览器的刷新、关闭手势。[实际记录](iterations/t13-05-2026-10-09.md)。

二次离开确认、自动保存和失败恢复未实现；本轮说明只让保留/放弃结果明确。使用官方托管版和原生字段，不在网页注入拦截脚本，也不新增自托管后台。设计资源新增 0。[草稿 PR #23](https://github.com/0ne-small-stone/personal-homepage/pull/23)保留实际缺口，正式部署另验。

## T13.04 文章列表与新建草稿

当前入口为[文章列表](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-04-article-collection/collection/articles)，分支 `codex/t13-04-article-collection`。本轮配置与测试稿已在工作分支；继续使用已有 GitHub 登录和授权。列表显示标题、草稿状态及日期，搜索读取标题与摘要，默认日期降序。固定“文章编辑与发布验证”入口保留。

1. 点击原生 **Add an entry**。填写标题、摘要、正文和文章日期；新文章“草稿”默认开启。
2. “地址标识”填一个唯一的小写英文、数字或短横线组合，例如 `article-reading-notes`。不能含中文、空格、连续短横线；新文件名取该值。保存后保持标识不变，修改标题无需修改它。已有文章编辑沿用实际文件路径。格式提示不能保证业务 ID 永远不被修改或重复，内容检查仍需核对唯一性和关联。
3. 保持草稿开启，Save。成功后进入编辑页，刷新并检查标题、摘要、日期、草稿、地址标识与正文；切换 Source/Editor 核对 Markdown。点击左侧“文章”回列表，可用 **Search entries...** 查找，再点击标题重新打开。
4. 重开后修改标题并保存，再刷新核对新标题和原地址。保存自动触发本轮工作分支的三项检查；本机预览需要开发者拉取后重建，CMS 保存不会自动更新冻结快照。

2026-10-09 已通过真实托管操作：新建 `c2e7380`，重开改标题 `b5ad7f7`，两笔 CI 三项成功、Deploy 跳过。测试稿为“网页新建文章验证（测试草稿 · 已重开）”，路径 `src/content/docs/knowledge/blog/demo-article-cms-create-check.md`，始终 `draft: true`。空表单有四项必填错误，非法标识被中文格式提示拦截；四行列表搜索“网页新建”仅返回该稿。原生二次保存规范化了文件末尾空行，正文实质内容保留。[完整记录](iterations/t13-04-2026-10-09.md)。

[本轮生产总览](http://127.0.0.1:4374/personal-homepage/knowledge/)来自真实保存 `b5ad7f7` 的冻结生产快照，仍为 41 条内容；[草稿直达](http://127.0.0.1:4374/personal-homepage/knowledge/blog/demo-article-cms-create-check/)显示“页面未找到”，搜索 `T13CREATEDRAFT20261009` 无结果。快照不随网页保存改变，当前没有合并或正式部署。

设计资源新增 0，继续复用原生后台和已有 Markdown 图片能力。本轮只验一篇新稿的创建与再编辑；新稿图片上传、其他内容类型、关联选择、取消/网络失败、手机后台及正式部署分别后续验证。

## T13.03 文章发布状态与修改

当前真实验证分支为 `codex/t13-03-hosted-publication`，打开[文章编辑与发布验证](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-03-hosted-publication/file/article-draft)。原生“草稿”字段可编辑，当前原文已恢复并开启。关闭后保存表示提交发布候选，保存工作分支自动运行现有三项检查；正式站需 PR 合并并部署成功。再次开启也需正常部署才会从正式站撤下，不将保存或 CI 成功称为上线。

1. 核对标题、摘要、日期、标签、正文与图片说明。关闭“草稿”，保存并刷新，检查该字段仍关闭。
2. 在 GitHub 分支提交及 Actions 查看本次保存对应的构建；工作分支 Deploy 应跳过。构建失败时定位日志，修改后重试，不修改 main 保护。
3. 修改同一篇的标题、摘要或正文再次保存，核对固定路径与稳定 ID 未变。开发者拉取真实保存后更新本机预览；网页保存不会自动拉取到本机。
4. 完成验证后可再次开启草稿并保存。正式部署与内容确认在 T16 处理，当前没有真实上线。

2026-10-08 执行者真实保存三次：首版候选 `a5cc0bb`、修改候选 `1ba65a5`、恢复原文与草稿 `be0554b`，各自三项 CI 成功、Deploy 跳过，CMS 刷新后值保持。最终文章与验证前逐字节一致。可对照[首版候选](http://127.0.0.1:4371/personal-homepage/knowledge/blog/editor-draft-check/)、[修改后候选](http://127.0.0.1:4372/personal-homepage/knowledge/blog/editor-draft-check/)和[回草稿后的学习总览](http://127.0.0.1:4373/personal-homepage/knowledge/)。这些本机生产快照来自三笔真实 CMS 提交，网页保存后不会自动更新快照，也不是正式部署证据。[实际记录](iterations/t13-03-hosted-2026-10-08.md)，[初轮模拟快照历史](iterations/t13-03-2026-10-08.md)。

无需新增设计素材，继续复用上轮图片样本、原生开关与现有学习排版；T13.02 单张真实上传及 T13.03 真实候选状态切换已验，后台取消/失败状态和 T16 正式部署另验。

## T13.02 图片上传与预览

当前验证分支为 `codex/t13-02-image-upload`，打开[图片上传草稿入口](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-02-image-upload/file/article-draft)。上轮 T13.01 的文字保存入口保留作历史记录；本轮勿在 main 创建配置。

2026-10-08 已实际通过：原生媒体库 Upload → 文件选择器 → PNG 上传 → Source 填相对路径/alt/说明 → Editor 预览 → Save → 刷新。图片 `muzkwysr-37s36uzh.png` 和正文分别由 CMS 提交 `a656ce4`、`b217cb8` 保存；本机已接入当前工程。[真实记录](iterations/t13-02-hosted-2026-10-08.md)。编辑器的原生 alt 弹窗及上传取消/失败仍待单独测试。

1. 在正文 Editor 模式定位到“图片验证”一节，用原生插图入口上传一张允许公开的 PNG、JPG/JPEG、WebP 或 AVIF。也可从左侧“文章图片（公开仓库）”上传，再在正文选择该图片。建议小于 1 MiB，这是建议，并非后台已验证的硬性上限。
2. 选择图片后填替代文本（原生控件名 `Image alt text`）；若托管版入口不同，可切到 Source 将 `![](路径)` 中的方括号补为有意义的说明。图下另写一行“图片说明：……”。不要粘贴 HTML `<img>` 或临时 blob/data 地址；本轮复用 Astro 的原生 Markdown 图片处理。
3. 保存正文，再刷新编辑页。核对图片仍显示、alt 与图下说明保留、草稿仍开启。上传图片和保存正文可能分别产生提交；上传成功不代表正文已保存。
4. 告知开发者“图片已上传并保存”，开发者读回图片与正文提交，拉取、验证并刷新本地草稿预览。网页后台保存不会自动拉取到这台电脑。

最初的功能样本由开发者放入仓库；当前正文改用经媒体库真实上传的同一张图片，文件指纹一致。[原生草稿预览](http://127.0.0.1:4324/personal-homepage/knowledge/blog/editor-draft-check/#图片验证)已显示上传结果，只用于本机开发；若服务关闭，在当前工作分支运行 `npm run dev -- --host 127.0.0.1 --port 4324`。原生开发模式显示草稿警示，生产预览仍是 [4322](http://127.0.0.1:4322/personal-homepage/knowledge/)，草稿直达已核验为 404。

公开仓库中的上传文件立即可被读取。生产不显示草稿页面/正文/搜索，但 Astro 仍会输出草稿引用的图片文件；不要用该流程保存私密图片。[本轮记录与实际证据](iterations/t13-02-2026-10-08.md)。

T13.01 / P17、P06 / R13。一篇固定测试草稿的首次网页标题修改及保存已核验：用户提交 `f324538`、原生字段/正文保留、生产草稿排除复验通过。使用 [Pages CMS](https://app.pagescms.org/)。图片上传、实际发布与后台扩展状态另轮验证。

## 进入这次验证

1. 在 Pages CMS 使用 GitHub 登录。按官方引导安装或授权 Pages CMS GitHub App，仓库选择 `0ne-small-stone/personal-homepage`。如果已经接入，可直接打开仓库。
2. 选择工作分支 `codex/t13-01-web-drafts`，打开“文章草稿验证”。[直接编辑入口](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-01-web-drafts/file/article-draft)使用官方原生文件路由；未登录会先进入登录页面。
   安装后若落到 `main/configuration`，改用上面的工作分支入口。本轮 `.pages.yml` 已在工作分支配置完成，main 尚未合并该配置；主分支配置页的创建按钮会触发 PR/检查保护。
3. 核对标题、摘要、文章日期、主题、标签与正文。草稿状态应开启且只读。标题改为“网页编辑草稿验证（网页已保存）”，正文末尾加入“T13.01 网页保存验证：文字、章节和代码仍在。”，保存。
4. 刷新编辑页，确认修改仍在。切换正文的 Editor / Source，检查章节、链接和代码；尝试清空标题观察原生必填提示，再取消这次未保存的修改。离开提示、错误恢复、历史入口均需真实界面逐项验证，配置通过不能代替这些结果。

首次登录和仓库授权需由账号持有人完成。本次浏览器控制工具启动失败，执行者仅在独立、未登录的 Edge 会话确认官方入口 HTTP 200 和 GitHub 登录按钮，没有操作用户已有会话或完成网页保存。

## 保存报 Resource not accessible by integration

2026-10-08 用户实际保存时报告该错误，关联 GitHub `create-or-update-file-contents` 接口。[GitHub 官方排错](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#resource-not-accessible)将它归为令牌权限不足；该接口需要 [Contents 写权限](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)。公开仓库可以读取不代表集成可以写入。

实际只读核对：工作分支 `codex/t13-01-web-drafts` 为 `protected: false`，有效分支规则为空，仓库未归档；草稿没有新增保存提交。因此本次先核对 Pages CMS 安装授权，不改应用 schema、CI 默认权限或 main 保护。

1. 保留当前尚未保存的标题和正文，在另一个页面打开 [GitHub 已安装应用](https://github.com/settings/installations)。账号为 `0ne-small-stone`，找到 **Pages CMS → Configure**。如果页面显示 No installed GitHub Apps，打开[官方 Pages CMS 安装入口](https://github.com/apps/pages-cms/installations/new)，选择仓库所属账号 `0ne-small-stone`，选择 Only select repositories 并勾选 `personal-homepage`，完成安装。
2. 核对 **Repository access** 包含 `personal-homepage`；使用 **Only select repositories** 时添加目标仓库并 Save。核对 **Permissions** 中 Contents 为 **Read and write**；有权限更新请求时，需账号持有人审核批准本次所需写权限。
3. 返回原草稿页面，在相同工作分支再次保存。若授权已正确但仍报同错，先保留未保存内容，再退出 Pages CMS 并使用同一 GitHub 账号重新登录后重试。重新登录属于刷新认证的尝试，不能预先记为修复成功。

当前浏览器控制进程仍无法启动，本地 Git 凭证调用安装列表接口也返回 403（该接口要求 GitHub App 用户令牌），无法用它读取或修改 Pages CMS 的真实安装授权。这与用户遇到的文件写入 403 是两次不同请求。具体安装范围和权限仍需设置页读回；只有实际网页保存及 GitHub 新提交确认后，才记为修复。

## 创建配置报 Changes must be made through a pull request

2026-10-08 用户在 `/main/configuration` 报该错误，GitHub 同时提示 3 项必需检查。远程读回 main 的 `.pages.yml` 为 404、分支受保护；工作分支 `.pages.yml` 为 200、分支未保护。当前配置与测试草稿已准备在 `codex/t13-01-web-drafts`，进入[文章草稿验证](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-01-web-drafts/file/article-draft)编辑现有文件即可。

main 的配置接入以后通过正常 PR 与三项检查完成。当前保持原保护规则，本轮先验证工作分支的草稿保存。此报错是主分支规则拒绝写入，不能单凭它宣称 Pages CMS 安装权限和真实保存已验收。

## 保存后如何核对

保存会在所选分支创建 Git 提交。它与 PR、CI、合并、网站部署是不同步骤；配置没有部署按钮。主分支继续受保护，后台需使用上述工作分支，不能因为保存被拒绝而关闭分支规则。

实际写入文件为 `src/content/docs/knowledge/blog/editor-draft-check.md`。复核新增提交、改动路径、标题/正文、`draft: true`、`entryId: demo-article-editor-draft` 和 `kind: article`；未建模的 `sidebar`、`related` 应保留。`readonly` 是后台表单行为，不能代替 GitHub 仓库权限。

保存日期可能是带引号的 `yyyy-MM-dd`；工程将有效日历日期转换为博客原生 Date。非法日期应在内容校验失败，不进入生产构建。

真实保存后拉取分支，运行 `npm run check`、`npm run build`，再核对：学习总览仍为 40 条已发布内容、文章列表仍只有一篇功能验证样稿；新草稿地址返回 404，公开 HTML 和 Pagefind 不包含该草稿。原生搜索可能按词元命中其他文章，验收依据是结果的实际地址与内容，而非泛词查询必须为零。

本地网站验收入口：[学习总览](http://127.0.0.1:4322/personal-homepage/knowledge/)、[文章列表](http://127.0.0.1:4322/personal-homepage/knowledge/blog/)。保存草稿本身不会把正文显示在这些入口。

本轮先验证文字编辑与草稿。图片上传归 T13.02，开启发布及实际网站部署归 T13.03 / T15 / T16。
