// Einträge (Version 75): was der Spieler selbst festhält, als EIN gemeinsames Modell (Entscheidung 30.10.2026).
// Heute: „geschafft“ (optional nach „Ja“) und „schwer“ (ein schwerer Tag, jederzeit). Später kommen hier Notiz (Logbuch
// ausbauen), Rückfall-Muster und das Obsidian-Mapping dazu, ohne neues Format. Logik: logik/eintraege.js.
//
// Ein Eintrag im Spielstand (spiel.eintraege):
//   { id, heroId, art, tag, gegner, situation, stimmung, text, erstellt }  (+ zustand, Version 127, optional)
//   id        'e-<zeit36>-<zufall>' (stabil, für Bearbeiten, Löschen und Obsidian)
//   tag       'YYYY-MM-DD', der Tag, um den es geht
//   gegner    Gegner-ID zur Zeit des Eintrags oder null (für „Dein Muster“ je Gegner)
//   situation ID aus SITUATIONEN der Art oder null
//   stimmung  1–5 (STIMMUNGEN) oder null
//   text      freier Text bis EINTRAG_TEXT_MAX oder null. Geht NIE in Analytics oder Google-Formular (nur Zähler).
//   erstellt  ISO-Zeitpunkt
//   naechstesMal  (Version 81, Nachbesprechung) freier Text bis EINTRAG_PLAN_MAX: „Was probierst du nächstes Mal?“.
//             Nur bei Arten mit `plan`. Steht nur im Eintrag, wenn ausgefüllt (Altbestand ohne Feld = kein Plan, nichts
//             zu ergänzen). Gibt keine XP (Entscheidung 30.10.2026, Punkt 1b): Wer lernt, soll es aus eigenem Antrieb tun.
// Alle Felder außer id, heroId, art und tag sind freiwillig: ein Eintrag darf leer sein („Heute war es schwer“ reicht).
//
// Je Art:
//   logbuch      Art im Logbuch (daten/logbuch-arten.js), unter der der Eintrag erscheint
//   situationen  Liste der Situations-IDs; Text je ID unter 'eintrag.sit.<id>' in daten/texte.js
//   frage        Textschlüssel der Überschrift im Blatt
//   text         Textschlüssel der Beschriftung des freien Textfelds (optional, sonst 'eintrag.text')
//   plan         Textschlüssel der Frage „Was probierst du nächstes Mal?“ (optional; ohne = kein Feld, Version 81)
//   jeTag        höchstens so viele Einträge dieser Art je Held und Tag (optional, sonst EINTRAEGE_JE_TAG)
//   ohneBlatt    true = entsteht nicht über das Eintragsblatt, sondern über eine eigene Aktion (Version 81: probe)
//   bezug        true = Feld `bezug` (Tag, z. B. Beginn der besprochenen Runde) gehört zum Eintrag (Rundenrückblick)
//   wahlen       Liste erlaubter Werte für das Feld `wahl` (Rundenrückblick: leicht, passt, schwer); Text 'rb.wahl.<id>'
//   zustaende    erlaubte Werte für das Feld `zustand` (Version 127: aus der Notfallkarte, „Was ist gerade da?“).
//                Fehlt das Feld im Eintrag, ist der Zustand unbekannt (Altbestand und „weiß nicht“).
//   verweise     höchstens so viele IDs anderer Einträge im Feld `verweise` (Rundenrückblick: „Was hat geholfen?“)
//   nurMitInhalt true = im Logbuch nur, wenn Text, Wahl oder Verweise da sind (übersprungener Rückblick bleibt still)
//   bereiche     true = gehört zu Lebensbereichen statt zu einem Helden (Tagesnotiz, 04.11.2026): heroId ist null, das Feld
//                `bereiche` ist eine Liste von Lebensbereich-IDs (daten/lebensbereiche.js), leer = „ganzer Tag“.
//                Grund (Entscheidung 04.11.2026): Handlungen hängen am Helden, Reflexion am Lebensbereich. Bereichs-IDs sind
//                fest, Helden kommen und gehen; ein Bereich ohne Helden (z. B. Familie) ist trotzdem wählbar.
//   textFelder   Liste von Namen freier Textfelder im Feld `felder` (Tagesnotiz: gut, schwer), je bis EINTRAG_TEXT_MAX;
//                Beschriftung 'notiz.feld.<name>'. Leere Felder fehlen im Eintrag.
// Jeder Eintrag darf zusätzlich `geaendert` (ISO-Zeitpunkt der letzten Bearbeitung) tragen (Tagesnotiz, 04.11.2026).
// Tonregel (Entscheidung 28.10.2026): nie das Wort „Rückfall“, nie Rot. Ein schwerer Tag zählt nie gegen XP, Runde
// oder Gegnerkraft (wer bestraft wird, schreibt bald nichts mehr hinein).

import { RUECKBLICK } from './rueckblick.js';
import { WILLKOMMEN } from './willkommen.js';
import { NOTFALL } from './notfall.js';
import { DOMAIN_IDS } from './lebensbereiche.js';

export const EINTRAG_ARTEN = {
  geschafft: { logbuch: 'geschafft', frage: 'eintrag.frage.geschafft', zustaende: NOTFALL.merken, situationen: ['vorgenommen', 'erinnert', 'unterstuetzt', 'leichter', 'anderes'] },
  // Version 81: Morgenprobe ausführlich, „Könnte heute kommen“ je Held. Ein Merker ohne Inhalt, höchstens einer je Held und Tag.
  probe: { logbuch: 'probe', frage: 'probe.frage', situationen: [], jeTag: 1, ohneBlatt: true },
  // Version 90: Ruhetag, bewusst ausgesetzter Tag (Regeln: daten/ruhetag.js). Ein Merker ohne Inhalt, auch für künftige
  // Tage (vorab geplant). Verlängert die Runde um einen Tag (logik/kern.js runden), sonst keine Wirkung.
  ruhetag: { logbuch: 'ruhetag', frage: 'ruhetag.titel', situationen: [], jeTag: 1, ohneBlatt: true },
  // Version 98: Willkommen zurück (daten/willkommen.js). „neustart“ beendet die laufende Runde am Vortag, ab dem Tag des
  // Eintrags läuft eine neue (logik/kern.js runden); „wiederda“ merkt nur „Dort weitermachen“. Grund optional (Chips).
  neustart: { logbuch: 'neustart', frage: 'willkommen.titel', situationen: WILLKOMMEN.gruende, jeTag: 1, ohneBlatt: true },
  wiederda: { logbuch: 'wiederda', frage: 'willkommen.titel', situationen: WILLKOMMEN.gruende, jeTag: 1, ohneBlatt: true },
  // Rundenrückblick (Etappe 2 D, 02.11.2026, daten/rueckblick.js): je besprochener Runde einer (bezug = Rundenbeginn).
  // text = „Was hat geholfen?“ (freiwillig, nie in Analytics), wahl = Einschätzung, verweise = angetippte Notizen der Runde.
  rueckblick: { logbuch: 'rueckblick', frage: 'rb.titel', text: 'rb.geholfen', situationen: [], jeTag: 3, ohneBlatt: true, bezug: true, wahlen: RUECKBLICK.wahlen, verweise: RUECKBLICK.verweiseMax, nurMitInhalt: true },
  // Tagesnotiz (04.11.2026): „Wie war dein Tag?“, für einen, mehrere oder keinen Lebensbereich (= ganzer Tag).
  // Keine XP (eigener Grund zu schreiben statt Belohnung von außen), Texte nie in Analytics. Ansicht: ansicht/notiz.js.
  notiz: { logbuch: 'notiz', frage: 'notiz.titel', situationen: [], jeTag: 9, ohneBlatt: true, bereiche: true, textFelder: ['gut', 'schwer'] },
  schwer: { logbuch: 'schwer', frage: 'eintrag.frage.schwer', zustaende: NOTFALL.merken, text: 'eintrag.text.schwer', plan: 'eintrag.plan', situationen: ['stress', 'muede', 'langeweile', 'gefuehl', 'andere', 'gewohnheit', 'anderes'] }
};

// Stimmung 1–5, Text je Stufe unter 'eintrag.stimmung.<wert>' (Schwer, Müde, Ok, Gut, Stark).
export const STIMMUNGEN = [1, 2, 3, 4, 5];

export const EINTRAG_TEXT_MAX = 1000;
// Plan fürs nächste Mal: ein Satz, kein Aufsatz (Version 81).
export const EINTRAG_PLAN_MAX = 300;
// Obergrenze im Spielstand (Speicherplatz). Darüber fallen die ältesten weg (mit Warnung in der Konsole).
export const EINTRAEGE_MAX = 2000;
// Höchstens so viele Einträge einer Art je Held und Tag (schützt vor Doppeltipps; ein Tag braucht selten mehr).
export const EINTRAEGE_JE_TAG = 5;

// Alles zusammen für logik/eintraege.js (dort als `opt` übergeben, damit die Logik ohne Daten testbar bleibt).
export const EINTRAG_OPT = Object.freeze({ arten: EINTRAG_ARTEN, stimmungen: STIMMUNGEN, textMax: EINTRAG_TEXT_MAX, planMax: EINTRAG_PLAN_MAX, max: EINTRAEGE_MAX, jeTag: EINTRAEGE_JE_TAG, bereichIds: DOMAIN_IDS });
