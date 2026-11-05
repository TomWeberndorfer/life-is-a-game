// Heldenmodi (04.11.2026): reine Funktionen ohne DOM und ohne Uhr. Regeln als Daten in daten/heldenmodi.js.
// Spielstand: spiel.modi = { heroId: [{ ab, modus }] }, je Held ein Verlauf (ältester zuerst, höchstens ein Wechsel je Tag).
// Ein Held ohne Eintrag hat den Standardmodus (Altbestand). Der Verlauf bleibt, damit die Runden jederzeit neu berechnet
// werden können: Pausentage (Erhalt, Ruhe) verlängern die Runde, ein „Ja“ an einem Pausentag zählt nicht für den Gegner
// (logik/kern.js runden). Siege, XP und Gegner bleiben beim Wechsel unverändert.
// Bewusst keine Abhängigkeit von logik/helden.js (helden.js importiert diese Datei).
import { HELDENMODI, MINDEST } from '../daten/heldenmodi.js';
import { TEILZIEL_ID, zaehltAntworten } from './teilziele.js'; // Mindestaufgabe: „Zählt auch für“ (teilziele.js hängt nur an daten/)

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9-]{1,40}$/;

export class ModusFehler extends Error {
  constructor(code, text, info = {}) { super(text); this.code = code; Object.assign(this, info); }
}

// Gültiger Kalendertag „YYYY-MM-DD“ (wie kern.ausTagKey, ohne Import: der 31.02. ist kein Tag).
export function istTag(k) {
  if (typeof k !== 'string' || !TAG.test(k)) return false;
  const [j, m, t] = k.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
}
// Tag ± n Tage (UTC, damit Zeitumstellungen nichts verschieben).
export function plusTage(k, n) {
  const [j, m, t] = k.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t + n));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Regeln prüfen (für Tests und Start): Liste lesbarer Fehler, leer = in Ordnung.
export function pruefeModiRegeln(opt = HELDENMODI) {
  const f = [];
  if (!opt || !Array.isArray(opt.modi) || !opt.modi.length) return ['HELDENMODI.modi fehlt'];
  if (new Set(opt.modi).size !== opt.modi.length) f.push('HELDENMODI.modi enthält Doppelte');
  if (!opt.modi.includes(opt.standard)) f.push('HELDENMODI.standard ist kein erlaubter Modus');
  if (!Array.isArray(opt.pausiert) || opt.pausiert.some(m => !opt.modi.includes(m))) f.push('HELDENMODI.pausiert enthält unbekannte Modi');
  else if (opt.pausiert.includes(opt.standard)) f.push('HELDENMODI.standard darf nicht pausiert sein');
  if (!Number.isInteger(opt.fokusMax) || opt.fokusMax < 1) f.push('HELDENMODI.fokusMax muss eine ganze Zahl ab 1 sein');
  if (!opt.modi.includes(opt.neuOhnePlatz) || opt.neuOhnePlatz === opt.standard) f.push('HELDENMODI.neuOhnePlatz muss ein anderer erlaubter Modus sein');
  for (const k of ['verlaufMax', 'pauseTageMax']) if (!Number.isInteger(opt[k]) || opt[k] < 1) f.push(`HELDENMODI.${k} muss eine ganze Zahl ab 1 sein`);
  return f;
}

// Verlauf normalisieren: gültige Einträge, nach Tag sortiert, je Tag der letzte, ohne Wiederholung desselben Modus
// (auch nicht des Standards am Anfang), höchstens verlaufMax (die ältesten fallen weg). Gleiche Eingabe → gleiche Ausgabe.
export function bereinigeVerlauf(roh, opt = HELDENMODI) {
  if (!Array.isArray(roh)) return [];
  const je = new Map();
  for (const e of roh) {
    if (!e || typeof e !== 'object' || !istTag(e.ab) || !opt.modi.includes(e.modus)) continue;
    je.set(e.ab, e.modus);
  }
  const aus = [];
  let vorher = opt.standard;
  for (const [ab, modus] of [...je.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (modus === vorher) continue;
    aus.push({ ab, modus });
    vorher = modus;
  }
  return aus.slice(-opt.verlaufMax);
}

// Ganzes Feld bereinigen. Fehlt es (Altbestand) → {}. Helden, die nicht mehr im Spielstand sind, fallen weg.
// heroIds: Set der vorhandenen Helden (ohne = alle gültigen IDs behalten).
export function bereinigeModi(roh, { heroIds = null, opt = HELDENMODI } = {}) {
  const aus = {};
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return aus;
  for (const [id, v] of Object.entries(roh)) {
    if (!ID.test(id) || (heroIds && !heroIds.has(id))) continue;
    const l = bereinigeVerlauf(v, opt);
    if (l.length) aus[id] = l;
  }
  return aus;
}

const heldIds = spiel => (spiel && Array.isArray(spiel.helden) ? spiel.helden.map(h => h && h.heroId).filter(Boolean) : []);
const verlaufVon = (spiel, heroId, opt) => bereinigeVerlauf(spiel && spiel.modi && spiel.modi[heroId], opt);

// Modus eines Helden an einem Tag (Eintrag mit dem letzten ab ≤ tag, sonst Standard).
export function modusAm(spiel, heroId, tag, opt = HELDENMODI) {
  let m = opt.standard;
  for (const e of verlaufVon(spiel, heroId, opt)) if (e.ab <= tag) m = e.modus;
  return m;
}
// Gewählter Modus (letzter Eintrag, auch wenn er erst morgen beginnt). Gilt für Grenzen und Anzeige der Auswahl.
export function modusGewaehlt(spiel, heroId, opt = HELDENMODI) {
  const l = verlaufVon(spiel, heroId, opt);
  return l.length ? l[l.length - 1].modus : opt.standard;
}
export const istPausiert = (modus, opt = HELDENMODI) => opt.pausiert.includes(modus);

// Helden im gewählten Fokus, in der Reihenfolge der Crew.
export function fokusHelden(spiel, opt = HELDENMODI) {
  return heldIds(spiel).filter(id => modusGewaehlt(spiel, id, opt) === opt.standard);
}
export const fokusFrei = (spiel, opt = HELDENMODI) => fokusHelden(spiel, opt).length < opt.fokusMax;
// Modus für einen neuen Helden: Standard, solange im Fokus Platz ist.
export const neuerHeldModus = (spiel, opt = HELDENMODI) => (fokusFrei(spiel, opt) ? opt.standard : opt.neuOhnePlatz);

// Pausen eines Helden als Zeiträume [{ von, bis }] (bis = null: dauert an). Grundlage für kern.runden (stand.pausen).
export function pausenVon(spiel, heroId, opt = HELDENMODI) {
  const l = verlaufVon(spiel, heroId, opt);
  const aus = [];
  l.forEach((e, i) => {
    if (!istPausiert(e.modus, opt)) return;
    const naechster = l[i + 1];
    aus.push({ von: e.ab, bis: naechster ? plusTage(naechster.ab, -1) : null });
  });
  return aus;
}

// Zeiträume → einzelne Tage zwischen von und bis (einschließlich), sortiert. Offene Pausen enden bei bis.
// Ungültiges wird übersprungen, höchstens max Tage (Sicherheitsnetz). Wirft nie.
export function pausenTage(zeitraeume, von, bis, max = HELDENMODI.pauseTageMax) {
  if (!Array.isArray(zeitraeume) || !istTag(von) || !istTag(bis) || von > bis) return [];
  const tage = new Set();
  for (const z of zeitraeume) {
    if (!z || !istTag(z.von) || (z.bis !== null && !istTag(z.bis))) continue;
    let t = z.von < von ? von : z.von;
    const ende = z.bis === null || z.bis > bis ? bis : z.bis;
    for (; t <= ende && tage.size < max; t = plusTage(t, 1)) tage.add(t);
  }
  return [...tage].sort();
}

// Modus setzen. Liefert { spiel, ab, geaendert } oder wirft ModusFehler (code: held, modus, tag, voll, letzter).
// - Ein heute schon gezähltes „Ja“ bleibt: Wer nach dem Treffer in eine Pause wechselt, pausiert erst ab morgen.
// - Zurück in den Fokus gilt sofort (heute zählt wieder).
// - Ein späterer, schon geplanter Wechsel wird ersetzt; derselbe Modus noch einmal ändert nichts.
// - voll: im Fokus ist kein Platz (info.fokus = Helden im Fokus, für die Tauschfrage).
// - letzter: der einzige Held im Fokus kann nicht pausieren (sonst gäbe es keine Heldentat mehr).
export function modusSetzen(spiel, heroId, modus, heuteK, opt = HELDENMODI, { ohneGrenzen = false } = {}) {
  if (!heldIds(spiel).includes(heroId)) throw new ModusFehler('held', 'Unbekannter Held.');
  if (!opt.modi.includes(modus)) throw new ModusFehler('modus', `Unbekannter Modus: ${modus}`);
  if (!istTag(heuteK)) throw new ModusFehler('tag', 'Ungültiger Tag.');
  const jetzt = modusGewaehlt(spiel, heroId, opt);
  if (jetzt === modus) return { spiel, ab: null, geaendert: false };
  const fokus = fokusHelden(spiel, opt);
  if (!ohneGrenzen && modus === opt.standard && fokus.length >= opt.fokusMax) throw new ModusFehler('voll', `Im Fokus ist kein Platz (höchstens ${opt.fokusMax}).`, { fokus });
  if (!ohneGrenzen && jetzt === opt.standard && fokus.length <= 1) throw new ModusFehler('letzter', 'Mindestens ein Held bleibt im Fokus.');
  const h = spiel.helden.find(x => x.heroId === heroId);
  const jaHeute = !!(h && h.tage && zaehltAntworten(h.quest).includes(h.tage[heuteK])); // Beständigkeit: auch „nein“
  const ab = istPausiert(modus, opt) && jaHeute ? plusTage(heuteK, 1) : heuteK;
  const alt = verlaufVon(spiel, heroId, opt).filter(e => e.ab < ab);
  const neu = bereinigeVerlauf([...alt, { ab, modus }], opt);
  const modi = { ...bereinigeModi(spiel.modi, { heroIds: new Set(heldIds(spiel)), opt }) };
  if (neu.length) modi[heroId] = neu; else delete modi[heroId];
  return { spiel: { ...spiel, modi }, ab, geaendert: true };
}

// Tauschen, wenn der Fokus voll ist: heroId kommt in den Fokus, tauschId wechselt in neuOhnePlatz (Erhalt).
export function modusTauschen(spiel, heroId, tauschId, heuteK, opt = HELDENMODI) {
  if (heroId === tauschId) throw new ModusFehler('held', 'Ein Held kann nicht mit sich selbst tauschen.');
  if (!heldIds(spiel).includes(heroId)) throw new ModusFehler('held', 'Unbekannter Held.');
  if (!fokusHelden(spiel, opt).includes(tauschId)) throw new ModusFehler('held', 'Dieser Held ist nicht im Fokus.');
  if (modusGewaehlt(spiel, heroId, opt) === opt.standard) throw new ModusFehler('modus', 'Dieser Held ist schon im Fokus.');
  // Erst Platz schaffen (ohne Regel „letzter“: gleich danach ist heroId im Fokus), dann heroId hineinholen.
  const zwischen = modusSetzen(spiel, tauschId, opt.neuOhnePlatz, heuteK, opt, { ohneGrenzen: true }).spiel;
  return modusSetzen(zwischen, heroId, opt.standard, heuteK, opt);
}

// Neuen Helden eintragen (nach dem Anlegen): ohne Platz im Fokus startet er in neuOhnePlatz. Liefert { spiel, modus }.
export function neuenHeldenEinordnen(spiel, heroId, heuteK, opt = HELDENMODI) {
  if (!heldIds(spiel).includes(heroId) || !istTag(heuteK)) return { spiel, modus: opt.standard };
  const ohne = { ...spiel, helden: spiel.helden.filter(h => h.heroId !== heroId) };
  const modus = neuerHeldModus(ohne, opt);
  const modi = { ...(spiel.modi || {}) };
  if (modus === opt.standard) delete modi[heroId];
  else modi[heroId] = [{ ab: heuteK, modus }];
  return { spiel: { ...spiel, modi }, modus };
}

// Beim Start der App: Ist der Held im Rampenlicht heute in einer Pause, rückt der erste Held ohne Pause nach.
// Liefert dessen ID oder null (nichts zu ändern). Wer den pausierten Helden bewusst wählt, sieht seine Rastkarte.
export function rampenlichtBeimStart(spiel, heuteK, opt = HELDENMODI) {
  const id = spiel && spiel.fokus;
  if (!id || !istTag(heuteK) || !istPausiert(modusAm(spiel, id, heuteK, opt), opt)) return null;
  return heldIds(spiel).find(x => !istPausiert(modusAm(spiel, x, heuteK, opt), opt)) || null;
}

// ---------- Mindestaufgabe im Erhalt (04.11.2026) ----------
// Hier nur das, was helden.js und kern.js brauchen (Bereinigen, XP-Tage, Zeitraum). Anlegen, Abhaken und Anzeige-Stand:
// logik/mindest.js. Regeln: MINDEST in daten/heldenmodi.js.

// Regeln prüfen: Liste lesbarer Fehler, leer = in Ordnung.
export function pruefeMindestRegeln(opt = MINDEST, modiOpt = HELDENMODI, xpKeys = null) {
  const f = [];
  if (!opt || !Array.isArray(opt.modi) || !opt.modi.length) return ['MINDEST.modi fehlt'];
  if (opt.modi.some(m => !modiOpt.modi.includes(m) || !modiOpt.pausiert.includes(m))) f.push('MINDEST.modi darf nur pausierte Modi enthalten');
  const z = opt.zeitraeume && typeof opt.zeitraeume === 'object' ? Object.entries(opt.zeitraeume) : [];
  if (!z.length) f.push('MINDEST.zeitraeume fehlt');
  for (const [id, r] of z) {
    const tage = Number.isInteger(r && r.tage) && r.tage >= 1, monate = Number.isInteger(r && r.monate) && r.monate >= 1;
    if (tage === monate) f.push(`MINDEST.zeitraeume.${id}: genau eins von tage oder monate (ganze Zahl ab 1)`);
    if (!Number.isInteger(r && r.max) || r.max < (opt.anzahlMin || 1)) f.push(`MINDEST.zeitraeume.${id}.max muss eine ganze Zahl ab anzahlMin sein`);
  }
  if (!(opt.zeitraeume && opt.zeitraeume[opt.standardZeitraum])) f.push('MINDEST.standardZeitraum ist kein Zeitraum');
  for (const k of ['anzahlMin', 'taetigkeitMax', 'hakenMax']) if (!Number.isInteger(opt[k]) || opt[k] < 1) f.push(`MINDEST.${k} muss eine ganze Zahl ab 1 sein`);
  if (xpKeys && !xpKeys.includes(opt.xp)) f.push(`MINDEST.xp: unbekannter XP-Schlüssel ${opt.xp}`);
  return f;
}

export const bereinigeTaetigkeit = (roh, opt = MINDEST) => (typeof roh === 'string' ? roh.replace(/\s+/g, ' ').trim().slice(0, opt.taetigkeitMax) : '');

// Aufgabe bereinigen: gültig → Objekt, sonst null. Die Anzahl wird auf die Grenze des Zeitraums geklemmt.
export function bereinigeAufgabe(roh, opt = MINDEST) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
  const taetigkeit = bereinigeTaetigkeit(roh.taetigkeit, opt);
  const r = opt.zeitraeume[roh.zeitraum];
  if (!taetigkeit || !r || !Number.isInteger(roh.anzahl)) return null;
  const anzahl = Math.min(r.max, Math.max(opt.anzahlMin, roh.anzahl));
  const zaehltFuer = typeof roh.zaehltFuer === 'string' && TEILZIEL_ID.test(roh.zaehltFuer) ? roh.zaehltFuer : null;
  return { taetigkeit, anzahl, zeitraum: roh.zeitraum, zaehltFuer };
}

// Ganzes Feld bereinigen. Fehlt es (Altbestand) → {}. Helden, die nicht mehr im Spielstand sind, fallen weg.
// Haken: { tag: { xp: bool, stuetze: bool } }, gültige Tage, die neuesten hakenMax. Leere Einträge fallen weg.
export function bereinigeMindest(roh, { heroIds = null, opt = MINDEST } = {}) {
  const aus = {};
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return aus;
  for (const [id, v] of Object.entries(roh)) {
    if (!ID.test(id) || (heroIds && !heroIds.has(id)) || !v || typeof v !== 'object') continue;
    const aufgabe = bereinigeAufgabe(v.aufgabe, opt);
    const haken = {};
    const tage = v.haken && typeof v.haken === 'object' && !Array.isArray(v.haken) ? Object.keys(v.haken).filter(istTag).sort().slice(-opt.hakenMax) : [];
    for (const t of tage) { const h = v.haken[t] || {}; haken[t] = { xp: h.xp === true, stuetze: h.stuetze === true }; }
    if (aufgabe || tage.length) aus[id] = { ...(aufgabe ? { aufgabe } : {}), haken };
  }
  return aus;
}

// Tage mit XP aus der Mindestaufgabe (für kern.auswertung über helden.ansicht: stand.mindestXp). Wirft nie.
export function mindestXpTage(spiel, heroId, opt = MINDEST) {
  const m = bereinigeMindest(spiel && spiel.mindest, { opt })[heroId];
  return m ? Object.keys(m.haken).filter(t => m.haken[t].xp) : [];
}

// Beginn der laufenden Erhalt-Phase (Tag des Wechsels) oder null, wenn der Held gerade nicht in einem MINDEST-Modus ist.
// Ein Wechsel, der erst morgen beginnt, zählt schon (die Phase startet dann morgen).
export function erhaltSeit(spiel, heroId, opt = MINDEST, modiOpt = HELDENMODI) {
  const l = verlaufVon(spiel, heroId, modiOpt);
  const e = l.length ? l[l.length - 1] : null;
  return e && opt.modi.includes(e.modus) ? e.ab : null;
}

// Kalendermonate dazu, Tag auf das Monatsende geklemmt (31.01. + 1 Monat = 28./29.02.).
export function plusMonate(k, n) {
  const [j, m, t] = k.split('-').map(Number);
  const ziel = new Date(Date.UTC(j, m - 1 + n, 1));
  const letzter = new Date(Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth() + 1, 0)).getUTCDate();
  ziel.setUTCDate(Math.min(t, letzter));
  return `${ziel.getUTCFullYear()}-${String(ziel.getUTCMonth() + 1).padStart(2, '0')}-${String(ziel.getUTCDate()).padStart(2, '0')}`;
}
const utc = k => { const [j, m, t] = k.split('-').map(Number); return Date.UTC(j, m - 1, t); };
const tageZwischen = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);

// Zeitraum, in dem tag liegt, gezählt ab seit: { nr (ab 1), von, bis }. null bei ungültiger Eingabe oder tag < seit.
export function periodeVon(seit, zeitraum, tag, opt = MINDEST) {
  const r = opt.zeitraeume[zeitraum];
  if (!r || !istTag(seit) || !istTag(tag) || tag < seit) return null;
  if (r.tage) {
    const i = Math.floor(tageZwischen(seit, tag) / r.tage);
    const von = plusTage(seit, i * r.tage);
    return { nr: i + 1, von, bis: plusTage(von, r.tage - 1) };
  }
  const [j0, m0] = seit.split('-').map(Number), [j1, m1] = tag.split('-').map(Number);
  let i = Math.floor(((j1 - j0) * 12 + (m1 - m0)) / r.monate);
  while (i > 0 && plusMonate(seit, i * r.monate) > tag) i--;
  while (plusMonate(seit, (i + 1) * r.monate) <= tag) i++;
  return { nr: i + 1, von: plusMonate(seit, i * r.monate), bis: plusTage(plusMonate(seit, (i + 1) * r.monate), -1) };
}
