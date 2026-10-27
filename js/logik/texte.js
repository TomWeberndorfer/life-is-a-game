// Texte aus dem Register holen (Version 23). Reihenfolge: Text des Stils → Standardtext → Schlüssel (mit Warnung).
import { fuelle } from './inhalte.js';

export function text(standard, stilTexte, schluessel, werte = {}) {
  const roh = stilTexte && typeof stilTexte[schluessel] === 'string' ? stilTexte[schluessel] : standard[schluessel];
  if (typeof roh !== 'string') {
    console.warn(`Text fehlt: ${schluessel}`);
    return schluessel;
  }
  return fuelle(roh, werte);
}

const platzhalter = s => new Set([...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]));

// Prüft Stil-Überschreibungen: unbekannte Schlüssel und Platzhalter, die der Standardtext nicht kennt.
export function pruefeTexte(standard, stile) {
  const fehler = [];
  for (const [id, s] of Object.entries(stile || {})) {
    for (const [k, v] of Object.entries(s.texte || {})) {
      if (!(k in standard)) { fehler.push(`${id}: unbekannter Text ${k}`); continue; }
      const erlaubt = platzhalter(standard[k]);
      for (const p of platzhalter(v)) if (!erlaubt.has(p)) fehler.push(`${id}: ${k} nutzt unbekannten Platzhalter {${p}}`);
    }
  }
  return fehler;
}
