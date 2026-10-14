# 博客 UI/UX 调研证据

2026-10-14。对应[调研报告](../../u09-blog-uiux-research-2026-10-14.md)，归属 P03/P06/P15、U09/U13/U14。原图来自本机 Codex 内置浏览器实际打开的官方演示或作者页面；未编辑、拼接或生成页面截图，未作为本站应用素材采用。

## 页面与文件

| 文件 | 来源与状态 | 观察范围 |
| --- | --- | --- |
| [astropaper-home-desktop.jpg](astropaper-home-desktop.jpg) | <https://astro-paper.pages.dev/>；默认桌面 | 单列内容、摘要、导航；文章点击后的跳转未确认 |
| [cactus-home-desktop.jpg](cactus-home-desktop.jpg) | <https://astro-cactus.chriswilliams.dev/>；默认桌面 | 日期与标题对齐、置顶与正文层级 |
| [cactus-home-mobile.jpg](cactus-home-mobile.jpg) | 同上；请求 390×844 视口 | 日期与标题上下重排、折叠菜单与搜索入口 |
| [cactus-search-mobile.jpg](cactus-search-mobile.jpg) | 同上；请求 390×844 视口，搜索打开 | 实际结果数、片段、文章及章节链接 |
| [fuwari-home-desktop.jpg](fuwari-home-desktop.jpg) | <https://fuwari.vercel.app/>；默认桌面 | 横幅、侧栏、文章面板与元信息分组 |
| [fuwari-home-mobile.jpg](fuwari-home-mobile.jpg) | 同上；已确认的手机标签，请求 390×844 | 首屏文章优先、窄屏单列；未验证手机菜单交互 |
| [josh-article-desktop.jpg](josh-article-desktop.jpg) | <https://www.joshwcomeau.com/css/anchor-positioning/>；默认桌面 | 标题、日期、正文与右侧目录 |
| [josh-article-mobile.jpg](josh-article-mobile.jpg) | 同上；请求 390×844 | 标题自然换行、元信息重排、正文宽度；未验证目录及示例操作 |

实际 JPEG 像素尺寸、文件大小、写入时间和 SHA-256 见 [capture-metadata.json](capture-metadata.json)。视口请求尺寸与截图可见内容的像素边界分开记录；部分截图不包含浏览器滚动条区域。没有把原图按手机尺寸缩小充当响应式证据。

## 已完成的手机操作

Cactus 手机首屏打开菜单后，DOM 出现 Home/About/Blog/Notes 导航，并读回展开状态；见 [cactus-mobile-menu.txt](cactus-mobile-menu.txt)。

点击搜索按钮后，出现有名称的搜索 dialog、获得焦点的 searchbox 和关闭按钮；见 [cactus-mobile-search-open.txt](cactus-mobile-search-open.txt)。

尝试输入 `markdown` 后，实际读回输入为 `markdown的`，页面显示 3 个结果、匹配片段及章节链接；截图和 [cactus-mobile-search-results.txt](cactus-mobile-search-results.txt)保留这一输入偏差。此证据仅确认搜索结果结构，不能用来声称英文精确查询、中文输入兼容性或搜索相关性测试通过。观察结束前关闭搜索面板；未测 Esc、读屏、返回后的查询/滚动恢复及结果点击全程。

## 采集偏差与未测边界

浏览器控制前段创建/读取 AstroPaper 和文章点击连续超时。已加载标签仍存在，后续沿用同一浏览器，通过其文档提供的标签接口完成 Cactus、Fuwari、Josh 的截图及上述部分操作；没有改网站代码或注入应用状态。AstroPaper 文章结构来自官方网页读取，不是成功跳转的操作证据。

首次在另一标签请求 Fuwari 手机采集时，得到桌面排布；该画面归类为桌面图。随后在已经确认手机视口的标签重新采集，最终手机图是实际窄屏画面，错误的桌面重复图未保留为手机证据。

Maggie 与 Quartz 本轮只有官方网页/文档结构读取，没有新增浏览器原图或交互通过记录。没有开展 Lighthouse 性能测量、对比度全量测量、屏幕阅读器、320px、系统减少动画、实体手机或大陆网络验证。项目的响应式、可访问性或性能自述不等于本轮实测结论。

临时视口在结束时恢复，调研临时标签关闭，原有学习 PDF 标签保留。报告中的设计建议尚未实施，截图中的颜色、字体、插画和资源没有接入本站。
