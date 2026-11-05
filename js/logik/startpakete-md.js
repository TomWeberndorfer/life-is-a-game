// Startpakete als Markdown (02.11.2026, Chat „v113 – Helden – Wege und Ziele aus Markdown“): Wege (Quest der Vorlage)
// und Ziele (Ziel-Quest, Messziele, Stützen, Ideen) für bestehende Helden werden in claude/startpakete.md (Obsidian)
// gepflegt. Dieses Modul liest und schreibt nur das Format; ob Vorlagen, Ziel-Vorlagen, Kategorien und Werte passen,
// prüft logik/startpaket.js (pruefePaket), damit es nur eine Quelle für die Regeln gibt. Das Werkzeug
// claude/werkzeuge/inhalte-uebernehmen.mjs (Typ „startpakete“) verbindet beides und schreibt js/daten/startpakete.js.
//
// Format (eine Datei darf mehrere Pakete enthalten; jede Erweiterung kann ihre eigene Datei haben):
//   # Paket <paket-id> · <Name>                   ID nie ändern; Name erscheint in der App
//   <Beschreibung als Absatz>                     Pflicht (steht in den Einstellungen)
//   ## Held [[<vorlage-id>]]                      Vorlage aus daten/vorlagen.js (bestimmt Held, Gegner, Fähigkeit)
//   - ziel: <Text der Quest>                      optional, sonst der Vorlagentext
//   - warum: <eigener Grund>                      optional
//   - versatz: <Tage>                             optional, 0 oder 1 (Beginn der ersten Runde nach heute)
//   - notiz: <Hinweis nach dem Anlegen>           optional
//   ### Zielquest [[<ziel-vorlage-id>]]           optional, höchstens eine; aus daten/zielvorlagen.js
//   - ziel: <Zahl> · - start: <Zahl> · - bis: <Datum>
//   ### Messziel <Name>                           beliebig viele, Name je Held eindeutig
//   - einheit: cm · - richtung: hoch|runter · - ziel: <Zahl> · - start: <Zahl>
//   ### Stütze <Name>                             beliebig viele (kommt erst ab genug Siegen, siehe TEILZIELE)
//   - anzahl: <Zahl> · - zeitraum: runde|gesamt
//   ### Ideen                                     höchstens einmal je Held
//   - <kategorie>: <Text>                         Kategorien wie im Ideenglas (daten/notfall.js)
// Leerer Wert („- start:“) gilt als nicht angegeben. Zahlen mit Komma oder Punkt, Datum 2027-06-30 oder 30.06.2027.
// Zeilen mit „>“ sind Notizen. Unbekannte Felder und Überschriften sind Fehler (meist Tippfehler).

import { leseBloecke, teileFeld, ohneLink, alsZahl, alsDatum, zahlText, ID } from './md-bloecke.js';

const TRENNER = ' · ';
// Felder je Block: Name in der Datei → [Schlüssel im Paket, Art]
const FELDER = {
  held: { ziel: ['ziel', 'text'], warum: ['warum', 'text'], versatz: ['versatzTage', 'ganz'], notiz: ['notiz', 'text'] },
  zielquest: { ziel: ['ziel', 'zahl'], start: ['start', 'zahl'], bis: ['bis', 'datum'] },
  messziel: { einheit: ['einheit', 'text'], richtung: ['richtung', 'text'], ziel: ['ziel', 'zahl'], start: ['start', 'zahl'] },
  stuetze: { anzahl: ['anzahl', 'ganz'], zeitraum: ['zeitraum', 'text'] }
};
const ART = { paket: 'paket', held: 'held', zielquest: 'zielquest', messziel: 'messziel', stuetze: 'stuetze', 'stütze': 'stuetze', ideen: 'ideen' };

// Überschrift „Art Rest“ → { art, rest }; art klein und ohne Umlaut-Varianten.
function kopf(titel) {
  const m = /^(\S+)(?:\s+(.*))?$/.exec(String(titel).trim());
  return { art: ART[(m ? m[1] : '').toLowerCase()] || null, wort: m ? m[1] : '', rest: m && m[2] ? m[2].trim() : '' };
}

// Punkte eines Blocks als Felder lesen. ziel: Objekt, in das geschrieben wird.
function felder(block, regeln, ziel, wo, fehler) {
  const gesehen = new Set();
  for (const p of block.punkte) {
    const f = teileFeld(p.text);
    if (!f) { fehler.push(`Zeile ${p.zeile}: ${wo} braucht „- feld: wert“ (war „${p.text.slice(0, 40)}“)`); continue; }
    const r = regeln[f.feld];
    if (!r) { fehler.push(`Zeile ${p.zeile}: ${wo}: unbekanntes Feld „${f.feld}“ (erlaubt: ${Object.keys(regeln).join(', ')})`); continue; }
    if (gesehen.has(f.feld)) { fehler.push(`Zeile ${p.zeile}: ${wo}: Feld „${f.feld}“ doppelt`); continue; }
    gesehen.add(f.feld);
    const [schluessel, art] = r;
    if (!f.wert) continue; // leer = nicht angegeben
    if (art === 'text') ziel[schluessel] = f.wert;
    else if (art === 'datum') {
      const d = alsDatum(f.wert);
      if (d === undefined) fehler.push(`Zeile ${p.zeile}: ${wo}: „${f.feld}“ ist kein Datum (2027-06-30 oder 30.06.2027)`);
      else ziel[schluessel] = d;
    } else {
      const z = alsZahl(f.wert);
      if (Number.isNaN(z)) fehler.push(`Zeile ${p.zeile}: ${wo}: „${f.feld}“ ist keine Zahl (war „${f.wert}“)`);
      else if (art === 'ganz' && !Number.isInteger(z)) fehler.push(`Zeile ${p.zeile}: ${wo}: „${f.feld}“ muss eine ganze Zahl sein`);
      else ziel[schluessel] = z;
    }
  }
}

const keinText = (block, wo, fehler) => {
  for (const a of block.absaetze) fehler.push(`Zeile ${a.zeile}: ${wo}: Text ohne „- feld: wert“ („${a.text.slice(0, 40)}“); Hinweise als „> …“ schreiben`);
};

// ---------- Lesen ----------
// Ergebnis: { daten: { <paket-id>: { name, text, helden: [...] } }, fehler, warnungen }. Wirft nie.
// Bei Fehlern sind die Daten unvollständig und dürfen nicht übernommen werden.
export function leseStartpakete(text) {
  const { wurzel, fehler } = leseBloecke(text);
  const warnungen = [];
  const daten = {};
  for (const a of wurzel.absaetze) fehler.push(`Zeile ${a.zeile}: Text vor dem ersten Paket („# Paket <id> · <Name>“)`);
  for (const p of wurzel.punkte) fehler.push(`Zeile ${p.zeile}: Zeile vor dem ersten Paket`);

  for (const pb of wurzel.kinder) {
    const k = kopf(pb.titel);
    if (k.art !== 'paket') { fehler.push(`Zeile ${pb.zeile}: oberste Überschrift muss „# Paket <id> · <Name>“ sein (war „# ${pb.titel}“)`); continue; }
    const [idRoh, ...namenTeile] = k.rest.split(TRENNER);
    const id = (idRoh || '').trim();
    const name = namenTeile.join(TRENNER).trim();
    if (!ID.test(id)) { fehler.push(`Zeile ${pb.zeile}: Paket braucht eine ID aus Kleinbuchstaben, Ziffern und „-“ (war „${id}“)`); continue; }
    if (Object.prototype.hasOwnProperty.call(daten, id)) { fehler.push(`Zeile ${pb.zeile}: Paket „${id}“ doppelt`); continue; }
    if (!name) fehler.push(`Zeile ${pb.zeile}: Paket „${id}“: Name fehlt („# Paket ${id} · <Name>“)`);
    const beschreibung = pb.absaetze.map(a => a.text).join(' ').trim();
    if (!beschreibung) fehler.push(`Zeile ${pb.zeile}: Paket „${id}“: Beschreibung fehlt (ein Absatz unter der Überschrift)`);
    for (const p of pb.punkte) fehler.push(`Zeile ${p.zeile}: Paket „${id}“: Punkte gehören unter „## Held …“`);
    const paket = { name, text: beschreibung, helden: [] };
    daten[id] = paket;

    for (const hb of pb.kinder) {
      const hk = kopf(hb.titel);
      if (hk.art !== 'held') { fehler.push(`Zeile ${hb.zeile}: unter einem Paket nur „## Held [[<vorlage>]]“ (war „## ${hb.titel}“)`); continue; }
      const v = ohneLink(hk.rest).id;
      if (!ID.test(v)) { fehler.push(`Zeile ${hb.zeile}: Held braucht die ID einer Vorlage, z. B. „## Held [[gesundheit-bewegung]]“ (war „${hk.rest}“)`); continue; }
      const wo = `Held ${v}`;
      const e = { vorlage: v };
      felder(hb, FELDER.held, e, wo, fehler);
      keinText(hb, wo, fehler);
      for (const kb of hb.kinder) {
        const kk = kopf(kb.titel);
        const kwo = `${wo}, ${kk.wort} ${kk.rest}`.trim();
        if (kk.art === 'zielquest') {
          if (e.zielquest) { fehler.push(`Zeile ${kb.zeile}: ${wo}: höchstens eine Zielquest`); continue; }
          const zv = ohneLink(kk.rest).id;
          if (!ID.test(zv)) { fehler.push(`Zeile ${kb.zeile}: Zielquest braucht die ID einer Ziel-Vorlage, z. B. „### Zielquest [[ruecklage]]“`); continue; }
          const zq = { vorlage: zv };
          felder(kb, FELDER.zielquest, zq, kwo, fehler);
          if (zq.ziel === undefined) fehler.push(`Zeile ${kb.zeile}: ${kwo}: „- ziel: <Zahl>“ fehlt`);
          e.zielquest = zq;
        } else if (kk.art === 'messziel') {
          if (!kk.rest) { fehler.push(`Zeile ${kb.zeile}: ${wo}: Messziel braucht einen Namen („### Messziel <Name>“)`); continue; }
          const m = { name: kk.rest };
          felder(kb, FELDER.messziel, m, kwo, fehler);
          (e.messziele = e.messziele || []).push(m);
        } else if (kk.art === 'stuetze') {
          if (!kk.rest) { fehler.push(`Zeile ${kb.zeile}: ${wo}: Stütze braucht einen Namen („### Stütze <Name>“)`); continue; }
          const s = { name: kk.rest };
          felder(kb, FELDER.stuetze, s, kwo, fehler);
          (e.stuetzen = e.stuetzen || []).push(s);
        } else if (kk.art === 'ideen') {
          if (e.ideen) { fehler.push(`Zeile ${kb.zeile}: ${wo}: „### Ideen“ doppelt`); continue; }
          e.ideen = [];
          for (const p of kb.punkte) {
            const f = teileFeld(p.text);
            if (!f || !f.wert) { fehler.push(`Zeile ${p.zeile}: ${wo}: Idee braucht „- <kategorie>: <Text>“`); continue; }
            e.ideen.push([f.feld, f.wert]);
          }
          if (!e.ideen.length) warnungen.push(`Zeile ${kb.zeile}: ${wo}: „### Ideen“ ohne Idee`);
        } else { fehler.push(`Zeile ${kb.zeile}: ${wo}: unbekannte Überschrift „### ${kb.titel}“ (erlaubt: Zielquest, Messziel, Stütze, Ideen)`); continue; }
        keinText(kb, kwo, fehler);
        for (const tief of kb.kinder) fehler.push(`Zeile ${tief.zeile}: ${kwo}: Überschrift zu tief („${'#'.repeat(tief.ebene)} ${tief.titel}“)`);
      }
      paket.helden.push(e);
    }
    if (!paket.helden.length) warnungen.push(`Paket „${id}“: kein Held`);
  }
  if (!fehler.length && !Object.keys(daten).length) fehler.push('Kein Paket gefunden („# Paket <id> · <Name>“).');
  return { daten, fehler, warnungen };
}

// Vergleich mit dem bisherigen Stand: Verschwundenes ist meist ein Versehen.
export function vergleicheStartpakete(alt, neu) {
  const h = [];
  for (const [id, p] of Object.entries(alt || {})) {
    const n = (neu || {})[id];
    if (!n) { h.push(`Paket „${id}“ fehlt jetzt (Knopf verschwindet aus den Einstellungen)`); continue; }
    for (const e of p.helden || []) {
      const ne = (n.helden || []).find(x => x.vorlage === e.vorlage);
      if (!ne) { h.push(`Paket „${id}“: Held mit Vorlage „${e.vorlage}“ fehlt jetzt`); continue; }
      for (const m of e.messziele || []) if (!(ne.messziele || []).some(x => x.name === m.name)) h.push(`Paket „${id}“, ${e.vorlage}: Messziel „${m.name}“ fehlt jetzt`);
    }
  }
  for (const id of Object.keys(neu || {})) if (!(alt || {})[id]) h.push(`Neues Paket „${id}“`);
  return h;
}

// ---------- Schreiben ----------
// Pakete → Markdown (Vorlage-Datei und Rundweg-Test). heldName(vorlageId) → Name für eine Notiz (nur zum Lesen).
export function schreibeStartpakete(pakete, { kopf: kopfText = '', heldName = null } = {}) {
  const z = [];
  if (kopfText) z.push(kopfText.trim(), '');
  const feld = (k, v) => z.push(`- ${k}: ${v ?? ''}`.trimEnd());
  for (const [id, p] of Object.entries(pakete || {})) {
    z.push(`# Paket ${id}${TRENNER}${p.name || ''}`, '', p.text || '', '');
    for (const e of p.helden || []) {
      z.push(`## Held [[${e.vorlage}]]`);
      const n = heldName ? heldName(e.vorlage) : '';
      if (n) z.push(`> ${n}`);
      if (e.ziel !== undefined) feld('ziel', e.ziel);
      if (e.warum !== undefined) feld('warum', e.warum);
      if (e.versatzTage !== undefined) feld('versatz', zahlText(e.versatzTage));
      if (e.notiz !== undefined) feld('notiz', e.notiz);
      z.push('');
      if (e.zielquest) {
        z.push(`### Zielquest [[${e.zielquest.vorlage}]]`);
        feld('ziel', zahlText(e.zielquest.ziel));
        if (e.zielquest.start !== undefined) feld('start', zahlText(e.zielquest.start));
        if (e.zielquest.bis !== undefined) feld('bis', e.zielquest.bis);
        z.push('');
      }
      for (const m of e.messziele || []) {
        z.push(`### Messziel ${m.name}`);
        for (const k of ['einheit', 'richtung']) if (m[k] !== undefined) feld(k, m[k]);
        if (m.ziel !== undefined) feld('ziel', zahlText(m.ziel));
        feld('start', zahlText(m.start)); // leer lassen = erste Messung zählt (Platz zum Nachtragen)
        z.push('');
      }
      for (const s of e.stuetzen || []) {
        z.push(`### Stütze ${s.name}`);
        if (s.anzahl !== undefined) feld('anzahl', zahlText(s.anzahl));
        if (s.zeitraum !== undefined) feld('zeitraum', s.zeitraum);
        z.push('');
      }
      if (e.ideen) { z.push('### Ideen', ...e.ideen.map(([k, t]) => `- ${k}: ${t}`), ''); }
    }
  }
  return z.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
}

// Pakete → JavaScript-Modul js/daten/startpakete.js (erzeugt, nicht von Hand ändern).
// versatzMax: höchster erlaubter Versatz; wird vom bisherigen Modul übernommen (eine Stelle, logik/startpaket.js nutzt ihn).
export function schreibeModul(pakete, { quelle = 'claude/startpakete.md', stand = '', versatzMax = 1 } = {}) {
  const max = Number.isInteger(versatzMax) && versatzMax >= 0 ? versatzMax : 1;
  return [
    `// ERZEUGT aus ${quelle}${stand ? ` (${stand})` : ''} mit claude/werkzeuge/inhalte-uebernehmen.mjs – nicht von Hand ändern.`,
    '// Pakete ändern: in der Markdown-Datei (Format: js/logik/startpakete-md.js), dann „Inhalte übernehmen“.',
    '// Bedeutung der Felder und Regeln beim Anlegen: js/logik/startpaket.js.',
    '',
    `export const STARTPAKETE = ${JSON.stringify(pakete || {}, null, 2)};`,
    '',
    '// Höchster erlaubter Versatz (mehr würde „ab morgen“ falsch anzeigen und Tage vor dem Beginn zählen lassen).',
    `export const STARTPAKET_VERSATZ_MAX = ${max};`,
    ''
  ].join('\n');
}
