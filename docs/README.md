# 文档导航与设计 / 技术对应表

2026-10-15 最新功能整合验收：保留主站e953b96（含首页性能、双语Someone及撤除重复标题），接入Becoming列表/文章与PDF续读，以及P13核心音乐/分类播客/手动刷新。公网无音乐后台时保留共享歌单快照、账号不可用反馈和内网音源说明；服务可用时延迟加载新版。文章/PDF进度仅同源本机浏览器，不保证跨设备。正式发布、实际测试与边界统一见[本轮验收](technical/acceptance/latest-release-2026-10-15.md)。墙AF01、Someone局部流体和首页F04仍属独立候选/待办，本轮未接入，也不启动F06/F07。旧日期状态为历史。

2026-10-15 首页性能主站验收：BNuf11DH冻结源接入含正式双语Someone的main，148文件0错误/0警告、54页构建与限定交互通过；桌面/窄屏轮播10秒、稳定白墙6秒零新增场景/renderer帧，首次输入唤醒正常。保留F03、F05、三卡及小砖，不启动F06/F07；发布入口[PR #59](https://github.com/0ne-small-stone/personal-homepage/pull/59)，最终Pages与公网结果按真实SHA补录。[本轮验收](technical/acceptance/home-performance-2026-10-15.md)。下方旧版本状态为过程追溯。

P02 / R01、R12 / U13、U14 / T02、T05、T16、T26–T27：Someone无照片双语版已由PR #58发布，正式入口和公网证据见[发布记录](technical/iterations/t05-p02-2026-10-15-pages.md)。

P02 / R01、R12 / U13、U14 / T02、T05、T16、T26–T27：用户已确认当前无照片 Someone 双语候选并授权主站发布，英文 about／中文 zh/about、语言图标和邮件复制按[发布记录](technical/iterations/t05-p02-2026-10-15-pages.md)接入。

2026-10-14 最终集成：本轮发布入口为[PR #54](https://github.com/0ne-small-stone/personal-homepage/pull/54)，通过保护检查合并main后由Pages部署；最终SHA、Actions和公网回读在PR补记。本地最终工程141文件0错误/0警告、8条沿用相册的提示，53页构建与186项风险测试通过。发布期间同步保留main `5eac344` 的正式相册、36张授权WebP派生及目录契约；桌面/390px首页进入相册与原生后退4/4通过。首页加载/人物/音乐的既有验收边界保持，迷墙仍是独立原型，用户审美与真机性能另记。以下同日准备状态为过程快照。

P10 / R06、R12 / U10、U14 / T12、T15、T16、T26、T27：[A Moment Remains正式接入与Pages发布](technical/iterations/t12-p10-2026-10-14-pages.md)。用户确认v17并授权当前相册及36张压缩派生公开，沿用/gallery/，未新增页面/任务编号；PR #53与Pages成功，入口[A Moment Remains](https://0ne-small-stone.github.io/personal-homepage/gallery/)，公网功能已核对。

2026-10-14 新增验收入口：[当前集成候选的工程、交互与发布边界](technical/acceptance/updates-2026-10-14.md)。沿用P01/P02/P03/P05/P06/P13/P14/P15/P17及原U/T编号；本地工程/首页定向与音乐限定检查已收口，准备保护PR，远程PR/Pages尚待执行，不覆盖旧release历史。


2026-10-14 新增整合入口：[本轮文件组织与验证范围](technical/iterations/repository-update-2026-10-14.md)。P01/P14现行F03、P02 Someone、P13目录/唱片/找音乐与旧发布main的学习/CMS/内网限制共同纳入回归；本文只维护职责/映射，实际通过与发布在两侧PLAN和验收记录。


P13 / R04、R12 / U12、U14 / T25.28：[找音乐侧栏独立页](design/iterations/u12-p13-2026-10-14-discover-page.md)，覆盖T25.27底部展开区展示方案，服务与授权沿用。

P02 / R01、R12 / U13、U14 / T05、T26–T27：Someone[首版开发与验收](design/iterations/u13-p02-2026-10-14-someone-development.md)，用户指定ITP报名表资料；真实页面和桌面／390／320px执行者证据已完成，当前待用户验收，CMS／部署另验。

P03/P06/P15 / R02、R09、R10、R12 / U09、U13、U14 / T05、T07、T09–T10、T26–T27：[Becoming 博客第二轮构图与阅读候选](design/iterations/u09-blog-uiux-directions-2026-10-14.md)，含黑色创作档案、情境长文和引用对照的实际页面证据；研究完成，方向待用户判断。[第一轮研究](design/iterations/u09-blog-uiux-research-2026-10-14.md)已被用户反馈否决为主设计方向，保留历史参考，应用状态不提升。

P02 / R01、R12 / U13、U14 / T05、T13、T26–T27：Someone 个人介绍界面[六站调研与设计候选](design/iterations/u13-p02-2026-10-14-someone-research.md)，含三个主案例桌面／390px原图；研究完成，应用状态不提升。

P13 / R04、R12 / U12、U14 / T25.27、T21.05：洛雪功能直接接入电台的搜索/音质/下载与真实入库，见[本片](technical/iterations/t25-p13-2026-10-14-lx-integration.md)。

P13 / R04、R12 / U12、U14 / T25.26：两源曲库页面统一与专辑封套悬停显影，见[本片](design/iterations/u12-p13-2026-10-14-library-unify.md)。

2026-10-14 维护入口：[仓库整合记录](technical/iterations/repository-integration-2026-10-14.md)说明本轮 main 与首页/音乐文档的合并边界，沿用 T15/T16 和当前 P/U 编号；实际检查、PR 与部署结果统一见[本轮发布验收](technical/acceptance/release-2026-10-14.md)和技术计划；技术验收不代替设计侧的用户审美确认。

P13 / R04、R12 / U12、U14 / T25.25：专辑卡片悬停转动/移开暂停，见[本片](design/iterations/u12-p13-2026-10-14-sleeve-hover.md)。

P13 / R04、R12 / U12、U14 / T25.24：网易云个人播放登录加密保存与跨重启恢复，见[本片](technical/iterations/t25-p13-2026-10-14-saved-login.md)。

P13 / R04、R12 / U12、U14 / T25.23：网易云个人账号权限播放和登录布局，见[本片](technical/iterations/t25-p13-2026-10-14-account-playback.md)。

P13 / R04、R12 / U12、U14 / T25.21：网易云播放索引接入与生命周期修复，工程记录见[本片](technical/iterations/t25-p13-2026-10-14-playback-service-repair.md)。

2026-10-13音乐接入：P13/P18 / R04、R12 / U12、U14 / T25.02、T22–T24对应[持续播放](design/iterations/u12-p13-2026-10-13-persistent-audio.md)与[推荐审核/写入](technical/iterations/t22-t24-p13-2026-10-13-recommendations.md)。本机闭环与线上部署分别记状态；曲库/歌词布局仍按T25.07/T25.08，不以运行时覆盖。

整理日期：2026-10-07。规划文档按设计和技术分为两类；本文统一维护文件、页面和任务之间的对应关系。设计任务与技术任务的实际状态分别记录在各自的 `PLAN.md`，这里不重复维护进度。

## 目录与文件对应

```text
docs/
├── README.md                 文档导航与对应关系
├── design/                   页面、空间、视觉、交互与设计验证
│   ├── SPEC.md               页面与交互规格（16 个页面／界面目标）
│   ├── PLAN.md               设计计划、工作流与验收（U01–U14）
│   ├── REFERENCES.md         设计案例、组件、素材与许可
│   ├── CONCEPT.md            概念、场景、动作与控件
│   ├── SYSTEM.md             颜色、字体、尺寸、状态与运动参数
│   ├── TOOLKIT.md            设计技能选型、安装版本与使用分工
│   ├── BRAND_MANUAL.md       品牌手册入口、内容索引与快照说明
│   ├── brand/                品牌手册 PDF、生成源与检查记录
│   └── iterations/           U/P 迭代记录与实际截图证据
└── technical/                架构、数据、服务、工程与技术验证
    ├── SPEC.md               技术方案与功能需求（R01–R13）
    ├── PLAN.md               实施任务与技术验收（T01–T29）
    ├── REFERENCES.md         官方文档、候选依赖与平台约束
    ├── HOMEPAGE_ALCHE_HANDOFF.md  首页标杆实现的施工任务单
    ├── GITHUB_WORKFLOW.md    CI、构建与 Pages 接入
    ├── REPOSITORY_CONVENTIONS.md  仓库、目录、命名与提交规则
    └── acceptance/             综合发布验收与公开浏览器证据
```

同名文件承担相同层级的职责：`SPEC.md` 定义目标与边界，`PLAN.md` 定义执行与验收，`REFERENCES.md` 保存来源与候选。设计专用的概念和统一参数由技术规格中的运行时、组件与资源约束承接。

| 职责 | 设计文件 | 对应技术文件 | 如何配合 |
| --- | --- | --- | --- |
| 规格 | [页面与交互规格](design/SPEC.md) | [技术实现规格](technical/SPEC.md) | P 页面定义访客任务与交互；R 需求定义数据、路由、接口与服务边界 |
| 计划与验收 | [设计计划与工作流](design/PLAN.md) | [技术实施计划](technical/PLAN.md) | U 任务验证页面与局部体验；T 任务验证真实工程与外部接入；证据和完成状态分别记录 |
| 参考来源 | [设计复用与素材来源](design/REFERENCES.md) | [技术调研与候选方案](technical/REFERENCES.md) | 前者维护体验参考、素材许可与改造范围；后者维护依赖能力、官方文档与运行条件 |
| 概念与空间动作 | [概念施工说明](design/CONCEPT.md) | [技术规格：前端组件和运行时约束](technical/SPEC.md#前端组件和运行时约束) | 场景状态、输入、焦点与返回规则由加载、生命周期和路由实现承接 |
| 统一视觉参数 | [设计规范](design/SYSTEM.md) | [技术规格：当前技术方案](technical/SPEC.md#当前技术方案)、[运行时约束](technical/SPEC.md#前端组件和运行时约束) | 参数由组件主题和样式实现读取；资源加载、性能与降级由工程验证承接；参数只在设计规范维护 |
| 设计执行工具 | [设计技能配置](design/TOOLKIT.md) | 沿用技术规格的框架与工程约束 | 管技能分工、安装来源和适配规则；服务 U01–U14，不新增页面、需求或技术任务；素材来源仍在 REFERENCES，参数仍在 SYSTEM |
| 品牌视觉交接 | [品牌手册](design/BRAND_MANUAL.md) | T02 及相关页面的身份、主题和资源接入 | CONCEPT/SYSTEM/SPEC/REFERENCES 的可视化快照；规范仍在原文件维护，不新增另一套参数源 |

工程运行说明：[GitHub 工作流](technical/GITHUB_WORKFLOW.md)记录实际配置、触发方式、各 job 和接入条件；它对应两侧计划中的交付与验证步骤，不新增页面或改动功能编号。

P01 最新复刻依据：[ALCHE 17 轮精确研究](design/iterations/u03-p01-2026-10-08-17.md)及[实际动画回放](design/iterations/evidence/alche-motion-2026-10-08/index.html)。它们保存来源事实与证据，采用参数仍只在 SYSTEM 第 9 节维护；执行提示词见 HOMEPAGE_ALCHE_HANDOFF 第 0 节。覆盖既有 U03–U07/U14、T02.02/T03.01–T03.05/T26.02/T27.01，不新增页面或重复任务编号。

2026-10-14 最新首页配置为A Moment Remains→Echoes→Afterimage三卡，旋转区Elsewhere移除，接The Wall；U03/U05/U07与T03.02–T03.04沿用。[三卡实施与采集证据](design/iterations/evidence/home-carousel-order-2026-10-14/implementation/README.md)、[工程记录](technical/iterations/p01-2026-10-14-carousel-order.md)是当前F03接续基线，参数仍归SYSTEM9.2.5；旧四卡绝对节点仅历史。

随后用户要求单砖稍小，当前实际候选更新为h39_FOLj（统一比例.85），沿用P01/P14、R12、U05/T03.04；[尺寸证据](design/iterations/evidence/f02-brick-scale-2026-10-14/implementation/README.md)与[工程记录](technical/iterations/p01-f02-2026-10-14-brick-scale.md)供F03接续，三卡配置保持。

2026-10-14 F03已实际接续为4342/BdZlSJh6，同资源门槛/玻璃/字标与有限最终场景采样完成，待独立/用户；P01/R12/U03、U14/T03.01、T26.02、T27.01编号沿用。[工程记录](technical/iterations/p01-f03-2026-10-14-loading-reveal.md)、[冻结哈希/原图与限制](design/iterations/evidence/f03-loading-2026-10-14/implementation/README.md)；F05/F06/F07仍排队。

随后用户明确七类效果及居中要求，采用范围以 [20 轮纠偏](design/iterations/u03-p01-2026-10-08-20.md)更新为准：全屏展开纳入 T03.04 的终章进入过程，中央锚点纳入当前 T03.02；原始研究公式与实际实现状态仍分开。

P01/P14 全屏展开的当前施工与验收入口：[F02 · 玻璃成方、向上垒墙（2026-10-14最新修订）](design/iterations/f02-brick-assembly-revision.md)，沿用 U05 / T03.04。承接玻璃质感与柔光，近方形阶段开始从底部逐砖向上建立墙面，覆盖旧上方落砖及[完整墙展开/整墙升起](design/iterations/f02-fullscreen-handoff.md)时序；不新增页面或栏目。实际交付状态仍见[首页功能验收队列](design/iterations/homepage-feature-acceptance.md)。

同日最新向上垒墙的本机候选为B46QOkX1，参数归SYSTEM9.2.5；[执行者原图/节点/边界](design/iterations/evidence/f02-upward-assembly-2026-10-14/implementation/README.md)与[工程记录](technical/iterations/p01-f02-2026-10-14-upward-assembly.md)对应同一U05/T03.04。当前待独立设计及用户验收，旧BC/CQ/B2只作历史。

仓库维护说明：[仓库管理、目录与命名规范](technical/REPOSITORY_CONVENTIONS.md)定义分支、提交、公开资源边界与目录职责；根目录 [CONTRIBUTING.md](../CONTRIBUTING.md) 为修改入口，实际远程设置和验证仍在技术计划中记录。

## 页面与需求、任务对应

P10 最新独立交互样本：[A Moment Remains：Dome Gallery照片墙 → 三维无限影像空间](design/iterations/u10-p10-2026-10-13-sphere-canvas.md)，用户已通过现有功能并[纠正栏目名称](design/iterations/u10-p10-2026-10-14-overview-controls.md#同日名称纠正)；[第十五片裁切闪边修正](design/iterations/u10-p10-2026-10-14-zoom-edge.md)在用户复验v15仍有亮线后继续修正，v16同条件对照和实际读图通过、待用户复验。保留[第十四片运行减负](design/iterations/u10-p10-2026-10-14-runtime-refinement.md)和[第十三片轻量优化](design/iterations/u10-p10-2026-10-14-lightweight.md)、[栏目/球面返回](design/iterations/u10-p10-2026-10-14-overview-controls.md)、[沉浸/自然切换](design/iterations/u10-p10-2026-10-14-immersive-viewer.md)和[完整单图](design/iterations/u10-p10-2026-10-14-single-viewer.md)，查看时后台暂停。当前4352?v=16，沿用R06/R12、U10/U14、T12/T26/T27，未新增页面或任务编号，原型与正式相册接入分别验收。

编号保持原有含义：P 为页面，R 为功能需求，U 为设计任务，T 为技术任务；C、TX 和控件编号仍在概念文档维护。一项技术任务可以覆盖多页，一个页面也可以依赖多项任务。

2026-10-07 用户取消 P07 知识关系图。学习内容统一从 P03 总览进入，通过分类、搜索和普通引用链接浏览；P07 编号停用。

2026-10-07 用户再次取消 P04 课程与学习路线详情页；学习总览直接展示资料、文章和笔记，科目可作为主题标签。P04 编号停用，其他编号沿用，现有 16 个页面。

下表按现有规划建立追溯关系。列出的技术任务不表示功能已经实现；单页基线、跨页缺口、近期切片与依赖见[技术计划中的开发盘点](technical/PLAN.md#页面与跨页开发盘点2026-10-07)。16 项包括搜索界面和两个现成后台目标，不要求建立 16 个自定义站内路由。

| 设计页面 | 技术需求 | 设计任务 | 对应技术任务与边界 |
| --- | --- | --- | --- |
| P01 首页 | R01、R12 | U01–U07 | T02–T04 验证导航、交互及生命周期，场景样本按 U02–U07 逐轮接入；T05 提供资料数据；T26–T27 核验整站体验 |
| P02 关于我 | R01 | U13 | T05 落地个人资料字段与最小页面，T13 接入编辑，T26–T27 核验；缺失的真实内容不虚构 |
| P03 学习总览 | R02、R09、R10 | U09 | T05–T07 内容与入口，T09–T10 关联及统一搜索 |
| P05 资料详情与 PDF | R02 | U09 | T06 资料清单，T08 PDF 浏览，T14 资源处理；关联与检索衔接 T09–T10 |
| P06 博客与花园笔记 | R09、R10 | U09 | T05 内容字段，T09 阅读与引用，T10 统一搜索 |
| P08 展示总览 | R05、R06、R07 | U10 | T11 聚合与筛选，T12 照片浏览 |
| P09 项目与作品详情 | R07 | U10 | T11 内容展示与实际链接，T13 内容编辑；知识关联使用 T09 的结果 |
| P10 相册 | R06 | U10 | T12 浏览组件，T14 图片处理，T13 编辑上传 |
| P11 社交作品 | R05 | U10 | T11 平台内容与原站入口，T13 内容编辑 |
| P12 常用网站 | R03 | U11 | T11 分类导航与搜索，T13 链接编辑 |
| P13 音乐电台 | R04、R12 | U12 | T20–T25 能力验证、展示、提交、审核、自动同步与播放器 |
| P13 专辑收放动画 | R04、R12 | U12；[当前空间与停顿修复](design/iterations/u12-p13-2026-10-14-record-clearance.md) | T25.22；完全离套并静止停顿后切层、缓慢回位，套大于盘/同专辑仅换信息，本地验证/用户视觉另验 |
| P13 纸质唱片套 | R04、R12 | U12；[纸套细节](design/iterations/u12-p13-2026-10-14-paper-sleeve.md) | T25.19；纸边/开口/哑光本地接入及执行者读图完成 |
| P13 歌词间距 | R04、R12 | U12；[歌词右移](design/iterations/u12-p13-2026-10-14-lyrics-spacing.md) | T25.17；桌面歌词列留白本地验证，手机余量0 |
| P13 金属唱臂替换 | R04、R12 | U12；[研究](design/iterations/u12-p13-2026-10-14-tonearm-candidates.md)、[接入](design/iterations/u12-p13-2026-10-14-album-choreography-revision.md) | T25.18；原创生成透明金属素材已替换/落针校准，本地验证，用户审美另验 |
| P13 横向迷你/封面拖动 | R04、R12 | U12、U14；[横向悬窗](design/iterations/u12-p13-2026-10-14-mini-strip.md) | T25.16；508×134、无顶栏/角落关闭、毛玻璃本地接入/执行者验证完成 |
| P13 收听构图/歌词跟随 | R04、R12 | U12；[收听优化](design/iterations/u12-p13-2026-10-13-listening-balance.md) | T25.14；主视觉右移、去按钮改自然跟随本地接入/执行者验证完成 |
| P13 悬窗大小与工具带 | R04、R12 | U12、U14；[两态悬窗](design/iterations/u12-p13-2026-10-13-floating-sizes.md) | T25.15；大封面/迷你、控件避让封面本地接入/执行者验证完成 |
| P13 收听构图/歌词跟随 | R04、R12 | U12；[收听优化](design/iterations/u12-p13-2026-10-13-listening-balance.md) | T25.14；主视觉右移、去按钮改自然跟随 |
| P13 悬窗大小与工具带 | R04、R12 | U12、U14；[两态悬窗](design/iterations/u12-p13-2026-10-13-floating-sizes.md) | T25.15；大封面/迷你、控件避让封面 |
| P13 本地壳宽修复 | R04、R12 | U12；[右侧空白修复](design/iterations/u12-p13-2026-10-13-width-repair.md) | T25.13；旧grid/flex交叉轴残留本地修复/执行者验证完成，内部阅读栅格保持 |
| P13 排版重整 | R04、R12 | U12；[参考驱动布局](design/iterations/u12-p13-2026-10-13-elegant-layout.md) | T25.12；共享展示组件/固定壳/独立内容滚动本地接入/执行者验证完成，媒体与悬窗边界保持，用户审美另验 |
| P13 核心曲库/分类播客/刷新 | R04、R12 | U12、U14；[正式整合](design/iterations/u12-p13-2026-10-15-main-integration.md) | T25.29–36、T26–T27；服务检测/共享歌单回退与[发布验收](technical/acceptance/latest-release-2026-10-15.md)，个人后台与静态站分别验收 |
| P13 跨页悬窗 | R04、R12 | U12、U14；[大封面选择/实际接入](design/iterations/u12-p13-2026-10-13-floating-player-research.md) | T25.11；承接T25.02，本站浮层本机接入/执行者验证完成；系统PiP、真机与部署另验 |
| P13 全屏精简 | R04、R12 | U12；[封面/栅格/毛玻璃/精简](design/iterations/u12-p13-2026-10-13-radio-simplify.md) | T25.10；沿用现有音乐组件、媒体与资源，无新外部能力 |
| P13 唱片细节 | R04、R12 | U12；[唱臂/封面/材质](design/iterations/u12-p13-2026-10-13-vinyl-detail.md) | T25.09；统一落针几何、真实封面圆标与黑胶表面 |
| P13 实时歌词与精修 | R04、R12 | U12；[歌词/去CD层](design/iterations/u12-p13-2026-10-13-lyrics-polish.md) | T25.08；真实媒体歌词同步、控件与响应式；CD层停用，曲库专辑保留 |
| P13 曲库/独立黑胶播放页（2026-10-13） | R04、R12 | U12；[曲库与播放页](design/iterations/u12-p13-2026-10-13-library-listening.md) | T25.07；Apple Music信息层级、保留现有专辑与唱片机、视图返回不重置音频 |
| P13 双模式外观（2026-10-13） | R04、R12 | U12；[用户选定与实际适配](design/iterations/u12-p13-2026-10-13-selected-skins.md) | T21.04 封面/目录、T25.04 外观与真实媒体状态；考拉/自动同步仍按原队列 |
| P13 专辑/歌曲切换层（当前停用） | R04、R12 | U12；[历史透明盒任务](design/iterations/u12-p13-2026-10-13-album-transition.md) | T25.05历史实现；2026-10-13用户取消CD选择层，T25.08撤入口/运行时，普通曲库专辑保留 |
| P13 音乐页整体精修 | R04、R12 | U12；[苹果UI参考精修](design/iterations/u12-p13-2026-10-13-apple-refinement.md) | T25.06；布局/控件/材质与响应式，保留已选播放器及真实音源 |
| P14 留言墙 | R08、R12 | U02、U06–U08、U14；[研究](design/iterations/u08-p14-2026-10-14-wall-research.md)、[可移动迷墙第一样本](design/iterations/u08-p14-2026-10-14-wall-prototype.md) | T17–T19 Giscus 接入、管理及组件适配，T26–T27 返回、输入释放与降级核验；当前只完成独立展示样本 |
| P15 搜索 | R02、R09、R10、R12 | U13；学习内检索由 U09 验证 | T02 原生搜索边界，T10 统一知识搜索，T26 返回与查询恢复；全站扩展范围仍待验证 |
| P16 404 | R12 | U13 | T16 深层路由与 404 验证，T26–T27 导航与可访问性 |
| P17 内容管理 | R13 | U13 | T13 网页后台，T14–T16 资源处理、发布与部署 |
| P18 推歌审核 | R04 | U12 验证审核与同步状态；后台局部轮次待拆分 | T23 审核，T24 自动同步；真实授权及能力依赖 T20 |

| 跨页面工作 | 设计侧 | 技术侧 |
| --- | --- | --- |
| 工程与组件基础 | U01 的可点击结构；各页共有控件 | T01–T05 工程、原生能力、交互、插件组合与内容字段 |
| 品牌身份与站点标志 | U03/P01 身份构图；P02 与共享导航复用；[用户已确认的独立两行字标](design/iterations/samples/u03-p01-2026-10-08-07/generation.json) | R01；T02 的共享身份组件与资源接入，位图外观已确认，应用接入待完成 |
| 迷墙立方体与光线探索（历史） | U03/P01；涉及 P14；[空间交互研究](design/iterations/u03-p01-2026-10-08-09.md) | 2026-10-08 被 ALCHE 连续章节方向替代为当前首页；材质及可控运动原则仍可参考 |
| ALCHE 标杆首页与升墙 | U01–U08/U14；P01/P14；[实站研究与证据](design/iterations/u03-p01-2026-10-08-10.md)；场景以 CONCEPT 第 10 节为准 | R01/R08/R12；[施工任务单](technical/HOMEPAGE_ALCHE_HANDOFF.md) 承接 T02/T03/T17/T19/T26/T27，状态以两侧 PLAN 为准 |
| 首页身份与显影美术纠偏 | U03/U05/U07/U14；P01；[32轮用户反馈、加载与柔光方向](design/iterations/u03-p01-2026-10-09-32.md) | R01/R12；T02.02/T03.01/T03.05；身份、照明、加载分片，统一参数见SYSTEM9.1.1/9.2.6/9.3.1 |
| 首页抽象风格与形体精修 | U03/U05/U14；P01；[33轮宽三角体、边缘光与局部网格](design/iterations/u03-p01-2026-10-09-33.md) | R01/R12；T03.01/T03.05；33A比例→33B边缘光→33C网格，参数见SYSTEM9.3.1；写实方向稿已否决 |
| 首页三角体加厚与光源纠正 | U03/U05/U14；P01；[35轮三角体边缘光与无字过场](design/iterations/u03-p01-2026-10-10-35.md) | R01/R12；T03.01/T03.02/T03.05；35A去底层过场字→35B实体加厚→35C模型边缘光，参数见SYSTEM9.1.1/9.3.2；替代画幅边缘灯位 |
| 首页缩小加厚与双轮廓照明 | U03/U05/U14；P01；[36轮施工](design/iterations/u03-p01-2026-10-10-36.md) | R01/R12；T03.01/T03.02/T03.05；删除说明句→宽高减半且增厚→内外边缘/主体/邻域照明，现行参数SYSTEM9.3.3 |
| 首页柔光晕精修 | U03/U05/U14；P01；[37轮施工](design/iterations/u03-p01-2026-10-10-37.md) | R01/R12；T03.01/T03.05；取消窄白光条的主导，以宽缓光晕连接玻璃和邻域，光质参数以SYSTEM9.3.4覆盖36轮 |
| 首页适度放大与宽度微调 | U03/U05/U14；P01；[38轮施工](design/iterations/u03-p01-2026-10-10-38.md) | R01/R12；T03.01/T03.02/T03.05；38A统一放大，38D按新图修正环边宽度，参数SYSTEM9.3.5 |
| 首页侧视光片纠正 | U03/U05/U14；P01；[39轮连续光晕](design/iterations/u03-p01-2026-10-10-39.md) | R01/R12；T03.01/T03.05；撤可见前后光片，实体边缘连续柔光，参数SYSTEM9.3.6 |
| 首页ALCHE尺寸校准 | U03/U05/U14；P01；[40轮](design/iterations/u03-p01-2026-10-10-40.md) | R01/R12；T03.01/T03.05；外包络/内孔/深度/同视口投影，SYSTEM9.3.7 |
| 首页三角体半尺寸 | U03/U05/U14；P01；[42轮](design/iterations/u03-p01-2026-10-10-42.md) | R01/R12；T03.01/T03.05；保留ALCHE比例与41柔光，统一缩至50%，SYSTEM9.3.9 |
| 首页独立加载设计与真实揭幕 | U03/U05/U07/U14；P01；[34轮美术、状态与揭幕任务](design/iterations/u03-p01-2026-10-09-34.md) | R01/R12；T03.01/T03.05/T26；先34A构图，再34B就绪/揭幕/降级/返回，参数见SYSTEM9.2.6 |
| 首页实心三棱镜（GitHub #34前置） | U03/U05/U14；P01；[43轮实体替换](design/iterations/u03-p01-2026-10-11-43.md) | R01/R12；T03.01/T03.05；仅取消内孔及其柔光，尺寸沿用42，参数SYSTEM9.3.10；真实分光后续独立验收 |
| 首页白光与单色折射（GitHub #34切片1） | U03/U05/U14；P01；[45轮光路](design/iterations/u03-p01-2026-10-11-45.md) | R12；T03.05/T26.02/T27.01；固定入射、Snell路径、旋转/章节联动和采样隔离，参数SYSTEM9.3.12；色散另片 |
| 首页七波长连续色散（GitHub #34切片2） | U03/U05/U14；P01；[46轮色散](design/iterations/u03-p01-2026-10-11-46.md) | R12；T03.05/T26.02/T27.01；SYSTEM9.3.13，48源/47光质；源码3a40f5f、13物理/518样本/22浏览器通过，独立设计读图通过 |
| 封面白光入射倾角 | U03/U05/U14；P01；[48轮](design/iterations/u03-p01-2026-10-11-48.md) | R12；T03.05/T26.02/T27.01；固定源向右上14.2115°，SYSTEM9.3.15；实际验证/源码3c19070已保存，46新基线 |
| 片状发光再次纠正 | U03/U05/U14；P01；[47轮新反馈](design/iterations/u03-p01-2026-10-11-47.md) | R12；T03.01/T03.05；同姿态光层诊断与柔光修正，参数SYSTEM9.3.14；优先46色散 |
| 首页三维棱边柔光 | U03/U05/U14；P01；[44轮实际记录](design/iterations/u03-p01-2026-10-11-44.md) | R12；T03.01/T03.05；三维边缘源与近远Gaussian，SYSTEM9.3.11；软件截图和真机边界分别记录 |
| 首页背景白线撤除与色散增强 | U03/U05/U14；P01；[49背景](design/iterations/u03-p01-2026-10-12-49.md)→[50色散](design/iterations/u03-p01-2026-10-12-50.md) | R12；T03.01/T03.05/T26.02/T27.01；SYSTEM9.3.16–9.3.17，源码83ec849/5aaaf82已独立保存，采集边界与独立复核见50记录 |
| 首页入射界面与物理光传输 | U03/U05/U14；P01；[51机制、接缝与候选首样](design/iterations/u03-p01-2026-10-12-51.md) | R12；T03.05/T26.02/T27.01；SYSTEM9.3.18，有限同源截面与谱能量衔接、画质优先；候选体积折射失败，首页尚未替换 |
| 首页历史候选：移除物理效果、只保留中央三角体（55轮） | U03/U14；P01；[三角体单主体交接](design/iterations/u03-p01-2026-10-13-55-triangle-only.md) | R12；T03.05/T26.02/T27.01；55轮曾采用中性灰基础材质；随后56恢复玻璃与柔晕，55仅作追溯证据，不作为现行视觉或用户通过 |


| 素材与发布 | 各 U 任务登记实际来源、派生素材与展示状态 | T06、T14 资料和资源；T13、T15–T16 编辑与发布 |
| 完整旅程与可访问性 | U14；各页局部验证 | T26–T27；R12 覆盖切页、手机、键盘、减少动画与降级 |
| 未来 AI | P02、P15、P17 的未来入口与状态边界；当前没有独立 U 任务 | R11、T28–T29 只准备数据与服务边界，不代表 AI 已接入 |

### 近期开发切片对应

子编号仅拆分既有技术任务；本表只维护归属，不维护进度。每轮目标、依赖、状态与验收在[技术计划的近期小步队列](technical/PLAN.md#近期小步队列)记录；相应设计产物和体验证据在设计计划与迭代记录维护。

| 切片 | 所属技术任务 | 页面 | 需求 | 设计任务 |
| --- | --- | --- | --- | --- |
| T07.01 类型筛选与 URL | T07 | P03（K01 类型选择、K02 结果反馈与清空语境） | R02、R09、R10 | U09；[当前页面与控件样本](design/iterations/u09-p03-2026-10-07-03.md)，[历史控件记录](design/iterations/u09-p03-t07-01-2026-10-07-02.md) |
| T07.02 主题浏览与 URL | T07 | P03 | R02、R09、R10 | U09 |
| T26.01 筛选列表与详情返回 | T26 | P03、P05、P06 | R12 | U09、U14 |
| T09.01 稳定 ID 关联链接 | T09 | P05、P06 | R02、R09、R10 | U09 |
| T09.02 反向引用 | T09 | P05、P06 | R02、R09、R10 | U09 |
| T09.03 一篇文章的阅读闭环 | T09；复用 T07/T10，返回衔接 T26 | P03、P06、P15 | R10、R12 | U09、U14 |
| T09.04 一键全屏沉浸、PDF固定页数与完整页适配、手机右滑退出 | T09；PDF 承接 T08，生命周期承接 T26 | P05、P06 | R02、R09、R10、R12 | U09、U14 |
| T13.01 网页编辑与草稿 | T13 | P17、P06 | R13 | U13 |
| T13.02 单次图片上传与预览 | T13、T14 | P17、P06 | R13 | U13 |
| T13.03 一篇文章发布与修改 | T13、T15、T16 | P17、P06 | R10、R13 | U13、U14 |
| T13.04 文章列表与新建草稿 | T13；复用 T05/T14/T15 | P17、P06 | R10、R13 | U13 |
| T13.05 未保存离开验证与提示 | T13 | P17 | R13 | U13 |
| T13.06 保存冲突后的输入保留与重试 | T13；复用 T15 | P17 | R13 | U13 |
| T13.07 图片选择取消与正文保留 | T13、T14 | P17 | R13 | U13 |
| T13.08 上传格式拦截与恢复 | T13、T14；复用 T15 | P17 | R13 | U13 |
| T13.09 正文图片替代文本 | T13、T14；复用 T15 | P17、P06 | R13 | U13 |
| T13.10 正文链接编辑与保存 | T13；复用 T15 | P17、P06 | R13、R10 | U13 |
| T13.11 网页关联内容选择 | T13；复用 T09/T15 | P17、P05、P06 | R13、R09、R10 | U13、U09 |
| T13.12 已有资料说明网页编辑 | T13；复用 T06/T15 | P17、P03、P05 | R13、R02 | U13、U09 |
| T13.13 已有笔记说明网页编辑 | T13；复用 T09/T15 | P17、P03、P05 | R13、R09 | U13、U09 |
| T13.14 自写笔记新建与正文 | T13；复用 T09/T14/T15 | P17、P03、P06 | R13、R09 | U13、U09 |
| T13.15 保存后的候选生成、自动回写与新提交检查 | T13、T15 | P17 | R13 | U13 |
| T16.01 首页与学习区整合发布 | T02、T15–T16、T26 | P01、P03、P05、P06、P17 | R02、R09、R10、R12、R13 | U01、U09、U13、U14 |
| T16.02 公网首页首帧加载 | T03、T16、T26 | P01 | R12 | U03、U05、U14 |
| T10.01 原生知识搜索过滤 | T10；返回衔接 T26 | P15、P03、P05、P06 | R02、R09、R10、R12 | U09、U13、U14 |
| T26.02 学习区收尾集成核验 | T26 | P03、P05、P06、P15、P17 | R12、R13 | U09、U13、U14 |
| T07.03 文章标签与分页 | T07 | P03、P06 | R10 | U09 |
| T07.05 博客标签浏览开关 | T07；复用 T13/T15 | P06、P17 | R10、R13 | U09、U13 |
| T07.04 学习总览标题排序 | T07 | P03；返回衔接 P05、P06 | R02、R09、R10、R12 | U09、U14 |
| T02.01 公共目录 | T02 | 全部访客页面；P17–P18 沿用后台导航 | R01、R12 | U13、U14；各页验证实例 |
| T06.01 一个资料与公开附件 | T06 | P05 | R02 | U09 |
| T06.02 现有学习资料分类接入 | T06；复用 T05、T07、T09 内容能力 | P03、P05、P06 | R02、R09 | U09 |
| T08.01 资料直接阅读闭环 | T08；本地附件承接 T06，外链承接 T09 | P05、P06 | R02、R09、R12 | U09 |
| T08.02 PDF 侧栏收起 | T08 | P05、P06 | R02、R09、R12 | U09 |

| T02.02 首页静态身份、字体与导航 | T02 | P01、P10 路由 | R01、R12 | U01、U03、U04 |
| T03.01 加载与玻璃单体 | T03 | P01 | R12 | U02、U03、U05；[F03加载美术与揭幕](design/iterations/f03-loading-reveal.md)同时关联U14/T26.02/T27.01 |
| T03.02 一个项目过渡 | T03 | P01 → P08 | R07、R12 | U04、U06 |
| T03.03 全部滚动章节 | T03 | P01 → P08/P10/P12/P13 | R03、R04、R06、R07、R12 | U06、U10–U12 |
| T03.04 终章升墙 | T03 | P01、P14 | R08、R12 | U02、U06、U07 |
| T03.05 高级光学与局部流体 | T03 | P01 | R12 | U03、U07 |
| T26.02 首页返回与生命周期 | T26 | P01 与各栏目 | R12 | U14 |
| T17.01 Giscus 真实接入 | T17 | P14 | R08 | U08 |
| T19.01 留言砖与公开快照 | T19 | P01、P14 | R08 | U08 |
| T27.01 首页设备与降级 | T27 | P01、P14 及入口 | R12 | U14 |
| T20.01 / T21.01 / T25.01 | T20、T21、T25 | P13 双音源、真实单曲/专辑清单、洛雪入口与网易云共享歌单 | R04、R12 | U12；首片不包含实际云盘同步或跨页持续播放 |
| T21.02 / T21.03 | T21 | P13 云盘公开音频接入 / 下载后自动更新 | R04、R12 | U12；分别验证分享直链与自动同步闭环 |
| T25.03 | T25 | P13 本机开发页播放真实下载音频 | R04、R12 | U12；私有文件映射及本机接口，不代替云盘或跨页持续播放 |

## 阅读与维护方式

先读项目根目录的 [AI 工作约定](../AGENTS.md)，再读[技术规格](technical/SPEC.md)与[技术计划](technical/PLAN.md)。涉及页面时，从本表找到 P、U、R、T 对应关系，再读[设计计划](design/PLAN.md)、[设计规格](design/SPEC.md)及需要的概念、规范与来源。

修改时按职责更新：页面与用户操作写入设计规格；架构与数据写入技术规格；执行和实测状态写入各自计划；来源写入各自参考文件。页面或任务新增、拆分后更新本文的映射。设计验收、原型演示和真实服务接入分别保留证据。

设计迭代记录沿用 `docs/design/iterations/`；已有 [U01 实际记录与截图证据](design/iterations/u01-p01-2026-10-07-01.md)。技术状态沿用技术计划的状态记录，实际交付后填写产物和验证结果。

2026-10-07 新增 [TOOLKIT](design/TOOLKIT.md)：配置平面设计、UI、UX 技能及安装来源；原有页面、任务和八份核心设计/技术规划职责沿用。

## 文件迁移记录

本次按用户要求整理分类和对应关系，既有功能决定与任务编号沿用。旧路径与新路径如下，迁移后以新路径为准。

| 原路径 | 当前路径 |
| --- | --- |
| `docs/DESIGN_SPEC.md` | `docs/design/SPEC.md` |
| `docs/DESIGN_WORKFLOW.md` | `docs/design/PLAN.md` |
| `docs/DESIGN_REFERENCES.md` | `docs/design/REFERENCES.md` |
| `docs/CONCEPT_SPEC.md` | `docs/design/CONCEPT.md` |
| `docs/DESIGN_SYSTEM.md` | `docs/design/SYSTEM.md` |
| `docs/PROJECT_SPEC.md` | `docs/technical/SPEC.md` |
| `docs/IMPLEMENTATION_PLAN.md` | `docs/technical/PLAN.md` |
| `docs/RESEARCH_REFERENCES.md` | `docs/technical/REFERENCES.md` |

项目根目录保留 `README.md` 和 `AGENTS.md`。本地原始资料目录 `大二上学习资源/` 作为内容来源独立保留，由 `.gitignore` 排除，不随 GitHub 仓库上传；2026-10-07 检查为 38 个文件（36 PDF、2 TXT），共 532,588,263 字节，约 507.9 MiB。根 Astro/Starlight 工程已建立；GitHub 工作流与实际接入进展见技术计划的状态记录。


P03 / R02、R09、R12 / U09、U13、U14 / T05、T07、T26–T27：[Becoming Framer总览首片](design/iterations/u09-p03-2026-10-14-framer-overview.md)。用户选定Framer整体与shadcn选中，仅本页实施和体验；P05/P06后续另片。

P03/P05 / R02、R09、R12 / U09、U14 / T05、T07–T08、T26–T27：[PDF附件接入与新版外观衔接](design/iterations/u09-p05-2026-10-15-pdf-connection.md)，36份本地原件沿用已有阅读器，不自动公开发布原件。

P05/P06 / R02、R09、R10、R12 / U09、U14 / T05、T08–T10、T26–T27：[文章阅读外观与快捷键说明撤除](design/iterations/u09-p06-2026-10-15-article-reading.md)，只调整文章阅读、共用操作状态，不新增文章或改变标签设置。

P06 / R02、R09、R12 / U09、U14 / T09、T26–T27：[文章阅读位置自动恢复](design/iterations/u09-p06-2026-10-15-reading-progress.md)，按文章记忆段落位置，不新增页面或设置项。

P05 / R02、R09、R12 / U09、U14 / T08、T26–T27：[PDF页码与阅读位置续读](design/iterations/u09-p05-2026-10-15-pdf-progress.md)，每份PDF独立记忆，不新增页面或设置。

P06 / R09、R10、R12 / U09、U14 / T05、T07、T09、T26–T27：[文章列表外观衔接](design/iterations/u09-p06-2026-10-15-article-list.md)，含现有分页和标签结果外壳，不新增页面类型。
