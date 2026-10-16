import { matchesWebsite, readWebsiteFilter, websiteCategories } from '../../data/websites';
export function mountWebsiteDirectory(root: HTMLElement, view: Window = window): () => void {
  const input = root.querySelector<HTMLInputElement>('#website-search')!;
  const categories = [...root.querySelectorAll<HTMLAnchorElement>('[data-category]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-website-card]')];
  const count = root.querySelector<HTMLElement>('[data-result-count]')!;
  const heading = root.querySelector<HTMLElement>('[data-results-heading]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const all = root.querySelector<HTMLButtonElement>('[data-all]')!;
  const reset = root.querySelector<HTMLButtonElement>('[data-reset]')!;
  const emptyReset = root.querySelector<HTMLButtonElement>('[data-empty-reset]')!;
  const clear = root.querySelector<HTMLButtonElement>('[data-clear-query]')!;
  const form = root.querySelector<HTMLFormElement>('form')!;
  let state = readWebsiteFilter(new URL(view.location.href));
  const listeners: (() => void)[] = [];
  const listen = (target: EventTarget, name: string, callback: EventListener) => {
    target.addEventListener(name, callback); listeners.push(() => target.removeEventListener(name, callback));
  };
  function render() {
    input.value = state.query;
    let visible = 0;
    for (const card of cards) {
      card.hidden = (state.category !== 'all' && card.dataset.categoryId !== state.category) || !matchesWebsite(card.dataset.searchText ?? '', state.query);
      if (!card.hidden) visible++;
    }
    const categoryName = websiteCategories.find(item => item.id === state.category)?.name;
    const filtering = Boolean(state.query.trim()) || state.category !== 'all';
    heading.textContent = state.query.trim() ? '查找结果' : categoryName ?? '收藏的网站';
    count.textContent = filtering ? `找到 ${visible} 个网站` : `${visible} 个网站`;
    categories.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
    all.setAttribute('aria-pressed', String(state.category === 'all'));
    reset.hidden = !filtering; clear.hidden = !state.query; empty.hidden = visible > 0; emptyReset.hidden = !filtering;
    root.querySelector<HTMLElement>('[data-empty-title]')!.textContent = cards.length ? '没有找到匹配的网站' : '还没有收录网站';
    root.querySelector<HTMLElement>('[data-empty-copy]')!.textContent = cards.length ? '试试其他关键词，或换一个分类。' : '收藏的网址会在这里按分类整理。';
    root.querySelector<HTMLElement>('[data-results]')!.hidden = visible === 0;
  }
  function update(mode: 'push' | 'replace') {
    const url = new URL(view.location.href);
    state.query ? url.searchParams.set('q', state.query) : url.searchParams.delete('q');
    state.category !== 'all' ? url.searchParams.set('category', state.category) : url.searchParams.delete('category');
    if (url.hash.startsWith('#websites-')) url.hash = '';
    if (url.href !== view.location.href) view.history[`${mode}State`](view.history.state, '', url);
    render();
  }
  listen(input, 'input', () => { state.query = input.value; update('replace'); });
  listen(form, 'submit', event => { event.preventDefault(); state.query = input.value; update('replace'); });
  listen(input, 'keydown', event => {
    if ((event as KeyboardEvent).key === 'Escape' && state.query) { event.preventDefault(); state.query = ''; update('replace'); }
  });
  listen(clear, 'click', () => { state.query = ''; update('replace'); input.focus(); });
  categories.forEach(category => {
    category.setAttribute('role', 'button');
    listen(category, 'click', event => {
      const mouse = event as MouseEvent;
      if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || mouse.button > 0) return;
      event.preventDefault(); state.category = category.dataset.category!; update('push');
    });
    listen(category, 'keydown', event => { if ((event as KeyboardEvent).key === ' ') { event.preventDefault(); category.click(); } });
  });
  listen(all, 'click', () => { state.category = 'all'; update('push'); });
  const resetAll = () => { state = { category: 'all', query: '' }; update('push'); input.focus(); };
  listen(reset, 'click', resetAll); listen(emptyReset, 'click', resetAll);
  listen(view, 'popstate', () => { state = readWebsiteFilter(new URL(view.location.href)); render(); });
  root.querySelectorAll<HTMLElement>('[data-enhanced-only]').forEach(element => { element.hidden = false; });
  root.ownerDocument.querySelector('#nav-links')?.setAttribute('aria-current', 'page');
  root.dataset.enhanced = 'true'; render();
  return () => { listeners.forEach(remove => remove()); };
}
