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
        { label: '学习资料', items: [
          { label: '大学物理Ⅱ', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/resources/physics' } }] },
          { label: '大学物理实验', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/resources/physics-lab' } }] },
          { label: '概率论与数理统计', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/resources/probability' } }] },
          { label: '高级数据结构与算法分析', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/resources/ads' } }] },
          { label: '计算机系统', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/resources/computer-systems' } }] },
          { label: '先秦哲学', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/resources/pre-qin-philosophy' } }] },
        ] },
        { label: '笔记', items: [
          { label: '高级数据结构与算法分析', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/notes/ads' } }] },
          { label: '计算机系统', collapsed: true, items: [{ autogenerate: { directory: 'knowledge/notes/computer-systems' } }] },
        ] },
        { label: '文章列表', link: `${base}/knowledge/blog/` },
        { label: '返回首页', link: `${base}/` },
      ],
    }),
  ],
});
