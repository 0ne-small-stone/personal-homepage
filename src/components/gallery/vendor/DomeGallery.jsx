'use client';
/*! Dome Gallery — Copyright (c) 2026 David Haz. MIT + Commons Clause.
    Full notice: REACT-BITS-LICENSE.md. Used as part of the LSSH prototype. */
// Adapted for the LSSH local prototype from David Haz / React Bits.
// Pinned upstream and the complete MIT + Commons Clause notice live beside this file.

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { probe } from '../performance-probe.js';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

const DEFAULT_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Abstract art'
  },
  {
    src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Modern sculpture'
  },
  {
    src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Digital artwork'
  },
  {
    src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Contemporary art'
  },
  {
    src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Geometric pattern'
  },
  {
    src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Textured surface'
  },
  { src: 'https://pbs.twimg.com/media/Gyla7NnXMAAXSo_?format=jpg&name=large', alt: 'Social media image' }
];

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const normalizeAngle = d => ((d % 360) + 360) % 360;
const wrapAngleSigned = deg => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el, name, fallback) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool, seg, fullCoverage) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  // Preserve the upstream's entire first-view grid. Extra rings sit outside its
  // initial viewport and only become visible when the user turns vertically.
  if (fullCoverage) {
    const unit=360/seg/2;
    for(const sign of [-1,1]) {
      for(let latitude=34;latitude<84;latitude+=360/seg) {
        const count=Math.max(4,Math.round(seg*Math.cos(latitude*Math.PI/180)));
        for(let i=0;i<count;i++) coords.push({x:(i*360/count+(sign>0?180/count:0))/unit-.5,y:sign*latitude/unit+.5,sizeX:2,sizeY:2});
      }
      coords.push({x:0,y:sign*90/unit+.5,sizeX:2,sizeY:2});
    }
  }

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }));
  }
  if (pool.length > totalSlots) {
    console.warn(
      `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`
    );
  }

  const normalizedImages = pool.map(image => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: image.src || '', alt: image.alt || '', full:image.full || image.src || '', preview:image.preview || image.src || '' };
  });

  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
    full:usedImages[i].full,
    preview:usedImages[i].preview
  }));
}

function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery({
  images = DEFAULT_IMAGES,
  fit = 0.5,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = '#120F17',
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth = '400px',
  openedImageHeight = '400px',
  imageBorderRadius = '30px',
  openedImageBorderRadius = '30px',
  grayscale = true,
  fullCoverage = true,
  responsive = false,
  reduceMotion = false,
  onReady,
  onMotion,
  onSelect,
  onOpenImage
}) {
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const sphereRef = useRef(null);
  const frameRef = useRef(null);
  const viewerRef = useRef(null);
  const scrimRef = useRef(null);
  const focusedElRef = useRef(null);
  const originalTilePositionRef = useRef(null);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);
  const frozenRef=useRef(false);
  const reducedRef=useRef(reduceMotion);
  const resizeRef=useRef(null);
  const closeRef=useRef(null);
  const closedWaiters=useRef([]);
  const notifyClosed=()=>closedWaiters.current.splice(0).forEach(resolve=>resolve());

  const scrollLockedRef = useRef(false);
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return;
    scrollLockedRef.current = true;
    document.body.classList.add('dg-scroll-lock');
  }, []);
  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return;
    if (rootRef.current?.getAttribute('data-enlarging') === 'true') return;
    scrollLockedRef.current = false;
    document.body.classList.remove('dg-scroll-lock');
  }, []);

  const items = useMemo(() => buildItems(images, segments,fullCoverage), [images, segments,fullCoverage]);
  const cullingRef=useRef([]);
  const setMoving=value=>{if(rootRef.current)rootRef.current.dataset.moving=String(value);};
  const cullCards=(xDeg,yDeg,reveal=false)=>{
    const x=xDeg*Math.PI/180,y=yDeg*Math.PI/180,sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y);let visible=0;
    for(const card of cullingRef.current){
      const show=reveal||sx*card.ny+cx*(-sy*card.nx+cy*card.nz)>.15;
      if(show)visible++;
      if(card.visible!==show){card.visible=show;card.node.style.visibility=show?'':'hidden';card.node.setAttribute('aria-hidden',String(!show));card.button.tabIndex=show?0:-1;}
    }
    if(rootRef.current)rootRef.current.dataset.visibleCards=String(visible);
  };
  useEffect(()=>{
    cullingRef.current=Array.from(sphereRef.current.querySelectorAll('.item')).map((node,i)=>{
      const it=items[i],x=Math.PI/segments*(it.y-(it.sizeY-1)/2),y=Math.PI/segments*(it.x+(it.sizeX-1)/2);
      return {node,button:node.querySelector('.item__image'),nx:Math.sin(y)*Math.cos(x),ny:-Math.sin(x),nz:Math.cos(y)*Math.cos(x),visible:true};
    });
    cullCards(rotationRef.current.x,rotationRef.current.y);
    return ()=>{cullingRef.current=[];};
  },[items,segments]);

  const applyTransform = (xDeg, yDeg) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
      rootRef.current.dataset.rotation=`${xDeg.toFixed(4)},${yDeg.toFixed(4)}`;
      cullCards(xDeg,yDeg,frozenRef.current);
      probe.measure('dome-motion',()=>onMotion?.());
    }
  };

  const lockedRadiusRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const updateLayout = entries => {
      if(frozenRef.current) return;
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width),
        h = Math.max(1, cr.height);
      const minDim = Math.min(w, h),
        maxDim = Math.max(w, h),
        aspect = w / h;
      const layoutStyle = responsive ? getComputedStyle(root) : null;
      const layoutFit = Number(layoutStyle?.getPropertyValue('--dome-fit').trim()) || fit;
      const layoutMinRadius = Number(layoutStyle?.getPropertyValue('--dome-min-radius').trim()) || minRadius;
      if(layoutStyle) root.dataset.breakpoint=layoutStyle.getPropertyValue('--dome-breakpoint').trim();
      let basis;
      switch (fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = basis * layoutFit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, layoutMinRadius, maxRadius);
      lockedRadiusRef.current = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`);
      root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
      applyTransform(rotationRef.current.x, rotationRef.current.y);

      const enlargedOverlay = viewerRef.current?.querySelector('.enlarge');
      if (enlargedOverlay && frameRef.current && mainRef.current) {
        const frameR = frameRef.current.getBoundingClientRect();
        const mainR = mainRef.current.getBoundingClientRect();

        const hasCustomSize = openedImageWidth && openedImageHeight;
        if (hasCustomSize) {
          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`;
          document.body.appendChild(tempDiv);
          const tempRect = tempDiv.getBoundingClientRect();
          document.body.removeChild(tempDiv);

          const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2;

          enlargedOverlay.style.left = `${centeredLeft}px`;
          enlargedOverlay.style.top = `${centeredTop}px`;
        } else {
          enlargedOverlay.style.left = `${frameR.left - mainR.left}px`;
          enlargedOverlay.style.top = `${frameR.top - mainR.top}px`;
          enlargedOverlay.style.width = `${frameR.width}px`;
          enlargedOverlay.style.height = `${frameR.height}px`;
        }
      }
    };
    resizeRef.current=()=>updateLayout([{contentRect:root.getBoundingClientRect()}]);
    const ro = new ResizeObserver(updateLayout);
    ro.observe(root);
    return () => ro.disconnect();
  }, [
    fit,
    fitBasis,
    responsive,
    minRadius,
    maxRadius,
    padFactor,
    overlayBlurColor,
    grayscale,
    imageBorderRadius,
    openedImageBorderRadius,
    openedImageWidth,
    openedImageHeight
  ]);

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
  }, []);

  const stopInertia = useCallback(() => {
    setMoving(false);
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx, vy) => {
      if(reducedRef.current){setMoving(false);return;}
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;
      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null;
          setMoving(false);
          return;
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null;
          setMoving(false);
          return;
        }
        const desiredX = rotationRef.current.x - vY / 200;
        const nextX = clamp(desiredX, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        if(nextX!==desiredX) vY=0;
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      setMoving(true);
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current || frozenRef.current) return;
        stopInertia();
        const evt = event;
        if(!Number.isFinite(evt.clientX)||!Number.isFinite(evt.clientY))return;
        draggingRef.current = true;
        setMoving(true);
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: evt.clientX, y: evt.clientY };
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        if (focusedElRef.current || frozenRef.current || !draggingRef.current || !startPosRef.current) return;
        const evt = event;
        if(!Number.isFinite(evt.clientX)||!Number.isFinite(evt.clientY))return;
        const dxTotal = evt.clientX - startPosRef.current.x;
        const dyTotal = evt.clientY - startPosRef.current.y;
        if (!movedRef.current) {
          const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
          if (dist2 > 16) movedRef.current = true;
        }
        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg
        );
        const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);
        if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }
        if (last) {
          draggingRef.current = false;
          let [vMagX, vMagY] = velocity;
          const [dirX, dirY] = direction;
          let vx = vMagX * dirX;
          let vy = vMagY * dirY;
          if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement;
            vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
            vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
          }
          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);else setMoving(false);
          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      }
    },
    { target: mainRef, eventOptions: { passive: true },drag:{pointer:{keys:false}} }
  );

  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current;
      if (!el) return;
      const parent = el.parentElement;
      const overlay = viewerRef.current?.querySelector('.enlarge');
      if (!overlay) return;
      const refDiv = parent.querySelector('.item__image--reference');
      if(reducedRef.current){
        overlay.remove();refDiv?.remove();
        parent.style.setProperty('--rot-y-delta','0deg');parent.style.setProperty('--rot-x-delta','0deg');
        el.style.visibility='';el.style.opacity='';el.style.zIndex=0;
        focusedElRef.current=null;openingRef.current=false;originalTilePositionRef.current=null;
        rootRef.current?.removeAttribute('data-enlarging');unlockScroll();notifyClosed();return;
      }
      const originalPos = originalTilePositionRef.current;
      if (!originalPos) {
        overlay.remove();
        if (refDiv) refDiv.remove();
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        el.style.visibility = '';
        el.style.zIndex = 0;
        focusedElRef.current = null;
        rootRef.current?.removeAttribute('data-enlarging');
        openingRef.current = false;
        unlockScroll();
        notifyClosed();
        return;
      }
      const currentRect = overlay.getBoundingClientRect();
      const rootRect = rootRef.current.getBoundingClientRect();
      const originalPosRelativeToRoot = {
        left: originalPos.left - rootRect.left,
        top: originalPos.top - rootRect.top,
        width: originalPos.width,
        height: originalPos.height
      };
      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height
      };
      const animatingOverlay = document.createElement('div');
      animatingOverlay.className = 'enlarge-closing';
      animatingOverlay.style.cssText = `position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;
      const originalImg = overlay.querySelector('img');
      if (originalImg) {
        const img = originalImg.cloneNode();
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        animatingOverlay.appendChild(img);
      }
      overlay.remove();
      rootRef.current.appendChild(animatingOverlay);
      void animatingOverlay.getBoundingClientRect();
      requestAnimationFrame(() => {
        animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
        animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
        animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
        animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
        animatingOverlay.style.opacity = '0';
      });
      const cleanup = () => {
        animatingOverlay.remove();
        originalTilePositionRef.current = null;
        if (refDiv) refDiv.remove();
        parent.style.transition = 'none';
        el.style.transition = 'none';
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        requestAnimationFrame(() => {
          el.style.visibility = '';
          el.style.opacity = '0';
          el.style.zIndex = 0;
          focusedElRef.current = null;
          rootRef.current?.removeAttribute('data-enlarging');
          requestAnimationFrame(() => {
            parent.style.transition = '';
            el.style.transition = 'opacity 300ms ease-out';
            requestAnimationFrame(() => {
              el.style.opacity = '1';
              setTimeout(() => {
                el.style.transition = '';
                el.style.opacity = '';
                openingRef.current = false;
                if (!draggingRef.current && rootRef.current?.getAttribute('data-enlarging') !== 'true')
                  document.body.classList.remove('dg-scroll-lock');
                notifyClosed();
              }, 300);
            });
          });
        });
      };
      animatingOverlay.addEventListener('transitionend', cleanup, { once: true });
    };
    scrim.addEventListener('click', close);
    closeRef.current=close;
    const onKey = e => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      scrim.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [enlargeTransitionMs, unlockScroll]);

  const openItemFromElement = useCallback(
    el => {
      if (openingRef.current || frozenRef.current) return;
      if(onOpenImage){
        stopInertia();const parent=el.parentElement;
        onSelect?.(Number(parent.dataset.pool),parent.dataset.src);
        onOpenImage(Number(parent.dataset.pool),parent.dataset.src);return;
      }
      openingRef.current = true;
      openStartedAtRef.current = performance.now();
      lockScroll();
      const parent = el.parentElement;
      stopInertia();
      onSelect?.(Number(parent.dataset.pool),parent.dataset.src);
      focusedElRef.current = el;
      el.setAttribute('data-focused', 'true');
      const offsetX = getDataNumber(parent, 'offsetX', 0);
      const offsetY = getDataNumber(parent, 'offsetY', 0);
      const sizeX = getDataNumber(parent, 'sizeX', 2);
      const sizeY = getDataNumber(parent, 'sizeY', 2);
      const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
      const parentY = normalizeAngle(parentRot.rotateY);
      const globalY = normalizeAngle(rotationRef.current.y);
      let rotY = -(parentY + globalY) % 360;
      if (rotY < -180) rotY += 360;
      const rotX = -parentRot.rotateX - rotationRef.current.x;
      parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
      parent.style.setProperty('--rot-x-delta', `${rotX}deg`);
      const refDiv = document.createElement('div');
      refDiv.className = 'item__image item__image--reference';
      refDiv.style.opacity = '0';
      refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
      parent.appendChild(refDiv);

      void refDiv.offsetHeight;

      const tileR = refDiv.getBoundingClientRect();
      const mainR = mainRef.current?.getBoundingClientRect();
      const frameR = frameRef.current?.getBoundingClientRect();

      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        openingRef.current = false;
        focusedElRef.current = null;
        parent.removeChild(refDiv);
        unlockScroll();
        return;
      }

      originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
      el.style.visibility = 'hidden';
      el.style.zIndex = 0;
      const overlay = document.createElement('div');
      overlay.className = 'enlarge';
      overlay.style.position = 'absolute';
      overlay.style.left = frameR.left - mainR.left + 'px';
      overlay.style.top = frameR.top - mainR.top + 'px';
      overlay.style.width = frameR.width + 'px';
      overlay.style.height = frameR.height + 'px';
      overlay.style.opacity = '0';
      overlay.style.zIndex = '30';
      overlay.style.willChange = 'transform, opacity';
      overlay.style.transformOrigin = 'top left';
      overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;
      const rawSrc = parent.dataset.full || parent.dataset.src || el.querySelector('img')?.src || '';
      const img = document.createElement('img');
      img.src = rawSrc;
      overlay.appendChild(img);
      viewerRef.current.appendChild(overlay);
      const tx0 = tileR.left - frameR.left;
      const ty0 = tileR.top - frameR.top;
      const sx0 = tileR.width / frameR.width;
      const sy0 = tileR.height / frameR.height;

      const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
      const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

      overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;

      setTimeout(() => {
        if (!overlay.parentElement) return;
        overlay.style.opacity = '1';
        overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
        rootRef.current?.setAttribute('data-enlarging', 'true');
      }, 16);

      const wantsResize = openedImageWidth || openedImageHeight;
      if(wantsResize&&reducedRef.current){
        const measure=document.createElement('div');
        measure.style.cssText=`position:absolute;width:${openedImageWidth||frameR.width+'px'};height:${openedImageHeight||frameR.height+'px'};visibility:hidden;`;
        document.body.appendChild(measure);const rect=measure.getBoundingClientRect();measure.remove();
        overlay.style.width=rect.width+'px';overlay.style.height=rect.height+'px';
        overlay.style.left=(mainR.width-rect.width)/2+'px';overlay.style.top=(mainR.height-rect.height)/2+'px';
      }
      if (wantsResize&&!reducedRef.current) {
        const onFirstEnd = ev => {
          if (ev.propertyName !== 'transform') return;
          overlay.removeEventListener('transitionend', onFirstEnd);
          const prevTransition = overlay.style.transition;
          overlay.style.transition = 'none';
          const tempWidth = openedImageWidth || `${frameR.width}px`;
          const tempHeight = openedImageHeight || `${frameR.height}px`;
          overlay.style.width = tempWidth;
          overlay.style.height = tempHeight;
          const newRect = overlay.getBoundingClientRect();
          overlay.style.width = frameR.width + 'px';
          overlay.style.height = frameR.height + 'px';
          void overlay.offsetWidth;
          overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
          const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
          requestAnimationFrame(() => {
            overlay.style.left = `${centeredLeft}px`;
            overlay.style.top = `${centeredTop}px`;
            overlay.style.width = tempWidth;
            overlay.style.height = tempHeight;
          });
          const cleanupSecond = () => {
            overlay.removeEventListener('transitionend', cleanupSecond);
            overlay.style.transition = prevTransition;
          };
          overlay.addEventListener('transitionend', cleanupSecond, { once: true });
        };
        overlay.addEventListener('transitionend', onFirstEnd);
      }
    },
    [enlargeTransitionMs, lockScroll, openedImageHeight, openedImageWidth, segments, unlockScroll, onOpenImage]
  );

  const onTileClick = useCallback(
    e => {
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  const onTilePointerUp = useCallback(
    e => {
      if (e.pointerType !== 'touch') return;
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    [openItemFromElement]
  );

  useEffect(() => {
    return () => {
      document.body.classList.remove('dg-scroll-lock');
    };
  }, []);

  useEffect(()=>{
    let live=true;
    const root=rootRef.current;
    const stageNode=root.querySelector('.stage'),fadeNodes=Array.from(root.querySelectorAll('.overlay,.edge-fade'));let sideNode;
    const api={
      get rotation(){return {...rotationRef.current};},
      get isOpen(){return !!focusedElRef.current||openingRef.current;},
      get radius(){return lockedRadiusRef.current ?? minRadius;},
      snapshot(pool){
        const radius=this.radius;
        const global=new DOMMatrix(getComputedStyle(sphereRef.current).transform);
        const nodes=Array.from(sphereRef.current.querySelectorAll('.item'));
        return {radius,rect:root.getBoundingClientRect(),items:nodes.filter(node=>pool===undefined||Number(node.dataset.pool)===pool).map(node=>{
          const matrix=global.multiply(new DOMMatrix(getComputedStyle(node).transform));
          return {matrix:Array.from(matrix.toFloat64Array()),src:node.dataset.src,index:Number(node.dataset.pool)};
        })};
      },
      find(src){
        const rect=root.getBoundingClientRect();
        const global=new DOMMatrix(getComputedStyle(sphereRef.current).transform);
        const nodes=Array.from(sphereRef.current.querySelectorAll('.item')).filter(node=>!src||node.dataset.src===src);
        // Each card is measured once, only when an entry/explicit selection needs it.
        let best=nodes[0],bestScore=Infinity;
        for(const node of nodes){
          const r=node.getBoundingClientRect();
          const score=Math.hypot(r.x+r.width/2-rect.x-rect.width/2,r.y+r.height/2-rect.y-rect.height/2)+(global.multiply(new DOMMatrix(getComputedStyle(node).transform)).m33<0?10000:0);
          if(score<bestScore){best=node;bestScore=score;}
        }
        return Number(best?.dataset.pool??0);
      },
      freeze({reveal=true}={}){stopInertia();frozenRef.current=true;if(reveal){cullCards(rotationRef.current.x,rotationRef.current.y,true);mainRef.current.style.background='transparent';}},
      detail(pool,enabled){const node=sphereRef.current.querySelector(`.item[data-pool="${pool}"]`);if(node)node.querySelector('img').src=enabled?node.dataset.full:(node.dataset.preview||node.dataset.src);},
      camera({position,projection,p,insets,height}){
        const scale=this.radius/6.2;
        sphereRef.current.style.transform=`translate3d(${-position.x*scale}px,${position.y*scale}px,${projection-position.z*scale}px) rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`;
        stageNode.style.perspective=`${projection}px`;
        if(insets){
          const [top,side,bottom]=insets;
          stageNode.style.transform=`translateY(${(top-bottom)/2}px)`;
          for(const node of fadeNodes){
            // Paint beyond the clip: matching fractional edges left a bright raster row.
            const bleed=node.classList.contains('overlay--clip-guard')?2:0;
            node.style.left=node.style.right=`${side-bleed}px`;
            if(node.classList.contains('edge-fade')){
              node.style.height=`${Math.min(120,(height-top-bottom)*.3)}px`;
              if(node.classList.contains('edge-fade--top'))node.style.top=`${top}px`;else node.style.bottom=`${bottom}px`;
            }else{node.style.top=`${top-bleed}px`;node.style.bottom=`${bottom-bleed}px`;}
          }
          sideNode??=root.querySelector('.side-photo-wall');
          if(sideNode)sideNode.style.inset=`${top}px ${side}px ${bottom}px`;
        }
        const opacity=String(1-Math.min(1,p*3));
        fadeNodes.forEach(el=>{const alpha=el.classList.contains('overlay--clip-guard')?'1':opacity;if(el.style.opacity!==alpha)el.style.opacity=alpha;});
      },
      resume({layout=true}={}){
        frozenRef.current=false;
        if(!layout)return;
        mainRef.current.style.background='';
        stageNode.style.perspective='';
        stageNode.style.transform='';
        for(const node of fadeNodes)for(const key of ['top','right','bottom','left','height'])node.style[key]='';
        if(sideNode)sideNode.style.inset='';
        fadeNodes.forEach(el=>{el.style.opacity='';});
        resizeRef.current?.();
        applyTransform(rotationRef.current.x,rotationRef.current.y);
      },
      openIndex(index){const element=sphereRef.current.querySelector(`.item[data-pool="${index}"] .item__image`);if(element&&!frozenRef.current) openItemFromElement(element);},
      close(){return new Promise(resolve=>{
        if(!focusedElRef.current){if(openingRef.current)closedWaiters.current.push(resolve);else resolve();return;}
        closedWaiters.current.push(resolve);
        const delay=Math.max(0,251-(performance.now()-openStartedAtRef.current));
        setTimeout(()=>closeRef.current?.(),delay);
      });},
      rotate(dx,dy){
        if(frozenRef.current||focusedElRef.current) return;
        stopInertia();
        rotationRef.current.x=clamp(rotationRef.current.x+dy,-maxVerticalRotationDeg,maxVerticalRotationDeg);
        rotationRef.current.y=wrapAngleSigned(rotationRef.current.y+dx);
        applyTransform(rotationRef.current.x,rotationRef.current.y);
      },
      pause:stopInertia,
      setReduced(value){reducedRef.current=value;if(value)stopInertia();},
      dispose(){stopInertia();notifyClosed();}
    };
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(live) onReady?.(api);}));
    return ()=>{live=false;stopInertia();notifyClosed();};
  },[]);

  const onKey=e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)&&!focusedElRef.current&&!frozenRef.current){
      e.preventDefault();stopInertia();
      rotationRef.current.x=clamp(rotationRef.current.x+(e.key==='ArrowUp'?9.167:e.key==='ArrowDown'?-9.167:0),-maxVerticalRotationDeg,maxVerticalRotationDeg);
      rotationRef.current.y=wrapAngleSigned(rotationRef.current.y+(e.key==='ArrowLeft'?-9.167:e.key==='ArrowRight'?9.167:0));
      applyTransform(rotationRef.current.x,rotationRef.current.y);
    }
  };

  return (
    <div
      ref={rootRef}
      className="sphere-root"
      data-pitch-limit={maxVerticalRotationDeg}
      style={{
        ['--segments-x']: segments,
        ['--segments-y']: segments,
        ['--overlay-blur-color']: overlayBlurColor,
        ['--tile-radius']: imageBorderRadius,
        ['--enlarge-radius']: openedImageBorderRadius,
        ['--image-filter']: grayscale ? 'grayscale(1)' : 'none'
      }}
    >
      <main ref={mainRef} className="sphere-main" tabIndex={0} onKeyDown={onKey} aria-label="曲面照片墙，上下左右拖动或方向键旋转">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div
                key={`${it.x},${it.y},${i}`}
                className="item"
                data-src={it.src}
                data-full={it.full}
                data-preview={it.preview}
                data-pool={i}
                data-offset-x={it.x}
                data-offset-y={it.y}
                data-size-x={it.sizeX}
                data-size-y={it.sizeY}
                style={{
                  ['--offset-x']: it.x,
                  ['--offset-y']: it.y,
                  ['--item-size-x']: it.sizeX,
                  ['--item-size-y']: it.sizeY
                }}
              >
                <div
                  className="item__image"
                  role="button"
                  tabIndex={0}
                  aria-label={it.alt || 'Open image'}
                  onClick={onTileClick}
                  onPointerUp={onTilePointerUp}
                  onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onTileClick(e);}}}
                >
                  <img src={it.preview||it.src} draggable={false} alt={it.alt} decoding="async" onError={event=>{const image=event.currentTarget;if(!image.dataset.retried){image.dataset.retried='true';image.src=it.src;}else image.style.visibility='hidden';}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />
        <div className="overlay overlay--clip-guard" aria-hidden="true" hidden />

        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  );
}
