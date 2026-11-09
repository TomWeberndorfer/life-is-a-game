// Aura je Gegner (05.11.2026, Klicktest 05.11. Punkt 10, Entscheidung 25 „nie dauernd“).
// Ein kurzer Effekt über dem Gegnerbild, der GENAU EINMAL bei seiner Vorstellung läuft (Einblendung „Neuer Gegner“ und,
// für den ersten Gegner, der Onboarding-Schritt „Dein Hindernis“).
// Ohne Angabe gibt es keinen Effekt, nie einen Dauereffekt; „Bewegung reduzieren“ (System oder Anzeige) schaltet ihn ab.
// Psychologie: Ein einmaliger Akzent markiert den Moment (Neuheit lenkt Aufmerksamkeit); ein Dauereffekt würde abstumpfen
// und den Blick vom Text („wird stärker / verliert Kraft“) wegziehen.
//
// effekte   Register: id → { klasse (CSS in index.html, Präfix aura-), teile (Anzahl Elemente, 1 bis maxTeile),
//           dauerMs (Gesamtdauer, minMs bis maxMs) }. Neuer Effekt = Zeile hier + Regeln .aura-<id> in index.html.
// Wo steht, welcher Gegner welche Aura hat?
//   - je Stil: STILE.<stil>.aura = { <gegner-id>: '<effekt>' } in daten/stile.js (passt zum Bild und zur Welt).
//     Leerer Wert ('' oder null) = in diesem Stil bewusst keine Aura.
//   - für alle Stile: Feld `aura` am Gegner in daten/vorlagen.js (TABELLE.gegner), gilt, wenn der Stil nichts sagt.
//   Später auch aus Obsidian (Schritt „Bosskette“, Typ Bosse in md-bloecke.js).
// Unbekannter Effekt → kein Effekt und eine Warnung beim Start (logik/aura.js pruefeAuraDaten).

export const AURA = {
  effekte: {
    // 05.11.2026 nach dem Handytest: länger und stärker (vorher 1,3–2,4 s, leiser)
    funken: { klasse: 'aura-funken', teile: 16, dauerMs: 2800 },
    glut: { klasse: 'aura-glut', teile: 10, dauerMs: 3000 },
    nebel: { klasse: 'aura-nebel', teile: 4, dauerMs: 3600 },
    flackern: { klasse: 'aura-flackern', teile: 1, dauerMs: 2200 },
    schatten: { klasse: 'aura-schatten', teile: 1, dauerMs: 3000 }
  },
  maxTeile: 16,
  minMs: 300,
  maxMs: 5000
};
