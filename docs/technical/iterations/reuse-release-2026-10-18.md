# 六批复用优化发布验收

2026-10-18，用户在集中候选交付后要求继续。按仓库保护流程发布已经验证的六批技术复用优化，保留其他负责人的工作区和独立设计候选。

## 固定输入与合并

- 集中 [PR #86](https://github.com/0ne-small-stone/personal-homepage/pull/86)，候选 `c14df6fe557a61ea03f0845723cc7651861af5e7`；三项必需检查在 [39125241417](https://github.com/0ne-small-stone/personal-homepage/actions/runs/39125241417) 全部成功。
- 2026-10-18 20:41（北京时间）经 Squash 合并为 main `f683a6ad40b07d0053cfe818f52c8c4cf6d6ac78`，没有直接推送 main 或更改保护规则。
- 原 #76、#78、#81、#83、#84、#85 完整提交已经包含于集中候选，现均关闭为被集中 PR 替代；各分支和既有证据保留，没有逐个重复合并。
- Copilot 自动评审因账号额度不足未执行；没有将配额提示记为代码通过。仓库不要求第二人批准，执行者代码核对、既有 324 项本地测试、浏览器证据和必需 CI 作为本次放行依据。

## 范围与验证

沿用[集中整合记录](reuse-integration-2026-10-18.md)中的 Query、CMS、HTTP、dialog、搜索补丁和旧源清理。此次没有追加应用功能或重新修改已冻结产物；主线首页、知识正文、照片/PDF、样式与设计文档维持各自既有实现。

主线 [Pages 运行 39128335047](https://github.com/0ne-small-stone/personal-homepage/actions/runs/39128335047) 已成功：Repository checks / Workflow syntax 各 18 秒，Astro build 1 分 56 秒，Deploy to GitHub Pages 32 秒。正式站为 [个人主页](https://0ne-small-stone.github.io/personal-homepage/)，应用代码已发布，后续文档记录单独走 PR。

- 正式知识页确认消费 `site-search` 与 `Search...BHC05PKT.js` 新包；“验证”+文章筛选进入真实文章，再返回同一搜索窗口，关键词/勾选/原结果焦点恢复，Escape 关闭并解除搜索锁。
- 正式音乐页 390×844：保留真实 11 首共享歌单快照，推歌窗口明确服务未接通且无提交表单；原生模态、关闭焦点/滚动恢复、页面宽 390 与单 audio 均已读回。知识及音乐标签 error 均为空。
- 初次页面在部署完成前打开，返程仍消费 `lssh-site-search` / `wP8-CdFn` 旧文档，未作为新包验收。部署 Success 后 reload 确认新标签/新脚本，再重新执行上述完整路径。一次刷新后过早点击未打开窗口也保留为采集边界，不改写为新包功能通过。
- 本机 41 项文件名/哈希直接比对中 35 项一致；两份 HTML 内容不同、四个旧本机 JS 文件名在线 404，没有将其冒称 41 项发布匹配。随后依据正式 HTML 与 Vite 动态映射重建实际引用图，7 页加 32 份脚本/样式共 39 项全部 200；在线真实核心模块为 `NetEaseCoreExperience.C5VuNfnT.js`。本次不把跨构建产物字节一致当作验收结论。
- [部署原图、浏览器逐次状态、公开 HTTP 记录与重复 PR 状态](evidence/reuse-release-2026-10-18/README.md)。真实账号登录、完整播放、下载、推歌提交与写歌单不在这次公网静态验收范围。

共享根目录旧 HEAD 及其他负责人 WIP 不做 reset/pull/覆盖；4347 全站返回等未发布设计候选继续按各自流程验收，F04/F07不启动。
