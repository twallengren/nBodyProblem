import assert from 'node:assert/strict';
import { G } from '../src/constants.js';
import { Body } from '../src/body.js';
import { NBodySystem } from '../src/system.js';
import { buildScenario, PRESETS } from '../src/scenario.js';

function test(name, fn) {
  fn();
  console.log(`ok - ${name}`);
}

test('circular orbit stays circular', () => {
  const system = new NBodySystem();
  const centralMass = 1e6;
  const r = 5;
  const v = Math.sqrt((G * centralMass) / r); // analytic circular-orbit speed
  system.addBody(new Body({ mass: centralMass, x: 0, y: 0, vx: 0, vy: 0 }));
  system.addBody(new Body({ mass: 1, x: r, y: 0, vx: 0, vy: v }));
  system.computeAccelerations();

  // ~2 full orbits (period ~1e6 years = ~1000 steps).
  for (let i = 0; i < 2000; i++) {
    system.step();
    const [central, satellite] = system.bodies;
    const dx = satellite.x - central.x;
    const dy = satellite.y - central.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    assert.ok(
      Math.abs(radius - r) / r < 0.01,
      `radius drifted to ${radius} at step ${i}`,
    );
  }
});

test('momentum is conserved', () => {
  const system = buildScenario('binary', 10);
  const before = system.totalMomentum();
  for (let i = 0; i < 500; i++) system.step();
  const after = system.totalMomentum();
  // Black-hole momentum scale is ~30 M_sun*pc/yr; drift should be pure float
  // noise (merging is also momentum-conserving).
  assert.ok(Math.abs(after.px - before.px) < 1e-6, `px drift ${after.px - before.px}`);
  assert.ok(Math.abs(after.py - before.py) < 1e-6, `py drift ${after.py - before.py}`);
});

test('energy drift is small over many orbits', () => {
  const system = buildScenario('binary', 0); // just the two black holes, deterministic
  const initial = system.totalEnergy();
  for (let i = 0; i < 5000; i++) system.step(); // 5 Myr, ~10 orbits
  const final = system.totalEnergy();
  const drift = Math.abs((final - initial) / initial);
  assert.ok(drift < 1e-4, `relative energy drift ${drift}`);
});

test('close encounter stays finite (softening)', () => {
  const system = new NBodySystem();
  // Head-on collision course; equal masses so the merge survivor keeps
  // momentum ~0 and the test exercises post-merge stepping too.
  system.addBody(new Body({ mass: 1e6, x: -0.5, y: 0, vx: 1e-5, vy: 0 }));
  system.addBody(new Body({ mass: 1e6, x: 0.5, y: 0, vx: -1e-5, vy: 0 }));
  system.computeAccelerations();
  for (let i = 0; i < 1000; i++) system.step();
  for (const body of system.bodies) {
    for (const value of [body.x, body.y, body.vx, body.vy, body.ax, body.ay]) {
      assert.ok(Number.isFinite(value), `non-finite state: ${value}`);
    }
  }
});

test('merging conserves mass and momentum', () => {
  const system = new NBodySystem();
  system.addBody(new Body({ mass: 100, x: -0.2, y: 0, vx: 1e-5, vy: 0 }));
  system.addBody(new Body({ mass: 50, x: 0.2, y: 0, vx: -1e-5, vy: 0 }));
  system.computeAccelerations();
  const before = system.totalMomentum();
  for (let i = 0; i < 30 && system.bodies.length > 1; i++) system.step();

  assert.equal(system.bodies.length, 1, 'bodies did not merge');
  const survivor = system.bodies[0];
  assert.equal(survivor.mass, 150);
  const after = system.totalMomentum();
  assert.ok(Math.abs(after.px - before.px) < 1e-12, `px drift ${after.px - before.px}`);
  assert.ok(Math.abs(after.py - before.py) < 1e-12, `py drift ${after.py - before.py}`);
});

test('presets build with expected body counts', () => {
  const expected = { binary: 7, figure8: 3, cluster: 6, collision: 7 };
  for (const preset of PRESETS) {
    const system = buildScenario(preset.id, 5);
    assert.equal(
      system.bodies.length,
      expected[preset.id],
      `${preset.id} body count`,
    );
    assert.ok(Number.isFinite(system.totalEnergy()), `${preset.id} energy`);
  }
  assert.throws(() => buildScenario('nope', 5));
});

test('figure-8 choreography is stable for a full period', () => {
  const system = buildScenario('figure8', 0);
  const initial = system.totalEnergy();
  const momentum = system.totalMomentum();
  assert.ok(Math.hypot(momentum.px, momentum.py) < 1e-6, 'net momentum should be ~0');

  // One period is ~2.04 Myr at the L=8 pc scale used by the preset.
  for (let i = 0; i < 2100; i++) {
    system.step();
    for (const body of system.bodies) {
      const r = Math.hypot(body.x, body.y);
      assert.ok(r < 12, `body escaped to r=${r} at step ${i}`);
    }
  }
  assert.equal(system.bodies.length, 3, 'no merges expected');
  const drift = Math.abs((system.totalEnergy() - initial) / initial);
  assert.ok(drift < 1e-4, `relative energy drift ${drift}`);
});

console.log('all physics tests passed');
