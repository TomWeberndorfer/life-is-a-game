// Ziel-Quests (31.10.2026, Entscheidungen Abschnitt 24): zweite Tür im Onboarding „Etwas erreichen“.
// Logik: logik/zielquest.js, Ansicht: ansicht/zielquest.js.
//
// Eine Ziel-Vorlage enthält KEINE eigene Gewohnheit. Sie beschreibt nur das Ergebnis (Messziel) und verweist auf
// Gewohnheits-Vorlagen aus daten/vorlagen.js, die dorthin führen (`wege`, empfohlene zuerst). Gegner, Fähigkeit und
// Geschichte bleiben die bewährten. Neue Ziel-Vorlage = neue Zeile, keine Programmierung.
// Psychologie: Das Ergebnis gibt die Richtung, belohnt wird nur das Verhalten (Bosskette, Siege und XP hängen am
// Zähler; das Messziel gibt nie XP und zählt nie als Niederlage, wie bei den Messzielen seit Version 76).
//
// Felder:
//   id        feste ID (nie ändern, steht nicht im Spielstand, nur in Analytics)
//   gruppe    Onboarding-Gruppe aus daten/vorlagen.js (GRUPPEN)
//   name      Anzeige im Onboarding und Vorschlag für den Quest-Titel
//   text      kurze Erklärung unter dem Namen
//   messziel  Vorbelegung des Formulars: name, einheit, richtung ('hoch'|'runter'), optional ziel, start (Zahlen)
//   wege      IDs aus VORLAGEN (gleiche Gruppe), die als „passt gut“ zuerst stehen; alle anderen der Gruppe folgen
export const ZIEL_VORLAGEN = [
  { id: 'ruecklage', gruppe: 'finanzen', name: 'Rücklage aufbauen', text: 'Ein Polster für Unerwartetes',
    messziel: { name: 'Rücklage', einheit: '€', richtung: 'hoch' }, wege: ['finanzen-sparen', 'finanzen-spontankauf'] },
  { id: 'koerpermass', gruppe: 'gesundheit', name: 'Körpermaß erreichen', text: 'Zum Beispiel Bauchumfang oder Gewicht',
    messziel: { name: 'Bauchumfang', einheit: 'cm', richtung: 'runter' }, wege: ['gesundheit-suess', 'gesundheit-abnehmen', 'gesundheit-bewegung'] },
  { id: 'fitness', gruppe: 'gesundheit', name: 'Fitnesswert steigern', text: 'Zum Beispiel Liegestütze am Stück oder Minuten Laufen',
    messziel: { name: 'Liegestütze am Stück', einheit: 'Wdh.', richtung: 'hoch' }, wege: ['gesundheit-bewegung'] },
  { id: 'projekt', gruppe: 'fokus', name: 'Projekt fertigstellen', text: 'Fortschritt in Prozent, von 0 bis 100',
    messziel: { name: 'Projekt', einheit: '%', richtung: 'hoch', ziel: 100, start: 0 }, wege: ['fokus-aufschieben', 'fokus-ablenkung'] }
];

// „Eigenes Ziel“ steht in jeder Gruppe zur Wahl (Entscheidung 12): freier Name, Einheit und Zielwert, Weg frei aus der Gruppe.
export const ZIEL_EIGEN = Object.freeze({ id: 'eigen', name: 'Eigenes Ziel', text: 'Name, Einheit und Zielwert legst du selbst fest', messziel: { name: '', einheit: '', richtung: 'hoch' }, wege: [] });

// Türen im ersten Schritt (Entscheidung 1ab). Die erste ist vorausgewählt (der bisherige Weg bleibt ein Tipp).
// Später möglich: 'lernen' (Können), siehe Backlog.
export const ZIEL_TUEREN = Object.freeze(['aendern', 'erreichen']);
