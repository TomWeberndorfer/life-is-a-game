// Einführung vor Anzeige (Version 115, Entscheidung 03.11.2026; ersetzt die Datumsregel von Version 68).
// Ein neues Element (vorerst: Gegner ab Kapitel 2) erscheint erst offen, wenn seine Vorstellung gesehen wurde. Bis dahin
// bleibt es verhüllt (Silhouette). Freigegeben wird durch „gesehen“, nicht durch das Datum; die Spiellogik bleibt: der
// neue Kampf zählt weiter erst ab dem Tag nach dem Sieg.
// Gespeichert: spiel.vorgestellt = Liste von Kennungen „<art>:<basis>|<nr>“ (alle Geräte). Weitere Arten (Kapitel,
// Fähigkeit, Ort, Held) nutzen dieselbe Liste mit eigenem Präfix. null = Stand vor Version 115 (Altbestand, app.js füllt
// ihn beim Start einmal: alles bis jetzt gilt als gesehen, außer einer Vorstellung, die nach alter Regel noch offen war).
// Reine Funktionen, werfen nie.

export const ARTEN = Object.freeze(['boss']);
export const MAX_VORGESTELLT = 200;
const KENNUNG = /^[a-z]+:[^\s]{1,200}$/;

// Kennung eines Elements. basis = Held | Queststart | Vorlage (wie Version 68), nr = Kapitel. Ungültig → null.
export function kennung(art, basis, nr) {
  if (!ARTEN.includes(art) || typeof basis !== 'string' || !basis || !Number.isInteger(nr) || nr < 1) return null;
  const k = `${art}:${basis}|${nr}`;
  return KENNUNG.test(k) ? k : null;
}

// Gespeicherte Liste prüfen. Fehlt sie (undefined/null) → null (Altbestand). Müll fällt weg, doppelte einmal, höchstens max.
export function bereinigeVorgestellt(roh, max = MAX_VORGESTELLT) {
  if (roh === undefined || roh === null) return null;
  if (!Array.isArray(roh)) return [];
  const aus = [];
  for (const k of roh) if (typeof k === 'string' && KENNUNG.test(k) && !aus.includes(k)) aus.push(k);
  return aus.slice(-max);
}

// Gesehen? Ohne Liste (Altbestand, noch nicht gefüllt) gilt alles als gesehen: lieber einmal zu früh offen als verhüllt.
export function istVorgestellt(liste, k) {
  if (!Array.isArray(liste)) return true;
  return typeof k === 'string' && liste.includes(k);
}

// Neue Liste mit k (am Ende, ältere fallen bei mehr als max weg). Ungültiges k → Liste unverändert (bereinigt).
export function merkeVorgestellt(liste, k, max = MAX_VORGESTELLT) {
  const alt = bereinigeVorgestellt(liste, max) || [];
  if (typeof k !== 'string' || !KENNUNG.test(k)) return alt;
  return [...alt.filter(x => x !== k), k].slice(-max);
}

// Offene Vorstellung des aktuellen Gegners oder null.
// a = kern.auswertung(), kette = kern.kette(stand), basis wie oben, liste = spiel.vorgestellt.
// Liefert { kennung, gegner, von, kapitel, anzahl, staerker, morgen }; morgen = Kampf beginnt erst morgen (Siegtag).
export function offeneVorstellung(a, kette, basis, liste) {
  if (!a || !Number.isInteger(a.gegnerNr) || a.gegnerNr < 2) return null;
  const k = Array.isArray(kette) ? kette : [];
  const gegner = k[a.gegnerNr - 1];
  if (typeof gegner !== 'string' || (a.gegner && a.gegner !== gegner)) return null;
  const id = kennung('boss', basis, a.gegnerNr);
  if (!id || istVorgestellt(liste, id)) return null;
  const v = { kennung: id, gegner, von: typeof k[a.gegnerNr - 2] === 'string' ? k[a.gegnerNr - 2] : null, kapitel: a.gegnerNr, morgen: Number.isInteger(a.rundeTag) && a.rundeTag < 0 };
  if (Number.isInteger(a.anzahl) && a.anzahl > 0) {
    v.anzahl = a.anzahl;
    if (Number.isInteger(a.vorigeAnzahl) && a.anzahl > a.vorigeAnzahl) v.staerker = true;
  }
  return v;
}

// Einblendung „Vorstellung“ (Art 'gegner' in daten/momente.js) aus einer offenen Vorstellung.
export function vorstellungMoment(v) {
  if (!v || !v.kennung || !v.gegner) return null;
  const m = { art: 'gegner', gegner: v.gegner, kapitel: v.kapitel, kennung: v.kennung, vorstellung: true, morgen: !!v.morgen };
  if (Number.isInteger(v.anzahl)) m.anzahl = v.anzahl;
  if (v.staerker) m.staerker = true;
  return m;
}

// Altbestand (Stand vor Version 115): helden = [{ basis, gegnerNr, offen }], offen = der aktuelle Gegner war nach der alten
// Regel noch verhüllt (Siegtag, app.js). Alles andere bis zum
// aktuellen Kapitel gilt als gesehen, damit niemand einen bekannten Gegner noch einmal vorgestellt bekommt.
export function vorgestelltAltbestand(helden, max = MAX_VORGESTELLT) {
  let liste = [];
  for (const h of Array.isArray(helden) ? helden : []) {
    if (!h || !Number.isInteger(h.gegnerNr)) continue;
    for (let nr = 2; nr <= h.gegnerNr; nr++) {
      if (nr === h.gegnerNr && h.offen === true) continue;
      const k = kennung('boss', h.basis, nr);
      if (k) liste = merkeVorgestellt(liste, k, max);
    }
  }
  return liste;
}
