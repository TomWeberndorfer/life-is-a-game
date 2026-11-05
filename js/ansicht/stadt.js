// Heldenstadt (aus app.js ausgelagert, 30.10.2026): ein Bezirk je Lebensbereich, Zustand aus logik/stadt.js.
// Bezirksbild: eigenes Bild → Datei des Stils → Rückfallkette → gezeichnete Silhouette (daten/stadt.js).
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import { AUSBAU, SILHOUETTEN } from '../daten/stadt.js';
import { gesamtSiege } from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { STATUS, ausbauKonfig, ausbauStufe, stadtAnsicht, stadtSichtbar } from '../logik/stadt.js';
import { esc, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { kopfRechts } from './rahmen.js';

// Bezirksbild: eigenes Bild → Datei des Stils → Rückfallkette (Banner/Porträt des Helden) → gezeichnete Silhouette
export function bezirkBild(domainId, name) {
  const { bildFuer, img, stand } = kx;
  const platz = 'bezirk-' + domainId;
  if (bildFuer(stand.stil.aktiv, platz, 'szene').quelle !== 'platzhalter') return img(platz, name, 'szene', 'bezirk-img');
  return `<svg class="bezirk-svg" viewBox="0 0 64 48" aria-hidden="true">${SILHOUETTEN[domainId] || SILHOUETTEN._standard}</svg>`;
}
// Ausbau (Version 82): großes Bild der Stufe über den Bezirken, Stufe aus der Gesamtzahl der Siege (logik/stadt.js).
// Nur wenn der aktive Stil (eigenes Bild, Datei oder Pflege) ein Bild für die Stufe hat; sonst nichts (kein Platzhalter).
const AUSBAU_CFG = ausbauKonfig(AUSBAU, m => console.warn(m));
export function ausbauHtml() {
  const { T, bildFuer, img, spiel, stand, wort } = kx;
  let a;
  try { a = ausbauStufe(gesamtSiege(spiel), AUSBAU_CFG); }
  catch (e) { console.warn('Stadt-Ausbau:', e.message); return ''; }
  if (!a.stufe || bildFuer(stand.stil.aktiv, a.platz, 'szene').quelle === 'platzhalter') return '';
  const alt = T('stadt.ausbauAlt', { stadt: wort('stadt'), stufe: a.stufe, max: a.max });
  return `<figure class="ausbau">${img(a.platz, wort('stadt'), 'szene', 'ausbau-img', alt, 'breit')}
    <figcaption class="klein">${esc(a.naechsteAb ? T('stadt.ausbauNaechste', { nr: a.naechsteAb }) : T('stadt.ausbauFertig'))}</figcaption></figure>`;
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
      <div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${kopfRechts()}</div>
      <div class="inhalt start-inhalt">
        <div><span class="eyebrow">${esc(T('stadt.eyebrow', { STADT: wort('stadt').toUpperCase() }))}</span>
        <h1>${esc(T('stadt.titel', { stadtname: wort('stadtname') }))}</h1>
        <p class="klein">${esc(T('stadt.intro', { bezirk: wort('bezirk') }))}</p></div>
        ${ausbauHtml()}
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
