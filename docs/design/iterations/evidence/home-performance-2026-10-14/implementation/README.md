# 首页性能修正 · 实施证据

2026-10-14，P01 / R12 / U03、U05、U14 / T03、T27。用户反馈“首页有点太卡了 你优化”。本片降低运行浪费，保持外观与功能；F05另片。

## 当前产物

<http://127.0.0.1:4342/personal-homepage/>，HomeJourney.DkmdTjgT.js / 1,185,142 B / SHA256 `49D504E588813EE4B2F84CED44C1833E4D9E2927DDBB46870D2962D368105AF5`。[31源哈希](frozen-candidate.json)，相对BdZlSJh6原28源22保持/6修改+3新增。无新依赖/Canvas/Renderer/targets；F03/F02和三卡保持，未提交/部署。

## 定位与集中修正

- before-idle.json：原版静止25.257s，frame1497→2757，增加1260场景帧；不是整页CPU或真实设备基准。
- l-HEct64首候选：after-idle.json中51.378s场景/renderer帧增量均0；但长间隔保护误用于活动慢帧，工具节流下拉长动作，修正为只处理停止后的首次恢复。早期记录保留。
- BubbFPep：有效dt修正，final-idle.json中50.182s增量均0。随后活动改为原always时钟、静止demand。BGcNcxAV完整墙已停止透射捕获，但隐藏玻璃尾巴参与稳定判断；最终DkmdTjgT只跟踪可见玻璃，解决该浪费。
- 没有简化材质/光晕或改变DPR、AA、透射样本/分辨率；F03临时纹理仍由原生命周期管理。目录/可见性/语义属性改为变化时提交。

## 浏览器证据

png为直接tab截图；json先读状态再截图，非原子/非录像。browser-samples.json汇总不同候选，按scripts识别所属包。后台tab24后换可见tab25，仍观测约1s调度delta；不能当成实际用户设备FPS或保证60FPS。未清空用户sessionStorage。

| 最终样本 | 实际观测 |
| --- | --- |
| release-wall | 1280×720，完整130砖、build1/coveredtrue；mode=demand/runningfalse、transmissionVisiblefalse |
| release-paused | 暂停后控件为“继续动态”、mode=demand/runningfalse；恢复后输入有效 |
| release-reverse | 原生上滚2.5页到portal/expand约.833，玻璃材质重新可见，中间姿态收敛后停绘制 |
| release-mobile-wall | 390×844（内容375px），墙入口/刷新后完整162砖、build1/coveredtrue，mode=demand/runningfalse、透射false |
| release-idle.json | 最终DkmdTjgT窄屏墙静止231.331秒，场景帧和renderer帧增量均0 |
| release-return | 实际进入英文Someone后后退，恢复wall/scrollY9806、requested=false，无揭幕；首次路由完成前误点back产生hash历史偏移，不能当完整hash/焦点复核 |
| release-mobile-opening / release-quiet | 本机手动seek p=.55及完成入口可用；quiet模拟直接可读，mode=demand/runningfalse。不是自然时序录像或实际系统偏好测试 |

其余加载/返回/静止样本以实际汇总为准。早期delivery-paused是React提交前的活动样本，不代表暂停终态；不同候选不得混称最终全套回归。

## 工程与边界

tests-confirmed.log 20/20：4项帧策略及原F03/F02测试；check-delivery.log 115零诊断；build-release.log 15HTML/Pagefind。首次CLI路径、受限source-map-js与材质ref类型错误均留日志，正常环境最终通过。8相关源检测[]，后续HomeFrameLoop功能修正定向检测[]；检测不替代审美/性能验证。旧chunk/404构建提示保留。

真实GPU耗时、实际触屏/真机、系统减少动画、隐藏/BFCache专项、长时间内存压力、生产网络/部署未测。opticsDebug诊断仅为本机验证；空闲停绘制不等于消除所有活动GPU成本。独立设计与用户确认另记。工程记录见 `docs/technical/iterations/p01-2026-10-14-performance.md`；性能候选固定后供已授权F05接续，不记为F05完成。

最终普通入口已打开并保留，viewport临时覆盖已reset。release-home-early.png在ready属性出现后、图形呈现前取得黑场，保留为采集时差；随后实际确认玻璃/柔晕与背景存在，release-home.png为呈现后画面，未因此修改应用。控制台记录0 error/13 warn（旧Clock/编译精度提示）。
