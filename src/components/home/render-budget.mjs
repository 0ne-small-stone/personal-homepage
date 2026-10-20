function boundedSize(width, height, pixels) {
  const factor = Math.min(1, Math.sqrt(pixels / (width * height)));
  return [Math.max(1, Math.floor(width * factor)), Math.max(1, Math.floor(height * factor))];
}
/** Sampling offsets remain in the original CSS space, independent of storage size. */
export function glowRenderBudget(width, height, mobile, dpr = 1) {
  const near = [Math.max(32, Math.round(width / (mobile ? 1 : 4))), Math.max(32, Math.round(height / (mobile ? 1 : 4)))];
  const far = [Math.max(32, Math.round(width / (mobile ? 3 : 12))), Math.max(32, Math.round(height / (mobile ? 3 : 12)))];
  const quality = Math.min(1, Math.max(.5, dpr / (mobile ? 1 : 1.5)));
  return { near: boundedSize(...near, 131072 * quality * quality), far: boundedSize(...far, 32768 * quality * quality), nearStep: near.map(value => 1 / value), farStep: far.map(value => 1 / value) };
}
