// Messziele (Version 76): reine Funktionen, liefern Kopien und werfen nur MesszielFehler mit verständlicher Meldung.
// Modell und Grenzen: daten/messziele.js. Ansicht: ansicht/messziele.js.

import { MESSZIEL_OPT, MESSZIEL_RICHTUNGEN, VERLAUF } from '../daten/messziele.js';

export class MesszielFehler extends Error {}

const ID = /^[a-z0-9-]{1,40}$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const kopie = x => JSON.parse(JSON.stringify(x));
const text = (roh, max) => (typeof roh === 'string' ? roh.replace(/\s+/g, ' ').trim().slice(0, max).trim() : '');

// ---------- Zahlen und Tage ----------

// Tag gültig? (Format und echtes Datum, z. B. kein 31.02.)
export function tagOk(t) {
  if (typeof t !== 'string' || !TAG.test(t)) return false;
  const [y, m, d] = t.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
const tagMs = t => { const [y, m, d] = t.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const tageZwischen = (von, bis) => Math.round((tagMs(bis) - tagMs(von)) / 864e5);
function tagPlusJahre(t, n) { const [y, m, d] = t.split('-').map(Number); return `${String(y + n).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

export const rund = (x, n = MESSZIEL_OPT.nachkomma) => { const f = 10 ** n; return Math.round(x * f) / f || 0; };

// Eingabe → Zahl. Versteht „32,3“, „32.3“, „15.000“, „15 000“, „1.234,5“, „-2“ und Zahlen.
// Liefert { leer: true } für leere Eingabe, { wert } für eine Zahl, sonst { falsch: true }.
export function zahlLesen(roh) {
  if (typeof roh === 'number') return Number.isFinite(roh) ? { wert: roh } : { falsch: true };
  if (roh === null || roh === undefined) return { leer: true };
  let s = String(roh).replace(/[\s  ']/g, '');
  if (!s) return { leer: true };
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // „15.000“ = fünfzehntausend
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(s)) return { falsch: true };
  const w = Number(s);
  return Number.isFinite(w) ? { wert: w } : { falsch: true };
}

// Zahl → deutscher Text: Tausenderpunkt, Komma, ohne überflüssige Nullen („32,3“, „15.000“).
export function zahlText(x, nachkomma = MESSZIEL_OPT.nachkomma) {
  if (typeof x !== 'number' || !Number.isFinite(x)) return '–';
  const r = rund(x, nachkomma);
  const [ganz, nach = ''] = Math.abs(r).toFixed(nachkomma).split('.');
  const gruppiert = ganz.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const n = nach.replace(/0+$/, '');
  return `${r < 0 ? '-' : ''}${gruppiert}${n ? ',' + n : ''}`;
}

// ---------- Prüfen ----------

// Formulareingabe prüfen. eingabe: { name, einheit, richtung, ziel, start, bis } (Texte aus den Feldern).
// heute: 'YYYY-MM-DD'. Liefert { ok, werte, fehler } (fehler je Feld, verständlich formuliert). Wirft nie.
export function zielPruefen(eingabe, heute, opt = MESSZIEL_OPT) {
  const e = eingabe && typeof eingabe === 'object' ? eingabe : {};
  const fehler = {};
  const name = text(e.name, opt.nameMax + 1);
  if (!name) fehler.name = 'Bitte gib dem Ziel einen Namen, z. B. „Bizeps rechts“.';
  else if (name.length > opt.nameMax) fehler.name = `Höchstens ${opt.nameMax} Zeichen.`;
  const einheit = text(e.einheit, opt.einheitMax + 1);
  if (einheit.length > opt.einheitMax) fehler.einheit = `Höchstens ${opt.einheitMax} Zeichen.`;
  const richtung = MESSZIEL_RICHTUNGEN.includes(e.richtung) ? e.richtung : null;
  if (!richtung) fehler.richtung = 'Bitte wähle, ob du mindestens oder höchstens diesen Wert erreichen willst.';
  const zahl = (roh, pflicht, feld) => {
    const z = zahlLesen(roh);
    if (z.leer) { if (pflicht) fehler[feld] = 'Bitte gib eine Zahl ein.'; return null; }
    if (z.falsch) { fehler[feld] = 'Das ist keine Zahl (Beispiel: 32,3).'; return null; }
    if (z.wert < opt.wertMin || z.wert > opt.wertMax) { fehler[feld] = 'Diese Zahl ist zu groß.'; return null; }
    return rund(z.wert, opt.nachkomma);
  };
  const ziel = zahl(e.ziel, true, 'ziel');
  const start = zahl(e.start, false, 'start');
  let bis = null;
  if (e.bis !== null && e.bis !== undefined && String(e.bis).trim() !== '') {
    const b = String(e.bis).trim();
    if (!tagOk(b)) fehler.bis = 'Bitte wähle ein gültiges Datum.';
    else if (tagOk(heute) && b > tagPlusJahre(heute, opt.bisMaxJahre)) fehler.bis = `Höchstens ${opt.bisMaxJahre} Jahre im Voraus.`;
    else bis = b;
  }
  const ok = Object.keys(fehler).length === 0;
  return { ok, fehler, werte: ok ? { name, einheit, richtung, ziel, start, bis } : null };
}

// ---------- Beim Laden ----------

// Ein gespeichertes Messziel bereinigen; ungültig → null.
function zielBereinigen(z, opt) {
  if (!z || typeof z !== 'object' || !ID.test(String(z.id))) return null;
  const name = text(z.name, opt.nameMax);
  if (!name || !MESSZIEL_RICHTUNGEN.includes(z.richtung)) return null;
  const zahlOk = x => typeof x === 'number' && Number.isFinite(x) && x >= opt.wertMin && x <= opt.wertMax;
  if (!zahlOk(z.ziel)) return null;
  const jeTag = new Map();
  for (const m of Array.isArray(z.messungen) ? z.messungen : []) {
    if (m && tagOk(m.tag) && zahlOk(m.wert)) jeTag.set(m.tag, rund(m.wert, opt.nachkomma)); // letzter Wert je Tag gewinnt
  }
  const messungen = [...jeTag.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([tag, wert]) => ({ tag, wert }));
  const aus = {
    id: z.id, name, einheit: text(z.einheit, opt.einheitMax), richtung: z.richtung, ziel: rund(z.ziel, opt.nachkomma),
    start: zahlOk(z.start) ? rund(z.start, opt.nachkomma) : null, bis: tagOk(z.bis) ? z.bis : null, messungen, erreicht: null
  };
  kuerzen(aus, opt);
  aus.erreicht = tagOk(z.erreicht) ? z.erreicht : erstesErreichen(aus);
  return aus;
}

// spiel.messziele beim Laden. Fehlt das Feld (Altbestand vor Version 76) → {} (es gab noch keine Messziele).
// Ziele eines Helden, der nicht mehr im Spielstand ist, fallen weg (wie bei Ideen und Einträgen).
export function bereinigeMessziele(roh, { heroIds, ...opt } = {}) {
  const o = { ...MESSZIEL_OPT, ...opt };
  const aus = {};
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return aus;
  for (const [hid, l] of Object.entries(roh)) {
    if ((heroIds && !heroIds.has(hid)) || !Array.isArray(l)) continue;
    const gesehen = new Set();
    const liste = l.map(z => zielBereinigen(z, o)).filter(z => z && !gesehen.has(z.id) && gesehen.add(z.id)).slice(0, o.maxJe);
    if (liste.length) aus[hid] = liste;
  }
  return aus;
}

// ---------- Ändern ----------

export const erfuellt = (z, wert) => (z.richtung === 'hoch' ? wert >= z.ziel : wert <= z.ziel);
const erstesErreichen = z => (z.messungen.find(m => erfuellt(z, m.wert)) || {}).tag || null;

// Zu viele Messungen: die ältesten fallen weg; war die erste der Startwert, bleibt er als fester Start erhalten.
function kuerzen(z, opt) {
  const zuviel = z.messungen.length - opt.maxMessungen;
  if (zuviel <= 0) return;
  if (z.start === null) z.start = z.messungen[0].wert;
  z.messungen = z.messungen.slice(zuviel);
}

export function messzieleVon(spiel, heroId) {
  const l = spiel && spiel.messziele && spiel.messziele[heroId];
  return Array.isArray(l) ? kopie(l) : [];
}

function heldPruefen(spiel, heroId) {
  if (!spiel || !Array.isArray(spiel.helden) || !spiel.helden.some(h => h.heroId === heroId)) throw new MesszielFehler('Unbekannter Held.');
}
function mitListe(spiel, heroId, liste) {
  const alle = { ...((spiel && spiel.messziele) || {}) };
  if (liste.length) alle[heroId] = liste; else delete alle[heroId];
  return { ...kopie(spiel), messziele: kopie(alle) };
}
function finde(liste, id) {
  const i = liste.findIndex(z => z.id === id);
  if (i < 0) throw new MesszielFehler('Dieses Messziel gibt es nicht mehr.');
  return i;
}
function werteOk(w, opt) {
  if (!w || typeof w !== 'object') throw new MesszielFehler('Keine Angaben zum Ziel.');
  const p = zielPruefen({ ...w, ziel: w.ziel, start: w.start ?? '' }, null, opt);
  if (!p.ok) throw new MesszielFehler(Object.values(p.fehler)[0]);
  return p.werte;
}
const doppelt = (liste, name, ausser = null) => liste.some(z => z.id !== ausser && z.name.toLowerCase() === name.toLowerCase());

// Neues Messziel. werte: Ergebnis von zielPruefen().werte. opt.id nur für Tests.
export function zielAnlegen(spiel, heroId, werte, opt = MESSZIEL_OPT) {
  heldPruefen(spiel, heroId);
  const w = werteOk(werte, opt);
  const liste = messzieleVon(spiel, heroId);
  if (liste.length >= opt.maxJe) throw new MesszielFehler(`Höchstens ${opt.maxJe} Messziele je Held.`);
  if (doppelt(liste, w.name)) throw new MesszielFehler('Ein Messziel mit diesem Namen gibt es schon.');
  const id = opt.id || `m-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  if (!ID.test(id) || liste.some(z => z.id === id)) throw new MesszielFehler('Ungültige Messziel-ID.');
  const ziel = { id, ...w, messungen: [], erreicht: null };
  return { spiel: mitListe(spiel, heroId, [...liste, ziel]), ziel };
}

// Name, Einheit, Richtung, Ziel, Start oder Stichtag ändern. Messungen bleiben; „erreicht“ wird neu bestimmt.
export function zielAendern(spiel, heroId, id, werte, opt = MESSZIEL_OPT) {
  heldPruefen(spiel, heroId);
  const w = werteOk(werte, opt);
  const liste = messzieleVon(spiel, heroId);
  const i = finde(liste, id);
  if (doppelt(liste, w.name, id)) throw new MesszielFehler('Ein Messziel mit diesem Namen gibt es schon.');
  const z = { ...liste[i], ...w };
  z.erreicht = erstesErreichen(z);
  liste[i] = z;
  return { spiel: mitListe(spiel, heroId, liste), ziel: z };
}

export function zielLoeschen(spiel, heroId, id) {
  heldPruefen(spiel, heroId);
  const liste = messzieleVon(spiel, heroId);
  finde(liste, id);
  return mitListe(spiel, heroId, liste.filter(z => z.id !== id));
}

// Messung eintragen. Gleicher Tag → ersetzt (Entscheidung 14). erreichtNeu: das Ziel ist mit dieser Messung zum
// ersten Mal erreicht (für den Erfolgsmoment).
export function messen(spiel, heroId, id, wertRoh, tag, opt = MESSZIEL_OPT) {
  heldPruefen(spiel, heroId);
  if (!tagOk(tag)) throw new MesszielFehler('Ungültiger Tag.');
  const z0 = zahlLesen(wertRoh);
  if (z0.leer) throw new MesszielFehler('Bitte gib einen Wert ein.');
  if (z0.falsch) throw new MesszielFehler('Das ist keine Zahl (Beispiel: 32,3).');
  if (z0.wert < opt.wertMin || z0.wert > opt.wertMax) throw new MesszielFehler('Diese Zahl ist zu groß.');
  const wert = rund(z0.wert, opt.nachkomma);
  const liste = messzieleVon(spiel, heroId);
  const i = finde(liste, id);
  const z = liste[i];
  const ersetzt = z.messungen.some(m => m.tag === tag);
  z.messungen = [...z.messungen.filter(m => m.tag !== tag), { tag, wert }].sort((a, b) => (a.tag < b.tag ? -1 : 1));
  kuerzen(z, opt);
  const vorher = z.erreicht;
  z.erreicht = vorher || erstesErreichen(z);
  const erreichtNeu = !vorher && !!z.erreicht;
  return { spiel: mitListe(spiel, heroId, liste), ziel: z, ersetzt, erreichtNeu };
}

// Messung eines Tages löschen (Tippfehler). „erreicht“ wird aus den übrigen Messungen neu bestimmt.
export function messungLoeschen(spiel, heroId, id, tag) {
  heldPruefen(spiel, heroId);
  const liste = messzieleVon(spiel, heroId);
  const i = finde(liste, id);
  const z = liste[i];
  if (!z.messungen.some(m => m.tag === tag)) throw new MesszielFehler('Diese Messung gibt es nicht mehr.');
  z.messungen = z.messungen.filter(m => m.tag !== tag);
  z.erreicht = erstesErreichen(z);
  return { spiel: mitListe(spiel, heroId, liste), ziel: z };
}

// ---------- Anzeigen ----------

// Stand eines Messziels für die Anzeige (neutral, Entscheidung 17).
//   start      fester Start oder erste Messung (null, wenn es beides nicht gibt)
//   aktuell    letzte Messung oder null
//   abstand    wie weit es bis zum Ziel noch ist (≥ 0), null ohne Wert
//   anteil     0–1 Weg vom Start zum Ziel; null, wenn Start fehlt oder Start = Ziel. Rückschritt hinter den Start = 0.
//   erreichtJetzt  der letzte Wert erfüllt das Ziel
//   tageBis    Tage bis zum Stichtag (negativ = vorbei) oder null
//   messenFaellig  noch nie gemessen oder seit rhythmusTage nicht mehr
export function fortschritt(z, heute, opt = MESSZIEL_OPT) {
  if (!z || !MESSZIEL_RICHTUNGEN.includes(z.richtung)) throw new MesszielFehler('Ungültiges Messziel.');
  const m = Array.isArray(z.messungen) ? z.messungen : [];
  const letzte = m.length ? m[m.length - 1] : null;
  const start = typeof z.start === 'number' ? z.start : m.length ? m[0].wert : null;
  const basis = letzte ? letzte.wert : start;
  const hoch = z.richtung === 'hoch';
  const abstand = basis === null ? null : rund(Math.max(0, hoch ? z.ziel - basis : basis - z.ziel), opt.nachkomma);
  let anteil = null;
  if (start !== null && basis !== null && start !== z.ziel) {
    const weg = hoch ? z.ziel - start : start - z.ziel;
    const geschafft = hoch ? basis - start : start - basis;
    anteil = weg > 0 ? Math.min(1, Math.max(0, geschafft / weg)) : 1; // Start lag schon jenseits des Ziels
  } else if (start !== null && start === z.ziel) anteil = 1;
  const heuteOk = tagOk(heute);
  return {
    start, aktuell: letzte ? letzte.wert : null, letzteTag: letzte ? letzte.tag : null,
    abstand, anteil, erreichtJetzt: basis !== null && erfuellt(z, basis), warErreicht: !!z.erreicht,
    tageBis: z.bis && heuteOk ? tageZwischen(heute, z.bis) : null,
    messenFaellig: !letzte || (heuteOk && tageZwischen(letzte.tag, heute) >= opt.rhythmusTage)
  };
}

// Punkte für das Verlaufsdiagramm (SVG-Koordinaten, y nach unten). Ohne Messung → null.
// x nach Datum verteilt (Abstände zwischen Messungen bleiben sichtbar), y-Bereich umfasst Messungen, Ziel und Start.
export function verlaufPunkte(z, cfg = VERLAUF) {
  const alle = z && Array.isArray(z.messungen) ? z.messungen : [];
  if (!alle.length) return null;
  const m = alle.slice(-cfg.punkteMax);
  const werte = [...m.map(x => x.wert), z.ziel, ...(typeof z.start === 'number' ? [z.start] : [])];
  let min = Math.min(...werte), max = Math.max(...werte);
  if (min === max) { min -= 1; max += 1; }
  const puffer = (max - min) * 0.1;
  min -= puffer; max += puffer;
  const { breite, hoehe, rand } = cfg;
  const t0 = tagMs(m[0].tag), t1 = tagMs(m[m.length - 1].tag);
  const x = t => (t1 === t0 ? breite / 2 : rand + (breite - 2 * rand) * (tagMs(t) - t0) / (t1 - t0));
  const y = w => rand + (hoehe - 2 * rand) * (max - w) / (max - min);
  const r1 = v => Math.round(v * 10) / 10;
  return { punkte: m.map(p => ({ x: r1(x(p.tag)), y: r1(y(p.wert)), tag: p.tag, wert: p.wert })), zielY: r1(y(z.ziel)), breite, hoehe };
}
