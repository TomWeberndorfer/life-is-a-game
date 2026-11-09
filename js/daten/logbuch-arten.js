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
// Neue Art = neue Zeile hier + Text + Ableitung in logik/logbuch.js. Eigene Einträge (Version 75) kommen aus
// spiel.eintraege: ihre Art in daten/eintrag-arten.js nennt die Logbuch-Art (Feld `logbuch`).
//
// Platzhalter der Texte: {faehigkeit} {Verb} {gegner} {sieg} {kapitel} {nr} {ziel} {text}
// Optional je Art eine zweite Zeile: Textschlüssel `<text>Detail` (z. B. lb.anwendungDetail).

export const LOGBUCH_ARTEN = {
  kapitel: { text: 'lb.kapitel', icon: 'kompass', gruppe: 'meilensteine', rang: 1 },
  sieg: { text: 'lb.sieg', icon: 'stern', gruppe: 'meilensteine', xp: 'sieg', rang: 2 },
  abschluss: { text: 'lb.abschluss', icon: 'stern', gruppe: 'meilensteine', rang: 2.5 }, // Version 169: Kettenende, Abschluss oder Meilenstein (ruhig, ohne XP)
  anwendung: { text: 'lb.anwendung', icon: 'check', gruppe: 'erledigt', xp: 'anwendung', rang: 3 },
  nicht: { text: 'lb.nicht', icon: 'mond', gruppe: 'erledigt', rang: 4 },
  warSchwer: { text: 'lb.warSchwer', icon: 'welle', gruppe: 'erledigt', rang: 4.2 }, // Version 141: Antwort „War schwer“ (ruhig, ohne XP)
  // Version 75: eigene Einträge (daten/eintrag-arten.js). „schwer“ ruhig: Farbe --mute, nie Rot, nie „Rückfall“.
  geschafft: { text: 'lb.geschafft', icon: 'stift', gruppe: 'eintraege', rang: 3.5 },
  schwer: { text: 'lb.schwer', icon: 'welle', gruppe: 'eintraege', rang: 4.5 },
  probe: { text: 'lb.probe', icon: 'kompass', gruppe: 'eintraege', rang: 0.5 }, // Version 81: Morgenprobe, oben am Tag
  ruhetag: { text: 'lb.ruhetag', icon: 'tasse', gruppe: 'eintraege', rang: 0.6 }, // Version 90: Ruhetag
  neustart: { text: 'lb.neustart', icon: 'blume', gruppe: 'eintraege', rang: 0.3 }, // Version 98: Willkommen zurück
  wiederda: { text: 'lb.wiederda', icon: 'haus', gruppe: 'eintraege', rang: 0.35 },
  rueckblick: { text: 'lb.rueckblick', icon: 'buch', gruppe: 'eintraege', rang: 0.4 }, // Rundenrückblick (02.11.2026)
  plancheck: { text: 'lb.plancheck', icon: 'kompass', gruppe: 'eintraege', rang: 0.45 }, // Plan- und Warum-Check (Version 167)
  notiz: { text: 'lb.notiz', icon: 'blatt', gruppe: 'notizen', rang: 0.1 }, // Tagesnotiz (04.11.2026), oben am Tag, ohne Held
  mikro: { text: 'lb.mikro', icon: 'sonne', gruppe: 'erledigt', xp: 'mikro', rang: 5 },
  stuetze: { text: 'lb.stuetze', icon: 'spross', gruppe: 'erledigt', rang: 5.5 }, // Schritt „Zähler“: Stützgewohnheit, ohne XP
  start: { text: 'lb.start', icon: 'karte', gruppe: 'meilensteine', rang: 6 }
};

// Filter „Art“. 'alle' muss immer vorne stehen (Rückfall bei unbekanntem Filter).
export const LOGBUCH_FILTER = [
  { id: 'alle', text: 'lb.filter.alle' },
  { id: 'erledigt', text: 'lb.filter.erledigt' },
  { id: 'meilensteine', text: 'lb.filter.meilensteine' },
  { id: 'eintraege', text: 'lb.filter.eintraege' },
  { id: 'notizen', text: 'lb.filter.notizen' } // Tagesnotiz (04.11.2026)
];

// Wie viele Tage mit Einträgen auf einmal erscheinen; „Ältere zeigen“ lädt die nächsten.
// Leere Tage erscheinen nie (keine sichtbaren Lücken, Entscheidung 28.10.2026).
export const LOGBUCH_TAGE_JE_SEITE = 14;
