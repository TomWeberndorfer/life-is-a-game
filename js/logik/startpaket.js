// Startpakete (02.11.2026): mehrere Helden mit Quest, Messzielen und Ziel in einem Rutsch anlegen. Daten: daten/startpakete.js.
// Nutzt nur die bestehenden Anlege-Wege (H.heldHinzufuegen, ZQ.verknuepfen, MZ.zielAnlegen), keine eigene Spielstand-Logik
// und kein neues Feld im Spielstand.
//
// Regeln:
//   - Alles oder nichts: erst wird das ganze Paket geprüft, dann auf einer Kopie angelegt. Scheitert ein Schritt, bleibt der
//     Spielstand unverändert und die Meldung sagt, woran es lag (StartpaketFehler).
//   - Ein Held, der schon in der Crew ist, wird ergänzt statt übersprungen (03.11.2026): fehlende Messziele, Ideen, das
//     Ziel der Quest und die Stützgewohnheit kommen dazu; Quest, Runden, Siege und Kette bleiben unangetastet (ergaenzen()).
//     Gleiche Namen gelten als vorhanden, darum ist zweimaliges Auslösen harmlos (das zweite Mal meldet „Schon alles da“).
//   - Die Freischaltungen gelten weiter: Stützgewohnheiten gibt es erst ab TEILZIELE.nebenAbSiegen Siegen; bis dahin
//     liefert das Ergebnis einen Hinweis statt sie vorzuziehen (kein Überspringen des Takts).
//   - Fokus bleibt beim ersten Helden des Pakets (bzw. beim bisherigen, wenn es schon Helden gab).
//   - Auswahl (06.11.2026): `nur` = Helden-IDs aus dem Paket; nur diese werden angelegt bzw. ergänzt. Fehlt `nur`, gilt das
//     ganze Paket. Leere Auswahl oder ein Held, der nicht im Paket steht, ist ein Fehler (nichts wird angelegt).
//     Die Ansicht ist dieselbe wie bei „Mehrere Helden auf einmal“ (ansicht/onboarding.js, obmehr), mit paketHelden().
import { STARTPAKETE, STARTPAKET_VERSATZ_MAX } from '../daten/startpakete.js';
import { ZIEL_VORLAGEN } from '../daten/zielvorlagen.js';
import { MESSZIEL_RICHTUNGEN, MESSZIEL_OPT } from '../daten/messziele.js';
import { TEILZIELE, ZIELARTEN } from '../daten/zielarten.js';
import * as H from './helden.js';
import * as K from './kern.js';
import * as MZ from './messziele.js';
import * as ZQ from './zielquest.js';
import * as S from './stuetzen.js';
const { stuetzePruefen } = S;
import * as IG from './ideen.js'; // Ideenglas (Punkt 14a)
import { IDEEN_OPT } from '../daten/notfall.js';

export class StartpaketFehler extends Error {}

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const zahl = x => typeof x === 'number' && Number.isFinite(x);
const alsText = x => (zahl(x) ? String(x).replace('.', ',') : '');

// Prüft ein Paket gegen Vorlagen und Ziel-Vorlagen. Liefert lesbare Fehler (leer = in Ordnung), wirft nie.
export function pruefePaket(paket, tabelle, { zielVorlagen = ZIEL_VORLAGEN, heute = '2026-01-01' } = {}) {
  const f = [];
  if (!paket || typeof paket !== 'object') return ['Startpaket fehlt.'];
  const helden = Array.isArray(paket.helden) ? paket.helden : [];
  if (!helden.length) f.push('Startpaket ohne Helden.');
  if (helden.length > H.MAX_HELDEN) f.push(`Höchstens ${H.MAX_HELDEN} Helden je Paket.`);
  const gesehen = new Set();
  helden.forEach((e, i) => {
    const wo = `Held ${i + 1}`;
    const v = e && (tabelle.vorlagen || []).find(x => x.id === e.vorlage);
    if (!v) { f.push(`${wo}: Vorlage ${e && e.vorlage} fehlt.`); return; }
    if (gesehen.has(v.held)) f.push(`${wo}: ${v.held} steht doppelt im Paket.`);
    gesehen.add(v.held);
    if (e.versatzTage !== undefined && !(Number.isInteger(e.versatzTage) && e.versatzTage >= 0 && e.versatzTage <= STARTPAKET_VERSATZ_MAX)) f.push(`${wo}: versatzTage muss 0 bis ${STARTPAKET_VERSATZ_MAX} sein.`);
    if (e.zielquest) {
      const zv = ZQ.zielVorlage(e.zielquest.vorlage, v.gruppe, zielVorlagen);
      if (!zv || zv.id === 'eigen') f.push(`${wo}: Ziel-Vorlage ${e.zielquest.vorlage} fehlt in der Gruppe ${v.gruppe}.`);
      else { const p = MZ.zielPruefen(zielEingabe(zv, e.zielquest), heute); if (!p.ok) f.push(`${wo}: Ziel ungültig (${Object.values(p.fehler).join(' ')})`); }
    }
    const namen = new Set();
    for (const m of e.messziele || []) {
      const p = MZ.zielPruefen(messEingabe(m), heute);
      if (!p.ok) f.push(`${wo}: Messziel ${m && m.name}: ${Object.values(p.fehler).join(' ')}`);
      else if (namen.has(p.werte.name.toLowerCase())) f.push(`${wo}: Messziel ${p.werte.name} doppelt.`);
      else namen.add(p.werte.name.toLowerCase());
    }
    const ideen = e.ideen === undefined ? [] : e.ideen;
    if (!Array.isArray(ideen)) f.push(`${wo}: ideen muss eine Liste sein.`);
    else ideen.forEach((x, k) => {
      if (!Array.isArray(x) || !IDEEN_OPT.kats.includes(x[0])) f.push(`${wo}: Idee ${k + 1}: unbekannte Kategorie.`);
      else if (typeof x[1] !== 'string' || !x[1].trim() || x[1].trim().length > IDEEN_OPT.max) f.push(`${wo}: Idee ${k + 1}: Text leer oder länger als ${IDEEN_OPT.max} Zeichen.`);
    });
    for (const s of e.stuetzen || []) {
      const p = stuetzePruefen(s, {}, ZIELARTEN, TEILZIELE);
      if (!p.ok) f.push(`${wo}: Stützgewohnheit ${s && s.name}: ${Object.values(p.fehler).join(' ')}`);
    }
  });
  return f;
}

function zielEingabe(zv, zq) {
  const m = zv.messziel || {};
  return { name: m.name, einheit: m.einheit, richtung: MESSZIEL_RICHTUNGEN.includes(m.richtung) ? m.richtung : 'hoch', ziel: alsText(zq.ziel), start: alsText(zq.start), bis: TAG.test(String(zq.bis)) ? zq.bis : '' };
}
const messEingabe = m => ({ name: m && m.name, einheit: m && m.einheit, richtung: m && m.richtung, ziel: alsText(m && m.ziel), start: alsText(m && m.start), bis: '' });

// Namen vergleichen ohne Groß-/Kleinschreibung, Leerzeichen am Rand und doppelte Leerzeichen (Entscheidung 4, 03.11.2026).
export const gleicherName = (a, b) => normName(a) === normName(b);
const normName = x => String(x ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

// Leeres Ergänzungs-Protokoll für einen Helden: neu = was dazukam, vorhanden = was schon da war (gleicher Name).
const leeresProtokoll = heroId => ({ heroId, neu: { ziel: 0, messziele: 0, ideen: 0, stuetzen: 0 }, vorhanden: 0 });
const summe = p => p.neu.ziel + p.neu.messziele + p.neu.ideen + p.neu.stuetzen;

// Ergänzt einen Helden, der schon in der Crew ist (03.11.2026, Entscheidungen 1–5 im Chat „v113 – Helden – Startpaket
// ergänzen statt überspringen“). Psychologie: Ergänzen nimmt nichts weg, was die Person selbst angelegt oder erkämpft hat;
// das schützt Autonomie und vermeidet Verlusterleben. Darum gilt:
//   - Quest, Ziel-Text, Warum, Beginn, Runden, Siege und Bosskette bleiben unangetastet.
//   - Messziele und Ideen kommen dazu; gleicher Name = schon vorhanden (eigene Werte gelten, nichts wird überschrieben).
//   - Ziel der Quest nur, wenn die Quest noch keins hat (sonst „vorhanden“).
//   - Stützgewohnheit nur, wenn der Held noch keine hat und sie frei ist (TEILZIELE.nebenAbSiegen), sonst Hinweis.
//   - Erwartbare Grenzen (Glas voll, zu viele Messziele) überspringen das eine Teil mit Hinweis; alles andere wirft.
function ergaenzen(s, e, v, heute, heuteK, { tabelle, zuordnung, zielVorlagen, cfg }) {
  const held = v.held;
  const name = nameVon(tabelle, held);
  const p = leeresProtokoll(held);
  const hinweise = [];
  const quest = (H.heldVon(s, held) || {}).quest;

  if (e.zielquest) {
    const zv = ZQ.zielVorlage(e.zielquest.vorlage, v.gruppe, zielVorlagen);
    const werte = MZ.zielPruefen(zielEingabe(zv, e.zielquest), heuteK).werte;
    if (!quest) hinweise.push(`${name}: keine laufende Quest, darum kein Ziel „${werte.name}“.`);
    else if (ZQ.zielVon(s, held)) p.vorhanden++;
    else if (MZ.messzieleVon(s, held).some(m => gleicherName(m.name, werte.name))) hinweise.push(`${name}: Messziel „${werte.name}“ gibt es schon, es wurde nicht als Ziel der Quest verknüpft.`);
    else if (MZ.messzieleVon(s, held).length >= MESSZIEL_OPT.maxJe) hinweise.push(`${name}: Ziel „${werte.name}“ hat keinen Platz mehr (höchstens ${MESSZIEL_OPT.maxJe} Messziele).`);
    else { s = ZQ.verknuepfen(s, held, werte).spiel; p.neu.ziel++; }
  }
  for (const m of e.messziele || []) {
    const werte = MZ.zielPruefen(messEingabe(m), heuteK).werte;
    const liste = MZ.messzieleVon(s, held);
    if (liste.some(x => gleicherName(x.name, werte.name))) p.vorhanden++;
    else if (liste.length >= MESSZIEL_OPT.maxJe) hinweise.push(`${name}: Messziel „${werte.name}“ hat keinen Platz mehr (höchstens ${MESSZIEL_OPT.maxJe}).`);
    else { s = MZ.zielAnlegen(s, held, werte).spiel; p.neu.messziele++; }
  }
  for (const [kat, text] of e.ideen || []) {
    const liste = IG.ideenVon(s, held, IDEEN_OPT.start, v.faehigkeit);
    if (liste.some(x => gleicherName(x.text, text))) p.vorhanden++;
    else if (liste.length >= IDEEN_OPT.maxJe) hinweise.push(`${name}: Idee „${text.trim()}“ passt nicht mehr ins Glas (höchstens ${IDEEN_OPT.maxJe}).`);
    else { s = IG.ideeHinzufuegen(s, held, { kat, text }, { ...IDEEN_OPT, faehigkeit: v.faehigkeit }).spiel; p.neu.ideen++; }
  }
  for (const st of e.stuetzen || []) {
    const stand = H.ansicht(s, held);
    const aktive = stand.quest ? (stand.quest.teilziele || []).filter(t => !t.haupt && !t.archiviert) : [];
    if (aktive.some(t => gleicherName(t.name, st.name))) p.vorhanden++;
    else if (aktive.length) hinweise.push(`${name}: hat schon eine Stützgewohnheit, „${st.name}“ wurde nicht dazugelegt.`);
    else if (!S.nebenFrei(stand, cfg)) hinweise.push(`${name}: Stützgewohnheit „${st.name}“ kannst du ab ${cfg.nebenAbSiegen} Siegen anlegen.`);
    else { s = H.uebernehmen(s, held, S.stuetzeAnlegen(stand, st, heute, cfg).stand, zuordnung); p.neu.stuetzen++; }
  }
  return { spiel: s, protokoll: p, hinweise };
}

// Legt das Paket an. heute: Date. tabelle: TABELLE aus daten/vorlagen.js. opt.rampe: Einstiegsrampe für neue Quests
// (wie im Onboarding), opt.zuordnung: H.zuordner(…). Liefert { spiel, angelegt: [heroId], ergaenzt: [Protokoll],
// uebersprungen: [heroId ohne Neues], hinweise: [Text] }. Protokoll: { heroId, neu: { ziel, messziele, ideen, stuetzen },
// vorhanden }. Wirft StartpaketFehler (auch, wenn es nichts zu tun gibt); der übergebene Spielstand wird nie verändert.
// Helden eines Pakets für die Auswahl: [{ heroId, vorlage, ziel, vorhanden, messziele, ideen, zielquest }]. vorhanden = schon
// in der Crew (wird ergänzt). Unbekanntes Paket oder Vorlage → [] bzw. der Eintrag fehlt. Wirft nie.
export function paketHelden(paketId, spiel, tabelle, pakete = STARTPAKETE) {
  const paket = pakete && Object.prototype.hasOwnProperty.call(pakete, paketId) ? pakete[paketId] : null;
  if (!paket || !Array.isArray(paket.helden)) return [];
  const aus = [];
  for (const e of paket.helden) {
    const v = e && ((tabelle && tabelle.vorlagen) || []).find(x => x.id === e.vorlage);
    if (!v) continue;
    let vorhanden = false;
    try { vorhanden = !!H.heldVon(spiel, v.held); } catch (err) { vorhanden = false; }
    aus.push({ heroId: v.held, vorlage: v.id, ziel: e.ziel || '', vorhanden, messziele: (e.messziele || []).length, ideen: (e.ideen || []).length, zielquest: !!e.zielquest });
  }
  return aus;
}

// Auswahl umschalten (Helden-ID dazu oder weg); unbekannte IDs ändern nichts. Neue Liste in Paket-Reihenfolge.
export function paketUmschalten(auswahl, heroId, helden) {
  const ids = (helden || []).map(h => h.heroId);
  const alt = new Set((Array.isArray(auswahl) ? auswahl : []).filter(x => ids.includes(x)));
  if (!ids.includes(heroId)) return ids.filter(x => alt.has(x));
  if (alt.has(heroId)) alt.delete(heroId); else alt.add(heroId);
  return ids.filter(x => alt.has(x));
}

export function startpaketAnlegen(spiel, paketId, heute, tabelle, { rampe = null, zuordnung, pakete = STARTPAKETE, zielVorlagen = ZIEL_VORLAGEN, cfg = TEILZIELE, nur = null } = {}) {
  if (!spiel || !Array.isArray(spiel.helden)) throw new StartpaketFehler('Kein gültiger Spielstand.');
  if (!(heute instanceof Date) || isNaN(heute)) throw new StartpaketFehler('Ungültiges Datum.');
  if (!zuordnung) throw new StartpaketFehler('Zuordnung der Lebensbereiche fehlt.');
  const paket = Object.prototype.hasOwnProperty.call(pakete, paketId) ? pakete[paketId] : null;
  if (!paket) throw new StartpaketFehler(`Unbekanntes Startpaket: ${paketId}`);
  const heuteK = K.tagKey(heute);
  const fehler = pruefePaket(paket, tabelle, { zielVorlagen, heute: heuteK });
  if (fehler.length) throw new StartpaketFehler('Startpaket fehlerhaft: ' + fehler.join(' '));

  const imPaket = paket.helden.map(e => ({ e, v: tabelle.vorlagen.find(x => x.id === e.vorlage) }));
  // Auswahl (06.11.2026): nur gewählte Helden; null/undefined = alle
  let alle = imPaket;
  if (nur !== null && nur !== undefined) {
    if (!Array.isArray(nur) || !nur.length) throw new StartpaketFehler('Wähle mindestens einen Helden.');
    const fremd = nur.filter(id => !imPaket.some(x => x.v.held === id));
    if (fremd.length) throw new StartpaketFehler(`Nicht in diesem Paket: ${fremd.join(', ')}.`);
    alle = imPaket.filter(x => nur.includes(x.v.held));
  }
  const vorhanden = alle.filter(x => H.heldVon(spiel, x.v.held));
  const anzulegen = alle.filter(x => !H.heldVon(spiel, x.v.held));
  if (spiel.helden.length + anzulegen.length > H.MAX_HELDEN) throw new StartpaketFehler(`Dafür ist kein Platz: höchstens ${H.MAX_HELDEN} Helden gleichzeitig, ${spiel.helden.length} sind schon da.`);

  const fokusVorher = spiel.fokus;
  const angebotVorher = spiel.angebot;
  const hinweise = [];
  const ergaenzt = [];
  let s = spiel;
  try {
    // Reihenfolge wie im Paket; vorhandene Helden werden ergänzt, neue angelegt
    for (const { e, v } of alle) {
      if (vorhanden.some(x => x.v.held === v.held)) {
        const r = ergaenzen(s, e, v, heute, heuteK, { tabelle, zuordnung, zielVorlagen, cfg });
        s = r.spiel;
        ergaenzt.push(r.protokoll);
        hinweise.push(...r.hinweise);
        continue;
      }
      s = H.heldHinzufuegen(s, v, e.ziel, heute, zuordnung, rampe, e.warum || null);
      const versatz = Number.isInteger(e.versatzTage) ? e.versatzTage : 0;
      if (versatz > 0) {
        s = JSON.parse(JSON.stringify(s));
        H.heldVon(s, v.held).quest.start = K.tagKey(new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + versatz, 12));
      }
      if (e.zielquest) s = ZQ.verknuepfen(s, v.held, MZ.zielPruefen(zielEingabe(ZQ.zielVorlage(e.zielquest.vorlage, v.gruppe, zielVorlagen), e.zielquest), heuteK).werte).spiel;
      for (const m of e.messziele || []) s = MZ.zielAnlegen(s, v.held, MZ.zielPruefen(messEingabe(m), heuteK).werte).spiel;
      // Ideenglas: Startideen der Fähigkeit bleiben, die eigenen kommen dazu (schon vorhandene Texte werden übersprungen)
      for (const [kat, text] of e.ideen || []) {
        const da = IG.ideenVon(s, v.held, IDEEN_OPT.start, v.faehigkeit).some(x => gleicherName(x.text, text));
        if (!da) s = IG.ideeHinzufuegen(s, v.held, { kat, text }, { ...IDEEN_OPT, faehigkeit: v.faehigkeit }).spiel;
      }
      // Stützgewohnheiten nicht vorziehen: beim Start hat noch kein Held Siege (Freischaltung bleibt im Takt)
      for (const st of e.stuetzen || []) hinweise.push(`${nameVon(tabelle, v.held)}: Stützgewohnheit „${st.name}“ kannst du ab ${cfg.nebenAbSiegen} Siegen anlegen.`);
      if (e.notiz) hinweise.push(`${nameVon(tabelle, v.held)}: ${e.notiz}`);
    }
  } catch (err) {
    throw new StartpaketFehler(`Startpaket nicht angelegt: ${err.message}`);
  }
  const uebersprungen = ergaenzt.filter(p => !summe(p)).map(p => p.heroId);
  if (!anzulegen.length && ergaenzt.every(p => !summe(p))) {
    throw new StartpaketFehler(hinweise.length ? `Nichts ergänzt. ${hinweise.join(' ')}` : 'Schon alles da: Alle Helden und Ziele dieses Pakets sind in deiner Crew.');
  }
  // Fokus: bisheriger Held, sonst der erste neue aus dem Paket. Angebot „neues Abenteuer“ wie nach dem ersten Helden.
  const erster = anzulegen.length ? anzulegen[0].v.held : fokusVorher;
  s = { ...s, fokus: fokusVorher && H.heldVon(s, fokusVorher) ? fokusVorher : erster, angebot: angebotVorher && spiel.helden.length ? angebotVorher : s.angebot };
  return { spiel: s, angelegt: anzulegen.map(x => x.v.held), ergaenzt, uebersprungen, hinweise };
}

function nameVon(tabelle, heroId) {
  const h = tabelle.helden && tabelle.helden[heroId];
  return (h && h.name) || heroId;
}

// „2 Messziele und 1 Idee“ aus einem Protokoll (Einzahl/Mehrzahl). Leer → ''.
const TEILE = [['ziel', 'Ziel', 'Ziele'], ['messziele', 'Messziel', 'Messziele'], ['ideen', 'Idee', 'Ideen'], ['stuetzen', 'Stützgewohnheit', 'Stützgewohnheiten']];
function teileText(neu) {
  const l = TEILE.filter(([k]) => neu[k] > 0).map(([k, ein, mehr]) => `${neu[k]} ${neu[k] === 1 ? ein : mehr}`);
  return l.length > 1 ? `${l.slice(0, -1).join(', ')} und ${l[l.length - 1]}` : l.join('');
}

// Kurztext für die Bestätigung nach dem Anlegen (Namen aus der Tabelle). Je ergänztem Held ein Satz (Entscheidung 3).
export function ergebnisText(r, tabelle) {
  if (!r || !Array.isArray(r.angelegt)) return '';
  const namen = l => l.map(id => nameVon(tabelle, id)).join(', ');
  const teile = [];
  if (r.angelegt.length) teile.push(`Angelegt: ${namen(r.angelegt)}.`);
  for (const p of r.ergaenzt || []) {
    const was = teileText(p.neu);
    const da = p.vorhanden ? `${p.vorhanden} schon vorhanden` : '';
    if (was) teile.push(`${nameVon(tabelle, p.heroId)}: ${was} ergänzt${da ? `, ${da}` : ''}.`);
    else teile.push(`${nameVon(tabelle, p.heroId)}: schon alles da.`);
  }
  return teile.join(' ');
}
