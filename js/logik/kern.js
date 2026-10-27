// Kernlogik: reine Funktionen ohne DOM und ohne Speicher.
// Alle Zahlen (XP, Level, Bosskraft) werden aus dem Stand abgeleitet,
// damit Rückgängig, Neuladen und Nachträge nie doppelte oder fehlende XP erzeugen.

export const STAND_VERSION = 1;
export const XP = Object.freeze({ anwendung: 10, sieg: 50, mikro: 5 });
export const MAX_MIKRO_JE_TAG = 10;
export const XP_JE_LEVEL = 60;
export const TITEL = ['Anwärter', 'Wanderer', 'Kämpfer', 'Held', 'Legende'];
export const ANTWORTEN = ['ja', 'nein'];

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

// Alle Runden bis zur aktuellen. Liefert { runden, aktuell } – aktuell ist die Runde, in der heute
// gekämpft wird: die Runde von heute oder, wenn heute ein Sieg war, die nächste (beginnt morgen).
export function runden(stand, heuteK) {
  const start = questStart(stand, heuteK);
  const k = kette(stand);
  // Nur bis heute: Einträge „aus der Zukunft“ (Testprofil mit Zeitsprung zurück) verschieben keine Runden.
  const siegTage = [...new Set((stand.siege || []).map(x => x.tag))].filter(t => t <= heuteK).sort();
  const ja = new Set(Object.keys(stand.tage).filter(t => stand.tage[t] === 'ja' && t <= heuteK));
  const liste = [];
  let von = start, siege = 0, gegnerVorher = null;
  for (let nr = 1; nr <= MAX_RUNDEN; nr++) {
    const bisMax = plus(von, RUNDE_TAGE - 1);
    const sieg = siegTage.find(t => t >= von && t <= bisMax) || null;
    const bis = sieg || bisMax;
    const idx = Math.min(siege, k.length - 1);
    const gegner = k[idx];
    let anwendungen = 0;
    for (const t of ja) if (t >= von && t <= bis) anwendungen++;
    const r = { nr, key: rundeKey(nr), von, bis, sieg, gegner, gegnerIdx: idx, neuerGegner: nr > 1 && gegner !== gegnerVorher, anwendungen };
    liste.push(r);
    if (von > heuteK) return { runden: liste, aktuell: r };
    if (bis >= heuteK && !sieg) return { runden: liste, aktuell: r };
    if (sieg) siege++;
    gegnerVorher = gegner;
    von = plus(bis, 1);
  }
  throw new Error('runden: zu viele Runden');
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
export function neuerStand(profilId) {
  return {
    v: STAND_VERSION,
    profilId: String(profilId || 'unbekannt'),
    onboarding: { fertig: false, bereich: null, problem: null, ziel: null, freitext: '' },
    quest: null,       // { vorlageId, ziel, anzahl, start, kette: [gegnerId, …] }
    tage: {},          // { 'YYYY-MM-DD': 'ja' | 'nein' }
    siege: [],         // [{ tag: 'YYYY-MM-DD', gegner }] – je Sieg ein Eintrag, bleibt auch bei Rückgängig
    mikro: {},         // { 'YYYY-MM-DD': ['mikro-id', …] } erledigte Mikroquests
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
      kette: Array.isArray(q.kette) ? q.kette.filter(x => typeof x === 'string' && GEGNER_ID.test(x)).slice(0, 50) : []
    };
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

export function questAnlegen(stand, vorlage, zielText, heute) {
  if (!vorlage) throw new Error('Keine Vorlage für diese Auswahl gefunden.');
  const s = kopie(stand);
  const anzahl = Number.isInteger(vorlage.quest && vorlage.quest.anzahl) ? vorlage.quest.anzahl : 3;
  s.quest = {
    vorlageId: vorlage.id,
    ziel: String(zielText || vorlage.ziel || 'Mein Ziel').trim().slice(0, 120) || 'Mein Ziel',
    anzahl: Math.min(7, Math.max(1, anzahl)),
    start: tagKey(heute),
    kette: gegnerKette(vorlage)
  };
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
  const anzahl = stand.quest ? stand.quest.anzahl : 3;
  const jaTage = Object.keys(stand.tage).filter(k => stand.tage[k] === 'ja');
  const wocheZaehler = r.anwendungen;
  const treffer = Math.min(wocheZaehler, anzahl);
  const mikroZahl = Object.values(stand.mikro || {}).reduce((x, v) => x + v.length, 0);
  const siege = (stand.siege || []).length;
  const xp = jaTage.length * XP.anwendung + siege * XP.sieg + mikroZahl * XP.mikro;
  const vorige = alle.length > 1 ? alle[alle.length - 2] : null;
  const k = kette(stand);
  return {
    heute: heuteK,
    woche: r.key,            // Schlüssel der laufenden Runde (Name „woche“ beibehalten)
    wocheNr: r.nr,
    rundeVon: r.von,
    rundeBis: plus(r.von, RUNDE_TAGE - 1),
    rundeTag: tageZwischen(r.von, heuteK), // 0 = erster Tag, −1 = Runde beginnt morgen (nach Sieg heute)
    naechsteRunde: plus(r.von, RUNDE_TAGE),
    gegner: r.gegner,
    gegnerNr: r.gegnerIdx + 1,
    gegnerAnzahl: k.length,
    neuerGegner: r.neuerGegner,
    ersteRundeGegner: r.nr === 1 || r.neuerGegner,
    siegHeute: (stand.siege || []).some(x => x.tag === heuteK),
    vorigeGewonnen: !!(vorige && vorige.sieg),
    anzahl,
    wocheZaehler,
    treffer,
    bossKraft: anzahl ? (anzahl - treffer) / anzahl : 1,
    besiegtDieseWoche: false, // Runde endet mit dem Sieg; die laufende Runde ist nie schon gewonnen
    siege,
    heuteAntwort: stand.tage[heuteK] || null,
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
// antwort: 'ja' (angewendet), 'nein' (heute nicht gebraucht) oder null (rückgängig).
// Liefert den neuen Stand und die Ereignisse für Belohnung und Feiern.
export function tagesCheck(stand, heute, antwort) {
  if (!stand.quest) throw new Error('Es gibt noch keine Quest.');
  if (antwort !== null && !ANTWORTEN.includes(antwort)) throw new Error(`Unbekannte Antwort: ${antwort}`);
  const vorher = auswertung(stand, heute);
  const s = kopie(stand);
  const k = tagKey(heute);
  if (antwort === null) delete s.tage[k];
  else s.tage[k] = antwort;

  const ereignisse = [];
  // Ein Sieg bleibt, auch wenn später rückgängig gemacht wird (keine Strafe, keine doppelte Vergabe).
  const r = rundeVonTag(s, k);
  if (!r.sieg && r.anwendungen >= s.quest.anzahl) {
    s.siege = [...s.siege, { tag: k, gegner: r.gegner }].sort((a, b) => (a.tag < b.tag ? -1 : 1));
    const danach = auswertung(s, heute);
    ereignisse.push({ typ: 'sieg', woche: r.key, gegner: r.gegner, naechster: danach.gegner, neuerGegner: danach.neuerGegner, kapitel: danach.gegnerNr });
    if (!s.stil.frei) {
      s.stil.frei = true;
      ereignisse.push({ typ: 'stil_frei' });
    }
  }
  const nachher = auswertung(s, heute);
  const delta = nachher.xp - vorher.xp;
  if (delta !== 0) ereignisse.unshift({ typ: 'xp', xp: delta });
  if (nachher.level > vorher.level) ereignisse.push({ typ: 'levelup', level: nachher.level, titel: nachher.titel });
  ereignisse.push({ typ: 'besuch', antwort });
  return { stand: s, ereignisse, vorher, nachher };
}

// ---------- Stil ----------
// waehlbar (Version 33): Stile, die gewählt werden dürfen; ohne Angabe alle bekannten.
// Der aktive Stil darf immer erneut übernommen werden (kein Zwangswechsel für bestehende Stände).
export function stilWaehlen(stand, stilId, stilIds, waehlbar = stilIds) {
  if (!stilIds.includes(stilId)) throw new Error(`Unbekannter Stil: ${stilId}`);
  if (!waehlbar.includes(stilId) && stilId !== stand.stil.aktiv) throw new Error('Diese Welt ist noch gesperrt.');
  if (stilId !== 'fantasy' && !stand.stil.frei) throw new Error('Weitere Stile werden nach dem ersten Sieg freigeschaltet.');
  const s = kopie(stand);
  s.stil.aktiv = stilId;
  s.stil.angeboten = true;
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
