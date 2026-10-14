import api from '@neteasecloudmusicapienhanced/api';
const playlistId = '18476425375';
const ownerId = '13615478042';
function bodyOf(result) {
  let body = result?.body || result;
  for (let i = 0; i < 3 && body?.code === undefined && body?.body; i++) body = body.body;
  return body;
}
function failure(body) { const error = Error('网易云接口暂不可用');error.auth = [301,302,401,403].includes(Number(body?.code));return error; }
export function createNetEaseAdapter() {
  let cookie = '';let profile = null;let key = '';let expiresAt = 0;
  // Only the explicitly chosen API methods are reachable; no API server or unlock plugin.
  async function call(name, input = {}, authenticated = false) {
    try {
      const body = bodyOf(await api[name]({ ...input, cookie: authenticated ? cookie : {}, timeout: 12000, crypto: 'weapi', e_r: false }));
      if (Number(body?.code) !== 200) throw failure(body);
      return body;
    } catch (error) {
      if (error?.auth) { cookie = '';profile = null;throw error; }
      const body = bodyOf(error);throw failure(body);
    }
  }
  return {
    authorized: () => Boolean(cookie && profile),
    account: () => profile ? { nickname: profile.nickname, userId: String(profile.userId) } : null,
    song: async id => {
      const body = await call('song_detail', { ids: id });const track = body.songs?.find(track => String(track.id) === id);
      if (!track) throw Error('没有找到这首网易云歌曲。');
      return { id, title: track.name, artist: (track.ar || []).map(artist => artist.name).join(' / '), album: track.al?.name || '', coverUrl: track.al?.picUrl || '', duration: (track.dt || 0) / 1000 };
    },
    playlistIds: async () => {
      const body = await call('playlist_detail', { id: playlistId }, true);
      if (String(body.playlist?.creator?.userId) !== ownerId) throw Error('目标歌单身份核对失败');
      return (body.playlist.trackIds || []).map(track => String(track.id));
    },
    addSong: async id => { await call('playlist_tracks', { op: 'add', pid: playlistId, tracks: id }, true); },
    createQr: async () => {
      const body = await call('login_qr_key');key = body.data?.unikey || '';expiresAt = Date.now() + 180000;
      if (!key) throw Error('暂时无法获取登录二维码。');
      const result = bodyOf(await api.login_qr_create({ key, qrimg: true }));
      return { image: result.data.qrimg, expiresAt };
    },
    checkQr: async () => {
      if (!key || Date.now() > expiresAt) return { code: 800, message: '二维码已过期，请重新获取。' };
      let body;
      try { body = bodyOf(await api.login_qr_check({ key, cookie: {}, timeout: 12000, crypto: 'weapi', e_r: false })); }
      catch { throw Error('登录状态暂时无法读取，请稍后重试。'); }
      const code = Number(body?.code);
      if (code === 803 && body.cookie) {
        const candidate = body.cookie;
        const account = await api.login_status({ cookie: candidate, timeout: 12000, crypto: 'weapi', e_r: false });
        const data = bodyOf(account)?.data;const nextProfile = data?.profile;
        if (Number(data?.code) !== 200 || String(nextProfile?.userId) !== ownerId) {
          cookie = '';profile = null;key = '';throw Error('请使用拥有 Echoes 歌单的账号陈世先stt授权。');
        }
        cookie = candidate;profile = nextProfile;key = '';
        return { code: 803, message: '已验证歌单管理员，授权仅保留在本次服务内存。', account: { nickname: profile.nickname } };
      }
      return { code, message: code === 802 ? '已扫码，请在网易云 App 中确认。' : code === 801 ? '请用网易云 App 扫码。' : '二维码已过期，请重新获取。' };
    },
    logout: () => { cookie = '';profile = null;key = ''; },
  };
}
