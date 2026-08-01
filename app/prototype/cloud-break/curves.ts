import { EASE, TUNE, type Track } from "./config";

/** GATE 1 PROTOTYPE - THROWAWAY. Allocation-free track sampling. */

export function applyEase(kind: number, t: number) {
  switch (kind) {
    case EASE.SMOOTH:
      return t * t * (3 - 2 * t);
    // Read live from TUNE so the panel can retune climb-initiate by eye. Both
    // TRACK_Y and TRACK_PITCH use this on the same band, which is what makes
    // the departure and the rotation one motion instead of two.
    case EASE.SLOW_IN:
      return Math.pow(t, TUNE.initiateEase);
    case EASE.SLOW_OUT: {
      const i = 1 - t;
      return 1 - i * i * i;
    }
    default:
      return t;
  }
}

export function sampleTrack(tr: Track, x: number) {
  const a = tr.a;
  const last = a.length - 1;
  if (x <= a[0]) return tr.v[0];
  if (x >= a[last]) return tr.v[last];

  let i = 0;
  while (i < last - 1 && x > a[i + 1]) i++;

  const span = a[i + 1] - a[i];
  const u = span > 1e-6 ? (x - a[i]) / span : 0;
  const k = applyEase(tr.e[i], u);
  return tr.v[i] + (tr.v[i + 1] - tr.v[i]) * k;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
