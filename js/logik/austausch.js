// Datenaustausch ohne Datenbank (Version 24): Tester ohne Claude-Konto senden ihre Nutzungsdaten als Code,
// der Besitzer importiert ihn in der Auswertung. Reine Funktionen, im Browser und in Node lauffähig.
// Format: LIAG<version>.<base64(JSON)>.<prüfsumme>. Enthält nur, was die Datenbank auch bekäme (keine Questtexte).

export const CODE_VERSION = 1;
const PRAEFIX = `LIAG${CODE_VERSION}.`;
export const MAX_TAGE = 400;
export const MAX_ZEICHEN = 3_000_000;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z0-9_\-.~:@+]{1,80}$/;

export class CodeFehler extends Error {}

// FNV-1a, 32 Bit: erkennt abgeschnittene oder veränderte Codes (kein Schutz gegen Absicht).
export function pruefsumme(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

function zuBase64(text) {
  const b = new TextEncoder().encode(text);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

function ausBase64(b64) {
  const s = atob(b64);
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(b);
}

// profil = profilDokument(puffer), tage = { 'JJJJ-MM-TT': tagDokument(...) }. Bei mehr als MAX_TAGE gelten die neuesten.
export function exportCode(profil, tage, erstelltIso) {
  if (!profil || typeof profil.testerId !== 'string') throw new CodeFehler('Keine Nutzungsdaten vorhanden.');
  const auswahl = Object.keys(tage || {}).filter(t => TAG.test(t)).sort().slice(-MAX_TAGE);
  const daten = { f: 'liag-ana', v: CODE_VERSION, erstellt: erstelltIso, profil, tage: Object.fromEntries(auswahl.map(t => [t, tage[t]])) };
  const nutz = zuBase64(JSON.stringify(daten));
  return `${PRAEFIX}${nutz}.${pruefsumme(nutz)}`;
}

// Liefert { id, profil, tage, erstellt } oder wirft CodeFehler mit verständlicher Meldung.
export function leseCode(code) {
  const c = String(code || '').replace(/\s+/g, '');
  if (!c) throw new CodeFehler('Bitte einen Code einfügen.');
  if (c.length > MAX_ZEICHEN) throw new CodeFehler('Der Code ist zu lang.');
  const m = /^LIAG(\d+)\.([A-Za-z0-9+/=]+)\.([a-z0-9]+)$/.exec(c);
  if (!m) throw new CodeFehler('Das ist kein Daten-Code dieser App (er beginnt mit „LIAG“). Wurde er vollständig kopiert?');
  if (Number(m[1]) !== CODE_VERSION) throw new CodeFehler(`Code-Version ${m[1]} wird nicht unterstützt (erwartet ${CODE_VERSION}).`);
  if (pruefsumme(m[2]) !== m[3]) throw new CodeFehler('Der Code ist unvollständig oder verändert. Bitte neu kopieren.');
  let d;
  try { d = JSON.parse(ausBase64(m[2])); } catch (e) { throw new CodeFehler('Der Code lässt sich nicht lesen.'); }
  if (!d || d.f !== 'liag-ana' || !d.profil || typeof d.profil !== 'object') throw new CodeFehler('Der Code enthält keine Nutzungsdaten.');
  const id = String(d.profil.testerId || '');
  if (!ID.test(id)) throw new CodeFehler('Der Code enthält keine gültige Tester-Nummer.');
  const tage = {};
  for (const [t, x] of Object.entries(d.tage || {})) {
    if (!TAG.test(t) || !x || typeof x !== 'object' || !x.sessions || typeof x.sessions !== 'object') continue; // kaputte Tage überspringen
    tage[t] = { tag: t, sessions: x.sessions };
  }
  if (Object.keys(tage).length > MAX_TAGE) throw new CodeFehler('Der Code enthält zu viele Tage.');
  return { id, profil: d.profil, tage, erstellt: typeof d.erstellt === 'string' ? d.erstellt : null };
}

// Form wie beim Laden aus der Datenbank (Auswertung/kennzahlen.js).
export function alsTester(g) {
  const p = g.profil;
  return {
    id: g.id, profil: p.profil, istBesitzer: !!(p.merkmale && p.merkmale.ist_besitzer), erster: p.erster || null,
    merkmale: p.merkmale || {}, bewertungen: p.bewertungen || {}, feedback: p.feedback || null,
    tage: g.tage, zuletzt: p.zuletzt || g.erstellt || null, quelle: 'import'
  };
}

// Fügt einen Tester in die Liste ein. Gleiche ID: Tage werden zusammengeführt (neuer Code gewinnt je Tag),
// Profil ersetzt. Gibt eine neue Liste und ob ersetzt wurde zurück.
export function einfuegen(liste, tester) {
  const alt = (liste || []).find(t => t.id === tester.id);
  if (!alt) return { liste: [...(liste || []), tester], ersetzt: false };
  const neu = { ...tester, tage: { ...alt.tage, ...tester.tage } };
  return { liste: liste.map(t => (t.id === tester.id ? neu : t)), ersetzt: true };
}
