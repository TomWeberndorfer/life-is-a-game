// Brief an mein künftiges Ich und Beweisbuch (Version 166): Auswahl und Regeln. Daten: daten/beweisbuch.js.
// Reine Funktionen ohne DOM und Uhr, ändern den Spielstand nie und werfen nie (ungültige Eingaben ergeben null, [] oder false).
// Ein Beleg ändert nie XP, Runden, Siege oder Gegnerkraft (Tonregel der Einträge).
import { BEWEISBUCH } from '../daten/beweisbuch.js';
import { siegeFrueher } from './kapitel.js';

const liste = spiel => (Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : []).filter(e => e && typeof e === 'object');
const zeit = e => `${e.tag || ''}|${e.erstellt || ''}|${e.id || ''}`;
const neuZuerst = (a, b) => (zeit(a) < zeit(b) ? 1 : zeit(a) > zeit(b) ? -1 : 0);
const merkbar = (arten, e) => !!(arten && arten[e.art] && arten[e.art].merkbar);

// Text, der als Beleg gezeigt wird: Brief und Eintrag zum Tag = Text; Tagesnotiz = „Was war gut?“ (nie „Was war schwer?“:
// ein schwerer Tag ist hier kein Beweis), sonst der Text. Leer = nicht zeigbar.
export function belegText(e) {
  if (!e || typeof e !== 'object') return '';
  const gut = e.felder && typeof e.felder.gut === 'string' ? e.felder.gut.trim() : '';
  const text = typeof e.text === 'string' ? e.text.trim() : '';
  return gut || text;
}

// Briefe, die für diesen Helden gelten: eigene (heroId) und die für alle (null), jüngste zuerst. heroId null = nur die für alle.
export function briefeVon(spiel, heroId, art = BEWEISBUCH.art) {
  return liste(spiel).filter(e => e.art === art && (e.heroId === null || e.heroId === undefined || e.heroId === heroId) && belegText(e)).sort(neuZuerst);
}

// Markierte Einträge (Stern) aller merkbaren Arten, jüngste zuerst; nur solche mit zeigbarem Text. heroId gesetzt:
// nur dieses Helden und Tagesnotizen (ohne Held), sonst alle.
export function markierte(spiel, arten, heroId = null) {
  return liste(spiel).filter(e => e.merken === true && merkbar(arten, e) && belegText(e)
    && (!heroId || e.heroId === heroId || e.heroId === null || e.heroId === undefined)).sort(neuZuerst);
}

// Inhalt des Beweisbuchs: { briefe, markiert }. Alle Briefe (auch ohne Held-Bezug), jüngste zuerst.
export function beweisbuch(spiel, arten) {
  return {
    briefe: liste(spiel).filter(e => e.art === BEWEISBUCH.art && belegText(e)).sort(neuZuerst),
    markiert: markierte(spiel, arten)
  };
}

const waehle = (l, zufall) => {
  const r = Number(zufall());
  return l[Math.min(l.length - 1, Math.max(0, Math.floor((Number.isFinite(r) ? r : 0) * l.length)))];
};

// Ein Beleg für den schweren Moment (Notfallkarte, Willkommen zurück): immer höchstens EINER.
// Reihenfolge: Brief an diesen Helden → Brief für alle → markierter Eintrag (dieses Helden oder Tagesnotiz). Innerhalb einer
// Stufe zufällig (zufall austauschbar für Tests). `ausser` = Eintrags-ID, die nicht noch einmal kommen soll.
// Liefert { art: 'brief' | 'merken', eintrag } oder null.
export function belegFuer(spiel, heroId, { arten = null, zufall = Math.random, ausser = null } = {}) {
  const frei = e => e.id !== ausser;
  const eigene = liste(spiel).filter(e => e.art === BEWEISBUCH.art && heroId && e.heroId === heroId && belegText(e) && frei(e));
  const alle = liste(spiel).filter(e => e.art === BEWEISBUCH.art && (e.heroId === null || e.heroId === undefined) && belegText(e) && frei(e));
  const stufe = eigene.length ? eigene : alle;
  if (stufe.length) return { art: 'brief', eintrag: waehle(stufe.sort(neuZuerst), zufall) };
  const m = markierte(spiel, arten, heroId).filter(frei);
  return m.length ? { art: 'merken', eintrag: waehle(m, zufall) } : null;
}

// Karte „Schreib dir einen Brief“ auf der Startseite: einmal, leise, nach dem ersten Sieg; nie, wenn schon ein Brief da ist.
// gesehen = Geräte-Merkmal (true = beantwortet).
export function karteOffen({ gesehen, hatQuest, siege, briefe }, cfg = BEWEISBUCH.anregung) {
  const ab = cfg && Number.isInteger(cfg.abSiegen) && cfg.abSiegen > 0 ? cfg.abSiegen : 1;
  return !!hatQuest && gesehen !== true && Number.isInteger(siege) && siege >= ab && !(Number.isInteger(briefe) && briefe > 0);
}
// Höchste Zahl an Siegen eines einzelnen Helden (für die Karte). Wirft nie.
export function meisteSiege(spiel) {
  return (Array.isArray(spiel && spiel.helden) ? spiel.helden : []).reduce((m, h) => Math.max(m, h && Array.isArray(h.siege) ? h.siege.length + siegeFrueher(spiel, h.heroId) : 0), 0); // Version 171
}

// Alle Textschlüssel, die Seite, Blatt, Karte, Notfallkarte und Willkommen brauchen.
export function beweisSchluessel() {
  return ['brief.titel', 'beweis.titel', 'beweis.lead', 'beweis.zurueck', 'beweis.briefeTitel', 'beweis.briefeLeer',
    'beweis.markiertTitel', 'beweis.markiertLeer', 'beweis.neu', 'beweis.fuer', 'beweis.fuerAlle',
    'beweis.speichern', 'beweis.abbrechen', 'beweis.loeschen', 'beweis.loeschenSicher', 'beweis.bearbeiten',
    'beweis.gespeichert', 'beweis.geaendert', 'beweis.geloescht', 'beweis.leer', 'beweis.hinweis', 'beweis.platzhalter', 'beweis.privat',
    'beweis.stern', 'beweis.sternAn', 'beweis.sternAus', 'beweis.sternGesetzt', 'beweis.sternEntfernt',
    'beweis.karte.eyebrow', 'beweis.karte.titel', 'beweis.karte.text', 'beweis.karte.schreiben', 'beweis.karte.spaeter',
    'einst.beweis', 'einst.beweisText', 'einst.beweisOeffnen', 'lb.beweisbuch',
    'notfall.schritt.beleg', 'notfall.beleg.brief', 'notfall.beleg.merken', 'willkommen.gruss.brief', 'willkommen.gruss.merken'];
}

// Konfiguration und Texte prüfen: lesbare Fehler, leer = in Ordnung.
export function pruefeBeweisbuch(cfg = BEWEISBUCH, texte = {}, { arten = {}, notfallPfade = null, notfallBekannt = [] } = {}) {
  const f = [];
  if (!cfg || typeof cfg !== 'object') return ['Beweisbuch: Daten fehlen'];
  if (!arten[cfg.art]) f.push(`Beweisbuch: Eintragsart „${cfg.art}“ fehlt`);
  else if (!arten[cfg.art].heldOptional) f.push('Beweisbuch: die Art braucht heldOptional');
  if (!cfg.anregung || typeof cfg.anregung.merkmal !== 'string' || !/^[a-z_]+$/.test(cfg.anregung.merkmal)) f.push('Beweisbuch: Merkmal der Anregung ungültig');
  if (!cfg.notfall || typeof cfg.notfall.abschnitt !== 'string') f.push('Beweisbuch: Abschnitt der Notfallkarte fehlt');
  else {
    if (Array.isArray(notfallBekannt) && notfallBekannt.length && !notfallBekannt.includes(cfg.notfall.abschnitt)) f.push(`Beweisbuch: Abschnitt „${cfg.notfall.abschnitt}“ kennt die Notfallkarte nicht`);
    if (notfallPfade && !Object.values(notfallPfade).some(p => Array.isArray(p) && p.includes(cfg.notfall.abschnitt))) f.push('Beweisbuch: kein Pfad der Notfallkarte nennt den Abschnitt');
  }
  for (const k of beweisSchluessel()) if (typeof texte[k] !== 'string' || !texte[k].trim()) f.push(`Beweisbuch: Text fehlt: ${k}`);
  return f;
}
