// Stadt-Ansicht als reine Funktion: wird bei jedem Rendern aus Spielstand + Konfiguration berechnet, nie gespeichert.
// Ein Bezirk je Lebensbereich (Reihenfolge wie LEBENSBEREICHE). Helden außerhalb bekannter Bereiche
// werden nicht verworfen, sondern als zusätzliche Bezirke angehängt (z. B. nach einer Datenänderung).
import { heldenJeDomain } from './helden.js';

export const STATUS = Object.freeze({ entsteht: 'entsteht', unentdeckt: 'unentdeckt' });

export function stadtAnsicht(spiel, lebensbereiche) {
  if (!spiel || !Array.isArray(spiel.helden)) throw new Error('stadtAnsicht: ungültiger Spielstand');
  const liste = Array.isArray(lebensbereiche) ? lebensbereiche : [];
  const ids = liste.map(d => d.id);
  const je = heldenJeDomain(spiel, ids);
  const bekannt = liste.map(d => ({ domainId: d.id, name: d.name, helden: je[d.id] || [] }));
  const fremd = Object.keys(je).filter(id => !ids.includes(id) && je[id].length).map(id => ({ domainId: id, name: id, helden: je[id] }));
  return [...bekannt, ...fremd].map(b => ({ ...b, status: b.helden.length ? STATUS.entsteht : STATUS.unentdeckt }));
}

// Ab wann die Stadt sichtbar ist (Progressive Disclosure): nach dem ersten Sieg eines beliebigen Helden.
export function stadtSichtbar(spiel) {
  return !!spiel && Array.isArray(spiel.helden) && spiel.helden.some(h => Array.isArray(h.siege) && h.siege.length > 0);
}
