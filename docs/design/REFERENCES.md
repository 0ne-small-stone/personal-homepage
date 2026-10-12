# 个人主页设计复用与素材来源

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
