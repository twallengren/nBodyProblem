import {
  BLACK_HOLE_MASS,
  BLACK_HOLE_SPEED,
  BLACK_HOLE_X,
  BODY_INIT_SPEED,
  BODY_MASS_MAX,
  BODY_MASS_MIN,
  BODY_POSITION_RANGE,
  G,
} from './constants.js';
import { Body } from './body.js';
import { NBodySystem } from './system.js';

function uniform(min, max) {
  return min + Math.random() * (max - min);
}

function randomMass() {
  return Math.floor(uniform(BODY_MASS_MIN, BODY_MASS_MAX + 1));
}

/**
 * Two 1e6 solar-mass black holes orbiting each other, plus n random small
 * bodies. Same numbers as the original nBodyProblem.py scenario.
 */
function buildBinary(system, n) {
  system.addBody(new Body({
    mass: BLACK_HOLE_MASS, isHeavy: true,
    x: BLACK_HOLE_X, y: 0, vx: 0, vy: -BLACK_HOLE_SPEED,
  }));
  system.addBody(new Body({
    mass: BLACK_HOLE_MASS, isHeavy: true,
    x: -BLACK_HOLE_X, y: 0, vx: 0, vy: BLACK_HOLE_SPEED,
  }));
  for (let i = 0; i < n; i++) {
    system.addBody(new Body({
      mass: randomMass(),
      x: uniform(-BODY_POSITION_RANGE, BODY_POSITION_RANGE),
      y: uniform(-BODY_POSITION_RANGE, BODY_POSITION_RANGE),
      vx: uniform(-BODY_INIT_SPEED, BODY_INIT_SPEED),
      vy: uniform(-BODY_INIT_SPEED, BODY_INIT_SPEED),
    }));
  }
}

/**
 * The Chenciner-Montgomery figure-8 three-body choreography, scaled from its
 * G=1, m=1 units to ours: lengths by L, velocities by sqrt(G*M/L).
 */
function buildFigure8(system) {
  const M = BLACK_HOLE_MASS;
  const L = 8; // parsecs per choreography length unit
  const V = Math.sqrt((G * M) / L);
  const p = [0.97000436, -0.24308753];
  const v = [0.46620368, 0.43236573]; // v1 = v2; v3 = -2 * v1
  const bodies = [
    { x: p[0], y: p[1], vx: v[0], vy: v[1] },
    { x: -p[0], y: -p[1], vx: v[0], vy: v[1] },
    { x: 0, y: 0, vx: -2 * v[0], vy: -2 * v[1] },
  ];
  for (const b of bodies) {
    system.addBody(new Body({
      mass: M, isHeavy: true,
      x: b.x * L, y: b.y * L, vx: b.vx * V, vy: b.vy * V,
    }));
  }
}

/** n light bodies on same-direction circular orbits around a central mass. */
function addOrbitingBodies(system, n, { mass, x, y, vx, vy, rMin, rMax }) {
  for (let i = 0; i < n; i++) {
    const r = uniform(rMin, rMax);
    const angle = uniform(0, 2 * Math.PI);
    const vOrbit = Math.sqrt((G * mass) / r) * uniform(0.95, 1.05);
    system.addBody(new Body({
      mass: randomMass(),
      x: x + r * Math.cos(angle),
      y: y + r * Math.sin(angle),
      // Tangential, counterclockwise, plus the cluster's bulk velocity.
      vx: vx - vOrbit * Math.sin(angle),
      vy: vy + vOrbit * Math.cos(angle),
    }));
  }
}

/** One central black hole with n stars on circular orbits. */
function buildCluster(system, n) {
  system.addBody(new Body({
    mass: BLACK_HOLE_MASS, isHeavy: true, x: 0, y: 0, vx: 0, vy: 0,
  }));
  addOrbitingBodies(system, n, {
    mass: BLACK_HOLE_MASS, x: 0, y: 0, vx: 0, vy: 0, rMin: 3, rMax: 15,
  });
}

/** Two star clusters on a near-miss collision course. */
function buildCollision(system, n) {
  const mass = 5e5;
  const speed = 1.6e-5;
  const clusters = [
    { x: -13, y: -3, vx: speed, vy: 0 },
    { x: 13, y: 3, vx: -speed, vy: 0 },
  ];
  const counts = [Math.ceil(n / 2), Math.floor(n / 2)];
  clusters.forEach((c, i) => {
    system.addBody(new Body({ mass, isHeavy: true, ...c }));
    addOrbitingBodies(system, counts[i], { mass, ...c, rMin: 1.5, rMax: 5 });
  });
}

export const PRESETS = [
  { id: 'binary', label: 'Black-hole binary', usesBodyCount: true },
  { id: 'figure8', label: 'Figure-8 three-body', usesBodyCount: false },
  { id: 'cluster', label: 'Star cluster', usesBodyCount: true },
  { id: 'collision', label: 'Cluster collision', usesBodyCount: true },
];

const BUILDERS = {
  binary: buildBinary,
  figure8: buildFigure8,
  cluster: buildCluster,
  collision: buildCollision,
};

export function buildScenario(presetId, n) {
  const build = BUILDERS[presetId];
  if (!build) throw new Error(`unknown preset: ${presetId}`);
  const system = new NBodySystem();
  build(system, n);
  system.computeAccelerations(); // prime the first velocity-Verlet half-kick
  return system;
}
