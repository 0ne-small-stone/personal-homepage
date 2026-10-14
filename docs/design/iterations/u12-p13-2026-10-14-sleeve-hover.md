# P13 专辑卡片悬停转动

2026-10-14 · P13 / R04、R12 / U12、U14 / T25.25。状态：本机修复与执行者验证完成，用户成品确认另记。

用户裁图指出网易云专辑卡片悬停无动作，随后明确选择「悬停时转动，移开停止」。现有转动只由媒体 playing 触发；选中专辑已抽盘，悬停也不会再次位移。

沿用用户已选 COMPScout 封套/黑胶构图与既有 CSS 动画，不引入新素材、动画库或另一音频实例。本片只让曲库卡片的黑胶在鼠标悬停/键盘可见焦点时转动，离开暂停并保留角度；卡片预览不触发播放。选中抽盘、查看曲目、真实进度、黑胶播放页和个人登录保持原逻辑。隐藏页面或卡片离开可见区时停转，卸载清理可见性监听/观察。

统一转速沿用 SYSTEM 第5节；减少动画保持静态且仍可选择专辑，触摸不依赖悬停。验收集中检查桌面进入/离开、选中和未选中、键盘、正在播放时的独立卡片反馈、390px及减少动画；不将截图当作动态验收。

实际入口仍为 http://127.0.0.1:61173/personal-homepage/music/?mode=netease 。独立输出不覆盖4342首页冻结目录。

## 实际结果

- `VinylSleeve.tsx` 的原按钮新增可见性观察，CSS保持原转速/角度并暂停或恢复；不调用播放回调、不增加计时器。可见性监听和观察在卸载时清理。
- 音乐专项 `npm run check -- --tsconfig .local-tools/music/library-tsconfig.json`：25文件、0错误/警告/提示。首次沙箱运行未能解析 `astro/config`；确认本机文件与Node解析正常后，同命令在本机环境通过，没有改依赖。
- 独立 `npm run build -- --outDir .local-tools/music/library-layout-dist`：15 HTML/Pagefind通过；既有大块及404冲突警告保留。61173原服务直接提供新产物，不重启账号、不覆盖4342冻结目录；无提交、推送或部署。
- 889×923实际鼠标进入选中/未选中专辑均为running，连续transform矩阵改变；移开paused，后续矩阵完全相同。键盘Tab焦点同等运行、离开停止。
- Eclipse真实129.474467秒音源在本片播放到7.75秒，卡片移开仍停转而audio正常播放；始终仅1个audio。随后暂停测试音乐。
- 390×844视口无横向溢出，查看专辑曲目可用；恢复正常窗口后用键盘确认返回，临时视口已恢复。专辑详情滚离可见区域时data-motion-visible=false且paused；页面隐藏分支已审阅清理逻辑，本轮未切换真实系统隐藏状态。
- 减少动画沿用末尾`prefers-reduced-motion`的animation:none并在产物读回，本轮没有修改系统偏好或实测真机触摸/系统减少动画。390px是桌面窗口适配，不称真机验收。

实际截图：[完成预览](evidence/u12-p13-2026-10-14-sleeve-hover/preview.png)、[转动A](evidence/u12-p13-2026-10-14-sleeve-hover/desktop-hover-a.png)、[转动B](evidence/u12-p13-2026-10-14-sleeve-hover/desktop-hover-b.png)、[移开停止](evidence/u12-p13-2026-10-14-sleeve-hover/desktop-stopped.png)；[20条原始动态观测](evidence/u12-p13-2026-10-14-sleeve-hover/motion-observations.json)保留初采和最终确认。工具getAnimations不支持后改读DOM transform；首轮拖动文本选中/第二卡片hover未保持、AX滚动被元素覆盖及移动窗口返回未执行，均重新依据可见状态用空白路径/键盘完成，不能把初采写为全套通过。转动B/停止图的工具拖动文字选中保留，完成预览已清除选中；无额外视觉调整。
