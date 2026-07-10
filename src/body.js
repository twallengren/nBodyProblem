import { TRAIL_LENGTH } from './constants.js';

let nextHueIndex = 0;

/** Stable, well-spread hue for light bodies via golden-angle spacing. */
export function nextHue() {
  return (nextHueIndex++ * 137.508) % 360;
}

export class Body {
  constructor({ mass, x, y, vx, vy, isHeavy = false, hue = nextHue() }) {
    this.mass = mass;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.ax = 0;
    this.ay = 0;
    // Render identity: heavy bodies get the glowing white/blue "black hole"
    // treatment, light bodies a stable per-body hue.
    this.isHeavy = isHeavy;
    this.hue = hue;

    // Ring buffer of recent positions, oldest overwritten first.
    this.trailX = new Float64Array(TRAIL_LENGTH);
    this.trailY = new Float64Array(TRAIL_LENGTH);
    this.trailHead = 0; // next write slot
    this.trailCount = 0;
    this.recordTrail();
  }

  recordTrail() {
    this.trailX[this.trailHead] = this.x;
    this.trailY[this.trailHead] = this.y;
    this.trailHead = (this.trailHead + 1) % TRAIL_LENGTH;
    if (this.trailCount < TRAIL_LENGTH) this.trailCount++;
  }

  /** Visit trail points oldest to newest. */
  forEachTrailPoint(fn) {
    const start = (this.trailHead - this.trailCount + TRAIL_LENGTH) % TRAIL_LENGTH;
    for (let i = 0; i < this.trailCount; i++) {
      const idx = (start + i) % TRAIL_LENGTH;
      fn(this.trailX[idx], this.trailY[idx], i, this.trailCount);
    }
  }
}
