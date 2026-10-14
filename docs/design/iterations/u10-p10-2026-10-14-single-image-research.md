# U10 / P10 单图浏览呈现方式研究

日期：2026-10-14。关联P10 / R06、R12 / U10、U14 / T12、T26、T27。

用户要求“找一下优质高级的单图呈现方式，我打算做一个单图浏览功能”。本轮交付官方案例、实际演示观察与适配建议；研究完成，用户尚未选型，未改4352?v=9或主站应用源码。

**随后同日用户已选择①＋②＋④并要求实现：**[第十片统一查看器](u10-p10-2026-10-14-single-viewer.md)已在独立原型交付4352?v=10。下文未选型/未实现措辞为研究当时的状态，不再构成当前开工门槛。

## 已体验的四种呈现

| 来源ID / 实际入口 | 本轮操作与观察 | 适配建议和限制 |
| --- | --- | --- |
| `single-continuous-reveal` / [Infinite Scroll GSAP Gallery](https://tympanus.net/Tutorials/InfiniteScrollGSAPGallery/) | 点击Inherited Light，照片从错列总览连续展开成左图/右说明详情；关闭入口标明Esc。实际详情截图已保存 | 借同一对象的位置/尺寸过渡，接本站空间中的选择；本站保留黑灰和完整原图。源Demo白底、固定左栏大图/AI照片不作为本站样式或素材采用 |
| `single-grid-slideshow` / [Grid to Slider Demo 2](https://tympanus.net/Development/GridToSlider/index2.html) | 分别打开Demo1和2同图；Demo2把其余照片移成顶部小缩略导航，主图居中，有留白和关闭入口 | 适合单图展陈与快速定位；本站题注移到图外、保留照片原色/原比例。作者明确这是dummy slideshow，不能把显示的prev/next当成完整切图功能已实现 |
| `single-cinema-slideshow` / [Slideshow Animations](https://tympanus.net/Development/SlideshowAnimations/) | 实际点击向右切换，查看01的全屏照片/遮罩转场；官方共有16种变体，本轮未逐个体验 | 参考切图节奏和遮罩过渡；本站仍按原比例完整显示，不照搬全屏cover。作为单图切换候选，不把16个效果一起加入图库 |
| `single-minimal-lightbox` / [PhotoSwipe](https://photoswipe.com/) | 点击原站照片，Next从1/5到2/5，使用Zoom往返；大图/少量控件清晰，已有成熟导航/缩放 | 延续项目既定查看器候选。可作为真正的切图/缩放/触摸底座，视图、题注及空间来源关联由本站适配；本轮鼠标验证不代替真机触摸/当前3D源对象接入验证 |

## 推荐组合，尚非用户选定

建议把single-continuous-reveal的同源展开动作、single-grid-slideshow的单图/缩略导航构图，与single-minimal-lightbox的浏览交互组合。照片从空间中的位置移向前景，稳定后完整显示；题注位于照片之外，关闭后回到原图与原镜头位置。沿用现有黑灰、原色、完整构图和减少动画规则，不新增另一套品牌参数。

动作仅在打开、关闭、切图时发生；单图阅读期间冻结后方图库/空间与惯性。性能与平滑性须在实际接入后测量，不能因为参考仅用DOM/GSAP就宣称无卡顿。当前Dome自带看图和空间dialog只作v9实际基线，未被本轮替换。

## 来源与使用条件

- [GridToSlider文章](https://tympanus.net/codrops/2023/05/04/ideas-for-grid-to-slideshow-switch-animations/)及[仓库](https://github.com/codrops/GridToSlider/)标明GSAP Flip和MIT；文章明确没有完整slideshow功能。照片由Midjourney生成，截图只作研究，代码许可不当作图片采用授权。
- [SlideshowAnimations文章](https://tympanus.net/codrops/2023/09/27/some-ideas-for-fullscreen-image-slideshow-animations/)与[仓库](https://github.com/codrops/SlideshowAnimations/)标明MIT；正式复用仍需固定版本/保留LICENSE并核对第三方依赖。此轮未复制代码/资产或安装GSAP。
- [Infinite Gallery文章](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)和[作者仓库](https://github.com/surya-aditya/codrops-infinite-scroll-and-content-transition)明确图片来自Midjourney，README声明MIT但列表未显示独立LICENSE文件；本轮只作动作参考，正式复用前仍需核实许可文本。
- [PhotoSwipe官网](https://photoswipe.com/)明确MIT；官方[开关动效](https://photoswipe.com/opening-or-closing-transition/)支持zoom/fade/none并响应减少动画，动态caption插件可按空间把题注放在下方/侧边。版本/组件接入与3D源对象匹配尚未验收，不假定2D缩略图过渡能直接处理透视照片。
- 用户收藏资源中，[Aceternity UI Layout Grid](https://ui.aceternity.com/components/layout-grid)已核对官方说明：基于Motion共享布局的点击展开。本轮只读官方页、未实际运行组件/核对具体源码许可，作为辅助动作参考，未引入其Next/Tailwind/Motion安装流程。
- Fancybox官方亦有Sidebar/Compact/Panzoom候选，已核对[介绍](https://fancyapps.com/fancybox/)与[许可](https://fancyapps.com/pricing/)：可开发/暂存试用，正式使用按其商业许可。本轮优先沿用MIT的PhotoSwipe，未安装/购买。

实际截图grid-to-single.png、grid-to-single-02.png、continuous-reveal.png、cinema-slideshow.png、minimal-lightbox.png仅保存于本对话可视化目录single-image-references；不复制入公开图片目录。原型/主站、依赖、正式相册与部署状态保持，选型和实现另行记录。

本片文档链接检查未出现新增问题；全仓仍有CONCEPT第9行、SPEC第87行对首页SYSTEM既有缺失锚点两条警告，不改并行首页来消警。研究用4个临时浏览器页已关闭，用户原4352?v=9体验页保持。
