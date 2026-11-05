// Rahmen der App (aus app.js ausgelagert, 30.10.2026): untere Leiste, Platzhalter „kommt bald“, Testleiste, Hinweis,
// Einstellungen-Knopf. Zustand und Helfer kommen über den Ansichts-Kontext (ansicht/kontext.js).
import { BALD, MAX_TABS, TABS } from '../daten/freischaltung.js';
import { teileBald } from '../logik/freischaltung.js';
import * as K from '../logik/kern.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { schnellwegKnopf } from './notfall.js'; // Version 139: Schnellweg in der Kopfzeile

// Einstellungen-Knopf oben rechts (eine Stelle für alle Kopfzeilen).
// Rechte Seite der Kopfzeile auf Seiten mit Kulisse (Version 139): Schnellweg „Gerade schwer“, Zusatz, Einstellungen.
export const kopfRechts = (extra = '') => `<span class="kopf-rechts">${schnellwegKnopf()}${extra}${einstellungenKnopf()}</span>`;
export const einstellungenKnopf = () => { const { T } = kx; const t = esc(T('rahmen.einstellungen')); return `<button class="icbtn einst-btn" data-a="einstellungen" aria-label="${t}" title="${t}">${icon('zahnrad')}</button>`; };
export function hinweisBox() {
  const { T, hinweis } = kx;
  return hinweis ? `<div class="hinweis" role="status"><span>${esc(hinweis)}</span><button class="link" data-a="hinweis-weg">${esc(T('rahmen.hinweisOk'))}</button></div>` : '';
}
export function tabLeiste() {
  const { T, neuBereiche, neuPunkte, stand, symbol, tabAktiv, tabLabel, ui } = kx;
  if (!stand.onboarding.fertig || !TABS.some(t => t.screen === ui.screen)) return '';
  const { leiste, bald } = baldAufteilung();
  const sichtbar = leiste.slice(0, bald.length ? MAX_TABS - 1 : MAX_TABS);
  if (sichtbar.length + (bald.length ? 1 : 0) < 2) return '';
  const neu = [...neuBereiche(), ...neuPunkte()];
  const baldTab = bald.length ? `<button class="tab bald-tab${ui.blatt === 'bald' ? ' an' : ''}" data-a="blatt" data-id="bald" aria-haspopup="dialog" aria-label="${esc(T('bald.aria', { n: bald.length }))}"><span class="tab-ic">${icon(symbol('tab.bald', BALD.icon))}</span><span class="tab-nm">${esc(T(BALD.label))}</span></button>` : '';
  return `<nav class="tabs" aria-label="${esc(T('rahmen.leisteAria'))}">${sichtbar.map(t => {
    const an = ui.screen === t.screen, frei = tabAktiv(t), istNeu = neu.includes(t.screen);
    return `<button class="tab ${an ? 'an' : ''} ${frei ? '' : 'gesperrt'}${istNeu ? ' neu-tab' : ''}" data-a="tab" data-id="${t.screen}" ${an ? 'aria-current="page"' : ''} ${frei ? '' : 'aria-disabled="true"'} aria-label="${esc(tabLabel(t))}${istNeu ? esc(', ' + T('neu.tab')) : ''}"><span class="tab-ic">${icon(symbol('tab.' + t.screen, t.icon))}${frei ? '' : icon('schloss', 'ic tab-schloss')}${istNeu ? '<span class="tab-neu" aria-hidden="true"></span>' : ''}</span><span class="tab-nm">${esc(tabLabel(t))}</span></button>`;
  }).join('')}${baldTab}</nav>`;
}
// Etappe 3, Teil A (02.11.2026): sichtbare Tabs in Leiste und „Bald“ teilen (Regeln: daten/freischaltung.js BALD).
export function baldAufteilung() {
  const { tabSichtbar, tabStatus } = kx;
  return teileBald(TABS.filter(tabSichtbar), tabStatus, BALD);
}
// Blatt „Was noch kommt“: verdient zuerst (mit dem bekannten „Verdient …“-Satz), dann die Bedingung, dann „wird gebaut“.
// Reine Information, keine Knöpfe je Bereich: nichts läuft ab, nichts muss jetzt getan werden.
export function baldBlattInhalt() {
  const { T, sperrTextVon, symbol, tabLabel } = kx;
  const { bald } = baldAufteilung();
  const zeilen = bald.map(({ tab, status }) => {
    const text = status === 'gebaut' ? T('bald.gebaut') : sperrTextVon(tab);
    return `<li class="bald-zeile ${status}"><span class="bald-ic" aria-hidden="true">${icon(symbol('tab.' + tab.screen, tab.icon))}</span><span class="spalte"><b>${esc(tabLabel(tab))}</b><span class="klein">${esc(text)}</span></span></li>`;
  }).join('');
  return `<span class="medaille">${icon(BALD.icon, 'ic gross')}</span>
    <h2 id="blatt-t">${esc(T('bald.blattTitel'))}</h2>
    <p class="klein">${esc(T('bald.blattText'))}</p>
    <ul class="bald-liste">${zeilen}</ul>`;
}
// Platzhalter für freigeschaltete, aber noch nicht gebaute Bereiche (Version 27)
export function baldScreen(t) {
  const { T, jetzt, tabLabel } = kx;
  return `<section class="screen bald">
      <div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${einstellungenKnopf()}</div>
      <div class="inhalt mitte">
        <span class="medaille">${icon(t.icon, 'ic gross')}</span>
        <h1>${esc(T('bald.titel', { bereich: tabLabel(t) }))}</h1>
        <p class="lead">${esc(T('bald.text'))}</p>
      </div>
    </section>`;
}
export function testleiste() {
  const { T, istTest, jetzt } = kx;
  if (!istTest) return '';
  const j = jetzt();
  const zeit = `${String(j.getHours()).padStart(2, '0')}:${String(j.getMinutes()).padStart(2, '0')}`;
  return `<div class="testleiste"><span>${esc(T('test.profil', { tag: K.tagKey(j), zeit }))}</span><span class="tl-knoepfe"><button data-a="tag" data-id="-1">${esc(T('test.minus'))}</button><button data-a="tag" data-id="1">${esc(T('test.plus'))}</button><button data-a="stunde" data-id="-1">${esc(T('test.stundeMinus'))}</button><button data-a="stunde" data-id="1">${esc(T('test.stundePlus'))}</button><button data-a="tag" data-id="0">${esc(T('test.heute'))}</button></span></div>`;
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const RAHMEN_KLICKS = {
  start() { const { geheZu } = kx; geheZu('start'); },
  einstellungen() { const { geheZu } = kx; geheZu('einstellungen'); },
  'hinweis-weg'() { const { render, setzeHinweis } = kx; setzeHinweis(null); render(); },
  tab({ id }) {
    const { geheZu, render, setzeHinweis, sperrTextVon, tabAktiv, tabSichtbar, ui } = kx;
    const t = TABS.find(x => x.screen === id && tabSichtbar(x));
    if (!t) return;
    if (tabAktiv(t)) { geheZu(id); return; }
    setzeHinweis(sperrTextVon(t));
    if (ui.screen !== 'start') { geheZu('start'); return; }
    render();
  },
  // Testprofil: Zeitsprung um n Tage, 0 = zurück auf heute. Ungültige Zahl wird ignoriert (sonst wäre die Zeit NaN).
  tag({ id }) {
    const { zeitSprung } = kx;
    const n = Number(id);
    if (!Number.isFinite(n)) { console.warn('Zeitsprung: keine Zahl', id); return; }
    zeitSprung(n);
  },
  // Testprofil (Version 130): Uhrzeit um n Stunden verschieben (über Mitternacht wechselt auch der Tag); „Heute“ setzt zurück
  stunde({ id }) {
    const { zeitSprung } = kx;
    const n = Number(id);
    if (!Number.isInteger(n)) { console.warn('Zeitsprung: keine ganze Stundenzahl', id); return; }
    zeitSprung(n, 'stunde');
  }
};
