# 39轮 · 光片改连续光晕的独立复核

2026-10-10，P01 / U03、U05、U14。[任务](../../u03-p01-2026-10-10-39.md)。用户[反例](user-light-sheets.png)明确否定侧视前后光片，要求自然晕开。

## 基线

38D源码46a389b/归档1cea49c，CrxZ7-Va。已收窄环边、恢复厚度且修正轮廓归属；其形体保留。现场旧版1195×780、DPR1.5，[首屏](before-front.jpg)、[原生滚轮.6后S312](before-turn.jpg)。刚重载时会恢复到项目入口，实际点“转到序章”回S0后再采集，不把加载期间读数作最终构图依据。

## 首批 yCgxqoBx

实现从实体发光mask经过两次横/纵模糊再合成，撤主场景的前后光带。设计现场看[正面](desktop-front.jpg)、[相同原生输入S312](desktop-turn.jpg)、[普通模式](desktop-ordinary.jpg)。校准至390×844 CSS px后看[手机首屏](mobile-front.jpg)、[S338转动](mobile-turn.jpg)、[首卡S1788](mobile-card.jpg)、[真实上滚回S0](mobile-reverse.jpg)。Canvas1、当前错误日志0、手机documentWidth380无横向溢出，首卡收光/反向恢复通过。

此轮DPR1.5下工具viewport设585×1266，实际DOM读回390×844；工具截图渲染带右侧/底部黑色空区，属于工具呈现，不能误报应用溢出。已恢复默认视口。普通开关实际关闭和恢复各一次，未见捕获反馈。

另看工程固定桌面60°/85°及手机85°原图：侧视双片消除，扩散连贯。但玻璃面与厚侧面整体泛白、层次偏平，外沿附近柔光相对弱。已集中反馈一次：以实体mask减弱主体上的blur覆盖，适度加强外沿邻域扩散，保持当前无光片结构、真实形体和交互。初批原图留存，不能把机制通过写成最终光质已通过。

## 最终确认

集中光质修正DqvdCCjO：合成加入实体coverage，主体上的新增扩散光乘数.06，gain .42→.95，alpha上限.28保持。固定图显示主体灰化减轻，边缘附近柔光更可读；但是低分辨率sourceMask覆盖产生新的阶梯/黑齿，桌面60°左斜边与正面内孔明显。已要求一次定点技术修复：coverage与blur的分辨率解耦或等效抗锯齿，保持已定光质，不另开美术调参。确认只看front/60°/手机85°的边界，避免重复整批。

工程原始结果分开记录：initial已完成8项通过后在Becoming链接定位超时，整批pass=false保留；confirm6项通过，离页disposals=[]一项false。当前没有ClientRouter，不能以跨文档导航未收到React cleanup事件认定泄漏。final七项通过，实际pagehide.persisted=false时dispose及返回一个Canvas、光晕恢复；缓存suspend分支有实现，未实测persisted=true，不写成缓存分支也通过。当时仍待边界定点修正；用户审美与真机性能分别记录。

**定点技术修复通过：**u1Yt8DKF，1,174,530字节，SHA-256 `fafab3534af6335656a6fef84514357b4f556b570e7544f5efe05120584d4a43`。覆盖mask改CSS分辨率并启用设备支持的最多4×MSAA，模糊保持低分辨率，最终4targets/活跃7passes。已读取[antialias3/3](../u03-p01-2026-10-10-39/antialias/checks.json)，并实际看[正面](../u03-p01-2026-10-10-39/antialias/new-desktop-front.png)、[60°](../u03-p01-2026-10-10-39/antialias/new-desktop-60.png)与[手机85°](../u03-p01-2026-10-10-39/antialias/new-mobile-85.png)：先前阶梯黑齿消除、厚侧面暗部与砖格可辨、边缘连续晕散。设计执行者允许保留，已下发最小归档；没有再开启美术调参。初批资源短窗是3targets版本，不能改写成最终4targets也跑了同一长窗；最终三图确认其实际目标与合成参数，真机性能仍未测。

源码3f693b2已读回。最终实际默认浏览器1195×780、DPR1、S0、u1Yt8DKF、Canvas1/error0，[最终首屏](final-homepage.jpg)已保存且视口恢复默认。工程三次check均44文件零诊断、三次对应构建均15路由/Pagefind通过；每次分别对应初样、一次集中美术修正、覆盖锯齿技术修复。
