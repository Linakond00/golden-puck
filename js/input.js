// Клавиатура и экранные кнопки. jump = «нажали прыжок» (одно событие), j = кнопка удерживается
const MAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'j', KeyW: 'j', Space: 'j' };
export class Input {
    constructor() {
        this.l = this.r = this.j = this.jump = false;
        addEventListener('keydown', e => { const k = MAP[e.code]; if (!k || e.target.tagName === 'INPUT') return; e.preventDefault(); this.set(k, true) });
        addEventListener('keyup', e => { const k = MAP[e.code]; if (!k || e.target.tagName === 'INPUT') return; e.preventDefault(); this.set(k, false) });
        document.querySelectorAll('#touch button').forEach(b => {
            const k = b.dataset.k;
            b.addEventListener('pointerdown', e => { e.preventDefault(); this.set(k, true) });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => b.addEventListener(n, () => this.set(k, false)));
        });
    }
    set(k, v) { if (k === 'j' && v && !this.j) this.jump = true; this[k] = v }
    clear() { this.l = this.r = this.j = this.jump = false }
}
