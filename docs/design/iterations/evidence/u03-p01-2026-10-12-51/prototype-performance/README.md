# 白光原型性能修正

2026-10-13，用户反馈4339白光样本卡顿后的独立切片。保存17个源/锁文件；此前接收面样本保持于相邻`prototype-receiver/`，本目录不改其历史证据。

将本目录除README以外的文件复制到项目根的`.ci-tmp/optics-engine/`，在已安装根依赖的项目根运行：

```powershell
npm ci --prefix .ci-tmp/optics-engine --ignore-scripts --no-audit --no-fund
node .ci-tmp/optics-engine/build.mjs
node .ci-tmp/optics-engine/check-scheduler.mjs
node .ci-tmp/optics-engine/check-white.mjs
node .ci-tmp/optics-engine/check-receiver.mjs
node .ci-tmp/optics-engine/server.mjs
```

打开本机4339的`/white/`。仍为独立HTML、Three.js/WebGL和局部单散射估计，无主站接入。源/生成产物与实际画面的哈希见[工程元数据](../white-perf-engineering.json)。构建会从当前主站提取几何/求解器，复现历史时核对哈希。

修正采用按需RAF：采样到128后停止draw，控件/尺寸变化再绘；隐藏取消待执行帧，离页释放。玻璃遮罩用实际几何包围盒快速排除，再对同一凸界面集合求一次观察射线区间，16次积分只判断其是否落入区间。Gaussian与Beer组合为二次指数，递推同一16个中点权重，相函数移出积分循环；1000组Float32核查与原直接积分的最大相对误差约1.05e-6。没有降低源样本、积分步数、光宽或更改源功率。

页面只读性能文字显示真实提交/光路耗时与最近GPU计时；GPU timer使用可用的EXT_disjoint_timer_query_webgl2，查询异步且最多3条并发，缺失时显示不可测。首次编译均值、不同源样本及控件模式的平均值不能当成最终128样本的帧率。原型仍缺完整观察折射、连续谱与首页；软件调度测试不代替真机/BFCache/context-loss验收。
