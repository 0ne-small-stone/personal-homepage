# Someone 首版证据

日期：2026-10-14。预览：[本机4345 Someone](http://127.0.0.1:4345/personal-homepage/about/)。原图由Codex in-app browser截图API取得，未裁切或美化。桌面为默认1280×720视口，手机显式390／320×844；客户端扣除滚动条后宽度分别为1265／375／305，实际scrollWidth与clientWidth相等。结束时视口已reset，预览标签保留供用户体验。

## 最终候选原图

- [桌面首屏](final-desktop-hero.png)：本轮真实介绍和原比例肖像。
- [桌面能力与协作](final-desktop-practice.png)：阅读索引、能力与学习边界。
- [390px首屏](final-mobile-390-hero.png)：14px顶栏和单栏人物介绍。
- [320px邮箱复制](final-320-copy.png)：实际复制状态、邮件地址、稳定112px按钮。

## 过程证据

`desktop-hero.png`、`desktop-experience.png`、`desktop-contact.png`、`mobile-390-hero.png`为初样；`mobile-390-hero-final.png`、`mobile-390-experience.png`和`mobile-320-contact.png`为字号修订后、复制宽度收口前的采集。文件名中早期的final仅表示当时轮次，最终冻结候选以本节上方四张图和manifest为准。

[browser-results.json](browser-results.json)包含实际布局、锚点、剪贴板内容匹配、320px复制前后尺寸，以及知识／首页返回结果。返回过程的早采copyVisible=false与落定true均保留；不能把这两次视为同一时刻。字段audioCount=1表示DOM元素数量，不是音频身份或播放不中断的完整证明。

[manifest.json](manifest.json)记录本页四个应用源、三个共享布局输入与实际预览HTML的SHA-256，以及SSR正文、原生邮件／锚点和公开字段检查；并注明其他预览路由沿用既有生产页面。本轮没有新建或宣称完整15页生产构建。[console-notes.json](console-notes.json)保留快速反向导航时的ViewTransition跳过日志，功能落定后恢复。

回环端口首次在默认沙箱下不可访问，审批后的同一回环预览正常返回200；错误标签页不是页面截图，也未绕过浏览器URL保护。这里只保存正常页面原图，不把工具尝试当成验证成功。

工程原全仓配置加载失败和专页构建通过、来源范围及未测项目见[开发记录](../../u13-p02-2026-10-14-someone-development.md)。执行者验证、独立复核和用户验收分别记录，当前待用户验收。
