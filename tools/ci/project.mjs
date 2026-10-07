import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export function inspectProject(root) {
  const hasPackage = existsSync(join(root, 'package.json'));
  const hasConfig = readdirSync(root).some((name) => /^astro\.config\.(mjs|js|ts|cjs|mts)$/u.test(name));
  const hasSource = existsSync(join(root, 'src'));
  const hasLock = existsSync(join(root, 'package-lock.json'));
  if (!hasPackage && !hasConfig && !hasSource && !hasLock) {
    return { ready: false, message: '尚未初始化 Astro 网站工程。当前只执行仓库与文档检查，网站构建和发布跳过。' };
  }
  if (!hasPackage || !hasConfig || !hasSource || !hasLock) {
    throw new Error('网站工程不完整：需要根目录 package.json、package-lock.json、astro.config.* 和 src/。');
  }
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (!manifest.dependencies?.astro && !manifest.devDependencies?.astro) {
    throw new Error('根目录 package.json 必须声明 Astro 依赖。');
  }
  for (const name of ['dev', 'check', 'build', 'preview']) {
    if (typeof manifest.scripts?.[name] !== 'string' || !manifest.scripts[name].trim()) {
      throw new Error(`package.json 缺少 ${name} 命令。`);
    }
  }
  return { ready: true, message: 'Astro 工程结构就绪，将执行依赖安装、类型检查、静态构建与产物核验。' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const result = inspectProject(root);
    console.log(result.message);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `app_ready=${result.ready}\n`);
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### 工程状态\n\n${result.message}\n`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
