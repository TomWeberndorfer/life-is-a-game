// Inhalte als Markdown (Version 64, Etappe D1, Entscheidung 29.10.2026): Geschichten, Crew-Botschaften und Mikroquests
// werden in EINER Textdatei (claude/inhalte.md, in Obsidian bearbeitbar) gepflegt. Dieses Modul liest und schreibt das
// Format. Reine Funktionen, kein Dateizugriff: das Werkzeug claude/werkzeuge/inhalte-uebernehmen.mjs nutzt es.
//
// Format (Überschriften bestimmen die Bedeutung, Leerzeilen trennen):
//   # Geschichten
//   ## <gegner-id> · <Titel der Woche>          z. B. „## drycha · Die verbrannte Linie“; „_allgemein“ = allgemeine Woche
//   ### <nr> · <Titel des Teils>               genau 7 Teile, Nummern 1–7 in Reihenfolge
//   Andeutung: <Satz>                          optional (versiegelter Teil auf der Story-Seite)
//   Ja: <Text>  /  Nein: <Text>                zwei Fassungen (nach „Ja, geschafft“ / „Heute nicht gebraucht“)
//   oder ein einfacher Absatz                  eine Fassung für beide Antworten
//   # Botschaften
//   ## <anlass>                                z. B. erster_tag, gestern_ja, sonst
//   - <Text>                                   eine Zeile je Variante
//   # Mikroquests
//   ## <bereich>                               z. B. gesundheit
//   - <id>: <Text>                             feste ID (Haken bleiben beim Umformulieren erhalten)
//   # Bossreaktionen                           (Version 69, optional: fehlt er, bleiben die bisherigen Reaktionen)
//   ## <gegner-id>                             z. B. drycha; „_allgemein“ = Rückfall für jeden Gegner (Pflicht)
//   ### <art>                                  treffer, ruhe, phase, morgen (Bedeutung: js/daten/boss-reaktionen.js)
//   - <Text>                                   eine Zeile je Variante
// Zeilen, die mit „>“ beginnen, sind Notizen und werden ignoriert. Ein einfacher Absatz darf über mehrere Zeilen gehen
// (wird zu einer Zeile verbunden); „Andeutung:“, „Ja:“ und „Nein:“ stehen je in EINER Zeile.

export const ABSCHNITTE = { geschichten: 'Geschichten', botschaften: 'Botschaften', mikro: 'Mikroquests', bossreaktionen: 'Bossreaktionen' };
// Optionale Abschnitte: fehlen sie, ist das kein Fehler (daten.<abschnitt> bleibt null, das Werkzeug behält den alten Stand).
export const OPTIONAL = ['bossreaktionen'];
export const TEILE_JE_WOCHE = 7;
export const GRENZEN = { titel: 80, text: 900, botschaft: 300, mikro: 120, reaktion: 160 };
const ID = /^[a-z0-9][a-z0-9_-]*$/;
const STORY_ID = /^_?[a-z0-9][a-z0-9_-]*$/;
const FELD = { andeutung: 'vorschau', ja: 'ja', nein: 'nein' };
const TRENNER = ' · ';

// ---------- Lesen ----------
// Ergebnis: { daten: { stories, botschaften, mikro }, fehler: [...], warnungen: [...] }. Wirft nie.
// Bei Fehlern sind die Daten unvollständig und dürfen nicht übernommen werden.
export function leseMarkdown(text) {
  const fehler = [], warnungen = [];
  const daten = { stories: {}, botschaften: [], mikro: {}, bossreaktionen: null };
  if (typeof text !== 'string' || !text.trim()) return { daten, fehler: ['Die Datei ist leer.'], warnungen };

  let abschnitt = null, story = null, teil = null, liste = null, absatz = [], boss = null;
  const gesehen = new Set();
  const zeileNr = i => `Zeile ${i + 1}`;

  const absatzAbschliessen = () => {
    if (!absatz.length) return;
    const t = absatz.join(' ').replace(/\s+/g, ' ').trim();
    absatz = [];
    if (!t) return;
    if (!teil) { fehler.push(`${story ? story.id : '?'}: Text ohne Teil-Überschrift („### 1 · Titel“) – „${t.slice(0, 40)}“`); return; }
    if (teil.ja !== undefined || teil.nein !== undefined) { fehler.push(`${teil.wo}: entweder ein einfacher Text oder „Ja:“/„Nein:“, nicht beides (Fassungen je in EINER Zeile)`); return; }
    if (teil.einfach !== undefined) { fehler.push(`${teil.wo}: mehr als ein Textabsatz ohne „Ja:“/„Nein:“`); return; }
    teil.einfach = t;
  };
  const teilAbschliessen = () => {
    absatzAbschliessen();
    if (!teil || !story) return;
    const { wo } = teil;
    if (teil.einfach !== undefined && (teil.ja !== undefined || teil.nein !== undefined)) fehler.push(`${wo}: entweder ein einfacher Text oder „Ja:“/„Nein:“, nicht beides`);
    const t = { titel: teil.titel };
    if (teil.vorschau !== undefined) t.vorschau = teil.vorschau;
    if (teil.ja !== undefined || teil.nein !== undefined) {
      if (teil.ja === undefined) fehler.push(`${wo}: Fassung „Ja:“ fehlt`);
      t.text = { ja: teil.ja || '' };
      if (teil.nein !== undefined) t.text.nein = teil.nein;
    } else if (teil.einfach !== undefined) t.text = teil.einfach;
    else { fehler.push(`${wo}: kein Text`); t.text = ''; }
    story.teile.push(t);
    teil = null;
  };
  const storyAbschliessen = () => {
    teilAbschliessen();
    if (!story) return;
    if (story.teile.length !== TEILE_JE_WOCHE) fehler.push(`${story.id}: ${story.teile.length} statt ${TEILE_JE_WOCHE} Teile`);
    daten.stories[story.id] = { titel: story.titel, teile: story.teile };
    story = null;
  };

  const zeilen = text.replace(/\r\n?/g, '\n').split('\n');
  zeilen.forEach((roh, i) => {
    const z = roh.trim();
    if (z.startsWith('>')) return; // Notiz
    let m;
    if ((m = /^#\s+(.+)$/.exec(z))) {
      storyAbschliessen(); liste = null;
      const name = m[1].trim();
      abschnitt = Object.keys(ABSCHNITTE).find(k => ABSCHNITTE[k].toLowerCase() === name.toLowerCase()) || null;
      if (!abschnitt) fehler.push(`${zeileNr(i)}: unbekannter Abschnitt „${name}“ (erlaubt: ${Object.values(ABSCHNITTE).join(', ')})`);
      else if (gesehen.has(abschnitt)) fehler.push(`${zeileNr(i)}: Abschnitt „${name}“ doppelt`);
      else gesehen.add(abschnitt);
      if (abschnitt === 'bossreaktionen' && !daten.bossreaktionen) daten.bossreaktionen = {};
      boss = null;
      return;
    }
    if ((m = /^##\s+(.+)$/.exec(z))) {
      storyAbschliessen(); liste = null;
      const kopf = m[1].trim();
      if (abschnitt === 'geschichten') {
        const [id, ...rest] = kopf.split(TRENNER);
        const titel = rest.join(TRENNER).trim();
        if (!STORY_ID.test(id.trim())) { fehler.push(`${zeileNr(i)}: Geschichte braucht „## <gegner-id> · <Titel>“ (war „${kopf}“)`); story = { id: `?${i}`, titel, teile: [] }; return; }
        if (daten.stories[id.trim()]) fehler.push(`${zeileNr(i)}: Geschichte „${id.trim()}“ doppelt`);
        if (!titel) fehler.push(`${zeileNr(i)}: Titel der Woche fehlt`);
        story = { id: id.trim(), titel, teile: [] };
      } else if (abschnitt === 'botschaften') {
        if (!ID.test(kopf)) { fehler.push(`${zeileNr(i)}: ungültiger Anlass „${kopf}“`); return; }
        if (daten.botschaften.some(b => b.anlass === kopf)) fehler.push(`${zeileNr(i)}: Anlass „${kopf}“ doppelt`);
        liste = { anlass: kopf, texte: [] };
        daten.botschaften.push(liste);
      } else if (abschnitt === 'mikro') {
        if (!ID.test(kopf)) { fehler.push(`${zeileNr(i)}: ungültiger Bereich „${kopf}“`); return; }
        if (daten.mikro[kopf]) fehler.push(`${zeileNr(i)}: Bereich „${kopf}“ doppelt`);
        liste = daten.mikro[kopf] = [];
      } else if (abschnitt === 'bossreaktionen') {
        boss = null;
        if (!STORY_ID.test(kopf)) { fehler.push(`${zeileNr(i)}: Bossreaktion braucht „## <gegner-id>“ (war „${kopf}“)`); return; }
        if (daten.bossreaktionen[kopf]) fehler.push(`${zeileNr(i)}: Gegner „${kopf}“ doppelt`);
        boss = { id: kopf, arten: (daten.bossreaktionen[kopf] = {}) };
      } else fehler.push(`${zeileNr(i)}: „## ${kopf}“ außerhalb eines Abschnitts`);
      return;
    }
    if ((m = /^###\s+(.+)$/.exec(z)) && abschnitt === 'bossreaktionen') {
      const art = m[1].trim();
      liste = null;
      if (!boss) { fehler.push(`${zeileNr(i)}: „### ${art}“ ohne Gegner („## <gegner-id>“)`); return; }
      if (!ID.test(art)) { fehler.push(`${boss.id}, ${zeileNr(i)}: ungültige Art „${art}“`); return; }
      if (boss.arten[art]) fehler.push(`${boss.id}, ${zeileNr(i)}: Art „${art}“ doppelt`);
      liste = boss.arten[art] = [];
      return;
    }
    if ((m = /^###\s+(.+)$/.exec(z))) {
      teilAbschliessen();
      if (!story) { fehler.push(`${zeileNr(i)}: Teil ohne Geschichte`); return; }
      const t = /^(\d+)\s*·\s*(.+)$/.exec(m[1].trim());
      const erwartet = story.teile.length + 1;
      if (!t) { fehler.push(`${story.id}, ${zeileNr(i)}: Teil braucht „### <nr> · <Titel>“`); teil = { wo: `${story.id}[${erwartet}]`, titel: m[1].trim() }; return; }
      if (Number(t[1]) !== erwartet) fehler.push(`${story.id}: Teil ${t[1]} steht an Stelle ${erwartet}`);
      teil = { wo: `${story.id}[${erwartet}]`, titel: t[2].trim() };
      return;
    }
    if (!z) { absatzAbschliessen(); return; }
    if (abschnitt === 'geschichten') {
      if (!story) { fehler.push(`${zeileNr(i)}: Text vor der ersten Geschichte`); return; }
      const f = /^(Andeutung|Ja|Nein):\s*(.*)$/i.exec(z);
      if (f) {
        absatzAbschliessen();
        if (!teil) { fehler.push(`${zeileNr(i)}: „${f[1]}:“ ohne Teil`); return; }
        const feld = FELD[f[1].toLowerCase()];
        if (teil[feld] !== undefined) fehler.push(`${teil.wo}: „${f[1]}:“ doppelt`);
        teil[feld] = f[2].trim(); // ein Feld = eine Zeile (in Obsidian ohne festen Umbruch schreiben)
        return;
      }
      absatz.push(z);
      return;
    }
    if (abschnitt === 'botschaften' || abschnitt === 'mikro' || abschnitt === 'bossreaktionen') {
      const p = /^[-*]\s+(.+)$/.exec(z);
      if (!liste) { fehler.push(`${zeileNr(i)}: Zeile ohne ${abschnitt === 'bossreaktionen' ? '„### <art>“' : '„## …“'}-Überschrift`); return; }
      if (!p) { fehler.push(`${zeileNr(i)}: Listenzeile muss mit „- “ beginnen`); return; }
      if (abschnitt === 'bossreaktionen') liste.push(p[1].trim());
      else if (abschnitt === 'botschaften') liste.texte.push(p[1].trim());
      else {
        const q = /^([a-z0-9][a-z0-9-]*):\s*(.+)$/.exec(p[1].trim());
        if (!q) { fehler.push(`${zeileNr(i)}: Mikroquest braucht „- <id>: <Text>“`); return; }
        liste.push([q[1], q[2].trim()]);
      }
      return;
    }
    fehler.push(`${zeileNr(i)}: Text außerhalb eines Abschnitts`);
  });
  storyAbschliessen();
  for (const k of Object.keys(ABSCHNITTE)) if (!gesehen.has(k) && !OPTIONAL.includes(k)) fehler.push(`Abschnitt „# ${ABSCHNITTE[k]}“ fehlt`);
  pruefeInhalt(daten, fehler, warnungen);
  return { daten, fehler, warnungen };
}

// Inhaltliche Regeln, die keine Formatfragen sind. Fehler verhindern die Übernahme, Warnungen nur Hinweise.
function pruefeInhalt(daten, fehler, warnungen) {
  if (!daten.stories._allgemein) fehler.push('Geschichte „_allgemein“ fehlt (gilt für jede Runde ohne eigene Geschichte)');
  for (const [id, s] of Object.entries(daten.stories)) {
    if (s.titel.length > GRENZEN.titel) warnungen.push(`${id}: Titel länger als ${GRENZEN.titel} Zeichen`);
    s.teile.forEach((t, i) => {
      const texte = typeof t.text === 'string' ? [t.text] : Object.values(t.text || {});
      for (const x of texte) if (x.length > GRENZEN.text) warnungen.push(`${id}[${i + 1}]: Text länger als ${GRENZEN.text} Zeichen (am Handy lang)`);
    });
  }
  for (const b of daten.botschaften) {
    if (!b.texte.length) fehler.push(`Botschaften „${b.anlass}“: keine Variante`);
    b.texte.forEach((x, i) => { if (x.length > GRENZEN.botschaft) warnungen.push(`Botschaften „${b.anlass}“[${i + 1}]: länger als ${GRENZEN.botschaft} Zeichen`); });
  }
  const ids = new Map();
  for (const [bereich, pool] of Object.entries(daten.mikro)) {
    if (!pool.length) fehler.push(`Mikroquests „${bereich}“: leer`);
    for (const [id, text] of pool) {
      if (ids.has(id)) fehler.push(`Mikroquest-ID „${id}“ doppelt (${ids.get(id)} und ${bereich}); IDs müssen eindeutig bleiben`);
      ids.set(id, bereich);
      if (text.length > GRENZEN.mikro) warnungen.push(`Mikroquest „${id}“: länger als ${GRENZEN.mikro} Zeichen`);
    }
  }
  // Bossreaktionen: Arten, Platzhalter und „_allgemein“ prüft das Werkzeug mit logik/boss-reaktion.js (eine Quelle).
  for (const [id, arten] of Object.entries(daten.bossreaktionen || {})) {
    if (!Object.keys(arten).length) fehler.push(`Bossreaktionen „${id}“: keine Art („### treffer“ …)`);
    for (const [art, l] of Object.entries(arten)) {
      if (!l.length) fehler.push(`Bossreaktionen ${id}.${art}: keine Zeile`);
      l.forEach((x, i) => { if (x.length > GRENZEN.reaktion) warnungen.push(`Bossreaktionen ${id}.${art}[${i + 1}]: länger als ${GRENZEN.reaktion} Zeichen (eine Zeile in der Duell-Karte)`); });
    }
  }
}

// Vergleich mit dem bisherigen Stand: verschwundene Mikroquest-IDs und Anlässe sind meist Versehen.
export function vergleicheStand(alt, neu) {
  const hinweise = [];
  const altIds = new Set(Object.values(alt.mikro || {}).flat().map(x => x[0]));
  const neuIds = new Set(Object.values(neu.mikro || {}).flat().map(x => x[0]));
  for (const id of altIds) if (!neuIds.has(id)) hinweise.push(`Mikroquest „${id}“ fehlt jetzt (erledigte Haken dazu werden nicht mehr angezeigt)`);
  const altAnlass = new Set((alt.botschaften || []).map(b => b.anlass));
  for (const a of altAnlass) if (!(neu.botschaften || []).some(b => b.anlass === a)) hinweise.push(`Botschaften-Anlass „${a}“ fehlt jetzt (die App nutzt dann „sonst“)`);
  for (const a of (neu.botschaften || []).map(b => b.anlass)) if (!altAnlass.has(a)) hinweise.push(`Neuer Anlass „${a}“: die App kennt ihn nicht und zeigt ihn nie (Anlässe kommen aus logik/inhalte.js)`);
  for (const id of Object.keys(alt.stories || {})) if (!(neu.stories || {})[id]) hinweise.push(`Geschichte „${id}“ fehlt jetzt (die Runde zeigt dann die allgemeine Woche)`);
  if (neu.bossreaktionen) {
    for (const [id, arten] of Object.entries(alt.bossreaktionen || {})) {
      if (!neu.bossreaktionen[id]) { hinweise.push(`Bossreaktionen „${id}“ fehlen jetzt (der Gegner nutzt dann „_allgemein“)`); continue; }
      for (const art of Object.keys(arten || {})) if (!neu.bossreaktionen[id][art]) hinweise.push(`Bossreaktionen ${id}.${art} fehlen jetzt (Rückfall auf „_allgemein“)`);
    }
  }
  return hinweise;
}

// ---------- Schreiben ----------
const absatzText = t => String(t).trim();

// Daten → Markdown (für die Vorlage-Datei und den Rundweg-Test). Reihenfolge bleibt wie in den Daten.
export function schreibeMarkdown({ stories, botschaften, mikro, bossreaktionen = null }, { kopf = '' } = {}) {
  const z = [];
  if (kopf) z.push(kopf.trim(), '');
  z.push(`# ${ABSCHNITTE.geschichten}`, '');
  for (const [id, s] of Object.entries(stories)) {
    z.push(`## ${id}${TRENNER}${s.titel}`, '');
    s.teile.forEach((t, i) => {
      z.push(`### ${i + 1}${TRENNER}${t.titel}`);
      if (t.vorschau !== undefined) z.push(`Andeutung: ${absatzText(t.vorschau)}`);
      if (typeof t.text === 'string') z.push(absatzText(t.text));
      else {
        z.push(`Ja: ${absatzText(t.text.ja)}`);
        if (t.text.nein !== undefined) z.push(`Nein: ${absatzText(t.text.nein)}`);
      }
      z.push('');
    });
  }
  z.push(`# ${ABSCHNITTE.botschaften}`, '');
  for (const b of botschaften) z.push(`## ${b.anlass}`, ...b.texte.map(x => `- ${x}`), '');
  z.push(`# ${ABSCHNITTE.mikro}`, '');
  for (const [bereich, pool] of Object.entries(mikro)) z.push(`## ${bereich}`, ...pool.map(([id, t]) => `- ${id}: ${t}`), '');
  if (bossreaktionen) {
    z.push(`# ${ABSCHNITTE.bossreaktionen}`, '');
    for (const [id, arten] of Object.entries(bossreaktionen)) {
      z.push(`## ${id}`, '');
      for (const [art, l] of Object.entries(arten)) z.push(`### ${art}`, ...l.map(x => `- ${x}`), '');
    }
  }
  return z.join('\n').replace(/\n+$/, '\n');
}

// Daten → JavaScript-Modul js/daten/inhalte-text.js (erzeugt, nicht von Hand ändern).
export function schreibeModul({ stories, botschaften, mikro, bossreaktionen = {} }, { quelle = 'claude/inhalte.md', stand = '' } = {}) {
  const j = x => JSON.stringify(x, null, 2);
  return [
    `// ERZEUGT aus ${quelle}${stand ? ` (${stand})` : ''} mit claude/werkzeuge/inhalte-uebernehmen.mjs – nicht von Hand ändern.`,
    '// Texte ändern: in der Markdown-Datei, dann „Geschichten übernehmen“. Einstellungen (Anzahl je Tag, Rückfall) stehen in inhalte.js.',
    '',
    `export const BOTSCHAFTEN = ${j(botschaften)};`,
    '',
    `export const STORIES = ${j(stories)};`,
    '',
    `export const MIKRO = ${j(mikro)};`,
    '',
    '// Boss-Reaktionen (Version 69): Bedeutung der Arten und Einstellungen in boss-reaktionen.js.',
    `export const BOSS_REAKTIONEN = ${j(bossreaktionen || {})};`,
    ''
  ].join('\n');
}
