type Spring = { value: number; velocity: number };
type Stroke = { element: SVGPathElement; arrow: string; person: string; start: number[]; end: number[]; forearm: boolean };
type Invite = {
  card: HTMLElement; link: HTMLAnchorElement | HTMLButtonElement; mark: HTMLElement; strokes: Stroke[];
  morph: Spring; arm: Spring; target: number; hovered: boolean; waveElapsed: number | null; visible: boolean;
};
const numbers = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const waveDuration = 1.45;

// Exact critically damped response: interruptions retain both position and velocity.
function advance(spring: Spring, target: number, omega: number, dt: number) {
  const offset = spring.value - target;
  const coefficient = spring.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  spring.value = target + (offset + coefficient * dt) * decay;
  spring.velocity = (spring.velocity - omega * coefficient * dt) * decay;
}

export function mountInviteMarks(root: HTMLElement, view: Window = window): () => void {
  if (!view.matchMedia || !view.requestAnimationFrame) return () => {};
  const doc = root.ownerDocument;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = view.matchMedia('(hover: hover) and (pointer: fine)');
  const removers: (() => void)[] = [];
  const moving = new Set<Invite>();
  let frame = 0;
  let previousTime: number | undefined;
  let disposed = false;
  const listen = (target: EventTarget, event: string, listener: EventListener) => {
    target.addEventListener(event, listener);
    removers.push(() => target.removeEventListener(event, listener));
  };
  const invites: Invite[] = [...root.querySelectorAll<HTMLElement>('[data-invite-mark]')].flatMap(mark => {
    const link = mark.closest<HTMLAnchorElement | HTMLButtonElement>('a, button');
    if (!link) return [];
    const card = link.closest<HTMLElement>('[data-invite-surface]') ?? link;
    const strokes = [...mark.querySelectorAll<SVGPathElement>('[data-invite-part]')].map(element => {
      const arrow = element.dataset.inviteArrow!;
      const person = element.dataset.invitePerson!;
      return { element, arrow, person, start: arrow.match(numbers)!.map(Number), end: person.match(numbers)!.map(Number), forearm: element.dataset.invitePart === 'forearm' };
    });
    return [{ card, link, mark, strokes, morph: { value: 0, velocity: 0 }, arm: { value: 0, velocity: 0 }, target: 0, hovered: false, waveElapsed: null, visible: true } satisfies Invite];
  });
  const unavailable = (invite: Invite) => !invite.visible || invite.link.matches(':disabled, [aria-disabled="true"]') || !!invite.card.closest('[hidden], [inert], [aria-hidden="true"]');

  function paint(invite: Invite) {
    const progress = Math.max(0, Math.min(1, invite.morph.value));
    invite.mark.style.setProperty('--invite-progress', progress.toFixed(4));
    const angle = invite.arm.value * Math.PI / 180;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    for (const stroke of invite.strokes) {
      if (progress === 0) { stroke.element.setAttribute('d', stroke.arrow); continue; }
      if (progress === 1 && angle === 0) { stroke.element.setAttribute('d', stroke.person); continue; }
      let index = 0;
      stroke.element.setAttribute('d', stroke.arrow.replace(numbers, () => {
        const i = index++;
        let end = stroke.end[i];
        if (stroke.forearm && angle !== 0) {
          const pair = i - i % 2;
          const x = stroke.end[pair] - 14.3, y = stroke.end[pair + 1] - 10.3;
          end = i % 2 === 0 ? 14.3 + x * cosine - y * sine : 10.3 + x * sine + y * cosine;
        }
        return (stroke.start[i] + (end - stroke.start[i]) * progress).toFixed(3);
      }));
    }
  }
  function stopClock() {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0; previousTime = undefined;
  }
  function reset(invite: Invite, target = 0) {
    invite.target = target;
    invite.morph.value = target; invite.morph.velocity = 0;
    invite.arm.value = 0; invite.arm.velocity = 0; invite.waveElapsed = null;
    moving.delete(invite); paint(invite);
  }
  function schedule() {
    if (!frame && !disposed && !doc.hidden && moving.size) frame = view.requestAnimationFrame(tick);
  }
  function tick(time: number) {
    frame = 0;
    const dt = previousTime === undefined ? 0 : Math.min(.064, Math.max(0, (time - previousTime) / 1000));
    previousTime = time;
    for (const invite of moving) {
      if (unavailable(invite)) { reset(invite); continue; }
      advance(invite.morph, invite.target, invite.target ? 16 : 20, dt);
      let desiredAngle = 0;
      if (invite.target && invite.morph.value >= .84) {
        invite.waveElapsed = Math.min(waveDuration, (invite.waveElapsed ?? 0) + dt);
        const phase = invite.waveElapsed / waveDuration;
        desiredAngle = -20 * Math.sin(phase * Math.PI * 4) * Math.sin(phase * Math.PI) ** 2;
      }
      advance(invite.arm, desiredAngle, 22, dt);
      const settled = Math.abs(invite.morph.value - invite.target) < .0005 && Math.abs(invite.morph.velocity) < .008;
      const armSettled = Math.abs(invite.arm.value) < .025 && Math.abs(invite.arm.velocity) < .25;
      const waveFinished = !invite.target || invite.waveElapsed === waveDuration;
      if (settled && armSettled && waveFinished) reset(invite, invite.target);
      else paint(invite);
    }
    if (moving.size) schedule(); else previousTime = undefined;
  }
  function sync(invite: Invite) {
    const target = !unavailable(invite) && !doc.hidden && ((pointer.matches && invite.hovered) || invite.link.matches(':focus-visible')) ? 1 : 0;
    if (reduced.matches) { reset(invite, target); if (!moving.size) stopClock(); return; }
    if (target === invite.target) return;
    invite.target = target;
    invite.waveElapsed = null;
    moving.add(invite); schedule();
  }
  for (const invite of invites) {
    listen(invite.card, 'pointerenter', event => {
      invite.hovered = (event as PointerEvent).pointerType !== 'touch'; sync(invite);
    });
    listen(invite.card, 'pointerleave', () => { invite.hovered = false; sync(invite); });
    listen(invite.link, 'focus', () => sync(invite));
    listen(invite.link, 'blur', () => sync(invite));
  }
  const refresh = () => {
    for (const invite of invites) {
      invite.hovered = pointer.matches && invite.card.matches(':hover');
      sync(invite);
    }
  };
  listen(reduced, 'change', refresh);
  listen(pointer, 'change', refresh);
  listen(doc, 'visibilitychange', () => {
    if (doc.hidden) { stopClock(); invites.forEach(invite => { invite.hovered = false; reset(invite); }); }
    else refresh();
  });
  // Filtering may hide a settled, focused card while no frame is running.
  const Observer = (view as Window & typeof globalThis).MutationObserver;
  const observer = new Observer(() => {
    for (const invite of invites) if (unavailable(invite) && (invite.target || moving.has(invite))) { invite.hovered = false; reset(invite); }
    if (!moving.size) stopClock();
  });
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['hidden', 'inert', 'aria-hidden', 'disabled', 'aria-disabled'] });
  // Cancel hidden/offscreen marks, including the compact work-list view.
  const Intersector = (view as Window & typeof globalThis).IntersectionObserver;
  const byMark = new Map(invites.map(invite => [invite.mark, invite]));
  const intersector = Intersector ? new Intersector(entries => {
    for (const entry of entries) {
      const invite = byMark.get(entry.target as HTMLElement)!;
      invite.visible = entry.isIntersecting;
      invite.hovered = entry.isIntersecting && pointer.matches && invite.card.matches(':hover');
      if (!entry.isIntersecting) reset(invite); else sync(invite);
    }
    if (!moving.size) stopClock();
  }) : undefined;
  invites.forEach(invite => intersector?.observe(invite.mark));
  refresh();
  return () => {
    disposed = true; stopClock(); observer.disconnect(); intersector?.disconnect(); removers.forEach(remove => remove());
    invites.forEach(invite => reset(invite));
  };
}
