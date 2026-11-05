import { gestureDuration, gestureSignal, gesturePoint } from './invite-gestures.ts';
type Spring = { value: number; velocity: number };
type Stroke = { element: SVGPathElement; arrow: string; person: string; start: number[]; end: number[]; previousEnd: number[]; part: string };
type Invite = {
  card: HTMLElement; link: HTMLAnchorElement | HTMLButtonElement; mark: HTMLElement; strokes: Stroke[];
  gesture: string | undefined; morph: Spring; arm: Spring; pose: Spring; target: number; hovered: boolean; waveElapsed: number | null; visible: boolean;
};
const numbers = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

// Exact critically damped response: interruptions retain both position and velocity.
function advance(spring: Spring, target: number, omega: number, dt: number) {
  const offset = spring.value - target;
  const coefficient = spring.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  spring.value = target + (offset + coefficient * dt) * decay;
  spring.velocity = (spring.velocity - omega * coefficient * dt) * decay;
}

// A local selector keeps React-owned marks outside the automatic page-wide mount.
export function mountInviteMarks(root: HTMLElement, view: Window = window, selector = '[data-invite-mark]'): () => void {
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
  const invites: Invite[] = [...root.querySelectorAll<HTMLElement>(selector)].flatMap(mark => {
    const link = mark.closest<HTMLAnchorElement | HTMLButtonElement>('a, button');
    if (!link) return [];
    const card = link.closest<HTMLElement>('[data-invite-surface]') ?? link;
    const strokes = [...mark.querySelectorAll<SVGPathElement>('[data-invite-part]')].map(element => {
      const arrow = element.dataset.inviteArrow!;
      const person = element.dataset.invitePerson!;
      const end = person.match(numbers)!.map(Number);
      return { element, arrow, person, start: arrow.match(numbers)!.map(Number), end, previousEnd: end, part: element.dataset.invitePart! };
    });
    return [{ card, link, mark, strokes, gesture: mark.dataset.inviteGesture, morph: { value: 0, velocity: 0 }, arm: { value: 0, velocity: 0 }, pose: { value: 1, velocity: 0 }, target: 0, hovered: false, waveElapsed: null, visible: true } satisfies Invite];
  });
  const unavailable = (invite: Invite) => !invite.visible || invite.link.matches(':disabled, [aria-disabled="true"]') || !!invite.card.closest('[hidden], [inert], [aria-hidden="true"]');

  function paint(invite: Invite) {
    const progress = Math.max(0, Math.min(1, invite.morph.value));
    invite.mark.style.setProperty('--invite-progress', progress.toFixed(4));
    const pose = Math.max(0, Math.min(1, invite.pose.value));
    for (const stroke of invite.strokes) {
      if (progress === 0) { stroke.element.setAttribute('d', stroke.arrow); continue; }
      if (progress === 1 && invite.arm.value === 0 && pose === 1) { stroke.element.setAttribute('d', stroke.person); continue; }
      const endpoint = stroke.end.map((value,index) => stroke.previousEnd[index] + (value - stroke.previousEnd[index]) * pose);
      let index = 0;
      stroke.element.setAttribute('d', stroke.arrow.replace(numbers, () => {
        const i = index++, pair = i - i % 2;
        const point = gesturePoint(invite.gesture, stroke.part, endpoint[pair], endpoint[pair+1], invite.arm.value);
        return (stroke.start[i] + (point[i % 2] - stroke.start[i]) * progress).toFixed(3);
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
    invite.pose.value = 1; invite.pose.velocity = 0;
    invite.strokes.forEach(stroke => { stroke.previousEnd = stroke.end; });
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
      advance(invite.pose, 1, 18, dt);
      const gesture = invite.gesture, duration = gestureDuration(gesture);
      let desiredAngle = 0;
      if (invite.target && invite.morph.value >= .84) {
        invite.waveElapsed = Math.min(duration, (invite.waveElapsed ?? 0) + dt);
        const phase = invite.waveElapsed / duration;
        desiredAngle = gestureSignal(gesture, phase);
      }
      advance(invite.arm, desiredAngle, 22, dt);
      const settled = Math.abs(invite.morph.value - invite.target) < .0005 && Math.abs(invite.morph.velocity) < .008;
      const armSettled = Math.abs(invite.arm.value) < .025 && Math.abs(invite.arm.velocity) < .25;
      const waveFinished = !invite.target || invite.waveElapsed === duration;
      const poseSettled = Math.abs(1 - invite.pose.value) < .0005 && Math.abs(invite.pose.velocity) < .008;
      if (settled && armSettled && waveFinished && poseSettled) reset(invite, invite.target);
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
    // Preserve the visible pose when a hovered toggle changes its available action.
    for (const invite of invites) {
      let changed = false, poseChanged = false;
      const pose = Math.max(0, Math.min(1, invite.pose.value));
      const currentEnds = invite.strokes.map(stroke => {
        const end = stroke.end.map((value,index) => stroke.previousEnd[index] + (value-stroke.previousEnd[index])*pose);
        return end.map((_,index) => {
          const pair = index - index % 2;
          return gesturePoint(invite.gesture,stroke.part,end[pair],end[pair+1],invite.arm.value)[index % 2];
        });
      });
      for (const stroke of invite.strokes) {
        const {inviteArrow: arrow, invitePerson: person} = stroke.element.dataset;
        if (arrow && person && (arrow !== stroke.arrow || person !== stroke.person)) {
          if (person !== stroke.person) poseChanged = true;
          stroke.arrow = arrow; stroke.person = person;
          stroke.start = arrow.match(numbers)!.map(Number); stroke.end = person.match(numbers)!.map(Number);
          changed = true;
        }
      }
      const gesture = invite.mark.dataset.inviteGesture;
      poseChanged ||= gesture !== invite.gesture;
      invite.gesture = gesture;
      if (poseChanged) {
        // Retarget the geometry actually on screen, even during the previous action.
        invite.arm.value = 0; invite.arm.velocity = 0; invite.waveElapsed = null;
        invite.pose.value = reduced.matches || invite.morph.value === 0 ? 1 : 0;
        invite.pose.velocity = 0;
        if (invite.pose.value === 0) { moving.add(invite); schedule(); }
      }
      if (poseChanged) invite.strokes.forEach((stroke,index) => { stroke.previousEnd = currentEnds[index]; });
      if (changed) paint(invite);
    }
    for (const invite of invites) if (unavailable(invite) && (invite.target || moving.has(invite))) { invite.hovered = false; reset(invite); }
    if (!moving.size) stopClock();
  });
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['hidden', 'inert', 'aria-hidden', 'disabled', 'aria-disabled', 'data-invite-arrow', 'data-invite-person', 'data-invite-gesture'] });
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
