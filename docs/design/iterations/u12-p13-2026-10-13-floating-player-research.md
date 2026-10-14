# P13 跨页悬窗形式调研

## 最新用户选择与实施切片

2026-10-13用户明确选择“2 · Apple Music 大封面小窗”，覆盖下文执行者的小横条推荐。T25.11本机实现/执行者验证完成：默认大封面、底部毛玻璃歌曲/进度/控制，站内离开电台自动出现，返回收起；可拖动/方向键移动和还原位置，隐藏后提供恢复入口，停止独立操作。共享唯一audio、网易云试听说明与原站出口保持。本片不接系统桌面PiP，用户成品审美与真机另验。

## 实际接入与证据

独立只读复核：大封面/黑灰材质/层级及隐藏恢复、唯一audio范围通过；指出菜单键盘还原位置后焦点丢失。已在closeMenu关闭后聚焦summary再执行action，真实Enter补验读回SUMMARY/更多悬窗操作、menuOpen=false且位置还原。复核者对该唯一修复给出resolved、限定disposition:ship；未重开全站或全套浏览器审查。最终截图同步重采，最新专项31文件零诊断/15页构建通过（包含并行T25.12当前可构建源，不代其内页审美验收）。

- 应用改动仅PersistentPlayer.tsx、新FloatingMusicPlayer.tsx、新floating-player.css。原音频载体/bind/MediaSession/导航恢复保持；旧persistent-player.css退出导入，历史文件保留。T25.09唱片细节及T25.10/T25.12电台内展示文件未修改。本轮未加依赖；单一DOM浮层复用原生Pointer Capture/ResizeObserver和原生range/details，最小适配为移动夹紧、隐藏恢复与真实播放控件。
- [29条原始观测](evidence/u12-p13-2026-10-13-floating-player/browser-checks.json)保留初采和补验，不能解释为29个全绿断言。网易云Echoes原生1618.334966秒，session2c63616b跨首页/About/Starlight保持唯一audio，返回电台time203.835949仍playing；隐藏后知识库不反复弹窗。Brain Damage显示30秒/原站入口，最终time30、ended=true/error=null，未自动跳曲。
- 最终cloud《抚琴小夜曲》479.56秒、下一首《和那些人一样》514.813333秒；原生解码/切歌通过且始终1audio。暂停、原生seek60、音量滑块.4、恢复焦点主播放键、音量Escape回触发键、独立停止移除src/曲目/悬窗已验证。读回没有保存凭证或完整临时音频URL。
- 桌面窗口320×417.171875，390px窗口320宽、320px窗口288宽，均夹紧；640×360横屏窗口300.171875高/主播放键56px仍在视口。真实拖动到边界读回24/24，方向键与Home还原通过。减少动画/透明CSS分支存在，本轮未实际切换偏好，不冒称偏好/真机已实测。
- 第一批查看后集中补键盘恢复焦点，独立复核后仅补菜单还原焦点，再做最终desktop/390确认。[最终桌面](evidence/u12-p13-2026-10-13-floating-player/final-desktop.jpg)、[最终390px](evidence/u12-p13-2026-10-13-floating-player/final-mobile390.jpg)、[320px](evidence/u12-p13-2026-10-13-floating-player/mobile320.jpg)、[横屏](evidence/u12-p13-2026-10-13-floating-player/landscape.jpg)分别保留。viewport reset/快连续导航后有截图未绘制正文，祖先computed颜色/opacity/visibility仍可见；未把该帧当全页视觉通过。等实际页面稳定后，以同步AX/截图保存最终SiteLayout常用网站页，正文和悬窗均可见；不为初采/捕获问题修改首页/布局源码。
- 工具初次DOM range fill未改变真实进度，原生AX setValue补验通过；details summary的DOM role定位未匹配，以原生AX及已观察文本完成菜单操作。导航后立即reload未等SPA落位导致About重新加载，随后明确新music文档做最终验证；这些初采与回归问题分别保留，不归作已修复的应用缺陷。
- 22现有music:test通过；最终专项astro check31文件0错误/警告/提示，生产15页通过（既有chunk大小/404重叠警告仍在）。Impeccable机械detector一次返回[]。未重复跑全仓首页专项或宣称所有页面视觉通过。原4348审核服务未重启，status authorized=true；构建后短期网易云索引已重建，10首试听/1首完整，刷新worker保持。
- 可体验地址仍为4348。最终保留`/personal-homepage/links/`的大封面窗口，cloud暂停在1:00，默认视口已还原；点击继续播放或返回电台可体验。无Git提交/推送/正式部署；其他对话61173独立预览不改。当前只完成站内浮层，关闭/刷新文档与系统PiP边界仍见下节。

以下为同日选择前的调研历史：P13 / R04、R12 / U12、U14 / T25.11，承接T25.02；外观选择及实际接入以本文开头最新记录为准。

## 用户目标与实际基线

用户提供最新毛玻璃底部播放条截图，要求离开音乐电台后自动出现悬窗，先调研优秀播放器形式供选择。沿用黑灰、圆润克制、苹方及现有歌曲/封面/进度/音量；不换音源或构造新的音乐播放实例。

实际PersistentPlayer已有跨页唯一audio，state.track存在且离开music路由才显示迷你条。当前为底部居中宽条，桌面最大960px，手机整行；未提供自由拖拽、封面展开或桌面画中画。现有关闭控件调用stop，新的“隐藏悬窗”与“停止播放”需要分开，具体选择后验收。

## 已核对的参考

| 来源ID | 形式与实际证据 | 对本站的适配判断 |
| --- | --- | --- |
| P13-MINI-REF-01 | [Spotify Miniplayer介绍](https://community.spotify.com/forum/en/discussion/5956132/introducing-the-spotify-miniplayer-to-spotify-desktop)：官方社区作者展示方形、矩形、细横条，打开/关闭不打断播放；[原图](https://ca.v-cdn.net/6038735/uploads/images/170591iD8205BD23A7FD00F/Amayy_0-1710942636526.jpeg)已用实际浏览器看图 | 首选小横条：封面/歌曲信息+主要播放控件，进度细线与音量展开，适合阅读其他栏目。可再展开封面卡；属于本站建议，不冒称Spotify原版已含本站全部控件 |
| P13-MINI-REF-02 | [Apple Music官方手册](https://support.apple.com/zh-cn/guide/music/mus71d7dcfce/mac)：大封面、指针进入显控件、隐藏封面缩小、歌词/队列；[大封面原图](https://help.apple.com/assets/6940592177CC4A95400B60EF/694059233A98DA7C77096BC2/zh_CN/b5f567b9d6ebd1ebe24b396d873d7f8f.png)实际浏览器加载成功（检索工具首次cache miss不当作图像不存在） | 适合重视专辑氛围，遮挡面积较横条大；可作为展开态。手机控件保持可见，不照搬仅hover交互 |
| P13-MINI-REF-03 | [Sleeve 3官网](https://replay.software/sleeve)：可调整封面大小、布局/位置/背板、显示或隐藏播放控件；[横向挂件原图](https://replay.software/sleeve/images/ScreenshotAlbum2.png)实际查看，官网主题/布局可读 | 最轻巧的封面挂件方向，可借封面圆角、软阴影和少量歌曲文字；功能较隐藏时的横条弱，需明确保留暂停/返回入口 |
| P13-MINI-REF-04 | [Cider 4.0.27作者发布说明](https://cider.sh/changelogs/4.0.27)：Cider Square/Compact及Aqua、Aluminum、Minimal、Winamp(1998)皮肤，歌词/队列同窗展开 | 复古备选。只验证作者功能说明，未安装客户端或逐皮肤视觉体验，不排进本轮三项已看图的主推荐 |

以上是体验/布局参考。未安装播放器、引入其框架、复制源码或把官网专辑图/宣传图纳入生产素材；版权/代码授权不因可见而成立。远程官方原图仅作为本轮参考链接。

## 推荐与待选择

执行者建议：默认借Spotify小横条结构，保留本站毛玻璃/圆角；点击封面再进入Apple式封面展开态。Sleeve可用于轻量封面/文字质感。该组合是推导的本站方向，尚未获得用户选择。

已发出三项选择：1小横条+点击展开封面（推荐），2大封面小窗，3封面挂件。没有自动把默认选项当作用户已确认。

拟定行为：有当前曲目时站内离开电台自动出现，返回电台收起，暂停/进度/音量仍操作同一audio；手动隐藏后保留可恢复入口且当前站内浏览不反复打扰。停止播放是独立动作。拖拽需留专用区域和非拖拽替代，保持屏幕边界/键盘/触摸/减少动画可用。具体尺寸、展开和手机形式在选择后写入SYSTEM并分片实施。

## 网页悬窗与系统窗口边界

站内浮层与系统画中画不同：前者可随本站路由自动出现；后者需实际浏览器支持/许可。Chrome官方[Document PiP](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)可承载任意HTML并置顶，网站不能指定其桌面位置，窗口不能比原文档活得更久；[媒体自动PiP](https://developer.chrome.com/blog/automatic-picture-in-picture-media-playback)自Chrome134起有支持，需正在有声播放、音频焦点、Media Session回调及浏览器权限/媒体参与条件，不宣称所有浏览器都能自动开窗，也不以普通window.open冒充置顶。本轮未在Codex IAB、手机或系统桌面验证PiP；初期建议站内悬窗，是否另做系统窗仍待明确。

资源提醒：用户已收藏的[Anime.js Draggable](https://animejs.com/documentation/draggable/)已核对DOM拖拽能力，可参考边界/拖动机制；尚未安装或采用，具体依赖按已存在能力和缺口取舍。

## 交付与下一步

已核对三项主参考的实际图片、原始说明及Cider备选/浏览器能力说明。无应用代码/依赖/服务变更，无构建或播放回归的新增完成声明，未提交/发布。用户选择后仅推进悬窗外观与路由自动显示，随后验收唯一audio、暂停/隐藏/恢复、返回电台、拖拽边界和桌面/手机。
