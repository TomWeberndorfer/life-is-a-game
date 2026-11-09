// Seite „Wie diese App denkt“ (Version 164, 08.11.2026): fünf Zusagen und ein Mini-Glossar. Daten: daten/denken.js,
// Prüfung und Regel der Karte: logik/denken.js, Texte: daten/texte.js (`denken.*`, `einst.denken*`).
// Erreichbar auf drei Wegen: Karte unter den Neuigkeiten der Startseite (einmal), Karte in den Einstellungen (immer)
// und diese Seite selbst. „Zurück“ führt dorthin, wo man herkam (ui.denkenZurueck).
// Tonregel: ruhig und konkret, keine Werbesprache, keine Zusage ohne Entsprechung im Code.
import { merke, merkmal, trackEvent } from '../analytics.js';
import { DENKEN } from '../daten/denken.js';
import { karteOffen } from '../logik/denken.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

const HERKUNFT = ['start', 'einstellungen'];

// Als gesehen merken (je Gerät). Nur beim ersten Mal, damit nichts unnötig gespeichert wird.
function merkeGesehen() {
  if (merkmal(DENKEN.merkmal) !== true) merke(DENKEN.merkmal, true);
}

export const DENKEN_SCREENS = {
  denken() {
    const { T, ui, wort } = kx;
    const zurueck = HERKUNFT.includes(ui.denkenZurueck) ? ui.denkenZurueck : 'einstellungen';
    // Stilwörter der Modi (Erhalt heißt je Welt anders) für Platzhalter in Zusagen und Begriffen
    const werte = { fokus: wort('modus_fokus'), erhalt: wort('modus_erhalt'), ruhe: wort('modus_ruhe') };
    const zusagen = DENKEN.zusagen.map((id, i) => `<div class="karte spalte denken-zusage">
        <span class="eyebrow">${esc(String(i + 1))}</span>
        <span class="nm">${esc(T(`denken.zusage.${id}.titel`))}</span>
        <p class="klein">${esc(T(`denken.zusage.${id}.text`, werte))}</p>
      </div>`).join('');
    const glossar = DENKEN.glossar.map(g => {
      const titel = g.wort ? wort(g.wort) : T(`denken.glossar.${g.id}.titel`);
      return `<div class="karte spalte denken-begriff">
        <span class="nm">${esc(titel)}</span>
        <p class="klein">${esc(T(`denken.glossar.${g.id}.text`, werte))}</p>
      </div>`;
    }).join('');
    return `<section class="screen denken">
      <div class="start-kopf"><button class="link" data-a="denken-zurueck">${icon('zurueck')} ${esc(T('denken.zurueck'))}</button></div>
      <div class="inhalt">
        <h1>${esc(T('denken.titel'))}</h1>
        <p class="lead">${esc(T('denken.lead'))}</p>
        <span class="eyebrow">${esc(T('denken.zusagenTitel'))}</span>
        ${zusagen}
        <span class="eyebrow">${esc(T('denken.glossarTitel'))}</span>
        ${glossar}
      </div>
    </section>`;
  }
};

// Karte in den Einstellungen: immer da, wer nachlesen will, findet sie.
export function denkenEinstellung() {
  const { T } = kx;
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('einst.denken'))}</span>
    <p class="klein">${esc(T('einst.denkenText'))}</p>
    <button class="btn" data-a="denken-oeffnen" data-id="einstellungen">${esc(T('einst.denkenOeffnen'))}</button>
  </div>`;
}

// Karte unter den Neuigkeiten der Startseite (NEU_KARTEN.denken): nur einmal und nur mit laufender Quest.
// „Später“ ist ein leiser zweiter Knopf und zählt wie gesehen: nichts wird zur offenen Aufgabe.
export function denkenKarte() {
  const { T, stand } = kx;
  if (!karteOffen(merkmal(DENKEN.merkmal), !!(stand && stand.quest))) return '';
  return `<div class="karte spalte denken-karte">
    <span class="eyebrow akzent">${esc(T('denken.karte.eyebrow'))}</span>
    <span class="nm">${esc(T('denken.karte.titel'))}</span>
    <p class="klein">${esc(T('denken.karte.text'))}</p>
    <div class="zwei"><button class="btn voll" data-a="denken-oeffnen" data-id="start">${esc(T('denken.karte.lesen'))}</button><button class="btn" data-a="denken-spaeter">${esc(T('denken.karte.spaeter'))}</button></div>
  </div>`;
}

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const DENKEN_KLICKS = {
  // id = Herkunft ('start' | 'einstellungen'); Unbekanntes führt zurück in die Einstellungen
  'denken-oeffnen'({ id }) {
    const { geheZu, ui } = kx;
    ui.denkenZurueck = HERKUNFT.includes(id) ? id : 'einstellungen';
    merkeGesehen();
    trackEvent('denken_opened', {});
    geheZu('denken');
  },
  'denken-spaeter'() { const { render } = kx; merkeGesehen(); render(); },
  'denken-zurueck'() { const { geheZu, ui } = kx; geheZu(HERKUNFT.includes(ui.denkenZurueck) ? ui.denkenZurueck : 'einstellungen'); }
};
