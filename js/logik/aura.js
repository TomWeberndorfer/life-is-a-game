// Aura je Gegner (05.11.2026): welcher Effekt bei der Vorstellung eines Gegners läuft. Daten: daten/aura.js (Register),
// daten/stile.js (`aura` je Stil) und daten/vorlagen.js (`aura` am Gegner). Reine Funktionen, werfen nie.
// Regeln: höchstens ein Effekt, genau einmal je Vorstellung (auraLauf), ohne Angabe oder bei unbekanntem Wert keiner.

const KLASSE = /^aura-[a-z][a-z-]*$/;
const ID = /^[a-z][a-z0-9-]*$/;
const ganz = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;

// Register prüfen: liefert nur gültige Effekte { id: { id, klasse, teile, dauerMs } }. Ungültige fallen weg (warn je Eintrag).
export function pruefeEffekte(cfg, warn = () => {}) {
  const aus = {};
  const e = cfg && typeof cfg.effekte === 'object' && cfg.effekte ? cfg.effekte : {};
  const maxTeile = ganz(cfg && cfg.maxTeile, 1, 64) ? cfg.maxTeile : 16;
  const minMs = ganz(cfg && cfg.minMs, 1, 60000) ? cfg.minMs : 300;
  const maxMs = ganz(cfg && cfg.maxMs, minMs, 60000) ? cfg.maxMs : 4000;
  for (const [id, x] of Object.entries(e)) {
    const f = [];
    if (!ID.test(id)) f.push('ungültige ID');
    if (!x || typeof x !== 'object') f.push('kein Objekt');
    else {
      if (!KLASSE.test(String(x.klasse || ''))) f.push('klasse muss mit „aura-“ beginnen');
      if (!ganz(x.teile, 1, maxTeile)) f.push(`teile muss 1 bis ${maxTeile} sein`);
      if (!ganz(x.dauerMs, minMs, maxMs)) f.push(`dauerMs muss ${minMs} bis ${maxMs} sein`);
    }
    if (f.length) { warn(`Aura „${id}“: ${f.join(', ')}`); continue; }
    aus[id] = { id, klasse: x.klasse, teile: x.teile, dauerMs: x.dauerMs };
  }
  return aus;
}

// Roher Wert für einen Gegner im Stil: Stil vor Gegner. Ein Stil darf mit '' oder null bewusst „keine Aura“ sagen.
// Ergebnis: Effekt-ID (Text) oder null.
export function auraWert(gegnerId, stilId, stile, gegner) {
  if (typeof gegnerId !== 'string' || !gegnerId) return null;
  const st = stile && stilId && Object.prototype.hasOwnProperty.call(stile, stilId) ? stile[stilId] : null;
  const jeStil = st && st.aura && typeof st.aura === 'object' ? st.aura : null;
  if (jeStil && Object.prototype.hasOwnProperty.call(jeStil, gegnerId)) {
    const w = jeStil[gegnerId];
    return typeof w === 'string' && w.trim() ? w.trim() : null;
  }
  const g = gegner && Object.prototype.hasOwnProperty.call(gegner, gegnerId) ? gegner[gegnerId] : null;
  return g && typeof g.aura === 'string' && g.aura.trim() ? g.aura.trim() : null;
}

// Effekt für einen Gegner im Stil oder null (keine Angabe, unbekannter Effekt, ungültige Eingaben).
// effekte = Ergebnis von pruefeEffekte.
export function auraFuer(gegnerId, stilId, { stile, gegner, effekte } = {}) {
  const w = auraWert(gegnerId, stilId, stile, gegner);
  if (!w || !effekte || !Object.prototype.hasOwnProperty.call(effekte, w)) return null;
  return effekte[w];
}

// Alle Angaben gegen Register, Stile und Gegner prüfen (beim Start einmal, als Warnungen). Leere Liste = alles in Ordnung.
export function pruefeAuraDaten(stile, gegner, effekte) {
  const f = [];
  const bekannt = w => typeof w === 'string' && Object.prototype.hasOwnProperty.call(effekte || {}, w.trim());
  for (const [stilId, st] of Object.entries(stile || {})) {
    if (!st || st.aura === undefined) continue;
    if (!st.aura || typeof st.aura !== 'object' || Array.isArray(st.aura)) { f.push(`Aura im Stil ${stilId}: muss ein Objekt sein`); continue; }
    for (const [gid, w] of Object.entries(st.aura)) {
      if (!gegner || !Object.prototype.hasOwnProperty.call(gegner, gid)) f.push(`Aura im Stil ${stilId}: Gegner „${gid}“ unbekannt`);
      if (w !== null && w !== '' && !bekannt(w)) f.push(`Aura im Stil ${stilId}, ${gid}: Effekt „${w}“ unbekannt`);
    }
  }
  for (const [gid, g] of Object.entries(gegner || {})) {
    if (g && g.aura !== undefined && g.aura !== null && g.aura !== '' && !bekannt(g.aura)) f.push(`Aura am Gegner ${gid}: Effekt „${g.aura}“ unbekannt`);
  }
  return f;
}

// Läuft die Aura noch? start = Zeitpunkt des ersten Zeichnens (ms), jetzt = Uhrzeit (ms). Ein Neuzeichnen mitten im
// Effekt läuft an derselben Stelle weiter (versatzMs), danach nie wieder (genau einmal je Vorstellung).
// Ungültiger Start → zeigen ab 0. Uhr zurückgestellt → ab 0 (lieber einmal ganz als abgeschnitten).
export function auraLauf(start, jetzt, dauerMs) {
  if (!Number.isFinite(dauerMs) || dauerMs <= 0) return { zeigen: false, versatzMs: 0 };
  if (!Number.isFinite(start) || !Number.isFinite(jetzt)) return { zeigen: true, versatzMs: 0 };
  const vergangen = jetzt - start;
  if (vergangen < 0) return { zeigen: true, versatzMs: 0 };
  if (vergangen >= dauerMs) return { zeigen: false, versatzMs: 0 };
  return { zeigen: true, versatzMs: Math.round(vergangen) };
}

// Lage der Teile, fest je Nummer (gleiches Bild bei jedem Zeichnen, im Test prüfbar): x/y in Prozent, verzugMs innerhalb
// des ersten Drittels, skala 0,6 bis 1,4. Wirft nie; ungültiger Effekt → [].
export function auraTeile(effekt) {
  if (!effekt || !Number.isInteger(effekt.teile) || effekt.teile < 1 || !Number.isFinite(effekt.dauerMs)) return [];
  const n = effekt.teile;
  return Array.from({ length: n }, (_, i) => ({
    x: n === 1 ? 50 : 6 + ((i * 37 + 11) % 89),
    y: n === 1 ? 50 : 10 + ((i * 53 + 29) % 81),
    verzugMs: n === 1 ? 0 : Math.round((effekt.dauerMs / 3) * (i / n)),
    skala: Math.round((0.6 + ((i * 29) % 9) / 10) * 100) / 100
  }));
}
