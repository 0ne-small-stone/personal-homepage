const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const root = process.cwd();
const fixture = path.resolve('.ci-tmp/t07-03-fixture');
assert(fixture.startsWith(root + path.sep + '.ci-tmp' + path.sep));
assert(!fs.existsSync(fixture), 'Do not overwrite an existing snapshot.');
const files = execFileSync('git', ['ls-files', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean);
const hash = name => createHash('sha256').update(fs.readFileSync(name)).digest('hex');
const sourceArticles = files.filter(name => name.startsWith('src/content/docs/knowledge/blog/')).map(name => ({name,sha256:hash(name)}));
fs.mkdirSync(fixture,{recursive:true});
for (const name of files) {
  const destination = path.join(fixture,name);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(name,destination);
}
fs.symlinkSync(path.join(root,'node_modules'),path.join(fixture,'node_modules'),'junction');
const samples=[];
for (let i=1; i<=12; i++) {
  const id=String(i).padStart(2,'0');
  const draft=i===12;
  const date=new Date(Date.UTC(2026,9,8-i)).toISOString().slice(0,10);
  const tag=draft?'草稿分页排除':i%2?'奇数验证':'偶数验证';
  const file=`src/content/docs/knowledge/blog/pagination-check-${id}.md`;
  const source=`---\ntitle: 分页验证 ${id}（仅本机样稿）\ndescription: 仅用于 T07.03 标签与分页验收，不是正式文章。\ndate: ${date}\ntags:\n  - 分页验证\n  - ${tag}\nentryId: demo-pagination-check-${id}\nkind: article\ntopics:\n  - 功能验证\nexample: true\nrelated: []\ndraft: ${draft}\n---\n\n这是仅本机的 T07.03 功能验证样稿，不是站主的正式文章。\n\n<!-- excerpt -->\n\n## 测试内容\n\n样稿编号 ${id}。用于核对日期顺序、标签筛选、分页边界和阅读返回。\n\n检索标记：T07PAGINATION${id}20261008。\n\n## 验证范围\n\n这里只验证文章列表、标签与返回行为。测试文件只在被忽略的隔离目录中，不进入正式内容。\n`;
  fs.writeFileSync(path.join(fixture,file),source);
  samples.push({file,id,draft,date,tag});
}
const output=execFileSync(process.execPath,['node_modules/astro/bin/astro.mjs','build'],{cwd:fixture,encoding:'utf8',maxBuffer:16*1024*1024});
fs.writeFileSync('.ci-tmp/t07-03-fixture-build.log',output);
for(const article of sourceArticles) assert.equal(hash(article.name),article.sha256);
const record={scope:'isolated local production fixture; not canonical content',samples,sourceArticles,originalArticlesUnchanged:true,pages:Number(output.match(/\[build\] (\d+) page\(s\) built/)?.[1]),success:true};
fs.writeFileSync('.ci-tmp/t07-03-fixtures.json',JSON.stringify(record,null,2));
console.log(JSON.stringify({samplePublished:11,sampleDraft:1,canonicalArticlesUnchanged:true,pages:record.pages}));
