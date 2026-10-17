// Deterministic, bounded setup work; photo identity never depends on a frame.
function shuffle(values) {
  let seed = 0x51f15e;
  for (let i = values.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

export function distributeDomePhotos(coords, segments, photoCount) {
  if (!photoCount) return [];
  const indices = shuffle(coords.map((_, i) => i % photoCount));
  if (photoCount === 1) return indices;
  const unit = Math.PI / segments;
  // Match computeItemBaseRotation, including the stagger and polar rings.
  const points = coords.map(c => {
    const yaw = (c.x + (c.sizeX - 1) / 2) * unit;
    const pitch = (c.y - (c.sizeY - 1) / 2) * unit;
    return [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  });
  const groups = Array.from({ length: photoCount }, () => []);
  indices.forEach((photo, slot) => groups[photo].push(slot));
  const penalty = (i, j) => {
    const a = points[i], b = points[j];
    // Unit-sphere chord squared is 1 at 60 degrees. The seam is continuous.
    const distance = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    return Math.max(0, 1 - distance) ** 2;
  };
  // Swaps preserve the balanced bag exactly. Two fixed passes cap setup cost.
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < indices.length; i++) {
    const a = groups[indices[i]];
    let cost = 0;
    for (const k of a) if (k !== i) cost += penalty(i, k);
    if (cost === 0) continue;
    let best = 1e-10, target = -1;
    for (let j = 0; j < indices.length; j++) {
      if (indices[i] === indices[j]) continue;
      const b = groups[indices[j]];
      let gain = cost;
      for (const k of a) if (k !== i) gain -= penalty(j, k);
      for (const k of b) if (k !== j) gain += penalty(j, k) - penalty(i, k);
      if (gain > best) { best = gain; target = j; }
    }
    if (target < 0) continue;
    const b = groups[indices[target]];
    a[a.indexOf(i)] = target;
    b[b.indexOf(target)] = i;
    [indices[i], indices[target]] = [indices[target], indices[i]];
  }
  return indices;
}

export function createWallPhotoPicker(photoCount) {
  const order = shuffle(Array.from({ length: photoCount }, (_, i) => i));
  const stride = Math.max(1, Math.round(Math.sqrt(photoCount)));
  return (row, col) => order[((row * stride + col) % photoCount + photoCount) % photoCount];
}
