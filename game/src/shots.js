// Fixed poses for screenshots: ?shot=start|play|alarm|vault (seed is ignored —
// every pose is fully deterministic so re-renders match).
// Each pose returns the phase and the state overrides to apply after createGame.
import { createGame } from './sim.js';

export function poseForShot(shot) {
  if (shot === 'start') {
    const s = createGame(0);
    s.phase = 'title';
    s.phaseT = 0;
    return s;
  }
  if (shot === 'play') {
    const s = createGame(0);
    s.phase = 'playing';
    s.phaseT = 0;
    s.time = 42;
    // Thief mid-room, crossing between the two display cases.
    s.player.x = 640;
    s.player.y = 470;
    s.player.dir = -Math.PI / 2;
    // Guard 1 patrols the left lane, cone sweeping across the room.
    s.guards[0].x = 120;
    s.guards[0].y = 380;
    s.guards[0].angle = 0.5;
    s.guards[0].wp = 1;
    // Guard 2 on the right lane, facing down the room.
    s.guards[1].x = 1160;
    s.guards[1].y = 300;
    s.guards[1].angle = Math.PI / 2 + 0.4;
    s.guards[1].wp = 1;
    // Camera mid-sweep, cone reaching toward the thief.
    s.cameras[0].t = 1.9;
    s.cameras[0].angle = Math.PI / 2 + 0.45;
    s.alarm = 22;
    s.spotted = false;
    return s;
  }
  if (shot === 'alarm') {
    const s = createGame(1);
    s.phase = 'playing';
    s.phaseT = 0;
    s.time = 96;
    s.lootTaken = false;
    // Thief caught in the open, centre floor.
    s.player.x = 640;
    s.player.y = 420;
    s.player.dir = Math.PI;
    // Guard 1 charging in from the left, cone dead on the thief.
    s.guards[0].x = 420;
    s.guards[0].y = 420;
    s.guards[0].angle = 0;
    s.guards[0].mode = 'chase';
    s.guards[0].target = { x: 640, y: 420 };
    // Guard 2 closing from below.
    s.guards[1].x = 640;
    s.guards[1].y = 660;
    s.guards[1].angle = -Math.PI / 2;
    s.guards[1].mode = 'chase';
    s.guards[1].target = { x: 640, y: 420 };
    // Camera locked on the thief.
    s.cameras[0].t = 2.6;
    s.cameras[0].angle = Math.PI / 2 + 0.2;
    s.cameras[1].t = 1.2;
    s.cameras[1].angle = 0.35;
    s.alarm = 86;
    s.spotted = true;
    s.lastSeen = { x: 640, y: 420 };
    return s;
  }
  if (shot === 'vault') {
    const s = createGame(2);
    s.phase = 'playing';
    s.phaseT = 0;
    s.time = 178;
    s.lootTotal = 2;
    s.lootTaken = true;
    s.exitOpen = true;
    // Thief has the core and is slipping toward the west door.
    s.player.x = 330;
    s.player.y = 420;
    s.player.dir = Math.PI;
    // Guards on patrol around the vault, cones visible.
    s.guards[0].x = 700;
    s.guards[0].y = 150;
    s.guards[0].angle = Math.PI;
    s.guards[1].x = 560;
    s.guards[1].y = 700;
    s.guards[1].angle = 0;
    s.guards[2].x = 900;
    s.guards[2].y = 460;
    s.guards[2].angle = Math.PI / 2;
    s.guards[2].wp = 2;
    // Cameras sweeping.
    s.cameras[0].t = 0.8;
    s.cameras[0].angle = Math.PI / 2 - 0.5;
    s.cameras[1].t = 2.1;
    s.cameras[1].angle = -0.3;
    s.alarm = 12;
    s.spotted = false;
    s.coinsLeft = 2;
    return s;
  }
  return null;
}
