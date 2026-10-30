// Boss-Reaktionen (Version 68): reine Funktionen, nichts im DOM, nichts gespeichert.
// Die Reaktion wird jedes Mal aus dem Spielstand abgeleitet (Antwort heute, Restkraft, Tag). Darum ist sie auf jedem
// Gerät gleich, übersteht Neuladen und braucht kein neues Feld im Spielstand (wie das Heldenbild, Entscheidung 13).
import { streuwert, TEXT_PLATZHALTER } from './inhalte.js';

export const REAKTION_ARTEN = ['treffer', 'ruhe', 'phase', 'morgen'];
// „morgen“ (Siegtag mit neuem Gegner) darf den neuen Gegner nicht verraten: {gegner} & Co. wären schon der Neue.
const OHNE_GEGNERNAME = { morgen: ['gegner', 'Gegner', 'er', 'Er', 'ihn'] };
const RUECKFALL_ART = { phase: 'treffer' };

// Restkraft, bei der der Phasenwechsel kommt. 0 = keine Phase (ungültige Werte, zu kleine Runde).
// anzahl 3, anteil 0.5 → 1 · anzahl 4 → 2 · anzahl 2 → 1 · anzahl 1 → 0 (der erste Treffer ist schon der Sieg).
export function phaseSchwelle(anzahl, anteil = 0.5) {
  if (!Number.isInteger(anzahl) || anzahl < 2) return 0;
  const a = Number.isFinite(anteil) && anteil > 0 && anteil < 1 ? anteil : 0.5;
  return Math.max(1, Math.min(anzahl - 1, Math.floor(anzahl * a)));
}

// Welche Reaktion gilt heute? lage = { antwort, kraft, anzahl, rundeTag, siegHeute, neuerGegner } aus kern.auswertung().
// Siegtag: mit neuem Gegner „morgen“ (Andeutung, Version 68: der Kapitelwechsel kommt erst beim nächsten Besuch), sonst null.
// null = keine Zeile: noch nicht beantwortet, Runde beginnt erst morgen, kaputte Zahlen.
export function reaktionsArt(lage, anteil) {
  const l = lage && typeof lage === 'object' ? lage : {};
  if (l.siegHeute === true) return l.neuerGegner === true ? 'morgen' : null;
  if (!(Number.isInteger(l.rundeTag) && l.rundeTag >= 0)) return null;
  if (l.antwort === 'nein') return 'ruhe';
  if (l.antwort !== 'ja') return null;
  if (!Number.isInteger(l.anzahl) || l.anzahl < 1 || !Number.isInteger(l.kraft) || l.kraft <= 0 || l.kraft > l.anzahl) return null;
  const s = phaseSchwelle(l.anzahl, anteil);
  return s > 0 && l.kraft === s ? 'phase' : 'treffer';
}

const gueltig = liste => (Array.isArray(liste) ? liste.filter(t => typeof t === 'string' && t.trim()) : []);

// Text wählen: feste Variante je Schlüssel (gleicher Tag → gleiche Zeile, auch nach Neuladen und auf dem Handy).
// Rückfall: Gegner → _allgemein; „phase“ ohne Text → „treffer“. Ergebnis { text, art, quelle } oder null. Wirft nie.
export function waehleReaktion(daten, gegnerId, art, schluessel) {
  if (!REAKTION_ARTEN.includes(art) || !daten || typeof daten !== 'object') return null;
  const arten = [art, RUECKFALL_ART[art]].filter(Boolean);
  for (const a of arten) {
    for (const quelle of [gegnerId, '_allgemein']) {
      if (typeof quelle !== 'string' || !quelle) continue;
      const pool = gueltig(daten[quelle] && daten[quelle][a]);
      if (pool.length) return { text: pool[streuwert(String(schluessel)) % pool.length], art: a, quelle };
    }
  }
  return null;
}

// Prüft die Daten (für Tests und den Start im Testprofil). Liefert lesbare Fehler, wirft nie.
// gegnerIds = bekannte Gegner (unbekannte Schlüssel sind meist Tippfehler und würden nie angezeigt).
export function pruefeBossReaktionen(daten, gegnerIds = null) {
  const f = [];
  if (!daten || typeof daten !== 'object' || Array.isArray(daten)) return ['Boss-Reaktionen: keine Daten'];
  if (!daten._allgemein) f.push('Boss-Reaktionen: „_allgemein“ fehlt (Rückfall für jeden Gegner)');
  const bekannt = Array.isArray(gegnerIds) ? new Set(gegnerIds) : null;
  const erlaubt = new Set(TEXT_PLATZHALTER);
  for (const [id, eintrag] of Object.entries(daten)) {
    if (id !== '_allgemein' && bekannt && !bekannt.has(id)) f.push(`Boss-Reaktionen: unbekannter Gegner „${id}“`);
    if (!eintrag || typeof eintrag !== 'object') { f.push(`Boss-Reaktionen ${id}: kein Eintrag`); continue; }
    for (const [art, liste] of Object.entries(eintrag)) {
      if (!REAKTION_ARTEN.includes(art)) { f.push(`Boss-Reaktionen ${id}: unbekannte Art „${art}“`); continue; }
      if (!Array.isArray(liste) || !gueltig(liste).length) { f.push(`Boss-Reaktionen ${id}.${art}: keine Zeile`); continue; }
      liste.forEach((t, i) => {
        if (typeof t !== 'string' || !t.trim()) { f.push(`Boss-Reaktionen ${id}.${art}[${i}]: leer`); return; }
        for (const m of t.matchAll(/\{(\w+)\}/g)) {
          if (!erlaubt.has(m[1])) f.push(`Boss-Reaktionen ${id}.${art}[${i}]: {${m[1]}}`);
          else if ((OHNE_GEGNERNAME[art] || []).includes(m[1])) f.push(`Boss-Reaktionen ${id}.${art}[${i}]: {${m[1]}} verrät den neuen Gegner`);
        }
      });
    }
  }
  if (daten._allgemein) for (const art of REAKTION_ARTEN) if (!gueltig(daten._allgemein[art]).length) f.push(`Boss-Reaktionen _allgemein.${art}: keine Zeile`);
  return f;
}
