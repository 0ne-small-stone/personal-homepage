# P01 F03 · 加载资源门槛与有限揭幕

2026-10-14；R12 / U03、U14 / T03.01、T26.02、T27.01。工程完成并冻结，待独立设计复核与用户体验。

## 复用与最小适配

沿用React/R3F、Three、GSAP与既有渲染链。成熟时间线解决动作控制；本项目需要在已有多层合成最终结果上进行有限UV采样，新增小型FramebufferTexture/FullScreenQuad适配。无新依赖、Renderer、Canvas、持久反馈纹理或物理模拟。美术阶段与参数由设计SYSTEM9.2.6维护。

`loading-state.ts`纯状态机控制四资源门槛和terminal防护；`useHomeLoading.ts`拥有解码、8s超时、一次重试、GSAP及输入/可见性监听生命周期。准备时先安装原运动/布局触发器，再报告就绪，避免ready循环依赖。GlassRenderLayer报告compile与实际原world draw，额外采样置于原全部层之后；GlassGlow/GlassEdgeLight只用原形体mask形成柔边。

传入最终显示编码画布，用NoColorSpace且关闭二次toneMapping；临时纹理按drawing buffer resize。有限阶段结束与所有退出路径销毁纹理/material/quad并走原渲染链。普通浏览、深链/返回/已访问、quiet分流；late callbacks/卸载不能重启。测试预览仅精确localhost/127.0.0.1允许，不清理用户sessionStorage、不注入生产延迟。

## 固定版本与验证

实际4342：HomeJourney.BdZlSJh6.js，1,183,026B，SHA256 29864AAAD7A24D0053800A5B73601B235628177E7429BFFE3DC6D702A204D46A。相对h39原23源18保持/5修改，另5文件记录，总28哈希。保留album→radio→projects、小砖.85与F02动作；未修改其他栏目的源码。

16项状态/F02测试、113文件check零诊断、15页生产构建/Pagefind通过；最终检测[]。33浏览器样本中25为最终包，正常首访/不重播、等待及运行取消、模拟慢释放/8s超时/失败/quiet、真实Someone返回及wall正反有证据。所有原失败、工具deadline、控制台warn、原图与未测范围统一见[实施证据](../../design/iterations/evidence/f03-loading-2026-10-14/implementation/README.md)，完整[冻结清单](../../design/iterations/evidence/f03-loading-2026-10-14/implementation/frozen-candidate.json)。截图非原子，模拟不等于实际网络/OS偏好或真机性能。

全仓构建同时包含Someone负责人更新的当前about.astro，实看已非旧占位；本轮不复制独立工作树。主站gallery仍旧占位，整合另验。复用现有preview，无提交/部署。停止本轮，F05/F06/F07不启动。
