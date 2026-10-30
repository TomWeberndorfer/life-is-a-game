// Feld-Register (Feld-Eingaben aufteilen, 30.10.2026): ersetzt die if-Ketten der Ereignisse change/input/Enter in app.js.
// Jede Ansicht exportiert <NAME>_FELDER = { '<element-id>': { change?, input?, enter? } }. Eine ID mit „*“ am Ende
// gilt für alle IDs mit diesem Anfang (z. B. 'fb-*' für die Feedback-Texte); die genaueste Angabe gewinnt.
// Funktionen bekommen { el, wert, art, ereignis }. Felder ohne Eintrag (z. B. nur beim Klick gelesen) bleiben still.
import { fuehreAus } from './klicks.js';

export const FELD_ARTEN = ['change', 'input', 'enter'];
export const FELD_MUSTER = /^[a-z][a-z0-9-]*\*?$/;

// quellen: { REGISTERNAME: { id: { art: funktion } } } → { exakt, praefixe, fehler }
export function feldRegister(quellen) {
  const exakt = {};
  const praefixe = [];
  const fehler = [];
  if (!quellen || typeof quellen !== 'object') return { exakt, praefixe, fehler: ['Feld-Register: keine Quellen übergeben'] };
  for (const [quelle, teil] of Object.entries(quellen)) {
    if (!teil || typeof teil !== 'object') { fehler.push(`Feld-Register ${quelle} fehlt oder ist kein Objekt`); continue; }
    for (const [id, arten] of Object.entries(teil)) {
      if (!FELD_MUSTER.test(id)) { fehler.push(`Feld „${id}“ (${quelle}): ungültige ID`); continue; }
      if (!arten || typeof arten !== 'object') { fehler.push(`Feld „${id}“ (${quelle}): keine Ereignisse`); continue; }
      const falsch = Object.entries(arten).filter(([a, f]) => !FELD_ARTEN.includes(a) || typeof f !== 'function').map(([a]) => a);
      if (falsch.length || !Object.keys(arten).length) { fehler.push(`Feld „${id}“ (${quelle}): ungültige Ereignisse ${falsch.join(', ') || '(keine)'}`); continue; }
      const p = id.endsWith('*') ? id.slice(0, -1) : null;
      const schon = p !== null ? praefixe.find(x => x.p === p) : exakt[id];
      if (schon) { fehler.push(`Feld „${id}“ doppelt: ${schon.quelle} und ${quelle}`); continue; }
      if (p !== null) praefixe.push({ p, arten, quelle }); else exakt[id] = { arten, quelle };
    }
  }
  praefixe.sort((a, b) => b.p.length - a.p.length);
  return { exakt, praefixe, fehler };
}

// Eintrag für eine ID: genaue ID vor Präfix (längster zuerst). null = kein Eintrag.
export function feldEintrag(register, id) {
  if (!register || typeof id !== 'string' || !id) return null;
  if (Object.prototype.hasOwnProperty.call(register.exakt, id)) return register.exakt[id];
  return register.praefixe.find(x => id.startsWith(x.p)) || null;
}

// 'ok' | 'keins' (kein Eintrag für ID oder Art) | 'fehler'. Wirft nie.
export function feldVerteile(register, id, art, daten = {}, melde = {}) {
  const fehler = typeof melde.fehler === 'function' ? melde.fehler : () => {};
  const e = feldEintrag(register, id);
  const f = e && Object.prototype.hasOwnProperty.call(e.arten, art) ? e.arten[art] : null;
  if (!f) return 'keins';
  return fuehreAus(f, { el: null, wert: '', ereignis: null, ...daten, art }, id, fehler);
}
