// Seite „Wie diese App denkt“ (Version 164): Prüfung der Daten und Regel, wann die Karte auf der Startseite erscheint.
// Reine Funktionen ohne DOM und Uhr, werfen nie. Daten: daten/denken.js.
import { DENKEN } from '../daten/denken.js';

const ID = /^[a-z][a-z0-9]*$/;

// Alle Textschlüssel, die die Seite braucht (Titel und Text je Zusage und je Begriff, dazu die festen Seitentexte).
export function denkenSchluessel(cfg = DENKEN) {
  const k = ['denken.titel', 'denken.lead', 'denken.zusagenTitel', 'denken.glossarTitel', 'denken.zurueck',
    'denken.karte.eyebrow', 'denken.karte.titel', 'denken.karte.text', 'denken.karte.lesen', 'denken.karte.spaeter',
    'einst.denken', 'einst.denkenText', 'einst.denkenOeffnen'];
  for (const id of Array.isArray(cfg && cfg.zusagen) ? cfg.zusagen : []) k.push(`denken.zusage.${id}.titel`, `denken.zusage.${id}.text`);
  for (const g of Array.isArray(cfg && cfg.glossar) ? cfg.glossar : []) if (g) k.push(`denken.glossar.${g.id}.titel`, `denken.glossar.${g.id}.text`);
  return k;
}

// Konfiguration und Texte prüfen: Liste lesbarer Fehler, leer = in Ordnung.
//   texte  Textregister (TEXTE); stile  optional (STILE), prüft die Stilwörter im Rückfall-Stil fantasy
export function pruefeDenken(cfg = DENKEN, texte = {}, stile = null) {
  const f = [];
  if (!cfg || typeof cfg !== 'object') return ['Denken: Daten fehlen'];
  if (!Array.isArray(cfg.zusagen) || cfg.zusagen.length < 1) f.push('Denken: Zusagen fehlen');
  if (!Array.isArray(cfg.glossar)) f.push('Denken: Glossar fehlt');
  if (typeof cfg.merkmal !== 'string' || !/^[a-z_]+$/.test(cfg.merkmal)) f.push('Denken: Merkmal ungültig');
  const ids = [...(Array.isArray(cfg.zusagen) ? cfg.zusagen : []), ...(Array.isArray(cfg.glossar) ? cfg.glossar.map(g => g && g.id) : [])];
  for (const id of ids) if (typeof id !== 'string' || !ID.test(id)) f.push(`Denken: ungültige ID „${id}“`);
  if (new Set(ids).size !== ids.length) f.push('Denken: doppelte ID');
  for (const k of denkenSchluessel(cfg)) if (typeof texte[k] !== 'string' || !texte[k].trim()) f.push(`Denken: Text fehlt: ${k}`);
  // Stilwörter: Fantasy ist der Rückfall (app.js wort()), dort müssen alle Wörter stehen; andere Stile dürfen überschreiben
  const rueckfall = stile && stile.fantasy;
  if (stile) {
    for (const g of Array.isArray(cfg.glossar) ? cfg.glossar : []) {
      if (!g || !g.wort) continue;
      if (!rueckfall || !rueckfall.wort || typeof rueckfall.wort[g.wort] !== 'string') f.push(`Denken: Rückfall-Stil fantasy kennt kein Wort „${g.wort}“`);
    }
  }
  return f;
}

// Erscheint die Karte auf der Startseite? Nur einmal: bis die Seite geöffnet oder „Später“ gewählt wurde, und nur mit
// laufender Quest (vorher ist die Startseite noch gar nicht da). gesehen = Geräte-Merkmal (true) oder etwas anderes.
export function karteOffen(gesehen, hatQuest) {
  return !!hatQuest && gesehen !== true;
}
