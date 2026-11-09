// Auffrischung nach langer Pause (Version 159, Entscheidungen Abschnitt 29 „Lange Pause: Auffrischung ohne Verlust“, 6a).
// Logik: logik/auffrischung.js. Nichts davon wird gespeichert: Ob ein Bonus gilt, folgt jedes Mal aus den Antworten des
// Helden (wie alle XP, siehe logik/kern.js auswertung). Kein neues Spielstand-Feld, keine Migration.
//
// Was passiert: Liegt zwischen zwei Antworten eines Helden eine Lücke von mindestens `abTage` Tagen (Ruhetage und Tage in
// Erhalt oder Ruhe zählen nicht), bekommt er am ersten guten Tag danach einmalig `xp` Bonus-XP. Der Fortschritt gegen den
// Gegner bleibt unverändert: kein Abzug, kein Aufholdruck. Davor begrüßt „Willkommen zurück“ (ansicht/willkommen.js) mit
// einem zusätzlichen Satz.
//
//   an      false = kein Bonus und kein Zusatzsatz (vorhandene Spielstände bleiben unverändert)
//   abTage  so viele Tage ohne Antwort (Ruhetage und Pausen zählen nicht, beide Antworten ausgeschlossen) bilden eine „lange Pause“
//   xp      einmaliger Bonus am ersten guten Tag danach; nie größer als ein normaler Treffer (XP.anwendung in logik/kern.js)
//
// Psychologie: Ein klarer Neuanfang erleichtert die Rückkehr (Fresh-Start-Effekt, Dai/Milkman/Riis 2014). Der Bonus soll
// den ersten Schritt zurück erleichtern, nicht das Wegbleiben belohnen: darum eine hohe Schwelle (14 Tage), ein fester Betrag
// ohne Wachstum mit der Pausenlänge, höchstens einmal je Pause, und er wird vorher nicht angekündigt. Eine hohe oder
// wachsende Belohnung würde die Motivation von innen nach außen verschieben (Überrechtfertigungseffekt, Deci) und das
// geplante Pausieren attraktiv machen. Verworfen: „Einrosten“ (Abzug oder Verlust nach Pausen; setzt auf Verlustangst und
// erzeugt Schuld genau beim Wiedereinstieg).
export const AUFFRISCHUNG = Object.freeze({ an: true, abTage: 14, xp: 10 });
