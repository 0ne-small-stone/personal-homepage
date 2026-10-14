# P13 本地曲库宽度收缩修复

- P13 / U12 / R04、R12 / T25.13；2026-10-13。
- 用户要求继续优化排版，并用当前本地专辑详情截图指出右侧巨大空白。该图覆盖T25.12执行者允许保留的判断；先修实际布局故障，不用额外内容填空。
- 使用已加载的Impeccable layout流程；context本会话已执行，不重新初始化。保留T25.12的黑灰满屏、共用工具带/内容阅读栅格、曲目缩略图和底栏，以及原专辑/唱片/歌词/播放。
- 实际2327×923中radio-cloud宽2327，但继承music-shell.css旧grid的align-items:start；切为纵向flex后，子页头只宽783、子壳704.969，阅读区414.969，形成左侧挤压和右侧大片空白。网易云外层没有该旧属性；T25.12未充分核验本地壳宽，不能把先前大屏网易云证据推广到本地模式。
- 单片施工目标：固定壳的直接音源外层明确横向stretch，页头/目录壳明确width100%/min-width0；内部仍按原SYSTEM适度限宽并居中。标题→歌曲→控制阅读路径不改，侧栏/音源/搜索与目录共享锚点，不新增列或装饰。
- 本地修复/执行者验证完成。一次集中验证未发现需追加修正的布局故障，随后收口；媒体服务/权限/悬窗/首页不改，未提交/部署。成品审美与真机另验。

## 实现与验证

仅改music-radio.css三处：音源flex壳明确align-items:stretch，radio-topline与music-catalog-shell明确width100%/min-width0。未改组件、字体、尺寸比例、依赖或音频所有者。

原始[用户截图](evidence/u12-p13-2026-10-13-width-repair/user-blank.png)、[修复前画面](evidence/u12-p13-2026-10-13-width-repair/before.png)保留。修复后：

| 状态 | 实际结果与证据 |
| --- | --- |
| 本地大屏专辑/详情/歌曲 | 2327×923：页头/目录壳均宽2327，内容窗格2111，阅读宽1376且两侧均衡，搜索/阅读右缘均1954.5。[详情](evidence/u12-p13-2026-10-13-width-repair/wide-detail.png)、[专辑](evidence/u12-p13-2026-10-13-width-repair/wide-albums.png)、[歌曲](evidence/u12-p13-2026-10-13-width-repair/wide-songs.png) |
| 本地常规桌面详情 | 1280×800：页头/壳宽1280，阅读990，搜索/阅读右缘1238。[画面](evidence/u12-p13-2026-10-13-width-repair/desktop-detail.png) |
| 本地390/320详情、320歌曲 | 壳均占满viewport，搜索/阅读右缘分别364/294，无水平溢出。[390](evidence/u12-p13-2026-10-13-width-repair/mobile390-detail.png)、[320](evidence/u12-p13-2026-10-13-width-repair/mobile320-detail.png) |
| 网易云大屏/390专辑与歌曲 | fullWidth/searchRightAligned/balancedReading均true、horizontalOverflow=false；[390专辑画面](evidence/u12-p13-2026-10-13-width-repair/mobile390-netease.png) |
| 本地空搜索 | 宽度与对齐不变，无水平溢出 |
| 机械/构建 | 初始/最终layout detect均[]。第一次受限构建无法解析astro/config，标准本机权限重试成功；15HTML/Pagefind生产构建通过，仍有既有大chunk/404提示。仅CSS改动，未重复运行无关的类型/媒体服务测试 |

12个修复后状态和1个原始状态保存在[observations.json](evidence/u12-p13-2026-10-13-width-repair/observations.json)，修复后各状态壳宽/右缘/均衡检查均通过、无水平溢出，audioCount均1。61173静态预览已更新并实际重载；浏览器尺寸恢复。当前原图与测量补充了T25.12本地宽度遗漏，之前的执行者判断不当作本问题已通过。

可体验：[本地曲库](http://127.0.0.1:61173/personal-homepage/music/?mode=cloud)。进专辑→最美妙的旅行可检查原故障位置，再切歌曲/网易云核对。[最终用户窗口](evidence/u12-p13-2026-10-13-width-repair/after.png)保存；浏览器error日志[]，原选曲爱玲/245.4秒已恢复并暂停，测试尺寸已撤销。当前仅本机Chromium WebView验证，不宣称真机或正式部署完成；不扩大到其他排版变量。
