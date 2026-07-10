// Unit system: mass in solar masses, distance in parsecs, time in years.
export const G = 4.915e-15; // Newton's constant in pc^3 / (M_sun * yr^2)

// One animation step advances the simulation 1000 years. At speed 1x a step
// runs every 50 ms of wall clock, i.e. 20,000 simulated years per second
// (parity with the original app). The speed slider scales this rate.
export const STEP_YEARS = 1000;
export const BASE_YEARS_PER_MS = 20;

// Each 1000-year step is integrated as smaller velocity-Verlet substeps.
export const SUBSTEPS = 10;

// Softening length in parsecs: forces use r^2 + EPS^2 so close encounters
// stay finite instead of blowing up the integrator.
export const SOFTENING = 0.05;

// Bodies closer than this (parsecs) merge inelastically. Checked per substep
// so fast encounters can't tunnel through; must stay well below the closest
// stable orbits the presets set up (>= 1.3 pc in figure-8, >= 1.5 pc in
// clusters).
export const MERGE_RADIUS = 0.1;

// The default view shows [-VIEW_EXTENT, VIEW_EXTENT] parsecs on both axes;
// the camera can zoom between ZOOM_MIN and ZOOM_MAX times that.
export const VIEW_EXTENT = 20;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 50;

// Trail history per body, one point per step (600 steps = 600,000 years,
// a bit over one full orbit of the black-hole binary).
export const TRAIL_LENGTH = 600;

// Drag-to-launch: velocity (pc/yr) per parsec of drag distance. A 4 pc drag
// gives 4e-5 pc/yr, a typical small-body speed.
export const DRAG_VELOCITY_SCALE = 1e-5;

// Scenario parameters (parity with the original nBodyProblem.py).
export const BLACK_HOLE_MASS = 1e6;
export const BLACK_HOLE_X = 2;
export const BLACK_HOLE_SPEED = 3e-5;
export const BODY_MASS_MIN = 10;
export const BODY_MASS_MAX = 100;
export const BODY_POSITION_RANGE = 10;
export const BODY_INIT_SPEED = 4e-5;
