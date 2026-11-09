// Kapitel-Archiv (Version 171, 09.11.2026): reine Funktionen, keine Uhr, keine Oberfläche. Regeln: daten/kapitel.js.
// Ein neues Ziel (neues Kapitel) archiviert die Quest samt Tagen und Siegen des Helden in spiel.kapitel[heroId]. XP und Siege
// des Helden bleiben dadurch erhalten: Der Stand des Helden (helden.ansicht) bekommt xpFrueher und siegeFrueher dazu
// (nur gelesen, nie zurückgeschrieben); kern.auswertung zählt xpFrueher zu den XP. XP eines Kapitels werden wie immer aus seinen
// Tagen und Siegen abgeleitet (K.auswertung auf dem archivierten Stand), nicht gespeichert.
// Bewusst keine Abhängigkeit von logik/helden.js (helden.js importiert diese Datei).
import { KAPITEL } from '../daten/kapitel.js';
import * as K from './kern.js';

const ID = /^[a-z0-9-]{1,40}$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const istObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const kopie = x => JSON.parse(JSON.stringify(x));

// Ein Kapitel prüfen: ungültig → null. Unbrauchbare Teile (haken, mikro) fallen auf leer.
export function bereinigeKapitelEintrag(roh) {
  if (!istObj(roh) || !istObj(roh.quest) || !istObj(roh.tage)) return null;
  if (!TAG.test(String(roh.ende)) || !K.ausTagKey(roh.ende)) return null;
  const siege = (Array.isArray(roh.siege) ? roh.siege : []).filter(s => istObj(s) && TAG.test(String(s.tag)));
  return kopie({
    quest: roh.quest, tage: roh.tage, siege,
    mikro: istObj(roh.mikro) ? roh.mikro : {}, haken: istObj(roh.haken) ? roh.haken : {},
    von: TAG.test(String(roh.von)) ? roh.von : (TAG.test(String(roh.quest.start)) ? roh.quest.start : roh.ende),
    ende: roh.ende
  });
}

// Ganze Tabelle { heroId: [Kapitel] }. Fehlt sie (Altbestand) oder ist sie kaputt → {}. heroIds: nur diese Helden bleiben.
export function bereinigeKapitel(roh, { heroIds = null, opt = KAPITEL } = {}) {
  const aus = {};
  if (!istObj(roh)) return aus;
  for (const [id, liste] of Object.entries(roh)) {
    if (!ID.test(id) || (heroIds && !heroIds.has(id)) || !Array.isArray(liste)) continue;
    const l = liste.map(bereinigeKapitelEintrag).filter(Boolean).slice(-opt.max);
    if (l.length) aus[id] = l;
  }
  return aus;
}

export const kapitelVon = (spiel, heroId) => (spiel && istObj(spiel.kapitel) && Array.isArray(spiel.kapitel[heroId]) ? spiel.kapitel[heroId] : []);
export const siegeFrueher = (spiel, heroId) => kapitelVon(spiel, heroId).reduce((n, k) => n + (Array.isArray(k.siege) ? k.siege.length : 0), 0);

// XP eines Kapitels, abgeleitet. ruhetage: Ruhetage des Helden (Einträge). Wirft nie: bei einem Fehler zählt die einfache Summe.
export function xpVonKapitel(k, ruhetage = []) {
  try {
    const stand = { ...K.neuerStand('kapitel'), quest: k.quest, tage: k.tage, siege: k.siege, mikro: k.mikro || {}, haken: k.haken || {}, ruhetage: ruhetage.filter(t => t <= k.ende) };
    return K.auswertung(stand, K.ausTagKey(k.ende)).xp;
  } catch (e) {
    const ja = Object.values(k.tage || {}).filter(a => a === 'ja').length;
    const mikro = Object.values(k.mikro || {}).reduce((x, v) => x + (Array.isArray(v) ? v.length : 0), 0);
    return ja * K.XP.anwendung + (k.siege || []).length * K.XP.sieg + mikro * K.XP.mikro;
  }
}
export function xpFrueher(spiel, heroId) {
  const ruhe = (Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : []).filter(e => e && e.heroId === heroId && e.art === 'ruhetag').map(e => e.tag);
  return kapitelVon(spiel, heroId).reduce((n, k) => n + xpVonKapitel(k, ruhe), 0);
}

// Tag, ab dem das neue Kapitel beginnt: heute, außer der Held hat im alten Kapitel heute schon etwas eingetragen (dann morgen,
// damit nichts doppelt zählt). Liefert { start (Tag), spaeter (boolean) }.
export function startTag(stand, heuteK) {
  const heute = (stand.tage && stand.tage[heuteK]) || (stand.siege || []).some(s => s && s.tag === heuteK) || ((stand.mikro || {})[heuteK] || []).length > 0;
  if (!heute) return { start: heuteK, spaeter: false };
  const d = K.ausTagKey(heuteK); d.setDate(d.getDate() + 1);
  return { start: K.tagKey(d), spaeter: true };
}

// Archiviert den jetzigen Stand eines Helden als Kapitel. h = Held aus spiel.helden. Liefert die neue Tabelle { heroId: [...] }.
export function archiviert(spiel, h, heuteK) {
  const eintrag = bereinigeKapitelEintrag({ quest: h.quest, tage: h.tage, siege: h.siege, mikro: h.mikro, haken: h.haken, von: h.quest && h.quest.start, ende: heuteK });
  if (!eintrag) throw new Error('Das bisherige Ziel konnte nicht gesichert werden.');
  const alt = kapitelVon(spiel, h.heroId);
  return { ...(istObj(spiel.kapitel) ? spiel.kapitel : {}), [h.heroId]: [...alt, eintrag].slice(-KAPITEL.max) };
}

// Kurzfassung der Kapitel für das Heldenblatt: [{ nr, ziel, von, ende, tage, siege }], ältestes zuerst. Wirft nie.
export function kapitelListe(spiel, heroId) {
  try {
    return kapitelVon(spiel, heroId).map((k, i) => ({
      nr: i + 1, ziel: typeof k.quest.ziel === 'string' ? k.quest.ziel : '', von: k.von, ende: k.ende,
      tage: Object.values(k.tage).filter(a => a === 'ja').length, siege: k.siege.length
    }));
  } catch (e) { return []; }
}
