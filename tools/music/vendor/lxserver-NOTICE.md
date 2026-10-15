# LX 兼容核心来源

仅复用 XCQ0607/lxserver 的 `musicSdk` 和 `server/userApi.ts`，未启动其完整服务器或复用其 UI。

- 上游：[XCQ0607/lxserver](https://github.com/XCQ0607/lxserver/tree/5e2c8cc4c823eb41ea84a1d93fe6af220157d12b)，package 2.1.1，固定提交 `5e2c8cc4c823eb41ea84a1d93fe6af220157d12b`。
- Copyright (c) 2026 xcq0607；上游模块沿用 LX Music 的接口体系。
- package 声明 Apache-2.0；仓库 LICENSE 原文保留于本目录。上游 README 的“开源协议”另有补充条款，包括个人技术研究、非商业性质、版权数据 24 小时内清除等限制，不能将此候选当作无附加条件的商业服务或永久公开音频分发方案。
- 完整上游源码、README 与许可由安装程序保存在 Git 忽略的 `.local-tools/music/lxserver`，便于核对和升级。未修改上游源码；本站同源适配、受限子进程和下载完成记录在 `tools/music/lx-*.mjs`。

本次仅本机集成验证。来源脚本和访问授权由用户现有洛雪配置读取，不随代码分发；部署及公开分发需要另行核对使用条件。
