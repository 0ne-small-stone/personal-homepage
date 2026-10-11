# P01 · 41 去除片状受光

2026-10-10。P01 / R01、R12 / U03、U05、U14 / T03.01、T03.05。源码`e36c951`，依据[41轮任务](u03-p01-2026-10-10-41.md)及SYSTEM9.3.8。用户最新反馈覆盖39/40执行者的柔光判断。

## 改动

- 撤主场景共享几何上的未经模糊core/surface白色覆盖。GlassEdgeLight只管理真实几何的独立离屏发光源，不再绘制白色面层。
- 发光源取消全表面常量和整片侧面增亮，只保留内外边缘的渐弱分布；合成撤掉把玻璃主体压至6%的锐利coverage切分，玻璃内外共享连续模糊场。
- 复用Three官方H/V两对密集Gaussian、CopyShader及现有4targets/7passes。加宽扩散而降低峰值；CSS分辨率抗锯齿源继续保留，覆盖只用于采样。没有新依赖或扩展光片。
- 首卡收光、反向恢复、Wall退出、非缓存释放/缓存挂起及resize仍用现有机制；40几何、相机、背景、字标与输入未改。

## 实际核对

[浏览器事实](evidence/u03-p01-2026-10-10-41/browser.json)。使用当前IAB与原生控件、滚动及指针操作；桌面窗口1440×900、有效canvas1425×900，手机窗口390×844、有效canvas375×844。

首批UhX5FEN2桌面/手机首屏与自然旋转对照、普通/增强切换及S1900首卡、返回已查看；白色面覆盖去除，但手机扩散偏弱。集中只调合成亮度，最终DPTHfJk9定点看桌面首屏/旋转、手机首屏/暂停/恢复与自然旋转：散光跨轮廓连续衰减，没有原白面层硬边。最终DOM Canvas1、手机无横向溢出，当前浏览器error日志0。

| 对照 | 原CRy09A9T | 最终DPTHfJk9 |
| --- | --- | --- |
| 桌面首屏 | [旧](evidence/u03-p01-2026-10-10-41/old-desktop-front.jpg) | [新](evidence/u03-p01-2026-10-10-41/final-desktop-front.jpg) |
| 手机首屏 | [旧](evidence/u03-p01-2026-10-10-41/old-mobile-front.jpg) | [新](evidence/u03-p01-2026-10-10-41/final-mobile-front.jpg) |

[最终桌面旋转](evidence/u03-p01-2026-10-10-41/final-desktop-turn.jpg)、[最终手机旋转](evidence/u03-p01-2026-10-10-41/final-mobile-turn.jpg)、[手机暂停](evidence/u03-p01-2026-10-10-41/final-mobile-paused.jpg)、[首批稳定首卡](evidence/u03-p01-2026-10-10-41/new-card-settled.jpg)。所有原图保留；原生姿态随时间变化，不冒充固定60°/85°或逐像素同姿态对照。截图与DOM读取为相邻独立时刻。

两次check均44文件零错误/警告/提示，两次build均15路由与Pagefind通过；第二次只因首批手机过弱的集中修正。既有chunk/404提示保留。GPU资源数量窗口和真机性能未采样，本轮不宣称性能通过；保留4targets及原销毁路径，没有新增资源，故未重复39的GPU窗口。浏览器临时viewport覆盖已清除，恢复首页。

## 交付

[当前首页](http://127.0.0.1:4321/personal-homepage/)。最终包`HomeJourney.DPTHfJk9.js`，1,171,206字节；SHA-256 `2a57f960e3d9bad23b0f40b283d18717f18607255e392aed5579cd9a0207a21f`。本轮为执行者实际视觉/工程核对，用户审美确认另记。未实施全屏展开、加载34或发布。
