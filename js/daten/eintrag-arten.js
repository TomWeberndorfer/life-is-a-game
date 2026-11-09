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
//   antworten    Fragen mit erlaubten Antworten { frage: [werte] } im Feld `antworten` { frage: wert } (Plan-Check, Version 167);
//                Texte 'antwort.<frage>.<wert>' (Knopf) und 'antwort.lb.<frage>.<wert>' (Logbuch). Fehlt die Frage, wurde sie nicht gestellt.
//   nurMitInhalt true = im Logbuch nur, wenn Text, Wahl oder Verweise da sind (übersprungener Rückblick bleibt still)
//   bereiche     true = gehört zu Lebensbereichen statt zu einem Helden (Tagesnotiz, 04.11.2026): heroId ist null, das Feld
//                `bereiche` ist eine Liste von Lebensbereich-IDs (daten/lebensbereiche.js), leer = „ganzer Tag“.
//                Grund (Entscheidung 04.11.2026): Handlungen hängen am Helden, Reflexion am Lebensbereich. Bereichs-IDs sind
//                fest, Helden kommen und gehen; ein Bereich ohne Helden (z. B. Familie) ist trotzdem wählbar.
//   textFelder   Liste von Namen freier Textfelder im Feld `felder` (Tagesnotiz: gut, schwer), je bis EINTRAG_TEXT_MAX;
//                Beschriftung 'notiz.feld.<name>'. Leere Felder fehlen im Eintrag.
//   heldOptional true = darf an einem Helden hängen oder ohne Held stehen (heroId null = gilt für alle; Brief, Version 166).
//                Ein unbekannter Held (gelöscht) macht den Eintrag zu „ohne Held“, nichts geht verloren.
//   textMax      eigene Obergrenze für `text` (sonst EINTRAG_TEXT_MAX); Brief: BRIEF_TEXT_MAX
//   maxJeHeld    höchstens so viele Einträge dieser Art je Held (heroId null zählt als eigene Gruppe), damit der Spielstand
//                nicht unbemerkt wächst (Brief: BRIEFE_JE_HELD)
//   merkbar      true = trägt das Feld `merken` (true, nur wenn gesetzt; Stern „Das will ich mir merken“, Version 166).
//                Markierte Einträge bilden das Beweisbuch (logik/beweisbuch.js). Altbestand ohne Feld = nicht markiert.
//   ohneLogbuch  true = erscheint nie im Logbuch und braucht darum kein Feld `logbuch` (Brief: sein Ort ist das Beweisbuch,
//                privat und nicht Teil des Tagesstroms)
// Jeder Eintrag darf zusätzlich `geaendert` (ISO-Zeitpunkt der letzten Bearbeitung) tragen (Tagesnotiz, 04.11.2026).
// Tonregel (Entscheidung 28.10.2026): nie das Wort „Rückfall“, nie Rot. Ein schwerer Tag zählt nie gegen XP, Runde
// oder Gegnerkraft (wer bestraft wird, schreibt bald nichts mehr hinein).

import { RUECKBLICK } from './rueckblick.js';
import { WILLKOMMEN } from './willkommen.js';
import { NOTFALL } from './notfall.js';
import { DOMAIN_IDS } from './lebensbereiche.js';
import { PLANCHECK } from './plancheck.js';

// Brief an mein künftiges Ich (Version 166): kurz genug, um ihn in einem schweren Moment ganz zu lesen; höchstens 10 je Held.
export const BRIEF_TEXT_MAX = 600;
export const BRIEFE_JE_HELD = 10;

export const EINTRAG_ARTEN = {
  // begegnung (06.11.2026, Bosskette mit Bedingungen): darf Gestalt, Fähigkeit und Schwierigkeit 0–10 tragen (alle freiwillig;
  // das Blatt fragt sie nur, wenn der Gegner eine offene Bedingung dafür hat).
  geschafft: { logbuch: 'geschafft', frage: 'eintrag.frage.geschafft', zustaende: NOTFALL.merken, begegnung: true, merkbar: true, situationen: ['vorgenommen', 'erinnert', 'unterstuetzt', 'leichter', 'anderes'] },
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
  // Plan- und Warum-Check (Version 167, daten/plancheck.js): antworten = „Hat dein Wenn-dann gegriffen?“ und „Gilt dein Warum noch?“,
  // naechstesMal = eigener Plan bei „Manchmal“ oder „Nein“. Ein Eintrag ohne Inhalt (Diesmal nicht) bleibt im Logbuch still.
  // Keine XP, Texte nie in Analytics. Ansicht: ansicht/plancheck.js.
  plancheck: { logbuch: 'plancheck', frage: 'pc.titel', plan: 'pc.plan', situationen: [], jeTag: 1, ohneBlatt: true, antworten: PLANCHECK.antworten, nurMitInhalt: true },
  // Tagesnotiz (04.11.2026): „Wie war dein Tag?“, für einen, mehrere oder keinen Lebensbereich (= ganzer Tag).
  // Keine XP (eigener Grund zu schreiben statt Belohnung von außen), Texte nie in Analytics. Ansicht: ansicht/notiz.js.
  notiz: { logbuch: 'notiz', frage: 'notiz.titel', situationen: [], jeTag: 9, ohneBlatt: true, bereiche: true, textFelder: ['gut', 'schwer'], merkbar: true },
  // Brief an mein künftiges Ich (Version 166, 08.11.2026): ein Text in der eigenen Stimme für einen schweren Moment. Hängt
  // optional an einem Helden (heroId) oder gilt für alle (null). Keine XP, nie Pflicht, nie in Analytics. Ansicht: ansicht/beweisbuch.js.
  brief: { frage: 'brief.titel', situationen: [], jeTag: 3, ohneBlatt: true, heldOptional: true, textPflicht: true, textMax: BRIEF_TEXT_MAX, maxJeHeld: BRIEFE_JE_HELD, ohneLogbuch: true },
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
