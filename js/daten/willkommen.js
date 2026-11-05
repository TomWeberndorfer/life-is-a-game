// Willkommen zurück (Version 98, Etappe 2 B, Entscheidungen Abschnitt 26). Logik: logik/willkommen.js, Ansicht:
// ansicht/willkommen.js. Nach einer Lücke ohne Antwort erscheint statt der halbleeren Runde eine ruhige Seite mit der Wahl
// „Frisch anfangen“ (neue Runde ab heute, Eintragsart „neustart“, logik/kern.js runden) oder „Dort weitermachen“ (Eintrag
// „wiederda“, nur damit die Seite nicht jeden Tag wiederkommt). Keine Zahl verpasster Tage, keine Wertung.
// Psychologie: Neuanfänge erleichtern die Rückkehr (Fresh-Start-Effekt, Dai/Milkman/Riis). Wird Abwesenheit bestraft,
// meidet man die App genau dann, wenn man sie am meisten braucht.
//   abTage    so viele Tage ohne Antwort (ohne heute, Ruhetage zählen nicht) → Seite erscheint
//   gruende   freiwillige Chips „Was war los?“; Text unter 'eintrag.sit.<id>'; gespeichert als situation des Eintrags
//   saetze    Anzahl der Begrüßungssätze des Helden (Texte 'willkommen.satz.1' …); Auswahl je Tag und Held, logik satzNr
//   vorwahl   was je Held vorgewählt ist, wenn mehrere Helden zurückkommen ('wiederda' oder 'neustart')
// Optik (Version 99, 02.11.2026): Begrüßung im Stil-Look statt Formular. Weitermachen ist vorgewählt, weil es die
// kleinste Hürde ist; „Frisch anfangen“ bleibt einen Tipp entfernt.
export const WILLKOMMEN = Object.freeze({ abTage: 3, gruende: Object.freeze(['viel', 'krank', 'urlaub', 'keinekraft', 'anderes']), saetze: 4, vorwahl: 'wiederda' });
