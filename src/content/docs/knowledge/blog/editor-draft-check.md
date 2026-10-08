---
title: 网页编辑草稿验证（测试草稿）
description: 用于验证网页后台保存、分支追溯与草稿排除。
date: '2026-10-08'
tags: [功能验证]
entryId: demo-article-editor-draft
kind: article
topics: [阅读与整理]
example: true
draft: true
sidebar:
  hidden: true
related: [demo-article-reading-check]
---

这是一篇用于网页编辑验证的测试草稿，不是正式文章。保存草稿后，它仍不会出现在公开网站的文章列表、学习总览或搜索中。

## 写一段文字

可以在网页后台修改标题、摘要或这一段文字，然后保存。重新打开后台时，应该能看到保存后的内容，并在仓库中找到对应的提交记录。

## 保留章节、链接和代码

- 正文以 Markdown 保存。
- [已发布的阅读功能样稿](../article-reading-check/)保持原有地址。
- 发布与图片上传在后续步骤单独验证。

```js
const draft = true;
console.log('仍是草稿', draft);
```

## 验证标记

T13.01-DRAFT-ONLY-20261008

这个标记用于确认草稿正文没有进入公开页面和搜索索引，不代表用户个人资料。
