# U09 / P05 PDF 接入与外观衔接

2026-10-15。接续P03总览，用户要求“你接入pdf”，并明确授权读取已有Git凭证用于同仓库草稿PR。P03草稿[#57](https://github.com/0ne-small-stone/personal-homepage/pull/57)已创建并附于本对话；保持草稿，不合并/部署。凭证未输出或保存。

## 范围和施工

实际复现：从4400新版总览打开第9章（上），主机与端口未变，P05旧外观且没有iframe。原因是P03首片只改总览，干净预览没有复制被忽略的原件。

复用已有tools/content/prepare-local-materials.mjs校验36份PDF原件并生成本机副本，沿用PDF.js与既有沉浸实现；P05 PDF资料/PDF笔记使用新版共同外壳，其他文章/外部笔记本轮不扩展。设计唯一参数见[SYSTEM 5.2.2](../SYSTEM.md#522-becoming-pdf-阅读页衔接2026-10-15)。

原始目录、公用本地副本及预览产物继续被Git忽略，不将教材加入公开仓库。公开构建仍只含明确公开的功能样本；本机原件可读与线上许可/存储分别验收。

## 验收

本机已接入36份原件，加上既有公开样本共37份PDF。逐份HEAD返回200且大小一致；216,380,449字节RISC-V教材Range返回206与%PDF-，原件SHA-256全部匹配清单。资料5页、教材494页及PDF笔记35页均实际载入；教材原生下一页到物理页2（标签B）已核对。

普通界面选择资料/计算机系统/标题升序→教材→返回，三项参数及1条结果已恢复。桌面新侧栏选中为rgb(38,38,38)；390/320px无页面横向溢出。沉浸连续原生输入验证1固定→Ctrl减号仍1页→F整页→2双页→4四页→0解锁→Esc恢复；单/双/四页完整进入可见区，工具栏隐藏。沉浸脚本逐字未变。

类型检查135文件0错误/0警告，8条相册既有hints；干净构建及本机附件构建53页、Pagefind54HTML通过。原图、原始失败与工具边界见[证据](evidence/u09-p05-pdf-2026-10-15/README.md)。当前待用户体验，不代表外观确认或上线。

## PDF 返回路径修正

本轮普通界面选择类型/主题/排序后打开PDF，返回实测丢失主题和排序。已安装Astro路由将内部originalLocation作为事件from，原生pushState筛选不会更新该内部值；因此旧适配对比查询参数时拒绝真实同页交接。最小修正是在push/replace的before-swap读取尚未提交跳转的实际location.href，traverse仍使用框架from。保持同源、同路由、一次消费校验和普通链接降级，不修改筛选脚本或替换路由。


## 体验与复现

[学习总览](http://127.0.0.1:4400/personal-homepage/knowledge/)→选择资料或笔记→打开PDF；[第9章（上）直达](http://127.0.0.1:4400/personal-homepage/knowledge/resources/physics/physics-electrostatics-alt/)。沉浸后可用1–4、Ctrl加减和F；Esc退出。

本机预览基于独立分支的干净源码快照。仅在被忽略的`.ci-tmp/becoming-framer-preview`目录执行`npm run materials:prepare -- --source "C:/Users/asus/Desktop/个人主页/大二上学习资源"`再`npm run build`，由原有4400进程提供静态预览。materials:prepare先校验全部原件，再建立本地副本；不作为发布步骤。

## 限制

先前跨工具调用的全屏快捷键测试失去全屏状态，不计通过；连续同次原生输入已单独验证。只读DOM映射的fullscreenElement为false但原生视口扩到3440×1440，原值保留。教材输入9仅改控件值，未确认第9页渲染；后续原生下一页已确认第2页。手机为视口模拟，右滑手势、实体设备与中文输入法本轮未重测。

工具重置320px视口并立即离页时记录MutationObserver非Node异常；普通阅读/翻页/筛选返回未复现，临时顶层/iframe异常栈诊断未捕获来源，未断言原因或控制台全绿。诊断代码已移除，保留原始日志；此工具边界不计应用通过项。

## 追溯与草稿

本轮实现提交[f1e7347](https://github.com/0ne-small-stone/personal-homepage/commit/f1e7347ca2c1dc0f17b423d6fa391c7fcc87c666)已推送codex/becoming-overview-framer，归入草稿[#57](https://github.com/0ne-small-stone/personal-homepage/pull/57)。最终干净发布构建53页完成且无dist/local-materials目录；259份文档、3722文件边界检查通过。未合并或部署。
