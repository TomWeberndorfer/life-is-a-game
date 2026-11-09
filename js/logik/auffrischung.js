// Auffrischung nach langer Pause (Version 159): wann der einmalige Bonus gilt. Einstellungen: daten/auffrischung.js.
// Reine Funktionen ohne Oberfläche, ohne Uhr, werfen nie. Bewusst ohne Import aus kern.js (kern.js importiert diese Datei).
import { AUFFRISCHUNG } from '../daten/auffrischung.js';
import { istAntwort } from './antworten.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const tagMs = k => { const [j, m, t] = k.split('-').map(Number); return Date.UTC(j, m - 1, t); };
// Gültiger Kalendertag (der 31.02. ist keiner).
const istTag = k => {
  if (typeof k !== 'string' || !TAG.test(k)) return false;
  const [j, m, t] = k.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
};

// Einstellungen prüfen (für Tests und Start): Liste lesbarer Fehler, leer = in Ordnung.
export function pruefeAuffrischung(opt = AUFFRISCHUNG, maxXp = null) {
  const f = [];
  if (!opt || typeof opt !== 'object') return ['AUFFRISCHUNG fehlt'];
  if (typeof opt.an !== 'boolean') f.push('AUFFRISCHUNG.an muss true oder false sein');
  if (!Number.isInteger(opt.abTage) || opt.abTage < 2) f.push('AUFFRISCHUNG.abTage muss eine ganze Zahl ab 2 sein');
  if (!Number.isInteger(opt.xp) || opt.xp < 0) f.push('AUFFRISCHUNG.xp muss eine ganze Zahl ab 0 sein');
  else if (Number.isInteger(maxXp) && opt.xp > maxXp) f.push(`AUFFRISCHUNG.xp (${opt.xp}) darf nicht größer sein als ein Treffer (${maxXp})`);
  return f;
}

// Tage ohne Antwort zwischen zwei Tagen (beide ausgeschlossen), ohne die Tage aus `ruhe` (Set gültiger Tage).
// Ungültige Tage oder von ≥ bis → 0.
export function tageOhneAntwort(vonK, bisK, ruhe = new Set()) {
  if (!istTag(vonK) || !istTag(bisK) || vonK >= bisK) return 0;
  const gesamt = Math.round((tagMs(bisK) - tagMs(vonK)) / 864e5) - 1;
  let frei = 0;
  for (const r of ruhe) if (r > vonK && r < bisK) frei++;
  return Math.max(0, gesamt - frei);
}

// Tage, an denen der Held den Bonus bekommen hat (sortiert), bis einschließlich bisK.
//   tage    { 'YYYY-MM-DD': antwort } des Helden
//   ruhe    Ruhetage und Pausentage (Erhalt, Ruhe) des Helden; zählen nicht als Lücke
//   zaehlt  Antworten, die als guter Tag gelten (kern: zaehltAntworten der Quest; Zähler „ja“, Beständigkeit „ja“ und „nein“)
//   bisK    letzter betrachteter Tag (heute), leer = alle
// Regel: Zwischen zwei aufeinanderfolgenden Antworten (jede Antwort zählt als Besuch, auch „War schwer“) liegen mindestens
// opt.abTage Tage ohne Antwort → die Pause ist „offen“. Der erste gute Tag ab da bekommt den Bonus, danach ist sie
// abgeschlossen (einmal je Pause). Vor der allerersten Antwort gibt es keine Pause (wer später beginnt, kehrt nicht zurück).
// Kaputte Eingaben oder opt.an === false → [].
export function auffrischungTage(eingabe, opt = AUFFRISCHUNG) {
  try {
    const { tage, ruhe = [], zaehlt = [], bisK = null } = eingabe && typeof eingabe === 'object' ? eingabe : {}; // null und Nicht-Objekte: wie leer
    if (!opt || opt.an === false || !Number.isInteger(opt.abTage) || opt.abTage < 2) return [];
    if (!tage || typeof tage !== 'object' || Array.isArray(tage)) return [];
    const gut = Array.isArray(zaehlt) ? zaehlt : [];
    const frei = new Set((Array.isArray(ruhe) ? ruhe : [...(ruhe || [])]).filter(istTag));
    const antworten = Object.keys(tage).filter(t => istTag(t) && istAntwort(tage[t]) && (!bisK || t <= bisK)).sort();
    const aus = [];
    let offen = false;
    for (let i = 1; i < antworten.length; i++) {
      if (tageOhneAntwort(antworten[i - 1], antworten[i], frei) >= opt.abTage) offen = true;
      if (offen && gut.includes(tage[antworten[i]])) { aus.push(antworten[i]); offen = false; }
    }
    return aus;
  } catch (e) { return []; }
}

// Gilt für diesen Helden heute die Begrüßung für eine lange Pause? Lücke (Tage ohne Antwort, ohne Ruhetage und Pausen) ≥ abTage.
// Für den Zusatzsatz in „Willkommen zurück“ (ansicht/willkommen.js). luecke = logik/willkommen.js luecke().tage.
export const langePause = (luecke, opt = AUFFRISCHUNG) =>
  !!opt && opt.an !== false && Number.isInteger(luecke) && Number.isInteger(opt.abTage) && opt.abTage >= 2 && luecke >= opt.abTage;
