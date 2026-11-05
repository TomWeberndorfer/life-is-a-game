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

// Ausbau der Stadt (Version 82): Stufe aus der Gesamtzahl der Siege, nur abgeleitet, nie gespeichert.
// Ungültige Schwellen (keine Liste, nicht aufsteigend, keine ganzen Zahlen ab 1) → Standard mit Warnung.
export const AUSBAU_STANDARD = Object.freeze({ schwellen: Object.freeze([1, 3, 6, 10, 15, 21]), platz: 'ausbau-' });
export function ausbauKonfig(roh, warn = () => {}) {
  const s = roh && roh.schwellen;
  const ok = Array.isArray(s) && s.length > 0 && s.every((x, i) => Number.isInteger(x) && x >= 1 && (i === 0 || x > s[i - 1]));
  const platzOk = roh && typeof roh.platz === 'string' && /^[a-z0-9][a-z0-9\-]*$/.test(roh.platz);
  if (!ok) warn('Stadt-Ausbau: Schwellen ungültig, Standard gilt');
  if (!platzOk) warn('Stadt-Ausbau: Bildplatz ungültig, Standard gilt');
  return { schwellen: ok ? [...s] : [...AUSBAU_STANDARD.schwellen], platz: platzOk ? roh.platz : AUSBAU_STANDARD.platz };
}
// siege: Gesamtzahl der Siege. Ergebnis: { stufe (0 = noch kein Ausbau), max, siege, naechsteAb (null = vollendet), platz }
export function ausbauStufe(siege, cfg = AUSBAU_STANDARD) {
  const n = Number.isInteger(siege) && siege > 0 ? siege : 0;
  const stufe = cfg.schwellen.filter(x => n >= x).length;
  const naechsteAb = stufe < cfg.schwellen.length ? cfg.schwellen[stufe] : null;
  return { stufe, max: cfg.schwellen.length, siege: n, naechsteAb, platz: stufe ? cfg.platz + stufe : null };
}

// Stadt als Einstieg zur Heldenkarte (05.11.2026): was ein Tipp auf einen Bezirk öffnet. Reine Funktion, wirft nie.
// bezirke = Ergebnis von stadtAnsicht. Ergebnis: null (Bezirk unbekannt) |
//   { art: 'held', heroId, bezirk }        genau ein Held → seine Heldenkarte
//   { art: 'auswahl', helden, bezirk }     mehrere Helden im Bereich → kleine Auswahl
//   { art: 'unentdeckt', bezirk }          noch kein Held → Name des Bereichs, leiser Weg „Neuen Helden dazuholen“
export const ZIEL = Object.freeze({ held: 'held', auswahl: 'auswahl', unentdeckt: 'unentdeckt' });
export function bezirkZiel(bezirke, domainId) {
  const b = Array.isArray(bezirke) ? bezirke.find(x => x && x.domainId === domainId) : null;
  if (!b) return null;
  const helden = [...new Set((Array.isArray(b.helden) ? b.helden : []).filter(h => typeof h === 'string' && h))];
  if (helden.length === 1) return { art: ZIEL.held, heroId: helden[0], bezirk: b };
  if (helden.length > 1) return { art: ZIEL.auswahl, helden, bezirk: b };
  return { art: ZIEL.unentdeckt, bezirk: b };
}
