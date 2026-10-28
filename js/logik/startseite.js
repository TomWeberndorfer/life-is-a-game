// Startseite (Version 43): reine Funktionen, nichts im DOM.

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
    if (z.aus === true) return;
    ids.push(id);
  });
  return { ids, fehler };
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
export function pruefeNeuigkeiten(register, quellenIds, tabIds) {
  if (!Array.isArray(register)) return ['Neuigkeiten: Register ist keine Liste'];
  const f = [];
  const ids = new Set();
  register.forEach((z, i) => {
    const wo = `Neuigkeit ${i + 1}${z && z.id ? ` (${z.id})` : ''}`;
    if (!z || typeof z.id !== 'string' || !z.id) { f.push(`${wo}: id fehlt`); return; }
    if (ids.has(z.id)) f.push(`${wo}: doppelt`);
    ids.add(z.id);
    if (!(quellenIds || []).includes(z.id)) f.push(`${wo}: keine Quelle`);
    if (!(tabIds || []).includes(z.tab)) f.push(`${wo}: unbekannter Tab „${z.tab}“`);
    if (!BIS.includes(z.bis)) f.push(`${wo}: bis muss ${BIS.join(' oder ')} sein`);
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
  return { klappbar, klein: klappbar.filter(id => g.has(id)), fehler };
}

// Neue gespeicherte Liste nach „Kleiner“ (klein = true) bzw. „Mehr zeigen“ (false). Ohne Doppel, nur Strings.
export function klappUmschalten(gespeichert, id, klein) {
  const alt = Array.isArray(gespeichert) ? gespeichert.filter(x => typeof x === 'string' && x !== id) : [];
  return klein ? [...alt, id] : alt;
}
