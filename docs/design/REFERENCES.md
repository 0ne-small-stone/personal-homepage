# 个人主页设计复用与素材来源

2026-10-15 P13核心曲库参考[MeloX](https://github.com/youshen2/MeloX)桌面组织与[MeiloX](https://github.com/NEORUAA/MeiloX)手机组织。仅参照界面关系，以本站React/CSS实现，未复制Swift/Android代码、SF字体、封面或原站截图；原黑胶组件和许可继续保留。原项目GPL及其他资产许可各自成立，不能据界面参考推断音乐/图片授权。菜单使用浏览器原生Popover，参数与采用边界见[集成记录](iterations/u12-p13-2026-10-15-main-integration.md)。

2026-10-14 P10正式采用：React Bits Dome Gallery固定496968c4117e21278f13917201b7d615bc5e7450、PhotoSwipe5.4.4、Three0.186.1和Infinite Canvas参考承接已验收原型，完整许可与出处在[公开来源登记](../../public/gallery/attribution.txt)。用户授权发布36张WebP派生，原JPEG不公开；组件作为本站应用使用，不发布独立组件库，见[接入记录](../technical/iterations/t12-p10-2026-10-14-pages.md)。


## F03 时序参考与复用（2026-10-14）

按六站提醒规则，本轮提醒并核对 [Anime.js Timeline官方文档](https://animejs.com/documentation/timeline/)：适合讨论轮廓、空间与导航的重叠时序。只参考编排思路，实际复用已有GSAP/Three，不增加Anime依赖或复制案例素材。ALCHE仍为主参考，固定研究和来源沿用F03施工卡；字标、玻璃与局部柔光均沿用批准资产/原几何。实施状态、有限采样缺口及边界见[本轮证据](iterations/evidence/f03-loading-2026-10-14/implementation/README.md)，不将候选图检写为用户通过。

## P14 可移动迷墙与留言展开研究（2026-10-14）

**后续实际复用：**用户已选择建议并完成[独立第一样本](iterations/u08-p14-2026-10-14-wall-prototype.md)。运行复用项目既有GSAP3.15.0 [Draggable](https://gsap.com/docs/v3/Plugins/Draggable/)、[InertiaPlugin](https://gsap.com/docs/v3/Plugins/InertiaPlugin/)、[Flip](https://gsap.com/docs/v3/Plugins/Flip/)及浏览器原生[dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)，包保留GSAP版权和标准许可链接；Palmer只借动作思想，未复制其源码/素材。错缝布局、页面、内容连接和演示留言为本站原创，无新增依赖。下表的“本轮无采用”为研究当时的状态。

用户想要可移动砖墙、点砖弹出留言。拆解、来源许可与验证边界见 [U08 / P14 研究](iterations/u08-p14-2026-10-14-wall-research.md)；以下均为候选/参考，本轮无代码、素材或依赖采用。

| 来源 ID | 精确入口 | 用途与当前证据 |
| --- | --- | --- |
| `wall-palmer-drag-detail` | [Palmer Draggable Grid](https://tympanus.net/Tutorials/PalmerDraggableGrid/) / [作者文章](https://tympanus.net/codrops/2025/09/01/recreating-palmers-draggable-product-grid-with-gsap/) | 首选整墙移动与原单元到详情的交接；桌面初态/点击详情原图已查看，拖动未实测。仓库 LICENSE 为 MIT，正式复用需固定版本/保留声明，图像与依赖另核 |
| `wall-grid-zoom-context` | [Grid Zoom](https://tympanus.net/Development/GridZoom/) / [作者文章](https://tympanus.net/codrops/2021/12/01/grid-zoom-layout/) | 连续放大与缩略位置；官方说明/仓库 MIT 已核，未实点，示例并非完整 slideshow |
| `wall-unsent-message-archive` | [The Unsent Project](https://theunsentproject.com/) / [官方说明](https://theunsentproject.com/about) | 短话语档案与名字检索；不采用彩色、匿名/审核规则，不导入留言，未接受年龄/条款或投稿 |
| `wall-before-i-die-participation` | [Before I Die / Candy Chang](https://www.candychang.com/beforeidie/) | 公共墙与每人留痕；实体艺术参考，官方 CC BY-NC-ND 4.0，不改造或采用原图/模板 |
| `wall-aceternity-layout` | [Layout Grid](https://ui.aceternity.com/components/layout-grid) | 收藏资源中最贴近单砖展开，已提醒；组件行为/许可待验证，未安装 |
| `wall-infinite-canvas-pan` | [Infinite Canvas](https://tympanus.net/Tutorials/InfiniteCanvas/) / [作者文章](https://tympanus.net/codrops/2026/01/07/infinite-canvas-building-a-seamless-pan-anywhere-image-space/) | 远期平移/缩放与有限渲染，P10 有同源登记；不循环复制真实留言，不自动引入三维飞行 |

已有 `pf-wall` 继续负责《迷墙》主题/材质来源，Giscus 负责身份、写入和讨论管理；这些 UI 案例不替换二者。

## Someone 个人介绍界面参考 2026年10月14日

同日用户确认方向并要求以ITP报名表开发：Dennis的首屏留白、Brittany的经历层级、Anthony的阅读／内容连接已转译到[Someone首版](iterations/u13-p02-2026-10-14-someone-development.md)，未复制三站源码或人物素材。`someone-user-portrait`为用户指定报名表内的`word/media/image4.jpeg`，原样采用为`src/assets/about/portrait.jpg`（198×265，SHA-256 `be6d9b41b3d44468e8ee34dc3577a6dcd46b78dbdcd24bc30ae6b07a5318420c`）；不附带原扫描表、签章、成绩或其他身份字段。原图尺寸适合小幅肖像，不冒称新制作的高分辨率摄影。下方“参考候选／未改应用”保留为研究阶段记录。

用户要求调研优秀个人主页中 Someone 类似功能。首选三站有桌面／390px 原图；另外三站只核对正文与结构。[完整对比与本站建议](iterations/u13-p02-2026-10-14-someone-research.md)、[原图与采集边界](iterations/evidence/u13-p02-2026-10-14-someone-research/README.md)。均为参考候选，未采用第三方代码、照片或字体，未修改应用。

| ID | 作者页面 | 本轮用途与状态 |
| --- | --- | --- |
| `someone-dennis` | [Dennis Snellenberg About](https://dennissnellenberg.com/about) | 实际桌面／手机标题、留白、短介绍与人物照片布局；首屏构图候选，菜单和转场未验 |
| `someone-brittany` | [Brittany Chiang](https://brittanychiang.com/) | 实际桌面身份侧栏与 About／Experience／Projects 层级、手机单栏；经历索引候选，目录点击未通过操作验证 |
| `someone-anthony` | [Anthony Fu](https://antfu.me/) | 实际黑底单栏、介绍中的项目／文章／照片链接、手机标签重排；内容连接候选，图标与装饰不照搬 |
| `someone-paco` | [Paco Coursey](https://paco.me/) | 正文的 Now、音乐兴趣和 Connect 分工；个人叙事参考，未取得本轮截图或验证交互 |
| `someone-steph` | [Steph Ango About](https://stephango.com/about) | 简介连接写作／项目／Now、外部平台；稳定资料与近况分工参考，未实际读图 |
| `someone-maggie` | [Maggie Appleton About](https://maggieappleton.com/about) | 正文从能力关系到经历、个人成长与照片；叙事参考，未实际读图 |

Guillaume Azadian About 文本可读但浏览器持续加载，排除视觉主候选。Awwwards 按既有 `resource-awwwards` 提醒用于案例发现；质量判断以具体原站内容和实际页面为依据。案例版权与站点源码许可独立，本轮截图仅在设计证据目录保存，不接入 public 或作为获授权生产素材。

### P13-PLAYER-EXTRA-20261014 · 新增网易云播放器参考

用户继续要求寻找更多网易云第三方播放器。本批按作者仓库/README核对，不重复前批SPlayer、Alger、HyPlayer、Vutron；仅参考登记，没有安装、授权或接入，没有把作者声明写成本站播放能力。

| 参考 ID | 作者入口 | 特点和适用边界 | 来源/采用状态 |
| --- | --- | --- | --- |
| P13-PLAYER-EXTRA-01 | [Hydrogen Music复活版](https://github.com/ldx123000/Hydrogen-Music) | 延续明日方舟风格，深色模式、歌词/评论切换、私人漫游、网易云账号登录；Windows/macOS/Linux打包配置。适合研究沉浸歌词与曲库的分工 | 作者README及img/lyric.png、img/dark_mode.png；代码MIT，README另有非商业使用说明；图片/音乐独立权利。网页读取完成，浏览器截图页超时，未声称当前图已实际读图/客户端运行通过 |
| P13-PLAYER-EXTRA-02 | [不倦 bujuan](https://github.com/2697a/bujuan) | Flutter多端网易云客户端，登录/每日推荐/私人FM/电台/云盘，作者明确专注音乐、减少无用功能；适合研究手机端取舍 | 当前feature/new-ui作者README，MIT标识；图像含独立内容权利，未提取应用资产；未安装实测 |
| P13-PLAYER-EXTRA-03 | [TuneFree](https://github.com/alanbulan/TuneFree) | Tauri桌面聚合播放器，含网易云等来源、全屏播放器/主题/独立歌词；Windows/macOS安装包，区别于专门同步网易云个人账号的客户端 | 当前tauri作者README，MIT标识；这里只核对多音源搜索和界面功能声明，未验证账号/接口兼容，不直接采用 |
| P13-PLAYER-EXTRA-04 | [Listen 1](https://github.com/listen1/listen1_desktop) | Windows/macOS/Linux多平台曲库聚合，网易云为其中一个来源；适合参考搜索/队列组织，视觉优先级低于前两款 | 作者README与官方站，MIT标识；未声称完整网易云账号同步或本站播放已接通 |

按用户简约沉浸偏好，优先研究01歌词/播放区、02移动端取舍；这是基于作者定位的推荐，审美需用户看作者预览后选择。所有候选与现有黑胶页替换决定分开记录。

2026-10-14 T25.18艺术化研究：已实看REF-07 [Side One](https://github.com/mintdotgg/bookshelf)此前三维测试场景与REF-01 [Codrops](https://tympanus.net/codrops/2016/06/15/interactive-record-player/)官方图形化唱臂原图。前者是三维器物方向，后者是SVG抽象方向；Dribbble风格化Spline仅作者描述可读，实际原页需人机验证，未作已实看推荐。具体许可/俯视资产和原创变体未取得，用户选择/接入另记，见[艺术化参考](iterations/u12-p13-2026-10-14-tonearm-candidates.md#艺术化唱臂参考)。研究途中用户指出盘/套闪现，已优先完成T25.22空间修复。

2026-10-14 T25.18后续外观研究：用户继续询问更好看的唱臂，新增P13-TONEARM-REF-05 [Ortofon AS-212R](https://ortofon.com/products/as-212r)、REF-06 [Rega RB3000](https://www.rega.co.uk/products/rb3000)，与原REF-04 SME并排对照；实际官方图读回，Rega建议更适合简约黑灰、SME偏复古、Ortofon偏克制，均是执行者审美建议/尚未获用户选择。Reed 3P轴承近照已看但未入优先三款。来源/预览证据及图片使用边界见[第二组选型](iterations/u12-p13-2026-10-14-tonearm-candidates.md#当前素材之后的第二组选型)，没有再次替换当前应用唱臂。
2026-10-14 T25.18正式替代样本：原有矢量候选不满足写实要求，Technics模型未取得、SME照片再利用未验证。本次内置imagegen生成原创俯视银色曲臂/轴承/配重/黑色唱头透明图，导出`public/music/turntable/tonearm-metal-v1.webp`，重新测量落针坐标。生成提示词/模式/处理/alpha证据见[生成记录](iterations/evidence/u12-p13-2026-10-14-album-choreography-revision/tonearm-generation.json)，接入状态见[修订片](iterations/u12-p13-2026-10-14-album-choreography-revision.md)；未将厂家照片或模型viewer图作为应用素材，生成样本不冒充厂家实拍。

2026-10-14 T25.22六资源站提醒：resource-animejs的[Timeline](https://animejs.com/documentation/timeline/)适合对照收盘→换套→抽盘的顺序衔接，原官方页面已核对；本片用浏览器原生CSS动画与React粗粒度快照完成，未安装Anime.js或复制其代码，参数仍归SYSTEM。

2026-10-14 P13-TONEARM-REF-03/04写实候选：实际浏览[Geug的Technics SL-1210MK2](https://sketchfab.com/3d-models/technics-sl-1210mk2-41f8370f7899443488a9263de55601c0)公开viewer与CC Attribution标注，以及[SME M2-9R](https://sme.co.uk/product/series-m2-9r-2/)官方2560px金属图。前者是待取得/拆分渲染的模型候选，后者仅材质参考，照片再利用许可未核验；均未替换应用唱臂，见[本片](iterations/u12-p13-2026-10-14-tonearm-candidates.md)。

2026-10-14 P13-TONEARM-REF-01/02：已读取[Codrops RecordPlayer](https://github.com/codrops/RecordPlayer)的icon-tonearm路径与项目许可、[Vinyle](https://github.com/Liotou/obsidian-vinyle)的SVG与MIT LICENSE，制作黑灰矢量适配对照。用户看后要求“继续找更写实的金属唱臂”，两款不采用，继续寻找高清金属素材/可授权模型；原图、改造范围及状态见[本片](iterations/u12-p13-2026-10-14-tonearm-candidates.md)。

2026-10-13 P13/T25.12排版参考：`P13-LAYOUT-REF-01` [Apple Music中国区新发现](https://music.apple.com/cn/new)、`P13-LAYOUT-REF-02` [Cider官方专辑截图](https://cider.sh/client/album.webp)、`P13-LAYOUT-REF-03` [Tauon官方主窗口](https://tauonmusicbox.rocks/_astro/scr.C0AQBHoy_ZkxhJy.webp)均实际读图。采用侧栏/内容分组、曲目阅读节奏与底栏比例，未复制字体、图像、源码或框架；原图仅为研究证据。Apple US专辑请求重定向，不宣称此轮查看其专辑页；YesPlayMusic作者demo实际暂停。来源与成品证据见[排版重整](iterations/u12-p13-2026-10-13-elegant-layout.md)。

2026-10-13 P13悬窗参考：P13-MINI-REF-02 Apple Music大封面已由用户选择，并完成本站组件适配；Spotify/Sleeve/Cider保留调研记录。只借布局/交互，未复制宣传图或引入播放器框架，现有真实封面与原生音频保持。来源及实际证据见[本片](iterations/u12-p13-2026-10-13-floating-player-research.md)。


文档对应（2026-10-07 整理）：本文件为设计侧 `REFERENCES.md`，对应[技术调研与候选方案](../technical/REFERENCES.md)。本文维护体验参考、素材许可与改造范围，技术侧维护依赖能力和运行条件；职责与任务映射见[文档对应表](../README.md)。

更新日期：2026-10-07。本文为[整体页面与交互设计](SPEC.md)提供可追溯的设计参考、组件候选和素材来源。未列实际采用及验证记录的代码、素材仍为候选，不能视为已接入项目或正式页面。

## T08.02 PDF 侧栏收起资源

P05/P06 / K04-native / U09。复用现有 PDF.js 6.4.299（Apache-2.0）的 viewsManagerButton、原生工具栏开关、焦点颜色与44px目标；只增加“收起”文字、中文可访问名称和少量事件适配。ui-ux-pro-max键盘/焦点指导沿用，未增加图标、图片、字体、依赖或新主题。三张证据使用项目CC0公开功能PDF，不使用用户教材截图；[实际验证](iterations/u09-p05-t08-02-2026-10-08-01.md)。

## T07.04 学习总览排序资源清单

P03 / K01、K02、K03、G04 / U09、U14：复用现有主题菜单的原生 select、标签、44px 操作尺寸、Starlight 语义颜色和苹方优先字体栈；所需资源仅三条选项和未知值/排序反馈文案。新增字体、图片、图标、动效及依赖为 0。

使用本机 ui-ux-pro-max 定向检索 `sort select keyboard focus web`，命中 Web Keyboard Navigation 与焦点可见规则，按实际 Tab/方向键、44px 及移动换行检查；不套用新主题或 AAA 合规声明。33 组实际 Edge 证据和三份已查看截图见[本轮实例](iterations/u09-p03-t07-04-2026-10-08-01.md)。

## T06.01 公开 PDF 资源清单

P05 / R02 / U09 / K04-native、G04：复用既有 PDF.js 阅读器、来源折叠区、全屏与下载链接、来源返回和 44px 焦点状态；页面继续使用 SYSTEM 的苹方优先字体栈，无新构图、图标、图片、材质或网页字体。

新增 `public-pdf-reading-check` 为项目生成的四页功能样本（CC0-1.0），明确标注性质；`pdf-noto-sans-sc-subset` 是 PDF 内嵌中文文字子集（OFL-1.1），独立保留官方许可。来源、具体版本与字节指纹见[公开附件登记](../../public/materials/README.md)。四页排版和中文文字逐页检查，三个阅读截图实际查看，见[本轮实例](iterations/u09-p05-t06-01-2026-10-08-01.md)。不将字体文件加入网页，也不将既有课程 PDF 改标为公开素材。

## T26.01 阅读返回资源清单

P03/P05/P06 / G04、K03、K04-native / U09、U14：复用已有 ArticleNavigation、原生链接和浏览器历史、Starlight 语义颜色/焦点、SYSTEM 的 44px 目标及苹方优先栈；PDF.js 6.4.299 沿用已接入 viewer 与 Apache-2.0 许可。所需设计资源只有“返回学习总览／文章列表／搜索结果／上一页”来路文案及既有键盘焦点状态。新增图片、字体、图标、材质、音频和 npm 依赖为 0。

没有新构图或动效缺口，不从登记的六个资源站引入装饰资源；不改变外部笔记原站。范围与截图见[本轮实例](iterations/u09-p05-p06-t26-01-2026-10-08-01.md)，实际持久能力和边界见[技术来源](../technical/REFERENCES.md#t2601-阅读返回与-pdf-原生历史2026-10-08)。新 P03 整体设计与首页由独立工作区交付。

## T02.01 全站目录资源清单

G01/G05 / U13、U14：本轮复用浏览器原生 details/summary、Starlight 0.42.5 的 SiteTitle（MIT）及既有 SYSTEM 控件参数、两种布局语义颜色和学习苹方优先栈。需用资源只有六个栏目名称/规范地址、当前页与栏目文案、关闭入口和既有焦点样式；新增图片、字体、图标、音乐、材质及 npm 依赖均为 0。“+ / −”是辅助展开标记，语义由可见文字与原生控件提供。

已提醒用户登记的 [Aceternity UI Floating Navbar](https://ui.aceternity.com/components/floating-navbar) 可作后续导航视觉参考；其滚动显隐方式未在本轮采用，没有复制源码或资产。本轮目标由原生展开控件与少量状态适配覆盖，不引入动画导航或新主题。最新品牌与首页场景资源留在相应设计切片；当前工程页头仍为过渡基线。

样本、前后对照、手机宽度/明暗证据及许可采用边界见 [T02.01 设计记录](iterations/u13-g01-t02-01-2026-10-08-01.md)，技术能力来源见[技术清单](../technical/REFERENCES.md#t0201-公共目录与前缀2026-10-08)。

## T07.02 主题组合筛选资源清单

P03 / K01、K02 / U09：复用[浏览器原生 select](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select)、已有单选、统一结果 status 和 Starlight 语义颜色、焦点与苹方优先栈。主题名称从已发布内容读取；需要的设计资源是“主题/全部主题/清空筛选”文案、空结果与未知条件说明和既有控件状态。新增图片、字体、图标、材质、音频和 npm 依赖为 0。

本轮原生控件覆盖功能缺口，没有六个登记资源站所对应的新构图或动效需求。设计工作区的 P03 第 3 轮整体构图仍待独立接入，不将旧工程样式或本轮行为证据写成新版页面审美已通过。[实例与真实截图](iterations/u09-p03-t07-02-2026-10-08-01.md)及[技术来源](../technical/REFERENCES.md#t0702-原生主题选择与-url2026-10-08)分别保存采用与能力边界。

## T07.01 学习类型筛选资源清单

T09.03 的阅读资源见[本轮清单](#t0903-文章阅读资源清单)；下文 T07.01 的三条演示数量是当轮历史样本。

2026-10-07：本轮只实现 P03 的类型筛选，复用现有页面、文字、系统字体和主题变量。新增下载素材与 npm 依赖均为 0。下面的资源用于 K01 类型选择和 K02 清空；图片、墙材、棱镜、图标、音频及新字体不属于此切片的资源需求。

| 资源 ID | 资源与来源 | 本轮用途与采用边界 |
| --- | --- | --- |
| `filter-native-radio` | 浏览器原生 [radio 单选输入](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/radio) | 用 fieldset/legend 与可见标签表达单选；保留浏览器键盘行为。不是下载素材，无第三方控件代码拷贝 |
| `filter-theme-tokens` | [设计规范](SYSTEM.md)与现有 `src/styles/tokens.css`、`src/styles/knowledge.css` | 复用深浅主题、边界、焦点、间距、控件尺寸；选中同时使用原生圆点、边界与字重，不另定配色 |
| `filter-system-font` | 现有正文系统字体栈 | 控件及状态文案沿用正文；不下载或嵌入新字体 |
| `filter-type-copy` | 既有资料／文章／笔记类型，新增“全部”、类型分组名称、结果数量及空结果说明 | 类型名称读取现有 kindLabels；清空通过选择“全部”完成；本轮不替换栏目命名或歌词 |
| `filter-demo-content` | `src/content/docs/knowledge/` 中现有三条已发布演示内容 | 实际验证三类结果；保留演示标识，不导入原始资料，不伪装为真实用户内容 |

复用取舍：本机 Starlight 0.42.5 的 `dist/user-components/Tabs.astro` 提供面板切换和可选 localStorage 同步，并未提供同一列表按类型及 URL 参数筛选。若把“全部”和三个类型分别作为面板会复制条目。因此保留同一批静态列表，以原生单选和 [Astro 客户端脚本／自定义元素](https://docs.astro.build/en/guides/client-side-scripts/#web-components-with-custom-elements)补最小筛选与历史恢复逻辑；组件连接时注册事件、移除时释放。本轮不接入 React、额外 UI 库或新路由方案。Starlight 和 Astro 的版本及许可见[技术采用记录](../technical/REFERENCES.md#t01-工程采用记录2026-10-07)。

采用状态：上述五项已在 T07.01 实际使用；本地生产构建与浏览器验证通过，截图和限制见[U09 局部记录](iterations/u09-p03-t07-01-2026-10-07-01.md)。用户体验待反馈。


## ALCHE 首页标杆与采用边界

2026-10-08 用户进一步要求**复刻 ALCHE 的交互和动画**。[17 轮精确研究](iterations/u03-p01-2026-10-08-17.md)包含分段公式、指针/流体、加载、控件、切页与手机差异，并有[七段实际动画回放](iterations/evidence/alche-motion-2026-10-08/index.html)。[第 10 轮](iterations/u03-p01-2026-10-08-10.md)保留早期观察，其近似施工建议不再覆盖新要求；采用参数维护在 SYSTEM。

| 来源 ID | 原始来源 | 用途与采用状态 |
| --- | --- | --- |
| `home-alche` | [ALCHE 官网](https://alche.studio/) | 用户指定交互/动画复刻对象；按已观测输入响应、轨迹、节奏和状态核验。四入口与 The Wall 的内容映射另记，素材及源码使用条件独立 |
| `home-alche-source` | [主场景脚本](https://alche.studio/_astro/index.astro_astro_type_script_index_0_lang.Cn_goiN_.js)、[首页 CSS](https://alche.studio/_astro/index.CQ0ApTUm.css)、[公共 CSS](https://alche.studio/_astro/about.DKIoZJhT.css)、[路由脚本](https://alche.studio/_astro/page.SNkKDTDH.js) | 只读核对真实实现；hash 和版本在研究记录；不作为可直接复用的站点源码授权 |
| `home-alche-license` | [官网 LICENSE](https://alche.studio/license/) | 核对第三方依赖条件；依赖许可不等于原站模型、Lottie、图像、声音、商业字体与定制 shader 的开放许可 |
| `home-glass-drei` | [MeshTransmissionMaterial](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material)、[Drei MIT](https://github.com/pmndrs/drei/blob/master/LICENSE) | 14 轮已接入，作为增强透射的材质对照；局部工程证据存在，最终视觉与实机性能未验收 |
| `home-three` | [Three](https://threejs.org/)、[MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE) | 已用于首页三角几何和场景；各章节和实例化白砖按技术 PLAN 分别验收 |
| `home-lightformer-rig` | [Drei Lightformer](https://drei.docs.pmnd.rs/staging/lightformer)、同上 Drei MIT | 现有程序化环境组件；15 轮首选仅改亮面分布，环境只用于玻璃反射，具体规则见 SYSTEM 9.3。文档与许可已复核，不增加资产下载 |
| `home-studio-small-08` | [Studio Small 08](https://polyhaven.com/a/studio_small_08)、[Poly Haven CC0](https://polyhaven.com/license)；作者 Sergej Majboroda | 15 轮备用环境：资产页提供 HDR/EXR 及 1K/2K 档，中性软灯箱。已核对页面与许可；未下载、未检查实际文件像素、未渲染、未采用。仅在程序化对照仍有明确缺口时选小尺寸本地资产；不使用网页的球体预览图作生产素材 |
| `home-motion-gsap` | [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)、[Standard License](https://gsap.com/community/standard-license/) | 原生滚动编排首选，采用时保留其实际许可；不登记为 MIT |
| `home-font-plex` | [IBM Plex 官方](https://github.com/IBM/plex)、[OFL](https://github.com/IBM/plex/blob/master/LICENSE.txt) | 首页导航 Plex Mono、标题 Plex Sans 的施工候选；自托管所需拉丁文件。学习仍用苹方栈 |

本站正式资源沿用已批准字标、真实个人内容、许可明确的字体/库与原创三角/墙几何；用户另允许以下专辑图用于占位样本。ALCHE 截图保存在设计研究证据中，不作为产品展示图片。Acumin 的原站 Adobe kit 不接入本站；如后续另购字体，重新登记自己的许可与来源。

## 首页专辑图占位

2026-10-08 用户明确允许先用专辑图等占位。下面是设计侧选定的第一组施工样本，不代表用户逐张确认或正式内容已接入。三张原图已逐一查看并核验元数据；官方专辑页面本轮重新打开确认。来源版权沿用官方声明，状态为用户指定用途的临时视觉占位，不登记为 CC0 或已取得正式生产资产许可。

| 资产 ID / 章节 | 原稿与实际规格 | 官方来源与素材性质 | 接入要求 |
| --- | --- | --- | --- |
| `home-placeholder-project-wall` / projects | [03-wall.jpg](iterations/samples/u03-p01-2026-10-08-05/references/03-wall.jpg)，JPEG，1500×1350，70,743 B | [The Wall](https://www.pinkfloyd.com/albums/the-wall/)，白砖与红字专辑封面；官方列 Roger Waters 概念、Gerald Scarfe 实现 | 首个接入对象，替换项目面的字标占位；亮底、砖缝、红字提供可辨的折射参照。整图等比呈现，不拉伸到现有横板比例。标注“视觉占位 · Pink Floyd — The Wall”，项目 CTA 仍到 `/showcase/` |
| `home-placeholder-radio-wish` / radio | [02-wish.png](iterations/samples/u03-p01-2026-10-08-05/references/02-wish.png)，PNG RGBA，1300×1300，401,247 B | [Wish You Were Here](https://www.pinkfloyd.com/albums/wish-you-were-here/)，官方黑胶唱片及机械握手标签图；不是方形外封。专辑页列 Hipgnosis 与 George Hardie | 保留透明外缘和中心孔，复用完整唱片图，避免再次画一套假封面；图文应标 Wish You Were Here，不继续用 Echoes 标签指代此图。显示唱片图占位，播放与共享歌单仍按真实未接入状态 |
| `home-placeholder-album-echoes` / album | [05-echoes.jpg](iterations/samples/u03-p01-2026-10-08-05/references/05-echoes.jpg)，JPEG，1500×1356，67,042 B | [Echoes: The Best of Pink Floyd](https://www.pinkfloyd.com/albums/echoes-the-best-of-pink-floyd/)，嵌套窗口的摄影拼景封面 | 用于影像章节的空间层次样本；完整保留窗口与原图比例。标注“影像占位 · Pink Floyd — Echoes”，不署为小石摄影；CTA 仍到 `/gallery/` |

原始下载地址已保存在 [generation.json](iterations/samples/u03-p01-2026-10-08-05/generation.json) 的 `records[].url` / `referenceFile`；只使用该目录 `references/` 的官方原图，不能误用上级目录的旧 AI Logo 候选。原图不改写。开发将实际采用文件复制到构建资产目录，以 Astro 图片流程派生，登记网页路径；这里不是应用运行时路径。

**统一呈现：**图片保持原色，黑灰背景和文本规范不变；首版采用完整等比显示，必要时留黑，不将近方图拉伸成横图。说明在画面外以既有辅助字级清楚标注，沿用现有尺寸与对比度规范，不给图片增加水印。DOM 后备内容、alt 和 WebGL 的图像/说明应一致。用户以后提供真实内容时可按素材字段替换，不改转场代码。

**接入顺序：**当前玻璃灯光旧新对照使用原图基线先收口；随后单独换项目占位图并采集新的静帧，再据此验 intro → projects。电台与相册在各自章节切片接入另外两图。常用网站保留真实网站名称；升墙仍使用已选的哑光实体白砖，不用封面图片冒充整个三维墙。加载图像失败时保留文本与真实入口。图片本轮仅完成选择和交接，未由设计侧修改应用源码。

## 六个设计资源站与提醒规则

2026-10-14 P10第十二片`p10-return-wireframe`：既有项目无对应球面网格图标，使用原型统一SVG描边样式制作圆/椭圆/经纬线的简单几何图标，直接内联在[原型index.html](iterations/evidence/u10-p10-2026-10-13-sphere-canvas/prototype/index.html)。本站适配产物，不复制第三方图标，不新增依赖/位图；实际44px按钮、28px图标与功能证据见[本片](iterations/u10-p10-2026-10-14-overview-controls.md)。
2026-10-14 P10第十片实际采用`single-photoswipe-v5`：用户选择①展开+②排布+④缩放后，官方npm photoswipe@5.4.4的ESM/CSS固定在原型vendor，[来源哈希](iterations/evidence/u10-p10-2026-10-13-sphere-canvas/prototype/vendor/photoswipe/provenance.json)与[MIT全文](iterations/evidence/u10-p10-2026-10-13-sphere-canvas/prototype/vendor/photoswipe/LICENSE)保留/随生成包复制。参考案例仅借动作/构图，来源投影桥和缩略导航为本站适配；未采用其AI图片或GSAP/Aceternity代码。实际能力/性能/限制见[第十片](iterations/u10-p10-2026-10-14-single-viewer.md)。

2026-10-14 P10/U10 单图浏览研究：新增`single-continuous-reveal`（[Infinite Scroll GSAP Gallery](https://tympanus.net/Tutorials/InfiniteScrollGSAPGallery/)）、`single-grid-slideshow`（[GridToSlider Demo2](https://tympanus.net/Development/GridToSlider/index2.html)）、`single-cinema-slideshow`（[Slideshow Animations](https://tympanus.net/Development/SlideshowAnimations/)）及`single-minimal-lightbox`（[PhotoSwipe](https://photoswipe.com/)）候选，实际点击/切换/缩放范围与许可见[单图研究](iterations/u10-p10-2026-10-14-single-image-research.md)。Aceternity [Layout Grid](https://ui.aceternity.com/components/layout-grid)按六站提醒规则提供同源展开动作参考；未装其框架/组件，未复制代码/照片，研究不等于用户选型或正式采用。

2026-10-13 P10/U10 球面到无限空间原型参考：`gallery-dome` / [React Bits Dome Gallery](https://reactbits.dev/components/dome-gallery)（半球曲面、拖拽与选图，作者 David Haz；当前 MIT + Commons Clause）；`gallery-infinite-canvas` / [Edoardo Lunardi Infinite Canvas](https://github.com/edoardolunardi/infinite-canvas)（空间移动、缩放与可重复媒体区域，MIT）。两者为交互机制参考，不复制原站图片。独立原型复用现有 Three.js 0.186.1 的投影、射线选取与资源管理，以少量适配连接两种布局；不安装第二套主题或主站依赖。当前工作区 `图片/` 的 36 个 JPEG 只作本机样本，原文件保持完整，压缩派生与清单放在忽略目录 `.local-tools/sphere-canvas/`；不据此声明作者身份、公开许可或正式相册内容。详情见 [原型记录](iterations/u10-p10-2026-10-13-sphere-canvas.md)。

同日修订采样官方 [constants.ts](https://github.com/edoardolunardi/infinite-canvas/blob/main/src/infinite-canvas/constants.ts)、[区域生成](https://github.com/edoardolunardi/infinite-canvas/blob/main/src/infinite-canvas/utils.ts)、[控制器/消隐](https://github.com/edoardolunardi/infinite-canvas/blob/main/src/infinite-canvas/scene.tsx) 与实际演示。采用其确定性区域生成及随机种子函数，适配为原生 Three.js、黑底、同图锚点和受限对象池；保留 MIT 署名/许可。React/R3F 外壳与原站艺术作品不复制。React Bits 继续仅作曲面机制参考，未复用受 Commons Clause 限制的组件源码。

最新第三片继续适配同一MIT控制器的滚轮积累、速度上限、追随/衰减，以及距离雾/透明度消隐；来源说明保留在flight.js。镜头入墙路线属于本站连接层，保留椭球几何但全部照片使用原图比例。标杆公开Demo的白底/艺术图片不复制，不以本站黑底照片帧宣称像素复刻。

同日用户否定椭球构图后，实际查看与拖动下列公共案例；研究结果见[第四片前置记录](iterations/u10-p10-2026-10-13-sphere-canvas.md#第四片前置曲面照片墙案例研究)。它们是球面/弧面 UI 参考，不宣称均为自适应椭球；截图只作研究证据，不当作生产素材授权。

| 来源 ID | 官方入口 | 可借鉴部分与采用边界 |
| --- | --- | --- |
| `gallery-dome-layout` | [Dome Gallery](https://reactbits.dev/components/dome-gallery)、官方 [JSX](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/DomeGallery/DomeGallery.jsx) / [CSS](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/DomeGallery/DomeGallery.css) | 已核对相邻列纵向错位、边缘渐隐及固定框 cover；参考构图，不照搬裁图，不采用组件源码，许可边界沿用 gallery-dome |
| `gallery-inverted-dome` | [React Bits Pro Inverted Dome](https://pro.reactbits.dev/docs/components/inverted-dome) | 公共预览已看/拖动，只借大照片与紧凑间距；内凹形态与边缘变形不匹配本站约束。未取得付费源码或使用许可，不采用其资产/源码 |
| `gallery-infinite-menu` | [React Bits Infinite Menu](https://reactbits.dev/components/infinite-menu) | 已实际看 Gallery/Orbit 并拖动；参考镜头拉远/前方焦点，不复制固定框/圆形裁切、运动 stretch、自动切换；本轮未复用源码或图片，正式采用前核对当时许可/兼容性 |

同日第四片用户已选择 `gallery-dome-layout` 的错列构图与 `gallery-infinite-menu` 的上下左右自由旋转。独立原型采用原创原比例列占位、四元数增量/局部框输送和椭球适配；不复制两组件源码/图片，不保留Dome纵向限制、不采用Menu运动拉伸/圆形裁切。已有MIT的Infinite Canvas连接层继续使用。实际交付与参数见U10记录和SYSTEM第10节；方向选择与成品用户审美分别记录。

**第五片实际采用 `gallery-dome-source-v5`：**用户改为完整复用Dome Gallery并选择完整图/黑边。官方[固定提交](https://github.com/DavidHDev/react-bits/tree/496968c4117e21278f13917201b7d615bc5e7450)、[组件](https://github.com/DavidHDev/react-bits/blob/496968c4117e21278f13917201b7d615bc5e7450/src/content/Components/DomeGallery/DomeGallery.jsx)、[CSS](https://github.com/DavidHDev/react-bits/blob/496968c4117e21278f13917201b7d615bc5e7450/src/content/Components/DomeGallery/DomeGallery.css)实际接入独立原型；[完整许可](iterations/evidence/u10-p10-2026-10-13-sphere-canvas/prototype/vendor/REACT-BITS-LICENSE.md)与[哈希来源](iterations/evidence/u10-p10-2026-10-13-sphere-canvas/prototype/vendor/provenance.json)保留，许可随生成包复制。以应用组成部分使用，不提供独立组件库；原示例图片不采用。CSS未改，JSX仅为完整图/自由纵向、窄屏/输入/减少动画和空间连接适配，结果见[第五片](iterations/u10-p10-2026-10-13-sphere-canvas.md#第五片实际交付官方dome-gallery接入)。上方此前“不复用源码”是第一至第四片历史状态。

> 2026-10-08 首页首要体验标杆已由用户明确指定为 ALCHE。六站继续提供按需局部资源，不重新替代本轮已确定的整体方向。

记录日期：2026-10-08。用户明确要求保存以下六个网站及用途，后续任务可能用到时主动提醒。此表作为项目的长期资源入口；单个组件的采用、版本和实际验证继续记在对应迭代中。

| ID 与网站 | 主要用途 | 在本项目中何时主动提醒 | 可直接体验的入口 |
| --- | --- | --- | --- |
| `resource-motionsites` · [MotionSites AI](https://motionsites.ai/) | 网页设计提示词、动态背景、模板与教程，辅助 AI 生成方向样本 | 首页构图、黑色空间、入场氛围、需要快速比较视觉方向时 | [官方产品与使用说明](https://motionsites.ai/terms)；首页本次读取超时，定位依据官方说明。按此域名登记，不将其他同名站视为官方镜像 |
| `resource-react-bits` · [React Bits](https://reactbits.dev/) | 可改造的 React 文字、背景、图片和微交互组件 | 棱镜、引导光、图片显影、作品浏览或局部动效需要现成起点时 | [Light Rays](https://reactbits.dev/backgrounds/light-rays)、[Prism](https://reactbits.dev/backgrounds/prism)、[源码与安装说明](https://github.com/DavidHDev/react-bits) |
| `resource-uiverse` · [Uiverse](https://uiverse.io/) | 社区按钮、输入框、开关、卡片、加载状态等 UI 元素及代码 | 搜索框、播放/暂停、声音开关、下载、推歌表单和局部状态反馈需要打磨时 | [UI 元素目录](https://uiverse.io/)；选定后提供具体条目链接及作者 |
| `resource-animejs` · [Anime.js](https://animejs.com/) | 动画时间线、缓动、滚动联动、拖拽、SVG 路径与形变 | 需要编排光线、镜头参数、内容出现的先后，或制作 Logo 描线、展开/返回动作时 | [官方文档](https://animejs.com/documentation/)；与既有 GSAP/Motion 候选按实际缺口比较 |
| `resource-aceternity` · [Aceternity UI](https://ui.aceternity.com/) | React、Tailwind CSS、Motion 组件及页面区块，包括聚光、网格、内容展开与导航 | 项目/照片展示、砖块到话语的展开关系、栏目导航与局部光照反馈时 | [Spotlight](https://ui.aceternity.com/components/spotlight)、[Layout Grid](https://ui.aceternity.com/components/layout-grid) |
| `resource-awwwards` · [Awwwards](https://www.awwwards.com/) | 网页设计评选与真实网站案例，研究完整体验 | 确定整体艺术方向、空间叙事、非传统导航、分页关系、进入/返回和作品集布局时 | [3D 案例](https://www.awwwards.com/websites/3d/)、[作品集案例](https://www.awwwards.com/websites/portfolio/) |

### 提醒方式

1. 明确本轮页面、控件和主要变量后，先匹配上表。存在具体用途时，在开始选型或制作样本前主动提醒用户，优先给出最相关的 1–3 个资源。
2. 提醒应包含“当前要解决什么 → 哪个网站/具体组件可以帮助 → 可直接体验的链接 → 需要怎样适配 LSSH”。例如：做学习入口的引导光时，指出 React Bits Light Rays 可作为方向样本，同时说明正式受光需跟随立方体场景坐标。
3. 同一候选已讨论且需求没有变化时，继续实施已定方向；发现更合适的组件、实际缺口或新的适用任务时再提醒。此规则随项目工作触发，无定时重复通知。
4. 保存清单不改变 Astro、Starlight 与既有技术决定。参考站帮助构思，组件站提供局部实现，动画库负责动作编排；选用时继续遵循黑灰、圆润克制、苹方优先及小步验证。

### 已核对的使用边界

- React Bits 的[当前许可](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md)为 MIT 加 Commons Clause，可用于网站，组件自身的销售、转授权与再分发受限；采用具体版本时保留许可。
- Uiverse 官网声明站内 UI 元素采用 MIT。具体条目仍记录作者与改造范围，并验证键盘、触摸和状态。
- Aceternity 有免费与付费资源，[Pro 许可](https://ui.aceternity.com/licence)和第三方条目分别核对；普通展示组件不取代已有阅读器、图库或 Giscus 的成熟交互。
- MotionSites 的模板和提示词按[官方条款](https://motionsites.ai/terms)使用；Awwwards 收录案例作为体验参考，单个作品的素材与源码另查来源。
- 迷墙立方体的几何、相机、光照与遮挡由同一场景协调，现成二维背景效果需验证适配。当前清单登记完成，未因登记安装新依赖、购买资源或接入正式页面。

## 迷墙立方体空间探索来源

2026-10-08，用户提出立方体与光线方向；对应 [U03/P01 第九轮](iterations/u03-p01-2026-10-08-09.md)。以下案例参考交互组织，未复制其图像、模型、网页或商业源码。

| ID | 原始来源 | 观察与本项目采用边界 |
| --- | --- | --- |
| `space-unseen-clou-hubtown` | [Unseen Studio 自述，2026-07-20](https://tympanus.net/codrops/2026/07/20/the-craft-behind-memorable-digital-experiences-inside-unseen-studio/) | CLOU 用三维项目环组织项目，Hubtown 将沉浸旅程接到实用项目地图。本站据此推导：空间动作应对应内容组织，并最终交给可直接使用的界面。本轮阅读作者说明，未声称完整实操这两个站点 |
| `space-unseen-crosswire` | [Unseen Studio 的 Crosswire 制作案例](https://tympanus.net/codrops/2023/04/04/case-study-crosswire/) | 作者比较实时环境反射与 matcap 等材质路线，说明相机转动会改变视觉效果。本站将光和相机放在同一运动路径检查，不从单张静帧决定全部材质；未采用其模型或 shader |
| `space-three-r180` | Three.js [r180 包信息](https://raw.githubusercontent.com/mrdoob/three.js/r180/package.json)、[MIT 许可](https://raw.githubusercontent.com/mrdoob/three.js/r180/LICENSE) | 对话内样本锁定 0.180.0，复用 WebGLRenderer、标准几何、MeshStandardMaterial、DirectionalLight、相机与阴影；少量适配仅管理固定朝向、距离和控件。尚未加入主站依赖 |
| `space-three-lighting` | Three.js [标准材质](https://threejs.org/docs/pages/MeshStandardMaterial.html)、[方向光](https://threejs.org/docs/pages/DirectionalLight.html)、[阴影](https://threejs.org/docs/pages/LightShadow.html)、[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html) | 材质和光采用库原生能力。通用轨道控制支持更自由的观察，当前样本只需水平拖动与四向停靠；因此用少量约束适配。后续生产集成仍先比较现成控制组件 |

墙体沿用用户提供的平整哑光错缝参考，样本无外部贴图、无新增背景图片。样本中的墙面文字是当前栏目名，留言为演示。CDN 加载在测试浏览器成功，不代表大陆网络或所有设备已验证；正式站点应随项目打包选定依赖并提供静态入口。

## Logo 候选来源

**品牌手册 v0.1：**2026-10-08 用户确认字标后要求继续制作品牌手册。复用已确认白字透明 PNG、已选墙体参考与现有 SYSTEM 配色/字族/运动规则；光路、块体和应用画面为本轮文档图解，均标明示意，未作为新 Logo 或上线界面。PDF 中文使用本机微软雅黑、英文使用 Arial 的嵌入子集，不下载或分发字体源文件，也不改变网页的苹方优先栈。没有新增外部图库素材或生图调用；已有 The Wall 与展览参考的来源关系沿用。[手册入口与生成源](BRAND_MANUAL.md)。

**最新第七轮：**用户另附独立两行字标并要求精修为 Logo。[源附件](iterations/samples/u03-p01-2026-10-08-07/user-selected-wordmark.png)原样保存；内置 imagegen 两次编辑分别完成字形/间距/轮廓整理和透明底导出。输出黑底稿与白字透明 PNG，[完整提示词及实看证据](iterations/samples/u03-p01-2026-10-08-07/generation.json)。生成图仅复制，未程序化修改像素；透明度元数据只读检查，浏览器实看黑灰底与两个尺寸。沿用用户要求的 The Wall 字形来源关系，没有下载或分发字体文件；精修外观已获用户于 2026-10-08 确认（回复“欧克”），网站接入待完成。

**第六轮历史：**用户明确选定第五轮双侧脸图，附图作为主页 Logo 编辑目标，停止其他方向；随后指定字标两行为 `little stone` / `still here` 并模仿《迷墙》字形。源附件已原样保存为 [user-selected-base.png](iterations/samples/u03-p01-2026-10-08-06/user-selected-base.png)；字形参考沿用第五轮已登记的 The Wall 官方封面。内置 imagegen 分别编辑图形和生成字标，再输入两张中间稿合成并修正中央负形及小写 n，共三次调用。[当轮组合稿与提示词](iterations/samples/u03-p01-2026-10-08-06/generation.json)。只复制输出图像，未程序化重绘；process 中两份中间稿不作为当前成品。用户已选基础，最终轮廓及字标尚未确认；原作来源关系沿用，未上线。

**第五轮直接二创历史：**用户明确要求使用 Pink Floyd 相关设计作为基础，内置 imagegen 每款输入一张已查看的官方原图。五份原图保存于第五轮 references，五份输出与提示词见[生成记录](iterations/samples/u03-p01-2026-10-08-05/generation.json)。只复制图片，未用程序重绘。以下官方艺术参考不等于已取得网站公开使用许可，也不把二创标记为与原作无关的原创图形；当前均为未采用的设计候选。

| 第五轮 ID | 官方出处 | 直接改造范围 |
| --- | --- | --- |
| `logo-ai05-prism` | [The Dark Side of the Moon](https://www.pinkfloyd.com/albums/the-dark-side-of-the-moon/)；页内封面图，署名 HIPGNOSIS、GEORGE HARDIE | 三角棱镜和光路改为圆端单色轮廓，彩色光谱缩为三条线 |
| `logo-ai05-handshake` | [Wish You Were Here](https://www.pinkfloyd.com/albums/wish-you-were-here/)；页内 album-inner-1 唱片标签，署名 HIPGNOSIS、GEORGE HARDIE | 机械握手保留对角关系，去掉唱片、四象限景物、材质和机械细节 |
| `logo-ai05-lssh-wall` | [The Wall](https://www.pinkfloyd.com/albums/the-wall/)；页内封面图，署名概念 ROGER WATERS、实现 GERALD SCARFE | 将封面的手写字形语言重构为 LSSH，不采用墙背景 |
| `logo-ai05-two-faces` | [The Division Bell](https://www.pinkfloyd.com/albums/the-division-bell/)；页内封面图 | 保留双侧脸合读为正脸，去掉金属、铆钉、景物，重绘为平面轮廓 |
| `logo-ai05-echoes-window` | [Echoes: The Best of Pink Floyd](https://www.pinkfloyd.com/albums/echoes-the-best-of-pink-floyd/)；页内封面图 | 提取重复窗框与视线纵深，去掉人物、道具与摄影背景 |

取图及查看日期：2026-10-08。上表为设计参考与改造登记，图像输出只是 PNG 候选，未替换网站素材或完成小尺寸验收。

01 单款最新修订为 `logo-ai04-presence-trace`，用内置 imagegen 新生成两次，第一次缺角方案由执行者弃用；当前正负 L 图稿及提示词见[第四轮](iterations/samples/u03-p01-2026-10-08-04/generation.json)。无外部图像输入，仅复制生成 PNG，状态为候选。第三轮 01 已被用户否定，其他四款仍未选择。

最新状态：前两轮均被用户否定。第三轮按用户要求只生成五版极简主 Logo，资源 ID 为 `logo-ai03-01` 至 `logo-ai03-05`。使用内置 image_gen.imagegen，五次独立新生成，无外部参考图输入；源稿与完整提示词保存于[第三轮文件](iterations/samples/u03-p01-2026-10-08-03/generation.json)。原图仅复制，未程序化重绘或转换；来源为本次 AI 输出，尚未正式采用。下面第二轮资源表保留为历史记录。

2026-10-08 用户要求五个版本供选择，随后否定第一轮外形，明确要求 AI 重做。当前产物见 [U03/P01 第二轮](iterations/u03-p01-2026-10-08-02.md)。沿用项目概念与颜色；由于现成通用图标不能表达专属身份，按用户要求用内置 imagegen 生成形体并定向修改。未将专辑封面或外部品牌图像作为生成输入。

| 资源 ID | 来源与使用范围 | 状态与条件 |
| --- | --- | --- |
| `logo-ai02-still` / `logo-ai02-echo` / `logo-ai02-refraction` / `logo-ai02-interval` / `logo-ai02-signature` | 内置 image_gen.imagegen；7 次新生成、3 次基于本轮生成图的编辑；当前五款位于 [第二轮 images](iterations/samples/u03-p01-2026-10-08-02/images)，提示词及生成来源见 [generation.json](iterations/samples/u03-p01-2026-10-08-02/generation.json) | AI 生成概念候选；2026-10-08；五份黑底 1254 × 1254 PNG，未做程序化裁切、调色或矢量描摹。未附第三方素材许可；来源类型为本次 AI 输出。尚未正式采用，未完成相似标识检索 |
| `logo-still` / `logo-echo` / `logo-through` / `logo-threshold` / `logo-lssh` | 第一轮几何与曲线路径；源 SVG 保存在第一轮 samples/marks | 用户否定，历史归档；不继续作为当前候选 |
| `logo-wordmark-instrument` | 本机 canvas-design 的 InstrumentSans-Regular.ttf；版权所有者为 Instrument Sans Project Authors，[字体项目](https://github.com/Instrument/instrument-sans) | 本轮复用现有文件，未联网下载；随附 [OFL 1.1](iterations/samples/u03-p01-2026-10-08-01/fonts/OFL.txt)，副本与提案同目录；仅作 Logo 英文组合及提案板字族，不改变学习区字体规则 |
| `logo-review-board` | 对照排版使用本机浏览器渲染为 PNG | 第一轮小尺寸与反白证据仅适用于旧稿。第二轮等尺寸显示五份原图、可放大与下载；黑底原图未被 CSS 反色。没有新增歌词引用 |

## 命名与歌词来源

2026-10-07：在原 Still Here 与英文分区命名基础上，用户最终确定唯一站名 Little Stone Still Here，简称 LSSH，不设中文站名；歌词提案沿用。下表用于核对文本与歌曲归属，歌词本身统一保存在[概念说明](CONCEPT.md#11-命名基线与歌词提案)，避免多处维护不同版本。尚未接入网站；歌词原文核对与选句审美确认分别记录。本站名称来自用户昵称和设计延伸，无新增歌词引用。

| 对应名称 | 歌曲与核对来源 | 选句关注点 |
| --- | --- | --- |
| 全站名称（见概念文案基线） | [Wish You Were Here — LyricsTranslate](https://lyricstranslate.com/en/Pink-Floyd-Wish-You-Were-Here-lyrics.html) | 对另一个人到来的期待 |
| Is There Anybody Out There? | [Hey You — Shazam](https://www.shazam.com/song/1065976163/hey-you) | 隔着距离试探是否能够被感知 |
| Becoming | [Breathe — LyricsTranslate](https://lyricstranslate.com/en/Pink-Floyd-Breathe-air-lyrics.html) | 自主选择自己的立足点 |
| Afterimage | [Comfortably Numb — Shazam](https://www.shazam.com/song/1065976170/comfortably-numb) | 曾经短暂看见而难以留住的东西 |
| Elsewhere | [High Hopes — Shazam](https://www.shazam.com/song/1065976907/high-hopes) | 当前视野之外的空间 |
| Echoes | [Echoes — Shazam](https://www.shazam.com/en-us/song/1065973623/echoes) | 陌生人之间偶然形成的联系 |
| Outside the Wall | [Outside the Wall — Musicnotes](https://www.musicnotes.com/sheetmusic/pink-floyd/outsidethe-wall/MN0045208) | 独自或结伴出现在墙外的人 |
| Someone | [Us and Them — Shazam](https://www.shazam.com/song/1065973709/us-and-them) | 把抽象身份还原为普通的人 |

创作背景另参考 Pink Floyd 官方的 [Wish You Were Here 专辑说明](https://www.pinkfloyd.com/albums/wish-you-were-here/)与 [The Wall 专辑说明](https://www.pinkfloyd.com/albums/the-wall/)。本轮只保存短摘句与出处，不收录整首歌词；选句的站内含义是项目自己的转译。

## 如何使用这份清单

### T09.03 文章阅读资源清单

2026-10-08：新增下载素材与依赖均为 0，复用现有组件、原生控件及用户指定的学习字体。正式文章、封面和上传图片在后续内容切片提供，本轮使用明确标注的功能验证样稿。

| 资源 ID | 来源与使用条件 | 用途与必要改造 |
| --- | --- | --- |
| `article-native-reading` | Starlight 0.42.5、starlight-blog 0.30.0、已安装 Expressive Code；版本及许可见[技术登记](../technical/REFERENCES.md#t01-工程采用记录2026-10-07) | 原生文章列表、标题、日期、标签、正文目录、代码及复制；中文 UI 使用框架原生翻译集合 |
| `article-native-search` | Starlight 内置 Pagefind；保持现有包与许可证 | 原生检索和弹层；仅补本标签页原词及结果焦点恢复，关闭或新输入取消待恢复焦点 |
| `article-return-link` | 浏览器原生链接、本站 K03 及 SYSTEM 既有目标/焦点变量 | 增加 K03-return 来源返回和学习总览入口；真实 href 兼容直接访问、无脚本与存储受限 |
| `reading-system-font` | 用户 2026-10-07 指定苹方，使用设备安装字族；无字体文件下载、复制或再分发 | 学习阅读字体栈按 SYSTEM 第 3 节；本机实际读回 `.PingFang SC` / `PingFang SC Medium`，其他设备回退未实测 |
| `article-validation-copy` | 本轮创建的中文功能验证文本，无外部文章摘录或个人经历声明 | 五个章节与代码片段，用于阅读操作；普通链接连接两条实际 PDF 条目，不声明学术引用或自动反向引用 |

上述资源已用于 [T09.03 局部样本](iterations/u09-p06-t09-03-2026-10-08-01.md)，执行者验证通过，用户体验待反馈。没有新增图标、照片、封面、材质或动画资源。

复用分为三种方式：直接配置现成组件；保留组件交互并改造外观；借鉴案例的组织与运动方法。每次引入都记录具体来源、版本或提交、许可、改动和验证结果。案例中没有明确开放的代码、图片、模型与音乐，仅作为设计参考。

P01 对 ALCHE 的要求更具体：按已观察的输入响应、轨迹、时间关系与状态反馈独立实现并对照验收；不是仅取抽象灵感。上述素材和代码来源规则仍适用。

候选比较、选图、控件与动画的验证步骤见[UI/UX 工作流](PLAN.md)；采用标准见[设计规范](SYSTEM.md)，场景用途见[概念施工说明](CONCEPT.md)。依赖边界与运行时约束见[技术方案](../technical/SPEC.md)，接入阶段见[技术实施计划](../technical/PLAN.md)。本表保留候选身份；后续采用时补上对应 U 任务、迭代记录和实际验证结果。

## T07.01 类型筛选设计资源

本节记录第 2 轮资源事实；用户后来否定视觉结果，当前外观改进以随后博客研究和最新迭代为准。

2026-10-07 / U09 第 2 轮：新增图片、图标、材质、字体下载、框架和运行依赖均为 0。样本复用现有实现与内容，仅补充局部状态样式和独立验证夹具；实际产物与验证见[本轮记录](iterations/u09-p03-t07-01-2026-10-07-02.md)。

| 资源 | 来源与可用条件 | 用法与最小改造 |
| --- | --- | --- |
| 单选组与类型筛选行为 | [项目已有 KnowledgeTypeFilter.astro（d958164）](https://github.com/0ne-small-stone/personal-homepage/blob/d958164/src/components/KnowledgeTypeFilter.astro)；本项目代码与浏览器原生 HTML 能力 | 保留 radio、label、fieldset、legend 和 type/历史行为；样本将既有行为转为无需构建的浏览器 JS，增加仅样本使用的空结果开关 |
| 设计变量 | [SYSTEM 5.1](SYSTEM.md#51-学习类型筛选-k01-与结果反馈-k02)，引用第 2–4 节已有颜色、字族、圆角 | 复制到样本验证；工程侧按相同语义变量接入，避免全局改动其他模块 |
| 字体 | 系统苹方优先及既定中文无衬线回退，来源见本文件字体表 | 无字体文件下载；本次浏览器实际使用微软雅黑，苹方环境待验证 |
| 类型与反馈文案 | 已有“全部／资料／文章／笔记”、类型与数量、空结果与脚本不可用提示 | 保留中文标签和整句状态反馈，不新增装饰文案或加载流程 |
| 内容 | 开发基线的文章、笔记、资料各一条，均明确标注“演示” | 固定列表顺序与标题/简介；空结果开关只临时排除样本中的笔记，不修改项目内容或原始 PDF |
| 浏览器验证工具 | 本机既有 Playwright 与 Chrome | 只用于设计验证，不加入网站依赖，不随页面加载 |

## P03 博客设计研究（2026-10-07）

选择依据：Maggie Appleton 的排版被 [The Simple Grid 的五站推荐](https://thesimplegrid.beehiiv.com/p/5-welldesigned-portfolio-websites-inspiration)明确评价；[Zacchary Puckeridge 的设计来源](https://zacchary.me/colophon)列出 Paco 与 Josh Comeau。它们是具体社区推荐与创作者引用，不能据此宣称获得某一设计奖项。本轮通过实际浏览器截图观察三站，并点击 Paco 和 Josh 的文章阅读路径。

| 原站与实际观察 | 适合 LSSH 的方法 | 本轮转译与边界 |
| --- | --- | --- |
| [Paco Writing](https://paco.me/writing)：年份、标题、日期形成稳定列关系；导航与边线很弱。进入第一篇文章后阅读栏继续保持克制 | 用一致对齐和间距组织密集索引，让内容标题主导视线 | 科目索引与条目主栏分开；数据量足够时用真实科目分组。不照搬年份，不编造发布日期，不复制其字体与代码 |
| [Maggie Appleton Garden](https://maggieappleton.com/garden)：明确的栏目身份、引言、主题/类型控制区与不同体量内容；本轮观察了已加载列表，未完成其筛选交互验证 | 多种知识内容共用一个清楚的栏目入口，过滤是阅读工具 | 使用 Becoming 与中文功能说明，类型控制融入工具栏。现有资料以文字为主，不仿造无来源封面或照搬其彩色插画与瀑布流 |
| [Josh W. Comeau](https://www.joshwcomeau.com/)及[实际进入的文章](https://www.joshwcomeau.com/css/anchor-positioning/)：标题、摘要、类别导航与正文目录各有明确层级 | 列表先让人理解文章主题，辅助信息保持次要；阅读路径连续 | 条目先呈现标题与简介，文件信息降低视觉优先级；原生搜索和真实详情去向保留。山形背景、课程营销区与彩色品牌表达不作为 LSSH 组件 |

三站均为设计参考；本轮没有取得整站资产/代码的复用授权，也不需要下载这些资产。本站复用对象仍是已有 Starlight、Pagefind、原生 radio 与真实知识条目，仅补局部布局适配。浏览器实际观察与本站改进判断分别记录。

## 2026-10-07 来源筛选结论

按用途选来源：**概念依据优先官方与原作者，网页行为优先原团队拆解与可审阅代码，实际环境材质优先 CC0 单项资源，个人展示优先真实自有内容。** 以下“优先”是本轮调研选择，并非用户已确认某张图或页面已采用。

**同日后续更新：用户已提供并选定墙体风格参考。** 记录 ID 为 `wall-user-stage-reference`，见[原样归档的附件](iterations/evidence/u02-p01-2026-10-07-01-user-reference.png)与[施工解读](SYSTEM.md#72-墙面的已选视觉方向)。来源为本轮用户上传图片（655×484 PNG），原作者与原图地址尚未反查；这里只归档为设计参考，不作为网页背景资产。该选择将旧化白砖降级，具体候选以下方更新后的材质表为准。

用户进一步指定整体风格“圆润、克制”。所有候选按 [SYSTEM 1.1](SYSTEM.md#11-圆润与克制的落地方式)筛选：优先柔和边缘、干净块面、安静背景和清楚层级；舞台与专辑参考的具体装置仍按本站功能取舍。

用户另指定《月之暗面》封面背景的纯黑与 Codex 的灰色作为主题配色依据。来源状态：纯黑为用户明确选择；本轮未取得 Codex 界面截图或实际灰值取样，灰度层级由设计侧先拟定，见 [SYSTEM 第 2 节](SYSTEM.md#2-颜色与明暗)。这些施工色值不代表原封面取样或 Codex 官方色板，后续样本记录中再校准具体灰值。

| 来源 | 优先级与用途 | 质量判断依据 | 获取与使用状态 |
| --- | --- | --- | --- |
| Pink Floyd 官方专辑与影像档案 | 概念研究首选；电台的原站观看入口候选 | 可核对创作归属、专辑上下文、官方版本；避免混入错误封面和无出处压缩图 | 页面内容已读；没有发现可将整套图片/音乐免费打包上线的授权。先参考或链接，具体展示/播放另核对 |
| STUFISH、Gerald Scarfe、STORMSTUDIOS | 空间、墙、手绘与超现实构图的原作者参考 | 有项目、作者与创作背景，而非仅按关键词汇集图片 | 主要作参考；出版物、印刷品或官网展示不自动包含网站背景使用权 |
| Codrops | 创意交互与效果实现首选研究库 | 同时提供主创说明、示例与部分代码，较容易追溯设计如何落地 | [可下载 demo 默认 MIT，除非另有说明](https://tympanus.net/codrops/licensing/)；文章、第三方案例、演示中的图片分别核对 |
| ambientCG | 白砖与基础 PBR 候选库 | 单项材质有贴图、尺寸、分辨率和明确许可，可进入同条件灯光比较 | [CC0](https://docs.ambientcg.com/license/)；PaintedBricks004 保留为低纹理处理后的候选，是否比标准哑光材质更合适须实测 |
| Poly Haven | PBR 对照、需要时的环境照明 | 多贴图与物理尺度，便于检查近景细节及受光 | [资产 CC0](https://polyhaven.com/license)，网站预览等其他内容许可不同；使用正式资产，不拿球体预览当墙图 |
| Unsplash | 少量氛围摄影的第一备选 | 可以追溯作者、单张作品及原始尺寸；由具体构图筛选，不按站点名直接通过 | 使用[普通许可](https://unsplash.com/license)对应条目；Unsplash+ 单独核对。不是本站个人作品来源 |
| Pexels | 氛围视频/摄影备选 | 免费获取与修改路径清楚；仅在静态素材无法表达必要过程时选择视频 | [许可](https://www.pexels.com/license/)可用但有使用条件；没有选定视频，不默认首页视频背景 |
| Behance 的作者项目页 | 二创研究、过程图与潜在作者合作 | 可看同一作品的设计过程与作者；优先完整项目，降低只凭缩略图判断的风险 | 下列项目只进入参考名单；没有核实单项复用授权，不直接取图上线 |
| Adobe Stock 等付费库 | 免费候选有具体缺口时再比较 | 可按单项授权、尺寸和编辑需求选购 | 已查[许可入口](https://stock.adobe.com/license-terms)，未选商品、未购买，不作为当前低成本默认 |

Pinterest、壁纸聚合站、搬运账号只可作为找原作者的线索；最终登记回原始发布页。Awwwards 本轮抓取超时；Godly 地址重定向至 recent.design 且抓取失败，不作为本轮已核实的可复用库。

### Pink Floyd 官方与原作者：具体研究对象

下列“转译”是本项目的设计判断，不是乐队对个人主页的定义。

| 记录 ID / 具体来源 | 本轮核对的依据 | 拟转译到本站的内容 | 当前边界 |
| --- | --- | --- | --- |
| `pf-dark-side`：[The Dark Side of the Moon](https://www.pinkfloyd.com/albums/the-dark-side-of-the-moon/) | 官方专辑页和制作资料 | 从少量形体建立强识别；光线负责指示目的地与变化来源，棱镜保持可操作的中心锚点 | 概念参考；不下载原封面作全屏背景 |
| `pf-wish`：[Wish You Were Here](https://www.pinkfloyd.com/albums/wish-you-were-here/) | 官方把图像及黑色外包装与“缺席”联系起来，列出 Hipgnosis、George Hardie | 用空处、被遮住的空间和缓慢显现表达“人不在，痕迹仍在”；内容由操作揭示 | 创作背景已核对，图片复用权未取得 |
| `pf-wall`：[The Wall](https://www.pinkfloyd.com/albums/the-wall/) | 官方说明砖与经历、隔离及和解的关系 | 同一墙从远处障碍变成近处可读表面；他人的声音让墙拥有新的含义 | 本站是自己的延伸；温柔留痕不直接照搬专辑的暴力画面 |
| `pf-echoes`：[Meddle](https://www.pinkfloyd.com/albums/meddle/) 与 [Echoes 精选集](https://www.pinkfloyd.com/albums/echoes-the-best-of-pink-floyd/) | 分别核对歌曲所在专辑和同名精选集，避免混淆 | 电台围绕听见、回应与距离；精选集包装和歌曲情绪作为不同参考分别登记 | 不推断用户所说 Echoes 只指其中一种；不影响既定电台命名 |
| `pf-films`：[官方影像库](https://www.pinkfloyd.com/films/) | 列有 Echoes – Part 1 – MCMLXXII、P.U.L.S.E.、WYWH 微电影及周年动画 | 下一轮优先观察空场、远近景和音乐段落之间的关系；先选择一段对应一种动作 | 已核对条目，未完整播放和实测嵌入；不得直接截取当循环背景 |
| `pf-stufish`：[Their Mortal Remains](https://stufish.com/project/the-pink-floyd-exhibition-their-mortal-remains-presented-by-london-s-v-a/) | 主创说明以实物、声音、设备和艺术串联乐队经历，与 Aubrey Powell 和 V&A 合作 | 展示空间由内容塑造；照片、项目过程与个人资料可以在同一叙事中深入阅读 | 优先空间参考；展览图片未取得再利用授权。舞台 The Wall/Division Bell 另见[项目索引](https://stufish.com/projects/)，索引不算完整案例验证 |
| `pf-scarfe`：[Gerald Scarfe 的 Pink Floyd 作品](https://geraldscarfe.com/product-category/pink-floyd/)及[创作经历](https://geraldscarfe.com/about/) | 原作者介绍其专辑、舞台与电影工作；可追踪印刷品与原作 | 研究一套图形语言怎样跨媒介保持一致，尤其轮廓与场景之间的关系 | 部分内容情绪较尖锐，不作为本站默认美术；购买画作也不等于获得网页使用许可 |
| `pf-storm`：[STORMSTUDIOS](https://stormstudiosdesign.com/) | 原工作室列出专辑、海报与图形设计入口，并链接 Storm 档案 | 超现实情境中的比例、留白和叙事矛盾，用于研究作品封面的概念性 | 主站入口已核对；链接的 stormthorgersonarchive.com 本轮超时，暂不指定其中单张图 |

### 二创筛选

优先保留能查到作者和创作过程的项目；“获奖”与“适合本站”仍分别判断。

| 候选 | 选择或降级理由 | 用法与核验状态 |
| --- | --- | --- |
| `fan-brain-damage`：Rati Dabrundashvili / Nastassja Nikitina 的 Brain Damage 周年动画 | [Syd Barrett 官方站](https://www.sydbarrett.com/winner-of-pink-floyds-50th-anniversary-animation-contest-inspired-by-syd-barrett/)明确列出作者和获奖信息，并介绍移动绘画式表现；Pink Floyd 影像库也收录获奖条目 | 二创研究优先项。可研究材质如何维持连续运动，但本轮未播放全片，不能说已通过“温柔”情绪筛选；不提取镜头上线 |
| `fan-allport`：[Stephen Allport — Iconic Poster Series](https://www.behance.net/gallery/15809275/Iconic-Poster-Series-The-Dark-Side-of-the-Moon?locale=en_US) | 作者展示从原封面、黑胶与月相到海报的过程，可分析信息和形体组织；同时带有较强符号拼合 | 次级平面参考。只保留构图研究价值，不采用其整体拼贴作为本站主题；图片预览未成功获取，未取得复用许可 |
| `fan-ladd`：[Declan Ladd — The Dark Side of the Moon Re-design](https://www.behance.net/gallery/143815005/Pink-Floyd-The-Dark-Side-of-the-Moon-RE-DESIGN) | 作者说明重设计重点是保留标志性色彩和形状；与用户希望深入概念的目标覆盖有限 | 暂不优先。保留出处供对照，不为凑二创数量选用 |

二创进入正式素材候选时补：原作者可用许可、其所用第三方内容、可修改范围、所需源文件、实际大小与同场景样本。未确认的作品可以继续作为外部参考链接。

### 网页设计研究的优先顺序

1. 下文已登记的 Unseen 与主创拆解：研究空间承担真实导航、场景进出与内容阅读。
2. [Yichen Xie 的个人站拆解](https://tympanus.net/codrops/2026/10/06/yichen-xie-portfolio/)：主创解释固定锚点、小幅运动、访客可改变构图，以及始终可达的导航。本站研究这些关系；不照搬气泡主题。文档已读，未实时操作。
3. [ULTRAGRID 的空间作品集拆解](https://tympanus.net/codrops/2026/09/30/ultragrid-portfolio/)：作为物件承载个人作品的备选研究；先评估素材和运行成本，不引入整个 Spline/Blender 工作流。
4. Codrops 首页新列出的 [Interlude / Astro 转场](https://tympanus.net/codrops/2026/10/07/interlude-astro-page-transitions/)仅记为待查线索，正文抓取失败。未核对代码与 Starlight 兼容性，不能替代现有 Astro 原生转场方案。

## 本轮实际核验边界

调研日期：2026-10-07。已读取上述可访问来源的文本、资产描述与许可；没有把搜索排序、作者名或获奖自动当作最终美术通过。浏览器预览工具两次启动失败；未取得新的现场截图或动效体验证据。U02 下一步仍需要实际材质样本比较。外站在工具中可读取也不代表中国大陆访客的访问质量已验证。

## 页面和体验参考

英文命名及歌词摘句见[命名与歌词来源](#命名与歌词来源)，正文文案统一在概念说明维护。

| 来源 | 已核对的内容 | 本项目的转译 | 复用方式和边界 |
| --- | --- | --- | --- |
| [Unseen](https://unseen.co/) 与[团队案例拆解](https://tympanus.net/codrops/2026/07/20/the-craft-behind-memorable-digital-experiences-inside-unseen-studio/) | 团队介绍 CLOU 的三维作品环，通过规模、类别、状态等组织作品；Hubtown 将故事引入项目地图 | 空间入口对应真实内容分组；展示页的探索方式与筛选读取同一组作品 | 借鉴空间承担导航的方式；不预设取得其代码与素材授权。依据团队文字，未完成本轮实时动效实测 |
| [Of the Oak](https://oftheoak.co.uk/) 与[项目说明](https://oftheoak.co.uk/information/) | 同一主题容纳感性体验、物种探索和信息阅读 | 首页感受空间，学习区查阅知识；两种使用方式共享内容关系 | 借鉴叙事和查阅并存的组织方式；树、生态素材与本项目无直接复用关系 |
| [David Whyte Experience](https://immersive-g.com/projects/david-whyte-experience/) | 制作团队以动态水彩和声景表现诗人的经历 | 光、墙、声音分别拥有一致的运动规则 | 借鉴材质与表达的一致性；本项目的具体动作由自身功能推导 |
| [Sculpting Harmony](https://gehry.getty.edu/) 与[主创说明](https://www.commarts.com/project/36291/sculpting-harmony) | 建筑档案、草图和模型进入有主线、可深入探索的叙事 | 项目详情保留过程、依据、结果；读者可从总览直接深入某个章节 | 借鉴项目叙事结构，使用自己的项目材料 |
| [Quartz 反向引用](https://quartz.jzhao.xyz/features/backlinks) | 反向引用使读者找到指向当前页面的内容 | 知识详情提供引用与被引用入口，支持连续阅读 | 借鉴知识关系的呈现；现有 Astro 路线优先使用 Starlight 插件 |
| [WebStack](https://github.com/WebStackPage/WebStackPage.github.io) | 官方仓库提供静态响应式网址导航；[代码许可](https://raw.githubusercontent.com/WebStackPage/WebStackPage.github.io/master/LICENSE)为 MIT | 常用网站采用分类导航、紧凑链接条目和一句用途说明 | 可按许可改造所需结构与样式；依赖兼容性和附带图标、截图分别核对 |

## 组件与效果候选

下表的“优先”表示实施顺序。每个模块先验证一个最合适的方案，只有明确缺口时再比较备选。

| 需求 | 优先来源 | 保留的能力 | 改造范围和待验证项 |
| --- | --- | --- | --- |
| 知识阅读与导航 | [Starlight](https://starlight.astro.build/zh-cn/)、[样式定制](https://starlight.astro.build/guides/css-and-tailwind/)、[组件扩展](https://starlight.astro.build/guides/overriding-components/) | 阅读结构、导航、目录、搜索入口等原生能力 | 用颜色、字体、间距和少量组件扩展接入全站视觉；配置不足时才替换局部组件 |
| 博客列表 | [starlight-blog](https://github.com/HiDeoo/starlight-blog) | 文章列表、标签与分页等能力 | 接入统一学习入口；与资料、笔记交叉引用的覆盖需验证 |
| PDF 阅读 | [PDF.js](https://github.com/mozilla/pdf.js) | 已有阅读器及其翻页、缩放、文本搜索等能力 | 外层补资源信息、来路与关联笔记。扫描 PDF 的文本能力需单独验证 |
| 照片展开 | [PhotoSwipe](https://photoswipe.com/)、[接入说明](https://photoswipe.com/getting-started/) | 缩略图展开、缩放、触摸浏览与响应式图片 | MIT；改工具栏与说明样式。照片 URL、历史记录及关闭后恢复位置由站点适配；不假定图库自带完整路由 |
| 音乐播放 | [APlayer](https://github.com/DIYgod/APlayer) | HTML5 音频、列表、歌词等已有能力 | MIT；验证中文标签、键盘操作、移动端与 Astro 切页持久化。音乐来源与网易云写入属于独立能力 |
| 留言 | [Giscus](https://giscus.app/zh-CN) | GitHub 身份、提交、回复与讨论读取 | 配置原生主题；砖墙展示读取公开讨论快照的方案需另行适配。外部 iframe 的内部布局按组件实际能力处理 |
| 对话框和展开层 | [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) | 焦点管理、Esc 关闭、标题与辅助说明等交互 | 仅在框架原生组件不足且需要 React 交互时引入，定制外观；许可和版本在选定包时记录 |
| 棱镜材质 | [Drei MeshTransmissionMaterial](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material) | 现成透射材质及可配置参数 | 首先验证它与简洁三棱柱、墙体的组合。光路引导和受光蒙版需要场景编排；不能把透射材质当作完整光学模拟 |
| 棱镜效果备选 | [React Bits Prism](https://reactbits.dev/backgrounds/prism)、[已读源码](https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Backgrounds/Prism/Prism.jsx) | 参数化辉光、色彩与运动效果 | 源码使用 OGL，形体函数为棱锥效果；需要先比较其造型与三棱镜目标的差距。适合作为效果候选，不是现成的首页导航场景 |
| 光线效果 | [React Bits Light Rays](https://reactbits.dev/backgrounds/light-rays)、[源码](https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Backgrounds/LightRays/LightRays.jsx) | 可研究的光束效果组件 | 验证光源定位、四个入口落点、深浅背景、生命周期和性能。避免为每束光各放一个独立渲染器 |
| 空间滚轮输入 | [GSAP Observer](https://gsap.com/docs/v3/Plugins/Observer/) | 对滚轮、触摸等输入的现成处理 | 仅在选中棱镜的空间状态启用；项目补距离、到达、取消和恢复的状态逻辑。采用版本的许可另行记录 |
| 路由转场 | [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/) | 现有路由转场及生命周期机制 | 统一配置共享元素与返回行为；与 Starlight、图库、播放器逐项验证 |
| 图标 | [Lucide](https://lucide.dev/license) | 成套常用界面图标 | 统一尺寸与笔画。官方列 ISC 及部分源自 Feather 的 MIT 声明，应随采用包保留 |

React Bits 当前许可为 [MIT 加 Commons Clause](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md)，允许作为网站或产品的一部分使用，同时对组件本身的销售、转授权和再分发设有限制。记录采用时的完整许可，避免把它简写为普通 MIT。

首页的首选验证路线是“成熟材质与输入组件＋一个共享场景”；若更轻的现成效果组件能够满足同样的方向、层次和交互要求，可采用其改造方案。比较时看实际改造量、画面结果和手机表现，不以安装组件数量作为进度。

## 素材来源与采用方式

| 素材用途 | 优先来源 | 已知条件 | 本项目的处理 |
| --- | --- | --- | --- |
| 干净块体基线 `wall-matte-blocks` | 现有场景库的标准哑光材质与基础长方体/砖墙几何；具体组件和许可采用时登记 | 用户参考图更依赖块体、接缝和受光；无需先加载细碎表面纹理。属于成熟基础能力的组合候选，尚未指定组件或实现 | U02 优先建立无表面噪声的样本，验证复用基础能力是否已覆盖外观；不预先自研材质引擎或 shader |
| 白砖材质备选 `wall-painted-004` | [ambientCG Painted Bricks 004](https://ambientcg.com/view?id=PaintedBricks004) | 官方标签 White、Smooth、Painted，约 1.55m 方形覆盖，提供 1K–8K 多贴图；[资产许可](https://docs.ambientcg.com/license/)为 CC0 | 同尺度下与干净块体比较，仅在需要时加入弱表面细节；原包与网页传输量分别记录，不默认使用全部通道 |
| 已降级 `wall-whitewashed` | [Poly Haven Whitewashed Brick](https://polyhaven.com/a/whitewashed_brick) | Charlotte Baglioni；官方描述包含旧化、掉漆及露出的红棕砖，覆盖宽 2m；[资产许可](https://polyhaven.com/license)为 CC0 | 用户新参考强调平整与低纹理，旧化特征偏离方向，退出首轮正向候选。保留记录供追溯 |
| 表面细节备选 `surface-white-plaster` | [Poly Haven White Plaster 02](https://polyhaven.com/a/white_plaster_02) | 白色灰泥单项资产，CC0；不是现成砖墙 | 仅在砖材均过于粗糙时，评估复用细腻表面并由简单砖块几何承担接缝的最小改造；需先记录材质比较结果 |
| 已降级 `wall-painted-001` | [ambientCG Painted Bricks 001](https://ambientcg.com/view?id=PaintedBricks001) | 本轮复核发现官方标签为 Blue；之前记成白砖首选不准确 | 撤销白墙首选身份。若使用须另做有理由的颜色改造；当前有更直接的 004 候选 |
| 环境光与模型 | [Poly Haven](https://polyhaven.com/) | HDRI、纹理与模型有现成资源；网站其他内容和资产许可范围需区分 | 只有场景确实需要时选择具体资源。使用资产原文件，不把网站示例渲染图默认为本站素材 |
| 个人照片和作品封面 | 用户已有原图、项目截图、B站与小红书作品资料 | 尚未提供正式展示清单 | 优先选择真实作品；生成适配封面、焦点裁切与缩略图，保留原图 |
| 氛围图片与暂用图 | [Unsplash](https://unsplash.com/license) 中对应普通许可的资源 | 官方普通许可允许多种使用；另有 Unsplash+ 条款，具体素材需对应核对 | 适用于背景氛围或标明性质的占位内容。记录作者和页面，不能被标为用户摄影或项目成果 |
| 学习区字体（用户指定） | 苹方 PingFang SC；[Apple 系统字体清单](https://developer.apple.com/fonts/system-fonts/) | 2026-10-07 已核对官方清单中的 Regular、Medium、Semibold 等字重；按设备本机字体调用，未取得可随站分发的字体文件 | 学习资源、文章与笔记的常规网页文字统一采用；具体字体栈与回退见 SYSTEM 第 3 节，实际渲染待验证 |
| 其他区域中文展示标题候选 | [思源宋体](https://github.com/adobe-fonts/source-han-serif) | 已核对官方仓库的 [SIL OFL 1.1](https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/LICENSE.txt)；具体字体文件与版本采用时记录 | 仅保留为学习区以外的少量展示标题候选，学习区按用户要求使用苹方；按需评估网页字体体积 |
| 操作图标 | [Lucide](https://lucide.dev/license) | 许可见组件清单 | 复用常用图标，平台品牌标记采用平台可用资源 |
| 音乐与封面 | 实际可用的网易云链接、展示或播放渠道 | 展示、播放、歌单写入需要分别验证 | 保存歌曲标识与来源；根据可用能力提供站内播放或原站入口 |
| 环境音和交互音 | 已有且允许使用的录音或音效库条目 | 尚未选定单项资源 | 保持可选、默认静音。选择时记录具体文件与许可；先检查其必要性，再决定二创或原创 |

专辑封面、演出影像与歌曲作为音乐展示素材时，分别记录可用来源与使用方式。背景墙和光效优先使用许可明确的材质与代码，将 Pink Floyd 的概念落实到观看和交流的过程里。

上表外部贴图尚未下载，分辨率、尺度和表面描述来自资产页，不能代替贴图实测。用户新参考已改变 U02 的比较顺序：先验证 `wall-matte-blocks`，再判断是否需要 `wall-painted-004` 的弱表面细节；旧化材质不再作为同优先级方案。参考截图的归档不代表已获得可直接上线的墙面素材。

## P01 光中显影参考与方向稿

2026-10-09先制作了加载/首屏写实光空间研究，随后被用户明确否决。当前参考优先级改为：本站当前抽象黑场→ALCHE的光线/网格图层关系→现有Three/Drei工具。复用原字标、三角构造、SceneBackdrop及玻璃专用环境；RisingWall继续只用于终章。具体分片见[33轮](iterations/u03-p01-2026-10-09-33.md)。

| ID / 状态 | 来源 | 具体用途与边界 |
| --- | --- | --- |
| P01-HALO-REF-01 / 历史研究，不作本轮风格目标 | [Guggenheim James Turrell展览](https://web.guggenheim.org/exhibitions/turrell/)、[LACMA Afrum (White)](https://collections.lacma.org/object/140816?classification=Conceptual+Art) | 初步研究光与空间体积，后续写实转译被用户否决。未下载照片、未取得图片复用授权；Guggenheim完整页面打开超时，不冒称已逐图研究 |
| P01-LOADER-REF-02 / 时间线参考 | [Anime.js Timeline官方文档](https://animejs.com/documentation/timeline/) | 已读文档的label/add/sync组织方式，用于显影、就绪、揭幕的分段；按六资源站规则已提醒用户。实现继续现有GSAP，不为此安装第二套动画引擎 |
| P01-HALO-ART-01 / 用户已否决，不采用 | 本站本轮首屏截图＋内置ImageGen；[原稿与说明](iterations/samples/u03-p01-2026-10-09-32/README.md) | 写实展厅、墙脚和地面违背用户希望保留的现代抽象表达；只留历史，禁止作为施工图或生产素材，未接入应用 |
| P01-EDGE-REF-03 / 当前构图参考 | [ALCHE首页](https://alche.studio/)，已有17轮连续证据，本轮应用内浏览器查看首屏 | 借鉴弧形网格、片状光域和玻璃折射的图层关系；本站沿用中性黑灰、大砖格及原曲线，局部稀疏化。仅参考机制，不下载/复用原站视觉资产或将其许可视作已授权 |

## 素材登记字段

### T13.01 单篇草稿编辑资源清单

P17 / AD01 / U13 使用 [Pages CMS 官方托管后台](https://app.pagescms.org/)及其 [原生文件、字段配置](https://pagescms.org/docs/configuration/content/)；源码 MIT，官方仓库 `hunvreus/pagescms` 校验提交 `6f4e860a35d934406580287e7042e5e111e207a1`。托管版登录和 App 授权仍待真实验证，源码许可不代替托管服务条款。

正文复用[原生 Markdown 富文本及 Source 切换](https://pagescms.org/docs/configuration/fields/rich-text/)，只配置中文标签与当前草稿流程；不复制第三方后台视觉、字体或图标。资源为 `.pages.yml` 和测试草稿，新增图像/字体/图标文件为 0。字段配置校验通过，真实编辑状态与用户体验待验，见[U13 记录](iterations/u13-p17-t13-01-2026-10-08-01.md)。

2026-10-07 T08.01 已采用 [Mozilla PDF.js 官方 generic viewer](https://mozilla.github.io/pdf.js/getting_started/)，版本 6.4.299、Apache-2.0；保留附带图标、字体、CMap 与语言文件及版权声明。来源附件、SHA-256、排除文件和改造范围见 [工程资源登记](../../public/pdfjs/README.md)。仅适配工具栏主题、焦点、减少动画和手机换行；未新增插图或自研渲染引擎。本地 PDF 来自完整原件的校验副本，外部笔记保留作者并直接跳转，不转载。实际接入见 [U09 阅读迭代](iterations/u09-p05-t08-01-2026-10-07-01.md)。

### P13-RADIO-REF-01 · 原生播放与真实清单

2026-10-11已采用：既有HomeLayout、黑灰语义色、苹方正文和IBM Plex Sans展示标题；复用浏览器原生audio控件（真实HTTPS音频接通时）与[网易云指定歌单的官方iframe](https://music.163.com/outchain/player?type=0&id=18476425375&auto=0&height=430)。候选APlayer未引入，本片不需要歌词或另一套播放器状态；仅补模式、目录和窄屏适配。歌单封面、曲目与声音由外部播放器按原服务规则呈现，未作为本站媒体下载/上传；本地曲目采用文字首字占位，不伪造专辑图或用户作品。真实18首FLAC的标签来自已下载文件，音频不进入仓库。

主技能frontend-design按TOOLKIT使用，沿用当前概念与规范，不建立第二套品牌。六资源站中Uiverse最适合后续播放器控件的交互样本研究，本轮已提醒并评估；现有分段按钮和原生控件足够，未复制其组件代码或新增动画依赖。页面执行者读图、实际播放启动和窄屏检查见[首片交付](iterations/u12-p13-2026-10-11-01.md)，用户审美与真机性能另记。

### P13-RADIO-REF-02 · 播放器 UI 参考候选

2026-10-11，用户要求先看优秀音乐播放器 UI。沿用 frontend-design 主技能，仅研究与比较，不修改应用页面。已读取原作者或官方来源并实际查看界面图：

| 候选与来源 | 可参考的部分 | 本轮状态 |
| --- | --- | --- |
| [YesPlayMusic](https://github.com/qier222/YesPlayMusic) | 暗色专辑网格、收藏列表、固定底部播放栏 | 已查看 README 的 library-dark.png；优先布局候选 |
| [Plexamp](https://apps.apple.com/us/app/plexamp/id1500797510) | 大封面、封面色氛围、波形进度与少量控制 | 已查看开发者商店的播放页与专辑页截图；优先播放页候选，官网直接读取异常 |
| [Dopamine](https://github.com/digimezzo/dopamine) | 艺人、专辑、曲目三栏及紧凑播放栏 | 已查看原仓库 Dopamine.screenshot.1.png |
| [Apple Music](https://www.apple.com/apple-music/) | 专辑封面、主操作、留白和手机内容层级 | 已查看官网专辑详情展示图，不将该图误称为正在播放页 |
| [Roon](https://roon.app/en/music) | 艺人、流派、音乐背景和收藏关联 | 已查看官网产品合成图；界面信息参考，不把宣传合成图当独立原始截图 |
| [Poolsuite](https://poolsuite.net/) | 复古窗口、频道切换和个人电台身份 | 临时无登录浏览器实际打开并截取未播放状态；视频区显示静态噪声，未验证媒体播放 |

比较板为独立本地 HTML，包含来源、放大查看与适配判断，未作为本站页面或资产提交。参考候选不等于用户采用；本轮未复制代码、图片或商标进应用。截图与音乐封面权利独立于开源代码许可，实际采用时另核对。建议以 YesPlayMusic 的音乐库结构配合 Plexamp 的专注播放布局，并压低封面氛围色以沿用本站黑灰规范。

### P13-RADIO-REF-03 · 网易云第三方播放器界面比较

2026-10-11，用户继续寻找更好看的网易云第三方播放器。实际读取原作者仓库与界面图，候选为 [SPlayer 旧版](https://github.com/SPlayer-Dev/SPlayer)、[Alger Music Player](https://github.com/algerkong/AlgerMusicPlayer)、[HyPlayer](https://github.com/HyPlayer/HyPlayer) 和 [VutronMusic](https://github.com/stark81/VutronMusic)。临时本地比较板分别提供音乐库/歌单与播放/歌词页，实际读图后优先建议 SPlayer 的宽松沉浸歌词布局与 Alger 的丰富浏览布局；HyPlayer 提供深灰克制方向，Vutron 提供侧栏与多音源结构。未选定或接入应用。

来源与版本边界：SPlayer 使用 master 分支的旧版网易云截图，仓库已归档；[SPlayer-Next](https://github.com/SPlayer-Dev/SPlayer-Next) 的当前官方介绍以本地与流媒体音乐为主，不将其直接宣称为已验证的网易云客户端。Alger 使用 main/docs/image3.png、image6.png；官网预览读取超时，未声称在线体验已通过。HyPlayer 使用 master/PREVIEW.md 的 SongList.png、ExpandedPlayer.png，预览明确标明截图版本 2.1.15.0。Vutron 使用 main/images/localMusic.jpg、play-page.jpg，当前网易云等平台经插件系统接入。

比较板图片实际加载、图片放大、Escape 关闭、390px 无横向溢出通过；原作者静态图只支持视觉比较，不代表已验证动态歌词、第三方授权或音乐播放。继续区分截图、封面和代码的使用条件，本轮不复制其应用代码或媒体进本站。

### P13-RADIO-REF-04 · 黑胶、磁带与沉浸器物界面

2026-10-11，用户继续寻找沉浸、简约、复古风格，举例黑胶专辑与磁带机。主技能继续 frontend-design，仅比较候选，不把方向询问视为实施批准。已读官方来源并实际查看图片：

| 候选与官方来源 | 视觉判断与接入边界 |
| --- | --- |
| [MP95](https://mp95.app/) | 优先视觉候选。黑胶与烟黑磁带两个播放页，以器物为主、留白和控件较少。官方介绍为本地音乐播放器，不宣称已接网易云；本轮仅核对官网展示图，未核验其音频规格 |
| [CloudPlatter](https://github.com/Chengyunlai/cloud-platter) | 胡桃木全屏唱机桌面、圆形封面和少量控制；Mac 网易云伴随桌面层，读取系统 Now Playing，不独立提供曲库或网页登录。作者明确处于原型阶段，兼容性验证范围有限。已查看 docs/images/cloud-platter-desktop.jpg；不把项目徽章当产品界面 |
| [Marquee Vinyl](https://marquee.fm/features/vinyl-player/) | 圆润唱机面板、唱臂与现代播放控件，Apple Music 第三方播放器；官方标明该外观属于 Pro，并需 Apple Music 订阅。已看官网 vinyl-player.png |
| [Catsette](https://catsette.com/) | 奶油机身、实体按钮和琥珀色文字；更有器物趣味，控件密度高于 MP95。iPhone 本地 MP3 播放器，未验证网易云接入。已看 cassette_tabby.png |
| [MD Vinyl](https://apps.apple.com/us/app/md-vinyl-music-app/id1606306441) | 唱片、唱臂与专辑包装的拟物呈现；已看开发者商店宣传图，不能当作纯界面截屏。平台音源能力另行核验，未验证网易云接入 |
| [Casse-o-player](https://play.google.com/store/apps/details?id=com.hornwerk.compactcassetteplayer&hl=en) | 已看官方商店磁带/VU 表头展示图；传统器材细节丰富，作为拟物细节备选，简约程度低于 MP95；未加入本轮优先参考板 |

独立本地比较板包含 5 个产品、6 个画面（MP95 两种外观），最终 6 张图片实际加载并读图；放大、Escape 关闭、390px 无横向溢出通过。未安装或登录以上应用、未验证真实动态或声音。本次建议优先黑灰背景中的大黑胶与少量播放键，磁带可作为另一视觉皮肤；音源模式与外观选择分开，不能用复古外观代替考拉、网易云接入验收。仅为建议，尚未成为用户确认的 P13 设计决定。图片与专辑封面不进应用，代码和媒体许可分别核对。

### P13-RADIO-REF-05 · CloudPlatter 相近唱机场景

2026-10-11，用户进一步询问类似 CloudPlatter 的播放器。沿用 P13/U12 的参考研究范围，未改变音源方案或正式选择界面。主技能继续 frontend-design。本轮实际查看以下图像：

| 候选与官方来源 | 画面与能力边界 |
| --- | --- |
| [Vinyl for Mac](https://www.vinylformac.com/) | 官方 After Hours 场景：木桌上的唱机、封套、唱片与暖灯；官网还列 Listening Room、Turntable 场景。视觉上最接近 CloudPlatter 的实体唱机方向。macOS 产品，官方标明 Spotify / Apple Music；未宣称支持网易云 |
| [Vinyl Wallpaper](https://rawmean.github.io/vinyl-wallpaper/) | 官方 hero.png：黑色唱机、封套、唱臂、VU 表头和独立顶部播放层；多种外观。macOS 产品，官网列 Spotify / WiiM / Apple Music / AirPlay；未宣称支持网易云 |
| [Vinyl Vue 网页体验](https://vinyl-vue.ventuss.xyz/) / [原作者仓库](https://github.com/Ventuss-OvO/Vinyl-Vue) | 本轮实际网页截图：深灰背景、封套、大黑胶、金属唱臂和少量控制，页面实际可达；曲库采用自有音频文件及对象存储配置，未接网易云。适合作为本站网页的构图与专辑浏览候选，代码与素材许可仍需在采用前分别核对 |

独立比较板以 CloudPlatter 作者截图为基准，最终四张图加载并读图；放大、Escape 关闭、390px 无横向溢出通过。Vinyl Wallpaper 原 screenshots/turntable-wallpaper.png 在浏览器未加载，已改为官网当前 hero.png；Vinyl for Mac 第二次场景按钮定位超时，最终使用已由官方来源定位的 After Hours 图，不把场景交互记为通过。Codrops RecordPlayer 的公开示例在自动浏览器遇到安全验证，本轮未列为优先推荐。

建议视觉上比较 Vinyl for Mac，网页上先体验 Vinyl Vue；仅为执行者建议，尚无用户正式选用。未安装应用、登录服务或验证音频播放；比较图未接入应用素材。本轮只追加来源记录，不修改 P13 应用或首页源码。

### P13-RADIO-REF-06 · Vinyl Vue 相近网页参考

2026-10-11，用户继续寻找与 Vinyl Vue 相近的界面，收窄为大黑胶、唱臂、专辑封套与少量控件的网页案例。主技能继续 frontend-design，仅补充来源候选：

| 官方来源 | 样本与边界 |
| --- | --- |
| [Codrops Interactive Record Player](https://tympanus.net/codrops/2016/06/15/interactive-record-player/) / [源码](https://github.com/codrops/RecordPlayer) | 2016 年历史实验，专辑网格→单张专辑→大黑胶与唱臂播放页；Vinyl Vue 作者明确列为参考。已实际看官方 InteractiveRecordPlayer_3.jpg；当前 Demo 在自动浏览器遇到安全验证，不能把历史截图当成本轮可播放验收 |
| [Audio Sleeve 预览](https://sleeve-audioplayer.framer.website/) / [作者 Framer 页面](https://www.framer.com/marketplace/components/audio-sleeve/) | 实际网页可达并查看悬停后的封套与黑胶。黑胶从封套滑出，偏小型专辑播放组件；属于付费 Framer 组件，官方标单次使用许可，未购买或采用。首次悬停唱片被封套遮挡，改为实际封套元素后截取画面；未点击播放或验证音频 |
| [Vinyl Simulator](https://vinyl.riyo.me/) / [作者介绍](https://apps.riyo.me/vinyl-simulator) | 实际三维唱机场景可达：防尘罩、唱臂、滑杆与本地音频入口。比 Vinyl Vue 更偏机器模拟，作为三维器物交互候选；作者说明本地解码，本轮未导入个人文件或验证音频 |
| [Matthew Blode Album](https://blode.co/experiments/album) | 实际查看圆形封面唱片到方形封面的轻量实验；没有完整唱臂播放器，作为专辑展开动效备选，不列为前三款完整唱机场景 |

前三项整理为独立界面对照，三张图最终加载并读图。Record Room 仍停留在房间纹理加载，FTR 实际画面偏常规专辑/曲目界面，本輪不列为优先相似推荐。MD Vinyl 仍沿用 REF-04；Vinyl Vue 作者明确列其为灵感来源，但不因此新增网易云能力声明。全部为研究候选，未修改应用、采用资产或确认最终设计；网页可达、静帧查看与声音/动态验证分别记录。

### P13-RADIO-REF-07 · Codrops 相近的专辑到唱机流程

2026-10-12，用户继续询问与 Codrops Record Player 相近的案例。维持 P13/U12 来源研究，未选择新实现或变更音源。主技能继续 frontend-design。

| 官方来源 | 实际证据与筛选 |
| --- | --- |
| [Vinyls 官方展示](https://pixelfolio.app/press/vinyls/) | 实际查看官方 Mac dark 与 iPad portrait 展示图：曲库/专辑封套在左，大唱片和唱臂在右，曲库信息较 Codrops 密集；优先参考其播放区。作者说明支持 iPhone/iPad/Mac，播放需 Apple Music 订阅，不能当作网易云播放器或可嵌入网页组件 |
| [Side One 作者仓库](https://github.com/mintdotgg/bookshelf) | 实际读取 README，流程为唱片柜浏览→抽出封套→检查专辑/选曲→唱片移至唱机→唱臂落下，适合作为完整器物流程候选。当前只找到仓库入口，未定位公开 Demo、安装、运行或做视觉验收；源码公开不等于许可已核验，未正式采用 |
| [Retro Music Player](https://store.steampowered.com/app/4505200/Retro_Music_Player/) | 实际看作者 Steam 宣传图，偏早期电脑窗口与颗粒复古外观；截至本轮页面标 Coming soon，暂不列为可立即体验的优先候选。宣传图不当作原始纯 UI 截图，也不当作实际播放证据 |

Chris Gannon 的 SoundCloud Vinyl Search CodePen 入口在自动浏览器遇到安全验证，未作可体验推荐。Vinyl Vue 仍沿用 REF-05/06，避免将已给过的案例冒充新增。推荐比较 Vinyls 播放区与 Side One 的专辑选取流程；以上是执行者建议，未获用户正式选用，不修改应用源码。图像与交互描述分别说明证据来源，未验证音频、第三方接入或大陆访问质量。

2026-10-12 后续：用户要求实际验证 Side One，固定 `c9b28f89` 在独立忽略目录运行成功。原目录 7 专辑/9 唱片/7 封面实载；桌面、390px/减少动画及键盘/返回 11 项 UI 核对通过，45 秒自生成测试 WAV 的 7 项音频补验通过。首轮悬停索引定位失败及第二轮即时忙碌状态断言失败均保留，不能把原始批次改成全绿。源码未修改，未接入本站、账号或商业歌曲；根目录尚未找到主项目 LICENSE。执行记录：[Side One 候选验证](iterations/u12-p13-2026-10-12-side-one-validation.md)。当前为运行/交互候选验证完成，未正式采用。

### P13-RADIO-REF-08 · 更适合本站的黑胶候选筛选

2026-10-12，用户继续寻找更好、更适合的 Codrops/Side One 相近方案。范围仍为 P13/U12 参考研究；主技能继续 frontend-design，未改应用、安装候选或变更音源方案。

| 官方来源 | 实际证据与适配判断 |
| --- | --- |
| [GlassMusicPlayer](https://github.com/XiangZi7/GlassMusicPlayer) / [网页体验](https://topm.pages.dev/) | 新增中优先参考其网易云功能与黑胶播放区。实际网页外壳、中文导航及本地音乐入口可达，曲库区仍为加载占位，未验证在线音乐播放。官方桌面 image-77.png 与手机 images/mobile/image-1.jpg 完整解码并实际读图：桌面大黑胶、直唱臂、歌词与彩色玻璃背景；手机图为曲库界面。更偏现代，若用于本站需减去彩色背景与频谱、沿用黑灰规范。作者说明使用另配的网易云 API；根 LICENSE 为 PolyForm-Noncommercial-1.0.0，不能记为 MIT 或无条件复用 |
| [CompScout Vinyl Player](https://compscout.dev/comps/vinyl-player) / [公开组件源码](https://compscout.dev/r/vinyl-player.json) | 实际预览可达，深色预览与封套点击后的唱片展开已截取。React 小组件，无唱臂，更适合专辑卡片。源码仅通过 isPlaying 控制 CSS 转动、setInterval 模拟进度，没有 audio/AudioContext 或音源参数；不能作为已实现的播放器。若采用需接真实媒体状态并补键盘语义；未核验组件许可，未运行安装命令 |
| [BINIX MUSIC](https://github.com/CMbin2333/BINIX_MUSIC) | README 声称本地音频与网易云、React 19 及黑胶唱臂；未找到可查看的官方界面图或公开 Demo，未运行。README 写 MIT，根目录未找到 LICENSE；只保留为技术候选，不宣称比现有方案更美观或可直接复用 |

[VirtualVinyl](https://github.com/ThatOtherAndrew/VirtualVinyl) 与 [Jockey](https://github.com/ThatOtherAndrew/Jockey) 的作者 GitHub Pages Demo 实际返回 404；mozarta-nexus/music-web-player 的 Demo 同样 404，本轮不列为可立即体验的优先候选。以上失败不推断源码无法运行。

执行者建议：完整网易云功能可比较 GlassMusicPlayer；专辑卡片可看 CompScout；符合本站沉浸、简约、黑灰方向的整体构图仍优先沿用 REF-05 的 Vinyl Vue。所有候选均未验证同时接入考拉与网易云，视觉、实际音频、第三方接入、手机真机与许可分别验收。官方截图仅用于比较，未进入网站资产。新增记录不代表用户选定或正式采用。

### P13-RADIO-REF-09 · 用户已选的双模式外观

2026-10-13 用户明确选择：网易云模式用 GlassMusicPlayer 的其余界面，专辑封面展示/播放采用 CompScout Vinyl Player；本地模式采用 Vinyl Vue。这是用户已确认的参考方向，替代 REF-08 的执行者排序；最终适配画面与真实功能分别验收。

| 来源与状态 | 实际采用范围、许可与改造 |
| --- | --- |
| [Vinyl Vue](https://github.com/Ventuss-OvO/Vinyl-Vue) / [LICENSE](https://github.com/Ventuss-OvO/Vinyl-Vue/blob/main/LICENSE) | 已核对 CC BY-NC 4.0，个人非商业站按许可复用 record.svg 与 Tone Arm.svg、封套/唱片构图及唱臂78.82%/20.28%旋转原点。唱臂从1,852,769B SVG转为300px宽34,130B WebP，唱片SVG22,901B保留；媒体/参数适配为 React。原例音效、音乐、专辑封面和字体未复制；真实封面取现有下载文件内嵌标签，只在本机开发页提供 |
| [GlassMusicPlayer](https://github.com/XiangZi7/GlassMusicPlayer) / [LICENSE](https://github.com/XiangZi7/GlassMusicPlayer/blob/main/LICENSE) | 已核对 PolyForm Noncommercial 1.0.0，Required Notice: Copyright Yxcr。采用深色侧栏、搜索、歌单/专辑区与手机重排的组织方式，按现有 Astro/React、黑灰参数适配，不搬入第二套 Vue 应用或其完整 API/登录流程 |
| [COMPScout Vinyl Player](https://compscout.dev/comps/vinyl-player) / [许可页](https://compscout.dev/policies/license) | 用户选择视觉，已核对原组件模拟进度、没有音频。许可页明确讨论 purchased templates/premium components，并限制源码公开分发；尚未找到免费注册表组件的独立许可。本轮独立实现封套/黑胶构图，不复制或分发其注册表源码，不安装 shadcn/Tailwind，不把公开可读当作许可授权；若后续要直接复制源码，需先确认适用许可 |

固定来源读取：Vinyl Vue `e70f8e97ddbbb9b225feeb988e75f4aeaa1aca8d`，GlassMusicPlayer `f19ae8ec4ed9b66e215cefdff63f46e1495cae6c`。统一随站署名与完整原许可位于 `public/music/attribution.txt`，不把第三方资产覆盖为本站通用许可。真实 Echoes 公开歌单元数据已读到1首（Pink Floyd《Echoes》）；它是有读取日期的目录快照，封面仍为网易云外链。当前该曲官方公开音频入口经浏览器实际解码/启动、暂停继续/进度与模式切换验证；并不证明其他曲目、账号付费权限、写入或自动同步。卡片旋转和进度绑定自有音频；官方 iframe 仅作失败时的独立入口，不读取或模拟其跨源播放状态。工程与实际证据见[本轮记录](iterations/u12-p13-2026-10-13-selected-skins.md)。

### P13-VINYL-DETAIL-01 · 唱片表面与落针适配

T25.09（2026-10-13）在上述固定Vinyl Vue来源上继续适配：现有tonearm.webp及原record.svg保留，唱针/枢轴按原图测量；新增record-surface.svg细沟槽和CSS固定方向反光，署名增加本轮改造范围。圆标复用当前MusicTrack.coverUrl（真实下载文件内嵌封面/现有平台封面），未复制原例封面、音效或字体。新表面与现有器物构图按原非商业来源一并登记，不将站内通用许可覆盖原素材；执行证据见[唱片细节](iterations/u12-p13-2026-10-13-vinyl-detail.md)。

### P13-APPLE-REF-01 · 音乐页层级与材质

2026-10-13用户要求根据苹果UI精修整体。实际阅读[Apple HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout)的渲染正文：用重要性、对齐与分组建立层级，渐进展开降低初始选择负担，布局适应窗口与文字尺寸；[Materials](https://developer.apple.com/design/human-interface-guidelines/materials)为材质参考入口。只借鉴界面原则，不复制Apple UI素材、品牌或字体；保留本站黑灰与已选择的播放器。Uiverse（既有resource-uiverse）在本轮提醒，用于控件状态比对，不登记为源码采用。实现/验收见[苹果参考精修](iterations/u12-p13-2026-10-13-apple-refinement.md)。

### P13-TRANSITION-REF-01 · 透明 CD 盒切换参考

2026-10-13 用户提供 [BzsJ：分享一个非常棒的音乐交互界面](https://www.xiaohongshu.com/explore/6acc9895000000000200f653)，随后明确仅用于音乐/专辑切换界面，保留现有黑胶播放页。实际公开浏览器观看29.867秒视频，并通过原生时间轴查看：约3秒盖沿左侧铰链打开；约6秒旧盒向上退出、新盒从下进入；8秒新专辑落定；27秒有半开盒盖与转视角。作者文字只作参考说明，不把其模型/引擎声明当作本站工程验证。

本轮参考动作与器物结构，不复制视频、光盘贴纸、字体或示例音频；暂未核验可复用的作者源码。本站复用已安装 React Three Fiber、Three MeshPhysicalMaterial、Drei RoundedBox/Environment/OrbitControls 与 GSAP，自行组合简单盒体/铰链/光盘的必要几何，封面使用现有真实标签/歌单信息。先前给出的考拉分享实际为音乐文件夹空列表，未当作动效样本；链接签名参数不保存到文档或应用。

Anime.js Timeline（六资源站 resource-animejs）已在本轮提醒，用于理解开盖/换盒时间线；实现沿用已有GSAP，不新增动画引擎。状态与证据见[本轮任务](iterations/u12-p13-2026-10-13-album-transition.md)，用户选择范围与实际效果验收分开记录。

### P01-HALO-REF-04 连续光晕的实现复用

2026-10-10，39轮用户否定侧视光片。候选与边界：

- **首选代码复用：**本地已安装Three0.186.1的[HorizontalBlurShader源码](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/HorizontalBlurShader.js)、[VerticalBlurShader源码](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/VerticalBlurShader.js)及FullScreenQuad。已从node_modules读取对应实际文件：两方向各9采样Gaussian，Three MIT许可沿用现有依赖声明。网页文档相应页面打开失败，以本地安装源码为版本依据；网络dev链接仅便于定位，不能替代锁文件。缺口是本站实际实体mask、光强门禁、捕获隔离和原合成链适配，仅补这些代码。
- **机制参考：**[Three官方UnrealBloomPass文档](https://threejs.org/docs/pages/UnrealBloomPass.html)已读取，多级不同半径模糊后加权合成，可用于控制近远扩散。完整Bloom/EffectComposer未采用，避免覆盖现有BlackFlowLayer及引入整场发光；技术是否采用任何完整类由实际提交确认。
- **不采用：**当前前后双Z平面扩展光带、简单调暗该光带、整个Canvas CSS blur；均不满足侧视连续光晕和文字/背景清晰度要求。无需新图片或生图素材。

首样视觉与状态见SYSTEM9.3.6和39轮。以上为已核对候选，不代表新管线已实现或用户认可。

39轮后续实际采用：Three已安装的HorizontalBlurShader、VerticalBlurShader、CopyShader与FullScreenQuad；少量适配实体mask、覆盖抗锯齿、原合成顺序和生命周期，未安装新库，也未采用UnrealBloomPass/EffectComposer。u1Yt8DKF执行者复核通过，参数与完整过程见SYSTEM9.3.6及39轮。

正式采用素材时，最少记录以下信息；候选阶段允许缺项，并明确标注尚未选用。

| 字段 | 内容 |
| --- | --- |
| 资源名称与用途 | 用在哪个页面、承担什么作用 |
| 稳定 ID 与状态 | 沿用本表 ID；参考 / 候选 / 样本已验证 / 已采用 / 已弃用分别记录；执行者判断与用户确认分开 |
| 原始来源与作者 | 单项资源页面、作者或发布者 |
| 许可与获取日期 | 许可链接、随文件附带的声明、记录日期 |
| 原始文件与派生文件 | 原始文件位置、网页版本位置和尺寸 |
| 改造记录 | 裁切、调色、降噪、压缩、模型简化及二创内容 |
| 展示说明 | 替代文本、图片说明、署名以及是否为演示素材 |
| 验证结果 | 黑底、白底、移动端和加载失败时的表现 |
| 文件交付信息 | 实际像素/物理尺度、格式、字节数、所需贴图通道、文件哈希与许可存档；不知道的字段写待核验 |

## 采用前的最小验证

1. 用真实或明确标注的代表性内容，确认组件能完成该页的主要任务。
2. 测试进入、返回、刷新、键盘和窄屏；检查与主框架的生命周期是否兼容。
3. 将颜色、字体、边界、焦点和动画节奏调整为全站规则，保留成熟的核心交互。
4. 记录无法覆盖的具体需求，再确定最小改造。只有现成候选确实不合适时，才二创或原创对应部分。

页面对比度验收参考 [W3C 普通文字对比度说明](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)。所有“已核对”仅指本文所列文档或源码信息；项目兼容性、目标设备性能、账号接入与大陆访问仍需实际验证。

## T13.02 正文图片验证资源

P17 / P06 / U13 / R13。仅需一张允许公开的 PNG/JPG/JPEG/WebP/AVIF、图片替代文本和图下说明。复用 Pages CMS 原生上传、媒体选择和 alt 编辑，Astro 原生尺寸处理；不需要新图标、字体、主题或裁切组件。

当前 [960×540 PNG 样本](../../src/assets/article-images/t13-02-image-check.png)是开发者用简单代码绘制的灰色块体和验证编号，17,954 字节。用途为图片路径/尺寸/排版验证，非正式文章或品牌素材，不使用用户账号截图、教材或第三方图片；无需外部授权，不为整仓库另设通用许可。真实网页上传尚未取得。[本轮实际截图与检查](iterations/u13-p17-t13-02-2026-10-08-01.md)。

## T07.03 标签与分页资源清单

P06/P03 / U09 / R10。复用已安装的 starlight-blog 0.30.0 原生标签、Posts 和 PrevNextLinks，作者 HiDeoo、MIT；已核对包内 LICENSE，版权声明保留于依赖。沿用现有学习区字体、颜色与焦点，不需新图片、图标、字体或设计稿。来源为[官方配置](https://starlight-blog-docs.vercel.app/configuration/)及包内组件，仅配置每页 5 篇和适配来源返回文案。

测试资源为开发者生成的 11 篇公开样稿和 1 篇测试草稿，只存在于本机隔离目录；每篇注明“仅本机样稿”，不复用第三方文章或实际个人经历。[可复现的样本生成器](../../tools/verification/blog-pagination-fixture.cjs)与[实际验收](iterations/u09-p06-t07-03-2026-10-08-01.md)保存范围，正式文章未新增。

## T09.01 普通关联资源清单

P05/P06 / K03 / U09 / R02、R09、R10。复用原生 HTML 链接与列表、现有 Starlight 阅读外壳和语义颜色；框架/插件许可沿用已核对的 MIT，依赖版权声明保留。只适配既有业务 ID 和区域排版，无需图片、图标、字体、封面或新素材。

当前功能文章声明正文已有的两个验证链接，不当作学术引用。三类型边界用一篇“仅本机样稿”笔记和一篇测试草稿；验收目录可选复制两份已校验的本机 PDF（6 页概率讲义、35 页算法笔记），副本只用于本机，不上传或新增许可声明。[样本生成器](../../tools/verification/related-links-fixture.cjs)、[实际证据](iterations/u09-p06-t09-01-2026-10-08-01.md)。

## T09.02 反向关联资源清单

P05/P06 / K03 / U09 / R02、R09、R10。复用 T09.01 的列表、Starlight 语义颜色、苹方优先字体和可见焦点；[Quartz 的反向列表](https://quartz.jzhao.xyz/features/backlinks)仅作体验参考，不复制插件。无需新增图片、图标、字体或动效资源，本轮没有触发六个设计资源的构图/新组件/动效需求。

测试资源为三种来源的明确标注样稿和两份测试草稿，仅在被忽略的本机目录；提供声明与移除同一关系的两份静态快照，不修改既有 44 个知识内容文件。两份已校验 PDF 副本仍只用于本机阅读。[生成器](../../tools/verification/backlinks-fixture.cjs)保存操作规则，实际验收见本轮迭代记录。

### P01-GEOMETRY-REF-40 · ALCHE 三角体比例测量

2026-10-10：用户指定复刻大小和比例。来源[ALCHE首页](https://alche.studio/)与其公开common/scene.glb；读取Alche_A geometry边界、前表面轮廓环和原站实例缩放/相机。原件只存Temp；本站使用现有Shape/ExtrudeGeometry重建规则三角环，原站模型、字母底部缺口和纹理不接入。尺寸/哈希/验证边界见[40轮任务](iterations/u03-p01-2026-10-10-40.md)，统一参数在SYSTEM9.3.7。

## 封面入射角测量（48轮）

[Pink Floyd官方专辑页](https://www.pinkfloyd.com/albums/the-dark-side-of-the-moon/)，复用已登记05轮1500px原图，不新增生产素材。97个白光中性像素中心线样本测得向右上14.2115394°、RMS .245px，方法与原始点见[48测量](iterations/evidence/u03-p01-2026-10-11-48/cover-measurement.json)。这是图像读数，不是原作者工程角度，官方艺术参考的许可状态保持。

### P13-RADIO-LAYOUT-01 · 播放器页面布局参考（2026-10-13）

用户要求寻找优秀播放器页面布局，范围为P13/U12参考研究，主技能frontend-design。本轮未改应用或改变已选音源/播放器外观。实际通过作者官方截图比较：

| 作者来源 | 实际查看的截图 | 布局与本站用途 |
| --- | --- | --- |
| [Cider](https://cider.sh/) | [官方专辑页](https://cider.sh/client/album.webp) | 左导航、中间专辑封面与曲目、右队列、底部播放条；适合较大曲库，队列可作为可选边栏参考 |
| [YesPlayMusic](https://github.com/qier222/YesPlayMusic) | [作者深色音乐库](https://raw.githubusercontent.com/qier222/YesPlayMusic/master/images/library-dark.png) | 顶部导航/搜索、收藏与最近歌曲、分类标签/专辑网格、底部播放条；适合封面浏览，易沿用本站黑灰与圆润控件 |
| [Feishin](https://github.com/jeffvli/feishin) | [development官方专注播放图](https://raw.githubusercontent.com/jeffvli/feishin/development/media/preview_full_screen_player.png) | 左侧大封面、右侧歌词/队列等标签、底部控制；可研究独立专注播放布局。最初读取main误落旧Sonixd README，已以仓库当前默认development和正确图修正 |
| [Vinyls](https://pixelfolio.app/press/vinyls/) | [作者Mac深色展示](https://pixelfolio.app/assets/images/press/vinyls/mac/04-dark.png) | 左导航、中间专辑/曲目、右侧大黑胶/进度/播放键；最接近本站器物感。此前已研究，当前只补充整体分栏比较，不冒称新案例 |

以上四图均在浏览器实际读取，Cider与Vinyls作为优先比较方向。静态截图不代表候选已运行、音源接入或播放能力验证；未安装候选、复制源码或素材进入应用，图片与代码许可在正式采用前独立核对。建议为左曲库/右唱机，曲库可参考YesPlayMusic封面网格；属于执行者建议，尚未获用户选用。

### P13-RADIO-LAYOUT-02 · 补充布局（2026-10-13）

用户继续寻找其他优秀播放器页面布局，仍为P13/U12参考研究，沿用frontend-design，无应用修改或选用确认。

| 作者来源 | 实际图像与用途 |
| --- | --- |
| [Tauon](https://tauonmusicbox.rocks/) | 实际查看官方[主窗口](https://tauonmusicbox.rocks/_astro/scr.C0AQBHoy_ZkxhJy.webp)和[封面墙](https://tauonmusicbox.rocks/_astro/cgal.Ghj_oXwz_IqToe.webp)：顶部少量标签，左曲目，右大封面/专辑网格，底部控制。适合减少页面导航负担；把右封面换成本站唱机为建议，未选用 |
| [Audirvana Studio](https://audirvana.com/audirvana-studio/) | 官方[桌面展示照片](https://audirvana.com/sitev8/wp-content/uploads/2025/12/Studio-01-1024x768.jpg)可见左导航、顶部分类、中央艺人网格和底部控制；克制的收藏库布局。图片是屏幕情境照片，不冒称纯界面截图。Interface.png实际为音频设置面板，未用它推断播放器布局 |
| [Eole foobar2000 theme](https://github.com/Ottodix/Eole-foobar-theme) | 实际查看作者[preview.png](https://raw.githubusercontent.com/Ottodix/Eole-foobar-theme/master/preview.png)：多个深浅色界面合成，含导航、封面网格、曲目表和右侧当前播放/队列；适合较大收藏库。它是foobar2000主题，不是独立网页播放器；未安装或复用源码 |

Moosync本次官网未定位完整界面，仓库Screenshots仍TODO，未作为有实际读图证据的优先案例。Plexamp/Roon等此前已登记，不把重复案例冒充新增。仅比较布局，不作平台接入或音乐播放验证；图像/代码授权正式采用另核对。

### P13-RADIO-LAYOUT-03 · 场景、海报与文字式电台（2026-10-13）

用户再次要求其他布局。沿用P13/U12/frontend-design参考研究，无应用改动。

- [lofi.cafe](https://www.lofi.cafe/)：实际打开并展开界面，整屏动态场景，左下角播放/音量等小控件，底部频道名，右上角辅助入口。使用播放按钮暂停后离开，未提交订阅/分享或登录。进入时有About提示层，关闭尝试未形成明确成功证据，截图按实际状态保留，不冒称完整交互验收。适合沉浸式电台的场景/控制层级。
- [Jazz FM Romania](https://jazzfm.ro/)：实际首页为黄黑海报式构图，左侧品牌/Now Playing信息，右半屏巨大的播放图形；未启动广播。作为极少操作和强主视觉的布局参考，不改变本站既定黑灰配色。Awwwards作为此前收藏的非传统布局研究入口已提醒。
- [Music for Programming](https://musicforprogramming.net/)：实际网页加载后跳转latest，左侧代码说明/ASCII播放控件，中间当期标题/曲目，右侧历期目录；初始截图为空，等待其他独立研究后实际读回完整界面。未点击音频源下载或启动混音。适合文字主导的复古终端式布局。
- [Supersonic](https://github.com/supersonic-app/supersonic)：旧作者URL自动转到新组织，按API读回当前main分支。实际查看[AlbumsView](https://raw.githubusercontent.com/supersonic-app/supersonic/main/res/screenshots/AlbumsView.png)：顶部工具/搜索筛选，中央专辑封面网格，底部控制；作为丰富曲库的实用布局。

本轮实际页面截图在当前任务可视化目录保存layout-lofi-cafe、layout-jazz-fm和layout-music-for-programming PNG；来源是网页现场截图，不是已获素材复用许可。Colibri官网图已读，但当前紫色样本未列为本站优先美术方向；Swinsian/vidify入口读取失败，不作已验证推荐。所有候选未安装、未接入音源或复制到应用。

### P13-RADIO-LAYOUT-04 · Apple Music 整体布局（2026-10-13）

用户询问Apple Music是否适合作为播放器布局参考。本轮区分实际Apple Music产品布局与此前T25.06通用Apple HIG/控件质感精修，仍为P13/U12研究，没有改变布局或已选黑胶播放器。

实际浏览[Apple Music网页版新发现](https://music.apple.com/cn/new)与当前公开[专辑详情](https://music.apple.com/cn/album/kick-off-the-wall-pt-1/6819069684)。桌面1280级窗口，左侧固定导航，中间滚动内容，底部浮动胶囊播放条；新发现包含横向推荐/曲目分组，专辑页为左大封面、右信息与主操作，下方歌曲表。未登录，截图包含订阅宣传栏；未点击试用、试听、登录或外部音乐应用。一次异步导航后重复旧标题定位无匹配，实际新页面随后读回成功，未记为应用故障。

[Apple官方音乐库指南](https://support.apple.com/guide/music-web/play-songs-from-your-library-apdm5cce24ab/web)验证按侧栏艺人/专辑/歌曲/歌单浏览；个人音乐库未登录不可实查。[Mac MiniPlayer官方指南](https://support.apple.com/en-ae/guide/music/mus71d7dcfce/mac)说明小窗、大封面、歌词/队列及全屏播放器状态；本轮没有运行Mac应用，不将Mac能力写成网页实测。网页浮动播放条位置以实际浏览器画面为准，不沿用旧版顶部播放器假设。

建议以Apple Music作整体布局参考：稳定侧栏/音乐库与专辑详情、常驻小播放条，点击当前唱片再进入单独黑胶播放视图。该建议未获用户采用，未新建页面/任务、复制Apple素材/字体/品牌或调整音源。实际截图保存为本任务可视化目录layout-apple-music-browse与layout-apple-music-album PNG。

### P13-RADIO-LAYOUT-05 · 网易云官方客户端布局（2026-10-13）

用户继续询问网易云音乐布局，范围保持P13/U12参考研究。网易云官网实页被当前浏览工具站点安全策略拒绝，没有通过其他浏览器、代理或命令绕过；改用不同公开来源的[网易云官方Mac App Store展示](https://apps.apple.com/cn/app/%E7%BD%91%E6%98%93%E4%BA%91%E9%9F%B3%E4%B9%90/id944848654?mt=12)，发布者为杭州网易云音乐科技有限公司。商店文字与四张图片已实际读取；图片为作者宣传合成图，不是本机运行截图，也不代表Windows客户端或网页版已验证。

- [推荐页图](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/a7/b4/25/a7b42514-78c0-7d01-650a-24111005d7df/01.png/1286x804bb.webp)：左导航/音乐库，顶部搜索，中间推荐封面网格，底部常驻播放条。
- [曲目列表图](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/b6/a8/f9/b6a8f9c3-28f8-ccd3-01d7-04330e0132e7/02.png/1286x804bb.webp)：侧栏保持，中央曲目/专辑/喜欢/时长列，底部缩略唱片与控制。可参考日常选歌信息层级。
- [黑胶播放图](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/4a/64/66/4a64664b-1a78-0eda-2c45-633a0bb53c10/03.png/1286x804bb.webp)：左大唱片和唱臂，右标题/歌词，底部进度及控制，顶部返回。与本站既有黑胶方向较接近，作为独立沉浸播放状态参考。
- [音质宣传图](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/aa/23/8c/aa238ce2-dd65-da2f-e3cd-0754ec9dde20/04.png/1286x804bb.webp)：居中唱片与环绕声宣传叠层，不据此声称本轮验证音质、空间音频或会员功能。

建议比较网易云的曲库/曲目层级与独立黑胶播放页，沿用本站黑灰与克制控件；Apple Music整体壳与网易云沉浸播放组合仍是执行者建议，尚未获用户选用。本轮未安装客户端、登录、播放、复制图片到应用或修改应用源码；静态宣传图不能验收展开动画、歌词同步或音源接入。

同日后续用户明确选用P13-RADIO-LAYOUT-04/05的信息层级组合，要求黑灰简约并保留现有专辑与唱片机。T25.07已实际适配侧栏/专辑详情/小播放条和独立黑胶视图，复用本站组件与真实封面；未复制官方代码、图片、字体或品牌。实际实现/失败与执行者读图见[曲库与黑胶页记录](iterations/u12-p13-2026-10-13-library-listening.md)；方向选择与成品审美确认分开记录。

### P13-LYRICS-REF-08 · Apple原则与歌词精修（2026-10-13）

用户要求右侧真实歌词、移除CD选择层、按Apple感觉精修；现有黑灰、唱片机和曲库专辑保持。实际浏览[Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout)、[Typography](https://developer.apple.com/design/human-interface-guidelines/typography)、[Materials](https://developer.apple.com/design/human-interface-guidelines/materials)：落实分组/对齐、字重层级和控件/内容材质区分；不下载SF或品牌图像，不声称CSS实现原生Liquid Glass。字体继续沿用项目栈，Apple原则作为本站适配依据。

[Apple同步歌词说明](https://support.apple.com/en-ie/108960)作为时间轴与普通全文/缺失的状态参考。本地歌词来自用户洛雪下载目录18份同名LRC，按原文件读取；网易云可选补充复用[LRCLIB官方匿名接口](https://lrclib.net/docs)，实际读回同专辑/时长的Echoes记录并在页面验证Eclipse时间轴。外部歌词不在仓库硬编码，只通过公开接口运行时读取；不复制歌词服务代码或使用账号凭证。接口公开访问不等于本轮核验所有音乐版权或平台播放权限。实际来源/边界与读图见[T25.08](iterations/u12-p13-2026-10-13-lyrics-polish.md)。

## 博客 UI/UX 补充调研（2026-10-14）

用户要求调研优秀博客项目的 UI/UX。本轮覆盖 P03/P06/P15、U09/U13/U14，沿用 R02/R09/R10/R12 与 T05/T07/T09/T10/T26/T27；不恢复 P04/P07。结论、观察与设计判断见[研究报告](iterations/u09-blog-uiux-research-2026-10-14.md)，8 张原图和已验证操作见[证据](iterations/evidence/u09-blog-uiux-research-2026-10-14/README.md)。以下均为研究参考或代码候选，尚未正式采用。

| 来源 ID | 官方体验与来源 | 本轮参考用途 | 使用条件及状态 |
| --- | --- | --- | --- |
| BLOG26-01 | [AstroPaper](https://astro-paper.pages.dev/) / [源码](https://github.com/satnaing/astro-paper) | 摘要列表、文章目录 | 官方仓库标注 MIT；代码复用待选，演示照片与字体另核对 |
| BLOG26-02 | [Astro Cactus](https://astro-cactus.chriswilliams.dev/) / [源码](https://github.com/chrismwilliams/astro-theme-cactus) | 紧凑索引、手机重排和 Pagefind 结果 | 官方仓库标注 MIT；实际菜单及搜索结果已查看，完整旅程另验 |
| BLOG26-03 | [Fuwari](https://fuwari.vercel.app/) / [源码](https://github.com/saicaca/fuwari) | 圆角分组与列表间距 | 官方仓库标注 MIT；演示插画的使用条件独立，不下载作为本站素材 |
| BLOG26-04 | [Josh 长文](https://www.joshwcomeau.com/css/anchor-positioning/) | 长文分节、目录和示例节奏 | 仅设计观察；未取得整站代码/字体/插画复用授权 |
| BLOG26-05 | [Maggie 花园](https://maggieappleton.com/garden) / [状态说明](https://maggieappleton.com/epistemic-disclosure) | 内容类型、成长阶段与可信程度说明 | 仅结构研究，筛选行为本轮未验证；状态字段待选 |
| BLOG26-06 | [Quartz](https://quartz.jzhao.xyz/) / [反向引用](https://quartz.jzhao.xyz/plugins/backlinks) / [源码](https://github.com/jackyzha0/quartz) | 真实反向引用与空状态 | 官方主仓库标注 MIT；这里只参考机制，不引入生成器或关系图；独立插件许可需按实际文件核对 |

[Awwwards 博客目录](https://www.awwwards.com/websites/blogs/)用于案例发现，已按六个设计资源站提醒规则向用户提示；不把类别收录、社区推荐或项目自报分数等同于设计获奖及本轮验证。验收依据补充[W3C 重排](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)和[目标尺寸最低要求](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)，项目参数仍唯一维护在 SYSTEM。

## Becoming 博客第二轮调研（2026-10-14）

用户否决第一轮作为主设计方向，反馈视觉个性、阅读/布局及与首页艺术氛围三项均不满意。BLOG26-01–06 保留历史功能参考，不视为已选。第二轮在 P03/P06/P15、U09/U13/U14 范围研究构图、内容节奏与普通阅读方式，详见[候选报告](iterations/u09-blog-uiux-directions-2026-10-14.md)和[实际证据](iterations/evidence/u09-blog-directions-2026-10-14/README.md)。以下来源只作参考，尚未正式采用。

| 来源 ID | 官方体验页 | 参考用途 | 实际范围与使用条件 |
| --- | --- | --- | --- |
| BLOG26-07 | [Are.na Editorial](https://www.are.na/editorial) / [文章](https://www.are.na/editorial/alice-yuan-zhang-on-building-things-into-being) | 黑色创作档案、图像与文字的层级、来源上下文 | 实际列表进入文章、返回位置与390px文章；原站图片/字体/正文/代码未接入本站，许可另核对 |
| BLOG26-08 | [Emergence 长文](https://emergencemagazine.org/essay/new-life-for-the-ezo-spruce/) | 图像开篇、标题与正文节奏 | 实际关闭首次订阅浮层、滚动至正文；未提交订阅，原图像与字体不因参考而获授权 |
| BLOG26-09 | [Andy working notes](https://notes.andymatuschak.org/) | 引用在原文旁打开、保留上下文 | 一次实际引用打开；手机完整返回/退出未验。作者入口声明是研究环境，未作为可直接使用的系统公开；不复制代码或恢复图谱 |
| BLOG26-10 | [Rauno 交互设计长文](https://rauno.me/craft/interaction-design) | 安静阅读区与媒体示例、章节定位 | 桌面文章和一次章节跳转；手机、全量例子未验，代码/资产未复用 |
| BLOG26-11 | [Maxime 的视觉技术长文](https://blog.maximeheckel.com/posts/on-rendering-the-sky-sunsets-and-planets/) / [博客](https://blog.maximeheckel.com/) | 内容相关图解及可体验例子 | 首屏、结构与Index返回首页；不把Index误写为正文目录，全部图形例子和Ask未测、未采用 |

本轮的视觉判断与实际运行范围分开；黑灰、苹方、圆润克制的项目基线继续生效。后续若选用构图、素材或交互，先做一个明确样本，再分别记录许可、工程接入与用户确认。当前没有取得整站复制或资产复用授权，没有下载原站素材作为本站运行资源。

## P01 入射接缝反馈证据（2026-10-12）

> 历史研究与需求证据；当前首页运行范围以56玻璃/柔晕及F02为准，不据此恢复光谱或流体。

`p01-entry-seam-51`：用户本对话上传的本站入射交界裁图，原像素复制到[51用户原图](iterations/evidence/u03-p01-2026-10-12-51/user-entry-seam.png)，用于需求定位与前后验收；未调色/重画，不作为页面展示素材。用户否定接缝自然性，覆盖此前50执行者/设计允许保留，不记为用户已确认。设计任务[51](iterations/u03-p01-2026-10-12-51.md)。


## Becoming 总览选定参考（2026-10-14）

用户选定[Framer Developers](https://www.framer.com/developers/)的侧栏与内容布局、[shadcn文档](https://ui.shadcn.com/docs)的灰色圆角选中，范围只到P03首片。采用设计规律，不复制原站图像/字体/代码，不引入第二主题或依赖；本站参数由SYSTEM5.2.1管理，实施与实际验收见[本片](iterations/u09-p03-2026-10-14-framer-overview.md)。参考方向获用户选择，不等于本站实现或外观验收通过。
