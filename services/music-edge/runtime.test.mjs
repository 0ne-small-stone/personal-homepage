import test from 'node:test';
import assert from 'node:assert/strict';
import {builtinModules} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {PNG} from 'pngjs';

// These are upstream SDK 4.41.1's synthetic vectors, not credentials. Keeping
// fixed expected bytes here detects a workerd crypto implementation mismatch.
const weapiVector = {
  params: 'I35d2kSsV0O/f6Zwbm0zYZk18L57q4nZGrVurElSvnlNrOwVA7FuxcVUi2+eVWS6VKYul+QGooY0p87OiZNIKjFRDG54VVf/dUi7hiILgCc=',
  encSecKey: 'd473b9eca232f1b4090dd606b0df86de318748dd2eec307e4ed4345030fc4ee30331e598f41d5a6f5befaab94630ea1a1eda7cfade84fbec1a907913d2e4d2c8744bc572b99a050075e075b4537f645ecfa994f95906c32818e076aeda6bdb906bfa0bb96c4cf4bc3ed6d9ab76cf08441153d9d85e1ea3d78fa8d9210d581cee',
};
const eapiVector = {
  params: '7D398AA5036D61F11B22021C618C2424C1CAC2F4704326F57C979FCAFFE3E07E167623F20725B511E0D163732C2CA31C48CBE449D3518A71D6772DFFBB675E3975E2D06CB0BC3B7AE178AA9E5A9EFED9395A43E5E2FFD920A42E645DAD891BF654BC2B7629454252439909432930637D',
};

test('protocol and QR execute through HTTP in a real nodejs_compat workerd isolate', async t => {
  const builtins = new Set(builtinModules.map(name => name.replace(/^node:/, '')));
  const bundle = await build({
    stdin: {
      resolveDir: fileURLToPath(new URL('.', import.meta.url)),
      sourcefile: 'runtime-fixture.mjs', loader: 'js',
      contents: `
        import {encodeWeapi, encodeEapi} from './netease-protocol.mjs';
        import {qrImage} from './qr.mjs';
        export default {
          async fetch(request) {
            const input = await request.json();
            let result;
            if (input.operation === 'weapi') result = encodeWeapi(input.data, input.secret);
            else if (input.operation === 'eapi') result = encodeEapi(input.uri, input.data);
            else if (input.operation === 'qr') result = qrImage(input.key);
            else return new Response('Unknown fixture operation', {status: 400});
            return Response.json({result, isolate: typeof WebSocketPair === 'function'});
          }
        };
      `,
    },
    bundle: true, write: false, format: 'esm', platform: 'neutral',
    mainFields: ['module', 'main'], conditions: ['workerd', 'worker', 'node'],
    // pngjs is CommonJS and uses Node built-ins. Workers' official nodejs_compat
    // createRequire handles only those external built-ins; no Node host loader
    // or injected crypto/PNG mock is available inside this isolate.
    banner: {js: 'import {createRequire as __fixtureCreateRequire} from "node:module"; const require = __fixtureCreateRequire("/index.js");'},
    plugins: [{
      name: 'workers-node-builtins',
      setup(builder) {
        builder.onResolve({filter: /^(?:node:)?[\w/-]+$/}, ({path}) => {
          const name = path.replace(/^node:/, '');
          return builtins.has(name) ? {path: `node:${name}`, external: true} : undefined;
        });
      },
    }],
  });
  assert.equal(bundle.outputFiles.length, 1);
  const mf = new Miniflare({workers: [{config: {
    name: 'music-edge-runtime-fixture', compatibilityDate: '2026-10-20',
    compatibilityFlags: ['nodejs_compat'],
    manifest: {mainModule: 'index.js', modules: {'index.js': {type: 'esm', contents: bundle.outputFiles[0].text}}},
  }}]});
  t.after(() => mf.dispose());
  async function execute(input) {
    const response = await mf.dispatchFetch('https://runtime-fixture.test/', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(input),
    });
    assert.equal(response.status, 200, await response.clone().text());
    const value = await response.json();
    assert.equal(value.isolate, true, 'result must originate in workerd, not a Node test helper');
    return value.result;
  }

  await t.test('weapi double AES-CBC and RSA_NO_PADDING equal the fixed upstream vector', async () => {
    assert.deepEqual(await execute({operation: 'weapi', data: {type: 3, e_r: false, csrf_token: ''}, secret: 'aaaaaaaaaaaaaaaa'}), weapiVector);
  });

  await t.test('eapi AES-ECB and MD5 equal the fixed upstream vector', async () => {
    assert.deepEqual(await execute({operation: 'eapi', uri: '/api/song/detail', data: {c: '[{"id":123}]', e_r: false}}), eapiVector);
  });

  await t.test('QR PNG uses workerd zlib and retains fixed pixels without filesystem or canvas', async () => {
    const image = await execute({operation: 'qr', key: 'runtime-fixture-12345678'});
    assert.match(image, /^data:image\/png;base64,/);
    const bytes = Buffer.from(image.slice('data:image/png;base64,'.length), 'base64');
    assert.equal(bytes.length, 7365);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), 'b21e9ba81c88d1545560b7486da05a3bcb258d4154e0e1d8a843fccb5290c3d6');
    const png = PNG.sync.read(bytes);
    assert.equal(png.width, 164);
    assert.equal(png.height, 164);
    assert.equal(png.data[0], 255);
    assert.ok(png.data.some((value, index) => index % 4 !== 3 && value === 16));
  });
});
