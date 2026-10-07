// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

// GitHub Pages project sites require this prefix in routes, assets and search.
const base = '/personal-homepage';

export default defineConfig({
  site: 'https://0ne-small-stone.github.io',
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: '个人主页',
      defaultLocale: 'root',
      locales: { root: { label: '简体中文', lang: 'zh-CN' } },
      description: '资料、文章与笔记，共用一个学习入口。',
      customCss: ['./src/styles/tokens.css', './src/styles/knowledge.css'],
      plugins: [starlightBlog({
        title: '文章',
        prefix: 'knowledge/blog',
        navigation: 'none',
        rss: false,
        structuredData: false,
      })],
      sidebar: [
        { label: '学习总览', link: `${base}/knowledge/` },
        { label: '资料', items: [{ autogenerate: { directory: 'knowledge/resources' } }] },
        { label: '笔记', items: [{ autogenerate: { directory: 'knowledge/notes' } }] },
        { label: '文章列表', link: `${base}/knowledge/blog/` },
        { label: '返回首页', link: `${base}/` },
      ],
    }),
  ],
});
