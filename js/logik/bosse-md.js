// Bosse als Markdown (06.11.2026, Schritt „Bosse und Gestalten im Inhalts-Werkzeug“, Entscheidungen Abschnitt 31 und 44).
// Gegner (Name, Kurzname, Aura, Beschreibung, vorgeschlagene Gestalten) und die Ketten der Vorlagen (Gegner je Platz mit
// höchstens 3 Bedingungen) werden in bosse.md (Obsidian) gepflegt. Dieses Modul liest und schreibt nur das Format; ob
// Gegner, Auren, Vorlagen und Bedingungen passen, prüft pruefeTabelle in daten/vorlagen.js (eine Quelle für die Regeln).
// Das Werkzeug claude/werkzeuge/inhalte-uebernehmen.mjs (Typ „bosse“) verbindet beides und schreibt js/daten/bosse.js.
//
// Format (eine Datei darf beide Abschnitte oder nur einen enthalten; mehrere Dateien je Typ sind erlaubt):
//   # Gegner
//   ## <gegner-id> · <Name mit Artikel>             ID nie ändern (Bilder, Geschichten, Spielstände hängen daran)
//   <Beschreibung als Absatz>                       Pflicht („Er versucht, …“)
//   - kurz: <Kurzname>                              Pflicht (Arena, Sätze der Crew)
//   - aura: <effekt>                                optional (daten/aura.js)
//   - genus: m|f|n                                  optional, nur für Namen ohne Artikel („Gähnor, der Träge“)
//   - stärker: <wenn …>  · - schwächer: <wenn …>    Pflicht
//   ### Gestalten                                   optional: Vorschläge im Blatt „geschafft“, je „- <Gestalt>“
//   # Ketten
//   ## [[<vorlage-id>]]                             je Vorlage aus daten/vorlagen.js genau eine Kette
//   - [[<gegner-id>]] · <bedingung> · <bedingung>   ein Punkt je Platz, Reihenfolge = Kette; höchstens 3 Bedingungen
// Bedingung: <art> [<Zahl>] [ab <Zahl>], z. B. „gestalten 2“, „faehigkeiten 2“, „schwierigkeit 1 ab 7“, „wiedereinstieg“.
// Die bloße Zahl ist n (wie viele), „ab“ ist min (Mindest-Schwierigkeit). Art wie in daten/bedingungen.js (Umlaute erlaubt).
// Zeilen mit „>“ sind Notizen. Unbekannte Felder und Überschriften sind Fehler (meist Tippfehler). Wirft nie.

import { leseBloecke, teileFeld, ohneLink, ID } from './md-bloecke.js';

const TRENNER = ' · ';
const GENUS = new Set(['m', 'f', 'n']);
// Feld in der Datei → Schlüssel am Gegner (beide Schreibweisen der Umlaute)
const GEGNER_FELDER = { kurz: 'kurz', aura: 'aura', genus: 'genus', 'stärker': 'staerker', staerker: 'staerker', 'schwächer': 'schwaecher', schwaecher: 'schwaecher' };
const PFLICHT = [['kurz', 'kurz'], ['staerker', 'stärker'], ['schwaecher', 'schwächer']];
// Wörter vor einer Zahl in einer Bedingung → Parameter (die bloße Zahl ist n)
const PARAM_WORT = { ab: 'min', min: 'min', n: 'n' };
const ohneUmlaut = s => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const zeileVon = (b, nr) => `Zeile ${nr ?? b.zeile}`;

// „gestalten 2“ → { art: 'gestalten', n: 2 }; Fehler → String.
export function leseBedingung(text) {
  const t = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  if (!t.length) return 'leere Bedingung';
  const b = { art: ohneUmlaut(t[0]) };
  for (let i = 1; i < t.length; i++) {
    let k = 'n', w = t[i];
    if (!/^\d+$/.test(w)) {
      k = PARAM_WORT[ohneUmlaut(w)];
      w = t[i + 1];
      if (!k || w === undefined || !/^\d+$/.test(w)) return `„${text}“ nicht lesbar (Form: art [Zahl] [ab Zahl], z. B. „schwierigkeit 1 ab 7“)`;
      i++;
    }
    if (b[k] !== undefined) return `„${text}“: ${k === 'n' ? 'Anzahl' : `„${k}“`} doppelt`;
    b[k] = Number(w);
  }
  return b;
}

// { art, n, min } → „schwierigkeit 1 ab 7“ (n zuerst, min als „ab“, weitere als „<name> <zahl>“).
export function schreibeBedingung(b) {
  const teile = [b.art];
  if (b.n !== undefined) teile.push(String(b.n));
  if (b.min !== undefined) teile.push('ab', String(b.min));
  for (const [k, v] of Object.entries(b)) if (!['art', 'n', 'min'].includes(k)) teile.push(k, String(v));
  return teile.join(' ');
}

function leseGegner(block, daten, fehler, warnungen) {
  for (const a of block.absaetze) fehler.push(`${zeileVon(a)}: Text unter „# Gegner“ gehört unter „## <id> · <Name>“`);
  for (const p of block.punkte) fehler.push(`${zeileVon(p)}: Punkt unter „# Gegner“ gehört unter „## <id> · <Name>“`);
  for (const gb of block.kinder) {
    const [idRoh, ...rest] = gb.titel.split(TRENNER);
    const id = ohneLink(idRoh).id.trim();
    const name = rest.join(TRENNER).trim();
    if (!ID.test(id)) { fehler.push(`${zeileVon(gb)}: Gegner braucht eine ID aus Kleinbuchstaben, Ziffern und „-“ (war „${id}“)`); continue; }
    if (Object.prototype.hasOwnProperty.call(daten.gegner, id)) { fehler.push(`${zeileVon(gb)}: Gegner „${id}“ doppelt`); continue; }
    const wo = `Gegner ${id}`;
    if (!name) fehler.push(`${zeileVon(gb)}: ${wo}: Name fehlt („## ${id} · <Name mit Artikel>“)`);
    const g = { name };
    const text = gb.absaetze.map(a => a.text).join(' ').trim();
    if (!text) fehler.push(`${zeileVon(gb)}: ${wo}: Beschreibung fehlt (ein Absatz unter der Überschrift)`);
    const gesehen = new Set();
    for (const p of gb.punkte) {
      const f = teileFeld(p.text);
      const k = f && GEGNER_FELDER[f.feld];
      if (!k) { fehler.push(`${zeileVon(p)}: ${wo}: unbekanntes Feld „${f ? f.feld : p.text.slice(0, 30)}“ (erlaubt: kurz, aura, genus, stärker, schwächer)`); continue; }
      if (gesehen.has(k)) { fehler.push(`${zeileVon(p)}: ${wo}: Feld „${f.feld}“ doppelt`); continue; }
      gesehen.add(k);
      if (!f.wert) continue;
      if (k === 'genus' && !GENUS.has(f.wert)) { fehler.push(`${zeileVon(p)}: ${wo}: genus ist m, f oder n (war „${f.wert}“)`); continue; }
      g[k] = f.wert;
    }
    for (const [k, wort] of PFLICHT) if (!g[k]) fehler.push(`${zeileVon(gb)}: ${wo}: „- ${wort}: …“ fehlt`);
    g.text = text;
    for (const kb of gb.kinder) {
      if (ohneUmlaut(kb.titel).trim() !== 'gestalten') { fehler.push(`${zeileVon(kb)}: ${wo}: unbekannte Überschrift „### ${kb.titel}“ (erlaubt: Gestalten)`); continue; }
      if (g.gestalten) { fehler.push(`${zeileVon(kb)}: ${wo}: „### Gestalten“ doppelt`); continue; }
      for (const a of kb.absaetze) fehler.push(`${zeileVon(a)}: ${wo}: Gestalten als Punkte schreiben („- im Stau“)`);
      for (const tief of kb.kinder) fehler.push(`${zeileVon(tief)}: ${wo}: Überschrift zu tief`);
      g.gestalten = kb.punkte.map(p => p.text.trim()).filter(Boolean);
      if (!g.gestalten.length) { warnungen.push(`${zeileVon(kb)}: ${wo}: „### Gestalten“ ohne Gestalt`); delete g.gestalten; }
    }
    daten.gegner[id] = g;
  }
}

function leseKetten(block, daten, fehler) {
  for (const a of block.absaetze) fehler.push(`${zeileVon(a)}: Text unter „# Ketten“ gehört unter „## [[<vorlage>]]“`);
  for (const p of block.punkte) fehler.push(`${zeileVon(p)}: Punkt unter „# Ketten“ gehört unter „## [[<vorlage>]]“`);
  for (const kb of block.kinder) {
    const id = ohneLink(kb.titel).id.trim();
    if (!ID.test(id)) { fehler.push(`${zeileVon(kb)}: Kette braucht die ID einer Vorlage, z. B. „## [[gelassenheit-wut]]“ (war „${kb.titel}“)`); continue; }
    if (Object.prototype.hasOwnProperty.call(daten.ketten, id)) { fehler.push(`${zeileVon(kb)}: Kette „${id}“ doppelt`); continue; }
    const wo = `Kette ${id}`;
    for (const a of kb.absaetze) fehler.push(`${zeileVon(a)}: ${wo}: Text ohne „- [[gegner]]“; Hinweise als „> …“ schreiben`);
    for (const tief of kb.kinder) fehler.push(`${zeileVon(tief)}: ${wo}: Überschrift zu tief`);
    const kette = [], bedingungen = [];
    for (const p of kb.punkte) {
      const [gRoh, ...bRoh] = p.text.split(TRENNER);
      const g = ohneLink(gRoh).id.trim();
      if (!ID.test(g)) { fehler.push(`${zeileVon(p)}: ${wo}: Platz braucht einen Gegner, z. B. „- [[murrgrim]] · gestalten 2“`); continue; }
      const platz = [];
      for (const t of bRoh) {
        const b = leseBedingung(t);
        if (typeof b === 'string') fehler.push(`${zeileVon(p)}: ${wo}, Platz ${kette.length + 1}: ${b}`);
        else platz.push(b);
      }
      kette.push(g);
      bedingungen.push(platz);
    }
    if (!kette.length) { fehler.push(`${zeileVon(kb)}: ${wo}: kein Gegner`); continue; }
    daten.ketten[id] = bedingungen.some(x => x.length) ? { kette, bedingungen } : { kette };
  }
}

// ---------- Lesen ----------
// Ergebnis: { daten: { gegner: { id: {...} }, ketten: { vorlageId: { kette, bedingungen? } } }, abschnitte, fehler, warnungen }.
// abschnitte: welche der beiden „#“-Abschnitte die Datei hat. Wirft nie; bei Fehlern nicht übernehmen.
export function leseBosse(text) {
  const { wurzel, fehler } = leseBloecke(text);
  const warnungen = [];
  const daten = { gegner: {}, ketten: {} };
  const abschnitte = new Set();
  for (const a of wurzel.absaetze) fehler.push(`${zeileVon(a)}: Text vor „# Gegner“ bzw. „# Ketten“`);
  for (const p of wurzel.punkte) fehler.push(`${zeileVon(p)}: Zeile vor „# Gegner“ bzw. „# Ketten“`);
  for (const b of wurzel.kinder) {
    const art = ohneUmlaut(b.titel).trim();
    if (art !== 'gegner' && art !== 'ketten') { fehler.push(`${zeileVon(b)}: oberste Überschrift ist „# Gegner“ oder „# Ketten“ (war „# ${b.titel}“)`); continue; }
    if (abschnitte.has(art)) { fehler.push(`${zeileVon(b)}: „# ${b.titel}“ doppelt`); continue; }
    abschnitte.add(art);
    if (art === 'gegner') leseGegner(b, daten, fehler, warnungen); else leseKetten(b, daten, fehler);
  }
  if (!fehler.length && !abschnitte.size) fehler.push('Weder „# Gegner“ noch „# Ketten“ gefunden.');
  return { daten, abschnitte: [...abschnitte], fehler, warnungen };
}

// ---------- Vergleich mit dem bisherigen Stand ----------
// Laufende Quests übernehmen Kette und Bedingungen ihrer Vorlage beim Laden (helden.js ketteAuffrischen). Ein geänderter
// oder entfernter Platz trifft also Menschen, die schon dort kämpfen: Warnung. Angehängte Plätze und neue Gegner: Hinweis.
// Liefert { warnungen, hinweise }.
export function vergleicheBosse(alt, neu) {
  const warnungen = [], hinweise = [];
  const ag = (alt && alt.gegner) || {}, ng = (neu && neu.gegner) || {};
  const ak = (alt && alt.ketten) || {}, nk = (neu && neu.ketten) || {};
  for (const id of Object.keys(ag)) if (!ng[id]) warnungen.push(`Gegner „${id}“ fehlt jetzt (Geschichten, Reaktionen und Bilder mit dieser ID werden nicht mehr gezeigt)`);
  for (const id of Object.keys(ng)) if (!ag[id]) hinweise.push(`Neuer Gegner „${id}“`);
  // Vergleich unabhängig von der Reihenfolge der Felder ({ art, min, n } = { art, n, min })
  const sortiert = b => Object.fromEntries(Object.keys(b || {}).sort().map(k => [k, b[k]]));
  const platzText = (k, i) => JSON.stringify(((k.bedingungen && k.bedingungen[i]) || []).map(sortiert));
  for (const [v, a] of Object.entries(ak)) {
    const n = nk[v];
    if (!n) continue; // fehlende Kette meldet die Prüfung als Fehler
    a.kette.forEach((g, i) => {
      if (i >= n.kette.length) warnungen.push(`Kette ${v}, Platz ${i + 1} (${g}) entfernt (wer schon dort kämpft, hat diesen Gegner dann nicht mehr)`);
      else if (n.kette[i] !== g) warnungen.push(`Kette ${v}, Platz ${i + 1}: ${n.kette[i]} statt ${g} (wer dort kämpft, hat dann einen anderen Gegner)`);
      else if (platzText(a, i) !== platzText(n, i)) warnungen.push(`Kette ${v}, Platz ${i + 1} (${g}): Bedingungen geändert (gilt auch für laufende Quests auf diesem Platz)`);
    });
    if (n.kette.length > a.kette.length) hinweise.push(`Kette ${v}: ${n.kette.length - a.kette.length} Platz/Plätze angehängt (${n.kette.slice(a.kette.length).join(', ')})`);
  }
  return { warnungen, hinweise };
}

// ---------- Schreiben ----------
// Daten → Markdown (Vorlage-Datei und Rundweg-Test). notiz(vorlageId) → Text für eine Notiz unter der Kette (nur zum Lesen).
export function schreibeBosse(daten, { kopf: kopfText = '', notiz = null } = {}) {
  const z = [];
  if (kopfText) z.push(kopfText.trim(), '');
  const gegner = (daten && daten.gegner) || {};
  const ketten = (daten && daten.ketten) || {};
  if (Object.keys(gegner).length) {
    z.push('# Gegner', '');
    for (const [id, g] of Object.entries(gegner)) {
      z.push(`## ${id}${TRENNER}${g.name || ''}`, g.text || '');
      z.push(`- kurz: ${g.kurz || ''}`.trimEnd());
      if (g.aura) z.push(`- aura: ${g.aura}`);
      if (g.genus) z.push(`- genus: ${g.genus}`);
      z.push(`- stärker: ${g.staerker || ''}`.trimEnd(), `- schwächer: ${g.schwaecher || ''}`.trimEnd(), '');
      if (g.gestalten && g.gestalten.length) z.push('### Gestalten', ...g.gestalten.map(x => `- ${x}`), '');
    }
  }
  if (Object.keys(ketten).length) {
    z.push('# Ketten', '');
    for (const [v, k] of Object.entries(ketten)) {
      z.push(`## [[${v}]]`);
      const n = notiz ? notiz(v) : '';
      if (n) z.push(`> ${n}`);
      k.kette.forEach((g, i) => {
        const b = (k.bedingungen && k.bedingungen[i]) || [];
        z.push(`- [[${g}]]${b.map(x => TRENNER + schreibeBedingung(x)).join('')}`);
      });
      z.push('');
    }
  }
  return z.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');
}

// Daten → JavaScript-Modul js/daten/bosse.js (erzeugt, nicht von Hand ändern).
export function schreibeModul(daten, { quelle = 'claude/bosse.md', stand = '' } = {}) {
  return [
    `// ERZEUGT aus ${quelle}${stand ? ` (${stand})` : ''} mit claude/werkzeuge/inhalte-uebernehmen.mjs – nicht von Hand ändern.`,
    '// Gegner und Ketten ändern: in der Markdown-Datei (Format: js/logik/bosse-md.js), dann „Inhalte übernehmen“.',
    '// Regeln (Vorlagen, Auren, Bedingungen): pruefeTabelle in js/daten/vorlagen.js.',
    '',
    '// Gegner: id → { name, kurz, aura?, genus?, text, staerker, schwaecher, gestalten? (Vorschläge im Blatt „geschafft“) }',
    `export const GEGNER = ${JSON.stringify((daten && daten.gegner) || {}, null, 2)};`,
    '',
    '// Ketten: vorlage-id → { kette: [gegner-id …], bedingungen?: [[{ art, n?, min? }] je Platz] } (daten/bedingungen.js)',
    `export const KETTEN = ${JSON.stringify((daten && daten.ketten) || {}, null, 2)};`,
    ''
  ].join('\n');
}
