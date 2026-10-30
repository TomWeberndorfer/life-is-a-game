// Freischaltung von Bereichen (Version 27, erweitert in 37): reine Funktionen, nichts gespeichert.
// Regeln stehen als Daten in daten/freischaltung.js (TABS, FUNKTIONEN):
//   { art: 'immer' } · { art: 'sieg' } (erster Sieg eines Helden) · { art: 'stufe', ab: 3 } (höchster Held)
//   { art: 'zaehler', name: 'rueckfaelle', ab: 1 } (Version 37: beliebiger erfasster Zähler)
//   { art: 'kapitel', ab: 2 } (30.10.2026: höchstes erreichtes Kapitel der Bosskette über alle Helden)
// Neue Arten = neuer Eintrag in PRUEFER und PARAMETER. Unbekannte oder kaputte Regeln sperren (sicherer Rückfall) und melden das.
import * as K from './kern.js';
import { ansicht } from './helden.js';

// Höchste Stufe aller Helden am Tag `heute` (Date). Ohne Helden 0. Ein defekter Held wird übersprungen.
export function hoechsteStufe(spiel, heute, warn = () => {}) {
  if (!spiel || !Array.isArray(spiel.helden)) return 0;
  let max = 0;
  for (const h of spiel.helden) {
    try { max = Math.max(max, K.auswertung(ansicht(spiel, h.heroId), heute).level); }
    catch (e) { warn(`Stufe von ${h && h.heroId}: ${e.message}`); }
  }
  return max;
}

// Höchstes erreichtes Kapitel (Nummer des aktuellen Gegners der Kette) aller Helden. Ohne Helden 0; defekter Held übersprungen.
// Am Siegtag zählt der neue Gegner schon (die Taktung gibt an Höhepunkt-Tagen ohnehin nichts frei).
export function hoechstesKapitel(spiel, heute, warn = () => {}) {
  if (!spiel || !Array.isArray(spiel.helden)) return 0;
  let max = 0;
  for (const h of spiel.helden) {
    try { max = Math.max(max, K.auswertung(ansicht(spiel, h.heroId), heute).gegnerNr || 0); }
    catch (e) { warn(`Kapitel von ${h && h.heroId}: ${e.message}`); }
  }
  return max;
}

const ganzAb1 = v => Number.isInteger(v) && v >= 1;
const zahl = v => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);

// Fehler einer einzelnen Regel (leer = gültig). zaehlerNamen: erlaubte Zähler (ohne Liste: jeder Name).
export function regelFehler(regel, zaehlerNamen = null) {
  if (regel === undefined || regel === null) return [];
  if (typeof regel !== 'object' || Array.isArray(regel)) return ['Regel ist kein Objekt'];
  switch (regel.art) {
    case 'immer': case 'sieg': return [];
    case 'stufe': return ganzAb1(regel.ab) ? [] : [`Stufe „ab“ muss eine ganze Zahl ab 1 sein (ist ${JSON.stringify(regel.ab)})`];
    case 'kapitel': return ganzAb1(regel.ab) ? [] : [`Kapitel „ab“ muss eine ganze Zahl ab 1 sein (ist ${JSON.stringify(regel.ab)})`];
    case 'zaehler': {
      const f = [];
      if (typeof regel.name !== 'string' || !regel.name) f.push('Zähler ohne Namen');
      else if (zaehlerNamen && !zaehlerNamen.includes(regel.name)) f.push(`Unbekannter Zähler „${regel.name}“`);
      if (regel.ab !== undefined && !ganzAb1(regel.ab)) f.push(`Zähler „ab“ muss eine ganze Zahl ab 1 sein (ist ${JSON.stringify(regel.ab)})`);
      return f;
    }
    default: return [`Unbekannte Regel-Art „${regel.art}“`];
  }
}

const PRUEFER = {
  immer: () => true,
  sieg: (r, k) => k.siege > 0,
  stufe: (r, k) => k.stufe >= r.ab,
  kapitel: (r, k) => k.kapitel >= r.ab,
  zaehler: (r, k) => zahl(k.zaehler[r.name]) >= (r.ab === undefined ? 1 : r.ab)
};

// kontext: { stufe, kapitel, siege, zaehler: { name: zahl } }. Ohne Regel = frei (bestehende Tabs bleiben so wie bisher).
// zaehlerNamen (optional): erlaubte Zähler; ein fremder Name sperrt und wird gemeldet (Tippfehler fallen so auf).
export function istFrei(regel, kontext, warn = () => {}, zaehlerNamen = null) {
  if (regel === undefined || regel === null) return true;
  const fehler = regelFehler(regel, zaehlerNamen);
  if (fehler.length) { warn(`Freischalt-Regel gesperrt (${fehler.join('; ')}): ${JSON.stringify(regel)}`); return false; }
  const z = kontext && kontext.zaehler && typeof kontext.zaehler === 'object' ? kontext.zaehler : {};
  const k = { stufe: zahl(kontext && kontext.stufe), kapitel: zahl(kontext && kontext.kapitel), siege: zahl(kontext && kontext.siege), zaehler: z };
  return PRUEFER[regel.art](regel, k);
}

// Prüft die ganze Konfiguration (TABS, FUNKTIONEN) beim Start. Liefert eine Liste lesbarer Fehler, wirft nie.
export function pruefeFreischaltung({ tabs, funktionen, maxTabs, zaehler }) {
  const f = [];
  if (!Array.isArray(tabs) || !tabs.length) return ['Keine Tabs festgelegt'];
  const gesehen = new Set();
  tabs.forEach((t, i) => {
    const wo = `Tab ${i + 1}${t && t.screen ? ` (${t.screen})` : ''}`;
    if (!t || typeof t.screen !== 'string' || !t.screen) { f.push(`${wo}: screen fehlt`); return; }
    if (gesehen.has(t.screen)) f.push(`${wo}: doppelt`);
    gesehen.add(t.screen);
    const l = t.label;
    if (!l || (typeof l.text !== 'string' && typeof l.wort !== 'string')) f.push(`${wo}: label braucht text oder wort`);
    if (typeof t.icon !== 'string' || !t.icon) f.push(`${wo}: icon fehlt`);
    if (t.sperrText !== undefined && typeof t.sperrText !== 'string') f.push(`${wo}: sperrText muss ein Textschlüssel sein`);
    regelFehler(t.frei, zaehler).forEach(x => f.push(`${wo}: ${x}`));
  });
  if (tabs[0] && tabs[0].frei && tabs[0].frei.art !== 'immer') f.push(`Erster Tab (${tabs[0].screen}) muss immer frei sein`);
  if (Number.isInteger(maxTabs) && tabs.length > maxTabs) f.push(`${tabs.length} Tabs, Platz für ${maxTabs}`);
  for (const [id, fn] of Object.entries(funktionen || {})) {
    if (!fn || typeof fn !== 'object') { f.push(`Funktion ${id}: kein Objekt`); continue; }
    regelFehler(fn.frei, zaehler).forEach(x => f.push(`Funktion ${id}: ${x}`));
  }
  return f;
}

// „Neu für dich“ (Version 50): freigeschaltete Bereiche, deren Freischaltung noch nicht gezeigt wurde.
// Zählt nur Tabs mit echter Freischaltregel (nicht „immer“/ohne Regel), die gebaut sind (kein `bald`: „kommt bald“
// wird nicht angekündigt) und gerade frei sind. aktiv(tab) → bool; gesehen = Liste von Tab-IDs.
// Reihenfolge wie in TABS. Wirft nie; ein Fehler in aktiv() zählt als „nicht frei“.
export function neuFreigeschaltet(tabs, aktiv, gesehen) {
  const schon = new Set(Array.isArray(gesehen) ? gesehen : []);
  return (Array.isArray(tabs) ? tabs : []).filter(t => {
    if (!t || typeof t.screen !== 'string' || t.bald === true || schon.has(t.screen)) return false;
    if (!t.frei || t.frei.art === 'immer') return false;
    try { return !!aktiv(t); } catch (e) { return false; }
  }).map(t => t.screen);
}

// ---------- Höchstens eine Freischaltung pro Tag (Version 69, Vorschlag 30.10.2026) ----------
// Verdiente Bereiche (Tab-Regel erfüllt, Welten frei, erstes Angebot …) werden nicht alle am selben Tag freigegeben,
// sondern nacheinander: höchstens cfg.maxProTag je Tag, nicht an Höhepunkt-Tagen (Sieg, Kapitelwechsel), in der
// Reihenfolge cfg.reihenfolge. Nur IDs in der Reihenfolge werden getaktet; alles andere gilt sofort als freigegeben.
// Gespeichert wird je ID der Tag der Freigabe (spiel.freigaben, alle Geräte). Regeln als Daten: daten/freischaltung.js (FREIGABE).
// Altbestand: Stände vor Version 69 haben keine freigaben (null); was dann schon verdient ist, bekommt FREIGABE_ALT.

export const FREIGABE_ALT = '2000-01-01';
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const FREI_ID = /^[a-z0-9_-]{1,40}$/;

// Ergänzt 30.10.2026 (Freigabe-Stau bei kurzen Runden): pauseBei, eigenerMoment, maxWarteTage (siehe daten/freischaltung.js).
export const FREIGABE_STANDARD = Object.freeze({ maxProTag: 1, reihenfolge: [], nichtAmHoehepunkt: true, sperreBisFreigabe: true,
  pauseBei: ['sieg', 'levelup', 'story'], eigenerMoment: [], maxWarteTage: 0 });
const ART = /^[a-z0-9_-]{1,40}$/;
const tageZwischen = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);

// Lesbare Fehler der Konfiguration (wirft nie). bekannt: erlaubte IDs (optional, z. B. Tabs + Quellen).
// momentArten (optional): erlaubte Einblendungs-Arten für pauseBei (z. B. HOEHEPUNKTE aus logik/momente.js).
export function pruefeFreigabe(cfg, bekannt = null, momentArten = null) {
  if (!cfg || typeof cfg !== 'object') return ['Freigabe: keine Konfiguration'];
  const f = [];
  if (!Number.isInteger(cfg.maxProTag) || cfg.maxProTag < 0) f.push('maxProTag muss eine ganze Zahl ab 0 sein (0 = Taktung aus)');
  if (!Array.isArray(cfg.reihenfolge)) f.push('reihenfolge muss eine Liste sein');
  else {
    const doppelt = cfg.reihenfolge.filter((x, i, l) => l.indexOf(x) !== i);
    if (doppelt.length) f.push(`reihenfolge: doppelt ${[...new Set(doppelt)].join(', ')}`);
    cfg.reihenfolge.forEach(x => {
      if (typeof x !== 'string' || !FREI_ID.test(x)) f.push(`reihenfolge: ungültige ID ${JSON.stringify(x)}`);
      else if (Array.isArray(bekannt) && !bekannt.includes(x)) f.push(`reihenfolge: unbekannte ID „${x}“ (keine Quelle)`);
    });
  }
  for (const k of ['nichtAmHoehepunkt', 'sperreBisFreigabe']) if (cfg[k] !== undefined && typeof cfg[k] !== 'boolean') f.push(`${k} muss true oder false sein`);
  if (cfg.maxWarteTage !== undefined && (!Number.isInteger(cfg.maxWarteTage) || cfg.maxWarteTage < 0)) f.push('maxWarteTage muss eine ganze Zahl ab 0 sein (0 = aus)');
  if (cfg.pauseBei !== undefined) {
    if (!Array.isArray(cfg.pauseBei)) f.push('pauseBei muss eine Liste sein');
    else cfg.pauseBei.forEach(x => {
      if (typeof x !== 'string' || !ART.test(x)) f.push(`pauseBei: ungültige Art ${JSON.stringify(x)}`);
      else if (Array.isArray(momentArten) && !momentArten.includes(x)) f.push(`pauseBei: unbekannte Einblendung „${x}“`);
    });
  }
  if (cfg.eigenerMoment !== undefined) {
    if (!Array.isArray(cfg.eigenerMoment)) f.push('eigenerMoment muss eine Liste sein');
    else cfg.eigenerMoment.forEach(x => {
      if (Array.isArray(cfg.reihenfolge) && !cfg.reihenfolge.includes(x)) f.push(`eigenerMoment: „${x}“ steht nicht in der reihenfolge`);
    });
  }
  return f;
}

// Gültige Konfiguration: kaputte Felder fallen einzeln auf den Standard zurück.
export function freigabeKonfig(cfg) {
  const c = cfg && typeof cfg === 'object' ? cfg : {};
  const out = { ...FREIGABE_STANDARD };
  if (Number.isInteger(c.maxProTag) && c.maxProTag >= 0) out.maxProTag = c.maxProTag;
  if (Array.isArray(c.reihenfolge)) out.reihenfolge = [...new Set(c.reihenfolge.filter(x => typeof x === 'string' && FREI_ID.test(x)))];
  for (const k of ['nichtAmHoehepunkt', 'sperreBisFreigabe']) if (typeof c[k] === 'boolean') out[k] = c[k];
  if (Number.isInteger(c.maxWarteTage) && c.maxWarteTage >= 0) out.maxWarteTage = c.maxWarteTage;
  if (Array.isArray(c.pauseBei)) out.pauseBei = [...new Set(c.pauseBei.filter(x => typeof x === 'string' && ART.test(x)))];
  if (Array.isArray(c.eigenerMoment)) out.eigenerMoment = [...new Set(c.eigenerMoment.filter(x => out.reihenfolge.includes(x)))];
  return out;
}

// Gespeicherte Freigaben bereinigen: { id: 'JJJJ-MM-TT' }, Ungültiges weg, höchstens max Einträge. null/undefined → null (Altbestand).
export function bereinigeFreigaben(roh, max = 30) {
  if (roh === null || roh === undefined) return null;
  if (typeof roh !== 'object' || Array.isArray(roh)) return {};
  return Object.fromEntries(Object.entries(roh).filter(([id, t]) => FREI_ID.test(id) && TAG.test(String(t))).slice(0, max));
}

// Ist die ID freigegeben? Nicht getaktete IDs (nicht in der Reihenfolge) oder Taktung aus (maxProTag 0) → immer.
export function istFreigegeben(id, freigaben, cfgRoh) {
  const cfg = freigabeKonfig(cfgRoh);
  if (cfg.maxProTag === 0 || !cfg.reihenfolge.includes(id)) return true;
  return !!(freigaben && typeof freigaben === 'object' && TAG.test(String(freigaben[id])));
}

// Welche ID wird jetzt freigegeben? e: { verdient: [ids], freigaben, heute: 'JJJJ-MM-TT', hoehepunktHeute: bool, siegTage: [tags],
//   mitMoment: bool, wartetSeit: 'JJJJ-MM-TT' | null, frischerHoehepunkt: bool }.
// Ergänzt 30.10.2026 (Freigabe-Stau bei kurzen Runden):
// - hoehepunktHeute meint nur noch die Arten aus cfg.pauseBei (Sieg, Stufe, Story); der Kapitelwechsel ist ein Auftakt und
//   pausiert nicht. Die App gibt beim Öffnen frei, also vor dem Tages-Check des Tages.
// - mitMoment: in diesem Besuch kommt schon eine Einblendung (Kapitelwechsel) → IDs aus cfg.eigenerMoment (Weltenwahl,
//   selbst eine Einblendung) werden übersprungen; die nächste ruhige Freigabe („Neu für dich“-Karte) darf kommen.
// - wartetSeit: seit diesem Tag wartet etwas (Höhepunkt oder Besuch mit Einblendung). Nach cfg.maxWarteTage Tagen wird
//   trotzdem freigegeben, auch eine Sache aus eigenerMoment (sie folgt dann auf den Kapitelwechsel), aber nie im Besuch,
//   in dem der Höhepunkt gerade gezeigt wurde (frischerHoehepunkt). Grund 'wartezeit'.
// Ergebnis { id, grund }: id = freizugebende ID oder null; grund = 'frei' | 'wartezeit' | 'nichts' | 'tageslimit' |
//   'hoehepunkt' (wartet auf einen Tag ohne Höhepunkt) | 'moment' (wartet auf einen Besuch ohne Einblendung) | 'fehler'. Wirft nie.
export function naechsteFreigabe(e, cfgRoh) {
  const cfg = freigabeKonfig(cfgRoh);
  const heute = e && e.heute;
  if (!TAG.test(String(heute))) return { id: null, grund: 'fehler' };
  if (cfg.maxProTag === 0) return { id: null, grund: 'nichts' };
  const fr = e.freigaben && typeof e.freigaben === 'object' ? e.freigaben : {};
  const verdient = new Set(Array.isArray(e.verdient) ? e.verdient : []);
  const kandidaten = cfg.reihenfolge.filter(id => verdient.has(id) && !TAG.test(String(fr[id])));
  if (!kandidaten.length) return { id: null, grund: 'nichts' };
  if (Object.values(fr).filter(t => t === heute).length >= cfg.maxProTag) return { id: null, grund: 'tageslimit' };
  const seit = TAG.test(String(e.wartetSeit)) && e.wartetSeit <= heute ? tageZwischen(e.wartetSeit, heute) : 0;
  const lange = cfg.maxWarteTage > 0 && seit >= cfg.maxWarteTage && e.frischerHoehepunkt !== true;
  const siegHeute = Array.isArray(e.siegTage) && e.siegTage.includes(heute);
  const pause = cfg.nichtAmHoehepunkt && (e.hoehepunktHeute === true || siegHeute);
  if (pause && !lange) return { id: null, grund: 'hoehepunkt' };
  const ohne = new Set(e.mitMoment === true && !lange ? cfg.eigenerMoment : []);
  const offen = kandidaten.filter(id => !ohne.has(id));
  if (!offen.length) return { id: null, grund: 'moment' };
  const trotzdem = pause || (e.mitMoment === true && cfg.eigenerMoment.includes(offen[0]));
  return { id: offen[0], grund: trotzdem ? 'wartezeit' : 'frei' };
}

// Freigaben ergänzen (ohne das Original zu ändern). Schon freigegebene IDs behalten ihren Tag.
export function freigabeSetzen(freigaben, ids, tag) {
  if (!TAG.test(String(tag))) throw new Error('Ungültiger Tag');
  const neu = (Array.isArray(ids) ? ids : [ids]).filter(x => typeof x === 'string' && FREI_ID.test(x));
  const alt = bereinigeFreigaben(freigaben) || {};
  const out = { ...alt };
  for (const id of neu) if (!TAG.test(String(out[id]))) out[id] = tag;
  return bereinigeFreigaben(out);
}
