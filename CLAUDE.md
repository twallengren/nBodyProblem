# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running & testing

```
python3 -m http.server 8000   # serve, then open http://localhost:8000
node test/physics.test.js     # headless physics tests
```

Zero-build vanilla JS (ES modules) — no bundler, no dependencies. `package.json` exists only to set `"type": "module"` so node can run the tests, plus `npm test` / `npm start` aliases. ES modules can't load from `file://`, hence the static server.

## Architecture

2D N-body gravity simulation on HTML5 canvas, layered top to bottom:

- **index.html / style.css** — page shell (control bar, canvas stage with absolutely-positioned HUD, info footer) and dark theme.
- **src/main.js** — bootstrap, control wiring, canvas interactions, and the requestAnimationFrame loop. The loop uses a years-based fixed-timestep accumulator: wall-clock ms × `BASE_YEARS_PER_MS` × speed factor accumulate, and each `STEP_YEARS` (1000 yr) worth runs one `system.step()`. The speed slider is log-scale (10^value, 0.1×–10×). Canvas input: left-drag aims/spawns a body, shift/right/middle-drag pans (and unchecks Follow), wheel zooms at the cursor.
- **src/renderer.js** — camera (world center + zoom relative to the base "fit ±`VIEW_EXTENT`" scale), adaptive 1/2/5×10^k grid, glowing body dots, fading trails, and the drag-launch aim arrow. DPR-aware; `resize()` must be called on window resize. Bodies render from their own props (`isHeavy`, `hue`), never from array index.
- **src/scenario.js** — `PRESETS` registry + `buildScenario(presetId, n)`: `binary` (two 1e6 M☉ black holes at (±2, 0), original-app parity), `figure8` (Chenciner–Montgomery choreography scaled to L=8 pc), `cluster` (central black hole + circular orbits), `collision` (two clusters on a near-miss course). Primes accelerations for the first Verlet half-kick.
- **src/system.js** — the physics: pairwise softened Newtonian gravity (each pair once, Newton's third law), velocity-Verlet integration, and inelastic merging (`mergeCloseBodies`, checked every substep; survivor is the heavier body, mass/momentum conserved). Each `step()` runs `SUBSTEPS` substeps then records one trail point per body. `totalEnergy()`/`totalMomentum()`/`centerOfMass()` feed the HUD, follow-camera, and tests.
- **src/body.js** — per-body state, render identity (`isHeavy`, golden-angle `hue`), and a fixed-size ring buffer of trail positions.
- **src/constants.js** — all tunables: G, timestep, softening, merge radius, zoom limits, drag-velocity scale, scenario parameters.

## Non-obvious details

- **Units** are solar masses / parsecs / years throughout; `G = 4.915e-15` depends on this.
- **Verlet substep contract**: `verletSubstep()` assumes `body.ax/ay` are current. `buildScenario` primes them; anything that adds a body mid-flight (drag-spawn in main.js) must call `computeAccelerations()` afterward, as must tests that build systems manually.
- **Softening** (`SOFTENING`, 0.05 pc) appears in both the force (`system.js`) and the potential term of `totalEnergy()` — they must stay consistent or energy-drift numbers are meaningless.
- **`MERGE_RADIUS` (0.1 pc) must stay well below the tightest preset orbits** (≥1.3 pc closest approach in figure-8, ≥1.5 pc orbits in clusters) or presets will eat themselves. Merging is checked per substep so fast encounters can't tunnel through.
- **Energy-drift baseline in the HUD** rebaselines whenever `bodies.length` changes (spawn or merge legitimately change E); don't "fix" that as a bug.
- The main loop caps per-frame elapsed time at 250 ms so returning from a background tab doesn't fire thousands of steps.

## Verification

After physics or rendering changes: run `node test/physics.test.js`, then serve the app and drive it — presets load, Start runs at the speed-slider rate (clock readout), drag launches a body with an aim arrow, wheel zooms at the cursor, shift-drag pans and unchecks Follow, Stats HUD shows small ΔE/|E₀| while running, and there are no console errors. A puppeteer-core drive script pattern for this exists in git history / previous sessions if needed.
