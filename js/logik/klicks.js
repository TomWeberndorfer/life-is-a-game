// Klick-Register (Klick-Logik aufteilen, 30.10.2026). Ersetzt den großen `switch` in app.js.
// Jede Ansicht unter js/ansicht/ exportiert ein Register <NAME>_KLICKS = { '<data-a>': ({ id, aktion, el }) => … }.
// app.js führt alle Register mit klickRegister() zusammen und ruft beim Klick verteile() auf.
// Warum so: Ein Klick gehört zur Ansicht, die den Knopf zeichnet. Neue Ansicht = neues Register + eine Zeile in
// app.js, ohne den gemeinsamen Verteiler anzufassen. Reine Logik ohne DOM, darum im Test prüfbar.

// Erlaubte Aktionsnamen: wie die heutigen data-a-Werte (klein, Ziffern, Bindestrich).
export const AKTION_MUSTER = /^[a-z][a-z0-9-]*$/;

// quellen: { REGISTERNAME: { aktion: funktion } } → { register: { aktion: { f, quelle } }, fehler: [Text] }.
// Fehler brechen nicht ab (die App soll trotzdem starten); der erste Eintrag einer doppelten Aktion bleibt gültig.
// Der Test (klick.test.js) verlangt eine leere Fehlerliste.
export function klickRegister(quellen) {
  const register = {};
  const fehler = [];
  if (!quellen || typeof quellen !== 'object') return { register, fehler: ['Klick-Register: keine Quellen übergeben'] };
  for (const [quelle, teil] of Object.entries(quellen)) {
    if (!teil || typeof teil !== 'object') { fehler.push(`Klick-Register ${quelle} fehlt oder ist kein Objekt`); continue; }
    for (const [aktion, f] of Object.entries(teil)) {
      if (!AKTION_MUSTER.test(aktion)) { fehler.push(`Klick „${aktion}“ (${quelle}): ungültiger Name`); continue; }
      if (typeof f !== 'function') { fehler.push(`Klick „${aktion}“ (${quelle}) ist keine Funktion`); continue; }
      if (register[aktion]) { fehler.push(`Klick „${aktion}“ doppelt: ${register[aktion].quelle} und ${quelle}`); continue; }
      register[aktion] = { f, quelle };
    }
  }
  return { register, fehler };
}

// Führt eine Aktion aus. Ergebnis: 'ok' | 'unbekannt' | 'fehler'. Wirft nie.
// melde.warn(text): unbekannte Aktion (Knopf ohne Register-Eintrag)
// melde.fehler(err, aktion): Ausnahme in der Aktion, auch bei async-Aktionen (abgelehntes Promise, kommt später)
export function verteile(register, aktion, daten, melde = {}) {
  const warn = typeof melde.warn === 'function' ? melde.warn : () => {};
  const fehler = typeof melde.fehler === 'function' ? melde.fehler : () => {};
  const eintrag = register && typeof aktion === 'string' && Object.prototype.hasOwnProperty.call(register, aktion) ? register[aktion] : null;
  if (!eintrag) { warn(`Klick: unbekannte Aktion „${aktion}“`); return 'unbekannt'; }
  return fuehreAus(eintrag.f, { id: undefined, el: null, ...daten, aktion }, aktion, fehler);
}

// Ruft f(daten) auf; Ausnahmen und abgelehnte Promises gehen an fehler(err, name). 'ok' | 'fehler'. Auch für felder.js.
export function fuehreAus(f, daten, name, fehler) {
  try {
    const r = f(daten);
    if (r && typeof r.then === 'function') r.then(undefined, e => fehler(e, name));
    return 'ok';
  } catch (e) {
    fehler(e, name);
    return 'fehler';
  }
}
