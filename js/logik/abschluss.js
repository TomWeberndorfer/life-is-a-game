// Kettenende: Abschluss und Weitergehen (Version 169, 09.11.2026): reine Funktionen ohne Oberfläche und ohne Uhr.
// Regeln und Wege als Daten: daten/abschluss.js. Oberfläche: ansicht/abschluss.js.
//
// Der Auslöser ist abgeleitet, nicht gespeichert: Kettenende = Zahl der Siege >= Länge der Kette (K.kette). Gespeichert wird nur
// die Entscheidung der Person (spiel.abschluss, je Held). Dadurch gilt automatisch:
// - Altbestand: Wer den letzten Gegner schon besiegt hat, aber keinen Eintrag, bekommt die Seite einmal angeboten.
// - Wächst die Kette (ketteAuffrischen in helden.js), ist es kein Kettenende mehr; beim nächsten Ende ist der Bezug ein anderer.
// - Rückgängig am Siegtag ändert nichts: ein Sieg bleibt (kern.js), und am Siegtag selbst zeigt die App die Seite ohnehin nicht.
// Bewusst keine Abhängigkeit von logik/helden.js (helden.js importiert diese Datei zum Laden des Spielstands).
import { ABSCHLUSS } from '../daten/abschluss.js';
import { HELDENMODI } from '../daten/heldenmodi.js';
import { tageMit } from './antworten.js';
import * as B from './bestaendigkeit.js';
import { entwicklung } from './entwicklung.js';
import * as HM from './heldenmodi.js';
import * as K from './kern.js';
import { zaehltAntworten } from './teilziele.js';

const ID = /^[a-z0-9-]{1,40}$/;

export class AbschlussFehler extends Error {
  constructor(code, text, info = {}) { super(text); this.code = code; Object.assign(this, info); }
}

// ---------- Auslöser ----------
// Register der Auslöser. Jeder: pruefe(stand, heuteK) → { erreicht, bezug, seit } mit
//   erreicht  ist die Bedingung erfüllt?
//   bezug     ganze Zahl ≥ 1, an der die Entscheidung hängt (Kettenlänge); ändert sie sich, ist eine frühere Entscheidung hinfällig
//   seit      Tag, an dem sie erfüllt wurde (null, solange nicht erreicht)
// stand = Heldenansicht (nur quest und siege werden gelesen). Wirft nie. Später können Teil- und Messziele hier einen eigenen
// Auslöser eintragen; die Entscheidung und die Seite bleiben dieselben.
const NICHT = Object.freeze({ erreicht: false, bezug: 1, seit: null });
export const AUSLOESER = Object.freeze({
  kettenende: Object.freeze({
    pruefe(stand, heuteK) {
      try {
        if (!stand || !stand.quest || !K.ausTagKey(heuteK)) return NICHT;
        const laenge = K.kette(stand).length;
        // Nur Siege bis heute (Testprofil mit Zeitsprung zurück), je Tag einer
        const tage = [...new Set((Array.isArray(stand.siege) ? stand.siege : []).map(x => x && x.tag).filter(t => typeof t === 'string' && K.ausTagKey(t) && t <= heuteK))].sort();
        if (tage.length < laenge) return { erreicht: false, bezug: laenge, seit: null };
        return { erreicht: true, bezug: laenge, seit: tage[laenge - 1] };
      } catch (e) { return NICHT; }
    }
  })
});

// Prüft die Regeln beim Start oder im Test. Lesbare Fehler, wirft nie.
export function pruefeAbschlussRegeln(opt = ABSCHLUSS, ausloeser = AUSLOESER, modiOpt = HELDENMODI) {
  const f = [];
  if (!opt || typeof opt !== 'object') return ['Keine Abschluss-Regeln festgelegt'];
  const liste = (n, l) => { if (!Array.isArray(l) || !l.length || l.some(x => typeof x !== 'string' || !x) || new Set(l).size !== l.length) { f.push(`${n} muss eine Liste verschiedener Namen sein`); return false; } return true; };
  liste('typen', opt.typen);
  const wegeOk = liste('wege', opt.wege);
  if (wegeOk && Array.isArray(opt.abschliessend) && opt.abschliessend.some(w => !opt.wege.includes(w))) f.push('abschliessend nennt einen unbekannten Weg');
  if (!Array.isArray(opt.abschliessend)) f.push('abschliessend muss eine Liste sein');
  if (wegeOk && opt.wege.includes('neu')) f.push('„neu“ ist noch kein Weg (eigener Folgeschritt)');
  if (opt.wegModus && typeof opt.wegModus === 'object') {
    for (const [w, m] of Object.entries(opt.wegModus)) {
      if (wegeOk && !opt.wege.includes(w)) f.push(`wegModus: unbekannter Weg ${w}`);
      if (!modiOpt.modi.includes(m)) f.push(`wegModus: unbekannter Modus ${m}`);
    }
  } else f.push('wegModus muss ein Objekt sein');
  if (typeof opt.ausloeser !== 'string' || !ausloeser || typeof ausloeser[opt.ausloeser] !== 'object') f.push(`Unbekannter Auslöser: ${opt.ausloeser}`);
  if (typeof opt.ereignis !== 'string' || !/^[a-z]+$/.test(opt.ereignis)) f.push('ereignis muss ein Kleinbuchstaben-Name sein');
  if (!Number.isInteger(opt.bezugMax) || opt.bezugMax < 1) f.push('bezugMax muss eine ganze Zahl ab 1 sein');
  return f;
}

// ---------- Speichern und Laden ----------
// Ein Eintrag: ungültige Teile fallen weg (typ, wahl); ohne gültigen Bezug und Tag ist er unbrauchbar (null).
export function bereinigeEintrag(roh, opt = ABSCHLUSS) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
  if (!Number.isInteger(roh.bezug) || roh.bezug < 1 || roh.bezug > opt.bezugMax || !HM.istTag(roh.ab)) return null;
  const e = {};
  if (opt.typen.includes(roh.typ)) e.typ = roh.typ;
  if (opt.wege.includes(roh.wahl)) e.wahl = roh.wahl;
  e.bezug = roh.bezug;
  e.ab = roh.ab;
  return e;
}
// Ganze Tabelle { heroId: Eintrag }. Fehlt sie (Altbestand) oder ist sie kaputt → {}. heroIds: nur diese Helden bleiben.
export function bereinigeAbschluss(roh, { heroIds = null, opt = ABSCHLUSS } = {}) {
  const aus = {};
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return aus;
  for (const [id, v] of Object.entries(roh)) {
    if (!ID.test(id) || (heroIds && !heroIds.has(id))) continue;
    const e = bereinigeEintrag(v, opt);
    if (e) aus[id] = e;
  }
  return aus;
}

const heldIds = spiel => (spiel && Array.isArray(spiel.helden) ? spiel.helden.map(h => h && h.heroId).filter(Boolean) : []);
const eintragVon = (spiel, heroId, opt) => (spiel && spiel.abschluss && typeof spiel.abschluss === 'object' ? bereinigeEintrag(spiel.abschluss[heroId], opt) : null);
function bau(typ, wahl, bezug, ab) {
  const e = {};
  if (typ) e.typ = typ;
  if (wahl) e.wahl = wahl;
  e.bezug = bezug;
  e.ab = ab;
  return e;
}
function mitEintrag(spiel, heroId, eintrag, opt) {
  return { ...spiel, abschluss: { ...bereinigeAbschluss(spiel.abschluss, { heroIds: new Set(heldIds(spiel)), opt }), [heroId]: eintrag } };
}

// ---------- Stand ----------
const LEER = Object.freeze({ held: false, erreicht: false, offen: false, neu: false, spaeter: false, typ: null, wahl: null, bezug: null, seit: null, siegHeute: false, pausiert: false });

// Stand der Entscheidung eines Helden am Tag heuteK. Wirft nie (unbekannter Held, kaputter Stand → LEER).
//   erreicht   Auslöser erfüllt (Kettenende)
//   offen      erreicht UND (kein Eintrag, anderer Bezug, noch keine Wahl oder Wahl „spaeter“)
//   neu        offen, weil noch nichts gewählt wurde (die Seite öffnet sich von selbst)
//   spaeter    offen, weil „Später entscheiden“ gewählt wurde (nur leise Karte, keine Seite von selbst)
//   typ        endlich | dauerhaft | null (noch nie gefragt; bleibt auch bei einer neuen Kette)
//   wahl       gültige Wahl zum jetzigen Bezug, sonst null
//   siegHeute  das Ende wurde heute erreicht: die Siegfeier gehört dem Tag, die Seite kommt erst beim nächsten Öffnen
//   pausiert   der Held ist heute in Erhalt oder Ruhe (wer pausiert, wird nicht angesprochen)
export function abschlussStand(spiel, heroId, heuteK, opt = ABSCHLUSS, ausloeser = AUSLOESER) {
  try {
    const h = spiel && Array.isArray(spiel.helden) ? spiel.helden.find(x => x && x.heroId === heroId) : null;
    if (!h || !h.quest || !HM.istTag(heuteK)) return LEER;
    const a = ausloeser[opt.ausloeser].pruefe({ quest: h.quest, siege: h.siege }, heuteK);
    const e = eintragVon(spiel, heroId, opt);
    const gleich = !!e && e.bezug === a.bezug;
    const wahl = gleich && e.wahl ? e.wahl : null;
    const neu = a.erreicht && !wahl;
    const spaeter = a.erreicht && wahl === 'spaeter';
    return {
      held: true, erreicht: a.erreicht, offen: neu || spaeter, neu, spaeter, typ: e && e.typ ? e.typ : null, wahl,
      bezug: a.bezug, seit: a.seit, siegHeute: a.erreicht && a.seit === heuteK, pausiert: HM.istPausiert(HM.modusAm(spiel, h.heroId, heuteK))
    };
  } catch (err) { return LEER; }
}

// Helden, denen die Seite heute gezeigt werden darf: [{ heroId, ...Stand }], der fokussierte Held zuerst.
// Ohne mitSpaeter nur die, bei denen noch nichts gewählt wurde; mit mitSpaeter auch die, die „Später“ gewählt haben (Karte).
export function abschlussHelden(spiel, heuteK, { mitSpaeter = false, opt = ABSCHLUSS, ausloeser = AUSLOESER } = {}) {
  const ids = heldIds(spiel).sort((a, b) => (b === spiel.fokus) - (a === spiel.fokus));
  const aus = [];
  for (const id of ids) {
    const s = abschlussStand(spiel, id, heuteK, opt, ausloeser);
    if (s.offen && (s.neu || mitSpaeter) && !s.siegHeute && !s.pausiert) aus.push({ heroId: id, ...s });
  }
  return aus;
}

// ---------- Entscheiden ----------
function pruefeAufruf(spiel, heroId, heuteK, opt, ausloeser) {
  if (!heldIds(spiel).includes(heroId)) throw new AbschlussFehler('held', 'Unbekannter Held.');
  if (!HM.istTag(heuteK)) throw new AbschlussFehler('tag', 'Ungültiger Tag.');
  const st = abschlussStand(spiel, heroId, heuteK, opt, ausloeser);
  if (!st.erreicht) throw new AbschlussFehler('kein-ende', 'Das Ziel ist noch nicht ganz geschafft.');
  return st;
}

// Wie sieht die Person das Ziel? typ aus opt.typen. Merkt sich den Typ (auch ohne Wahl); wirft AbschlussFehler
// (held, tag, typ, kein-ende). Liefert { spiel, geaendert }.
export function typSetzen(spiel, heroId, typ, heuteK, opt = ABSCHLUSS, ausloeser = AUSLOESER) {
  if (!opt.typen.includes(typ)) throw new AbschlussFehler('typ', 'Unbekannte Antwort.');
  const st = pruefeAufruf(spiel, heroId, heuteK, opt, ausloeser);
  if (st.typ === typ) return { spiel, geaendert: false };
  const alt = eintragVon(spiel, heroId, opt);
  // Eine Wahl gehört zu ihrem Bezug: bei neuem Bezug (längere Kette) gilt sie nicht mehr, nur der Typ bleibt
  const neu = alt && alt.bezug === st.bezug ? bau(typ, alt.wahl, st.bezug, alt.ab) : bau(typ, null, st.bezug, heuteK);
  return { spiel: mitEintrag(spiel, heroId, neu, opt), geaendert: true };
}

// Weg wählen. Alles oder nichts: scheitert der Wechsel des Modus, bleibt der Spielstand unverändert.
// Liefert { spiel, geaendert, modus (Ergebnis von modusSetzen oder null), letzterFokus }.
// letzterFokus: der Held war der einzige im Fokus und ruht jetzt im Erhalt (die Ansicht sagt es ruhig dazu).
// Wirft AbschlussFehler (held, tag, wahl, typ, kein-ende, modus). Dieselbe Wahl noch einmal ändert nichts.
export function wahlSetzen(spiel, heroId, wahl, heuteK, opt = ABSCHLUSS, ausloeser = AUSLOESER, modiOpt = HELDENMODI) {
  if (!opt.wege.includes(wahl)) throw new AbschlussFehler('wahl', 'Unbekannter Weg.');
  const st = pruefeAufruf(spiel, heroId, heuteK, opt, ausloeser);
  if (!st.typ) throw new AbschlussFehler('typ', 'Bitte sag zuerst, wie du dieses Ziel siehst.');
  if (st.wahl === wahl) return { spiel, geaendert: false, modus: null, letzterFokus: false };
  const fokusVorher = HM.fokusHelden(spiel, modiOpt);
  let s = spiel, modus = null;
  const ziel = opt.wegModus[wahl];
  if (ziel) {
    try { modus = HM.modusSetzen(spiel, heroId, ziel, heuteK, modiOpt, { ohneGrenzen: true }); }
    catch (e) {
      if (e instanceof HM.ModusFehler) throw new AbschlussFehler('modus', e.message);
      throw e;
    }
    s = modus.spiel;
  }
  const letzterFokus = !!modus && modus.geaendert && fokusVorher.length === 1 && fokusVorher[0] === heroId;
  return { spiel: mitEintrag(s, heroId, bau(st.typ, wahl, st.bezug, heuteK), opt), geaendert: true, modus, letzterFokus };
}

// ---------- Rückschau ----------
// Nur eigene, vorhandene Daten, nichts gespeichert: { start, tage, kette, wiedereinstiege, ziel, warum }.
//   tage              Tage seit dem Start (einschließlich), kein Vorwurf, nur der Weg
//   kette             Länge der Kette (Zahl der Stationen)
//   wiedereinstiege   wie oft die Person nach einem schweren Tag wieder eingestiegen ist (Comebacks, Version 131)
// stand = Heldenansicht (helden.ansicht). Wirft nie: bei einem Fehler kommen leere Werte.
export function rueckschau(stand, heuteK) {
  const leer = { start: null, tage: 0, kette: 0, wiedereinstiege: 0, ziel: '', warum: '' };
  try {
    if (!stand || !stand.quest || !K.ausTagKey(heuteK)) return leer;
    const en = entwicklung(stand, K.ausTagKey(heuteK));
    const schwer = [...(Array.isArray(stand.schwerTage) ? stand.schwerTage : []), ...tageMit(stand.tage, 'schwer', heuteK)];
    const c = B.comebacks(stand.tage || {}, zaehltAntworten(stand.quest), schwer, heuteK);
    return {
      start: en.start, tage: en.tageSeitStart, kette: K.kette(stand).length, wiedereinstiege: c.anzahl,
      ziel: typeof stand.quest.ziel === 'string' ? stand.quest.ziel : '', warum: typeof stand.quest.warum === 'string' ? stand.quest.warum : ''
    };
  } catch (err) { return leer; }
}

// Abgeschlossene Entscheidungen für das Logbuch: [{ heroId, typ, wahl, tag }] (nur Wege aus opt.abschliessend). Wirft nie.
export function abschlussEreignisse(spiel, opt = ABSCHLUSS) {
  try {
    const ids = new Set(heldIds(spiel));
    return Object.entries(bereinigeAbschluss(spiel && spiel.abschluss, { heroIds: ids, opt }))
      .filter(([, e]) => e.typ && e.wahl && opt.abschliessend.includes(e.wahl))
      .map(([heroId, e]) => ({ heroId, typ: e.typ, wahl: e.wahl, tag: e.ab }));
  } catch (err) { return []; }
}
