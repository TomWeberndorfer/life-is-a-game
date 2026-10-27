// Forschungs-Konfiguration: Bewertungsmomente, Feedback, Premium-Test.
// Änderungen an Fragen, Abständen oder Preis brauchen keine Programmierung.

export const BEWERTUNGEN = {
  hero_score: { titel: 'HELDENMOMENT', frage: 'Wie sehr fühlst du dich gerade wie die Hauptfigur deiner eigenen Geschichte?', bild: 'banner', abstandTage: 1 },
  boss_score: { titel: 'GEGNERMOMENT', frage: 'Wie spannend wirkt dieser Gegner?', bild: 'gegner', abstandTage: 1 },
  crew_score: { titel: 'VERBÜNDETER', frage: 'Wie interessant findest du {name}?', bild: 'verbuendeter', abstandTage: 1 },
  story_curiosity_score: { titel: 'STORYMOMENT', frage: 'Wie neugierig bist du auf die Fortsetzung?', bild: 'szene', abstandTage: 1 }
};
export const SKALA = { links: 'gar nicht', rechts: 'sehr' };

export const FEEDBACK = {
  abAktivenTagen: 3,
  erneutNachTagen: 3,
  fragen: [
    { id: 'spannend', text: 'Was war der spannendste Moment?', art: 'text' },
    { id: 'langweilig', text: 'Was war der langweiligste Moment?', art: 'text' },
    { id: 'verbessern', text: 'Was würdest du als Erstes verbessern?', art: 'text' },
    { id: 'morgen', text: 'Würdest du den Prototyp morgen erneut öffnen?', art: 'wahl' },
    { id: 'bezahlen', text: 'Würdest du für dieses Produkt grundsätzlich bezahlen?', art: 'wahl' }
  ],
  wahl: [['ja', 'Ja'], ['vielleicht', 'Vielleicht'], ['nein', 'Nein']]
};

export const PREMIUM = {
  preis: '4,99 € pro Monat',
  titel: 'Life is a Game Premium',
  punkte: ['Alle Lebensbereiche gleichzeitig', 'Bossketten mit neuen Kapiteln', 'Alle Welten und Heldenbilder'],
  ab: 1 // ab wie vielen aktiven Tagen die Karte auf der Startseite erscheint
};
