// Analytics, getrennt vom Spielsystem.
// Sammelt im Browser (Puffer) und überträgt gebündelt in die Datenbank der Seite.
// Austauschbar: `verbinde()` bekommt einen Sender; heute Seiten-Datenbank, später z. B. Supabase.
import * as E from './logik/erfassung.js';
import { tagKey } from './logik/kern.js';
import { exportCode as kodiere } from './logik/austausch.js';
import * as V from './logik/versand.js';

const SENDE_ABSTAND = 15000;
let ctx = null; // { testerId, profil, heute: () => Date }
let puffer = null;
let sid = null;
let sessionTag = null;
let sichtbarSeit = null;
let screen = null;
let sender = null;
let status = 'lokal'; // 'lokal' | 'zentral' | 'nur-lokal'
let timer = null;
let laeuft = Promise.resolve();
const hoerer = new Set();

const lsKey = () => `liag.ana.${ctx.profil}`;
function sicher(fn, fb) { try { return fn(); } catch (e) { return fb; } }
function sichern() { sicher(() => localStorage.setItem(lsKey(), JSON.stringify(puffer)), null); }
const jetztIso = () => new Date().toISOString();
const neueId = () => sicher(() => crypto.randomUUID(), null) || Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export function initAnalytics(k) {
  ctx = { heute: () => new Date(), ...k };
  const roh = sicher(() => JSON.parse(localStorage.getItem(lsKey()) || 'null'), null);
  puffer = E.pruefePuffer(roh, ctx.testerId, ctx.profil);
  E.aufraeumen(puffer, 21, tagKey(ctx.heute()));
  starteSession();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { zeitAbschliessen(); sichern(); senden(); }
    else { pruefeTagwechsel(); sichtbarSeit = Date.now(); }
  });
  addEventListener('pagehide', () => { zeitAbschliessen(); trackEvent('session_ended', { screen }); sichern(); senden(); });
}

function starteSession() {
  sid = neueId();
  sessionTag = tagKey(ctx.heute());
  E.sessionStarten(puffer, sid, sessionTag, jetztIso());
  sichtbarSeit = document.visibilityState === 'hidden' ? null : Date.now();
  sichern();
}

// Nach Mitternacht (oder Testzeit-Sprung) beginnt eine neue Session am neuen Tag.
function pruefeTagwechsel() {
  const t = tagKey(ctx.heute());
  if (t !== sessionTag) { zeitAbschliessen(); starteSession(); if (screen) E.bildschirmBesuch(puffer, sessionTag, sid, screen); }
}

function zeitAbschliessen() {
  if (sichtbarSeit === null) return;
  E.zeitBuchen(puffer, sessionTag, sid, screen, Date.now() - sichtbarSeit, jetztIso());
  sichtbarSeit = document.visibilityState === 'hidden' ? null : Date.now();
}

function geaendert() {
  sichern();
  hoerer.forEach(f => sicher(() => f(), null));
  if (sender && !timer) timer = setTimeout(() => { timer = null; senden(); }, sender.abstandMs || SENDE_ABSTAND);
}

export function trackEvent(name, metadata = {}) {
  if (!ctx) return;
  try {
    pruefeTagwechsel();
    if (name === 'screen_enter' && metadata.screen) {
      zeitAbschliessen();
      screen = metadata.screen;
      E.bildschirmBesuch(puffer, sessionTag, sid, screen);
    } else if (name === 'screen_leave') {
      zeitAbschliessen();
    }
    E.zaehle(puffer, sessionTag, sid, name);
    E.attribute(puffer, sessionTag, sid, name, metadata);
    geaendert();
  } catch (e) {
    console.warn('Analytics:', e.message); // Analytics darf das Spiel nie stören
  }
}

export function bewerte(art, wert) {
  if (!ctx) return;
  try {
    E.bewertung(puffer, neueId(), art, wert, tagKey(ctx.heute()));
    E.zaehle(puffer, sessionTag, sid, wert === null ? 'rating_skipped' : 'rating_given');
    geaendert();
  } catch (e) { console.warn('Analytics:', e.message); }
}

export function letzteBewertungTag(art) { return puffer ? E.letzteBewertung(puffer, art) : null; }

export function merke(k, v) {
  if (!ctx) return;
  E.merkmal(puffer, k, v);
  geaendert();
}

export function merkmal(k) { return puffer ? puffer.merkmale[k] : undefined; }

export function feedback(antworten) {
  E.feedbackSetzen(puffer, antworten, tagKey(ctx.heute()));
  E.zaehle(puffer, sessionTag, sid, 'feedback_submitted');
  geaendert();
  senden();
}

export function hatFeedback() { return !!(puffer && puffer.feedback); }
export function aktiveTage() { return puffer ? Object.keys(puffer.tage).length : 0; }
export function analyticsStatus() { return status; }
export function beiAenderung(f) { hoerer.add(f); return () => hoerer.delete(f); }

// Daten-Code für Tester ohne Datenbank (Version 24). Wirft CodeFehler, wenn nichts da ist.
export function datenCode() {
  if (!puffer) throw new Error('Keine Nutzungsdaten vorhanden.');
  trackEvent('data_exported');
  zeitAbschliessen();
  const tage = Object.fromEntries(Object.keys(puffer.tage).map(t => [t, E.tagDokument(puffer, t)]));
  return kodiere(E.profilDokument(puffer, { zuletzt: jetztIso() }), tage, jetztIso());
}

// sender: { profil(doc) -> Promise, tag(tag, doc) -> Promise }; null = nur lokal
export function verbinde(s) {
  sender = s;
  status = s ? 'zentral' : 'nur-lokal';
  hoerer.forEach(f => sicher(() => f(), null));
  if (s) senden();
}

export function senden() {
  if (!sender || !puffer) return laeuft;
  laeuft = laeuft.then(async () => {
    zeitAbschliessen();
    const o = E.offen(puffer);
    try {
      if (o.profil) {
        const st = puffer.profilStand;
        await sender.profil(E.profilDokument(puffer, { zuletzt: jetztIso() }));
        E.bestaetigt(puffer, 'profil', null, st);
      }
      for (const t of o.tage) {
        const st = puffer.tage[t].stand;
        await sender.tag(t, E.tagDokument(puffer, t));
        E.bestaetigt(puffer, 'tag', t, st);
      }
      sichern();
    } catch (e) {
      if (e && e.endgueltig) { sender = null; status = 'nur-lokal'; hoerer.forEach(f => sicher(() => f(), null)); }
      // sonst: beim nächsten Mal erneut (Puffer bleibt unverändert)
    }
  });
  return laeuft;
}

// Seiten-Datenbank als Sender. Pfade: ana/<testerId> und ana/<testerId>/tage/<tag>.
export function dbSender(db) {
  const sicherId = String(ctx.testerId).replace(/[^A-Za-z0-9_\-.~:@+]/g, '-');
  async function schreib(ref, doc) {
    try {
      await ref.update(doc); // Sessions anderer Tabs bleiben erhalten (verschachtelte Felder werden zusammengeführt)
    } catch (e) {
      if (!e || e.code !== 'invalid_argument') throw wandle(e);
      const snap = await ref.get().catch(err => { throw wandle(err); });
      if (snap.exists) throw Object.assign(new Error('Schreiben nicht erlaubt'), { endgueltig: true });
      try { await ref.set(doc); } catch (e2) { throw wandle(e2, true); }
    }
  }
  function wandle(e, nachSet = false) {
    const c = e && e.code;
    const endgueltig = c === 'revoked' || c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed' || c === 'quota_exceeded' || (nachSet && c === 'invalid_argument');
    return Object.assign(new Error((e && e.message) || 'Übertragung fehlgeschlagen'), { endgueltig, code: c });
  }
  return {
    profil: doc => schreib(db.doc(`ana/${sicherId}`), doc),
    tag: (t, doc) => schreib(db.doc(`ana/${sicherId}/tage/${t}`), doc)
  };
}

// Google-Formular als Sender (Version 25). Antwort ist „opaque“ (no-cors): Erfolg = kein Netzwerkfehler.
// Jede Sendung wird eine Zeile der verknüpften Tabelle; Stand = Zeitpunkt, beim Einlesen gilt der neueste.
export function formSender(cfg) {
  const fehler = V.pruefeVersand(cfg);
  if (fehler.length) { console.warn('Versand nicht eingerichtet:', fehler.join(' ')); return null; }
  const id = String(ctx.testerId).replace(/[^A-Za-z0-9_\-.~:@+]/g, '-');
  async function schick(art, tag, doc) {
    const { zeilen, verworfen } = V.zeilen(id, art, tag, Date.now(), doc, cfg.maxZeichen);
    if (verworfen) console.warn(`Versand: ${verworfen} zu große Teile übersprungen`);
    for (const z of zeilen) {
      try {
        await fetch(cfg.url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: V.formularDaten(cfg, z) });
      } catch (e) {
        throw Object.assign(new Error('Übertragung fehlgeschlagen'), { endgueltig: false }); // später erneut
      }
    }
  }
  return { abstandMs: cfg.abstandMs, profil: doc => schick('profil', null, doc), tag: (t, doc) => schick('tag', t, doc) };
}
