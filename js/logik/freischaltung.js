// Freischaltung von Bereichen (Version 27): reine Funktionen, nichts gespeichert.
// Regeln stehen als Daten in der Konfiguration (z. B. TABS in app.js):
//   { art: 'immer' } · { art: 'sieg' } (erster Sieg eines Helden) · { art: 'stufe', ab: 3 } (höchster Held)
// Neue Arten = neuer Eintrag in PRUEFER. Unbekannte oder kaputte Regeln sperren (sicherer Rückfall) und melden das.
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

const PRUEFER = {
  immer: () => true,
  sieg: (r, k) => k.siege > 0,
  stufe: (r, k) => Number.isInteger(r.ab) && r.ab >= 1 && k.stufe >= r.ab
};

// kontext: { stufe, siege }. Ohne Regel = frei (bestehende Tabs bleiben so wie bisher).
export function istFrei(regel, kontext, warn = () => {}) {
  if (regel === undefined || regel === null) return true;
  const p = regel && PRUEFER[regel.art];
  if (!p) { warn(`Unbekannte Freischalt-Regel: ${JSON.stringify(regel)}`); return false; }
  const k = { stufe: Number(kontext && kontext.stufe) || 0, siege: Number(kontext && kontext.siege) || 0 };
  const ok = p(regel, k);
  if (regel.art === 'stufe' && !(Number.isInteger(regel.ab) && regel.ab >= 1)) warn(`Ungültige Stufe in Regel: ${JSON.stringify(regel)}`);
  return ok;
}
