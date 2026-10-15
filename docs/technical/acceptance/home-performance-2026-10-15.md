# 2026-10-15 首页性能优化验收与发布

P01/P14 · R12 · U03–U06、U14 · T03.02、T15/T16、T26.02、T27.01。用户本轮授权：验证最新首页性能优化，无问题发布并更新记录。

## 当前结论

限定工程与浏览器范围未发现新增发布阻塞，准备通过保护PR发布。实际合并SHA、Pages运行和公网结果在关联PR按实际补录。本轮接入最新BNuf11DH中按需绘制及F05连续低亮背景；不启动F06/F07，不把工程或独立检查写成用户审美通过。

## 版本与整合

从已发布main c6dd2eb60509a067d0875a631539fcdbbc9b1408建立独立验收分支，源工作仍cc9830b及原WIP。34份源冻结前后哈希无漂移；[清单](evidence/home-performance-2026-10-15/source-manifest.json)与[适配](evidence/home-performance-2026-10-15/integration.json)分别记录源和最终源码。15份源与main有差异，其中3份保留已发布的加载/渲染清理/目录样式，实际接入12份源码/测试。HomeJourney保留所属body、Canvas事件销毁和独立WorksScene Suspense；新增FrameLoop/Backdrop诊断也绑定所属body。初次集成脚本误用变量锚点中止，纠正为保留main原本已具备的invalidate；未推送中间状态。

复用R3F单一时钟，活动always，收敛demand；首次恢复排除空闲dt，活动慢帧仍用真实dt。不可见玻璃的透射材质visible同步关闭，DOM仅在值改变时提交；不降低DPR、AA、材质或采样分辨率，不新增Canvas/Renderer/render target/pass/ticker或依赖。F05沿用原平面/CanvasTexture，只更新ShaderMaterial uniform，参数只在[SYSTEM9.2.7](../../design/SYSTEM.md#927-轮播背景空间与低亮光域f05)维护。

Windows集成包`HomeJourney.C6MN0nAV.js`，452440B，SHA256 `c17a64859bda1dff4cfbd9239611d1d310f5d6b0b391ffd68e0ab51405fb6ced`；原4342/BNuf11DH是源候选，不能混作最终发布包。跨平台产物须以CI实际包和公网字节核对。

## 工程验证

| 项目 | 实际结果 |
| --- | --- |
| 类型 | 144文件，0 errors/0 warnings，8条沿用相册的hints |
| 构建 | 53页面，Pagefind54HTML；655静态文件/32,915,191B |
| 风险测试 | 本地首页38/38、内容/首页/PDF92/92；两者有重叠不相加。CI新增frame-activity/backdrop测试 |
| 守卫 | 53常规页/6目录入口＋1沉浸相册、公开音乐目录、公开PDF与静态产物通过；actionlint通过 |
| 公开数据 | 已有远程分享在本次构建读回21首/6专辑；保留原远程/快照策略，无音乐源码改动、音频或服务凭据发布 |
| 范围 | 人物/相册/知识/CMS与音乐源代码相对main不变；原教材、照片、凭据和本机服务不进入本片 |

## 真实浏览器与原始结果

使用独立headless Edge、软件WebGL，1280×720和390×844模拟视口。初批[29项结果](evidence/home-performance-2026-10-15/browser/results.json)27通过、2false；pageerror/consoleerror均0。原始失败保留，不能写成初批全绿。

- 原线上main轮播静止：桌面6019ms新增177场景帧，窄屏6009ms新增289帧。不同运行条件下的计数，不换算真实设备FPS或宣称60FPS。
- 新版轮播：桌面10013ms、窄屏10031ms的场景/renderer计数增量均0；第一次真实滚轮唤醒，首次dt未补算空闲时间。
- 自然首访4真实门槛、有限采样释放、三卡顺序/背景、反向、暂停/恢复、深链刷新、Someone离页清理/原生返回及单audio通过。
- 模拟visibility隐藏/恢复、浏览器模拟减少动画、localhost受控8秒超时/一次重试通过；模拟不当作真实后台/OS或坏资源证据。
- 白墙初批两尺寸在截图后的短窗口各包含1个收尾帧，透射关闭、阅读门禁/反色及demand本身已通过。未改应用迎合断言；[限定确认](evidence/home-performance-2026-10-15/confirm-wall/results.json)改为截图后1.8秒稳定，再无输入观测：桌面6018.8ms/窄屏6018.6ms均0场景/renderer新增，隐藏透射false，背景权重0。两尺寸原图、初批false和补验分开保留。

本轮集中读回桌面轮播、窄屏项目/减少动画及完整墙等原图；截图与JSON非原子、不是连续输入录像。原设计[独立40图证据](../../design/iterations/evidence/f05-carousel-space-2026-10-14/independent/README.md)作为源候选独立阶段，不能替代本轮集成检查。

## 限定技术审查

Impeccable检测器对5个目标文件无主发现（[原输出](evidence/home-performance-2026-10-15/detector.json)）。限定评分15/20：可达性3、性能3、主题3、响应3、一致性3；不是完整WCAG/读屏/触摸手势审核。现有黑灰、三卡、玻璃柔光与小砖/向上砌墙保持。GL共享模块和体积提示仍在；空闲停止提交不保证实体手机/GPU持续帧率、热量/耗电或中国大陆访问。没有实际音乐播放、登录、下载、账户写入或真实留言验收。

## 发布

本地确认完成后执行保护PR；Repository checks、Workflow syntax、Astro build必须在最终SHA全部成功，再Squash与Pages。正式入口：[主页](https://0ne-small-stone.github.io/personal-homepage/)。最终运行、Linux构建包、公网性能窗口和证据在PR补录，发布不提升用户审美状态。
