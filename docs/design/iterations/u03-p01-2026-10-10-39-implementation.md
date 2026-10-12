# P01 · 39 连续扩散光晕

2026-10-10。P01 / R01、R12 / U03、U05、U14 / T03.01、T03.05。依据设计39任务与SYSTEM9.3.6，先保存38D `46a389b`/`1cea49c`，再替换用户否定的前后光片。最终源码`3f693b2`。

## 实现

- 删除GlassEdgeLight的前后DoubleSide扩展光带及独立halo几何；保留实体倒角/表面层与38D轮廓派生。发光源复用同一实体几何，覆盖可见内外边缘及整个厚侧面，不增加放大的三角幕。
- 新增GlassGlow，复用Three0.186.1的HorizontalBlurShader、VerticalBlurShader、CopyShader和FullScreenQuad。实体覆盖mask→官方降采样copy→两组密集水平/垂直Gaussian→局部合成，不使用全场Bloom或新框架。
- 进入BlackFlowLayer现有priority1渲染链：layer0实体/背景→局部光晕→既有流体扭曲→layer1前景卡片。独立mask Scene与最终屏幕光均不进入玻璃捕获；普通材质原捕获隔离保留。
- 每方向使用相邻texel采样，避免大步稀疏采样的离散重影。光随实体matrixWorld投影；首卡零强度与Wall跳过所有光晕绘制，反向恢复。render target、clear color/alpha、autoClear、tone mapping、XR及shadow状态恢复。
- 集中设计修正用源mask抑制主体泛白，保留周围柔光；随后修复低分辨率覆盖造成的黑齿，将覆盖和扩散分辨率解耦。最终四个RGBA8 targets，活跃时7 passes；覆盖为CSS像素分辨率及最多4×MSAA，三个blur targets仍低分辨率。实际1440×900对应180×113，390×844对应65×141。统一resize/dispose，原玻璃几何由GlassTriangle持有。
- 普通组件卸载与astro切页释放；整文档非缓存pagehide显式释放，BFCache只挂起以保留返回恢复，沿用原HomeJourney生命周期。光质与具体实参统一见SYSTEM9.3.6。

## 验证记录

1. [首批](evidence/u03-p01-2026-10-10-39/initial/checks.json)：桌面0/60/85°、手机0/85°，真实指针短转动、短资源窗口及resize共8项通过，随后因错误的Becoming精确可访问名称定位超时；原始fatal保留。3target首样纹理14、程序19，四个短窗观测稳定，resize复用原target IDs。保留旧版桌面/手机85°两图。
2. [定点补验](evidence/u03-p01-2026-10-10-39/confirm/checks.json)：普通捕获排除光层、增强恢复、手机首卡收光/反向、Wall退出及无错误共6项通过。离页要求SPA cleanup通知的断言false；当前是整文档导航，不能据此直接判定泄漏。390px质量按钮沿用既有隐藏规则，模式选择时临时扩至800px使用真实按钮，再回390px观察；不宣称隐藏按钮已成为手机入口。
3. [集中候选](evidence/u03-p01-2026-10-10-39/final/checks.json)：五姿态与按整文档语义的离页/返回7/7。实际pagehide.persisted=false，资源disposed=true，返回active/Canvas1/错误0；BFCache挂起分支有代码处理，本批未实测persisted=true。设计读图发现覆盖黑齿，因此工程通过不表示此候选视觉通过。
4. [覆盖抗锯齿定点](evidence/u03-p01-2026-10-10-39/antialias/checks.json)：仅桌面正面/60°、手机85°3/3，源覆盖1440×900/390×844及4×MSAA，4targets/7passes，GL/脚本/请求错误0；最终纹理15、程序20。未重复已通过的资源长窗或全套交互。代表原图：[桌面正面](evidence/u03-p01-2026-10-10-39/antialias/new-desktop-front.png)、[桌面60°](evidence/u03-p01-2026-10-10-39/antialias/new-desktop-60.png)、[手机85°](evidence/u03-p01-2026-10-10-39/antialias/new-mobile-85.png)。

三次check均44文件零诊断，三次build均15路由及Pagefind通过；第二次对应集中设计修正，第三次对应新增覆盖锯齿回归。既有chunk/404提示仍在，没有无目的重复构建。模拟触摸/SwiftShader不是实际设备性能证据。

## 交付状态

[实际首页](http://127.0.0.1:4321/personal-homepage/)。最终包`HomeJourney.u1Yt8DKF.js`，1,174,530字节；SHA-256 `fafab3534af6335656a6fef84514357b4f556b570e7544f5efe05120584d4a43`。

最终设计侧已读实际antialias桌面正面/60°及手机85°原图，确认黑齿/台阶消除、无光片、连续散光及实体暗部/砖格透射保留；放行最小保存，无再调美术。独立记录由设计侧维护于`evidence/u03-p01-2026-10-10-39-design/`。用户审美及真机性能另记；本轮不表示加载34或完整展开已完成，无推送/合并/部署。
