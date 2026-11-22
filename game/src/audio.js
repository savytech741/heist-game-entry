// Tiny procedural sound effects with WebAudio — no audio files, no network.
// Created lazily on the first user gesture (browsers block audio before that).
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.12);
    setTimeout(() => this.tone(990, 0.18, 'sine', 0.12), 70);
  }

  coin() {
    this.tone(1200, 0.08, 'triangle', 0.1, 900);
  }

  alarmTick() {
    this.tone(220, 0.1, 'square', 0.05, 180);
  }

  caught() {
    this.tone(320, 0.5, 'sawtooth', 0.14, 70);
  }

  levelClear() {
    [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'sine', 0.12), i * 90));
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'sine', 0.12), i * 120));
  }
}
