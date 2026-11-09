// Kernlogik: reine Funktionen ohne DOM und ohne Speicher.
// Alle Zahlen (XP, Level, Bosskraft) werden aus dem Stand abgeleitet,
// damit Rückgängig, Neuladen und Nachträge nie doppelte oder fehlende XP erzeugen.

import { anzahlFuer, bereinigeTeilziele, hauptAnzahl, hauptArtId, hauptGrenzen, setzeHauptAnzahl, teilzielAusAnzahl, TEILZIEL_ID, zaehltAntworten, hauptZaehlweise, zaehlweiseVon, setzeHauptZaehlweise, zaehlweisenFuerQuest, bereinigeZaehlweise } from './teilziele.js'; // Teilziele: Fundament (31.10.2026)
import { TEILZIELE } from '../daten/zielarten.js'; // Schritt „Zähler“ (31.10.2026)
import { bereinigeZielLink } from './zielquest.js'; // Ziel-Quests (31.10.2026)
import { pausenTage } from './heldenmodi.js'; // Heldenmodi (04.11.2026)
import { MINDEST } from '../daten/heldenmodi.js'; // Mindestaufgabe im Erhalt (04.11.2026)
import { bedingungenAm, bereinigeBedingungen, werteBedingungen } from './bedingungen.js'; // Bosskette mit Bedingungen (06.11.2026)
import { tageMit } from './antworten.js';
import { AUFFRISCHUNG } from '../daten/auffrischung.js'; // Auffrischung nach langer Pause (Version 159)
import { auffrischungTage } from './auffrischung.js';

export const STAND_VERSION = 1;
export const XP = Object.freeze({ anwendung: 10, sieg: 50, mikro: 5 });
export const MAX_MIKRO_JE_TAG = 10;
export const XP_JE_LEVEL = 60;
export const TITEL = ['Anwärter', 'Wanderer', 'Kämpfer', 'Held', 'Legende'];

// Rangnamen je Stil (Version 80): ein Stil darf eigene Titel mitbringen (stile.js, Feld `titel`).
// Ungültige oder fehlende Liste → TITEL. Ab dem letzten Eintrag bleibt der letzte Titel.
export function titelListe(liste) {
  return Array.isArray(liste) && liste.length && liste.every(t => typeof t === 'string' && t.trim()) ? liste : TITEL;
}
export function titelFuer(level, liste) {
  const l = titelListe(liste);
  const n = Math.max(1, Math.floor(Number(level)) || 1);
  return l[Math.min(l.length - 1, n - 1)];
}
// Nächster Titel nach dieser Stufe, oder null, wenn der letzte schon erreicht ist.
export function naechsterTitel(level, liste) {
  const l = titelListe(liste);
  const n = Math.max(1, Math.floor(Number(level)) || 1);
  return n < l.length ? { titel: l[n], abStufe: n + 1 } : null;
}
// Antworten des Tages-Checks aus dem Register (Version 141: dazu „schwer“, daten/antworten.js)
export { ANTWORTEN } from '../daten/antworten.js';
import { ANTWORTEN } from '../daten/antworten.js';

// ---------- Datum ----------
const pad = n => String(n).padStart(2, '0');

export function tagKey(d) {
  if (!(d instanceof Date) || isNaN(d)) throw new Error('tagKey: ungültiges Datum');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ausTagKey(k) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(k || ''));
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12);
  return tagKey(d) === k ? d : null;
}

// ISO-Woche (Montag bis Sonntag), z. B. "2026-W43".
export function wocheKey(eingabe) {
  const d0 = typeof eingabe === 'string' ? ausTagKey(eingabe) : eingabe;
  if (!d0) throw new Error('wocheKey: ungültiges Datum');
  const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), 12);
  const wt = (d.getDay() + 6) % 7; // Mo = 0
  d.setDate(d.getDate() - wt + 3); // Donnerstag dieser Woche
  const jahr = d.getFullYear();
  const ersterDo = new Date(jahr, 0, 4, 12);
  const nr = 1 + Math.round(((d - ersterDo) / 864e5 - 3 + ((ersterDo.getDay() + 6) % 7)) / 7);
  return `${jahr}-W${pad(nr)}`;
}

// ---------- Runden und Bosskette ----------
// Eine Runde = höchstens 7 Tage gegen einen Gegner. Runde 1 beginnt am Starttag der Quest.
// Ein Sieg beendet die Runde sofort; am Folgetag beginnt die nächste Runde gegen den nächsten Gegner der Kette.
// Ohne Sieg beginnt nach 7 Tagen eine neue Runde gegen denselben Gegner (keine Strafe).
// Nach dem letzten Gegner der Kette kommt der letzte immer wieder (die Kette kann später wachsen).
// Siege werden mit Tag gespeichert ({ tag, gegner }); alle Runden werden daraus abgeleitet.
export const RUNDE_TAGE = 7;
export const RUNDE_RE = /^R\d{1,4}$/;
export const rundeKey = n => `R${n}`;
const MAX_RUNDEN = 2000;
const GEGNER_ID = /^[a-z0-9-]{1,40}$/i;
const tageZwischen = (a, b) => Math.round((ausTagKey(b) - ausTagKey(a)) / 864e5);
function plus(k, n) { const d = ausTagKey(k); d.setDate(d.getDate() + n); return tagKey(d); }

// Feste 7-Tage-Runden ab Start (nur für die Übernahme alter Stände, Version 13).
export function rundeNr(startKey, tagK) {
  if (!ausTagKey(startKey) || !ausTagKey(tagK)) throw new Error('rundeNr: ungültiges Datum');
  return Math.max(1, Math.floor(tageZwischen(startKey, tagK) / RUNDE_TAGE) + 1);
}
export function rundeStart(startKey, n) {
  const d = ausTagKey(startKey);
  if (!d || !Number.isInteger(n) || n < 1) throw new Error('rundeStart: ungültige Eingabe');
  d.setDate(d.getDate() + (n - 1) * RUNDE_TAGE);
  return tagKey(d);
}

// Montag einer ISO-Woche „2026-W43“ (für die Übernahme alter Stände).
export function isoMontag(w) {
  const m = /^(\d{4})-W(\d{2})$/.exec(String(w || ''));
  if (!m) return null;
  const d = new Date(+m[1], 0, 4, 12);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + (+m[2] - 1) * 7);
  return tagKey(d);
}

// Startpaket (02.11.2026, Punkt 18a): Beginnt die Quest erst nach heute (Versatz)? Dann ist heute nichts zu tun:
// die Heldentat zeigt nur „beginnt …“, Tagesleiste, Wechsel und Lagerfeuer zählen den Helden nicht als offen.
export function vorBeginn(stand, heuteK) {
  const s = stand && stand.quest && stand.quest.start;
  return !!ausTagKey(s) && typeof heuteK === 'string' && s > heuteK;
}
// Questbeginn mit Rückfall: gespeicherter Start → frühester Eintrag → heute.
export function questStart(stand, heuteK) {
  if (stand.quest && ausTagKey(stand.quest.start)) return stand.quest.start;
  return Object.keys(stand.tage || {}).sort()[0] || heuteK;
}

// Gegner-Kette der Quest (nie leer, solange eine Quest besteht).
export function kette(stand) {
  const k = stand.quest && Array.isArray(stand.quest.kette) ? stand.quest.kette : [];
  return k.length ? k : [null];
}

// Ruhetage (Version 90): bewusst ausgesetzte Tage eines Helden. Sie kommen aus spiel.eintraege (Art „ruhetag“) und werden
// von helden.ansicht() als stand.ruhetage (Liste von Tagen) übergeben; im Heldenstand selbst werden sie nie gespeichert.
// Jeder Ruhetag in einer Runde verlängert sie um einen Tag; Ziel und Gegnerkraft bleiben gleich. Ein Tag mit „Ja“ zählt
// als Treffer, nicht als Ruhetag (er verlängert nichts). Wie oft und wann: daten/ruhetag.js, logik/ruhetag.js.
// Beständigkeit (04.11.2026): Ein Tag, der für das Haupt-Teilziel zählt (auch „Keine Versuchung“), ist kein Ruhetag.
export function ruhetageVon(stand) {
  const roh = stand && Array.isArray(stand.ruhetage) ? stand.ruhetage : [];
  const tage = (stand && stand.tage) || {};
  const zaehlt = zaehltAntworten(stand && stand.quest);
  return [...new Set(roh.filter(t => typeof t === 'string' && ausTagKey(t) && !zaehlt.includes(tage[t])))].sort();
}
// Tage, die für das Haupt-Teilziel zählen (bis einschließlich bisK). Zähler: „ja“; Beständigkeit: „ja“ und „nein“.
export function zaehlTage(stand, bisK) {
  // Wie vorher bei „ja“: ein Stand ohne tage wirft (ein defekter Held wird so gemeldet statt still leer gezeigt)
  const zaehlt = zaehltAntworten(stand.quest);
  return Object.keys(stand.tage).filter(t => zaehlt.includes(stand.tage[t]) && (!bisK || t <= bisK));
}

// Neuanfänge (Version 98, „Frisch anfangen“ in Willkommen zurück): wie Ruhetage aus spiel.eintraege (Art „neustart“),
// von helden.ansicht() als stand.neustarts übergeben. Ein Neuanfang am Tag N beendet die laufende Runde still am Vortag
// (ohne Sieg, ohne Strafe); ab N läuft eine neue Runde mit voller Gegnerkraft. Gegner, Siege und XP bleiben.
export function neustartsVon(stand) {
  const roh = stand && Array.isArray(stand.neustarts) ? stand.neustarts : [];
  return [...new Set(roh.filter(t => typeof t === 'string' && ausTagKey(t)))].sort();
}

// Pausen (Heldenmodi, 04.11.2026): Tage in Erhalt oder Ruhe. Sie kommen aus spiel.modi und werden von helden.ansicht()
// als stand.pausen (Zeiträume { von, bis|null }) übergeben, nie im Heldenstand gespeichert. Ein Pausentag verlängert die
// Runde wie ein Ruhetag (ohne Kontingent), und ein „Ja“ an einem Pausentag zählt nicht für den Gegner (keine Treffer,
// kein Sieg); XP für das „Ja“ bleiben. Gezählt wird nur ab Questbeginn bis heute: eine laufende Pause wächst Tag für Tag.
export function pausenVon(stand, heuteK) {
  const z = stand && Array.isArray(stand.pausen) ? stand.pausen : [];
  if (!z.length || !ausTagKey(heuteK)) return [];
  return pausenTage(z, questStart(stand, heuteK), heuteK);
}

// Alle Runden bis zur aktuellen. Liefert { runden, aktuell } – aktuell ist die Runde, in der heute
// gekämpft wird: die Runde von heute oder, wenn heute ein Sieg war, die nächste (beginnt morgen).
export function runden(stand, heuteK) {
  const start = questStart(stand, heuteK);
  const k = kette(stand);
  // Nur bis heute: Einträge „aus der Zukunft“ (Testprofil mit Zeitsprung zurück) verschieben keine Runden.
  const siegTage = [...new Set((stand.siege || []).map(x => x.tag))].filter(t => t <= heuteK).sort();
  const ja = new Set(zaehlTage(stand, heuteK)); // Beständigkeit: auch „nein“ (Keine Versuchung) zählt für den Gegner
  const pause = new Set(pausenVon(stand, heuteK)); // Heldenmodi: Pausentage verlängern und zählen nicht
  const ruheEcht = new Set(ruhetageVon(stand));
  const ruhe = [...new Set([...ruheEcht, ...pause])].sort();
  const neu = neustartsVon(stand).filter(t => t <= heuteK); // nur bis heute, wie die Siege
  const liste = [];
  let von = start, siege = 0, gegnerVorher = null;
  for (let nr = 1; nr <= MAX_RUNDEN; nr++) {
    // Ruhetage verlängern die Runde; ein Ruhetag am verlängerten Ende verlängert erneut (endet, weil die Liste endlich ist)
    let bisMax = plus(von, RUNDE_TAGE - 1), ruhetage = [];
    for (;;) {
      ruhetage = ruhe.filter(t => t >= von && t <= bisMax);
      const neu = plus(von, RUNDE_TAGE - 1 + ruhetage.length);
      if (neu === bisMax) break;
      bisMax = neu;
    }
    // Zählweise Wache (04.11.2026): Runde ohne Zeitlimit, sie wächst bis heute und endet nur mit einem Sieg (oder Neuanfang)
    if (zaehlweiseVon(hauptZaehlweise(stand.quest, nr)).rundeOffen && heuteK > bisMax) bisMax = heuteK;
    let sieg = siegTage.find(t => t >= von && t <= bisMax) || null;
    // Neuanfang in dieser Runde (nicht am ersten Tag, nicht nach einem Sieg): Runde endet am Vortag
    const neustart = neu.find(t => t > von && t <= bisMax && !(sieg && sieg < t)) || null;
    if (neustart) sieg = null; // ein Sieg ab dem Neuanfang gehört zur neuen Runde
    const bis = neustart ? plus(neustart, -1) : sieg || bisMax;
    if (sieg || neustart) ruhetage = ruhetage.filter(t => t <= bis); // danach gehören sie zur nächsten Runde
    const idx = Math.min(siege, k.length - 1);
    const gegner = k[idx];
    let anwendungen = 0;
    for (const t of ja) if (t >= von && t <= bis && !pause.has(t)) anwendungen++;
    // siegeVorher (30.10.2026): Siege vor dieser Runde, bestimmt das Rundenziel der Einstiegsrampe (rundenZiel)
    const pausen = ruhetage.filter(t => pause.has(t));
    ruhetage = ruhetage.filter(t => !pause.has(t) || ruheEcht.has(t));
    const r = { nr, key: rundeKey(nr), von, bis, bisMax, ruhetage, pausen, sieg, neustart: !!neustart, gegner, gegnerIdx: idx, neuerGegner: nr > 1 && gegner !== gegnerVorher, anwendungen, siegeVorher: siege };
    liste.push(r);
    if (von > heuteK) return { runden: liste, aktuell: r };
    if (bis >= heuteK && !sieg && !neustart) return { runden: liste, aktuell: r };
    if (sieg) siege++;
    gegnerVorher = gegner;
    von = plus(bis, 1);
  }
  throw new Error('runden: zu viele Runden');
}

// Zählweise, die heute gilt (Runde von heute; nach einem Sieg die schon begonnene nächste). Eintrag aus dem Register
// mit id; ohne Quest oder bei kaputtem Stand der Standard (täglich). Wirft nie.
export function zaehlweiseHeute(stand, heuteK) {
  try {
    if (!stand || !stand.quest) return zaehlweiseVon(null);
    return zaehlweiseVon(hauptZaehlweise(stand.quest, runden(stand, heuteK).aktuell.nr));
  } catch (e) { return zaehlweiseVon(null); }
}

// ---------- Einstiegsrampe (30.10.2026) ----------
// Gegner werden schwerer, bis das eigene Ziel erreicht ist: der erste braucht `start` Anwendungen, jeder weitere
// `schritt` mehr, höchstens quest.anzahl (das Ziel). Danach bleibt es beim Ziel (mehr nur freiwillig, siehe Backlog).
// Die Regel wird beim Anlegen der Quest aus daten/rampe.js übernommen (quest.rampe) und gilt fest für diese Quest.
// Ohne quest.rampe (Quests vor dieser Version, Entscheidung 30.10.2026) gilt in jeder Runde quest.anzahl wie bisher.
export const RAMPE_GRENZEN = Object.freeze({ startMax: 7, schrittMax: 6 });
// Gültige Rampe oder null (aus). Wirft nie.
export function bereinigeRampe(roh) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
  const { start, schritt } = roh;
  if (!Number.isInteger(start) || start < 1 || start > RAMPE_GRENZEN.startMax) return null;
  if (!Number.isInteger(schritt) || schritt < 1 || schritt > RAMPE_GRENZEN.schrittMax) return null;
  return { start, schritt };
}
// Lesbare Fehler einer Rampen-Einstellung (null = Rampe aus ist gültig).
export function pruefeRampe(roh) {
  if (roh === null) return [];
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return ['Rampe muss ein Objekt { start, schritt } oder null sein'];
  const f = [];
  if (!Number.isInteger(roh.start) || roh.start < 1 || roh.start > RAMPE_GRENZEN.startMax) f.push(`start muss eine ganze Zahl von 1 bis ${RAMPE_GRENZEN.startMax} sein`);
  if (!Number.isInteger(roh.schritt) || roh.schritt < 1 || roh.schritt > RAMPE_GRENZEN.schrittMax) f.push(`schritt muss eine ganze Zahl von 1 bis ${RAMPE_GRENZEN.schrittMax} sein`);
  return f;
}
// Anwendungen, die eine Runde braucht, nach siegeVorher Siegen. Ohne gültige Quest-Anzahl: 3 (wie migriere).
// Seit den Teilzielen (31.10.2026) zählt die Anzahl des Haupt-Teilziels (logik/teilziele.js, Fallback quest.anzahl bzw. 3).
// nr (Schritt „Zähler“): Runde, für die das Ziel gilt (Anzahl-Verlauf); ohne nr der neueste Wert.
// Ziel der Runde, die am Tag tagK mit einem Sieg endete (02.11.2026). Am Siegtag zeigt die Bühne den Besiegten grau mit
// leerem Balken; die Zahl der Segmente muss zu SEINER Runde passen, nicht zur schon begonnenen nächsten (Einstiegsrampe:
// Kapitel 2 brauchte 2 Treffer, die neue Runde braucht 3). Kein Sieg an diesem Tag oder Fehler → null.
export function siegRundenZiel(stand, tagK) {
  if (!stand || typeof tagK !== 'string') return null;
  try {
    const r = runden(stand, tagK).runden.find(x => x.sieg === tagK);
    return r ? rundenZiel(stand.quest, r.siegeVorher, r.nr) : null;
  } catch (e) { return null; }
}
export function rundenZiel(quest, siegeVorher, nr) {
  const ziel = quest ? hauptAnzahl(quest, nr) : 3;
  const r = bereinigeRampe(quest && quest.rampe);
  if (!r) return ziel;
  const n = Number.isInteger(siegeVorher) && siegeVorher > 0 ? siegeVorher : 0;
  return Math.max(1, Math.min(ziel, r.start + n * r.schritt));
}

// Runde, zu der ein Tag gehört (für den Tages-Check).
function rundeVonTag(stand, tagK) {
  const { runden: l } = runden(stand, tagK);
  return l.find(r => r.von <= tagK && r.bis >= tagK) || l[l.length - 1];
}

// Alte Stände (Version 1–13): Sieg-Wochen/-Runden → Sieg-Tage.
// Runde der alten Zählung = feste 7 Tage ab Start; Sieg-Tag = Tag, an dem das Ziel erreicht wurde, sonst letzter „ja“, sonst Rundenende.
function siegeAusAlt(alt, start, tage, anzahl, k) {
  const altRunde = w => {
    if (RUNDE_RE.test(w)) return +w.slice(1);
    const mo = isoMontag(w);
    if (!mo) return null;
    const woche = Array.from({ length: 7 }, (_, i) => plus(mo, i));
    const jaW = woche.filter(t => tage[t] === 'ja');
    return rundeNr(start, jaW.length ? jaW[jaW.length - 1] : woche[6]);
  };
  const nrs = new Set(alt.filter(w => typeof w === 'string').map(altRunde).filter(n => n));
  // Runden, in denen das Ziel erreicht war, zählen ebenfalls als Sieg
  const jeRunde = {};
  for (const t of Object.keys(tage).sort()) if (tage[t] === 'ja') (jeRunde[rundeNr(start, t)] = jeRunde[rundeNr(start, t)] || []).push(t);
  for (const [n, l] of Object.entries(jeRunde)) if (l.length >= anzahl) nrs.add(+n);
  return [...nrs].sort((a, b) => a - b).map((n, i) => {
    const l = jeRunde[n] || [];
    const tag = l.length >= anzahl ? l[anzahl - 1] : (l[l.length - 1] || plus(rundeStart(start, n), RUNDE_TAGE - 1));
    return { tag, gegner: k[Math.min(i, k.length - 1)] };
  });
}

// ---------- Stand ----------
export const HAKEN_JE_TAG = TEILZIELE.max + TEILZIELE.archivMax;
export function neuerStand(profilId) {
  return {
    v: STAND_VERSION,
    profilId: String(profilId || 'unbekannt'),
    onboarding: { fertig: false, bereich: null, problem: null, ziel: null, freitext: '' },
    quest: null,       // { vorlageId, ziel, anzahl, start, kette: [gegnerId, …], teilziele: [{ id, art, haupt, anzahl, zeitraum }] }
    tage: {},          // { 'YYYY-MM-DD': 'ja' | 'nein' | 'schwer' } (daten/antworten.js)
    siege: [],         // [{ tag: 'YYYY-MM-DD', gegner }] – je Sieg ein Eintrag, bleibt auch bei Rückgängig
    mikro: {},         // { 'YYYY-MM-DD': ['mikro-id', …] } erledigte Mikroquests
    haken: {},         // { 'YYYY-MM-DD': ['tz2', …] } abgehakte Stützgewohnheiten (Schritt „Zähler“, ohne XP)
    story: { gelesen: {} }, // { 'R1': Anzahl gelesener Teile }
    stil: { aktiv: 'fantasy', frei: false, angeboten: false }
  };
}

// Prüft einen geladenen Stand und ersetzt Ungültiges durch sinnvolle Werte.
// Liefert immer einen benutzbaren Stand; wirft nie.
export function migriere(roh, profilId, stilIds = ['fantasy']) {
  const s = neuerStand(profilId);
  if (!roh || typeof roh !== 'object') return s;
  if (typeof roh.profilId === 'string' && roh.profilId) s.profilId = roh.profilId;

  const o = roh.onboarding || {};
  s.onboarding = {
    fertig: o.fertig === true,
    bereich: typeof o.bereich === 'string' ? o.bereich : null,
    problem: typeof o.problem === 'string' ? o.problem : null,
    ziel: typeof o.ziel === 'string' ? o.ziel : null,
    freitext: typeof o.freitext === 'string' ? o.freitext.slice(0, 200) : ''
  };

  const q = roh.quest;
  if (q && typeof q === 'object' && typeof q.vorlageId === 'string') {
    const anzahl = Number.isInteger(q.anzahl) && q.anzahl >= 1 && q.anzahl <= 7 ? q.anzahl : 3;
    s.quest = {
      vorlageId: q.vorlageId,
      ziel: typeof q.ziel === 'string' && q.ziel.trim() ? q.ziel.slice(0, 120) : 'Mein Ziel',
      anzahl,
      start: ausTagKey(q.start) ? q.start : null,
      kette: Array.isArray(q.kette) ? q.kette.filter(x => typeof x === 'string' && GEGNER_ID.test(x)).slice(0, 50) : [],
      // Teilziele (31.10.2026): fehlen sie (alle Quests vor dieser Version), wird quest.anzahl zum ersten Teilziel
      // „Zähler, Zeitraum Runde“. Läuft bei jedem Laden und legt nichts doppelt an. quest.anzahl bleibt als Spiegel.
      teilziele: bereinigeTeilziele(q.teilziele, anzahl)
    };
    s.quest.anzahl = anzahlFuer(s.quest.teilziele[0]); // Spiegel: neuester Wert des Haupt-Teilziels
    const rampe = bereinigeRampe(q.rampe); // fehlt bei Quests vor der Einstiegsrampe → bleibt ohne (feste Anzahl)
    if (rampe) s.quest.rampe = rampe;
    const warum = bereinigeWarum(q.warum); // Warum-Feld (Version 75): fehlt bei älteren Quests → bleibt ohne
    if (warum) s.quest.warum = warum;
    bereinigeZielLink(q, s.quest); // Ziel-Quests (31.10.2026): Verknüpfung zum Messziel; fehlt bei allen älteren Quests
    // Bosskette mit Bedingungen (06.11.2026): nur Quests, die mit dem Feld angelegt wurden (auch []), behalten es. Fehlt es
    // (alle älteren Quests), bleibt es weg: dort gelten weiter nur die Treffer (Entscheidung 4, 06.11.2026).
    if (Array.isArray(q.bedingungen)) s.quest.bedingungen = bereinigeBedingungen(q.bedingungen, s.quest.kette.length);
  }
  if (s.onboarding.fertig && !s.quest) s.onboarding.fertig = false;

  if (roh.tage && typeof roh.tage === 'object') {
    for (const [k, v] of Object.entries(roh.tage)) {
      if (ausTagKey(k) && ANTWORTEN.includes(v)) s.tage[k] = v;
    }
  }
  const start = questStart(s, tagKey(new Date()));
  if (Array.isArray(roh.siege)) {
    const gesehen = new Set();
    for (const x of roh.siege) {
      if (!x || !ausTagKey(x.tag) || gesehen.has(x.tag)) continue;
      gesehen.add(x.tag);
      s.siege.push({ tag: x.tag, gegner: typeof x.gegner === 'string' && GEGNER_ID.test(x.gegner) ? x.gegner : null });
    }
    s.siege.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  } else if (s.quest && (Array.isArray(roh.siegeWochen) || Object.keys(s.tage).length)) {
    s.siege = siegeAusAlt(Array.isArray(roh.siegeWochen) ? roh.siegeWochen : [], start, s.tage, s.quest.anzahl, kette(s));
  }
  if (roh.mikro && typeof roh.mikro === 'object') {
    for (const [k, v] of Object.entries(roh.mikro)) {
      if (!ausTagKey(k) || !Array.isArray(v)) continue;
      const ids = [...new Set(v.filter(x => typeof x === 'string' && /^[a-z0-9-]{1,40}$/.test(x)))].slice(0, MAX_MIKRO_JE_TAG);
      if (ids.length) s.mikro[k] = ids;
    }
  }
  // Stützgewohnheiten (Schritt „Zähler“, 31.10.2026): fehlt bei älteren Ständen → leer. Auch IDs archivierter Teilziele
  // bleiben (Logbuch); je Tag höchstens HAKEN_JE_TAG verschiedene IDs.
  if (roh.haken && typeof roh.haken === 'object' && !Array.isArray(roh.haken)) {
    for (const [k, v] of Object.entries(roh.haken)) {
      if (!ausTagKey(k) || !Array.isArray(v)) continue;
      const ids = [...new Set(v.filter(x => typeof x === 'string' && TEILZIEL_ID.test(x)))].slice(0, HAKEN_JE_TAG);
      if (ids.length) s.haken[k] = ids;
    }
  }
  const g = roh.story && roh.story.gelesen;
  if (g && typeof g === 'object') {
    for (const [w, n] of Object.entries(g)) {
      if (!Number.isInteger(n) || n < 0) continue;
      let r = RUNDE_RE.test(w) ? w : null;
      const mo = r ? null : isoMontag(w);
      if (mo) r = rundeKey(rundeNr(start, plus(mo, 6)));
      if (r) s.story.gelesen[r] = Math.max(s.story.gelesen[r] || 0, Math.min(n, 7));
    }
  }
  const st = roh.stil || {};
  s.stil = {
    aktiv: stilIds.includes(st.aktiv) ? st.aktiv : 'fantasy',
    frei: st.frei === true || s.siege.length > 0,
    angeboten: st.angeboten === true
  };
  return s;
}

const kopie = s => JSON.parse(JSON.stringify(s));

// ---------- Vorlagen ----------
// gruppeId = Onboarding-Gruppe (im Stand als onboarding.bereich gespeichert).
export function vorlageFuer(tabelle, gruppeId, problemId) {
  const zeilen = (tabelle && tabelle.vorlagen) || [];
  return zeilen.find(z => z.gruppe === gruppeId && z.problem === problemId)
    || zeilen.find(z => z.gruppe === gruppeId && z.problem === '*')
    || zeilen.find(z => z.gruppe === '*' && z.problem === '*')
    || null;
}

// Gegner-Kette einer Vorlage: `kette` oder nur `gegner`.
export function gegnerKette(vorlage) {
  const k = Array.isArray(vorlage && vorlage.kette) && vorlage.kette.length ? vorlage.kette : [vorlage && vorlage.gegner];
  return k.filter(x => typeof x === 'string' && GEGNER_ID.test(x));
}

// Warum-Feld (Version 75): optionaler eigener Grund für die Quest („Warum ist dir das wichtig?“).
// Leer oder kein Text → null (Feld fehlt in der Quest). Zu lang wird gekürzt; Zeilenumbrüche werden zu Leerzeichen.
// Der Text bleibt im Spielstand und geht nie in Analytics (dort zählt nur das Ereignis quest_why_set).
export const WARUM_MAX = 200;
export function bereinigeWarum(roh) {
  if (typeof roh !== 'string') return null;
  const t = roh.replace(/\s+/g, ' ').trim().slice(0, WARUM_MAX).trim();
  return t || null;
}

// rampe (30.10.2026): Einstiegsrampe aus daten/rampe.js; null/ungültig = feste Anzahl in jeder Runde.
// warum (Version 75): optionaler Grund, siehe bereinigeWarum.
export function questAnlegen(stand, vorlage, zielText, heute, rampe = null, warum = null) {
  if (!vorlage) throw new Error('Keine Vorlage für diese Auswahl gefunden.');
  const s = kopie(stand);
  const vq = vorlage.quest || {};
  const anzahl = Number.isInteger(vq.anzahl) ? vq.anzahl : 3;
  // Teilziele (31.10.2026): ein Haupt-Teilziel; seine Art kommt aus der Vorlage (Beständigkeit, 04.11.2026), sonst Zähler.
  // Die Anzahl richtet sich nach den Grenzen der Art (Beständigkeit höchstens 6), quest.anzahl bleibt ihr Spiegel.
  const tz = teilzielAusAnzahl(Math.min(7, Math.max(1, anzahl)), 'tz1', undefined, undefined, typeof vq.art === 'string' ? vq.art : undefined);
  // Zählweise der Vorlage (06.11.2026, z. B. Wutwald: Wache); passt sie nicht zur Art, gilt der Standard (täglich)
  const zw = bereinigeZaehlweise(vq.zaehlweise, tz.art);
  if (zw && zw !== zaehlweiseVon(null).id) tz.zaehlweise = zw;
  s.quest = {
    vorlageId: vorlage.id,
    ziel: String(zielText || vorlage.ziel || 'Mein Ziel').trim().slice(0, 120) || 'Mein Ziel',
    anzahl: tz.anzahl,
    start: tagKey(heute),
    kette: gegnerKette(vorlage)
  };
  // Bosskette mit Bedingungen (06.11.2026): immer als Feld (auch []), damit spätere Bedingungen der Vorlage beim Laden
  // ankommen (helden.js, ketteAuffrischen). Ältere Quests haben das Feld nicht und bekommen keine.
  s.quest.bedingungen = bereinigeBedingungen(vorlage.bedingungen, s.quest.kette.length);
  s.quest.teilziele = [tz];
  // Eigene Rampe der Vorlage (04.11.2026, z. B. Wutwald 3 · 4 · 5 · 6) geht vor der allgemeinen aus daten/rampe.js
  const r = bereinigeRampe(vq.rampe) || bereinigeRampe(rampe);
  if (r) s.quest.rampe = r;
  const w = bereinigeWarum(warum);
  if (w) s.quest.warum = w;
  s.onboarding.fertig = true;
  return s;
}

// ---------- Auswertung ----------
export function levelAus(xp) {
  const x = Math.max(0, Math.floor(xp || 0));
  const level = Math.floor(x / XP_JE_LEVEL) + 1;
  return {
    xp: x,
    level,
    imLevel: x % XP_JE_LEVEL,
    proLevel: XP_JE_LEVEL,
    titel: TITEL[Math.min(TITEL.length - 1, level - 1)]
  };
}

export function auswertung(stand, heute) {
  const heuteK = tagKey(heute);
  const { runden: alle, aktuell: r } = runden(stand, heuteK);
  // Einstiegsrampe: anzahl = Ziel dieser Runde; zielAnzahl = eigenes Ziel (quest.anzahl)
  const anzahl = stand.quest ? rundenZiel(stand.quest, r.siegeVorher, r.nr) : 3;
  const zielAnzahl = stand.quest ? hauptAnzahl(stand.quest, r.nr) : 3;
  // Schritt „Zähler“: eigenes Ziel ab der nächsten Runde (weicht ab, wenn eine Änderung noch wartet)
  const naechsteZielAnzahl = stand.quest ? hauptAnzahl(stand.quest, r.nr + 1) : 3;
  const jaTage = Object.keys(stand.tage).filter(k => stand.tage[k] === 'ja');
  const wocheZaehler = r.anwendungen;
  const treffer = Math.min(wocheZaehler, anzahl);
  const mikroZahl = Object.values(stand.mikro || {}).reduce((x, v) => x + v.length, 0);
  const siege = (stand.siege || []).length;
  // Mindestaufgabe im Erhalt (04.11.2026): Tage mit XP kommen aus spiel.mindest (helden.ansicht → stand.mindestXp)
  const mindestZahl = new Set((Array.isArray(stand.mindestXp) ? stand.mindestXp : []).filter(t => ausTagKey(t))).size;
  // Auffrischung nach langer Pause (Version 159, Entscheidungen Abschnitt 29): einmaliger Bonus am ersten guten Tag nach einer
  // Lücke von AUFFRISCHUNG.abTage Tagen (Ruhetage und Pausen zählen nicht). Abgeleitet wie alle XP: nichts gespeichert, kein Feld.
  const auffrischung = auffrischungTage({ tage: stand.tage, ruhe: [...ruhetageVon(stand), ...pausenVon(stand, heuteK)], zaehlt: zaehltAntworten(stand.quest), bisK: heuteK });
  // Kapitel-Archiv (Version 171): XP früherer Kapitel dieses Helden (helden.ansicht → stand.xpFrueher, abgeleitet aus dem Archiv)
  const xpFrueher = Number.isInteger(stand.xpFrueher) && stand.xpFrueher > 0 ? stand.xpFrueher : 0;
  const siegeFrueher = Number.isInteger(stand.siegeFrueher) && stand.siegeFrueher > 0 ? stand.siegeFrueher : 0;
  const xp = jaTage.length * XP.anwendung + siege * XP.sieg + mikroZahl * XP.mikro + mindestZahl * (XP[MINDEST.xp] || 0) + auffrischung.length * AUFFRISCHUNG.xp + xpFrueher;
  const vorige = alle.length > 1 ? alle[alle.length - 2] : null;
  const k = kette(stand);
  const zw = zaehlweiseVon(hauptZaehlweise(stand.quest, r.nr));
  return {
    heute: heuteK,
    woche: r.key,            // Schlüssel der laufenden Runde (Name „woche“ beibehalten)
    wocheNr: r.nr,
    rundeVon: r.von,
    rundeBis: r.bisMax,      // Version 90: mit Ruhetagen verlängert
    ruhetageRunde: r.ruhetage.slice(),
    rundeTag: tageZwischen(r.von, heuteK), // 0 = erster Tag, −1 = Runde beginnt morgen (nach Sieg heute)
    naechsteRunde: plus(r.bisMax, 1),
    gegner: r.gegner,
    gegnerNr: r.gegnerIdx + 1,
    gegnerAnzahl: k.length,
    neuerGegner: r.neuerGegner,
    ersteRundeGegner: r.nr === 1 || r.neuerGegner,
    siegHeute: (stand.siege || []).some(x => x.tag === heuteK),
    vorigeGewonnen: !!(vorige && vorige.sieg),
    anzahl,
    zielAnzahl,
    naechsteZielAnzahl,
    rampe: !!(stand.quest && bereinigeRampe(stand.quest.rampe)),
    zielArt: hauptArtId(stand.quest), // Beständigkeit (04.11.2026): Art des Haupt-Teilziels
    // Zählweisen (04.11.2026): Zählweise der laufenden Runde; ohneFrage = Held gilt nie als „offen“, rundeOffen = Wache
    zaehlweise: zw.id,
    ohneFrage: !zw.tagesfrage,
    rundeOffen: zw.rundeOffen,
    siegeVorher: r.siegeVorher,
    vorigeAnzahl: vorige && stand.quest ? rundenZiel(stand.quest, vorige.siegeVorher, vorige.nr) : null,
    wocheZaehler,
    treffer,
    bossKraft: anzahl ? (anzahl - treffer) / anzahl : 1,
    // Bosskette mit Bedingungen (06.11.2026): Treffer sind voll, aber eine Bedingung des Gegners ist noch offen. Dann gilt er
    // nicht als besiegt (kein grauer Gegner, kein „geschafft“), die Oberfläche zeigt, was noch fehlt.
    bedingungenOffen: treffer >= anzahl && bedingungenAm(stand.quest, r.gegnerIdx).length > 0 && !bedingungenStand(stand, heuteK, r).erfuellt,
    besiegtDieseWoche: false, // Runde endet mit dem Sieg; die laufende Runde ist nie schon gewonnen
    siege,
    siegeGesamt: siege + siegeFrueher, // mit früheren Kapiteln (Version 171)
    heuteAntwort: stand.tage[heuteK] || null,
    // Auffrischung (Version 159): Bonus-XP von heute (0 = keiner) für die leise Zeile nach dem Check (ansicht/buehne.js)
    auffrischungHeute: auffrischung.includes(heuteK) ? AUFFRISCHUNG.xp : 0,
    mikroHeute: ((stand.mikro || {})[heuteK] || []).slice(),
    eintraegeWoche: Object.keys(stand.tage).filter(t => t >= r.von && t <= heuteK).length,
    ...levelAus(xp)
  };
}

export function wochenMontag(k) {
  const d = ausTagKey(k);
  if (!d) throw new Error('wochenMontag: ungültiges Datum');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return tagKey(d);
}

// ---------- Tages-Check ----------
// antwort: 'ja' (angewendet), 'nein' (heute nicht gebraucht), 'schwer' (war schwer, zählt neutral; Version 141) oder null (rückgängig).
// Liefert den neuen Stand und die Ereignisse für Belohnung und Feiern.
export function tagesCheck(stand, heute, antwort) {
  if (!stand.quest) throw new Error('Es gibt noch keine Quest.');
  if (antwort !== null && !ANTWORTEN.includes(antwort)) throw new Error(`Unbekannte Antwort: ${antwort}`);
  const vorher = auswertung(stand, heute);
  const s = kopie(stand);
  const k = tagKey(heute);
  if (antwort === null) delete s.tage[k];
  else s.tage[k] = antwort;

  const ereignisse = siegPruefen(s, heute);
  const nachher = auswertung(s, heute);
  const delta = nachher.xp - vorher.xp;
  if (delta !== 0) ereignisse.unshift({ typ: 'xp', xp: delta });
  if (nachher.level > vorher.level) ereignisse.push({ typ: 'levelup', level: nachher.level, titel: nachher.titel });
  ereignisse.push({ typ: 'besuch', antwort });
  return { stand: s, ereignisse, vorher, nachher };
}

// Sieg in der Runde von heute vergeben, wenn das Ziel erreicht ist (ändert s direkt, liefert Ereignisse).
// Ein Sieg bleibt, auch wenn später rückgängig gemacht wird (keine Strafe, keine doppelte Vergabe).
function siegPruefen(s, heute) {
  const k = tagKey(heute);
  const r = rundeVonTag(s, k);
  return siegVergeben(s, k, r, r.anwendungen);
}
// Sieg am Tag k in Runde r, wenn `anwendungen` (bis einschließlich k) das Rundenziel erreichen. Ändert s direkt.
function siegVergeben(s, k, r, anwendungen) {
  const ereignisse = [];
  const ziel = rundenZiel(s.quest, r.siegeVorher, r.nr);
  // Bosskette mit Bedingungen (06.11.2026): Treffer allein reichen nicht, wenn der Gegner Bedingungen hat
  if (!r.sieg && anwendungen >= ziel && bedingungenStand(s, k, r).erfuellt) {
    s.siege = [...s.siege, { tag: k, gegner: r.gegner }].sort((a, b) => (a.tag < b.tag ? -1 : 1));
    const danach = auswertung(s, ausTagKey(k));
    // anzahl: was dieser Sieg gebraucht hat; naechsteAnzahl: Ziel der nächsten Runde (Einstiegsrampe)
    ereignisse.push({ typ: 'sieg', woche: r.key, gegner: r.gegner, naechster: danach.gegner, neuerGegner: danach.neuerGegner, kapitel: danach.gegnerNr, anzahl: ziel, naechsteAnzahl: danach.anzahl });
    if (!s.stil.frei) {
      s.stil.frei = true;
      ereignisse.push({ typ: 'stil_frei' });
    }
  }
  return ereignisse;
}

// Sieg nachholen (06.11.2026): Erfüllt ein später gespeicherter Eintrag (Begegnung mit Gestalt, Fähigkeit, Schwierigkeit)
// die letzte Bedingung, fällt der Gegner heute, ohne dass sich eine Antwort ändert. Gleiche Rückgabe wie tagesCheck;
// ohne neuen Sieg: { stand (unverändert), ereignisse: [] }. Wirft nicht bei fehlender Quest.
export function siegNachholen(stand, heute) {
  if (!stand || !stand.quest) return { stand, ereignisse: [], vorher: null, nachher: null };
  const vorher = auswertung(stand, heute);
  const s = kopie(stand);
  const ereignisse = siegPruefen(s, heute);
  if (!ereignisse.length) return { stand, ereignisse: [], vorher, nachher: vorher };
  const nachher = auswertung(s, heute);
  const delta = nachher.xp - vorher.xp;
  if (delta !== 0) ereignisse.unshift({ typ: 'xp', xp: delta });
  if (nachher.level > vorher.level) ereignisse.push({ typ: 'levelup', level: nachher.level, titel: nachher.titel });
  return { stand: s, ereignisse, vorher, nachher };
}

// ---------- Bedingungen der Bosskette (06.11.2026, logik/bedingungen.js) ----------
// Stand der Bedingungen des Gegners in Runde `runde` (Standard: die laufende Runde) am Tag tagK. Gezählt wird über alle
// Runden gegen denselben Kettenplatz (ab der ersten Runde gegen ihn), nur Begegnungen an gezählten Tagen außerhalb von
// Pausen. Begegnungen und schwere Tage aus Einträgen kommen von helden.ansicht() (stand.begegnungen, stand.schwerTage),
// schwere Antworten aus den Tagen. Liefert { gegnerIdx, von, liste, erfuellt, offen } (logik/bedingungen.js,
// werteBedingungen); ohne Bedingungen erfuellt = true und liste = []. Wirft nie.
export function bedingungenStand(stand, tagK, runde = null) {
  const leer = { gegnerIdx: runde ? runde.gegnerIdx : null, von: null, liste: [], erfuellt: true, offen: new Set() };
  try {
    if (!stand || !stand.quest || !Array.isArray(stand.quest.bedingungen) || !ausTagKey(tagK)) return leer;
    const alle = runden(stand, tagK);
    const r = runde || alle.aktuell;
    const liste = bedingungenAm(stand.quest, r.gegnerIdx);
    if (!liste.length) return { ...leer, gegnerIdx: r.gegnerIdx };
    const erste = alle.runden.find(x => x.gegnerIdx === r.gegnerIdx);
    const von = erste && erste.von < r.von ? erste.von : r.von;
    const pause = new Set(pausenVon(stand, tagK));
    const gute = zaehlTage(stand, tagK).filter(t => t >= von && !pause.has(t));
    const gut = new Set(gute);
    const begegnungen = (Array.isArray(stand.begegnungen) ? stand.begegnungen : []).filter(b => b && gut.has(b.tag));
    const schwerRoh = [...(Array.isArray(stand.schwerTage) ? stand.schwerTage : []), ...tageMit(stand.tage, 'schwer', tagK)];
    const schwer = schwerRoh.filter(t => typeof t === 'string' && t >= von && t <= tagK && !gut.has(t));
    return { gegnerIdx: r.gegnerIdx, von, ...werteBedingungen(liste, { begegnungen, gute, schwer }) };
  } catch (e) { return leer; }
}

// ---------- Nachtragen (Version 79) ----------
// Vergessene Tage bis maxTage zurück eintragen (Grenze: daten/nachtragen.js). Nachtragen ist normal, kein Versäumnis:
// der Tag zählt wie jeder andere (XP, Runde, Sieg), es gibt keinen Abzug und keinen Hinweis auf „zu spät“.
// Grenzen: nie in die Zukunft, nie vor dem Questbeginn, höchstens maxTage zurück. Heute → wie tagesCheck.
export class NachtragFehler extends Error {}
export const NACHTRAG_MAX_GRENZE = 14; // Sicherheitsnetz gegen kaputte Einstellungen

// Tage, die sich nachtragen lassen (gestern zuerst): [{ tag, abstand, antwort }]. Leer ohne Quest.
export function nachtragTage(stand, heute, maxTage) {
  if (!stand || !stand.quest) return [];
  const heuteK = tagKey(heute);
  const n = Number.isInteger(maxTage) ? Math.max(0, Math.min(NACHTRAG_MAX_GRENZE, maxTage)) : 0;
  const start = questStart(stand, heuteK);
  const pause = new Set(pausenVon(stand, heuteK)); // Heldenmodi: in einer Pause gibt es nichts nachzutragen
  const aus = [];
  for (let i = 1; i <= n; i++) {
    const t = plus(heuteK, -i);
    if (t < start) break;
    if (pause.has(t)) continue;
    aus.push({ tag: t, abstand: i, antwort: stand.tage[t] || null });
  }
  return aus;
}

// Antwort für einen vergangenen Tag setzen (antwort null = zurücknehmen). Liefert wie tagesCheck
// { stand, ereignisse, vorher, nachher }; vorher/nachher gelten für heute. Wirft NachtragFehler mit lesbarer Meldung.
// Sieg: Die Tage vom Nachtrag bis heute werden der Reihe nach geprüft. Der Sieg landet an dem Tag, an dem das
// Rundenziel tatsächlich erreicht war (auch wenn erst spätere „Ja“ es vollmachen); die Runden danach verschieben
// sich entsprechend. Hat die Runde schon einen Sieg (auch an einem späteren Tag), gibt es keinen zweiten.
// Ein Sieg bleibt, auch wenn der Nachtrag später zurückgenommen wird (wie beim Tages-Check).
export function nachtragen(stand, tag, heute, antwort, maxTage) {
  if (!stand || !stand.quest) throw new NachtragFehler('Es gibt noch keine Quest.');
  if (antwort !== null && !ANTWORTEN.includes(antwort)) throw new NachtragFehler(`Unbekannte Antwort: ${antwort}`);
  const heuteK = tagKey(heute);
  if (!ausTagKey(tag)) throw new NachtragFehler('Ungültiger Tag.');
  if (tag === heuteK) return tagesCheck(stand, heute, antwort);
  if (tag > heuteK) throw new NachtragFehler('Dieser Tag liegt in der Zukunft.');
  if (!nachtragTage(stand, heute, maxTage).some(x => x.tag === tag)) {
    throw new NachtragFehler(tag < questStart(stand, heuteK) ? 'An diesem Tag lief das Abenteuer noch nicht.' : `Nachtragen geht bis ${maxTage} Tage zurück.`);
  }
  const vorher = auswertung(stand, heute);
  const s = kopie(stand);
  if (antwort === null) delete s.tage[tag]; else s.tage[tag] = antwort;
  const ereignisse = [];
  if (antwort !== null && zaehltAntworten(s.quest).includes(antwort)) { // Beständigkeit: auch „nein“ kann siegen
    for (let k = tag; k <= heuteK; k = plus(k, 1)) {
      const { runden: l } = runden(s, heuteK); // mit allen Siegen bis heute, damit kein zweiter Sieg in einer Runde entsteht
      const r = l.find(x => x.von <= k && x.bis >= k);
      if (!r || r.sieg) continue;
      const pause = new Set(pausenVon(s, heuteK)); // Heldenmodi: Pausentage zählen nicht für den Gegner
      const bisK = zaehlTage(s, k).filter(t => t >= r.von && !pause.has(t)).length;
      ereignisse.push(...siegVergeben(s, k, r, bisK));
    }
  }
  const nachher = auswertung(s, heute);
  const delta = nachher.xp - vorher.xp;
  if (delta !== 0) ereignisse.unshift({ typ: 'xp', xp: delta });
  if (nachher.level > vorher.level) ereignisse.push({ typ: 'levelup', level: nachher.level, titel: nachher.titel });
  ereignisse.push({ typ: 'nachtrag', tag, antwort });
  return { stand: s, ereignisse, vorher, nachher };
}

// ---------- Quest bearbeiten (Version 38) ----------
// Ziel-Text und Anzahl je Runde ändern (mit Einstiegsrampe: das eigene Ziel, die Rampe steigt höchstens bis dorthin).
// Schritt „Zähler“ (31.10.2026, Entscheidung 5, ersetzt „sofort“ vom 28.10.): Eine neue Anzahl gilt ab der nächsten Runde;
// die laufende Runde behält ihr Ziel. Grund: Wer mitten in einer schwachen Runde das Ziel senkt, rettet den Sieg auf Kosten
// seines Werts; für schwere Tage gibt es den Ruhetag. Ausnahme (5b): Hat die laufende Runde noch keinen Treffer, gilt sie
// sofort (dann kann sie nichts entwerten). Tage, Siege und Mikroquests bleiben unverändert.
export const ZIEL_MAX = 120, ANZAHL_MIN = 1, ANZAHL_MAX = 7;
// g (Beständigkeit, 04.11.2026): Grenzen der Anzahl laut Art des Haupt-Teilziels; ohne Angabe 1 bis 7.
export function questPruefen(eingabe, g = { min: ANZAHL_MIN, max: ANZAHL_MAX }) {
  const min = Number.isInteger(g && g.min) ? g.min : ANZAHL_MIN, max = Number.isInteger(g && g.max) ? g.max : ANZAHL_MAX;
  const fehler = {};
  const ziel = typeof (eingabe && eingabe.ziel) === 'string' ? eingabe.ziel.trim() : '';
  if (!ziel) fehler.ziel = 'Bitte gib ein Ziel ein.';
  else if (ziel.length > ZIEL_MAX) fehler.ziel = `Höchstens ${ZIEL_MAX} Zeichen.`;
  const anzahl = Number(eingabe && eingabe.anzahl);
  if (!Number.isInteger(anzahl) || anzahl < min || anzahl > max) fehler.anzahl = `Bitte eine Zahl von ${min} bis ${max} wählen.`;
  // Warum (Version 75): optional. Fehlt der Schlüssel, bleibt das Warum beim Speichern unverändert (ältere Aufrufer).
  const werte = { ziel, anzahl };
  if (eingabe && 'warum' in eingabe) {
    const roh = eingabe.warum;
    if (roh !== null && roh !== undefined && typeof roh !== 'string') fehler.warum = 'Ungültige Eingabe.';
    else if (typeof roh === 'string' && roh.replace(/\s+/g, ' ').trim().length > WARUM_MAX) fehler.warum = `Höchstens ${WARUM_MAX} Zeichen.`;
    else werte.warum = bereinigeWarum(roh);
  }
  // Zählweise (04.11.2026): optional; fehlt der Schlüssel, bleibt sie unverändert. Ob sie zur Art passt, prüft questBearbeiten.
  if (eingabe && 'zaehlweise' in eingabe && eingabe.zaehlweise !== undefined && eingabe.zaehlweise !== null) {
    if (typeof eingabe.zaehlweise !== 'string' || !zaehlweiseVon(eingabe.zaehlweise) || zaehlweiseVon(eingabe.zaehlweise).id !== eingabe.zaehlweise) fehler.zaehlweise = 'Unbekannte Zählweise.';
    else werte.zaehlweise = eingabe.zaehlweise;
  }
  return { ok: !Object.keys(fehler).length, fehler, werte };
}

export function questBearbeiten(stand, eingabe, heute) {
  if (!stand || !stand.quest) throw new Error('Es gibt noch keine Quest.');
  const p = questPruefen(eingabe, hauptGrenzen(stand.quest));
  if (!p.ok) throw new Error(Object.values(p.fehler).join(' '));
  const vorher = auswertung(stand, heute);
  const s = kopie(stand);
  const geaendert = [];
  if (s.quest.ziel !== p.werte.ziel) { s.quest.ziel = p.werte.ziel; geaendert.push('ziel'); }
  const r = runden(s, tagKey(heute)).aktuell;
  const sofort = TEILZIELE.anzahlSofortOhneTreffer && r.anwendungen === 0;
  if (setzeHauptAnzahl(s.quest, p.werte.anzahl, sofort ? r.nr : r.nr + 1)) geaendert.push('anzahl'); // Verlauf + Spiegel
  // Zählweise: dieselbe Regel wie die Anzahl (sofort ohne Treffer, sonst ab der nächsten Runde). Bei der Wache heißt
  // „nächste Runde“ nach dem nächsten Sieg (die Runde hat kein Zeitlimit); nichts Erkämpftes geht verloren.
  let zwAb = null;
  if (p.werte.zaehlweise) {
    if (!zaehlweisenFuerQuest(s.quest).includes(p.werte.zaehlweise)) throw new Error('Diese Zählweise passt nicht zu deiner Quest.');
    if (setzeHauptZaehlweise(s.quest, p.werte.zaehlweise, sofort ? r.nr : r.nr + 1)) {
      geaendert.push('zaehlweise');
      zwAb = sofort ? 'sofort' : zaehlweiseVon(hauptZaehlweise(stand.quest, r.nr)).rundeOffen ? 'naechsterSieg' : 'naechsteRunde';
    }
  }
  if ('warum' in p.werte && (s.quest.warum || null) !== p.werte.warum) {
    if (p.werte.warum) s.quest.warum = p.werte.warum; else delete s.quest.warum;
    geaendert.push('warum');
  }
  const ereignisse = geaendert.includes('anzahl') || geaendert.includes('zaehlweise') ? siegPruefen(s, heute) : [];
  const nachher = auswertung(s, heute);
  const delta = nachher.xp - vorher.xp;
  if (delta !== 0) ereignisse.unshift({ typ: 'xp', xp: delta });
  if (nachher.level > vorher.level) ereignisse.push({ typ: 'levelup', level: nachher.level, titel: nachher.titel });
  // anzahlAb: ab welcher Runde die neue Anzahl gilt (für den Hinweis), null = Anzahl unverändert
  return { stand: s, geaendert, ereignisse, vorher, nachher, anzahlAb: geaendert.includes('anzahl') ? (sofort ? 'sofort' : 'naechsteRunde') : null, zaehlweiseAb: zwAb };
}

// ---------- Stil ----------
// waehlbar (Version 33): Stile, die gewählt werden dürfen; ohne Angabe alle bekannten.
// Der aktive Stil darf immer erneut übernommen werden (kein Zwangswechsel für bestehende Stände).
// ohneSieg (Version 152, Schalter „Alles freischalten“): Weltenwahl auch vor dem ersten Sieg; `waehlbar` gilt weiter.
export function stilWaehlen(stand, stilId, stilIds, waehlbar = stilIds, ohneSieg = false) {
  if (!stilIds.includes(stilId)) throw new Error(`Unbekannter Stil: ${stilId}`);
  if (!waehlbar.includes(stilId) && stilId !== stand.stil.aktiv) throw new Error('Diese Welt ist noch gesperrt.');
  if (stilId !== 'fantasy' && !stand.stil.frei && ohneSieg !== true) throw new Error('Weitere Stile werden nach dem ersten Sieg freigeschaltet.');
  const s = kopie(stand);
  s.stil.aktiv = stilId;
  s.stil.angeboten = true;
  return s;
}

// Stilfrage am Start (Version 163): Stil schon im ersten Onboarding-Schritt wählen, ohne die Weltenwahl nach dem ersten
// Sieg zu verbrauchen. Setzt nur den aktiven Stil; `frei` und `angeboten` bleiben unberührt, die Weltenwahl kommt wie
// bisher (Vorauswahl = der gewählte Stil). Nur wählbare Welten; gesperrte und unbekannte werfen einen lesbaren Fehler.
// Gleicher Stil erneut: Ergebnis unverändert (eine Kopie). Der übergebene Stand wird nie verändert.
export function stilStartWaehlen(stand, stilId, stilIds, waehlbar = stilIds) {
  if (!stand || !stand.stil) throw new Error('Kein Spielstand für die Stilwahl.');
  if (!Array.isArray(stilIds) || !stilIds.includes(stilId)) throw new Error(`Unbekannter Stil: ${stilId}`);
  if (!Array.isArray(waehlbar) || !waehlbar.includes(stilId)) throw new Error('Diese Welt ist noch gesperrt.');
  const s = kopie(stand);
  s.stil.aktiv = stilId;
  return s;
}

export function stilAngeboten(stand) {
  const s = kopie(stand);
  s.stil.angeboten = true;
  return s;
}

// ---------- Mikroquests ----------
// Schaltet eine Mikroquest für heute an oder aus. Liefert neuen Stand und Ereignisse (XP, Level-up).
export function mikroUmschalten(stand, heute, id, erlaubteIds) {
  if (typeof id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(id)) throw new Error('Ungültige Mikroquest');
  if (Array.isArray(erlaubteIds) && !erlaubteIds.includes(id)) throw new Error('Diese Mikroquest ist heute nicht dran.');
  const vorher = auswertung(stand, heute);
  const s = kopie(stand);
  const k = tagKey(heute);
  const liste = s.mikro[k] || [];
  const an = !liste.includes(id);
  if (an && liste.length >= MAX_MIKRO_JE_TAG) throw new Error('Für heute sind genug Mikroquests erledigt.');
  s.mikro[k] = an ? [...liste, id] : liste.filter(x => x !== id);
  if (!s.mikro[k].length) delete s.mikro[k];
  const nachher = auswertung(s, heute);
  const ereignisse = [{ typ: 'xp', xp: nachher.xp - vorher.xp }];
  if (nachher.level > vorher.level) ereignisse.push({ typ: 'levelup', level: nachher.level, titel: nachher.titel });
  return { stand: s, an, ereignisse, vorher, nachher };
}

// ---------- Story ----------
export function storyGelesen(stand, woche, anzahl) {
  if (!RUNDE_RE.test(woche)) throw new Error('Ungültige Runde');
  const s = kopie(stand);
  s.story.gelesen[woche] = Math.max(s.story.gelesen[woche] || 0, Math.min(7, Math.max(0, anzahl | 0)));
  return s;
}
