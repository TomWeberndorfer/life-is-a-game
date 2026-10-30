// Erfassung als reine Funktionen: Puffer je Tester, Sessions je Tag, Zähler und Zeiten.
// Der Puffer ist die Wahrheit; die Datenbank bekommt Kopien (nach Version), nie Deltas.
// Dadurch zählt ein wiederholtes Senden nie doppelt.

export const PUFFER_VERSION = 1;
const NAME = /^[a-z][a-z0-9_]{2,40}$/;
const MAX_SESSIONS_JE_TAG = 40;
const MAX_SCHLUESSEL = 80;
// Zusatzangaben zu Ereignissen: nur diese Felder werden gezählt (ohne Personendaten), je Session als „ereignis|feld:wert“.
// bereich (Freischaltungen: stadt, welten, karte …) und abschnitt (Startseite: quest, premium) seit 30.10.2026; vorher wurden
// sie mitgeschickt, aber verworfen. Werte sind feste IDs der App, nie Eingaben der Nutzer.
export const MERKMAL_FELDER = Object.freeze(['domain', 'kapitel', 'bereich', 'abschnitt']);
const WERT = /^[a-z0-9-]{1,30}$/;
const MAX_ATTR = 60;

export function neuerPuffer(testerId, profil = 'haupt') {
  return { v: PUFFER_VERSION, testerId: String(testerId), profil, erster: null, merkmale: {}, bewertungen: {}, feedback: null, tage: {}, stand: 0, profilStand: 0, gesendet: { profil: 0, tage: {} } };
}

export function pruefePuffer(roh, testerId, profil) {
  const p = neuerPuffer(testerId, profil);
  if (!roh || typeof roh !== 'object' || roh.v !== PUFFER_VERSION || roh.testerId !== String(testerId)) return p;
  for (const k of ['erster']) if (typeof roh[k] === 'string') p[k] = roh[k];
  if (roh.merkmale && typeof roh.merkmale === 'object') p.merkmale = { ...roh.merkmale };
  if (roh.bewertungen && typeof roh.bewertungen === 'object') p.bewertungen = { ...roh.bewertungen };
  if (roh.feedback && typeof roh.feedback === 'object') p.feedback = { ...roh.feedback };
  if (roh.tage && typeof roh.tage === 'object') p.tage = JSON.parse(JSON.stringify(roh.tage));
  p.stand = Number.isFinite(roh.stand) ? roh.stand : 0;
  p.profilStand = Number.isFinite(roh.profilStand) ? roh.profilStand : 0;
  if (roh.gesendet && typeof roh.gesendet === 'object') {
    p.gesendet = { profil: Number(roh.gesendet.profil) || 0, tage: { ...(roh.gesendet.tage || {}) } };
  }
  return p;
}

function beruehre(p, tag) {
  p.stand += 1;
  if (tag) p.tage[tag].stand = p.stand;
  else p.profilStand = p.stand;
}

export function sessionStarten(p, sid, tag, startIso) {
  if (!p.erster || tag < p.erster) { p.erster = tag; p.profilStand = p.stand + 1; }
  const t = p.tage[tag] || (p.tage[tag] = { tag, sessions: {}, stand: 0 });
  if (!t.sessions[sid]) {
    const ids = Object.keys(t.sessions);
    if (ids.length >= MAX_SESSIONS_JE_TAG) delete t.sessions[ids.sort((a, b) => (t.sessions[a].start < t.sessions[b].start ? -1 : 1))[0]];
    t.sessions[sid] = { start: startIso, ende: startIso, ms: 0, screens: {}, events: {}, attr: {} };
  }
  beruehre(p, tag);
  return p;
}

function session(p, tag, sid) {
  const s = p.tage[tag] && p.tage[tag].sessions[sid];
  if (!s) throw new Error('Session nicht gestartet');
  return s;
}

export function zaehle(p, tag, sid, name) {
  if (!NAME.test(name)) return p;
  const s = session(p, tag, sid);
  if (!(name in s.events) && Object.keys(s.events).length >= MAX_SCHLUESSEL) return p;
  s.events[name] = (s.events[name] || 0) + 1;
  beruehre(p, tag);
  return p;
}

// Zählt erlaubte Zusatzangaben eines Ereignisses. Unbekannte Felder und ungültige Werte werden ignoriert.
export function attribute(p, tag, sid, name, meta, felder = MERKMAL_FELDER) {
  if (!NAME.test(name) || !meta || typeof meta !== 'object') return p;
  const s = session(p, tag, sid);
  const attr = s.attr || (s.attr = {});
  let neu = false;
  for (const f of felder) {
    if (meta[f] === undefined || meta[f] === null) continue;
    const w = String(meta[f]).toLowerCase();
    if (!WERT.test(w)) continue;
    const k = `${name}|${f}:${w}`;
    if (!(k in attr) && Object.keys(attr).length >= MAX_ATTR) continue;
    attr[k] = (attr[k] || 0) + 1;
    neu = true;
  }
  if (neu) beruehre(p, tag);
  return p;
}

export function bildschirmBesuch(p, tag, sid, screen) {
  if (!NAME.test(screen)) return p;
  const s = session(p, tag, sid);
  const e = s.screens[screen] || (s.screens[screen] = { n: 0, ms: 0 });
  e.n += 1;
  beruehre(p, tag);
  return p;
}

// Zeit nur positiv und begrenzt (ein vergessener Tab zählt höchstens 30 Minuten am Stück).
export function zeitBuchen(p, tag, sid, screen, ms, endeIso) {
  const d = Math.min(30 * 60e3, Math.max(0, Math.round(ms || 0)));
  const s = session(p, tag, sid);
  if (d > 0) {
    s.ms += d;
    if (screen && NAME.test(screen)) {
      const e = s.screens[screen] || (s.screens[screen] = { n: 0, ms: 0 });
      e.ms += d;
    }
  }
  if (endeIso) s.ende = endeIso;
  beruehre(p, tag);
  return p;
}

export function bewertung(p, id, art, wert, tag) {
  if (!NAME.test(art)) throw new Error(`Unbekannte Bewertung: ${art}`);
  if (wert !== null && !(Number.isInteger(wert) && wert >= 1 && wert <= 5)) throw new Error('Bewertung muss 1 bis 5 sein');
  p.bewertungen[id] = { art, wert, tag };
  beruehre(p, null);
  return p;
}

export function letzteBewertung(p, art) {
  return Object.values(p.bewertungen).filter(b => b.art === art).map(b => b.tag).sort().pop() || null;
}

export function merkmal(p, k, v) {
  if (!NAME.test(k)) return p;
  if (p.merkmale[k] === v) return p;
  p.merkmale[k] = v;
  beruehre(p, null);
  return p;
}

export function feedbackSetzen(p, antworten, tag) {
  const a = antworten || {};
  const text = x => (typeof x === 'string' ? x.trim().slice(0, 600) : '');
  const wahl = x => (['ja', 'vielleicht', 'nein'].includes(x) ? x : null);
  p.feedback = { spannend: text(a.spannend), langweilig: text(a.langweilig), verbessern: text(a.verbessern), morgen: wahl(a.morgen), bezahlen: wahl(a.bezahlen), tag };
  beruehre(p, null);
  return p;
}

// Was muss gesendet werden? Profil und jeder Tag mit neuerem Stand als zuletzt bestätigt.
export function offen(p) {
  const tage = Object.keys(p.tage).filter(t => (p.tage[t].stand || 0) > (p.gesendet.tage[t] || 0));
  const profil = (p.profilStand || 0) > p.gesendet.profil;
  return { profil, tage };
}

export function bestaetigt(p, art, tag, stand) {
  if (art === 'profil') p.gesendet.profil = Math.max(p.gesendet.profil, stand);
  else p.gesendet.tage[tag] = Math.max(p.gesendet.tage[tag] || 0, stand);
  return p;
}

export function profilDokument(p, extra = {}) {
  return { testerId: p.testerId, profil: p.profil, erster: p.erster, merkmale: p.merkmale, bewertungen: p.bewertungen, feedback: p.feedback, ...extra };
}

export function tagDokument(p, tag) {
  const t = p.tage[tag];
  return { tag, sessions: JSON.parse(JSON.stringify(t.sessions)) };
}

// Alte, bestätigte Tage aus dem Browser entfernen (die Datenbank hat sie).
export function aufraeumen(p, behaltenTage, heuteKey) {
  const grenze = new Date(heuteKey + 'T12:00:00');
  grenze.setDate(grenze.getDate() - behaltenTage);
  const g = grenze.toISOString().slice(0, 10);
  for (const t of Object.keys(p.tage)) {
    if (t < g && (p.gesendet.tage[t] || 0) >= (p.tage[t].stand || 0)) {
      delete p.tage[t];
      delete p.gesendet.tage[t];
    }
  }
  return p;
}
