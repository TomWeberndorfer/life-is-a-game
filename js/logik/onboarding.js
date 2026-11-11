// Onboarding: Einzelfragen (Version 178): welche Schritte ein Weg hat, Weiter, Zurück, Fortschritt. Reine Funktionen ohne DOM,
// ohne Uhr und ohne Spielstand. Daten und Kontext: daten/onboarding.js. Wirft nie (außer pruefeSchritte meldet Fehler als Liste).
import { ONBOARDING_SCHRITTE, ONBOARDING_NEBEN } from '../daten/onboarding.js';

export const WEGE = Object.freeze(['erst', 'neu', 'kapitel']);
const ID = /^ob[a-z0-9]+$/;

// Kontext absichern: unbekannter Weg → 'erst', fehlende Zahlen → 0, Wahrheitswerte nur bei echtem true.
export function kontextVon(roh) {
  const k = roh && typeof roh === 'object' ? roh : {};
  const zahl = x => (Number.isInteger(x) && x >= 0 ? x : 0);
  return {
    weg: WEGE.includes(k.weg) ? k.weg : 'erst',
    welten: zahl(k.welten),
    datenFrage: k.datenFrage === true,
    bereich: typeof k.bereich === 'string' && k.bereich ? k.bereich : null,
    zielVorlagen: k.zielVorlagen === true,
    freieBereiche: zahl(k.freieBereiche)
  };
}

// Steht der Schritt auf diesem Weg? Eine kaputte Bedingung zeigt den Schritt (lieber eine Frage zu viel als eine fehlende).
function sichtbar(s, k) {
  if (typeof s.zeigen !== 'function') return true;
  try { return s.zeigen(k) === true; } catch (e) { return true; }
}

// Schritte des Weges in Reihenfolge: [id].
export function schritteFuer(roh, liste = ONBOARDING_SCHRITTE) {
  const k = kontextVon(roh);
  return (Array.isArray(liste) ? liste : []).filter(s => s && typeof s.id === 'string' && sichtbar(s, k)).map(s => s.id);
}

export const istSchritt = (id, liste = ONBOARDING_SCHRITTE) => (Array.isArray(liste) ? liste : []).some(s => s && s.id === id);
export const istOnboarding = (id, liste = ONBOARDING_SCHRITTE) => typeof id === 'string' && (istSchritt(id, liste) || ONBOARDING_NEBEN.includes(id) || /^ob\d$/.test(id));

export const ersterSchritt = (roh, liste = ONBOARDING_SCHRITTE) => schritteFuer(roh, liste)[0] || null;

// Bildschirm, der jetzt gilt: ein Schritt dieses Weges bleibt; alles andere, was mit „ob“ beginnt (alte Namen wie ob1, ein
// Schritt, der auf diesem Weg nicht steht), fällt auf den ersten Schritt zurück. Nebenbildschirme (obmehr) bleiben.
export function aufloesen(screen, roh, liste = ONBOARDING_SCHRITTE) {
  if (ONBOARDING_NEBEN.includes(screen)) return screen;
  const l = schritteFuer(roh, liste);
  return l.includes(screen) ? screen : (l[0] || screen);
}

// { nr, n } für „Schritt nr von n“. Unbekannter Bildschirm → nr 1.
export function position(screen, roh, liste = ONBOARDING_SCHRITTE) {
  const l = schritteFuer(roh, liste);
  const i = l.indexOf(screen);
  return { nr: i < 0 ? 1 : i + 1, n: Math.max(1, l.length) };
}

// Nächster Schritt oder null (letzter Schritt oder unbekannt).
export function naechster(screen, roh, liste = ONBOARDING_SCHRITTE) {
  const l = schritteFuer(roh, liste);
  const i = l.indexOf(screen);
  return i < 0 || i >= l.length - 1 ? null : l[i + 1];
}

// Vorheriger Schritt oder null (erster Schritt: dort heißt Zurück „Abbrechen“ bzw. gibt es nicht). Schritte mit
// zurueckUeberspringen werden übersprungen.
export function vorheriger(screen, roh, liste = ONBOARDING_SCHRITTE) {
  const l = schritteFuer(roh, liste);
  let i = l.indexOf(screen);
  if (i <= 0) return null;
  const ueber = new Set((Array.isArray(liste) ? liste : []).filter(s => s && s.zurueckUeberspringen).map(s => s.id));
  for (i -= 1; i >= 0; i--) if (!ueber.has(l[i])) return l[i];
  return null;
}

// Läuft nach diesem Schritt das Welten-Intro? Nur beim Verlassen des ersten Schritts im ersten Start. (Ob es wirklich läuft,
// entscheidet logik/intro.js introFaellig: nur einmal je Spielstand.)
export function introNach(screen, roh, liste = ONBOARDING_SCHRITTE) {
  const k = kontextVon(roh);
  return k.weg === 'erst' && ersterSchritt(k, liste) === screen;
}

// Für die Auswertung: Bildschirm → Name vor Version 178 (Trichter zählt beide). Unbekannt → der Name selbst.
export function altName(screen, liste = ONBOARDING_SCHRITTE) {
  const s = (Array.isArray(liste) ? liste : []).find(x => x && x.id === screen);
  return s && typeof s.alt === 'string' ? s.alt : screen;
}

// Schrittliste prüfen (beim Start und im Test). screens = vorhandene Bildschirm-Namen (optional). Liefert Meldungen, leer = gut.
export function pruefeSchritte(liste = ONBOARDING_SCHRITTE, screens = null) {
  const m = [];
  if (!Array.isArray(liste) || !liste.length) return ['Onboarding: keine Schritte'];
  const ids = new Set();
  for (const s of liste) {
    if (!s || typeof s.id !== 'string' || !ID.test(s.id)) { m.push(`Onboarding: ungültiger Schritt ${s && s.id}`); continue; }
    if (ids.has(s.id)) m.push(`Onboarding: Schritt ${s.id} doppelt`);
    ids.add(s.id);
    if (s.zeigen !== undefined && typeof s.zeigen !== 'function') m.push(`Onboarding: zeigen bei ${s.id} ist keine Funktion`);
    if (s.alt !== undefined && (typeof s.alt !== 'string' || !ID.test(s.alt))) m.push(`Onboarding: alt bei ${s.id} ungültig`);
    if (Array.isArray(screens) && !screens.includes(s.id)) m.push(`Onboarding: kein Bildschirm für ${s.id}`);
  }
  // Jeder Weg braucht Schritte, und der letzte Schritt darf nie übersprungen werden
  const letzter = liste[liste.length - 1];
  if (letzter && (letzter.zeigen !== undefined || letzter.zurueckUeberspringen)) m.push('Onboarding: der letzte Schritt muss auf jedem Weg stehen');
  if (liste[0] && liste[0].zurueckUeberspringen) m.push('Onboarding: der erste Schritt darf nicht übersprungen werden');
  for (const weg of WEGE) if (!schritteFuer({ weg }, liste).length) m.push(`Onboarding: Weg ${weg} hat keine Schritte`);
  return m;
}
