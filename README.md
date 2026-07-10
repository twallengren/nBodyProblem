# nBodyProblem

2D Newtonian N-body gravity simulation in the browser — an interactive
gravity sandbox with preset scenarios, fading trails, and live physics
diagnostics.

## Run it

No build step or dependencies — serve the repo statically and open it:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

(Any static file server works; ES modules just can't be loaded from `file://`.)

## Using it

- **Scenarios** (dropdown): black-hole binary with random small bodies,
  the figure-8 three-body choreography, a star cluster, and a two-cluster
  collision.
- **Drag on the canvas** to launch a new 10–100 solar-mass body — the drag
  vector sets its velocity.
- **Scroll to zoom**, **shift-drag or right-drag to pan**, or check
  **Follow** to track the center of mass.
- **Speed** slider runs the clock from 2,000 to 200,000 simulated years per
  second (default 20,000).
- **Stats** toggles a live HUD: body count, elapsed time, total energy,
  energy drift, and momentum.
- Bodies that get close enough merge inelastically (mass and momentum
  conserved).

## Physics

- Units: solar masses, parsecs, years (G = 4.915×10⁻¹⁵ in these units).
- Velocity-Verlet integration with gravitational softening, so close
  encounters stay finite.

## Tests

```
node test/physics.test.js
```

Headless checks: circular-orbit stability, momentum/energy conservation,
merge conservation laws, preset construction, figure-8 stability over a full
period, and softened close encounters.
