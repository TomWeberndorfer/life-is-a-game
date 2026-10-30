// Einblendungen nach Handlungen (aus app.js ausgelagert, 30.10.2026): Sieg, Weg zum nächsten Gegner (lauf), neuer Gegner,
// Stufe, Story-Teil und Bewertungsfrage. Welche in welcher Reihenfolge: daten/momente.js; Schlange: ui.schlange / ui.feier.
import { bewerte as bewertungSpeichern } from '../analytics.js';
import { BEWERTUNGEN, SKALA } from '../daten/forschung.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { blitzEbene, bwStil, esc, icon } from './helfer.js';
import { kx } from './kontext.js';

// Bild für das Story-Popup (Version 40): eigenes Story-Bild des Gegners → Bossbild (mit Platzhalter des Stils) → keins.
export function storyBildPlatz(gid) {
  const { bild } = kx;
  if (!gid) return null;
  return bild('story-' + gid, '', 'szene').quelle !== 'platzhalter' ? 'story-' + gid : 'boss-' + gid;
}
export function frageText(art) {
  const { aktuelleVorlage, nameVon } = kx;
  const v = aktuelleVorlage();
  return (BEWERTUNGEN[art] ? BEWERTUNGEN[art].frage : '').replace('{name}', nameVon(v.held));
}
export function frageBild(art) {
  const { T, aktuelleVorlage, img, nameVon } = kx;
  const v = aktuelleVorlage();
  const g = TABELLE.gegner[v.gegner];
  const b = BEWERTUNGEN[art] ? BEWERTUNGEN[art].bild : 'szene';
  if (b === 'gegner') return img('boss-' + v.gegner, g.name, 'boss', 'cover');
  if (b === 'verbuendeter') return img(v.held, nameVon(v.held), 'held', 'cover');
  if (b === 'banner') return img('banner-' + v.held, T('feier.bildHeld'), 'szene', 'cover');
  return img('szene', T('feier.bildStory'), 'szene', 'cover');
}
export function feierHtml() {
  const { T, aktuelleVorlage, img, nameVon, story, ui, wort } = kx;
  const f = ui.feier;
  if (!f) return '';
  const v = aktuelleVorlage();
  const g = TABELLE.gegner[v.gegner];
  if (f.art === 'frage') {
    const c = BEWERTUNGEN[f.bewertung];
    return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="frage-bild">${frageBild(f.bewertung)}</div>
      <div class="frage-blatt erscheint">
        <span class="griff" aria-hidden="true"></span>
        <span class="eyebrow">${esc(c.titel)}</span>
        <h2 id="feier-t">${esc(frageText(f.bewertung))}</h2>
        <div class="skala" role="group" aria-label="${esc(T('frage.skalaAria'))}">${[1, 2, 3, 4, 5].map(n => `<button class="sc" data-a="bewerte" data-id="${n}" aria-label="${esc(T('frage.punktAria', { n }))}">${n}</button>`).join('')}</div>
        <div class="skala-text"><span>${esc(SKALA.links)}</span><span>${esc(SKALA.rechts)}</span></div>
        <button class="link" data-a="bewerte" data-id="0">${esc(T('frage.ueberspringen'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'story') {
    // Version 40: Story-Popup als Kapitelmoment: Bild, „Teil n von 7“, offenes Ende, Knopf aus dem Stil-Vokabular.
    const st = story();
    const teil = st.teile.find(t => t.nr === f.nr && t.frei);
    if (!teil) { console.warn('Story-Popup: Teil nicht frei', f.nr); return ''; } // Rückfall: nichts zeigen statt leerer Karte
    const letzter = f.nr >= st.teile.length;
    const gid = TABELLE.gegner[v.gegner] ? v.gegner : null;
    const platz = storyBildPlatz(gid);
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte story-blatt story-moment erscheint">
        ${platz ? `<div class="story-bild" aria-hidden="true">${img(platz, gid ? TABELLE.gegner[gid].name : '', platz.startsWith('boss-') ? 'boss' : 'szene', 'cover')}<span class="story-bild-verlauf"></span></div>` : ''}
        <div class="story-text">
          <span class="eyebrow akzent">${esc(st.titel.toUpperCase())}</span>
          <span class="chip story-chip">${esc(T('story.teilVon', { nr: f.nr, gesamt: st.teile.length }))}</span>
          <h2 id="feier-t">${esc(teil.titel)}</h2>
          <p class="story-absatz">${esc(teil.text)}</p>
          ${letzter ? '' : `<p class="story-folgt">${esc(T('story.folgt'))}</p>`}
        </div>
        <button class="cta" data-a="feier-weiter">${esc(T(letzter ? 'story.knopfEnde' : 'story.knopf'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'sieg') {
    const gid = TABELLE.gegner[f.gegner] ? f.gegner : v.gegner;
    const gs = TABELLE.gegner[gid];
    const fw = I.gegnerFormen(gs);
    const weiter = f.neuerGegner ? T('sieg.weiterNeu') : T('sieg.weiterGleich', { er: fw.er });
    const bw = teil => bwStil('sieg', teil); // Version 68: Ablauf „sieg“ in daten/bewegung.js
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint sieg-karte">
        <div class="feier-bild erloschen"${bw('bild')}>${img('boss-' + gid, gs.name, 'boss', 'cover')}${blitzEbene('sieg', 'blitz')}</div>
        <span class="chip gut"${bw('chip')}>${esc(T('sieg.chip', { xp: K.XP.sieg }))}</span>
        <h2 id="feier-t"${bw('titel')}>${esc(T('sieg.titel', { gegner: gs.name, sieg: wort('sieg') }))}</h2>
        ${f.level ? `<p class="sieg-stufe"${bw('stufe')}><span class="sieg-stern"${bw('stern')}>${icon('stern')}</span><b>${esc(T('sieg.stufe', { held: nameVon(v.held), stufe: wort('stufe'), nr: f.level, titel: f.titel }))}</b></p>` : ''}
        ${(() => { const n = Number.isInteger(f.anzahl) ? f.anzahl : v.quest.anzahl; // Einstiegsrampe: Anzahl dieses Siegs
          return `<p${bw('text')}>${esc(T(n === 1 ? 'sieg.einmal' : 'sieg.mehrmals', { faehigkeit: TABELLE.faehigkeiten[v.faehigkeit].name, n }))} ${esc(weiter)}</p>`; })()}
        <button class="cta" data-a="feier-weiter"${bw('knopf')}>${esc(T('feier.weiter'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'lauf') {
    const alt = TABELLE.gegner[f.von] ? f.von : v.gegner;
    const neuId = TABELLE.gegner[f.nach] ? f.nach : v.gegner;
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <h2 id="feier-t">${esc(T('lauf.titel', { held: nameVon(v.held) }))}</h2>
        <div class="lauf-bahn" aria-hidden="true">
          <span class="lauf-station links">${img('boss-' + alt, '', 'boss', 'cover grau', '', 'rund')}<i class="station-haken">${icon('check')}</i></span>
          <span class="lauf-station rechts">${img('boss-' + neuId, '?', 'boss', 'cover schatten', '', 'rund')}</span>
          <span class="lauf-held">${img(v.held, nameVon(v.held), 'held', 'cover', '', 'rund')}</span>
        </div>
        <p>${esc(T('lauf.text', { gegner: I.gegnerFormen(TABELLE.gegner[alt]).nom }))}</p>
        <button class="cta" data-a="feier-weiter">${esc(T('feier.weiter'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'gegner') {
    const gid = TABELLE.gegner[f.gegner] ? f.gegner : v.gegner;
    const gn = TABELLE.gegner[gid];
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <div class="feier-bild">${img('boss-' + gid, gn.name, 'boss', 'cover')}</div>
        <span class="chip schlecht">${esc(T('neuerGegner.chip', { KAPITEL: wort('kapitel').toUpperCase(), nr: f.kapitel, GEGNER: wort('gegner').toUpperCase() }))}</span>
        <h2 id="feier-t">${esc(gn.name)}</h2>
        <p>${esc(gn.text)}</p>
        <div class="zwei"><div class="box schlecht"><b>${esc(T('gegner.wirdStaerker'))}</b>${esc(gn.staerker)}</div><div class="box gut"><b>${esc(T('gegner.verliertKraft'))}</b>${esc(gn.schwaecher)}</div></div>
        <p class="klein">${esc(T(f.staerker ? 'neuerGegner.zielStaerker' : 'neuerGegner.ziel', { faehigkeit: wort('faehigkeit'), name: TABELLE.faehigkeiten[v.faehigkeit].name, anzahl: Number.isInteger(f.anzahl) ? f.anzahl : v.quest.anzahl }))}</p>
        <button class="cta" data-a="feier-weiter">${esc(T('neuerGegner.knopf'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'levelup') {
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <span class="stern-gross" aria-hidden="true">${icon('stern', 'ic gross')}</span>
        <h2 id="feier-t">${esc(T('levelup.titel', { held: nameVon(f.held || v.held), stufe: wort('stufe'), nr: f.level }))}</h2>
        <p>${esc(T('levelup.neuerTitel', { titel: f.titel }))}</p>
        <button class="cta" data-a="feier-weiter">${esc(T('feier.weiter'))}</button>
      </div>
    </div>`;
  }
  return '';
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const FEIER_KLICKS = {
  'feier-weiter'() { const { zeigeNaechstes } = kx; zeigeNaechstes(); },
  bewerte({ id }) {
    const { ui, zeigeNaechstes } = kx;
    const n = Number(id);
    if (ui.feier && ui.feier.art === 'frage') bewertungSpeichern(ui.feier.bewertung, n >= 1 && n <= 5 ? n : null);
    zeigeNaechstes();
  }
};
