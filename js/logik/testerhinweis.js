// Tester-Hinweis: Regel, wann die Karte erscheint, und Prüfung der Daten und Texte. Reine Funktionen ohne DOM und Uhr.
// Daten: daten/testerhinweis.js. Gespeichert wird { tag: 'JJJJ-MM-TT', version } je Browser (wie die Einwilligung).
// Grundsatz: Kaputte, fehlende oder veraltete Werte gelten als „noch nicht gesehen“ (die Karte erscheint dann einmal
// wieder, das schadet bei einer reinen Information nicht). Das Gegenteil, eine Karte, die nie mehr erscheint, wäre schlimmer.

const TAG = /^\d{4}-\d{2}-\d{2}$/;

export class TesterhinweisFehler extends Error {}

const gueltigeVersion = v => Number.isInteger(v) && v >= 1;

// roh: gespeicherter Wert (Objekt, JSON-Text oder null). Liefert immer ein gültiges Objekt.
// { gesehen, tag, version, veraltet }. Eine Bestätigung aus einer späteren Version bleibt gültig (kein Zurückfallen).
export function lies(roh, version) {
  if (!gueltigeVersion(version)) throw new TesterhinweisFehler(`Ungültige Hinweis-Version: ${version}`);
  let d = roh;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
  const offen = { gesehen: false, tag: null, version, veraltet: false };
  if (!d || typeof d !== 'object' || Array.isArray(d) || !TAG.test(String(d.tag)) || !gueltigeVersion(d.version)) return offen;
  if (d.version < version) return { ...offen, veraltet: true }; // Inhalt hat sich geändert
  return { gesehen: true, tag: d.tag, version: d.version, veraltet: false };
}

// Neue Bestätigung („Verstanden“). Wirft bei ungültigem Datum oder ungültiger Version (Programmierfehler, nicht Nutzerfehler).
export function bestaetige(tag, version) {
  if (!TAG.test(String(tag))) throw new TesterhinweisFehler(`Ungültiges Datum: ${tag}`);
  if (!gueltigeVersion(version)) throw new TesterhinweisFehler(`Ungültige Hinweis-Version: ${version}`);
  return { tag, version };
}

// Erscheint die Karte auf der Startseite? Nur solange nicht bestätigt, und nur mit laufender Quest
// (vorher ist die Startseite noch gar nicht da; Onboarding und Einwilligung haben dann Vorrang).
export const karteOffen = (zustand, hatQuest) => !!hatQuest && !!zustand && zustand.gesehen !== true;

// Alle Textschlüssel, die Karte und Menüeintrag brauchen.
export const testerSchluessel = () => ['tester.eyebrow', 'tester.titel', 'tester.text', 'tester.verweis', 'tester.verstanden', 'tester.menue', 'tester.menueTitel'];

// Konfiguration und Texte prüfen: Liste lesbarer Fehler, leer = in Ordnung.
export function pruefeTesterhinweis(cfg, texte = {}) {
  const f = [];
  if (!cfg || typeof cfg !== 'object') return ['Tester-Hinweis: Daten fehlen'];
  if (!gueltigeVersion(cfg.version)) f.push('Tester-Hinweis: Version ungültig');
  if (typeof cfg.einstellung !== 'string' || !/^[a-z]+$/.test(cfg.einstellung)) f.push('Tester-Hinweis: Name der Einstellung ungültig');
  for (const k of testerSchluessel()) if (typeof texte[k] !== 'string' || !texte[k].trim()) f.push(`Tester-Hinweis: Text fehlt: ${k}`);
  return f;
}
