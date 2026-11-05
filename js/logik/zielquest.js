// Ziel-Quests (31.10.2026, Entscheidungen Abschnitt 24): Quest mit Zähler als Haupt-Teilziel und einem verknüpften
// Messziel als Ergebnis. Daten: daten/zielvorlagen.js, Ansicht: ansicht/zielquest.js.
//
// Im Spielstand (nur Felder an der Quest, das Messziel selbst liegt wie bisher in spiel.messziele[heroId]):
//   quest.messziel          ID des verknüpften Messziels (fehlt = normale Gewohnheits-Quest, wie bei allen Quests davor)
//   quest.messzielGefeiert  'YYYY-MM-DD' = der „erreicht“-Tag des Messziels, dessen Feier schon bestätigt ist
// Das Zieldatum ist das `bis` des Messziels (Stichtag, ohne Strafe). Altbestand ohne diese Felder bleibt unverändert.
// Bosskette, Siege und XP hängen weiter nur am Haupt-Teilziel (Entscheidungen Abschnitt 20): Messwerte schwanken auch
// bei richtigem Verhalten, darum kann ein Messziel nie eine Runde verlieren oder XP geben.
import { ZIEL_EIGEN, ZIEL_VORLAGEN } from '../daten/zielvorlagen.js';
import { MESSZIEL_RICHTUNGEN } from '../daten/messziele.js';
import * as MZ from './messziele.js';

export class ZielquestFehler extends Error {}

const ID = /^[a-z0-9-]{1,40}$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const kopie = x => JSON.parse(JSON.stringify(x));

// ---------- Vorlagen ----------

// Ziel-Vorlagen einer Onboarding-Gruppe, „Eigenes Ziel“ immer zuletzt.
export function zieleFuer(gruppe, liste = ZIEL_VORLAGEN) {
  return [...(liste || []).filter(z => z.gruppe === gruppe), { ...ZIEL_EIGEN, gruppe }];
}
// Ziel-Vorlage nach ID; unbekannt → null.
export function zielVorlage(id, gruppe, liste = ZIEL_VORLAGEN) {
  if (!id) return null;
  return zieleFuer(gruppe, liste).find(z => z.id === id) || null;
}

const zahlFeld = x => (typeof x === 'number' && Number.isFinite(x) ? String(x).replace('.', ',') : '');
// Formular-Vorbelegung (Strings wie im Messziel-Formular).
export function formAus(zv) {
  const m = (zv && zv.messziel) || {};
  return {
    name: typeof m.name === 'string' ? m.name : '',
    einheit: typeof m.einheit === 'string' ? m.einheit : '',
    richtung: MESSZIEL_RICHTUNGEN.includes(m.richtung) ? m.richtung : 'hoch',
    ziel: zahlFeld(m.ziel), start: zahlFeld(m.start), bis: ''
  };
}

// Wege zum Ziel: alle Gewohnheits-Vorlagen der Gruppe. Empfohlene (zv.wege) zuerst in ihrer Reihenfolge, dann die
// übrigen, „Etwas anderes“ (problem '*') zuletzt. Liefert [{ vorlage, empfohlen }].
export function wegeFuer(zv, gruppe, tabelle) {
  const alle = (tabelle && tabelle.vorlagen || []).filter(v => v.gruppe === gruppe);
  const empf = ((zv && zv.wege) || []).map(id => alle.find(v => v.id === id)).filter(Boolean);
  const rest = alle.filter(v => !empf.includes(v));
  return [
    ...empf.map(vorlage => ({ vorlage, empfohlen: true })),
    ...rest.filter(v => v.problem !== '*').map(vorlage => ({ vorlage, empfohlen: false })),
    ...rest.filter(v => v.problem === '*').map(vorlage => ({ vorlage, empfohlen: false }))
  ];
}

// Ziel-Vorlagen gegen die Vorlagen-Tabelle prüfen; liefert Fehlertexte (leer = in Ordnung).
export function pruefeZielVorlagen(tabelle, liste = ZIEL_VORLAGEN) {
  const fehler = [];
  const ids = new Set([ZIEL_EIGEN.id]);
  for (const z of liste) {
    if (!z || !ID.test(String(z.id))) { fehler.push(`Ziel-Vorlage ohne gültige ID: ${z && z.id}`); continue; }
    if (ids.has(z.id)) fehler.push(`Doppelte Ziel-Vorlage: ${z.id}`);
    ids.add(z.id);
    if (!tabelle.gruppen.some(g => g.id === z.gruppe)) fehler.push(`${z.id}: Gruppe ${z.gruppe} fehlt`);
    if (!z.name || !String(z.name).trim()) fehler.push(`${z.id}: Name fehlt`);
    const m = z.messziel || {};
    if (!m.name || !String(m.name).trim()) fehler.push(`${z.id}: Messziel ohne Namen`);
    if (!MESSZIEL_RICHTUNGEN.includes(m.richtung)) fehler.push(`${z.id}: Richtung ${m.richtung} ungültig`);
    for (const k of ['ziel', 'start']) if (m[k] !== undefined && !(typeof m[k] === 'number' && Number.isFinite(m[k]))) fehler.push(`${z.id}: ${k} ist keine Zahl`);
    if (!Array.isArray(z.wege) || !z.wege.length) fehler.push(`${z.id}: keine Wege`);
    for (const w of z.wege || []) {
      const v = tabelle.vorlagen.find(x => x.id === w);
      if (!v) fehler.push(`${z.id}: Weg ${w} fehlt`);
      else if (v.gruppe !== z.gruppe) fehler.push(`${z.id}: Weg ${w} gehört zu ${v.gruppe}, nicht ${z.gruppe}`);
    }
  }
  return fehler;
}

// ---------- Spielstand ----------

const heldVon = (spiel, heroId) => (spiel && Array.isArray(spiel.helden) ? spiel.helden.find(h => h.heroId === heroId) : null) || null;
function heldMitQuest(spiel, heroId) {
  const h = heldVon(spiel, heroId);
  if (!h || !h.quest) throw new ZielquestFehler('Dieser Held hat keine Quest.');
  return h;
}

// Quest-Felder beim Laden (K.migriere): ungültig → weg (Altbestand hat sie nie).
export function bereinigeZielLink(q, aus) {
  if (!q || typeof q !== 'object' || !aus) return aus;
  if (typeof q.messziel === 'string' && ID.test(q.messziel)) {
    aus.messziel = q.messziel;
    if (typeof q.messzielGefeiert === 'string' && TAG.test(q.messzielGefeiert)) aus.messzielGefeiert = q.messzielGefeiert;
  }
  return aus;
}
// Nach dem Bereinigen der Messziele (H.migriereSpiel): Verweise auf gelöschte Messziele fallen weg.
export function linksBereinigen(spiel) {
  for (const h of (spiel && spiel.helden) || []) {
    if (!h.quest || !h.quest.messziel) continue;
    if (!MZ.messzieleVon(spiel, h.heroId).some(z => z.id === h.quest.messziel)) { delete h.quest.messziel; delete h.quest.messzielGefeiert; }
  }
  return spiel;
}

// Verknüpftes Messziel der Quest des Helden; fehlt es (keine Ziel-Quest oder gelöscht) → null.
export function zielVon(spiel, heroId) {
  const h = heldVon(spiel, heroId);
  if (!h || !h.quest || !h.quest.messziel) return null;
  return MZ.messzieleVon(spiel, heroId).find(z => z.id === h.quest.messziel) || null;
}

// Neues Messziel anlegen und mit der Quest verknüpfen. werte: MZ.zielPruefen(…).werte. Wirft bei ungültigen Werten
// (MesszielFehler) oder wenn die Quest schon ein Ziel hat (ZielquestFehler); der Stand bleibt dann unverändert.
export function verknuepfen(spiel, heroId, werte, opt) {
  const h = heldMitQuest(spiel, heroId);
  if (zielVon(spiel, heroId)) throw new ZielquestFehler('Diese Quest hat schon ein Ziel.');
  if (!werte || typeof werte !== 'object') throw new ZielquestFehler('Ungültige Zielwerte.');
  const r = MZ.zielAnlegen(spiel, heroId, werte, opt);
  const s = kopie(r.spiel);
  const hs = heldVon(s, h.heroId);
  hs.quest.messziel = r.ziel.id;
  delete hs.quest.messzielGefeiert;
  return { spiel: s, ziel: r.ziel };
}

// Stand des Ziels für die Startseite. null = keine Ziel-Quest.
//   art  'erreicht'     Ziel erreicht, Feier noch nicht bestätigt (Entscheidung 14)
//        'ueberfaellig' Stichtag vorbei, Ziel nicht erreicht (Entscheidung 13: ruhige Frage, keine Niederlage)
//        'laeuft'       alles andere (auch: erreicht und gefeiert)
export function zielStatus(spiel, heroId, heute) {
  const z = zielVon(spiel, heroId);
  if (!z) return null;
  const q = heldVon(spiel, heroId).quest;
  const f = MZ.fortschritt(z, heute);
  let art = 'laeuft';
  if (z.erreicht && q.messzielGefeiert !== z.erreicht) art = 'erreicht';
  else if (!z.erreicht && f.tageBis !== null && f.tageBis < 0) art = 'ueberfaellig';
  return { ziel: z, f, art };
}

// Feier bestätigt („Gewohnheit weiterführen“): merkt den erreicht-Tag. Ein neues, später erreichtes Ziel feiert neu.
export function feierBestaetigen(spiel, heroId) {
  const z = zielVon(spiel, heroId);
  if (!z || !z.erreicht) throw new ZielquestFehler('Das Ziel ist noch nicht erreicht.');
  const s = kopie(spiel);
  heldVon(s, heroId).quest.messzielGefeiert = z.erreicht;
  return s;
}

// „Ohne Datum weiter“ (Entscheidung 13): Stichtag entfernen, alles andere bleibt.
export function ohneDatum(spiel, heroId) {
  const z = zielVon(spiel, heroId);
  if (!z) throw new ZielquestFehler('Diese Quest hat kein Ziel.');
  const { name, einheit, richtung, ziel, start } = z;
  return MZ.zielAendern(spiel, heroId, z.id, { name, einheit, richtung, ziel, start, bis: null }).spiel;
}
