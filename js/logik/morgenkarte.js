// Morgenkarte (Version 173, Entscheidung 10.11.2026, claude/entscheidung-morgenkarte.md): reine Logik ohne Oberfläche.
// Regeln als Daten: PROBE.karte in daten/startseite.js. Ansicht: ansicht/probe.js (morgenkarteHtml).
//
// Auswahl: waehleZeilen() bekommt je Held einen kleinen Steckbrief (Modus, Zählweise, Ziel, Wenn-dann, Gegner) und liefert die
// Zeilen der Karte. Ein Modus ohne Regel (Ruhe) kommt nie vor; Erhalt nur mit Wache und Plan (siehe PROBE.karte).
// Achtung: `modus` ist der Heldenmodus (fokus | erhalt | ruhe), nicht `spiel.fokus` (der Held im Rampenlicht).
//
// Spielstand: spiel.karteGesehen = Tag (YYYY-MM-DD) oder null. Damit gilt „heute gesehen“ auf jedem Gerät. Altbestand ohne Feld = null:
// die Karte erscheint einmal, nichts geht verloren (START-HIER Regel 7).
import { PROBE } from '../daten/startseite.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const KARTE_MAX_STANDARD = 4;
const KARTE_MAX_GRENZE = 8;

// Höchstzahl der Zeilen: ganze Zahl 1–8, sonst 4.
export function kartenMax(opt = PROBE.karte) {
  const m = opt && opt.max;
  return Number.isInteger(m) && m >= 1 && m <= KARTE_MAX_GRENZE ? m : KARTE_MAX_STANDARD;
}

// Prüft die Regeln gegen die vorhandenen Modi und Zählweisen. Liefert Meldungen (leer = in Ordnung), wirft nie.
export function pruefeKartenRegeln(opt = PROBE.karte, modi = [], zaehlweisen = []) {
  const f = [];
  if (!opt || typeof opt !== 'object') return ['Morgenkarte: PROBE.karte fehlt.'];
  if (!Array.isArray(opt.varianten) || !opt.varianten.length) f.push('Morgenkarte: varianten fehlen.');
  else if (!opt.varianten.includes(opt.standard)) f.push('Morgenkarte: standard steht nicht in varianten.');
  if (!opt.regeln || typeof opt.regeln !== 'object' || Array.isArray(opt.regeln)) return [...f, 'Morgenkarte: regeln fehlen.'];
  for (const [modus, r] of Object.entries(opt.regeln)) {
    if (modi.length && !modi.includes(modus)) f.push(`Morgenkarte: unbekannter Modus „${modus}“.`);
    if (!r || typeof r !== 'object') { f.push(`Morgenkarte: Regel für „${modus}“ ist kein Objekt.`); continue; }
    if (r.zaehlweisen !== undefined) {
      if (!Array.isArray(r.zaehlweisen) || !r.zaehlweisen.length) f.push(`Morgenkarte: zaehlweisen für „${modus}“ muss eine nicht leere Liste sein.`);
      else for (const z of r.zaehlweisen) if (zaehlweisen.length && !zaehlweisen.includes(z)) f.push(`Morgenkarte: unbekannte Zählweise „${z}“ bei „${modus}“.`);
    }
    if (r.plan !== undefined && typeof r.plan !== 'boolean') f.push(`Morgenkarte: plan für „${modus}“ muss true oder false sein.`);
  }
  return f;
}

const text = v => (typeof v === 'string' ? v.trim() : '');

// helden: [{ id, modus, zaehlweise, wartet, ziel, wenn, dann, gegner }] in Heldenreihenfolge.
// rampenlicht: ID des Helden im Rampenlicht (steht zuerst) oder null.
// Liefert { zeilen: [{ id, modus, ziel, wenn, dann, gegner }], mehr } (mehr = wie viele wegen des Limits fehlen). Wirft nie.
export function waehleZeilen(helden, { rampenlicht = null, opt = PROBE.karte } = {}) {
  const leer = { zeilen: [], mehr: 0 };
  const regeln = opt && opt.regeln && typeof opt.regeln === 'object' ? opt.regeln : null;
  if (!Array.isArray(helden) || !regeln) return leer;
  const reihe = Object.keys(regeln);
  const passend = [];
  helden.forEach((h, nr) => {
    if (!h || typeof h !== 'object' || typeof h.id !== 'string' || !h.id) return;
    const r = Object.prototype.hasOwnProperty.call(regeln, h.modus) ? regeln[h.modus] : null;
    if (!r || typeof r !== 'object') return;                                   // kein Eintrag (Ruhe) = nie
    if (h.wartet) return;                                                      // Quest beginnt erst später
    if (Array.isArray(r.zaehlweisen) && !r.zaehlweisen.includes(h.zaehlweise)) return;
    const wenn = text(h.wenn), dann = text(h.dann), ziel = text(h.ziel);
    if (r.plan === true && !wenn && !dann) return;
    if (!ziel && !wenn && !dann) return;                                       // nichts, was die Zeile zeigen könnte
    passend.push({ id: h.id, modus: h.modus, ziel, wenn, dann, gegner: typeof h.gegner === 'string' && h.gegner ? h.gegner : null, nr });
  });
  // Rampenlicht zuerst, dann nach Reihenfolge der Regeln (Fokus vor Erhalt), sonst Heldenreihenfolge
  passend.sort((a, b) => ((b.id === rampenlicht) - (a.id === rampenlicht)) || (reihe.indexOf(a.modus) - reihe.indexOf(b.modus)) || (a.nr - b.nr));
  const max = kartenMax(opt);
  return { zeilen: passend.slice(0, max).map(({ nr, ...z }) => z), mehr: Math.max(0, passend.length - max) };
}

// ---------- „heute gesehen“ ----------
export const bereinigeKarteTag = roh => (typeof roh === 'string' && TAG.test(roh) ? roh : null);
export const karteGesehen = (spiel, tag) => !!spiel && TAG.test(String(tag)) && spiel.karteGesehen === tag;
// Neuer Spielstand mit heutigem Tag; ist er schon gesetzt (oder der Tag ungültig), kommt derselbe Spielstand zurück.
export function karteGesehenSetzen(spiel, tag) {
  if (!spiel || typeof spiel !== 'object' || !TAG.test(String(tag)) || spiel.karteGesehen === tag) return spiel;
  return { ...spiel, karteGesehen: tag };
}
// Zeigen? an = Einstellung der Person ('an' | 'aus'), tag = heute. Die Auswahl der Zeilen prüft der Aufrufer.
export const karteFaellig = (spiel, tag, an) => PROBE.an !== false && an === 'an' && !karteGesehen(spiel, tag);
