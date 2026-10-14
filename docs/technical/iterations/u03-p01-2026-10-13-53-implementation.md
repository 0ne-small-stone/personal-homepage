# P01 · F01 首页光谱传输集成

日期：2026-10-13。范围：P01 / R12 / U03、U14 / T03.05、T26.02、T27.01。只将已在独立样本通过门槛的光谱传输接到当前首页；未推进全屏展开、加载揭幕或其他首页功能。

## 实现

- 抽出 `src/components/home/prism-geometry.ts` 作为首页棱镜的共享几何入口，`GlassTriangle` 和传输渲染共用同一几何。新增直接依赖 `three-mesh-bvh@0.8.3`，用于真实三角界面求交。
- 新增 `src/components/home/SpectralTransport.tsx`，由实际棱镜变换、共享几何、光源、接收面和首页相机驱动。光学合成复用首页现有 Three renderer/context；首页仍只有一个 Three Canvas，不覆盖独立 demo。
- `src/lib/home-optics/` 接入光谱、源侧和观察侧计算、BVH 加速、Worker、分阶段渲染与生命周期管理。采用熔融石英20°C Sellmeier色散模型和CIE 1931/D65加权；以16个谱段、每谱段64个同源有限源样本求解。Worker处理源侧行数据，GPU按实际界面追踪Snell/Fresnel/TIR和观察路径，介质采用单散射近似，接收面累积到线性XYZ后合成。
- 先显示8谱段预览，再补齐16谱段。姿态变化使旧结果失效；停稳后渐进计算并在 `stage=done` 停止该轮光学工作。暂停或减少动态偏好不阻止当前姿态的静态计算。隐藏页面和章节离开会停止/取消当前光学工作。
- `BlackFlowLayer` 在同一合成器中显示光谱结果，顺序位于世界光路和前景卡片之间。`GlassTriangle` 不再挂载旧 `PrismBeam` 七色投影带，`GlassOptics` 移除RGB通道错位；其底层屏幕空间环境折射近似仍在。
- 为避免首屏姿态持续改变并不断作废采样，移除 `works_intro/works` 段的自动自转；指针与滚动旋转输入保持。移动设备模拟通过，不等于真机帧率验证。
- 浮点颜色缓冲或线性浮点过滤扩展不可用时，不启用光谱 overlay，页面其余内容仍可浏览。当前 IAB 实际环境支持两项扩展，`MAX_DRAW_BUFFERS=8`。

## 工程验证

- `npm run check`：88个文件，0错误、0警告、0提示。
- `npm run build`：成功生成15个静态页面并生成 Pagefind。保留 Astro `/404` 路由优先级提示及 Vite 大chunk提示；本次产物中 `Lightformer` chunk 为 1,035,522 B，`HomeJourney` 岛为 265,568 B，光谱 worker 为 195,318 B（均为未压缩构建文件大小）。
- `node --test tests/prism-ray.test.mjs`：14/14通过；测试直接导入UI/光学共用几何。
- React组件和 Worker 的 esbuild 独立语法打包成功。
- 生产首页由本地预览实际打开：桌面与390×844 CSS px下均为一个 Canvas，`spectralStage=done`、无 `spectralError`、无横向溢出。暂停、恢复、单次指针操作、项目区退出/返回和窄屏状态另由独立设计核查，原图及操作见[设计复核](../../design/iterations/evidence/f01-home-review-2026-10-13/README.md)。
- 一次390×844 CSS px生产路由重载到 `stage=done` 约9.56秒。这个值包含整页加载、JavaScript与着色器编译等启动开销，不是单独的光学收敛时间、统计样本或跨设备承诺。另在1280×720 IAB暖态桌面做过一次约60 CSS px的指针拖动；释放后429ms内连续三次读到`stage=done`，采样间隔100ms，仅为一姿态样本，不能外推极端角度/手机性能。真实冷启动拆分、真实手机、连续高速拖动、系统 `prefers-reduced-motion`、所有路由生命周期和失败降级尚未完整验证。
- 当前生产页控制台未见页面错误或`spectralError`；仍有既有 `THREE.Clock` 弃用提示及 `Lightformer` shader编译警告，工程上未归因于新增光谱路径。

## 实际入口与状态

- 本机生产预览：[首页](http://127.0.0.1:4342/personal-homepage/)。服务在当前开发环境运行，不是远程发布或部署。
- `HomeJourney.IFR9F3Dv.js`，SHA-256：`38a0b5815948be9faa7887d1157c82d6c43b246d9ec250b161e4eec5675c4c30`。
- 设计侧实际查看桌面首屏、暂停后收敛、继续/指针输入、章节退出、回首页与390px窄屏，允许作为用户验收候选。玻璃边缘留有少量颗粒亮点，保留用户审美判断。
- 物理模型是有限采样的16段离散光谱和单散射近似；并非无限连续谱、完整无偏路径追踪或全玻璃环境精确折射。`GlassOptics` 的屏幕空间基底折射仍保留。
- F01当前状态：待用户验收。F02及其他首页功能均未开始；F01用户通过前不推进下一功能。
