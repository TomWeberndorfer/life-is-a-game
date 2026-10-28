// Logbuch (Version 41): Eintragsarten und Filter als Daten.
// Das Logbuch speichert nichts. Es leitet alle Einträge aus dem Spielstand ab (Tages-Checks, Siege, Runden,
// Mikroquests, Questbeginn). Gespeichert wird später nur, was wirklich neu ist (Notiz, Stimmung, Rückfall).
// Entscheidung 28.10.2026: Logbuch und Tagebuch des alten Prototyps werden zu EINEM Strom zusammengelegt.
//
// Je Art:
//   text   Textschlüssel in daten/texte.js (Platzhalter siehe unten)
//   icon   Name aus ICON in app.js
//   gruppe ID aus LOGBUCH_FILTER (für den Filter „Art“)
//   xp     Schlüssel aus XP in logik/kern.js (anwendung, sieg, mikro) oder weglassen = keine XP
//   rang   Reihenfolge innerhalb eines Tages (klein = oben)
// Neue Art (z. B. Rückfall in Phase D, Notiz in Etappe 2) = neue Zeile hier + Text + Ableitung in logik/logbuch.js.
//
// Platzhalter der Texte: {faehigkeit} {Verb} {gegner} {sieg} {kapitel} {nr} {ziel} {text}
// Optional je Art eine zweite Zeile: Textschlüssel `<text>Detail` (z. B. lb.anwendungDetail).

export const LOGBUCH_ARTEN = {
  kapitel: { text: 'lb.kapitel', icon: 'kompass', gruppe: 'meilensteine', rang: 1 },
  sieg: { text: 'lb.sieg', icon: 'stern', gruppe: 'meilensteine', xp: 'sieg', rang: 2 },
  anwendung: { text: 'lb.anwendung', icon: 'check', gruppe: 'erledigt', xp: 'anwendung', rang: 3 },
  nicht: { text: 'lb.nicht', icon: 'mond', gruppe: 'erledigt', rang: 4 },
  mikro: { text: 'lb.mikro', icon: 'sonne', gruppe: 'erledigt', xp: 'mikro', rang: 5 },
  start: { text: 'lb.start', icon: 'karte', gruppe: 'meilensteine', rang: 6 }
};

// Filter „Art“. 'alle' muss immer vorne stehen (Rückfall bei unbekanntem Filter).
export const LOGBUCH_FILTER = [
  { id: 'alle', text: 'lb.filter.alle' },
  { id: 'erledigt', text: 'lb.filter.erledigt' },
  { id: 'meilensteine', text: 'lb.filter.meilensteine' }
];

// Wie viele Tage mit Einträgen auf einmal erscheinen; „Ältere zeigen“ lädt die nächsten.
// Leere Tage erscheinen nie (keine sichtbaren Lücken, Entscheidung 28.10.2026).
export const LOGBUCH_TAGE_JE_SEITE = 14;
