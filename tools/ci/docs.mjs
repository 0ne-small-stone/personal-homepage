import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkValidateLinks from 'remark-validate-links';
import { engine } from 'unified-engine';

export async function checkDocs(root, files = ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', '.github/pull_request_template.md', 'docs']) {
  return new Promise((accept, reject) => engine({
    cwd: root,
    files,
    extensions: ['md'],
    processor: remark,
    plugins: [remarkGfm, [remarkValidateLinks, { root, repository: false }]],
    detectConfig: false,
    output: false,
    quiet: true,
    frail: true,
  }, (error, code, context) => {
    if (error) reject(error);
    else accept({ ...context, code });
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const result = await checkDocs(root);
  process.exitCode = result.code;
  if (result.code === 0) console.log(`文档链接与章节锚点检查通过：${result.files.length} 份文档。`);
}
