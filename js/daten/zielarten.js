// Zielarten (Teilziele: Fundament, 31.10.2026). Register als Daten wie daten/freischaltung.js: eine neue Art ist ein Eintrag
// hier plus ihre Prüffunktion in logik/teilziele.js (PRUEFER). Logik: logik/teilziele.js.
// Entscheidungen Abschnitt 20: Haupt-Teilziel (trägt Bosskette, Siege, XP) darf nur eine Prozess-Art sein (`prozess: true`).
//
// Felder je Art:
//   name       Anzeigename (deutsch)
//   prozess    true = Verhalten, darf Haupt-Teilziel sein; false = nur beobachten (z. B. Messwert, später)
//   zeitraeume erlaubte Zeiträume; der erste ist der Standard
//   anzahl     { min, max, standard } für Arten mit Anzahl (gilt für den ersten Zeitraum)
//   anzahlJe   optional: eigene Grenzen je Zeitraum, z. B. „gesamt“ braucht größere Zahlen
//   zaehlt     Antworten des Tages-Checks, die für das Haupt-Teilziel zählen (Gegnerkraft, Sieg). XP gibt es weiter nur
//              für „ja“ (kern.XP.anwendung). Fehlt = ['ja'].
//   neben      false = nicht als Stützgewohnheit wählbar (Stützgewohnheiten sind Haken, dort wäre die Art gleich dem Zähler)
//   texte      optional: eigene Textschlüssel (daten/texte.js) statt der allgemeinen, z. B. { frage, erledigtNein, bereit }
export const ZIELARTEN = Object.freeze({
  zaehler: Object.freeze({
    name: 'Zähler',
    prozess: true,
    // Schritt „Zähler“ (31.10.2026, Entscheidung 1a): je Runde oder insgesamt; gezählt wird ein Treffer je Tag
    zeitraeume: Object.freeze(['runde', 'gesamt']),
    anzahl: Object.freeze({ min: 1, max: 7, standard: 3 }),
    anzahlJe: Object.freeze({ gesamt: Object.freeze({ min: 1, max: 100, standard: 10 }) }),
    zaehlt: Object.freeze(['ja'])
  }),
  // Beständigkeit (04.11.2026, Entscheidungen Abschnitt 37) statt einer Serie: gute Tage in der Runde statt „in Folge“.
  // Ein guter Tag ist ein bestätigter Tag: „Getroffen“ (standgehalten) oder „Keine Versuchung“. Ein Tag ohne Eintrag oder
  // ein schwerer Tag ist einfach kein guter Tag; nichts bricht, nichts fällt auf null (Abstinenzverletzungs-Effekt,
  // Marlatt; einzelne Lücken stören die Gewohnheitsbildung kaum, Lally 2009). Höchstens 6 von 7, damit es nie wieder
  // eine lückenlose Serie wird. Logik wie der Zähler (logik/kern.js, runden), Folge und Comeback: logik/bestaendigkeit.js.
  bestaendigkeit: Object.freeze({
    name: 'Beständigkeit',
    prozess: true,
    zeitraeume: Object.freeze(['runde']),
    anzahl: Object.freeze({ min: 1, max: 6, standard: 5 }),
    zaehlt: Object.freeze(['ja', 'nein']),
    neben: false,
    texte: Object.freeze({ frage: 'bst.frage', erledigtJa: 'bst.erledigtJa', erledigtNein: 'bst.erledigtNein', bereit: 'bst.bereit' })
  })
});

// Grenzen und Standard für Teilziele je Quest.
//   max                  höchstens so viele aktive Teilziele (Entscheidung 3, 31.10.2026); archivierte zählen nicht
//   standardArt          Art eines neuen bzw. übernommenen Teilziels
//   hauptZeitraum        Haupt-Teilziel rechnet immer in Runden (Bosskette, Entscheidung 2)
//   nebenAbSiegen        Stützgewohnheiten erst, wenn das Haupt-Teilziel so viele Siege hat (Entscheidung 13c)
//   neuAbNaechsterRunde  neues Teilziel zählt erst ab der nächsten Runde (Entscheidung 5, Rückfrage offen)
//   anzahlSofortOhneTreffer  Anzahl gilt sofort, solange die laufende Runde noch keinen Treffer hat (Entscheidung 5b)
//   nameMax              Länge des Namens einer Stützgewohnheit
//   verlaufMax           so viele Anzahl-Änderungen je Teilziel bleiben erhalten (ältere fließen in den Grundwert)
//   archivMax            so viele archivierte Teilziele bleiben je Quest erhalten (Logbuch)
export const TEILZIELE = Object.freeze({
  max: 3,
  standardArt: 'zaehler',
  hauptZeitraum: 'runde',
  nebenAbSiegen: 2,
  neuAbNaechsterRunde: true,
  anzahlSofortOhneTreffer: true,
  nameMax: 60,
  verlaufMax: 12,
  archivMax: 12
});
