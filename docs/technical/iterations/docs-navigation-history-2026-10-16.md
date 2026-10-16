# 文档导航入口历史记录（截至2026-10-16）

# 文档导航与设计 / 技术对应表

2026-10-15 最新功能整合验收：保留主站e953b96（含首页性能、双语Someone及撤除重复标题），接入Becoming列表/文章与PDF续读，以及P13核心音乐/分类播客/手动刷新。公网无音乐后台时保留共享歌单快照、账号不可用反馈和内网音源说明；服务可用时延迟加载新版。文章/PDF进度仅同源本机浏览器，不保证跨设备。正式发布、实际测试与边界统一见[本轮验收](../../technical/acceptance/latest-release-2026-10-15.md)。墙AF01、Someone局部流体和首页F04仍属独立候选/待办，本轮未接入，也不启动F06/F07。旧日期状态为历史。

2026-10-15 首页性能主站验收：BNuf11DH冻结源接入含正式双语Someone的main，148文件0错误/0警告、54页构建与限定交互通过；桌面/窄屏轮播10秒、稳定白墙6秒零新增场景/renderer帧，首次输入唤醒正常。保留F03、F05、三卡及小砖，不启动F06/F07；发布入口[PR #59](https://github.com/0ne-small-stone/personal-homepage/pull/59)，最终Pages与公网结果按真实SHA补录。[本轮验收](../../technical/acceptance/home-performance-2026-10-15.md)。下方旧版本状态为过程追溯。

P02 / R01、R12 / U13、U14 / T02、T05、T16、T26–T27：Someone无照片双语版已由PR #58发布，正式入口和公网证据见[发布记录](../../technical/iterations/t05-p02-2026-10-15-pages.md)。

P02 / R01、R12 / U13、U14 / T02、T05、T16、T26–T27：用户已确认当前无照片 Someone 双语候选并授权主站发布，英文 about／中文 zh/about、语言图标和邮件复制按[发布记录](../../technical/iterations/t05-p02-2026-10-15-pages.md)接入。

2026-10-14 最终集成：本轮发布入口为[PR #54](https://github.com/0ne-small-stone/personal-homepage/pull/54)，通过保护检查合并main后由Pages部署；最终SHA、Actions和公网回读在PR补记。本地最终工程141文件0错误/0警告、8条沿用相册的提示，53页构建与186项风险测试通过。发布期间同步保留main `5eac344` 的正式相册、36张授权WebP派生及目录契约；桌面/390px首页进入相册与原生后退4/4通过。首页加载/人物/音乐的既有验收边界保持，迷墙仍是独立原型，用户审美与真机性能另记。以下同日准备状态为过程快照。

P10 / R06、R12 / U10、U14 / T12、T15、T16、T26、T27：[A Moment Remains正式接入与Pages发布](../../technical/iterations/t12-p10-2026-10-14-pages.md)。用户确认v17并授权当前相册及36张压缩派生公开，沿用/gallery/，未新增页面/任务编号；PR #53与Pages成功，入口[A Moment Remains](https://0ne-small-stone.github.io/personal-homepage/gallery/)，公网功能已核对。

2026-10-14 新增验收入口：[当前集成候选的工程、交互与发布边界](../../technical/acceptance/updates-2026-10-14.md)。沿用P01/P02/P03/P05/P06/P13/P14/P15/P17及原U/T编号；本地工程/首页定向与音乐限定检查已收口，准备保护PR，远程PR/Pages尚待执行，不覆盖旧release历史。


2026-10-14 新增整合入口：[本轮文件组织与验证范围](../../technical/iterations/repository-update-2026-10-14.md)。P01/P14现行F03、P02 Someone、P13目录/唱片/找音乐与旧发布main的学习/CMS/内网限制共同纳入回归；本文只维护职责/映射，实际通过与发布在两侧PLAN和验收记录。


P13 / R04、R12 / U12、U14 / T25.28：[找音乐侧栏独立页](../../design/iterations/u12-p13-2026-10-14-discover-page.md)，覆盖T25.27底部展开区展示方案，服务与授权沿用。

P02 / R01、R12 / U13、U14 / T05、T26–T27：Someone[首版开发与验收](../../design/iterations/u13-p02-2026-10-14-someone-development.md)，用户指定ITP报名表资料；真实页面和桌面／390／320px执行者证据已完成，当前待用户验收，CMS／部署另验。

P03/P06/P15 / R02、R09、R10、R12 / U09、U13、U14 / T05、T07、T09–T10、T26–T27：[Becoming 博客第二轮构图与阅读候选](../../design/iterations/u09-blog-uiux-directions-2026-10-14.md)，含黑色创作档案、情境长文和引用对照的实际页面证据；研究完成，方向待用户判断。[第一轮研究](../../design/iterations/u09-blog-uiux-research-2026-10-14.md)已被用户反馈否决为主设计方向，保留历史参考，应用状态不提升。

P02 / R01、R12 / U13、U14 / T05、T13、T26–T27：Someone 个人介绍界面[六站调研与设计候选](../../design/iterations/u13-p02-2026-10-14-someone-research.md)，含三个主案例桌面／390px原图；研究完成，应用状态不提升。

P13 / R04、R12 / U12、U14 / T25.27、T21.05：洛雪功能直接接入电台的搜索/音质/下载与真实入库，见[本片](../../technical/iterations/t25-p13-2026-10-14-lx-integration.md)。

P13 / R04、R12 / U12、U14 / T25.26：两源曲库页面统一与专辑封套悬停显影，见[本片](../../design/iterations/u12-p13-2026-10-14-library-unify.md)。

2026-10-14 维护入口：[仓库整合记录](../../technical/iterations/repository-integration-2026-10-14.md)说明本轮 main 与首页/音乐文档的合并边界，沿用 T15/T16 和当前 P/U 编号；实际检查、PR 与部署结果统一见[本轮发布验收](../../technical/acceptance/release-2026-10-14.md)和技术计划；技术验收不代替设计侧的用户审美确认。

P13 / R04、R12 / U12、U14 / T25.25：专辑卡片悬停转动/移开暂停，见[本片](../../design/iterations/u12-p13-2026-10-14-sleeve-hover.md)。

P13 / R04、R12 / U12、U14 / T25.24：网易云个人播放登录加密保存与跨重启恢复，见[本片](../../technical/iterations/t25-p13-2026-10-14-saved-login.md)。

P13 / R04、R12 / U12、U14 / T25.23：网易云个人账号权限播放和登录布局，见[本片](../../technical/iterations/t25-p13-2026-10-14-account-playback.md)。

P13 / R04、R12 / U12、U14 / T25.21：网易云播放索引接入与生命周期修复，工程记录见[本片](../../technical/iterations/t25-p13-2026-10-14-playback-service-repair.md)。

2026-10-13音乐接入：P13/P18 / R04、R12 / U12、U14 / T25.02、T22–T24对应[持续播放](../../design/iterations/u12-p13-2026-10-13-persistent-audio.md)与[推荐审核/写入](../../technical/iterations/t22-t24-p13-2026-10-13-recommendations.md)。本机闭环与线上部署分别记状态；曲库/歌词布局仍按T25.07/T25.08，不以运行时覆盖。

整理日期：2026-10-07。规划文档按设计和技术分为两类；本文统一维护文件、页面和任务之间的对应关系。设计任务与技术任务的实际状态分别记录在各自的 `PLAN.md`，这里不重复维护进度。


本页只保存原入口历史更新，页面/需求/任务映射继续在docs/README维护。
