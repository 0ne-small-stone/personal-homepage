# P13 参考驱动的排版与空间层级

- P13 / U12 / R04、R12 / T25.12；2026-10-13。
- 用户否决T25.10的优雅排版/视觉对齐，要求多参考优秀设计。此前机械核对通过不等于用户审美通过。
- 主技能Impeccable layout/typeset；本会话context已在T25.08执行，不重复初始化。保留黑灰、既有字体、满屏无外框、封面小图、毛玻璃、唱片/歌词及真实媒体。
- 实际查看Apple Music中国区新发现页（US专辑请求重定向）、Cider官方专辑截图、Tauon官方主窗口。YesPlayMusic作者demo实际Deployment Paused，不当可用参考。只研究结构，不搬入第三方框架、字体、资产或播放渠道。
- 旧版诊断：页头/搜索/标题各自占一段，大屏曲目列无限延伸，选中条过亮，歌曲文字小、底栏厚；滚动整个页面让侧栏/标题离场。机械layout/type扫描均[]，不能据此否认这些问题。
- 新空间关系：身份与侧栏为一列，音源/搜索为统一工具带；主要阅读任务是标题→列表→选歌，选中轻提示，次级选项靠近目录尾部。固定工具栏/侧栏和底部控制，仅内容窗格滚动；标题、表头和行内容共用阅读栅格。两源复用同一Header/TrackList，避免分别手调。
- 字体角色沿用项目：身份22/500、内容标题28/500、歌名16/500、歌手/元数据13/400、数据12/400，行高与局部间距分别表达同组/段落，真实长文本/缺图/空结果保持可用。
- 本地实现与执行者验证完成；按一次桌面/手机/状态集中检查→一次修正→一次确认上限交付，随后停止美化。音频、悬窗T25.11、音源与推荐服务不改；未提交/部署。用户成品审美、真机和其他浏览器仍另验。

## 参考与实际采用

| 来源 | 实际读图 | 采用范围 |
| --- | --- | --- |
| [Apple Music 中国区新发现](https://music.apple.com/cn/new) | [原图](evidence/u12-p13-2026-10-13-elegant-layout/reference-apple.png)；US专辑地址实际重定向到此页 | 侧栏与内容职责、明确的标题分组和紧凑工具区；不是本轮专辑详情验证 |
| [Cider 官网](https://cider.sh/) / [官方专辑截图](https://cider.sh/client/album.webp) | [原图](evidence/u12-p13-2026-10-13-elegant-layout/reference-cider.png)，2395×1065 | 标题/曲目/底部控制比例，主要阅读区域的稳定节奏 |
| [Tauon 官网](https://tauonmusicbox.rocks/) / [官方主窗口](https://tauonmusicbox.rocks/_astro/scr.C0AQBHoy_ZkxhJy.webp) | [原图](evidence/u12-p13-2026-10-13-elegant-layout/reference-tauon.png) | 紧凑曲目数据与低干扰控制；不照搬桌面窗口框架 |
| [YesPlayMusic 作者仓库](https://github.com/qier222/YesPlayMusic) | 作者demo实际Deployment Paused | 未将不可用demo作为新视觉证据 |

截图只保存在研究证据中；未作为网站资产，未复制第三方字体、代码、音频或框架。沿用本站字体栈和真实封面/歌词。

## 实际改动

- 新增MusicLibraryHeader与MusicTrackList，供本地/网易云两源共用。前者只消费原查询/音源切换回调，后者只消费原选歌回调；封面、缺图、完整文字提示及原生语义控件保留。
- LocalMusicCatalog、NetEaseMusicCatalog、RadioLibraryExperience、LibrarySidebar使用统一壳；搜索移到工具带，下载/音源/更新/许可在目录尾部或侧栏，原推荐入口保留。
- music-radio.css按SYSTEM参数实现固定页头/侧栏/底栏，内容窗格独立滚动并可键盘聚焦；内部限宽不增加外框。弱化选中面、扩大曲目主文字、收紧底栏，保留无描边毛玻璃及满屏黑胶/实时歌词。
- 未修改PersistentPlayer、FloatingMusicPlayer、audio-session、音源服务、上传/授权或首页应用代码。本轮未新增依赖。

## 有界验证与证据

初批集中读图为[桌面](evidence/u12-p13-2026-10-13-elegant-layout/desktop-initial.png)、[大屏](evidence/u12-p13-2026-10-13-elegant-layout/wide-initial.png)、[390px](evidence/u12-p13-2026-10-13-elegant-layout/mobile-initial.png)、[320px](evidence/u12-p13-2026-10-13-elegant-layout/mobile-320-initial.png)。发现手机音源等分按钮折行、触达不足44px，以及10px滚动条占位导致工具区/内容右缘不同。一次集中修正为按内容宽且不折行的44px按钮、44px返回控件与固定滚动条占位，补内容区域语义和键盘焦点；初批问题不删除。

| 最终状态 | 结果与证据 |
| --- | --- |
| 1280×800 | [画面](evidence/u12-p13-2026-10-13-elegant-layout/desktop-final.png)。页头72、侧栏216、曲目64、底栏104；搜索/阅读右缘均1238，无水平溢出 |
| 2327×923 | [画面](evidence/u12-p13-2026-10-13-elegant-layout/wide-final.png)。阅读宽1376；工具/内容左578.5、右1954.5一致；主控制居中，文档高度923 |
| 390×844、320×740 | [390px](evidence/u12-p13-2026-10-13-elegant-layout/mobile-final.png)、[320px](evidence/u12-p13-2026-10-13-elegant-layout/mobile-320-final.png)。按钮单行44px，侧栏横排，底栏112；320px搜索/阅读右缘294，无水平溢出 |
| 空搜索/键盘滚动 | 空结果前后搜索与内容右缘均1238；PageDown只使内容scrollTop到391，页头y0/侧栏y72保持，Home返回顶部 |
| 保留专辑与歌曲 | [本地专辑](evidence/u12-p13-2026-10-13-elegant-layout/local-albums-final.png)、[详情](evidence/u12-p13-2026-10-13-elegant-layout/local-detail-final.png)、[歌曲](evidence/u12-p13-2026-10-13-elegant-layout/local-songs-final.png)。实际18首/3张，选歌与原曲库状态保持 |
| 黑胶/歌词/真实播放 | [播放页](evidence/u12-p13-2026-10-13-elegant-layout/listening-final.png)。本地实际time6.330/paused=false；seek120后120.167，返回后120.639/paused=false；audioCount均1。验收后暂停 |
| 机械检查 | 初始/最终layout、type扫描均[]；不能据此宣称审美获用户认可 |
| 工程 | 音乐专项24文件check零诊断；生产15HTML/Pagefind通过，构建至.local-tools/music/library-layout-dist；仍有既有chunk/404构建提示。浏览器最后读取error日志[] |

16条原始观测（含初批/修正后与功能状态）保存在[observations.json](evidence/u12-p13-2026-10-13-elegant-layout/observations.json)。可体验入口[音乐电台](http://127.0.0.1:61173/personal-homepage/music/?mode=netease)：切歌曲/专辑、搜索、滚动，再切本地收藏选歌；底栏打开黑胶页，seek后返回。浏览器测试尺寸已恢复。

本轮仅确认Chromium WebView中的本地布局与上述交互；Firefox滚动条、真机、第三方服务授权/完整网易云播放、同步和正式部署未重新验收。执行者读图允许保留本片，不代替用户成品审美确认；未提交/推送。
