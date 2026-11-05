// Tägliche Inhalte: Crew-Botschaften, Story-Häppchen, Mikroquests.
// Seit Version 64 (Etappe D1) stehen die TEXTE in claude/inhalte.md (Markdown, in Obsidian bearbeitbar) und werden mit
// claude/werkzeuge/inhalte-uebernehmen.mjs nach inhalte-text.js übernommen (Zuruf „Geschichten übernehmen“).
// Hier bleiben nur Einstellungen; alle Module importieren weiter aus dieser Datei.
// Platzhalter: {verbuendeter} {faehigkeit} {ziel} {n} {rest} {anzahl} {stadtname}
//   {gegner} / {Gegner} = Gegner im Nominativ (klein / am Satzanfang), {er} {Er} {ihn} = passendes Fürwort.
// Botschaften: Anlässe in Prüfreihenfolge (logik/inhalte.js anlass()); der erste passende gewinnt, die Variante wechselt täglich.
// Geschichten: Woche 1 je Gegner (Schlüssel = Gegner-ID), ab Woche 2 die allgemeine Woche (_allgemein).

export { BOTSCHAFTEN, STORIES, MIKRO } from './inhalte-text.js';
import { RUECKBLICK } from './rueckblick.js';
import { LAGERFEUER } from './lagerfeuer.js';
import { SIEGELLEISTE } from './siegelleiste.js'; // Etappe 3, Teil D: Erfolgssatz
import { NOTFALL } from './notfall.js'; // Version 127: Satz Selbstmitgefühl im Ohnmacht-Pfad

// Anlässe, die nicht anlass() (logik/inhalte.js) wählt, sondern eine Ansicht direkt (Etappe 3, Teil C, 02.11.2026):
// Brief im Rundenrückblick, Satz am Lagerfeuer und Erfolgssatz unter der Siegelleiste (Teil D). „Geschichten übernehmen“ meldet sie darum nicht als unbekannt.
// Neuer Sonder-Anlass = hier eintragen (aus den Einstellungen der Funktion, nicht als Text doppelt).
export const SONDER_ANLAESSE = Object.freeze([...Object.values(RUECKBLICK.anlaesse), LAGERFEUER.anlass, ...Object.values(SIEGELLEISTE.erfolg.anlaesse), NOTFALL.mitgefuehl]);

// Mikroquests: so viele erscheinen je Tag; Bereich ohne eigenen Vorrat nutzt MIKRO_RUECKFALL.
export const MIKRO_JE_TAG = 3;
export const MIKRO_RUECKFALL = 'lebensfreude';
