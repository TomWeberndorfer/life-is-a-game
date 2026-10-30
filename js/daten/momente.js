// Momente nach einem Tages-Check (Version 42): welche Einblendungen in welcher Reihenfolge erscheinen.
// Anlass: Beim ersten Sieg fielen Stufe 2, Sieg und Weltenfreigabe zusammen → 8 Einblendungen am Stück.
// Ziel: Der Sieg bleibt der Höhepunkt, die Weltenwahl bekommt einen eigenen, ruhigen Moment.
// Später ausbaubar zum Moment-Register (todo: „Story-Momente in drei Stufen“).
//
// reihenfolge     Reihenfolge der Einblendungen (unbekannte Arten am Ende)
// maxBewertungen  höchstens so viele Bewertungsfragen je Tages-Check (0 = keine)
// bewertungen     Kandidaten je Anlass, in Vorrang-Reihenfolge; es kommt nur, was darfFragen() erlaubt
// storyBeiSieg    'spaeter' = neuer Story-Teil nicht als Popup (bleibt auf der Story-Karte), 'danach' = nach dem Kapitelwechsel
// levelupBeiSieg  'zeile' = Stufe als Zeile auf der Siegkarte, 'eigen' = eigene Einblendung
// storyNachCheck  'karte' = neuer Story-Teil nie als Popup, sondern als versiegelter Teil auf der Story-Karte (Version 48,
//                 Entscheidung Startseite: „Story nur, wenn neu“); 'popup' = wie bis Version 47 (dann gilt storyBeiSieg)
// weltenwahl      'naechsterBesuch' = Weltenwahl erst an einem späteren Tag als eigener Moment, 'sofort' = direkt nach dem Sieg
// Version 68 (Entscheidung 30.10.2026: ein Höhepunkt je Tages-Check, Rest über die Tage verteilt):
// kapitelwechsel  'naechsterBesuch' = Weg und neuer Gegner erst, wenn die neue Runde begonnen hat (nächstes Öffnen),
//                 'sofort' = direkt nach dem Sieg (bis Version 66)
// fragenNurRuhig  true = Bewertungsfrage nur, wenn heute sonst kein Höhepunkt war (Sieg, Kapitel, Stufe, Story)
// kapitelStichtag Siege vor diesem Tag hatten Weg und neuen Gegner schon am Siegtag (bis Version 68) → nicht noch einmal
// pauseMs         Puffer nach der Rückmeldung (Version 68): Einblendungen kommen nach dem Ablauf „tagesCheck“
//                 (daten/bewegung.js) plus diesem Wert
// bewertungen     Anlässe: ersterTreffer (erster Treffer einer Runde), nachSieg (zweiter Treffer nach gewonnener Runde), sieg

export const MOMENTE = {
  reihenfolge: ['sieg', 'lauf', 'gegner', 'levelup', 'story', 'frage'],
  maxBewertungen: 1,
  bewertungen: {
    nachSieg: ['hero_score', 'story_curiosity_score'],
    ersterTreffer: ['boss_score']
  },
  storyNachCheck: 'karte',
  storyBeiSieg: 'spaeter',
  levelupBeiSieg: 'zeile',
  weltenwahl: 'naechsterBesuch',
  kapitelwechsel: 'naechsterBesuch',
  kapitelStichtag: '2026-10-30',
  fragenNurRuhig: true,
  pauseMs: 300
};
