// Heldenstadt (aus app.js ausgelagert, 30.10.2026): ein Bezirk je Lebensbereich, Zustand aus logik/stadt.js.
// Bezirksbild: eigenes Bild → Datei des Stils → Rückfallkette → gezeichnete Silhouette (daten/stadt.js).
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import { AUSBAU, SILHOUETTEN } from '../daten/stadt.js';
import { gesamtSiege } from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { STATUS, ZIEL, ausbauKonfig, ausbauStufe, bezirkZiel, stadtAnsicht, stadtSichtbar } from '../logik/stadt.js';
import { heldFrei } from '../logik/helden.js';
import { trackEvent } from '../analytics.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { zeigeHeldenkarte } from './blatt.js';
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
        <div class="skyline">${bezirke.map(b => `<button class="sky ${b.status}" data-a="stadt-bezirk" data-id="${esc(b.domainId)}" tabindex="-1" aria-hidden="true">${bezirkBild(b.domainId, b.name)}</button>`).join('')}</div>
        <ul class="bezirke" aria-label="${esc(wort('bezirk'))}e">
          ${bezirke.map(b => `<li><button class="bezirk ${b.status}" data-a="stadt-bezirk" data-id="${esc(b.domainId)}" aria-label="${esc(T(b.status === STATUS.entsteht ? 'stadt.bezirkAria' : 'stadt.bezirkAriaLeer', { bezirk: bezirkName(b.domainId, b.name), helden: b.helden.map(nameVon).join(', ') }))}">
            <span class="bezirk-bild">${bezirkBild(b.domainId, b.name)}</span>
            <b>${esc(bezirkName(b.domainId, b.name))}</b>
            <span>${esc(b.status === STATUS.entsteht ? T('bezirk.entsteht', { helden: b.helden.map(nameVon).join(', ') }) : T('bezirk.unentdeckt'))}</span>
          </button></li>`).join('')}
        </ul>
        <p class="klein mitte-text">${entsteht.length ? esc(T('stadt.fuss', { bezirk: wort('bezirk') })) : ''}</p>
      </div>
    </section>`;
  }
};

// ---------- Stadt als Einstieg zur Heldenkarte (05.11.2026) ----------
// Tipp auf einen Bezirk (Raster oder Bildleiste): ein Held → seine Heldenkarte (gleiche Karte wie das „i“ auf der
// Startseite, Schließen führt zurück in die Stadt); mehrere Helden → kleine Auswahl; unentdeckt → Name und ein Satz,
// dazu leise „Neuen Helden dazuholen“ (kein Drängen, kein Zähler). Offenes Blatt: ui.stadtBlatt = domainId.
function bezirkeJetzt() {
  try { return stadtAnsicht(kx.spiel, LEBENSBEREICHE); }
  catch (e) { console.warn('Stadt:', e.message); return []; }
}
export function stadtBlattHtml() {
  const { T, bezirkName, img, nameVon, spiel, ui, wort } = kx;
  if (!ui.stadtBlatt) return '';
  if (ui.screen !== 'stadt') { ui.stadtBlatt = null; return ''; } // nach einem Seitenwechsel nicht wieder aufgehen
  const z = bezirkZiel(bezirkeJetzt(), ui.stadtBlatt);
  if (!z || z.art === ZIEL.held) { ui.stadtBlatt = null; return ''; }
  const name = bezirkName(z.bezirk.domainId, z.bezirk.name);
  let inhalt;
  if (z.art === ZIEL.auswahl) {
    inhalt = `<p class="klein">${esc(T('stadt.auswahlText', { bezirk: wort('bezirk') }))}</p>
      ${z.helden.map(id => `<div class="wahl-zeile"><button class="wahl-info" data-a="stadt-held" data-id="${esc(id)}">${img(id, nameVon(id), 'held', 'wahl-bild')}
        <span class="spalte"><span class="nm">${esc(nameVon(id))}</span></span>${icon('pfeilRechts')}</button></div>`).join('')}`;
  } else {
    let frei = false;
    try { frei = heldFrei(spiel); } catch (e) { console.warn('Stadt (neuer Held):', e.message); }
    inhalt = `<p class="klein">${esc(T('stadt.unentdecktText', { bezirk: wort('bezirk'), bereich: name }))}</p>
      ${frei ? `<button class="btn" data-a="neues-abenteuer">${icon('menschen')} ${esc(T('kopf.neuerHeld'))}</button>` : ''}`;
  }
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="stadt-blatt-t">
    <button class="hintergrund" data-a="stadt-blatt-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint"><div class="blatt-inhalt">
      <span class="eyebrow">${esc(wort('bezirk').toUpperCase())}</span><h2 id="stadt-blatt-t">${esc(name)}</h2>
      ${inhalt}<button class="cta" data-a="stadt-blatt-zu">${esc(T('nav.schliessen'))}</button></div></div>
  </div>`;
}
export const STADT_KLICKS = {
  'stadt-bezirk'({ id }) {
    const { render, ui } = kx;
    const z = bezirkZiel(bezirkeJetzt(), id);
    if (!z) { console.warn(`Stadt: unbekannter Bezirk „${id}“`); return; }
    trackEvent('city_district_opened', { art: z.art });
    if (z.art === ZIEL.held) { ui.stadtBlatt = null; zeigeHeldenkarte(z.heroId, 'stadt'); return; }
    ui.stadtBlatt = id;
    render();
  },
  'stadt-held'({ id }) { const { ui } = kx; ui.stadtBlatt = null; zeigeHeldenkarte(id, 'stadt'); },
  'stadt-blatt-zu'() { const { render, ui } = kx; ui.stadtBlatt = null; render(); }
};
