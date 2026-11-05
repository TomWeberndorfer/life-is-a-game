// Chronik als Buch (Etappe 2, Schritt C, 02.11.2026): zweite Ansicht des Logbuchs.
// Logik: logik/chronik.js (reine Ableitung aus den Logbuch-Einträgen, nichts gespeichert), Ansicht: ansicht/logbuch.js.
// Ein Tag ist eine Karte; je Held eine Zeile mit EINEM Siegel, darunter die eigenen Notizen und kleine Zusätze.
// Kapitelwechsel und Questbeginn stehen als Zierseite zwischen den Tagen, Neuanfänge als schlichte Trennzeile.
// Schwere Tage stehen gleichwertig drin (ruhige Farbe, nie Rot, nie „verpasst“, keine XP im Buch).
//
// Felder (Arten = Schlüssel aus daten/logbuch-arten.js):
//   siegel       Reihenfolge der Siegel-Regeln: die erste Art, die der Held an dem Tag hat, bestimmt das Siegel.
//                Hat er keine davon, aber Notizen oder Zusätze, gilt `ohneSiegel`.
//   notizArten   Arten, deren eigener Text (Notiz, „Nächstes Mal“) unter der Zeile steht
//   zusatzArten  Arten, die als kleine Zeile unter dem Helden stehen (Sieg, Mikroquest, Stütze, Morgenprobe)
//   markenArten  Arten, die als Trennzeile unter dem Tag stehen (Neuer Anfang, Wieder da)
//   zierArten    Arten, die als Zierseite unter dem Tag stehen (neues Kapitel, Abenteuer begonnen)
//   tagesArten   Arten ohne Held (Tagesnotiz), die oben in der Tageskarte stehen (04.11.2026)
//   tageJeSeite  Tage auf einmal; „Ältere Seiten“ lädt die nächsten
//   ansichten    Umschalter im Logbuch; die erste ist der Standard (Entscheidung 02.11.: Buch zuerst)
// Jede Logbuch-Art sollte in genau einer Liste stehen; sonst meldet pruefeChronik() sie beim Start.
export const CHRONIK = {
  siegel: [
    { art: 'anwendung', siegel: 'treffer' },
    { art: 'nicht', siegel: 'ruhig' },
    { art: 'ruhetag', siegel: 'ruhetag' },
    { art: 'warSchwer', siegel: 'schwer' }, // Version 141: Antwort „War schwer“, gleiches ruhiges Siegel wie ein schwerer Tag
    { art: 'schwer', siegel: 'schwer' },
    { art: 'geschafft', siegel: 'notiz' }
  ],
  ohneSiegel: 'leise',
  notizArten: ['geschafft', 'schwer', 'rueckblick'], // Rundenrückblick (02.11.2026): „Was hat geholfen?“ unter dem Tag
  zusatzArten: ['sieg', 'probe', 'mikro', 'stuetze'],
  markenArten: ['neustart', 'wiederda'],
  zierArten: ['kapitel', 'start'],
  tagesArten: ['notiz'], // Tagesnotiz (04.11.2026): ohne Held, oben in der Tageskarte
  tageJeSeite: 14,
  ansichten: ['buch', 'liste']
};

// Aussehen je Siegel. symbol: Schlüssel aus stile.js (Symbol je Stil, Rückfall `icon`); text: Textschlüssel (Stil-Texte
// überschreiben ihn, z. B. siegel.treffer = „Neutralisiert“ in Sci-Fi); klasse: CSS-Klasse am Siegel.
export const CHRONIK_SIEGEL = {
  treffer: { symbol: 'siegel.treffer', icon: 'check', text: 'siegel.treffer', klasse: 'voll' },
  ruhig: { symbol: 'siegel.ruhe', icon: 'schild', text: 'siegel.ruhe', klasse: 'rand' },
  ruhetag: { icon: 'tasse', text: 'lb.ruhetag', klasse: 'still' },
  schwer: { icon: 'welle', text: 'lb.schwer', klasse: 'still' },
  notiz: { icon: 'stift', text: 'ch.siegel.notiz', klasse: 'leer' },
  leise: { icon: 'sonne', text: 'ch.siegel.leise', klasse: 'leer' }
};
