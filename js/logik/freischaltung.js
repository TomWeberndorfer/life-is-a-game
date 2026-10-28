// Freischaltung von Bereichen (Version 27, erweitert in 37): reine Funktionen, nichts gespeichert.
// Regeln stehen als Daten in daten/freischaltung.js (TABS, FUNKTIONEN):
//   { art: 'immer' } · { art: 'sieg' } (erster Sieg eines Helden) · { art: 'stufe', ab: 3 } (höchster Held)
//   { art: 'zaehler', name: 'rueckfaelle', ab: 1 } (Version 37: beliebiger erfasster Zähler)
// Neue Arten = neuer Eintrag in PRUEFER und PARAMETER. Unbekannte oder kaputte Regeln sperren (sicherer Rückfall) und melden das.
import * as K from './kern.js';
import { ansicht } from './helden.js';

// Höchste Stufe aller Helden am Tag `heute` (Date). Ohne Helden 0. Ein defekter Held wird übersprungen.
export function hoechsteStufe(spiel, heute, warn = () => {}) {
  if (!spiel || !Array.isArray(spiel.helden)) return 0;
  let max = 0;
  for (const h of spiel.helden) {
    try { max = Math.max(max, K.auswertung(ansicht(spiel, h.heroId), heute).level); }
    catch (e) { warn(`Stufe von ${h && h.heroId}: ${e.message}`); }
  }
  return max;
}

const ganzAb1 = v => Number.isInteger(v) && v >= 1;
const zahl = v => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

// Fehler einer einzelnen Regel (leer = gültig). zaehlerNamen: erlaubte Zähler (ohne Liste: jeder Name).
export function regelFehler(regel, zaehlerNamen = null) {
  if (regel === undefined || regel === null) return [];
  if (typeof regel !== 'object' || Array.isArray(regel)) return ['Regel ist kein Objekt'];
  switch (regel.art) {
    case 'immer': case 'sieg': return [];
    case 'stufe': return ganzAb1(regel.ab) ? [] : [`Stufe „ab“ muss eine ganze Zahl ab 1 sein (ist ${JSON.stringify(regel.ab)})`];
    case 'zaehler': {
      const f = [];
      if (typeof regel.name !== 'string' || !regel.name) f.push('Zähler ohne Namen');
      else if (zaehlerNamen && !zaehlerNamen.includes(regel.name)) f.push(`Unbekannter Zähler „${regel.name}“`);
      if (regel.ab !== undefined && !ganzAb1(regel.ab)) f.push(`Zähler „ab“ muss eine ganze Zahl ab 1 sein (ist ${JSON.stringify(regel.ab)})`);
      return f;
    }
    default: return [`Unbekannte Regel-Art „${regel.art}“`];
  }
}

const PRUEFER = {
  immer: () => true,
  sieg: (r, k) => k.siege > 0,
  stufe: (r, k) => k.stufe >= r.ab,
  zaehler: (r, k) => zahl(k.zaehler[r.name]) >= (r.ab === undefined ? 1 : r.ab)
};

// kontext: { stufe, siege, zaehler: { name: zahl } }. Ohne Regel = frei (bestehende Tabs bleiben so wie bisher).
// zaehlerNamen (optional): erlaubte Zähler; ein fremder Name sperrt und wird gemeldet (Tippfehler fallen so auf).
export function istFrei(regel, kontext, warn = () => {}, zaehlerNamen = null) {
  if (regel === undefined || regel === null) return true;
  const fehler = regelFehler(regel, zaehlerNamen);
  if (fehler.length) { warn(`Freischalt-Regel gesperrt (${fehler.join('; ')}): ${JSON.stringify(regel)}`); return false; }
  const z = kontext && kontext.zaehler && typeof kontext.zaehler === 'object' ? kontext.zaehler : {};
  const k = { stufe: zahl(kontext && kontext.stufe), siege: zahl(kontext && kontext.siege), zaehler: z };
  return PRUEFER[regel.art](regel, k);
}

// Prüft die ganze Konfiguration (TABS, FUNKTIONEN) beim Start. Liefert eine Liste lesbarer Fehler, wirft nie.
export function pruefeFreischaltung({ tabs, funktionen, maxTabs, zaehler }) {
  const f = [];
  if (!Array.isArray(tabs) || !tabs.length) return ['Keine Tabs festgelegt'];
  const gesehen = new Set();
  tabs.forEach((t, i) => {
    const wo = `Tab ${i + 1}${t && t.screen ? ` (${t.screen})` : ''}`;
    if (!t || typeof t.screen !== 'string' || !t.screen) { f.push(`${wo}: screen fehlt`); return; }
    if (gesehen.has(t.screen)) f.push(`${wo}: doppelt`);
    gesehen.add(t.screen);
    const l = t.label;
    if (!l || (typeof l.text !== 'string' && typeof l.wort !== 'string')) f.push(`${wo}: label braucht text oder wort`);
    if (typeof t.icon !== 'string' || !t.icon) f.push(`${wo}: icon fehlt`);
    if (t.sperrText !== undefined && typeof t.sperrText !== 'string') f.push(`${wo}: sperrText muss ein Textschlüssel sein`);
    regelFehler(t.frei, zaehler).forEach(x => f.push(`${wo}: ${x}`));
  });
  if (tabs[0] && tabs[0].frei && tabs[0].frei.art !== 'immer') f.push(`Erster Tab (${tabs[0].screen}) muss immer frei sein`);
  if (Number.isInteger(maxTabs) && tabs.length > maxTabs) f.push(`${tabs.length} Tabs, Platz für ${maxTabs}`);
  for (const [id, fn] of Object.entries(funktionen || {})) {
    if (!fn || typeof fn !== 'object') { f.push(`Funktion ${id}: kein Objekt`); continue; }
    regelFehler(fn.frei, zaehler).forEach(x => f.push(`Funktion ${id}: ${x}`));
  }
  return f;
}

// „Neu für dich“ (Version 50): freigeschaltete Bereiche, deren Freischaltung noch nicht gezeigt wurde.
// Zählt nur Tabs mit echter Freischaltregel (nicht „immer“/ohne Regel), die gebaut sind (kein `bald`: „kommt bald“
// wird nicht angekündigt) und gerade frei sind. aktiv(tab) → bool; gesehen = Liste von Tab-IDs.
// Reihenfolge wie in TABS. Wirft nie; ein Fehler in aktiv() zählt als „nicht frei“.
export function neuFreigeschaltet(tabs, aktiv, gesehen) {
  const schon = new Set(Array.isArray(gesehen) ? gesehen : []);
  return (Array.isArray(tabs) ? tabs : []).filter(t => {
    if (!t || typeof t.screen !== 'string' || t.bald === true || schon.has(t.screen)) return false;
    if (!t.frei || t.frei.art === 'immer') return false;
    try { return !!aktiv(t); } catch (e) { return false; }
  }).map(t => t.screen);
}
