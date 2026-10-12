# T13.15 / T16：关联候选自动回写与整合发布

2026-10-12 用户授权按既有方案开启自动回写并整合首页、学习区发布 GitHub Pages。

基线：学习区 `8ae107f`；首页已归档第 50 轮 `84dade4`。主工作区未提交的音乐开发保留；原始学习资料及本地音乐不进入发布。每片分别提交，main 经 PR、三项必需检查和 Squash 合并，保护规则保持。

第一片 T13.15 已实现 `90b6eda`：只为 `codex/learning-*`、`codex/content-*` 的已验证提交回写 `.pages.yml` 候选生成区。原生生成器沿用；Git API 非强制引用更新抵御并发 Save；新 head 显式触发三项检查，无变化不递归。9项边界测试通过。专用内容分支标题保存 `023fc01` → bot `2d3f8ef`（仅改 `.pages.yml` 一行）→ [新 head 检查](https://github.com/0ne-small-stone/personal-homepage/actions/runs/38253661199)成功，无变化 job 实际输出 unchanged；恢复原标题 `5d5f3ce` → bot `8713c92` → [恢复检查](https://github.com/0ne-small-stone/personal-homepage/actions/runs/38254111355)成功，无递归提交。main 和 PR 的回写 job 跳过。

第二片 P01/P03–P06/T02/T16.01 已保存 `c3cfde1`：[发布 PR #36](https://github.com/0ne-small-stone/personal-homepage/pull/36)，基于 main `ae39282`。整合 Astro React、Starlight 内容/Head/SiteTitle override、原生博客、锁定依赖及首页现有音乐待配置页面；不含主工作区未提交改动。PublicDirectory 共用6个入口，首页手机短文案为“目录”，顶栏只针对主要导航设置样式，避免影响目录菜单。PDF 采用 binary Git 属性，保留原字节及第三方许可证原文。

本地与 GitHub：65 Astro 文件零诊断；56 内容/关联/回写/棱镜测试通过；干净 Git archive 单独 npm ci、生产构建53页，站点HTML53（另PDF viewer），556文件约15.88MB。6栏目目录、单一base、44子页当前栏目检查、公开PDF及7组拒绝边界通过；原48内容及公开4页PDF哈希不变。[PR精确提交三项检查](https://github.com/0ne-small-stone/personal-homepage/actions/runs/38254328954)成功，PR检出自动回写和部署均跳过。构建保留已有插件override提示、大3D chunk提示和404优先路由提示；既有 KnowledgeContent 实际委托博客组件，不是新的渲染失败。

实际 IAB 桌面/390px：首页目录展开/ Esc关闭并返回焦点、首页→学习→PDF→筛选返回→首页成功；三类结果35资料/1演示文章/5笔记；主题阅读与整理匹配公开样本。搜索实际返回恢复“阅读”及类型文章/主题阅读与整理，1条结果。手机顶栏4控件不重叠，右边界359<390，知识区宽375，无横向溢出；PDF实际显示3/4及第三页文字，管理页面打开后“收起PDF侧栏”移除侧栏、焦点回原按钮。返回首页只保留1个场景canvas，知识页无canvas。

证据：[结构化记录](evidence/pages-release-2026-10-12.json)、[桌面首页](../../design/iterations/evidence/pages-release-2026-10-12/local-home-desktop.png)、[手机首页](../../design/iterations/evidence/pages-release-2026-10-12/local-home-mobile-confirm.png)、[手机筛选](../../design/iterations/evidence/pages-release-2026-10-12/local-knowledge-mobile-confirm.png)、[搜索返回](../../design/iterations/evidence/pages-release-2026-10-12/local-search-return-mobile.png)、[PDF第三页](../../design/iterations/evidence/pages-release-2026-10-12/local-pdf-mobile-confirm.png)。初次搜索返回采集早于异步恢复、误标手机首页时实际仍在搜索对话框、手机隐藏下一页按钮导致一次定位失败均保留在原始记录，不计为通过；随后按实际路由及原生控件确认，不修改应用补偿采集。章节锚点尚未滚动完成就离页的样本，不声称项目位置恢复已验。

第三片 T16.01：PR 三项成功且保护实际读回保持；随后 Squash 合并、Pages 部署与正式 HTTPS 浏览器验证。当前记录写入时仍待正式部署，完成结果另补真实 commit/run/URL。

边界：教材PDF原件仍本地，仅本站CC0四页PDF公开。原始48内容不改；两个自写功能笔记保持草稿，不进入生产搜索/关联。留言绑定、音乐云盘自动同步、跨页音乐播放、完整首页展开/加载美术、读屏、真机及大陆访问质量按既有计划另验。
