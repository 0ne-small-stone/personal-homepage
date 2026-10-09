---
title: 网页新建文章验证（测试草稿 · 已验重试）
description: 测试保存冲突后的输入保留与重试，不是正式文章。
entryId: demo-article-cms-create-check
date: 2026-10-09
draft: true
kind: article
example: false
---
这是一篇通过 Pages CMS 新建的功能验证草稿，不代表个人正式创作，保存后不会出现在公开网站。

## 新建与再打开

关闭后台再重新打开，标题、摘要、日期、地址标识和这段正文应保持。

## 保留正文格式

- [阅读功能样稿](../article-reading-check/)
- 测试标记：T13CREATEDRAFT20261009

```js
const draft = true;
```


## 保存失败恢复

仅用于旧版本冲突和人工备份后重试的验证：T13SAVERECOVERY20261009
