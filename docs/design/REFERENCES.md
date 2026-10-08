# 个人主页设计复用与素材来源

文档对应（2026-10-07 整理）：本文件为设计侧 `REFERENCES.md`，对应[技术调研与候选方案](../technical/REFERENCES.md)。本文维护体验参考、素材许可与改造范围，技术侧维护依赖能力和运行条件；职责与任务映射见[文档对应表](../README.md)。

更新日期：2026-10-07。本文为[整体页面与交互设计](SPEC.md)提供可追溯的设计参考、组件候选和素材来源。未列实际采用及验证记录的代码、素材仍为候选，不能视为已接入项目或正式页面。

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

候选比较、选图、控件与动画的验证步骤见[UI/UX 工作流](PLAN.md)；采用标准见[设计规范](SYSTEM.md)，场景用途见[概念施工说明](CONCEPT.md)。依赖边界与运行时约束见[技术方案](../technical/SPEC.md)，接入阶段见[技术实施计划](../technical/PLAN.md)。本表保留候选身份；后续采用时补上对应 U 任务、迭代记录和实际验证结果。

## 页面和体验参考

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
| 白砖墙基础材质 | [ambientCG Painted Bricks 001](https://ambientcg.com/view?id=PaintedBricks001) | 具体资源页已核对；[官方资产许可](https://docs.ambientcg.com/license/)为 CC0 | 第一候选；先试铺砖尺度、砖缝和正面可读性，再决定调色、裁切与贴图简化 |
| 白砖墙对照材质 | [Poly Haven Whitewashed Brick](https://polyhaven.com/a/whitewashed_brick) | 具体资源页已核对；[资产许可](https://polyhaven.com/license)为 CC0 | 与第一候选用相同灯光对比；以干净、温柔、低干扰为选择依据 |
| 环境光与模型 | [Poly Haven](https://polyhaven.com/) | HDRI、纹理与模型有现成资源；网站其他内容和资产许可范围需区分 | 只有场景确实需要时选择具体资源。使用资产原文件，不把网站示例渲染图默认为本站素材 |
| 个人照片和作品封面 | 用户已有原图、项目截图、B站与小红书作品资料 | 尚未提供正式展示清单 | 优先选择真实作品；生成适配封面、焦点裁切与缩略图，保留原图 |
| 氛围图片与暂用图 | [Unsplash](https://unsplash.com/license) 中对应普通许可的资源 | 官方普通许可允许多种使用；另有 Unsplash+ 条款，具体素材需对应核对 | 适用于背景氛围或标明性质的占位内容。记录作者和页面，不能被标为用户摄影或项目成果 |
| 中文标题字体 | [思源宋体](https://github.com/adobe-fonts/source-han-serif) | 已定位官方仓库；具体字体包与许可随采用版本核对 | 优先为少量标题选择合适字重；正文先复用可靠的系统字体栈，按需评估网页字体体积 |
| 操作图标 | [Lucide](https://lucide.dev/license) | 许可见组件清单 | 复用常用图标，平台品牌标记采用平台可用资源 |
| 音乐与封面 | 实际可用的网易云链接、展示或播放渠道 | 展示、播放、歌单写入需要分别验证 | 保存歌曲标识与来源；根据可用能力提供站内播放或原站入口 |
| 环境音和交互音 | 已有且允许使用的录音或音效库条目 | 尚未选定单项资源 | 保持可选、默认静音。选择时记录具体文件与许可；先检查其必要性，再决定二创或原创 |

专辑封面、演出影像与歌曲作为音乐展示素材时，分别记录可用来源与使用方式。背景墙和光效优先使用许可明确的材质与代码，将 Pink Floyd 的概念落实到观看和交流的过程里。

## 素材登记字段

2026-10-07 T08.01 已采用 [Mozilla PDF.js 官方 generic viewer](https://mozilla.github.io/pdf.js/getting_started/)，版本 6.4.299、Apache-2.0；保留附带图标、字体、CMap 与语言文件及版权声明。来源附件、SHA-256、排除文件和改造范围见 [工程资源登记](../../public/pdfjs/README.md)。仅适配工具栏主题、焦点、减少动画和手机换行；未新增插图或自研渲染引擎。本地 PDF 来自完整原件的校验副本，外部笔记保留作者并直接跳转，不转载。实际接入见 [U09 阅读迭代](iterations/u09-p05-t08-01-2026-10-07-01.md)。

正式采用素材时，最少记录以下信息；候选阶段允许缺项，并明确标注尚未选用。

| 字段 | 内容 |
| --- | --- |
| 资源名称与用途 | 用在哪个页面、承担什么作用 |
| 原始来源与作者 | 单项资源页面、作者或发布者 |
| 许可与获取日期 | 许可链接、随文件附带的声明、记录日期 |
| 原始文件与派生文件 | 原始文件位置、网页版本位置和尺寸 |
| 改造记录 | 裁切、调色、降噪、压缩、模型简化及二创内容 |
| 展示说明 | 替代文本、图片说明、署名以及是否为演示素材 |
| 验证结果 | 黑底、白底、移动端和加载失败时的表现 |

## 采用前的最小验证

1. 用真实或明确标注的代表性内容，确认组件能完成该页的主要任务。
2. 测试进入、返回、刷新、键盘和窄屏；检查与主框架的生命周期是否兼容。
3. 将颜色、字体、边界、焦点和动画节奏调整为全站规则，保留成熟的核心交互。
4. 记录无法覆盖的具体需求，再确定最小改造。只有现成候选确实不合适时，才二创或原创对应部分。

页面对比度验收参考 [W3C 普通文字对比度说明](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)。所有“已核对”仅指本文所列文档或源码信息；项目兼容性、目标设备性能、账号接入与大陆访问仍需实际验证。
