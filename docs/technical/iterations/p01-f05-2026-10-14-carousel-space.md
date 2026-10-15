# P01 F05 · 连续轮播背景空间

2026-10-15 主站集成与发布状态见[本轮验收](../acceptance/home-performance-2026-10-15.md)；以下未提交/未部署与固定包为原候选阶段快照。

2026-10-14 / R12 / U03–U06、U14 / T03.02、T26.02、T27.01。工程与执行者检查完成，冻结待独立设计复核及用户体验；F06/F07未启动。

## 复用与实现

直接基线为性能DkmdTjgT。原SceneBackdrop平面/CanvasTexture与原Three/GSAP继续使用；ShaderMaterial在同一平面内合成原序章、低亮远格、解析曲面网格和宽缓中性光域。没有新依赖、图像资产、Canvas、Renderer、target、合成pass或常驻ticker；纹理只在尺寸/设备变化时重建，卸载释放纹理/材质。场景层次和卡片/相机/吸附源码保持。

backdropState从真实workCount和既有rendered.index/intro/prepare、raw.outro推导连续可逆状态；全部可校准强度由此写入uniform。输入颜色在显示编码中控制上限，再转回线性辐射，沿用Three的输出转换；Drei玻璃捕获不二次转成显示编码。设计值归SYSTEM9.2.7。

首次检查发现既有玻璃慢回正可独自维持轮播几分钟的帧。在原性能时钟内，输入唤醒窗口跟踪玻璃惯性；其后仍跟踪相机/章节/窗口实际收敛，最终冻结当前姿态，后续输入重新唤醒且不补算空闲时间。未修改玻璃材质、尺寸、交互系数或卡片路径。诊断追加真实cards/camera坐标，仅opticsDebug生效。

## 固定版本与验证

4342/HomeJourney.BNuf11DH.js，1,188,708 B，SHA256 `9CEDA3C79445602902E5038F3682A6B0781F8B50A361D89F076239406B9773F6`。相对性能31源5变化/26保持，补录3文件（SceneBackdrop已有文件、本轮状态函数/测试），共34源；相对F03原28源6变化/22保持。两层差异及完整哈希见[清单](../../design/iterations/evidence/f05-carousel-space-2026-10-14/implementation/frozen-candidate.json)。

24测试、最终check122文件零诊断、16HTML/Pagefind成功。119→122检查文件及15→16路由包含共享目录其他负责人的变动（如zh/about）；本轮没有代改这些栏目。原构建chunk/404提示保留。

一次桌面/390px集中图检、一次功能修正后定向确认：三卡与连接、原生换向、暂停、实际Someone返回、墙收束/覆盖、F03受控揭幕、quiet模拟与普通浏览。手机轮播静止114.278s场景/renderer帧增量均0，首次滚轮已唤醒；不是GPU耗时/真实手机FPS保证。原始图/状态、不同候选和采样限制统一见[实施证据](../../design/iterations/evidence/f05-carousel-space-2026-10-14/implementation/README.md)。未提交/部署。
