// Freischaltung als Daten (Version 37): untere Leiste und Funktionen außerhalb der Leiste.
// Ändern ohne Programmierung: Regel `frei` anpassen, Tab ergänzen oder umsortieren.
// Regeln (geprüft in logik/freischaltung.js):
//   { art: 'immer' }                             frei von Anfang an (auch: kein `frei`)
//   { art: 'sieg' }                              nach dem ersten Sieg eines Helden
//   { art: 'stufe', ab: 3 }                      sobald der höchste Held diese Stufe erreicht
//   { art: 'zaehler', name: 'rueckfaelle', ab: 1 } sobald ein Zähler den Wert erreicht (Namen: ZAEHLER)
// Unbekannte oder kaputte Regeln sperren (sicherer Rückfall) und erscheinen als Warnung in der Konsole.

// Zähler, die Regeln abfragen dürfen. Ein Zähler, den die App noch nicht erfasst, gilt als 0.
// rueckfaelle: kommt mit dem Eintrag Sieg/Rückfall (Startseite Phase D); bis dahin immer 0.
export const ZAEHLER = ['siege', 'rueckfaelle'];

// Untere Leiste, höchstens MAX_TABS Einträge (Handybreite).
// label: { text: '<Textschlüssel>' } oder { wort: '<Stil-Wort>' } (z. B. Stadt heißt in Sci-Fi „Station“).
// sperrText: Textschlüssel für den Hinweis beim Antippen eines gesperrten Tabs (optional).
//   Ohne sperrText: bei Stufen-Regeln „öffnet sich ab Stufe X“, sonst ein allgemeiner Satz.
// bald: true = Bereich ist noch nicht gebaut; frei geschaltet zeigt er den Platzhalter „kommt bald“.
export const MAX_TABS = 5;
export const TABS = [
  { screen: 'start', label: { text: 'tab.start' }, icon: 'haus' },
  { screen: 'stadt', label: { wort: 'stadt' }, icon: 'burg', frei: { art: 'sieg' }, sperrText: 'tab.stadtGesperrt' },
  { screen: 'logbuch', label: { text: 'tab.logbuch' }, icon: 'buch', frei: { art: 'stufe', ab: 2 } }, // gebaut seit Version 41
  { screen: 'karte', label: { text: 'tab.karte' }, icon: 'karte', frei: { art: 'stufe', ab: 4 }, bald: true },
  { screen: 'gruppe', label: { text: 'tab.gruppe' }, icon: 'menschen', frei: { art: 'stufe', ab: 4 }, bald: true }
];

// Funktionen außerhalb der Leiste (Entscheidung 27.10.2026). Noch nicht gebaut; die Regeln gelten,
// sobald die Funktion zurückkommt (Abfrage: funktionFrei('<id>') in app.js).
// - quests_bearbeiten: nie gesperrt (Grundfunktion, keine Belohnung)
// - notfallkarte: nach Bedarf, beim ersten Rückfall (nicht nach Stufe: Rückfälle passieren gerade am Anfang)
// - wochenrunden, wheel: ab Stufe 3 (vorher gibt es noch nichts zurückzublicken)
export const FUNKTIONEN = {
  quests_bearbeiten: { frei: { art: 'immer' } },
  notfallkarte: { frei: { art: 'zaehler', name: 'rueckfaelle', ab: 1 } },
  wochenrunden: { frei: { art: 'stufe', ab: 3 } },
  wheel: { frei: { art: 'stufe', ab: 3 } }
};
