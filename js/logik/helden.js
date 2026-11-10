// Spielstand mit mehreren Helden (Version 3).
// Held = Fortschritt (eigene Quest, XP, Siege, Story, Mikroquests). Crew = alle Helden, ohne eigene XP.
// Version 3: Held und Lebensbereich getrennt. Jeder Held trägt { heroId, domainId }.
// Version 4: Siege als [{ tag, gegner }], Gegner-Kette in der Quest (wird beim Laden aus der Tabelle aufgefrischt).
// Die bewährte Ein-Helden-Logik in kern.js arbeitet unverändert auf einer „Heldenansicht“.
import * as K from './kern.js';
import { bereinigeFreigaben, freigabeSetzen } from './freischaltung.js'; // Version 69 (Kreis-Import nur mit Funktionen, unkritisch)
import { PROBE } from '../daten/startseite.js'; // Version 81: Varianten der Morgenprobe
import { SPRECHBLASEN } from '../daten/bewegung.js'; // 02.11.2026: Sprechblasen automatisch oder per Tippen
import { bereinigeEintraege } from './eintraege.js'; // Version 75: eigene Einträge (geschafft, schwerer Tag)
import { EINTRAG_OPT } from '../daten/eintrag-arten.js';
import { bereinigeIdeen } from './ideen.js'; // Version 75: Ideenglas je Held (Notfallkarte)
import { IDEEN_OPT } from '../daten/notfall.js';
import { bereinigeMessziele } from './messziele.js'; // Version 76: Messziele je Held
import { linksBereinigen } from './zielquest.js'; // Ziel-Quests (31.10.2026)
import { bereinigeVorgestellt } from './vorstellung.js'; // Version 115: Einführung vor Anzeige
import * as HM from './heldenmodi.js'; // Heldenmodi (04.11.2026)
import { bereinigeWochen } from './wochenrunde.js'; // Wochenrunde (05.11.2026)
import { DOMAIN_IDS as WR_BEREICHE } from '../daten/lebensbereiche.js';
import { HELDEN } from '../daten/helden.js';
import { bereinigeGestalten, bereinigeEigeneFaehigkeiten } from './gestalten.js'; // Bosskette mit Bedingungen (06.11.2026)
import { bereinigeBedingungen } from './bedingungen.js';
import { bereinigeAbschluss } from './abschluss.js'; // Kettenende: Abschluss und Weitergehen (Version 169)
import * as KAP from './kapitel.js'; // Kapitel-Archiv (Version 171)
import { bereinigeKarteTag } from './morgenkarte.js'; // Morgenkarte (Version 173): „heute gesehen“
import * as AB from './abschluss.js'; // abschlussStand für neuesKapitel
import { bereinigeIntroGesehen } from './intro.js'; // Welten-Intro (Version 175): „schon gesehen“

export const SPIEL_VERSION = 4; // 4: Siege mit Tag, Bosskette je Quest (Version 14)
// Heldenmodi (04.11.2026): keine eigene Grenze mehr. Höchstens so viele Helden, wie das Register kennt (jeder Held gehört zu
// genau einem Lebensbereich); neue Helden im Register erhöhen die Zahl ohne Codeänderung. Fokus = daten/heldenmodi.js.
export const MAX_HELDEN = Math.max(1, Object.keys(HELDEN).length);
const ID = /^[a-z0-9-]{1,40}$/;
const gueltigeId = id => typeof id === 'string' && ID.test(id);

const kopie = x => JSON.parse(JSON.stringify(x));

// Zuordnung aus der Datentabelle (rein, testbar). Liefert für Vorlage oder Held die IDs.
// tabelle: { vorlagen, helden, lebensbereiche }; rueckfall = domainId, wenn nichts passt.
export function zuordner(tabelle, rueckfall) {
  const domains = new Set((tabelle.lebensbereiche || []).map(d => d.id));
  if (!domains.has(rueckfall)) throw new Error(`Rückfall-Lebensbereich ${rueckfall} fehlt`);
  return {
    domains,
    rueckfall,
    // Vorlage → { heroId, domainId } oder null
    ausVorlage(vid) {
      const v = (tabelle.vorlagen || []).find(z => z.id === vid);
      return v ? { heroId: v.held, domainId: v.domain } : null;
    },
    // Vorlage → aktuelle Gegner-Kette aus der Tabelle ([] wenn unbekannt)
    ketteVon(vid) {
      const v = (tabelle.vorlagen || []).find(z => z.id === vid);
      return v ? K.gegnerKette(v) : [];
    },
    // Vorlage → Bedingungen je Kettenplatz (06.11.2026); null = Vorlage unbekannt (dann bleibt, was die Quest hat)
    bedingungenVon(vid) {
      const v = (tabelle.vorlagen || []).find(z => z.id === vid);
      return v ? bereinigeBedingungen(v.bedingungen, K.gegnerKette(v).length) : null;
    },
    // Held → Lebensbereich laut Register oder null
    domainVon(heroId) {
      const h = (tabelle.helden || {})[heroId];
      return h && domains.has(h.domain) ? h.domain : null;
    }
  };
}

export function neuesSpiel(profilId) {
  const s = K.neuerStand(profilId);
  return { v: SPIEL_VERSION, profilId: s.profilId, onboarding: s.onboarding, stil: s.stil, helden: [], fokus: null, angebot: { abgelehntBei: 0 }, gelesen: {}, neuGesehen: [], freigaben: {}, freigabeWartet: null, eintraege: [], ideen: {}, messziele: {}, einstellungen: bereinigeEinstellungen(null), vorgestellt: [], modi: {}, mindest: {}, wochen: {}, gestalten: {}, eigeneFaehigkeiten: {}, abschluss: {}, kapitel: {}, karteGesehen: null, introGesehen: false };
}

function heldAusAnsicht(heroId, domainId, a) {
  return { heroId, domainId, quest: a.quest, tage: a.tage, siege: a.siege, mikro: a.mikro, haken: a.haken || {}, story: a.story };
}

export const heldVon = (spiel, heroId) => spiel.helden.find(x => x.heroId === heroId) || null;

// Ansicht eines Helden im Format von kern.js (v1-Stand). heroId null = noch kein Held (Onboarding).
export function ansicht(spiel, heroId) {
  const h = heldVon(spiel, heroId);
  const basis = K.neuerStand(spiel.profilId);
  return kopie({
    ...basis,
    onboarding: spiel.onboarding,
    stil: spiel.stil,
    ...(h ? { quest: h.quest, tage: h.tage, siege: h.siege, mikro: h.mikro, haken: h.haken || {}, story: h.story } : {}),
    // Version 90: Ruhetage aus spiel.eintraege (Art „ruhetag“); nur gelesen, heldAusAnsicht() schreibt sie nie zurück
    ruhetage: h ? (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).filter(e => e && e.heroId === heroId && e.art === 'ruhetag').map(e => e.tag) : [],
    // Version 98: Neuanfänge („Frisch anfangen“) ebenso, Art „neustart“
    neustarts: h ? (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).filter(e => e && e.heroId === heroId && e.art === 'neustart').map(e => e.tag) : [],
    // Heldenmodi (04.11.2026): Pausen (Erhalt, Ruhe) aus spiel.modi als Zeiträume; nur gelesen, nie zurückgeschrieben
    pausen: h ? HM.pausenVon(spiel, heroId) : [],
    // Mindestaufgabe im Erhalt (04.11.2026): Tage, an denen ein Haken XP gab; nur gelesen (kern.auswertung)
    mindestXp: h ? HM.mindestXpTage(spiel, heroId) : [],
    // Bosskette mit Bedingungen (06.11.2026): Begegnungen (Einträge „geschafft“ mit Gestalt, Fähigkeit oder Schwierigkeit)
    // und schwere Tage aus Einträgen „schwer“; nur gelesen (kern.bedingungenStand), nie zurückgeschrieben
    begegnungen: h ? begegnungenVon(spiel, heroId) : [],
    // Kapitel-Archiv (Version 171): XP und Siege früherer Kapitel; nur gelesen (kern.auswertung), nie zurückgeschrieben
    xpFrueher: h ? KAP.xpFrueher(spiel, heroId) : 0,
    siegeFrueher: h ? KAP.siegeFrueher(spiel, heroId) : 0,
    schwerTage: h ? (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).filter(e => e && e.heroId === heroId && e.art === 'schwer').map(e => e.tag) : []
  });
}

// Begegnungen eines Helden: { tag, gegner, gestalt, faehigkeit, schwierigkeit } aus Einträgen mit mindestens einem dieser Felder.
export function begegnungenVon(spiel, heroId) {
  return (Array.isArray(spiel && spiel.eintraege) ? spiel.eintraege : [])
    .filter(e => e && e.heroId === heroId && (e.gestalt || e.faehigkeit || Number.isInteger(e.schwierigkeit)))
    .map(e => ({ tag: e.tag, gegner: e.gegner || null, gestalt: e.gestalt || null, faehigkeit: e.faehigkeit || null, schwierigkeit: Number.isInteger(e.schwierigkeit) ? e.schwierigkeit : null }));
}

// Bestimmt { heroId, domainId } für einen neuen Helden aus Vorlage oder Vorgabe; wirft bei Ungültigem.
function zielIds(heroId, a, z) {
  const ausV = a.quest ? z.ausVorlage(a.quest.vorlageId) : null;
  const hid = heroId || (ausV && ausV.heroId);
  if (!gueltigeId(hid)) throw new Error(`Ungültige Helden-ID: ${hid}`);
  const did = z.domainVon(hid) || (ausV && ausV.heroId === hid && z.domains.has(ausV.domainId) ? ausV.domainId : null);
  if (!did) throw new Error(`Kein Lebensbereich für Held ${hid}`);
  return { heroId: hid, domainId: did };
}

// Schreibt eine geänderte Ansicht zurück. Hat die Ansicht eine Quest, aber der Held existiert noch nicht, wird er angelegt.
export function uebernehmen(spiel, heroId, a, z) {
  const s = kopie(spiel);
  s.onboarding = kopie(a.onboarding);
  s.stil = kopie(a.stil);
  if (!a.quest) return s;
  const vorhanden = heroId ? heldVon(s, heroId) : null;
  const ids = vorhanden ? { heroId: vorhanden.heroId, domainId: vorhanden.domainId } : zielIds(heroId, a, z);
  const i = s.helden.findIndex(x => x.heroId === ids.heroId);
  const neu = heldAusAnsicht(ids.heroId, ids.domainId, kopie(a));
  if (i >= 0) s.helden[i] = neu;
  else {
    if (s.helden.length >= MAX_HELDEN) throw new Error(`Höchstens ${MAX_HELDEN} Helden gleichzeitig.`);
    s.helden.push(neu);
  }
  if (!s.fokus || !heldVon(s, s.fokus)) s.fokus = ids.heroId;
  s.stil.frei = s.stil.frei || s.helden.some(x => x.siege.length > 0);
  return s;
}

// Neuer Held aus einer Vorlage (heroId und domainId kommen aus der Vorlage).
// rampe (30.10.2026): Einstiegsrampe für die neue Quest (daten/rampe.js); ohne = feste Anzahl.
export function heldHinzufuegen(spiel, vorlage, zielText, heute, z, rampe = null, warum = null) {
  if (!vorlage) throw new Error('Keine Vorlage für diese Auswahl gefunden.');
  if (spiel.helden.length >= MAX_HELDEN) throw new Error(`Du hast schon ${MAX_HELDEN} Helden. Mehr gehen gerade nicht gleichzeitig.`);
  if (heldVon(spiel, vorlage.held)) throw new Error('Dieser Held ist schon in deiner Crew.');
  const leer = ansicht(spiel, null);
  const a = K.questAnlegen(leer, vorlage, zielText, heute, rampe, warum);
  let s = uebernehmen(spiel, vorlage.held, a, z);
  s.fokus = vorlage.held;
  // Heldenmodi: ist der Fokus voll, startet der neue Held im Erhalt (Runde steht still, bis er in den Fokus kommt)
  s = HM.neuenHeldenEinordnen(s, vorlage.held, K.tagKey(heute)).spiel;
  s.angebot = { abgelehntBei: gesamtSiege(s) }; // angenommen: nächste Frage erst nach dem nächsten Sieg
  return s;
}

// Neues Kapitel (Version 171): Der Held bleibt, sein bisheriges Ziel wandert samt Tagen und Siegen ins Archiv (spiel.kapitel),
// ein neues Ziel beginnt. XP und Siege bleiben erhalten (xpFrueher/siegeFrueher in ansicht). Alles oder nichts: bei einem Fehler
// wird nichts geändert. Voraussetzung: das Kettenende ist erreicht (sonst Fehler), die Vorlage gehört zum selben Helden.
// Hat der Held heute im alten Kapitel schon etwas eingetragen, beginnt das neue morgen (nichts zählt doppelt).
export function neuesKapitel(spiel, heroId, vorlage, zielText, heute, z, rampe = null, warum = null) {
  const h = heldVon(spiel, heroId);
  if (!h || !h.quest) throw new Error('Unbekannter Held.');
  if (!vorlage || vorlage.held !== heroId) throw new Error('Dieses Ziel gehört zu einem anderen Helden.');
  const heuteK = K.tagKey(heute);
  const ab = AB.abschlussStand(spiel, heroId, heuteK);
  if (!ab.erreicht) throw new Error('Das bisherige Ziel ist noch nicht ganz geschafft.');
  const kapitel = KAP.archiviert(spiel, h, heuteK);
  const st = KAP.startTag(h, heuteK);
  const beginn = st.spaeter ? K.ausTagKey(st.start) : heute;
  const a = K.questAnlegen(ansicht(spiel, null), vorlage, zielText, beginn, rampe, warum);
  const s = kopie(spiel);
  s.kapitel = kapitel;
  s.helden = s.helden.map(x => (x.heroId === heroId ? heldAusAnsicht(heroId, x.domainId, kopie({ ...a, haken: {} })) : x));
  // Die Entscheidung zum alten Ende ist erledigt (neue Kette, neuer Bezug); die Mindestaufgabe u. a. am Helden bleiben.
  if (s.abschluss && typeof s.abschluss === 'object') delete s.abschluss[heroId];
  s.fokus = heroId;
  return s;
}

export function fokusSetzen(spiel, heroId) {
  if (!heldVon(spiel, heroId)) throw new Error('Unbekannter Held');
  return { ...kopie(spiel), fokus: heroId };
}

// Crew-Botschaft „heute gelesen“ (Version 22): je Held das Datum, an dem die Botschaft zugeklappt wurde.
const TAG = /^\d{4}-\d{2}-\d{2}$/;
export function botschaftGelesen(spiel, heroId, tag) {
  if (!heldVon(spiel, heroId)) throw new Error('Unbekannter Held');
  if (!TAG.test(String(tag))) throw new Error('Ungültiger Tag');
  return { ...kopie(spiel), gelesen: { ...(spiel.gelesen || {}), [heroId]: tag } };
}
// „Neu für dich“ (Version 50): Bereiche (Tab-IDs), deren Freischaltung schon gezeigt oder die schon geöffnet wurden.
// Gehört zum Spielstand (gilt auf allen Geräten). Ungültiges wird verworfen, höchstens 30 Einträge.
const BEREICH_ID = /^[a-z0-9_-]{1,40}$/;
export function bereinigeGesehen(roh) {
  if (!Array.isArray(roh)) return [];
  return [...new Set(roh.filter(x => typeof x === 'string' && BEREICH_ID.test(x)))].slice(0, 30);
}
export function neuGesehen(spiel, ids) {
  const neu = (Array.isArray(ids) ? ids : [ids]).filter(x => typeof x === 'string' && BEREICH_ID.test(x));
  if (!neu.length) throw new Error('Ungültiger Bereich');
  return { ...kopie(spiel), neuGesehen: bereinigeGesehen([...(spiel.neuGesehen || []), ...neu]) };
}
// Höchstens eine Freischaltung pro Tag (Version 69): Tag der Freigabe je ID, gilt auf allen Geräten.
export function freigabenSetzen(spiel, ids, tag) {
  return { ...kopie(spiel), freigaben: freigabeSetzen(spiel.freigaben, ids, tag), freigabeWartet: null };
}
// Höchstwartezeit (30.10.2026): Tag, an dem eine verdiente Freigabe zum ersten Mal wegen eines Höhepunkts warten musste.
// Wird beim nächsten Freigeben gelöscht (freigabenSetzen). null = nichts wartet. Ein schon gesetzter Tag bleibt.
export function freigabeWartetSeit(spiel, tag) {
  if (!TAG.test(String(tag))) throw new Error('Ungültiger Tag');
  if (TAG.test(String(spiel.freigabeWartet))) return spiel;
  return { ...kopie(spiel), freigabeWartet: tag };
}
export const istGelesen = (spiel, heroId, tag) => !!spiel.gelesen && spiel.gelesen[heroId] === tag;

export const siegeFrueher = KAP.siegeFrueher; // Siege früherer Kapitel eines Helden (Version 171)

export function gesamtSiege(spiel) {
  return spiel.helden.reduce((n, h) => n + h.siege.length + KAP.siegeFrueher(spiel, h.heroId), 0);
}

// Helden je Lebensbereich (Grundlage für Wheel und Heldenstadt). Leere Bereiche erscheinen mit [].
export function heldenJeDomain(spiel, domainIds) {
  const out = Object.fromEntries(domainIds.map(d => [d, []]));
  for (const h of spiel.helden) (out[h.domainId] || (out[h.domainId] = [])).push(h.heroId);
  return out;
}

// Frage „Willst du ein neues Abenteuer beginnen?“: nach einem Sieg, solange Platz ist und seit dem letzten Ablehnen ein neuer Sieg dazukam.
// Heldenmodi (04.11.2026, Entscheidung 8a): nur, solange im Fokus Platz ist. Die App drängt nicht zu mehr Helden, als man
// gleichzeitig verfolgen kann; weitere holt man selbst über die Heldenwahl.
export function zielAngebot(spiel) {
  const siege = gesamtSiege(spiel);
  return spiel.helden.length > 0 && spiel.helden.length < MAX_HELDEN && HM.fokusFrei(spiel) && siege >= 1 && siege > (spiel.angebot.abgelehntBei || 0);
}
// Ist im Register noch ein Held frei (für „Neuen Helden dazuholen“ in der Heldenwahl)?
export const heldFrei = spiel => spiel.helden.length < MAX_HELDEN;

export function angebotAblehnen(spiel) {
  return { ...kopie(spiel), angebot: { abgelehntBei: gesamtSiege(spiel) } };
}

// Kette aus der Tabelle übernehmen: neue Gegner kommen dazu, ohne dass Siege verloren gehen.
// Bedingungen (06.11.2026) ebenso, aber nur bei Quests, die mit dem Feld angelegt wurden (ältere bekommen keine). Regel für
// daten/vorlagen.js wie bei der Kette: Bedingungen nur für Plätze ändern, die noch niemand erreicht hat.
function ketteAuffrischen(a, z) {
  const k = a.quest && z.ketteVon ? z.ketteVon(a.quest.vorlageId) : [];
  if (a.quest && k.length) a.quest.kette = k;
  if (a.quest && Array.isArray(a.quest.bedingungen) && z.bedingungenVon) {
    const b = z.bedingungenVon(a.quest.vorlageId);
    if (b) a.quest.bedingungen = b;
  }
  return a;
}

// Lebensbereich eines gespeicherten Helden: gespeicherter Wert → Register → Vorlage → Rückfall (mit Warnung).
function domainFuer(heroId, gespeichert, vorlageId, z, warn) {
  if (gespeichert && z.domains.has(gespeichert)) return gespeichert;
  const reg = z.domainVon(heroId);
  if (reg) return reg;
  const ausV = vorlageId ? z.ausVorlage(vorlageId) : null;
  if (ausV && z.domains.has(ausV.domainId)) return ausV.domainId;
  warn(`Held ${heroId}: kein Lebensbereich gefunden, „${z.rueckfall}“ gesetzt`);
  return z.rueckfall;
}

// Lädt Version 1 (eine Quest), 2 (Helden mit id), 3 (heroId + domainId) oder 4 (Siege mit Tag).
// Ungültiges wird bereinigt, wirft nie. warn(text) meldet Korrekturen (z. B. für die Konsole).
export function migriereSpiel(roh, profilId, stilIds, z, warn = () => {}) {
  const leer = neuesSpiel(profilId);
  if (!roh || typeof roh !== 'object') return leer;
  if (![2, 3, SPIEL_VERSION].includes(roh.v)) {
    // Version 1: ein Stand mit einer Quest
    const alt = ketteAuffrischen(K.migriere(roh, profilId, stilIds), z);
    let s = { ...leer, profilId: alt.profilId, onboarding: alt.onboarding, stil: alt.stil, introGesehen: true }; // Altbestand: kein Intro (Version 175)
    if (alt.quest) {
      const ausV = z.ausVorlage(alt.quest.vorlageId);
      const hid = ausV && gueltigeId(ausV.heroId) ? ausV.heroId : 'held-1';
      const did = domainFuer(hid, null, alt.quest.vorlageId, z, warn);
      s.helden = [heldAusAnsicht(hid, did, kopie(alt))];
      s.fokus = hid;
      s.stil.frei = s.stil.frei || alt.siege.length > 0;
      s.freigaben = null; // Version 69: Altbestand, app.js gibt beim Start frei, was schon verdient ist
      s.vorgestellt = null; // Version 115: Altbestand, app.js füllt beim Start (vorstellungAltbestand)
    }
    return s;
  }
  const glob = K.migriere({ profilId: roh.profilId, onboarding: roh.onboarding, stil: roh.stil, quest: { vorlageId: 'x' } }, profilId, stilIds);
  const s = { ...leer, profilId: glob.profilId, onboarding: { ...glob.onboarding, fertig: false }, stil: glob.stil };
  const gesehen = new Set();
  for (const h of Array.isArray(roh.helden) ? roh.helden : []) {
    if (!h || typeof h !== 'object') continue;
    const hid = roh.v === 2 ? h.id : h.heroId; // v2: id = heroId
    if (!gueltigeId(hid) || gesehen.has(hid) || s.helden.length >= MAX_HELDEN) continue;
    const a = ketteAuffrischen(K.migriere({ quest: h.quest, tage: h.tage, siege: h.siege, siegeWochen: h.siegeWochen, mikro: h.mikro, haken: h.haken, story: h.story, onboarding: { fertig: true } }, profilId, stilIds), z);
    if (!a.quest) continue;
    gesehen.add(hid);
    if (roh.v >= 3 && h.domainId !== undefined && !z.domains.has(h.domainId)) warn(`Held ${hid}: unbekannter Lebensbereich „${h.domainId}“`);
    s.helden.push(heldAusAnsicht(hid, domainFuer(hid, roh.v >= 3 ? h.domainId : null, a.quest.vorlageId, z, warn), a));
  }
  s.onboarding.fertig = s.helden.length > 0; // ohne Held immer zurück ins Onboarding
  s.fokus = heldVon(s, roh.fokus) ? roh.fokus : (s.helden[0] ? s.helden[0].heroId : null);
  const ab = roh.angebot && Number.isInteger(roh.angebot.abgelehntBei) && roh.angebot.abgelehntBei >= 0 ? roh.angebot.abgelehntBei : 0;
  s.angebot = { abgelehntBei: ab };
  s.stil.frei = s.stil.frei || s.helden.some(h => h.siege.length > 0);
  s.gelesen = {};
  if (roh.gelesen && typeof roh.gelesen === 'object') for (const [id, t] of Object.entries(roh.gelesen)) if (heldVon(s, id) && TAG.test(String(t))) s.gelesen[id] = t;
  s.neuGesehen = bereinigeGesehen(roh.neuGesehen);
  s.freigaben = bereinigeFreigaben(roh.freigaben); // Version 69: null = Stand vor der Taktung (Altbestand)
  s.freigabeWartet = TAG.test(String(roh.freigabeWartet)) ? roh.freigabeWartet : null; // fehlt bei älteren Ständen = nichts wartet
  // Version 75: eigene Einträge; fehlt die Liste (Altbestand) → [] (nichts geht verloren, es gab noch keine).
  // Einträge eines Helden, der nicht mehr im Spielstand ist, fallen weg (wie bei „gelesen“).
  s.eintraege = bereinigeEintraege(roh.eintraege, { ...EINTRAG_OPT, heroIds: new Set(s.helden.map(h => h.heroId)) }, warn);
  // Version 75: Ideenglas; fehlt das Feld (Altbestand) → {} (es gelten die Startideen der Fähigkeit, nichts geht verloren).
  s.ideen = bereinigeIdeen(roh.ideen, { ...IDEEN_OPT, heroIds: new Set(s.helden.map(h => h.heroId)) });
  // Version 76: Messziele; fehlt das Feld (Altbestand) → {} (es gab noch keine, nichts geht verloren).
  s.messziele = bereinigeMessziele(roh.messziele, { heroIds: new Set(s.helden.map(h => h.heroId)) });
  linksBereinigen(s); // Ziel-Quests (31.10.2026): Verweis auf ein gelöschtes Messziel fällt weg, die Quest bleibt
  // Version 81: persönliche Einstellungen; fehlt das Feld (Altbestand) → Standard (Morgenprobe kurz, wie bisher).
  s.einstellungen = bereinigeEinstellungen(roh.einstellungen);
  // Version 115: vorgestellte Elemente (Einführung vor Anzeige); fehlt das Feld (Altbestand) → null, app.js füllt es beim
  // Start einmal (bekannte Gegner gelten als gesehen, niemand bekommt einen alten Gegner noch einmal vorgestellt).
  s.vorgestellt = bereinigeVorgestellt(roh.vorgestellt);
  // Heldenmodi (04.11.2026): fehlt das Feld (Altbestand) → {} = alle Helden im Fokus, wie bisher (niemand verliert etwas)
  s.modi = HM.bereinigeModi(roh.modi, { heroIds: new Set(s.helden.map(h => h.heroId)) });
  // Mindestaufgabe im Erhalt (04.11.2026): fehlt das Feld (Altbestand) → {} (es gab noch keine, nichts geht verloren)
  s.mindest = HM.bereinigeMindest(roh.mindest, { heroIds: new Set(s.helden.map(h => h.heroId)) });
  // Wochenrunde (05.11.2026): fehlt das Feld (Altbestand) → {} (es gab noch keine Runde, nichts geht verloren).
  // Die Werte gehören zum Lebensbereich, nicht zum Helden (Abschnitt 34): sie bleiben, auch wenn ein Held geht.
  s.wochen = bereinigeWochen(roh.wochen, { bereichIds: new Set(WR_BEREICHE) });
  // Bosskette mit Bedingungen (06.11.2026): fehlen die Felder (Altbestand) → {} (es gab noch keine, nichts geht verloren)
  s.gestalten = bereinigeGestalten(roh.gestalten, { heroIds: new Set(s.helden.map(h => h.heroId)) });
  s.eigeneFaehigkeiten = bereinigeEigeneFaehigkeiten(roh.eigeneFaehigkeiten, { heroIds: new Set(s.helden.map(h => h.heroId)) });
  // Kettenende (Version 169): Entscheidung je Held nach der geschafften Kette (Typ, Weg, Bezug). Fehlt das Feld (Altbestand) → {}:
  // Helden mit geschaffter Kette bekommen die Seite beim nächsten Start einmal angeboten (der Auslöser ist abgeleitet), nichts geht verloren.
  s.kapitel = KAP.bereinigeKapitel(roh.kapitel, { heroIds: new Set(s.helden.map(h => h.heroId)) }); // Version 171; Altbestand ohne Feld = {}
  s.abschluss = bereinigeAbschluss(roh.abschluss, { heroIds: new Set(s.helden.map(h => h.heroId)) });
  // Morgenkarte (Version 173): Tag, an dem die Karte zuletzt gesehen oder beantwortet wurde. Fehlt das Feld oder ist es ungültig
  // (Altbestand) → null: die Karte erscheint beim nächsten Öffnen einmal, danach gilt der Tag. Nichts geht verloren.
  s.karteGesehen = bereinigeKarteTag(roh.karteGesehen);
  s.introGesehen = bereinigeIntroGesehen(roh.introGesehen); // Altbestand ohne Feld → gesehen (Version 175)
  return s;
}

// Persönliche Einstellungen im Spielstand (Version 81). Unbekannte Schlüssel fallen weg, ungültige Werte → Standard.
// Regeln als Daten: PROBE in daten/startseite.js, SPRECHBLASEN in daten/bewegung.js (02.11.2026; fehlt das Feld → Standard
// „auto“, also wie bisher: niemand verliert etwas).
const auswahl = (wert, regel, rueckfall) => {
  const erlaubt = regel && Array.isArray(regel.varianten) && regel.varianten.length ? regel.varianten : [rueckfall];
  const standard = erlaubt.includes(regel && regel.standard) ? regel.standard : erlaubt[0];
  return erlaubt.includes(wert) ? wert : standard;
};
export function bereinigeEinstellungen(roh) {
  const r = roh && typeof roh === 'object' && !Array.isArray(roh) ? roh : {};
  // probe: Alt (Version 81), wird weiter gelesen und gespeichert, aber nicht mehr ausgewertet. karte (Version 173): Morgenkarte an/aus.
  return { probe: auswahl(r.probe, PROBE, 'kurz'), blasen: auswahl(r.blasen, SPRECHBLASEN, 'auto'), karte: auswahl(r.karte, PROBE.karte, 'an') };
}
