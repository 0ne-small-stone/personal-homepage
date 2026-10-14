# P01 51 白光观察源码归档

2026-10-13。仅独立白光观察传输，首页未接入，连续谱未实现。当前`/white/`使用Three0.186.1和three-mesh-bvh0.9.15；three-gpu-pathtracer0.0.27仍是根路径失败首样的锁定依赖。

## 复现

在已安装根依赖的仓库，把本目录21份源/锁文件复制到`.ci-tmp/optics-engine/`。保留他人工作和实验；在隔离目录运行`npm ci`。回到根运行`node .ci-tmp/optics-engine/build.mjs`，再运行`node .ci-tmp/optics-engine/server.mjs`。已有本样本4339服务可复用，不终止无关Node进程。打开`http://127.0.0.1:4339/white/`；根路径是失败首样，不用于交付。

build.mjs从根实际GlassTriangle/prism-ray提取几何/求解器，调用根esbuild。本目录保留实际生成的geometry.js/ray.js；离开根工程复现需自行提供esbuild并构建white-entry，不误认为归档会安装主框架。

依次用Node运行同目录check-white.mjs、check-receiver.mjs、check-scheduler.mjs、check-observer.mjs。这些脚本向51证据目录写固定JSON；重做历史实验前另设输出目的地，避免覆盖旧证据。无type字段的Node模块探测警告不是物理检查失败。

## GPU验证

等待128源采样、16原生块和稀疏尾部完成，状态为“静止停算”。验证观察光路；转动到.6rad后再验证。验证缓存像素会计算昂贵的完整512参考帧，仅用于明确验证，不在普通循环跑。观察余量检查开启后等待完成再统计，随后关闭。关介质、关源、IOR1有对照；手机测试后恢复视口。

临时四分之一分辨率响应不降低最终分辨率；尾部复用MRT的实际Float32世界锚点，在同一射线上补算。完整失败、实际计时、独立GPU证据及边界见上级observer工程记录，不把CPU检查/编译冒称GPU通过。

## 来源与边界

Three、three-mesh-bvh及stock three-gpu-pathtracer均为MIT包，按锁文件安装并保留其许可证。网格/求解器与新增代码来自本项目，不复制ALCHE素材。归档不含node_modules或生成bundle；版本完整性和源码/包哈希在observer-engineering.json。

模型是理想无吸收玻璃、两个albedo .65的Lambert面、单次空气散射及有限核/分支预算，不宣称完整全局光追。128为确定性空间采样，不是时间蒙特卡洛spp。主站、真机、连续谱和生命周期接入另验。
