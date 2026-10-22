// Музыка арены, гул трибун и звуки — всё генерируется WebAudio, файлов нет
let AC, mus, noise, crowdG, timer = null, next = 0, step = 0, sfxOn = true, musicOn = true, low = false;
const f = m => 440 * Math.pow(2, (m - 69) / 12);
const ROOT = [45, 41, 48, 43];                       // Am F C G (басовые ноты)
const MEL = [69, 0, 72, 69, 76, 0, 72, 0, 65, 0, 69, 65, 72, 0, 69, 0, 72, 0, 76, 72, 79, 0, 76, 0, 74, 0, 71, 74, 79, 0, 74, 0];
let vol = 1;
const level = () => musicOn ? (low ? .2 : 1) * .6 * vol : 0;
function init() {
  if (AC) return true;
  try { AC = new AudioContext() } catch (e) { return false }
  mus = AC.createGain(); mus.gain.value = level(); mus.connect(AC.destination);
  noise = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++)d[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(); s.buffer = noise; s.loop = true;                    // гул трибун
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = .4;
  crowdG = AC.createGain(); crowdG.gain.value = .05; s.connect(bp); bp.connect(crowdG); crowdG.connect(mus); s.start();
  return true;
}
function tone(fr, t, d, type, v) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = fr;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(mus); o.start(t); o.stop(t + d + .02)
}
function hat(t, d, v, fq) {
  const s = AC.createBufferSource(); s.buffer = noise; const h = AC.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = fq;
  const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(h); h.connect(g); g.connect(mus); s.start(t, Math.random(), d + .02)
}
function kick(t) {
  const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
  g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g); g.connect(mus); o.start(t); o.stop(t + .2)
}
function sched() {
  while (next < AC.currentTime + .2) {
    const i = step & 7, t = next;
    tone(f(ROOT[step >> 3] + (i % 2 ? 12 : 0)), t, .16, 'triangle', .16);                    // бас
    if (i % 4 == 0) kick(t);
    if (i == 2 || i == 6) hat(t, .12, .12, 1500); else hat(t, .04, .05, 6000);                // «хлопок» и хэт
    if (MEL[step]) tone(f(MEL[step]), t, .18, 'square', .045);                       // мелодия
    next += .2; step = (step + 1) % 32;
  }
}
export function startMusic() {
  if (!init()) return; if (AC.state === 'suspended') AC.resume();
  if (timer) return; next = AC.currentTime + .1; step = 0; timer = setInterval(sched, 50);
}
const apply = () => { if (mus) mus.gain.setTargetAtTime(level(), AC.currentTime, .08) };
export const setMusic = on => { musicOn = on; apply() };
export const setVol = v => { vol = v; apply() };
export const setLow = v => { low = v; apply() };
export const setSfx = on => { sfxOn = on };
export const hold = h => { if (AC) h ? AC.suspend() : AC.resume() };
export function beep(fr, d = .1, type = 'square', v = .04) {
  if (!sfxOn || !init()) return; if (AC.state === 'suspended') AC.resume();
  const o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime; o.type = type; o.frequency.value = fr;
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(n + d);
}
export function cheer(k = 1) {                      // трибуны ревут
  if (!crowdG || !sfxOn) return; const n = AC.currentTime;
  crowdG.gain.cancelScheduledValues(n); crowdG.gain.setTargetAtTime(.05 + .12 * k, n, .05); crowdG.gain.setTargetAtTime(.05, n + .5, .4);
}
export function horn() { beep(220, .6, 'sawtooth', .06); beep(277, .6, 'sawtooth', .05); beep(330, .8, 'sawtooth', .05) }
