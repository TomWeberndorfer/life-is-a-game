// Spielstand mit mehreren Helden (Version 3).
// Held = Fortschritt (eigene Quest, XP, Siege, Story, Mikroquests). Crew = alle Helden, ohne eigene XP.
// Version 3: Held und Lebensbereich getrennt. Jeder Held trägt { heroId, domainId }.
// Version 4: Siege als [{ tag, gegner }], Gegner-Kette in der Quest (wird beim Laden aus der Tabelle aufgefrischt).
// Die bewährte Ein-Helden-Logik in kern.js arbeitet unverändert auf einer „Heldenansicht“.
import * as K from './kern.js';

export const SPIEL_VERSION = 4; // 4: Siege mit Tag, Bosskette je Quest (Version 14)
export const MAX_HELDEN = 3;
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
    // Held → Lebensbereich laut Register oder null
    domainVon(heroId) {
      const h = (tabelle.helden || {})[heroId];
      return h && domains.has(h.domain) ? h.domain : null;
    }
  };
}

export function neuesSpiel(profilId) {
  const s = K.neuerStand(profilId);
  return { v: SPIEL_VERSION, profilId: s.profilId, onboarding: s.onboarding, stil: s.stil, helden: [], fokus: null, angebot: { abgelehntBei: 0 }, gelesen: {}, neuGesehen: [] };
}

function heldAusAnsicht(heroId, domainId, a) {
  return { heroId, domainId, quest: a.quest, tage: a.tage, siege: a.siege, mikro: a.mikro, story: a.story };
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
    ...(h ? { quest: h.quest, tage: h.tage, siege: h.siege, mikro: h.mikro, story: h.story } : {})
  });
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
export function heldHinzufuegen(spiel, vorlage, zielText, heute, z) {
  if (!vorlage) throw new Error('Keine Vorlage für diese Auswahl gefunden.');
  if (spiel.helden.length >= MAX_HELDEN) throw new Error(`Du hast schon ${MAX_HELDEN} Helden. Mehr gehen gerade nicht gleichzeitig.`);
  if (heldVon(spiel, vorlage.held)) throw new Error('Dieser Held ist schon in deiner Crew.');
  const leer = ansicht(spiel, null);
  const a = K.questAnlegen(leer, vorlage, zielText, heute);
  const s = uebernehmen(spiel, vorlage.held, a, z);
  s.fokus = vorlage.held;
  s.angebot = { abgelehntBei: gesamtSiege(s) }; // angenommen: nächste Frage erst nach dem nächsten Sieg
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
export const istGelesen = (spiel, heroId, tag) => !!spiel.gelesen && spiel.gelesen[heroId] === tag;

export function gesamtSiege(spiel) {
  return spiel.helden.reduce((n, h) => n + h.siege.length, 0);
}

// Helden je Lebensbereich (Grundlage für Wheel und Heldenstadt). Leere Bereiche erscheinen mit [].
export function heldenJeDomain(spiel, domainIds) {
  const out = Object.fromEntries(domainIds.map(d => [d, []]));
  for (const h of spiel.helden) (out[h.domainId] || (out[h.domainId] = [])).push(h.heroId);
  return out;
}

// Frage „Willst du ein neues Abenteuer beginnen?“: nach einem Sieg, solange Platz ist und seit dem letzten Ablehnen ein neuer Sieg dazukam.
export function zielAngebot(spiel) {
  const siege = gesamtSiege(spiel);
  return spiel.helden.length > 0 && spiel.helden.length < MAX_HELDEN && siege >= 1 && siege > (spiel.angebot.abgelehntBei || 0);
}

export function angebotAblehnen(spiel) {
  return { ...kopie(spiel), angebot: { abgelehntBei: gesamtSiege(spiel) } };
}

// Kette aus der Tabelle übernehmen: neue Gegner kommen dazu, ohne dass Siege verloren gehen.
function ketteAuffrischen(a, z) {
  const k = a.quest && z.ketteVon ? z.ketteVon(a.quest.vorlageId) : [];
  if (a.quest && k.length) a.quest.kette = k;
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
    let s = { ...leer, profilId: alt.profilId, onboarding: alt.onboarding, stil: alt.stil };
    if (alt.quest) {
      const ausV = z.ausVorlage(alt.quest.vorlageId);
      const hid = ausV && gueltigeId(ausV.heroId) ? ausV.heroId : 'held-1';
      const did = domainFuer(hid, null, alt.quest.vorlageId, z, warn);
      s.helden = [heldAusAnsicht(hid, did, kopie(alt))];
      s.fokus = hid;
      s.stil.frei = s.stil.frei || alt.siege.length > 0;
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
    const a = ketteAuffrischen(K.migriere({ quest: h.quest, tage: h.tage, siege: h.siege, siegeWochen: h.siegeWochen, mikro: h.mikro, story: h.story, onboarding: { fertig: true } }, profilId, stilIds), z);
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
  return s;
}
