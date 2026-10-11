// Nextcloud's official Login Flow v2. The owner signs in in their browser;
// Credentials stay in memory; revocation is attempted after provisioning.
import { mkdir, writeFile } from 'node:fs/promises';

const origin = 'https://pan.koala-studio.org.cn';
const folder = 'LSSH-Echoes';
const statusPath = '.local-tools/music/cloud-setup.json';
const headers = { 'User-Agent': 'LSSH Echoes folder setup', 'Accept': 'application/json' };
await mkdir('.local-tools/music', { recursive: true });
async function status(data) { await writeFile(statusPath, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2) + '\n'); }
function trustedUrl(value) {
  const url = new URL(value);
  if (url.origin !== origin || url.username || url.password) throw new Error('云盘返回了非预期服务器地址，已停止。');
  return url.href;
}
let credentials;
const initial = await fetch(`${origin}/index.php/login/v2`, { method: 'POST', headers, signal: AbortSignal.timeout(30000) });
if (!initial.ok) throw new Error(`无法发起官方登录流程（HTTP ${initial.status}）。`);
const flow = await initial.json();
const loginUrl = trustedUrl(flow.login);
const pollUrl = trustedUrl(flow.poll.endpoint);
await status({ state: 'waitingForLogin', loginUrl, folder });
console.log(JSON.stringify({ state: 'waitingForLogin', loginUrl, folder }));
const deadline = Date.now() + 19 * 60 * 1000;
while (Date.now() < deadline) {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const result = await fetch(pollUrl, { method: 'POST', headers, body: new URLSearchParams({ token: flow.poll.token }), signal: AbortSignal.timeout(20000) });
  if (result.status === 404) continue;
  if (!result.ok) throw new Error(`云盘登录未完成（HTTP ${result.status}）。`);
  credentials = await result.json();
  trustedUrl(credentials.server);
  if (typeof credentials.loginName !== 'string' || !credentials.loginName || typeof credentials.appPassword !== 'string' || !credentials.appPassword) {
    await status({ state: 'failed', folder, folderCreated: false, message: '官方登录返回的信息不完整，尚未创建文件夹。' });
    throw new Error('官方登录返回的信息不完整，尚未创建文件夹。');
  }
  break;
}
if (!credentials) { await status({ state: 'loginExpired', folder }); throw new Error('登录等待已到期，尚未创建文件夹。'); }
const authenticatedHeaders = { ...headers, 'OCS-APIRequest': 'true', Authorization: `Basic ${Buffer.from(`${credentials.loginName}:${credentials.appPassword}`).toString('base64')}` };
async function api(url, options = {}) {
  return fetch(trustedUrl(url), { ...options, redirect: 'error', headers: { ...authenticatedHeaders, ...options.headers }, signal: AbortSignal.timeout(30000) });
}
let folderCreated = false;
try {
  const who = await api(`${origin}/ocs/v2.php/cloud/user?format=json`);
  const user = (await who.json()).ocs;
  if (!who.ok || ![100, 200].includes(Number(user.meta.statuscode)) || !user.data.id) throw new Error(`无法核对云盘用户身份：HTTP ${who.status}，OCS ${Number(user.meta.statuscode)}，字段 ${Object.keys(user.data || {}).join(',')}。`);
  const davUrl = `${origin}/remote.php/dav/files/${encodeURIComponent(user.data.id)}/${encodeURIComponent(folder)}`;
  const create = await api(davUrl, { method: 'MKCOL' });
  if (create.status === 405) throw new Error('同名文件夹已经存在；没有改动其文件或共享权限。');
  if (create.status !== 201) throw new Error(`文件夹创建失败（HTTP ${create.status}）。`);
  folderCreated = true;
  await status({ state: 'folderCreated', folder });
  const readback = await api(davUrl, { method: 'PROPFIND', headers: { Depth: '0' } });
  if (readback.status !== 207) throw new Error('创建后的文件夹未能读回。');
  const shareResponse = await api(`${origin}/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json`, {
    method: 'POST', body: new URLSearchParams({ path: `/${folder}`, shareType: '3', permissions: '1', publicUpload: 'false', label: 'LSSH Echoes music library' }),
  });
  const shareData = (await shareResponse.json()).ocs;
  if (!shareResponse.ok || ![100, 200].includes(Number(shareData.meta.statuscode)) || !shareData.data.id) throw new Error('文件夹已创建，但只读分享创建失败。');
  const confirm = await api(`${origin}/ocs/v2.php/apps/files_sharing/api/v1/shares/${encodeURIComponent(shareData.data.id)}?format=json`);
  const verified = (await confirm.json()).ocs;
  if (!confirm.ok || ![100, 200].includes(Number(verified.meta.statuscode)) || Number(verified.data.permissions) !== 1 || Number(verified.data.share_type) !== 3) throw new Error('只读分享权限未能核验。');
  const shareUrl = trustedUrl(shareData.data.url);
  await status({ state: 'ready', folder, shareUrl });
  console.log(JSON.stringify({ state: 'ready', folder, shareUrl }));
} catch (error) {
  await status({ state: 'failed', folder, folderCreated, message: error.message });
  throw error;
} finally {
  try {
    const revoke = await api(`${origin}/ocs/v2.php/core/apppassword`, { method: 'DELETE' });
    if (!revoke.ok) console.warn('一次性连接授权未能自动撤销，可在云盘安全设置中移除 LSSH Echoes folder setup。');
  } catch {
    console.warn('撤销接口暂时不可用，可在云盘安全设置中移除 LSSH Echoes folder setup。');
  } finally { credentials = null; }
}
