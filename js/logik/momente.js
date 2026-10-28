// Momente nach einem Tages-Check (Version 42): reine Funktionen, nichts gespeichert.
// Regeln als Daten in daten/momente.js. Kaputte Konfiguration → Standardwerte (gemeldet über pruefeMomente()).

export const STANDARD = Object.freeze({
  reihenfolge: ['sieg', 'lauf', 'gegner', 'levelup', 'story', 'frage'],
  maxBewertungen: 1,
  bewertungen: { sieg: ['hero_score'], ersterTreffer: ['boss_score'] },
  storyBeiSieg: 'spaeter',
  levelupBeiSieg: 'zeile',
  weltenwahl: 'naechsterBesuch'
});

const WERTE = { storyBeiSieg: ['spaeter', 'danach'], levelupBeiSieg: ['zeile', 'eigen'], weltenwahl: ['naechsterBesuch', 'sofort'] };

// Liefert lesbare Fehler, wirft nie.
export function pruefeMomente(cfg) {
  if (!cfg || typeof cfg !== 'object') return ['Momente: keine Konfiguration'];
  const f = [];
  if (!Array.isArray(cfg.reihenfolge) || !cfg.reihenfolge.every(x => typeof x === 'string')) f.push('reihenfolge muss eine Liste von Namen sein');
  if (!Number.isInteger(cfg.maxBewertungen) || cfg.maxBewertungen < 0) f.push('maxBewertungen muss eine ganze Zahl ab 0 sein');
  const b = cfg.bewertungen;
  if (!b || typeof b !== 'object') f.push('bewertungen fehlt');
  else for (const [k, l] of Object.entries(b)) if (!Array.isArray(l)) f.push(`bewertungen.${k} muss eine Liste sein`);
  for (const [k, erlaubt] of Object.entries(WERTE)) if (!erlaubt.includes(cfg[k])) f.push(`${k}: „${cfg[k]}“ unbekannt (erlaubt: ${erlaubt.join(', ')})`);
  return f;
}

// Gültige Konfiguration: jedes kaputte Feld fällt einzeln auf den Standard zurück.
export function konfig(cfg) {
  const c = cfg && typeof cfg === 'object' ? cfg : {};
  const out = { ...STANDARD };
  if (Array.isArray(c.reihenfolge) && c.reihenfolge.every(x => typeof x === 'string')) out.reihenfolge = c.reihenfolge;
  if (Number.isInteger(c.maxBewertungen) && c.maxBewertungen >= 0) out.maxBewertungen = c.maxBewertungen;
  if (c.bewertungen && typeof c.bewertungen === 'object') {
    out.bewertungen = { ...STANDARD.bewertungen };
    for (const [k, l] of Object.entries(c.bewertungen)) if (Array.isArray(l)) out.bewertungen[k] = l.filter(x => typeof x === 'string');
  }
  for (const [k, erlaubt] of Object.entries(WERTE)) if (erlaubt.includes(c[k])) out[k] = c[k];
  return out;
}

// Einblendungen nach einem Tages-Check.
// e: { ereignisse (aus kern.tagesCheck), story: { neu, nr }, antwort, trefferVorher, trefferNachher }
// darfFragen(art) → bool (Abstand je Bewertung, Analytics)
// Liefert { momente: [...], weltenwahlSofort }.
export function momenteNachCheck(e, cfgRoh, darfFragen = () => true) {
  const cfg = konfig(cfgRoh);
  const ev = Array.isArray(e && e.ereignisse) ? e.ereignisse : [];
  const sieg = ev.find(x => x && x.typ === 'sieg');
  const lvl = ev.find(x => x && x.typ === 'levelup');
  const frei = ev.some(x => x && x.typ === 'stil_frei');
  const story = (e && e.story) || {};
  const m = [];

  if (sieg) {
    const s = { art: 'sieg', gegner: sieg.gegner, neuerGegner: !!sieg.neuerGegner };
    if (lvl && cfg.levelupBeiSieg === 'zeile') Object.assign(s, { level: lvl.level, titel: lvl.titel });
    m.push(s);
    if (sieg.neuerGegner) {
      m.push({ art: 'lauf', von: sieg.gegner, nach: sieg.naechster });
      m.push({ art: 'gegner', gegner: sieg.naechster, kapitel: sieg.kapitel });
    }
    if (lvl && cfg.levelupBeiSieg === 'eigen') m.push({ art: 'levelup', level: lvl.level, titel: lvl.titel });
    if (story.neu && cfg.storyBeiSieg === 'danach') m.push({ art: 'story', nr: story.nr });
  } else {
    if (story.neu) m.push({ art: 'story', nr: story.nr });
    if (lvl) m.push({ art: 'levelup', level: lvl.level, titel: lvl.titel });
  }

  // Bewertungen: Anlass bestimmen, dann höchstens maxBewertungen erlaubte Kandidaten
  const anlass = sieg ? 'sieg' : (e && e.antwort === 'ja' && e.trefferVorher === 0 && e.trefferNachher === 1 ? 'ersterTreffer' : null);
  if (anlass && cfg.maxBewertungen > 0) {
    const kandidaten = cfg.bewertungen[anlass] || [];
    let n = 0;
    for (const art of kandidaten) {
      if (n >= cfg.maxBewertungen) break;
      let ok = false;
      try { ok = !!darfFragen(art); } catch (err) { ok = false; }
      if (ok) { m.push({ art: 'frage', bewertung: art }); n++; }
    }
  }

  const rang = a => { const i = cfg.reihenfolge.indexOf(a); return i < 0 ? cfg.reihenfolge.length : i; };
  const momente = m.map((x, i) => ({ x, i })).sort((a, b) => rang(a.x.art) - rang(b.x.art) || a.i - b.i).map(o => o.x);
  return { momente, weltenwahlSofort: frei && cfg.weltenwahl === 'sofort' };
}

// Erster Siegtag über alle Helden (oder null).
export function ersterSiegTag(spiel) {
  let min = null;
  for (const h of (spiel && Array.isArray(spiel.helden) ? spiel.helden : [])) {
    for (const s of (h && Array.isArray(h.siege) ? h.siege : [])) {
      if (s && typeof s.tag === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.tag) && (min === null || s.tag < min)) min = s.tag;
    }
  }
  return min;
}

// Soll die Weltenwahl jetzt als eigener Moment erscheinen?
// Nur wenn freigeschaltet und noch nie angeboten; bei 'naechsterBesuch' erst an einem Tag nach dem ersten Sieg.
// Ohne erkennbaren Siegtag (alte Stände) sofort fällig.
export function weltenwahlFaellig(spiel, heuteK, cfgRoh) {
  const st = spiel && spiel.stil;
  if (!st || st.frei !== true || st.angeboten === true) return false;
  const cfg = konfig(cfgRoh);
  if (cfg.weltenwahl === 'sofort') return true;
  const erster = ersterSiegTag(spiel);
  return erster === null || erster < heuteK;
}
