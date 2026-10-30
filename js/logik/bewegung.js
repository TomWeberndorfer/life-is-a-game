// Bewegungs-Abläufe (Version 68, „Bewegung vereinheitlichen“): reine Funktionen, nichts im DOM.
// Katalog und Abläufe stehen als Daten in daten/bewegung.js, die Keyframes (Präfix bw-) einmal in index.html.
// Eine Ansicht fragt nur noch: „Wie bewegt sich Teil X im Ablauf Y?“ und bekommt den fertigen CSS-Wert für `animation`.
// „Bewegung reduzieren“ braucht hier keine Sonderfälle: EINE Regel in index.html (:root[data-bewegung="aus"] *) schaltet
// jede Animation ab, auch diese inline gesetzten. Endzustände stehen darum immer im normalen CSS, nie nur in der Animation.

const NAME = /^[a-z][a-zA-Z0-9]*$/;
const KEYFRAMES = /^bw-[a-z][a-z0-9-]*$/;
const KURVE = /^(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\))$/;
const MAX_MS = 10000;
const ms = x => Number.isFinite(x) && x >= 0 && x <= MAX_MS;

// Prüft Katalog und Abläufe; liefert lesbare Fehler (leer = in Ordnung). Wirft nie.
export function pruefeBewegung(cfg) {
  const f = [];
  const kat = cfg && cfg.katalog;
  const abl = cfg && cfg.ablaeufe;
  if (!kat || typeof kat !== 'object' || Array.isArray(kat)) return ['Bewegung: Katalog fehlt'];
  for (const [name, b] of Object.entries(kat)) {
    const wo = `Bewegung „${name}“`;
    if (!NAME.test(name)) f.push(`${wo}: ungültiger Name`);
    if (!b || typeof b !== 'object') { f.push(`${wo}: kein Eintrag`); continue; }
    if (!KEYFRAMES.test(String(b.keyframes))) f.push(`${wo}: keyframes muss mit „bw-“ beginnen`);
    if (!ms(b.dauerMs) || b.dauerMs === 0) f.push(`${wo}: dauerMs muss zwischen 1 und ${MAX_MS} liegen`);
    if (b.kurve !== undefined && !KURVE.test(String(b.kurve))) f.push(`${wo}: unbekannte Kurve „${b.kurve}“`);
  }
  if (!abl || typeof abl !== 'object' || Array.isArray(abl)) { f.push('Bewegung: Abläufe fehlen'); return f; }
  for (const [id, schritte] of Object.entries(abl)) {
    if (!Array.isArray(schritte)) { f.push(`Ablauf „${id}“: keine Liste`); continue; }
    schritte.forEach((s, i) => {
      const wo = `Ablauf „${id}“[${i + 1}]`;
      if (!s || typeof s !== 'object') { f.push(`${wo}: kein Eintrag`); return; }
      if (!NAME.test(String(s.teil))) f.push(`${wo}: ungültiger Teil „${s.teil}“`);
      if (!Object.prototype.hasOwnProperty.call(kat, s.bewegung)) f.push(`${wo}: unbekannte Bewegung „${s.bewegung}“`);
      if (!ms(s.startMs)) f.push(`${wo}: startMs muss zwischen 0 und ${MAX_MS} liegen`);
      if (s.dauerMs !== undefined && (!ms(s.dauerMs) || s.dauerMs === 0)) f.push(`${wo}: dauerMs ungültig`);
    });
  }
  return f;
}

// Gültige Schritte eines Ablaufs (kaputte werden übersprungen, damit ein Tippfehler nie die Ansicht bricht).
function schritte(cfg, ablaufId) {
  const kat = (cfg && cfg.katalog) || {};
  const liste = cfg && cfg.ablaeufe && Array.isArray(cfg.ablaeufe[ablaufId]) ? cfg.ablaeufe[ablaufId] : [];
  return liste.filter(s => s && NAME.test(String(s.teil)) && ms(s.startMs) && Object.prototype.hasOwnProperty.call(kat, s.bewegung)
    && KEYFRAMES.test(String(kat[s.bewegung].keyframes)) && ms(kat[s.bewegung].dauerMs))
    .map(s => {
      const b = kat[s.bewegung];
      const dauer = ms(s.dauerMs) && s.dauerMs > 0 ? s.dauerMs : b.dauerMs;
      return { teil: s.teil, keyframes: b.keyframes, dauerMs: Math.round(dauer), startMs: Math.round(s.startMs), kurve: KURVE.test(String(b.kurve)) ? b.kurve : 'ease-out' };
    });
}

// CSS-Wert für `animation` eines Teils, z. B. „bw-treffer 560ms 700ms ease-out both“; mehrere Schritte desselben
// Teils werden mit Komma verbunden. '' = dieser Teil bewegt sich in diesem Ablauf nicht.
export function animation(cfg, ablaufId, teil) {
  return schritte(cfg, ablaufId).filter(s => s.teil === teil)
    .map(s => `${s.keyframes} ${s.dauerMs}ms ${s.startMs}ms ${s.kurve} both`).join(', ');
}

// Wann ist der Ablauf zu Ende (ms)? 0 = leer. Andere Abläufe richten sich danach (z. B. die Pause vor Einblendungen).
export function ablaufEndeMs(cfg, ablaufId) {
  return schritte(cfg, ablaufId).reduce((m, s) => Math.max(m, s.startMs + s.dauerMs), 0);
}
