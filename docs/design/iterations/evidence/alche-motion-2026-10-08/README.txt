ALCHE 原始帧研究播放器

打开方式
直接双击 index.html。也可从本地静态预览打开。无需联网、安装依赖或启动服务。
index.html 与 frames/ 必须放在同一目录。页面可选择七段、播放/暂停、0.5×/1×、拖动时间轴、上一帧/下一帧。
默认暂停。原始截图没有鼠标光标和声音轨道。

来源与边界
采集站点：https://alche.studio/
日期：2026-10-08。真实 Chrome 软件 WebGL；不作为帧率或真机性能基准。
原采集桌面视口1440×900、手机390×844；CDP JPEG quality60，maxWidth960、maxHeight600、everyNthFrame3。
原始帧为桌面960×600、手机277×600。播放器只按原时间戳约每150ms选最近一张，强制保留各段首末帧。
239张留存JPEG共10,945,139字节（10.438MiB）；逐张复制后SHA-256与输入核对相同，没有重新编码、编辑或补帧。
原采集日志记录一条“Network request failed”，具体请求未记录。页面保留这项限制。
这些是研究证据，非本站产品资产；原站品牌与画面归原权利方。
可见调试控件、原站提示与黑场均按原帧保留。

时间线
播放使用原始timestamp之间的真实间隔，不按固定帧率压缩/拉长。
拖动使用“原时间戳减本段起点”的秒数，避免HTML range对大绝对时间值的精度截断；画面下方显示原帧绝对timestamp，保留6位小数。
时间轴位于两张留存帧之间时，显示此前最近的帧。到达末端显示末帧并暂停，再次播放从首帧开始。
操作步骤来自capture-original.cjs。没有逐事件采集时间；步骤中的等待时间仅供复现，未添加假定的动作时间点。

重建
需要Node.js。保留原始 clips-20261008 目录及其中 clips.json 与七段JPEG目录，然后运行：
  node build.cjs <原始clips-20261008目录>
build.cjs读取player-template.html、原始JSON和JPEG，在本目录写manifest.json、index.html及frames/。
manifest.json登记原文件索引、未更改timestamp、scrollY、字节数及SHA-256。
脚本不下载资源，不改原始输入。重建需要原始采集目录；当前交付只保留抽取后的239帧。
capture-original.cjs是采集时的原脚本副本，其中本机工具路径仅作为研究环境证据，不是应用运行逻辑。
source-input-report.txt与source-input-index.json是独立源码研究报告及定位索引。

实际验证
verify.cjs通过Playwright启动已安装Chrome，以file URL打开index.html。
可用PLAYWRIGHT_PACKAGE、CHROME_PATH环境变量指定本机工具位置。默认require('playwright')。
验证覆盖七段切换、每段首末帧、播放与暂停、0.5×、真实鼠标拖动、逐帧、390/320宽度；详见verification.json。
测试0个页面脚本错误、0个HTTP(S)请求。verified-desktop.png、verified-mobile.png为播放器界面检查图。
本记录不声称对参考站的真实GPU性能、所有浏览器或线上部署进行了验证。

文件范围
播放器相关文件由本次子任务新增；同目录sample-*.png、browser-observations.json等其他静态研究证据由主任务独立归档，未计入上述JPEG播放资源体积。
