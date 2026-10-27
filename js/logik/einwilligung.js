// Einwilligung zur Übertragung der Nutzungsdaten (Version 28). Reine Funktionen, nichts im DOM.
// Gespeichert wird { stand: 'ja' | 'nein', tag: 'JJJJ-MM-TT', version }. Ändert sich der Hinweistext
// wesentlich, wird EINWILLIGUNG.version erhöht → frühere Zustimmungen gelten als „offen“ und werden neu erfragt.
// Grundsatz: Im Zweifel nicht senden (kaputte, fehlende oder veraltete Daten = offen).

export const STAENDE = ['ja', 'nein'];
const TAG = /^\d{4}-\d{2}-\d{2}$/;

export class EinwilligungFehler extends Error {}

function gueltigeVersion(v) { return Number.isInteger(v) && v >= 1; }

// roh: gespeicherter Wert (Objekt, JSON-Text oder null). Liefert immer ein gültiges Objekt.
// { stand: 'offen' | 'ja' | 'nein', tag, version, veraltet }
export function lies(roh, version) {
  if (!gueltigeVersion(version)) throw new EinwilligungFehler(`Ungültige Einwilligungs-Version: ${version}`);
  let d = roh;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
  const offen = { stand: 'offen', tag: null, version, veraltet: false };
  if (!d || typeof d !== 'object' || !STAENDE.includes(d.stand) || !TAG.test(String(d.tag)) || !gueltigeVersion(d.version)) return offen;
  if (d.version < version) return { ...offen, veraltet: true }; // Text hat sich geändert
  return { stand: d.stand, tag: d.tag, version: d.version, veraltet: false };
}

// Neue Entscheidung. Wirft bei ungültigem Stand oder Datum (Programmierfehler, nicht Nutzerfehler).
export function entscheide(stand, tag, version) {
  if (!STAENDE.includes(stand)) throw new EinwilligungFehler(`Unbekannte Entscheidung: ${stand}`);
  if (!TAG.test(String(tag))) throw new EinwilligungFehler(`Ungültiges Datum: ${tag}`);
  if (!gueltigeVersion(version)) throw new EinwilligungFehler(`Ungültige Einwilligungs-Version: ${version}`);
  return { stand, tag, version };
}

export const darfSenden = e => !!e && e.stand === 'ja';
export const istOffen = e => !e || e.stand === 'offen';
