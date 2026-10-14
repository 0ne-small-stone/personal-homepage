# 白光接收面局部传输样本

2026-10-13，51轮接收面切片。独立诊断，不是首页场景或完整物理引擎。此前首样仍保留于相邻`prototype/`及其历史提交；本目录保存此片的14个源/锁文件，哈希见上一级`white-receiver-engineering.json`。

复现时将本目录除README以外的文件复制到项目根的忽略目录`.ci-tmp/optics-engine/`，在已安装根工程依赖的项目根运行：

```powershell
npm ci --prefix .ci-tmp/optics-engine --ignore-scripts --no-audit --no-fund
node .ci-tmp/optics-engine/build.mjs
node .ci-tmp/optics-engine/check-white.mjs
node .ci-tmp/optics-engine/check-receiver.mjs
node .ci-tmp/optics-engine/server.mjs
```

打开本机4339的`/white/`；已有该端口本任务服务时复用。server仅监听127.0.0.1，白名单提供HTML/bundle，不公开安装包或其他本机文件。构建读取当前首页几何和求解器，重现本片时核对提取产物哈希；根esbuild沿用0.28.2，主站依赖未改。

亮点来自真实光路到有限平面的交点、Fresnel分支和Beer衰减，以同一世界空间Gaussian核估计入射辐照度，包含斜入射投影面积余弦；Lambert反射率除以π得到出射辐射亮度，贡献在HDR中相加后统一显示。接收面阻断后续源路径与观察积分；它仅为光学验证面，没有改变主页的黑色抽象方向。

接收面位置/大小/反射率是本地诊断值，并非设计SYSTEM采用值。手机CSS样本只调整诊断相机以包含接收点，不改变源口径、几何或传输参数。128是空间源采样数，非每像素时间蒙特卡洛samples。

仍有单散射和有限核偏差、有限反射分支；玻璃观察腿未完整折射，表面仍由普通Three透射材质显示。无连续谱、首页接管、真机性能或用户审美确认。接收面通过不等于51完整白光门槛通过。
