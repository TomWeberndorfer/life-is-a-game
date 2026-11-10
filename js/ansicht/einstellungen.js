// Einstellungen (aus app.js ausgelagert, 30.10.2026): Stil, Speichern, Testphase mit Einwilligung und Daten-Code, Neu beginnen.
// Einwilligungs-Karte und Status nutzen auch Onboarding und Startseite.
import { analyticsStatus, hatFeedback, trackEvent } from '../analytics.js';
import { EINWILLIGUNG } from '../daten/forschung.js';
import { SPRUNGZIELE } from '../daten/sprungziele.js';
import * as EW from '../logik/einwilligung.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';
import { karteEinstellung } from './probe.js'; // Version 173 (Version 81: Morgenprobe)
import { anzeigeEinstellung } from './anzeige.js'; // Version 125: Blatt „Anzeige“
import { SPRECHBLASEN } from '../daten/bewegung.js'; // 02.11.2026
import { STARTPAKETE } from '../daten/startpakete.js'; // Startpaket (02.11.2026)
import { denkenEinstellung } from './denken.js'; // Version 165: Seite „Wie diese App denkt“
import { beweisEinstellung } from './beweisbuch.js'; // Version 166: Brief und Beweisbuch
import { testerEintrag } from './testerhinweis.js'; // 09.11.2026: „Info & Datenschutz“

export const EINSTELLUNGEN_SCREENS = {
  einstellungen() {
    const { T, VERSION, abgleichStatus, einw, istTest, speicher, stil, testerId, ui, weltenFrei } = kx;
    const ab = abgleichStatus();
    // Version 86: Premium steht seit Version 85 nur noch hier. „Gesehen“ zählt einmal je Sitzung, sobald die Einstellungen
    // mit dem Knopf offen sind (vorher: Premium-Karte auf der Startseite). Für die Kachel „Premium“ in der Auswertung.
    if (!ui.premiumGesehen && ui.screen === 'einstellungen') { ui.premiumGesehen = true; trackEvent('premium_viewed', {}); }
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
          <p class="klein" role="status">${esc(ab !== 'aus' ? T(`einst.abgleich.${ab}`) : T(speicher.verfuegbar ? 'einst.speicherOk' : 'einst.speicherAus'))}</p>
          ${istTest ? `<p class="klein">${esc(T('einst.testprofil'))}</p>` : ''}
        </div>
        ${anzeigeEinstellung()}
        ${karteEinstellung()}
        ${blasenEinstellung()}
        ${beweisEinstellung()}
        ${denkenEinstellung()}
        ${sprungKarten()}
        <div class="karte spalte">
          <span class="eyebrow">${esc(T('einst.testphase'))}</span>
          <p class="klein">${esc(einwStatus())}</p>
          ${EW.istOffen(einw) ? einwKarte(false, true) : `<button class="btn voll" data-a="daten" data-id="${einw.stand === 'ja' ? 'nein' : 'ja'}">${esc(T(einw.stand === 'ja' ? 'daten.zuruecknehmen' : 'daten.erlauben'))}</button>`}
          ${EW.istOffen(einw) ? '' : einwDetails()}
          ${testerEintrag()}
          <div class="zwei"><button class="btn" data-a="feedback-oeffnen">${esc(T(hatFeedback() ? 'einst.feedbackAendern' : 'einst.feedbackGeben'))}</button><button class="btn" data-a="premium">${esc(T('einst.premium'))}</button></div>
          ${EW.darfSenden(einw) && analyticsStatus() !== 'zentral' ? exportHtml() : ''}
          ${ui.istBesitzer ? `<button class="btn voll" data-a="admin">${esc(T('einst.auswertung'))}</button>` : ''}
          ${ui.istBesitzer && ui.db ? `<button class="btn" data-a="pflege">${esc(T('einst.pflege'))}</button>` : ''}
        </div>
        ${allesFreiKarte()}
        ${startpaketKarte()}
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
// Startpaket (02.11.2026): nur für den Besitzer und im Testprofil #test. Auch im ersten Onboarding-Schritt (ansicht/onboarding.js).
// Seit 06.11.2026 öffnet der Knopf die Auswahl (ansicht/onboarding.js, obmehr) mit allen Helden des Pakets vorausgewählt;
// die Rückfrage ist die Auswahl selbst. Helden, die schon da sind, werden ergänzt (fehlende Ziele, Messziele, Ideen).
export function startpaketKnopf(id, klasse = 'btn voll') {
  const p = STARTPAKETE[id];
  if (!p) return '';
  return `<button class="${klasse}" data-a="startpaket" data-id="${esc(id)}">${esc(p.name)}</button>`;
}
function startpaketKarte() {
  const { T, startpaketErlaubt } = kx;
  if (!startpaketErlaubt()) return '';
  return `<div class="karte spalte">
          <span class="eyebrow">${esc(T('einst.startpaket'))}</span>
          ${Object.entries(STARTPAKETE).map(([id, p]) => `<p class="klein">${esc(p.text)}</p>${startpaketKnopf(id)}`).join('')}
        </div>`;
}
// Schalter „Alles freischalten“ (Version 152, daten/freischaltung.js ALLES_FREI): nur im Testprofil für den Besitzer.
// Ein Tipp schaltet um (jederzeit zurück, darum ohne Rückfrage); gilt nur in diesem Browser, der Spielstand bleibt unberührt.
function allesFreiKarte() {
  const { T, allesFrei, allesFreiMoeglich } = kx;
  if (!allesFreiMoeglich()) return '';
  const an = allesFrei();
  return `<div class="karte spalte">
          <span class="eyebrow">${esc(T('einst.allesFrei'))}</span>
          <p class="klein">${esc(T(an ? 'einst.allesFreiAn' : 'einst.allesFreiText'))}</p>
          <button class="btn ${an ? 'warn' : ''}" aria-pressed="${an}" data-a="alles-frei">${esc(T(an ? 'einst.allesFreiAus' : 'einst.allesFreiEin'))}</button>
        </div>`;
}
// Sprechblasen (02.11.2026): automatisch nach Lesezeit oder nur per Tippen (spiel.einstellungen.blasen).
function blasenEinstellung() {
  const { T, spiel } = kx;
  const jetzt = H.bereinigeEinstellungen(spiel.einstellungen).blasen;
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('einst.blasen'))}</span>
    <p class="klein">${esc(T('einst.blasenText'))}</p>
    <div class="wahl" role="group" aria-label="${esc(T('einst.blasen'))}">${SPRECHBLASEN.varianten.map(x => `<button class="opt kurz ${jetzt === x ? 'sel' : ''}" aria-pressed="${jetzt === x}" data-a="blasen-modus" data-id="${esc(x)}">${esc(T('einst.blasen.' + x))}</button>`).join('')}</div>
  </div>`;
}
// Version 78: je Sprungziel eine Karte mit dem Link (z. B. Notfallkarte auf den Startbildschirm), sichtbar, sobald die
// zugehörige Funktion frei ist. Der Link steht auch als Text da, falls Kopieren im eingebetteten Rahmen nicht klappt.
function sprungKarten() {
  const { T, funktionFrei, sprungLink, ui } = kx;
  return Object.entries(SPRUNGZIELE).filter(([, d]) => d.titel && (!d.funktion || funktionFrei(d.funktion))).map(([id, d]) => {
    const info = ui.sprungInfo && ui.sprungInfo.id === id ? ui.sprungInfo : null;
    return `<div class="karte spalte">
      <span class="eyebrow">${esc(T(d.titel))}</span>
      <p class="klein">${esc(T(d.text))}</p>
      <p class="sprung-link">${esc(sprungLink(id))}</p>
      <button class="btn" data-a="sprung-kopieren" data-id="${esc(id)}">${esc(T('einst.sprung.kopieren'))}</button>
      ${info ? `<p class="klein" role="status">${esc(info.text)}</p>` : ''}
    </div>`;
  }).join('');
}
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
  // Version 78: Link eines Sprungziels kopieren. Im eingebetteten Rahmen kann die Zwischenablage gesperrt sein:
  // dann Hinweis, den Link darüber selbst zu markieren.
  async 'sprung-kopieren'({ id }) {
    const { T, render, sprungLink, ui } = kx;
    if (!Object.prototype.hasOwnProperty.call(SPRUNGZIELE, id)) { console.warn('Sprungziel unbekannt:', id); return; }
    let ok = false;
    try { await navigator.clipboard.writeText(sprungLink(id)); ok = true; } catch (e) { ok = false; }
    ui.sprungInfo = { id, text: T(ok ? 'einst.sprung.kopiert' : 'einst.sprung.manuell') };
    render();
  },
  // 02.11.2026: Sprechblasen automatisch oder nur per Tippen; gilt ab dem nächsten Treffer
  'blasen-modus'({ id }) {
    const { render, setzeSpiel, speichere, spiel } = kx;
    if (!SPRECHBLASEN.varianten.includes(id)) { console.warn('Sprechblasen: unbekannte Einstellung', id); return; }
    setzeSpiel({ ...spiel, einstellungen: { ...H.bereinigeEinstellungen(spiel.einstellungen), blasen: id } });
    speichere();
    trackEvent('blasen_modus', { modus: id });
    render();
  },
  startpaket({ id }) { const { startpaket } = kx; startpaket(id); },
  'alles-frei'() { const { allesFrei, render, setzeAllesFrei } = kx; if (setzeAllesFrei(!allesFrei())) render(); },
  stilwahl() { const { geheZu, stand, ui } = kx; ui.stilAuswahl = stand.stil.aktiv; geheZu('stilwahl'); },
  admin() { const { geheZu, ladeAdmin } = kx; geheZu('admin'); ladeAdmin(); },
  pflege() { const { geheZu, pflegeZustand } = kx; pflegeZustand(); geheZu('pflege'); },
  // Zweistufig: erster Tipp fragt nach, zweiter löscht den Spielstand und startet das Onboarding neu.
  reset() {
    const { geheZu, render, setzeSpiel, speicher, speichere, testerId, ui } = kx;
    if (!ui.resetFrage) { ui.resetFrage = true; render(); return; }
    speicher.loeschen();
    setzeSpiel(H.neuesSpiel(testerId));
    Object.assign(ui, { bereich: null, problem: null, ziel: null, freitext: '', warum: '', feier: null, resetFrage: false });
    speichere();
    trackEvent('onboarding_started', { neu: true });
    geheZu('ob1');
  }
};
