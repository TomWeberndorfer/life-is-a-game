// Inhalte pflegen: Logik ohne Bildschirm und ohne feste Datenbank (Pflege-Logik auslagern, 30.10.2026).
// Vorher in app.js. Die Aktionen bekommen eine Umgebung u:
//   u.speicher  Adapter für Tabelle und Bildspeicher (dbAdapter unten; null = keine Datenbank)
//   u.T         Texte (Schlüssel pflege.*)        u.zeichne()  neu zeichnen
//   u.tabelle() aktueller Index der Inhalte-Tabelle (logik/tabelle.js)
//   u.kontext() Prüf-Kontext für neueZeile        u.plaetze()  bekannte Bildplätze
//   u.stilName(id)                                u.jetzt()    Zeitpunkt für „geaendert“/„erstellt“
// Warum so: Die Pflege lässt sich ohne echte Datenbank testen (pflege.test.js), und ein späteres eigenes Hosting
// tauscht nur den Adapter aus. Der Zustand p (ui.pflege) wird direkt geändert, wie bisher.
import * as TB from './tabelle.js';

// Erlaubte Dateien beim Hochladen und Höchstgröße je Typ in MB (Rest: standard).
export const DATEIEN = { typen: /^image\/(png|jpeg|webp|svg\+xml)$/, maxMb: { 'image/svg+xml': 2, standard: 20 } };
// Fehlercodes der Datenbank → Textschlüssel; unbekannte Codes zeigen die Meldung selbst.
export const FEHLER_CODES = { permission_denied: 'pflege.fehlerRechte', quota_exceeded: 'pflege.fehlerVoll' };

export const leeresFormular = () => ({ typ: 'bild', schluessel: '', stil: TB.ALLE, medium: '', datei: '', pos: TB.STANDARD_POS, formen: {}, text: '', titel: '', art: '' });
export const neuerZustand = () => ({ form: leeresFormular(), bearbeitet: null, filter: '*', fehler: [], status: '', loeschen: null, laedt: false, speichert: false, formWahl: 'alle', nurLuecken: false, uploadOffen: false });
export const zeileAlsFormular = z => ({ ...leeresFormular(), typ: z.typ, schluessel: z.schluessel, stil: z.stil, medium: z.medium || '', datei: z.datei || '', pos: TB.normPos(z.pos) || TB.STANDARD_POS, formen: { ...(z.formen || {}) }, text: z.text || '' });

// Formular für einen Bildplatz: vorhandener Eintrag dieses Stils, sonst das eingebaute Bild als Ausgangspunkt (Version 30).
export function formularFuerPlatz(zeilen, stilId, platz, eingebautesBild) {
  const z = (zeilen || []).find(x => x.id === TB.docId(stilId, platz));
  if (z) return { form: zeileAlsFormular(z), bearbeitet: z.id };
  const ein = stilId !== TB.ALLE ? eingebautesBild(stilId, platz) : null;
  return { form: { ...leeresFormular(), typ: 'bild', schluessel: platz, stil: stilId, datei: ein ? ein.datei : '', pos: ein ? ein.pos : TB.STANDARD_POS, art: TB.artVon(platz) }, bearbeitet: null };
}

// Schlüssel oder Stil geändert (neuer Eintrag ohne gewähltes Upload-Bild): eingebautes Bild des Platzes vorschlagen.
export function eingebautVorschlagen(p, eingebautesBild) {
  if (p.bearbeitet || p.form.typ !== 'bild' || p.form.medium) return;
  const ein = p.form.stil !== TB.ALLE && p.form.schluessel ? eingebautesBild(p.form.stil, TB.normSchluessel(p.form.schluessel, 'bild')) : null;
  p.form.datei = ein ? ein.datei : '';
  if (ein) p.form.pos = ein.pos;
}

// Auswahl im Feld „Bild“: '__datei' = eingebautes Bild des Stils, sonst ein hochgeladenes Medium (oder leer).
export function bildWaehlen(form, wert, eingebautesBild) {
  if (wert === '__datei') {
    const ein = eingebautesBild(form.stil, TB.normSchluessel(form.schluessel, 'bild'));
    form.medium = ''; form.datei = ein ? ein.datei : '';
  } else { form.medium = String(wert ?? ''); form.datei = ''; }
}

// Ausschnitt per Regler: achse 'x' oder 'y', wert 0–100. wahl 'alle' = gemeinsamer Ausschnitt, sonst je Form.
// Ungültiger Wert → null (nichts geändert). Gibt den neuen Ausschnitt zurück.
export function setzeAusschnitt(form, wahl, achse, wert) {
  const n = Number(wert);
  if (!Number.isFinite(n) || (achse !== 'x' && achse !== 'y') || (wahl !== 'alle' && !TB.FORMEN.includes(wahl))) return null;
  const v = Math.max(0, Math.min(100, Math.round(n)));
  const alt = (wahl !== 'alle' && form.formen && form.formen[wahl]) || TB.normPos(form.pos) || TB.STANDARD_POS;
  const [x, y] = alt.split(' ');
  const neu = achse === 'x' ? `${v}% ${y}` : `${x} ${v}%`;
  if (wahl === 'alle') form.pos = neu; else (form.formen ||= {})[wahl] = neu;
  return neu;
}

// null = Datei in Ordnung, sonst Textschlüssel des Fehlers.
export function pruefeDatei(datei) {
  if (!datei) return 'pflege.fehlerFormat';
  if (!DATEIEN.typen.test(String(datei.type || ''))) return 'pflege.fehlerFormat';
  const mb = DATEIEN.maxMb[datei.type] || DATEIEN.maxMb.standard;
  if (!(Number(datei.size) >= 0) || datei.size > mb * 1024 * 1024) return 'pflege.fehlerGroesse';
  return null;
}

export const fehlerText = (e, T) => (e && FEHLER_CODES[e.code] ? T(FEHLER_CODES[e.code]) : (e && e.message) || T('pflege.fehlerUnbekannt'));

// Ohne Datenbank schreibt keine Aktion; Meldung statt Absturz.
function ohneSpeicher(p, u) {
  if (u.speicher) return false;
  p.fehler = [u.T('pflege.ohneDb')]; u.zeichne();
  return true;
}

// ---------- Aktionen (Ergebnis: 'ok' | 'fehler' | 'nachfrage' | 'frage' | 'leer') ----------
export async function speichern(p, u) {
  const r = TB.neueZeile(p.form, u.kontext());
  p.status = '';
  if (r.fehler) { p.fehler = r.fehler; u.zeichne(); return 'fehler'; }
  // Version 32: unbekannter Bildplatz → einmal nachfragen (zweites Tippen speichert trotzdem)
  const chk = TB.schluesselPruefen(r.zeile.schluessel, r.zeile.typ, u.plaetze());
  if (r.zeile.typ === 'bild' && !chk.bekannt && p.unbekanntFrage !== r.zeile.schluessel) {
    p.unbekanntFrage = r.zeile.schluessel; p.fehler = []; u.zeichne(); return 'nachfrage';
  }
  if (ohneSpeicher(p, u)) return 'fehler';
  p.unbekanntFrage = null; p.fehler = []; p.speichert = true; u.zeichne();
  let ergebnis = 'ok';
  try {
    await u.speicher.zeileSetzen(r.id, { ...r.zeile, geaendert: u.jetzt().toISOString() });
    // Schlüssel oder Stil beim Bearbeiten geändert: alte Zeile entfernen, sonst gäbe es zwei
    if (p.bearbeitet && p.bearbeitet !== r.id) await u.speicher.zeileLoeschen(p.bearbeitet);
    p.status = u.T('pflege.statusGespeichert', { schluessel: r.zeile.schluessel, stil: r.zeile.stil === TB.ALLE ? u.T('pflege.alleStile') : u.stilName(r.zeile.stil) });
    p.form = { ...leeresFormular(), typ: r.zeile.typ, stil: r.zeile.stil }; p.formWahl = 'alle';
    p.bearbeitet = null;
  } catch (e) { p.fehler = [u.T('pflege.fehlerSpeichern', { grund: fehlerText(e, u.T) })]; ergebnis = 'fehler'; }
  p.speichert = false; u.zeichne();
  return ergebnis;
}

export async function hochladen(p, datei, u) {
  p.fehler = []; p.status = '';
  if (!datei) return 'leer'; // Dateiauswahl abgebrochen
  const f = pruefeDatei(datei);
  if (f) { p.fehler = [u.T(f)]; u.zeichne(); return 'fehler'; }
  if (!u.speicher || typeof u.speicher.hochladen !== 'function') { p.fehler = [u.T('pflege.fehlerOhneUpload')]; u.zeichne(); return 'fehler'; }
  const art = TB.ARTEN.includes(p.form.art) ? p.form.art : TB.artVon(p.form.schluessel);
  const titel = (p.form.titel || String(datei.name || '').replace(/\.[^.]+$/, '')).slice(0, TB.GRENZEN.titel);
  p.laedt = true; u.zeichne();
  let ergebnis = 'ok';
  try {
    const id = await u.speicher.hochladen(datei);
    if (!id) throw new Error(u.T('pflege.fehlerUnbekannt'));
    await u.speicher.mediumSetzen(id, { asset: id, art, titel, erstellt: u.jetzt().toISOString() });
    p.form.medium = id; p.form.datei = ''; p.form.titel = ''; p.uploadOffen = false;
    p.status = u.T('pflege.statusHochgeladen', { titel });
  } catch (e) { p.fehler = [u.T('pflege.fehlerHochladen', { grund: fehlerText(e, u.T) })]; ergebnis = 'fehler'; }
  p.laedt = false; u.zeichne();
  return ergebnis;
}

// ----- Medienliste (Version 31) -----
export async function mediumSpeichern(p, id, u) {
  p.status = '';
  const r = TB.medienAenderung(p.medienForm || {});
  if (r.fehler) { p.fehler = r.fehler; u.zeichne(); return 'fehler'; }
  if (ohneSpeicher(p, u)) return 'fehler';
  let ergebnis = 'ok';
  try {
    await u.speicher.mediumAendern(id, r.daten);
    p.medienBearbeitet = null; p.fehler = []; p.status = u.T('pflege.statusMedium');
  } catch (e) { p.fehler = [u.T('pflege.fehlerSpeichern', { grund: fehlerText(e, u.T) })]; ergebnis = 'fehler'; }
  u.zeichne();
  return ergebnis;
}

// Zweistufig: erster Aufruf fragt, zweiter löscht. Benutzte Bilder nie (sonst zeigten Plätze ein kaputtes Bild).
export async function mediumLoeschen(p, id, u) {
  p.status = ''; p.fehler = [];
  if (!TB.darfLoeschen(u.tabelle(), id)) { p.medienLoeschen = null; p.fehler = [u.T('pflege.fehlerVerwendet')]; u.zeichne(); return 'fehler'; }
  if (p.medienLoeschen !== id) { p.medienLoeschen = id; u.zeichne(); return 'frage'; }
  p.medienLoeschen = null;
  if (ohneSpeicher(p, u)) return 'fehler';
  let ergebnis = 'ok';
  try {
    // Erst die Datei, dann der Eintrag: scheitert die Datei, bleibt alles sichtbar und kann erneut gelöscht werden.
    if (typeof u.speicher.dateiLoeschen === 'function') {
      try { await u.speicher.dateiLoeschen(id); }
      catch (e) { if (!e || e.code !== 'not_found') throw e; } // Datei schon weg: Eintrag trotzdem entfernen
    }
    await u.speicher.mediumLoeschen(id);
    p.status = u.T('pflege.statusBildWeg');
  } catch (e) { p.fehler = [u.T('pflege.fehlerLoeschen', { grund: fehlerText(e, u.T) })]; ergebnis = 'fehler'; }
  u.zeichne();
  return ergebnis;
}

export async function eintragLoeschen(p, id, u) {
  if (p.loeschen !== id) { p.loeschen = id; u.zeichne(); return 'frage'; }
  p.loeschen = null;
  if (ohneSpeicher(p, u)) return 'fehler';
  let ergebnis = 'ok';
  try { await u.speicher.zeileLoeschen(id); p.status = u.T('pflege.statusEintragWeg'); p.fehler = []; }
  catch (e) { p.fehler = [u.T('pflege.fehlerLoeschen', { grund: fehlerText(e, u.T) })]; ergebnis = 'fehler'; }
  u.zeichne();
  return ergebnis;
}

// Eintrag ins Formular holen. false = Eintrag nicht (mehr) da.
export function bearbeiten(p, id, zeilen) {
  const z = (zeilen || []).find(x => x.id === id);
  if (!z) return false;
  Object.assign(p, { form: zeileAlsFormular(z), bearbeitet: id, formWahl: 'alle', fehler: [], status: '', loeschen: null });
  return true;
}

// ---------- Adapter: Seiten-Datenbank und Bildspeicher von claude.ai ----------
// Pfade der Tabellen an EINER Stelle. Ohne Datenbank → null; ohne Bildspeicher (Betrachter) kein Hochladen/Dateilöschen.
export const TABELLEN = { inhalte: 'inhalte', medien: 'medien' };
export function dbAdapter(db, assets) {
  if (!db) return null;
  const doc = (t, id) => db.doc(`${TABELLEN[t]}/${id}`);
  return {
    zeileSetzen: (id, d) => doc('inhalte', id).set(d),
    zeileLoeschen: id => doc('inhalte', id).delete(),
    mediumSetzen: (id, d) => doc('medien', id).set(d),
    mediumAendern: (id, d) => doc('medien', id).update(d),
    mediumLoeschen: id => doc('medien', id).delete(),
    hochladen: assets ? async datei => { const up = await assets.upload(datei); return up && up.id; } : null,
    dateiLoeschen: assets ? id => assets.delete(id) : null
  };
}
