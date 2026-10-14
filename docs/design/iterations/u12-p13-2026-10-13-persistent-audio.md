# P13 全站持续播放

- P13 / U12、U14 / R04、R12 / T25.02；2026-10-13。
- 用户要求离开音乐电台页面后音乐继续播放。此前推歌功能请求仍保留，T22–T24随后接入，不以本片代替。
- 最小实现：复用Astro ClientRouter与transition:persist，全站保持同一个音频实例；两个音源共用播放状态。电台页保留现有播放构图，其他页面显示底部迷你播放条（曲目、暂停/继续、上一/下一首、进度、音量、返回电台和停止）。
- 公共HomeLayout、SiteLayout与Starlight官方组件扩展接入运行时；不修改首页形体/光学/章节源码。播放器无歌曲时不显示，也不自动播放。
- 范围：站内同标签页客户端导航、前进后退；刷新、关闭标签页/浏览器、外部网站和网易云官方iframe不冒称持续播放。
- 当前：本机实现/执行者验证完成，未提交、推送或部署；用户审美、真机后台/锁屏另验。

## 实现与体验

[网易云模式与推歌本机预览](http://127.0.0.1:4348/personal-homepage/music/?mode=netease)，本地模式通过页头切换；4347仅静态预览，没有推歌接口。4348只在回环监听，未设开机启动。

audio-session管理唯一audio、队列、媒体事件、进度/音量与错误；PersistentPlayer在三种布局使用同名lssh-audio持久岛。当前音乐入口沿用另一音乐对话的RadioLibraryExperience/NetEaseMusicCatalog，不回退新曲库布局。旧展示组件也改用同一状态，未启用新的播放渠道。

导航不重建src/load；浏览器DOM搬运自动暂停的分支由before-swap/after-swap恢复，显式用户暂停、停止和换曲以修订号优先。早包另一布局预览paused=true失败保留，最终构建与该对话独立补验通过。不用秒数记录模拟连续播放。

Starlight0.42.5 Search只监听DOMContentLoaded，首次客户端进入知识库会空框。按MIT复用官方结构/样式，扩展page-load初始化、断连销毁Pagefind与快捷键监听；完整许可随副本保存。修正Starlight侧栏重复base前缀，没有新搜索框架。

## 实际验证

- [浏览器记录](evidence/u12-p13-2026-10-13-persistent-audio/browser-checks.json)保留初采与最终确认。最终同一session9eba5e89-76f5-4814-bca7-a690f314b94f：网易云→知识库/搜索结果→暂停返回→关于/首页/前进后退，时间连续；本地源再用同一audio启动，0.104797→栏目0.482268→知识库182.4秒，paused=false、一个audio。
- 主动暂停返回不自动开始；模式互斥；迷你暂停/继续、40/70秒seek、.4/.35音量、下一首和停止移除src/迷你条实际核对。少数Playwright点击未触发，以新AX状态下原生控件补验，不以工具调用成功当功能成功。
- 390×844实际截图/操作无横向溢出，音量可展开。[桌面](evidence/u12-p13-2026-10-13-persistent-audio/desktop.jpg)、[手机](evidence/u12-p13-2026-10-13-persistent-audio/mobile.jpg)。手机上下首在完整电台控制，迷你条保留返回入口。
- 知识库搜索“阅读”返回4条结果，结果导航持续播放，再次Ctrl+K/Escape有效。首页只验导航/音频，不验光学或整套章节动画。
- npm run music:test共12项通过（音频6、推歌6）；首轮队列测试因Windows沙箱rename EPERM失败，正常本机权限运行通过。
- 音乐/共享布局/知识库扩展28文件专项Astro检查零诊断；生产15页通过。全仓另有并行首页GlassTriangle缺Vector3两处诊断，未改其源码，不宣称全仓检查通过。

推歌/账号/10首专辑写入属[独立T22–T24记录](../../technical/iterations/t22-t24-p13-2026-10-13-recommendations.md)。官方iframe、外站、刷新/关闭标签页不支持此文档的跨页保留；真机后台未验证。
