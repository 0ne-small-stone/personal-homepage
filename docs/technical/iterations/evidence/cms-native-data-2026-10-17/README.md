# CMS 数据迁移证据

2026-10-17；基线 main 5e481c3，codex/reuse-cms-2026-10-17。

本机 4390 提供实际 WebsiteDirectory、SomeonePage 的独立生产构建，共 3 个 HTML，不是重新搭建页面。英文 about / 中文 zh/about / links 均使用本片 JSON 数据；页面样式沿既有文件。

- 迁移前 TypeScript 导出与迁移后对象深比较：2 语言、11 站完全相同。
- 三个 CMS file 的 YAML 字段递归覆盖现有 JSON 全部字段。
- 2 项公开数据输入校验与 7 项导航 DOM/历史/卸载测试通过。
- 实际浏览器在 links 输入“代码”，状态为“找到 1 个网站”，显示 PTA；使用共享导航进入英文 about，再点 Switch to Chinese，标题“我是小石。”正确。
- [中文资料首屏](profile-chinese.jpg)。本机页面控制台 error 为空。

本片仅验证前台实际浏览器与本地 CMS 配置，托管 CMS 新表单显示和 Save 尚未完成，不能记为后台真实通过。没有上传新素材、改变公开资料内容或修改其他栏目候选。
