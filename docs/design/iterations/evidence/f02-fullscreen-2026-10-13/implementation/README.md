# F02 工程候选与执行者浏览器证据

2026-10-13，P01/P14 / U05 / T03.04。工程实现与执行者自测已完成，当前候选冻结供独立设计复核；不是用户验收结论。

最终入口 `http://127.0.0.1:4342/personal-homepage/?opticsDebug=1#links`。普通体验可去掉查询参数。最终 `HomeJourney.CIZrgdwT.js`，1,162,801 bytes，SHA-256 `2980D744E50F5A1CA985592D9F287FCE0266F0819ABA8B6359479C3331D119F1`。

## 样本的读法

`browser-samples.json` 保存按真实操作顺序采集的原始状态，包括视口、scrollY、实际bundle、raw/rendered进度、墙位置和portal目标状态。相同label对应同名jpg。状态读取与截图捕获有短时间间隔，快滚样本的scrollY可能略异；不能由图片文件名推定阶段已落定。

初样 `a1MSPEeb` 保留V形空洞与不完整覆盖；`C9hJLHMB` 修正三角化/升墙门禁后又发现极小墙进度残留；`ur3unrG0` 修正残留并检查重载/返回，8bit采样仍丢失白砖细节。最终 `CIZrgdwT` 使用半浮点采样与静态内容对比修正。共43次图像/状态采集，包含失败和补验，不是43条全部通过。

## 最终候选的重点原图

| 位置/动作 | 原图及含义 |
| --- | --- |
| 窄屏窗口进入 | `hdr-mobile-progress.jpg`：砖缝在初始小窗可辨；快滚中间帧 |
| 窄屏实际全屏 | `hdr-mobile-cover.jpg`：raw/rendered expand≈.9502、wall=0，实际四角覆盖=true、hdr=true；随后墙才上升 |
| 窄屏墙阅读 | `hdr-mobile-wall.jpg`：同一砖缝场景进入原生内容阅读，无横向溢出 |
| 暂停内容路径 | `frozen-mobile-quiet.jpg`：展开spacer隐藏、后备墙可见，header/底控件保持可读 |
| 桌面部分展开 | `frozen-desktop-half.jpg`：expand=.75的同一墙窗，轮廓连续，无V形缺口 |
| 桌面全屏/升墙 | `frozen-desktop-hdr-cover.jpg`：expand=1、wall=.1、四角覆盖=true；砖缝完整 |
| 桌面墙阅读 | `frozen-desktop-wall.jpg`：同一采样与实体墙衔接 |
| 快速反向门禁 | `frozen-reverse-hold.jpg`：raw expand已回落，但rendered expand=1，先回收rendered wall |
| 重载墙 | `frozen-wall-reload.jpg`：当前scrollY=7660，raw/rendered expand与wall均直接=1 |
| 留言页返回 | `frozen-route-return.jpg`：回到同一墙位置与当前进度 |

补验残留修复的 `final-desktop-reverse-window.jpg` 属于 `ur3unrG0`：wall=0且visible=false，缩回窗口外恢复黑场。最终只增加HDR采样/诊断清理与quiet对比，没有改该门禁。实际半途反向、快滚和正向动作顺序见JSON；不以静帧冒称全部动作通过。

## 工程结果与原始记录

- 原项目check：102文件，0错误/警告/提示，正常本机权限；工具结果295434/37697d。
- `final-build.log`：最终原项目构建15页面与Pagefind通过，保留既有chunk及404提示。`hdr-build.log`为前一构建原始输出。
- 必要逻辑测试3/3，最终Impeccable检测 `[]`。完整工程范围和命令结果见[技术记录](../../../../../technical/iterations/p01-f02-2026-10-13-fullscreen.md)。
- `console.json`保留调试tab各版本的warning历史，最终错误检查为空。无真机/FPS承诺。
- `initial-launch.stderr.log`和`preview.stderr.log`保留启动失败：错误旧入口及项目已存在预览服务。最终复用原4342服务，经HTTP200和实际HTML/bundle核对；没有关闭其他服务。

一次滚轮未停定时点击墙导航等待超时；实际停在滚轮目标y=7012，停定点击后正常直达。推断为后续滚轮中断程序导航，该次等待不记通过。实际减少动画系统偏好未切换，暂停已实测同一quiet分支；390px不是实体手机，8bit无HDR设备回退另验。

设计侧于本轮末要求冻结候选，已开始独立验收。期间不改变应用源码、构建或IAB全局视口；独立/用户结论另记。
