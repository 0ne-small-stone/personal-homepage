# P06 文章续读证据

2026-10-15，执行者定向检查，待用户体验。范围与行为见[本片](../../u09-p06-2026-10-15-reading-progress.md)。

- browser-checks.json保留所有真实DOM测量，未读取/注入浏览器存储。测试通过页面点击、滚动、刷新、临时标签关闭/重开及原生返回完成。
- before-leaving.jpg与reopened-from-overview.jpg为首次重新进入对照；paragraph-before-refresh.jpg为稳定段内位置。final-resumed.jpg为最终原生返回后的稳定文章。
- reload-restored.jpg和new-tab-resumed.jpg属于修正前3px高度偏差阶段，不作为最终通过证据；fixed-new-tab-top-entry记录及new-tab-fixed.jpg为按实际操作行高度校准后复核。同一桌面段内比例差0。
- mobile-resumed.jpg请求并实测390×844，为浏览器模拟，不是真机；换行后以段内比例续读，约0.134px取整差。
- immersive-before-close.jpg与reopened-after-immersive.jpg保存沉浸关闭与普通模式重开同一条目；工具会在跨调用时退出原生全屏，故进入、翻页、采集与关闭在同一次调用完成。条目前间距差约0.406px。
- source-verification.json记录3份运行时文件、状态测试、CI步骤及既有PDF/沉浸文件不变核对。check.txt、local-build.txt、release-build.txt和state-tests.txt只去掉行尾空格及文件末多余空行，原日志在忽略的.ci-tmp内。

默认用户标签实际1096px宽，新临时标签默认1280px宽，顶部目录形态不同，故比较阅读基线相对位置/段内比例；截图原图保留。最后浏览器控制台error为空。未验证整机/浏览器进程重启、实际BFCache命中或实体手机；存储损坏/不可用不做隐藏状态注入，纯状态测试仅证明解析降级和优先级规则。浏览器本地记录不上传，不含教材原件、凭证或真实草稿。
