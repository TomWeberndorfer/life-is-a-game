// Stützgewohnheiten (Schritt „Zähler“, 31.10.2026): Neben-Teilziele einer Quest anlegen, ändern, umsortieren, archivieren,
// abhaken und ihren Fortschritt lesen. Reine Funktionen auf dem Heldenstand im Format von kern.js; Fehler als StuetzeFehler
// mit lesbarer Meldung. Modell und Bereinigen: logik/teilziele.js, Grenzen: daten/zielarten.js (TEILZIELE).
//
// Psychologie (Entscheidungen 3, 4, 12, 13): Nur das Haupt-Teilziel entscheidet den Kampf. Stützgewohnheiten erleichtern das
// Hauptverhalten (z. B. Schlaf fürs Training), bringen keine XP und keinen Bossschaden, damit nicht Haken gesammelt werden
// statt das Kernverhalten zu üben. Sie werden erst frei, wenn das Hauptverhalten gefestigt ist (nach TEILZIELE.nebenAbSiegen
// Siegen): erst eine Sache, dann die nächste.
import { ZIELARTEN, TEILZIELE } from '../daten/zielarten.js';
import * as K from './kern.js';
import { anzahlFuer, bereinigeName, bereinigeTeilziele, freieId, grenzen, setzeAnzahlAb } from './teilziele.js';

export class StuetzeFehler extends Error {}

const kopie = s => JSON.parse(JSON.stringify(s));
const plusTage = (k, n) => { const d = K.ausTagKey(k); d.setDate(d.getDate() + n); return K.tagKey(d); };

// Sind Stützgewohnheiten für diesen Helden frei? (Siege des Haupt-Teilziels)
export function nebenFrei(stand, cfg = TEILZIELE) {
  return !!(stand && stand.quest) && (stand.siege || []).length >= cfg.nebenAbSiegen;
}

// Runde, zu der heute gehört (nach einem Sieg heute: die gewonnene Runde, nicht die von morgen).
function rundeVonHeute(stand, heuteK) {
  const { runden: l, aktuell } = K.runden(stand, heuteK);
  return l.find(r => r.von <= heuteK && r.bis >= heuteK) || aktuell;
}

function liste(stand) {
  return bereinigeTeilziele(stand.quest.teilziele, stand.quest.anzahl);
}
function nebenListe(l) { return l.filter(t => !t.haupt && !t.archiviert); }
function mitListe(stand, l) {
  const s = kopie(stand);
  s.quest.teilziele = l;
  s.quest.anzahl = anzahlFuer(l[0]);
  return s;
}
function brauchtQuest(stand) { if (!stand || !stand.quest) throw new StuetzeFehler('Es gibt noch keine Quest.'); }
function finde(l, id) {
  const t = l.find(x => x.id === id && !x.haupt && !x.archiviert);
  if (!t) throw new StuetzeFehler('Diese Stützgewohnheit gibt es nicht (mehr).');
  return t;
}

// Eingabe prüfen: { name, zeitraum, anzahl } → { ok, fehler: { feld: text }, werte }. mitZeitraum false: Zeitraum fest.
export function stuetzePruefen(eingabe, { mitZeitraum = true, zeitraum: festerZeitraum = null } = {}, arten = ZIELARTEN, cfg = TEILZIELE) {
  const art = arten[cfg.standardArt];
  const fehler = {};
  const roh = eingabe && eingabe.name;
  const name = bereinigeName(roh, cfg);
  if (!name) fehler.name = 'Bitte gib der Stützgewohnheit einen Namen.';
  else if (typeof roh === 'string' && roh.replace(/\s+/g, ' ').trim().length > cfg.nameMax) fehler.name = `Höchstens ${cfg.nameMax} Zeichen.`;
  const zeitraum = mitZeitraum ? (eingabe && eingabe.zeitraum) : festerZeitraum;
  if (!art.zeitraeume.includes(zeitraum)) fehler.zeitraum = 'Bitte wähle, ob je Runde oder insgesamt gezählt wird.';
  const g = grenzen(art, art.zeitraeume.includes(zeitraum) ? zeitraum : art.zeitraeume[0]);
  const anzahl = Number(eingabe && eingabe.anzahl);
  if (!Number.isInteger(anzahl) || anzahl < g.min || anzahl > g.max) fehler.anzahl = `Bitte eine Zahl von ${g.min} bis ${g.max} wählen.`;
  return { ok: !Object.keys(fehler).length, fehler, werte: { name, zeitraum, anzahl } };
}

// Runde, ab der ein neues Teilziel zählt: ab der nächsten Runde (TEILZIELE.neuAbNaechsterRunde), außer die aktuelle Runde
// hat noch nicht begonnen (nach einem Sieg heute beginnt sie morgen; dann zählt es ab ihr).
export function startRundeNeu(stand, heute, cfg = TEILZIELE) {
  const heuteK = K.tagKey(heute);
  const r = K.runden(stand, heuteK).aktuell;
  return cfg.neuAbNaechsterRunde && r.von <= heuteK ? r.nr + 1 : r.nr;
}

// Neue Stützgewohnheit anlegen. Liefert { stand, teilziel }.
export function stuetzeAnlegen(stand, eingabe, heute, cfg = TEILZIELE) {
  brauchtQuest(stand);
  if (!nebenFrei(stand, cfg)) throw new StuetzeFehler(`Stützgewohnheiten gibt es ab ${cfg.nebenAbSiegen} Siegen.`);
  const l = liste(stand);
  if (1 + nebenListe(l).length >= cfg.max) throw new StuetzeFehler(`Höchstens ${cfg.max} Teilziele je Quest.`);
  const p = stuetzePruefen(eingabe, {}, ZIELARTEN, cfg);
  if (!p.ok) throw new StuetzeFehler(Object.values(p.fehler).join(' '));
  const id = freieId(new Set(l.map(t => t.id)));
  const tz = { id, art: cfg.standardArt, haupt: false, anzahl: p.werte.anzahl, zeitraum: p.werte.zeitraum, name: p.werte.name, seit: startRundeNeu(stand, heute, cfg) };
  const aktiv = l.filter(t => !t.archiviert), archiv = l.filter(t => t.archiviert);
  const s = mitListe(stand, [...aktiv, tz, ...archiv]);
  return { stand: s, teilziel: s.quest.teilziele.find(t => t.id === id) };
}

// Name und Anzahl ändern (der Zeitraum bleibt). Anzahl „je Runde“ gilt wie beim Haupt-Teilziel ab der nächsten Runde,
// sofort nur, wenn in der laufenden Runde noch nicht abgehakt wurde oder die Gewohnheit noch nicht begonnen hat.
// „Insgesamt“ hat keine Runden: gilt sofort. Liefert { stand, geaendert: [...], anzahlAb }.
export function stuetzeAendern(stand, id, eingabe, heute, cfg = TEILZIELE) {
  brauchtQuest(stand);
  const l = liste(stand);
  const tz = finde(l, id);
  const p = stuetzePruefen(eingabe, { mitZeitraum: false, zeitraum: tz.zeitraum }, ZIELARTEN, cfg);
  if (!p.ok) throw new StuetzeFehler(Object.values(p.fehler).join(' '));
  const geaendert = [];
  if (tz.name !== p.werte.name) { tz.name = p.werte.name; geaendert.push('name'); }
  let anzahlAb = null;
  const heuteK = K.tagKey(heute);
  const r = rundeVonHeute(stand, heuteK);
  const begonnen = !tz.seit || tz.seit <= r.nr;
  const hakenRunde = Object.entries(stand.haken || {}).some(([t, ids]) => t >= r.von && t <= r.bis && ids.includes(id));
  const sofort = tz.zeitraum !== 'runde' || !begonnen || (cfg.anzahlSofortOhneTreffer && !hakenRunde);
  if (setzeAnzahlAb(tz, p.werte.anzahl, sofort ? (tz.zeitraum === 'runde' && begonnen ? r.nr : 1) : r.nr + 1, ZIELARTEN, cfg)) {
    geaendert.push('anzahl');
    anzahlAb = sofort ? 'sofort' : 'naechsteRunde';
  }
  return { stand: geaendert.length ? mitListe(stand, l) : stand, geaendert, anzahlAb };
}

// Reihenfolge ändern: richtung −1 = nach oben, +1 = nach unten. Das Haupt-Teilziel bleibt immer vorne (Entscheidung 8).
// Am Rand: unverändert (kein Fehler, der Knopf ist dort ohnehin aus).
export function stuetzeVerschieben(stand, id, richtung) {
  brauchtQuest(stand);
  if (richtung !== -1 && richtung !== 1) throw new StuetzeFehler('Ungültige Richtung.');
  const l = liste(stand);
  finde(l, id);
  const neben = nebenListe(l);
  const i = neben.findIndex(t => t.id === id), j = i + richtung;
  if (j < 0 || j >= neben.length) return { stand, bewegt: false };
  [neben[i], neben[j]] = [neben[j], neben[i]];
  return { stand: mitListe(stand, [l[0], ...neben, ...l.filter(t => t.archiviert)]), bewegt: true };
}

// Archivieren (Entscheidung 6a): verschwindet aus der Quest, bleibt mit seinen Haken im Logbuch. Das Haupt-Teilziel nie.
export function stuetzeArchivieren(stand, id, heute) {
  brauchtQuest(stand);
  const l = liste(stand);
  if (l[0].id === id) throw new StuetzeFehler('Das Haupt-Teilziel lässt sich nicht archivieren.');
  const tz = finde(l, id);
  tz.archiviert = K.tagKey(heute);
  const rest = l.filter(t => t !== tz);
  return { stand: mitListe(stand, [...rest.filter(t => !t.archiviert), ...rest.filter(t => t.archiviert), tz]) };
}

// Heute abhaken oder Haken zurücknehmen. Nur heute (kein Nachtragen), nur begonnene, aktive Stützgewohnheiten.
// Keine XP (Entscheidung 4). Liefert { stand, an }.
export function hakenUmschalten(stand, heute, id) {
  brauchtQuest(stand);
  const l = liste(stand);
  const tz = finde(l, id);
  const heuteK = K.tagKey(heute);
  const r = rundeVonHeute(stand, heuteK);
  if (tz.seit && tz.seit > r.nr) throw new StuetzeFehler('Diese Stützgewohnheit beginnt erst mit der nächsten Runde.');
  const s = kopie(stand);
  s.haken = s.haken || {};
  const tag = s.haken[heuteK] || [];
  const an = !tag.includes(id);
  if (an && tag.length >= K.HAKEN_JE_TAG) throw new StuetzeFehler('Für heute ist genug abgehakt.');
  s.haken[heuteK] = an ? [...tag, id] : tag.filter(x => x !== id);
  if (!s.haken[heuteK].length) delete s.haken[heuteK];
  return { stand: s, an };
}

// Fortschritt aller aktiven Stützgewohnheiten für die Anzeige. Wirft nie (kaputter Stand → leere Liste).
// Je Eintrag: { id, name, zeitraum, ziel, geschafft, heute, aktiv, abTag, erreicht, naechsteAnzahl }
//   aktiv     false = beginnt erst (abTag = erster Tag, falls bekannt)
//   geschafft je Runde: abgehakte Tage der heutigen Runde; insgesamt: alle abgehakten Tage
export function stuetzenStand(stand, heute) {
  try {
    if (!stand || !stand.quest) return [];
    const heuteK = K.tagKey(heute);
    const { runden: l, aktuell } = K.runden(stand, heuteK);
    const r = l.find(x => x.von <= heuteK && x.bis >= heuteK) || aktuell;
    const haken = stand.haken || {};
    const tageVon = id => Object.keys(haken).filter(t => t <= heuteK && Array.isArray(haken[t]) && haken[t].includes(id));
    return nebenListe(liste(stand)).map(tz => {
      const aktiv = !tz.seit || tz.seit <= r.nr;
      // Erster Tag einer späteren Runde: nur bekannt, wenn sie direkt auf die laufende folgt (sonst verschieben Siege)
      const abTag = aktiv ? null : tz.seit === aktuell.nr ? aktuell.von : tz.seit === r.nr + 1 ? plusTage(r.bisMax, 1) : null;
      const tage = tageVon(tz.id);
      const geschafft = tz.zeitraum === 'runde' ? tage.filter(t => t >= r.von && t <= r.bis).length : tage.length;
      const ziel = tz.zeitraum === 'runde' ? anzahlFuer(tz, r.nr) : anzahlFuer(tz);
      const naechste = tz.zeitraum === 'runde' ? anzahlFuer(tz, r.nr + 1) : ziel;
      return {
        id: tz.id, name: tz.name || '', zeitraum: tz.zeitraum, ziel, geschafft: aktiv ? geschafft : 0,
        heute: aktiv && tage.includes(heuteK), aktiv, abTag, erreicht: aktiv && geschafft >= ziel,
        naechsteAnzahl: naechste !== ziel ? naechste : null
      };
    });
  } catch (e) {
    console.warn('Stützgewohnheiten:', e.message);
    return [];
  }
}
