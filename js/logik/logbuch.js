// Logbuch (Version 41): reine Ableitung aus dem Spielstand, nichts gespeichert.
// Einträge je Held: Questbeginn, Tages-Checks (angewendet / nicht gebraucht), Mikroquests, Siege, neue Kapitel.
// Einträge nach `heute` zählen nicht (Testprofil mit Zeitsprung), wie in entwicklung().
// Jede Zeile hat eine stabile ID (`<heroId>:<art>:<tag>[:<extra>]`). Daran hängen sich später Notizen (Etappe 2).
import * as K from './kern.js';
import { ansicht } from './helden.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const gueltigerTag = t => TAG.test(String(t)) && !!K.ausTagKey(t);

// Prüft das Arten-Register beim Start. Liefert lesbare Fehler, wirft nie.
// texte: Textregister (Schlüssel müssen existieren), filterIds: erlaubte Gruppen, xpKeys: erlaubte XP-Schlüssel.
export function pruefeLogbuchArten(arten, { texte = {}, filterIds = [], xpKeys = Object.keys(K.XP) } = {}) {
  const f = [];
  if (!arten || typeof arten !== 'object' || !Object.keys(arten).length) return ['Keine Logbuch-Arten festgelegt'];
  for (const [id, a] of Object.entries(arten)) {
    if (!a || typeof a !== 'object') { f.push(`Art ${id}: kein Objekt`); continue; }
    if (typeof a.text !== 'string' || !(a.text in texte)) f.push(`Art ${id}: Text ${a.text} fehlt`);
    if (typeof a.icon !== 'string' || !a.icon) f.push(`Art ${id}: icon fehlt`);
    if (!filterIds.includes(a.gruppe)) f.push(`Art ${id}: unbekannte Gruppe ${a.gruppe}`);
    if (a.xp !== undefined && !xpKeys.includes(a.xp)) f.push(`Art ${id}: unbekannter XP-Schlüssel ${a.xp}`);
    if (!Number.isFinite(a.rang)) f.push(`Art ${id}: rang fehlt`);
  }
  return f;
}

// Alle Einträge eines Helden (Ansicht im Format von kern.js).
function eintraegeHeld(heroId, domainId, a, heuteK, mikroTexte, warn) {
  const out = [];
  const add = (art, tag, extra, daten = {}) => out.push({ id: `${heroId}:${art}:${tag}${extra ? ':' + extra : ''}`, heroId, domainId, art, tag, daten });
  const q = a.quest;
  if (q && gueltigerTag(q.start) && q.start <= heuteK) add('start', q.start, '', { ziel: q.ziel });
  for (const [tag, antwort] of Object.entries(a.tage || {})) {
    if (!gueltigerTag(tag) || tag > heuteK) continue;
    if (antwort === 'ja') add('anwendung', tag, '');
    else if (antwort === 'nein') add('nicht', tag, '');
  }
  for (const [tag, ids] of Object.entries(a.mikro || {})) {
    if (!gueltigerTag(tag) || tag > heuteK || !Array.isArray(ids)) continue;
    for (const mid of ids) add('mikro', tag, mid, { mikroId: mid, text: (mikroTexte && mikroTexte[mid]) || null });
  }
  for (const s of a.siege || []) {
    if (s && gueltigerTag(s.tag) && s.tag <= heuteK) add('sieg', s.tag, '', { gegner: s.gegner || null });
  }
  // Neues Kapitel = erste Runde gegen einen neuen Gegner, sobald sie begonnen hat.
  // Eigener try: kaputte Siege dürfen die übrigen Einträge des Helden nicht verschwinden lassen.
  if (q) {
    try {
      for (const r of K.runden(a, heuteK).runden) {
        if (r.neuerGegner && r.von <= heuteK) add('kapitel', r.von, `R${r.nr}`, { gegner: r.gegner, nr: r.gegnerIdx + 1 });
      }
    } catch (err) { warn(`Logbuch: Kapitel von ${heroId} nicht ableitbar (${err.message})`); }
  }
  return out;
}

// Alle Einträge aller Helden. Unbekannte Arten (nicht im Register) werden übersprungen und gemeldet.
// optionen: { arten, mikroTexte: { id: text }, warn }
export function logbuchEintraege(spiel, heute, { arten, mikroTexte = {}, warn = () => {} } = {}) {
  if (!arten) throw new Error('logbuchEintraege: Arten fehlen');
  const heuteK = K.tagKey(heute);
  const alle = [];
  for (const h of (spiel && Array.isArray(spiel.helden) ? spiel.helden : [])) {
    try {
      const a = ansicht(spiel, h.heroId);
      for (const e of eintraegeHeld(h.heroId, h.domainId, a, heuteK, mikroTexte, warn)) {
        const art = arten[e.art];
        if (!art) { warn(`Logbuch: unbekannte Art ${e.art}`); continue; }
        alle.push({ ...e, xp: art.xp ? K.XP[art.xp] || 0 : 0 });
      }
    } catch (err) {
      warn(`Logbuch: Held ${h && h.heroId} übersprungen (${err.message})`);
    }
  }
  return alle;
}

// Gefiltert, nach Tagen gruppiert (neueste zuerst), begrenzt auf `tage` Tage mit Einträgen.
// filter: { held: 'alle' | heroId, gruppe: 'alle' | Gruppen-ID, tage: Zahl }
// Unbekannter Held oder unbekannte Gruppe → 'alle' (sicherer Rückfall, gemeldet in `korrigiert`).
export function logbuchAnsicht(eintraege, arten, filter = {}, standardTage = 14) {
  const heldIds = new Set(eintraege.map(e => e.heroId));
  const gruppen = new Set(Object.values(arten).map(a => a.gruppe));
  const korrigiert = [];
  let held = filter.held || 'alle';
  if (held !== 'alle' && !heldIds.has(held)) { korrigiert.push('held'); held = 'alle'; }
  let gruppe = filter.gruppe || 'alle';
  if (gruppe !== 'alle' && !gruppen.has(gruppe)) { korrigiert.push('gruppe'); gruppe = 'alle'; }
  const n = Number.isInteger(filter.tage) && filter.tage > 0 ? filter.tage : standardTage;

  const passend = eintraege.filter(e => (held === 'alle' || e.heroId === held) && (gruppe === 'alle' || arten[e.art].gruppe === gruppe));
  const jeTag = new Map();
  for (const e of passend) (jeTag.get(e.tag) || jeTag.set(e.tag, []).get(e.tag)).push(e);
  const tageSortiert = [...jeTag.keys()].sort().reverse();
  const rang = e => arten[e.art].rang;
  const tage = tageSortiert.slice(0, n).map(tag => {
    const l = jeTag.get(tag).sort((x, y) => rang(x) - rang(y) || (x.heroId < y.heroId ? -1 : x.heroId > y.heroId ? 1 : 0) || (x.id < y.id ? -1 : 1));
    return { tag, eintraege: l, xp: l.reduce((s, e) => s + e.xp, 0) };
  });
  const erster = eintraege.length ? eintraege.reduce((m, e) => (e.tag < m ? e.tag : m), eintraege[0].tag) : null;
  return {
    filter: { held, gruppe, tage: n },
    korrigiert,
    tage,
    mehr: tageSortiert.length > n,
    anzahl: passend.length,
    gesamt: eintraege.length,
    seit: erster
  };
}
