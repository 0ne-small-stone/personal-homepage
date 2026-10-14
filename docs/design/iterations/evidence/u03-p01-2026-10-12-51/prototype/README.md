# 独立路径追踪候选首样

这是51轮的能力验证代码，**不是首页实现或采用方案**。根路径是现成路径追踪库失败候选；`/white/`是后续局部单散射光子束估计，尚未实现完整观察折射、接收面和光谱。没有复制第三方源码；依赖按MIT原包安装。geometry.js/ray.js由当时首页函数直接提取转换，保留实心/半尺寸；校验值见上一级engineering.json。

复现：在已安装根工程依赖的项目中，将本目录的12个源/锁文件复制到忽略目录`.ci-tmp/optics-engine/`，不复制README；然后在项目根运行：

```powershell
npm ci --prefix .ci-tmp/optics-engine --ignore-scripts --no-audit --no-fund
node .ci-tmp/optics-engine/build.mjs
node .ci-tmp/optics-engine/server.mjs
```

构建读取当前GlassTriangle几何，因此重现历史首样时应核对几何哈希与51工程记录；生成geometry.js与此处归档对比。构建使用根工程已有esbuild0.28.2，未为验证改变网站依赖。server只提供首页HTML和bundle，不公开node_modules或本机其他文件。浏览器打开本机4339；已有该端口试验进程时直接复用。

试验使用隐藏Start-Process启动server（最初PID27272，增加white路由后核对并仅重启本试验为14900），不依赖终端会话且不控制4335主站。重启电脑后试验服务需重新启动。该代码是本地、未纳入Astro路由的诊断样本，无网站部署或用户审美通过结论。额外的8项传输核查可运行`node .ci-tmp/optics-engine/check-white.mjs`；它不证明完整观察光路或首页已完成。
