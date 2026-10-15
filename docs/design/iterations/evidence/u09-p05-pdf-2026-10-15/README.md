# P05 PDF 接入证据

2026-10-15，执行者验证，待用户体验。范围和逐项结果见[本片](../../u09-p05-2026-10-15-pdf-connection.md)。

- attachment-verification.json：36附件HEAD/字节、教材Range206、来源哈希与沉浸脚本不变。
- browser-checks.json：原始浏览器状态，包含早期失败及连续原生键盘的成功复核，不把所有记录合并成全绿。
- before-missing-pdf.jpg：同一4400地址下旧外壳及缺附件。
- desktop-pdf-connected.jpg、desktop-final.jpg：真实PDF及新侧栏。
- overview-all-pdfs-connected.jpg：全部PDF实际可用。
- desktop-riscv-book.jpg、desktop-riscv-next-page.jpg：494页教材及原生翻页。desktop-riscv-page-9.jpg只表示输入尝试，未证明第9页渲染。
- desktop-return-filters-restored.jpg：普通UI筛选→PDF→返回保留三参数。
- desktop-immersive-auto.jpg、desktop-immersive-double.jpg：无工具栏并排完整页。连续键盘1/2/4/F/0/Esc的几何记录见JSON。
- mobile-390-pdf.jpg、mobile-320-pdf.jpg、mobile-320-pdf-note.jpg：模拟窄屏，不代表手机真机或右滑。

工具重置视口并立即离页出现历史MutationObserver异常，记录保留，未确认来源；临时诊断已撤。页面常规阅读及修复后的返回通过，不宣称全部控制台无异常或中文输入法/真机重测。

private本机快照含36个原件，不能作为发布包；公开干净构建仍仅含明确公开的样本。原件及local-materials/dist均忽略，本目录只保存有限截图/日志，不保存PDF原件或账号凭证。

文本构建日志为展示副本，仅清除行尾空格以满足Git差异检查，诊断/数值/结果保持。原始终端日志仍在本机被忽略的.ci-tmp目录。末轮普通文章返回的首次locator点击未导航，URL等待超时；随后的原生AX点击恢复文章筛选结果，此限制不隐去。最终普通路径无新增控制台错误，历史视口重置异常仍保留。
