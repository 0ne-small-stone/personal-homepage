/*
 * Protocol adaptation of @neteasecloudmusicapienhanced/api 4.41.1
 * https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced
 * The MIT License (MIT), Copyright (c) 2013-2022 Binaryify
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import {Buffer} from 'node:buffer';
import {constants, createCipheriv, createHash, publicEncrypt, randomBytes} from 'node:crypto';

const IV = Buffer.from('0102030405060708');
const WEAPI_KEY = Buffer.from('0CoJUm6Qyw8W8jud');
const EAPI_KEY = Buffer.from('e82ckenh8dichen8');
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB
-----END PUBLIC KEY-----`;
const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function aes(text, mode, key) {
  const cipher = createCipheriv(`aes-128-${mode}`, key, mode === 'cbc' ? IV : Buffer.alloc(0));
  return Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
}

export function encodeWeapi(data, secret = Array.from(randomBytes(16), byte => BASE62[byte % 62]).join('')) {
  if (!/^[a-zA-Z0-9]{16}$/.test(secret)) throw Error('Invalid protocol key');
  const first = aes(JSON.stringify(data), 'cbc', WEAPI_KEY).toString('base64');
  const reversed = Buffer.from([...secret].reverse().join(''));
  const padded = Buffer.concat([Buffer.alloc(128 - reversed.length), reversed]);
  return {
    params: aes(first, 'cbc', Buffer.from(secret)).toString('base64'),
    encSecKey: publicEncrypt({key: PUBLIC_KEY, padding: constants.RSA_NO_PADDING}, padded).toString('hex'),
  };
}

export function encodeEapi(uri, data) {
  const text = JSON.stringify(data);
  const digest = createHash('md5').update(`nobody${uri}use${text}md5forencrypt`).digest('hex');
  return {params: aes(`${uri}-36cd479b6b5-${text}-36cd479b6b5-${digest}`, 'ecb', EAPI_KEY).toString('hex').toUpperCase()};
}

const ATTRIBUTES = new Set(['path', 'domain', 'expires', 'max-age', 'samesite', 'secure', 'httponly', 'partitioned']);
export function parseCookie(value = {}) {
  if (value === null || typeof value !== 'string' && (typeof value !== 'object' || Array.isArray(value))) throw Error('Invalid account cookie');
  const pairs = typeof value === 'string' ? value.split(';').map(part => {
    const index = part.indexOf('=');
    return index < 1 ? [] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }) : Object.entries(value);
  const cookie = Object.create(null);
  for (const [key, raw] of pairs) {
    if (!key || ATTRIBUTES.has(key.toLowerCase()) || ['__proto__', 'constructor', 'prototype'].includes(key)) continue;
    if (!/^[A-Za-z0-9_!#$%&'*+.^`|~-]+$/.test(key) || !['string', 'number', 'boolean'].includes(typeof raw)) throw Error('Invalid account cookie');
    const text = String(raw);
    if (/[\r\n\x00;]/.test(text) || text.length > 16384) throw Error('Invalid account cookie');
    cookie[key] = text;
  }
  return cookie;
}

export const serializeCookie = cookie => Object.entries(cookie).filter(([,value]) => value !== undefined).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('; ');

const OS = {
  pc: {os: 'pc', appver: '3.1.17.204416', osver: 'Microsoft-Windows-10-Professional-build-19045-64bit', channel: 'netease'},
  android: {os: 'android', appver: '8.20.20.231215173437', osver: '14', channel: 'xiaomi'},
  iphone: {os: 'iPhone OS', appver: '9.0.90', osver: '16.2', channel: 'distribution'},
  osx: {os: 'osx', appver: '3.1.10.5100', osver: '15.5', channel: 'netease'},
};
export function accountCookie(value, crypto, now = Date.now()) {
  const cookie = parseCookie(value);
  const defaults = OS[cookie.os] || OS.pc;
  const nuid = cookie._ntes_nuid || randomBytes(32).toString('hex');
  const result = {
    ...cookie, __remember_me: 'true', ntes_kaola_ad: '1', _ntes_nuid: nuid,
    _ntes_nnid: cookie._ntes_nnid || `${nuid},${now}`,
    WNMCID: cookie.WNMCID || `${randomBytes(3).toString('hex')}.${now}.01.0`, WEVNSM: cookie.WEVNSM || '1.0.0',
    osver: cookie.osver || defaults.osver, os: cookie.os || defaults.os,
    deviceId: cookie.deviceId || randomBytes(16).toString('hex'),
    appver: cookie.appver || defaults.appver, channel: cookie.channel || defaults.channel,
  };
  // No process-wide anonymous token, account cookie, NMTID cache or device ID.
  if (!result.NMTID && crypto !== 'eapi') result.NMTID = `00O${randomBytes(19).toString('hex')}`;
  return result;
}
