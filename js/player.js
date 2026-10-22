const G = 2200, JV = 830, MAXV = 360; // пикс/с², пикс/с
// Команды: «Кристал» (синий, белый, голубой) и «Амур» (чёрный, оранжевый)
export const CRYSTAL = { j: '#1f58d6', a: '#ffffff', b: '#79cfff', p: '#14307a', sock: '#1f58d6' };
export const AMUR = { j: '#161616', a: '#ff7a00', b: '#ff7a00', p: '#242424', sock: '#ff7a00', helmet: 1 };
export class Player {
    constructor(x) { this.w = 28; this.h = 46; this.reset(x) }
    reset(x) { Object.assign(this, { x, y: 400, vx: 0, vy: 0, f: 1, g: false, coy: 0, jb: 0, jumped: false }) }
    update(dt, inp, plat) {
        if (inp.jump) { this.jb = .13; inp.jump = false }
        const n = Math.ceil(dt * 120); for (let i = 0; i < n; i++)this.step(dt / n, inp, plat);
    }
    step(h, inp, plat) {
        const k = h * 60, a = this.g ? 1620 : 1000;
        if (inp.l) { this.vx -= a * h; this.f = -1 }
        if (inp.r) { this.vx += a * h; this.f = 1 }
        if (!inp.l && !inp.r) this.vx *= Math.pow(this.g ? .986 : .997, k); // скольжение по льду
        this.vx = Math.max(-MAXV, Math.min(MAXV, this.vx));
        this.coy = this.g ? .11 : this.coy - h; this.jb -= h;
        if (this.jb > 0 && this.coy > 0) { this.vy = -JV; this.jb = 0; this.coy = 0; this.jumped = true } // только с опоры
        if (!inp.j && this.vy < -240) this.vy *= Math.pow(.86, k);
        this.vy = Math.min(this.vy + G * h, 960);
        this.x += this.vx * h; this.collide(plat, true);
        this.y += this.vy * h; this.g = false; this.collide(plat, false);
    }
    collide(plat, ax) {
        for (const b of plat) if (this.x < b[0] + b[2] && this.x + this.w > b[0] && this.y < b[1] + b[3] && this.y + this.h > b[1]) {
            if (ax) { this.x = this.vx > 0 ? b[0] - this.w : b[0] + b[2]; this.vx = 0 }
            else { if (this.vy > 0) { this.y = b[1] - this.h; this.g = true } else this.y = b[1] + b[3]; this.vy = 0 }
        }
    }
    draw(x, T) { skater(x, this.x + 14, this.y + 46, this.f, this.g && Math.abs(this.vx) > 30, T, CRYSTAL, '#c9a06a', '#2f7dff', 0) }
}
// Хоккеист (ноги в точке px,py). tm — цвета команды, hc — волосы/шлем, mad — злой взгляд
export function skater(x, px, py, f, mv, T, tm, hc, eye, mad) {
    x.save(); x.translate(px, py); x.scale(f, 1);
    const s = mv ? Math.sin(T * .4) * 4 : 0, SK = '#ffd9b8', SD = '#f0b896';
    for (const l of [-8 + s, 2 - s]) {                                   // ноги: штаны, гетры, ботинок, лезвие
        x.fillStyle = tm.p; x.fillRect(l, -20, 7, 12);
        x.fillStyle = tm.sock; x.fillRect(l, -9, 7, 5); x.fillStyle = '#fff'; x.fillRect(l, -7.5, 7, 1.5);
        x.fillStyle = '#111'; x.fillRect(l - 1.5, -5, 11, 5); x.fillStyle = '#d5dde8'; x.fillRect(l - 3, -1.5, 14, 2);
    }
    x.fillStyle = tm.j; x.beginPath(); x.moveTo(-9.5, -20); x.lineTo(9.5, -20); x.lineTo(11, -33); x.quadraticCurveTo(0, -37, -11, -33); x.closePath(); x.fill();   // майка
    x.fillStyle = tm.a; x.fillRect(-10, -24.5, 20, 2.5); x.fillStyle = tm.b; x.fillRect(-9.8, -21.8, 19.6, 1.8);
    x.fillStyle = tm.b; x.beginPath(); x.moveTo(2, -33); x.lineTo(5, -30); x.lineTo(2, -27); x.lineTo(-1, -30); x.fill();                                       // эмблема
    x.fillStyle = SD; x.fillRect(-1, -37, 5, 5);                                                                                                           // шея
    x.fillStyle = hc; x.beginPath(); x.arc(-2, -41, 10, 0, 7); x.fill();                                                                                      // волосы сзади
    x.fillStyle = SK; x.beginPath(); x.arc(1, -39, 9, 0, 7); x.fill();                                                                                        // голова
    x.fillStyle = SD; x.beginPath(); x.arc(-2, -38.5, 2, 0, 7); x.fill();                                                                                     // ухо
    x.fillStyle = hc; x.beginPath(); x.moveTo(-8.5, -42); x.quadraticCurveTo(-4, -52, 6, -48.5); x.quadraticCurveTo(10.5, -47, 10.5, -42.5); x.quadraticCurveTo(5, -46, 0, -43); x.quadraticCurveTo(-4, -41, -8.5, -36); x.closePath(); x.fill(); // чёлка
    if (tm.helmet) { x.strokeStyle = '#ff7a00'; x.lineWidth = 2; x.beginPath(); x.arc(-1, -41, 10.3, Math.PI * 1.1, Math.PI * 1.8); x.stroke() }
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(5.6, -39, 2.3, 2.6, 0, 0, 7); x.fill();                                                                      // глаз
    x.fillStyle = eye; x.beginPath(); x.arc(6.2, -39, 1.6, 0, 7); x.fill(); x.fillStyle = '#000'; x.beginPath(); x.arc(6.5, -39, .7, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(6.8, -39.7, .45, 0, 7); x.fill();
    x.strokeStyle = '#5a3a22'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(3.4, mad ? -43.2 : -42.4); x.lineTo(8, mad ? -41.6 : -42.8); x.stroke();                      // бровь
    x.fillStyle = SD; x.beginPath(); x.arc(9.8, -37, 1.4, 0, 7); x.fill();                                                                                    // нос
    x.fillStyle = 'rgba(255,110,110,.35)'; x.beginPath(); x.arc(4.2, -35.6, 1.8, 0, 7); x.fill();                                                             // румянец
    x.strokeStyle = '#9a4a38'; x.lineWidth = 1.1; x.beginPath(); if (mad) x.arc(6.5, -32.8, 2.2, Math.PI * 1.2, Math.PI * 1.85); else x.arc(6.5, -35.2, 2.4, .25, Math.PI - .55); x.stroke();
    x.strokeStyle = '#b07a3f'; x.lineWidth = 3; x.beginPath(); x.moveTo(12, -23); x.lineTo(24, -2); x.stroke();                                                  // клюшка
    x.fillStyle = '#111'; x.fillRect(20, -4, 10, 3.5); x.fillStyle = '#fff'; x.fillRect(24, -4, 2, 3.5);
    x.strokeStyle = tm.j; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(3, -31); x.lineTo(11, -24); x.stroke();                                    // рука
    x.fillStyle = '#1a1a1a'; x.beginPath(); x.arc(12, -23, 3.2, 0, 7); x.fill();                                                                              // перчатка
    x.restore();
}
