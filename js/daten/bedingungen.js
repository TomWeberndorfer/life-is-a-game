// Bedingungen einer Bosskette (06.11.2026, Entscheidungen Abschnitt 29 und 44): Stufen einer Fähigkeit sind die Gegner der
// Kette; ein späterer Gegner fällt nicht nur durch mehr Treffer, sondern wenn sich die Fähigkeit zeigt (in anderen
// Situationen, mit mehreren Wegen, auch im schweren Moment). Register als Daten wie daten/zielarten.js: eine neue Art =
// Eintrag hier + Prüffunktion in logik/bedingungen.js (PRUEFER). Gesetzt werden sie je Kettenplatz in der Vorlage
// (daten/vorlagen.js, Feld `bedingungen`, gleiche Reihenfolge wie `kette`).
//
// Regeln (Entscheidungen 06.11.2026):
//   - Gezählt wird über ALLE Runden gegen denselben Kettenplatz, nicht je Runde: was schon gezeigt ist, bleibt
//     (keine Verlustangst, kein „alles umsonst“). Nur die Anzahl der Treffer gilt je Runde.
//   - Es zählen nur Begegnungen an Tagen, die für das Haupt-Teilziel zählen (gemeistert), nie ein schwerer Tag.
//   - Bedingungen gelten nur für Quests, die mit Bedingungen angelegt wurden (quest.bedingungen); ältere Quests behalten
//     ihre Regeln. „Ohne Notfallkarte“ gibt es bewusst nicht: Hilfe zu nutzen darf nie etwas kosten.
//
// Felder je Art:
//   name       Anzeigename
//   braucht    Feld einer Begegnung (Eintrag „geschafft“), das die Bedingung braucht: 'gestalt' | 'faehigkeit' |
//              'schwierigkeit'; null = kommt aus den Tagen selbst (Wiedereinstieg)
//   parameter  { name: { min, max, standard } } ganze Zahlen; fehlt ein Wert in der Vorlage, gilt der Standard
//   texte      Textschlüssel (daten/texte.js): stand („Gestalten 1 von 2“), offen („Noch 1 Gestalt“), erfuellt
export const BEDINGUNGEN = Object.freeze({
  // Mehrere Wege: verschiedene Fähigkeiten (die der Vorlage oder eigene mit „So geht es“) über die Begegnungen
  faehigkeiten: Object.freeze({
    name: 'Verschiedene Fähigkeiten',
    braucht: 'faehigkeit',
    parameter: Object.freeze({ n: Object.freeze({ min: 2, max: 5, standard: 2 }) }),
    texte: Object.freeze({ stand: 'bed.faehigkeiten.stand', offen: 'bed.faehigkeiten.offen', offenEins: 'bed.faehigkeiten.offenEins' })
  }),
  // Transfer: der Gegner in verschiedenen Gestalten (Situationen), die man beim Eintragen selbst benennt
  gestalten: Object.freeze({
    name: 'Verschiedene Gestalten',
    braucht: 'gestalt',
    parameter: Object.freeze({ n: Object.freeze({ min: 2, max: 5, standard: 2 }) }),
    texte: Object.freeze({ stand: 'bed.gestalten.stand', offen: 'bed.gestalten.offen', offenEins: 'bed.gestalten.offenEins' })
  }),
  // Auch im schweren Moment: n Begegnungen mit einer Schwierigkeit (0–10, selbst eingeschätzt) von mindestens min
  schwierigkeit: Object.freeze({
    name: 'Mindest-Schwierigkeit',
    braucht: 'schwierigkeit',
    parameter: Object.freeze({ min: Object.freeze({ min: 1, max: 10, standard: 7 }), n: Object.freeze({ min: 1, max: 5, standard: 1 }) }),
    texte: Object.freeze({ stand: 'bed.schwierigkeit.stand', offen: 'bed.schwierigkeit.offen', offenEins: 'bed.schwierigkeit.offenEins' })
  }),
  // Wiedereinstieg: nach dem letzten schweren Tag wieder ein gemeisterter Tag. Gab es keinen schweren Tag, ist sie erfüllt
  // (sonst wäre der Gegner ohne Rückfall unbesiegbar). Keine Frist: ein später Wiedereinstieg zählt genauso.
  wiedereinstieg: Object.freeze({
    name: 'Wiedereinstieg',
    braucht: null,
    parameter: Object.freeze({}),
    texte: Object.freeze({ stand: 'bed.wiedereinstieg.stand', offen: 'bed.wiedereinstieg.offen', offenEins: 'bed.wiedereinstieg.offen' })
  })
});

// Grenzen. maxJePlatz: höchstens so viele Bedingungen je Gegner (mehr wäre eine Checkliste statt eines Gegners).
// schwierigkeit: Skala der Frage „Wie schwer war es?“ im Eintrag. gestaltenMax / faehigkeitenMax: je Held (und Gegner).
// nameMax / soMax: Länge der Namen und des Satzes „So geht es“. vorschlaegeMax / vorschlaegeZeigen: siehe unten.
export const BEDINGUNG_OPT = Object.freeze({
  maxJePlatz: 3,
  schwierigkeit: Object.freeze({ min: 0, max: 10 }),
  gestaltenMax: 12,
  faehigkeitenMax: 8,
  nameMax: 40,
  soMax: 160,
  // Vorgeschlagene Gestalten je Gegner (bosse.md, 06.11.2026): höchstens so viele im Register, davon höchstens
  // vorschlaegeZeigen im Blatt „geschafft“ (nur die, die der Held noch nicht hat). Wenige, damit es keine Abhakliste wird.
  vorschlaegeMax: 8,
  vorschlaegeZeigen: 4
});
