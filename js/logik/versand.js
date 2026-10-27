// Versand über Google-Formular und Rückweg aus der Google-Tabelle (Version 25). Reine Funktionen.
// Jede Sendung ist eine neue Zeile: testerId | art (profil/tag) | tag | stand | daten (JSON).
// Beim Einlesen gilt je Tester und Tag (bzw. Profil) der höchste Stand; Teile desselben Stands werden vereint.

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z0-9_\-.~:@+]{1,80}$/;
export const SPALTEN = ['testerId', 'art', 'tag', 'stand', 'daten'];

// Prüft die Konfiguration. Liefert eine Liste von Fehlern (leer = gültig).
export function pruefeVersand(cfg) {
  const f = [];
  if (!cfg || cfg.art === null || cfg.art === undefined) return f;
  if (cfg.art !== 'google-form') return [`Unbekannte Versandart: ${cfg.art}`];
  if (!/^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/formResponse$/.test(cfg.url || '')) f.push('Formular-Adresse muss auf …/formResponse enden.');
  for (const k of SPALTEN) if (!/^entry\.\d+$/.test((cfg.felder || {})[k] || '')) f.push(`Feld ${k} fehlt (entry.<Nummer>).`);
  if (!(cfg.maxZeichen > 1000)) f.push('maxZeichen ist zu klein.');
  return f;
}

// Zerlegt ein Dokument in Zeilen unter maxZeichen. Tage werden nach Sessions aufgeteilt.
// Rückgabe { zeilen: [{testerId, art, tag, stand, daten}], verworfen: n } (verworfen = einzelne Session zu groß).
export function zeilen(testerId, art, tag, stand, doc, maxZeichen) {
  const z = d => ({ testerId, art, tag: tag || '', stand: String(stand), daten: JSON.stringify(d) });
  const ganz = z(doc);
  if (ganz.daten.length <= maxZeichen) return { zeilen: [ganz], verworfen: 0 };
  if (art !== 'tag' || !doc.sessions) return { zeilen: [], verworfen: 1 };
  const out = []; let verworfen = 0; let teil = {};
  const passt = t => JSON.stringify({ tag: doc.tag, sessions: t }).length <= maxZeichen;
  for (const [sid, s] of Object.entries(doc.sessions)) {
    if (!passt({ [sid]: s })) { verworfen++; continue; }
    if (!passt({ ...teil, [sid]: s })) { out.push(z({ tag: doc.tag, sessions: teil })); teil = {}; }
    teil[sid] = s;
  }
  if (Object.keys(teil).length) out.push(z({ tag: doc.tag, sessions: teil }));
  return { zeilen: out, verworfen };
}

export function formularDaten(cfg, zeile) {
  const p = new URLSearchParams();
  for (const k of SPALTEN) p.append(cfg.felder[k], zeile[k]);
  return p.toString();
}

// CSV nach RFC 4180 (Anführungszeichen, Zeilenumbrüche in Zellen, "" als Escape). Erkennt , oder ;.
export function leseCsv(text) {
  const s = String(text || '').replace(/^﻿/, '');
  const ersteZeile = s.split(/\r?\n/, 1)[0] || '';
  const trenner = (ersteZeile.match(/;/g) || []).length > (ersteZeile.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = []; let feld = ''; let inQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { feld += '"'; i++; } else inQ = false; }
      else feld += c;
    } else if (c === '"') inQ = true;
    else if (c === trenner) { row.push(feld); feld = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(feld); rows.push(row); row = []; feld = '';
    } else feld += c;
  }
  if (feld !== '' || row.length) { row.push(feld); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ''));
}

// Tabelle → { tester: [{ id, profil, tage }], zeilen, fehler } ; profil = Profil-Dokument, tage = { tag: {tag, sessions} }.
export function ausTabelle(rows) {
  if (!rows.length) throw new Error('Die Datei ist leer.');
  const kopf = rows[0].map(h => h.trim());
  const idx = Object.fromEntries(SPALTEN.map(k => [k, kopf.indexOf(k)]));
  const fehlt = SPALTEN.filter(k => idx[k] < 0);
  if (fehlt.length) throw new Error(`Spalten fehlen: ${fehlt.join(', ')}. Ist das die Tabelle des Formulars?`);
  const je = new Map(); // testerId → { profil: {stand, doc}, tage: { tag: {stand, sessions} } }
  let fehler = 0;
  for (const r of rows.slice(1)) {
    const id = (r[idx.testerId] || '').trim(); const art = (r[idx.art] || '').trim(); const tag = (r[idx.tag] || '').trim();
    const stand = Number(r[idx.stand]);
    let d;
    try { d = JSON.parse(r[idx.daten] || ''); } catch (e) { d = null; }
    if (!ID.test(id) || !Number.isFinite(stand) || !d || typeof d !== 'object') { fehler++; continue; }
    if (!je.has(id)) je.set(id, { profil: null, tage: {} });
    const t = je.get(id);
    if (art === 'profil') {
      if (!t.profil || stand > t.profil.stand) t.profil = { stand, doc: d };
    } else if (art === 'tag' && TAG.test(tag) && d.sessions && typeof d.sessions === 'object') {
      const alt = t.tage[tag];
      if (!alt || stand > alt.stand) t.tage[tag] = { stand, sessions: { ...d.sessions } };
      else if (stand === alt.stand) Object.assign(alt.sessions, d.sessions); // Teile desselben Stands
    } else fehler++;
  }
  const tester = [];
  for (const [id, t] of je) {
    const tage = Object.fromEntries(Object.entries(t.tage).map(([k, v]) => [k, { tag: k, sessions: v.sessions }]));
    const profil = t.profil ? { ...t.profil.doc, testerId: id } : { testerId: id, profil: 'haupt', merkmale: {} };
    tester.push({ id, profil, tage, erstellt: null });
  }
  return { tester, zeilen: rows.length - 1, fehler };
}
