// HTML fixture only. The development worktree and its business logic are unchanged.
// Original component behavior: native radios, type URL, popstate, count, empty/fallback.
class KnowledgeTypeFilter extends HTMLElement {
  connectedCallback() {
    if (this.controller && !this.controller.signal.aborted) return;
    const fieldset = this.querySelector('.knowledge-type-controls');
    const status = this.querySelector('.knowledge-result-status');
    const empty = this.querySelector('.knowledge-empty');
    const fallback = this.querySelector('.knowledge-filter-fallback');
    const controls = [...fieldset.querySelectorAll('input[type="radio"]')];
    const items = [...this.querySelectorAll('.knowledge-list > li')];
    const allowed = new Set(controls.map(control => control.value));
    const fixture = document.querySelector('#empty-fixture');
    const fixtureNote = document.querySelector('.fixture-note');
    const update = () => {
      const params = new URL(location.href).searchParams;
      const requested = params.get('type');
      const invalid = requested !== null && !allowed.has(requested);
      const type = requested && allowed.has(requested) ? requested : 'all';
      const emptyNotes = params.get('fixture') === 'empty-notes';
      let count = 0;
      for (const item of items) {
        const removed = emptyNotes && item.dataset.knowledgeKind === 'note';
        item.hidden = removed || (type !== 'all' && item.dataset.knowledgeKind !== type);
        if (!item.hidden) count++;
      }
      for (const control of controls) control.checked = control.value === type;
      const label = controls.find(control => control.checked)?.dataset.label ?? '全部';
      status.textContent = `${invalid ? '未识别此类型，已显示全部内容。' : ''}${label}：${count} 条内容。`;
      empty.hidden = count !== 0;
      fixture.checked = emptyNotes;
      fixtureNote.hidden = !emptyNotes;
    };
    this.controller = new AbortController();
    const { signal } = this.controller;
    fieldset.addEventListener('change', event => {
      const control = event.target;
      if (!(control instanceof HTMLInputElement) || !allowed.has(control.value)) return;
      const url = new URL(location.href);
      if (control.value === 'all') url.searchParams.delete('type');
      else url.searchParams.set('type', control.value);
      if (url.href !== location.href) history.pushState(history.state, '', url);
      update();
    }, { signal });
    // Sample-only fixture switch, outside the production component UI.
    fixture.addEventListener('change', () => {
      const url = new URL(location.href);
      if (fixture.checked) url.searchParams.set('fixture', 'empty-notes');
      else url.searchParams.delete('fixture');
      history.replaceState(history.state, '', url);
      update();
    }, { signal });
    window.addEventListener('popstate', update, { signal });
    update();
    fieldset.hidden = false;
    fallback.hidden = true;
    fixture.disabled = false;
  }
  disconnectedCallback() { this.controller?.abort(); }
}
if (!customElements.get('knowledge-type-filter')) customElements.define('knowledge-type-filter', KnowledgeTypeFilter);
