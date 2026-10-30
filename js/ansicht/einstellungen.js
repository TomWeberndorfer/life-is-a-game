// Einstellungen (aus app.js ausgelagert, 30.10.2026): Stil, Speichern, Testphase mit Einwilligung und Daten-Code, Neu beginnen.
// Einwilligungs-Karte und Status nutzen auch Onboarding und Startseite.
import { analyticsStatus, hatFeedback, trackEvent } from '../analytics.js';
import { EINWILLIGUNG } from '../daten/forschung.js';
import * as EW from '../logik/einwilligung.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

export const EINSTELLUNGEN_SCREENS = {
  einstellungen() {
    const { T, VERSION, einw, istTest, speicher, stil, testerId, ui, weltenFrei } = kx;
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} ${esc(T('nav.zurueck'))}</button></div>
      <div class="inhalt">
        <h1>${esc(T('einst.titel'))}</h1>
        <p class="klein">${esc(T('einst.version', { nr: VERSION.nr, datum: VERSION.datum }))}</p>
        <div class="karte spalte">
          <span class="eyebrow">${esc(T('einst.stil'))}</span>
          ${weltenFrei() ? `<button class="btn" data-a="stilwahl">${esc(T('einst.weltWaehlen', { stil: stil().name }))}</button>` : `<p class="klein">${esc(T('einst.weltGesperrt'))}</p>`}
        </div>
        <div class="karte spalte">
          <span class="eyebrow">${esc(T('einst.speichern'))}</span>
          <p class="klein">${esc(T(speicher.verfuegbar ? 'einst.speicherOk' : 'einst.speicherAus'))}</p>
          ${istTest ? `<p class="klein">${esc(T('einst.testprofil'))}</p>` : ''}
        </div>
        <div class="karte spalte">
          <span class="eyebrow">${esc(T('einst.testphase'))}</span>
          <p class="klein">${esc(einwStatus())}</p>
          ${EW.istOffen(einw) ? einwKarte(false, true) : `<button class="btn voll" data-a="daten" data-id="${einw.stand === 'ja' ? 'nein' : 'ja'}">${esc(T(einw.stand === 'ja' ? 'daten.zuruecknehmen' : 'daten.erlauben'))}</button>`}
          ${EW.istOffen(einw) ? '' : einwDetails()}
          <div class="zwei"><button class="btn" data-a="feedback-oeffnen">${esc(T(hatFeedback() ? 'einst.feedbackAendern' : 'einst.feedbackGeben'))}</button><button class="btn" data-a="premium">${esc(T('einst.premium'))}</button></div>
          ${EW.darfSenden(einw) && analyticsStatus() !== 'zentral' ? exportHtml() : ''}
          ${ui.istBesitzer ? `<button class="btn voll" data-a="admin">${esc(T('einst.auswertung'))}</button>` : ''}
          ${ui.istBesitzer && ui.db ? `<button class="btn" data-a="pflege">${esc(T('einst.pflege'))}</button>` : ''}
        </div>
        <div class="karte spalte">
          <span class="eyebrow">${esc(T('einst.neu'))}</span>
          <p class="klein">${esc(T('einst.neuText'))}</p>
          <button class="btn ${ui.resetFrage ? 'warn' : ''}" data-a="reset">${esc(T(ui.resetFrage ? 'einst.resetFrage' : 'einst.reset'))}</button>
        </div>
        <p class="klein">${esc(T('einst.versionTester', { nr: VERSION.nr, datum: VERSION.datum, id: testerId.slice(0, 8) }))}</p>
      </div>
    </section>`;
  }
};
// ---------- Daten senden / importieren (Version 24) ----------
// Einwilligungs-Karte (Version 28). imOnboarding: zeigt nach der Wahl eine Bestätigungszeile statt zu verschwinden.
// eingebettet: ohne eigene Karte/Überschrift (z. B. in den Einstellungen).
export function einwDetails() {
  const { T, testerId } = kx;
  const kontakt = EINWILLIGUNG.kontakt || T('daten.kontaktStandard');
  return `<details class="einw-mehr"><summary>${esc(T('daten.mehr'))}</summary><p class="klein">${esc(T('daten.lang', { monate: EINWILLIGUNG.loeschenNachMonaten, id: testerId.slice(0, 8), kontakt }))}</p></details>`;
}
export function einwKarte(imOnboarding, eingebettet = false) {
  const { T, einw } = kx;
  if (!EW.istOffen(einw)) {
    return imOnboarding ? `<p class="klein einw-ok" role="status">${icon('check')} ${esc(T(einw.stand === 'ja' ? 'daten.gewaehltJa' : 'daten.gewaehltNein'))}</p>` : '';
  }
  const inhalt = `${eingebettet ? '' : `<span class="eyebrow">${esc(T('daten.eyebrow'))}</span>`}
    ${einw.veraltet ? `<p class="klein">${esc(T('daten.neu'))}</p>` : ''}
    <p class="frage">${esc(T('daten.frage'))}</p>
    <p class="klein">${esc(T('daten.kurz'))}</p>
    ${einwDetails()}
    <div class="zwei"><button class="btn" data-a="daten" data-id="nein">${esc(T('daten.nein'))}</button><button class="btn ja" data-a="daten" data-id="ja">${esc(T('daten.ja'))}</button></div>`;
  return eingebettet ? inhalt : `<div class="karte spalte einw">${inhalt}</div>`;
}
export function einwStatus() {
  const { T, einw } = kx;
  if (einw.stand === 'ja') return T('daten.statusJa', { datum: K.ausTagKey(einw.tag).toLocaleDateString('de-AT') });
  if (einw.stand === 'nein') return T('daten.statusNein');
  return T('daten.statusOffen');
}
export function exportHtml() {
  const { T, ui } = kx;
  const x = ui.export;
  if (!x) return `<p class="klein">${esc(T('export.text'))}</p><button class="btn voll" data-a="export">${esc(T('export.knopf'))}</button>`;
  if (!x.code) return `<p class="fehler" role="alert">${esc(x.info || '')}</p><button class="btn voll" data-a="export">${esc(T('export.knopf'))}</button>`;
  const teilen = typeof navigator !== 'undefined' && navigator.share;
  return `<p class="klein">${esc(T('export.hinweis'))}</p>
    <label class="feld"><textarea id="export-code" readonly rows="3">${esc(x.code)}</textarea></label>
    <div class="zwei"><button class="btn" data-a="export-kopieren">${esc(T('export.kopieren'))}</button>${teilen ? `<button class="btn" data-a="export-teilen">${esc(T('export.teilen'))}</button>` : ''}</div>
    ${x.info ? `<p class="klein" role="status">${esc(x.info)}</p>` : ''}`;
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const EINSTELLUNGEN_KLICKS = {
  daten({ id }) { const { entscheideDaten, render } = kx; if (id === 'ja' || id === 'nein') { entscheideDaten(id); render(); } },
  export() { const { erstelleExport } = kx; erstelleExport(); },
  'export-kopieren'() { const { kopiereExport } = kx; kopiereExport(); },
  'export-teilen'() { const { teileExport } = kx; teileExport(); },
  stilwahl() { const { geheZu, stand, ui } = kx; ui.stilAuswahl = stand.stil.aktiv; geheZu('stilwahl'); },
  admin() { const { geheZu, ladeAdmin } = kx; geheZu('admin'); ladeAdmin(); },
  pflege() { const { geheZu, pflegeZustand } = kx; pflegeZustand(); geheZu('pflege'); },
  // Zweistufig: erster Tipp fragt nach, zweiter löscht den Spielstand und startet das Onboarding neu.
  reset() {
    const { geheZu, render, setzeSpiel, speicher, speichere, testerId, ui } = kx;
    if (!ui.resetFrage) { ui.resetFrage = true; render(); return; }
    speicher.loeschen();
    setzeSpiel(H.neuesSpiel(testerId));
    Object.assign(ui, { bereich: null, problem: null, ziel: null, freitext: '', feier: null, resetFrage: false });
    speichere();
    trackEvent('onboarding_started', { neu: true });
    geheZu('ob1');
  }
};
