# P06 文章阅读与说明撤除证据

2026-10-15，执行者检查，待用户体验。完整结果和限制见[本片](../../u09-p06-2026-10-15-article-reading.md)。

- browser-checks.json保存真实DOM尺寸、目录位置、复制/沉浸/返回、PDF说明撤除和原始失败。
- source-verification.json保存4份变更源码哈希，以及PDF布局/快捷键、导航适配和PdfReader未变的核对。
- before-article.jpg与desktop-article-first.jpg保存前后首屏；desktop-final.jpg为最终默认视口。
- desktop-code-toc.jpg是首次章节被遮挡/locator复制未确认阶段，不能作通过证据；后续定位数值与native-code-copy=true分别留证。
- desktop-1440-final.jpg请求1440但实际1028；desktop-wide-final.jpg与desktop-wide-render.jpg实际1280，右目录可见。因浏览器已有缩放，覆盖视口截图存在缩放/黑色余边，保留原图。
- mobile-390-article.jpg、mobile-320-article.jpg和mobile-320-menu.jpg为实际CSS390/320模拟视口；不是真机。
- article-immersive.jpg、pdf-shortcut-removed.jpg分别对应文章沉浸和PDF可见说明撤除；快捷键数字2仍工作。

日志txt仅去掉行尾空格与文件末多余空行，诊断/数值/结果保持，原日志仍在忽略的.ci-tmp。无PDF原件、凭证或新文章内容。
