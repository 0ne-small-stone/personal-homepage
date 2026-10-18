# 原生弹窗复用：执行者验证

独立工作树 `reuse-dialog`，基线 main cc7a96d。仅五处既有窗口及薄适配；图片中的账号、歌曲和专辑均为模拟数据。不是线上新版或视觉方案验收。

## 范围与产物

- [逐次 DOM 读回](browser-results.json)：保留首次嵌套 Escape 连关失败和 `*-fixed` 修后复测，不把旧成功状态代替最终包。
- [模拟请求](mock-requests.json)：仅 browse、jobs 和模拟账号 cancel。未生成二维码、登录、提交推荐、播放歌曲或写入真实歌单。
- [桌面黑胶窗口](listening-desktop.png)：1280×720，实际 ListeningRoom/音频运行时，模拟歌曲。
- [390 嵌套账号](account-nested-390.png)：实际核心导航及 NetEaseAccount，修后版本。
- [390 推歌窗口](recommend-390.png)：实际 RecommendationForm，沿用主站现有样式，未提交。
- [390 专辑窗口](album-390.png)：实际 AlbumSwitcher，独立模拟入口；不重新启用或发布历史专辑功能。
- [HTTP Draft PR #81](http-draft-pr81.png)：独立第三片创建结果，与本片分别审查。
- `source-hashes.json` 保存参与组件、适配与测试的源码哈希，`build-hashes.json` 保存最终隔离构建 JS/CSS 哈希；测试夹具本身留在忽略目录，不进入生产源码。

## 已执行

1. 原生账号窗口初始关闭按钮焦点，Tab 到生成按钮；最后一个控件后浏览器暂将 activeElement 读作 BODY，下一次原生 Tab 返回该窗口关闭按钮，未落在页面背景控件。保留浏览器原生行为，不新增焦点陷阱。
2. 推歌初始 nickname 输入，Escape/按钮关闭与重复打开；黑胶初始返回按钮、Escape 返回入口、单 audio 数量保持 1。最终桌面包已补采截图与关闭读回。
3. 390 窄屏导航包含账号窗口，首测 Escape 一次关闭两个窗口。补共享 `cancelNativeDialog` 后复测：关内层剩 1 modal、overflow hidden、焦点回内层入口；关外层剩 0、overflow 空、焦点回导航入口。页面宽度与 scrollWidth 都为 390。
4. 专项窗口错序关闭外层，保留内层与滚动锁；最后关闭回初始入口。打开窗口时点链接，经实际 HomeLayout/Astro 切页到离页页后，0 打开窗口、body overflow 空；返回音乐页能再次打开。
5. 专辑窗口 heading 获初始焦点，Escape 与按钮重复开关恢复入口及滚动。Three.Clock 弃用提示和现有 shader 精度警告保留；此片不验其 3D 画质或性能。
6. 138 音乐测试通过；新增 7 项包括原 overflow/priority、嵌套、错序、已移除入口、showModal 异常回滚、Astro body 替换及 React 嵌套 cancel。DOM 中 showModal/close 为替身，原生模态结果以上述实际浏览器为准。

## 采集及未测边界

隔离服务仅绑定 127.0.0.1:4392，静态构建使用真实组件/样式，业务响应全部来自本地模拟。临时服务先出现根路径检查错误，夹具先遗漏 trailingSlash 与两份既有样式，已修夹具后重建补采；不是应用路由或样式改动。旧状态日志中 `astro-leave` 为切换前即时采集，不计通过，以 `astro-leave-settled` 为准。138 项最终运行覆盖 React 测试调度清理修正。

截图为最后隔离构建补采，DOM 结果包含修前/修后的有限操作，不是整站全矩阵。未做真实触屏、屏幕阅读器、多浏览器、系统偏好、真实网易云权限或提交验证。未改 CSS、美术、音频业务或其他页面，未重启共享预览服务；本片未合并发布。
