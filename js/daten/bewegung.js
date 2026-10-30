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
// glanz                Version 57: kurze Bewegung beim ERSTEN Erscheinen einer neuen Sache (je Gerät gemerkt, nicht bei
//                      jedem Öffnen). Stil → CSS-Klasse. Welche Neuigkeit welchen Stil nutzt, steht in daten/neuigkeiten.js
//                      (Version 59). Unbekannter Stil → keine Bewegung (Warnung beim Start). Leeres Objekt = Glanz aus.
// katalog              Version 68 („Bewegung vereinheitlichen“): jede Bewegung EINMAL – Keyframes (in index.html, Präfix bw-),
//                      Dauer und Kurve. Neue Bewegung = Keyframes in index.html + Zeile hier.
// ablaeufe             Choreografie als Daten: welcher Teil sich wann wie bewegt (startMs ab dem Zeichnen, dauerMs optional
//                      statt der Katalogdauer). Die Ansicht holt den Wert mit logik/bewegung.js animation(); geprüft beim Start.
//                      tagesCheck bestimmt auch die Pause vor Einblendungen (Ende des Ablaufs + MOMENTE.pauseMs).
//                      „Bewegung reduzieren“: eine Regel in index.html schaltet alles ab; Endzustände stehen im normalen CSS.

export const BEWEGUNG = {
  auftritt: { versatzMs: 40, dauerMs: 380, maxKarten: 8, aus: false },
  atmosphaere: { zoomS: 20 },
  glanz: { siegel: 'glanz-siegel', wippen: 'glanz-wippen', stern: 'glanz-stern', kampf: 'glanz-kampf' },
  katalog: {
    auftritt: { keyframes: 'bw-auftritt', dauerMs: 420, kurve: 'cubic-bezier(.2,.8,.3,1)' },
    treffer: { keyframes: 'bw-treffer', dauerMs: 560, kurve: 'ease-out' },
    blitz: { keyframes: 'bw-blitz', dauerMs: 600, kurve: 'ease-out' },
    erloeschen: { keyframes: 'bw-erloeschen', dauerMs: 900, kurve: 'ease-in' },
    stempel: { keyframes: 'bw-stempel', dauerMs: 480, kurve: 'cubic-bezier(.2,.8,.3,1)' },
    funkeln: { keyframes: 'bw-funkeln', dauerMs: 900, kurve: 'ease-out' }
  },
  ablaeufe: {
    // Nach dem Tages-Check: Boss-Reaktion in der Heldentat (erst die Zeile, dann zuckt der Gegner), Duell-Karte zuckt sofort mit
    tagesCheck: [
      { teil: 'reaktion', bewegung: 'auftritt', startMs: 380 },
      { teil: 'reaktionBild', bewegung: 'treffer', startMs: 700 },
      { teil: 'reaktionBlitz', bewegung: 'blitz', startMs: 700 },
      { teil: 'duellBild', bewegung: 'treffer', startMs: 0 },
      { teil: 'duellBlitz', bewegung: 'blitz', startMs: 0 }
    ],
    // Sieg-Einblendung: Treffer, Erlöschen, dann Schritt für Schritt Chip, Titel, Stufe, Text, Knopf
    sieg: [
      { teil: 'bild', bewegung: 'treffer', startMs: 150, dauerMs: 650 },
      { teil: 'blitz', bewegung: 'blitz', startMs: 150, dauerMs: 700 },
      { teil: 'bild', bewegung: 'erloeschen', startMs: 800 },
      { teil: 'chip', bewegung: 'stempel', startMs: 1100 },
      { teil: 'titel', bewegung: 'auftritt', startMs: 1300 },
      { teil: 'stufe', bewegung: 'auftritt', startMs: 1550 },
      { teil: 'stern', bewegung: 'funkeln', startMs: 1700 },
      { teil: 'text', bewegung: 'auftritt', startMs: 1700 },
      { teil: 'knopf', bewegung: 'auftritt', startMs: 1900 }
    ]
  }
};
