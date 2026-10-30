// Heldenstadt (aus app.js ausgelagert, 30.10.2026): ein Bezirk je Lebensbereich, Zustand aus logik/stadt.js.
// Bezirksbild: eigenes Bild → Datei des Stils → Rückfallkette → gezeichnete Silhouette (daten/stadt.js).
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import { SILHOUETTEN } from '../daten/stadt.js';
import * as K from '../logik/kern.js';
import { STATUS, stadtAnsicht, stadtSichtbar } from '../logik/stadt.js';
import { esc, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { einstellungenKnopf } from './rahmen.js';

// Bezirksbild: eigenes Bild → Datei des Stils → Rückfallkette (Banner/Porträt des Helden) → gezeichnete Silhouette
export function bezirkBild(domainId, name) {
  const { bildFuer, img, stand } = kx;
  const platz = 'bezirk-' + domainId;
  if (bildFuer(stand.stil.aktiv, platz, 'szene').quelle !== 'platzhalter') return img(platz, name, 'szene', 'bezirk-img');
  return `<svg class="bezirk-svg" viewBox="0 0 64 48" aria-hidden="true">${SILHOUETTEN[domainId] || SILHOUETTEN._standard}</svg>`;
}
export const STADT_SCREENS = {
  stadt() {
    const { SCREENS, T, bezirkName, jetzt, nameVon, spiel, ui, wort } = kx;
    if (!stadtSichtbar(spiel)) { ui.screen = 'start'; return SCREENS.start(); }
    let bezirke;
    try { bezirke = stadtAnsicht(spiel, LEBENSBEREICHE); }
    catch (e) { console.warn('Stadt:', e.message); bezirke = []; }
    const entsteht = bezirke.filter(b => b.status === STATUS.entsteht);
    return `<section class="screen stadt">
      <div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${einstellungenKnopf()}</div>
      <div class="inhalt start-inhalt">
        <div><span class="eyebrow">${esc(T('stadt.eyebrow', { STADT: wort('stadt').toUpperCase() }))}</span>
        <h1>${esc(T('stadt.titel', { stadtname: wort('stadtname') }))}</h1>
        <p class="klein">${esc(T('stadt.intro', { bezirk: wort('bezirk') }))}</p></div>
        <div class="skyline" aria-hidden="true">${bezirke.map(b => `<span class="sky ${b.status}">${bezirkBild(b.domainId, b.name)}</span>`).join('')}</div>
        <ul class="bezirke" aria-label="${esc(wort('bezirk'))}e">
          ${bezirke.map(b => `<li class="bezirk ${b.status}">
            <span class="bezirk-bild">${bezirkBild(b.domainId, b.name)}</span>
            <b>${esc(bezirkName(b.domainId, b.name))}</b>
            <span>${esc(b.status === STATUS.entsteht ? T('bezirk.entsteht', { helden: b.helden.map(nameVon).join(', ') }) : T('bezirk.unentdeckt'))}</span>
          </li>`).join('')}
        </ul>
        <p class="klein mitte-text">${entsteht.length ? esc(T('stadt.fuss', { bezirk: wort('bezirk') })) : ''}</p>
      </div>
    </section>`;
  }
};
