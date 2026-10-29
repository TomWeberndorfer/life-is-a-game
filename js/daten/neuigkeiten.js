// Neuigkeiten als Daten (Version 51, erweitert in Version 59): EINE Quelle für alles, was auf „etwas ist neu“ reagiert:
// Punkt am Tab, Vorziehen auf der Startseite und Glanz beim ersten Erscheinen (Entscheidung 29.10.2026).
// Grundsatz (Entscheidung 28.10.2026): nur echte Neuigkeiten, nie offene Aufgaben (kein Druck, „keine Strafe“),
// und selten, damit nichts zur Gewohnheit wird. Kein Rot, keine Dauerbewegung (Neugier statt Pflicht).
//
// id         Quelle in app.js (NEU_QUELLEN): liefert eine Kennung, solange die Neuigkeit besteht, sonst null
// tab        Tab-ID aus daten/freischaltung.js (TABS), an dem der Punkt erscheint; null = kein Punkt
// bis        nur mit tab: 'erledigt' = Punkt bleibt, bis die Neuigkeit erledigt ist (z. B. Siegel gebrochen)
//            'gesehen' = Punkt verschwindet, sobald der Tab einmal mit dieser Neuigkeit offen war (nur diese Sitzung)
// abschnitt  Abschnitt der Startseite (daten/startseite.js), zu dem die Neuigkeit gehört (optional)
// vorziehen  Abschnitt, hinter den sie rückt (optional). Regel: höchstens EINE Neuigkeit rückt vor, die mit dem
//            kleinsten rang. Rücken alle nach oben, ist nichts mehr besonders und die Heldentat rutscht weg.
// glanz      Bewegung beim ersten Erscheinen (Schlüssel aus daten/bewegung.js → glanz), einmal je Kennung und Gerät
// rang       Vorrang (klein = wichtiger), entscheidet, wer vorrücken darf
// Neue Neuigkeit = neue Zeile hier + Quelle in NEU_QUELLEN. Unbekannte Werte werden beim Start gemeldet und übersprungen.
// Freischaltungen (Version 50) haben eigene Punkte am freigeschalteten Tab (logik/freischaltung.js).

export const NEUIGKEITEN = [
  { id: 'story', tab: 'start', bis: 'erledigt', abschnitt: 'story', vorziehen: 'heldentat', glanz: 'siegel', rang: 1 },  // ein Story-Siegel wartet
  { id: 'welten', tab: 'start', bis: 'erledigt', abschnitt: 'welten', vorziehen: 'heldentat', glanz: 'stern', rang: 2 }, // Weltenwahl wartet
  { id: 'gegner', tab: 'start', bis: 'gesehen', abschnitt: 'duell', glanz: 'kampf', rang: 3 },                       // neuer Gegner (Kapitelwechsel)
  { id: 'botschaft', tab: 'start', bis: 'erledigt', abschnitt: 'botschaft', glanz: 'wippen', rang: 4 },               // Crew-Botschaft heute noch nicht gelesen
  { id: 'angebot', tab: null, abschnitt: 'angebot', glanz: 'stern', rang: 5 }                                         // „Neues Abenteuer?“ (ohne Punkt)
];
