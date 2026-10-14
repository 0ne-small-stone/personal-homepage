# Becoming 博客第二轮研究证据

2026-10-14。对应[候选报告](../../u09-blog-uiux-directions-2026-10-14.md)，P03/P06/P15、U09/U13/U14。原图由 Codex 内置浏览器实际访问公开网页取得，没有生成、拼接或改造页面画面；只作为设计研究证据。

## 主案例

| 来源 | 原图 | 实际范围 |
| --- | --- | --- |
| [Are.na Editorial](https://www.are.na/editorial) | [首屏](arena-editorial-desktop.jpg)、[内容网格](arena-grid-desktop.jpg) | 本机黑色界面；两列内容图像、标题与摘要 |
| [Are.na 文章](https://www.are.na/editorial/alice-yuan-zhang-on-building-things-into-being) | [桌面](arena-article-desktop.jpg)、[手机](arena-article-mobile.jpg)、[返回列表](arena-back-desktop.jpg) | 从首条内容进入文章，核对标题与来源；请求390×844截图，恢复桌面后返回，原条目仍在原浏览区域；桌面文章横向滚动条保留为观察 |
| [Emergence 长文](https://emergencemagazine.org/essay/new-life-for-the-ezo-spruce/) | [图像与标题](emergence-composition-desktop.jpg)、[进入正文](emergence-reading-desktop.jpg) | 图像开篇、标题/作者与引言、滚动后的文章身份 |
| Emergence 首次浮层 | [订阅浮层](emergence-newsletter-desktop.jpg)、[关闭过渡](emergence-newsletter-closing.jpg) | 首次加载出现订阅浮层，主动关闭；关闭过渡图不作为稳定首屏；未输入邮箱或提交表单 |
| [Andy working notes](https://notes.andymatuschak.org/) | [入口](andy-entry-desktop.jpg)、[引用打开](andy-linked-desktop.jpg)、[窄屏状态](andy-linked-mobile.jpg) | 点击引用后，原文保留左侧，新笔记打开右侧；[简要状态](andy-linked-state.txt)仅保存URL和UI事实，不转载笔记正文 |

Andy 的实际结果地址为 <https://notes.andymatuschak.org/About_these_notes?stackedNotes=z5E5QawiXCMbtNtupvxeoEX>。窄屏采集显示当前笔记及右缘部分内容，尚未验证其完整返回、退出或手势，不把这张图称作成熟手机方案。

## 辅助案例

| 来源 | 原图 | 实际范围 |
| --- | --- | --- |
| [Rauno 长文](https://rauno.me/craft/interaction-design) | [文章](rauno-article-desktop.jpg)、[章节](rauno-section-desktop.jpg) | 左侧目录点击 Metaphors 后URL出现相应锚点，正文到达该节；未运行全部媒体例子 |
| [Maxime 长文](https://blog.maximeheckel.com/posts/on-rendering-the-sky-sunsets-and-planets/) | [文章首屏](maxime-article-desktop.jpg)、[Index结果](maxime-index-desktop.jpg) | Index 实际去博客首页，不是打开正文目录；图形例子仅核对结构，未全量运行 |

文件的实际格式、像素尺寸、大小、写入时间与SHA-256见 [capture-metadata.json](capture-metadata.json)。手机采集请求390×844，部分原生截图排除滚动条或窗口边界；不将请求尺寸和文件可见像素边界混为同一项测量。没有缩放桌面图冒充手机图。

## 采集偏差与未测范围

首次加载 Emergence 得到短暂白帧，随后页面与自动订阅浮层实际出现；正文不是空白，白帧未作为稳定画面保存。关闭浮层时保留了一张淡出过渡，另取清晰的图像/标题构图。Are.na 首次加载有骨架占位，随后实际内容到达；列表点击后有短暂旧帧，最终文章已打开，截图采用实际文章状态。

Are.na 的返回检查包含中途手机视口查看再恢复桌面的过程，只证明这一次返回原浏览区域，不能外推为所有浏览器与路由都精确恢复滚动。Andy 只检查一次引用打开，没有验证多列上限、刷新恢复或全量键盘。Rauno 章节跳转只检查一处锚点，媒体播放与减少动画未验。

The Creative Independent、Dan Mall 仅官方网页结构初筛，Robin Rendle 的读取受 robots 限制；无本轮实际图像证据，不作为体验通过样本。没有检查读屏、对比度全量、实体手机、大陆网络或性能指标。原站图片、字体、正文与代码未用于本站应用，复用许可及工程可行性另验。

本轮只有研究文档与截图，没有修改应用、路由、设置、发布或服务；临时浏览器视口在结束时恢复。第一轮主推荐被用户否决的状态已同步到报告、PLAN与导航。
