# U12 / P13 · Side One 独立候选验证

日期：2026-10-12。对应 P13、R04/R12、U12，承接 T25 播放器选型研究；不记为本站真实接入完成。

用户在查看 Codrops 相近候选后要求“验证”。本片目标是实际运行 Side One，检查专辑浏览、封套、唱片与唱臂流程，并核对真实音频状态。主技能继续 frontend-design，沿用项目单片验证与来源登记要求。

## 运行与改动范围

- 来源：[mintdotgg/bookshelf](https://github.com/mintdotgg/bookshelf)，固定快照 `c9b28f89ad4b7657520be9333d5d127ab9c6980e`。
- 源码下载至忽略目录 `.local-tools/side-one-preview/`，独立音乐目录为 `.local-tools/music/side-one-review/qa-library/`；未修改候选应用源码、主站应用、依赖或锁文件。
- Node 24.16.0，按原锁文件安装 496 个包，`npm ci --ignore-scripts --no-audit --no-fund` 完成。类型检查 `node node_modules/typescript/bin/tsc --noEmit` 通过。
- 使用原项目 Vinext/Vite 运行界面，独立端口 4341；按原项目服务 API 启动仅监听 127.0.0.1 的音乐服务，端口 4342。未配置 Spotify、YouTube 下载、考拉或网易云账号，未启动第三方生成服务。
- 原始目录为 7 个商业专辑、9 张唱片，7 个封面实载成功；商业音频未附带。另通过原服务 API 添加 1 个明确标注的 QA 测试专辑与自生成的 45 秒 WAV，未把测试声音冒充商业歌曲。

可体验：[本机 Side One](http://127.0.0.1:4341/)。试播使用最后一张 `Synthetic Test Audio — QA Only`；选择 `View record`，再点击测试曲目，会自动开始取片、移至唱机和落针。其他商业专辑可浏览详情，默认没有可播放录音。

## 实际验证

第二轮 11 项 UI 检查通过：真实封面、前后按钮选专辑、打开《月之暗面》及完整 10 曲清单、无音频时禁用播放、封套翻面/复原、返回、键盘浏览与 Enter、设置 Escape/焦点恢复、390px/减少动画浏览、手机详情与返回、无浏览器运行错误。

音频定向补验 7 项通过：

1. 点击测试曲目后，等待真实落针完成；WAV 时长读取为 45 秒，播放时间前进，单个音频实例，无媒体错误，AudioContext 为 running，FFT 有非零信号。
2. 点击可见进度条，将实际媒体播放时间跳到约 15 秒。
3. 暂停后时间保持，续播使用同一音频实例并继续前进。
4. 停止后媒体暂停且时间归零，唱片回到封套，随后可返回收藏。
5. 实际音频请求返回 206 / audio/wav，并有 Content-Range。
6. 实际状态序列读回：`extract-vinyl → transport-to-turntable → lower-tonearm → playing → raise-tonearm → return-to-sleeve → reinsert-vinyl`。
7. 音频补验无浏览器运行错误。

这是音频解码、时钟与分析器信号验证；未进行主观听音、真实手机/移动 Safari 或设备性能验收。原项目生产构建与全部上游测试未在本片运行。

## 原始失败与纠正

- 首轮直接点击收藏索引目标，先被加载层、后被画布拦截，超时后选中仍为 0；后续断言与键盘/设置/测试专辑操作因错误状态继续失败，该批中断，不能记为通过。
- 原 CSS 的 `.archive-index__targets` 只在悬停或焦点进入时开启 pointer-events。第二轮改为可见前后/末张按钮和实际键盘操作，不 force-click 隐藏目标或修改应用状态。
- 第二轮新增测试音频步骤即时断言播放键可用失败：点击曲目本身会启动 `playTrack(track)`，此时控件处于 loading/cueing 的正常忙碌状态。该轮原始结果为 11 通过 / 1 失败，完整保留。
- 第三轮仅补验音频，按原控件行为点击曲目并等待 cue/playback 到 playing，7/7 通过；未重复已通过的全套 UI 检查。

## 视觉判断与采用边界

实际桌面图表现为暖纸色、专辑封套、悬空唱片与胡桃木唱机；相比 Codrops 更立体、信息更多。390px 无文档横向溢出，操作可用，但详情面板遮住部分三维器物，不能把这个布局检查写成手机美术定稿。

可以保留为专辑选取与放片/收片的交互参考。当前工程是 Next/Vinext 与独立本地服务，尚未接入本项目 Astro 页面或双音源；本站需要的黑灰、中文、云盘和网易云均未在此候选中实施。项目根目录未发现 LICENSE，第三方依赖/媒体声明不能替代主项目源码的复用许可，正式复用前需单独核验。

执行者运行与读图已完成，用户审美确认、正式选型与接入仍未完成。无提交、PR 或部署；保留独立本地预览供用户比较。

## 原始证据位置

本次图片与 JSON 保存在会话产物目录：
`C:/Users/asus/.codex/visualizations/2026/10/11/01a12a0e-4aee-7da3-bdf1-844bac058e8b/`

- `side-one-initial.json` / `side-one-desktop-browse.png`：原 7 专辑基线。
- `side-one-validation.json`：第二轮 UI 原始 11 通过 / 1 失败。
- `side-one-audio-validation.json`：第三轮音频 7/7。
- `side-one-desktop-inspect.png`、`side-one-desktop-back.png`、`side-one-mobile-browse.png`、`side-one-mobile-inspect.png`、`side-one-desktop-playing-test-audio.png`：本次实际浏览器画面。

源快照、最初失败摘要、第二轮副本、fixture 与执行工具保留在被忽略的 `.local-tools/music/side-one-review/`，不进入应用逻辑。
