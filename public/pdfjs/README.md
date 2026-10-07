# PDF.js 网页阅读器

Mozilla PDF.js 官方 generic 发行版 **6.4.299**，Apache-2.0，完整许可证见 [LICENSE](LICENSE)。CMap 与字体内的版权和许可声明保持不变。

来源：[官方使用说明](https://mozilla.github.io/pdf.js/getting_started/)、[发行附件](https://github.com/mozilla/pdf.js/releases/download/v6.4.299/pdfjs-6.4.299-dist.zip)。原 ZIP 大小 6,331,451 字节，SHA-256 `f2245eb7ef3f674c872fe568a177bfec15874f5c034613e55d8e307f93ebd86d`。

改造范围：保留 build/web 运行文件、worker、CMap、标准字体、WASM、图标和全部语言；排除 source maps、调试器及示例 PDF。viewer.html 修改标题、初始语言、允许用户缩放，并附加 lssh-theme.css；主题调整阅读控件、焦点与减少动画，隐藏新增批注工具（原件批注继续渲染），窄屏工具栏换成两行，不修改页面内容和渲染逻辑。

资料通过同源 `file` 参数按当前条目加载。不将示例 PDF 或本地学习原件包含在此目录。升级时重新核对发行附件、许可、浏览器兼容性与迭代中的实际阅读用例。
