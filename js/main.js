import { Game } from './game.js';
import * as A from './audio.js';
import { saveName, loadSettings, saveSettings } from './utils.js';
const $ = id => document.getElementById(id), ui = $('ui'), nameIn = $('name'), SUB = ['settings', 'records', 'help'], cfg = loadSettings();
let view = 'main', from = 'main';
function renderScores() {
    const ol = $('scores'); ol.textContent = '';
    if (!game.scores.length) { const li = document.createElement('li'); li.textContent = 'Пока пусто — стань первым!'; ol.append(li); return }
    game.scores.forEach(s => { const li = document.createElement('li'); li.textContent = s.name + ' — ' + s.score; ol.append(li) });
}
function show(v) {
    view = v; ui.hidden = false; ui.classList.toggle('dim', v === 'pause' || v === 'end');
    ui.querySelectorAll('.view').forEach(e => e.hidden = e.dataset.v !== v); if (v === 'records') renderScores();
}
function endView(s) {
    const win = s === 'win', n = Math.max(1, game.lives);
    $('endTitle').textContent = win ? 'Гол! ' + game.name + ' — чемпион!' : 'Игра окончена';
    $('stars').textContent = win ? '★'.repeat(n) + '☆'.repeat(3 - n) : '';
    $('endInfo').textContent = 'Счёт: ' + game.score + ' · Рекорд: ' + game.best + (win && game.newRec ? ' · новый рекорд!' : '');
}
const game = new Game($('g'), s => {
    $('bpause').hidden = s !== 'play'; $('touch').hidden = s !== 'play';
    if (s === 'play') ui.hidden = true;
    else if (s === 'pause') show('pause');
    else if (s === 'title') { if (!SUB.includes(view)) show('main') }
    else { endView(s); show('end') }
    A.setLow(s === 'pause');
});
const play = () => { game.name = nameIn.value.trim() || 'Игрок'; saveName(game.name); A.startMusic(); game.newGame() };
const restart = () => { A.startMusic(); game.newGame() };
$('play').onclick = play; $('again').onclick = restart; $('restart').onclick = restart;
$('resume').onclick = $('bpause').onclick = () => game.pause();
$('tomenu').onclick = $('tomenu2').onclick = () => game.toMenu();
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { from = view; show(b.dataset.go) });
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => show(from));
// настройки
const lab = (id, on) => { $(id).textContent = on ? 'Вкл' : 'Выкл' };
function applyCfg() { A.setMusic(cfg.music); A.setSfx(cfg.sfx); A.setVol(cfg.vol / 100); lab('music', cfg.music); lab('snd', cfg.sfx); $('vol').value = cfg.vol; saveSettings(cfg) }
$('music').onclick = () => { cfg.music = !cfg.music; applyCfg() };
$('snd').onclick = () => { cfg.sfx = !cfg.sfx; applyCfg() };
$('vol').oninput = e => { cfg.vol = +e.target.value; applyCfg() };
// полный экран
const fsOK = !!document.fullscreenEnabled;
function toggleFull() { if (!fsOK) return; if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }) }
document.addEventListener('fullscreenchange', () => lab('full', !!document.fullscreenElement));
$('full').onclick = $('bfull').onclick = toggleFull;
if (!fsOK) { $('fullrow').hidden = true; $('bfull').hidden = true }
document.addEventListener('click', e => { const b = e.target.closest('button'); if (b) b.blur() });   // чтобы пробел не нажимал кнопку
nameIn.value = game.name; applyCfg(); show('main');
addEventListener('pointerdown', A.startMusic, { once: true });   // браузер разрешает звук только после первого клика
addEventListener('keydown', A.startMusic, { once: true });
addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.target === nameIn) { if (e.code === 'Enter') play(); return }
    const s = game.state;
    if (e.code === 'KeyF') toggleFull();
    if (e.code === 'Enter') { if (s === 'title' && view === 'main') play(); else if (s === 'pause' && view === 'pause') game.pause(); else if (s === 'win' || s === 'lose') restart() }
    if (e.code === 'KeyP' || e.code === 'Escape') { if (SUB.includes(view)) show(from); else if (s === 'play' || s === 'pause') game.pause() }
    if (e.code === 'KeyR' && s !== 'title') restart();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) game.autoPause(); A.hold(document.hidden) });
addEventListener('blur', () => game.autoPause());
