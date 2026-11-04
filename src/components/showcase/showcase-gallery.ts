import { clampSelection, dragIntent, exhibitPose, releaseSelection } from './gallery-state';

type Filter = 'all' | 'project' | 'video' | 'writing';
type View = 'exhibition' | 'index';

class AfterimageGallery extends HTMLElement {
  private abort?: AbortController;
  private rail!: HTMLElement;
  private cards: HTMLElement[] = [];
  private filter: Filter = 'all';
  private view: View = 'exhibition';
  private active = '';
  private gesture?: { x: number; y: number; id: number; index: number; dx: number; dragging: boolean };
  private suppressClickUntil = 0;
  private restoreFrame = 0;
  private ready = false;
  private motion = matchMedia('(prefers-reduced-motion: reduce)');

  connectedCallback() {
    if (this.abort) return;
    this.abort = new AbortController();
    const { signal } = this.abort;
    this.rail = this.querySelector<HTMLElement>('.ai-rail')!;
    this.cards = [...this.querySelectorAll<HTMLElement>('.ai-work')];
    this.setAttribute('data-enhanced', '');
    this.addEventListener('click', this.handleClick, { signal });
    this.rail.addEventListener('keydown', this.keydown, { signal });
    this.rail.addEventListener('pointerdown', this.pointerdown, { signal });
    this.rail.addEventListener('pointermove', this.pointermove, { signal });
    window.addEventListener('pointerup', this.pointerend, { signal });
    window.addEventListener('pointercancel', this.pointercancel, { signal });
    window.addEventListener('blur', this.cancelGesture, { signal });
    window.addEventListener('resize', this.cancelGesture, { signal });
    window.addEventListener('pagehide', this.pagehide, { signal });
    window.addEventListener('pageshow', this.pageshow, { signal });
    this.rail.addEventListener('lostpointercapture', this.pointercancel, { signal });
    window.addEventListener('popstate', this.restore, { signal });
    document.addEventListener('astro:page-load', this.onReady, { signal });
    document.addEventListener('visibilitychange', this.cancelGesture, { signal });
    this.motion.addEventListener('change', this.motionChanged, { signal });
    this.querySelectorAll<HTMLImageElement>('.ai-cover > img').forEach(img => {
      const failed = () => {
        img.hidden = true;
        img.parentElement!.querySelector<HTMLElement>('.ai-cover-fallback')!.hidden = false;
      };
      img.addEventListener('error', failed, { signal });
      if (img.complete && !img.naturalWidth) failed();
    });
  }

  disconnectedCallback() {
    this.cancelGesture();
    this.abort?.abort(); this.abort = undefined;
    this.ready = false;
    cancelAnimationFrame(this.restoreFrame);
  }

  private visible() { return this.cards.filter(card => !card.hidden); }
  // Astro connects incoming elements before replacing the location. Restore only after page-load.
  private onReady = () => { this.ready = true; this.restore(); };
  private restore = () => {
    if (!this.ready || location.pathname !== this.dataset.pagePath) return;
    this.cancelGesture();
    cancelAnimationFrame(this.restoreFrame);
    delete this.dataset.ready;
    const params = new URL(location.href).searchParams;
    const requestedFilter = params.get('type');
    this.filter = requestedFilter === 'project' || requestedFilter === 'video' || requestedFilter === 'writing' ? requestedFilter : 'all';
    this.view = params.get('view') === 'index' ? 'index' : 'exhibition';
    this.active = params.get('work') || this.cards[0]?.dataset.slug || '';
    this.render(false);
    this.restoreFrame = requestAnimationFrame(() => {
      this.dataset.ready = 'true';
      if (params.get('return') !== '1') return;
      let y: number | undefined;
      try {
        const saved = JSON.parse(sessionStorage.getItem('lssh.afterimage.return') || 'null');
        if (saved?.slug === this.active && saved?.filter === this.filter && saved?.view === this.view && Number.isFinite(saved.y)) y = saved.y;
      } catch { /* URL selection and focus still work without storage. */ }
      if (y !== undefined) window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
      const card = this.cards.find(card => card.dataset.slug === this.active);
      if (y === undefined && this.view === 'index') card?.scrollIntoView({ block: 'center', behavior: 'instant' });
      card?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    });
  };

  private render(announce = true) {
    this.cancelGesture();
    this.dataset.view = this.view;
    this.rail.setAttribute('aria-label', this.view === 'index' ? '作品目录' : '作品展览，可左右拖动或用方向键选择');
    this.rail.tabIndex = this.view === 'index' ? -1 : 0;
    this.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === this.filter)));
    this.querySelectorAll<HTMLButtonElement>('[data-view-button]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewButton === this.view)));
    this.cards.forEach(card => { card.hidden = this.filter !== 'all' && card.dataset.kind !== this.filter; });
    const visible = this.visible();
    this.querySelector<HTMLElement>('.ai-empty')!.hidden = visible.length > 0;
    this.rail.hidden = !visible.length;
    this.querySelector<HTMLElement>('.ai-exhibition-footer')!.hidden = !visible.length || this.view === 'index';
    const card = visible.find(item => item.dataset.slug === this.active) || visible[0];
    if (card) this.activate(card, false);
    else this.active = '';
    if (announce) this.announce(visible.length ? `显示 ${visible.length} 件作品，${this.view === 'index' ? '目录' : '展览'}视图` : '文字作品还在整理');
    this.updateLinks();
  }

  private announce(text: string) { this.querySelector<HTMLElement>('[data-announcement]')!.textContent = text; }

  private arrange(position: number) {
    this.visible().forEach((card, index) => {
      const pose = exhibitPose(index - position, this.motion.matches);
      card.style.setProperty('--work-x', `${pose.x}%`);
      card.style.setProperty('--work-z', `${pose.z}px`);
      card.style.setProperty('--work-turn', `${pose.rotate}deg`);
      card.style.setProperty('--work-opacity', String(pose.opacity));
      card.style.zIndex = String(pose.layer);
      card.dataset.near = String(Math.abs(index - position) < 1.6);
    });
  }

  private activate(card: HTMLElement, announce = true) {
    const refocus = this.view === 'exhibition' && !!this.querySelector('.ai-work-link:focus');
    this.active = card.dataset.slug!;
    this.cards.forEach(item => {
      const selected = item === card;
      item.dataset.active = String(selected);
      const link = item.querySelector<HTMLAnchorElement>('.ai-work-link')!;
      link.tabIndex = this.view === 'exhibition' && !selected ? -1 : 0;
      if (this.view === 'exhibition' && !selected) item.setAttribute('aria-hidden', 'true'); else item.removeAttribute('aria-hidden');
      if (selected && this.view === 'exhibition') link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      link.setAttribute('aria-label', `${item.dataset.title}，${this.view === 'exhibition' && !selected ? '选择这件作品' : item.dataset.kind === 'video' ? '观看视频' : '了解项目'}`);
    });
    const visible = this.visible();
    const index = visible.indexOf(card);
    this.arrange(index);
    this.querySelector<HTMLElement>('[data-position]')!.textContent = `${String(index + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
    this.querySelector<HTMLButtonElement>('[data-step="-1"]')!.disabled = index <= 0;
    this.querySelector<HTMLButtonElement>('[data-step="1"]')!.disabled = index === visible.length - 1;
    if (refocus) card.querySelector<HTMLAnchorElement>('a')!.focus({ preventScroll: true });
    if (announce) this.announce(`${card.dataset.title}，第 ${index + 1} 件，共 ${visible.length} 件。点击进入。`);
    this.updateLinks();
  }

  private motionChanged = () => {
    this.cancelGesture();
    this.arrange(this.visible().findIndex(card => card.dataset.slug === this.active));
  };

  private move(delta: number) {
    this.cancelGesture();
    const visible = this.visible();
    const index = visible.findIndex(card => card.dataset.slug === this.active);
    const card = visible[clampSelection(index + delta, visible.length)];
    if (card) { this.activate(card); this.writeUrl(); }
  }

  private writeUrl() {
    const url = new URL(location.href);
    for (const [key, value] of [['type', this.filter === 'all' ? '' : this.filter], ['view', this.view === 'exhibition' ? '' : this.view], ['work', this.active]]) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    url.searchParams.delete('return');
    history.replaceState(history.state, '', url);
    this.updateLinks();
  }

  private updateLinks() {
    this.cards.forEach(card => {
      const link = card.querySelector<HTMLAnchorElement>('.ai-work-link')!;
      const url = new URL(link.href);
      url.searchParams.set('from', this.view);
      if (this.filter !== 'all') url.searchParams.set('type', this.filter); else url.searchParams.delete('type');
      link.href = url.href;
    });
  }

  private handleClick = (event: MouseEvent) => {
    if (!this.ready) return;
    const target = event.target as Element;
    const card = target.closest<HTMLElement>('.ai-work');
    if (card && event.detail !== 0 && performance.now() < this.suppressClickUntil) { event.preventDefault(); return; }
    const filter = target.closest<HTMLButtonElement>('[data-filter]');
    const view = target.closest<HTMLButtonElement>('[data-view-button]');
    const step = target.closest<HTMLButtonElement>('[data-step]');
    if (filter || target.closest('[data-show-all]')) {
      this.filter = (filter?.dataset.filter || 'all') as Filter;
      this.render(); this.writeUrl();
      if (!filter) this.querySelector<HTMLButtonElement>('[data-filter="all"]')?.focus();
    } else if (view) {
      this.view = view.dataset.viewButton as View; this.render(); this.writeUrl();
    } else if (step) this.move(Number(step.dataset.step));
    if (card) {
      if (this.view === 'exhibition' && card.dataset.slug !== this.active && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault(); this.cancelGesture(); this.activate(card); this.writeUrl(); return;
      }
      this.activate(card, false); this.writeUrl();
      try { sessionStorage.setItem('lssh.afterimage.return', JSON.stringify({ slug: this.active, filter: this.filter, view: this.view, y: scrollY })); } catch { /* Optional return enhancement. */ }
    }
  };

  private keydown = (event: KeyboardEvent) => {
    if (!this.ready || this.view !== 'exhibition' || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); this.move(event.key === 'ArrowRight' ? 1 : -1); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); this.move(event.key === 'Home' ? -this.cards.length : this.cards.length); }
    if (event.key === 'Enter' && event.target === this.rail) this.cards.find(card => card.dataset.slug === this.active)?.querySelector<HTMLAnchorElement>('a')?.click();
  };

  private pointerdown = (event: PointerEvent) => {
    if (!this.ready || !event.isPrimary || event.button !== 0 || this.view !== 'exhibition') return;
    this.cancelGesture();
    this.suppressClickUntil = 0;
    this.gesture = { x: event.clientX, y: event.clientY, id: event.pointerId, index: this.visible().findIndex(card => card.dataset.slug === this.active), dx: 0, dragging: false };
  };
  private pointermove = (event: PointerEvent) => {
    const gesture = this.gesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.dragging) {
      const intent = dragIntent(dx, event.clientY - gesture.y);
      if (intent === 'vertical') { this.cancelGesture(); return; }
      if (intent !== 'horizontal') return;
      gesture.dragging = true;
      this.rail.setPointerCapture(event.pointerId);
      this.rail.dataset.dragging = 'true';
    }
    gesture.dx = dx;
    const width = this.visible()[gesture.index]?.offsetWidth || this.rail.clientWidth;
    const position = gesture.index - dx / (width * .78);
    const bounded = clampSelection(position, this.visible().length);
    this.arrange(bounded + (position - bounded) * .16);
  };
  private pointerend = (event: PointerEvent) => {
    const gesture = this.gesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    const visible = this.visible();
    const next = gesture.dragging ? releaseSelection(gesture.index, visible.length, gesture.dx, visible[gesture.index]?.offsetWidth || 1) : gesture.index;
    if (gesture.dragging) this.suppressClickUntil = performance.now() + 350;
    this.cancelGesture();
    if (next !== gesture.index) { this.activate(visible[next]); this.writeUrl(); }
  };
  private pointercancel = (event: PointerEvent) => { if (this.gesture?.id === event.pointerId) this.cancelGesture(); };
  private pagehide = () => {
    this.cancelGesture();
    cancelAnimationFrame(this.restoreFrame);
    this.suppressClickUntil = 0;
  };
  private pageshow = (event: PageTransitionEvent) => {
    // A cached document already owns its selection and browser-restored scroll position.
    if (event.persisted && this.ready) this.dataset.ready = 'true';
  };
  private cancelGesture = () => {
    const gesture = this.gesture;
    this.gesture = undefined;
    if (gesture && this.rail.hasPointerCapture(gesture.id)) this.rail.releasePointerCapture(gesture.id);
    delete this.rail.dataset.dragging;
    if (gesture?.dragging) this.arrange(gesture.index);
  };
}

if (!customElements.get('afterimage-gallery')) customElements.define('afterimage-gallery', AfterimageGallery);
