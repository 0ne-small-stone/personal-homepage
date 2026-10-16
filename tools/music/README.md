# Echoes 音乐接入工具

## 电台内洛雪搜索与下载（2026-10-14，T25.27）

本机入口为 <http://127.0.0.1:61173/personal-homepage/music/?mode=cloud>，点击“找音乐”。无需跳转客户端即可搜索、选择来源实际支持的音质、下载/取消；完成后点“在曲库查看”并播放。下载写入洛雪当前目录，先核验HTTP完整传输、音频格式/时长与所选无损规格，再写标签/封面并原子发布。不会覆盖同名文件或改写洛雪数据库。

```powershell
node tools/music/lx-engine-setup.mjs
node tools/music/preview-service.mjs
```

要求Node24、已安装项目依赖及固定版本上游源码，安装时禁用依赖/上游启动脚本。源码/许可证及独立npm运行目录在 `.local-tools/music/lxserver`、`lx-runtime`；[来源说明](vendor/lxserver-NOTICE.md)。只读洛雪当前音源，本机已授权脚本的SHA256需匹配；换源需重新核对授权，不自动运行其他脚本。受限子进程只读兼容目录，不能写文件、创建子进程或加载原生扩展；来源请求限于已授权的原解析主机。标签写入由父进程完成。

`web-downloads.json`仅在完成后保存路径/大小/mtime指纹及公开曲目信息，Git忽略；临时`.part`不进曲库/考拉。后台同步同时接受洛雪completed与网页完成记录，核验后才发布云端目录。独立61173服务会合并尚未上传的已完成歌曲，提供限定ID/Range本机播放，上传后沿用考拉地址；网易云DPAPI登录仍自动恢复。服务未开启/静态线上页面会显示未连接状态，GitHub Pages不能执行这些本机功能。下载中断不自动续传，可重新搜索/下载。

专项验证：`node --test tools/music/lx-downloads.test.mjs tools/music/lx-service.test.mjs`。2首真实FLAC（129.47秒、16bit/44.1kHz）已下载、封面/标签读回、考拉核验，曲库20首/5张专辑；桌面/390px和实际云端音频播放已测，详见[接入记录](../../docs/technical/iterations/t25-p13-2026-10-14-lx-integration.md)。


对应 P13 / R04、R12 / U12 / T20.01、T21.01、T21.04、T25.01、T25.03–04。网站仍为 Astro 静态主站，音频不进入仓库。本地索引使用 music-metadata 12.1.0（MIT）；开发服务器可提供本机播放，生产站点需真实云盘地址。

2026-10-13 已选双模式外观：本地 Vinyl Vue、网易云 GlassMusicPlayer 结构与 CompScout 封套视觉。索引读取真实内嵌封面，复用 sharp 在私有索引旁生成 WebP，只通过本机开发页提供；生产不会复制封面文件或本机路径。来源与完整原许可见 `public/music/attribution.txt`。

运行 `npm run music:playlist` 可重新读取 Echoes 指定共享歌单的公开元数据，写入 `src/data/music/netease-playlist.json`。这是目录快照刷新，不是自动写入歌单、账号授权或音频下载；当前可用歌曲经网易云官方公开音频入口播放，失败时仍提供官方播放器。

## 本地目录

Windows 上读取洛雪的**下载目录设置**，解析真实音频标签：

```powershell
npm run music:index
npm run music:watch
```

第二条在前台监听，Ctrl+C 停止。每 5 秒观察一次文件，连续两次大小/修改时间一致再处理；`.part` 等临时扩展名不入库；没有完整时长或解析失败的文件不新增。实际目录监听不是音频完整性校验，暂停但仍不完整的下载还应以洛雪完成状态核对。不会读取自定义源、账号文件或改变洛雪设置。

其他目录：

```powershell
node tools/music/index-library.mjs --directory '你的下载目录'
```

输出 `.local-tools/music/catalog.json`，由 `.gitignore` 排除。它只含标题、歌手、专辑、时长、格式、采样率和位深，没有本机路径、音频或凭证。页面 `/music/catalog.json` 的开发请求读取新索引；前台每 15 秒读取一次，隐藏页面暂停轮询。**生产站点为构建时快照**，不因为本地监听开启而在线自动更新。

## 本机播放（2026-10-12）

先运行 `npm run music:index`，或保持上面的 `music:watch` 运行，再在另一终端启动：

```powershell
npm run dev -- --host 127.0.0.1 --port 4343
```

打开 <http://127.0.0.1:4343/personal-homepage/music/?mode=cloud>，点击当前曲目旁的原生播放按钮。页面显示“本机播放 · 考拉云盘待连接”，支持暂停和拖动进度。切换音源模式会暂停本机音频；全站持续播放另验。

索引另生成被忽略的 `.local-tools/music/audio-map.json`，其中的本机目录与相对文件名只供开发服务器读取，不进入公开清单、镜像清单或静态产物。开发音频接口仅接受本机、同源请求和已索引 ID，校验实际目录边界及文件大小/修改时间，支持 GET/HEAD 与单段 Range。文件改变而尚未重新索引时返回不可用状态，刷新索引后再播放。

`npm run build` / `npm run preview` 不提供本机音频；没有云盘分享的曲目在生产预览继续显示“播放待连接”。本机播放不表示云盘已上传、授权已成功或访客已能收听。验证命令为 `node --test tools/music/local-playback.test.mjs`，实际浏览器结果见[本机播放修复记录](../../docs/design/iterations/u12-p13-2026-10-12-local-playback.md)。

## 考拉连接

### 已接通的专用自动上传（2026-10-13）

`LSSH-Echoes` 已有18首真实FLAC、3张专辑和18张内嵌封面；电台读取独立只读分享。官方客户端安装成功，但初始化遇到429，未建立客户端账户。用户选择官方文件请求作为上传入口，权限仅创建文件，上传密钥不进入网站或仓库。上传链接采用RSA-OAEP密封，本机私钥由Windows DPAPI当前用户加密；仅同一Windows用户可使用。

本机已建立“LSSH 音乐自动同步”当前用户登录启动项，并正在后台运行。监听洛雪当前下载目录 `E:\音乐\声音玩具`；新歌曲必须在洛雪下载列表标记completed，且文件与索引大小/修改时间一致，才会上传。首次18首按固定文件指纹导入。更改洛雪下载目录后需重启同步服务。电脑关闭、睡眠或未登录时不会上传。

```powershell
npm run music:sync         # 单次上传、只读核验、发布目录快照
npm run music:sync-watch   # 前台每60秒检查，Ctrl+C停止
& 'tools/music/start-sync.ps1' # 启动后台索引和上传；已运行时不重复创建
```

不要与后台服务同时运行前台同步；如需排查，先在任务管理器结束本项目的 `sync-service.mjs` 及其两个子进程。可在Windows启动应用中禁用“LSSH 音乐自动同步”，或移除当前用户Startup文件夹内同名快捷方式。仅在考拉分享设置中撤销音乐专用文件请求链接即可终止其上传权限；原只读分享独立保留。

文件请求自动放入 `LSSH-AutoSync` 子目录；音频/封面采用带内容SHA256的不可变版本文件，目录使用 `catalogs/时间戳-SHA256.json`。先上传并经只读分享验证，再发布目录；失败或429保留上一份清单，下轮重试。重复同步复用已核验文件；本地删除仅更新目录，不反向删除云盘文件。源码不上传/覆盖其他目录，也不改变洛雪原始文件。

开发页 `/music/?mode=cloud` 每15秒读取同源目录，后台标签暂停自动刷新；目录刷新与当前播放分开。当前实际入口为 <http://127.0.0.1:4344/personal-homepage/music/?mode=cloud>。生产构建已包含18首云盘音频和18张封面的公开URL；**线上静态版本仍需重新构建发布**，未配置线上实时代理或自动部署。故不能把本机同步写成线上已自动更新。

只读公开配置在 `src/config/music-cloud.json`；私有索引、上传密文、加密私钥、进程记录和日志均在被忽略的 `.local-tools/music`。测试：`node --test tools/music/cloud-library.test.mjs`。完整授权、失败和验证证据见[考拉接通记录](../../docs/technical/iterations/t21-p13-2026-10-13-cloud-sync.md)。

以下保留早期连接尝试，状态以本节及最新迭代记录为准。

```powershell
npm run music:connect
```

程序发起 Nextcloud 官方 Login Flow v2，输出登录链接，用户在官方浏览器页完成登录/授权。只创建 `LSSH-Echoes` 文件夹与 permissions=1 的只读分享，逐步读回验证；同名文件夹存在时停止，避免改变未知目录。凭证只在内存，用后请求撤销，未在本地保存。非成功状态写入 `.local-tools/music/cloud-setup.json`，不得把发起登录写成已创建。

2026-10-11 两次用户完成授权后，考拉 OCS 身份接口均拒绝；第二次明确 HTTP401 / OCS997。文件夹、分享与音频上传都未完成；撤销请求也受401拒绝。用户可在考拉个人安全设置移除两条 `LSSH Echoes folder setup` 授权记录。浏览器控制工具和 Windows备用入口启动失败；没有从浏览器文件提取登录凭证。

有真实文件夹分享后，索引可生成 Nextcloud 文件下载地址：

```powershell
node tools/music/index-library.mjs --auto-lx --share-url 'https://pan.koala-studio.org.cn/s/实际分享编号'
```

这只生成地址，**不代表文件已经上传或直链可播放**。优先使用 Nextcloud 官方桌面客户端同步专用目录；账户权限与配置完成后验证新增、修改、删除、上传未完成时的隔离。`--mirror '同步文件夹中的catalog.json'` 可额外写一份公开元数据清单；音乐文件仍由官方客户端同步。

线上实时目录可由 `PUBLIC_MUSIC_CATALOG_URL` 指定，需要支持本站跨域读取，或接入经过验证的按需代理。云盘会话凭证不进入该 URL、前端代码或公开目录。没有实际公开索引时保留构建快照；GitHub 发布和自动更新单独配置。

## 网易云

共享歌单 Echoes：18476425375。模式切换后才创建官方 iframe，`auto=0`；切走销毁 iframe，当前不保证外部播放跨页持续。外部播放器实际显示/播放与本站模式、手机布局分别验证。推歌提交、审核和写入 T22–T24 保留后续队列。
# 网易云推歌与全站播放（2026-10-13）

2026-10-14个人收听登录：`npm run music:preview`的网易云页头提供“登录网易云”，本人App扫码确认后，用Windows DPAPI CurrentUser加密保存在Git忽略的`.local-tools/music/netease-login.dpapi`，启动自动解密并核对账号，正常服务重启不再扫码。退出当前账号同时清除保存的登录、私有索引及当前页面NetEase播放；真正失效需重登，暂时断网保留密文重试。个人音源URL仍只在服务内存，不进入公开匿名JSON、静态目录或浏览器存储。不会读取推歌管理员登录或添加歌单写入权限，播放仅按当前账号实际权限；正式线上每用户隔离和非Windows部署另验。T25.23只内存的历史限制已由用户最新T25.24覆盖，见[保存与恢复](../../docs/technical/iterations/t25-p13-2026-10-14-saved-login.md)。

2026-10-14独立音乐页面预览：先`npm run build -- --outDir .local-tools/music/library-layout-dist`，再`npm run music:preview`，默认只监听`127.0.0.1:61173`。服务同源提供`/personal-homepage/music/netease-playback.json`；播放缓存放在被忽略的`.local-tools/music/playback-runtime`，不受页面重建清空影响，启动/每2分钟刷新，缺失或临近过期按需合并请求刷新。上游暂时失败只使用仍有效缓存，无有效缓存返回503并15秒退避；不把服务缺失回退成HTML音频。`MUSIC_PREVIEW_DIR`可选已有构建目录，`LSSH_MUSIC_PREVIEW_PORT`可改回环端口。该服务不包含管理员授权/推荐写入，不替代`music:recommend`，也不是公开部署。实际修复与测试见[T25.21](../../docs/technical/iterations/t25-p13-2026-10-14-playback-service-repair.md)。

`npm run music:recommend`启动仅监听127.0.0.1:4348的本机推荐/审核/网易云适配服务，并提供`.local-tools/music/persistent-audio-dist`里的静态预览。先执行`npm run build -- --outDir .local-tools/music/persistent-audio-dist`；`MUSIC_PREVIEW_DIR`可选择已有构建目录，`MUSIC_RECOMMEND_PORT`可更改回环端口。服务是本机验证工具，没有设置开机启动、公开端口或默认线上服务器。

网易云模式“推荐一首歌”填写昵称、单曲链接或ID、理由，收到服务端成功结果才显示已提交。推荐保存在Git忽略的`.local-tools/music/recommendations/queue.json`，重启不丢失；浏览器只记自己的随机查询标识，没有网易云凭证。`/personal-homepage/music/manage/`提供通过/拒绝、同步状态与失败重试，写入必须来自本机同源页面。仅通过审核的歌曲能写入Echoes18476425375；先检查已有曲目，添加后再次读取确认，重试不会重复添加。上游授权失效单独标记，不能把HTTP200当业务成功。

管理员用陈世先stt的网易云App扫码确认。服务验证账号13615478042与目标歌单身份，凭证仅进程内存；退出授权或重启需重新扫码，不写入仓库、JSON、浏览器存储或页面。第三方API仅在Node工具调用，未启动它的通用API服务器，也未启用解锁/下载插件。正式线上服务尚未部署，静态站默认显示推荐服务未接通；将来通过`PUBLIC_MUSIC_RECOMMENDATION_API`配置经过独立认证/持久化/同源或CORS验证的线上接口。不能直接公开此本机管理服务。

验证：`npm run music:test`覆盖音频保留、导航导致的媒体暂停恢复、显式用户暂停优先、队列/进度、提交持久性、重试/并发去重、审核隔离、授权失效和读回失败。实际账号验证已完成，并根据用户指定把The Dark Side of the Moon标准版428503的10首加入共享歌单。`npm run music:playlist`读取全部11首公开元数据，补齐网易云歌单接口只返回前10首完整对象的缺口。

全站音频由HomeLayout、SiteLayout和Starlight同名持久React岛承载。站内导航、前进后退保留同一个audio；页面组件不负责销毁音频。刷新/关闭标签页/前往外站会终止当前文档的音频；网易云官方iframe不能在本站持久搬运。手机浏览器的后台/锁屏调度需真机另验。

网易云短期播放索引：`node tools/music/playback-index.mjs`生成一次，`node tools/music/playback-index.mjs --watch`每2分钟刷新。默认写入上述被忽略的构建目录，可用`MUSIC_PREVIEW_DIR`指定；构建会清除索引，构建完成后须重新生成。工具请求平台实际许可的标准音质地址，检查官方CDN、MIME/MP3头，保留试听提示，未启用账号解锁或替代音源。地址最多缓存10分钟，不写入正式曲目快照或Git。当前用独立刷新进程维持已授权服务；下一次正常启动`music:recommend`会自动启动同一刷新模块。正式静态部署需要另外配置短期索引刷新能力，当前本机通过不代表线上已接通。


## 2026-10-15 核心曲库与正式网站边界

同源Node音乐预览增加搜索/推荐、个人曲库、分类播客、手动刷新及节目下载核对。官方SDK白名单和单audio继续复用，账号Cookie/DPAPI/下载文件不纳入静态产物。NetEaseMusicCatalog先探测服务，成功后延迟加载核心UI；不可用则展示SharedPlaylistCatalog共享歌单及重试，不把本机账号后台当成Pages功能。保留公网内网音源提示、原站入口及公共catalog版本快照。界面/服务/测试源码各守原目录，来源与检查见docs/technical/acceptance/latest-release-2026-10-15.md。


## 2026-10-16 增量与启动

Windows本机可用 `npm run music:start` 后台启动/复用现有回环服务，无启动项或新凭证；源码入口tools/music/start-preview.ps1。推荐刷新优先换入同分类其他候选，仍按快照稳定分页、合并并发、账号隔离，无替代项保留当前内容。三张原创间隙WebP仅用于核心主页入口，原黑胶/账号/下载不重做。公网无服务仍保留原共享歌单与内网提示，静态Pages不运行个人账号后台。实际范围与验证见docs/technical/acceptance/progress-2026-10-16.md。
