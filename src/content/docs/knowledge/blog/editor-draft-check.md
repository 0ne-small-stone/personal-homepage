---
title: 网页编辑草稿验证（测试草稿）吃吃吃
description: 用于验证网页后台保存、分支追溯与草稿排除。
date: 2026-10-08
tags:
  - 功能验证
entryId: demo-article-editor-draft
kind: article
topics:
  - 阅读与整理
example: true
draft: false
sidebar:
  hidden: true
related:
  - demo-article-reading-check
---
这是“托管发布首版验证”的功能样稿，仅用于工作分支的生产预览，尚未正式上线。

## 写一段文字

可以在网页后台修改标题、摘要或这一段文字，然后保存。重新打开后台时，应该能看到保存后的内容，并在仓库中找到对应的提交记录。

## 保留章节、链接和代码

- 正文以 Markdown 保存。
- [已发布的阅读功能样稿](../article-reading-check/)保持原有地址。
- 本轮验证发布候选与修改；正式发布另行验收。

```js
const draft = true;
console.log('仍是草稿', draft);
```

## 图片验证

![灰色方块与 T13.02 字样组成的网页上传验证样本。](../../../../assets/article-images/muzkwysr-37s36uzh.png)

图片说明：这张功能样本通过 Pages CMS 媒体库上传，正文保存后重新打开核对。

## 验证标记

T13FIRSTHOSTED20261008

这个标记用于追溯首版候选的构建与搜索结果，不代表正式上线。