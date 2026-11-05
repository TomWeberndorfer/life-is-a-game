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
//               status (Heldenwahl), runde (Gegnerblatt), wahl (Quest bearbeiten)
export const ZAEHLWEISEN = Object.freeze({
  taeglich: Object.freeze({
    name: 'Täglich',
    tagesfrage: true,
    rundeOffen: false,
    arten: Object.freeze(['zaehler', 'bestaendigkeit']),
    texte: Object.freeze({ wahl: 'zw.taeglich.wahl' })
  }),
  // Rhythmus: 1–3× je Runde, ohne Tagesfrage (z. B. Training). Die Woche ist die Einheit, ein Tag ohne ist kein Fehlschlag.
  rhythmus: Object.freeze({
    name: 'Rhythmus',
    tagesfrage: false,
    rundeOffen: false,
    arten: Object.freeze(['zaehler']),
    texte: Object.freeze({ frage: 'zw.rhythmus.frage', siegel: 'zw.rhythmus.siegel', erledigtJa: 'zw.rhythmus.erledigtJa', hinweis: 'zw.rhythmus.hinweis', status: 'zw.rhythmus.status', wahl: 'zw.rhythmus.wahl' })
  }),
  // Wache: zählt gemeisterte Begegnungen (höchstens eine je Tag), keine Tage. Ein schwerer Moment wird festgehalten und
  // kostet nichts (Eintrag „schwer“). Die Runde läuft, bis der Gegner besiegt ist.
  wache: Object.freeze({
    name: 'Wache',
    tagesfrage: false,
    rundeOffen: true,
    arten: Object.freeze(['zaehler']),
    texte: Object.freeze({ frage: 'zw.wache.frage', erledigtJa: 'zw.wache.erledigtJa', hinweis: 'zw.wache.hinweis', status: 'zw.wache.status', runde: 'zw.wache.runde', wahl: 'zw.wache.wahl' })
  })
});

// standard  Zählweise, wenn am Teilziel nichts steht (Altbestand und neue Quests)
// reihe     Reihenfolge in „Quest bearbeiten“
export const ZAEHLWEISE = Object.freeze({
  standard: 'taeglich',
  reihe: Object.freeze(['taeglich', 'rhythmus', 'wache'])
});
