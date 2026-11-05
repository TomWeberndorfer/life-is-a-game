// Ideenglas (Version 75): Ideen je Held für schwierige Momente (Notfallkarte). Daten: daten/notfall.js.
// Spielstand: spiel.ideen = { <heroId>: [{ id, kat, text }] }. Fehlt ein Held (oder das ganze Feld, Altbestand),
// gelten die Startideen seiner Fähigkeit; die erste eigene Änderung übernimmt sie in den Spielstand.
// Reine Funktionen, liefern Kopien; Fehler als IdeenFehler mit verständlicher Meldung.

const ID = /^[a-z0-9-]{1,40}$/;
const kopie = x => JSON.parse(JSON.stringify(x));
export class IdeenFehler extends Error {}

const text = (roh, max) => (typeof roh === 'string' ? roh.replace(/\s+/g, ' ').trim().slice(0, max).trim() : '');

// Startideen einer Fähigkeit (sonst _allgemein) mit stabilen IDs s-<faehigkeit>-<nr>.
export function startIdeen(start, faehigkeit) {
  const key = start && Array.isArray(start[faehigkeit]) && start[faehigkeit].length ? faehigkeit : '_allgemein';
  return ((start && start[key]) || []).map(([kat, t], i) => ({ id: `s-${String(key).toLowerCase().replace(/[^a-z0-9]/g, '')}-${i + 1}`, kat, text: t }));
}

// Prüft die Startideen beim Start. kats: erlaubte Kategorien. Liefert lesbare Fehler, wirft nie.
export function pruefeIdeen(start, { kats = [], max = 80, faehigkeiten = null } = {}) {
  const f = [];
  if (!start || !Array.isArray(start._allgemein) || !start._allgemein.length) f.push('Startideen: _allgemein fehlt');
  for (const [k, l] of Object.entries(start || {})) {
    if (faehigkeiten && k !== '_allgemein' && !faehigkeiten.includes(k)) f.push(`Startideen: unbekannte Fähigkeit ${k}`);
    if (!Array.isArray(l)) { f.push(`Startideen ${k}: keine Liste`); continue; }
    l.forEach((x, i) => {
      if (!Array.isArray(x) || !kats.includes(x[0])) f.push(`Startideen ${k}[${i}]: unbekannte Kategorie`);
      else if (!text(x[1], max) || x[1].length > max) f.push(`Startideen ${k}[${i}]: Text leer oder zu lang`);
    });
  }
  return f;
}

// Beim Laden: je Held höchstens maxJe gültige Ideen ohne doppelte IDs. Fehlendes Feld → {} (Startideen gelten).
export function bereinigeIdeen(roh, { heroIds, kats, max, maxJe }) {
  const aus = {};
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return aus;
  for (const [hid, l] of Object.entries(roh)) {
    if (!heroIds.has(hid) || !Array.isArray(l)) continue;
    const gesehen = new Set();
    aus[hid] = l.filter(x => x && ID.test(String(x.id)) && kats.includes(x.kat) && text(x.text, max) && !gesehen.has(x.id) && gesehen.add(x.id))
      .slice(0, maxJe).map(x => ({ id: x.id, kat: x.kat, text: text(x.text, max) }));
  }
  return aus;
}

// Aktuelle Ideen eines Helden (eigene oder Startideen).
export function ideenVon(spiel, heroId, start, faehigkeit) {
  const eigen = spiel && spiel.ideen && Array.isArray(spiel.ideen[heroId]) ? spiel.ideen[heroId] : null;
  return eigen ? kopie(eigen) : startIdeen(start, faehigkeit);
}

const mitListe = (spiel, heroId, liste) => ({ ...kopie(spiel), ideen: { ...((spiel && spiel.ideen) || {}), [heroId]: liste } });

// Neue Idee. opt: { start, faehigkeit, kats, max, maxJe, id }
export function ideeHinzufuegen(spiel, heroId, eingabe, opt) {
  if (!spiel || !Array.isArray(spiel.helden) || !spiel.helden.some(h => h.heroId === heroId)) throw new IdeenFehler('Unbekannter Held.');
  const t = text(eingabe && eingabe.text, opt.max);
  if (!t) throw new IdeenFehler('Bitte gib eine Idee ein.');
  if (typeof (eingabe && eingabe.text) === 'string' && eingabe.text.trim().length > opt.max) throw new IdeenFehler(`Höchstens ${opt.max} Zeichen.`);
  const kat = opt.kats.includes(eingabe && eingabe.kat) ? eingabe.kat : opt.kats[0];
  const liste = ideenVon(spiel, heroId, opt.start, opt.faehigkeit);
  if (liste.length >= opt.maxJe) throw new IdeenFehler(`Das Glas ist voll (höchstens ${opt.maxJe} Ideen).`);
  if (liste.some(x => x.text.toLowerCase() === t.toLowerCase())) throw new IdeenFehler('Diese Idee ist schon im Glas.');
  const id = opt.id || `i-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  if (!ID.test(id) || liste.some(x => x.id === id)) throw new IdeenFehler('Ungültige Ideen-ID.');
  const idee = { id, kat, text: t };
  return { spiel: mitListe(spiel, heroId, [...liste, idee]), idee };
}

// Idee löschen (auch eine Startidee). Unbekannte ID → Fehler.
export function ideeLoeschen(spiel, heroId, id, opt) {
  const liste = ideenVon(spiel, heroId, opt.start, opt.faehigkeit);
  if (!liste.some(x => x.id === id)) throw new IdeenFehler('Idee nicht gefunden.');
  return mitListe(spiel, heroId, liste.filter(x => x.id !== id));
}

// Eine Idee ziehen: zufällig, aber nicht dieselbe wie zuletzt (wenn es mehr als eine gibt). Leer → null.
// kat: optional nur eine Kategorie (gibt es dort keine, wird aus allen gezogen). zufall() für Tests austauschbar.
export function ziehe(liste, { vorher = null, kat = null, zufall = Math.random } = {}) {
  const alle = Array.isArray(liste) ? liste : [];
  const inKat = kat ? alle.filter(x => x.kat === kat) : alle;
  const pool0 = inKat.length ? inKat : alle;
  const pool = pool0.length > 1 ? pool0.filter(x => x.id !== vorher) : pool0;
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(zufall() * pool.length))];
}

// Version 97 (Etappe 2, Entscheidungen Abschnitt 26): Notfallkarte als ruhige Seite, ein Schritt je Ansicht.
// Schritte = Abschnitte aus daten/notfall.js ohne leere (hat[abschnitt] === false, z. B. kein Warum gesetzt) und ohne
// doppelte, zum Schluss immer 'ende' („Wie ist es jetzt?“). Ungültige Eingaben → nur 'ende' (die Seite bleibt bedienbar).
export function notfallSchritte(abschnitte, hat = {}) {
  const h = hat && typeof hat === 'object' ? hat : {};
  const liste = (Array.isArray(abschnitte) ? abschnitte : []).filter(a => typeof a === 'string' && a && a !== 'ende' && h[a] !== false);
  return [...new Set(liste), 'ende'];
}
// Schrittnummer in die Liste zwingen (fehlend, kaputt, zu groß → nächster gültiger Wert).
export function notfallSchritt(nr, anzahl) {
  const n = Number.isInteger(anzahl) && anzahl > 0 ? anzahl : 1;
  return Number.isInteger(nr) ? Math.max(0, Math.min(n - 1, nr)) : 0;
}

// ---------- Weiche der Notfallkarte (Version 127) ----------
// Reine Funktionen, werfen nie: ungültige Eingaben ergeben den Standardpfad, null oder [].

// Pfad zum Zustand: eigener Pfad, wenn er eine nicht leere Liste ist, sonst '_standard', sonst [].
export function notfallPfad(pfade, zustand) {
  const p = pfade && typeof pfade === 'object' ? pfade : {};
  const eigen = typeof zustand === 'string' && zustand !== '_standard' && Object.prototype.hasOwnProperty.call(p, zustand) ? p[zustand] : null;
  if (Array.isArray(eigen) && eigen.length) return [...eigen];
  return Array.isArray(p._standard) ? [...p._standard] : [];
}

// Wert für das Feld `zustand` im Eintrag: nur, was in `merken` steht; alles andere (auch „weiß nicht“) → null.
export function notfallZustand(roh, merken) {
  return Array.isArray(merken) && typeof roh === 'string' && merken.includes(roh) ? roh : null;
}

// „Du hast das schon geschafft“: einer der letzten `letzte` geschafft-Einträge des Helden mit Text, bevorzugt mit
// gleichem Zustand. Liefert den Eintrag oder null (keiner da).
export function fruehererGeschafft(eintraege, heroId, { zustand = null, letzte = 10, zufall = Math.random } = {}) {
  if (!Array.isArray(eintraege) || typeof heroId !== 'string') return null;
  const n = Number.isInteger(letzte) && letzte > 0 ? letzte : 10;
  const mitText = eintraege.filter(e => e && e.art === 'geschafft' && e.heroId === heroId && typeof e.text === 'string' && e.text.trim());
  const neu = mitText.slice().sort((a, b) => (a.tag < b.tag ? 1 : a.tag > b.tag ? -1 : String(a.erstellt || '') < String(b.erstellt || '') ? 1 : -1)).slice(0, n);
  if (!neu.length) return null;
  const gleich = zustand ? neu.filter(e => e.zustand === zustand) : [];
  const auswahl = gleich.length ? gleich : neu;
  const r = Number(zufall());
  return auswahl[Math.min(auswahl.length - 1, Math.max(0, Math.floor((Number.isFinite(r) ? r : 0) * auswahl.length)))];
}

// Erinnerung „Später antworten“: { heroId, ab } (ab = Zeitpunkt in ms, ab dem sie erscheint).
export function erinnerungNeu(heroId, jetztMs, nachMin) {
  if (typeof heroId !== 'string' || !heroId || !Number.isFinite(jetztMs)) return null;
  const min = Number.isFinite(nachMin) && nachMin >= 0 ? nachMin : 20;
  return { heroId, ab: Math.round(jetztMs + min * 60000) };
}
// Gespeicherten Wert prüfen (Text aus dem Speicher oder Objekt). Kaputt → null.
export function erinnerungLesen(roh) {
  let x = roh;
  if (typeof roh === 'string') { try { x = JSON.parse(roh); } catch (e) { return null; } }
  return x && typeof x === 'object' && typeof x.heroId === 'string' && x.heroId && Number.isFinite(x.ab) ? { heroId: x.heroId, ab: x.ab } : null;
}
// Zustand der Erinnerung: 'keine' | 'wartet' | 'faellig' | 'verfallen' (älter als verfallStd nach `ab`).
export function erinnerungZustand(e, jetztMs, verfallStd = 12) {
  const x = erinnerungLesen(e);
  if (!x || !Number.isFinite(jetztMs)) return 'keine';
  if (jetztMs < x.ab) return 'wartet';
  const std = Number.isFinite(verfallStd) && verfallStd > 0 ? verfallStd : 12;
  return jetztMs - x.ab > std * 3600000 ? 'verfallen' : 'faellig';
}
