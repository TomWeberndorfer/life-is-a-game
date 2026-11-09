// Crew-Übersicht (06.11.2026, Entscheidungen Abschnitt 36): wer bekommt gerade welche Energie? Eine Ansicht mit zwei
// Einstiegen: Schritt „Energie“ der Wochenrunde und „Crew planen“ in der Heldenwahl. Logik: logik/crew.js, Ansicht: ansicht/crew.js.
// Alles wird aus dem Spielstand abgeleitet (spiel.modi, spiel.mindest, Stützgewohnheiten, spiel.wochen); kein eigenes Feld.
// Psychologie: Die Übersicht macht die Verteilung sichtbar, ohne zu bewerten. „Platz für noch einen“ ist eine Einladung,
// keine Lücke; Ruhe ist eine bewusste Pause und steht eingeklappt am Ende. Darum kein „offen“, kein Zähler, kein Rot.
//
// abHelden     „Crew planen“ in der Heldenwahl ab so vielen Helden (mit einem Helden gibt es nichts zu verteilen)
// eingeklappt  Gruppen (Modi), die eingeklappt beginnen; Aufklappen gilt nur für die Sitzung
// leerZeigen   Gruppen, die auch ohne Helden erscheinen (Fokus zeigt dann nur „Platz für …“)
// zeigen       welche Angaben je Held erscheinen: quest (Questtitel), mindest (Mindestaufgabe, nur in MINDEST.modi),
//              stuetzen (Namen der aktiven Stützgewohnheiten), wheel (letzter Lebensrad-Wert des Bereichs), seit (Modus seit)
// stuetzenMax  so viele Stützgewohnheiten werden höchstens genannt (der Rest als „+ n“)
export const CREW = Object.freeze({
  abHelden: 2,
  eingeklappt: Object.freeze(['ruhe']),
  leerZeigen: Object.freeze(['fokus']),
  zeigen: Object.freeze({ quest: true, mindest: true, stuetzen: true, wheel: true, seit: true }),
  stuetzenMax: 3
});
