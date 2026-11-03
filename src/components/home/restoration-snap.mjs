// Restoring a reading position is not a request to snap to the nearest card.
// GSAP passes an inertia-adjusted value; while held use the actual trigger
// progress so its delayed snap cannot move the restored scroll position.
export function createRestorationSnap(snap) {
  let held=true;
  return {
    hold(){held=true;},
    release(){held=false;},
    snapTo(value,trigger){return held?trigger.progress:snap(value);},
  };
}
