// Logbuch (aus app.js ausgelagert, 30.10.2026; gebaut in Version 41): reine Ansicht über den Spielstand
// (logik/logbuch.js), Arten und Filter als Daten (daten/logbuch-arten.js). Filterzustand: ui.lb (nur diese Sitzung).
import { trackEvent } from '../analytics.js';
import { TABS } from '../daten/freischaltung.js';
import { MIKRO } from '../daten/inhalte.js';
import { LOGBUCH_ARTEN, LOGBUCH_FILTER, LOGBUCH_TAGE_JE_SEITE } from '../daten/logbuch-arten.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { logbuchAnsicht, logbuchEintraege } from '../logik/logbuch.js';
import { esc, gross, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { einstellungenKnopf } from './rahmen.js';

export const MIKRO_TEXTE = Object.fromEntries(Object.values(MIKRO).flat().filter(x => Array.isArray(x)).map(([id, t]) => [id, t]));
export const lbWarn = m => console.warn(m);
export const vorlageVonHeld = hid => {
  const { spiel } = kx; const h = H.heldVon(spiel, hid); return h && TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId); };
export const gegnerName = id => { const { wort } = kx; return (TABELLE.gegner[id] && TABELLE.gegner[id].name) || wort('gegner'); };
export function lbTagTitel(tag) {
  const { T, jetzt } = kx;
  const heute = K.tagKey(jetzt());
  if (tag === heute) return T('lb.heute');
  const g = K.ausTagKey(heute); g.setDate(g.getDate() - 1);
  return tag === K.tagKey(g) ? T('lb.gestern') : kurzDatum(tag);
}
// Titel und optionale zweite Zeile eines Eintrags (Texte aus dem Register, Wörter aus dem Stil)
export function lbText(e) {
  const { T, wort } = kx;
  const d = e.daten || {};
  switch (e.art) {
    case 'anwendung': {
      const v = vorlageVonHeld(e.heroId); const f = v && TABELLE.faehigkeiten[v.faehigkeit];
      return { titel: T('lb.anwendung', { Verb: gross(f ? f.verb : wort('faehigkeit')) }), detail: f ? T('lb.anwendungDetail', { faehigkeit: f.name }) : '' };
    }
    case 'nicht': return { titel: T('lb.nicht'), detail: T('lb.nichtDetail') };
    case 'mikro': return { titel: d.text ? T('lb.mikro', { text: d.text }) : T('lb.mikroOhneText'), detail: '' };
    case 'sieg': return { titel: T('lb.sieg', { gegner: gegnerName(d.gegner), sieg: wort('sieg') }), detail: '' };
    case 'kapitel': return { titel: T('lb.kapitel', { kapitel: wort('kapitel'), nr: d.nr, gegner: gegnerName(d.gegner) }), detail: '' };
    case 'start': return { titel: T('lb.start', { ziel: d.ziel || '' }), detail: '' };
    default: return { titel: T(LOGBUCH_ARTEN[e.art].text, d), detail: '' };
  }
}
export function logbuchDaten() {
  const { jetzt, spiel, ui } = kx;
  try { return logbuchAnsicht(logbuchEintraege(spiel, jetzt(), { arten: LOGBUCH_ARTEN, mikroTexte: MIKRO_TEXTE, warn: lbWarn }), LOGBUCH_ARTEN, ui.lb, LOGBUCH_TAGE_JE_SEITE); }
  catch (e) { console.warn('Logbuch:', e.message); return null; }
}
export const lbChip = (aktion, id, label, an) => `<button class="lb-chip ${an ? 'an' : ''}" data-a="${aktion}" data-id="${esc(id)}" aria-pressed="${an}">${label}</button>`;
export function lbZeile(e, mehrereHelden) {
  const { T, img, nameVon } = kx;
  const art = LOGBUCH_ARTEN[e.art];
  const t = lbText(e);
  const bildTeil = mehrereHelden ? img(e.heroId, nameVon(e.heroId), 'held', 'rund-klein', '') : '';
  return `<li class="lb-eintrag lb-g-${esc(art.gruppe)} art-${esc(e.art)}">
      <span class="lb-ic" aria-hidden="true">${icon(art.icon)}</span>
      <span class="lb-text">${esc(t.titel)}${t.detail || mehrereHelden ? `<small>${bildTeil}${esc([mehrereHelden ? nameVon(e.heroId) : '', t.detail].filter(Boolean).join(' · '))}</small>` : ''}</span>
      ${e.xp ? `<span class="lb-xp">${esc(T('lb.xp', { xp: e.xp }))}</span>` : ''}
    </li>`;
}
// Filter eingeklappt (Version 56): Standard „Alles“, die Chips erst auf Tipp. Ein aktiver Filter steht im Knopf
// und bleibt sichtbar, auch eingeklappt (sonst wirkt das Logbuch leer, ohne dass man den Grund sieht).
export function lbFilterHtml(v, mehrere) {
  const { T, img, nameVon, spiel, ui } = kx;
  const gruppe = LOGBUCH_FILTER.find(f => f.id === v.filter.gruppe);
  const aktiv = [v.filter.gruppe !== 'alle' && gruppe ? T(gruppe.text) : '', mehrere && v.filter.held !== 'alle' ? nameVon(v.filter.held) : ''].filter(Boolean);
  const offen = !!ui.lb.offen;
  const knopf = `<div class="lb-filter-kopf">
      <button class="lb-chip lb-filter-knopf ${aktiv.length ? 'an' : ''}" data-a="lb-filter-klapp" aria-expanded="${offen}" aria-controls="lb-filter-feld">${icon('filter')}${esc(aktiv.length ? T('lb.filterAktiv', { filter: aktiv.join(' · ') }) : T('lb.filterKnopf'))}</button>
      ${aktiv.length ? `<button class="link lb-filter-weg" data-a="lb-filter-weg">${esc(T('lb.filterWeg'))}</button>` : ''}
    </div>`;
  if (!offen) return knopf;
  return `${knopf}<div id="lb-filter-feld" class="lb-filter-feld">
      <div class="lb-filter" role="group" aria-label="${esc(T('lb.filterArt'))}">
        ${LOGBUCH_FILTER.map(f => lbChip('lb-gruppe', f.id, esc(T(f.text)), v.filter.gruppe === f.id)).join('')}
      </div>
      ${mehrere ? `<div class="lb-filter" role="group" aria-label="${esc(T('lb.filterHeld'))}">
        ${lbChip('lb-held', 'alle', esc(T('lb.alleHelden')), v.filter.held === 'alle')}
        ${spiel.helden.map(h => lbChip('lb-held', h.heroId, `${img(h.heroId, nameVon(h.heroId), 'held', 'rund-klein', '')}${esc(nameVon(h.heroId))}`, v.filter.held === h.heroId)).join('')}
      </div>` : ''}
    </div>`;
}
export const LOGBUCH_SCREENS = {
  logbuch() {
    const { T, jetzt, spiel, tabLabel, ui } = kx;
    const tab = TABS.find(t => t.screen === 'logbuch');
    const v = logbuchDaten();
    if (v && v.korrigiert.length) ui.lb = { ...ui.lb, ...v.filter }; // unbekannter Filter → „Alles“
    const mehrere = spiel.helden.length > 1;
    const kopfHtml = `<div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${einstellungenKnopf()}</div>`;
    if (!v) return `<section class="screen logbuch">${kopfHtml}<div class="inhalt"><h1>${esc(tab ? tabLabel(tab) : T('tab.logbuch'))}</h1><p class="lead">${esc(T('lb.leer'))}</p></div></section>`;
    return `<section class="screen logbuch">
      ${kopfHtml}
      <div class="inhalt start-inhalt">
        <div><span class="eyebrow">${esc(T('lb.eyebrow'))}</span>
        <h1>${esc(tab ? tabLabel(tab) : T('tab.logbuch'))}</h1>
        <p class="klein">${esc(T('lb.intro'))}</p>
        ${v.seit ? `<p class="klein lb-seit">${esc(T('lb.seit', { datum: kurzDatum(v.seit), n: v.gesamt }))}</p>` : ''}</div>
        ${lbFilterHtml(v, mehrere)}
        ${v.tage.length ? v.tage.map(t => `<section class="lb-tag" aria-label="${esc(lbTagTitel(t.tag))}">
            <h2 class="lb-tag-kopf"><span>${esc(lbTagTitel(t.tag))}</span>${t.xp ? `<span class="lb-xp">${esc(T('lb.xp', { xp: t.xp }))}</span>` : ''}</h2>
            <ul class="lb-liste">${t.eintraege.map(e => lbZeile(e, mehrere && v.filter.held === 'alle')).join('')}</ul>
          </section>`).join('') : `<p class="klein mitte-text">${esc(T('lb.leer'))}</p>`}
        ${v.mehr ? `<button class="btn lb-mehr" data-a="lb-mehr">${esc(T('lb.mehr'))}</button>` : ''}
      </div>
    </section>`;
  }
};

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const LOGBUCH_KLICKS = {
  'lb-gruppe'({ id }) {
    const { render, ui } = kx;
    if (id === 'alle' || LOGBUCH_FILTER.some(f => f.id === id)) { ui.lb = { ...ui.lb, gruppe: id, tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_filter', {}); }
    render();
  },
  'lb-held'({ id }) {
    const { render, spiel, ui } = kx;
    if (id === 'alle' || H.heldVon(spiel, id)) { ui.lb = { ...ui.lb, held: id, tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_filter', {}); }
    render();
  },
  'lb-filter-klapp'() { const { render, ui } = kx; ui.lb = { ...ui.lb, offen: !ui.lb.offen }; render(); },
  'lb-filter-weg'() { const { render, ui } = kx; ui.lb = { ...ui.lb, held: 'alle', gruppe: 'alle', tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_filter', {}); render(); },
  'lb-mehr'() { const { render, ui } = kx; ui.lb = { ...ui.lb, tage: ui.lb.tage + LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_more', {}); render(); }
};
