// F02: one reversible scroll state, no elapsed-time or random brick state.
export const wallColumns = 23, wallRows = 39;
export const squareAt = .42, squareShortSide = .64;
export const brickScale = .85;
export const wallBrick = {width:1.12*brickScale,height:.48*brickScale,depth:.16*brickScale,
  stepX:1.13*brickScale,stepY:.49*brickScale,bevel:.020*brickScale,seamDepth:.04*brickScale,seamOffset:.11*brickScale};
export const brickRiseDistance = .32*brickScale;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const smooth01 = (value: number) => { const t=clamp01(value); return t*t*(3-2*t); };

export function wallBuild(expand: number, wall: number) {
  if (expand < squareAt) return 0;
  return smooth01(((2*expand+wall)/3-.28)/(.92-.28));
}

/** C1, monotone interpolation through the square keyframe (no held interval). */
export function openingCoordinate(start: number, square: number, end: number, progress: number) {
  const t=clamp01(progress), a=(square-start)/squareAt, b=(end-square)/(1-squareAt);
  const tangent=a*b<=0?0:2*a*b/(a+b);
  const first=t<=squareAt, span=first?squareAt:1-squareAt;
  const q=first?t/span:(t-squareAt)/span;
  const from=first?start:square, to=first?square:end;
  const m0=first?0:tangent, m1=first?tangent:0;
  return (2*q*q*q-3*q*q+1)*from+(q*q*q-2*q*q+q)*span*m0+
    (-2*q*q*q+3*q*q)*to+(q*q*q-q*q)*span*m1;
}

export function brickLanding(row: number, column: number) {
  return { x:(column-(wallColumns-1)/2)*wallBrick.stepX+(row%2)*wallBrick.stepX/2, y:(row-(wallRows-1)/2)*wallBrick.stepY };
}

// A stable per-ID score, evaluated from progress rather than a random queue.
function brickNoise(row: number,column: number,salt: number) {
  let value=Math.imul(row+1,19349663)^Math.imul(column+1,73856093)^salt;
  value=Math.imul(value^(value>>>16),0x45d9f3b);
  value=Math.imul(value^(value>>>16),0x45d9f3b);
  return ((value^(value>>>16))>>>0)/4294967295;
}

function laneScore(column:number,min:number,max:number) {
  const x=(column-min)/Math.max(1,max-min);
  return (x-.36)*(x-.36)+.022*brickNoise(0,column,7919);
}

/** Only viewport-intersecting rows/columns participate; offscreen final bricks are harmless. */
export function assemblyLayout(halfWidth: number, halfHeight: number) {
  const minRow=Math.max(0,Math.ceil((wallRows-1)/2+(-halfHeight-wallBrick.height/2)/wallBrick.stepY));
  const maxRow=Math.min(wallRows-1,Math.floor((wallRows-1)/2+(halfHeight+wallBrick.height/2)/wallBrick.stepY));
  const minColumn=Math.max(0,Math.ceil((wallColumns-1)/2+(-halfWidth-wallBrick.stepX)/wallBrick.stepX));
  const maxColumn=Math.min(wallColumns-1,Math.floor((wallColumns-1)/2+(halfWidth+wallBrick.width/2)/wallBrick.stepX));
  let phaseMin=1,phaseMax=0;
  for(let column=minColumn;column<=maxColumn;column++) {
    const score=laneScore(column,minColumn,maxColumn);phaseMin=Math.min(phaseMin,score);phaseMax=Math.max(phaseMax,score);
  }
  return {minRow,maxRow,minColumn,maxColumn,rows:maxRow-minRow+1,halfWidth,halfHeight,phaseMin,phaseMax};
}

export function brickTiming(row: number,column: number,layout: ReturnType<typeof assemblyLayout>) {
  const lane=(laneScore(column,layout.minColumn,layout.maxColumn)-layout.phaseMin)/Math.max(1e-9,layout.phaseMax-layout.phaseMin)*2.2;
  const offset=brickNoise(row,column,104729)*.18;
  const duration=.48+brickNoise(row,column,15485863)*.22;
  const span=layout.rows-1+2.2+.18+.70;
  return {start:((row-layout.minRow)+lane+offset)/span,duration:duration/span};
}

export function brickState(build: number, row: number, column: number, layout: ReturnType<typeof assemblyLayout>) {
  const landing=brickLanding(row,column);
  const participating=row>=layout.minRow&&row<=layout.maxRow&&column>=layout.minColumn&&column<=layout.maxColumn;
  if (!participating) return {...landing, visible:build>=1, progress:build>=1?1:0,tiltX:0,tiltY:0,z:0,reveal:build>=1?1:0};
  const timing=brickTiming(row,column,layout);
  const p=clamp01((build-timing.start)/timing.duration);
  const rise=p*p*p*(p*(p*6-15)+10);
  const approach=1-smooth01(p),side=brickNoise(row,column,32452843)*2-1;
  // Build from the existing foundation: each brick rises locally, never crosses the empty opening.
  return {x:p===1?landing.x:landing.x+side*.08*brickScale*Math.sin(Math.PI*p),y:p===1?landing.y:landing.y-brickRiseDistance*(1-rise),
    visible:p>0,progress:p,tiltX:.14*approach,tiltY:p===1?0:side*.08*approach,z:.18*brickScale*approach,reveal:smooth01((p-.20)/.70)};
}

// Uniform pixel scale, anchored to the opening floor; never squash brick rows.
export function wallView(expand: number, bottom: number) {
  const p=smooth01((expand-squareAt)/(1-squareAt));
  return {scale:squareShortSide+(1-squareShortSide)*p,bottom:Math.max(0,bottom)*(1-smooth01((expand-.94)/.06))};
}

export function wallReadingReady(expand: number, wall: number, covered: boolean) {
  return covered && expand>=.999 && wallBuild(expand,wall)>=.999999;
}
