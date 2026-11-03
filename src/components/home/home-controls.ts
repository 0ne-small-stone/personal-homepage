import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

export const homeControlSelector = '.home-header, .home-cta, .home-chapter-index, .home-scene-controls, .home-scroll, .home-wall-bottom, .home-loader, .home-guestbook';
type Animation = { kill(): unknown };
type Animator = (target: HTMLElement, text: string, complete: () => void) => Animation;

// One finite run per visual label. Cancellation invalidates old completions,
// including completions arriving after a new run or a route teardown.
export class FiniteScramble {
  running = false;
  private revision = 0;
  private animation?: Animation;
  private target: { textContent: string | null };
  private text: string;
  private animate: (complete: () => void) => Animation;
  private changed: () => void;
  constructor(target: { textContent: string | null }, text: string,
    animate: (complete: () => void) => Animation, changed = () => {}) {
    this.target = target; this.text = text; this.animate = animate; this.changed = changed;
  }
  play() {
    if (this.running) return;
    const revision = ++this.revision;
    this.running = true;
    const animation = this.animate(() => {
      if (revision !== this.revision) return;
      this.running = false; this.animation = undefined;
      this.target.textContent = this.text; this.changed();
    });
    if (revision === this.revision && this.running) this.animation = animation;
    else animation.kill();
    this.changed();
  }
  cancel() {
    ++this.revision;
    const animation = this.animation;
    this.animation = undefined; this.running = false;
    animation?.kill(); this.target.textContent = this.text; this.changed();
  }
}

const animateLabel: Animator = (target, text, onComplete) => {
  gsap.registerPlugin(ScrambleTextPlugin);
  return gsap.to(target, { duration: .4, ease: 'power2.out',
    scrambleText: { text, chars: 'LSSHlssh', revealDelay: .2, speed: 1, tweenLength: false }, onComplete });
};

const installed = new WeakMap<HTMLElement, () => void>();
export function installHomeControls(root: HTMLElement, animate: Animator = animateLabel) {
  installed.get(root)?.();
  if (!root.classList.contains('has-journey')) return () => {};
  const doc = root.ownerDocument, view = doc.defaultView;
  if (!view) return () => {};
  const controller = new AbortController(), options = { signal: controller.signal };
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = view.matchMedia('(hover: hover) and (pointer: fine)');
  let suspended = false, touch = false, disposed = false, ready = false;
  const labels: FiniteScramble[] = [];
  const blocked = () => suspended || doc.hidden || touch || reduced.matches || !fine.matches ||
    root.dataset.homePaused === 'true' || root.dataset.homeControlsReduced === 'true' ||
    root.querySelector('[data-home-pause]')?.getAttribute('aria-pressed') === 'true';
  const publish = () => {
    if (!disposed && doc.documentElement.dataset.motionDiagnostics === 'true')
      root.dataset.homeControls = JSON.stringify({ bound: labels.length, running: labels.filter(label => label.running).length,
        static: blocked(), ready });
  };
  const cancel = () => labels.forEach(label => label.cancel());
  const disarm = () => {
    ready = false; root.dataset.homeControlsReady = 'false'; cancel();
  };
  const sync = () => {
    const value = String(blocked());
    if (root.dataset.homeControlsStatic !== value) root.dataset.homeControlsStatic = value;
    if (blocked()) disarm();
    publish();
  };
  const arm = (event: Event) => {
    if ((event as PointerEvent).pointerType !== 'mouse') return;
    const target = event.target as Element | null;
    if (!target?.closest?.(homeControlSelector)) return;
    if (touch) { touch = false; sync(); }
    if (!blocked() && !ready) { ready = true; root.dataset.homeControlsReady = 'true'; publish(); }
  };
  root.querySelectorAll<HTMLElement>('.home-header [data-scramble]').forEach(target => {
    const link = target.closest('a'), text = target.dataset.scramble;
    if (!link || !text) return;
    const label = new FiniteScramble(target, text, complete => animate(target, text, complete), publish);
    labels.push(label);
    link.addEventListener('pointerenter', event => {
      if ((event as PointerEvent).pointerType !== 'mouse') return;
      arm(event);
      if (!blocked() && doc.activeElement !== link) label.play();
    }, options);
    // Pointer leave deliberately lets this finite run finish; re-entry does not queue.
  });
  root.addEventListener('pointerover', arm, options);
  root.addEventListener('pointermove', arm, options);
  root.addEventListener('focusin', disarm, options);
  root.addEventListener('keydown', disarm, options);
  root.addEventListener('click', disarm, { ...options, capture: true });
  root.addEventListener('pointerdown', event => {
    if ((event as PointerEvent).pointerType !== 'mouse') { touch = true; sync(); }
  }, options);
  reduced.addEventListener('change', sync, options); fine.addEventListener('change', sync, options);
  doc.addEventListener('lssh:home-controls-state', sync, options);
  doc.addEventListener('visibilitychange', sync, options);
  view.addEventListener('pagehide', () => { suspended = true; sync(); }, options);
  view.addEventListener('pageshow', () => { suspended = false; sync(); }, options);
  const dispose = () => {
    if (disposed) return;
    disposed = true; controller.abort(); cancel();
    if (installed.get(root) === dispose) {
      installed.delete(root); delete root.dataset.homeControls; delete root.dataset.homeControlsStatic; delete root.dataset.homeControlsReady;
    }
  };
  doc.addEventListener('astro:before-swap', dispose, options);
  installed.set(root, dispose); root.dataset.homeControlsReady = 'false'; sync();
  return dispose;
}
