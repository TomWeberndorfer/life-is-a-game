// Zählweisen (04.11.2026, Entscheidungen Abschnitt 36): zweite Achse neben der Zielart. Die Zielart sagt, WAS zählt
// (Zähler: „Getroffen“, Beständigkeit: gute Tage); die Zählweise sagt, WANN gefragt und wie lange gekämpft wird.
// Register als Daten wie daten/zielarten.js; Logik: logik/teilziele.js (zaehlweiseFuer, hauptZaehlweise) und
// logik/kern.js (runden). Gespeichert am Haupt-Teilziel als `zaehlweise` (fehlt = standard) und `zwVerlauf`
// ([{ ab, zaehlweise }] ab Runde `ab`, wie der Anzahl-Verlauf: vergangene Runden behalten ihre Zählweise).
//
// Psychologie: Wenn-dann-Pläne werden von der Situation ausgelöst, nicht von einer täglichen Erinnerung (Gollwitzer).
// Eine tägliche Pflichtfrage für etwas, das 2× pro Woche dran ist oder nur bei Anlass, erzeugt Leerlauf-Antworten und
// kippt in Pflicht („Was-soll's-Effekt“). Ohne Tagesfrage gilt ein Held nie als „offen“; ein Tag ohne Eintrag ist neutral.
//
// Felder je Zählweise:
//   name        Anzeigename (deutsch)
//   tagesfrage  true = der Held fragt täglich und gilt bis zur Antwort als offen (Tagesleiste, Lagerfeuer, Willkommen
//               zurück, „Gestern noch offen?“); false = eintragen, wenn es passiert ist (nur „Getroffen“, kein „Keine
//               Versuchung“)
//   rundeOffen  true = die Runde hat kein Zeitlimit und endet nur mit einem Sieg (Wache: fehlen Anlässe, darf das nie
//               wie eine verlorene Runde aussehen); false = höchstens 7 Tage wie bisher (kern.RUNDE_TAGE)
//   arten       Zielarten, mit denen die Zählweise geht (Beständigkeit braucht die Tagesfrage, darum nur täglich)
//   texte       Textschlüssel (daten/texte.js), gehen vor den Texten der Zielart: frage, siegel, erledigtJa, hinweis,
//               status (Heldenwahl), runde (Gegnerblatt), wahl (Quest bearbeiten), name (Anzeigename, Version 179),
//               kappe/kappeEins/kappeNull/kappeKurz (Beschriftung unter dem Ring in der Tagesleiste, Version 179),
//               anzahl/anzahlZiel/anzahlHilfe/anzahlHilfeEins (was die Zahl in „Quest bearbeiten“ heißt, Version 181)
//   kappeZahl   (Version 179) welche Zahl der Auswertung unter dem Ring steht: 'wocheZaehler' = Erreichtes der laufenden Runde
//               (Wache: gemeisterte Momente), 'anzahl' = Takt (Rhythmus: so oft je Runde). Fehlt = keine Zahl.
//   symbol      (Version 179) kleines Zeichen am Ring statt des Punkts „offen“ (daten/symbole.js); ein Stil kann es über
//               `symbole` mit dem Schlüssel „zaehlweise.<id>“ ändern. Fehlt = kein Zeichen.
// Version 179 (Entscheidung 10.11.2026, Punkte 10a und 13): die Namen sagen, was man tut („Ein paar Mal pro Woche“,
// „Wenn die Situation kommt“), statt einer Kategorie („Rhythmus“, „Wache“). Die IDs bleiben (kein Umbau des Spielstands).
export const ZAEHLWEISEN = Object.freeze({
  taeglich: Object.freeze({
    name: 'Jeden Tag',
    tagesfrage: true,
    rundeOffen: false,
    arten: Object.freeze(['zaehler', 'bestaendigkeit']),
    texte: Object.freeze({ wahl: 'zw.taeglich.wahl', name: 'zw.taeglich.name', anzahl: 'zw.taeglich.anzahl', anzahlZiel: 'zw.taeglich.anzahlZiel', anzahlHilfe: 'zw.taeglich.anzahlHilfe' })
  }),
  // Rhythmus: 1–3× je Runde, ohne Tagesfrage (z. B. Training). Die Woche ist die Einheit, ein Tag ohne ist kein Fehlschlag.
  rhythmus: Object.freeze({
    name: 'Ein paar Mal pro Woche',
    kappeZahl: 'anzahl',
    symbol: 'takt',
    tagesfrage: false,
    rundeOffen: false,
    arten: Object.freeze(['zaehler']),
    texte: Object.freeze({ frage: 'zw.rhythmus.frage', siegel: 'zw.rhythmus.siegel', erledigtJa: 'zw.rhythmus.erledigtJa', hinweis: 'zw.rhythmus.hinweis', status: 'zw.rhythmus.status', wahl: 'zw.rhythmus.wahl', name: 'zw.rhythmus.name', anzahl: 'zw.rhythmus.anzahl', anzahlZiel: 'zw.rhythmus.anzahlZiel', anzahlHilfe: 'zw.rhythmus.anzahlHilfe', kappe: 'zw.rhythmus.kappe', kappeKurz: 'zw.rhythmus.kappeKurz' })
  }),
  // Wache: zählt gemeisterte Begegnungen (höchstens eine je Tag), keine Tage. Ein schwerer Moment wird festgehalten und
  // kostet nichts (Eintrag „schwer“). Die Runde läuft, bis der Gegner besiegt ist.
  wache: Object.freeze({
    name: 'Wenn die Situation kommt',
    kappeZahl: 'wocheZaehler',
    symbol: 'auge',
    tagesfrage: false,
    rundeOffen: true,
    arten: Object.freeze(['zaehler']),
    texte: Object.freeze({ frage: 'zw.wache.frage', erledigtJa: 'zw.wache.erledigtJa', hinweis: 'zw.wache.hinweis', status: 'zw.wache.status', runde: 'zw.wache.runde', wahl: 'zw.wache.wahl', name: 'zw.wache.name', anzahl: 'zw.wache.anzahl', anzahlZiel: 'zw.wache.anzahlZiel', anzahlHilfe: 'zw.wache.anzahlHilfe', anzahlHilfeEins: 'zw.wache.anzahlHilfeEins', kappe: 'zw.wache.kappe', kappeEins: 'zw.wache.kappeEins', kappeNull: 'zw.wache.kappeNull', kappeKurz: 'zw.wache.kappeKurz' })
  })
});

// standard  Zählweise, wenn am Teilziel nichts steht (Altbestand und neue Quests)
// reihe     Reihenfolge in „Quest bearbeiten“
export const ZAEHLWEISE = Object.freeze({
  standard: 'taeglich',
  reihe: Object.freeze(['taeglich', 'rhythmus', 'wache'])
});
