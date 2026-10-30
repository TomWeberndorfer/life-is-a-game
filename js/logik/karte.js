// Karte (30.10.2026): Chronik der Reise je Held. Reine Ableitung aus Runden und Siegen, nichts gespeichert.
// Vergangenheit vollständig (jeder Sieg ein Ort mit Datum, Runden und Anwendungen), Gegenwart (aktueller Gegner, Held
// steht davor), Zukunft offen: höchstens `voraus` kommende Gegner als Silhouette, danach immer Nebel (offener Horizont,
// Version 20 – die Gesamtzahl der Gegner wird nie verraten). Abgrenzung: Die Stadt zeigt, wer du wirst; die Karte, wo du
// schon warst. Einstellungen: daten/karte.js.
import * as K from './kern.js';

export const ORT = Object.freeze({ start: 'start', besiegt: 'besiegt', aktuell: 'aktuell', verborgen: 'verborgen', nebel: 'nebel' });
export const KARTE_STANDARD = Object.freeze({ voraus: 1 });
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
export function reiseWeg(stand, heute, cfg) {
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
  // Siegtag mit neuem Gegner (Version 68): der Neue bleibt bis zum nächsten Besuch verborgen
  const morgen = a.rundeTag < 0;
  const neuVerborgen = a.siegHeute && a.neuerGegner && morgen;
  const held = orte.length;
  orte.push(neuVerborgen
    ? { art: ORT.verborgen, gegner: a.gegner, kapitel: a.gegnerNr, ab: a.rundeVon }
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
const PFAD_STANDARD = { zeile: 84, links: 22, rechts: 78 };
export function pfadKonfig(p) {
  const c = p && typeof p === 'object' ? p : {};
  const ok = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
  return {
    zeile: ok(c.zeile, 48, 200) ? c.zeile : PFAD_STANDARD.zeile,
    links: ok(c.links, 5, 50) ? c.links : PFAD_STANDARD.links,
    rechts: ok(c.rechts, 50, 95) ? c.rechts : PFAD_STANDARD.rechts
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
