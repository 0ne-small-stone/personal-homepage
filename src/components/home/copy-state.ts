const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

// Copy follows the same rendered card coordinate as the camera/background.
// A narrow empty interval around each midpoint prevents two titles sharing
// the reading position, even when the visitor stops or reverses mid-transition.
export function workCopyState(renderedIndex: number, item: number, preparing = false) {
  const distance = renderedIndex - (item + 1);
  const fade = smooth((Math.abs(distance) - .22) / .22);
  const opacity = preparing ? 0 : 1 - fade;
  return {
    opacity,
    visible: opacity > 0,
    interactive: opacity === 1,
    y: opacity > 0 ? -Math.sign(distance) * fade * 8 : 0,
  };
}
