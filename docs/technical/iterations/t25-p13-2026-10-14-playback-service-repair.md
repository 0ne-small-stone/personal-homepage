# P13 网易云播放服务缺失修复

- P13 / R04、R12 / U12、U14 / T25.21；2026-10-14。T25.20为并行专辑动画，本片独立编号。
- 用户截图显示“网易云未提供可用的公开音频”。实际61173页面HTTP200，但同源`music/netease-playback.json`为404；当前构建目录没有索引，旧独立目录索引已过期。前端404回退到官方outer/url，该链接可能返回HTML，媒体错误又被归因为歌曲权限。
- 本片只修播放服务接入、重建后的索引生命周期与错误归因。沿用已安装API Enhanced匿名标准音质接口及MIME/MP3头验证，不启用解锁或读取管理员授权；不修改封套、唱臂、悬窗布局、首页源码或冻结预览。
- 实施计划：独立预览启动同源播放服务，运行缓存置于构建目录之外，缺失/过期按需合并刷新并定期续期；前端缺服务明确提示，不把HTML作为音频；媒体网络/解码错误不冒称权限拒绝。
- 验收：针对缺失/过期/并发刷新与404错误回退的回归测试；音乐专项类型检查及独立目录生产构建；当前歌曲真实解码、试听/完整曲目状态、暂停恢复和跨页唯一audio。
- 当前状态：本机修复及执行者验证完成。未提交、推送或部署。

## 实际改动

- `tools/music/preview-service.mjs`提供可复现的独立预览入口`npm run music:preview`；播放地址缓存位于`.local-tools/music/playback-runtime`，与`library-layout-dist`构建产物分离。启动/每2分钟更新，缺失/临近过期按需刷新，多请求共享同一刷新；无有效缓存时返回503，上游失败15秒退避。旧忽略目录的预览启动器复用此入口。
- `playback-index.mjs`继续匿名标准音质请求，保留官方CDN、MIME与MP3头验证、试听字段和期限，不读取推荐审核授权，也不缓存音频文件。
- 前端404明确反馈服务未接通，网络/503/无效JSON/实际不可用曲目分别保留原站出口。`audio-session.ts`不再把所有媒体失败都称为“没有公开音频”；旧媒体错误不能覆盖本次解析服务的失败原因。音频实例/队列/路由仍由原持久session拥有。
- 只重启核对为`.local-tools/music/library-preview.mjs`的61173监听进程，新进程11905工具会话持续运行；没有重启推荐授权服务或首页4342预览。页面构建仅写音乐独立目录。

## 实际验证

- 初次受限环境：23测试中22通过、HTTP集成1项EACCES；专项check无法解析已安装Astro React模块。正常本机权限重试后23/23通过，24文件专项check为0 errors/warnings/hints。没有改测试绕过真实网络风险。
- 独立生产构建15HTML及Pagefind通过；已有大chunk和404路由警告保留。构建完成后运行缓存仍可读，同源索引HTTP200/application-json/no-store；平台返回10首preview30秒、1首full、0首unavailable。
- 原用户浏览器Eclipse真实CDN解码：duration30、ready4、error=null，自然播放到30并ended=true；重播从0，暂停/恢复及黑胶页显示真实试听。没有把试听当完整播放。
- Echoes实际duration1618.334966秒；18.830515暂停，19.095139恢复，首页悬窗27.361907及返回27.803052仍paused=false。54.248499秒结束测试并暂停。所有读回audioCount1、同一session `8fb12076-73de-4fae-a67b-2ae17372efa3`，error=null。
- 完整曲目截图后暂停的宽泛按钮定位初次匹配到两控件，按最新AX限定弹窗按钮后成功；保留此采集问题，不记作应用播放故障。
- [实际状态记录](../../design/iterations/evidence/u12-p13-2026-10-14-playback-service-repair/browser-checks.json)、[试听画面](../../design/iterations/evidence/u12-p13-2026-10-14-playback-service-repair/eclipse-preview.png)、[完整音源](../../design/iterations/evidence/u12-p13-2026-10-14-playback-service-repair/echoes-full.png)、[跨页迷你](../../design/iterations/evidence/u12-p13-2026-10-14-playback-service-repair/echoes-mini.png)、[用户报错原图](../../design/iterations/evidence/u12-p13-2026-10-14-playback-service-repair/user-error.png)。没有保存短期完整CDN地址或凭证。

## 可体验入口与边界

入口：<http://127.0.0.1:61173/personal-homepage/music/?mode=netease>。选Eclipse可试听30秒，选Echoes加载完整26:58音源；打开黑胶页、暂停/继续，返回首页可通过原悬窗继续控制。

当前修复只覆盖本机预览，不代表线上静态站已部署播放服务。月之暗面匿名接口仍只允许30秒试听，本片不改变网易云账号/VIP/版权权限；Echoes验证真实解码至54秒、并非等待整曲26分钟结束。真机触控/后台调度及其他歌曲/浏览器另验。无新依赖、授权或公开端口。
