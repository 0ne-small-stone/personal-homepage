/*! Scroll controller adapted from Edoardo Lunardi / Codrops Infinite Canvas.
 * Copyright (c) 2009 - 2025 Codrops. MIT; see INFINITE-CANVAS-LICENSE.txt.
 * Source: src/infinite-canvas/scene.tsx, SceneController and constants.ts.
 * Adaptation: delta-time steps, on-demand rendering, reversible entrance.
 */
export const createFlight = () => ({scroll:0,target:0,velocity:0});
export const stopFlight = flight => { flight.scroll=flight.target=flight.velocity=0; };
export const addWheel = (flight,delta) => { flight.scroll += delta*.006; };
export function advanceFlight(flight,dt) {
  let remaining = dt*60;
  let travel = 0;
  while(remaining>0) {
    const step=Math.min(1,remaining);
    flight.target += flight.scroll*step;
    flight.scroll *= Math.pow(.8,step);
    flight.target = Math.max(-3.2,Math.min(3.2,flight.target));
    flight.velocity += (flight.target-flight.velocity)*(1-Math.pow(.84,step));
    travel += flight.velocity*step;
    flight.target *= Math.pow(.9,step);
    remaining -= step;
  }
  if(!flightMoving(flight)) stopFlight(flight);
  return travel;
}
export const flightMoving = flight => Math.abs(flight.scroll)>.0001 || Math.abs(flight.target)>.0001 || Math.abs(flight.velocity)>.0001;
