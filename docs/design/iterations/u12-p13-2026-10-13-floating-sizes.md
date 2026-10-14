# P13 大封面与迷你悬窗

- P13 / U12、U14 / R04、R12 / T25.15；2026-10-13。
- 用户两张裁图指出点阵拖动标记与封面文字混杂、顶部四项拥挤；随后明确除大版外还需要小版。继承T25.11真实悬窗与唯一音频，T25.14已独立记录，本片开始实施。
- 采用独立实色工具带，保留拖动、切换大小、隐藏；音量与返回收进更多入口。拖动为细水平把手，44px可触达/方向键及Home保持，封面不再被工具带覆盖。沿用已加载Impeccable布局/精简流程，不另换身份、字体或来源。
- 两态：大态320px宽/封面1:1；迷你296px宽/44px缩略图与曲目信息、44px原生播放/切歌及进度呈现。大小选择跨本站切页保留但不增加持久凭证；迷你更多菜单向下展开并预留空间。尺寸变化后沿用原夹紧和拖动状态，隐藏/恢复/停止保持独立。
- 源文件局部改FloatingMusicPlayer与floating-player.css，不改audio-session、服务或首页场景代码；工程、读图与用户审美分开验收，未提交/部署。

## 实际接入与交付

本地接入/执行者验证完成。FloatingMusicPlayer新增compact展示状态与大小按钮，大小只存在持久组件内，返回音乐页时收起再离页仍保持选择；没有浏览器长期设置或账号写入。大封面/44px缩略图共用原真实封面和错误回退。正常流工具带与细水平拖动把手替代点阵覆盖，音量/返回移入原更多菜单，Escape关闭音量后焦点回更多入口。原拖拽/方向键/Home/ResizeObserver夹紧及唯一audio保持。

| 实际状态 | 结果与证据 |
| --- | --- |
| 大封面版 | 1280×800下320×473.171875px，工具带56px/三个44px操作，toolbarClear=true；封面1:1。[最终大版](evidence/u12-p13-2026-10-13-floating-sizes/large-final-full.png) |
| 迷你版 | 296×207.390625px，44px封面/控制，完整进度与切歌；[最终小版](evidence/u12-p13-2026-10-13-floating-sizes/mini-preview-final.png) |
| 菜单/音量 | 迷你菜单向下展开至407.390625px，菜单188px完整位于面板内；音量展开251.390625px，原生ArrowLeft及恢复ArrowRight实际更改0.75→0.74→0.75。Escape收起，未覆盖封面 |
| 键盘/隐藏/恢复 | ArrowLeft使x921→897，Home回边界；隐藏时time62.117/paused=false，恢复time62.512/compact，同一session且audioCount1 |
| 跨页状态 | 迷你→音乐页隐藏(time127.941)→首页恢复迷你(time129.692)，session相同/audio1/继续播放，大小未重置 |
| 窄屏 | 390×844下两态在视口内；320×740下两态宽288，按钮44px。原图[390小](evidence/u12-p13-2026-10-13-floating-sizes/mobile-mini-full.png)、[390大](evidence/u12-p13-2026-10-13-floating-sizes/mobile-large-full.png)、[320小](evidence/u12-p13-2026-10-13-floating-sizes/mobile320-mini-full.png) |
| 窄横屏集中修正后 | 844×390下大态封面119px、面板330.171875px、clientHeight/scrollHeight均330，controlsVisible=true；初批控制裁切记录保留。[最终](evidence/u12-p13-2026-10-13-floating-sizes/landscape-final.png) |
| 工程 | 专项check24文件零诊断，生产15HTML/Pagefind通过；最终layout/type检测[]。CSS修正后仅重建与有界确认，不重复无关类型/媒体测试。既有大chunk/404构建提示保留 |

19条原始状态含初采/修正后保存在[observations.json](evidence/u12-p13-2026-10-13-floating-sizes/observations.json)，菜单关闭时部分隐藏节点仍有rect，因此buttons数组不是可见性或完整可访问性证明，以实际AX/画面为准。`large.png`/`mini.png`为截图clip坐标失效的无效采集（黑/背景片段），不作成品证据；采用实际完整窗口截图，不修改或伪造播放器画面。[用户原图1](evidence/u12-p13-2026-10-13-floating-sizes/user-drag.png)、[原图2](evidence/u12-p13-2026-10-13-floating-sizes/user-toolbar.png)保留。

可体验：[首页悬窗](http://127.0.0.1:61173/personal-homepage/#radio)：先在音乐页选歌，离页出现悬窗；顶栏大小图标切大/小，更多提供音量/返回/还原/停止，隐藏后恢复入口继续音乐。61173已更新；最终恢复和那些人一样/129.9秒暂停、音量0.75并将迷你版还原右下角，测试尺寸已撤销，[用户窗口](evidence/u12-p13-2026-10-13-floating-sizes/user-window-final.png)保存，浏览器error日志[]。

本轮真实音频验证为本地考拉曲目，不推广为本轮重新验收网易云权限/试听地址。没有修改PersistentPlayer、audio-session、源/上传/授权服务或首页场景；真机触摸/系统PiP、正式部署和用户成品审美仍另验。未提交/推送；一次集中检查→一次修正→一次确认后停止美化。

初批桌面/390/320/844×390集中检查：两态、菜单、音量、移动、隐藏恢复、跨页大小记忆均保持单audio和同一session。窄横屏大态的新增56px正常流工具带使原215px封面预算失效，panel342/scrollHeight386、控制末端396.172超出panelBottom366；原图保留。一次集中修正将短屏封面预算215→271，其他显示变量不再追加美化。
