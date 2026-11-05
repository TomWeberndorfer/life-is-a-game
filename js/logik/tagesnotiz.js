// Tagesnotiz (04.11.2026): reine Funktionen ohne DOM. Daten: daten/tagesnotiz.js, Modell: daten/eintrag-arten.js (Art
// „notiz“), Ansicht: ansicht/notiz.js. Wirft nur pruefeTagesnotiz nichts; alle anderen liefern bei Unsinn einen Rückfall.
import * as K from './kern.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;

// Konfiguration prüfen (beim Start). Liefert Meldungen, leer = in Ordnung.
export function pruefeTagesnotiz(cfg, { texte = null } = {}) {
  const m = [];
  if (!cfg || typeof cfg !== 'object') return ['Tagesnotiz: keine Einstellungen'];
  const s = cfg.startseite;
  if (!s || typeof s !== 'object') m.push('Tagesnotiz: startseite fehlt');
  else {
    if (typeof s.an !== 'boolean') m.push('Tagesnotiz: startseite.an muss true oder false sein');
    if (!Number.isInteger(s.abStunde) || s.abStunde < 0 || s.abStunde > 23) m.push('Tagesnotiz: abStunde muss 0–23 sein');
    if (typeof s.weg !== 'string' || !/^[a-zA-Z]+$/.test(s.weg)) m.push('Tagesnotiz: weg ist kein gültiger Name');
  }
  if (!Array.isArray(cfg.tage) || !cfg.tage.length || cfg.tage.some(t => !Number.isInteger(t) || t < 0 || t > 30)) m.push('Tagesnotiz: tage muss eine Liste von 0–30 sein');
  else for (const t of cfg.tage) {
    const n = cfg.tagNamen && cfg.tagNamen[t];
    if (typeof n !== 'string' || !n) m.push(`Tagesnotiz: Name für Tag ${t} fehlt`);
    else if (texte && !(`notiz.tag.${n}` in texte)) m.push(`Tagesnotiz: Text notiz.tag.${n} fehlt`);
  }
  return m;
}

// Stunde aus der Konfiguration (ungültig → 18).
const abStunde = cfg => (cfg && cfg.startseite && Number.isInteger(cfg.startseite.abStunde) && cfg.startseite.abStunde >= 0 && cfg.startseite.abStunde <= 23 ? cfg.startseite.abStunde : 18);

// Zustand der Karte auf der Startseite: 'aus' | 'angebot' | 'da'.
// jetzt: Date; heuteNotizen: Anzahl Notizen von heute; wegTag: gespeicherter Tag von „Heute nicht“ (oder nichts).
// 'da' (schon geschrieben) erscheint auch vor der Abendstunde nicht; die Karte stört tagsüber nie.
export function karteZustand(cfg, { jetzt, heuteNotizen = 0, wegTag = null } = {}) {
  if (!cfg || !cfg.startseite || cfg.startseite.an !== true) return 'aus';
  if (!(jetzt instanceof Date) || Number.isNaN(jetzt.getTime())) return 'aus';
  if (jetzt.getHours() < abStunde(cfg)) return 'aus';
  if (heuteNotizen > 0) return 'da';
  let w = wegTag;
  if (typeof w === 'string') { try { w = JSON.parse(w); } catch (e) { /* roher Text */ } }
  return w === K.tagKey(jetzt) ? 'aus' : 'angebot';
}

// Wählbare Tage für eine neue Notiz: [{ tag, name }], heute zuerst. Ungültige Einträge fallen weg; leer → nur heute.
export function waehlbareTage(cfg, jetzt) {
  const heute = K.tagKey(jetzt);
  const liste = Array.isArray(cfg && cfg.tage) ? cfg.tage.filter(t => Number.isInteger(t) && t >= 0 && t <= 30) : [];
  const aus = [];
  for (const t of liste.length ? [...new Set(liste)].sort((a, b) => a - b) : [0]) {
    const d = K.ausTagKey(heute);
    d.setDate(d.getDate() - t);
    aus.push({ tag: K.tagKey(d), name: (cfg && cfg.tagNamen && cfg.tagNamen[t]) || String(t) });
  }
  return aus;
}

// Auswahl der Lebensbereiche für Notiz und Filter: [{ id, heroId, bereichName }], erst die Bereiche der eigenen Helden
// (in der Reihenfolge des Spielstands), dann die übrigen in der Reihenfolge des Registers.
// nur: optionale Liste von IDs, auf die beschränkt wird (Filter: nur Bereiche, die im Logbuch vorkommen).
export function bereichAuswahl(spiel, lebensbereiche, { nur = null } = {}) {
  const reg = Array.isArray(lebensbereiche) ? lebensbereiche.filter(d => d && typeof d.id === 'string') : [];
  const helden = spiel && Array.isArray(spiel.helden) ? spiel.helden : [];
  const heldVon = {};
  for (const h of helden) if (h && h.domainId && !heldVon[h.domainId]) heldVon[h.domainId] = h.heroId;
  const eigen = helden.map(h => h && h.domainId).filter((d, i, l) => d && l.indexOf(d) === i && reg.some(x => x.id === d));
  const rest = reg.map(d => d.id).filter(d => !eigen.includes(d));
  const erlaubt = Array.isArray(nur) ? new Set(nur) : null;
  return [...eigen, ...rest].filter(id => !erlaubt || erlaubt.has(id)).map(id => ({ id, heroId: heldVon[id] || null, bereichName: (reg.find(d => d.id === id) || {}).name || id }));
}

// Eine Wahl umschalten (Mehrfachauswahl): drin → raus, sonst hinten an. Liefert eine neue Liste.
export const umschalten = (liste, id) => {
  const l = Array.isArray(liste) ? liste : [];
  return l.includes(id) ? l.filter(x => x !== id) : [...l, id];
};

// Hat die Eingabe überhaupt Inhalt? (Stimmung oder ein nicht leerer Text.) Leere Notizen speichert die Ansicht nicht.
export function hatInhalt(e) {
  if (!e || typeof e !== 'object') return false;
  if (e.stimmung !== null && e.stimmung !== undefined && e.stimmung !== '') return true;
  const f = e.felder && typeof e.felder === 'object' ? Object.values(e.felder) : [];
  return f.some(t => typeof t === 'string' && t.trim());
}

// Vorschlag für die Stimmung einer weiteren Notiz am selben Tag: Stimmung der zuletzt angelegten Notiz dieses Tages mit
// Stimmung (vorausgewählt, nicht eingeklappt; ein Tipp ändert sie). Keine → null. notizen: Einträge des Tages.
export function stimmungVorschlag(notizen, stimmungen) {
  const l = (Array.isArray(notizen) ? notizen : []).filter(e => e && Array.isArray(stimmungen) && stimmungen.includes(e.stimmung));
  if (!l.length) return null;
  const j = l.slice().sort((a, b) => (String(a.erstellt || '') < String(b.erstellt || '') ? -1 : String(a.erstellt || '') > String(b.erstellt || '') ? 1 : 0)).pop();
  return j.stimmung;
}

// Ist der Tag gültig ('JJJJ-MM-TT')?
export const gueltigerTag = t => TAG.test(String(t)) && !!K.ausTagKey(t);
