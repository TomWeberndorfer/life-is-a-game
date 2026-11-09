// Crew-Übersicht (06.11.2026): reine Funktion ohne DOM. Einstellungen: daten/crew.js, Ansicht: ansicht/crew.js.
// Leitet aus dem Spielstand ab, wie die Energie verteilt ist: Gruppen je Modus (Reihenfolge HELDENMODI.modi), je Held
// Questtitel, Mindestaufgabe, Namen der Stützgewohnheiten, letzter Lebensrad-Wert des Bereichs und seit wann im Modus.
// Kein neues Spielstand-Feld. Wirft nie: ein kaputter Teil eines Helden fällt weg (null/leer), der Held bleibt sichtbar.
import { CREW } from '../daten/crew.js';
import { HELDENMODI, MINDEST } from '../daten/heldenmodi.js';
import * as H from './helden.js';
import * as HM from './heldenmodi.js';
import * as K from './kern.js';
import * as S from './stuetzen.js';
import * as W from './wochenrunde.js';

const sicher = (fn, fb) => { try { return fn(); } catch (e) { return fb; } };

// Letzter Lebensrad-Wert eines Bereichs aus spiel.wochen bis einschließlich der Woche von heuteK (auf die aktuelle
// Skala umgerechnet) oder null, wenn es noch keinen gibt (keine Wochenrunde, Bereich nie bewertet).
export function letzterWheelWert(spiel, bereichId, heuteK) {
  const wochen = spiel && spiel.wochen && typeof spiel.wochen === 'object' && !Array.isArray(spiel.wochen) ? spiel.wochen : {};
  if (!bereichId || !HM.istTag(heuteK)) return null;
  const bis = K.wocheKey(heuteK);
  const keys = Object.keys(wochen).filter(k => W.istWoche(k) && k <= bis).sort().reverse();
  for (const k of keys) {
    const v = W.wertIn(wochen[k], bereichId);
    if (Number.isInteger(v)) return v;
  }
  return null;
}

// Seit wann gilt der gewählte Modus? { ab, kommt } aus dem letzten Eintrag in spiel.modi; kommt = beginnt erst später.
// Ohne Eintrag (Altbestand, nie gewechselt) null: dann ist es unbekannt und wird nicht angezeigt.
export function modusSeit(spiel, heroId, heuteK, opt = HELDENMODI) {
  const l = HM.bereinigeVerlauf(spiel && spiel.modi && spiel.modi[heroId], opt);
  const e = l.length ? l[l.length - 1] : null;
  return e ? { ab: e.ab, kommt: e.ab > heuteK } : null;
}

// Gesamte Übersicht. jetzt: Date. Liefert { gruppen: [{ modus, helden: [...], platz, eingeklappt }], fokusMax, anzahl }.
// platz: freie Plätze im Fokus (nur bei der Standard-Gruppe, sonst 0). Je Held:
//   { heroId, domainId, ziel, mindest: { taetigkeit, anzahl, zeitraum } | null, stuetzen: [name], wheel, seit }
export function crewUebersicht(spiel, jetzt, { cfg = CREW, opt = HELDENMODI, mindestOpt = MINDEST } = {}) {
  const helden = spiel && Array.isArray(spiel.helden) ? spiel.helden.filter(h => h && typeof h.heroId === 'string') : [];
  const heuteK = jetzt instanceof Date && !Number.isNaN(jetzt.getTime()) ? K.tagKey(jetzt) : null;
  const zeigen = (cfg && cfg.zeigen) || {};
  const mindestAlle = sicher(() => HM.bereinigeMindest(spiel && spiel.mindest, { opt: mindestOpt }), {});
  const gruppen = opt.modi.map(modus => ({ modus, helden: [], platz: 0, eingeklappt: !!(cfg.eingeklappt || []).includes(modus) }));
  for (const h of helden) {
    const modus = sicher(() => HM.modusGewaehlt(spiel, h.heroId, opt), opt.standard);
    const g = gruppen.find(x => x.modus === modus) || gruppen.find(x => x.modus === opt.standard);
    const m = mindestAlle[h.heroId];
    const a = m && m.aufgabe;
    g.helden.push({
      heroId: h.heroId,
      domainId: h.domainId || null,
      ziel: zeigen.quest && h.quest && typeof h.quest.ziel === 'string' ? h.quest.ziel : '',
      mindest: zeigen.mindest && a && mindestOpt.modi.includes(modus) ? { taetigkeit: a.taetigkeit, anzahl: a.anzahl, zeitraum: a.zeitraum } : null,
      stuetzen: zeigen.stuetzen && heuteK ? sicher(() => S.stuetzenStand(H.ansicht(spiel, h.heroId), jetzt).map(x => x.name).filter(Boolean), []) : [],
      wheel: zeigen.wheel && heuteK ? sicher(() => letzterWheelWert(spiel, h.domainId, heuteK), null) : null,
      seit: zeigen.seit && heuteK ? sicher(() => modusSeit(spiel, h.heroId, heuteK, opt), null) : null
    });
  }
  const fokus = gruppen.find(x => x.modus === opt.standard);
  if (fokus) fokus.platz = Math.max(0, opt.fokusMax - fokus.helden.length);
  const leer = cfg.leerZeigen || [];
  return {
    gruppen: gruppen.filter(x => x.helden.length || leer.includes(x.modus)),
    fokusMax: opt.fokusMax,
    anzahl: helden.length
  };
}

// „Crew planen“ anbieten? (ab cfg.abHelden Helden)
export const crewPlanbar = (spiel, cfg = CREW) => !!(spiel && Array.isArray(spiel.helden) && spiel.helden.length >= cfg.abHelden);
