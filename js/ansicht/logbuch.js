// Logbuch (aus app.js ausgelagert, 30.10.2026; gebaut in Version 41): reine Ansicht über den Spielstand
// (logik/logbuch.js), Arten und Filter als Daten (daten/logbuch-arten.js). Filterzustand: ui.lb (nur diese Sitzung).
import { trackEvent } from '../analytics.js';
import { TABS } from '../daten/freischaltung.js';
import { MIKRO } from '../daten/inhalte.js';
import { LOGBUCH_ARTEN, LOGBUCH_FILTER, LOGBUCH_TAGE_JE_SEITE } from '../daten/logbuch-arten.js';
import { EINTRAG_ARTEN } from '../daten/eintrag-arten.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { LB_GANZER_TAG, logbuchAnsicht, logbuchEintraege } from '../logik/logbuch.js';
import { DOMAIN_IDS, LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import * as TN from '../logik/tagesnotiz.js';
import { bereichLabel, bereichName, bereicheText } from './notiz.js'; // Tagesnotiz (04.11.2026)
import { CHRONIK, CHRONIK_SIEGEL } from '../daten/chronik.js';
import { chronikAnsicht, chronikAnsichtWahl } from '../logik/chronik.js';
import { akkusativ, esc, gross, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { kopfRechts } from './rahmen.js';

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
    // Version 75: eigene Einträge; Situation und Stimmung als zweite Zeile, der eigene Text darunter
    case 'geschafft':
    case 'schwer': return {
      titel: T(LOGBUCH_ARTEN[e.art].text),
      detail: [d.situation ? T('eintrag.sit.' + d.situation) : '', d.stimmung ? T('eintrag.stimmung.' + d.stimmung) : ''].filter(Boolean).join(' · '),
      notiz: d.text || '',
      plan: d.naechstesMal ? T('lb.naechstesMal', { text: d.naechstesMal }) : '' // Version 81
    };
    case 'probe': return { titel: T('lb.probe'), detail: T('lb.probeDetail') }; // Version 81
    // Tagesnotiz (04.11.2026): Bereiche und Stimmung als zweite Zeile, „gut“ und „schwer“ darunter
    case 'notiz': return {
      titel: T('lb.notiz'),
      detail: [bereicheText(e.bereiche), d.stimmung ? T('eintrag.stimmung.' + d.stimmung) : '', d.geaendert ? T('lb.geaendert') : ''].filter(Boolean).join(' · '),
      notiz: d.felder && d.felder.gut ? T('lb.notizGut', { text: d.felder.gut }) : '',
      plan: d.felder && d.felder.schwer ? T('lb.notizSchwer', { text: d.felder.schwer }) : ''
    };
    // Rundenrückblick (02.11.2026): Einschätzung als zweite Zeile, „Was hat geholfen?“ als Notiz
    case 'rueckblick': return { titel: T('lb.rueckblick'), detail: d.wahl ? T(`rb.wahl.lb.${d.wahl}`) : '', notiz: d.text || '' };
    case 'ruhetag': return { titel: T('lb.ruhetag'), detail: T('lb.ruhetagDetail') }; // Version 90
    case 'stuetze': return { titel: d.text ? T('lb.stuetze', { text: d.text }) : T('lb.stuetzeOhneText'), detail: T('lb.stuetzeDetail') }; // Schritt „Zähler“
    default: return { titel: T(LOGBUCH_ARTEN[e.art].text, d), detail: '' };
  }
}
const lbEintraege = () => { const { jetzt, spiel } = kx; return logbuchEintraege(spiel, jetzt(), { arten: LOGBUCH_ARTEN, mikroTexte: MIKRO_TEXTE, warn: lbWarn, eintragArten: EINTRAG_ARTEN }); };
export function logbuchDaten() {
  const { ui } = kx;
  try { return logbuchAnsicht(lbEintraege(), LOGBUCH_ARTEN, ui.lb, LOGBUCH_TAGE_JE_SEITE, { bereichIds: DOMAIN_IDS }); }
  catch (e) { console.warn('Logbuch:', e.message); return null; }
}

// ---------- Chronik als Buch (Etappe 2, Schritt C, 02.11.2026) ----------
// Zweite Ansicht des Logbuchs: Tage als Karten, je Held ein Siegel mit Notiz, Kapitel als Zierseite (logik/chronik.js).
// Gewählte Ansicht merkt sich der Browser (nicht der Spielstand), Held-Filter teilen sich Buch und Liste.
export function lbAnsicht() {
  const { speicher, ui } = kx;
  if (!ui.lb.ansicht) {
    let roh = null;
    try { roh = speicher.einstellung('chronikAnsicht'); } catch (e) { roh = null; }
    ui.lb = { ...ui.lb, ansicht: chronikAnsichtWahl(roh, CHRONIK) };
  }
  return ui.lb.ansicht;
}
export function chronikDaten() {
  const { jetzt, spiel, ui } = kx;
  try {
    const v = chronikAnsicht(lbEintraege(), CHRONIK, { held: ui.lb.held, tage: ui.lb.buchTage, bereiche: ui.lb.bereiche },
      { heute: K.tagKey(jetzt()), reihenfolge: spiel.helden.map(h => h.heroId) });
    if (v.unbekannt.length) console.warn('Chronik: Arten ohne Platz', v.unbekannt.join(', '));
    return v;
  } catch (e) { console.warn('Chronik:', e.message); return null; }
}
function chSiegel(id, heroId, mitHeld) {
  const { T, img, nameVon, symbol } = kx;
  const a = CHRONIK_SIEGEL[id] || CHRONIK_SIEGEL[CHRONIK.ohneSiegel];
  const sym = a.symbol ? symbol(a.symbol, a.icon) : a.icon;
  return `<span class="ch-siegel ${esc(a.klasse || '')}" role="img" aria-label="${esc(T(a.text))}">${icon(sym)}${mitHeld ? img(heroId, nameVon(heroId), 'held', 'ch-siegel-held', '') : ''}</span>`;
}
function chNotiz(e) {
  const t = lbText(e);
  const teile = [t.detail ? `<small>${esc(t.detail)}</small>` : '', t.notiz ? `<span class="ch-notiz">„${esc(t.notiz)}“</span>` : '', t.plan ? `<span class="ch-plan">${esc(t.plan)}</span>` : ''].join('');
  return teile ? `<span class="ch-notiz-block">${teile}</span>` : '';
}
function chZeile(z, mehrere) {
  const { T, nameVon } = kx;
  const a = CHRONIK_SIEGEL[z.siegel] || CHRONIK_SIEGEL[CHRONIK.ohneSiegel];
  // Nur Zusätze (z. B. Mikroquest ohne Antwort): Name statt eines leeren Siegelworts
  const titel = z.siegel === CHRONIK.ohneSiegel ? nameVon(z.heroId) : T(a.text);
  return `<li class="ch-zeile s-${esc(z.siegel)}">
      ${chSiegel(z.siegel, z.heroId, mehrere)}
      <span class="ch-text"><b>${esc(titel)}</b>${mehrere && z.siegel !== CHRONIK.ohneSiegel ? `<small>${esc(nameVon(z.heroId))}</small>` : ''}
        ${z.notizen.map(chNotiz).join('')}
        ${z.zusatz.map(e => `<span class="ch-zusatz art-${esc(e.art)}">${icon(LOGBUCH_ARTEN[e.art].icon)}${esc(lbText(e).titel)}</span>`).join('')}
      </span>
    </li>`;
}
// Tagesnotiz (04.11.2026) oben in der Tageskarte; Tipp öffnet sie zum Bearbeiten
function chTagesnotiz(e) {
  const { T } = kx;
  const t = lbText(e);
  return `<button class="ch-tagesnotiz tippbar" data-a="notiz-oeffnen" data-id="${esc(e.daten.eintragId)}" aria-label="${esc(T('lb.notizBearbeiten'))}">
      <span class="eyebrow">${icon('stift')} ${esc(t.titel)}</span>${t.detail ? `<small>${esc(t.detail)}</small>` : ''}
      ${t.notiz ? `<span class="ch-notiz">${esc(t.notiz)}</span>` : ''}${t.plan ? `<span class="ch-notiz">${esc(t.plan)}</span>` : ''}
    </button>`;
}
function chZier(e, mehrere) {
  const { T, img, nameVon, wort } = kx;
  const d = e.daten || {};
  const kopf = mehrere ? `<span class="eyebrow">${esc(nameVon(e.heroId))}</span>` : '';
  if (e.art === 'kapitel') {
    const g = gegnerName(d.gegner);
    return `<div class="ch-zier" role="note">${d.gegner ? img('boss-' + d.gegner, g, 'boss', 'ch-zier-bild', '') : ''}${kopf}
      <b>${esc(T('ch.kapitel', { kapitel: wort('kapitel'), nr: d.nr }))}</b><p>${esc(g)}</p>
      ${d.vorher ? `<small>${esc(T('ch.nachSieg', { gegner: akkusativ(gegnerName(d.vorher)) }))}</small>` : ''}</div>`;
  }
  return `<div class="ch-zier" role="note">${img(e.heroId, nameVon(e.heroId), 'held', 'ch-zier-bild', '')}${kopf}
    <b>${esc(T('ch.anfang'))}</b>${d.ziel ? `<p>${esc(d.ziel)}</p>` : ''}</div>`;
}
function chMarke(e, mehrere) {
  const { nameVon } = kx;
  const t = lbText(e);
  return `<p class="ch-marke">${icon(LOGBUCH_ARTEN[e.art].icon)}<span>${esc([t.titel, mehrere ? nameVon(e.heroId) : ''].filter(Boolean).join(' · '))}</span></p>`;
}
export function chronikHtml(v, mehrere) {
  const { T } = kx;
  const mitHeld = mehrere && v.filter.held === 'alle';
  const teile = v.teile.map(t => {
    if (t.art === 'heute') return `<section class="karte ch-tag" aria-label="${esc(lbTagTitel(t.tag))}"><h2 class="ch-tag-kopf">${esc(lbTagTitel(t.tag))}</h2><p class="klein">${esc(T('ch.heuteLeer'))}</p></section>`;
    if (t.art === 'tag') return `<section class="karte ch-tag" aria-label="${esc(lbTagTitel(t.tag))}"><h2 class="ch-tag-kopf">${esc(lbTagTitel(t.tag))}</h2>
        ${(t.tagesnotizen || []).map(chTagesnotiz).join('')}
        ${t.zeilen.length ? `<ul class="ch-liste">${t.zeilen.map(z => chZeile(z, mitHeld)).join('')}</ul>` : ''}</section>`;
    if (t.art === 'marke') return chMarke(t.eintrag, mitHeld);
    if (t.art === 'zier') return chZier(t.eintrag, mitHeld);
    return '';
  }).join('');
  return `<div class="ch-buch">${teile || `<p class="klein mitte-text">${esc(T('lb.leer'))}</p>`}</div>
    ${v.mehr ? `<button class="btn lb-mehr" data-a="ch-mehr">${esc(T('ch.mehr'))}</button>` : ''}`;
}
function chUmschalter(ansicht) {
  const { T } = kx;
  return `<div class="ch-umschalter" role="group" aria-label="${esc(T('ch.ansicht'))}">${CHRONIK.ansichten.map(a =>
    `<button class="ch-um ${a === ansicht ? 'an' : ''}" data-a="lb-ansicht" data-id="${esc(a)}" aria-pressed="${a === ansicht}">${icon(a === 'buch' ? 'buch' : 'liste')}${esc(T('ch.ansicht.' + a))}</button>`).join('')}</div>`;
}
// Lebensbereich-Filter (Tagesnotiz, 04.11.2026): Mehrfachauswahl über alle Einträge, „Ganzer Tag“ für Notizen ohne
// Bereich. Nur Bereiche, die im Logbuch vorkommen; ein einzelner Bereich ohne Notizen ohne Bereich braucht keinen Filter.
function bereichChips(eintraege, auswahl) {
  const { T, spiel } = kx;
  const da = new Set();
  let ohne = false;
  for (const e of eintraege || []) { const b = Array.isArray(e.bereiche) ? e.bereiche : []; if (!b.length) ohne = true; b.forEach(x => da.add(x)); }
  const liste = TN.bereichAuswahl(spiel, LEBENSBEREICHE, { nur: [...da] });
  if (liste.length + (ohne ? 1 : 0) < 2) return '';
  const gew = Array.isArray(auswahl) ? auswahl : [];
  return `<div class="lb-filter lb-bereiche" role="group" aria-label="${esc(T('lb.filterBereich'))}">
      ${lbChip('lb-bereich', 'alle', esc(T('lb.alleBereiche')), !gew.length)}
      ${liste.map(b => lbChip('lb-bereich', b.id, bereichLabel(b.id), gew.includes(b.id))).join('')}
      ${ohne ? lbChip('lb-bereich', LB_GANZER_TAG, `${icon('sonne')}${esc(T('lb.ganzerTag'))}`, gew.includes(LB_GANZER_TAG)) : ''}
    </div>`;
}
// Suche in eigenen Texten (Tagesnotiz, 04.11.2026): Enter oder Lupe sucht, „×“ leert.
function sucheHtml(v) {
  const { T, ui } = kx;
  const s = ui.lb.suche || '';
  return `<div class="lb-suche" role="search">
      <input id="lb-suche" class="lb-suche-feld" type="search" maxlength="100" value="${esc(s)}" placeholder="${esc(T('lb.suche'))}" aria-label="${esc(T('lb.suche'))}" enterkeyhint="search">
      <button class="lb-chip" data-a="lb-suchen" aria-label="${esc(T('lb.suche'))}">${icon('lupe')}</button>
      ${v.filter.suche ? `<button class="link" data-a="lb-suche-weg">${esc(T('lb.filterWeg'))}</button>` : ''}
    </div>${v.filter.suche ? `<p class="klein" role="status">${esc(v.anzahl ? T('lb.sucheTreffer', { n: v.anzahl }) : T('lb.sucheLeer'))}</p>` : ''}`;
}
const notizKnopf = () => { const { T } = kx; return `<button class="lb-chip lb-notiz-knopf" data-a="notiz-oeffnen" data-id="">${icon('stift')} ${esc(T('lb.notizSchreiben'))}</button>`; };
export const lbChip = (aktion, id, label, an) => `<button class="lb-chip ${an ? 'an' : ''}" data-a="${aktion}" data-id="${esc(id)}" aria-pressed="${an}">${label}</button>`;
export function lbZeile(e, mehrereHelden) {
  const { T, img, nameVon } = kx;
  const art = LOGBUCH_ARTEN[e.art];
  const t = lbText(e);
  const mitHeld = mehrereHelden && !!e.heroId; // Tagesnotiz (04.11.2026): ohne Held, Bereiche stehen im Detail
  const bildTeil = mitHeld ? img(e.heroId, nameVon(e.heroId), 'held', 'rund-klein', '') : '';
  const bearbeiten = e.art === 'notiz' && e.daten && e.daten.eintragId ? `<button class="link lb-bearbeiten" data-a="notiz-oeffnen" data-id="${esc(e.daten.eintragId)}" aria-label="${esc(T('lb.notizBearbeiten'))}">${icon('stift')}</button>` : '';
  return `<li class="lb-eintrag lb-g-${esc(art.gruppe)} art-${esc(e.art)}">
      <span class="lb-ic" aria-hidden="true">${icon(art.icon)}</span>
      <span class="lb-text">${esc(t.titel)}${t.detail || mitHeld ? `<small>${bildTeil}${esc([mitHeld ? nameVon(e.heroId) : '', t.detail].filter(Boolean).join(' · '))}</small>` : ''}${t.notiz ? `<span class="lb-notiz">${esc(t.notiz)}</span>` : ''}${t.plan ? `<span class="lb-notiz lb-plan">${esc(t.plan)}</span>` : ''}</span>
      ${e.xp ? `<span class="lb-xp">${esc(T('lb.xp', { xp: e.xp }))}</span>` : ''}${bearbeiten}
    </li>`;
}
// Filter eingeklappt (Version 56): Standard „Alles“, die Chips erst auf Tipp. Ein aktiver Filter steht im Knopf
// und bleibt sichtbar, auch eingeklappt (sonst wirkt das Logbuch leer, ohne dass man den Grund sieht).
export function lbFilterHtml(v, mehrere) {
  const { T, img, nameVon, spiel, ui } = kx;
  const gruppe = LOGBUCH_FILTER.find(f => f.id === v.filter.gruppe);
  const aktiv = [v.filter.gruppe !== 'alle' && gruppe ? T(gruppe.text) : '', mehrere && v.filter.held !== 'alle' ? nameVon(v.filter.held) : '',
    ...(v.filter.bereiche || []).map(b => (b === LB_GANZER_TAG ? T('lb.ganzerTag') : bereichName(b)))].filter(Boolean);
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
      ${bereichChips(lbEintraege(), v.filter.bereiche)}
    </div>`;
}
export const LOGBUCH_SCREENS = {
  logbuch() {
    const { T, jetzt, spiel, tabLabel, ui } = kx;
    const tab = TABS.find(t => t.screen === 'logbuch');
    const ansicht = lbAnsicht();
    const mehrere = spiel.helden.length > 1;
    const kopfHtml = `<div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${kopfRechts()}</div>`;
    if (ansicht === 'buch') {
      const b = chronikDaten();
      if (b && b.korrigiert.length) ui.lb = { ...ui.lb, held: b.filter.held };
      if (b) return `<section class="screen logbuch">
      ${kopfHtml}
      <div class="inhalt start-inhalt">
        <div><span class="eyebrow">${esc(T('lb.eyebrow'))}</span>
        <h1>${esc(tab ? tabLabel(tab) : T('tab.logbuch'))}</h1>
        <p class="klein">${esc(T('ch.intro'))}</p></div>
        ${chUmschalter(ansicht)}
        ${notizKnopf()}
        ${bereichChips(lbEintraege(), ui.lb.bereiche)}
        ${chronikHtml(b, mehrere)}
      </div>
    </section>`;
      // Fehler im Buch: Liste als Rückfall, damit das Logbuch nie leer bleibt
    }
    const v = logbuchDaten();
    if (v && v.korrigiert.length) ui.lb = { ...ui.lb, ...v.filter }; // unbekannter Filter → „Alles“
    if (!v) return `<section class="screen logbuch">${kopfHtml}<div class="inhalt"><h1>${esc(tab ? tabLabel(tab) : T('tab.logbuch'))}</h1><p class="lead">${esc(T('lb.leer'))}</p></div></section>`;
    return `<section class="screen logbuch">
      ${kopfHtml}
      <div class="inhalt start-inhalt">
        <div><span class="eyebrow">${esc(T('lb.eyebrow'))}</span>
        <h1>${esc(tab ? tabLabel(tab) : T('tab.logbuch'))}</h1>
        <p class="klein">${esc(T('lb.intro'))}</p>
        ${v.seit ? `<p class="klein lb-seit">${esc(T('lb.seit', { datum: kurzDatum(v.seit), n: v.gesamt }))}</p>` : ''}</div>
        ${chUmschalter('liste')}
        ${notizKnopf()}
        ${sucheHtml(v)}
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
  'lb-filter-klapp'() { const { render, ui } = kx; ui.lb = { ...ui.lb, offen: !ui.lb.offen }; render(); },
  'lb-filter-weg'() { const { render, ui } = kx; ui.lb = { ...ui.lb, held: 'alle', gruppe: 'alle', bereiche: [], tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_filter', {}); render(); },
  // Tagesnotiz (04.11.2026): Lebensbereich-Filter (Mehrfachauswahl), gilt für Buch und Liste
  'lb-bereich'({ id }) {
    const { render, ui } = kx;
    if (id === 'alle') ui.lb = { ...ui.lb, bereiche: [] };
    else if (id === LB_GANZER_TAG || DOMAIN_IDS.includes(id)) ui.lb = { ...ui.lb, bereiche: TN.umschalten(ui.lb.bereiche, id), held: 'alle' };
    else { console.warn('Logbuch: unbekannter Lebensbereich', id); return; }
    ui.lb = { ...ui.lb, tage: LOGBUCH_TAGE_JE_SEITE, buchTage: CHRONIK.tageJeSeite };
    trackEvent('logbook_filter', {});
    render();
  },
  // Suche: Text kommt aus dem Feld (lb-suche, input), hier nur neu zeichnen; nie in Analytics
  'lb-suchen'() { const { render, ui } = kx; ui.lb = { ...ui.lb, suche: ui.lb.sucheEingabe ?? ui.lb.suche ?? '', tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_search', {}); render(); },
  'lb-suche-weg'() { const { render, ui } = kx; ui.lb = { ...ui.lb, suche: '', sucheEingabe: '' }; render(); },
  'lb-ansicht'({ id }) {
    const { render, speicher, ui } = kx;
    if (!CHRONIK.ansichten.includes(id)) return;
    ui.lb = { ...ui.lb, ansicht: id };
    try { speicher.setzeEinstellung('chronikAnsicht', id); } catch (e) { console.warn('Chronik: Ansicht nicht gemerkt', e.message); }
    trackEvent('logbook_view', {});
    render();
  },
  'ch-mehr'() { const { render, ui } = kx; ui.lb = { ...ui.lb, buchTage: (ui.lb.buchTage || CHRONIK.tageJeSeite) + CHRONIK.tageJeSeite }; trackEvent('logbook_more', {}); render(); },
  'lb-mehr'() { const { render, ui } = kx; ui.lb = { ...ui.lb, tage: ui.lb.tage + LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_more', {}); render(); }
};
// Felder (Tagesnotiz, 04.11.2026): Suchfeld. Tippen merkt nur (Fokus bleibt), Enter und Verlassen des Felds suchen.
export const LOGBUCH_FELDER = {
  'lb-suche': {
    input({ wert }) { const { ui } = kx; ui.lb = { ...ui.lb, sucheEingabe: String(wert ?? '').slice(0, 100) }; },
    enter({ wert }) { const { render, ui } = kx; ui.lb = { ...ui.lb, suche: String(wert ?? '').slice(0, 100), sucheEingabe: String(wert ?? '').slice(0, 100), tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_search', {}); render(); },
    change({ wert }) { const { render, ui } = kx; const w = String(wert ?? '').slice(0, 100); if (w === (ui.lb.suche || '')) return; ui.lb = { ...ui.lb, suche: w, sucheEingabe: w, tage: LOGBUCH_TAGE_JE_SEITE }; render(); }
  }
};
