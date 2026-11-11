// Startseite (Version 43): reine Funktionen, nichts im DOM.
import { istAntwort } from './antworten.js'; // Version 141: Antwort-Register

// Abschnitte prüfen und ordnen. liste = START_ABSCHNITTE, bekannt = IDs, für die app.js eine Ansicht hat.
// Liefert { ids, fehler }: ids in Reihenfolge der Liste, ohne ausgeschaltete, unbekannte und doppelte.
// Kaputte Liste (kein Array) → leere ids + Fehler; app.js fällt dann auf die bekannten IDs zurück.
export function ordneAbschnitte(liste, bekannt) {
  const erlaubt = new Set(bekannt || []);
  const fehler = [];
  const ids = [];
  if (!Array.isArray(liste)) return { ids, fehler: ['Startseite: Abschnittsliste fehlt oder ist keine Liste'] };
  liste.forEach((z, i) => {
    const id = z && typeof z === 'object' ? z.id : undefined;
    if (typeof id !== 'string' || !id) { fehler.push(`Startseite: Zeile ${i + 1} ohne gültige id`); return; }
    if (!erlaubt.has(id)) { fehler.push(`Startseite: unbekannter Abschnitt „${id}“`); return; }
    if (ids.includes(id)) { fehler.push(`Startseite: Abschnitt „${id}“ doppelt`); return; }
    if (z.wann !== undefined && !WANN.includes(z.wann)) fehler.push(`Startseite: „${id}“ hat unbekanntes wann „${z.wann}“ (gilt als immer)`);
    if (z.aus === true) return;
    ids.push(id);
  });
  return { ids, fehler };
}

// Merkmal „wann“ (Startseite als Kampfbühne, Schritt Kopfleiste und Neuigkeiten, 31.10.2026): wann ein Abschnitt
// erscheint, gemessen am Tages-Check des aktiven Helden. Ersetzt Sonderlogik je Karte (Entscheidungen Abschnitt 18).
//   immer      (Standard, auch wenn die Angabe fehlt oder unbekannt ist)
//   vorCheck   nur solange der Check heute offen ist
//   nachCheck  erst nach dem Check (z. B. Feedback-Bitte: nicht vor der Hauptaktion um Aufmerksamkeit werben)
//   vorFeuer   immer, außer das Lagerfeuer brennt (Etappe 3, Teil C: am Abend keine Bonus-Aufgaben, keine Zahlen)
export const WANN = ['immer', 'vorCheck', 'nachCheck', 'vorFeuer'];
// ids aus ordneAbschnitte(), liste = START_ABSCHNITTE, erledigt = Check heute schon beantwortet,
// feuer = das Lagerfeuer ist gerade zu sehen. Wirft nie.
export function nachWann(ids, liste, erledigt, feuer = false) {
  if (!Array.isArray(ids)) return [];
  const wann = {};
  for (const z of Array.isArray(liste) ? liste : []) if (z && typeof z.id === 'string' && WANN.includes(z.wann)) wann[z.id] = z.wann;
  return ids.filter(id => {
    const w = wann[id] || 'immer';
    if (w === 'vorFeuer') return feuer !== true;
    return w === 'immer' || (w === 'nachCheck') === (erledigt === true);
  });
}

// Fester Platz für Neuigkeiten unter der Kopfleiste (31.10.2026): höchstens `max` verschiedene am Tag, nach Vorrang.
// Was heute schon zu sehen war, behält seinen Platz; wird eine davon erledigt, rückt KEINE weitere nach: der Rest
// wartet auf den nächsten Tag. Grund: Neues erscheint an einem erkennbaren Ort und wird nie zur Liste vor der Heldentat.
// kandidaten  IDs, die gerade etwas zu zeigen haben, in Vorrang-Reihenfolge
// gemerkt     { tag, ids } vom Gerät (Merkmal), darf kaputt sein; anderer Tag = neuer Tag
// Rückgabe    { sichtbar, warten, merken } – merken = neuer Stand ({ tag, ids }) oder null, wenn unverändert. Wirft nie.
export function neuPlatz(kandidaten, gemerkt, tag, max = 2) {
  const k = [...new Set((Array.isArray(kandidaten) ? kandidaten : []).filter(x => typeof x === 'string' && x))];
  const m = Number.isInteger(max) && max >= 0 && max <= 5 ? max : 2;
  const heute = gemerkt && typeof gemerkt === 'object' && gemerkt.tag === tag && Array.isArray(gemerkt.ids)
    ? [...new Set(gemerkt.ids.filter(x => typeof x === 'string' && x))] : [];
  const gezeigt = [...heute];
  for (const id of k) if (!gezeigt.includes(id) && gezeigt.length < m) gezeigt.push(id);
  const sichtbar = k.filter(id => gezeigt.includes(id));
  const warten = k.filter(id => !gezeigt.includes(id));
  const geaendert = !gemerkt || gemerkt.tag !== tag || gezeigt.length !== heute.length || !Array.isArray(gemerkt.ids) || gemerkt.ids.length !== heute.length;
  return { sichtbar, warten, merken: geaendert && typeof tag === 'string' && tag ? { tag, ids: gezeigt } : null };
}

// Heldenkopf: wer ist aktiv, wer kommt in den Wechsel-Knopf, wie viele Checks sind offen.
// helden = [{ id, erledigt }] in fester Reihenfolge (Reihenfolge der Crew, wird nie umsortiert).
// fokus = gespeicherter aktiver Held; unbekannt oder leer → erster Held (gleiche Regel wie migriereSpiel).
// Ergebnis: { aktiv, andere, stapel, offen, mitWechsel }
//   andere     alle übrigen Helden, Reihenfolge wie in der Crew
//   stapel     die ersten `stapelMax` davon (Mini-Porträts im Knopf)
//   offen      Zahl der übrigen Helden mit offenem Check heute (der aktive zählt nicht: sein Check steht direkt darunter)
//   mitWechsel false bei 0 oder 1 Held → kein Knopf
export function heldenKopf(helden, fokus, stapelMax = 3) {
  const liste = (Array.isArray(helden) ? helden : []).filter(h => h && typeof h.id === 'string' && h.id);
  const eindeutig = liste.filter((h, i) => liste.findIndex(x => x.id === h.id) === i);
  if (!eindeutig.length) return { aktiv: null, andere: [], stapel: [], offen: 0, mitWechsel: false };
  const aktiv = eindeutig.some(h => h.id === fokus) ? fokus : eindeutig[0].id;
  const andere = eindeutig.filter(h => h.id !== aktiv).map(h => h.id);
  const max = Number.isInteger(stapelMax) && stapelMax >= 0 ? stapelMax : 3;
  return {
    aktiv,
    andere,
    stapel: andere.slice(0, max),
    offen: eindeutig.filter(h => h.id !== aktiv && !h.erledigt).length,
    mitWechsel: andere.length > 0
  };
}

// Tagesfrage der Heldentat-Karte (Version 44). Vorrang: Vorlage → Fähigkeit → allgemeiner Text.
// Leere oder falsche Werte zählen als „fehlt“, damit nie eine leere Frage erscheint.
const gefuellt = x => (typeof x === 'string' && x.trim() ? x.trim() : null);
export function tagesfrage(vorlage, faehigkeit, allgemein) {
  return gefuellt(vorlage && vorlage.tagesfrage) || gefuellt(faehigkeit && faehigkeit.tagesfrage) || gefuellt(allgemein) || '';
}

// „Weiter zu …“ (Version 45): nächster Held mit offenem Check in fester Crew-Reihenfolge, ab dem aktiven
// weiterzählend und am Ende von vorn. null, wenn alle anderen erledigt sind oder es keine anderen gibt.
// helden = [{ id, erledigt }] wie bei heldenKopf; unbekannter aktiver Held → Suche ab dem Anfang.
// Tagesleiste (Etappe 3, Teil B, 02.11.2026): „Heute x von n“ und je Held ein Eintrag in fester Reihenfolge.
// helden: [{ id, erledigt }]; zeigen erst ab cfg.abHelden (sonst ist die Leiste nur Lärm), höchstens cfg.max Einträge.
// Ein sichtbarer, endlicher Tagesumfang nutzt den Ziel-Gradienten und gibt ein klares Ende statt einer Liste.
// Version 177 (Entscheidung 10.11.2026, Abschnitt 60): `abruf` = Helden ohne Tagesfrage (Rhythmus, Wache), die nicht pausieren.
// Sie stehen als eigene Gruppe in der Leiste, zählen aber NICHT in „x von n“ und haben kein „offen“. Höchstens cfg.abrufMax
// (Standard 2) stehen in der Leiste, der Rest bleibt im Stapel (`weitere`). Die Zahl der sichtbaren Helden insgesamt muss
// cfg.abHelden erreichen.
// Version 179 (Entscheidung 10.11.2026, Nachtrag Abschnitt 60): die Leiste erscheint auch, wenn ALLE Helden ohne Tagesfrage
// sind (vorher keine Leiste, die Startseite wirkte leer). Dann gibt es kein „x von n“ (`ohneTagesfrage`, die Ansicht zeigt
// „Kein Muss für heute“), und es gilt cfg.abrufMaxAllein (Standard: cfg.max) statt cfg.abrufMax, weil der Platz frei ist.
// Version 183 (Entscheidung 11.11.2026, Punkt 8): opt.plus = man darf einen Helden dazuholen (helden.js heldDazu). Dann steht
// am Ende ein „+“ (`plus`), und die Leiste erscheint schon ab einem Helden (sonst ab cfg.abHelden). cfg.plus === false schaltet
// das „+“ ab. Vor dem ersten Sieg bleibt alles wie vorher.
export function tagesleiste(helden, fokus, cfg = {}, abruf = [], opt = {}) {
  const liste = (Array.isArray(helden) ? helden : []).filter(h => h && typeof h.id === 'string' && h.id);
  const eindeutig = liste.filter((h, i) => liste.findIndex(x => x.id === h.id) === i);
  const ab = Number.isInteger(cfg && cfg.abHelden) && cfg.abHelden >= 1 ? cfg.abHelden : 2;
  const max = Number.isInteger(cfg && cfg.max) && cfg.max >= 1 ? cfg.max : 3;
  const sicht = eindeutig.slice(0, max);
  const abMax = !sicht.length
    ? (Number.isInteger(cfg && cfg.abrufMaxAllein) && cfg.abrufMaxAllein >= 0 ? cfg.abrufMaxAllein : max)
    : Number.isInteger(cfg && cfg.abrufMax) && cfg.abrufMax >= 0 ? cfg.abrufMax : 2;
  const tagesIds = new Set(eindeutig.map(h => h.id));
  const alleAbruf = (Array.isArray(abruf) ? abruf : []).filter((h, i, l) => h && typeof h.id === 'string' && h.id && !tagesIds.has(h.id) && l.findIndex(x => x && x.id === h.id) === i);
  const abSicht = alleAbruf.slice(0, abMax);
  const abAktiv = abSicht.some(h => h.id === fokus);
  const aktiv = abAktiv ? null : sicht.some(h => h.id === fokus) ? fokus : (sicht[0] || {}).id || null;
  const plus = !!(opt && opt.plus === true) && !(cfg && cfg.plus === false);
  const zahl = sicht.length + abSicht.length;
  return {
    zeigen: !!(cfg && cfg.an !== false) && (zahl >= ab || (plus && zahl >= 1)),
    plus: !!(cfg && cfg.an !== false) && plus && zahl >= 1,
    ohneTagesfrage: !sicht.length,
    erledigt: sicht.filter(h => h.erledigt).length,
    gesamt: sicht.length,
    eintraege: sicht.map(h => ({ id: h.id, aktiv: h.id === aktiv, erledigt: !!h.erledigt })),
    abruf: abSicht.map(h => ({ id: h.id, aktiv: h.id === fokus })),
    weitere: alleAbruf.slice(abMax).map(h => h.id)
  };
}
// Beschriftung unter dem Ring eines Helden ohne Tagesfrage (Version 179, Punkte 11a/15a vom 10.11.2026): zeigt Erreichtes bzw.
// den Takt statt des Namens der Zählweise. texte = Textschlüssel der Zählweise (kappe, kappeEins, kappeNull, kappeKurz),
// n = Zahl dazu, T = Textfunktion, maxZeichen = Grenze für die lange Form. Ist die lange Form länger, gilt die kurze.
// Bei n = 0 gilt kappeNull (nie eine „0“ unter dem Ring, das sähe wie ein Mangel aus). Fehlt alles → fallback. Wirft nie.
export function kappeText(texte, n, T, maxZeichen = 10, fallback = '') {
  try {
    const t = texte && typeof texte === 'object' ? texte : {};
    const zahl = Number.isInteger(n) && n >= 0 ? n : 0;
    const grenze = Number.isInteger(maxZeichen) && maxZeichen > 0 ? maxZeichen : 10;
    if (typeof T !== 'function') return fallback;
    if (zahl === 0 && t.kappeNull) return T(t.kappeNull);
    const lang = zahl === 1 && t.kappeEins ? T(t.kappeEins, { n: zahl }) : t.kappe ? T(t.kappe, { n: zahl }) : '';
    if (lang && lang.length <= grenze) return lang;
    if (t.kappeKurz) return T(t.kappeKurz, { n: zahl });
    return lang || (t.status ? T(t.status) : fallback);
  } catch (e) { return fallback; }
}

// Gruppen im Blatt „Helden wechseln“ (Version 179, Punkt 9): helden = [{ id, pausiert, ohneFrage, wartet }] in Crew-Reihenfolge.
// heute = mit Tagesfrage; keinMuss = ohne Tagesfrage oder Quest beginnt erst später; ruht = pausiert (Erhalt, Ruhe).
// Liefert [{ gruppe, ids, zu }] nur für nicht leere Gruppen, in cfg.reihe; mitKopf = Überschriften zeigen (ab cfg.abGruppen).
// Unbekannte Gruppen in cfg.reihe werden übersprungen, fehlt eine bekannte, hängt sie hinten an (kein Held geht verloren).
export const HELDEN_GRUPPEN = Object.freeze(['heute', 'keinMuss', 'ruht']);
export function heldenGruppen(helden, cfg = {}) {
  const liste = (Array.isArray(helden) ? helden : []).filter((h, i, l) => h && typeof h.id === 'string' && h.id && l.findIndex(x => x && x.id === h.id) === i);
  const gruppeVon = h => (h.pausiert ? 'ruht' : h.ohneFrage || h.wartet ? 'keinMuss' : 'heute');
  const reihe = (Array.isArray(cfg && cfg.reihe) ? cfg.reihe : []).filter((g, i, l) => HELDEN_GRUPPEN.includes(g) && l.indexOf(g) === i);
  const alle = [...reihe, ...HELDEN_GRUPPEN.filter(g => !reihe.includes(g))];
  const zu = new Set(Array.isArray(cfg && cfg.eingeklappt) ? cfg.eingeklappt : []);
  const gruppen = alle.map(g => ({ gruppe: g, ids: liste.filter(h => gruppeVon(h) === g).map(h => h.id), zu: zu.has(g) })).filter(g => g.ids.length);
  const ab = Number.isInteger(cfg && cfg.abGruppen) && cfg.abGruppen >= 1 ? cfg.abGruppen : 2;
  return { gruppen, mitKopf: gruppen.length >= ab };
}
export function naechsterOffener(helden, aktiv) {
  const liste = (Array.isArray(helden) ? helden : []).filter(h => h && typeof h.id === 'string' && h.id);
  const i = liste.findIndex(h => h.id === aktiv);
  const reihe = i < 0 ? liste : [...liste.slice(i + 1), ...liste.slice(0, i)];
  const n = reihe.find(h => h.id !== aktiv && !h.erledigt);
  return n ? n.id : null;
}

// Bonus-Aufgaben (Version 45): die ersten `max` sichtbar, der Rest hinter „+ N weitere“.
// Feste Reihenfolge (nichts springt beim Abhaken). mehr = true zeigt alle. Ungültiges max → 2.
export function bonusAnsicht(liste, max, mehr = false) {
  const alle = Array.isArray(liste) ? liste : [];
  const m = Number.isInteger(max) && max >= 0 ? max : 2;
  const sichtbar = mehr ? alle : alle.slice(0, m);
  return { sichtbar, weitere: alle.length - sichtbar.length, umschaltbar: alle.length > m };
}

// ---------- Momente der Startseite (Version 49) ----------
// Gültige Konfiguration; kaputte Felder fallen einzeln auf den Standard zurück. fehler = lesbare Meldungen.
export const START_MOMENTE_STANDARD = Object.freeze({ erfolg: { an: true }, wechsel: { an: true, dauerMs: 2600 } });
export function startMomente(cfg) {
  const c = cfg && typeof cfg === 'object' ? cfg : {};
  const fehler = [];
  const an = (wert, wo, std) => { if (typeof wert === 'boolean') return wert; if (wert !== undefined) fehler.push(`${wo}: an muss true oder false sein`); return std; };
  const e = c.erfolg && typeof c.erfolg === 'object' ? c.erfolg : {};
  const w = c.wechsel && typeof c.wechsel === 'object' ? c.wechsel : {};
  const S = START_MOMENTE_STANDARD;
  let dauerMs = S.wechsel.dauerMs;
  if (w.dauerMs !== undefined) {
    if (Number.isFinite(w.dauerMs) && w.dauerMs >= 800 && w.dauerMs <= 8000) dauerMs = Math.round(w.dauerMs);
    else fehler.push('wechsel.dauerMs muss zwischen 800 und 8000 liegen');
  }
  if (!cfg || typeof cfg !== 'object') fehler.push('Start-Momente: keine Konfiguration');
  return {
    erfolg: { an: an(e.an, 'erfolg', S.erfolg.an) },
    wechsel: { an: an(w.an, 'wechsel', S.wechsel.an), dauerMs },
    fehler
  };
}

// Erfolgsmoment: Wie groß erscheint das Heldenbild in der Heldentat-Karte?
// Groß nur direkt nach dem eigenen „Ja“ in dieser Sitzung (frisch), für diesen Helden und diesen Tag.
// Danach klein: nach dem Einklappen, beim nächsten Öffnen, auf einem anderen Gerät, am nächsten Tag.
// Grund (Entscheidung 13): Gewöhnung vermeiden; das große Bild bleibt an die Handlung gekoppelt.
// frisch = { heroId, tag } oder null. Ergebnis: 'gross' | 'klein' | null (kein „Ja“ heute → kein Bild)
export function erfolgGroesse(antwort, frisch, heroId, heute, an = true) {
  if (antwort !== 'ja') return null;
  if (!an) return 'klein';
  return frisch && typeof frisch === 'object' && frisch.heroId === heroId && frisch.tag === heute ? 'gross' : 'klein';
}

// Wechsel-Banner: nur bei einem echten Wechsel zwischen zwei vorhandenen, verschiedenen Helden.
// Nicht beim App-Start (vorher fehlt), nicht beim Tippen auf den schon aktiven Helden, nicht bei unbekanntem Ziel.
export function wechselBanner(vorher, nachher, heldenIds, an = true) {
  if (!an || typeof vorher !== 'string' || !vorher || typeof nachher !== 'string' || !nachher || vorher === nachher) return false;
  return Array.isArray(heldenIds) && heldenIds.includes(nachher);
}

// ---------- Neuigkeiten-Punkte an den Tabs (Version 51) ----------
const BIS = ['erledigt', 'gesehen'];
// Prüft das Register gegen die bekannten Quellen und Tabs. Liefert lesbare Fehler, wirft nie.
// Version 59: optional { abschnitte, glanzStile } prüft auch abschnitt, vorziehen, glanz und rang.
export function pruefeNeuigkeiten(register, quellenIds, tabIds, { abschnitte = null, glanzStile = null } = {}) {
  if (!Array.isArray(register)) return ['Neuigkeiten: Register ist keine Liste'];
  const f = [];
  const ids = new Set();
  register.forEach((z, i) => {
    const wo = `Neuigkeit ${i + 1}${z && z.id ? ` (${z.id})` : ''}`;
    if (!z || typeof z.id !== 'string' || !z.id) { f.push(`${wo}: id fehlt`); return; }
    if (ids.has(z.id)) f.push(`${wo}: doppelt`);
    ids.add(z.id);
    if (!(quellenIds || []).includes(z.id)) f.push(`${wo}: keine Quelle`);
    if (z.tab !== null && z.tab !== undefined || !('abschnitt' in z)) { // ohne Tab nur erlaubt, wenn es auf der Startseite wirkt
      if (!(tabIds || []).includes(z.tab)) f.push(`${wo}: unbekannter Tab „${z.tab}“`);
      if (!BIS.includes(z.bis)) f.push(`${wo}: bis muss ${BIS.join(' oder ')} sein`);
    }
    const ab = abschnitte ? new Set(abschnitte) : null;
    if ('abschnitt' in z && ab && !ab.has(z.abschnitt)) f.push(`${wo}: unbekannter Abschnitt „${z.abschnitt}“`);
    if (z.vorziehen !== undefined) {
      if (typeof z.abschnitt !== 'string') f.push(`${wo}: vorziehen ohne abschnitt`);
      else if (z.vorziehen === z.abschnitt) f.push(`${wo}: vorziehen hinter sich selbst`);
      else if (ab && !ab.has(z.vorziehen)) f.push(`${wo}: vorziehen hinter unbekannten Abschnitt „${z.vorziehen}“`);
    }
    if (z.glanz !== undefined) {
      if (typeof z.abschnitt !== 'string') f.push(`${wo}: glanz ohne abschnitt`);
      else if (glanzStile && !glanzStile.includes(z.glanz)) f.push(`${wo}: unbekannter Glanz „${z.glanz}“`);
    }
    if ('abschnitt' in z && !Number.isFinite(z.rang)) f.push(`${wo}: rang fehlt`);
  });
  return f;
}

// Welche Tabs bekommen einen Punkt?
// quellen: { id: () => Kennung | null } (Kennung = was genau neu ist, z. B. Woche und Teil; null = nichts Neues)
// aktiv: gerade offener Tab (bekommt nie einen Punkt)
// gesehen: Set der Kennungen, die auf ihrem Tab schon zu sehen waren (zählt nur bei bis: 'gesehen')
// Ergebnis: { tabs: [Tab-IDs, Reihenfolge wie im Register], aktuell: [{ tab, kennung }] } — Kennungen mit
// vorangestellter id („gegner:…“), damit gleiche Werte verschiedener Quellen nicht kollidieren.
// Kaputte Zeilen und Quellen, die werfen, zählen als „nichts Neues“.
export function tabPunkte(register, quellen, aktiv, gesehen) {
  const schon = gesehen instanceof Set ? gesehen : new Set();
  const aktuell = [];
  const tabs = [];
  for (const z of Array.isArray(register) ? register : []) {
    if (!z || typeof z.id !== 'string' || typeof z.tab !== 'string' || !BIS.includes(z.bis)) continue;
    const q = quellen && quellen[z.id];
    if (typeof q !== 'function') continue;
    let roh = null;
    try { roh = q(); } catch (e) { roh = null; }
    if (typeof roh !== 'string' || !roh) continue;
    const kennung = `${z.id}:${roh}`;
    aktuell.push({ tab: z.tab, kennung });
    if (z.tab === aktiv || (z.bis === 'gesehen' && schon.has(kennung)) || tabs.includes(z.tab)) continue;
    tabs.push(z.tab);
  }
  return { tabs, aktuell };
}

// ---------- Einklappbare Abschnitte (Version 52) ----------
// Welche Abschnitte sind gerade klein? liste = START_ABSCHNITTE, mitKurz = IDs mit Kurzzeile in app.js,
// gespeichert = Liste eingeklappter IDs (je Gerät). Nur klappbare Abschnitte mit Kurzzeile können klein sein;
// alte oder fremde IDs in `gespeichert` werden ignoriert. Liefert { klappbar: [ids], klein: [ids], fehler }.
export function klappZustand(liste, mitKurz, gespeichert) {
  const kurz = new Set(Array.isArray(mitKurz) ? mitKurz : []);
  const fehler = [];
  const klappbar = [];
  for (const z of Array.isArray(liste) ? liste : []) {
    if (!z || typeof z.id !== 'string' || z.klappbar !== true) continue;
    if (!kurz.has(z.id)) { fehler.push(`Startseite: „${z.id}“ ist klappbar, hat aber keine Kurzzeile`); continue; }
    if (!klappbar.includes(z.id)) klappbar.push(z.id);
  }
  const g = new Set(Array.isArray(gespeichert) ? gespeichert.filter(x => typeof x === 'string') : []);
  // 31.10.2026: klein: true in den Daten = eingeklappt, bis man es aufklappt (gemerkt als „auf:<id>“)
  const std = new Set(klappStandardKlein(liste));
  return { klappbar, klein: klappbar.filter(id => (std.has(id) ? !g.has(KLAPP_AUF + id) : g.has(id))), fehler };
}

// Merkzeichen für „aufgeklappt“ bei Abschnitten, die von sich aus klein sind (klein: true in START_ABSCHNITTE).
export const KLAPP_AUF = 'auf:';
// IDs mit klappbar: true und klein: true (Standard eingeklappt). Wirft nie.
export function klappStandardKlein(liste) {
  return (Array.isArray(liste) ? liste : []).filter(z => z && typeof z.id === 'string' && z.klappbar === true && z.klein === true).map(z => z.id);
}

// Neue gespeicherte Liste nach „Kleiner“ (klein = true) bzw. „Mehr zeigen“ (false). Ohne Doppel, nur Strings.
// standardKlein (31.10.2026): der Abschnitt ist von sich aus klein; gemerkt wird dann nur das Aufklappen („auf:<id>“).
// Gespeichert wird immer nur die Abweichung vom Standard, alte Einträge derselben ID fallen weg.
export function klappUmschalten(gespeichert, id, klein, standardKlein = false) {
  const alt = Array.isArray(gespeichert) ? gespeichert.filter(x => typeof x === 'string' && x !== id && x !== KLAPP_AUF + id) : [];
  if (standardKlein === true) return klein ? alt : [...alt, KLAPP_AUF + id];
  return klein ? [...alt, id] : alt;
}

// Alte Einzel-Wahlen einmalig in die allgemeine Liste übernehmen (Version 63, Etappe C).
// Beispiel: Premium hatte bis Version 62 ein eigenes Merkmal `premium_klein`. Wer die Karte klein hatte,
// soll sie nach dem Umzug nicht plötzlich groß sehen.
// gespeichert  aktuelle Liste (merkmal 'start_klein'), darf kaputt sein
// alt          { <abschnittId>: <alter Wert> }; nur echtes true heißt „klein“, alles andere wird verworfen
// Rückgabe     { liste, aufraeumen } – aufraeumen = Abschnitte, deren altes Merkmal noch einen Wert hat und
//              geleert werden soll (auch false/Unsinn, damit die Übernahme nur einmal läuft). Wirft nie.
// Eine neuere Wahl in der allgemeinen Liste gewinnt nicht gegen „klein“: die Liste kennt nur „klein“, nie „groß“.
export function klappUebernehmen(gespeichert, alt) {
  let liste = Array.isArray(gespeichert) ? gespeichert.filter(x => typeof x === 'string') : [];
  const aufraeumen = [];
  if (!alt || typeof alt !== 'object') return { liste, aufraeumen };
  for (const [id, wert] of Object.entries(alt)) {
    if (wert === undefined || wert === null) continue; // nie gesetzt oder schon übernommen
    aufraeumen.push(id);
    if (wert === true && !liste.includes(id)) liste = [...liste, id];
  }
  return { liste, aufraeumen };
}

// Abschnitt vorziehen (Version 57, „Siegel weiter oben“). Ein Abschnitt mit `vorziehen: { nach: '<id>' }` rückt direkt
// hinter den genannten Abschnitt, solange sein Signal wahr ist (z. B. Story: ein Siegel wartet). Sonst bleibt er an seinem Platz.
// ids      geordnete IDs aus ordneAbschnitte()
// liste    START_ABSCHNITTE (für die vorziehen-Angaben)
// signale  { id: true/false } aus app.js; fehlt ein Signal → nicht vorziehen
// Mehrere vorgezogene Abschnitte hinter demselben Ziel behalten ihre Reihenfolge aus der Liste.
// Kaputte Angaben (Ziel unbekannt, aus, gleich sich selbst) → Abschnitt bleibt, Fehler wird gemeldet. Wirft nie.
export function vorziehen(ids, liste, signale) {
  const fehler = [];
  if (!Array.isArray(ids)) return { ids: [], fehler: ['Startseite: vorziehen ohne Abschnittsliste'] };
  let neu = [...ids];
  const hinter = {}; // Ziel → Zahl schon eingefügter Abschnitte (Reihenfolge stabil)
  for (const z of Array.isArray(liste) ? liste : []) {
    if (!z || typeof z !== 'object' || z.vorziehen === undefined) continue;
    const id = z.id;
    const nach = z.vorziehen && typeof z.vorziehen === 'object' ? z.vorziehen.nach : undefined;
    if (typeof nach !== 'string' || !nach || nach === id) { fehler.push(`Startseite: „${id}“ hat ein ungültiges vorziehen`); continue; }
    if (!neu.includes(id)) continue; // ausgeschaltet oder unbekannt (meldet schon ordneAbschnitte)
    if (!neu.includes(nach)) { fehler.push(`Startseite: „${id}“ soll hinter „${nach}“, den es nicht gibt`); continue; }
    if (!(signale && signale[id] === true)) continue;
    neu = neu.filter(x => x !== id);
    const pos = neu.indexOf(nach) + 1 + (hinter[nach] || 0);
    neu.splice(pos, 0, id);
    hinter[nach] = (hinter[nach] || 0) + 1;
  }
  return { ids: neu, fehler };
}

// Glanz beim ersten Erscheinen (Version 57): Siegel glüht, Held wippt. Nur einmal je neuer Sache (Kennung),
// nicht bei jedem Öffnen. gespeichert = { art: kennung } (je Gerät), aktuell = { art: kennung | null }.
// Liefert { arten: [...] fällig, neu: zu speichernder Stand, geaendert }. Müll im Speicher wird bereinigt.
export function glanzFaellig(gespeichert, aktuell) {
  const alt = gespeichert && typeof gespeichert === 'object' && !Array.isArray(gespeichert) ? gespeichert : {};
  const neu = {};
  for (const [k, v] of Object.entries(alt)) if (typeof v === 'string' && /^[a-z]{1,20}$/.test(k)) neu[k] = v;
  const arten = [];
  for (const [art, kennung] of Object.entries(aktuell && typeof aktuell === 'object' ? aktuell : {})) {
    if (typeof kennung !== 'string' || !kennung || !/^[a-z]{1,20}$/.test(art)) continue;
    if (neu[art] !== kennung) { arten.push(art); neu[art] = kennung; }
  }
  const geaendert = arten.length > 0 || Object.keys(neu).length !== Object.keys(alt).length;
  return { arten, neu, geaendert };
}

// Neuigkeiten auf der Startseite (Version 59): wer rückt vor, wer glänzt? Eine Quelle: daten/neuigkeiten.js.
// quellen wie bei tabPunkte(). Regel: höchstens EINE Neuigkeit rückt vor (kleinster rang mit `vorziehen`);
// alle aktiven mit `glanz` glänzen an ihrem (ggf. neuen) Platz. Gleicher rang → Reihenfolge im Register.
// Ergebnis: { vor: { abschnitt, nach } | null, glanz: [{ id, abschnitt, stil, kennung }] }. Kennung = Rohwert der
// Quelle (ohne id), damit gespeicherte Glanz-Kennungen aus Version 57 gültig bleiben. Wirft nie.
export function neuAufStart(register, quellen) {
  const aktiv = [];
  (Array.isArray(register) ? register : []).forEach((z, i) => {
    if (!z || typeof z.id !== 'string' || typeof z.abschnitt !== 'string' || !z.abschnitt) return;
    const q = quellen && quellen[z.id];
    if (typeof q !== 'function') return;
    let roh = null;
    try { roh = q(); } catch (e) { roh = null; }
    if (typeof roh !== 'string' || !roh) return;
    aktiv.push({ z, roh, i, rang: Number.isFinite(z.rang) ? z.rang : Infinity });
  });
  aktiv.sort((a, b) => a.rang - b.rang || a.i - b.i);
  const v = aktiv.find(x => typeof x.z.vorziehen === 'string' && x.z.vorziehen && x.z.vorziehen !== x.z.abschnitt);
  return {
    vor: v ? { abschnitt: v.z.abschnitt, nach: v.z.vorziehen } : null,
    glanz: aktiv.filter(x => typeof x.z.glanz === 'string' && x.z.glanz).map(x => ({ id: x.z.id, abschnitt: x.z.abschnitt, stil: x.z.glanz, kennung: x.roh }))
  };
}

// Wenn-dann für die Heldentat in zwei Feldern (Version 61). Die Fähigkeiten speichern den Auslöser als ganzen Satz
// („Wenn du Süßigkeiten essen möchtest:“); im Feld „WENN“ steht nur der Rest („du Süßigkeiten essen möchtest“).
// Fehlt „Wenn“ am Anfang, bleibt der Satz ganz (nur der Doppelpunkt am Ende fällt weg). Nie undefined.
// Dauer des Rückgängig-Hinweises (Version 147, daten/startseite.js RUECKGAENGIG). Ungültig → 3000 ms. Wirft nie.
export const RUECK_STANDARD_MS = 3000;
export function rueckDauer(cfg) {
  const ms = cfg && typeof cfg === 'object' ? cfg.ms : undefined;
  return Number.isInteger(ms) && ms >= 1000 && ms <= 15000 ? ms : RUECK_STANDARD_MS;
}

export function wennDann(f) {
  const s = v => (typeof v === 'string' ? v.trim() : '');
  const roh = s(f && f.wenn).replace(/\s*[:：]\s*$/, '');
  const m = /^wenn\s+(.+)$/i.exec(roh);
  return { wenn: m ? m[1] : roh, dann: s(f && f.kurz) };
}

// ---------- Kampfbühne (31.10.2026, Entscheidungen Abschnitt 18) ----------
// Zustand der Bühne für den Helden im Rampenlicht:
//   offen   Check heute noch nicht beantwortet (Heldentat mit zwei Siegeln)
//   ablauf  gerade nach „Ja“: Treffer → Heldenbild → Boss-Sprechblase (läuft nur in dieser Sitzung, nach der Uhr)
//   ruhe    beantwortet: Bühne klein, Tagesende oder „Weiter zu …“. Nach „nicht gebraucht“ sofort.
// antwort   heutige Antwort (daten/antworten.js: 'ja' | 'nein' | 'schwer'; sonst offen)
// ablauf    ui.buehne = { heroId, tag, startMs, art } aus dem letzten Tages-Check dieser Sitzung, darf null/kaputt sein
// heroId, tag  Held und Tag, die gerade gezeigt werden (ein Ablauf eines anderen Helden oder Tages zählt nicht)
// jetztMs   Uhrzeit in ms; dauer = { art: ms bis zum Ruhezustand } (buehneDauer)
// Liefert { zustand, art, vergangenMs }. Wirft nie.
export function buehneZustand(antwort, ablauf, heroId, tag, jetztMs, dauer) {
  if (!istAntwort(antwort)) return { zustand: 'offen', art: null, vergangenMs: 0 }; // Version 141: auch „schwer“ ist beantwortet
  const ok = antwort === 'ja' && !!ablauf && typeof ablauf === 'object' && ablauf.heroId === heroId && ablauf.tag === tag
    && Number.isFinite(ablauf.startMs) && typeof ablauf.art === 'string' && Number.isFinite(jetztMs);
  if (!ok) return { zustand: 'ruhe', art: null, vergangenMs: 0 };
  const d = dauer && Object.prototype.hasOwnProperty.call(dauer, ablauf.art) && Number.isFinite(dauer[ablauf.art]) ? dauer[ablauf.art] : 0;
  const v = jetztMs - ablauf.startMs;
  if (v < 0 || v >= d) return { zustand: 'ruhe', art: ablauf.art, vergangenMs: Math.max(0, v) };
  return { zustand: 'ablauf', art: ablauf.art, vergangenMs: v };
}

// Gesamtdauer bis zum Ruhezustand je Art: Ende des Ablaufs (daten/bewegung.js) + ruhePauseMs. endeMs = ablaufEndeMs.
// Unbekannte Art oder leerer Ablauf → 0 (sofort Ruhe). Liefert { dauer: { art: ms }, fehler: [...] }. Wirft nie.
export function buehneDauer(kb, endeMs) {
  const dauer = {};
  const fehler = [];
  const ablauf = kb && kb.ablauf && typeof kb.ablauf === 'object' ? kb.ablauf : {};
  const p = kb && Number.isFinite(kb.ruhePauseMs) && kb.ruhePauseMs >= 0 && kb.ruhePauseMs <= 5000 ? kb.ruhePauseMs : 900;
  if (kb && kb.ruhePauseMs !== undefined && p !== kb.ruhePauseMs) fehler.push('Kampfbühne: ruhePauseMs muss zwischen 0 und 5000 liegen (gilt 900)');
  for (const [art, id] of Object.entries(ablauf)) {
    let ende = 0;
    try { ende = typeof endeMs === 'function' ? Number(endeMs(id)) || 0 : 0; } catch (e) { ende = 0; }
    if (!ende) { fehler.push(`Kampfbühne: Ablauf „${id}“ für „${art}“ fehlt oder ist leer (sofort Ruhezustand)`); dauer[art] = 0; continue; }
    dauer[art] = ende + p;
  }
  return { dauer, fehler };
}

// Treffer-Ablauf mit der Zeit kürzen (Version 139, KAMPFBUEHNE.kurz). Liefert { abTreffer, vollBeiComeback, fehler }.
// abTreffer: ganze Zahl 0–365 (0 = nie kürzen), sonst 7; vollBeiComeback: Wahrheitswert, sonst true. Wirft nie.
export const KURZ_STANDARD = { abTreffer: 7, vollBeiComeback: true };
export function kurzRegel(kb) {
  const k = kb && kb.kurz && typeof kb.kurz === 'object' ? kb.kurz : {};
  const fehler = [];
  let ab = KURZ_STANDARD.abTreffer;
  if (k.abTreffer !== undefined) {
    if (Number.isInteger(k.abTreffer) && k.abTreffer >= 0 && k.abTreffer <= 365) ab = k.abTreffer;
    else fehler.push(`Kampfbühne: kurz.abTreffer muss eine ganze Zahl zwischen 0 und 365 sein (gilt ${KURZ_STANDARD.abTreffer})`);
  }
  let vc = KURZ_STANDARD.vollBeiComeback;
  if (k.vollBeiComeback !== undefined) {
    if (typeof k.vollBeiComeback === 'boolean') vc = k.vollBeiComeback;
    else fehler.push('Kampfbühne: kurz.vollBeiComeback muss true oder false sein (gilt true)');
  }
  return { abTreffer: ab, vollBeiComeback: vc, fehler };
}
// Welcher Bühnen-Ablauf nach „Ja“ läuft: 'sieg' | 'treffer' | 'kurz'. f = { sieg, trefferVorher, comeback }.
// trefferVorher = Treffer-Tage des Helden vor heute (ungültig → 0, also voll). Ohne ablauf.kurz nie 'kurz'. Wirft nie.
export function buehneArtWahl(kb, f = {}) {
  if (f && f.sieg) return 'sieg';
  const r = kurzRegel(kb);
  const hatKurz = !!(kb && kb.ablauf && typeof kb.ablauf.kurz === 'string' && kb.ablauf.kurz);
  if (!hatKurz || r.abTreffer === 0) return 'treffer';
  if (r.vollBeiComeback && f && f.comeback) return 'treffer';
  const n = f && Number.isFinite(f.trefferVorher) && f.trefferVorher > 0 ? Math.floor(f.trefferVorher) : 0;
  return n >= r.abTreffer ? 'kurz' : 'treffer';
}
// Treffer-Tage vor heuteK: Tage mit der Antwort „ja“ (tage = { 'JJJJ-MM-TT': antwort }). Wirft nie.
export function trefferTageVor(tage, heuteK) {
  if (!tage || typeof tage !== 'object' || typeof heuteK !== 'string') return 0;
  return Object.keys(tage).filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t) && t < heuteK && tage[t] === 'ja').length;
}

// Ersatz-Abschnitte (31.10.2026): liste = START_ABSCHNITTE, aktiv = gezeigte IDs (START_IDS). Ist `id` gerade nicht auf
// der Seite, aber ein aktiver Abschnitt nennt ihn in `ersetzt`, gilt dieser. Sonst bleibt `id` (Aufrufer prüft selbst).
export function abschnittZiel(id, liste, aktiv) {
  const a = Array.isArray(aktiv) ? aktiv : [];
  if (a.includes(id)) return id;
  for (const z of Array.isArray(liste) ? liste : []) {
    if (z && typeof z.id === 'string' && Array.isArray(z.ersetzt) && z.ersetzt.includes(id) && a.includes(z.id)) return z.id;
  }
  return id;
}

// Form des Wegs in der Kopfleiste (31.10.2026): 'pfad' oder 'kette', alles andere → 'pfad'. Wirft nie.
export const WEG_FORMEN = ['pfad', 'kette', 'streifen']; // 'streifen' seit Version 135
export function wegForm(cfg) {
  const f = cfg && typeof cfg === 'object' ? cfg.weg : undefined;
  return WEG_FORMEN.includes(f) ? f : 'pfad';
}

// Eingeklappte Zeile des Streifens (Version 174): 'kette' (Punkte + „Kapitel n von m“) oder 'status' (voller Stand wie bisher
// mit Gegnerbild, Balken und „noch n bis …“). Alles andere → 'status' (die alte Zeile ist der sichere Rückfall). Wirft nie.
export const STREIFEN_FORMEN = ['kette', 'status'];
export function streifenForm(cfg) {
  const f = cfg && typeof cfg === 'object' ? cfg.streifen : undefined;
  return STREIFEN_FORMEN.includes(f) ? f : 'status';
}

// Punkte der Kette (Version 174): je Gegner einer, davor „besiegt“, der aktuelle „aktuell“, danach „kommend“. Ein einzelner Gegner hat
// keine Kette (leere Liste, die Ansicht nimmt dann die Zeile „status“). Mehr als `max` Gegner: ein Fenster um den aktuellen.
// nr zählt ab 1 und wird in die Kette geklemmt; ungültige Werte → leere Liste (nr) bzw. 1 (anzahl ist Pflicht). Wirft nie.
export function kettenPunkte(nr, anzahl, max = 8) {
  const n = Number.isInteger(anzahl) ? anzahl : 0;
  if (n < 2) return [];
  const pos = Number.isInteger(nr) ? Math.min(Math.max(nr, 1), n) : 1;
  const m = Number.isInteger(max) && max >= 2 ? max : 8;
  const von = Math.min(Math.max(0, pos - Math.ceil(m / 2)), Math.max(0, n - m));
  const bis = Math.min(n, von + m);
  const aus = [];
  for (let i = von + 1; i <= bis; i++) aus.push(i < pos ? 'besiegt' : i === pos ? 'aktuell' : 'kommend');
  return aus;
}

// Frage in der Heldentat (Version 174): Wenn-dann-Plan und Frage stehen in EINEM Block. Nennt der Plan die Situation („Wenn …“),
// darf die Frage kurz sein („Hat dein Plan heute gehalten?“): die Situation steht ja direkt darüber. Das gilt nur für die
// allgemeine Frage (`standardArt`: kein eigener Text der Zählweise oder Zielart wie „Hast du diese Woche …“). Ohne Situation,
// ohne Kurztext oder bei eigener Art bleibt die bisherige Frage (`lang`: Tagesfrage der Vorlage oder Standardtext). Wirft nie.
export function planFrage(wd, standardArt, kurz, lang) {
  const plan = !!(wd && typeof wd.wenn === 'string' && wd.wenn.trim());
  const k = typeof kurz === 'string' ? kurz.trim() : '';
  return plan && standardArt === true && k ? k : lang;
}

// Fortschritt ordnen (Version 140): Register (daten/startseite.js FORTSCHRITT) → { id: Set(orte) }.
// Fehlt das Register oder eine Anzeige darin, gilt der Standard. Unbekannte Anzeigen, unbekannte Orte und kaputte
// Einträge werden gemeldet (warn) und übersprungen; ein kaputter Eintrag fällt auf seinen Standard zurück. Wirft nie.
export function fortschrittOrte(reg, standard, orte, warn = () => {}) {
  const erlaubt = new Set(Array.isArray(orte) ? orte : []);
  const std = standard && typeof standard === 'object' ? standard : {};
  const aus = {};
  for (const [id, liste] of Object.entries(std)) aus[id] = new Set((Array.isArray(liste) ? liste : []).filter(o => erlaubt.has(o)));
  if (reg === undefined || reg === null) return aus;
  if (typeof reg !== 'object' || Array.isArray(reg)) { warn('Fortschritt: Register ist kein Objekt, Standard gilt'); return aus; }
  for (const [id, e] of Object.entries(reg)) {
    if (!Object.prototype.hasOwnProperty.call(std, id)) { warn(`Fortschritt: unbekannte Anzeige „${id}“`); continue; }
    if (!e || typeof e !== 'object' || !Array.isArray(e.orte)) { warn(`Fortschritt: „${id}“ ohne Liste orte, Standard gilt`); continue; }
    const s = new Set();
    for (const o of e.orte) {
      if (erlaubt.has(o)) s.add(o);
      else warn(`Fortschritt: unbekannter Ort „${o}“ bei „${id}“`);
    }
    aus[id] = s;
  }
  return aus;
}
// Steht Anzeige `id` an Ort `ort`? Unbekannte Anzeige → false.
export function zeigtFortschritt(orte, id, ort) {
  return !!(orte && orte[id] instanceof Set && orte[id].has(ort));
}
// Text im Gegner-Streifen (bzw. Pfad, Kette) aus den Teilen, die an `ort` stehen. Reihenfolge: „x von y“, „noch n bis …“,
// Kapitel. Bleibt nichts übrig (z. B. Runde schon gewonnen und „x von y“ steht nicht hier), gilt `rueckfall`.
// teile: { rundeStand, rest, kapitel } als fertige Texte ('' = nicht vorhanden).
export function wegText(orte, ort, teile, rueckfall = '') {
  const t = teile || {};
  const liste = ['rundeStand', 'rest', 'kapitel'].filter(id => zeigtFortschritt(orte, id, ort) && t[id]).map(id => t[id]);
  return liste.length ? liste.join(' · ') : rueckfall;
}
