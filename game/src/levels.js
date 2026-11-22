// Level layouts for THE MARLOWE JOB. Canvas is 1280x800; the HUD occupies the
// top 64px, so the play area is x 12..1268, y 76..788. Walls are rectangles the
// thief, guards and line-of-sight all respect. Patrol waypoints run in open lanes.
export const PLAY = { x: 12, y: 76, w: 1256, h: 712 };

export const LEVELS = [
  {
    name: 'LEVEL 1 — THE GALLERY',
    subtitle: 'Marlowe Museum, west wing. Lift the Star of Marlowe.',
    spawn: { x: 80, y: 720 },
    loot: { x: 640, y: 330, kind: 'diamond', label: 'STAR OF MARLOWE' },
    exit: { x: 1150, y: 76, w: 100, h: 30, label: 'SERVICE DOOR' },
    coins: 3,
    walls: [
      { x: 280, y: 190, w: 150, h: 80 }, // display case A
      { x: 850, y: 190, w: 150, h: 80 }, // display case B
      { x: 520, y: 580, w: 240, h: 36 }, // bench
      { x: 180, y: 480, w: 60, h: 60 }, // pillar
      { x: 1040, y: 480, w: 60, h: 60 }, // pillar
    ],
    guards: [
      { waypoints: [[120, 160], [120, 700]], speed: 62, pause: 0.9 },
      { waypoints: [[1160, 160], [1160, 700]], speed: 62, pause: 0.9 },
    ],
    cameras: [
      { x: 640, y: 78, baseAngle: Math.PI / 2, sweep: 0.65, speed: 0.55, range: 330 },
    ],
  },
  {
    name: 'LEVEL 2 — THE VAULT CORRIDOR',
    subtitle: 'Basement corridor. The gold bars are in the middle of the floor.',
    spawn: { x: 1200, y: 140 },
    loot: { x: 640, y: 420, kind: 'gold', label: 'MARLOWE GOLD' },
    exit: { x: 30, y: 748, w: 110, h: 40, label: 'STAIRWELL' },
    coins: 3,
    walls: [
      { x: 560, y: 100, w: 160, h: 90 }, // strongroom door block
      { x: 400, y: 240, w: 70, h: 70 }, // pillar
      { x: 810, y: 240, w: 70, h: 70 }, // pillar
      { x: 400, y: 540, w: 70, h: 70 }, // pillar
      { x: 810, y: 540, w: 70, h: 70 }, // pillar
      { x: 150, y: 350, w: 90, h: 90 }, // crates
      { x: 1040, y: 350, w: 90, h: 90 }, // crates
    ],
    guards: [
      { waypoints: [[180, 230], [1100, 230]], speed: 70, pause: 0.7 },
      { waypoints: [[180, 660], [1100, 660]], speed: 70, pause: 0.7 },
    ],
    cameras: [
      { x: 640, y: 78, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.7, range: 340 },
      { x: 14, y: 420, baseAngle: 0, sweep: 0.55, speed: 0.5, range: 320 },
    ],
  },
  {
    name: 'LEVEL 3 — THE VAULT',
    subtitle: 'The vault itself. Take the core, then slip out the west door.',
    spawn: { x: 1200, y: 720 },
    loot: { x: 640, y: 530, kind: 'vault', label: 'VAULT CORE' },
    exit: { x: 12, y: 380, w: 30, h: 110, label: 'WEST DOOR' },
    coins: 4,
    walls: [
      { x: 540, y: 300, w: 200, h: 200 }, // the vault block
      { x: 250, y: 200, w: 70, h: 70 }, // pillar
      { x: 960, y: 200, w: 70, h: 70 }, // pillar
      { x: 250, y: 600, w: 70, h: 70 }, // pillar
      { x: 960, y: 600, w: 70, h: 70 }, // pillar
    ],
    guards: [
      { waypoints: [[200, 150], [1080, 150]], speed: 78, pause: 0.6 },
      { waypoints: [[200, 700], [1080, 700]], speed: 78, pause: 0.6 },
      { waypoints: [[380, 260], [900, 260], [900, 660], [380, 660]], speed: 66, pause: 0.5 },
    ],
    cameras: [
      { x: 640, y: 78, baseAngle: Math.PI / 2, sweep: 0.75, speed: 0.8, range: 350 },
      { x: 14, y: 400, baseAngle: 0, sweep: 0.6, speed: 0.6, range: 330 },
    ],
  },
];
