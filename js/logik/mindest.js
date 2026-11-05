// Mindestaufgabe im Erhalt (04.11.2026, zweiter Teil der Heldenmodi, Entscheidungen Abschnitt 36): „Was ist das Kleinste,
// das noch zählt?“ Anlegen, ändern, entfernen, abhaken und der Stand für die Anzeige. Reine Funktionen auf dem Spielstand,
// Fehler als MindestFehler mit lesbarer Meldung. Regeln: MINDEST in daten/heldenmodi.js; Bereinigen, XP-Tage und Zeitraum
// in logik/heldenmodi.js (dort ohne Abhängigkeit von helden.js, weil helden.js sie zum Laden braucht).
//
// Regeln (Entscheidungen 04.11.2026):
// - Zeitraum Woche · 2 Wochen · Monat, gezählt ab dem Wechsel in den Erhalt (3a). Nach Fokus → Erhalt beginnt er neu, die
//   Aufgabe bleibt gespeichert (1a).
// - XP wie ein Treffer ohne Bonus (4a), aber nur bis zur Anzahl je Zeitraum (2). Mehr abhaken geht, zählt mit, ohne XP.
// - Höchstens ein Haken je Tag (3), nur heute (kein Nachtragen), nur an Tagen im Erhalt; in der Ruhe gilt sie nicht (4).
// - „Zählt auch für“ nur mit einer Stützgewohnheit desselben Helden, keine Voreinstellungen im Code (5). Der Haken setzt die
//   Stützgewohnheit mit; war sie heute schon abgehakt, bleibt sie, wie sie ist (keine Doppelzählung). Zurücknehmen nimmt nur
//   zurück, was der Haken selbst gesetzt hat.
// - Die XP eines Hakens werden beim Abhaken festgehalten (haken[tag].xp): spätere Änderungen an Anzahl oder Zeitraum ändern
//   vergangene XP nicht (wie kern.js: Rückgängig und Neuladen erzeugen nie doppelte oder fehlende XP).
import { MINDEST } from '../daten/heldenmodi.js';
import * as H from './helden.js';
import * as HM from './heldenmodi.js';
import * as K from './kern.js';
import * as S from './stuetzen.js';

export class MindestFehler extends Error {
  constructor(code, text, info = {}) { super(text); this.code = code; Object.assign(this, info); }
}

const heldDa = (spiel, heroId) => !!(spiel && Array.isArray(spiel.helden) && spiel.helden.some(h => h && h.heroId === heroId));
const eintragVon = (spiel, heroId, opt) => HM.bereinigeMindest(spiel && spiel.mindest, { opt })[heroId] || null;
function mitEintrag(spiel, heroId, eintrag, opt) {
  const alle = HM.bereinigeMindest(spiel.mindest, { heroIds: new Set(spiel.helden.map(h => h.heroId)), opt });
  if (eintrag && (eintrag.aufgabe || Object.keys(eintrag.haken || {}).length)) alle[heroId] = eintrag;
  else delete alle[heroId];
  return { ...spiel, mindest: alle };
}

// Stützgewohnheiten des Helden für „Zählt auch für“: [{ id, name, aktiv }]. Wirft nie.
export function stuetzenFuer(spiel, heroId, heute) {
  if (!heldDa(spiel, heroId)) return [];
  return S.stuetzenStand(H.ansicht(spiel, heroId), heute).map(x => ({ id: x.id, name: x.name, aktiv: x.aktiv }));
}

// Eingabe prüfen: { taetigkeit, anzahl, zeitraum, zaehltFuer } → { ok, fehler: { feld: text }, werte }.
// stuetzeIds: erlaubte Stützgewohnheiten (desselben Helden). zaehltFuer leer/null = nur für sich.
export function mindestPruefen(eingabe, stuetzeIds = [], opt = MINDEST) {
  const e = eingabe || {};
  const fehler = {};
  const taetigkeit = HM.bereinigeTaetigkeit(e.taetigkeit, opt);
  if (!taetigkeit) fehler.taetigkeit = 'Bitte schreib auf, was das Kleinste ist, das noch zählt.';
  else if (typeof e.taetigkeit === 'string' && e.taetigkeit.replace(/\s+/g, ' ').trim().length > opt.taetigkeitMax) fehler.taetigkeit = `Höchstens ${opt.taetigkeitMax} Zeichen.`;
  const r = opt.zeitraeume[e.zeitraum];
  if (!r) fehler.zeitraum = 'Bitte wähle einen Zeitraum.';
  const anzahl = Number(e.anzahl);
  const max = r ? r.max : Math.max(...Object.values(opt.zeitraeume).map(x => x.max));
  if (!Number.isInteger(anzahl) || anzahl < opt.anzahlMin || anzahl > max) fehler.anzahl = `Bitte eine Zahl von ${opt.anzahlMin} bis ${max} wählen.`;
  const zaehltFuer = e.zaehltFuer ? String(e.zaehltFuer) : null;
  if (zaehltFuer && !stuetzeIds.includes(zaehltFuer)) fehler.zaehltFuer = 'Diese Stützgewohnheit gibt es bei diesem Helden nicht (mehr).';
  return { ok: !Object.keys(fehler).length, fehler, werte: { taetigkeit, anzahl, zeitraum: e.zeitraum, zaehltFuer } };
}

// Anlegen oder ändern. Liefert { spiel, aufgabe } oder wirft MindestFehler (code: held, eingabe mit info.fehler).
// Die Haken bleiben; eine geänderte Anzahl gilt für die nächsten Haken.
export function mindestSetzen(spiel, heroId, eingabe, heute, opt = MINDEST) {
  if (!heldDa(spiel, heroId)) throw new MindestFehler('held', 'Unbekannter Held.');
  const p = mindestPruefen(eingabe, stuetzenFuer(spiel, heroId, heute).map(x => x.id), opt);
  if (!p.ok) throw new MindestFehler('eingabe', Object.values(p.fehler).join(' '), { fehler: p.fehler });
  const alt = eintragVon(spiel, heroId, opt);
  const aufgabe = HM.bereinigeAufgabe(p.werte, opt);
  return { spiel: mitEintrag(spiel, heroId, { aufgabe, haken: alt ? alt.haken : {} }, opt), aufgabe };
}

// Entfernen: die Aufgabe verschwindet, die Haken (und ihre XP) bleiben. Ohne Aufgabe: unverändert.
export function mindestEntfernen(spiel, heroId, opt = MINDEST) {
  if (!heldDa(spiel, heroId)) throw new MindestFehler('held', 'Unbekannter Held.');
  const alt = eintragVon(spiel, heroId, opt);
  if (!alt || !alt.aufgabe) return { spiel, geaendert: false };
  return { spiel: mitEintrag(spiel, heroId, { haken: alt.haken }, opt), geaendert: true };
}

// Stand für die Anzeige. Wirft nie (kaputter Stand → gilt: false).
// { gilt (gewählter Modus hat eine Mindestaufgabe), aufgabe, seit, startetMorgen, aktiv (heute abhakbar), periode, geschafft,
//   ziel, heute (heute abgehakt), erreicht, zaehltFuerName }
export function mindestStand(spiel, heroId, heute, opt = MINDEST) {
  const leer = { gilt: false, aufgabe: null, seit: null, startetMorgen: false, aktiv: false, periode: null, geschafft: 0, ziel: 0, heute: false, erreicht: false, zaehltFuerName: null };
  try {
    if (!heldDa(spiel, heroId)) return leer;
    const heuteK = K.tagKey(heute);
    const seit = HM.erhaltSeit(spiel, heroId, opt);
    if (!seit) return leer;
    const e = eintragVon(spiel, heroId, opt);
    const aufgabe = e && e.aufgabe ? e.aufgabe : null;
    const aus = { ...leer, gilt: true, aufgabe, seit, startetMorgen: seit > heuteK };
    if (!aufgabe || aus.startetMorgen) return aus;
    const periode = HM.periodeVon(seit, aufgabe.zeitraum, heuteK, opt);
    const tage = Object.keys(e.haken).filter(t => periode && t >= periode.von && t <= heuteK);
    const st = aufgabe.zaehltFuer ? stuetzenFuer(spiel, heroId, heute).find(x => x.id === aufgabe.zaehltFuer) : null;
    return { ...aus, aktiv: !!periode, periode, geschafft: tage.length, ziel: aufgabe.anzahl, heute: tage.includes(heuteK), erreicht: tage.length >= aufgabe.anzahl, zaehltFuerName: st ? st.name : null };
  } catch (err) {
    console.warn('Mindestaufgabe:', err.message);
    return leer;
  }
}

// Stützgewohnheit heute setzen oder lösen; liefert das geänderte Spiel oder null (nicht möglich, z. B. beginnt erst).
function stuetzeSchalten(spiel, heroId, heute, tzId) {
  try {
    const r = S.hakenUmschalten(H.ansicht(spiel, heroId), heute, tzId);
    return { ...spiel, helden: spiel.helden.map(h => (h.heroId === heroId ? { ...h, haken: r.stand.haken } : h)) };
  } catch (e) {
    if (!(e instanceof S.StuetzeFehler)) console.warn('Mindestaufgabe (Stützgewohnheit):', e.message);
    return null;
  }
}
const stuetzeHeute = (spiel, heroId, heute, tzId) => S.stuetzenStand(H.ansicht(spiel, heroId), heute).some(x => x.id === tzId && x.heute);

// Heute abhaken oder den Haken von heute zurücknehmen. Liefert { spiel, an, xp, stuetze, erreicht } oder wirft MindestFehler
// (code: held, keine = keine Aufgabe, modus = heute nicht im Erhalt). xp: dieser Haken gab XP. stuetze: Stützgewohnheit mitgesetzt.
export function mindestAbhaken(spiel, heroId, heute, opt = MINDEST) {
  if (!heldDa(spiel, heroId)) throw new MindestFehler('held', 'Unbekannter Held.');
  const st = mindestStand(spiel, heroId, heute, opt);
  if (!st.gilt || !st.aufgabe) throw new MindestFehler('keine', 'Für diesen Helden gibt es keine Mindestaufgabe.');
  if (!st.aktiv) throw new MindestFehler('modus', 'Die Mindestaufgabe gilt erst ab dem Wechsel in den Erhalt.');
  const heuteK = K.tagKey(heute);
  const e = eintragVon(spiel, heroId, opt);
  const haken = { ...e.haken };
  let s = spiel;
  const tz = st.aufgabe.zaehltFuer;
  if (st.heute) {
    const alt = haken[heuteK];
    delete haken[heuteK];
    if (alt.stuetze && tz && stuetzeHeute(s, heroId, heute, tz)) s = stuetzeSchalten(s, heroId, heute, tz) || s;
    return { spiel: mitEintrag(s, heroId, { aufgabe: e.aufgabe, haken }, opt), an: false, xp: false, stuetze: false, erreicht: st.geschafft - 1 >= st.ziel };
  }
  const xp = st.geschafft < st.ziel;
  let stuetze = false;
  if (tz && !stuetzeHeute(s, heroId, heute, tz)) {
    const neu = stuetzeSchalten(s, heroId, heute, tz);
    if (neu) { s = neu; stuetze = true; }
  }
  haken[heuteK] = { xp, stuetze };
  return { spiel: mitEintrag(s, heroId, { aufgabe: e.aufgabe, haken }, opt), an: true, xp, stuetze, erreicht: st.geschafft + 1 >= st.ziel };
}
