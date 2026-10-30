// Entwicklung eines Helden (Version 21): echtes Verhalten statt nur Spielzahlen. Reine Ableitung, nichts gespeichert.
import * as K from './kern.js';

export const MAX_RUNDEN_VERLAUF = 6;

export function entwicklung(stand, heute) {
  if (!stand || !stand.quest) throw new Error('entwicklung: keine Quest');
  const heuteK = K.tagKey(heute);
  const a = K.auswertung(stand, heute);
  const start = K.questStart(stand, heuteK);
  const anwendungen = Object.entries(stand.tage).filter(([k, v]) => v === 'ja' && k <= heuteK).length;
  const eintraege = Object.keys(stand.tage).filter(k => k <= heuteK).length;
  // Nur begonnene Runden (nach einem Sieg heute beginnt die nächste erst morgen)
  const alle = K.runden(stand, heuteK).runden.filter(r => r.von <= heuteK);
  // ziel je Runde (Einstiegsrampe, 30.10.2026): was diese Runde gebraucht hat; ohne Rampe überall quest.anzahl
  const verlauf = alle.slice(-MAX_RUNDEN_VERLAUF).map(r => ({ nr: r.nr, von: r.von, anwendungen: r.anwendungen, ziel: K.rundenZiel(stand.quest, r.siegeVorher), sieg: !!r.sieg, gegner: r.gegner }));
  const naechsterTitel = a.level < K.TITEL.length ? { titel: K.TITEL[a.level], abStufe: a.level + 1 } : null;
  return {
    start, anwendungen, eintraege, siege: a.siege, kapitel: a.gegnerNr, ziel: a.zielAnzahl,
    tageSeitStart: Math.max(0, Math.round((K.ausTagKey(heuteK) - K.ausTagKey(start)) / 864e5)) + 1,
    level: a.level, titel: a.titel, xp: a.xp, imLevel: a.imLevel, proLevel: a.proLevel,
    naechsterTitel, verlauf
  };
}
