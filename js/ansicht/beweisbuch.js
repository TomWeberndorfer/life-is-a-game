// Brief an mein künftiges Ich und Beweisbuch (Version 166, 08.11.2026): eine ruhige Seite mit den eigenen Briefen und den mit
// einem Stern markierten Einträgen („Das will ich mir merken“). Daten: daten/beweisbuch.js, Logik: logik/beweisbuch.js,
// Modell: Eintragsart „brief“ und Feld `merken` (daten/eintrag-arten.js, logik/eintraege.js), Texte: daten/texte.js.
// Zustand der Seite: ui.beweis = { id (null = neuer Brief), heroId (null = für alle), text, fehler, loeschenSicher } oder null (kein Editor).
// Wo sie erreichbar ist: Einstellungen (Karte), Logbuch (Knopf), leise Karte auf der Startseite (einmal, nach dem ersten Sieg).
// „Zurück“ führt dorthin, wo man herkam (ui.beweisZurueck).
// Psychologie: Der Brief ist eine Ermutigung in der eigenen Stimme, kein Versprechen und keine Pflicht: keine Erinnerung, kein
// Zähler, keine XP. Der Stern ist freiwillig und privat. Beides bleibt bei dir und geht nie in die Testauswertung (nur Zähler).
import { merke, merkmal, trackEvent } from '../analytics.js';
import { BEWEISBUCH } from '../daten/beweisbuch.js';
import { BRIEF_TEXT_MAX, EINTRAG_ARTEN, EINTRAG_OPT } from '../daten/eintrag-arten.js';
import * as BB from '../logik/beweisbuch.js';
import * as EN from '../logik/eintraege.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

const HERKUNFT = ['start', 'einstellungen', 'logbuch'];
const BRIEF = BEWEISBUCH.art;

// Held-Name oder „Für alle“ für die Kopfzeile eines Briefs
function fuerText(heroId) {
  const { T, nameVon, spiel } = kx;
  return heroId && spiel.helden.some(h => h.heroId === heroId) ? nameVon(heroId) : T('beweis.fuerAlle');
}

// ---------- Stern „Das will ich mir merken“ ----------
// Chip im Eintragsblatt und im Tagesnotiz-Blatt (an = gesetzt, aktion = data-a)
export function merkenChip(an, aktion) {
  const { T } = kx;
  return `<div class="feld"><button class="opt kurz ${an ? 'sel' : ''}" aria-pressed="${!!an}" data-a="${esc(aktion)}">${icon('stern')} ${esc(T('beweis.stern'))}</button></div>`;
}
// Stern an einer Logbuch-Zeile: nur bei Arten mit `merkbar` (Eintrag zum Tag, Tagesnotiz). daten = Logbuch-Daten des Eintrags.
export function sternKnopf(lbArt, daten) {
  const { T } = kx;
  if (!daten || !daten.eintragId) return '';
  const reg = Object.values(EINTRAG_ARTEN).find(a => a.merkbar && a.logbuch === lbArt);
  if (!reg) return '';
  const an = daten.merken === true;
  const t = T(an ? 'beweis.sternAus' : 'beweis.sternAn');
  return `<button class="link lb-stern ${an ? 'an' : ''}" data-a="beweis-stern" data-id="${esc(daten.eintragId)}" aria-pressed="${an}" aria-label="${esc(t)}" title="${esc(t)}">${icon('stern')}</button>`;
}
// Nach dem Speichern eines Eintrags den Stern auf den gewünschten Wert bringen (an = true/false). Liefert den neuen Spielstand
// (bei Fehler den alten). Wirft nie.
export function sternSetzen(spiel, id, an) {
  try {
    const e = EN.eintragVon(spiel, id);
    if (!e || (e.merken === true) === !!an) return spiel;
    const r = EN.eintragMerken(spiel, id, !!an, EINTRAG_ARTEN);
    trackEvent(an ? 'proof_starred' : 'proof_unstarred', {});
    return r.spiel;
  } catch (err) { console.warn('Beweisbuch (Stern):', err.message); return spiel; }
}

// ---------- Seite ----------
function editorHtml() {
  const { T, spiel, ui, nameVon } = kx;
  const b = ui.beweis;
  if (!b) return '';
  const an = x => `class="opt kurz ${x ? 'sel' : ''}" aria-pressed="${!!x}"`;
  const wahl = `<div class="feld"><span id="beweis-fuer-l">${esc(T('beweis.fuer'))}</span>
      <div class="wahl eintrag-wahl" role="group" aria-labelledby="beweis-fuer-l">
        <button ${an(b.heroId === null)} data-a="beweis-held" data-id="">${esc(T('beweis.fuerAlle'))}</button>
        ${spiel.helden.map(h => `<button ${an(b.heroId === h.heroId)} data-a="beweis-held" data-id="${esc(h.heroId)}">${esc(nameVon(h.heroId))}</button>`).join('')}
      </div></div>`;
  return `<div class="karte spalte beweis-editor">
    <span class="eyebrow">${esc(T(b.id ? 'beweis.bearbeiten' : 'beweis.neu'))}</span>
    <p class="klein">${esc(T('beweis.hinweis'))}</p>
    ${wahl}
    <label class="feld"><span>${esc(T('beweis.titel'))}</span><textarea id="beweis-text" rows="7" maxlength="${BRIEF_TEXT_MAX}" placeholder="${esc(T('beweis.platzhalter'))}" ${b.fehler ? 'aria-invalid="true"' : ''}>${esc(b.text || '')}</textarea></label>
    ${b.fehler ? `<p class="fehler" role="alert">${esc(b.fehler)}</p>` : ''}
    <p class="klein">${esc(T('beweis.privat'))}</p>
    <button class="cta" data-a="beweis-speichern">${esc(T('beweis.speichern'))}</button>
    ${b.id ? `<button class="link" data-a="beweis-loeschen">${esc(T(b.loeschenSicher ? 'beweis.loeschenSicher' : 'beweis.loeschen'))}</button>` : ''}
    <button class="link" data-a="beweis-abbrechen">${esc(T('beweis.abbrechen'))}</button>
  </div>`;
}

const textHtml = t => `<p class="beweis-text" style="white-space:pre-wrap;margin:0">${esc(t)}</p>`;

export const BEWEIS_SCREENS = {
  beweis() {
    const { T, spiel, ui } = kx;
    const zurueck = HERKUNFT.includes(ui.beweisZurueck) ? ui.beweisZurueck : 'einstellungen';
    let ansicht = { briefe: [], markiert: [] };
    try { ansicht = BB.beweisbuch(spiel, EINTRAG_ARTEN); } catch (e) { console.warn('Beweisbuch:', e.message); }
    const briefe = ansicht.briefe.map(e => `<div class="karte spalte beweis-brief">
        <span class="eyebrow">${esc(fuerText(e.heroId))} · ${esc(kurzDatum(e.tag))}</span>
        ${textHtml(e.text)}
        <button class="btn" data-a="beweis-bearbeiten" data-id="${esc(e.id)}">${esc(T('beweis.bearbeiten'))}</button>
      </div>`).join('');
    const markiert = ansicht.markiert.map(e => {
      const reg = EINTRAG_ARTEN[e.art];
      return `<div class="karte spalte beweis-merk">
        <span class="eyebrow">${esc(T('lb.' + (reg ? reg.logbuch : e.art)))} · ${esc(kurzDatum(e.tag))}</span>
        ${textHtml(BB.belegText(e))}
        <button class="link" data-a="beweis-stern" data-id="${esc(e.id)}" aria-pressed="true">${icon('stern')} ${esc(T('beweis.sternAus'))}</button>
      </div>`;
    }).join('');
    return `<section class="screen beweis">
      <div class="start-kopf"><button class="link" data-a="beweis-zurueck">${icon('zurueck')} ${esc(T('beweis.zurueck'))}</button></div>
      <div class="inhalt">
        <h1>${esc(T('beweis.titel'))}</h1>
        <p class="lead">${esc(T('beweis.lead'))}</p>
        <span class="eyebrow">${esc(T('beweis.briefeTitel'))}</span>
        ${ui.beweis ? editorHtml() : `<button class="btn voll" data-a="beweis-neu">${icon('stift')} ${esc(T('beweis.neu'))}</button>`}
        ${briefe || (ui.beweis ? '' : `<p class="klein">${esc(T('beweis.briefeLeer'))}</p>`)}
        <span class="eyebrow">${esc(T('beweis.markiertTitel'))}</span>
        ${markiert || `<p class="klein">${esc(T('beweis.markiertLeer'))}</p>`}
      </div>
    </section>`;
  }
};

// ---------- Einstieg ----------
// Karte in den Einstellungen: immer da
export function beweisEinstellung() {
  const { T } = kx;
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('einst.beweis'))}</span>
    <p class="klein">${esc(T('einst.beweisText'))}</p>
    <button class="btn" data-a="beweis-oeffnen" data-id="einstellungen">${esc(T('einst.beweisOeffnen'))}</button>
  </div>`;
}
// Knopf im Logbuch (neben „Tagesnotiz schreiben“)
export function beweisLogbuchKnopf() {
  const { T } = kx;
  return `<button class="lb-chip lb-beweis-knopf" data-a="beweis-oeffnen" data-id="logbuch">${icon('stern')} ${esc(T('lb.beweisbuch'))}</button>`;
}
// Leise Karte unter den Neuigkeiten der Startseite (NEU_KARTEN.brief): einmal, nach dem ersten Sieg, nie mit Brief; „Später“ zählt
// wie gesehen. Wirft nie.
export function beweisKarte() {
  const { T, spiel, stand } = kx;
  try {
    const briefe = (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).filter(e => e && e.art === BRIEF).length;
    if (!BB.karteOffen({ gesehen: merkmal(BEWEISBUCH.anregung.merkmal), hatQuest: !!(stand && stand.quest), siege: BB.meisteSiege(spiel), briefe })) return '';
  } catch (e) { console.warn('Beweisbuch (Karte):', e.message); return ''; }
  return `<div class="karte spalte beweis-karte">
    <span class="eyebrow akzent">${esc(T('beweis.karte.eyebrow'))}</span>
    <span class="nm">${esc(T('beweis.karte.titel'))}</span>
    <p class="klein">${esc(T('beweis.karte.text'))}</p>
    <div class="zwei"><button class="btn voll" data-a="beweis-karte-schreiben">${esc(T('beweis.karte.schreiben'))}</button><button class="btn" data-a="beweis-karte-spaeter">${esc(T('beweis.karte.spaeter'))}</button></div>
  </div>`;
}

// ---------- Aktionen ----------
const merkeAngeregt = () => { if (merkmal(BEWEISBUCH.anregung.merkmal) !== true) merke(BEWEISBUCH.anregung.merkmal, true); };
const neuerEditor = (heroId = null, e = null) => ({ id: e ? e.id : null, heroId, text: e ? e.text || '' : '', fehler: null, loeschenSicher: false });

function speichern() {
  const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
  const b = ui.beweis;
  if (!b) return;
  const text = String(b.text || '').trim();
  if (!text) { b.fehler = T('beweis.leer'); render(); return; }
  let r;
  try {
    if (b.id) {
      r = EN.eintragBearbeiten(spiel, b.id, { art: BRIEF, text }, EINTRAG_OPT);
      // Der Held lässt sich beim Bearbeiten nicht ändern (heroId bleibt fest): neu anlegen, wenn er gewechselt wurde
      const alt = EN.eintragVon(spiel, b.id);
      if (alt && (alt.heroId || null) !== b.heroId) r = { spiel: EN.eintragHinzufuegen(EN.eintragLoeschen(spiel, b.id), b.heroId, { art: BRIEF, text }, jetzt(), EINTRAG_OPT).spiel };
    } else r = EN.eintragHinzufuegen(spiel, b.heroId, { art: BRIEF, text }, jetzt(), EINTRAG_OPT);
  } catch (err) { b.fehler = err instanceof EN.EintragFehler ? err.message : T('beweis.leer'); render(); return; }
  setzeSpiel(r.spiel);
  speichere();
  trackEvent(b.id ? 'letter_edited' : 'letter_saved', {}); // nur dass es einen Brief gibt, nie der Text
  merkeAngeregt(); // wer schreibt, braucht die Anregung nicht mehr
  const war = b.id;
  ui.beweis = null;
  kx.bestaetige(T(war ? 'beweis.geaendert' : 'beweis.gespeichert'));
  render();
}

function loeschen() {
  const { T, render, setzeSpiel, speichere, spiel, ui } = kx;
  const b = ui.beweis;
  if (!b || !b.id) return;
  if (!b.loeschenSicher) { b.loeschenSicher = true; render(); return; }
  try { setzeSpiel(EN.eintragLoeschen(spiel, b.id)); speichere(); }
  catch (err) { b.fehler = err.message; b.loeschenSicher = false; render(); return; }
  trackEvent('letter_deleted', {});
  ui.beweis = null;
  kx.bestaetige(T('beweis.geloescht'));
  render();
}

// ---------- Klicks ----------
export const BEWEIS_KLICKS = {
  'beweis-oeffnen'({ id }) {
    const { geheZu, ui } = kx;
    ui.beweisZurueck = HERKUNFT.includes(id) ? id : 'einstellungen';
    ui.beweis = null;
    trackEvent('proof_book_opened', {});
    geheZu('beweis');
  },
  'beweis-zurueck'() { const { geheZu, ui } = kx; ui.beweis = null; geheZu(HERKUNFT.includes(ui.beweisZurueck) ? ui.beweisZurueck : 'einstellungen'); },
  'beweis-neu'() {
    const { render, spiel, ui } = kx;
    ui.beweis = neuerEditor(spiel.fokus || null);
    trackEvent('letter_opened', {});
    render();
  },
  'beweis-bearbeiten'({ id }) {
    const { T, render, spiel, ui } = kx;
    const e = EN.eintragVon(spiel, id);
    if (!e || e.art !== BRIEF) { kx.bestaetige(T('beweis.geloescht')); render(); return; }
    ui.beweis = neuerEditor(e.heroId || null, e);
    render();
  },
  'beweis-held'({ id }) {
    const { render, spiel, ui } = kx;
    if (!ui.beweis) return;
    if (id && !spiel.helden.some(h => h.heroId === id)) { console.warn('Beweisbuch: unbekannter Held', id); return; }
    ui.beweis.heroId = id || null;
    ui.beweis.fehler = null;
    render();
  },
  'beweis-speichern'() { speichern(); },
  'beweis-loeschen'() { loeschen(); },
  'beweis-abbrechen'() { const { render, ui } = kx; ui.beweis = null; render(); },
  // Stern setzen oder nehmen (Logbuch, Beweisbuch)
  'beweis-stern'({ id }) {
    const { T, render, setzeSpiel, speichere, spiel } = kx;
    let r;
    try { r = EN.eintragMerken(spiel, id, undefined, EINTRAG_ARTEN); }
    catch (err) { console.warn('Beweisbuch (Stern):', err.message); render(); return; }
    setzeSpiel(r.spiel);
    speichere();
    trackEvent(r.merken ? 'proof_starred' : 'proof_unstarred', {});
    kx.bestaetige(T(r.merken ? 'beweis.sternGesetzt' : 'beweis.sternEntfernt'));
    render();
  },
  'beweis-karte-schreiben'() {
    const { geheZu, spiel, ui } = kx;
    merkeAngeregt();
    ui.beweisZurueck = 'start';
    ui.beweis = neuerEditor(spiel.fokus || null);
    trackEvent('letter_card_accepted', {});
    geheZu('beweis');
  },
  'beweis-karte-spaeter'() { const { render } = kx; merkeAngeregt(); trackEvent('letter_card_later', {}); render(); }
};
// Felder: Text tippen, ohne neu zu zeichnen (Fokus bleibt im Feld)
export const BEWEIS_FELDER = {
  'beweis-text': {
    input({ wert }) {
      const { ui } = kx;
      if (!ui.beweis) return;
      ui.beweis.text = String(wert ?? '').slice(0, BRIEF_TEXT_MAX);
      if (ui.beweis.fehler) ui.beweis.fehler = null;
    }
  }
};
