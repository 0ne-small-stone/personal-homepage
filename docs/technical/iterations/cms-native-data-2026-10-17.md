# Pages CMS 公开资料原生编辑

2026-10-17；用户批准按技术复用审查建议开始调整。对应 P02/P12/P17、R01/R03/R13、T05/T11/T13。基线 main 5e481c3，独立工作树 codex/reuse-cms-2026-10-17。

## 实施范围

- 将现有中英文公开个人资料与十一站导航数据迁移为 JSON，页面继续使用既有 TypeScript 导出接口；内容、链接、排序与页面样式保持。
- 扩展已有 .pages.yml，复用 file/object/list/select 原生字段；不增加后台服务、身份系统或保存 API。
- 构建阶段复用 Astro 提供的 Zod 校验结构、ID 和公开 URL。网站图标仍使用现有图标集合，分类保持已有四类。
- 英文、中文资料使用独立文件和同一组字段配置，不复制后台表单定义。公开仓库编辑后仍经工作分支、PR、构建及部署生效。
- 作品正式页仍为占位，独立 Afterimage 候选尚未验收，当前不增加另一套作品数据格式。照片上传沿已有公开素材登记与派生流程。

## 验收

逐项对比迁移前后导出；验证后台字段与 JSON 一致、非法 URL/重复 ID/未知图标被拒绝；运行类型和实际资料/导航构建。托管 CMS 新表单显示、实际 Save 与发布分开记录，不以本地配置校验代验。

## 来源

- [Pages CMS 文件与集合](https://pagescms.org/docs/configuration/content/)
- [Object 字段](https://pagescms.org/docs/configuration/fields/object/)
- [List 配置](https://pagescms.org/docs/configuration/content/list/)
- [Select 字段](https://pagescms.org/docs/configuration/fields/select/)

## 当前状态

工程与前台验证完成，独立分支待集成，未发布。

- 迁移前实际 TypeScript 导出与新 JSON 的深比较完全相同：2 份语言资料、11 个网站，所有原始 URL、参数和排序保留。
- `.pages.yml` 实际 YAML 解析后，新三个 file 编辑器的原生字段覆盖全部 JSON 值；网站顶层数组沿官方 `list: true`，中英文表单用 YAML anchor 共用字段。
- 复用 Astro/Zod 校验邮箱、链接协议、无凭据地址、必填文本、经历锚点、网站唯一 ID/URL、分类与图标；2 项输入校验测试通过。
- 实际资料与导航组件独立静态构建 3 HTML，3.38 秒完成；7 项导航交互测试通过。导航测试不再把数量、顺序和可编辑文案写死，迁移一致性另作一次深比较。
- `npm run check`：167 文件，0 错误、0 警告、3 项既有 PhotoSwipe 提示。浏览器只加载纯导航工具，Zod 留在构建端，公开脚本无 ZodError/ZodObject。
- 浏览器实际输入“代码”显示 1 站，导航至英文资料，再切中文，现有内容与语言入口正常；本次 4390 页面无控制台 error。[证据](evidence/cms-native-data-2026-10-17/README.md)。

托管 CMS 已实际显示三个新编辑入口：英文姓名预填 Zhang Xuanshi，中文姓名预填张轩石；常用网站有 11 个完整地址字段，分类与图标显示已有值。英文 GitHub 地址临时加尾斜杠 → Save → 刷新读回 → 恢复原地址 → Save → 刷新读回，实际产生 8f15a35 / 10b2985 两次 CMS 提交。Git 快进读回后，两种语言与网站全部值仍与迁移前深比较一致。

仅英文资料执行了实际 Save，中文与网站是表单读回；网站未额外写入。当前候选分支的[英文资料后台](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Freuse-cms-2026-10-17/file/profile-en)、[中文资料后台](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Freuse-cms-2026-10-17/file/profile-zh)、[常用网站后台](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Freuse-cms-2026-10-17/file/websites)均保留。尚未合并主线、更新正式内容编辑分支或发布。
