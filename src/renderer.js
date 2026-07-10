import { VIEW_EXTENT, ZOOM_MAX, ZOOM_MIN } from './constants.js';

const TRAIL_CHUNK = 25; // trail points per constant-alpha stroke
const MIN_GRID_PX = 18; // minimum device-pixel spacing between grid lines

function lightBodyColor(hue, alpha = 1) {
  return `hsla(${hue}, 75%, 62%, ${alpha})`;
}

/** Largest 1/2/5 * 10^k value giving at least minPx between grid lines. */
function gridSpacing(scale, minPx) {
  let spacing = Math.pow(10, Math.ceil(Math.log10(minPx / scale)));
  if (spacing / 5 >= minPx / scale) return spacing / 5;
  if (spacing / 2 >= minPx / scale) return spacing / 2;
  return spacing;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Camera: world point at the screen center, plus zoom relative to the
    // base "fit +/-VIEW_EXTENT" scale.
    this.camX = 0;
    this.camY = 0;
    this.zoom = 1;
    this.resize();
  }

  /** Match the canvas backing store to its CSS size and devicePixelRatio. */
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.baseScale = Math.min(this.width, this.height) / (2 * VIEW_EXTENT);
  }

  get scale() {
    return this.baseScale * this.zoom;
  }

  toScreenX(x) {
    return this.width / 2 + (x - this.camX) * this.scale;
  }

  toScreenY(y) {
    return this.height / 2 - (y - this.camY) * this.scale; // canvas y grows downward
  }

  /** Screen (device px) to world coordinates. */
  toWorld(sx, sy) {
    return {
      x: this.camX + (sx - this.width / 2) / this.scale,
      y: this.camY - (sy - this.height / 2) / this.scale,
    };
  }

  /** Pan by a screen-space delta (device px). */
  panBy(dxPx, dyPx) {
    this.camX -= dxPx / this.scale;
    this.camY += dyPx / this.scale;
  }

  /** Zoom by a factor, keeping the world point under (sx, sy) fixed. */
  zoomAt(sx, sy, factor) {
    const anchor = this.toWorld(sx, sy);
    this.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom * factor));
    const moved = this.toWorld(sx, sy);
    this.camX += anchor.x - moved.x;
    this.camY += anchor.y - moved.y;
  }

  centerOn(x, y) {
    this.camX = x;
    this.camY = y;
  }

  /** aim: {x0, y0, x1, y1} in world coords while drag-launching, else null. */
  draw(system, aim = null) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawGrid();
    for (const body of system.bodies) this.drawTrail(body);
    for (const body of system.bodies) this.drawBody(body);
    if (aim) this.drawAim(aim);
  }

  drawGrid() {
    const ctx = this.ctx;
    const minor = gridSpacing(this.scale, MIN_GRID_PX);
    const major = minor * 5;
    const left = this.toWorld(0, 0).x;
    const right = this.toWorld(this.width, 0).x;
    const top = this.toWorld(0, 0).y;
    const bottom = this.toWorld(0, this.height).y;
    ctx.lineWidth = 1;

    for (const [spacing, style] of [
      [minor, 'rgba(255, 255, 255, 0.04)'],
      [major, 'rgba(255, 255, 255, 0.09)'],
    ]) {
      ctx.strokeStyle = style;
      ctx.beginPath();
      for (let x = Math.ceil(left / spacing) * spacing; x <= right; x += spacing) {
        ctx.moveTo(this.toScreenX(x), 0);
        ctx.lineTo(this.toScreenX(x), this.height);
      }
      for (let y = Math.ceil(bottom / spacing) * spacing; y <= top; y += spacing) {
        ctx.moveTo(0, this.toScreenY(y));
        ctx.lineTo(this.width, this.toScreenY(y));
      }
      ctx.stroke();
    }

    // Axes through the origin, slightly brighter.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(this.toScreenX(0), 0);
    ctx.lineTo(this.toScreenX(0), this.height);
    ctx.moveTo(0, this.toScreenY(0));
    ctx.lineTo(this.width, this.toScreenY(0));
    ctx.stroke();
  }

  drawTrail(body) {
    if (body.trailCount < 2) return;
    const ctx = this.ctx;
    ctx.lineWidth = body.isHeavy ? 1.5 : 1;

    // Collect screen-space points once, then stroke in chunks whose alpha
    // rises toward the newest points so the trail fades out behind the body.
    const xs = [];
    const ys = [];
    body.forEachTrailPoint((x, y) => {
      xs.push(this.toScreenX(x));
      ys.push(this.toScreenY(y));
    });

    for (let start = 0; start < xs.length - 1; start += TRAIL_CHUNK) {
      const end = Math.min(start + TRAIL_CHUNK, xs.length - 1);
      const alpha = 0.05 + 0.4 * (end / xs.length);
      ctx.strokeStyle = body.isHeavy
        ? `rgba(160, 190, 255, ${alpha})`
        : lightBodyColor(body.hue, alpha);
      ctx.beginPath();
      ctx.moveTo(xs[start], ys[start]);
      for (let i = start + 1; i <= end; i++) {
        ctx.lineTo(xs[i], ys[i]);
      }
      ctx.stroke();
    }
  }

  drawBody(body) {
    const ctx = this.ctx;
    const sx = this.toScreenX(body.x);
    const sy = this.toScreenY(body.y);
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    if (body.isHeavy) {
      ctx.shadowColor = '#7fb0ff';
      ctx.shadowBlur = 18 * dpr;
      ctx.fillStyle = '#eaf2ff';
      ctx.beginPath();
      ctx.arc(sx, sy, 6 * dpr, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Radius grows gently with mass (10-100 solar masses -> ~2.6-3.9 px).
      const radius = 1.2 * Math.cbrt(body.mass) * dpr * 0.6;
      ctx.shadowColor = lightBodyColor(body.hue, 0.9);
      ctx.shadowBlur = 8 * dpr;
      ctx.fillStyle = lightBodyColor(body.hue);
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Dashed launch vector with a ghost body at the spawn point. */
  drawAim(aim) {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const x0 = this.toScreenX(aim.x0);
    const y0 = this.toScreenY(aim.y0);
    const x1 = this.toScreenX(aim.x1);
    const y1 = this.toScreenY(aim.y1);

    ctx.save();
    ctx.strokeStyle = 'rgba(110, 168, 254, 0.9)';
    ctx.fillStyle = 'rgba(110, 168, 254, 0.9)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead.
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const size = 7 * dpr;
    if (Math.hypot(x1 - x0, y1 - y0) > size) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - size * Math.cos(angle - 0.45), y1 - size * Math.sin(angle - 0.45));
      ctx.lineTo(x1 - size * Math.cos(angle + 0.45), y1 - size * Math.sin(angle + 0.45));
      ctx.closePath();
      ctx.fill();
    }

    // Ghost of the body to be spawned.
    ctx.beginPath();
    ctx.arc(x0, y0, 3.5 * dpr, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}
