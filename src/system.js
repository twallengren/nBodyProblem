import { G, MERGE_RADIUS, SOFTENING, STEP_YEARS, SUBSTEPS } from './constants.js';

export class NBodySystem {
  constructor() {
    this.bodies = [];
    this.time = 0; // simulated years elapsed
  }

  addBody(body) {
    this.bodies.push(body);
  }

  /** Pairwise softened Newtonian gravity, each pair computed once. */
  computeAccelerations() {
    const bodies = this.bodies;
    for (const body of bodies) {
      body.ax = 0;
      body.ay = 0;
    }
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const r2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
        const invR3 = 1 / (r2 * Math.sqrt(r2));
        // Acceleration of a toward b and vice versa (Newton's third law).
        const s = G * invR3;
        a.ax += s * b.mass * dx;
        a.ay += s * b.mass * dy;
        b.ax -= s * a.mass * dx;
        b.ay -= s * a.mass * dy;
      }
    }
  }

  /**
   * Inelastically merge any pair closer than MERGE_RADIUS: the heavier body
   * survives at the pair's center of mass with combined mass and momentum.
   * Returns true if anything merged.
   */
  mergeCloseBodies() {
    const bodies = this.bodies;
    let merged = false;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy >= MERGE_RADIUS * MERGE_RADIUS) continue;
        const keep = a.mass >= b.mass ? a : b;
        const mass = a.mass + b.mass;
        keep.x = (a.x * a.mass + b.x * b.mass) / mass;
        keep.y = (a.y * a.mass + b.y * b.mass) / mass;
        keep.vx = (a.vx * a.mass + b.vx * b.mass) / mass;
        keep.vy = (a.vy * a.mass + b.vy * b.mass) / mass;
        keep.mass = mass;
        keep.isHeavy = a.isHeavy || b.isHeavy;
        bodies.splice(keep === a ? j : i, 1);
        merged = true;
        j = i; // re-scan pairs involving the survivor
      }
    }
    if (merged) this.computeAccelerations();
    return merged;
  }

  /** One velocity-Verlet substep of dt years. Assumes accelerations are current. */
  verletSubstep(dt) {
    const bodies = this.bodies;
    const halfDt = 0.5 * dt;
    for (const body of bodies) {
      body.vx += body.ax * halfDt;
      body.vy += body.ay * halfDt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
    }
    this.computeAccelerations();
    for (const body of bodies) {
      body.vx += body.ax * halfDt;
      body.vy += body.ay * halfDt;
    }
  }

  /** Advance one animation step (STEP_YEARS) and record one trail point per body. */
  step() {
    const dt = STEP_YEARS / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) {
      this.verletSubstep(dt);
      this.mergeCloseBodies();
    }
    this.time += STEP_YEARS;
    for (const body of this.bodies) {
      body.recordTrail();
    }
  }

  /** Total kinetic + (softened) potential energy — used by the HUD and tests. */
  totalEnergy() {
    const bodies = this.bodies;
    let energy = 0;
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      energy += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy);
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const r = Math.sqrt(dx * dx + dy * dy + SOFTENING * SOFTENING);
        energy -= (G * a.mass * b.mass) / r;
      }
    }
    return energy;
  }

  /** Total momentum vector — used by the HUD and tests. */
  totalMomentum() {
    let px = 0;
    let py = 0;
    for (const body of this.bodies) {
      px += body.mass * body.vx;
      py += body.mass * body.vy;
    }
    return { px, py };
  }

  /** Mass-weighted center of mass — used by the follow-camera. */
  centerOfMass() {
    let mx = 0;
    let my = 0;
    let m = 0;
    for (const body of this.bodies) {
      mx += body.mass * body.x;
      my += body.mass * body.y;
      m += body.mass;
    }
    return m > 0 ? { x: mx / m, y: my / m } : { x: 0, y: 0 };
  }
}
