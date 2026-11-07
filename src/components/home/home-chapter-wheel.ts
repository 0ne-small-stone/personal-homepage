const dragThreshold = 7;

interface WheelDrag {
  pointerId: number;
  x: number;
  y: number;
  origin: number;
  step: number;
  active: boolean;
}

export function installHomeChapterWheel() {
  const wheel = document.querySelector<HTMLElement>('.home-chapter-index');
  if (!wheel) return;
  const links = [...wheel.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  if (!links.length) return;

  const listeners = new AbortController();
  const { signal } = listeners;
  const position = '--home-wheel-position';
  const current = () => Math.max(0, links.findIndex(link => link.hasAttribute('aria-current')));
  let drag: WheelDrag | undefined;
  let snap: number | undefined;
  let snapTimer = 0;
  let clickToSuppress = 0;

  const showPosition = (value: number) => wheel.style.setProperty(position, String(value));
  const clearSnap = () => {
    window.clearTimeout(snapTimer);
    snap = undefined;
    if (!drag?.active) wheel.style.removeProperty(position);
  };
  const observer = new MutationObserver(() => {
    if (snap === current()) clearSnap();
  });
  observer.observe(wheel, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });

  const dragPosition = (event: PointerEvent, gesture: WheelDrag) =>
    Math.max(0, Math.min(links.length - 1, gesture.origin + (gesture.x - event.clientX) / gesture.step));

  const endDrag = () => {
    const gesture = drag;
    drag = undefined;
    delete wheel.dataset.homeWheelDragging;
    if (gesture?.active && wheel.hasPointerCapture(gesture.pointerId)) {
      wheel.releasePointerCapture(gesture.pointerId);
    }
  };
  const cancelDrag = () => {
    if (!drag) return;
    const active = drag.active;
    endDrag();
    if (!active) return;
    if (snap === undefined) wheel.style.removeProperty(position);
    else showPosition(snap);
  };

  wheel.addEventListener('pointerdown', event => {
    clickToSuppress = 0;
    if (!event.isPrimary || event.button !== 0 || event.altKey || event.ctrlKey ||
        event.metaKey || event.shiftKey || drag) return;
    const step = links[0].getBoundingClientRect().width;
    if (step <= 0) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, origin: snap ?? current(), step, active: false };
  }, { signal });

  window.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!(event.buttons & 1)) {
      cancelDrag();
      return;
    }
    if (!drag.active) {
      const dx = Math.abs(event.clientX - drag.x);
      const dy = Math.abs(event.clientY - drag.y);
      if (dy >= dragThreshold && dy >= dx) {
        cancelDrag();
        return;
      }
      if (dx < dragThreshold) return;
      wheel.setPointerCapture(event.pointerId);
      drag.active = true;
      wheel.dataset.homeWheelDragging = '';
    }
    event.preventDefault();
    showPosition(dragPosition(event, drag));
  }, { signal });

  window.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const target = Math.round(dragPosition(event, drag));
    const active = drag.active;
    endDrag();
    if (!active) return;

    clickToSuppress = performance.now() + 700;
    const previousSnap = snap;
    clearSnap();
    if (target === current() && previousSnap === undefined) return;
    snap = target;
    showPosition(target);
    snapTimer = window.setTimeout(clearSnap, 1800);
    links[target].click();
  }, { signal });

  window.addEventListener('click', event => {
    if (!event.isTrusted || !event.detail || !wheel.contains(event.target as Node)) return;
    if (performance.now() < clickToSuppress) {
      clickToSuppress = 0;
      event.preventDefault();
      event.stopImmediatePropagation();
    } else if (snap !== undefined) {
      clearSnap();
    }
  }, { capture: true, signal });
  window.addEventListener('pointercancel', event => {
    if (drag?.pointerId === event.pointerId) cancelDrag();
  }, { signal });
  window.addEventListener('blur', cancelDrag, { signal });
  window.addEventListener('resize', cancelDrag, { signal });
  window.addEventListener('pagehide', () => {
    cancelDrag();
    clearSnap();
    clickToSuppress = 0;
  }, { signal });

  return () => {
    listeners.abort();
    observer.disconnect();
    cancelDrag();
    clearSnap();
  };
}
