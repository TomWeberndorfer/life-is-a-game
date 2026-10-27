// Lebensbereiche (Domains): feste IDs, getrennt von den Helden.
// Ein Held verweist mit `domain` auf seinen Lebensbereich; Fortschritt bleibt beim Helden.
// Grundlage für Wheel of Life, Heldenstadt (ein Bezirk je Lebensbereich) und neue Helden.
// IDs nie ändern; Anzeigenamen frei änderbar. `held` = Standard-Held des Bereichs (oder null).
// Neuer Lebensbereich = neue Zeile hier (+ optional ein Held in helden.js), keine Programmierung.

export const LEBENSBEREICHE = [
  { id: 'health', name: 'Gesundheit', icon: 'herz', held: 'trogadon' },
  { id: 'mindset', name: 'Resilienz', icon: 'herz', held: 'jelninolan' },
  { id: 'partner', name: 'Partnerschaft', icon: 'menschen', held: 'khara' },
  { id: 'family', name: 'Familie', icon: 'menschen', held: null },
  { id: 'friends', name: 'Freunde', icon: 'menschen', held: 'ahren' },
  { id: 'career', name: 'Beruf', icon: 'ziel', held: 'uldini' },
  { id: 'finance', name: 'Finanzen', icon: 'muenzen', held: 'goldwin' },
  { id: 'adventure', name: 'Abenteuer', icon: 'sonne', held: 'fisker' },
  { id: 'growth', name: 'Wachstum', icon: 'sonne', held: 'der-erste' }
];

// Rückfall, wenn ein gespeicherter Held keinem bekannten Lebensbereich zugeordnet werden kann.
export const DOMAIN_RUECKFALL = 'growth';

export const DOMAIN_IDS = LEBENSBEREICHE.map(d => d.id);
