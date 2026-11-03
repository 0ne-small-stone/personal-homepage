// A continuous path between adjacent chapter poses. Retain the quiet .4 slope
// at each integer pose; distribute the former .6 jump over the whole interval.
// Both value and first derivative agree on either side of every boundary.
export function chapterPosition(progress, count) {
  const position = Math.max(0, Math.min(1, progress)) * (count + 1);
  const chapter = Math.floor(position), fraction = position - chapter;
  return chapter + .4 * fraction + .6 * fraction * fraction * (3 - 2 * fraction);
}
