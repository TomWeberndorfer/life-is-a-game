// Rückfallkette für Bildplätze (Version 62, Etappe B2). Reine Funktionen, testbar mit node --test.
// Ein Bildplatz ohne eigenes Bild (Tabelle oder Datei) zeigt das Bild eines verwandten Platzes DESSELBEN Stils,
// z. B. banner-khara → khara, bezirk-partner → banner-khara → khara. Erst wenn die ganze Kette leer ist: Platzhalter.
// Das stileigene Bild des Platzes hat immer Vorrang; der Rückfall ist nur Ersatz, kein Verweis auf eine feste Datei.
//
// Regel (Daten in stile.js → BILD_RUECKFALL): { von: 'bezirk-', nach: 'banner-', ueber: 'bereichHeld' }
//   von    Präfix des Platzes, für den die Regel gilt
//   nach   Präfix des nächsten Platzes ('' = ohne Präfix, z. B. die Helden-ID selbst)
//   ueber  optional: Name einer Zuordnung aus `zuordnungen` (z. B. Lebensbereich → Standard-Held);
//          fehlt der Eintrag dort (Bereich ohne Held), endet die Kette.
// Es gilt die erste passende Regel. Ringe (a → b → a) und überlange Ketten werden abgebrochen und gemeldet.

export const KETTE_MAX = 8;

// Prüft die Regeln; liefert Fehlertexte (leer = in Ordnung).
export function pruefeRueckfall(regeln, zuordnungen = {}) {
  const f = [];
  if (!Array.isArray(regeln)) return ['Rückfallregeln: keine Liste'];
  regeln.forEach((r, i) => {
    const wo = `Rückfallregel ${i + 1}`;
    if (!r || typeof r !== 'object') { f.push(`${wo}: kein Eintrag`); return; }
    if (typeof r.von !== 'string' || !r.von) f.push(`${wo}: „von“ fehlt`);
    if (typeof r.nach !== 'string') f.push(`${wo}: „nach“ fehlt`);
    if (r.von === r.nach && !r.ueber) f.push(`${wo}: zeigt auf sich selbst`);
    if (r.ueber !== undefined && !(zuordnungen && typeof zuordnungen[r.ueber] === 'object')) f.push(`${wo}: unbekannte Zuordnung „${r.ueber}“`);
  });
  return f;
}

// Nächster Platz nach `platz` oder null (keine Regel, leerer Rest, Zuordnung ohne Ziel).
export function naechsterPlatz(platz, regeln, zuordnungen = {}) {
  const p = String(platz || '');
  if (!p || !Array.isArray(regeln)) return null;
  const r = regeln.find(x => x && typeof x.von === 'string' && x.von && p.startsWith(x.von));
  if (!r || typeof r.nach !== 'string') return null;
  let rest = p.slice(r.von.length);
  if (r.ueber) {
    const z = zuordnungen && zuordnungen[r.ueber];
    rest = z && Object.prototype.hasOwnProperty.call(z, rest) ? z[rest] : null;
  }
  if (typeof rest !== 'string' || !rest) return null;
  return r.nach + rest;
}

// Ganze Kette ab `platz` (der Platz selbst zuerst). { kette, fehler } – fehler = null oder Grund des Abbruchs.
export function rueckfallKette(platz, regeln, zuordnungen = {}, max = KETTE_MAX) {
  const kette = [];
  let p = String(platz || '');
  if (!p) return { kette, fehler: 'leerer Bildplatz' };
  while (p) {
    if (kette.includes(p)) return { kette, fehler: `Ring bei „${p}“` };
    if (kette.length >= max) return { kette, fehler: `Kette länger als ${max}` };
    kette.push(p);
    p = naechsterPlatz(p, regeln, zuordnungen);
  }
  return { kette, fehler: null };
}

// Erstes Bild entlang der Kette. finde(platz) → Bild oder null. Ergebnis: { bild, platz, rueckfall } oder null.
export function loeseBild(platz, finde, regeln, zuordnungen = {}) {
  const { kette } = rueckfallKette(platz, regeln, zuordnungen);
  for (const p of kette) {
    const b = finde(p);
    if (b) return { bild: b, platz: p, rueckfall: p !== kette[0] };
  }
  return null;
}

// Zuordnung Lebensbereich → Standard-Held (Bereiche ohne Held fehlen).
export function bereichHeld(lebensbereiche) {
  const z = {};
  for (const d of Array.isArray(lebensbereiche) ? lebensbereiche : []) if (d && d.id && d.held) z[d.id] = d.held;
  return z;
}
