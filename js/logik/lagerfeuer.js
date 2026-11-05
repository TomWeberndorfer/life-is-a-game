// Lagerfeuer (Etappe 3, Teil C, 02.11.2026): reine Funktionen ohne Oberfläche. Einstellungen: daten/lagerfeuer.js.
// Nichts gespeichert: ob das Feuer brennt, folgt aus den Antworten des Tages (und Ruhetagen). Kein neues Spielstand-Feld.
import { streuwert } from './inhalte.js';
import { ANTWORTEN as ANTWORT } from '../daten/antworten.js'; // Version 141: auch „schwer“ ist eine Antwort

// Gilt ein Held heute als fertig? h: { antwort, ruhetag }. Ein Ruhetag zählt nur mit cfg.ruhetagZaehlt (Standard: ja).
// Eine Antwort schlägt den Ruhetag („Ja“ am Ruhetag bleibt ein Treffer). Wirft nie.
export function heuteErledigt(h, cfg = {}) {
  if (!h || typeof h !== 'object') return false;
  if (ANTWORT.includes(h.antwort) || h.wartet) return true; // wartet: Quest beginnt erst später (Startpaket, 18a)
  return !!h.ruhetag && !(cfg && cfg.ruhetagZaehlt === false);
}

// Art der Zeile je Held: eine Antwort ('ja' | 'nein' | 'schwer') | 'wartet' (Quest beginnt später) | 'ruhetag' | null (noch offen).
export function zeilenArt(h, cfg = {}) {
  if (!h || typeof h !== 'object') return null;
  if (ANTWORT.includes(h.antwort)) return h.antwort;
  if (h.wartet) return 'wartet';
  return heuteErledigt(h, cfg) ? 'ruhetag' : null;
}

// Stand des Lagerfeuers. helden: [{ id, antwort, ruhetag }] in fester Reihenfolge; fokus = gewählter Held.
// Liefert { faellig, sprecher, mitNamen, zeilen: [{ id, art, aktiv }] }.
//   faellig   das Feuer brennt: Funktion an, mindestens ein Held, alle fertig, und der gewählte Held hat eine Antwort
//             (ein Held nur mit Ruhetag steht noch vor seiner Frage; dann bleibt seine Bühne offen)
//   sprecher  der gewählte Held: er ist im normalen Ablauf der, der zuletzt fertig wurde (eine Uhrzeit wird nicht
//             gespeichert, darum kein neues Feld); ist er nicht in der Liste, der letzte fertige
//   mitNamen  Namen in den Zeilen erst ab cfg.abHelden Helden
// Doppelte oder kaputte Einträge fallen weg. Wirft nie.
export function lagerfeuerStand(helden, fokus, cfg = {}) {
  const roh = (Array.isArray(helden) ? helden : []).filter(h => h && typeof h.id === 'string' && h.id);
  const liste = roh.filter((h, i) => roh.findIndex(x => x.id === h.id) === i);
  const zeilen = liste.map(h => ({ id: h.id, art: zeilenArt(h, cfg), aktiv: h.id === fokus }));
  const an = !(cfg && cfg.an === false);
  const gewaehlt = liste.find(h => h.id === fokus);
  const alle = zeilen.length > 0 && zeilen.every(z => z.art !== null);
  const faellig = an && alle && (!gewaehlt || ANTWORT.includes(gewaehlt.antwort));
  const sprecher = gewaehlt ? gewaehlt.id : (zeilen.length ? zeilen[zeilen.length - 1].id : null);
  const ab = Number.isInteger(cfg && cfg.abHelden) && cfg.abHelden >= 1 ? cfg.abHelden : 2;
  return { faellig, sprecher, mitNamen: liste.length >= ab, zeilen };
}

// Satz des Abends: fest je Tag (wechselt täglich, bleibt beim Neuladen und beim Heldenwechsel gleich).
// texte = Liste der Varianten; leer oder kaputt → null (Aufrufer nimmt den Ersatztext).
export function lagerfeuerSatz(texte, tag) {
  const l = (Array.isArray(texte) ? texte : []).filter(t => typeof t === 'string' && t.trim());
  if (!l.length) return null;
  return l[streuwert(`${tag}|lagerfeuer`) % l.length];
}
