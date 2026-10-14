# Someone 调研浏览器原图

日期：2026-10-14。工具：Codex in-app browser，只读访问公开页面。桌面使用默认视口；手机临时设为 390×844，采集结束已 reset。PNG 保留原图，没有裁切、合成或美化。

| 文件 | 实际来源与采集范围 |
| --- | --- |
| [brittany-desktop.png](brittany-desktop.png) | https://brittanychiang.com/；左侧身份／目录、右侧 About 与经历开头，页面顶部 |
| [brittany-mobile-390.png](brittany-mobile-390.png) | 同站手机顶部，单栏身份后进入 About，实际页面内容可读 |
| [dennis-desktop.png](dennis-desktop.png) | https://dennissnellenberg.com/about；加载完成后大标题／分隔／短说明与照片起始 |
| [dennis-mobile-390.png](dennis-mobile-390.png) | 同页手机顶部，Menu、自然换行标题、说明与人物照片；截图底部出现横向滚动条，未判定其 DOM 原因，不能据此宣称无横向溢出 |
| [anthony-desktop.png](anthony-desktop.png) | https://antfu.me/；黑底介绍、项目链接、文章与照片去向 |
| [anthony-mobile-390.png](anthony-mobile-390.png) | 同站手机顶部，项目标签重排和单栏正文；图标含义未做可访问性实测 |
| [guillaume-loading.png](guillaume-loading.png) | https://guillaumeazadian.com/about；持续 Hello 加载态，仅记录访问限制，不作为页面完成态参考 |

前三站六张原图用于静态布局比较，不是完整 UI UX 验收。没有保存时间连续采样，也没有检验动画速度；Paco、Steph、Maggie 仅完成网页正文／结构读取。包装式截图与目录点击发生工具超时，改用同一浏览器的文档化 screenshot API 取得上述原图；不把失败尝试写成操作通过。

原站作品、肖像及品牌元素具有独立权利，本目录只用于项目本机设计研究，未接入站点公开资产。设计判断与建议见[调研记录](../../u13-p02-2026-10-14-someone-research.md)。
