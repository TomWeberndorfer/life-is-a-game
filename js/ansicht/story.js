// Story-Seite (aus app.js ausgelagert, 30.10.2026; Version 48): gelesene Teile eingeklappt, erster ungelesener
// versiegelt mit Andeutung, alles Weitere als Nebel. Zustände: logik/inhalte.js storyZustaende().
import { trackEvent } from '../analytics.js';
import * as I from '../logik/inhalte.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

export const STORY_SCREENS = {
  story() {
    const { T, story } = kx;
    const st = story();
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} ${esc(T('nav.zurueck'))}</button></div>
      <div class="inhalt">
        <span class="eyebrow akzent">${esc(T('story.eyebrow', { nr: st.wocheNr }))}</span>
        <h1>${esc(st.titel)}</h1>
        <p class="klein">${esc(T('story.seite'))} ${esc(T('story.frei', { frei: st.frei, gesamt: st.teile.length }))}.</p>
        <div class="teile">${storyAnsicht()}</div>
      </div>
      <div class="fuss story-fuss"><button class="cta" data-a="start">${esc(T('story.knopf'))}</button></div>
    </section>`; // Version 60: Schließen-Knopf unten (nach dem Lesen ist „Zurück“ oben weit weg); Text je Stil (story.knopf)
  }
};
// Story-Seite (Version 48): gelesen eingeklappt, erster ungelesener Teil versiegelt mit Andeutung,
// nächster noch nicht freier Teil versiegelt, alles Weitere als ein Nebelblock. Zustände: logik/inhalte.js storyZustaende().
export function storyAnsicht() {
  const { T, bewegungAus, story, ui } = kx;
  const st = story();
  const satzweise = ui.einmal.has('siegel') && !bewegungAus;
  let nebel = false;
  return I.storyZustaende(st).map(({ nr, zustand }) => {
    const t = st.teile[nr - 1] || {};
    const andeutung = `<p class="andeutung">${esc(t.vorschau || T('story.siegelOhne'))}</p>`;
    if (zustand === 'gelesen') {
      const frisch = ui.storyOffen === nr;
      const text = frisch && satzweise ? I.saetze(t.text).map((x, i) => `<span class="satz" style="--i:${i}">${esc(x)} </span>`).join('') : esc(t.text);
      return `<details class="teil gelesen${frisch && ui.einmal.has('siegel') ? ' gebrochen' : ''}"${frisch ? ' open' : ''}><summary><span class="eyebrow">${esc(T('story.teilNr', { nr }))}</span><h3>${esc(t.titel)}</h3></summary><p>${text}</p></details>`;
    }
    if (zustand === 'siegel') return `<article class="teil versiegelt frei-siegel"><span class="eyebrow akzent">${esc(T('story.teilNeu', { nr }))}</span>${andeutung}<button class="btn voll siegel-knopf" data-a="story-siegel" data-id="${nr}">${icon('siegel')} ${esc(T('story.siegelBrechen'))}</button></article>`;
    if (zustand === 'bereit' || zustand === 'wartet') return `<article class="teil versiegelt"><span class="eyebrow">${esc(T('story.teilNr', { nr }))}</span>${andeutung}<p class="klein">${esc(T(zustand === 'bereit' ? 'story.bereit' : 'story.wartet'))}</p></article>`;
    if (nebel) return '';
    nebel = true;
    return `<div class="teil nebel" role="note"><span class="nebel-schleier" aria-hidden="true"></span><span class="klein">${esc(T('story.nebel'))}</span></div>`;
  }).join('');
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const STORY_KLICKS = {
  // Version 48: erst „Siegel brechen“ zählt den Teil als gelesen.
  'story-siegel'({ id }) {
    const { render, story, storyGelesenBis, ui } = kx;
    const nr = parseInt(id, 10);
    const z = I.storyZustaende(story()).find(x => x.nr === nr);
    if (!z || z.zustand !== 'siegel') { console.warn('Siegel: Teil nicht versiegelt', id); render(); return; } // z. B. doppelt getippt oder anderes Gerät war schneller
    trackEvent('story_opened', { quelle: 'siegel', teil: nr });
    storyGelesenBis(nr);
    ui.storyOffen = nr;
    ui.einmal.add('siegel');
    render();
  }
};
