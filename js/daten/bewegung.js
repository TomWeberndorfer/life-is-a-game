// Bewegung als Daten (Version 46): wie die Startseite auftritt und auf Handlungen antwortet.
// Grundsatz: Bewegung lenkt den Blick. Darum nur beim Auftritt (Bildschirm öffnen, Held wechseln) und direkt
// als Antwort auf eine Handlung, nie dauernd. „Bewegung reduzieren“ im Betriebssystem schaltet alles ab.
// Werte ändern ohne Programmierung; ungültige Werte fallen auf den Standard (app.js, zahl()).
//
// auftritt.versatzMs   Abstand zwischen zwei Karten beim Hereingleiten
// auftritt.dauerMs     Dauer einer Karte
// auftritt.maxKarten   ab dieser Karte kein weiterer Versatz (lange Seiten warten nicht ewig)
// auftritt.aus         true = kein Auftritt (Rückmeldungen bleiben)
// atmosphaere.zoomS    Dauer des langsamen Zooms im Gegnerbild (0 = aus)

export const BEWEGUNG = {
  auftritt: { versatzMs: 40, dauerMs: 380, maxKarten: 8, aus: false },
  atmosphaere: { zoomS: 20 }
};
