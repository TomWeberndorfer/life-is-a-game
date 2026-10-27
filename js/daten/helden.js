// Helden-Register: feste Helden-IDs (heroId), jeder Held mit genau einem Lebensbereich (domain).
// Namen und Bilder je Stil stehen in stile.js (Schlüssel = heroId).
// Neuer Held = neue Zeile hier; `domain` muss in lebensbereiche.js stehen (prüft pruefeTabelle).

export const HELDEN = {
  trogadon: { domain: 'health', name: 'Trogadon', rolle: 'Hüter der Gesundheit', hilft: ['gesunde Gewohnheiten aufzubauen', 'Versuchungen zu widerstehen', 'langfristig fit zu bleiben'] },
  jelninolan: { domain: 'mindset', name: 'Jelninolan', rolle: 'Hüter der Resilienz', hilft: ['in schwierigen Momenten ruhig zu bleiben', 'alte Muster zu erkennen'] },
  khara: { domain: 'partner', name: 'Khara', rolle: 'Hüterin der Beziehungen', hilft: ['Zeit füreinander zu finden', 'Nähe im Alltag zu pflegen'] },
  fisker: { domain: 'adventure', name: 'Fisker', rolle: 'Hüter der Familienabenteuer', hilft: ['Langeweile in Erlebnisse zu verwandeln', 'gemeinsam zu spielen'] },
  uldini: { domain: 'career', name: 'Uldini', rolle: 'Hüter des Fokus', hilft: ['Wichtiges zuerst zu tun', 'Ablenkungen zu erkennen'] },
  goldwin: { domain: 'finance', name: 'Goldwin', rolle: 'Hüter des Goldes', hilft: ['bewusst auszugeben', 'Rücklagen aufzubauen'] },
  'der-erste': { domain: 'growth', name: 'Der Erste', rolle: 'Hüter des Wachstums', hilft: ['Freude im Alltag zu finden', 'eigene Wege zu gehen'] },
  ahren: { domain: 'friends', name: 'Ahren', rolle: 'Hüter der Freundschaft', hilft: ['Kontakt zu halten', 'echtes Interesse zu zeigen'] }
};
