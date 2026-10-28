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
