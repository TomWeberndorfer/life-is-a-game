// Momente nach einem Tages-Check (Version 42): reine Funktionen, nichts gespeichert.
// Regeln als Daten in daten/momente.js. Kaputte Konfiguration → Standardwerte (gemeldet über pruefeMomente()).

export const STANDARD = Object.freeze({
  reihenfolge: ['sieg', 'lauf', 'gegner', 'levelup', 'story', 'frage'],
  maxBewertungen: 1,
  bewertungen: { sieg: ['hero_score'], ersterTreffer: ['boss_score'] },
  storyNachCheck: 'karte',
  storyBeiSieg: 'spaeter',
  levelupBeiSieg: 'zeile',
  weltenwahl: 'naechsterBesuch',
  kapitelwechsel: 'sofort',
  kapitelStichtag: null,
  fragenNurRuhig: false,
  pauseMs: 700
});
// Version 68: Höhepunkte (zählen für „Fragen nie an einem Höhepunkt-Tag“). Fragen selbst sind keine.
export const HOEHEPUNKTE = ['sieg', 'lauf', 'gegner', 'levelup', 'story'];

const WERTE = { storyNachCheck: ['karte', 'popup'], storyBeiSieg: ['spaeter', 'danach'], levelupBeiSieg: ['zeile', 'eigen'], weltenwahl: ['naechsterBesuch', 'sofort'], kapitelwechsel: ['naechsterBesuch', 'sofort'] };
const PAUSE_MAX = 5000;
const TAG = /^\d{4}-\d{2}-\d{2}$/;

// Liefert lesbare Fehler, wirft nie.
export function pruefeMomente(cfg) {
  if (!cfg || typeof cfg !== 'object') return ['Momente: keine Konfiguration'];
  const f = [];
  if (!Array.isArray(cfg.reihenfolge) || !cfg.reihenfolge.every(x => typeof x === 'string')) f.push('reihenfolge muss eine Liste von Namen sein');
  if (!Number.isInteger(cfg.maxBewertungen) || cfg.maxBewertungen < 0) f.push('maxBewertungen muss eine ganze Zahl ab 0 sein');
  const b = cfg.bewertungen;
  if (!b || typeof b !== 'object') f.push('bewertungen fehlt');
  else for (const [k, l] of Object.entries(b)) if (!Array.isArray(l)) f.push(`bewertungen.${k} muss eine Liste sein`);
  for (const [k, erlaubt] of Object.entries(WERTE)) if (cfg[k] !== undefined && !erlaubt.includes(cfg[k])) f.push(`${k}: „${cfg[k]}“ unbekannt (erlaubt: ${erlaubt.join(', ')})`);
  if (cfg.fragenNurRuhig !== undefined && typeof cfg.fragenNurRuhig !== 'boolean') f.push('fragenNurRuhig muss true oder false sein');
  if (cfg.pauseMs !== undefined && !(Number.isFinite(cfg.pauseMs) && cfg.pauseMs >= 0 && cfg.pauseMs <= PAUSE_MAX)) f.push(`pauseMs muss zwischen 0 und ${PAUSE_MAX} liegen`);
  if (cfg.kapitelStichtag !== undefined && cfg.kapitelStichtag !== null && !TAG.test(String(cfg.kapitelStichtag))) f.push('kapitelStichtag muss ein Datum JJJJ-MM-TT sein');
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
  if (typeof c.fragenNurRuhig === 'boolean') out.fragenNurRuhig = c.fragenNurRuhig;
  if (Number.isFinite(c.pauseMs) && c.pauseMs >= 0 && c.pauseMs <= PAUSE_MAX) out.pauseMs = Math.round(c.pauseMs);
  if (TAG.test(String(c.kapitelStichtag))) out.kapitelStichtag = c.kapitelStichtag;
  return out;
}

// Einblendungen nach einem Tages-Check.
// e: { ereignisse (aus kern.tagesCheck), story: { neu, nr }, antwort, trefferVorher, trefferNachher,
//      vorigeGewonnen (Runde davor gewonnen, Version 68), hoehepunktHeute (heute schon ein Höhepunkt gezeigt, Version 68) }
// darfFragen(art) → bool (Abstand je Bewertung, Analytics)
// Liefert { momente: [...], weltenwahlSofort }.
export function momenteNachCheck(e, cfgRoh, darfFragen = () => true) {
  const cfg = konfig(cfgRoh);
  const ev = Array.isArray(e && e.ereignisse) ? e.ereignisse : [];
  const sieg = ev.find(x => x && x.typ === 'sieg');
  const lvl = ev.find(x => x && x.typ === 'levelup');
  const frei = ev.some(x => x && x.typ === 'stil_frei');
  // Version 48: bei 'karte' kommt der neue Teil nie als Popup (er wartet versiegelt auf der Story-Karte)
  const story = cfg.storyNachCheck === 'popup' ? ((e && e.story) || {}) : {};
  const m = [];

  if (sieg) {
    const s = { art: 'sieg', gegner: sieg.gegner, neuerGegner: !!sieg.neuerGegner };
    if (Number.isInteger(sieg.anzahl)) s.anzahl = sieg.anzahl; // Einstiegsrampe: was dieser Sieg gebraucht hat
    if (lvl && cfg.levelupBeiSieg === 'zeile') Object.assign(s, { level: lvl.level, titel: lvl.titel });
    m.push(s);
    // Version 68: bei 'naechsterBesuch' kommen Weg und neuer Gegner erst, wenn die neue Runde begonnen hat (kapitelFaellig)
    if (sieg.neuerGegner && cfg.kapitelwechsel === 'sofort') {
      m.push({ art: 'lauf', von: sieg.gegner, nach: sieg.naechster });
      m.push(gegnerMoment(sieg.naechster, sieg.kapitel, sieg.naechsteAnzahl, sieg.anzahl));
    }
    if (lvl && cfg.levelupBeiSieg === 'eigen') m.push({ art: 'levelup', level: lvl.level, titel: lvl.titel });
    if (story.neu && cfg.storyBeiSieg === 'danach') m.push({ art: 'story', nr: story.nr });
  } else {
    if (story.neu) m.push({ art: 'story', nr: story.nr });
    if (lvl) m.push({ art: 'levelup', level: lvl.level, titel: lvl.titel });
  }

  // Bewertungen: Anlass bestimmen, dann höchstens maxBewertungen erlaubte Kandidaten.
  // Version 68: „nachSieg“ = zweiter Treffer der Runde nach einem Sieg (ein ruhiger Tag, der Sieg ist verdaut).
  // fragenNurRuhig: keine Frage, wenn dieser Check oder ein früherer heute schon einen Höhepunkt hatte.
  const ja = e && e.antwort === 'ja';
  const anlass = sieg ? 'sieg'
    : ja && e.trefferVorher === 0 && e.trefferNachher === 1 ? 'ersterTreffer'
    : ja && e.vorigeGewonnen === true && e.trefferVorher === 1 && e.trefferNachher === 2 ? 'nachSieg' : null;
  const ruhig = !(m.some(x => HOEHEPUNKTE.includes(x.art)) || (e && e.hoehepunktHeute === true));
  if (anlass && cfg.maxBewertungen > 0 && (!cfg.fragenNurRuhig || ruhig)) {
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

// Kapitelwechsel beim nächsten Besuch (Version 68, Entscheidung 30.10.2026: ein Höhepunkt je Check).
// Am Siegtag kommt nur der Sieg; „Weg zum nächsten Gegner“ und „Neuer Gegner“ erscheinen, sobald die Runde gegen den neuen
// Gegner begonnen hat, beim nächsten Öffnen der Startseite. Geht nie verloren: fällig, solange die Kennung nicht gesehen ist,
// auch nach Tagen Pause. a = kern.auswertung(), kette = kern.kette(stand), basis = Kennung der Quest (Held, Start, Vorlage),
// gesehen = Liste schon gezeigter Kennungen, siege = stand.siege. Ergebnis { kennung, momente } oder null. Wirft nie.
// Stichtag (Umstellung auf Version 68): Wer den Gegner davor besiegt hat, sah Weg und neuen Gegner schon am Siegtag.
export function kapitelFaellig(a, kette, basis, gesehen, cfgRoh, { siege = [] } = {}) {
  const cfg = konfig(cfgRoh);
  if (cfg.kapitelwechsel !== 'naechsterBesuch') return null;
  if (!a || !Number.isInteger(a.gegnerNr) || a.gegnerNr < 2 || !Number.isInteger(a.rundeTag) || a.rundeTag < 0) return null;
  const k = Array.isArray(kette) ? kette : [];
  const nach = k[a.gegnerNr - 1], von = k[a.gegnerNr - 2];
  if (typeof nach !== 'string' || typeof von !== 'string' || (a.gegner && a.gegner !== nach)) return null;
  if (typeof basis !== 'string' || !basis) return null;
  const kennung = `${basis}|${a.gegnerNr}`;
  if (Array.isArray(gesehen) && gesehen.includes(kennung)) return null;
  if (cfg.kapitelStichtag) {
    const sieg = (Array.isArray(siege) ? siege : []).filter(x => x && x.gegner === von && TAG.test(String(x.tag))).map(x => x.tag).sort().pop();
    const beginn = sieg || a.rundeVon; // alte Stände ohne Gegner im Sieg: Beginn der Runde
    if (typeof beginn === 'string' && beginn < cfg.kapitelStichtag) return null;
  }
  return { kennung, momente: [{ art: 'lauf', von, nach }, gegnerMoment(nach, a.gegnerNr, a.anzahl, a.vorigeAnzahl)] };
}

// Einblendung „neuer Gegner“. Einstiegsrampe (30.10.2026): anzahl = Ziel der neuen Runde, staerker = mehr als beim
// Besiegten (Text „Du bist stärker geworden, er auch“). Fehlen die Zahlen, bleibt es beim bisherigen Text.
function gegnerMoment(gegner, kapitel, anzahl, vorher) {
  const g = { art: 'gegner', gegner, kapitel };
  if (Number.isInteger(anzahl) && anzahl > 0) {
    g.anzahl = anzahl;
    if (Number.isInteger(vorher) && anzahl > vorher) g.staerker = true;
  }
  return g;
}

// Gesehene Kennungen ergänzen (je Gerät gespeichert), Müll aussortieren, höchstens `max` neueste behalten.
export function kapitelGesehen(gesehen, kennung, max = 60) {
  const alt = Array.isArray(gesehen) ? gesehen.filter(x => typeof x === 'string' && x && x !== kennung) : [];
  return typeof kennung === 'string' && kennung ? [...alt, kennung].slice(-max) : alt.slice(-max);
}
