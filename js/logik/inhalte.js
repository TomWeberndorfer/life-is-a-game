// Auswahl der täglichen Inhalte. Reine Funktionen; Texte kommen aus daten/inhalte.js.
import { tagKey, ausTagKey, auswertung } from './kern.js';

// Stabiler Zahlenwert je Text (gleicher Tag → gleiche Variante, jeden Tag eine andere).
export function streuwert(text) {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

const ARTIKEL = { Der: 'm', Die: 'f', Das: 'n' };
const FUERWORT = { m: { er: 'er', ihn: 'ihn' }, f: { er: 'sie', ihn: 'sie' }, n: { er: 'es', ihn: 'es' } };

// Nominativ für Fließtext und Genus für Fürwörter.
export function gegnerFormen(g) {
  const m = /^(Der|Die|Das) (.+)$/.exec(g.name || '');
  const genus = m ? ARTIKEL[m[1]] : (g.genus || 'm');
  const nom = m ? `${m[1].toLowerCase()} ${m[2]}` : (g.kurz || g.name || 'der Gegner');
  return { nom, genus, ...FUERWORT[genus] };
}

const gross = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function fuelle(text, w) {
  return String(text).replace(/\{(\w+)\}/g, (all, k) => {
    if (k === 'Gegner') return gross(w.gegner);
    if (k === 'Er') return gross(w.er);
    return w[k] !== undefined && w[k] !== null ? String(w[k]) : all;
  });
}

export function werteFuer(stand, heute, vorlage, tabelle, nameVon = id => (tabelle.helden[id] ? tabelle.helden[id].name : id)) {
  const a = auswertung(stand, heute);
  const g = gegnerFormen(tabelle.gegner[vorlage.gegner]);
  return {
    verbuendeter: nameVon(vorlage.held),
    faehigkeit: tabelle.faehigkeiten[vorlage.faehigkeit].name,
    ziel: stand.quest ? stand.quest.ziel : '',
    n: a.wocheZaehler, anzahl: a.anzahl, rest: Math.max(0, a.anzahl - a.wocheZaehler),
    gegner: g.nom, er: g.er, ihn: g.ihn
  };
}

function plusTage(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12); return x; }

// Welcher Anlass gilt heute? (Reihenfolge wie in BOTSCHAFTEN)
export function anlass(stand, heute) {
  if (!stand.quest) return 'sonst';
  const a = auswertung(stand, heute);
  const k = tagKey(heute);
  const gestern = tagKey(plusTage(heute, -1));
  const start = stand.quest.start;
  if (start === k) return 'erster_tag';
  if (a.neuerGegner && (a.siegHeute || a.rundeTag <= 0)) return 'neuer_gegner';
  if (a.siegHeute) return 'besiegt';
  if (a.anzahl - a.wocheZaehler === 1) return 'fast';
  // Erster Tag einer neuen Runde (Anlass-IDs „montag…“ aus Version 5 beibehalten)
  if (a.rundeTag === 0 && a.wocheNr > 1) return a.vorigeGewonnen ? 'montag_sieg' : 'montag';
  if (stand.tage[gestern] === 'ja') return 'gestern_ja';
  if (stand.tage[gestern] === 'nein') return 'gestern_nein';
  if (start && start < gestern) return 'pause';
  return 'sonst';
}

export function botschaft(stand, heute, vorlage, tabelle, botschaften, nameVon) {
  const an = anlass(stand, heute);
  const eintrag = botschaften.find(b => b.anlass === an) || botschaften.find(b => b.anlass === 'sonst');
  if (!eintrag || !eintrag.texte.length) return { anlass: an, text: '' };
  const i = streuwert(tagKey(heute) + an) % eintrag.texte.length;
  return { anlass: an, text: fuelle(eintrag.texte[i], werteFuer(stand, heute, vorlage, tabelle, nameVon)) };
}

// Story der laufenden Woche: Woche 1 je Gegner, danach die allgemeine Woche.
// Je Tag mit Tages-Check in dieser Woche wird ein Teil frei (höchstens 7).
export function storyWoche(stand, heute, vorlage, tabelle, stories, nameVon) {
  const a = auswertung(stand, heute);
  // Erste Runde gegen einen Gegner: seine eigene Geschichte (falls vorhanden), sonst die allgemeine Woche.
  const geschichte = (a.ersteRundeGegner && stories[a.gegner || vorlage.gegner]) || stories._allgemein;
  const w = werteFuer(stand, heute, vorlage, tabelle, nameVon);
  const frei = Math.min(geschichte.teile.length, a.eintraegeWoche);
  const gelesen = Math.min(frei, (stand.story && stand.story.gelesen[a.woche]) || 0);
  return {
    woche: a.woche,
    wocheNr: a.wocheNr,
    titel: fuelle(geschichte.titel, w),
    teile: geschichte.teile.map((t, i) => ({ nr: i + 1, titel: fuelle(t.titel, w), text: fuelle(t.text, w), frei: i < frei })),
    frei,
    gelesen,
    neu: frei > gelesen
  };
}

// Heutige Mikroquests: feste Auswahl je Tag aus dem Pool der Onboarding-Gruppe.
export function mikroHeute(stand, heute, bereich, pools, anzahl, rueckfall) {
  const pool = pools[bereich] || pools[rueckfall] || [];
  const k = tagKey(heute);
  const erledigt = (stand.mikro || {})[k] || [];
  const sortiert = pool
    .map(([id, text]) => ({ id, text, w: streuwert(k + id) }))
    .sort((x, y) => x.w - y.w)
    .slice(0, Math.min(anzahl, pool.length));
  return sortiert.map(({ id, text }) => ({ id, text, erledigt: erledigt.includes(id) }));
}

// Prüft die Texte auf unbekannte Platzhalter; liefert Fehlertexte.
export function pruefeTexte(botschaften, stories) {
  const erlaubt = new Set(['verbuendeter', 'faehigkeit', 'ziel', 'n', 'anzahl', 'rest', 'gegner', 'Gegner', 'er', 'Er', 'ihn']);
  const fehler = [];
  const pruefe = (wo, text) => { for (const m of String(text).matchAll(/\{(\w+)\}/g)) if (!erlaubt.has(m[1])) fehler.push(`${wo}: {${m[1]}}`); };
  for (const b of botschaften) b.texte.forEach((x, i) => pruefe(`${b.anlass}[${i}]`, x));
  for (const [id, s] of Object.entries(stories)) {
    if (s.teile.length !== 7) fehler.push(`${id}: ${s.teile.length} statt 7 Teile`);
    s.teile.forEach((t, i) => { pruefe(`${id}[${i}]`, t.titel); pruefe(`${id}[${i}]`, t.text); });
  }
  return fehler;
}

export { ausTagKey };
