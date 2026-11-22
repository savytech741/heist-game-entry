// Rendering for THE MARLOWE JOB: floor, walls, vision cones (raycast-clipped),
// loot, exit, guards, cameras, the thief, the HUD and all screens.
// Everything is drawn on one 1280x800 canvas, no images, no network.
import { PLAY, LEVELS } from './levels.js';
import { clamp, segmentHitsRect } from './random.js';

const W = 1280;
const H = 800;

// Distance from (x,y) along angle until a wall or range; walls clip the cone.
function rayDist(x, y, angle, range, walls) {
  const x2 = x + Math.cos(angle) * range;
  const y2 = y + Math.sin(angle) * range;
  let lo = 0;
  let hi = 1;
  // Binary search the first wall hit along the ray.
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    const mx = x + (x2 - x) * mid;
    const my = y + (y2 - y) * mid;
    let hit = false;
    for (const w of walls) {
      if (segmentHitsRect(x, y, mx, my, w)) { hit = true; break; }
    }
    if (hit) hi = mid; else lo = mid;
  }
  return range * lo;
}

function drawCone(ctx, eye, angle, range, half, walls, fill, edge) {
  const rays = 18;
  ctx.beginPath();
  ctx.moveTo(eye.x, eye.y);
  for (let i = 0; i <= rays; i++) {
    const a = angle - half + (2 * half * i) / rays;
    const d = rayDist(eye.x, eye.y, a, range, walls);
    ctx.lineTo(eye.x + Math.cos(a) * d, eye.y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, t) {
  ctx.fillStyle = '#171a26';
  ctx.fillRect(0, 64, W, H - 64);
  // Tile grid.
  ctx.strokeStyle = '#202434';
  ctx.lineWidth = 1;
  for (let x = 12; x <= 1268; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 76; y <= 788; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Warm light pools.
  const glow = ctx.createRadialGradient(640, 420, 40, 640, 420, 520);
  glow.addColorStop(0, 'rgba(255, 196, 110, 0.05)');
  glow.addColorStop(1, 'rgba(255, 196, 110, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 64, W, H - 64);
  void t;
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#0c0e16';
    ctx.fillRect(w.x + 3, w.y + 4, w.w, w.h);
    ctx.fillStyle = '#3d4360';
    roundRect(ctx, w.x, w.y, w.w, w.h, 4);
    ctx.fill();
    ctx.strokeStyle = '#565e85';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#4a5170';
    ctx.fillRect(w.x + 4, w.y + 4, w.w - 8, 5);
  }
}

function drawLoot(ctx, state, t) {
  const loot = state.def.loot;
  if (state.lootTaken) return;
  const pulse = 0.7 + 0.3 * Math.sin(t * 3);
  const glow = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, 58);
  const col = loot.kind === 'diamond' ? '80, 220, 255' : loot.kind === 'gold' ? '255, 205, 80' : '255, 140, 60';
  glow.addColorStop(0, `rgba(${col}, ${0.55 * pulse})`);
  glow.addColorStop(1, `rgba(${col}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, 58, 0, Math.PI * 2);
  ctx.fill();
  // Display case ring.
  ctx.strokeStyle = `rgba(${col}, 0.9)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, 26, 0, Math.PI * 2);
  ctx.stroke();
  if (loot.kind === 'diamond') {
    ctx.fillStyle = '#aee9ff';
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 14);
    ctx.lineTo(loot.x + 12, loot.y);
    ctx.lineTo(loot.x, loot.y + 14);
    ctx.lineTo(loot.x - 12, loot.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e6f7ff';
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 14);
    ctx.lineTo(loot.x + 12, loot.y);
    ctx.lineTo(loot.x - 12, loot.y);
    ctx.closePath();
    ctx.fill();
  } else if (loot.kind === 'gold') {
    ctx.fillStyle = '#ffd24d';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(loot.x + i * 13 - 6, loot.y - 6, 12, 12);
    }
    ctx.fillStyle = '#ffedb0';
    ctx.fillRect(loot.x - 19, loot.y - 6, 12, 4);
    ctx.fillRect(loot.x - 6, loot.y - 6, 12, 4);
    ctx.fillRect(loot.x + 7, loot.y - 6, 12, 4);
  } else {
    ctx.fillStyle = '#ff8c3c';
    roundRect(ctx, loot.x - 14, loot.y - 14, 28, 28, 5);
    ctx.fill();
    ctx.strokeStyle = '#ffd9b0';
    ctx.lineWidth = 2;
    roundRect(ctx, loot.x - 8, loot.y - 8, 16, 16, 3);
    ctx.stroke();
  }
  // Label.
  ctx.fillStyle = '#e8ecf8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.label, loot.x, loot.y + 48);
}

function drawExit(ctx, state, t) {
  const ex = state.def.exit;
  const open = state.exitOpen;
  const pulse = open ? 0.75 + 0.25 * Math.sin(t * 4) : 0.5;
  ctx.fillStyle = open ? `rgba(60, 220, 130, ${0.85 * pulse})` : 'rgba(120, 130, 160, 0.55)';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = open ? '#7dffa9' : '#8a90a8';
  ctx.lineWidth = 2;
  ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
  ctx.fillStyle = '#0a0c12';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  const cx = ex.x + ex.w / 2;
  const cy = ex.y + ex.h / 2;
  if (ex.w > ex.h) {
    ctx.fillText(open ? 'EXIT OPEN' : 'EXIT LOCKED', cx, cy + 4);
    ctx.fillStyle = '#e8ecf8';
    ctx.fillText(state.def.exit.label, cx, cy + 22 < 788 ? cy + 22 : cy - 10);
  } else {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(open ? 'EXIT OPEN' : 'EXIT LOCKED', 0, 4);
    ctx.restore();
    ctx.fillStyle = '#e8ecf8';
    ctx.fillText(state.def.exit.label, cx + 44, cy + 4);
  }
}

function drawGuard(ctx, g, walls, t) {
  const alerted = g.mode !== 'patrol';
  const fill = alerted ? 'rgba(255, 90, 60, 0.22)' : 'rgba(255, 200, 60, 0.18)';
  const edge = alerted ? 'rgba(255, 90, 60, 0.55)' : 'rgba(255, 200, 60, 0.45)';
  drawCone(ctx, g, g.angle, 195, 0.62, walls, fill, edge);
  // Body.
  ctx.fillStyle = '#2b3a67';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7d8fd0';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Facing tick + torch.
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
  ctx.stroke();
  ctx.fillStyle = '#e8ecf8';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(alerted ? '!' : '', g.x, g.y - 18);
  void t;
}

function drawCamera(ctx, cam, walls) {
  const fill = 'rgba(255, 60, 60, 0.15)';
  const edge = 'rgba(255, 60, 60, 0.5)';
  drawCone(ctx, cam, cam.angle, cam.range, 0.34, walls, fill, edge);
  ctx.fillStyle = '#1c1f2e';
  ctx.strokeStyle = '#ff5a5a';
  ctx.lineWidth = 2;
  roundRect(ctx, cam.x - 9, cam.y - 7, 18, 14, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff5a5a';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 8, cam.y + Math.sin(cam.angle) * 8, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, state, t) {
  const p = state.player;
  const bob = Math.sin(t * 6) * 1.5;
  ctx.fillStyle = 'rgba(45, 212, 191, 0.25)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14b8a6';
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob * 0.3, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Facing tick.
  ctx.strokeStyle = '#ccfbf1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.dir) * 16, p.y + Math.sin(p.dir) * 16);
  ctx.stroke();
  if (state.lootTaken) {
    ctx.fillStyle = '#aee9ff';
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y - 16);
    ctx.lineTo(p.x + 14, p.y - 8);
    ctx.lineTo(p.x + 8, p.y);
    ctx.lineTo(p.x + 2, p.y - 8);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCoin(ctx, coin) {
  if (!coin) return;
  ctx.fillStyle = '#ffd24d';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#0e1120';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#232842';
  ctx.fillRect(0, 62, W, 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('THE MARLOWE JOB', 16, 26);
  ctx.fillStyle = '#9aa3c0';
  ctx.font = '12px sans-serif';
  ctx.fillText(state.def.name, 16, 46);

  // Alarm meter.
  const ax = 470;
  const aw = 340;
  ctx.fillStyle = state.spotted ? '#ff5a5a' : '#e8ecf8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.spotted ? 'SPOTTED!' : 'ALARM', ax + aw / 2, 22);
  ctx.fillStyle = '#1c2138';
  roundRect(ctx, ax, 30, aw, 18, 9);
  ctx.fill();
  const frac = state.alarm / 100;
  const col = frac < 0.4 ? '#3ddc84' : frac < 0.7 ? '#f5c542' : '#ff5a5a';
  if (frac > 0.01) {
    ctx.fillStyle = col;
    roundRect(ctx, ax + 2, 32, Math.max(10, (aw - 4) * frac), 14, 7);
    ctx.fill();
  }
  ctx.strokeStyle = '#565e85';
  ctx.lineWidth = 1.5;
  roundRect(ctx, ax, 30, aw, 18, 9);
  ctx.stroke();

  // Right stats.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8ecf8';
  ctx.font = 'bold 14px sans-serif';
  const loot = `LOOT ${state.lootTotal}/3`;
  const lives = `LIVES ${'♥'.repeat(Math.max(0, state.lives))}${'·'.repeat(Math.max(0, 3 - state.lives))}`;
  ctx.fillText(`${loot}   ${lives}`, 1264, 26);
  ctx.fillStyle = '#9aa3c0';
  ctx.font = '12px sans-serif';
  ctx.fillText(`TIME ${fmtTime(state.time)}   COINS ${state.coinsLeft} (click to toss)`, 1264, 46);

  // Objective line.
  ctx.textAlign = 'left';
  ctx.fillStyle = state.lootTaken ? '#7dffa9' : '#ffd76a';
  ctx.font = '13px sans-serif';
  const obj = state.lootTaken
    ? 'Loot secured — reach the open exit!'
    : `Objective: grab the ${state.def.loot.label}  (walk over it and press E)`;
  ctx.fillText(obj, 16, 792);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6b7390';
  ctx.fillText('WASD / arrows move · Shift sneak · E grab · click toss a coin', 1264, 792);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText(title, W / 2, 300);
  ctx.fillStyle = '#e8ecf8';
  ctx.font = '18px sans-serif';
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, 350 + i * 30));
}

export function render(ctx, state, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0c12';
  ctx.fillRect(0, 0, W, H);
  drawFloor(ctx, t);
  drawLoot(ctx, state, t);
  drawExit(ctx, state, t);
  for (const cam of state.cameras) drawCamera(ctx, cam, state.def.walls);
  for (const g of state.guards) drawGuard(ctx, g, state.def.walls, t);
  drawCoin(ctx, state.coin);
  if (state.phase !== 'title') drawPlayer(ctx, state, t);
  drawWalls(ctx, state.def.walls);
  drawHud(ctx, state);

  // Red vignette while the alarm is high.
  if (state.alarm > 55 && state.phase === 'playing') {
    const a = ((state.alarm - 55) / 45) * (0.22 + 0.1 * Math.sin(t * 6));
    const grad = ctx.createRadialGradient(640, 430, 260, 640, 430, 720);
    grad.addColorStop(0, 'rgba(255, 40, 40, 0)');
    grad.addColorStop(1, `rgba(255, 40, 40, ${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  if (state.phase === 'title') {
    overlay(ctx, 'THE MARLOWE JOB', [
      'A top-down stealth heist in three rooms.',
      'Dodge the guards’ vision cones and the sweeping cameras.',
      'Grab the loot, then slip out the exit before the alarm maxes out.',
      '',
      'WASD / arrows — move    Shift — sneak    E — grab loot    Click — toss a coin',
      '',
      'Press any key or click to start',
    ], '#f5c542');
  } else if (state.phase === 'intro') {
    overlay(ctx, state.def.name, [state.def.subtitle, '', 'Get ready…'], '#f5c542');
  } else if (state.phase === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      'The alarm hit 100 and the guards closed in.',
      state.lives > 0 ? `${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left — the room resets.` : 'No lives left.',
    ], '#ff5a5a');
  } else if (state.phase === 'levelclear') {
    overlay(ctx, 'CLEAN GETAWAY', [
      `${state.def.loot.label} secured.`,
      state.levelIndex + 1 < LEVELS.length ? 'Next room…' : 'That was the last room…',
    ], '#7dffa9');
  } else if (state.phase === 'win') {
    overlay(ctx, 'THE JOB IS DONE', [
      `All three rooms cleaned in ${fmtTime(state.time)}.`,
      'The Marlowe collection is yours. No alarms, no witnesses — almost.',
      '',
      'Press R to run it again',
    ], '#7dffa9');
  } else if (state.phase === 'gameover') {
    overlay(ctx, 'THE JOB FAILED', [
      'The crew is in custody and the Marlowe collection stays put.',
      '',
      'Press R to try again',
    ], '#ff5a5a');
  }
}
