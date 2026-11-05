// Karte (30.10.2026): Chronik der Reise je Held. Reine Ableitung aus Runden und Siegen, nichts gespeichert.
// Vergangenheit vollständig (jeder Sieg ein Ort mit Datum, Runden und Anwendungen), Gegenwart (aktueller Gegner, Held
// steht davor), Zukunft offen: höchstens `voraus` kommende Gegner als Silhouette, danach immer Nebel (offener Horizont,
// Version 20 – die Gesamtzahl der Gegner wird nie verraten). Abgrenzung: Die Stadt zeigt, wer du wirst; die Karte, wo du
// schon warst. Einstellungen: daten/karte.js.
import * as K from './kern.js';

export const ORT = Object.freeze({ start: 'start', besiegt: 'besiegt', aktuell: 'aktuell', verborgen: 'verborgen', nebel: 'nebel' });
export const KARTE_STANDARD = Object.freeze({ voraus: 1 });
// ---------- Kartenbilder als Bildfolge nach Schablone (Version 126) ----------
// Jedes Bild ist eine Kachel im festen Format breite:hoehe (9:16) mit `orte` Orten (6). Gemalter Weg und App-Pfad sind
// so deckungsgleich: Ort i liegt in Bild ⌊i/orte⌋+1, die Zeilenhöhe ergibt sich aus der Kartenbreite
// (Breite × hoehe/breite / orte, Breite höchstens maxBreitePx). Bildplätze in „Inhalte pflegen“, je Stil oder „alle“:
//   <platz>-<held>-<nr>  optional eigene Karte eines Helden (z. B. karte-hintergrund-khara-2)
//   <platz>-<nr>         gemeinsame Bildfolge (karte-hintergrund-1, -2 …)
//   <platz>              Altbestand (Version 122) = Bild 1 der gemeinsamen Folge
// Rückfall je Bildnummer: Held → gemeinsam; fehlt beides, läuft das letzte vorhandene Bild weiter (unter dichterem
// Schleier). Ohne jedes Bild bleibt die gezeichnete Karte (kein Platzhalter). Fehlende Bilder meldet nur die Pflege.
export const HINTERGRUND_STANDARD = Object.freeze({ platz: 'karte-hintergrund', schleier: 0.6, breite: 9, hoehe: 16, orte: 6, maxBreitePx: 480 });
const ID = /^[a-z0-9][a-z0-9-]*$/;
export function hintergrundKonfig(konfig) {
  const c = konfig && typeof konfig === 'object' ? konfig : {};
  const S = HINTERGRUND_STANDARD;
  const ganz = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  return {
    platz: typeof c.platz === 'string' && ID.test(c.platz) ? c.platz : S.platz,
    schleier: typeof c.schleier === 'number' && c.schleier >= 0 && c.schleier <= 1 ? c.schleier : S.schleier,
    breite: ganz(c.breite, 1, 100) ? c.breite : S.breite,
    hoehe: ganz(c.hoehe, 1, 100) ? c.hoehe : S.hoehe,
    orte: ganz(c.orte, 1, 20) ? c.orte : S.orte,
    maxBreitePx: ganz(c.maxBreitePx, 200, 2000) ? c.maxBreitePx : S.maxBreitePx
  };
}
// Höhe einer Zeile (px) für eine Kartenbreite (px). Ungültige Breite → Höchstbreite; zu breit → Höchstbreite.
export function zeileAusBreite(breitePx, konfig) {
  const k = hintergrundKonfig(konfig);
  const b = Number.isFinite(breitePx) && breitePx > 0 ? Math.min(breitePx, k.maxBreitePx) : k.maxBreitePx;
  return Math.round(b * k.hoehe / k.breite / k.orte * 100) / 100;
}
// Bildnummer (ab 1) des Orts mit Index i; ungültig → 1.
export function bildNr(i, konfig) {
  const { orte } = hintergrundKonfig(konfig);
  const n = Number.isFinite(Number(i)) ? Math.max(0, Math.floor(Number(i))) : 0;
  return Math.floor(n / orte) + 1;
}
// Wie viele Bilder die Karte bei `anzahl` Orten braucht (mindestens 1).
export function bilderNoetig(anzahl, konfig) {
  const { orte } = hintergrundKonfig(konfig);
  const n = Number.isFinite(Number(anzahl)) ? Math.max(0, Math.floor(Number(anzahl))) : 0;
  return Math.max(1, Math.ceil(n / orte));
}
// Bildplätze für Bild `nr` in Prüfreihenfolge. held optional (Helden-ID); ungültige ID → nur gemeinsame Plätze.
export function kartenPlaetze(nr, held, konfig) {
  const { platz } = hintergrundKonfig(konfig);
  const n = Number.isInteger(nr) && nr >= 1 ? nr : 1;
  const aus = [];
  if (typeof held === 'string' && ID.test(held)) aus.push(`${platz}-${held}-${n}`);
  aus.push(`${platz}-${n}`);
  if (n === 1) aus.push(platz);
  return aus;
}
// Gilt ein Bildschlüssel als Kartenbild? (für die Pflege: nummerierte Plätze sind bekannt, ohne alle aufzuzählen)
export function istKartenPlatz(schluessel, konfig) {
  const { platz } = hintergrundKonfig(konfig);
  const k = String(schluessel || '');
  if (k === platz) return true;
  if (!k.startsWith(platz + '-')) return false;
  return /^([a-z0-9][a-z0-9-]*-)?[1-9][0-9]{0,2}$/.test(k.slice(platz.length + 1));
}
// Ein Bild aus finde(platz) → { src, pos } oder null (kein Bild, nur Platzhalter, Fehler). Wirft nie.
function echtesBild(finde, p) {
  let b;
  try { b = finde(p); } catch (e) { return null; }
  if (!b || b.quelle === 'platzhalter' || typeof b.src !== 'string' || !b.src) return null;
  return { src: b.src, pos: typeof b.pos === 'string' && b.pos ? b.pos : '50% 50%' };
}
// Bildfolge der Karte bei `anzahl` Orten. opt: { held }. Liefert null (kein einziges Bild) oder
// { schleier, bilder: [{ nr, src, pos, quelle: 'held'|'gemeinsam'|'ersatz', platz }] } mit genau bilderNoetig() Einträgen.
// 'ersatz' = für diese Nummer fehlt ein Bild, es läuft das letzte vorhandene davor weiter (am Anfang das erste danach).
export function kartenBilder(anzahl, finde, konfig, opt = {}) {
  if (typeof finde !== 'function') return null;
  const k = hintergrundKonfig(konfig);
  const held = opt && opt.held;
  const roh = [];
  for (let nr = 1; nr <= bilderNoetig(anzahl, k); nr++) {
    let treffer = null;
    for (const p of kartenPlaetze(nr, held, k)) {
      const b = echtesBild(finde, p);
      if (b) { treffer = { nr, ...b, platz: p, quelle: p.startsWith(`${k.platz}-${held}-`) ? 'held' : 'gemeinsam' }; break; }
    }
    roh.push(treffer || { nr, fehlt: true });
  }
  const vorhanden = roh.filter(b => !b.fehlt);
  if (!vorhanden.length) return null;
  let letztes = null;
  const bilder = roh.map(b => {
    if (!b.fehlt) { letztes = b; return b; }
    const q = letztes || vorhanden[0];
    return { nr: b.nr, src: q.src, pos: q.pos, quelle: 'ersatz', platz: q.platz };
  });
  return { schleier: k.schleier, bilder };
}
// Für die Pflege: Nummern 1..bedarf der gemeinsamen Folge ohne Bild. Leer, wenn keine Folge angefangen ist
// (ohne jedes Kartenbild ist die gezeichnete Karte gewollt, kein Hinweis) oder nichts fehlt.
export function fehlendeKartenbilder(bedarf, finde, konfig) {
  if (typeof finde !== 'function') return [];
  const k = hintergrundKonfig(konfig);
  const n = Number.isInteger(bedarf) && bedarf >= 1 ? Math.min(bedarf, 999) : 1;
  const da = [];
  for (let nr = 1; nr <= n; nr++) da.push(kartenPlaetze(nr, null, k).some(p => echtesBild(finde, p)));
  return da.some(Boolean) ? da.map((x, i) => (x ? 0 : i + 1)).filter(Boolean) : [];
}
const VORAUS_MAX = 3;

// Gültige Einstellungen; Ungültiges fällt einzeln auf den Standard zurück.
export function karteKonfig(cfg) {
  const c = cfg && typeof cfg === 'object' ? cfg : {};
  const ok = v => Number.isInteger(v) && v >= 0 && v <= VORAUS_MAX;
  return { voraus: ok(c.voraus) ? c.voraus : KARTE_STANDARD.voraus };
}

// Reise eines Helden (stand = Heldenansicht mit Quest). Liefert { orte, held, siege }:
// orte  [{ art, … }] von alt nach neu: start { tag } · besiegt { gegner, von, tag, runden, anwendungen, rundenListe } ·
//       aktuell { gegner, kapitel, treffer, anzahl, morgen, ab } · verborgen { gegner, kapitel, ab? } · nebel
// held  Index des Orts, vor dem der Held steht (aktueller Gegner bzw. der verborgene Neue am Siegtag)
// rundenListe (für die Rückschau beim Antippen eines Orts): [{ key, von, bis, gegner, erste, anwendungen }] je Runde dieser
//       Etappe; erste = erste Runde gegen diesen Gegner (dann gilt seine eigene Geschichte, logik/inhalte.js storyRunde).
// opt.verhuellt (Version 115): Ist der Neue noch nicht vorgestellt? Fehlt die Angabe, gilt die alte Datumsregel (Version 68).
export function reiseWeg(stand, heute, cfg, opt = {}) {
  if (!stand || !stand.quest || !stand.tage || typeof stand.tage !== 'object') throw new Error('reiseWeg: keine Quest');
  const { voraus } = karteKonfig(cfg);
  const heuteK = K.tagKey(heute);
  const a = K.auswertung(stand, heute);
  const { runden } = K.runden(stand, heuteK);
  const kette = K.kette(stand);
  const orte = [{ art: ORT.start, tag: K.questStart(stand, heuteK) }];
  let etappe = null;
  for (const r of runden) {
    if (!etappe) etappe = { gegner: r.gegner, von: r.von, runden: 0, anwendungen: 0, liste: [] };
    if (r.von <= heuteK) {
      etappe.runden++; etappe.anwendungen += r.anwendungen;
      etappe.liste.push({ key: r.key, von: r.von, bis: r.bis, gegner: r.gegner, erste: r.nr === 1 || r.neuerGegner, anwendungen: r.anwendungen });
    }
    if (r.sieg && r.sieg <= heuteK) {
      orte.push({ art: ORT.besiegt, gegner: etappe.gegner, von: etappe.von, tag: r.sieg, runden: etappe.runden, anwendungen: etappe.anwendungen, rundenListe: etappe.liste });
      etappe = null;
    }
  }
  // Siegtag mit neuem Gegner (Version 68): der Neue bleibt verborgen; seit Version 115, bis seine Vorstellung gesehen ist
  const morgen = a.rundeTag < 0;
  const neuVerborgen = typeof (opt && opt.verhuellt) === 'boolean' ? opt.verhuellt && a.gegnerNr >= 2 : a.siegHeute && a.neuerGegner && morgen;
  const held = orte.length;
  orte.push(neuVerborgen
    ? { art: ORT.verborgen, gegner: a.gegner, kapitel: a.gegnerNr, ab: morgen ? a.rundeVon : null }
    : { art: ORT.aktuell, gegner: a.gegner, kapitel: a.gegnerNr, treffer: a.treffer, anzahl: a.anzahl, morgen, ab: morgen ? a.rundeVon : null });
  for (let i = 0; i < voraus; i++) {
    const id = kette[a.gegnerNr + i];
    if (!id) break;
    orte.push({ art: ORT.verborgen, gegner: id, kapitel: a.gegnerNr + 1 + i });
  }
  orte.push({ art: ORT.nebel });
  return { orte, held, siege: a.siege };
}

// Seit der Überarbeitung am 30.10.2026 zeigt die Karte nur den aktiven Helden (Wechsel wie auf der Startseite);
// die Ansicht ruft reiseWeg(stand, …) für ihn auf. Ein Fehler zeigt dort einen Hinweis statt der Karte.

// ---------- Zeichnung des Pfads (reine Geometrie) ----------
// Orte untereinander, abwechselnd links/rechts (p = { zeile, links, rechts } aus daten/karte.js). x in Prozent der
// Breite, y in px. Zwischen zwei Orten eine S-Kurve (kubische Bézierkurve mit senkrechten Tangenten).
const PFAD_STANDARD = { zeile: 100, links: 22, rechts: 78, zeileMinPx: 84 };
export function pfadKonfig(p) {
  const c = p && typeof p === 'object' ? p : {};
  const ok = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
  return {
    zeile: ok(c.zeile, 48, 200) ? c.zeile : PFAD_STANDARD.zeile,
    links: ok(c.links, 5, 50) ? c.links : PFAD_STANDARD.links,
    rechts: ok(c.rechts, 50, 95) ? c.rechts : PFAD_STANDARD.rechts,
    zeileMinPx: ok(c.zeileMinPx, 40, 200) ? c.zeileMinPx : PFAD_STANDARD.zeileMinPx
  };
}
export function ortPunkt(i, p) {
  const c = pfadKonfig(p);
  const n = Math.max(0, Math.floor(Number(i) || 0));
  return { x: n % 2 ? c.rechts : c.links, y: c.zeile / 2 + n * c.zeile };
}
// Punkt auf dem Pfad für eine Position (z. B. 2.5 = halb zwischen Ort 2 und 3); begrenzt auf 0..anzahl−1.
export function pfadPunkt(position, anzahl, p) {
  const max = Math.max(0, (Number(anzahl) || 1) - 1);
  const pos = Math.min(max, Math.max(0, Number(position) || 0));
  const i = Math.min(Math.floor(pos), Math.max(0, max - 1));
  const t = max === 0 ? 0 : pos - i;
  const a = ortPunkt(i, p), b = ortPunkt(i + (max === 0 ? 0 : 1), p);
  const h = (b.y - a.y) / 2;
  const u = 1 - t;
  // P0 = a, P1 = (a.x, a.y + h), P2 = (b.x, b.y − h), P3 = b
  const x = u * u * u * a.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t * t * t * b.x;
  const y = u * u * u * a.y + 3 * u * u * t * (a.y + h) + 3 * u * t * t * (b.y - h) + t * t * t * b.y;
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}
// ---------- Nebel-Zone (04.11.2026, „Karte: Nebel und Kartenbild nach Schablone“, Schritt A) ----------
// Statt eines Nebel-Orts endet die Karte in einer Zone, in die der Weg verblassend hineinläuft. Feste Länge mit ruhigem
// Abschluss, nie endlos (kein Endlos-Scrollen). Werte: daten/karte.js KARTE_NEBEL; ungültig → einzeln Standard.
export const NEBEL_STANDARD = Object.freeze({ hoeheVh: 100, minPx: 360, maxPx: 900, verblassen: 0.55 });
export function nebelKonfig(c) {
  const k = c && typeof c === 'object' ? c : {};
  const ok = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
  const minPx = ok(k.minPx, 120, 2000) ? k.minPx : NEBEL_STANDARD.minPx;
  const maxPx = ok(k.maxPx, 120, 3000) && k.maxPx >= minPx ? k.maxPx : Math.max(minPx, NEBEL_STANDARD.maxPx);
  return {
    hoeheVh: ok(k.hoeheVh, 20, 200) ? k.hoeheVh : NEBEL_STANDARD.hoeheVh,
    minPx, maxPx,
    verblassen: ok(k.verblassen, 0.1, 1) ? k.verblassen : NEBEL_STANDARD.verblassen
  };
}
// Orte für die Zeichnung: sichtbare Orte und ob am Ende Nebel folgt (der Nebel ist kein Ort mehr, sondern die Zone).
export function reiseTeile(orte) {
  const liste = Array.isArray(orte) ? orte.filter(o => o && typeof o === 'object') : [];
  const nebel = liste.length > 0 && liste[liste.length - 1].art === ORT.nebel;
  return { orte: (nebel ? liste.slice(0, -1) : liste).filter(o => o.art !== ORT.nebel), nebel };
}
// Weg in der Nebel-Zone (eigenes SVG, Box 100 × 100): beginnt oben bei x0 (Lage des letzten Orts), schwingt zur
// Gegenseite und läuft zur Mitte aus. Die Ansicht blendet ihn mit einem Verlauf aus (verblassen = Anteil der Höhe).
export function nebelPfadD(x0) {
  const x = Number.isFinite(x0) ? Math.min(95, Math.max(5, x0)) : 50;
  const g = 100 - x;
  return `M${x} 0 C${x} 22 ${g} 18 ${g} 45 C${g} 70 50 72 50 100`;
}

// ---------- Platz der Heldenfigur (04.11.2026) ----------
// Die Figur schwebt über ihrer Stelle auf dem Weg (Fuß-Punkt bleibt genau auf dem Pfad, er zeigt den Fortschritt).
// Verdeckt sie dabei Text oder ein Ortsbild (z. B. „portioniert“ beim Nachtschwärmer), weicht sie aus: die Versätze
// werden der Reihe nach probiert, der erste freie gilt. Ist keiner frei, sucht sie die nächste freie Stelle um den Fuß
// (Raster mit schrittPx bis weitePx, nächste zuerst); erst wenn auch das nichts findet, gilt die kleinste Überdeckung.
// x in Prozent der Breite, y in px. Prozent aus px über refBreitePx (schmalste Breite: dort ist die Figur relativ am
// größten, frei bei refBreite heißt frei bei jeder größeren Breite). textRand = Abstand der Texte vom Rand ihres Orts (%).
export const HELD_STANDARD = Object.freeze({
  heldHalbPx: 16, stationHalbPx: 18, textHalbPx: 26, textRand: 36, refBreitePx: 340, schrittPx: 4, weitePx: 60,
  versatz: Object.freeze([[0, -34], [0, 0], [0, 34]])
});
export function heldKonfig(c) {
  const k = c && typeof c === 'object' ? c : {};
  const ok = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
  const paar = v => Array.isArray(v) && v.length === 2 && v.every(z => ok(z, -200, 200));
  const versatz = Array.isArray(k.versatz) ? k.versatz.filter(paar) : [];
  return {
    heldHalbPx: ok(k.heldHalbPx, 4, 60) ? k.heldHalbPx : HELD_STANDARD.heldHalbPx,
    stationHalbPx: ok(k.stationHalbPx, 0, 60) ? k.stationHalbPx : HELD_STANDARD.stationHalbPx,
    textHalbPx: ok(k.textHalbPx, 0, 80) ? k.textHalbPx : HELD_STANDARD.textHalbPx,
    textRand: ok(k.textRand, 25, 50) ? k.textRand : HELD_STANDARD.textRand,
    refBreitePx: ok(k.refBreitePx, 200, 2000) ? k.refBreitePx : HELD_STANDARD.refBreitePx,
    schrittPx: ok(k.schrittPx, 1, 40) ? k.schrittPx : HELD_STANDARD.schrittPx,
    weitePx: ok(k.weitePx, 0, 200) ? k.weitePx : HELD_STANDARD.weitePx,
    versatz: versatz.length ? versatz.map(v => [v[0], v[1]]) : HELD_STANDARD.versatz.map(v => [v[0], v[1]])
  };
}
// Textkasten eines Orts (x1..x2 in %, y1..y2 in px): links liegende Orte haben den Text rechts daneben und umgekehrt.
export function textKasten(i, p, hk) {
  const h = heldKonfig(hk);
  const q = ortPunkt(i, p);
  const links = q.x < 50;
  return { x1: links ? h.textRand : 0, x2: links ? 100 : 100 - h.textRand, y1: q.y - h.textHalbPx, y2: q.y + h.textHalbPx };
}
// Platz der Figur für eine Position auf dem Weg (wie pfadPunkt) bei `anzahl` Orten. Liefert
// { x, y, fuss: { x, y }, frei } – frei = nichts verdeckt. Wirft nie.
export function heldPlatz(position, anzahl, p, hk) {
  const c = pfadKonfig(p);
  const h = heldKonfig(hk);
  const n = Math.max(1, Math.floor(Number(anzahl) || 1));
  const fuss = pfadPunkt(position, n, c);
  const pct = 100 / h.refBreitePx;
  const hx = h.heldHalbPx * pct;
  const hindernisse = [];
  for (let i = 0; i < n; i++) {
    const q = ortPunkt(i, c);
    hindernisse.push(textKasten(i, c, h));
    hindernisse.push({ x1: q.x - h.stationHalbPx * pct, x2: q.x + h.stationHalbPx * pct, y1: q.y - h.stationHalbPx, y2: q.y + h.stationHalbPx });
  }
  const flaeche = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const rund = v => Math.round(v * 100) / 100;
  let beste = null;
  // Feinsuche: Raster um den Fuß, nächste Stellen zuerst (bei gleichem Abstand zuerst oben, dann links)
  const raster = [];
  const st = Math.floor(h.weitePx / h.schrittPx); // weitePx 0 = keine Feinsuche
  if (st > 0) for (let i = -st; i <= st; i++) for (let j = -st; j <= st; j++) raster.push([i * h.schrittPx, j * h.schrittPx]);
  raster.sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2) || a[1] - b[1] || a[0] - b[0]);
  for (const [dx, dy] of h.versatz.concat(raster)) {
    const x = fuss.x + dx * pct, y = fuss.y + dy;
    if (x - hx < 0 || x + hx > 100 || y < 0 || y > n * c.zeile) continue; // nicht aus der Karte hinaus
    const k = { x1: x - hx, x2: x + hx, y1: y - h.heldHalbPx, y2: y + h.heldHalbPx };
    const f = hindernisse.reduce((s, b) => s + flaeche(k, b), 0);
    if (f === 0) return { x: rund(x), y: rund(y), fuss, frei: true };
    if (!beste || f < beste.f) beste = { x, y, f };
  }
  if (beste) return { x: rund(beste.x), y: rund(beste.y), fuss, frei: false };
  return { x: fuss.x, y: rund(fuss.y + h.versatz[0][1]), fuss, frei: false };
}

// SVG-Pfad durch die Orte von..bis (Indizes, inklusive). Leer, wenn weniger als zwei Punkte.
export function pfadD(von, bis, p) {
  const c = pfadKonfig(p);
  if (!(bis > von)) return '';
  let d = '';
  for (let i = von; i <= bis; i++) {
    const q = ortPunkt(i, c);
    if (i === von) { d = `M${q.x} ${q.y}`; continue; }
    const v = ortPunkt(i - 1, c), h = (q.y - v.y) / 2;
    d += ` C${v.x} ${v.y + h} ${q.x} ${q.y - h} ${q.x} ${q.y}`;
  }
  return d;
}
