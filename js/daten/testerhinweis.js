// Tester-Hinweis (Entscheidung 09.11.2026): einmalige, ruhige Karte „Du testest eine frühe Version“ unter den Neuigkeiten
// der Startseite, dazu der Eintrag „Info & Datenschutz“ unter Einstellungen › Testphase (immer da, ohne Knopf).
// Texte: daten/texte.js (`tester.*`), Oberfläche: ansicht/testerhinweis.js, Regel und Prüfung: logik/testerhinweis.js.
// Psychologie: Wer weiß, dass die App eine frühe Version ist, deutet einen Fehler als „Test“ und nicht als eigenes
// Scheitern. Der Hinweis nennt Grenzen offen und gibt die Kontrolle zurück (Autonomie), ohne Angst, Pflicht oder Zähler.
//
// version        Hinweis-Version. Nur erhöhen, wenn sich der Inhalt wesentlich ändert (z. B. neuer Speicherort);
//                dann sehen alle die Karte noch einmal. Reine Wortkorrekturen brauchen keine neue Version.
// einstellung    Name der Einstellung je Browser (speicher.js `einstellung`, wie die Einwilligung): bleibt beim
//                Zurücksetzen des Spielstands erhalten, gehört nicht in den Spielstand (kein Datenmodell-Umbau).
//                Gespeichert wird { tag, version }. Das ist KEINE Einwilligung: sie steht in daten/forschung.js.
export const TESTERHINWEIS = Object.freeze({
  version: 1,
  einstellung: 'testerhinweis'
});
