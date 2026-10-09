# 首页行为采集

33A首批原始无WebGL建图错误判据保留。`LSSH_QA_FALLBACK_ONLY=1 LSSH_QA_PHASE=confirm node tools/qa/p01-width.cjs` 仅确认故意禁WebGL的预期context错误分类及真实Becoming进入/后退；非预期错误要求0。证据目录已存在时脚本拒绝覆盖，不为此项重跑已通过的静态/输入批次。

`node tools/qa/p01-width.cjs` 为33A一批旧/新实际构建对照；旧32 dist预存 `.ci-tmp/p01-33a-baseline/dist`。五个同视口/DPR/相机/姿态/进度状态覆盖桌面和390px首屏/intro及一次桌面35°斜转，固定时钟/四元数仅在测试页面。记录实际形状与孔的点界、倒角/厚度、投影宽高与手机缩放，桌面中性图比较轮廓之外像素。另以原生时钟对两构建发送相同指针/滚轮，检查停手、反向与轮廓；候选真实暂停/项目后退、减少动画/无WebGL抽查。需已有Playwright、PNGJS和Chrome，不重跑全套流体或性能测试。

`node tools/qa/p01-identity.cjs` 为第32轮一次桌面/390px、正常/减少动画身份检查。保存首屏、intro中点和首卡共12张图，实际measureText安全宽度、首页品牌节点/空命中、三入口居中与44px目标、语义h1、项目Afterimage、真实项目返回与00焦点交接分别记录。正常模式不覆盖姿态、时钟或相机；减少动画使用普通阅读，不虚构动画峰值。输出位于第32轮evidence的initial；不要为本轮重跑全部流体求解。

P01 / T03.02 的人工验收辅助，不纳入 CI。需自行提供 Playwright 模块与 Chrome 路径；应用没有新增浏览器测试依赖。

在项目根目录运行已构建的 `/personal-homepage/` 预览（4321），设置 `LSSH_QA_PLAYWRIGHT` 为可加载的 Playwright 模块路径、`LSSH_QA_BROWSER` 为 Chrome 可执行文件。未设置时使用 Node 原生模块查找和 Playwright 浏览器。

- `node tools/qa/p01-first-card.cjs`：同视口原站/本站多点、边界、CDP 真实滚轮及静态布局。
- 设置 `LSSH_QA_FINAL=1` 再运行：只对最终本站构建采集相同协议。
- `node tools/qa/p01-first-card-boundaries.cjs`：精确中点、1449/1451 和 1900/1675 的真实切页返回门禁。
- `node tools/qa/p01-visibility.cjs`：第 22 轮身份退出及 CTA 自身门禁。`LSSH_QA_PHASE=before` 采修复前点位和延迟状态，`after` 批量检查桌面/手机、真实探索点击、焦点阈值、滚轮反向、首卡返回及降级，`confirm` 只确认延迟期取消、重入和真实 Tab。结果写入第 22 轮 evidence；`LSSH_QA_URL` 可指定预览地址。进入 trace 从实际激活时刻计时，每个浏览器 RAF 读取自身及祖先透明度，不把请求时间或截图当作相同动画相位。
- `node tools/qa/p01-four-cards.cjs`：第 24 轮四停驻点（桌面/手机）、正反向真实滚轮、第二/第三中心吸附、新输入中断、音乐/相册/网站真实路由返回和静态降级。结果与截图写入第 24 轮 evidence；首次结果保存在 `checks-initial.json`，修复后的确认结果为 `checks.json`。逐帧时间为实际读取时间，返回截图在曲面卡片追随收敛后采集。
- `node tools/qa/p01-return-state.cjs`：第 27 轮最早可见场景与布局门禁，覆盖无 hash 实际滚轮、目录 hash、连续返回、reload、手机/改变视口、直接 hash；并抽查普通追随、CTA、吸附中断、减少动画/无 JS/素材失败。逐帧诊断和独立 RAF 的 DOM 可见性读取均保存，不以延长等待截图掩盖首帧问题。截图工具执行时间单独记录，不叫 GPU 第一帧。
- `node tools/qa/p01-glass-color.cjs`：第28轮 `LSSH_QA_PHASE=before/after` 在对应实际构建采集同姿态两桌面视图；after另采原生时钟/姿态的手机页面。只读probe与唯一四元数锚点匹配失败即停止。随后运行 `p01-glass-color-compare.cjs`，`LSSH_QA_PNGJS` 指向可加载PNG模块，读取原PNG比较玻璃外全部像素、指定面内区域及材质/renderer实际状态；不新增应用依赖。比对两份主包分别记录哈希，其他实际非HTML资源须相同。
- `node tools/qa/p01-glass-rotation.cjs`：第29轮真实指针、滚轮、触摸、暂停/继续和相册返回；原站插只读旋转探针并核对固定SHA。两站在每个原生浏览器RAF时间戳上统一推进1000/60ms测试时钟（RAF/performance/Date），用于约60Hz行为对照；保留实际墙钟与收到的事件，不冒充真实60FPS。顶部/区域/阶段/滚速/生命周期连续记录写入第29轮`initial`，唯一修复确认设`LSSH_QA_PHASE=confirm`。原站GL返回值是delta数值，确认轮直接读回；源Date整数精度差异保留。确认轮增加纵移叠加阶段切换的判别，核验先注入、读旧w、再衰减；首轮错误顺序不视为允许偏差。隐藏/显示是document.hidden模拟，暂停和导航为真实控件操作。减少动画另用原生时钟检查。原站外部网络错误原样保留并分类，本站脚本错误要求0。
- `node tools/qa/p01-black-flow.cjs`：第30轮五组黑场流体检查，初批与`LSSH_QA_PHASE=confirm`唯一确认分别保存。先将实际29 `dist`复制到被忽略的`.ci-tmp/p01-30-baseline/dist`，脚本为它启动临时只读静态服务器，不能用新管线bypass冒充旧构建。原生快100ms/慢1000ms路径使用排队CDP事件，保留真正收到的耗时；停手0/250/1000/2000ms为实际定时请求，每份PNG与GPU读回记录当帧收到时间。软件GPU可能跨帧延后，不改时间标签冒充精确毫秒。另有逐原生RAF推进1000/60ms的受控输入比较，逻辑时间与物理耗时分列。零场固定姿态/时钟仍走完整复制合成；半透明layer1另隔离于黑底判形状，实际CTA导航单验。隐藏与浮点能力为故意模拟，手机为CDP触摸；真机另验。需要`LSSH_QA_PNGJS`，没有新增应用依赖。

结果写入设计迭代 evidence 对应目录。原站读取主包并核对固定 SHA-256；只插入状态读回，不改变其渲染。原站版本改变需重新研究并修探针，不能忽略校验。正面测试控制仅作用于独立测试页面，不进入产品。

第30轮经设计侧明确授权，只补验未通过的颜色、前景、返回和能力后备：`LSSH_QA_TARGETED=1 LSSH_QA_PHASE=targeted`，不重跑已通过的原生快慢路径。`LSSH_QA_CLOSURE=1 LSSH_QA_PHASE=resource-closure` 仅采预热基线和三次真实音乐栏目返回，每处至少六个不同帧、跨度900ms以上、四张卡片图均已解码；记录所有原始计数，不以固定等待代替窗口。`node tools/qa/p01-black-flow-closure.cjs` 只读 retained PNG/窗口，归因首屏独立SVG箭头差异与非持续资源增长，单独输出 `closure-analysis.json`；不得重写原fail结果。原站受控60Hz检查及原生输入检查分开查阅，不是软件GPU实际60FPS。

`node tools/qa/p01-outro.cjs` 为第31轮单批末卡退场检查，旧构建来自归档30的dist，预先复制到 `.ci-tmp/p01-31-baseline/dist`。两构建真实目录进入links后收到相同8个trusted wheel delta，连续正反向跨5500/5950/6010；原生时间和实际镜头/墙/玻璃状态分别保存。另读outro0/.5/1的实际投影矩阵与逆、视差和锚点，以及真实留言锚点、Becoming后退、刷新、resize。设置 `LSSH_QA_CONFIRM=1 LSSH_QA_PHASE=confirm` 只确认首批失败的末点完全收敛/返回渲染探针，不重跑已通过的滚轮。采样必须等新的renderer引用有效；严格目标0判据等追随器自身snap，不能在1e-6尾差时声称已到0。原始失败与截图请求前后状态保留。

CDP 请求表、浏览器收到的输入、逐帧状态与画面帧分别保存。SwiftShader 和模拟布局不能证明真机流畅度。画面帧收到后的读回不视为 GPU 同时刻；保留原始时间。第 19 轮精选可体验证据见 [交付记录](../../docs/design/iterations/u03-p01-2026-10-08-19.md)。

第 22 轮原始 before 采集保留了一条负的 RAF 相对时间（RAF 时戳早于当帧变更微任务）；其 `time` 是实际读取时间。修复后与确认脚本统一用 `performance.now()` 计算 elapsed。前后只对照状态与实际滚动点，不宣称毫秒对齐。
