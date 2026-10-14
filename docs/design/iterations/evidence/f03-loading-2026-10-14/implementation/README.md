# F03 加载与同一场景揭幕 · 实施证据

2026-10-14；P01 / R12 / U03、U14 / T03.01、T26.02、T27.01。**工程完成、候选冻结，待独立设计复核与用户体验。**设计参数归 SYSTEM9.2.6，施工卡为 `../../../f03-loading-reveal.md`；本目录不代表独立验收。

## 固定产物与体验

- 正常入口：<http://127.0.0.1:4342/personal-homepage/>。本会话已访问不会重播；不要为演示清空用户存储。
- 本机受控入口：<http://127.0.0.1:4342/personal-homepage/?opticsDebug=1&loadingPreview=1>。点击“开始揭幕”播放；“轮廓”“展开”“完成”可定位阶段。仅 localhost/127.0.0.1 激活，不是生产默认等待行为。
- 包：`HomeJourney.BdZlSJh6.js`，1,183,026 B，SHA256 `29864AAAD7A24D0053800A5B73601B235628177E7429BFFE3DC6D702A204D46A`。28源文件哈希见 [frozen-candidate.json](frozen-candidate.json)。直接基线 h39_FOLj；23原源中18未变，5修改；另5文件首次进入清单。原字标、三卡 album→radio→projects、单砖.85、上垒与底边遮罩保持。无提交、PR或部署。
- 实际4342复用既有生产预览。Someone所属者的新 `/about/` 源码已随本次全仓构建进入主站，现场见 `someone-live.png/txt`；本轮未修改/复制简介源码。主站 `/gallery/` 仍旧占位；独立4352照片样本的整合继续归栏目负责人。

## 实施与运行成本

1. `HomeLoadingGate`分开准备与完成：布局触发器安装、批准字标解码、GL编译、原渲染链实际draw成功四个门槛全部到齐才揭幕，无百分比、最短等待或帧数冒充就绪。
2. 复用同一字标DOM、同一玻璃几何与已有Gaussian覆盖；以原玻璃y范围控制柔边形成。原world→玻璃/柔光→portal→cards完成后复制最终默认画布，再做一次有限UV采样。900ms是名义时间线，不是保证的网络/墙钟总时长。
3. 单Canvas/Renderer；仅揭幕活跃时分配一张全drawing-buffer尺寸RGBA8 FramebufferTexture和一个FullScreenQuad。采样最终已编码画布，NoColorSpace、toneMapped=false，不二次色调映射。结束/跳过/降级时移除额外绘制并销毁临时纹理/材质/quad。无反馈target、指针流场、物理层或常驻新增后处理。

纹理内存随实际drawing buffer和DPR变化：本次1265×720约3.64 MB，375×844约1.27 MB（仅RGBA8纹理，不是整个页面/GPU总占用）；没有宣称大型屏幕固定上限或真实手机帧率通过。自然首访 copies137，慢释放 copies153；ready均active=false、disposed=true、size=[]。副本数是本次渲染次数，不是性能基准。

## 浏览器记录与观测

[browser-samples.json](browser-samples.json)共33组直接截图+随后DOM状态，25组属于最终包、8组属于初候选BTFoLron。采集非原子，静帧不能证明所有中间帧；`sample-*.json`保留每组URL、视口、bundle、门槛/时序、玻璃UUID、运动与销毁状态。直接tab screenshot，未采用可能缓存的native截图。最终视口恢复1280×720，临时采集tab关闭。

| 范围 | 实际结果与限制 |
| --- | --- |
| 桌面1280×720 / 窄屏390×844四态 | final-*-waiting/outline/opening/ready共8份原图已看；无横向溢出，始终wordmarks=1、canvas=1。每台四态glassId/geometryId一致；字标矩形桌面(8,213.734375,396.796875,264.53125)、手机(-17.59375,504,312,208)各态不变；负x是既有位图透明留白。轮廓p=.16、展开p=.55为本机手动seek，不冒称自然实时连续录影 |
| 正常首访/刷新 | normal-visit无preview：waiting86.2→revealing576.7→ready1397.1ms，实际揭幕约820.4ms；快资源无强制等待。normal-reload requested=false、copies0，无重播 |
| 栏目返回 | 真实点击Someone、浏览器后退；normal-return back-forward恢复#album、scrollY1719、requested=false、copies0；未另采焦点状态，不宣称完整焦点复核 |
| 取消 | final-skip-waiting和final-skip-running分别等待/真正运行时间线点击普通浏览；终态fallback、不被晚回调复活，运行跳过copies53/销毁true。第一次候选mobile-skip的旧active诊断未清理，最终清理修正保留原记录 |
| 慢资源模拟 | loadingPreview=slow：实际decode后延后2200ms释放门槛；不是网络节流。waiting69.2→revealing2286.4→ready3189.8ms，揭幕约903.4ms，无额外最低等待 |
| 超时与重试 | loadingPreview=timeout扣住字标门槛，实际8s timer从waiting67.5到error8069.6ms；静态可读/可重试。实际点击一次重试，新gate/Canvas启动，随后离页取消；未测试重试成功或第二次超时后按钮消失 |
| 失败与减少动画 | failure在真实解码成功后注入失败，静态fallback；不是图片404。reduced用localhost限定开关走quiet源路径，requested=false、copies0；不是实际系统偏好开关实测 |
| F02保留 | final-projects-regression末卡，final-wall-regression完整墙；真实反向scroll到portal、再正向完整墙。最终desktop drawn=settled=130、falling0；手机direct-wall/刷新不揭幕，保持小砖与直达阅读 |

若干CUA状态等待先返回工具deadline（slow/timeout），后续实际状态达到ready/error；不得把工具时限写成应用错误。控制台记录仅Clock弃用与初候选shader精度warn，没有error；原始 `console.json` 保留。现有构建404索引/大chunk提示未消除。

## 工程命令与修正

- `node --test tests/home-loading.test.mjs tests/home-motion-ranges.test.mjs`：最终16/16；5项覆盖门槛/首访策略/取消晚回调/销毁/quiet，11项覆盖F02。原tests.log中Node strip-only参数属性失败已改为普通属性赋值；后续confirmed/final日志不覆盖失败。
- `npm run check`：最终113文件0 errors/warnings/hints。初check.log中diagnostics copies shorthand错误已改为this.copies，原日志保留。
- `npm run build`：最终15页面、Pagefind成功。`final-build.log`真实退出成功，未新加依赖。
- Impeccable对8个相关UI源码单次最终detect结果 `[]`；10源/test的git diff --check通过，仅既有LF→CRLF提示。检测不等于审美验收。

## 未测范围与下一步

实际OS减少动画、禁JS、真实网络/图片解码失败、隐藏恢复/BFCache/GPU context-loss、键盘Tab完整焦点路径、真实手机性能、重试成功及每帧录像未实测；源实现相关清理/降级，不将代码路径当运行证明。桌面→手机waiting阶段resize已实际采样，其他中途resize未扩大验证。

冻结到本候选，交设计独立复核/用户体验；F05/F06/F07未启动。独立证据放相邻independent目录，反馈只在F03内修正。
