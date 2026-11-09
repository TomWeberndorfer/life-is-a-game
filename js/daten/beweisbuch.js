// Brief an mein künftiges Ich und Beweisbuch (Version 166, 08.11.2026). Daten; Logik: logik/beweisbuch.js, Oberfläche:
// ansicht/beweisbuch.js, Texte: daten/texte.js (`brief.*`, `beweis.*`, `einst.beweis*`, `notfall.*beleg*`, `willkommen.gruss*`).
//
// Psychologie (kurz): Wer in einem schweren Moment die eigenen Worte und die eigenen Belege liest, glaubt sie eher als
// fremden Zuspruch (Selbstwirksamkeit aus eigenen Erfolgen, Abstand zum Moment). Darum ist alles freiwillig und kommt nie als
// Pflicht oder Erinnerung; ein Brief ist eine Ermutigung, kein Versprechen („Du hast mir versprochen …“ wäre ein Vorwurf).
// Beim Rückfall in ein altes Muster zeigt die App höchstens EIN Element (Brief, sonst ein markierter Eintrag), nie eine Liste.
//
//   art        Eintragsart des Briefs (daten/eintrag-arten.js)
//   anregung   leise Karte auf der Startseite (NEU_PLATZ.leise, ID 'brief'): einmal, nach dem ersten Sieg eines Helden,
//              nur solange es noch keinen Brief gibt. `merkmal` = Geräte-Merkmal (analytics.js merke), gesetzt sobald die
//              Karte beantwortet ist („Später“ zählt wie gesehen: nichts wird zur offenen Aufgabe). `abSiegen` = ab so vielen
//              Siegen eines Helden.
//   notfall    Abschnitt der Notfallkarte (NOTFALL.pfade) und die Abschnitte, die er ersetzt, solange er etwas zeigt
//              (sonst zeigten „Du hast das schon geschafft“ und der Beleg oft denselben Eintrag)
//   willkommen true = „Willkommen zurück“ zeigt einen leisen Gruß des früheren Ichs (Brief, sonst markierter Eintrag)
export const BEWEISBUCH = Object.freeze({
  art: 'brief',
  anregung: Object.freeze({ merkmal: 'brief_angeregt', abSiegen: 1 }),
  notfall: Object.freeze({ abschnitt: 'beleg', ersetzt: Object.freeze(['frueher']) }),
  willkommen: true
});
