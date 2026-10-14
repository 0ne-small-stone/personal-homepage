# P13 双模式外观适配

- 日期：2026-10-13；P13 / U12 / R04、R12 / T21、T25。
- 用户已确认：网易云页面组织用 GlassMusicPlayer，专辑展示/播放区用 CompScout Vinyl Player；本地模式用 Vinyl Vue。
- 唯一切片：双模式外观与已有真实播放行为适配；不修改首页场景。
- 基线：当前工作区已有本机音频中间件、18首/3专辑与原官方网易云嵌入；本轮保留并适配，不覆盖其成果。
- 复用/缺口：GlassMusicPlayer 为 Vue 全应用，本站用 React 按布局适配；Vinyl Vue 唱片与唱臂按 CC BY-NC 4.0 复用；CompScout 原例为假进度且免费组件公开分发许可尚不明确，只独立实现用户选定的封套/黑胶视觉，不复制注册表源码。来源与边界见 REFERENCES REF-09。
- 当前阶段：本地实现与执行者验证完成；用户方向选择已确认，最终适配画面待用户体验。未提交、推送或部署。

## 实际实现

1. 本地模式采用原作者唱片SVG、唱臂WebP及封套/唱片构图。现有18首/3专辑、真实内嵌封面、洛雪入口与刷新保留；唱片20秒旋转、唱臂角度、播放/暂停、进度及音量来自真实audio。
2. 网易云采用已选深色曲库结构与独立实现的 CompScout 封套黑胶。当前 Echoes 共享歌单实际返回1首；卡片点击使用网易云官方公开音频解析入口，实际播放的是该首《Echoes》，不是测试音或本地文件冒充。唱片、进度、暂停与迷你播放器联动真实音频。
3. 保留官方 iframe 与原站入口；打开iframe前暂停原生音频，模式切换停止/销毁网易云播放器。生产不生成本机音频或封面地址；私有封面文件不复制至public。
4. 无新增 npm 依赖，无 Vue 双应用、下载音效、外部登录凭证或常驻音乐服务器。新增 `npm run music:playlist` 重新读取公开元数据快照；未接入自动定时同步。

## 验证与原始失败

- `npm run check`：58文件，0 errors / 0 warnings / 0 hints。
- `npm run build -- --outDir .local-tools/music/selected-skins-dist`：15 HTML/页面完成。既有大chunk与404路由重叠警告保留，不记为零警告。
- 独立生产产物核对：18首的本机audioUrl/coverUrl均为null；音乐目录只含index.html、catalog.json、署名文件与许可资产，没有本机音频、封面、映射或磁盘路径。
- `node --test tools/music/local-playback.test.mjs`：10/10通过，含新增封面GET/HEAD、来源/ID限制、生产移除本机封面地址。最初受限环境回环请求EACCES不当成业务失败；本机完整权限复验通过。
- 受限 check/build/dev 曾未正确加载 CommonJS；完整本机运行通过。随后同时构建/预览的首个开发页发生 `_jsxDEV is not a function`，不能记为页面通过；最终独立Vite缓存与明确development预览恢复。隔离配置第一次root传URL被拒绝，改fileURLToPath后启动成功。未重装或改锁文件。
- [UI初批](evidence/u12-p13-2026-10-13-selected-skins/ui-initial.json)：12通过/2失败。失败为动画中唱臂按钮无法稳定点击、390px手机右侧溢出；将旋转移至图像、固定语义按钮并预留空间后，[4项补验](evidence/u12-p13-2026-10-13-selected-skins/ui-confirm.json)通过，不覆盖原始失败。
- [网易云初批](evidence/u12-p13-2026-10-13-selected-skins/netease-audio-initial.json)：4通过/2失败，首次实际媒体等待超时、关闭fallback时原触发按钮已被卸载导致焦点未返回。媒体事件诊断随后真实readyState4、duration1618.334966/currentTime2.771161；改为保留触发按钮。最终[7/7补验](evidence/u12-p13-2026-10-13-selected-skins/netease-audio-confirm.json)通过，含实际音频播放、卡片暂停/继续、键盘跳转、音源切换停播、官方fallback焦点与320/390px、减少动画。初次超时不归因于用户授权，也不推断平台长期稳定。
- 已实际查看最终桌面/手机两模式截图。初版截图的固定顶栏位置受到截图前滚动/焦点影响，最终先回顶部再截取；开发工具浮层不是网站正式界面。

## 体验与复现

- 本地：<http://127.0.0.1:4344/personal-homepage/music/?mode=cloud>；点击播放、唱臂、进度与专辑封套。
- 网易云：<http://127.0.0.1:4344/personal-homepage/music/?mode=netease>；点击专辑封套真实播放，暂停/继续，或选择官方播放器。歌单当前只有1首不是漏显。
- 预览按 `.local-tools/music/selected-skins-astro.mjs` 使用独立缓存，避免共享开发/构建依赖互相干扰。正式来源与许可为 `/music/attribution.txt`。
- 最终图片在本轮 Codex artifact 目录的 `selected-skins-*-final.png`；目录不随仓库发布，正文封面与音频权利独立于代码。
- 隔离预览重启后 `selected-skins-*-clean.png` 已实际读图，开发工具元素为0；网易云再次实际解码duration1618.334966/time0.685691/paused=false，390px无横向溢出。源文件/构建检查不代替用户审美反馈。

## 剩余与下一步

方向确认不等于用户认可本轮画面；手机真机、整站持续播放未验。网易云只验证指定公开歌曲的实际启动/控制，没有遍历全部歌曲、登录付费权限或完整客户端发现/MV/评论功能。元数据快照、推荐审核与自动写入共享歌单分别验收。考拉认证、目录/分享、上传与线上同步仍未完成。本片完成即停，下一片应按实际用户反馈或T21/T20依赖单独推进。
