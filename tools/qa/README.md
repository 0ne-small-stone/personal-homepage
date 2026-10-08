# 首页行为采集

P01 / T03.02 的人工验收辅助，不纳入 CI。需自行提供 Playwright 模块与 Chrome 路径；应用没有新增浏览器测试依赖。

在项目根目录运行已构建的 `/personal-homepage/` 预览（4321），设置 `LSSH_QA_PLAYWRIGHT` 为可加载的 Playwright 模块路径、`LSSH_QA_BROWSER` 为 Chrome 可执行文件。未设置时使用 Node 原生模块查找和 Playwright 浏览器。

- `node tools/qa/p01-first-card.cjs`：同视口原站/本站多点、边界、CDP 真实滚轮及静态布局。
- 设置 `LSSH_QA_FINAL=1` 再运行：只对最终本站构建采集相同协议。
- `node tools/qa/p01-first-card-boundaries.cjs`：精确中点、1449/1451 和 1900/1675 的真实切页返回门禁。
- `node tools/qa/p01-visibility.cjs`：第 22 轮身份退出及 CTA 自身门禁。`LSSH_QA_PHASE=before` 采修复前点位和延迟状态，`after` 批量检查桌面/手机、真实探索点击、焦点阈值、滚轮反向、首卡返回及降级，`confirm` 只确认延迟期取消、重入和真实 Tab。结果写入第 22 轮 evidence；`LSSH_QA_URL` 可指定预览地址。进入 trace 从实际激活时刻计时，每个浏览器 RAF 读取自身及祖先透明度，不把请求时间或截图当作相同动画相位。
- `node tools/qa/p01-four-cards.cjs`：第 24 轮四停驻点（桌面/手机）、正反向真实滚轮、第二/第三中心吸附、新输入中断、音乐/相册/网站真实路由返回和静态降级。结果与截图写入第 24 轮 evidence；首次结果保存在 `checks-initial.json`，修复后的确认结果为 `checks.json`。逐帧时间为实际读取时间，返回截图在曲面卡片追随收敛后采集。
- `node tools/qa/p01-return-state.cjs`：第 27 轮最早可见场景与布局门禁，覆盖无 hash 实际滚轮、目录 hash、连续返回、reload、手机/改变视口、直接 hash；并抽查普通追随、CTA、吸附中断、减少动画/无 JS/素材失败。逐帧诊断和独立 RAF 的 DOM 可见性读取均保存，不以延长等待截图掩盖首帧问题。截图工具执行时间单独记录，不叫 GPU 第一帧。

结果写入设计迭代 evidence 对应目录。原站读取主包并核对固定 SHA-256；只插入状态读回，不改变其渲染。原站版本改变需重新研究并修探针，不能忽略校验。正面测试控制仅作用于独立测试页面，不进入产品。

CDP 请求表、浏览器收到的输入、逐帧状态与画面帧分别保存。SwiftShader 和模拟布局不能证明真机流畅度。画面帧收到后的读回不视为 GPU 同时刻；保留原始时间。第 19 轮精选可体验证据见 [交付记录](../../docs/design/iterations/u03-p01-2026-10-08-19.md)。

第 22 轮原始 before 采集保留了一条负的 RAF 相对时间（RAF 时戳早于当帧变更微任务）；其 `time` 是实际读取时间。修复后与确认脚本统一用 `performance.now()` 计算 elapsed。前后只对照状态与实际滚动点，不宣称毫秒对齐。
