import { LEVELS } from './level.js';
import { Player, skater, AMUR } from './player.js';
import { Input } from './input.js';
import { beep, cheer, horn } from './audio.js';
import { loadName, loadScores, addScore } from './utils.js';
const FD = '"Russo One",Impact,sans-serif', FB = 'Oswald,"Arial Narrow",sans-serif';
const hit = (a, b) => a.x < b[0] + b[2] && a.x + a.w > b[0] && a.y < b[1] + b[3] && a.y + a.h > b[1];
const CROWD = ['#e63946', '#f1faee', '#ffd23f', '#4da3ff', '#2fb36a'];
export class Game {
  constructor(canvas, onState) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.onState = onState; this.input = new Input(); this.p = new Player(0);
    this.name = loadName(); this.scores = loadScores(); this.best = this.scores[0] ? this.scores[0].score : 0;
    this.state = 'title'; this.T = 0; this.parts = []; this.last = null; this.lvl = 0; this.lives = 3; this.score = 0; this.msgT = 0; this.inv = 0; this.newRec = false;
    this.touch = matchMedia('(pointer:coarse)').matches;
    this.resize(); addEventListener('resize', () => this.resize()); this.load(0);
    this.loop = t => {
      requestAnimationFrame(this.loop);          // единственный цикл на всю игру
      const dt = this.last == null ? 0 : Math.min((t - this.last) / 1000, .05); this.last = t; this.T++;
      if (this.state === 'play') this.update(dt); this.fx(); this.draw()
    };
    requestAnimationFrame(this.loop);
  }
  resize() { // игра занимает весь экран: по высоте всегда видно 540 единиц, по ширине — сколько поместится
    const d = Math.min(devicePixelRatio || 1, 2), cw = Math.max(2, Math.round(innerWidth * d)), ch = Math.max(2, Math.round(innerHeight * d));
    this.c.width = cw; this.c.height = ch; this.S = Math.min(ch / 540, cw / 720); this.W = cw / this.S; this.Hl = ch / this.S; this.oy = Math.max(0, (this.Hl - 540) / 2);
    document.documentElement.style.setProperty('--u', (this.S / d) + 'px');
  }
  setState(s) { this.state = s; if (s === 'play') this.last = null; this.onState(s) }  // после паузы время кадра сбрасывается
  load(i) {
    const L = this.L = LEVELS[i]; this.cpI = 0; this.got = 0; this.inv = 0;
    this.pucks = L.pucks.map(a => ({ x: a[0], y: a[1], on: 1 })); this.foes = L.foes.map(a => ({ x: a[0] + 30, min: a[0], max: a[1], d: 1, on: 1 })); this.p.reset(L.cp[0])
  }
  newGame() { this.lives = 3; this.score = 0; this.lvl = 0; this.newRec = false; this.parts = []; this.load(0); this.input.clear(); this.setState('play') }
  pause() { if (this.state === 'play') { this.input.clear(); this.setState('pause') } else if (this.state === 'pause') this.setState('play') }
  autoPause() { if (this.state === 'play') this.pause() }
  toMenu() { this.input.clear(); this.setState('title') }
  flash(m) { this.msg = m; this.msgT = 2.4 }
  boom(px, py, n, cols) { for (let i = 0; i < n; i++)this.parts.push({ x: px, y: py, vx: (Math.random() - .5) * 9, vy: -Math.random() * 9, l: 60 + Math.random() * 30, c: cols[i % cols.length] }) }
  end(s) { this.newRec = this.score > this.best; this.scores = addScore(this.name, this.score); this.best = this.scores[0] ? this.scores[0].score : 0; this.setState(s) }
  die() { beep(120, .35, 'sawtooth'); if (--this.lives <= 0) return this.end('lose'); this.p.reset(this.L.cp[this.cpI]); this.inv = 1.5 }
  update(dt) {
    const p = this.p, L = this.L; this.msgT -= dt; this.inv -= dt;
    p.update(dt, this.input, L.plat);
    if (p.jumped) { p.jumped = false; beep(560, .12) }
    if (p.x < 0) { p.x = 0; p.vx = 0 }
    if (p.y > 600) return this.die();
    L.cp.forEach((c, i) => { if (p.x > c + 20 && this.cpI < i) { this.cpI = i; beep(880, .15); this.flash('Контрольная точка!') } });
    if (p.g && Math.abs(p.vx) > 200 && this.T % 4 == 0) this.parts.push({ x: p.x + 14, y: p.y + 46, vx: -p.vx * .004, vy: -1, l: 20, c: '#fff' });
    for (const u of this.pucks) if (u.on && Math.abs(u.x - p.x - 14) < 24 && Math.abs(u.y - p.y - 23) < 34) { u.on = 0; this.got++; this.score += 100; beep(988, .08); beep(1318, .15); cheer(.5); this.boom(u.x, u.y, 12, ['#ffd23f', '#fff']) }
    if (this.inv <= 0) for (const s of L.spikes) if (hit(p, [s[0] + 8, s[1], s[2] - 16, s[3]])) return this.die();
    for (const f of this.foes) {
      if (!f.on) continue; f.x += f.d * 80 * dt; if (f.x < f.min || f.x > f.max) f.d *= -1;
      if (hit(p, [f.x, 420, 28, 40])) {
        if (p.vy > 0 && p.y + p.h < 440) { f.on = 0; p.vy = -620; this.score += 50; beep(300, .15); this.boom(f.x + 14, 430, 14, ['#ff7a00', '#fff']) }
        else if (this.inv <= 0) return this.die()
      }
    }
    if (p.x > L.fin) {
      if (this.got < this.pucks.length) { p.x = L.fin - 6; p.vx = -120; this.flash('Собери все шайбы! Осталось: ' + (this.pucks.length - this.got)) }
      else if (this.lvl < LEVELS.length - 1) { this.score += 300; this.load(++this.lvl); this.lives = 3; this.flash('Уровень ' + (this.lvl + 1) + '! Жизни восстановлены'); cheer(.8); beep(784, .2); beep(1046, .3) }
      else { this.score += 300 + this.lives * 200; horn(); cheer(1); this.boom(p.x, 300, 60, ['#ffd23f', '#ff4d5e', '#fff', '#4da3ff']); this.end('win') }
    }
  }
  fx() {
    for (const q of this.parts) { q.x += q.vx; q.y += q.vy; q.vy += .25; q.l-- } this.parts = this.parts.filter(q => q.l > 0);
    if (this.state === 'win' && this.T % 6 == 0) this.boom(this.p.x - 300 + Math.random() * 600, 0, 4, ['#ffd23f', '#ff4d5e', '#fff', '#4da3ff'])
  }
  t(s, px, py, sz, col, al = 'center', f = FD) { const x = this.x; x.font = (f === FB ? '500 ' : '') + sz + 'px ' + f; x.textAlign = al; x.fillStyle = col; x.fillText(s, px, py) }
  heart(cx, cy, s, on) {
    const x = this.x; x.beginPath(); x.moveTo(cx, cy + s); x.bezierCurveTo(cx - 2 * s, cy - .2 * s, cx - 1.1 * s, cy - 1.5 * s, cx, cy - .5 * s); x.bezierCurveTo(cx + 1.1 * s, cy - 1.5 * s, cx + 2 * s, cy - .2 * s, cx, cy + s);
    if (on) { x.fillStyle = '#ff4d5e'; x.fill() } x.lineWidth = 2; x.strokeStyle = on ? '#ffb3bb' : 'rgba(255,255,255,.35)'; x.stroke()
  }
  draw() {
    const x = this.x, p = this.p, L = this.L, T = this.T, W = this.W, cam = Math.max(0, Math.min(L.len - W, p.x - W * .4)), o = -cam * .35;
    x.setTransform(this.S, 0, 0, this.S, 0, 0);
    let g = x.createLinearGradient(0, 0, 0, this.Hl); g.addColorStop(0, '#071a33'); g.addColorStop(1, '#12396b'); x.fillStyle = g; x.fillRect(0, 0, W, this.Hl);
    x.save(); x.translate(0, this.oy);
    x.globalAlpha = .55;                                                                      // трибуны
    for (let i = -1; i < W / 24 + 2; i++) { const cx = i * 24 + (o % 24); for (let j = 0; j < 7; j++) { x.fillStyle = CROWD[Math.abs(Math.floor((i * 24 - o) / 24) * 7 + j * 13) % 5]; x.beginPath(); x.arc(cx, 120 + j * 30, 8, 0, 7); x.fill(); x.fillStyle = '#e9c9a8'; x.beginPath(); x.arc(cx, 108 + j * 30, 5, 0, 7); x.fill() } }
    x.globalAlpha = 1;
    for (let k = 0; k < 5; k++) { const m = ((k * 900 + 300 + o) % 4500 + 4500) % 4500 - 300; x.fillStyle = '#1f58d6'; x.fillRect(m, 60, 340, 40); x.fillStyle = '#fff'; x.fillRect(m, 60, 340, 4); this.t('ВПЕРЁД, ' + this.name.toUpperCase() + '!', m + 170, 90, 24, '#fff') }
    x.save(); x.translate(-cam, 0);
    for (const b of L.plat) { g = x.createLinearGradient(0, b[1], 0, b[1] + Math.min(b[3], 80)); g.addColorStop(0, '#f2fbff'); g.addColorStop(.12, '#bfe6ff'); g.addColorStop(1, '#4a8fd0'); x.fillStyle = g; x.fillRect(b[0], b[1], b[2], b[3]); x.fillStyle = '#fff'; x.fillRect(b[0], b[1], b[2], 3) }
    const rep = s => s.replace('{move}', this.touch ? 'Кнопки ◀ ▶' : '← →  или  A D').replace('{jump}', this.touch ? 'Кнопка ПРЫЖОК' : 'ПРОБЕЛ / W / ↑');
    for (const s of L.signs) {
      x.font = '500 14px ' + FB; const a = rep(s[1]), w = Math.max(x.measureText(a).width, x.measureText(s[2]).width) + 24;   // указатели-подсказки
      x.fillStyle = '#5a3a1a'; x.fillRect(s[0] - 3, 420, 6, 40); x.fillStyle = '#8a5a2b'; x.fillRect(s[0] - w / 2, 378, w, 44); x.strokeStyle = '#4a2f14'; x.lineWidth = 2; x.strokeRect(s[0] - w / 2, 378, w, 44);
      this.t(a, s[0], 397, 14, '#ffe9b8', 'center', FB); this.t(s[2], s[0], 414, 13, '#fff', 'center', FB)
    }
    x.fillStyle = '#e8f6ff'; for (const s of L.spikes) { const n = Math.floor(s[2] / 12), w = s[2] / n; for (let k = 0; k < n; k++) { x.beginPath(); x.moveTo(s[0] + k * w, s[1] + s[3]); x.lineTo(s[0] + k * w + w / 2, s[1]); x.lineTo(s[0] + (k + 1) * w, s[1] + s[3]); x.fill() } }
    L.cp.forEach((c, i) => { if (!i) return; x.fillStyle = this.cpI >= i ? '#ffd23f' : '#8aa'; x.fillRect(c + 10, 400, 3, 60); x.beginPath(); x.moveTo(c + 13, 400); x.lineTo(c + 40, 410); x.lineTo(c + 13, 420); x.fill() });
    const nx = L.fin; x.fillStyle = '#ff3b4e'; x.fillRect(nx, 390, 6, 70); x.fillRect(nx, 390, 64, 6); x.fillRect(nx + 58, 390, 6, 70);
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(nx + 6 + i * 6, 396); x.lineTo(nx + 6 + i * 6, 460); x.stroke() }
    for (let j = 0; j < 6; j++) { x.beginPath(); x.moveTo(nx + 6, 404 + j * 11); x.lineTo(nx + 58, 404 + j * 11); x.stroke() }
    this.t('ФИНИШ', nx + 32, 370, 26, '#ffd23f');
    for (const u of this.pucks) if (u.on) { const y = u.y + Math.sin(T * .07 + u.x) * 4; x.fillStyle = '#111'; x.beginPath(); x.ellipse(u.x, y, 13, 8, 0, 0, 7); x.fill(); x.fillStyle = '#ffd23f'; x.beginPath(); x.ellipse(u.x, y - 3, 13, 7, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(u.x - 4, y - 5, 4, 2, 0, 0, 7); x.fill() }
    for (const f of this.foes) if (f.on) skater(x, f.x + 14, 460, f.d, 1, T, AMUR, '#151515', '#5a3a22', 1);
    if (!(this.inv > 0 && T % 8 < 4)) p.draw(x, T);
    for (const q of this.parts) { x.fillStyle = q.c; x.fillRect(q.x, q.y, 5, 5) }
    x.restore();
    if (this.msgT > 0 && this.state === 'play') { x.globalAlpha = Math.min(1, this.msgT * 2); x.font = '30px ' + FD; x.textAlign = 'center'; x.lineWidth = 6; x.strokeStyle = 'rgba(5,15,35,.85)'; x.strokeText(this.msg, W / 2, 110); x.fillStyle = '#fff'; x.fillText(this.msg, W / 2, 110); x.globalAlpha = 1 }
    x.restore();
    if (this.state === 'title') return;
    x.fillStyle = 'rgba(5,15,35,.72)'; x.fillRect(0, 0, W, 48);                                   // панель
    this.t(this.name.toUpperCase(), 16, 24, 20, '#fff', 'left'); this.t('Кристал · уровень ' + (this.lvl + 1), 16, 42, 14, '#79cfff', 'left', FB);
    const px = W * .36; x.fillStyle = '#7a4d00'; x.beginPath(); x.ellipse(px - 34, 29, 12, 6, 0, 0, 7); x.fill(); x.fillStyle = '#ffd23f'; x.beginPath(); x.ellipse(px - 34, 26, 12, 6, 0, 0, 7); x.fill();
    this.t(this.got + ' / ' + this.pucks.length, px - 14, 33, 22, '#ffd23f', 'left');
    for (let i = 0; i < 3; i++)this.heart(W * .52 - 30 + i * 30, 24, 8, i < this.lives);
    this.t('СЧЁТ ' + this.score, W - 120, 26, 20, '#fff', 'right'); this.t('Рекорд ' + this.best, W - 120, 43, 14, '#79cfff', 'right', FB);
  }
}
