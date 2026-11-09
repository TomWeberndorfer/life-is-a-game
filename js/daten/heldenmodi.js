// Heldenmodi (04.11.2026, Entscheidungen Abschnitt 36): Energie je Held bewusst ungleich verteilen.
// Fokus = volle Bosskette auf der Startseite · Erhalt = Runde steht still, später mit Mindestaufgabe · Ruhe = Runde steht
// still, der Held rastet. Psychologie: Selbstregulation ist begrenzt; wer alle Lebensbereiche täglich bespielt, kippt in
// eine Pflichtliste und steigt aus („Was-soll's-Effekt“). Eine Pause ohne verlorene Runde schützt davor.
// Gespeichert in spiel.modi = { heroId: [{ ab: 'YYYY-MM-DD', modus }] } (Verlauf, ältester zuerst). Logik: logik/heldenmodi.js.
// Altbestand ohne Feld oder Held ohne Eintrag = `standard` (niemand verliert etwas, alles läuft wie bisher).
// Namen je Stil: stile.js `wort.modus_<id>` (Rückfall Fantasy), kurze Erklärung in texte.js `modus.<id>.text`.
//
// modi        erlaubte Modi in der Reihenfolge der Auswahl
// standard    Modus ohne Eintrag (Altbestand, neuer Held mit Platz)
// pausiert    Modi, in denen die Runde stillsteht (Tage verlängern sie wie Ruhetage, ein „Ja“ zählt nicht für den Gegner)
// fokusMax    höchstens so viele Helden gleichzeitig im Fokus (Einstellung, nicht fest im Code)
// neuOhnePlatz  Modus eines neuen Helden, wenn der Fokus voll ist
// verlaufMax  so viele Wechsel je Held werden höchstens gemerkt (die ältesten fallen weg, der Rest bleibt gültig)
// pauseTageMax  Sicherheitsnetz: so viele Pausentage werden höchstens je Held gezählt (rund 10 Jahre)
// bisMaxTage    Pause mit Rückkehr-Datum (09.11.2026, Urlaub und Krankheit): so weit im Voraus darf die Rückkehr liegen.
//               Ein Eintrag im Verlauf trägt dann `bis` (letzter Pausentag, einschließlich); am Tag danach kehrt der Held
//               automatisch in den Modus davor zurück (Fokus ohne Platz: Erhalt). Ohne `bis` gilt die Pause wie bisher unbefristet.
export const HELDENMODI = Object.freeze({
  modi: ['fokus', 'erhalt', 'ruhe'],
  standard: 'fokus',
  pausiert: ['erhalt', 'ruhe'],
  fokusMax: 3,
  neuOhnePlatz: 'erhalt',
  verlaufMax: 60,
  pauseTageMax: 3700,
  bisMaxTage: 366
});

// Mindestaufgabe im Erhalt (04.11.2026, zweiter Teil der Heldenmodi, Entscheidungen Abschnitt 36): „Was ist das Kleinste,
// das noch zählt?“ Psychologie: Im Erhalt soll die Gewohnheit nicht auf null fallen („nie null“). Die Hürde ist bewusst
// klein; darüber hinaus gibt es keine XP (kein Farmen), darunter keine Strafe (der nächste Zeitraum beginnt still bei null).
// Gespeichert in spiel.mindest = { heroId: { aufgabe?: { taetigkeit, anzahl, zeitraum, zaehltFuer }, haken: { tag: { xp, stuetze } } } }.
// Der Zeitraum zählt ab dem Wechsel in den Erhalt (Eintrag in spiel.modi), nicht ab dem Kalender. Logik: logik/mindest.js,
// Bereinigen und XP-Tage in logik/heldenmodi.js (ohne Abhängigkeit von helden.js).
//
// modi            in diesen Modi gilt die Mindestaufgabe (anzeigen und abhaken)
// zeitraeume      id → { tage } (feste Länge) oder { monate } (Kalendermonate ab dem Wechsel); max = höchste Anzahl
// standardZeitraum  Vorauswahl im Formular
// anzahlMin       kleinste Anzahl
// taetigkeitMax   Länge der Tätigkeit
// xp              XP-Schlüssel aus kern.XP für einen Haken bis zur Anzahl („wie ein Treffer ohne Bonus“)
// hakenMax        Sicherheitsnetz: so viele Haken je Held werden höchstens gelesen (rund 10 Jahre)
export const MINDEST = Object.freeze({
  modi: ['erhalt'],
  zeitraeume: Object.freeze({
    woche: Object.freeze({ tage: 7, max: 7 }),
    zweiWochen: Object.freeze({ tage: 14, max: 14 }),
    monat: Object.freeze({ monate: 1, max: 31 })
  }),
  standardZeitraum: 'woche',
  anzahlMin: 1,
  taetigkeitMax: 60,
  xp: 'anwendung',
  hakenMax: 3700
});
