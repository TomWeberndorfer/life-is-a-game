// Abgleich des Spielstands mit der Seiten-Datenbank (Version 77): reine Logik ohne Datenbank und Zeitgeber.
// Gilt nur auf claude.ai mit angemeldetem Konto. Auf GitHub Pages (ohne Datenbank) bleibt alles im Browser.
// Ablauf (Entscheidung 30.10.2026): Der Browser bleibt der schnelle Speicher; die Datenbank ist die gemeinsame
// Fassung für alle Geräte. Jede hochgeladene Fassung trägt eine Änderungsnummer (rev). Der Browser merkt sich,
// welche rev er zuletzt kannte und ob er seitdem etwas geändert hat (meta). Daraus folgt, was zu tun ist.
// Konflikt (beide Seiten geändert): der neuere Stand gewinnt, der ältere wird still als Sicherung abgelegt.
// Psychologie: Ein verlorener Fortschritt wirkt wie ein Rückfall, den man nicht verursacht hat. Darum geht nie
// ein Stand ganz verloren, und es gibt keine Rückfrage, die man falsch beantworten könnte.

export const ABGLEICH = {
  format: 1,
  verzoegerungMs: 1500,   // gebündeltes Hochladen nach der letzten Änderung
  wartezeitMs: 10000,     // ohne Antwort der Datenbank: Status „offline“, der Browser-Stand gilt weiter
  wiederholungMs: 4000,   // ein zweiter Versuch nach vorübergehendem Fehler
  maxBytes: 240 * 1024    // Grenze der Datenbank je Dokument: 256 KiB, mit Reserve
};

// Status, die die Einstellungen zeigen (Text: einst.abgleich.<status>)
export const ABGLEICH_STATUS = ['aus', 'verbindet', 'aktuell', 'offline', 'nur-browser', 'zu-gross', 'fehler'];

export const leereMeta = () => ({ rev: 0, offen: false, geaendert: null, verbunden: false });

// Gespeicherte Meta-Daten prüfen; Unbrauchbares → leere Meta (wie ein neuer Browser, verliert nichts).
export function pruefeMeta(roh) {
  const m = leereMeta();
  if (!roh || typeof roh !== 'object') return m;
  if (Number.isInteger(roh.rev) && roh.rev >= 0) m.rev = roh.rev;
  m.offen = roh.offen === true;
  m.geaendert = typeof roh.geaendert === 'string' && !Number.isNaN(Date.parse(roh.geaendert)) ? roh.geaendert : null;
  m.verbunden = roh.verbunden === true;
  return m;
}

// Hat dieser Stand etwas, das verloren gehen könnte? (frischer Stand ohne Auswahl = nein)
export function hatInhalt(spiel) {
  if (!spiel || typeof spiel !== 'object') return false;
  if (Array.isArray(spiel.helden) && spiel.helden.length) return true;
  const ob = spiel.onboarding;
  return !!(ob && (ob.fertig || ob.bereich));
}

export function groesse(wert) {
  const s = JSON.stringify(wert);
  return typeof TextEncoder === 'function' ? new TextEncoder().encode(s).length : s.length;
}

// Dokument für die Datenbank. Wirft bei ungültigen Angaben (Programmierfehler, nicht still schlucken).
export function huelle(spiel, rev, zeitIso, geraet) {
  if (!spiel || typeof spiel !== 'object') throw new Error('Abgleich: kein Spielstand');
  if (!Number.isInteger(rev) || rev < 1) throw new Error('Abgleich: ungültige Änderungsnummer');
  return { format: ABGLEICH.format, rev, geaendert: zeitIso, geraet: String(geraet || ''), stand: spiel };
}

// Dokument aus der Datenbank prüfen. null = keins vorhanden; { ok: false } = unbrauchbar (nicht überschreiben
// ohne Sicherung).
export function pruefeHuelle(d) {
  if (d === null || d === undefined) return null;
  if (typeof d !== 'object') return { ok: false, grund: 'kein Objekt' };
  if (d.format !== ABGLEICH.format) return { ok: false, grund: `unbekanntes Format ${d.format}` };
  if (!Number.isInteger(d.rev) || d.rev < 1) return { ok: false, grund: 'Änderungsnummer fehlt' };
  if (!d.stand || typeof d.stand !== 'object') return { ok: false, grund: 'Spielstand fehlt' };
  const geaendert = typeof d.geaendert === 'string' && !Number.isNaN(Date.parse(d.geaendert)) ? d.geaendert : null;
  return { ok: true, rev: d.rev, geaendert, geraet: typeof d.geraet === 'string' ? d.geraet : '', stand: d.stand };
}

const zeit = iso => (iso ? Date.parse(iso) : 0);

// Was tun mit dem, was die Datenbank meldet?
// meta: Stand dieses Browsers · entfernt: Ergebnis von pruefeHuelle · lokalHatInhalt: hatInhalt(lokaler Stand)
// → { aktion: 'nichts' | 'hochladen' | 'uebernehmen', sicherung: null | 'lokal' | 'entfernt', grund }
export function entscheide(meta, entfernt, lokalHatInhalt) {
  const m = pruefeMeta(meta);
  const r = (aktion, grund, sicherung = null) => ({ aktion, sicherung, grund });
  if (entfernt === null) {
    // Datenbank leer: Altbestand aus dem Browser einmal hochladen (nichts geht verloren)
    return lokalHatInhalt || m.offen ? r('hochladen', 'datenbank-leer') : r('nichts', 'beide-leer');
  }
  if (!entfernt || !entfernt.ok) {
    return lokalHatInhalt ? r('hochladen', 'entfernt-unbrauchbar', 'entfernt') : r('nichts', 'entfernt-unbrauchbar');
  }
  if (entfernt.rev === m.rev) return m.offen ? r('hochladen', 'lokal-neuer') : r('nichts', 'gleich');
  if (entfernt.rev < m.rev) return r('hochladen', 'datenbank-aelter'); // z. B. Dokument gelöscht und neu begonnen
  // Datenbank ist weiter als dieser Browser
  if (!m.verbunden) {
    // Erster Kontakt dieses Browsers: Die Datenbank gewinnt (sonst würde ein frisch begonnenes Onboarding auf
    // einem neuen Gerät den echten Fortschritt ersetzen). Hat der Browser eigenen Inhalt, wird er Sicherung.
    return r('uebernehmen', 'erster-kontakt', lokalHatInhalt ? 'lokal' : null);
  }
  if (!m.offen) return r('uebernehmen', 'anderes-geraet');
  // Konflikt: beide geändert. Der neuere gewinnt; Gleichstand → Datenbank (gemeinsame Fassung).
  return zeit(m.geaendert) > zeit(entfernt.geaendert)
    ? r('hochladen', 'konflikt-lokal-neuer', 'entfernt')
    : r('uebernehmen', 'konflikt-entfernt-neuer', 'lokal');
}

// Nächste Änderungsnummer: immer über allem, was bekannt ist.
export const naechsteRev = (meta, entfernteRev = 0) => Math.max(pruefeMeta(meta).rev, Number.isInteger(entfernteRev) ? entfernteRev : 0) + 1;

// Fehlercode der Datenbank → Status. Unbekannt = vorübergehend (wie die Plattform vorgibt).
export function fehlerStatus(code) {
  if (code === 'invalid_argument' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed' || code === 'revoked' || code === 'transform_error') return 'nur-browser';
  if (code === 'quota_exceeded') return 'fehler';
  return 'vorlaeufig';
}
