# P14 小砖与悬停显字修订证据

2026-10-14，P14 / R08、R12 / U08、U14 / T19、T26–T27。用户要求“砖有点大”“只有鼠标悬停时才显现砖上的字”。范围为独立样本 style.css 与 index.html，统一参数见SYSTEM第11节；应用、首页及真实Giscus未修改。

入口 [The Wall](http://127.0.0.1:4360/)；JS仍app-MWSFUD6U.js，因为本片未改变脚本。原静态服务刷新后实际DOM/画面已核对；[本片7源哈希](source-hashes.json)与[前版7源哈希](baseline-source-hashes.json)分开保存，只有style.css、index.html变化。

| 实际原图 | 内容 |
| --- | --- |
| [前版桌面](before-desktop-wall.jpg)、[前版390px](before-mobile-wall.jpg) | 前片保存的原始大砖/常驻文字基线，未重新采集 |
| [桌面默认](desktop-default.jpg) | 1280×720，204×88px砖；默认摘录与作者opacity0 |
| [桌面悬停](desktop-hover.jpg) | 仅demo-01摘录和作者opacity1，其他21块不显示文字 |
| [键盘焦点](desktop-keyboard.jpg) | Tab进入demo-17，focus-visible等效显字，完整名称保留 |
| [390px默认](mobile-default.jpg) | 176×78px砖、工具与说明无横向溢出 |
| [390px阅读](mobile-reading.jpg) | 拖墙后打开demo-01，正文17px/opacity1，关闭前后墙matrix一致 |
| [320px默认](320-default.jpg) | 320×568，无横向溢出，列表与操作保留 |

新六份原图均已实际查看，未裁切/编辑。[browser-checks.json](browser-checks.json)保存当前DOM/CSS定向观测：精细指针悬停显字、移开后全部隐藏、键盘焦点由淡入中间态收敛到1、Enter/Esc归位、拖墙后点开/关闭matrix一致、390/320px默认隐藏。初次键盘观测保留淡入中间态，不将其写成终态。

esbuild构建、7源SHA-256与生成CSS/HTML逐字匹配、本片8份文档链接/锚点、diff空白和仓库3338文件检查通过。控制台error/warn为空，临时视口已reset。沙箱内Node HTTP读回因loopback EACCES失败，未更改权限或网络设置；生成文件检查与实际IAB核对分别留证，不将失败的HTTP校验记为通过。

悬停采集使用实际鼠标从固定按钮拖入砖面，未触发按钮点击或墙平移；未注入CSS状态或模拟事件。窄屏用桌面浏览器鼠标，不能称真机触摸/双指通过。列表、历史、长文、系统偏好和主站/Giscus的既有边界沿用前片，本片不重复扩称完整回归。当前为执行者验证、待用户体验，无本片提交/PR或发布。
