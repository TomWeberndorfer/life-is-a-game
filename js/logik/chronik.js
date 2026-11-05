// Chronik als Buch (Etappe 2, Schritt C, 02.11.2026): reine Ableitung aus den Logbuch-Einträgen (logik/logbuch.js),
// nichts gespeichert. Einstellungen und Aussehen: daten/chronik.js. Ansicht: ansicht/logbuch.js.
// Ergebnis: „Teile“ von neu nach alt. Je Tag zuerst die Tageskarte, darunter Trennzeilen (Neuer Anfang) und Zierseiten
// (Kapitel, Questbeginn), denn sie markieren den Anfang dieses Tages. Wer von oben liest, geht in der Zeit zurück.

import { passtZuBereichen } from './logbuch.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const listeOk = l => Array.isArray(l) && l.every(x => typeof x === 'string' && x);

// Prüft die Einstellungen. Liefert lesbare Warnungen (leer = in Ordnung), wirft nie.
// logbuchArten: Register aus daten/logbuch-arten.js; siegelAussehen: CHRONIK_SIEGEL; texte: Textregister.
export function pruefeChronik(cfg, { logbuchArten = {}, siegelAussehen = {}, texte = null } = {}) {
  const f = [];
  if (!cfg || typeof cfg !== 'object') return ['Chronik: keine Einstellungen'];
  if (!Array.isArray(cfg.siegel) || !cfg.siegel.length) f.push('Chronik: siegel fehlt');
  for (const k of ['notizArten', 'zusatzArten', 'markenArten', 'zierArten']) if (!listeOk(cfg[k])) f.push(`Chronik: ${k} ist keine Liste`);
  if (cfg.tagesArten !== undefined && !listeOk(cfg.tagesArten)) f.push('Chronik: tagesArten ist keine Liste'); // Tagesnotiz (04.11.2026)
  if (!Number.isInteger(cfg.tageJeSeite) || cfg.tageJeSeite < 1) f.push('Chronik: tageJeSeite fehlt');
  if (!listeOk(cfg.ansichten) || !cfg.ansichten.length) f.push('Chronik: ansichten fehlt');
  const siegelIds = [...(Array.isArray(cfg.siegel) ? cfg.siegel.map(s => s && s.siegel) : []), cfg.ohneSiegel];
  for (const s of siegelIds) {
    const a = siegelAussehen[s];
    if (!a) { f.push(`Chronik: Aussehen für Siegel „${s}“ fehlt`); continue; }
    if (texte && !(a.text in texte)) f.push(`Chronik: Text ${a.text} fehlt`);
  }
  // Jede Logbuch-Art in genau einer Rolle (Siegel-Arten dürfen zusätzlich Notiz-Arten sein)
  const rolle = {};
  const merke = (art, r) => { (rolle[art] = rolle[art] || []).push(r); };
  for (const s of Array.isArray(cfg.siegel) ? cfg.siegel : []) if (s && s.art) merke(s.art, 'siegel');
  for (const k of ['zusatzArten', 'markenArten', 'zierArten', 'tagesArten']) for (const a of listeOk(cfg[k]) ? cfg[k] : []) merke(a, k);
  for (const a of listeOk(cfg.notizArten) ? cfg.notizArten : []) if (!(rolle[a] || []).includes('siegel')) merke(a, 'notizArten');
  for (const [art, r] of Object.entries(rolle)) {
    if (!(art in logbuchArten)) f.push(`Chronik: unbekannte Logbuch-Art ${art}`);
    if (r.length > 1) f.push(`Chronik: Art ${art} steht mehrfach (${r.join(', ')})`);
  }
  for (const art of Object.keys(logbuchArten)) if (!rolle[art]) f.push(`Chronik: Logbuch-Art ${art} hat keinen Platz`);
  return f;
}

// eintraege: Ergebnis von logbuchEintraege(); filter: { held: 'alle' | heroId, tage: Zahl, bereiche: [ID…] };
// Tagesnotizen (04.11.2026, cfg.tagesArten): Einträge ohne Held stehen als `tagesnotizen` oben in der Tageskarte.
// Mit Held-Filter erscheinen sie nur, wenn sie seinen Lebensbereich nennen; `bereiche` filtert alles wie im Logbuch.
// optionen: { heute: 'JJJJ-MM-TT' (Tag ohne Einträge erscheint dann oben als „heute noch leer“), reihenfolge: [heroId…] }
// Rückgabe: { filter, korrigiert, teile, mehr, unbekannt }
//   teile: { art: 'heute', tag } · { art: 'tag', tag, tagesnotizen: [e], zeilen: [{ heroId, siegel, notizen: [e], zusatz: [e] }] } ·
//          { art: 'marke', tag, eintrag } · { art: 'zier', tag, eintrag }
//   unbekannt: Arten ohne Platz in den Einstellungen (übersprungen, zum Melden)
export function chronikAnsicht(eintraege, cfg, filter = {}, { heute = null, reihenfolge = [] } = {}) {
  if (!cfg || !Array.isArray(cfg.siegel)) throw new Error('chronikAnsicht: Einstellungen fehlen');
  const tagesArten = listeOk(cfg.tagesArten) ? cfg.tagesArten : [];
  const alle = (Array.isArray(eintraege) ? eintraege : []).filter(e => e && TAG.test(String(e.tag)) && (typeof e.heroId === 'string' || (e.heroId === null && tagesArten.includes(e.art))));
  const korrigiert = [];
  let held = filter.held || 'alle';
  if (held !== 'alle' && !alle.some(e => e.heroId === held)) { korrigiert.push('held'); held = 'alle'; }
  const bereiche = Array.isArray(filter.bereiche) ? filter.bereiche.filter(x => typeof x === 'string') : [];
  const heldBereich = held === 'alle' ? null : (alle.find(e => e.heroId === held && e.domainId) || {}).domainId || null;
  const n = Number.isInteger(filter.tage) && filter.tage > 0 ? filter.tage : cfg.tageJeSeite;

  const siegelArten = cfg.siegel.map(s => s.art);
  const rolle = art => (tagesArten.includes(art) ? 'tagesnotiz'
    : siegelArten.includes(art) || cfg.notizArten.includes(art) ? 'zeile'
    : cfg.zusatzArten.includes(art) ? 'zeile'
    : cfg.markenArten.includes(art) ? 'marke'
    : cfg.zierArten.includes(art) ? 'zier' : null);

  const unbekannt = new Set();
  const jeTag = new Map();
  for (const e of alle) {
    if (e.heroId === null) { if (held !== 'alle' && !(heldBereich && passtZuBereichen(e, [heldBereich]))) continue; }
    else if (held !== 'alle' && e.heroId !== held) continue;
    if (!passtZuBereichen(e, bereiche)) continue;
    const r = rolle(e.art);
    if (!r) { unbekannt.add(e.art); continue; }
    (jeTag.get(e.tag) || jeTag.set(e.tag, []).get(e.tag)).push(e);
  }
  // Reihenfolge der Helden: wie im Spielstand, unbekannte danach alphabetisch (stabil, auch in Tests)
  const platz = id => { const i = reihenfolge.indexOf(id); return i < 0 ? reihenfolge.length : i; };
  const nachHeld = (a, b) => platz(a) - platz(b) || (a < b ? -1 : a > b ? 1 : 0);
  const nachId = (x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);

  const tageSortiert = [...jeTag.keys()].sort().reverse();
  const teile = [];
  if (heute && TAG.test(heute) && !jeTag.has(heute)) teile.push({ art: 'heute', tag: heute });
  for (const tag of tageSortiert.slice(0, n)) {
    const l = jeTag.get(tag);
    const zeilenL = l.filter(e => rolle(e.art) === 'zeile');
    const tagesnotizen = l.filter(e => rolle(e.art) === 'tagesnotiz').sort(nachId);
    if (zeilenL.length || tagesnotizen.length) {
      const helden = [...new Set(zeilenL.map(e => e.heroId))].sort(nachHeld);
      const zeilen = helden.map(heroId => {
        const eig = zeilenL.filter(e => e.heroId === heroId);
        const treffer = cfg.siegel.find(s => eig.some(e => e.art === s.art));
        return {
          heroId,
          siegel: treffer ? treffer.siegel : cfg.ohneSiegel,
          notizen: eig.filter(e => cfg.notizArten.includes(e.art)).sort(nachId),
          zusatz: eig.filter(e => cfg.zusatzArten.includes(e.art)).sort((x, y) => cfg.zusatzArten.indexOf(x.art) - cfg.zusatzArten.indexOf(y.art) || nachId(x, y))
        };
      });
      teile.push({ art: 'tag', tag, tagesnotizen, zeilen });
    }
    const unten = (r, liste) => l.filter(e => rolle(e.art) === r)
      .sort((x, y) => liste.indexOf(x.art) - liste.indexOf(y.art) || nachHeld(x.heroId, y.heroId) || nachId(x, y))
      .forEach(e => teile.push({ art: r, tag, eintrag: e }));
    unten('marke', cfg.markenArten);
    unten('zier', cfg.zierArten);
  }
  return { filter: { held, tage: n, bereiche }, korrigiert, teile, mehr: tageSortiert.length > n, unbekannt: [...unbekannt].sort() };
}

// Gültige Ansicht ('buch' | 'liste' …) aus einem gespeicherten Wert; Unbekanntes → erste der Einstellungen.
export function chronikAnsichtWahl(wert, cfg) {
  const l = cfg && Array.isArray(cfg.ansichten) && cfg.ansichten.length ? cfg.ansichten : ['buch'];
  let w = wert;
  if (typeof w === 'string') { try { w = JSON.parse(w); } catch (e) { /* roher Text */ } }
  return l.includes(w) ? w : l[0];
}
