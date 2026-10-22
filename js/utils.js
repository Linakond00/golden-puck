// Имя игрока и таблица рекордов (localStorage)
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (e) { return d } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
export const loadName = () => get('golden-puck-name', '');
export const saveName = n => set('golden-puck-name', n);
export const loadScores = () => { const s = get('golden-puck-scores', []); return Array.isArray(s) ? s : [] };
export function addScore(name, score) {
    const s = loadScores(); if (score > 0) s.push({ name, score });
    s.sort((a, b) => b.score - a.score); const top = s.slice(0, 5); set('golden-puck-scores', top); return top;
}
export const loadSettings = () => Object.assign({ music: true, sfx: true, vol: 100 }, get('golden-puck-settings', {}));
export const saveSettings = c => set('golden-puck-settings', c);
