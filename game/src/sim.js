// Game simulation for THE MARLOWE JOB: movement, collisions, guard patrols,
// camera sweeps, vision cones, the alarm meter and win/lose flow.
// Pure logic — rendering lives in render.js.
import { LEVELS, PLAY } from './levels.js';
import { clamp, dist, angleTo, angleDiff, hasLineOfSight, pushCircleOutOfRect } from './random.js';

export const PLAYER_R = 12;
export const WALK_SPEED = 175;
export const SNEAK_SPEED = 88;
export const GUARD_CONE_RANGE = 195;
export const GUARD_CONE_HALF = 0.62; // ~35 degrees
export const ALARM_MAX = 100;

export function createGame(levelIndex) {
  const def = LEVELS[levelIndex];
  return {
    levelIndex,
    def,
    phase: 'intro',
    phaseT: 0,
    time: 0,
    lives: 3,
    lootTotal: 0,
    alarm: 0,
    spotted: false,
    spotT: 0,
    lastSeen: null,
    lootTaken: false,
    exitOpen: false,
    coinsLeft: def.coins,
    coin: null, // {x, y, t} a thrown coin on the floor
    player: { x: def.spawn.x, y: def.spawn.y, dir: -Math.PI / 2 },
    guards: def.guards.map((g) => ({
      waypoints: g.waypoints,
      speed: g.speed,
      pause: g.pause,
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      angle: 0,
      wp: 1 % g.waypoints.length,
      pauseT: 0,
      mode: 'patrol',
      investT: 0,
      target: null,
    })),
    cameras: def.cameras.map((c) => ({ ...c, angle: c.baseAngle, t: 0 })),
  };
}

function moveCircleWithWalls(p, dx, dy, walls) {
  // Axis-separated movement so the player slides along walls.
  let x = p.x + dx;
  let y = p.y;
  for (const w of walls) {
    const hit = pushCircleOutOfRect(x, y, PLAYER_R, w);
    if (hit) { x = hit.x; y = hit.y; }
  }
  x = clamp(x, PLAY.x + PLAYER_R, PLAY.x + PLAY.w - PLAYER_R);
  y = clamp(y, PLAY.y + PLAYER_R, PLAY.y + PLAY.h - PLAYER_R);
  p.x = x;
  p.y = y;
  x = p.x;
  y = p.y + dy;
  for (const w of walls) {
    const hit = pushCircleOutOfRect(x, y, PLAYER_R, w);
    if (hit) { x = hit.x; y = hit.y; }
  }
  x = clamp(x, PLAY.x + PLAYER_R, PLAY.x + PLAY.w - PLAYER_R);
  y = clamp(y, PLAY.y + PLAYER_R, PLAY.y + PLAY.h - PLAYER_R);
  p.x = x;
  p.y = y;
}

function seesPlayer(eye, range, halfAngle, state) {
  const p = state.player;
  const d = dist(eye.x, eye.y, p.x, p.y);
  if (d > range) return 0;
  const ang = angleTo(eye.x, eye.y, p.x, p.y);
  if (Math.abs(angleDiff(ang, eye.angle)) > halfAngle) return 0;
  if (!hasLineOfSight(eye.x, eye.y, p.x, p.y, state.def.walls)) return 0;
  // Closer and more centred = faster alarm fill. 0..1.
  const closeness = 1 - d / range;
  const centred = 1 - Math.abs(angleDiff(ang, eye.angle)) / halfAngle;
  return closeness * 0.5 + centred * 0.5;
}

export function updateGame(state, input, dt, sfx) {
  dt = Math.min(dt, 0.05);
  state.phaseT += dt;
  if (state.phase === 'playing') state.time += dt;

  // Cameras always sweep.
  for (const cam of state.cameras) {
    cam.t += dt;
    cam.angle = cam.baseAngle + Math.sin(cam.t * cam.speed) * cam.sweep;
  }

  if (state.phase !== 'playing') return;

  const p = state.player;
  const mv = input.moveVector();
  const sneaking = input.sneaking();
  const speed = sneaking ? SNEAK_SPEED : WALK_SPEED;
  if (mv.x !== 0 || mv.y !== 0) {
    p.dir = Math.atan2(mv.y, mv.x);
    moveCircleWithWalls(p, mv.x * speed * dt, mv.y * speed * dt, state.def.walls);
  }

  // Coin toss: click within reach, costs one coin.
  const click = input.consumeClick();
  if (click && state.coinsLeft > 0 && dist(p.x, p.y, click.x, click.y) <= 300) {
    let cx = clamp(click.x, PLAY.x + 8, PLAY.x + PLAY.w - 8);
    let cy = clamp(click.y, PLAY.y + 8, PLAY.y + PLAY.h - 8);
    for (const w of state.def.walls) {
      const hit = pushCircleOutOfRect(cx, cy, 10, w);
      if (hit) { cx = hit.x; cy = hit.y; }
    }
    state.coin = { x: cx, y: cy, t: 0 };
    state.coinsLeft -= 1;
    sfx.coin();
    for (const g of state.guards) {
      if (g.mode === 'patrol' && dist(g.x, g.y, cx, cy) < 280) {
        g.mode = 'investigate';
        g.target = { x: cx, y: cy };
        g.investT = 0;
      }
    }
  }
  if (state.coin) {
    state.coin.t += dt;
    if (state.coin.t > 9) state.coin = null;
  }

  // Grab the loot with E.
  if (!state.lootTaken && input.down('e') && dist(p.x, p.y, state.def.loot.x, state.def.loot.y) < 52) {
    state.lootTaken = true;
    state.exitOpen = true;
    state.lootTotal += 1;
    sfx.pickup();
  }

  // Reach the open exit.
  if (state.exitOpen) {
    const ex = state.def.exit;
    if (p.x > ex.x - 6 && p.x < ex.x + ex.w + 6 && p.y > ex.y - 6 && p.y < ex.y + ex.h + 6) {
      state.phase = 'levelclear';
      state.phaseT = 0;
      sfx.levelClear();
      return;
    }
  }

  // ---- Detection: guards and cameras fill the alarm meter. ----
  let strongest = 0;
  for (const g of state.guards) {
    const v = seesPlayer(g, GUARD_CONE_RANGE, GUARD_CONE_HALF, state);
    if (v > 0) {
      strongest = Math.max(strongest, v);
      state.lastSeen = { x: p.x, y: p.y };
    }
  }
  for (const cam of state.cameras) {
    const v = seesPlayer(cam, cam.range, 0.34, state) * 1.35;
    if (v > 0) {
      strongest = Math.max(strongest, v);
      state.lastSeen = { x: p.x, y: p.y };
    }
  }
  const wasSpotted = state.spotted;
  state.spotted = strongest > 0;
  if (state.spotted) {
    const rate = (sneaking ? 11 : 26) * strongest + 4;
    state.alarm = clamp(state.alarm + rate * dt, 0, ALARM_MAX);
    state.spotT += dt;
    if (state.spotT > 0.55) {
      state.spotT = 0;
      sfx.alarmTick();
    }
    if (state.alarm > 55) {
      for (const g of state.guards) {
        if (g.mode === 'patrol') { g.mode = 'chase'; g.target = { ...state.lastSeen }; }
      }
    }
  } else {
    state.alarm = clamp(state.alarm - 7 * dt, 0, ALARM_MAX);
    if (state.alarm < 25) {
      for (const g of state.guards) {
        if (g.mode === 'chase') { g.mode = 'patrol'; g.target = null; }
      }
    }
  }
  if (!wasSpotted && state.spotted) state.spotT = 0;

  if (state.alarm >= ALARM_MAX) {
    state.phase = 'caught';
    state.phaseT = 0;
    state.lives -= 1;
    sfx.caught();
    return;
  }

  // ---- Guards move. ----
  for (const g of state.guards) {
    const target = g.mode === 'patrol'
      ? { x: g.waypoints[g.wp][0], y: g.waypoints[g.wp][1] }
      : g.target;
    if (!target) continue;
    if (g.mode === 'patrol' && g.pauseT > 0) {
      g.pauseT -= dt;
      continue;
    }
    const d = dist(g.x, g.y, target.x, target.y);
    const spd = g.mode === 'chase' ? g.speed * 1.55 : g.speed;
    if (d < 6) {
      if (g.mode === 'patrol') {
        g.wp = (g.wp + 1) % g.waypoints.length;
        g.pauseT = g.pause;
      } else if (g.mode === 'investigate') {
        g.investT += dt;
        g.angle += dt * 1.8;
        if (g.investT > 2.2) { g.mode = 'patrol'; g.target = null; }
      } else {
        g.mode = 'patrol';
        g.target = null;
      }
      continue;
    }
    const step = Math.min(d, spd * dt);
    const nx = g.x + ((target.x - g.x) / d) * step;
    const ny = g.y + ((target.y - g.y) / d) * step;
    g.angle = Math.atan2(ny - g.y, nx - g.x);
    g.x = nx;
    g.y = ny;
  }
}

// Advance phase timers that main.js polls (intro / caught / levelclear).
export function advancePhase(state, dt) {
  state.phaseT += dt;
  if (state.phase === 'intro' && state.phaseT > 2.4) {
    state.phase = 'playing';
    state.phaseT = 0;
  } else if (state.phase === 'caught' && state.phaseT > 1.7) {
    if (state.lives <= 0) {
      state.phase = 'gameover';
      state.phaseT = 0;
    } else {
      const keep = { lives: state.lives, lootTotal: state.lootTotal, time: state.time };
      const fresh = createGame(state.levelIndex);
      Object.assign(state, fresh, keep, { phase: 'intro', phaseT: 0 });
    }
  } else if (state.phase === 'levelclear' && state.phaseT > 1.6) {
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.phase = 'win';
      state.phaseT = 0;
    } else {
      const keep = { lives: state.lives, lootTotal: state.lootTotal, time: state.time };
      const fresh = createGame(state.levelIndex + 1);
      Object.assign(state, fresh, keep, { phase: 'intro', phaseT: 0 });
    }
  }
}
