// Willkommen zurück (Version 98): wann die Seite erscheint. Daten: daten/willkommen.js. Rein, ohne Oberfläche.
import * as K from './kern.js';
import { istAntwort } from './antworten.js'; // Version 141: jede Antwort ist ein Besuch, auch „War schwer“
import { AUFFRISCHUNG } from '../daten/auffrischung.js'; // Version 159: Auffrischung nach langer Pause
import { langePause } from './auffrischung.js';

const plus = (k, n) => { const d = K.ausTagKey(k); d.setDate(d.getDate() + n); return K.tagKey(d); };
const MAX_TAGE = 400; // Sicherheitsnetz gegen kaputte Daten (sehr alte Lücke zählt dann einfach als „lang“)

// Lücke eines Helden: { tage, letzter } – tage = Tage ohne Antwort zwischen der letzten Antwort (oder dem Tag vor dem
// Questbeginn) und heute, beide ausgeschlossen; Ruhetage zählen nicht. Heute schon beantwortet → tage 0.
// Zählweisen ohne Tagesfrage (Rhythmus, Wache) haben nie eine Lücke.
// Heldenmodi (04.11.2026): Pausentage (Erhalt, Ruhe) zählen ebenso nicht, auch heute nicht: wer bewusst pausiert, war nicht weg.
export function luecke(stand, heuteK) {
  if (!stand || !stand.quest || !K.ausTagKey(heuteK)) return { tage: 0, letzter: null };
  // Zählweisen (04.11.2026): Rhythmus und Wache fragen nicht täglich; Tage ohne Eintrag sind dort normal, keine Lücke
  if (!K.zaehlweiseHeute(stand, heuteK).tagesfrage) return { tage: 0, letzter: null };
  const tage = stand.tage && typeof stand.tage === 'object' ? stand.tage : {};
  const vorStart = plus(K.questStart(stand, heuteK), -1);
  if (istAntwort(tage[heuteK])) return { tage: 0, letzter: heuteK };
  const antworten = Object.keys(tage).filter(t => t < heuteK && istAntwort(tage[t])).sort();
  const letzter = antworten.length && antworten[antworten.length - 1] > vorStart ? antworten[antworten.length - 1] : vorStart;
  if (letzter >= heuteK) return { tage: 0, letzter };
  const ruhe = new Set([...K.ruhetageVon(stand), ...K.pausenVon(stand, heuteK)]);
  if (ruhe.has(heuteK)) return { tage: 0, letzter }; // heute in einer Pause: keine Begrüßung
  let n = 0, d = plus(letzter, 1);
  for (let i = 0; d < heuteK && i < MAX_TAGE; i++, d = plus(d, 1)) if (!ruhe.has(d)) n++;
  return { tage: n, letzter };
}

// Rückkehr nach einer Pause mit Datum (09.11.2026, Urlaub und Krankheit): Pausentage zählen nicht als Lücke (luecke), darum käme nach
// einem Urlaub nie die ruhige Seite. Hier der zweite Weg dorthin: Die letzte Pause endete an ihrem Rückkehr-Datum (stand.pausen mit
// rueck, aus logik/heldenmodi.js pausenVon), war mindestens ab Tage lang, und seitdem gab es weder eine Antwort noch eine Wahl
// („neustart“ oder „wiederda“). Wer nach der Rückkehr einfach wieder antwortet, braucht die Seite nicht mehr. Wirft nie.
function rueckkehrFaellig(stand, heuteK, liste, ab) {
  try {
    if (!stand || !stand.quest || !K.ausTagKey(heuteK) || !K.zaehlweiseHeute(stand, heuteK).tagesfrage) return false;
    const pausen = (Array.isArray(stand.pausen) ? stand.pausen : [])
      .filter(p => p && p.rueck === true && typeof p.von === 'string' && typeof p.bis === 'string' && p.bis < heuteK && K.ausTagKey(p.von) && K.ausTagKey(p.bis))
      .sort((a, b) => (a.bis < b.bis ? -1 : 1));
    const p = pausen[pausen.length - 1];
    if (!p) return false;
    // Wer heute schon wieder pausiert (z. B. kam wegen vollem Fokus im Erhalt zurück), wird nicht begrüßt (wie in luecke)
    if (stand.pausen.some(z => z && typeof z.von === 'string' && z.von <= heuteK && (z.bis === null || z.bis >= heuteK))) return false;
    const laenge = Math.round((K.ausTagKey(p.bis) - K.ausTagKey(p.von)) / 864e5) + 1;
    if (laenge < ab) return false;
    const tage = stand.tage && typeof stand.tage === 'object' ? stand.tage : {};
    if (Object.keys(tage).some(t => t > p.bis && t <= heuteK && istAntwort(tage[t]))) return false;
    return !liste.some(e => e && (e.art === 'neustart' || e.art === 'wiederda') && typeof e.tag === 'string' && e.tag > p.bis);
  } catch (e) { return false; }
}

// Erscheint die Seite für diesen Helden? Nur ab abTage Lücke und nur, wenn seit der letzten Antwort noch keine Wahl
// („neustart“ oder „wiederda“) getroffen wurde; oder nach einer Pause mit Rückkehr-Datum (rueckkehrFaellig).
// eintraege = Einträge dieses Helden (spiel.eintraege gefiltert).
export function faellig(stand, heuteK, eintraege, { abTage } = {}) {
  const ab = Number.isInteger(abTage) && abTage > 0 ? abTage : 3;
  const liste = Array.isArray(eintraege) ? eintraege : [];
  if (rueckkehrFaellig(stand, heuteK, liste, ab)) return true;
  const l = luecke(stand, heuteK);
  if (l.tage < ab) return false;
  return !liste.some(e => e && (e.art === 'neustart' || e.art === 'wiederda') && typeof e.tag === 'string' && e.tag > l.letzter);
}

// Lange Pause (Version 159, Auffrischung): Lücke ≥ AUFFRISCHUNG.abTage UND der Held hat vorher schon geantwortet (wer nie
// geantwortet hat, kehrt nicht zurück, er beginnt; gleiche Regel wie beim Bonus in logik/auffrischung.js). Wirft nie.
export function langePauseFuer(stand, heuteK, opt = AUFFRISCHUNG) {
  try {
    const l = luecke(stand, heuteK);
    return langePause(l.tage, opt) && !!l.letzter && istAntwort(stand.tage[l.letzter]);
  } catch (e) { return false; }
}

// Begrüßungssatz (Version 99): 1 … n, fest je Tag und Held (wechselt nicht beim Neuzeichnen). Ungültiges n → 1.
export function satzNr(heuteK, heroId, n) {
  const anzahl = Number.isInteger(n) && n > 0 ? n : 1;
  const text = `${heuteK || ''}|${heroId || ''}`;
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return (h % anzahl) + 1;
}
