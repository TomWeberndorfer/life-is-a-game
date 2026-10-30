// Weltenwahl (aus app.js ausgelagert, 30.10.2026): nach dem ersten Sieg, eigener Moment (Version 42).
// Vorauswahl: stilVorauswahl() in app.js; gesperrte und Archiv-Welten erscheinen mit Schloss.
import { trackEvent } from '../analytics.js';
import { STILE, STIL_ARCHIV_VORSCHAU, STIL_REIHENFOLGE, STIL_WAEHLBAR, istWaehlbar } from '../daten/stile.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as K from '../logik/kern.js';
import * as TB from '../logik/tabelle.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

export const STILWAHL_SCREENS = {
  stilwahl() {
    const { T, aktuelleVorlage, platzhalter, stand, stilVorauswahl, tabelle } = kx;
    const sel = stilVorauswahl();
    const g = TABELLE.gegner[aktuelleVorlage().gegner];
    return `<section class="screen stilwahl dunkel">
      <div class="inhalt mitte stilwahl-inhalt">
        <div class="stil-kopf">
          <span class="stern-klein erscheint" aria-hidden="true">${icon('stern')}</span>
          <div class="stil-kopf-text">
            <span class="chip gut">${esc(T('welt.besiegt', { GEGNER: g.kurz.toUpperCase() }))}</span>
            <h1 class="stil-titel">${esc(T('welt.titel'))}</h1>
          </div>
        </div>
        <p class="lead">${esc(T('welt.frage'))}</p>
        <div class="welten" role="group" aria-label="${esc(T('welt.aria'))}">
          ${STIL_REIHENFOLGE.map(id => {
            const frei = istWaehlbar(id);
            const name = STILE[id].name;
            const zeile = stand.stil.aktiv === id ? T('welt.aktiv', { name }) : frei ? name : T('welt.bald', { name });
            return `<button class="welt ${sel === id ? 'sel' : ''} ${frei ? '' : 'gesperrt'}" ${frei ? `aria-pressed="${sel === id}"` : 'disabled aria-disabled="true"'} data-a="stil" data-id="${id}"><img src="${esc((TB.bildAus(tabelle, id, 'karte') || {}).url || STILE[id].karte)}" data-ph="${esc(TB.platzhalterPfad(id, 'szene'))}" data-ph2="${esc(platzhalter(STILE[id].name, 'szene'))}" alt="">${frei ? '' : `<span class="welt-schloss" aria-hidden="true">${icon('schloss')}</span>`}<span>${esc(zeile)}</span></button>`;
          }).join('')}
          ${STIL_ARCHIV_VORSCHAU.map(w => `<button class="welt gesperrt" disabled aria-disabled="true"><img src="${esc(platzhalter(w.name, 'szene'))}" alt=""><span class="welt-schloss" aria-hidden="true">${icon('schloss')}</span><span>${esc(T('welt.bald', { name: w.name }))}</span></button>`).join('')}
        </div>
      </div>
      <div class="fuss">
        <p class="klein mitte-text">${esc(T('welt.hinweis'))}</p>
        <button class="cta" data-a="stil-uebernehmen">${esc(T('welt.uebernehmen'))}</button>
        <button class="link" data-a="stil-spaeter">${esc(T('welt.spaeter'))}</button>
      </div>
    </section>`;
  }
};

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const STILWAHL_KLICKS = {
  stil({ id }) { const { render, ui } = kx; if (istWaehlbar(id)) { ui.stilAuswahl = id; render(); } },
  'stil-uebernehmen'() {
    const { geheZu, setzeHinweis, setzeStand, speichere, stand, stilVorauswahl } = kx;
    try { setzeStand(K.stilWaehlen(stand, stilVorauswahl(), STIL_REIHENFOLGE, STIL_WAEHLBAR)); }
    catch (err) { setzeHinweis(err.message); }
    speichere();
    trackEvent('style_selected', { stil: kx.stand.stil.aktiv }); // neu lesen: setzeStand hat den Stand ersetzt
    geheZu('start');
  },
  'stil-spaeter'() { const { geheZu, setzeStand, speichere, stand } = kx; setzeStand(K.stilAngeboten(stand)); speichere(); geheZu('start'); }
};
