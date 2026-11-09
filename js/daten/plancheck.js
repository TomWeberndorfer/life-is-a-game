// Plan- und Warum-Check (Version 167, 08.11.2026). Logik: logik/plancheck.js, Oberfläche: ansicht/plancheck.js,
// Eintragsart `plancheck` in daten/eintrag-arten.js, Texte: daten/texte.js (`pc.*`, `antwort.*`, `lb.plancheck`).
//
// Nach einigen Rückblicken fragt eine leise Karte kurz: „Hat dein Wenn-dann gegriffen?“ und „Gilt dein Warum noch?“.
// Psychologie: Ein Plan (Wenn-dann, Implementation Intention) und ein Warum tragen nur, solange sie zur Lage passen. Wer
// nie nachsieht, hält an einem Plan fest, der längst nicht mehr trägt, und hält dann sich für das Problem. Die Frage
// richtet sich darum auf den PLAN, nie auf die Person: „Nein“ ist eine gute, ehrliche Antwort und führt zu einem Vorschlag
// (eigener Plan, neu gefasstes Warum), nie zu einem Abzug. Alles ist freiwillig, ohne XP, ohne Zähler, nie Pflicht.
//
//   art         Eintragsart (daten/eintrag-arten.js)
//   nach        so viele Rückblicke (aller Helden zusammen, übersprungene zählen mit) müssen seit dem letzten Check
//               besprochen sein, bevor die Karte wieder erscheint (ganze Zahl 1–52, sonst 4). Nach jedem Check gleich,
//               auch nach „Ja“: ein Plan darf sich ändern, ohne dass man es merkt.
//   fragen      Reihenfolge der Fragen auf der Seite; je Frage die erlaubten Antworten unter `antworten`
//               (Texte: 'antwort.<frage>.<wert>' für die Knöpfe, 'antwort.lb.<frage>.<wert>' fürs Logbuch)
//   plan        Antworten der Frage „wenndann“, nach denen die Seite „Was probierst du stattdessen?“ anbietet
//   warumNeu    Antworten der Frage „warum“, nach denen die Seite ein Feld zum Neu-Fassen anbietet
//   merkmalHeute  Geräte-Merkmal (analytics.js merke): Tag, an dem „Später“ gewählt wurde. Die Karte ruht an diesem Tag
//               und kommt am nächsten Tag leise wieder, solange nichts beantwortet ist.
export const PLANCHECK = Object.freeze({
  art: 'plancheck',
  nach: 4,
  fragen: Object.freeze(['wenndann', 'warum']),
  antworten: Object.freeze({
    wenndann: Object.freeze(['ja', 'manchmal', 'nein']),
    warum: Object.freeze(['ja', 'nein'])
  }),
  plan: Object.freeze(['manchmal', 'nein']),
  warumNeu: Object.freeze(['nein']),
  merkmalHeute: 'plancheck_heute'
});
