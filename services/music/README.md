# Echoes 线上音乐服务

Node24入口`npm run music:online`。仅提供独立会话的网易云登录/标准许可播放和既有核心白名单动作，不加载本机音频、洛雪、固定歌单管理员或文件上传/下载。音乐HTML与构建素材只从本站正式GitHub Pages读取，避免重新构建或复制教材、私有音乐和账号数据。

## 运行配置

- `MUSIC_PUBLIC_ORIGIN`：规范HTTPS origin，不含末尾斜杠。Render默认读取`RENDER_EXTERNAL_URL`；反向代理必须保留此Host。
- `DATABASE_URL`：PostgreSQL连接，仅放托管环境密钥配置。Render蓝图使用同区内部连接，数据库不开放外网IP。
- `MUSIC_SESSION_KEY`：标准Base64编码32字节密钥，仅放托管环境密钥配置。Render的`generateValue`生成256位Base64密钥。更换会使旧保存登录无法解密；不得提交或输出它。
- `PORT`：平台提供，默认10000。只有平台受控环境`RENDER=true`才信任代理追加的最后一项X-Forwarded-For用于限流。

Cookie为Secure、HttpOnly、SameSite=Lax且限定当前Host；前端必须使用新版`musicApiFetch`的same-origin请求。因此在线电台页面和账号接口均由此服务同源提供，不能把此接口直接写进GitHub Pages跨域请求来假定浏览器一定保留登录。返回主页仍到GitHub Pages。

数据库存会话令牌SHA256和绑定该hash的AES256GCM密文。二维码/短期播放地址仅存在该会话的有限内存缓存；登录后轮换令牌，退出删除数据库记录并清空所属账号，其他访客不受影响。初次公网登录重新扫码，不读取本机DPAPI文件。

## 免费验收部署

根`render.yaml`声明一个免费Web服务与一个免费PostgreSQL。服务闲置15分钟会冷启动；免费Postgres30天过期，长期使用前须迁移或由用户选择持久方案。此配置不创建付费磁盘/服务/数据库。若账号已有免费数据库，不替换它，应先询问可用部署资源。

先发布包含same-origin前端的main并等Pages完成，再同步Render蓝图。生成的环境密钥与数据库URL留在Render中；不得回填仓库。服务健康检查通过后，验证两个浏览器会话、真实扫码、服务重启后的恢复和退出撤销。曲目必须实际返回完整授权音源并能seek后再记完整播放；平台返回试听/区域限制时保持真实结果。
