// Bedingungen einer Bosskette (06.11.2026). Register: daten/bedingungen.js. Reine Funktionen ohne Zeitbezug, ohne DOM und
// ohne Import aus kern.js (kern.js ruft diese Funktionen mit fertigen Listen auf). Werfen nie, außer pruefeRegister.
//
// Begriffe:
//   Platz       Index in der Gegnerkette der Quest (0 = erster Gegner)
//   Begegnung   { tag, gestalt, faehigkeit, schwierigkeit } aus einem Eintrag „geschafft“ an einem gezählten Tag
//   Fenster     alle Tage seit der ersten Runde gegen diesen Platz bis heute (Fortschritt bleibt über Runden)
import { BEDINGUNGEN, BEDINGUNG_OPT } from '../daten/bedingungen.js';

const istGanz = (x, g) => Number.isInteger(x) && x >= g.min && x <= g.max;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const istTag = t => typeof t === 'string' && TAG.test(t);
const ID = /^[A-Za-z0-9_-]{1,40}$/;
export const istBegegnungsId = x => typeof x === 'string' && ID.test(x);

// Eine Bedingung { art, ...parameter } bereinigen: unbekannte Art → null; fehlende oder ungültige Parameter → Standard.
export function bereinigeBedingung(roh, reg = BEDINGUNGEN) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
  if (!Object.prototype.hasOwnProperty.call(reg, roh.art)) return null;
  const b = { art: roh.art };
  for (const [k, g] of Object.entries(reg[roh.art].parameter || {})) b[k] = istGanz(roh[k], g) ? roh[k] : g.standard;
  return b;
}

// Bedingungen einer Quest: Liste je Kettenplatz (gleiche Reihenfolge wie die Kette), höchstens laenge Plätze und
// BEDINGUNG_OPT.maxJePlatz je Platz, jede Art höchstens einmal je Platz. Kein Array → [] (keine Bedingungen).
export function bereinigeBedingungen(roh, laenge, reg = BEDINGUNGEN, opt = BEDINGUNG_OPT) {
  if (!Array.isArray(roh)) return [];
  const n = Number.isInteger(laenge) && laenge > 0 ? laenge : roh.length;
  return roh.slice(0, n).map(platz => {
    if (!Array.isArray(platz)) return [];
    const gesehen = new Set();
    const aus = [];
    for (const x of platz) {
      const b = bereinigeBedingung(x, reg);
      if (!b || gesehen.has(b.art)) continue;
      gesehen.add(b.art);
      aus.push(b);
      if (aus.length >= opt.maxJePlatz) break;
    }
    return aus;
  });
}

// Lesbare Fehler der Bedingungen einer Vorlage (für pruefeTabelle). laenge = Länge der Kette.
export function pruefeBedingungen(roh, laenge, reg = BEDINGUNGEN, opt = BEDINGUNG_OPT) {
  if (roh === undefined) return [];
  if (!Array.isArray(roh)) return ['Bedingungen müssen eine Liste je Kettenplatz sein'];
  const f = [];
  if (roh.length > laenge) f.push(`mehr Plätze mit Bedingungen (${roh.length}) als Gegner in der Kette (${laenge})`);
  roh.forEach((platz, i) => {
    if (!Array.isArray(platz)) { f.push(`Platz ${i + 1}: keine Liste`); return; }
    if (platz.length > opt.maxJePlatz) f.push(`Platz ${i + 1}: höchstens ${opt.maxJePlatz} Bedingungen`);
    const arten = new Set();
    for (const b of platz) {
      if (!b || !Object.prototype.hasOwnProperty.call(reg, b.art)) { f.push(`Platz ${i + 1}: unbekannte Bedingung ${b && b.art}`); continue; }
      if (arten.has(b.art)) f.push(`Platz ${i + 1}: ${b.art} doppelt`);
      arten.add(b.art);
      for (const [k, g] of Object.entries(reg[b.art].parameter || {})) {
        if (b[k] !== undefined && !istGanz(b[k], g)) f.push(`Platz ${i + 1}: ${b.art}.${k} muss eine ganze Zahl von ${g.min} bis ${g.max} sein`);
      }
      for (const k of Object.keys(b)) if (k !== 'art' && !(k in (reg[b.art].parameter || {}))) f.push(`Platz ${i + 1}: ${b.art} kennt kein Feld ${k}`);
    }
  });
  return f;
}

// Prüft das Register selbst (Tests): jede Art hat Prüffunktion, Texte und gültige Parameter.
export function pruefeRegister(reg = BEDINGUNGEN) {
  const f = [];
  const felder = new Set(['gestalt', 'faehigkeit', 'schwierigkeit', null]);
  for (const [id, a] of Object.entries(reg)) {
    if (!PRUEFER[id]) f.push(`${id}: Prüffunktion fehlt`);
    if (!felder.has(a.braucht)) f.push(`${id}: unbekanntes Feld ${a.braucht}`);
    for (const t of ['stand', 'offen', 'offenEins']) if (!a.texte || typeof a.texte[t] !== 'string') f.push(`${id}: Text ${t} fehlt`);
    for (const [k, g] of Object.entries(a.parameter || {})) if (!(Number.isInteger(g.min) && Number.isInteger(g.max) && g.min <= g.max && istGanz(g.standard, g))) f.push(`${id}.${k}: Grenzen ungültig`);
  }
  return f;
}

// Bedingungen am Platz idx einer Quest ([] = keine, auch bei Quests ohne Bedingungen).
export function bedingungenAm(quest, idx) {
  const l = quest && Array.isArray(quest.bedingungen) ? quest.bedingungen : [];
  return Number.isInteger(idx) && idx >= 0 && Array.isArray(l[idx]) ? l[idx] : [];
}

// ---------- Prüffunktionen ----------
// Je Art: (b, daten) → { ist, soll }. daten: { begegnungen, gute, schwer } (siehe werteBedingungen).
const anzahlVerschieden = (begegnungen, feld) => new Set(begegnungen.map(x => x[feld]).filter(istBegegnungsId)).size;
const PRUEFER = {
  faehigkeiten: (b, d) => ({ ist: anzahlVerschieden(d.begegnungen, 'faehigkeit'), soll: b.n }),
  gestalten: (b, d) => ({ ist: anzahlVerschieden(d.begegnungen, 'gestalt'), soll: b.n }),
  schwierigkeit: (b, d) => ({ ist: d.begegnungen.filter(x => Number.isInteger(x.schwierigkeit) && x.schwierigkeit >= b.min).length, soll: b.n }),
  // ist 1 = nach dem letzten schweren Tag wieder ein guter Tag (oder es gab keinen schweren Tag)
  wiedereinstieg: (b, d) => {
    const letzter = d.schwer.length ? d.schwer[d.schwer.length - 1] : null;
    return { ist: !letzter || d.gute.some(t => t > letzter) ? 1 : 0, soll: 1, ohneSchwer: !letzter };
  }
};

// Wertet die Bedingungen eines Platzes aus.
//   liste        Bedingungen des Platzes (bedingungenAm)
//   begegnungen  Begegnungen im Fenster, nur an gezählten Tagen
//   gute         gezählte Tage im Fenster
//   schwer       schwere Tage im Fenster (ohne Tage, die zugleich gezählt sind)
// Liefert { liste: [{ art, ist, soll, erfuellt, braucht, b }], erfuellt, offen } – offen = Felder einer Begegnung, die
// eine noch offene Bedingung braucht (Set). Ohne Bedingungen: erfuellt = true.
export function werteBedingungen(liste, { begegnungen = [], gute = [], schwer = [] } = {}, reg = BEDINGUNGEN) {
  const d = {
    begegnungen: (Array.isArray(begegnungen) ? begegnungen : []).filter(x => x && istTag(x.tag)),
    gute: [...new Set((Array.isArray(gute) ? gute : []).filter(istTag))].sort(),
    schwer: [...new Set((Array.isArray(schwer) ? schwer : []).filter(istTag))].sort()
  };
  const aus = [];
  for (const roh of Array.isArray(liste) ? liste : []) {
    const b = bereinigeBedingung(roh, reg);
    if (!b) continue;
    const p = PRUEFER[b.art](b, d);
    aus.push({ art: b.art, ist: p.ist, soll: p.soll, erfuellt: p.ist >= p.soll, braucht: reg[b.art].braucht, b, ...(p.ohneSchwer ? { ohneSchwer: true } : {}) });
  }
  const offen = new Set(aus.filter(x => !x.erfuellt && x.braucht).map(x => x.braucht));
  return { liste: aus, erfuellt: aus.every(x => x.erfuellt), offen };
}
