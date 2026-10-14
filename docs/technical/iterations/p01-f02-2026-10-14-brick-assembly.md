# F02 · 近方开窗与逐砖砌墙工程交付

2026-10-14，P01/P14 · R08/R12 · U05 · T03.04。仅修用户反馈的F02，保留56首屏玻璃/柔晕和四卡；不接F03及独立栏目。执行者实现和本机检查完成，随后限定独立设计复核通过，**待用户验收**。

## 固定候选

- `http://127.0.0.1:4342/personal-homepage/#links`；诊断入口为同页`?opticsDebug=1`。
- `HomeJourney.B2R4dj4a.js`，1,171,887 bytes。
- SHA-256：`81658B934A2B272E11FA9B35E79E645F22283E67576705BEC47962B5A2ABB27C`。
- 复用原4342生产预览，没有启动替代工程。未提交、未部署；共享音乐/相册改动不属于本片，未批量暂存。
- 源码哈希和范围见[候选元数据](../../design/iterations/evidence/f02-brick-assembly-2026-10-14/implementation/frozen-candidate.json)。

## 实现与复用

1. 沿原Three实例砖体/材质：新`wall-assembly.ts`提供纯进度映射、底行优先的固定ID错峰、可逆下落和阅读门禁；`RisingWall`复用897个RoundedBox实例，增加与每砖同位移的实例承托片，移除完整背板，墙组固定最终位置。矩阵变化标记revision，静止/完全落定停止重复上传。
2. `GlassPortalShape`和`wall-portal-geometry`共用CSS近方目标与C1三段位置插值，整个实体正/背面、倒角和窗口同步；恢复原position/normal。F01材质和几何基线保留。
3. `WallPortal`沿同一HDR目标（长边≤1280），实例revision使缓存失效。透明空区、等比屏幕采样与窗口下缘对齐，终点为恒等采样；不靠整墙淡入或竖移。窗口末段直接交同一世界砖实例；真实面/四角门禁保持。
4. `home-motion`把阅读与有效控件门禁交给build和覆盖；F02期间稳定黑灰胶囊取消逐像素difference。`HomeJourney`只在过场暂停时冻结原位置，首屏暂停/减少动画保留quiet稳定内容。一个Canvas/Renderer/RAF，没有新依赖或物理引擎。
5. 本次实际检测到路由接管和恢复缺陷，已限于当前路径修正：同页章节在capture阶段交给共享滚动；离页capture保存历史条目；Astro返回识别自己的历史快照；刷新读取pagehide存的最新位置，避免旧历史快照覆盖当前墙阶段。监听退出按相同capture值清理。没有启动F07整体切页设计。

参数唯一来源为SYSTEM9.2.5。修改源码/测试15份，另在冻结元数据登记3份未改的F01材质/几何关联源。

## 验证和实际失败

- 原`npm run check`最终105文件，0 errors/warnings/hints；原`npm run build`15页/Pagefind，原有chunk/404提示保留。
- `node --test tests/home-motion-ranges.test.mjs`8/8：原滚动区间、实际覆盖、恒定墙坐标、CSS方形/C1、落砖正反与全部落定、阅读门禁、连续映射和F01缓冲恢复。初次因最终落点浮点差失败，随后终点直接使用原落位，原失败另记。
- Impeccable目标检测`[]`，范围差异无空白错误；最终控制台error列表为空。
- 同一最终包桌面/390px五态与近方里程碑，正反、中段停滚/暂停、跨卡快滚、右上The Wall直达、墙刷新、Someone离页返回、首屏恢复、quiet墙内容已留原图/DOM样本。原始汇总59份，最终包24份；其他包为首检与必要修复历史，不冒充最终全绿矩阵。
- 首检空窗的玻璃帽面硬对角被集中修正为沿同一实体侧面/倒角的透明空腔；原先右上入口被Astro接管重载也已修正。随后必验Someone返回与刷新分别暴露旧位置恢复，做了两次有界功能修复；相关失败样本保留，追加构建只用于这两项实际缺陷，不另做可选美术。

详细原图、实际阶段、超时/采集误差与重现步骤见[工程证据](../../design/iterations/evidence/f02-brick-assembly-2026-10-14/implementation/README.md)。390px是模拟视口；不承诺实体手机帧率。OS减少动画切换、无HDR设备、BFCache/context loss未专项重测。修正交付时的冻结元数据/执行者记录保留当时状态，后续结论见下节。

## 独立复核后收束

同日设计侧完成[限定范围独立复核](../../design/iterations/evidence/f02-brick-assembly-2026-10-14/independent/README.md)，结论通过，待用户验收。实际4342包及18份源码/测试哈希与冻结清单一致；两端共23份独立原图/JSON确认成方后首落、底部累积、铺屏/阅读、正反同进度、暂停保持、The Wall锚点/刷新、Someone后退恢复、首屏玻璃/柔晕与无残砖，控件未再见分段反色。

独立记录保留早采阶段偏差、0 error/6 warning及OS减少动画、真机、BFCache等未测边界；未扩大到所有栏目或留言业务。工程与独立证据分开，本次仅同步文档，没有新增源码修改、测试、构建或采集。候选及预览服务保持，等待用户实际反馈；不写用户审美通过，不开始F03。
