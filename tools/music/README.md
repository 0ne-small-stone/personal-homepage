# Echoes 音乐接入工具

对应 P13 / R04、R12 / U12 / T20.01、T21.01、T25.01。网站仍为 Astro 静态主站，音频不进入仓库。本地索引使用 music-metadata 12.1.0（MIT），浏览器只读公开曲目信息。

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

## 考拉连接

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
