// Wochenrunde (05.11.2026, Entscheidungen Abschnitt 36): Steuerpult für etwa 5 Minuten, einmal je Woche.
// Drei Schritte, jeder überspringbar: 1. Wheel of Life (Zufriedenheit je Lebensbereich), 2. kurzer Rückblick (was je Held
// geschafft wurde) mit einem Vorsatz für die nächste Woche, 3. Energie verteilen (Heldenmodi Fokus · Erhalt · Ruhe).
// Logik: logik/wochenrunde.js, Ansicht: ansicht/wochenrunde.js. Freischaltung: FUNKTIONEN.wochenrunden (ab Stufe 3).
// Gespeichert in spiel.wochen = { 'JJJJ-Www': { max, wheel: { bereichId: 1..max }, vorsatz, vorsatzHeld, abgeschlossen } }.
// vorsatzHeld (05.11.2026, Punkt 3a): optionaler Held des Vorsatzes; ohne Held erscheint er beim ersten Helden im Fokus.
// Altbestand ohne Feld → {} (es gab noch keine Wochenrunde, nichts geht verloren).
// Psychologie: Selbsteinschätzung macht Ungleichgewicht sichtbar, ohne zu urteilen; ein konkreter Vorsatz wirkt wie ein
// Wenn-dann-Plan (Gollwitzer). Darum keine XP, keine Serie, kein Zähler (Überrechtfertigung, Schuldgefühle bei Ausfall).
// Ein sinkender Wert bei einem Helden im Erhalt lädt ein („Magst du … wieder in den Fokus holen?“), ohne Rot und Mahnung.
//
// skala.min/max       Zufriedenheit von min bis max (1–10). Jede Woche merkt sich ihr max; ändert sich die Skala später,
//                     rechnet die Anzeige alte Werte um, statt sie zu überschreiben.
// einladung.schwelle  so viele Punkte (auf der aktuellen Skala) muss ein Bereich gegenüber der Vorwoche fallen, damit
//                     der Schritt „Energie“ einlädt
// einladung.modi      nur Helden in diesen Modi werden eingeladen (Ruhe ist eine bewusste Pause, keine Einladung)
// tag                 Rundentag: 0 = Sonntag, 1 = Montag … 6 = Samstag (Ortszeit)
// nachholTage         so viele Tage danach erscheint die Karte noch, wenn die Runde offen ist (Sonntag + 1 = Montag)
// weg                 Name der Browser-Einstellung für „Diese Woche nicht“ (gemerkt je Gerät: die Woche des Tipps)
// vorsatzMax          Länge des Vorsatzes
// vorsatzTage         so viele Tage nach dem Abschließen erscheint der Vorsatz beim Helden (Woche + Nachholtag)
// wochenMax           so viele Wochen werden höchstens gemerkt (die ältesten fallen weg; rund 5 Jahre)
// schritte            Reihenfolge der Schritte; Text 'wr.schritt.<id>'
export const WOCHENRUNDE = Object.freeze({
  skala: Object.freeze({ min: 1, max: 10 }),
  einladung: Object.freeze({ schwelle: 2, modi: Object.freeze(['erhalt']) }),
  tag: 0,
  nachholTage: 1,
  weg: 'wocheWeg',
  vorsatzMax: 200,
  vorsatzTage: 8,
  wochenMax: 260,
  schritte: Object.freeze(['wheel', 'rueckblick', 'energie'])
});
