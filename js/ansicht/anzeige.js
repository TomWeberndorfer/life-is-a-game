// Blatt „Anzeige“ (Version 125, Etappe 4): Bilder, Prunk, Bewegung und Textgröße für DIESES Gerät.
// Geöffnet aus den Einstellungen (Karte „Anzeige“); Optionen und Werte als Daten in daten/anzeige.js, Prüfen und
// Anwenden in logik/anzeige.js und app.js (setzeAnzeige). Jede Wahl wirkt sofort; Stil und Spielstand bleiben gleich.
// Zustand: ui.anzeigeBlatt (true = offen). Schließt sich selbst, wenn die Einstellungen nicht mehr offen sind.
import { ANZEIGE } from '../daten/anzeige.js';
import { esc } from './helfer.js';
import { kx } from './kontext.js';

// Karte in den Einstellungen: kurze Zusammenfassung der aktuellen Wahl und Knopf zum Blatt.
export function anzeigeEinstellung() {
  const { T, anzeige } = kx;
  const zeile = Object.keys(ANZEIGE.optionen).map(k => T(`anzeige.${k}.${anzeige[k]}`)).join(' · ');
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('einst.anzeige'))}</span>
    <p class="klein">${esc(zeile)}</p>
    <button class="btn" data-a="anzeige-oeffnen">${esc(T('einst.anzeigeAnpassen'))}</button>
  </div>`;
}

export function anzeigeBlattHtml() {
  const { T, anzeige, systemRuhig, ui } = kx;
  if (!ui.anzeigeBlatt) return '';
  if (ui.screen !== 'einstellungen') { ui.anzeigeBlatt = false; return ''; }
  const zeilen = Object.entries(ANZEIGE.optionen).map(([k, o]) => {
    const knoepfe = o.werte.map(w => `<button class="opt kurz ${anzeige[k] === w ? 'sel' : ''}" aria-pressed="${anzeige[k] === w}" data-a="anzeige-wahl" data-id="${esc(k + ':' + w)}">${esc(T(`anzeige.${k}.${w}`))}</button>`).join('');
    return `<div class="feld anzeige-zeile"><span id="anzeige-${esc(k)}-l">${esc(T(`anzeige.${k}`))}</span>
      <div class="wahl" role="group" aria-labelledby="anzeige-${esc(k)}-l">${knoepfe}</div>
      <p class="klein">${esc(T(`anzeige.${k}.text`))}</p></div>`;
  }).join('');
  return `<div class="feier unten anzeige-blatt" role="dialog" aria-modal="true" aria-labelledby="anzeige-t">
    <button class="hintergrund" data-a="anzeige-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(T('einst.anzeige'))}</span>
        <h2 id="anzeige-t">${esc(T('anzeige.titel'))}</h2>
        ${zeilen}
        ${systemRuhig ? `<p class="klein">${esc(T('anzeige.system'))}</p>` : ''}
        <p class="klein">${esc(T('anzeige.geraet'))}</p>
        <button class="cta" data-a="anzeige-zu">${esc(T('anzeige.fertig'))}</button>
      </div>
    </div>
  </div>`;
}

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const ANZEIGE_KLICKS = {
  'anzeige-oeffnen'() { const { render, ui } = kx; ui.anzeigeBlatt = true; render(); },
  'anzeige-zu'() { const { render, ui } = kx; ui.anzeigeBlatt = false; render(); },
  // id = „option:wert“, z. B. „bilder:aus“. Unbekanntes meldet setzeAnzeige als Warnung, nichts ändert sich.
  'anzeige-wahl'({ id }) {
    const { render, setzeAnzeige } = kx;
    const i = String(id || '').indexOf(':');
    if (i < 1) { console.warn('Anzeige: ungültige Wahl', id); return; }
    if (setzeAnzeige(id.slice(0, i), id.slice(i + 1))) render();
  }
};
