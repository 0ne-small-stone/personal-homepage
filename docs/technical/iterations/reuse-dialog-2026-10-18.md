# 原生 dialog 生命周期复用

接续 2026-10-17 获批的复用优化队列；本片独立分支 codex/reuse-dialog-2026-10-18，基线 main cc7a96d。对应 P13/R04、R12/U12、U14/T25–T27；HTTP 优化和前两批候选分别审查。

## 实施约束

- 复用浏览器原生 `<dialog>` 的顶层、焦点约束和 Escape 事件。React 共用一个薄生命周期 hook，不增加 UI 库、portal、键盘焦点陷阱或视觉规范。
- 将 ListeningRoom、RecommendationForm、NetEaseAccount、核心曲库 Modal 和 AlbumSwitcher 的打开/关闭、初始焦点、body 滚动锁及卸载恢复集中处理。各自取消/扫码清理、动画清理、提交和音频逻辑继续由原组件负责。
- 同一文档的多个窗口共用滚动锁，最后一个关闭才恢复首次打开前的 overflow 值及 priority；关闭顺序不能使锁残留。焦点只交回仍连接且可用的入口，不抢其他打开窗口或 Astro 新页面的焦点。
- 沿现有 SYSTEM 的尺寸、排版、关闭按钮和原生对话框语义；不调整美术。
- 主技能 ui-ux-pro-max，聚焦键盘退出、焦点返回、卸载和小屏可操作性。

## 验证

对生命周期使用 DOM 测试检查嵌套/错序关闭、重复清理、初始焦点和异常回收；实际浏览器验证原生 Tab/Escape、按钮关闭与返回入口、重复打开、小屏和切页卸载。DOM 替身不代替原生模态或辅助技术验证。

- `npm run music:test`：138 项通过，含 7 项新增生命周期/React 嵌套取消测试；已接入现有 CI 命令。React 测试首次未等待调度器清理，产生测试后异步错误，改用 `act` 完成清理后全套通过。
- `npm run check`：171 文件，0 错误、0 警告、4 条既有提示；未改 PDF 与 PhotoSwipe 提示所涉代码。
- 实际组件隔离生产构建：3 HTML。不是全站构建，完整构建由 PR CI 另验；原有 Three 大块提示保留。
- IAB 原生输入：1280×720 与 390×844；账号/推歌/黑胶/核心导航/专辑窗口的初始焦点、Escape 或按钮关闭与重复打开。黑胶开关前后仍为同一个页面内的单一 audio 元素，未播放真实音频。
- 实测发现 React 嵌套 cancel 会把账号和外层导航一起关闭；共享取消适配阻止默认关闭并停止合成事件冒泡。修后第一下 Escape 留外层导航、滚动仍锁定，第二下返回导航入口并解锁。
- 专项原生检查：错序关闭外层后内层保留，最后关闭返回原入口；实际 HomeLayout/Astro 切页后无打开窗口、body overflow 为空。跨 body 的交错清理另由 DOM 用例验证。
- [原图、逐次结果、模拟请求及边界](evidence/reuse-dialog-2026-10-18/README.md)。执行者自检，不称独立验收或用户通过。

## 来源

- [HTMLDialogElement.showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal)
- [React useEffect](https://react.dev/reference/react/useEffect)

## 状态

工程及限定浏览器验证完成，待 Draft PR 审查，未合并、未发布。第三片 HTTP 为 [Draft PR #81](https://github.com/0ne-small-stone/personal-homepage/pull/81)，该流水线已成功；前两片查询/CMS 和本片独立审查，不在此提升其发布状态。
