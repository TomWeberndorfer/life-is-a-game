// Neuigkeiten als Daten (Version 51): Punkt am Tab, wenn dort etwas Neues wartet.
// Grundsatz (Entscheidung 28.10.2026): nur echte Neuigkeiten, nie offene Aufgaben (kein Druck, „keine Strafe“),
// und selten, damit der Punkt nicht zur Gewohnheit wird. Auf dem gerade offenen Tab erscheint kein Punkt.
//
// id    Quelle in app.js (NEU_QUELLEN): liefert eine Kennung, solange die Neuigkeit besteht, sonst null
// tab   Tab-ID aus daten/freischaltung.js (TABS), an dem der Punkt erscheint
// bis   'erledigt' = Punkt bleibt, bis die Neuigkeit erledigt ist (z. B. Siegel gebrochen, Botschaft gelesen)
//       'gesehen'  = Punkt verschwindet, sobald der Tab einmal mit dieser Neuigkeit offen war (nur diese Sitzung)
// Neue Neuigkeit = neue Zeile hier + Quelle in NEU_QUELLEN. Unbekannte Zeilen werden beim Start gemeldet und übersprungen.
// Freischaltungen (Version 50) haben eigene Punkte am freigeschalteten Tab (logik/freischaltung.js).

export const NEUIGKEITEN = [
  { id: 'story', tab: 'start', bis: 'erledigt' },     // ein Story-Siegel wartet
  { id: 'botschaft', tab: 'start', bis: 'erledigt' }, // Crew-Botschaft heute noch nicht gelesen
  { id: 'gegner', tab: 'start', bis: 'gesehen' },     // neuer Gegner (Kapitelwechsel)
  { id: 'welten', tab: 'start', bis: 'erledigt' }     // Weltenwahl wartet
];
