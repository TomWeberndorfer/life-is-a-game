// Karte (30.10.2026): Einstellungen der Reise-Chronik (Logik: logik/karte.js, Ansicht: ansicht/karte.js).
// voraus  wie viele kommende Gegner als Silhouette erscheinen (0–3, sonst Standard 1); danach immer Nebel.
//         Die Vergangenheit zeigt die Karte immer vollständig.
export const KARTE = { voraus: 1 };

// Zeichnung des Pfads: Lage der Orte (Prozent der Breite, abwechselnd links/rechts). zeile = Rechen-Einheit einer Zeile
// (100). Seit Version 126 ergibt sich die echte Zeilenhöhe aus der Kartenbreite (KARTE_HINTERGRUND, Kachel 9:16 mit
// 6 Orten): die Ansicht rechnet alle Höhen in Vielfachen von --zeile (CSS), Figur und Texte bleiben in px.
// zeileMinPx: so niedrig wird eine Zeile auf sehr schmalen Bildschirmen höchstens (dann schneidet das Bild seitlich leicht ab).
export const KARTE_PFAD = { zeile: 100, links: 22, rechts: 78, zeileMinPx: 84 };

// Kartenbilder (Version 122, Bildfolge seit Version 126): Bildplätze in „Inhalte pflegen“, je Stil oder für „alle“.
//   karte-hintergrund-1, -2 …          gemeinsame Bildfolge, ein Bild je 6 Orte (karte-hintergrund ohne Nummer = Bild 1)
//   karte-hintergrund-<held>-1, -2 …   optional eigene Karte eines Helden, Rückfall je Nummer auf die gemeinsame
// Format jedes Bildes: breite:hoehe (9:16) mit `orte` Orten, gemalt nach der Schablone (claude/karte-schablone/).
// Fehlt ein Bild, läuft das letzte weiter (dichterer Schleier); ohne jedes Bild bleibt der gezeichnete Pfad.
// schleier: Deckkraft der Kartenfarbe über dem Bild (0–1), damit Pfad und Schrift lesbar bleiben.
// maxBreitePx: Höchstbreite der Karte (breitere Bildschirme: Karte in der Mitte). Ungültig → Standard (logik/karte.js).
export const KARTE_HINTERGRUND = { platz: 'karte-hintergrund', schleier: 0.6, breite: 9, hoehe: 16, orte: 6, maxBreitePx: 480 };

// Nebel-Zone am Ende der Karte (04.11.2026): der Weg läuft verblassend hinein, „Weiter im Nebel“ steht in der Mitte.
// Feste Länge statt Endlos-Scrollen: hoeheVh = Anteil der Bildschirmhöhe, begrenzt auf minPx…maxPx.
// verblassen = bis zu welchem Anteil der Zone der Weg sichtbar bleibt (0,1–1). Das Ziehen des Nebels: daten/bewegung.js
// atmosphaere.nebelS. Ungültiges fällt einzeln auf den Standard (logik/karte.js nebelKonfig).
export const KARTE_NEBEL = { hoeheVh: 100, minPx: 360, maxPx: 900, verblassen: 0.55 };

// Platz der Heldenfigur (04.11.2026): Größen in px und Ausweich-Versätze [dx, dy] in px, der Reihe nach probiert
// (erst darüber schweben, dann auf dem Weg, dann darunter). textRand = Abstand der Texte vom Rand ihres Orts in %
// (gilt auch für die Lage der Texte). Ist kein Versatz frei, sucht die Figur im Raster schrittPx bis weitePx um ihren
// Fuß die nächste freie Stelle. Ungültiges → Standard (logik/karte.js heldKonfig).
export const KARTE_HELD = { heldHalbPx: 16, stationHalbPx: 18, textHalbPx: 26, textRand: 36, refBreitePx: 340, schrittPx: 4, weitePx: 60, versatz: [[0, -34], [0, 0], [0, 34]] };
