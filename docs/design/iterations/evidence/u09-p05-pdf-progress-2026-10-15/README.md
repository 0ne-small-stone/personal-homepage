# P05 PDF续读证据

2026-10-15，执行者定向验证，待用户体验。范围与限制见[本片](../../u09-p05-2026-10-15-pdf-progress.md)。

- browser-checks.json保留原始DOM数值与比较。baseline第一次仅填写页码框时尚未真正渲染第3页，不是有效的原生历史失败对照；随后采用真实AX页码确认和可见canvas等待。
- normal-before.jpg、normal-after-refresh.jpg与closed-tab-reopened.jpg：第3页内125%普通阅读恢复；xy-after-refresh.jpg：200%横纵坐标恢复。
- immersive/fixed/unload/cropped前缀图片均为最终同步保存前的试验，其中页码相同但页内偏移未达到要求，不能作为通过。diagnostic-esc记录为临时诊断，代码未提交。
- final-immersive-before-close.jpg与final-reopen-after-immersive.jpg是同一路径最终通过：第3页内比例完全相同。final-resumed.jpg为最终普通阅读状态。
- mobile-reopened.jpg为请求390×844模拟视口、html内容区380×844；顶部工具栏两行导致viewerTop不同，但PDF内坐标保持。不是实体手机。
- 真实物理讲义只记录数字位置，不纳入教材截图或原件。每份资源的独立记忆见separate-resource记录。
- final-console保留旧异常；guard-final-route-return仍出现异常，不当作修复通过；真实点击返回路径的独立记录另外保存。最后产物撤除全部诊断，source-verification.json核对4份运行时源码与两个构建副本一致、官方viewer.mjs/引擎及文章续读未改。

check.txt、tests.txt、local-build.txt、release-build.txt、public-assets.txt及仓库检查日志仅去掉行尾空格/末尾多余空行；原日志在忽略的.ci-tmp。原图不裁剪或改造。跨调用会退出原生全屏，进入/阅读/截图/关闭在同一调用完成；不将工具导航或模拟尺寸当作真机验证。
