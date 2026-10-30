// Weg der Bosskette (Version 19, Ausschnitt seit Version 20): reine Ableitung aus der Auswertung, nichts gespeichert.
// Stationen: 0 = Start, 1..n = Gegner der Kette. Position des Helden = (Kapitel − 1) + Treffer / Wochenziel.
// Nach dem letzten Gegner bleibt der Held vor diesem stehen (der letzte kommt in neuen Runden wieder).

export const STATION = Object.freeze({ start: 'start', besiegt: 'besiegt', aktuell: 'aktuell', verborgen: 'verborgen', nebel: 'nebel' });

// a: Ergebnis von kern.auswertung(); kette: Gegner-IDs der Quest
export function wegAnsicht(a, kette) {
  if (!a || !Number.isInteger(a.gegnerNr) || a.gegnerNr < 1) throw new Error('wegAnsicht: ungültige Auswertung');
  const k = Array.isArray(kette) && kette.length ? kette : [a.gegner || null];
  const nr = Math.min(a.gegnerNr, k.length);
  const anteil = a.anzahl > 0 ? Math.min(1, Math.max(0, a.treffer / a.anzahl)) : 0;
  const stationen = [{ gegner: null, status: STATION.start }, ...k.map((g, i) => ({
    gegner: g,
    status: i + 1 < nr ? STATION.besiegt : i + 1 === nr ? STATION.aktuell : STATION.verborgen
  }))];
  return { stationen, position: nr - 1 + anteil, kapitel: nr, kapitelAnzahl: k.length };
}

// Sichtbarer Ausschnitt mit offenem Horizont (Version 20, einstellbar seit 30.10.2026): `zurueck` geschaffte Stationen
// (besiegte Gegner, am Anfang der Start), aktueller Gegner, `voraus` kommende Gegner, danach immer Nebel.
// So verrät der Weg nie, wie viele Gegner noch kommen. Die Startseite nutzt WEG_FENSTER aus daten/startseite.js.
export const FENSTER_STANDARD = Object.freeze({ zurueck: 1, voraus: 1 });
const FENSTER_MAX = 6; // mehr passt auf dem Handy nicht in eine Zeile

// Gültige Fenster-Werte: ganze Zahlen 0–FENSTER_MAX; Ungültiges fällt einzeln auf den Standard zurück.
export function fensterKonfig(cfg) {
  const c = cfg && typeof cfg === 'object' ? cfg : {};
  const ok = v => Number.isInteger(v) && v >= 0 && v <= FENSTER_MAX;
  return { zurueck: ok(c.zurueck) ? c.zurueck : FENSTER_STANDARD.zurueck, voraus: ok(c.voraus) ? c.voraus : FENSTER_STANDARD.voraus };
}

export function wegFenster(w, cfg = FENSTER_STANDARD) {
  if (!w || !Array.isArray(w.stationen)) throw new Error('wegFenster: ungültiger Weg');
  const { zurueck, voraus } = fensterKonfig(cfg);
  const von = Math.max(0, w.kapitel - zurueck);
  const stationen = [...w.stationen.slice(von, w.kapitel + 1 + voraus), { gegner: null, status: STATION.nebel }];
  return { stationen, position: Math.min(stationen.length - 1, Math.max(0, w.position - von)), kapitel: w.kapitel };
}

// Punkt auf dem Weg: Stationen gleichmäßig verteilt, leicht gewellt. Liefert {x, y} für eine Position.
export function wegPunkt(position, anzahlStationen, breite = 300, rand = 24) {
  const n = Math.max(1, anzahlStationen - 1);
  const p = Math.min(n, Math.max(0, Number(position) || 0));
  const x = i => rand + i * (breite - 2 * rand) / n;
  const y = i => (i % 2 ? 40 : 56);
  const i0 = Math.floor(p);
  const i1 = Math.min(n, i0 + 1);
  const t = p - i0;
  return { x: x(i0) + (x(i1) - x(i0)) * t, y: y(i0) + (y(i1) - y(i0)) * t };
}
