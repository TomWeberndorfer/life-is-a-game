// Ansichts-Kontext (app.js aufteilen, 30.10.2026): EINE Stelle, über die die Ansichtsmodule unter js/ansicht/
// Zustand und Helfer von app.js lesen (Spielstand, Oberflächenzustand, Texte, Bilder …).
// Warum so: Die Ansichten waren Teil von app.js und lesen viel gemeinsamen Zustand. Ein Kontext statt dutzender
// Parameter hält den Umbau klein; neue Ansichten holen sich, was sie brauchen, mit `const { stand, T } = kx;`.
// Regeln:
// - app.js ruft binde() einmal beim Start. Werte, die sich ändern (stand, spiel, ui …), werden als Getter
//   gebunden, damit jede Ansicht beim Zeichnen den aktuellen Stand liest.
// - Ansichten SCHREIBEN keinen gebundenen Namen (nur Eigenschaften, z. B. ui.screen). Für echte Änderungen gibt
//   app.js Funktionen in den Kontext (z. B. setzeStartGlanz).
// - Ein Name, den app.js nicht gebunden hat, wirft sofort einen verständlichen Fehler, statt still `undefined`
//   zu liefern (ein Abschnitt der Startseite erscheint dann im Testprofil als roter Hinweis).
// - Reine Helfer ohne Zustand (esc, icon …) stehen in ansicht/helfer.js und werden direkt importiert.

const werte = {};

export const kx = new Proxy(werte, {
  get(ziel, name) {
    if (typeof name !== 'string') return undefined;
    if (!(name in ziel)) throw new Error(`Ansicht: „${name}“ fehlt im Kontext (binde in app.js)`);
    return ziel[name];
  },
  set(ziel, name) { throw new Error(`Ansicht: „${String(name)}“ darf nur app.js setzen (binde)`); }
});

// bindungen: { name: () => wert } für veränderliche Werte (Getter), sonst Funktionen/Konstanten direkt.
// Erneutes Binden ersetzt (z. B. wenn app.js im Test mehrfach geladen wird).
export function binde(getter = {}, feste = {}) {
  const doppelt = Object.keys(getter).filter(k => k in feste);
  if (doppelt.length) throw new Error(`Ansichts-Kontext: doppelt gebunden: ${doppelt.join(', ')}`);
  for (const [k, f] of Object.entries(getter)) {
    if (typeof f !== 'function') throw new Error(`Ansichts-Kontext: Getter für „${k}“ ist keine Funktion`);
    Object.defineProperty(werte, k, { get: f, configurable: true, enumerable: true });
  }
  for (const [k, v] of Object.entries(feste)) {
    if (v === undefined) throw new Error(`Ansichts-Kontext: „${k}“ ist undefined`);
    Object.defineProperty(werte, k, { value: v, configurable: true, enumerable: true, writable: false });
  }
}

// Fehlende Namen für eine Liste (z. B. Selbstprüfung beim Start). Leere Liste = alles gebunden.
export const fehlendImKontext = namen => namen.filter(n => !(n in werte));
