// Abgleich des Spielstands mit der Seiten-Datenbank (Version 77). Entscheidungen: logik/abgleich.js.
// Nur auf claude.ai mit Datenbank und Konto-ID; sonst wird er gar nicht gestartet (GitHub Pages bleibt beim Browser).
// Ablage: data/users/<id>/stand-<profil> (privat je Person, auch vor dem Besitzer der Seite) und daneben
// data/users/<id>/sicherung-<profil> für den älteren Stand nach einem Konflikt.
// Alle Datenbank-Schritte laufen nacheinander (eine Schreibung je Dokument zur Zeit, wie die Plattform verlangt).
import * as A from './logik/abgleich.js';

// u: { db, uid, profil, leseMeta() → roh, schreibeMeta(meta), holeSpiel() → spiel, uebernimm(stand, info),
//      melde(art, info), jetzt?, geraet?, zeitgeber? = { setze(fn, ms) → h, loesche(h) }, opt? }
export function erstelleAbgleich(u) {
  if (!u || !u.db || typeof u.db.doc !== 'function') throw new Error('Abgleich: keine Datenbank');
  if (!u.uid || typeof u.uid !== 'string') throw new Error('Abgleich: keine Konto-ID');
  const opt = { ...A.ABGLEICH, ...(u.opt || {}) };
  const jetzt = u.jetzt || (() => new Date());
  const zg = u.zeitgeber || { setze: (f, ms) => setTimeout(f, ms), loesche: h => clearTimeout(h) };
  const geraet = u.geraet || `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const profil = /^[a-z]+$/.test(u.profil || '') ? u.profil : 'haupt';
  const ref = u.db.doc(`data/users/${u.uid}/stand-${profil}`);
  const sicherRef = u.db.doc(`data/users/${u.uid}/sicherung-${profil}`);

  let meta = A.pruefeMeta(u.leseMeta());
  let status = 'verbindet';
  let entfernt = undefined;     // letzte definitive Meldung der Datenbank (pruefeHuelle), undefined = noch keine
  let kette = Promise.resolve();
  let hochTimer = null;
  let warteTimer = null;
  let abo = null;
  let aus = false;
  let wiederholt = false;
  let aenderungen = 0;          // zählt lokale Änderungen, damit ein Hochladen nur „offen“ löscht, was es mitnahm
  const hoerer = new Set();

  const setzeStatus = s => { if (s !== status) { status = s; hoerer.forEach(f => { try { f(s); } catch (e) { /* Anzeige darf nicht stören */ } }); } };
  const merkeMeta = () => { try { u.schreibeMeta(meta); } catch (e) { console.warn('Abgleich (Meta):', e.message); } };
  const melde = (art, info) => { try { u.melde && u.melde(art, info); } catch (e) { console.warn('Abgleich (Meldung):', e.message); } };
  const reihe = fn => (kette = kette.then(() => (aus ? undefined : fn())).catch(e => console.warn('Abgleich:', e && e.message)));

  function beenden(s) {
    setzeStatus(s);
    aus = true;
    if (hochTimer) { zg.loesche(hochTimer); hochTimer = null; }
    if (warteTimer) { zg.loesche(warteTimer); warteTimer = null; }
    if (abo) { try { abo(); } catch (e) { /* schon beendet */ } abo = null; }
  }

  // Fehler einer Datenbank-Schreibung: dauerhaft → nur Browser; vorübergehend → einmal später erneut
  function fehler(e, was) {
    const s = A.fehlerStatus(e && e.code);
    console.warn(`Abgleich (${was}):`, (e && (e.code || e.message)) || e);
    if (s === 'nur-browser') { beenden('nur-browser'); return; }
    if (s === 'fehler') { setzeStatus('fehler'); melde('fehler', { code: e && e.code }); return; }
    setzeStatus('offline');
    if (!wiederholt) { wiederholt = true; plane(opt.wiederholungMs); }
  }

  async function sichere(stand, grund) {
    if (!stand) return;
    const doc = { format: A.ABGLEICH.format, gesichert: jetzt().toISOString(), grund, stand };
    if (A.groesse(doc) > opt.maxBytes) { console.warn('Abgleich: Sicherung zu groß, übersprungen'); return; }
    try { await sicherRef.set(doc); } catch (e) { console.warn('Abgleich (Sicherung):', e && (e.code || e.message)); }
  }

  async function hochladen() {
    const spiel = u.holeSpiel();
    const rev = A.naechsteRev(meta, entfernt && entfernt.ok ? entfernt.rev : 0);
    const zeitIso = meta.geaendert || jetzt().toISOString();
    const doc = A.huelle(spiel, rev, zeitIso, geraet);
    if (A.groesse(doc) > opt.maxBytes) { setzeStatus('zu-gross'); melde('zu-gross', {}); return; }
    const mitgenommen = aenderungen;
    try { await ref.set(doc); }
    catch (e) { fehler(e, 'Hochladen'); return; }
    wiederholt = false;
    meta = { ...meta, rev, verbunden: true, offen: aenderungen !== mitgenommen };
    if (!meta.offen) meta.geaendert = null;
    entfernt = { ok: true, rev, geaendert: zeitIso, geraet, stand: spiel };
    merkeMeta();
    setzeStatus('aktuell');
    if (meta.offen) plane(opt.verzoegerungMs);
  }

  function uebernehmen(e, mitSicherung) {
    // Erst übernehmen, dann merken: scheitert das Übernehmen, bleibt der Browser bei seiner alten Nummer
    try { u.uebernimm(e.stand, { sicherung: mitSicherung }); }
    catch (err) { console.warn('Abgleich (Übernehmen):', err.message); setzeStatus('fehler'); return false; }
    meta = { rev: e.rev, offen: false, geaendert: null, verbunden: true };
    merkeMeta();
    setzeStatus('aktuell');
    return true;
  }

  // Kern: Meldung der Datenbank mit dem Browser-Stand zusammenführen
  async function verarbeite() {
    if (entfernt === undefined) return;
    const lokal = u.holeSpiel();
    const r = A.entscheide(meta, entfernt, A.hatInhalt(lokal));
    if (r.sicherung === 'lokal') await sichere(lokal, r.grund);
    if (r.sicherung === 'entfernt') await sichere(entfernt && entfernt.ok ? entfernt.stand : null, r.grund);
    if (r.aktion === 'hochladen') { await hochladen(); return; }
    if (r.aktion === 'uebernehmen') { if (uebernehmen(entfernt, !!r.sicherung)) melde('uebernommen', { sicherung: !!r.sicherung }); return; }
    if (!meta.verbunden) { meta = { ...meta, verbunden: true }; merkeMeta(); }
    setzeStatus('aktuell');
  }

  function plane(ms) {
    if (aus) return;
    if (hochTimer) zg.loesche(hochTimer);
    hochTimer = zg.setze(() => { hochTimer = null; reihe(verarbeite); }, ms);
  }

  return {
    start() {
      if (abo || aus) return;
      warteTimer = zg.setze(() => { warteTimer = null; if (entfernt === undefined) setzeStatus('offline'); }, opt.wartezeitMs);
      try {
        abo = ref.onSnapshot(snap => {
          // Nur bestätigte Fassungen zählen; eigene, noch unbestätigte Schreibungen und alte Kopien nicht
          if (!snap || snap.metadata?.hasPendingWrites || snap.metadata?.fromCache) return;
          if (warteTimer) { zg.loesche(warteTimer); warteTimer = null; }
          const e = A.pruefeHuelle(snap.exists ? snap.data() : null);
          reihe(async () => { entfernt = e; await verarbeite(); });
        }, e => fehler(e, 'Lesen'));
      } catch (e) { fehler(e, 'Abonnieren'); }
    },
    // Nach jeder lokalen Speicherung: als offen merken und gebündelt hochladen
    geaendert() {
      if (aus) return;
      aenderungen++;
      meta = { ...meta, offen: true, geaendert: jetzt().toISOString() };
      merkeMeta();
      plane(opt.verzoegerungMs);
    },
    // Sofort hochladen (z. B. beim Verlassen der Seite), wenn etwas offen ist
    jetztSichern() { if (!aus && meta.offen) { if (hochTimer) { zg.loesche(hochTimer); hochTimer = null; } reihe(verarbeite); } return kette; },
    status: () => status,
    beiStatus(f) { hoerer.add(f); return () => hoerer.delete(f); },
    meta: () => ({ ...meta }),
    fertig: () => kette,
    stop() { beenden(status); }
  };
}
