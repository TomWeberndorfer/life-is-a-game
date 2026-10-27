// Kennzahlen für die Admin-Ansicht. Reine Funktionen, Gewichte als Daten.
// Eingabe: Liste von Testern { id, profil, istBesitzer, erster, merkmale, bewertungen, feedback, tage: { 'YYYY-MM-DD': { sessions: { sid: { ms, screens, events } } } } }

export const GEWICHTE = {
  ranking: { verweildauer: 0.3, wiederbesuche: 0.3, interaktionen: 0.2, bewertungen: 0.2 },
  hes: { heldengefuehl: 0.4, wiederbesuche: 0.25, verweildauer: 0.2, storyNeugier: 0.15 }
};

// Welche Bildschirme, Ereignisse und Bewertungen gehören zu welchem Feature.
export const FEATURES = [
  { id: 'crew', name: 'Verbündeter', screens: ['crew'], events: ['crew_viewed', 'crew_revisited', 'character_opened'], bewertung: 'crew_score' },
  { id: 'boss', name: 'Gegner', screens: ['boss', 'neuer_gegner'], events: ['boss_viewed', 'boss_revisited', 'boss_revealed'], bewertung: 'boss_score' },
  { id: 'quest', name: 'Quest der Woche', screens: ['quest', 'start'], events: ['quest_viewed', 'quest_checkin', 'quest_completed'], bewertung: null },
  { id: 'faehigkeit', name: 'Fähigkeit', screens: ['faehigkeit'], events: ['skill_viewed'], bewertung: null },
  { id: 'story', name: 'Story', screens: ['story', 'sieg', 'stilwahl'], events: ['story_opened', 'story_part_read', 'story_completed', 'style_selected'], bewertung: 'story_curiosity_score' },
  { id: 'mikro', name: 'Mikroquests', screens: [], events: ['mikroquest_done'], bewertung: null },
  { id: 'botschaft', name: 'Crew-Botschaft', screens: [], events: ['crew_message_seen'], bewertung: null },
  { id: 'mehrheld', name: 'Weitere Helden', screens: [], events: ['hero_focus', 'hero_added', 'new_adventure_started'], bewertung: null },
  { id: 'stadt', name: 'Stadt', screens: ['stadt'], events: [], bewertung: null }
];

export const TRICHTER = [
  ['ob1', '1 Bereich'], ['ob3', '3 Ziel'], ['ob5', '5 Verbündeter'], ['ob7', '7 Fähigkeit'], ['onboarding_finished', '8 Abenteuer beginnen']
];

const sessionsVon = t => Object.values(t.tage || {}).flatMap(d => Object.values(d.sessions || {}));
const summe = a => a.reduce((x, y) => x + y, 0);
const mittel = a => (a.length ? summe(a) / a.length : null);

function plusTage(k, n) {
  const d = new Date(k + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function filtere(tester, { testprofile = false, besitzer = false } = {}) {
  return tester.filter(t => (testprofile || t.profil !== 'test') && (besitzer || !t.istBesitzer));
}

function screenWerte(t, screens) {
  let n = 0; let ms = 0;
  for (const s of sessionsVon(t)) for (const k of screens) { const e = (s.screens || {})[k]; if (e) { n += e.n || 0; ms += e.ms || 0; } }
  return { n, ms };
}
function eventZahl(t, namen) {
  return summe(sessionsVon(t).map(s => summe(namen.map(k => (s.events || {})[k] || 0))));
}
function hatEvent(t, name) { return eventZahl(t, [name]) > 0; }
function bewertungen(t, art) {
  return Object.values(t.bewertungen || {}).filter(b => b.art === art && Number.isInteger(b.wert)).map(b => b.wert);
}
const skaliere = w => (w === null ? null : (w - 1) / 4); // 1–5 → 0–1

// Gewichteter Wert, fehlende Teile werden herausgerechnet (Gewichte neu verteilt).
export function gewichtet(werte, gewichte) {
  let s = 0; let g = 0;
  for (const [k, w] of Object.entries(gewichte)) {
    if (werte[k] === null || werte[k] === undefined || Number.isNaN(werte[k])) continue;
    s += w * werte[k]; g += w;
  }
  return g ? s / g : null;
}

export function retention(tester, n, heuteKey) {
  const geeignet = tester.filter(t => t.erster && plusTage(t.erster, n) <= heuteKey);
  if (!geeignet.length) return { wert: null, basis: 0, zurueck: 0 };
  const zurueck = geeignet.filter(t => (t.tage || {})[plusTage(t.erster, n)]).length;
  return { wert: zurueck / geeignet.length, basis: geeignet.length, zurueck };
}

export function grundzahlen(tester, heuteKey) {
  const sessions = tester.flatMap(sessionsVon);
  const mitDauer = sessions.filter(s => (s.ms || 0) > 0);
  const gesehen = tester.filter(t => hatEvent(t, 'premium_viewed'));
  const geklickt = tester.filter(t => hatEvent(t, 'premium_clicked'));
  return {
    tester: tester.length,
    sessions: sessions.length,
    dauerMs: mittel(mitDauer.map(s => s.ms)),
    premium: { gesehen: gesehen.length, geklickt: geklickt.length, rate: gesehen.length ? geklickt.filter(t => gesehen.includes(t)).length / gesehen.length : null },
    d1: retention(tester, 1, heuteKey), d3: retention(tester, 3, heuteKey), d7: retention(tester, 7, heuteKey)
  };
}

export function trichter(tester) {
  const schritte = TRICHTER.map(([k, label]) => ({
    label,
    anzahl: tester.filter(t => (k.startsWith('ob') ? screenWerte(t, [k]).n > 0 : hatEvent(t, k))).length
  }));
  const dauer = tester.map(t => (t.merkmale || {}).onboarding_ms).filter(x => Number.isFinite(x) && x > 0);
  return { schritte, dauerMs: mittel(dauer) };
}

export function featureRanking(tester) {
  const roh = FEATURES.map(f => {
    const proTester = tester.map(t => ({ ...screenWerte(t, f.screens), ev: eventZahl(t, f.events), b: f.bewertung ? bewertungen(t, f.bewertung) : [] }));
    const aktiv = proTester.filter(x => x.n > 0 || x.ev > 0);
    const alleB = proTester.flatMap(x => x.b);
    return {
      id: f.id, name: f.name,
      verweildauer: aktiv.length ? mittel(aktiv.map(x => x.ms)) : 0,
      wiederbesuche: tester.length ? summe(proTester.map(x => Math.max(0, x.n - 1))) / tester.length : 0,
      interaktionen: tester.length ? summe(proTester.map(x => x.ev)) / tester.length : 0,
      bewertung: f.bewertung ? mittel(alleB) : null,
      bewertungen: alleB.length
    };
  });
  const max = k => Math.max(0, ...roh.map(r => r[k] || 0));
  const mx = { verweildauer: max('verweildauer'), wiederbesuche: max('wiederbesuche'), interaktionen: max('interaktionen') };
  return roh.map(r => {
    const teile = {
      verweildauer: mx.verweildauer ? r.verweildauer / mx.verweildauer : 0,
      wiederbesuche: mx.wiederbesuche ? r.wiederbesuche / mx.wiederbesuche : 0,
      interaktionen: mx.interaktionen ? r.interaktionen / mx.interaktionen : 0,
      bewertungen: skaliere(r.bewertung)
    };
    const w = gewichtet(teile, GEWICHTE.ranking);
    return { ...r, teile, score: w === null ? 0 : Math.round(100 * w) };
  }).sort((a, b) => b.score - a.score);
}

export function heroEngagement(tester) {
  const roh = tester.map(t => {
    const s = sessionsVon(t);
    const besuche = summe(FEATURES.map(f => Math.max(0, screenWerte(t, f.screens).n - 1)));
    return { id: t.id, held: mittel(bewertungen(t, 'hero_score')), story: mittel(bewertungen(t, 'story_curiosity_score')), besuche, ms: summe(s.map(x => x.ms || 0)) };
  });
  const maxB = Math.max(0, ...roh.map(r => r.besuche));
  const maxMs = Math.max(0, ...roh.map(r => r.ms));
  const je = roh.map(r => {
    const teile = { heldengefuehl: skaliere(r.held), wiederbesuche: maxB ? r.besuche / maxB : 0, verweildauer: maxMs ? r.ms / maxMs : 0, storyNeugier: skaliere(r.story) };
    const w = gewichtet(teile, GEWICHTE.hes);
    return { ...r, teile, score: w === null ? null : Math.round(100 * w) };
  });
  const gueltig = je.filter(r => r.score !== null && (r.ms > 0 || r.held !== null));
  return {
    score: gueltig.length ? Math.round(mittel(gueltig.map(r => r.score))) : null,
    held: mittel(roh.map(r => r.held).filter(x => x !== null)),
    story: mittel(roh.map(r => r.story).filter(x => x !== null)),
    wiederbesuche: gueltig.length ? Math.round(100 * mittel(gueltig.map(r => r.teile.wiederbesuche))) : null,
    verweildauer: gueltig.length ? Math.round(100 * mittel(gueltig.map(r => r.teile.verweildauer))) : null,
    je
  };
}

export function bildschirmZeiten(tester) {
  const m = {};
  for (const t of tester) for (const s of sessionsVon(t)) for (const [k, e] of Object.entries(s.screens || {})) {
    const x = m[k] || (m[k] = { screen: k, n: 0, ms: 0 });
    x.n += e.n || 0; x.ms += e.ms || 0;
  }
  return Object.values(m).map(x => ({ ...x, msJeBesuch: x.n ? x.ms / x.n : 0 })).sort((a, b) => b.msJeBesuch - a.msJeBesuch);
}

// Zusatzangaben je Tester zusammenzählen: { 'wert': Anzahl } für ein Feld bei bestimmten Ereignissen.
function attrJeTester(t, feld, events) {
  const out = {};
  for (const s of sessionsVon(t)) for (const [k, n] of Object.entries(s.attr || {})) {
    const m = /^([a-z0-9_]+)\|([a-z]+):(.+)$/.exec(k);
    if (!m || m[2] !== feld || !events.includes(m[1])) continue;
    out[m[3]] = (out[m[3]] || 0) + (Number(n) || 0);
  }
  return out;
}

// Bosskette: Wie viele Tester haben Kapitel 2, 3 … erreicht? (aus boss_revealed mit kapitel)
export function kapitel(tester) {
  const hoechstes = tester.map(t => Math.max(1, ...Object.keys(attrJeTester(t, 'kapitel', ['boss_revealed'])).map(Number).filter(Number.isInteger)));
  const max = Math.max(1, ...hoechstes);
  const stufen = [];
  for (let k = 2; k <= max; k++) stufen.push({ kapitel: k, tester: hoechstes.filter(h => h >= k).length });
  const sieger = tester.filter(t => hatEvent(t, 'quest_completed')).length;
  return { basis: tester.length, sieger, stufen };
}

// Lebensbereiche: Wie viele Tester haben in welchem Bereich eine Quest begonnen (Onboarding oder weiterer Held)?
export function lebensbereiche(tester) {
  const m = {};
  for (const t of tester) for (const d of Object.keys(attrJeTester(t, 'domain', ['quest_started', 'hero_added']))) m[d] = (m[d] || 0) + 1;
  return Object.entries(m).map(([domain, anzahl]) => ({ domain, anzahl })).sort((a, b) => b.anzahl - a.anzahl || (a.domain < b.domain ? -1 : 1));
}

export function feedbackAuswertung(tester) {
  const fb = tester.map(t => t.feedback).filter(Boolean);
  const anteil = (k, v) => (fb.filter(f => f[k]).length ? fb.filter(f => f[k] === v).length / fb.filter(f => f[k]).length : null);
  return { anzahl: fb.length, morgenJa: anteil('morgen', 'ja'), bezahlenJa: anteil('bezahlen', 'ja'), texte: fb };
}

const pct = x => (x === null ? '–' : `${Math.round(100 * x)} %`);
const minSek = ms => (ms === null || ms === undefined ? '–' : `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}`);
export const format = { pct, minSek };

const ANZEIGE = { ob1: 'Onboarding 1', ob2: 'Onboarding 2', ob3: 'Onboarding 3', ob4: 'Analyse', ob5: 'Verbündeter (Onboarding)', ob6: 'Gegner (Onboarding)', ob7: 'Fähigkeit (Onboarding)', ob8: 'Quest der Woche (Onboarding)', start: 'Startseite', crew: 'Verbündeter', boss: 'Gegner', faehigkeit: 'Fähigkeit', quest: 'Quest', story: 'Geschichte', sieg: 'Siegesanzeige', stilwahl: 'Stilwahl', stadt: 'Stadt', neuer_gegner: 'Neuer Gegner', einstellungen: 'Einstellungen', feedback: 'Feedback', premium: 'Premium' };
export const screenName = k => ANZEIGE[k] || k;

export function erkenntnisse(tester, heuteKey) {
  const out = [];
  if (!tester.length) return ['Noch keine Daten. Sobald eingeladene Tester die App öffnen, erscheinen hier Erkenntnisse.'];
  const rank = featureRanking(tester);
  const g = grundzahlen(tester, heuteKey);
  const fb = feedbackAuswertung(tester);
  if (rank[0] && rank[0].score > 0) out.push(`Beliebtestes Feature: ${rank[0].name} (Score ${rank[0].score}${rank[1] ? `, vor ${rank[1].name} mit ${rank[1].score}` : ''}).`);
  const zeiten = bildschirmZeiten(tester).filter(z => z.n >= 2);
  if (zeiten[0]) out.push(`Längste Verweildauer je Besuch: ${screenName(zeiten[0].screen)} mit Ø ${minSek(zeiten[0].msJeBesuch)} Min.`);
  const bewertet = rank.filter(r => r.bewertung !== null).sort((a, b) => b.bewertung - a.bewertung);
  const hes = heroEngagement(tester);
  if (bewertet[0]) out.push(`Stärkste emotionale Wirkung: ${bewertet[0].name} mit Ø ${bewertet[0].bewertung.toFixed(1).replace('.', ',')} von 5 (${bewertet[0].bewertungen} Bewertungen).`);
  if (hes.held !== null) out.push(`Heldengefühl („Hauptfigur der eigenen Geschichte“): Ø ${hes.held.toFixed(1).replace('.', ',')} von 5.`);
  if (g.premium.gesehen) out.push(`Premium-Interesse: ${g.premium.geklickt} von ${g.premium.gesehen} Testern, die das Angebot gesehen haben, haben geklickt (${pct(g.premium.rate)}).`);
  if (fb.morgenJa !== null && g.d1.wert !== null) {
    const diff = Math.round(100 * (fb.morgenJa - g.d1.wert));
    out.push(`Verhalten vs. Aussage: „würde morgen öffnen“ ${pct(fb.morgenJa)}, tatsächlich D1 ${pct(g.d1.wert)}${Math.abs(diff) >= 15 ? ` – ${diff > 0 ? 'Aussagen sind deutlich optimistischer als das Verhalten' : 'Verhalten ist besser als die Aussagen'}` : ''}.`);
  }
  const kp = kapitel(tester);
  if (kp.sieger) out.push(`Bosskette: ${kp.sieger} von ${kp.basis} Testern haben einen Gegner besiegt${kp.stufen[0] ? `, ${kp.stufen[0].tester} haben Kapitel 2 erreicht` : ''}.`);
  const lb = lebensbereiche(tester);
  if (lb[0]) out.push(`Häufigster Lebensbereich beim Start: ${lb[0].domain} (${lb[0].anzahl} Tester).`);
  if (g.tester < 5) out.push(`Achtung: erst ${g.tester} Tester. Unterschiede sind noch nicht belastbar.`);
  return out;
}
