# P14 可移动迷墙样本证据

最新用户尺寸/显隐修订已完成，当前入口4360默认无文字、悬停/键盘焦点显字，见[修订原图与源哈希](size-hover-revision/README.md)。本文件下方六图与7源清单为第一版常驻文字基线；当前源码仍在同一prototype目录，CSS/HTML的现行哈希使用修订清单。

最终工程检查：esbuild与JS语法通过，7源哈希/实际包入口一致；文件检查3222、文档链接/锚点211和diff空白检查均通过。GSAP允许原事件默认行为，实际CSS墙/砖touch-action均为pinch-zoom，阅读为pan-y pinch-zoom；只证明配置和桌面拖动兼容，不称已做真机双指验证。

日期：2026-10-14。对应[第一样本记录](../../u08-p14-2026-10-14-wall-prototype.md)，本机体验入口 http://127.0.0.1:4360/ ，冻结候选 app-MWSFUD6U.js。

## 第一版产物

源文件在 prototype，产物在被忽略的 .local-tools/wall-prototype/site；[7源哈希](source-hashes.json)与实际包对应。169个错缝砖位、22条原创演示留言，无真实提交、外部请求、图像或字体下载。

| 当前原图 | 验证内容 |
| --- | --- |
| [桌面墙面](final-desktop-wall.jpg) | 1280×720，哑光错缝砖、短摘录、固定入口 |
| [桌面阅读](final-desktop-reading.jpg) | 原砖展开后的稳定可读态，正文opacity1 |
| [390px墙面](final-mobile-wall.jpg) | 390×844，墙面探索/工具无文档横向溢出 |
| [390px阅读](final-mobile-reading.jpg) | 短留言、可见关闭入口和完整正文 |
| [390px长留言](final-mobile-long.jpg) | 直达demo-22并刷新，正文完整可读 |
| [320px长文滚动](final-320-scrolled.jpg) | 320×568，内部scrollTop364，关闭按钮位置保持，背景matrix相同 |

上述六图均为冻结包的实际原图，已查看，未裁切或编辑。

## 验证结果与边界

[browser-checks.json](browser-checks.json)保存冻结包7组定向观测：键盘焦点后拖墙不误点，点demo-02/Esc关闭墙matrix完全一致；快速后退/前进与URL一致；3次Enter/Esc循环后无portal、焦点回砖；320px列表进入长文，内部滚动与固定关闭；减少动画策略；390px留言直达刷新；回复进入真实接入说明。当前控制台无error/warn。

减少动画通过本机 ?motion=reduce 验证与系统偏好相同的策略分支，记录的系统偏好仍为false，不能称实际改变了操作系统设置。窄屏用桌面浏览器鼠标与视口覆盖，不等于真机触控。此前Tab从关闭到回复可达，继续Tab涉及浏览器Chrome焦点边界，本轮未将它记为完整焦点循环通过；原生modal阻止背景控件，Enter/Esc及关闭后的焦点已实测。

初检与修复保留：

- [首次焦点回墙偏移](initial-focus-restore-failure.json)：主动focus与浏览聚焦冲突，修复后另有[定向确认](repaired-focus-return-checks.json)。
- [快速历史状态不一致](initial-fast-history-failure.json)：URL回到留言但弹层仍收回，已改成按当前URL收敛。
- [原生dialog焦点恢复触发偏移](initial-native-focus-return-failure.json)：只保护主动focus不足，最终保护同时覆盖dialog.close原生恢复；冻结包已按同输入确认matrix完全一致。
- [收束前观测](pre-final-browser-checks.json)包含JXGLBSWF/I5VZAP5C阶段，不代替最终包；无前缀旧桌面图来自PQBGMRZA，desktop-opening为中间帧，均只作历史。

未提供连续录屏、逐帧轨迹/帧时测量、BFCache、200%字号、真机或完整屏幕阅读器验证；未验证主站接入、Giscus身份/写入、公开部署及大陆网络。

首个服务器在沙箱内只能启动，宿主浏览器超时；随后仅将本机loopback服务器启动到宿主，HEAD200与实际IAB加载成功，日志/PID在.local-tools/wall-prototype。没有更改防火墙、代理或网络安全设置。失败的临时页保持默认临时属性；最终页已标为可体验产物，视口覆盖已reset。
