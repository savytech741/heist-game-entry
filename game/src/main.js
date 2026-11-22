// THE MARLOWE JOB — game loop and screen flow.
// Runs in a desktop browser from static files, no network requests.
import { createGame, updateGame, advancePhase } from './sim.js';
import { render } from './render.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { poseForShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const sfx = new Sfx();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
let state = createGame(0);
let frozen = false;

if (shot) {
  // Screenshot pose: render one fixed frame and hold it.
  const posed = poseForShot(shot);
  if (posed) {
    state = posed;
    frozen = true;
  }
} else {
  state.phase = 'title';
}

let last = performance.now();
let t = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  t += dt;

  if (!frozen) {
    sfx.ensure();
    if (state.phase === 'title') {
      if (input.consumeAnyKey() || input.consumeClick()) {
        state.phase = 'intro';
        state.phaseT = 0;
      }
    } else if (state.phase === 'intro' || state.phase === 'caught' || state.phase === 'levelclear') {
      advancePhase(state, dt);
    } else if (state.phase === 'playing') {
      updateGame(state, input, dt, sfx);
    } else if (state.phase === 'win' || state.phase === 'gameover') {
      if (input.down('r')) {
        state = createGame(0);
        state.phase = 'intro';
        state.phaseT = 0;
      }
      input.consumeAnyKey();
      input.consumeClick();
    }
  }

  render(ctx, state, t);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
