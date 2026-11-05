// Wochenrunde (05.11.2026): reine Funktionen ohne DOM. Einstellungen: daten/wochenrunde.js, Ansicht: ansicht/wochenrunde.js.
// Modell: spiel.wochen = { 'JJJJ-Www': { max, wheel: { bereichId: Zahl }, vorsatz, abgeschlossen } }.
// Nur wocheAbschliessen und pruefe… melden Fehler; alles andere liefert bei Unsinn einen sicheren Rückfall und wirft nie.
import { WOCHENRUNDE } from '../daten/wochenrunde.js';
import { HELDENMODI } from '../daten/heldenmodi.js';
import * as K from './kern.js';
import * as HM from './heldenmodi.js';
import { zaehltAntworten } from './teilziele.js';
import { tageMit } from './antworten.js';

export class WochenFehler extends Error {}

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const WOCHE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
export const istWoche = w => typeof w === 'string' && WOCHE.test(w) && !!K.isoMontag(w) && K.wocheKey(K.isoMontag(w)) === w;
const istTag = t => typeof t === 'string' && TAG.test(t) && !!K.ausTagKey(t);
const plus = (k, n) => { const d = K.ausTagKey(k); d.setDate(d.getDate() + n); return K.tagKey(d); };
const ganz = x => Number.isInteger(x);
const HELD_ID = /^[a-z0-9-]{1,40}$/i;

// Skala aus der Konfiguration (ungültig → 1–10).
export function skalaVon(opt = WOCHENRUNDE) {
  const s = opt && opt.skala;
  return s && ganz(s.min) && ganz(s.max) && s.min >= 0 && s.max > s.min && s.max <= 100 ? { min: s.min, max: s.max } : { min: 1, max: 10 };
}

// Konfiguration prüfen (beim Start). Liefert Meldungen, leer = in Ordnung.
export function pruefeWochenrunde(cfg, { texte = null } = {}) {
  const m = [];
  if (!cfg || typeof cfg !== 'object') return ['Wochenrunde: keine Einstellungen'];
  const s = cfg.skala;
  if (!s || !ganz(s.min) || !ganz(s.max) || s.min < 0 || s.max <= s.min || s.max > 100) m.push('Wochenrunde: skala muss min < max (0–100) sein');
  const e = cfg.einladung;
  if (!e || !ganz(e.schwelle) || e.schwelle < 1) m.push('Wochenrunde: einladung.schwelle muss eine ganze Zahl ab 1 sein');
  if (!e || !Array.isArray(e.modi) || e.modi.some(x => !HM.istPausiert(x))) m.push('Wochenrunde: einladung.modi darf nur Pausen-Modi nennen');
  if (!ganz(cfg.tag) || cfg.tag < 0 || cfg.tag > 6) m.push('Wochenrunde: tag muss 0–6 sein');
  if (!ganz(cfg.nachholTage) || cfg.nachholTage < 0 || cfg.nachholTage > 6) m.push('Wochenrunde: nachholTage muss 0–6 sein');
  if (typeof cfg.weg !== 'string' || !/^[a-zA-Z]+$/.test(cfg.weg)) m.push('Wochenrunde: weg ist kein gültiger Name');
  if (!ganz(cfg.vorsatzMax) || cfg.vorsatzMax < 1) m.push('Wochenrunde: vorsatzMax fehlt');
  if (!ganz(cfg.vorsatzTage) || cfg.vorsatzTage < 1 || cfg.vorsatzTage > 31) m.push('Wochenrunde: vorsatzTage muss 1–31 sein');
  if (!ganz(cfg.wochenMax) || cfg.wochenMax < 2) m.push('Wochenrunde: wochenMax muss mindestens 2 sein');
  if (!Array.isArray(cfg.schritte) || !cfg.schritte.length) m.push('Wochenrunde: schritte fehlen');
  else if (texte) for (const id of cfg.schritte) if (!(`wr.schritt.${id}` in texte)) m.push(`Wochenrunde: Text wr.schritt.${id} fehlt`);
  return m;
}

// Wert von einer Skala (vonMax) auf die aktuelle umrechnen, gerundet und begrenzt. Ungültig → null.
export function umrechnen(wert, vonMax, opt = WOCHENRUNDE) {
  const { min, max } = skalaVon(opt);
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null;
  const von = ganz(vonMax) && vonMax > min ? vonMax : max;
  const w = von === max ? wert : min + ((wert - min) * (max - min)) / (von - min);
  return Math.max(min, Math.min(max, Math.round(w)));
}

// Eine Woche bereinigen. Liefert null, wenn nichts Brauchbares übrig bleibt.
function bereinigeWoche(roh, bereichIds, opt) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
  const { min, max } = skalaVon(opt);
  const wmax = ganz(roh.max) && roh.max > min && roh.max <= 100 ? roh.max : max;
  const wheel = {};
  if (roh.wheel && typeof roh.wheel === 'object' && !Array.isArray(roh.wheel)) {
    for (const [id, v] of Object.entries(roh.wheel)) {
      if (bereichIds && !bereichIds.has(id)) continue;
      if (ganz(v) && v >= min && v <= wmax) wheel[id] = v;
    }
  }
  const vorsatz = typeof roh.vorsatz === 'string' ? roh.vorsatz.replace(/\s+/g, ' ').trim().slice(0, opt.vorsatzMax || 200) : '';
  const abgeschlossen = istTag(roh.abgeschlossen) ? roh.abgeschlossen : null;
  // Held des Vorsatzes nur mit Vorsatz; geht der Held, bleibt die ID (die Anzeige fällt dann auf den Fokus zurück)
  const vorsatzHeld = vorsatz && typeof roh.vorsatzHeld === 'string' && HELD_ID.test(roh.vorsatzHeld) ? roh.vorsatzHeld : null;
  if (!Object.keys(wheel).length && !vorsatz && !abgeschlossen) return null;
  return { max: wmax, wheel, vorsatz, vorsatzHeld, abgeschlossen };
}

// Ganzes Feld bereinigen. Fehlt es (Altbestand) → {}. Unbekannte Lebensbereiche fallen weg, höchstens wochenMax Wochen.
export function bereinigeWochen(roh, { bereichIds = null, opt = WOCHENRUNDE } = {}) {
  const aus = {};
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return aus;
  const ids = bereichIds instanceof Set ? bereichIds : null;
  const keys = Object.keys(roh).filter(istWoche).sort();
  const behalten = ganz(opt.wochenMax) && opt.wochenMax > 0 ? keys.slice(-opt.wochenMax) : keys;
  for (const w of behalten) { const b = bereinigeWoche(roh[w], ids, opt); if (b) aus[w] = b; }
  return aus;
}

const wochenVon = spiel => (spiel && spiel.wochen && typeof spiel.wochen === 'object' && !Array.isArray(spiel.wochen) ? spiel.wochen : {});

// Wert eines Bereichs in einer gespeicherten Woche, auf die aktuelle Skala umgerechnet; nichts → null.
export function wertIn(woche, bereichId, opt = WOCHENRUNDE) {
  if (!woche || !woche.wheel || !(bereichId in woche.wheel)) return null;
  return umrechnen(woche.wheel[bereichId], woche.max, opt);
}

// Letzte Woche VOR wocheK mit mindestens einem Wheel-Wert (Schlüssel) oder null.
export function vorwocheVon(wochen, wocheK) {
  const w = wochen && typeof wochen === 'object' ? wochen : {};
  const keys = Object.keys(w).filter(k => istWoche(k) && k < wocheK && w[k] && w[k].wheel && Object.keys(w[k].wheel).length).sort();
  return keys.length ? keys[keys.length - 1] : null;
}

// Ist die Runde dieser Woche abgeschlossen?
export const istAbgeschlossen = (spiel, wocheK) => !!(wochenVon(spiel)[wocheK] && wochenVon(spiel)[wocheK].abgeschlossen);

// Rundentag in Reichweite: heute oder bis zu nachholTage davor ist der Rundentag. Liefert { woche, tag } oder null.
export function rundenWoche(jetzt, opt = WOCHENRUNDE) {
  if (!(jetzt instanceof Date) || Number.isNaN(jetzt.getTime())) return null;
  const rtag = ganz(opt.tag) && opt.tag >= 0 && opt.tag <= 6 ? opt.tag : 0;
  const n = ganz(opt.nachholTage) && opt.nachholTage >= 0 && opt.nachholTage <= 6 ? opt.nachholTage : 0;
  const heute = K.tagKey(jetzt);
  for (let k = 0; k <= n; k++) {
    const t = plus(heute, -k);
    if (K.ausTagKey(t).getDay() === rtag) return { woche: K.wocheKey(t), tag: t };
  }
  return null;
}

// Welche Woche bespricht die Runde, wenn sie jetzt geöffnet wird? Am Rundentag (oder Nachholtag) dessen Woche, solange
// sie offen ist; sonst die laufende Woche (auch zum erneuten Öffnen einer schon abgeschlossenen Runde).
export function zielWoche(spiel, jetzt, opt = WOCHENRUNDE) {
  const r = rundenWoche(jetzt, opt);
  if (r && !istAbgeschlossen(spiel, r.woche)) return r.woche;
  return K.wocheKey(jetzt);
}

// Karte auf der Startseite: 'aus' | 'angebot'. frei = Wochenrunde freigeschaltet, wegWoche = gemerkte Woche von
// „Diese Woche nicht“ (roh aus der Browser-Einstellung, JSON oder Text). Eine erledigte Runde zeigt nichts (still).
export function karteZustand(spiel, { jetzt, frei = false, wegWoche = null, opt = WOCHENRUNDE } = {}) {
  if (!frei) return 'aus';
  const r = rundenWoche(jetzt, opt);
  if (!r || istAbgeschlossen(spiel, r.woche)) return 'aus';
  let w = wegWoche;
  if (typeof w === 'string') { try { w = JSON.parse(w); } catch (e) { /* roher Text */ } }
  return w === r.woche ? 'aus' : 'angebot';
}

// Hat es je eine abgeschlossene Wochenrunde gegeben? (Karte „Neu für dich“ beim ersten Mal.)
export const ersteRunde = spiel => !Object.values(wochenVon(spiel)).some(w => w && w.abgeschlossen);

// Entwurf zum Bearbeiten: { wheel, vorher, vorsatz, vorsatzHeld, vorwoche }.
// - wheel: Werte dieser Woche, falls schon gespeichert; sonst die der Vorwoche (vorbelegt, Entscheidung 2); sonst null.
// - vorher: Werte der Vorwoche (für die Einladung bei sinkendem Wert), auf die aktuelle Skala umgerechnet.
export function entwurf(spiel, wocheK, bereichIds, opt = WOCHENRUNDE) {
  const wochen = wochenVon(spiel);
  const ids = Array.isArray(bereichIds) ? bereichIds : [];
  const vk = vorwocheVon(wochen, wocheK);
  const vw = vk ? wochen[vk] : null;
  const diese = wochen[wocheK] || null;
  const quelle = diese && Object.keys(diese.wheel || {}).length ? diese : vw;
  const wheel = {}, vorher = {};
  for (const id of ids) { wheel[id] = wertIn(quelle, id, opt); vorher[id] = wertIn(vw, id, opt); }
  return { wheel, vorher, vorsatz: (diese && diese.vorsatz) || '', vorsatzHeld: (diese && diese.vorsatzHeld) || null, vorwoche: vk };
}

// Vorsatz der letzten abgeschlossenen Woche vor wocheK (auch wenn sie keine Wheel-Werte hat), sonst ''.
export function letzterVorsatz(spiel, wocheK) {
  const w = wochenVon(spiel);
  const keys = Object.keys(w).filter(k => istWoche(k) && k < wocheK && w[k] && w[k].vorsatz).sort();
  return keys.length ? w[keys[keys.length - 1]].vorsatz : '';
}

// Wert setzen (begrenzt auf die Skala). Ungültig → Wheel unverändert. Liefert ein neues Objekt.
export function wertSetzen(wheel, bereichId, wert, opt = WOCHENRUNDE) {
  const { min, max } = skalaVon(opt);
  const w = wheel && typeof wheel === 'object' ? wheel : {};
  if (typeof bereichId !== 'string' || !(bereichId in w)) return { ...w };
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return { ...w };
  return { ...w, [bereichId]: Math.max(min, Math.min(max, Math.round(wert))) };
}
// Um schritt ändern; ohne Wert beginnt + bei der Mitte (nicht bei 1), − ebenso.
export function wertAendern(wheel, bereichId, schritt, opt = WOCHENRUNDE) {
  const { min, max } = skalaVon(opt);
  const alt = wheel && ganz(wheel[bereichId]) ? wheel[bereichId] : null;
  const mitte = Math.round((min + max) / 2);
  return wertSetzen(wheel, bereichId, alt === null ? mitte : alt + (ganz(schritt) ? schritt : 0), opt);
}

// Abschließen: speichert Wheel (nur gesetzte Werte), Vorsatz und den Tag. Liefert ein neues Spiel.
// Wirft WochenFehler bei ungültiger Woche oder ungültigem Tag. Eine erneut abgeschlossene Woche wird ersetzt.
export function wocheAbschliessen(spiel, wocheK, { wheel = {}, vorsatz = '', vorsatzHeld = null } = {}, heuteK, { bereichIds = null, opt = WOCHENRUNDE } = {}) {
  if (!istWoche(wocheK)) throw new WochenFehler('Ungültige Woche.');
  if (!istTag(heuteK)) throw new WochenFehler('Ungültiger Tag.');
  if (!spiel || typeof spiel !== 'object') throw new WochenFehler('Kein Spielstand.');
  const { min, max } = skalaVon(opt);
  const ids = bereichIds instanceof Set ? bereichIds : null;
  const w = {};
  for (const [id, v] of Object.entries(wheel && typeof wheel === 'object' ? wheel : {})) {
    if (ids && !ids.has(id)) continue;
    if (ganz(v) && v >= min && v <= max) w[id] = v;
  }
  const text = typeof vorsatz === 'string' ? vorsatz.replace(/\s+/g, ' ').trim().slice(0, opt.vorsatzMax || 200) : '';
  // Held nur, wenn es ihn im Spielstand gibt und ein Vorsatz da ist (sonst gilt „ganze Woche“)
  const helden = Array.isArray(spiel.helden) ? spiel.helden.map(h => h && h.heroId) : [];
  const held = text && typeof vorsatzHeld === 'string' && helden.includes(vorsatzHeld) ? vorsatzHeld : null;
  const wochen = { ...bereinigeWochen(spiel.wochen, { bereichIds: ids, opt }), [wocheK]: { max, wheel: w, vorsatz: text, vorsatzHeld: held, abgeschlossen: heuteK } };
  return { ...spiel, wochen: bereinigeWochen(wochen, { bereichIds: ids, opt }) };
}

// Einladungen bei sinkendem Wert: Helden in einladung.modi, deren Bereich gegenüber der Vorwoche um mindestens
// schwelle gefallen ist. [{ heroId, bereich, alt, neu }] in der Reihenfolge der Crew. Wirft nie.
export function einladungen(spiel, wheel, vorher, opt = WOCHENRUNDE) {
  try {
    const e = opt && opt.einladung ? opt.einladung : WOCHENRUNDE.einladung;
    const schwelle = ganz(e.schwelle) && e.schwelle > 0 ? e.schwelle : 2;
    const modi = Array.isArray(e.modi) ? e.modi : [];
    const aus = [];
    for (const h of (spiel && Array.isArray(spiel.helden) ? spiel.helden : [])) {
      if (!h || !h.heroId || !h.domainId) continue;
      if (!modi.includes(HM.modusGewaehlt(spiel, h.heroId))) continue;
      const alt = vorher && ganz(vorher[h.domainId]) ? vorher[h.domainId] : null;
      const neu = wheel && ganz(wheel[h.domainId]) ? wheel[h.domainId] : null;
      if (alt !== null && neu !== null && alt - neu >= schwelle) aus.push({ heroId: h.heroId, bereich: h.domainId, alt, neu });
    }
    return aus;
  } catch (err) { return []; }
}

// Tage einer ISO-Woche (Montag bis Sonntag), höchstens bis bisK. Ungültige Woche → [].
export function tageDerWoche(wocheK, bisK = null) {
  const mo = istWoche(wocheK) ? K.isoMontag(wocheK) : null;
  if (!mo) return [];
  const aus = [];
  for (let i = 0; i < 7; i++) { const t = plus(mo, i); if (!bisK || t <= bisK) aus.push(t); }
  return aus;
}

// Rückblick je Held für eine Woche: [{ heroId, domainId, guteTage, schwer, modus }]. guteTage = Tage mit zählender
// Antwort (Beständigkeit: auch „nein“), schwer = Tage mit „War schwer“. Nur Tage bis heute. Wirft nie.
export function wochenBilanz(spiel, wocheK, heuteK) {
  const tage = new Set(tageDerWoche(wocheK, istTag(heuteK) ? heuteK : null));
  const aus = [];
  for (const h of (spiel && Array.isArray(spiel.helden) ? spiel.helden : [])) {
    if (!h || !h.heroId) continue;
    let gute = 0, schwer = 0;
    try {
      const zaehlt = zaehltAntworten(h.quest);
      for (const [t, a] of Object.entries(h.tage && typeof h.tage === 'object' ? h.tage : {})) if (tage.has(t) && zaehlt.includes(a)) gute++;
      schwer = tageMit(h.tage, 'schwer').filter(t => tage.has(t)).length;
    } catch (e) { /* kaputter Held: zählt, was lesbar war */ }
    let modus = HELDENMODI.standard;
    try { modus = HM.modusGewaehlt(spiel, h.heroId); } catch (e) { /* Standard */ }
    aus.push({ heroId: h.heroId, domainId: h.domainId || null, guteTage: gute, schwer, modus });
  }
  return aus;
}

// Vorsatz, der gerade gilt: der neueste abgeschlossene mit Text, höchstens vorsatzTage nach dem Abschließen.
// { text, heroId, woche } oder null. Wirft nie.
export function aktiverVorsatz(spiel, heuteK, opt = WOCHENRUNDE) {
  if (!istTag(heuteK)) return null;
  const tage = ganz(opt.vorsatzTage) && opt.vorsatzTage > 0 ? opt.vorsatzTage : 8;
  const ab = plus(heuteK, -tage);
  const w = wochenVon(spiel);
  const keys = Object.keys(w).filter(k => istWoche(k) && w[k] && w[k].vorsatz && istTag(w[k].abgeschlossen) && w[k].abgeschlossen <= heuteK && w[k].abgeschlossen >= ab).sort();
  if (!keys.length) return null;
  const k = keys[keys.length - 1];
  return { text: w[k].vorsatz, heroId: w[k].vorsatzHeld || null, woche: k };
}

// Vorsatz beim Helden heroId zeigen? Beim gewählten Helden; ohne Held (oder wenn er nicht mehr da ist) beim ersten Helden
// im Fokus, sonst beim ersten Helden. Liefert den Vorsatz oder null. Wirft nie.
export function vorsatzBeiHeld(spiel, heroId, heuteK, opt = WOCHENRUNDE) {
  try {
    const v = aktiverVorsatz(spiel, heuteK, opt);
    if (!v || !heroId) return null;
    const ids = (spiel && Array.isArray(spiel.helden) ? spiel.helden : []).map(h => h && h.heroId).filter(Boolean);
    const ziel = v.heroId && ids.includes(v.heroId) ? v.heroId : (HM.fokusHelden(spiel)[0] || ids[0] || null);
    return ziel === heroId ? v : null;
  } catch (e) { return null; }
}
