import {
  BASE_YEARS_PER_MS,
  BODY_MASS_MAX,
  BODY_MASS_MIN,
  DRAG_VELOCITY_SCALE,
  STEP_YEARS,
} from './constants.js';
import { Body } from './body.js';
import { buildScenario, PRESETS } from './scenario.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('canvas');
const presetSelect = document.getElementById('preset');
const startStopButton = document.getElementById('start-stop');
const resetButton = document.getElementById('reset');
const bodyCountSlider = document.getElementById('body-count');
const bodyCountReadout = document.getElementById('body-count-readout');
const bodyCountGroup = document.getElementById('body-count-group');
const speedSlider = document.getElementById('speed');
const speedReadout = document.getElementById('speed-readout');
const followCheckbox = document.getElementById('follow');
const statsButton = document.getElementById('stats-toggle');
const hud = document.getElementById('hud');
const clockReadout = document.getElementById('sim-clock');

for (const preset of PRESETS) {
  const option = document.createElement('option');
  option.value = preset.id;
  option.textContent = preset.label;
  presetSelect.appendChild(option);
}

const renderer = new Renderer(canvas);
let system;
let running = false;
let accumulatedYears = 0;
let lastFrameTime = performance.now();
let energyBaseline = 0;
let baselineBodyCount = 0;
let lastHudUpdate = 0;

// Canvas interaction state.
let aim = null; // {x0, y0, x1, y1} world coords while drag-launching
let panning = false;
let lastPointer = null;

const dpr = () => window.devicePixelRatio || 1;

function formatSimTime(years) {
  if (years >= 1e6) return `${(years / 1e6).toFixed(2)} Myr`;
  return `${(years / 1e3).toFixed(0)} kyr`;
}

function formatRate(yearsPerSecond) {
  if (yearsPerSecond >= 1e6) return `${(yearsPerSecond / 1e6).toFixed(1)} Myr/s`;
  return `${Math.round(yearsPerSecond / 1e3)} kyr/s`;
}

function speedFactor() {
  return Math.pow(10, Number(speedSlider.value));
}

function rebaselineEnergy() {
  energyBaseline = system.totalEnergy();
  baselineBodyCount = system.bodies.length;
}

function updateClock() {
  clockReadout.textContent = `t = ${formatSimTime(system.time)}`;
}

function updateHud(force = false) {
  if (hud.hidden) return;
  const now = performance.now();
  if (!force && now - lastHudUpdate < 250) return;
  lastHudUpdate = now;
  const energy = system.totalEnergy();
  const { px, py } = system.totalMomentum();
  const drift = energyBaseline !== 0 ? (energy - energyBaseline) / Math.abs(energyBaseline) : 0;
  hud.innerHTML = `
    <div><span>bodies</span><b>${system.bodies.length}</b></div>
    <div><span>time</span><b>${formatSimTime(system.time)}</b></div>
    <div><span>energy</span><b>${energy.toExponential(3)}</b></div>
    <div><span>&Delta;E / |E<sub>0</sub>|</span><b>${drift.toExponential(2)}</b></div>
    <div><span>|momentum|</span><b>${Math.hypot(px, py).toExponential(3)}</b></div>
    <div class="hud-units">M&#9737;, pc, yr units</div>`;
}

function setRunning(value) {
  running = value;
  startStopButton.textContent = running ? 'Pause' : 'Start';
  startStopButton.classList.toggle('running', running);
}

function reset() {
  system = buildScenario(presetSelect.value, Number(bodyCountSlider.value));
  accumulatedYears = 0;
  renderer.centerOn(0, 0);
  renderer.zoom = 1;
  setRunning(false);
  rebaselineEnergy();
  updateClock();
  updateHud(true);
}

// --- Control wiring ---------------------------------------------------------

startStopButton.addEventListener('click', () => setRunning(!running));
resetButton.addEventListener('click', reset);

presetSelect.addEventListener('change', () => {
  const preset = PRESETS.find((p) => p.id === presetSelect.value);
  bodyCountGroup.classList.toggle('disabled', !preset.usesBodyCount);
  bodyCountSlider.disabled = !preset.usesBodyCount;
  reset();
});

bodyCountSlider.addEventListener('input', () => {
  bodyCountReadout.textContent = bodyCountSlider.value;
});

speedSlider.addEventListener('input', () => {
  speedReadout.textContent = formatRate(BASE_YEARS_PER_MS * speedFactor() * 1000);
});

statsButton.addEventListener('click', () => {
  hud.hidden = !hud.hidden;
  statsButton.classList.toggle('running', !hud.hidden);
  updateHud(true);
});

window.addEventListener('resize', () => renderer.resize());

// --- Canvas interactions ----------------------------------------------------

function pointerPos(e) {
  return { sx: e.offsetX * dpr(), sy: e.offsetY * dpr() };
}

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  const { sx, sy } = pointerPos(e);
  canvas.setPointerCapture(e.pointerId);
  if (e.button === 0 && !e.shiftKey) {
    const w = renderer.toWorld(sx, sy);
    aim = { x0: w.x, y0: w.y, x1: w.x, y1: w.y };
  } else {
    panning = true;
    lastPointer = { sx, sy };
    followCheckbox.checked = false; // manual pan disengages follow
  }
});

canvas.addEventListener('pointermove', (e) => {
  const { sx, sy } = pointerPos(e);
  if (aim) {
    const w = renderer.toWorld(sx, sy);
    aim.x1 = w.x;
    aim.y1 = w.y;
  } else if (panning) {
    renderer.panBy(sx - lastPointer.sx, sy - lastPointer.sy);
    lastPointer = { sx, sy };
  }
});

function endPointer(e) {
  if (aim) {
    system.addBody(new Body({
      mass: BODY_MASS_MIN + Math.floor(Math.random() * (BODY_MASS_MAX - BODY_MASS_MIN + 1)),
      x: aim.x0,
      y: aim.y0,
      vx: (aim.x1 - aim.x0) * DRAG_VELOCITY_SCALE,
      vy: (aim.y1 - aim.y0) * DRAG_VELOCITY_SCALE,
    }));
    system.computeAccelerations(); // keep the Verlet contract for the new body
    rebaselineEnergy();
    updateHud(true);
    aim = null;
  }
  panning = false;
  if (e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
    canvas.releasePointerCapture(e.pointerId);
  }
}

canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => {
  aim = null;
  endPointer(e);
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { sx, sy } = pointerPos(e);
  renderer.zoomAt(sx, sy, Math.exp(-e.deltaY * 0.0015));
}, { passive: false });

// --- Main loop ---------------------------------------------------------------

function frame(now) {
  const elapsed = Math.min(now - lastFrameTime, 250); // cap after tab switches
  lastFrameTime = now;
  if (running) {
    accumulatedYears += elapsed * BASE_YEARS_PER_MS * speedFactor();
    while (accumulatedYears >= STEP_YEARS) {
      system.step();
      accumulatedYears -= STEP_YEARS;
    }
    updateClock();
  }
  // Merges can change the body count outside of user actions.
  if (system.bodies.length !== baselineBodyCount) rebaselineEnergy();
  if (followCheckbox.checked) {
    const com = system.centerOfMass();
    renderer.centerOn(com.x, com.y);
  }
  if (running) updateHud();
  renderer.draw(system, aim);
  requestAnimationFrame(frame);
}

bodyCountReadout.textContent = bodyCountSlider.value;
speedReadout.textContent = formatRate(BASE_YEARS_PER_MS * 1000);
reset();
requestAnimationFrame(frame);
