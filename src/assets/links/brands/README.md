# 网站身份图形来源（2026-10-18）

用户要求其余网站使用关联更强的图标。下列图像仅用于对应导航条目的身份辨识，商标/品牌与图片权利仍归原权利方；不声明本站原创、官方合作或开放商用许可。当前只本机候选，正式采用与发布另核。没有下载外站课程内容、用户头像或账号信息。

| 文件 | 公开出处/原资源 | 处理 |
| --- | --- | --- |
| learning-in-zju.png | https://course.zju.edu.cn/learninginzju?locale=zh-CN 实际运行页头第一张内嵌PNG，186×62 | 原始data URI保存，不改像素；CSS只显示左侧图形 |
| zjuers.png | https://zjuers.com/images/ico.png ，由首页img声明，和/favicon一致 | 原图 |
| icourse.png | https://edu-image.nosdn.127.net/32a8dd2a-b9aa-4ec9-abd5-66cd8751befb.png?imageView&quality=100 ，MOOC首页rel=icon | 原图 |
| pta.png | https://static.pintia.cn/sparkling-daydream/icons/default/favicon.ico ，PTA首页声明 | 原ICO最大48px图层无损提取PNG |
| bilibili.png | https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico ，B站首页声明 | 原ICO32px图层无损提取PNG；不采用带WEB角标的512图 |
| koala-oa.png | https://oa.koala-studio.org.cn/favicon.8f9z7nhy30.png ，OA声明的考拉工作室校徽 | 原图 |
| zju-cs-asio.png | https://www.zju.edu.cn/514/listm.htm 的校标图 https://www.zju.edu.cn/_upload/article/images/c3/98/1fb1d281492eb477a098ef7a2901/6d8d432f-56ac-47eb-b22d-a23b103aed01.png | 原图；用作浙大CS资源关联，CS小角标为本站组合，不是该项目官方Logo |
| zju-icicles.png | https://avatars.githubusercontent.com/u/4727983?v=4 ，公开GitHub仓库QSCTech/zju-icicles元数据确认维护组织QSCTech | 原始组织头像；不是原站16px通用文档favicon |
| csdiy.png | https://csdiy.wiki/images/title.png ，原站高分辨率标题，与/images/favicon.ico同一蓝色立体书 | 原图；CSS左侧聚焦，不展示整段字标 |
| turing-courses.png | https://zju-turing.github.io/TuringCourses/images/icon.png ，原站favicon声明 | 原图 |

构建复用现有Astro assets，等比输出最多384px WebP，不放大低分辨率原图。运行时只请求本站图片。照片头像继续使用上一级README的单独来源，不混同为上述商标许可。
