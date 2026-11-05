// Logbuch (Version 41): reine Ableitung aus dem Spielstand, nichts gespeichert.
// Einträge je Held: Questbeginn, Tages-Checks (angewendet / nicht gebraucht), Mikroquests, Siege, neue Kapitel.
// Einträge nach `heute` zählen nicht (Testprofil mit Zeitsprung), wie in entwicklung().
// Jede Zeile hat eine stabile ID (`<heroId>:<art>:<tag>[:<extra>]`). Daran hängen sich später Notizen (Etappe 2).
import * as K from './kern.js';
import { ansicht } from './helden.js';
import { antwortArt } from './antworten.js'; // Version 141: Logbuch-Art je Antwort aus dem Register

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const gueltigerTag = t => TAG.test(String(t)) && !!K.ausTagKey(t);

// Tagesnotiz (04.11.2026): Filter-ID für Einträge ohne Lebensbereich („ganzer Tag“). Beginnt mit „_“, damit sie nie mit
// einer Bereichs-ID (nur Kleinbuchstaben) zusammenfällt.
export const LB_GANZER_TAG = '_tag';

// Daten eines eigenen Eintrags für das Logbuch (eine Stelle für Helden-Einträge und Tagesnotizen).
function eigeneDaten(e) {
  const daten = { eintragId: e.id, situation: e.situation, stimmung: e.stimmung, text: e.text };
  if (e.wahl) daten.wahl = e.wahl; // Rundenrückblick
  if (e.naechstesMal) daten.naechstesMal = e.naechstesMal; // Version 81: nur wenn gesetzt (wie im Eintrag)
  if (e.felder) daten.felder = { ...e.felder }; // Tagesnotiz: „Was war gut?“, „Was war schwer?“
  if (e.geaendert) daten.geaendert = e.geaendert;
  return daten;
}

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
// eigene: gespeicherte Einträge dieses Helden (spiel.eintraege, Version 75); eintragArten: Register mit Feld `logbuch`.
function eintraegeHeld(heroId, domainId, a, heuteK, mikroTexte, warn, eigene = [], eintragArten = null) {
  const out = [];
  // bereiche (04.11.2026): Lebensbereich des Helden als Liste, damit ein Filter für Helden- und Notiz-Einträge gleich rechnet
  const add = (art, tag, extra, daten = {}) => out.push({ id: `${heroId}:${art}:${tag}${extra ? ':' + extra : ''}`, heroId, domainId, bereiche: domainId ? [domainId] : [], art, tag, daten });
  const q = a.quest;
  if (q && gueltigerTag(q.start) && q.start <= heuteK) add('start', q.start, '', { ziel: q.ziel });
  for (const [tag, antwort] of Object.entries(a.tage || {})) {
    if (!gueltigerTag(tag) || tag > heuteK) continue;
    const art = antwortArt(antwort);
    if (art && art.logbuch) add(art.logbuch, tag, '');
  }
  for (const [tag, ids] of Object.entries(a.mikro || {})) {
    if (!gueltigerTag(tag) || tag > heuteK || !Array.isArray(ids)) continue;
    for (const mid of ids) add('mikro', tag, mid, { mikroId: mid, text: (mikroTexte && mikroTexte[mid]) || null });
  }
  // Stützgewohnheiten (Schritt „Zähler“, 31.10.2026): Name aus den Teilzielen der Quest, auch wenn archiviert
  const tzNamen = {};
  for (const t of (q && Array.isArray(q.teilziele) ? q.teilziele : [])) if (t && typeof t.id === 'string') tzNamen[t.id] = typeof t.name === 'string' ? t.name : null;
  for (const [tag, ids] of Object.entries(a.haken || {})) {
    if (!gueltigerTag(tag) || tag > heuteK || !Array.isArray(ids)) continue;
    for (const id of ids) add('stuetze', tag, id, { teilzielId: id, text: tzNamen[id] || null });
  }
  for (const s of a.siege || []) {
    if (s && gueltigerTag(s.tag) && s.tag <= heuteK) add('sieg', s.tag, '', { gegner: s.gegner || null });
  }
  // Eigene Einträge (Version 75): Art laut Register (ohne Register gleich der Eintrags-Art). Zeitsprung: nach heute nicht.
  for (const e of eigene) {
    if (!e || !gueltigerTag(e.tag) || e.tag > heuteK) continue;
    const lbArt = eintragArten ? eintragArten[e.art] && eintragArten[e.art].logbuch : e.art;
    if (!lbArt) { warn(`Logbuch: Eintrag ${e.id} hat unbekannte Art ${e.art}`); continue; }
    // Rundenrückblick (02.11.2026): ein übersprungener Rückblick (ohne Text, Wahl, Verweise) bleibt still
    const reg = eintragArten && eintragArten[e.art];
    if (reg && reg.nurMitInhalt && !e.text && !e.wahl && !(Array.isArray(e.verweise) && e.verweise.length)) continue;
    add(lbArt, e.tag, e.id, eigeneDaten(e));
  }
  // Neues Kapitel = erste Runde gegen einen neuen Gegner, sobald sie begonnen hat.
  // Eigener try: kaputte Siege dürfen die übrigen Einträge des Helden nicht verschwinden lassen.
  if (q) {
    try {
      let vorher = null; // Chronik als Buch (02.11.2026): Gegner der Runde davor, für „nach dem Sieg über …“
      for (const r of K.runden(a, heuteK).runden) {
        if (r.neuerGegner && r.von <= heuteK) add('kapitel', r.von, `R${r.nr}`, { gegner: r.gegner, nr: r.gegnerIdx + 1, vorher });
        vorher = r.gegner;
      }
    } catch (err) { warn(`Logbuch: Kapitel von ${heroId} nicht ableitbar (${err.message})`); }
  }
  return out;
}

// Alle Einträge aller Helden. Unbekannte Arten (nicht im Register) werden übersprungen und gemeldet.
// optionen: { arten, mikroTexte: { id: text }, warn, eintragArten (Version 75, Register der eigenen Einträge) }
export function logbuchEintraege(spiel, heute, { arten, mikroTexte = {}, warn = () => {}, eintragArten = null } = {}) {
  if (!arten) throw new Error('logbuchEintraege: Arten fehlen');
  const heuteK = K.tagKey(heute);
  const alle = [];
  for (const h of (spiel && Array.isArray(spiel.helden) ? spiel.helden : [])) {
    try {
      const a = ansicht(spiel, h.heroId);
      const eigene = (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).filter(e => e && e.heroId === h.heroId);
      for (const e of eintraegeHeld(h.heroId, h.domainId, a, heuteK, mikroTexte, warn, eigene, eintragArten)) {
        const art = arten[e.art];
        if (!art) { warn(`Logbuch: unbekannte Art ${e.art}`); continue; }
        alle.push({ ...e, xp: art.xp ? K.XP[art.xp] || 0 : 0 });
      }
    } catch (err) {
      warn(`Logbuch: Held ${h && h.heroId} übersprungen (${err.message})`);
    }
  }
  // Tagesnotizen (04.11.2026): Einträge einer Art mit `bereiche`, ohne Held. heroId null, bereiche aus dem Eintrag.
  for (const e of (spiel && Array.isArray(spiel.eintraege) ? spiel.eintraege : [])) {
    const reg = e && eintragArten && eintragArten[e.art];
    if (!reg || !reg.bereiche) continue;
    if (!gueltigerTag(e.tag) || e.tag > heuteK) continue;
    const art = arten[reg.logbuch];
    if (!art) { warn(`Logbuch: unbekannte Art ${reg.logbuch}`); continue; }
    alle.push({ id: `${LB_GANZER_TAG}:${reg.logbuch}:${e.tag}:${e.id}`, heroId: null, domainId: null, bereiche: Array.isArray(e.bereiche) ? [...e.bereiche] : [], art: reg.logbuch, tag: e.tag, daten: eigeneDaten(e), xp: art.xp ? K.XP[art.xp] || 0 : 0 });
  }
  return alle;
}

// Passt ein Eintrag zu den gewählten Lebensbereichen? Leere Auswahl = alles. LB_GANZER_TAG trifft Einträge ohne Bereich.
export function passtZuBereichen(e, auswahl) {
  if (!Array.isArray(auswahl) || !auswahl.length) return true;
  const b = Array.isArray(e && e.bereiche) ? e.bereiche : [];
  return b.length ? b.some(x => auswahl.includes(x)) : auswahl.includes(LB_GANZER_TAG);
}

// Suche in eigenen Texten (Notiz, Felder, Plan fürs nächste Mal). Groß/klein und Akzente egal, alle Wörter müssen
// vorkommen. Leere Suche = alles. Wirft nie.
const normal = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('de').replace(/\s+/g, ' ').trim();
export const suchWoerter = suche => normal(suche).split(' ').filter(Boolean);
export function textVon(e) {
  const d = (e && e.daten) || {};
  return [d.text, d.naechstesMal, ...(d.felder && typeof d.felder === 'object' ? Object.values(d.felder) : [])].filter(x => typeof x === 'string' && x).join('\n');
}
export function passtZurSuche(e, woerter) {
  if (!Array.isArray(woerter) || !woerter.length) return true;
  const t = normal(textVon(e));
  return !!t && woerter.every(w => t.includes(w));
}

// Gefiltert, nach Tagen gruppiert (neueste zuerst), begrenzt auf `tage` Tage mit Einträgen.
// filter: { held: 'alle' | heroId, gruppe: 'alle' | Gruppen-ID, tage: Zahl, bereiche: [Bereich-ID | LB_GANZER_TAG], suche: Text }
// Unbekannter Held oder unbekannte Gruppe → 'alle' (sicherer Rückfall, gemeldet in `korrigiert`).
// bereiche (04.11.2026): Mehrfachauswahl, leer = alle; unbekannte IDs (nicht in optionen.bereichIds) fallen weg und
// werden als 'bereiche' gemeldet. suche: höchstens 100 Zeichen, sonst gekürzt.
export function logbuchAnsicht(eintraege, arten, filter = {}, standardTage = 14, { bereichIds = null } = {}) {
  const heldIds = new Set(eintraege.map(e => e.heroId));
  const gruppen = new Set(Object.values(arten).map(a => a.gruppe));
  const korrigiert = [];
  let held = filter.held || 'alle';
  if (held !== 'alle' && !heldIds.has(held)) { korrigiert.push('held'); held = 'alle'; }
  let gruppe = filter.gruppe || 'alle';
  if (gruppe !== 'alle' && !gruppen.has(gruppe)) { korrigiert.push('gruppe'); gruppe = 'alle'; }
  const n = Number.isInteger(filter.tage) && filter.tage > 0 ? filter.tage : standardTage;
  let bereiche = Array.isArray(filter.bereiche) ? [...new Set(filter.bereiche.filter(x => typeof x === 'string'))] : [];
  if (Array.isArray(bereichIds)) {
    const ok = bereiche.filter(x => x === LB_GANZER_TAG || bereichIds.includes(x));
    if (ok.length !== bereiche.length) { korrigiert.push('bereiche'); bereiche = ok; }
  }
  const suche = typeof filter.suche === 'string' ? filter.suche.slice(0, 100) : '';
  const woerter = suchWoerter(suche);

  const passend = eintraege.filter(e => (held === 'alle' || e.heroId === held) && (gruppe === 'alle' || arten[e.art].gruppe === gruppe)
    && passtZuBereichen(e, bereiche) && passtZurSuche(e, woerter));
  const jeTag = new Map();
  for (const e of passend) (jeTag.get(e.tag) || jeTag.set(e.tag, []).get(e.tag)).push(e);
  const tageSortiert = [...jeTag.keys()].sort().reverse();
  const rang = e => arten[e.art].rang;
  const tage = tageSortiert.slice(0, n).map(tag => {
    const hid = x => x.heroId || ''; // Tagesnotizen (heroId null) zuerst unter gleichem Rang
    const l = jeTag.get(tag).sort((x, y) => rang(x) - rang(y) || (hid(x) < hid(y) ? -1 : hid(x) > hid(y) ? 1 : 0) || (x.id < y.id ? -1 : 1));
    return { tag, eintraege: l, xp: l.reduce((s, e) => s + e.xp, 0) };
  });
  const erster = eintraege.length ? eintraege.reduce((m, e) => (e.tag < m ? e.tag : m), eintraege[0].tag) : null;
  return {
    filter: { held, gruppe, tage: n, bereiche, suche },
    korrigiert,
    tage,
    mehr: tageSortiert.length > n,
    anzahl: passend.length,
    gesamt: eintraege.length,
    seit: erster
  };
}
