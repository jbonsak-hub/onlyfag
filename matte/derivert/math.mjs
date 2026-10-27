/** The reference curve and its exact derivative. */
export const f = (x) => x * x;
export const derivative = (a) => 2 * a;

/** Stable even when two nearly equal function values would cancel. */
export function secantSlope(a, h) {
  return h === 0 ? null : 2 * a + h;
}

/**
 * Clip y = slope*x + intercept to a rectangular graph window.
 * Returns [[x1, y1], [x2, y2]], or null when the line is outside it.
 */
export function lineSegment(slope, intercept, bounds) {
  if (!bounds) return null;
  const { xmin, xmax, ymin, ymax } = bounds;
  if (![slope, intercept, xmin, xmax, ymin, ymax].every(Number.isFinite)) return null;
  if (xmin > xmax || ymin > ymax) return null;

  if (slope === 0) {
    return intercept < ymin || intercept > ymax
      ? null
      : [[xmin, intercept], [xmax, intercept]];
  }

  const firstYIntersection = (ymin - intercept) / slope;
  const secondYIntersection = (ymax - intercept) / slope;
  const left = Math.max(xmin, Math.min(firstYIntersection, secondYIntersection));
  const right = Math.min(xmax, Math.max(firstYIntersection, secondYIntersection));
  if (left > right) return null;

  // Clamp tiny floating-point overshoots at the boundary.
  const boundedY = (x) => Math.max(ymin, Math.min(ymax, slope * x + intercept));
  return [[left, boundedY(left)], [right, boundedY(right)]];
}

/** Compact Norwegian numbers, including a typographic minus and no −0. */
export function fmt(n, digits = 3) {
  if (!Number.isFinite(n)) return '—';
  const precision = Number.isFinite(digits)
    ? Math.max(0, Math.min(20, Math.trunc(digits)))
    : 3;
  const rounded = Number(n.toFixed(precision));
  return new Intl.NumberFormat('nb-NO', {
    maximumFractionDigits: precision,
    useGrouping: false,
  }).format(rounded === 0 ? 0 : rounded).replace(/-/g, '−');
}
