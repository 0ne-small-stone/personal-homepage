# F02 D1–D3 集中修正候选

2026-10-13。执行者定向检查及工程交付；**新候选待设计侧一次定向确认，用户尚未验收**。旧CIZrgdwT首轮独立未通过仍保留，不能以本文件覆盖历史结论。

## 冻结候选

- 实际URL：`http://127.0.0.1:4342/personal-homepage/?opticsDebug=1`，体验可从 `#links` 起步。
- bundle：`HomeJourney.BZgdJJ3A.js`，1,168,425 bytes。
- SHA-256：`0A8C2C93C242DFE1963CB479CAF18C251EE809CF024DCA448DF1094C05821799`。
- 原项目生产预览PID48456持续提供该包；未提交、未部署，其他栏目共享工作区变化不记为本片。
- 收束后不继续修改源码或重建。浏览器采集已结束，临时390px视口已reset，最终保存时桌面为1280×720。

## D1–D3接入

| 缺陷 | 本批处理 |
| --- | --- |
| D1 实体与窗口分离 | 同一玻璃几何的位置缓冲真实变形，正面、倒角、背面共享投影域；窗口读取同一轮廓并乘当前可见面的MSAA覆盖。没有只藏旧尖角；退出恢复原位置/法线 |
| D2 砖缝沿对角线扭折 | 整脸使用一个Three Matrix3齐次投影，混合齐次矩阵后统一除W；初始短第四边处理退化，继续采同一HDR墙场景 |
| D3 硬边锯齿 | 复用既有GlassGlow覆盖目标与最多4×MSAA，再按CSS像素覆盖软化轮廓；柔光交接，不对砖纹理模糊、不做厚白描边 |

升墙同时核查逻辑轮廓和真实面三角形在四角的1.5px余量。已经由窗口绘制的玻璃正/背面省去重复透射着色，仍绘制同一实体的倒角/侧面；没有新增Renderer、Canvas、目标或RAF。统一参数见SYSTEM9.2.5。

## 原图与可核对状态

| 文件 | 实际取样结果 |
| --- | --- |
| `desktop-quarter-final.jpg` / `sample-desktop-quarter-final.json` | 1280×720，y5896，raw/rendered expand=.275；玻璃、墙窗共形，砖缝无旧对角折线 |
| `desktop-nav-boundary-final.jpg` | 1280×720，执行时y6580、expand=.75；明暗边界经过The Wall控件，保留供设计定点判断，不宣称像素对比度合规 |
| `mobile-keyboard-progress.jpg` | 390×844，执行时y6948、expand≈.306872；本批窄屏开窗原图，砖缝连贯 |
| `mobile-full-cover-final.jpg` | 390×844，执行时y8962、expand=1、wall=1；终章可读、无横向溢出 |
| `mobile-retracted-final.jpg` / `sample-mobile-retracted-final.json` | 390×844，y6852，raw/rendered expand=.25、wall=0、实体墙visible=false；从终章实际收回，未留原玻璃尖角 |

`browser-samples.json`仅汇总本批成功保存的两份完整单样本；不是整个操作矩阵的完整时间序列。其他原图的状态由当时工具结果可核对，未伪造缺失字段。图像与DOM采样有短间隔，40ms portal诊断也可能更旧，不把它们视为原子同帧。`mobile-quarter-final.jpg`实际是早采的完整墙阶段，`mobile-reverse-final.jpg`实际已回到末卡，不由文件名推断阶段。

证据脚本曾捕获旧目录/数组引用，导致原图写入implementation、拟保存的数组为空。已将本批独有原图移到本目录，并改为逐样本独立保存；空的preliminary/stale JSON和工具错误保留，不作为有效证据，不重采整套矩阵。早期D1修正还暴露了倒角域外推尖角和以包围盒代替理想顶点造成的覆盖偏差，已通过边界约束/同工厂校准修正；相关早采留在历史目录。

## 工程结果与限制

- `check.log`：原项目103文件，0 errors / warnings / hints。
- `final-build.log`：原项目15页面与Pagefind完成；既有chunk/404提示保留。
- `node --test tests/home-motion-ranges.test.mjs`：5/5。包含齐次映射/直线保持、全实体可逆、倒角域不外推、真实面覆盖余量与原滚动区间。
- Impeccable最终目标检测 `[]`。本批最后控制台error列表为空；`console.json`保留同一调试tab较早版本的warning历史。
- 390px为模拟窄屏，不是实体手机；本批没有FPS指标，系统减少动画偏好、无HDR设备、BFCache/context loss仍未专项补验。

源码/资源与验证范围见[工程记录](../../../../../technical/iterations/p01-f02-2026-10-13-d1-d3-repair.md)。本轮只交新固定候选，接下来由设计侧按D1–D3及关联正反/四角做一次定向确认；不启动F03。
