// Preview-only DOM composition. Reuses the actual Starlight search and filter elements.
// Production handoff should implement this structure in Astro, not ship this adapter.
function composeLearning() {
  const filter = document.querySelector('knowledge-type-filter');
  const originalPage = document.querySelector('.page');
  const search = document.querySelector('site-search');
  const siteTitle = document.querySelector('.site-title');
  if (!filter || !originalPage || !search || !siteTitle || document.body.classList.contains('lssh-learning')) return;
  const make = (tag, className, text) => {
    const node = document.createElement(tag); if (className) node.className = className;
    if (text) node.textContent = text; return node;
  };
  const link = (text, href, className) => { const a = make('a', className, text); a.href = href; return a; };
  const sourceBlog = document.querySelector('.knowledge-blog-link');
  const list = filter.querySelector('.knowledge-list');
  const entries = [...list.querySelectorAll('li[data-knowledge-kind]')];
  const subjects = new Map();
  for (const entry of entries) {
    const meta = entry.querySelector('.knowledge-meta');
    const parts = meta.textContent.split('·').map(part => part.trim()).filter(Boolean);
    const subject = parts[1] || '其他';
    if (!subjects.has(subject)) subjects.set(subject, []);
    subjects.get(subject).push(entry);
    const title = entry.querySelector('a');
    const description = entry.querySelector('p');
    const fullTitle = title.textContent.trim();
    title.setAttribute('aria-label', fullTitle);
    if (fullTitle.startsWith(subject + ' · ')) title.textContent = fullTitle.slice(subject.length + 3);
    const body = make('div', 'lssh-entry-body'); body.append(title, description);
    meta.replaceChildren(...parts.filter((_, i) => i !== 1).map(part => make('span', '', part)));
    const row = make('div', 'lssh-entry'); row.append(body, meta);
    entry.replaceChildren(row);
  }

  const shell = make('div', 'lssh-shell');
  const header = make('header', 'lssh-header');
  siteTitle.textContent = 'LSSH'; siteTitle.setAttribute('aria-label', 'Little Stone Still Here · 首页');
  const nav = make('nav', 'lssh-global-nav'); nav.setAttribute('aria-label', '站点栏目');
  for (const [name, path] of [['学习', 'knowledge'], ['展示', 'showcase'], ['常用网站', 'links'], ['电台', 'music']]) {
    const a = link(name, `/personal-homepage/${path}/`);
    if (path === 'knowledge') a.setAttribute('aria-current', 'page');
    nav.append(a);
  }
  header.append(siteTitle, nav, search); shell.append(header);
  const main = make('main', 'lssh-main'); main.setAttribute('data-pagefind-body', '');
  const intro = make('div', 'lssh-intro');
  const title = make('h1', '', 'Becoming'); title.id = '_top'; title.setAttribute('aria-label', 'Becoming · 学习总览');
  intro.append(title, make('p', 'lssh-lead', '资料、文章与笔记。在阅读中积累，在记录中理解。'));
  main.append(intro);
  const grid = make('div', 'lssh-browser');
  const aside = make('aside', 'lssh-index');
  const index = make('details', 'lssh-subjects');
  index.open = innerWidth > 800;
  const summary = make('summary', '', '科目索引');
  summary.append(make('span', 'lssh-index-count', String(subjects.size)));
  index.append(summary);
  const subjectNav = make('nav', 'lssh-subject-nav'); subjectNav.setAttribute('aria-label', '当前列表科目');
  const groups = [];
  let id = 0;
  for (const [name, items] of subjects) {
    const heading = make('h2', 'lssh-subject-heading'); heading.id = `subject-${id++}`;
    heading.append(make('span', '', name)); const total = make('span', 'lssh-subject-count'); heading.append(total);
    const a = link('', '#' + heading.id); a.append(make('span', '', name)); const tally = make('span', 'lssh-index-count'); a.append(tally);
    subjectNav.append(a); groups.push({ items, heading, total, link: a, tally });
    for (const entry of items) list.append(entry);
  }
  index.append(subjectNav); aside.append(index);
  const collectionNote = make('div', 'lssh-collection-note');
  collectionNote.append(make('p', '', '关于这些收藏'), make('p', '', '收集学习中用到的资料与笔记。来源、文件信息与阅读入口见各条目。'));
  if (sourceBlog) { sourceBlog.textContent = '按时间浏览文章'; collectionNote.append(sourceBlog); }
  index.append(collectionNote);
  const results = make('section', 'lssh-results'); results.setAttribute('aria-label', '学习内容');
  results.append(filter); grid.append(aside, results); main.append(grid); shell.append(main);
  const footer = make('footer', 'lssh-footer');
  footer.append(make('span', '', 'Little Stone Still Here'), make('span', '', '学习总览 · 设计预览'));
  shell.append(footer);
  document.body.append(shell); originalPage.remove();
  document.body.classList.add('lssh-learning');
  document.documentElement.classList.add('lssh-root');
  document.documentElement.dataset.theme = 'dark';
  document.title = 'Becoming · Little Stone Still Here · 设计预览';

  const status = filter.querySelector('.knowledge-result-status');
  const fieldset = filter.querySelector('fieldset');
  const toolbar = make('div', 'lssh-filter-toolbar');
  filter.prepend(toolbar); toolbar.append(fieldset, status);
  function reflectGroups() {
    let available = 0;
    for (const group of groups) {
      const visible = group.items.filter(item => !item.hidden);
      group.link.hidden = !visible.length;
      group.heading.hidden = !visible.length;
      if (visible.length) { visible[0].prepend(group.heading); available++; }
      group.total.textContent = `${visible.length} 条`;
      group.tally.textContent = String(visible.length);
    }
    summary.querySelector('span').textContent = String(available);
    let empty = subjectNav.querySelector('.lssh-index-empty');
    if (!empty) { empty = make('p', 'lssh-index-empty', '当前类型暂无内容'); subjectNav.append(empty); }
    empty.hidden = available !== 0;
  }
  reflectGroups();
  filter.addEventListener('change', reflectGroups);
  window.addEventListener('popstate', reflectGroups);
  const mobile = matchMedia('(max-width: 800px)');
  mobile.addEventListener('change', event => { index.open = !event.matches; });
}
if (document.readyState === 'complete') composeLearning();
else document.addEventListener('DOMContentLoaded', composeLearning, { once: true });
