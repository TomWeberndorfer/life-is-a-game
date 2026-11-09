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
// atmosphaere.funken   Version 84: Zahl der Funken in der Arena (Duell-Karte, 0 = aus, höchstens 30); funkenS = [kürzeste,
//                      längste] Dauer eines Funkens in Sekunden; fackelS = Takt des Fackelscheins (0 = ruhiges Licht).
//                      Ausnahme vom Grundsatz „nie dauernd“: leise Atmosphäre wie der Zoom, keine Rückmeldung (Entscheidung 31.10.2026).
//                      funkenWann (02.11.2026, Entscheidung 25 „Funken nicht als Dauereffekt“): 'treffer' = nur ein kurzer Stoß
//                      im Ablauf nach „Ja“ (Teil „funken“), 'immer' = zusätzlich dauernd wie bis Version 108, 'nie' = aus.
//                      Unbekannter Wert → 'treffer'.
//                      nebelS (04.11.2026): Takt der ziehenden Nebelschwaden am Ende der Karte (0 = still). Leise Atmosphäre
//                      wie der Zoom; „Bewegung reduzieren“ hält sie an (Regel in index.html).
// glanz                Version 57: kurze Bewegung beim ERSTEN Erscheinen einer neuen Sache (je Gerät gemerkt, nicht bei
//                      jedem Öffnen). Stil → CSS-Klasse. Welche Neuigkeit welchen Stil nutzt, steht in daten/neuigkeiten.js
//                      (Version 59). Unbekannter Stil → keine Bewegung (Warnung beim Start). Leeres Objekt = Glanz aus.
// katalog              Version 68 („Bewegung vereinheitlichen“): jede Bewegung EINMAL – Keyframes (in index.html, Präfix bw-),
//                      Dauer und Kurve. Neue Bewegung = Keyframes in index.html + Zeile hier.
// ablaeufe             Choreografie als Daten: welcher Teil sich wann wie bewegt (startMs ab dem Zeichnen, dauerMs optional
//                      statt der Katalogdauer). Die Ansicht holt den Wert mit logik/bewegung.js animation(); geprüft beim Start.
//                      tagesCheck bestimmt auch die Pause vor Einblendungen (Ende des Ablaufs + MOMENTE.pauseMs).
//                      „Bewegung reduzieren“: eine Regel in index.html schaltet alles ab; Endzustände stehen im normalen CSS.
// katalog.unsichtbar   true = der Teil ist während dieser Bewegung zeitweise unsichtbar (blendet ein oder aus).
// lesen                Sprechblasen-Lesezeit (02.11.2026): Zeichen × msProZeichen, begrenzt auf minMs…maxMs. Schritte mit
//                      `lesen: true` bekommen diese Dauer je Durchgang (Text des Tages); `nach: teil` + `abstandMs` startet
//                      einen Schritt nach dem Ende eines früheren Teils. Ein Tipp neben einen Knopf springt zur nächsten Blase.
//                      leiste: Keyframes der Restzeit-Leiste in der Blase (02.11.2026); haltAnteil: bei „Nur per Tippen“ hält
//                      der Ablauf an diesem Anteil jeder Blase an (vor dem Ausblenden), bis man tippt.
// SPRECHBLASEN         (02.11.2026) Wie Sprechblasen weitergehen, je Person in spiel.einstellungen.blasen:
//                      'auto' = nach Lesezeit mit Restzeit-Leiste, Gedrückthalten hält an; 'tippen' = bleibt, bis man tippt.
//                      haltenMs: so lange gedrückt halten, bis die Blase anhält (kürzer = normaler Tipp = weiter).
// bedienbar            „Der letzte Schlag“ (02.11.2026): Bewegung darf nie warten lassen.
//                      maxMs  höchstens so lange vom Tipp bis zur ersten Bedienung einer Einblendung (Ende des Ablaufs
//                             davor + MOMENTE.pauseMs); geprüft beim Start für jede Kette in `ketten`
//                      teile  Teile, die man bedient (Knöpfe): sie dürfen keine Bewegung mit unsichtbar: true haben
//                      Überspringen: ein Tipp neben einen Knopf (oder Escape) beendet jede laufende Bewegung sofort (app.js).

export const BEWEGUNG = {
  auftritt: { versatzMs: 40, dauerMs: 380, maxKarten: 8, aus: false },
  atmosphaere: { zoomS: 20, funken: 12, funkenS: [3, 7], fackelS: 3.2, funkenWann: 'treffer', nebelS: 40 },
  glanz: { siegel: 'glanz-siegel', wippen: 'glanz-wippen', stern: 'glanz-stern', kampf: 'glanz-kampf' },
  katalog: {
    auftritt: { keyframes: 'bw-auftritt', dauerMs: 420, kurve: 'cubic-bezier(.2,.8,.3,1)', unsichtbar: true },
    treffer: { keyframes: 'bw-treffer', dauerMs: 560, kurve: 'ease-out' },
    blitz: { keyframes: 'bw-blitz', dauerMs: 600, kurve: 'ease-out' },
    erloeschen: { keyframes: 'bw-erloeschen', dauerMs: 900, kurve: 'ease-in' },
    stempel: { keyframes: 'bw-stempel', dauerMs: 480, kurve: 'cubic-bezier(.2,.8,.3,1)', unsichtbar: true },
    funkeln: { keyframes: 'bw-funkeln', dauerMs: 900, kurve: 'ease-out', unsichtbar: true },
    // Funken als kurzer Stoß beim Treffer (02.11.2026): jeder Funke etwas kürzer und versetzt (logik/bewegung.js funkenStoss)
    funkenStoss: { keyframes: 'bw-funkenstoss', dauerMs: 1000, kurve: 'ease-out', unsichtbar: true },
    // Kampfbühne (31.10.2026): „Treffer!“ steigt auf, Bild/Sprechblase zeigen und wieder ausblenden, Bühne schrumpft
    trefferWort: { keyframes: 'bw-treffer-wort', dauerMs: 1200, kurve: 'ease-out', unsichtbar: true },
    zeigen: { keyframes: 'bw-zeigen', dauerMs: 3000, kurve: 'ease-in-out', unsichtbar: true },
    ausblenden: { keyframes: 'bw-ausblenden', dauerMs: 260, kurve: 'ease-in', unsichtbar: true },
    schrumpfen: { keyframes: 'bw-schrumpfen', dauerMs: 900, kurve: 'cubic-bezier(.3,.8,.3,1)' },
    // „Der Held tritt ins Bild“ (02.11.2026): Held gleitet links herein und bleibt; Gegner und Kraft rücken nach rechts
    heldRein: { keyframes: 'bw-held-rein', dauerMs: 450, kurve: 'cubic-bezier(.2,.8,.3,1)', unsichtbar: true },
    gegnerRechts: { keyframes: 'bw-gegner-rechts', dauerMs: 450, kurve: 'cubic-bezier(.2,.8,.3,1)' },
    textRechts: { keyframes: 'bw-text-rechts', dauerMs: 450, kurve: 'cubic-bezier(.2,.8,.3,1)' },
    // Sprechblase mit Lesezeit: schnell ein, lange stehen, kurz aus (Anteile, damit es bei 2 s wie bei 6 s passt)
    blase: { keyframes: 'bw-blase', dauerMs: 2000, kurve: 'linear', unsichtbar: true }
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
    // Kampfbühne nach „Treffer“ (Entscheidungen Abschnitt 18): Treffer → Held tritt ins Bild → Boss-Reaktion als Sprechblase,
    // danach Ruhezustand (Ende + KAMPFBUEHNE.ruhePauseMs in daten/startseite.js). Seit 02.11.2026 „Der Held tritt ins Bild“:
    // erst die Wirkung (Treffer, Segment bricht), dann die Anerkennung (Porträt links, Sprechblase), dann der Konter des
    // Gegners; Gegner und Kraft bleiben immer sichtbar, gesamt rund 5 statt 9 Sekunden (Wirkung vor Anerkennung:
    // Kompetenzerleben braucht den sichtbaren Zusammenhang Handlung → Wirkung). Ein Tipp daneben überspringt.
    // Die Crew-Sprechblase weicht sofort. Ein Neuzeichnen mitten im Ablauf läuft an derselben Stelle weiter (versatzMs).
    buehneTreffer: [
      { teil: 'arenaBild', bewegung: 'treffer', startMs: 0 },
      { teil: 'arenaBlitz', bewegung: 'blitz', startMs: 0 },
      { teil: 'trefferWort', bewegung: 'trefferWort', startMs: 0 },
      { teil: 'crewBlase', bewegung: 'ausblenden', startMs: 0 },
      { teil: 'funken', bewegung: 'funkenStoss', startMs: 0 },
      { teil: 'erfolg', bewegung: 'heldRein', startMs: 900 },
      { teil: 'gegnerBild', bewegung: 'gegnerRechts', startMs: 900 },
      { teil: 'arenaText', bewegung: 'textRechts', startMs: 900 },
      { teil: 'heldBlase', bewegung: 'blase', startMs: 1150, dauerMs: 1600, lesen: true },
      { teil: 'bossBlase', bewegung: 'blase', startMs: 2650, dauerMs: 1600, lesen: true, nach: 'heldBlase', abstandMs: 150 }
    ],
    // Kurzer Treffer (Version 139, KAMPFBUEHNE.kurz): nur die Wirkung (Schlag, Funken, Wort „Treffer“, Segment bricht),
    // ohne Heldenbild und Sprechblasen. Die Crew-Sprechblase weicht wie beim vollen Ablauf.
    buehneTrefferKurz: [
      { teil: 'arenaBild', bewegung: 'treffer', startMs: 0 },
      { teil: 'arenaBlitz', bewegung: 'blitz', startMs: 0 },
      { teil: 'trefferWort', bewegung: 'trefferWort', startMs: 0 },
      { teil: 'crewBlase', bewegung: 'ausblenden', startMs: 0 },
      { teil: 'funken', bewegung: 'funkenStoss', startMs: 0 }
    ],
    // Siegtag, „Der letzte Schlag“ (02.11.2026): der Sieg passiert dort, wo man getippt hat. Treffer und Funken, das letzte
    // Segment bricht (CSS .bricht), das Gegnerbild erlischt, der Stempel „Besiegt!“ (Wort je Stil) schlägt auf.
    // Danach sofort das Siegblatt (Ende + MOMENTE.pauseMs ≤ bedienbar.maxMs). Kein Heldenbild, keine Sprechblase.
    buehneSieg: [
      { teil: 'arenaBild', bewegung: 'treffer', startMs: 0 },
      { teil: 'arenaBlitz', bewegung: 'blitz', startMs: 0 },
      { teil: 'funken', bewegung: 'funkenStoss', startMs: 0 },
      { teil: 'crewBlase', bewegung: 'ausblenden', startMs: 0 },
      { teil: 'arenaBild', bewegung: 'erloeschen', startMs: 400, dauerMs: 650 },
      { teil: 'stempel', bewegung: 'stempel', startMs: 450 }
    ],
    // Übergang in den Ruhezustand (nur beim Wechsel, nicht bei jedem Öffnen)
    buehneRuhe: [
      { teil: 'arena', bewegung: 'schrumpfen', startMs: 0 },
      { teil: 'ruheZeile', bewegung: 'auftritt', startMs: 250 }
    ],
    // Siegblatt (02.11.2026): alles ist sofort da, nur ein kurzer Nachklang (unter 0,5 s); der Knopf bewegt sich nie
    // (bedienbar.teile). Der Gegner ist schon in der Arena erloschen, darum hier kein Treffer mehr.
    // Kapitelsieg (Version 119): kein XP-Chip, Stempel liegt schon (in der Arena aufgeschlagen); „stern“ = Orden der Stufe.
    sieg: [
      { teil: 'titel', bewegung: 'auftritt', startMs: 0, dauerMs: 320 },
      { teil: 'text', bewegung: 'auftritt', startMs: 120, dauerMs: 320 },
      { teil: 'stufe', bewegung: 'auftritt', startMs: 120, dauerMs: 320 },
      { teil: 'stern', bewegung: 'funkeln', startMs: 150, dauerMs: 350 }
    ]
  },
  // Übergangs-Muster (Version 162, 07.11.2026): wie etwas ins Bild kommt. Blatt = Moment festhalten oder entscheiden (von unten),
  // Feier = Anerkennung (sanft ein, selten und kurz), Ruhe = Rückfall-Moment (ruhig überblenden), Tab = Wechsel zwischen Seiten.
  // Schließen ist sofort. Die Notfallkarte hat bewusst kein Muster (flach). Keyframes stehen einmal in index.html.
  muster: {
    blatt: { keyframes: 'bw-blatt', dauerMs: 280, kurve: 'cubic-bezier(.2,.8,.3,1)' },
    feier: { keyframes: 'bw-feier', dauerMs: 320, kurve: 'ease-out' },
    ruhe: { keyframes: 'bw-ruhe', dauerMs: 300, kurve: 'ease-in-out' },
    tab: { keyframes: 'bw-tab', dauerMs: 150, kurve: 'ease-out' }
  },
  lesen: { msProZeichen: 70, minMs: 2500, maxMs: 8000, leiste: 'bw-leiste', haltAnteil: 0.9 }, // 02.11.2026: auf Wunsch mehr Zeit (vorher 55 / 1800 / 6000)
  bedienbar: { maxMs: 1500, teile: ['knopf'], ketten: [{ vor: 'buehneSieg', danach: 'sieg' }] } // tagesCheck gehört zum alten Ablauf ohne Bühne (aus)
};

export const SPRECHBLASEN = { varianten: ['auto', 'tippen'], standard: 'auto', haltenMs: 350 };
