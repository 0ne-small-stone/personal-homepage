import { randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

export function songId(input) {
  const value = String(input || '').trim();
  if (/^[1-9]\d{0,19}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['music.163.com','y.music.163.com'].includes(url.hostname) || url.username || url.password) throw Error();
    const route = url.hash.startsWith('#/') ? new URL(url.hash.slice(1), url.origin) : url;
    if (!['/song','/song/','/m/song','/m/song/'].includes(route.pathname)) throw Error();
    const id = route.searchParams.get('id');
    if (/^[1-9]\d{0,19}$/.test(id || '')) return id;
  } catch {}
  throw new Error('请填写网易云单曲链接或数字歌曲 ID，歌单和专辑链接不能推歌。');
}
export function validateSubmission(input) {
  const nickname = String(input.nickname || '').trim();
  const reason = String(input.reason || '').trim();
  const id = songId(input.song);
  if (nickname.length < 1 || nickname.length > 40 || /[\u0000-\u001f]/.test(nickname)) throw Error('昵称请填写 1–40 个字符。');
  if (reason.length < 1 || reason.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(reason)) throw Error('推荐理由请填写 1–500 个字符。');
  if (!/^[\da-f-]{36}$/i.test(input.submissionId || '')) throw Error('提交标识无效，请刷新后重试。');
  return { nickname, reason, songId: id, submissionId: input.submissionId };
}
const publicRecord = record => ({ id: record.id, song: record.song, nickname: record.nickname, reason: record.reason, status: record.status, createdAt: record.createdAt, updatedAt: record.updatedAt, message: record.message });
export async function createRecommendationStore(file, adapter) {
  let records;
  try { records = JSON.parse(await readFile(file, 'utf8'));if (!Array.isArray(records)) throw Error('Invalid queue'); }
  catch (error) { if (error.code !== 'ENOENT') throw error;records = []; }
  let tail = Promise.resolve();
  let committed = JSON.stringify(records);
  const serial = fn => {
    const result = tail.then(async () => { try { return await fn(); } catch (error) { records = JSON.parse(committed);throw error; } });
    tail = result.catch(() => {});return result;
  };
  const save = async () => { await mkdir(path.dirname(file), { recursive: true });const tmp = file + '.tmp';const data = JSON.stringify(records, null, 2);await writeFile(tmp, data + '\n', { mode: 0o600 });await rename(tmp, file);committed = data; };
  const latest = () => new Date().toISOString();
  async function sync(record) {
    if (!adapter.authorized()) { record.status = 'awaiting_auth';record.message = '审核已通过，等待歌单管理员授权。';await save();return; }
    record.status = 'syncing';record.message = '正在同步至 Echoes';record.updatedAt = latest();await save();
    try {
      const before = await adapter.playlistIds();
      if (!before.includes(record.song.id)) await adapter.addSong(record.song.id);
      const after = await adapter.playlistIds();
      if (!after.includes(record.song.id)) throw Error('未在目标歌单中读到歌曲，稍后可重试。');
      record.status = 'synced';record.message = before.includes(record.song.id) ? '这首歌已在 Echoes 中，已核验。' : '已添加到 Echoes 并核验。';
    } catch (error) {
      record.status = error.auth ? 'awaiting_auth' : 'failed';
      record.message = error.auth ? '网易云授权已失效，请管理员重新授权。' : '歌单暂时无法同步，请管理员稍后重试。';
    }
    record.updatedAt = latest();await save();
  }
  // A crash during write never means success. Retrying re-reads the upstream playlist first.
  let recovered = false;
  records.forEach(record => { if (record.status === 'syncing') { record.status = 'failed';record.message = '上次同步被中断，可重试核验。';recovered = true; } });
  if (recovered) await save();
  return {
    submit: input => serial(async () => {
      const data = validateSubmission(input);
      const old = records.find(record => record.submissionId === data.submissionId);
      if (old) {
        if (old.song.id !== data.songId || old.nickname !== data.nickname || old.reason !== data.reason) throw Error('此提交已处理，请重新发起一条推荐。');
        return publicRecord(old);
      }
      if (records.length >= 2000) throw Error('推荐队列已满，请稍后再试。');
      const song = await adapter.song(data.songId);
      const record = { id: randomUUID(), submissionId: data.submissionId, song, nickname: data.nickname, reason: data.reason, status: 'pending', createdAt: latest(), updatedAt: latest(), message: '已收到推荐，等待管理员审核。' };
      records.push(record);await save();return publicRecord(record);
    }),
    list: () => records.map(publicRecord).reverse(),
    status: submissionId => { const record = records.find(item => item.submissionId === submissionId);return record ? publicRecord(record) : null; },
    review: (id, decision) => serial(async () => {
      const record = records.find(item => item.id === id);if (!record) throw Error('推荐记录不存在。');
      if (!['approve','reject','retry'].includes(decision)) throw Error('审核操作无效。');
      if (decision === 'reject') {
        if (record.status !== 'pending' && record.status !== 'rejected') throw Error('已通过的推荐不能通过拒绝操作删除歌曲。');
        record.status = 'rejected';record.message = '管理员暂未采用这条推荐。';record.updatedAt = latest();await save();
      } else if (record.status === 'pending' && decision === 'approve' || ['awaiting_auth','failed'].includes(record.status) || record.status === 'synced') {
        if (record.status !== 'synced') await sync(record);
      } else throw Error('该推荐当前不能执行此操作。');
      return publicRecord(record);
    }),
    resume: () => serial(async () => { for (const record of records.filter(record => record.status === 'awaiting_auth')) await sync(record); }),
  };
}
