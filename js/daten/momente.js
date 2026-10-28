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
// weltenwahl      'naechsterBesuch' = Weltenwahl erst an einem späteren Tag als eigener Moment, 'sofort' = direkt nach dem Sieg

export const MOMENTE = {
  reihenfolge: ['sieg', 'lauf', 'gegner', 'levelup', 'story', 'frage'],
  maxBewertungen: 1,
  bewertungen: {
    sieg: ['hero_score', 'story_curiosity_score'],
    ersterTreffer: ['boss_score']
  },
  storyBeiSieg: 'spaeter',
  levelupBeiSieg: 'zeile',
  weltenwahl: 'naechsterBesuch'
};
