// Ruhetag (Version 90): Regeln in daten/ruhetag.js, Wirkung auf die Runde in logik/kern.js (runden, ruhetageVon).
// Reine Funktionen ohne Zustand; liefern immer eine Kopie des Spielstands. Ein Ruhetag ist ein Eintrag der Art „ruhetag“
// in spiel.eintraege (ein Tag je Eintrag und Held). Ändert nie XP, Siege oder Gegnerkraft, nur die Länge der Runde.
import * as K from './kern.js';
import * as EN from './eintraege.js';
import { ansicht, heldVon } from './helden.js';

export class RuhetagFehler extends Error {}
const ART = 'ruhetag';
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const gueltigerTag = t => TAG.test(String(t)) && !!K.ausTagKey(t);
const plus = (k, n) => { const d = K.ausTagKey(k); d.setDate(d.getDate() + n); return K.tagKey(d); };
const ganz = (x, min, max, std) => (Number.isInteger(x) && x >= min && x <= max ? x : std);

// Regeln mit sicheren Grenzen (kaputte Einstellung → Standard statt Absturz).
export function regeln(roh) {
  const r = roh && typeof roh === 'object' ? roh : {};
  return {
    an: r.an !== false,
    jeRunde: ganz(r.jeRunde, 1, 3, 1),
    vorausTage: ganz(r.vorausTage, 0, 30, 7),
    zurueckTage: ganz(r.zurueckTage, 0, K.NACHTRAG_MAX_GRENZE, 3)
  };
}

// Lesbare Fehler der Einstellung (für den Registertest). Wirft nie.
export function pruefeRegeln(roh) {
  if (!roh || typeof roh !== 'object') return ['RUHETAG fehlt'];
  const f = [];
  if (typeof roh.an !== 'boolean') f.push('an muss true oder false sein');
  if (!(Number.isInteger(roh.jeRunde) && roh.jeRunde >= 1 && roh.jeRunde <= 3)) f.push('jeRunde muss 1 bis 3 sein');
  if (!(Number.isInteger(roh.vorausTage) && roh.vorausTage >= 0 && roh.vorausTage <= 30)) f.push('vorausTage muss 0 bis 30 sein');
  if (!(Number.isInteger(roh.zurueckTage) && roh.zurueckTage >= 0 && roh.zurueckTage <= K.NACHTRAG_MAX_GRENZE)) f.push(`zurueckTage muss 0 bis ${K.NACHTRAG_MAX_GRENZE} sein`);
  if (roh.alleVorwahl !== undefined && typeof roh.alleVorwahl !== 'boolean') f.push('alleVorwahl muss true oder false sein');
  return f;
}

// Tage, die sich wählen lassen (älteste zuerst): [{ tag, abstand }] mit abstand < 0 = zurück, 0 = heute, > 0 = voraus.
export function waehlbareTage(heute, roh) {
  const r = regeln(roh);
  const h = K.tagKey(heute);
  const aus = [];
  for (let i = -r.zurueckTage; i <= r.vorausTage; i++) aus.push({ tag: plus(h, i), abstand: i });
  return aus;
}

// Ruhetage eines Helden (sortiert), optional nur ab einem Tag.
export function ruhetageVon(spiel, heroId, abTag = null) {
  return [...new Set(EN.eintraegeVon(spiel, heroId, { art: ART }).map(e => e.tag).filter(t => !abTag || t >= abTag))].sort();
}

// Runde, zu der ein Tag gehört (auch künftig: gerechnet ohne weitere Siege). null, wenn es keine gibt.
function rundeVon(a, tag, heuteK) {
  try {
    const { runden } = K.runden(a, tag > heuteK ? tag : heuteK);
    return runden.find(r => r.von <= tag && r.bis >= tag) || null;
  } catch (e) { return null; }
}

// Lässt sich an `tag` für diesen Helden ein Ruhetag setzen? Liefert { ok, grund, vorhanden, runde }.
// grund: 'held' | 'tag' | 'vorStart' | 'ohneZeit' (Wache) | 'ausserhalb' | 'gesetzt' | 'angewendet' | 'gewonnen' | 'vorbei' | 'kontingent' | null.
// Nachträglich nur in der laufenden Runde: eine schon beendete Runde lässt sich nicht mehr verlängern (sonst würden
// Treffer der laufenden Runde in die alte rutschen). 'vorbei' = Tag einer beendeten Runde ohne Sieg.
// vorhanden: schon gesetzter Ruhetag dieser Runde (bei 'kontingent'). Wirft nie.
export function status(spiel, heroId, tag, heute, roh) {
  const r = regeln(roh);
  const heuteK = K.tagKey(heute);
  const nein = (grund, extra = {}) => ({ ok: false, grund, vorhanden: null, runde: null, ...extra });
  if (!spiel || !heldVon(spiel, heroId)) return nein('held');
  if (!gueltigerTag(tag)) return nein('tag');
  if (tag < plus(heuteK, -r.zurueckTage) || tag > plus(heuteK, r.vorausTage)) return nein('ausserhalb');
  const a = ansicht(spiel, heroId);
  if (!a.quest) return nein('held');
  if (tag < K.questStart(a, heuteK)) return nein('vorStart');
  if (K.zaehlweiseHeute(a, heuteK).rundeOffen) return nein('ohneZeit'); // Wache (04.11.2026): Runde ohne Zeitlimit, nichts zu verlängern
  if ((a.ruhetage || []).includes(tag)) return nein('gesetzt');
  if (a.tage[tag] === 'ja') return nein('angewendet');
  const runde = rundeVon(a, tag, heuteK);
  if (!runde) return nein('tag');
  const info = { von: runde.von, bis: runde.bisMax, nr: runde.nr };
  if (runde.sieg && runde.sieg <= heuteK) return nein('gewonnen', { runde: info });
  if (tag <= heuteK && runde.bis < heuteK) return nein('vorbei', { runde: info });
  if (runde.ruhetage.length >= r.jeRunde) return nein('kontingent', { vorhanden: runde.ruhetage[0], runde: info });
  return { ok: true, grund: null, vorhanden: null, runde: info };
}

// Ruhetag für mehrere Helden setzen (Entscheidung 4c: alle vorgewählt, einzelne abwählbar). Teilerfolg ist erlaubt.
// Liefert { spiel, gesetzt: [{ heroId, bis }], abgelehnt: [{ heroId, grund }] }; bis = neues Rundenende.
// Wirft RuhetagFehler, wenn keine Helden gewählt sind, die Funktion aus ist oder der Tag ungültig ist.
export function setzen(spiel, heroIds, tag, heute, roh, opt) {
  const r = regeln(roh);
  if (!r.an) throw new RuhetagFehler('Ruhetage sind gerade ausgeschaltet.');
  const ids = [...new Set(Array.isArray(heroIds) ? heroIds : [heroIds])].filter(Boolean);
  if (!ids.length) throw new RuhetagFehler('Bitte wähle mindestens einen Helden.');
  if (!gueltigerTag(tag)) throw new RuhetagFehler('Ungültiger Tag.');
  if (!opt || !opt.arten || !opt.arten[ART]) throw new RuhetagFehler('Die Art „ruhetag“ fehlt.');
  let s = spiel;
  const gesetzt = [], abgelehnt = [];
  for (const id of ids) {
    const st = status(s, id, tag, heute, r);
    if (!st.ok) { abgelehnt.push({ heroId: id, grund: st.grund, vorhanden: st.vorhanden }); continue; }
    const a = ansicht(s, id);
    const runde = rundeVon(a, tag, K.tagKey(heute));
    // Feste ID (Tests) je Held eindeutig machen; sonst erzeugt eintragHinzufuegen eine neue
    const eid = opt.id ? `${opt.id}-${gesetzt.length + abgelehnt.length}` : undefined;
    s = EN.eintragHinzufuegen(s, id, { art: ART }, heute, { ...opt, id: eid, tag, gegner: runde ? runde.gegner : null }).spiel;
    const neu = rundeVon(ansicht(s, id), tag, K.tagKey(heute));
    gesetzt.push({ heroId: id, bis: neu ? neu.bisMax : null });
  }
  return { spiel: s, gesetzt, abgelehnt };
}

// Lässt sich ein gesetzter Ruhetag noch entfernen? Nur in der laufenden Runde oder später (eine beendete Runde bleibt,
// wie sie war: sonst würde sie kürzer und die laufende Runde früher beginnen). Wirft nie.
export function entfernbar(spiel, heroId, tag, heute, roh) {
  const r = regeln(roh);
  const heuteK = K.tagKey(heute);
  if (!gueltigerTag(tag) || tag < plus(heuteK, -r.zurueckTage)) return false;
  if (tag >= heuteK) return true;
  try {
    const a = ansicht(spiel, heroId);
    if (!a.quest) return false;
    const { aktuell } = K.runden(a, heuteK);
    return tag >= aktuell.von;
  } catch (e) { return false; }
}

// Ruhetag eines Helden entfernen (nur im wählbaren Bereich; ältere bleiben, damit die Vergangenheit nicht kippt).
export function entfernen(spiel, heroId, tag, heute, roh) {
  const r = regeln(roh);
  const heuteK = K.tagKey(heute);
  if (!gueltigerTag(tag)) throw new RuhetagFehler('Ungültiger Tag.');
  if (tag < plus(heuteK, -r.zurueckTage)) throw new RuhetagFehler('Dieser Ruhetag liegt zu weit zurück.');
  const da = EN.eintraegeVon(spiel, heroId, { art: ART, tag });
  if (!da.length) throw new RuhetagFehler('Hier ist kein Ruhetag eingetragen.');
  if (!entfernbar(spiel, heroId, tag, heute, r)) throw new RuhetagFehler('Diese Runde ist schon vorbei.');
  let s = spiel;
  for (const e of da) s = EN.eintragLoeschen(s, e.id);
  return s;
}

// Nach einem „Ja“ an diesem Tag: der Tag zählt als Treffer, der Ruhetag entfällt (Kontingent wieder frei).
// Ohne Ruhetag an dem Tag unverändert zurück (gleiches Objekt). Wirft nie.
export function nachJa(spiel, heroId, tag) {
  try {
    const da = EN.eintraegeVon(spiel, heroId, { art: ART, tag });
    if (!da.length) return spiel;
    let s = spiel;
    for (const e of da) s = EN.eintragLoeschen(s, e.id);
    return s;
  } catch (e) { return spiel; }
}
