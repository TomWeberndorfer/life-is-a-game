// Helfer zum Antwort-Register (Version 141). Register: daten/antworten.js. Reine Funktionen, werfen nie.
import { ANTWORT_ARTEN, ANTWORTEN } from '../daten/antworten.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;

// Ist x eine bekannte Antwort?
export const istAntwort = x => typeof x === 'string' && ANTWORTEN.includes(x);
// Eintrag im Register oder null (unbekannt, leer, kaputt).
export const antwortArt = x => (istAntwort(x) ? ANTWORT_ARTEN[x] : null);
// Antworten, die in einer Zielart unter `zaehlt` stehen dürfen.
export const ZAEHLBARE_ANTWORTEN = Object.freeze(ANTWORTEN.filter(a => ANTWORT_ARTEN[a].zaehlbar));

// Tage (sortiert), deren Antwort die Eigenschaft `eigenschaft` hat (z. B. 'bruecke', 'schwer'), bis einschließlich bisK.
export function tageMit(tage, eigenschaft, bisK = null) {
  if (!tage || typeof tage !== 'object') return [];
  return Object.keys(tage).filter(t => TAG.test(t) && (!bisK || t <= bisK) && !!(antwortArt(tage[t]) || {})[eigenschaft]).sort();
}

// Antworten, deren Siegel heute angeboten werden: ohne Tagesfrage nur die, die keine Frage brauchen.
export function siegelAntworten(mitFrage = true) {
  return ANTWORTEN.filter(a => mitFrage || !ANTWORT_ARTEN[a].nurMitFrage);
}

export { ANTWORT_ARTEN, ANTWORTEN };

// Zahl der schweren Tage im ganzen Spiel (Freischaltung der Notfallkarte, Zähler „rueckfaelle“ in app.js): je Held und
// Tag höchstens einmal, ob als Eintrag „schwer“ oder (Version 141) als Antwort mit `schwer` im Register. Wirft nie.
export function schwereTageZahl(spiel) {
  const s = new Set();
  try {
    for (const e of (spiel && Array.isArray(spiel.eintraege) ? spiel.eintraege : [])) if (e && e.art === 'schwer') s.add(`${e.heroId}|${e.tag}`);
    for (const h of (spiel && Array.isArray(spiel.helden) ? spiel.helden : [])) for (const t of tageMit(h && h.tage, 'schwer')) s.add(`${h.heroId}|${t}`);
  } catch (e) { /* kaputter Stand: zählt, was lesbar war */ }
  return s.size;
}
