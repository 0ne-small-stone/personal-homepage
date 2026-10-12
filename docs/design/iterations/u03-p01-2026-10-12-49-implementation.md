# P01 · 背景白弧线撤除的实际接入（49轮）

2026-10-12。P01 / R12 / U03、U05、U14 / T03.01、T03.05、T26.02、T27.01。用户要求去背景白线，色散增强另片。源码 **83ec849**：仅SceneBackdrop.tsx删除末尾装饰Bezier及专用渐变，共四行。CanvasTexture、黑灰砖格、低亮网格、透明采样/销毁保持，无新依赖或资源。

## 保留范围与构建

PrismBeam、prism-ray、prism-spectrum、GlassGlow、GlassTriangle五文件前后SHA完全相同，保留46七波长/48固定14.2115°入射/47柔光/实心几何及半尺寸、相机和输入。此次未重复13项物理或其他模块验收；删除装饰没有新增镜像单元测试。

一次npm run check：52文件0errors/warnings/hints；一次build：15HTML/Pagefind成功，既有大chunk和404路由警告保持。最终 **HomeJourney.D-uKsyuw.js**，1,182,849B，SHA256 **661a1c638f5b548b06f866249979bbb2bd9c1c4bf255ca3bddf97ea74b234350**，较46包减321B。实际IAB DOM组件地址也读回D-uKsyuw，不只使用文件时间认定新包。

## 实际验证与采集边界

复用4335隐藏前台服务，真实监听PID31420，未重新启动/停止。CUA已可用，本批在实际应用内浏览器测1440×900及390×844；模拟尺寸不是真手机性能。截图包含滚动条，实际内容宽度与视口宽度不同，未把它们当成旧DPR1软件帧的像素等价。

[16张原图与DOM状态](evidence/u03-p01-2026-10-12-49/browser/checks.json)：首屏、同`.6`原生向下滚动、`1`页反滚、质量开关。单Canvas、无横向溢出、最后错误日志为空。桌面前后转动分别取在scrollY538.67/808，属于同输入不同时间，不声称逐帧姿态完全一致；手机稳定前后转动均scrollY760，首屏及反向归零。

- [桌面之前](evidence/u03-p01-2026-10-12-49/browser/desktop-before-front.png)→[之后](evidence/u03-p01-2026-10-12-49/browser/desktop-after-front.png)：旧背景弧线及穿过玻璃的弧线消失，实际斜向白光、内部与彩出射相接；砖格/局部网格保留。
- [手机之前](evidence/u03-p01-2026-10-12-49/browser/mobile-before-front-settled.png)→[之后](evidence/u03-p01-2026-10-12-49/browser/mobile-after-front.png)，[自然转动](evidence/u03-p01-2026-10-12-49/browser/mobile-after-turn.png)与[反向](evidence/u03-p01-2026-10-12-49/browser/mobile-after-reverse.png)：无背景白弧线，原光路/柔光仍可读。
- 质量控件实际unchecked/checked对应普通/增强；[普通完成帧](evidence/u03-p01-2026-10-12-49/browser/desktop-after-ordinary-settled.png)、[增强完成帧](evidence/u03-p01-2026-10-12-49/browser/desktop-after-enhanced-settled.png)均无旧线。此检查只核对删线范围，不重新评定整个既有材质。
- 初始IAB重载只显示导航，是就绪阶段，未冒称完整场景。最早手机before-front/turn仍处于回滚，原图及y540/758保留；另采稳定y0/760。尝试用只读DOM中的requestAnimationFrame等待失败（不可用），保留工具失败，随后依据已观察运动使用有界1s采集。最早模式图在控件改变后GPU更新尚未完成，保留两图、一次稳定确认，无源码美术修正。

执行者批量读图通过；独立设计在其实际IAB重载并等待就绪确认桌面，另读手机after-front/turn，允许保留49，无追加修正。用户审美与真机性能另验。预览临时尺寸已恢复。

## 交付

http://127.0.0.1:4335/personal-homepage/。重载，原生滚动/反向，桌面切换光影细节即可复现。本片源码和工程证据独立保存，其他音乐研究/50定义不混入。仓库1662文件、108文档链接/锚点及65静态文件2,902,285B检查通过。完成后只按50授权增强色散，不扩展加载页或其他模块。
