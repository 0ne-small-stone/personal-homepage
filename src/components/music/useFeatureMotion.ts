import {useEffect, type RefObject} from 'react';
import {featureMotionGeometry} from './feature-motion-geometry';

type MotionKind = 'daily' | 'heart' | 'fm';

function rotation(transform: string) {
  if (transform === 'none') return 0;
  const matrix = new DOMMatrixReadOnly(transform);
  return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
}

function centeredTransform(kind: MotionKind, angle: number) {
  const {offsets} = featureMotionGeometry[kind];
  const phase = ((angle % 360 + 360) % 360) / 5;
  const index = Math.floor(phase), mix = phase - index;
  const start = offsets[index]!, end = offsets[index + 1]!;
  const x = start[0] + (end[0] - start[0]) * mix;
  const y = start[1] + (end[1] - start[1]) * mix;
  return `translate(${x}%, ${y}%) rotate(${angle}deg)`;
}

function centeredFrames(kind: MotionKind, from: number, to: number): Keyframe[] {
  const direction = Math.sign(to - from);
  const angles = [from];
  let next = (direction > 0 ? Math.floor(from / 5) + 1 : Math.ceil(from / 5) - 1) * 5;
  for (; direction * (to - next) > 0; next += direction * 5) angles.push(next);
  angles.push(to);
  return angles.map(angle => ({transform: centeredTransform(kind, angle), offset: (angle - from) / (to - from)}));
}

export default function useFeatureMotion(
  buttonRef: RefObject<HTMLButtonElement | null>,
  imageRef: RefObject<HTMLImageElement | null>,
  kind: MotionKind,
) {
  useEffect(() => {
    const button = buttonRef.current, image = imageRef.current;
    if (!button || !image || typeof image.animate !== 'function') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const direction = kind === 'fm' ? -1 : 1;
    let animation: Animation | null = null;
    let active = false, inView = false, disposed = false;

    function hold() {
      const current = getComputedStyle(image!).transform;
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
        animation = null;
      }
      // Keep optical offsets proportional when a frozen card changes size offscreen.
      image!.style.transform = centeredTransform(kind, rotation(current));
      return current;
    }

    function stop(soft: boolean) {
      const from = hold();
      active = false;
      if (!soft) {
        image!.style.willChange = '';
        return;
      }
      const angle = rotation(from);
      const target = centeredTransform(kind, angle + direction * 7);
      const settling = image!.animate(centeredFrames(kind, angle, angle + direction * 7), {
        duration: 650,
        easing: 'cubic-bezier(.2,.7,.15,1)', fill: 'forwards',
      });
      settling.id = `ne-entry-${kind}-settle`;
      animation = settling;
      settling.onfinish = () => {
        if (disposed || animation !== settling) return;
        image!.style.transform = target;
        image!.style.willChange = '';
        settling.onfinish = null;
        settling.cancel();
        animation = null;
      };
    }

    function start() {
      if (active) return;
      const angle = rotation(hold());
      image!.style.willChange = 'transform';
      // A small premeasured optical correction keeps asymmetric outlines centered.
      animation = image!.animate(centeredFrames(kind, angle, angle + direction * 360), {
        duration: kind === 'daily' ? 18000 : kind === 'heart' ? 22000 : 26000,
        iterations: Infinity, easing: 'linear',
      });
      animation.id = `ne-entry-${kind}-loop`;
      active = true;
    }

    function sync() {
      if (disposed) return;
      if (reduced.matches) {
        stop(false);
        image!.style.transform = 'none';
        return;
      }
      const allowed = inView && document.visibilityState === 'visible';
      const engaged = button!.matches(':focus-visible') || (finePointer.matches && button!.matches(':hover'));
      if (allowed && engaged && image!.naturalWidth > 0) start();
      else if (active || (!allowed && animation)) stop(allowed);
    }

    const observer = new IntersectionObserver(entries => {
      inView = entries[0]?.isIntersecting ?? false;
      sync();
    });
    const onError = () => stop(false);
    observer.observe(button);
    for (const event of ['pointerenter', 'pointerleave', 'focus', 'blur']) button.addEventListener(event, sync);
    image.addEventListener('load', sync);
    image.addEventListener('error', onError);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    finePointer.addEventListener('change', sync);

    return () => {
      disposed = true;
      observer.disconnect();
      for (const event of ['pointerenter', 'pointerleave', 'focus', 'blur']) button.removeEventListener(event, sync);
      image.removeEventListener('load', sync);
      image.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      finePointer.removeEventListener('change', sync);
      if (animation) { animation.onfinish = null; animation.cancel(); }
      image.style.transform = '';
      image.style.willChange = '';
    };
  }, [buttonRef, imageRef, kind]);
}
