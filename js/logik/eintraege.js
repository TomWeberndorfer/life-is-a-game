// Einträge (Version 75): eigene Einträge des Spielers (geschafft, schwerer Tag), Modell in daten/eintrag-arten.js.
// Reine Funktionen ohne Zustand; ändern den Spielstand nie direkt, sondern liefern eine Kopie.
// Ein Eintrag ändert nie XP, Runden, Siege oder Gegnerkraft (Tonregel, Entscheidung 28.10.2026).
import { istBegegnungsId } from './bedingungen.js'; // Bosskette mit Bedingungen (06.11.2026)
import { BEDINGUNG_OPT } from '../daten/bedingungen.js';
import * as K from './kern.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^e-[a-z0-9-]{4,40}$/;
const HELD = /^[a-z0-9-]{1,40}$/;
const gueltigerTag = t => TAG.test(String(t)) && !!K.ausTagKey(t);
const kopie = x => JSON.parse(JSON.stringify(x));
const istSchwierigkeit = x => Number.isInteger(x) && x >= BEDINGUNG_OPT.schwierigkeit.min && x <= BEDINGUNG_OPT.schwierigkeit.max;

export class EintragFehler extends Error {}

// Obergrenze des Textes einer Art (Version 166): eigene Grenze der Art (Brief), sonst die allgemeine.
const textGrenze = (art, textMax) => (art && Number.isInteger(art.textMax) && art.textMax > 0 ? art.textMax : textMax);

// Neue ID: Zeit + Zufall, nur Kleinbuchstaben und Ziffern. zufall() für Tests austauschbar.
export function neueEintragId(jetzt = Date.now(), zufall = Math.random) {
  return `e-${Math.max(0, Math.floor(jetzt)).toString(36)}-${Math.floor(zufall() * 36 ** 6).toString(36).padStart(6, '0')}`;
}

// Freier Text: Zeilenumbrüche bleiben (es ist eine Notiz), \r und Steuerzeichen fallen weg, Ränder getrimmt.
export function bereinigeText(roh, max) {
  if (typeof roh !== 'string') return null;
  const t = roh.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, max).trim();
  return t || null;
}

// Prüft das Arten-Register beim Start. Liefert lesbare Fehler, wirft nie.
// texte: Textregister; logbuchArten: erlaubte Logbuch-Arten; stimmungen: Liste der Stufen.
export function pruefeEintragArten(arten, { texte = {}, logbuchArten = {}, stimmungen = [] } = {}) {
  const f = [];
  if (!arten || typeof arten !== 'object' || !Object.keys(arten).length) return ['Keine Eintrag-Arten festgelegt'];
  for (const [id, a] of Object.entries(arten)) {
    if (!a || typeof a !== 'object') { f.push(`Art ${id}: kein Objekt`); continue; }
    if (!a.ohneLogbuch && !(a.logbuch in logbuchArten)) f.push(`Art ${id}: Logbuch-Art ${a.logbuch} fehlt`); // Version 166: ohneLogbuch braucht keine
    if (typeof a.frage !== 'string' || !(a.frage in texte)) f.push(`Art ${id}: Text ${a.frage} fehlt`);
    for (const k of ['text', 'plan']) if (a[k] !== undefined && (typeof a[k] !== 'string' || !(a[k] in texte))) f.push(`Art ${id}: Text ${a[k]} fehlt`);
    if (a.jeTag !== undefined && !(Number.isInteger(a.jeTag) && a.jeTag >= 1)) f.push(`Art ${id}: jeTag muss eine ganze Zahl ab 1 sein`);
    // Rundenrückblick (02.11.2026): optionale Zusatzfelder
    if (a.wahlen !== undefined) {
      if (!Array.isArray(a.wahlen) || !a.wahlen.length || a.wahlen.some(w => typeof w !== 'string' || !w)) f.push(`Art ${id}: wahlen ist keine Liste`);
      else for (const w of a.wahlen) if (!(`rb.wahl.${w}` in texte)) f.push(`Art ${id}: Text rb.wahl.${w} fehlt`);
    }
    if (a.zustaende !== undefined && (!Array.isArray(a.zustaende) || a.zustaende.some(z => typeof z !== 'string' || !z))) f.push(`Art ${id}: zustaende ist keine Liste`);
    if (a.verweise !== undefined && !(Number.isInteger(a.verweise) && a.verweise >= 1 && a.verweise <= 20)) f.push(`Art ${id}: verweise muss eine ganze Zahl von 1 bis 20 sein`);
    // Plan-Check (Version 167): Fragen mit erlaubten Antworten; Texte 'antwort.<frage>.<wert>' und 'antwort.lb.<frage>.<wert>'
    if (a.antworten !== undefined) {
      if (!a.antworten || typeof a.antworten !== 'object' || Array.isArray(a.antworten) || !Object.keys(a.antworten).length) f.push(`Art ${id}: antworten ist keine Liste von Fragen`);
      else for (const [frage, werte] of Object.entries(a.antworten)) {
        if (!/^[a-z]+$/.test(frage) || !Array.isArray(werte) || !werte.length || werte.some(w => typeof w !== 'string' || !/^[a-z]+$/.test(w))) { f.push(`Art ${id}: antworten.${frage} ist ungültig`); continue; }
        for (const w of werte) for (const k of [`antwort.${frage}.${w}`, `antwort.lb.${frage}.${w}`]) if (!(k in texte)) f.push(`Art ${id}: Text ${k} fehlt`);
      }
    }
    // Tagesnotiz (04.11.2026): freie Textfelder mit Beschriftung 'notiz.feld.<name>'
    if (a.textFelder !== undefined) {
      if (!Array.isArray(a.textFelder) || !a.textFelder.length || a.textFelder.some(k => typeof k !== 'string' || !/^[a-z]+$/.test(k))) f.push(`Art ${id}: textFelder ist keine Liste`);
      else for (const k of a.textFelder) if (!(`notiz.feld.${k}` in texte)) f.push(`Art ${id}: Text notiz.feld.${k} fehlt`);
    }
    if (a.bereiche !== undefined && typeof a.bereiche !== 'boolean') f.push(`Art ${id}: bereiche muss true oder false sein`);
    // Version 166 (Brief und Beweisbuch): heldOptional, merkbar, ohneLogbuch (Wahrheitswerte), textMax und maxJeHeld (ganze Zahlen)
    for (const k of ['heldOptional', 'merkbar', 'ohneLogbuch']) if (a[k] !== undefined && typeof a[k] !== 'boolean') f.push(`Art ${id}: ${k} muss true oder false sein`);
    for (const k of ['textMax', 'maxJeHeld']) if (a[k] !== undefined && !(Number.isInteger(a[k]) && a[k] >= 1)) f.push(`Art ${id}: ${k} muss eine ganze Zahl ab 1 sein`);
    if (a.heldOptional && a.bereiche) f.push(`Art ${id}: heldOptional und bereiche schließen sich aus`);
    if (!Array.isArray(a.situationen)) { f.push(`Art ${id}: situationen ist keine Liste`); continue; }
    if (new Set(a.situationen).size !== a.situationen.length) f.push(`Art ${id}: Situation doppelt`);
    for (const s of a.situationen) if (!(`eintrag.sit.${s}` in texte)) f.push(`Art ${id}: Text eintrag.sit.${s} fehlt`);
  }
  for (const w of stimmungen) if (!(`eintrag.stimmung.${w}` in texte)) f.push(`Stimmung ${w}: Text fehlt`);
  return f;
}

// Zusatzfelder einer Art (Rundenrückblick, 02.11.2026): bezug (Tag), wahl (aus art.wahlen), verweise (Eintrags-IDs).
// Liefert nur die gültigen, gesetzten Felder; Arten ohne diese Angaben bekommen nie solche Felder.
function zusatzFelder(art, roh) {
  const z = {};
  if (art.bezug && gueltigerTag(roh.bezug)) z.bezug = roh.bezug;
  if (Array.isArray(art.wahlen) && art.wahlen.includes(roh.wahl)) z.wahl = roh.wahl;
  // Version 127: Zustand aus der Notfallkarte (fehlt = unbekannt, Altbestand braucht nichts)
  if (Array.isArray(art.zustaende) && art.zustaende.includes(roh.zustand)) z.zustand = roh.zustand;
  // Plan-Check (Version 167): nur bekannte Fragen mit erlaubter Antwort; keine gültige → das Feld fehlt
  if (art.antworten && roh.antworten && typeof roh.antworten === 'object' && !Array.isArray(roh.antworten)) {
    const a = {};
    for (const [frage, werte] of Object.entries(art.antworten)) if (Array.isArray(werte) && werte.includes(roh.antworten[frage])) a[frage] = roh.antworten[frage];
    if (Object.keys(a).length) z.antworten = a;
  }
  if (Number.isInteger(art.verweise) && Array.isArray(roh.verweise)) {
    const v = [...new Set(roh.verweise.filter(x => ID.test(String(x))))].slice(0, art.verweise);
    if (v.length) z.verweise = v;
  }
  // Begegnung (06.11.2026): Gestalt, Fähigkeit (IDs) und Schwierigkeit 0–10; fehlt = nicht angegeben
  if (art.begegnung) {
    if (istBegegnungsId(roh.gestalt)) z.gestalt = roh.gestalt;
    if (istBegegnungsId(roh.faehigkeit)) z.faehigkeit = roh.faehigkeit;
    if (istSchwierigkeit(roh.schwierigkeit)) z.schwierigkeit = roh.schwierigkeit;
  }
  return z;
}

// Tagesnotiz (04.11.2026): Lebensbereiche einer Art mit `bereiche` (bekannte IDs, ohne Doppelte, Reihenfolge bleibt).
// Unbekannte IDs fallen weg (verwaister Bezug → bleibt eine Notiz, notfalls für den ganzen Tag). Kein Array → [].
function bereicheListe(roh, bereichIds) {
  if (!Array.isArray(roh)) return [];
  const erlaubt = Array.isArray(bereichIds) ? new Set(bereichIds) : null;
  return [...new Set(roh.filter(x => typeof x === 'string' && HELD.test(x) && (!erlaubt || erlaubt.has(x))))];
}
// Freie Textfelder einer Art mit `textFelder`: nur gesetzte, bereinigte Texte; keins gesetzt → null.
function textFelderWerte(art, roh, max) {
  if (!Array.isArray(art.textFelder) || !roh || typeof roh !== 'object') return null;
  const aus = {};
  for (const k of art.textFelder) { const t = bereinigeText(roh[k], max); if (t) aus[k] = t; }
  return Object.keys(aus).length ? aus : null;
}
const gueltigeZeit = x => typeof x === 'string' && !Number.isNaN(Date.parse(x));

// Einen Eintrag (aus dem Speicher oder der Eingabe) prüfen. Pflicht: id, heroId, art, tag; Rest wird bereinigt
// (ungültig → null). Liefert den bereinigten Eintrag oder null, wenn ein Pflichtfeld fehlt.
// opt: { arten, stimmungen, textMax, planMax, heroIds (Set, optional), bereichIds (Liste, optional) }
// naechstesMal (Version 81) steht nur im Ergebnis, wenn die Art einen Plan kennt und er nicht leer ist.
// Arten mit `bereiche` (Tagesnotiz): heroId ist immer null, Pflicht sind dort nur id, art und tag; der Held-Abgleich
// (heroIds) entfällt, denn die Notiz hängt an Lebensbereichen, nicht an einem Helden.
export function bereinigeEintrag(roh, { arten, stimmungen, textMax, planMax = 300, heroIds = null, bereichIds = null }) {
  if (!roh || typeof roh !== 'object') return null;
  const art = arten[roh.art];
  if (!art || !ID.test(String(roh.id)) || !gueltigerTag(roh.tag)) return null;
  // Version 166: bei Arten mit `heldOptional` (Brief) ist ein fehlender oder unbekannter Held kein Fehler: der Eintrag gilt dann für alle
  const heldOk = HELD.test(String(roh.heroId)) && (!heroIds || heroIds.has(roh.heroId));
  if (!art.bereiche && !art.heldOptional && !heldOk) return null;
  textMax = textGrenze(art, textMax);
  const e = {
    id: roh.id,
    heroId: art.bereiche ? null : art.heldOptional ? (heldOk ? roh.heroId : null) : roh.heroId,
    art: roh.art,
    tag: roh.tag,
    gegner: typeof roh.gegner === 'string' && HELD.test(roh.gegner) ? roh.gegner : null,
    situation: art.situationen.includes(roh.situation) ? roh.situation : null,
    stimmung: stimmungen.includes(roh.stimmung) ? roh.stimmung : null,
    text: bereinigeText(roh.text, textMax),
    erstellt: typeof roh.erstellt === 'string' && !Number.isNaN(Date.parse(roh.erstellt)) ? roh.erstellt : null
  };
  const plan = art.plan ? bereinigeText(roh.naechstesMal, planMax) : null;
  if (plan) e.naechstesMal = plan;
  if (art.bereiche) e.bereiche = bereicheListe(roh.bereiche, bereichIds);
  const felder = textFelderWerte(art, roh.felder, textMax);
  if (felder) e.felder = felder;
  if (gueltigeZeit(roh.geaendert)) e.geaendert = roh.geaendert;
  // Version 166: Stern „Das will ich mir merken“, nur bei Arten mit `merkbar` und nur, wenn gesetzt (Altbestand ohne Feld = nicht markiert)
  if (art.merkbar && roh.merken === true) e.merken = true;
  return Object.assign(e, zusatzFelder(art, roh));
}

// Liste beim Laden: Ungültiges und doppelte IDs fallen weg, sortiert nach Tag und Erstellzeit, höchstens max.
// Fehlt die Liste (Stand vor Version 75), ist das Ergebnis [] (Altbestand verliert nichts).
export function bereinigeEintraege(roh, opt, warn = () => {}) {
  if (!Array.isArray(roh)) return [];
  const gesehen = new Set();
  const aus = [];
  let verworfen = 0;
  for (const x of roh) {
    const e = bereinigeEintrag(x, opt);
    if (!e || gesehen.has(e.id)) { verworfen++; continue; }
    gesehen.add(e.id);
    aus.push(e);
  }
  if (verworfen) warn(`Einträge: ${verworfen} ungültige übersprungen`);
  aus.sort(nachZeit);
  if (aus.length > opt.max) { warn(`Einträge: ${aus.length - opt.max} älteste entfernt (Obergrenze ${opt.max})`); return aus.slice(-opt.max); }
  return aus;
}
const nachZeit = (a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : String(a.erstellt || '') < String(b.erstellt || '') ? -1 : String(a.erstellt || '') > String(b.erstellt || '') ? 1 : a.id < b.id ? -1 : 1);

// Eingabe aus dem Blatt prüfen, ohne zu speichern. Liefert { ok, fehler, werte }.
// eingabe: { art, situation, stimmung, text, naechstesMal, bereiche, felder }
export function eintragPruefen(eingabe, { arten, stimmungen, textMax, planMax = 300, bereichIds = null }) {
  const fehler = {};
  const e = eingabe || {};
  const art = arten[e.art];
  textMax = textGrenze(art, textMax);
  if (!art) fehler.art = 'Unbekannte Art des Eintrags.';
  const situation = e.situation === null || e.situation === undefined || e.situation === '' ? null : e.situation;
  if (art && situation !== null && !art.situationen.includes(situation)) fehler.situation = 'Bitte eine Situation aus der Liste wählen.';
  const stimmung = e.stimmung === null || e.stimmung === undefined || e.stimmung === '' ? null : Number(e.stimmung);
  if (stimmung !== null && !stimmungen.includes(stimmung)) fehler.stimmung = 'Bitte eine Stimmung von 1 bis 5 wählen.';
  if (e.text !== null && e.text !== undefined && typeof e.text !== 'string') fehler.text = 'Ungültige Eingabe.';
  else if (typeof e.text === 'string' && e.text.trim().length > textMax) fehler.text = `Höchstens ${textMax} Zeichen.`;
  if (art && art.textPflicht && !fehler.text && !(typeof e.text === 'string' && e.text.trim())) fehler.text = 'Bitte schreib etwas auf.'; // Version 166: ein leerer Brief ist keiner
  // Version 81: Plan fürs nächste Mal, nur bei Arten mit `plan` (sonst wäre es ein stiller Datenverlust)
  const planRoh = e.naechstesMal;
  if (planRoh !== null && planRoh !== undefined && planRoh !== '') {
    if (typeof planRoh !== 'string') fehler.naechstesMal = 'Ungültige Eingabe.';
    else if (art && !art.plan && planRoh.trim()) fehler.naechstesMal = 'Diese Art hat keinen Plan fürs nächste Mal.';
    else if (planRoh.trim().length > planMax) fehler.naechstesMal = `Höchstens ${planMax} Zeichen.`;
  }
  // Rundenrückblick (02.11.2026): Zusatzfelder nur bei Arten, die sie kennen; Unbekanntes ist ein Fehler, kein stiller Verlust
  const leer = x => x === null || x === undefined || x === '';
  if (!leer(e.bezug) && !(art && art.bezug && gueltigerTag(e.bezug))) fehler.bezug = 'Ungültiger Bezug.';
  if (!leer(e.wahl) && !(art && Array.isArray(art.wahlen) && art.wahlen.includes(e.wahl))) fehler.wahl = 'Bitte eine Einschätzung aus der Liste wählen.';
  if (!leer(e.zustand) && !(art && Array.isArray(art.zustaende) && art.zustaende.includes(e.zustand))) fehler.zustand = 'Unbekannter Zustand.';
  // Plan-Check (Version 167): Antworten nur bei Arten mit `antworten`, jede aus der Liste ihrer Frage
  if (!leer(e.antworten)) {
    if (!art || !art.antworten || typeof e.antworten !== 'object' || Array.isArray(e.antworten)) fehler.antworten = 'Diese Art hat keine Antworten.';
    else for (const [frage, wert] of Object.entries(e.antworten)) {
      if (!Object.prototype.hasOwnProperty.call(art.antworten, frage) || !art.antworten[frage].includes(wert)) { fehler.antworten = 'Bitte eine Antwort aus der Liste wählen.'; break; }
    }
  }
  // Begegnung (06.11.2026): nur bei Arten mit `begegnung`; Unbekanntes ist ein Fehler, kein stiller Verlust
  for (const k of ['gestalt', 'faehigkeit']) {
    if (leer(e[k])) continue;
    if (!art || !art.begegnung) fehler[k] = 'Diese Art hält keine Begegnung fest.';
    else if (!istBegegnungsId(e[k])) fehler[k] = 'Ungültige Auswahl.';
  }
  if (!leer(e.schwierigkeit)) {
    if (!art || !art.begegnung) fehler.schwierigkeit = 'Diese Art hält keine Begegnung fest.';
    else if (!istSchwierigkeit(e.schwierigkeit)) fehler.schwierigkeit = `Bitte eine Zahl von ${BEDINGUNG_OPT.schwierigkeit.min} bis ${BEDINGUNG_OPT.schwierigkeit.max} wählen.`;
  }
  if (!leer(e.verweise)) {
    if (!art || !Number.isInteger(art.verweise) || !Array.isArray(e.verweise)) fehler.verweise = 'Ungültige Verweise.';
    else if (e.verweise.some(x => !ID.test(String(x)))) fehler.verweise = 'Ungültige Verweise.';
    else if (new Set(e.verweise).size > art.verweise) fehler.verweise = `Höchstens ${art.verweise} Notizen.`;
  }
  // Tagesnotiz (04.11.2026): Lebensbereiche und Textfelder nur bei Arten, die sie kennen
  if (!leer(e.bereiche)) {
    if (!art || !art.bereiche) fehler.bereiche = 'Diese Art gehört zu einem Helden, nicht zu Lebensbereichen.';
    else if (!Array.isArray(e.bereiche) || e.bereiche.some(x => typeof x !== 'string' || !HELD.test(x))) fehler.bereiche = 'Ungültige Lebensbereiche.';
    else if (Array.isArray(bereichIds) && e.bereiche.some(x => !bereichIds.includes(x))) fehler.bereiche = 'Unbekannter Lebensbereich.';
  }
  if (!leer(e.felder)) {
    if (!art || !Array.isArray(art.textFelder) || typeof e.felder !== 'object' || Array.isArray(e.felder)) fehler.felder = 'Ungültige Textfelder.';
    else for (const [k, v] of Object.entries(e.felder)) {
      if (!art.textFelder.includes(k)) { fehler.felder = `Unbekanntes Textfeld ${k}.`; break; }
      if (v !== null && v !== undefined && typeof v !== 'string') { fehler.felder = 'Ungültige Eingabe.'; break; }
      if (typeof v === 'string' && v.trim().length > textMax) { fehler.felder = `Höchstens ${textMax} Zeichen.`; break; }
    }
  }
  const werte = { art: e.art, situation, stimmung, text: bereinigeText(e.text, textMax) };
  const plan = art && art.plan ? bereinigeText(planRoh, planMax) : null;
  if (plan) werte.naechstesMal = plan;
  if (art && art.bereiche) werte.bereiche = fehler.bereiche ? [] : bereicheListe(e.bereiche, bereichIds);
  const felder = art && !fehler.felder ? textFelderWerte(art, e.felder, textMax) : null;
  if (felder) werte.felder = felder;
  if (art && !Object.keys(fehler).length) Object.assign(werte, zusatzFelder(art, e));
  return { ok: !Object.keys(fehler).length, fehler, werte };
}

// Neuen Eintrag anlegen. Wirft EintragFehler mit verständlicher Meldung (unbekannter Held, ungültige Eingabe,
// zu viele am Tag). opt: { arten, stimmungen, textMax, max, jeTag, gegner, id, erstellt, tag (Version 90, optional) }
// Tagesnotiz (04.11.2026): Arten mit `bereiche` bekommen heroId null (ein Held als Argument ist ein Fehler).
export function eintragHinzufuegen(spiel, heroId, eingabe, heute, opt) {
  const artReg = opt && opt.arten && eingabe ? opt.arten[eingabe.art] : null;
  if (artReg && artReg.bereiche) {
    if (!spiel || !Array.isArray(spiel.helden)) throw new EintragFehler('Kein Spielstand.');
    if (heroId !== null && heroId !== undefined) throw new EintragFehler('Diese Art gehört zu Lebensbereichen, nicht zu einem Helden.');
    heroId = null;
  } else if (artReg && artReg.heldOptional) {
    // Version 166 (Brief): mit Held (muss es geben) oder ohne (null/leer = gilt für alle)
    if (!spiel || !Array.isArray(spiel.helden)) throw new EintragFehler('Kein Spielstand.');
    if (heroId === undefined || heroId === '') heroId = null;
    if (heroId !== null && !spiel.helden.some(h => h.heroId === heroId)) throw new EintragFehler('Unbekannter Held.');
  } else if (!spiel || !Array.isArray(spiel.helden) || !spiel.helden.some(h => h.heroId === heroId)) throw new EintragFehler('Unbekannter Held.');
  const p = eintragPruefen(eingabe, opt);
  if (!p.ok) throw new EintragFehler(Object.values(p.fehler).join(' '));
  // Version 90: opt.tag = anderer Tag als heute (Ruhetag, vorab oder nachträglich); Grenzen prüft der Aufrufer
  if (opt.tag !== undefined && opt.tag !== null && !gueltigerTag(opt.tag)) throw new EintragFehler('Ungültiger Tag.');
  const tag = opt.tag || K.tagKey(heute);
  const liste = Array.isArray(spiel.eintraege) ? spiel.eintraege : [];
  const grenze = Number.isInteger(opt.arten[p.werte.art].jeTag) ? opt.arten[p.werte.art].jeTag : opt.jeTag; // Version 81: je Art
  if (liste.filter(x => x.heroId === heroId && x.tag === tag && x.art === p.werte.art).length >= grenze)
    throw new EintragFehler(`Für ${opt.tag ? 'diesen Tag' : 'heute'} sind schon ${grenze} solche Einträge da.`);
  // Version 166: Obergrenze je Held (Brief), damit der Spielstand nicht unbemerkt wächst
  const jeHeld = opt.arten[p.werte.art].maxJeHeld;
  if (Number.isInteger(jeHeld) && liste.filter(x => x.heroId === heroId && x.art === p.werte.art).length >= jeHeld)
    throw new EintragFehler(`Mehr als ${jeHeld} davon passen hier nicht. Lösch einen alten, dann ist wieder Platz.`);
  const eintrag = bereinigeEintrag({
    ...p.werte, heroId, tag,
    id: opt.id || neueEintragId(),
    gegner: opt.gegner || null,
    erstellt: opt.erstellt || new Date().toISOString()
  }, opt);
  if (!eintrag) throw new EintragFehler('Der Eintrag ließ sich nicht anlegen.');
  if (liste.some(x => x.id === eintrag.id)) throw new EintragFehler('Doppelte Eintrags-ID.');
  const s = kopie(spiel);
  s.eintraege = [...liste, eintrag].sort(nachZeit);
  if (s.eintraege.length > opt.max) s.eintraege = s.eintraege.slice(-opt.max);
  return { spiel: s, eintrag };
}

// Eintrag bearbeiten (Tagesnotiz, 04.11.2026; gilt für jede Art): neue Werte aus der Eingabe, fest bleiben id, heroId,
// art, tag, gegner und erstellt; `geaendert` = jetzt (opt.geaendert für Tests). Nicht übergebene Felder werden leer
// (die Eingabe ist der ganze neue Inhalt, wie im Blatt). Wirft EintragFehler (unbekannte ID, ungültige Eingabe).
export function eintragBearbeiten(spiel, id, eingabe, opt) {
  const liste = Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : [];
  const alt = liste.find(x => x.id === id);
  if (!alt) throw new EintragFehler('Eintrag nicht gefunden.');
  if (eingabe && eingabe.art !== undefined && eingabe.art !== alt.art) throw new EintragFehler('Die Art eines Eintrags lässt sich nicht ändern.');
  const p = eintragPruefen({ ...(eingabe || {}), art: alt.art }, opt);
  if (!p.ok) throw new EintragFehler(Object.values(p.fehler).join(' '));
  const geaendert = opt.geaendert || new Date().toISOString();
  const neu = bereinigeEintrag({ ...p.werte, id: alt.id, heroId: alt.heroId, art: alt.art, tag: alt.tag, gegner: alt.gegner, erstellt: alt.erstellt, geaendert }, opt);
  if (!neu) throw new EintragFehler('Der Eintrag ließ sich nicht ändern.');
  // Unveränderte Felder, die die Eingabe nicht kennt (z. B. bezug, verweise des Rundenrückblicks), bleiben erhalten
  for (const k of ['bezug', 'verweise', 'merken', 'antworten']) if (alt[k] !== undefined && neu[k] === undefined && (eingabe || {})[k] === undefined) neu[k] = kopie(alt[k]); // Version 166: auch der Stern bleibt
  const s = kopie(spiel);
  s.eintraege = liste.map(x => (x.id === id ? neu : kopie(x)));
  return { spiel: s, eintrag: neu };
}

// Eintrag löschen (unbekannte ID → Fehler, damit ein falscher Aufruf nicht still nichts tut).
export function eintragLoeschen(spiel, id) {
  const liste = Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : [];
  if (!liste.some(x => x.id === id)) throw new EintragFehler('Eintrag nicht gefunden.');
  return { ...kopie(spiel), eintraege: liste.filter(x => x.id !== id).map(kopie) };
}

// Stern „Das will ich mir merken“ (Version 166): setzt oder nimmt das Feld `merken` (an = true/false, ohne Angabe: umschalten).
// Nur bei Arten mit `merkbar`. Ändert nie `geaendert`, XP, Runden oder Zähler. Wirft EintragFehler (unbekannte ID, Art nicht merkbar).
export function eintragMerken(spiel, id, an, arten) {
  const liste = Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : [];
  const alt = liste.find(x => x && x.id === id);
  if (!alt) throw new EintragFehler('Eintrag nicht gefunden.');
  if (!arten || !arten[alt.art] || !arten[alt.art].merkbar) throw new EintragFehler('Diesen Eintrag kann man nicht markieren.');
  const neu = typeof an === 'boolean' ? an : alt.merken !== true;
  const s = kopie(spiel);
  s.eintraege = liste.map(x => {
    if (!x || x.id !== id) return kopie(x);
    const k = kopie(x);
    if (neu) k.merken = true; else delete k.merken;
    return k;
  });
  return { spiel: s, merken: neu };
}

// Einen Eintrag per ID (oder null). Wirft nie.
export function eintragVon(spiel, id) {
  return (Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : []).find(e => e && e.id === id) || null;
}

// Tagesnotizen eines Tages (Arten mit `bereiche`), älteste zuerst. Wirft nie.
export function notizenAm(spiel, tag, arten) {
  return (Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : [])
    .filter(e => e && e.tag === tag && arten && arten[e.art] && arten[e.art].bereiche);
}

// Einträge eines Helden (optional nur einer Art oder eines Tages), älteste zuerst.
export function eintraegeVon(spiel, heroId, { art = null, tag = null } = {}) {
  return (Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : [])
    .filter(e => e.heroId === heroId && (!art || e.art === art) && (!tag || e.tag === tag));
}

// Letzter Plan fürs nächste Mal eines Helden (Version 81, für die Morgenprobe): jüngster Eintrag mit `naechstesMal`
// an oder vor `bisTag`, höchstens `tage` Tage zurück (ältere Pläne sind meist überholt). Ergebnis { text, tag } oder null.
// Wirft nie: ungültige Eingaben → null.
export function letzterPlan(spiel, heroId, bisTag, tage = 30) {
  if (!gueltigerTag(bisTag) || !Number.isInteger(tage) || tage < 0) return null;
  const ab = K.tagKey(new Date(K.ausTagKey(bisTag).getTime() - tage * 86400000));
  const l = eintraegeVon(spiel, heroId).filter(e => typeof e.naechstesMal === 'string' && e.naechstesMal && gueltigerTag(e.tag) && e.tag <= bisTag && e.tag >= ab);
  if (!l.length) return null;
  const j = l.slice().sort(nachZeit).pop();
  return { text: j.naechstesMal, tag: j.tag };
}

// ---------- Morgenprobe ausführlich (Version 81) ----------
// „Könnte heute kommen“ je Held und Tag umschalten: fehlt der Probe-Eintrag, wird er angelegt, sonst entfernt.
// Liefert { spiel, an } (an = danach gesetzt). Wirft EintragFehler bei unbekanntem Held oder fehlender Art.
// Ändert nie XP, Runden oder Zähler (zaehler.rueckfaelle zählt nur „schwer“).
export function probeUmschalten(spiel, heroId, heute, opt) {
  if (!opt || !opt.arten || !opt.arten.probe) throw new EintragFehler('Die Art „probe“ fehlt.');
  const tag = K.tagKey(heute);
  const da = eintraegeVon(spiel, heroId, { art: 'probe', tag });
  if (da.length) {
    let s = spiel;
    for (const e of da) s = eintragLoeschen(s, e.id);
    return { spiel: s, an: false };
  }
  return { spiel: eintragHinzufuegen(spiel, heroId, { art: 'probe' }, heute, opt).spiel, an: true };
}

// Muster-Hinweis: Wie oft war es bei diesem Helden an diesem Wochentag schon schwer? Nur ab `min` (sonst null),
// damit ein Zufall nicht wie ein Muster aussieht. Gezählt werden Tage (zwei schwere Einträge am selben Tag = 1),
// nur vor heute. Ergebnis { wochentag (0 = Sonntag, wie Date.getDay), anzahl } oder null. Wirft nie.
export function musterHinweis(spiel, heroId, heuteK, min = 3) {
  const heute = gueltigerTag(heuteK) ? K.ausTagKey(heuteK) : null;
  if (!heute || !Number.isInteger(min) || min < 1) return null;
  const wt = heute.getDay();
  const tage = new Set(eintraegeVon(spiel, heroId, { art: 'schwer' })
    .filter(e => gueltigerTag(e.tag) && e.tag < heuteK && K.ausTagKey(e.tag).getDay() === wt).map(e => e.tag));
  return tage.size >= min ? { wochentag: wt, anzahl: tage.size } : null;
}
