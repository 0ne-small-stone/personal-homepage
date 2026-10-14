# F02 落砖修订 · 工程原图与固定候选

2026-10-14，P01/P14 · U05 · T03.04。执行者完成实现与本机自测，**待设计侧独立集中复核，用户未验收**。旧BZgdJJ3A的独立通过仅为历史。

## 固定候选与使用

- 体验：`http://127.0.0.1:4342/personal-homepage/#links`，由04末卡慢滚，接近方形后看砖从上缘进入、底部向上累积；继续铺屏/砌完，再反向收回或点00。
- 实际bundle `HomeJourney.B2R4dj4a.js`，1,171,887 bytes；SHA-256 `81658B934A2B272E11FA9B35E79E645F22283E67576705BEC47962B5A2ABB27C`。
- `frozen-candidate.json`登记实际URL、18份源码/测试哈希（15份本片修改、3份保留关联源）、命令结果与未提交/未部署。没有启动新预览或修改其他栏目来源。
- 浏览器采集已结束，临时标签关闭，390px视口reset。固定产物与源码随后不再修改，不开F03。

## 同一最终包的五态

原PNG及对应`sample-<名称>.json`放在本目录。下表采用DOM的实际进度；墙诊断和截图有短间隔，不当成原子同帧。

| 状态/文件前缀 | 桌面1280×720 | 模拟390×844 |
| --- | --- | --- |
| 无砖 `deliver-*-a-empty` | y5932，e=.3，build=0 | y6936，e≈.299763，build=0 |
| 近方 `deliver-*-square` | y6105，e≈.420139；CSS460.94×460.90px | y7139，e≈.420024；CSS240.01×240.02px |
| 首批可见下落 `deliver-*-b-first` | y6300，e≈.555556，build≈.054185；9砖在落 | y7307，e≈.519550，build≈.030029；6砖在落 |
| 局部累积 `deliver-*-c-building` | y6688，e=.825，build≈.383766；27落定/18在落 | y7780，e≈.799763，build≈.345656；42落定/10在落 |
| 全屏仍在砌 `deliver-*-d-fullscreen` | y7048，e=1、w=.15，build≈.761322；72落定/15在落 | y8244，e=1、w≈.149289，build≈.760841；102落定/11在落 |
| 完成 `deliver-*-e-reading` | y7660，e/w/build=1 | y8962，e/w/build=1 |

完成时897实例全部位于原目标坐标；这个计数含画幅外实例，不说897块全部在屏内。方形数值来自portalQuad和实际Canvas画幅1265/375px（去滚动条），不是PNG外框宽度。首落逻辑门槛保持e=.42，砖先位于上缘外；表中“首批可见”是取到可辨砖的采样位置，未测精确第一像素出现时刻。

未砌区为暗色/透明，几何、倒角和侧边共同成方，砖行保持水平、比例等比。最终墙组始终[0,0,-1]；阅读前DOM内容`visibility:hidden`且inert，完整砌成/覆盖后才可读可点。窗口缓存读取instance revision，非静态旧墙图。

## 功能与返回

| 路径 | 最终包证据 |
| --- | --- |
| 中段停滚 | `deliver-desktop-c-building`→`deliver-desktop-mid-stopped`，实体revision439保持，target更新至439后保持；不继续自动落砖 |
| 过场暂停 | `deliver-desktop-paused`、`deliver-mobile-paused`保留对应中段pose/build/实例；继续后走原进度。早期集中修正包另有`confirm-mobile-paused`和`confirm-mobile-pause-held`连续原图，保留为历史，不冒充新包 |
| 正反同位 | `deliver-desktop-reverse`回y6688、e=.825、相同build/27+18；`deliver-mobile-reverse-mid`回y7780、相同build/42+10 |
| 快越与直达 | 最终桌面从序章连续跨卡滚至y5932；右上The Wall入口保留调试query并由共享滚动到y7660，见`deliver-desktop-e-reading`；没有旧路由重载/静态回退 |
| Someone往返 | `deliver-desktop-someone-return`恢复y6688、相同build/实例；`deliver-mobile-someone-return`恢复y7780，焦点回Someone |
| 墙刷新 | `deliver-desktop-wall-refresh`保持y7660；`deliver-mobile-latest-wall-reload`在有旧中段历史快照时仍读最新y8962，不退回y7780 |
| 首屏恢复 | `deliver-desktop-intro` / `deliver-mobile-intro-restored`，prepare/expand/wall/build=0、scale=.5、无残留砖；同一F01几何/玻璃/柔晕保留 |
| quiet稳定阅读 | 首屏“暂停动态”进入已有quiet后点05，`deliver-quiet-wall`内容可读且非inert，没有落砖。该样本没有motion JSON，正常；OS减少动画开关未实际切换，不把此样本当OS偏好专项通过 |

所有最终采样无水平溢出。胶囊背板`rgb(31 31 31 / .96)`、浅字、转场`mix-blend-mode:normal`；最终阅读整体交灰字。实际控件样式写在单样本nav字段。没有宣称全站逐像素可访问性合规或F06完成。

## 工程命令和资源

- `final-check.log`：105文件、0 errors/warnings/hints。
- `final-build.log`：15页/Pagefind成功；保留原chunk/404提示。
- `confirm-tests.log`：必要逻辑8/8。首批测试浮点末点误差失败，随后直接采用原落位修正，见下面原始失败记录。
- `detector.json`：Impeccable目标检测`[]`；在集中视觉修正后运行一次。其后两次仅修实际返回缺陷，没有再做可选美术。
- `console.json`保留同一临时标签历史warning，error列表为空。
- 单Canvas/Renderer/RAF，原墙target/HDR上限保持；增加一个与砖同矩阵的InstancedMesh承托片，没有完整背板、新目标、新素材下载或依赖。矩阵每组57,408 bytes、两组114,816 bytes；静止/完全落定key不变，不重新上传。

## 初检失败与采集边界

- CGkAKIdJ首检：无砖空窗原帽面产生硬对角明暗，随后集中抑制展开帽面、保留同一侧面/倒角与柔边。首落序列保证参与列内有零延迟实例，并将上缘外距离由.7校准为.4；本机采用值见SYSTEM9.2.5。
- 首检右上入口被Astro先接管，离开调试query后出现home-static。随后同页章节capture处理；未称第一次直达通过。
- DtZIxfp-集中确认暴露Someone返回y4320而非y7780（`confirm-mobile-someone-return`）。CSkMOuoJ修返回后，刷新仍读历史中段y7780而非最新墙y8962（`final-mobile-wall-reload`）。分别修capture保存/历史识别、reload最新存储优先；必要追加构建和最终同位置复现通过，不删失败原图。
- 第一版采样助手读IDL inert返回undefined，打印的`readable:true`无效；早期样本只采纳实际visibility/原图，后改为getAttribute('inert')，最终24份均使用新助手。
- 暂停最初按AX“checkbox”定位超时，实际DOM为button/aria-pressed，随后按真实DOM点击。read-only评估performance.now不可用、助手最初误用9.5H作为expand起点、刚恢复时读取旧scrollY以及过早等待精确Lerper值均造成工具超时；这些是采集错误，不写测试全绿，也不靠重复采图改变实现。详情见`failures.md`。
- `browser-samples.json`原始汇总59份，其中B2R4dj4a最终24份，另有对应逐样本JSON/PNG。不是视频或全部中间帧，含首检、集中修正、返回修复包的真实历史。portal诊断40ms节流，可落后instance revision；停滚补读后相符。直达完整墙可有portal=null，真实墙无需窗口target。

模拟视口不是实体手机；本轮未测FPS、HDR回退设备、BFCache/context-loss专项。OS减少动画只保留代码路径和quiet代理检查，普通浏览未在最终包主动触发WebGL失败；既有静态内容/清理路径保留。留言仍暂未开放。独立设计和用户审美尚未验收。

[工程范围和源码清单](../../../../../technical/iterations/p01-f02-2026-10-14-brick-assembly.md)。
