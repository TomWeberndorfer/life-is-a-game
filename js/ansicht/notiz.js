// Tagesnotiz (04.11.2026): Blatt „Wie war dein Tag?“ (neu und bearbeiten), Karte am Abend auf der Startseite und
// die Beschriftung der Lebensbereiche für Notiz und Logbuch-Filter. Modell: Art „notiz“ in daten/eintrag-arten.js
// (heroId null, `bereiche`, `felder`), Logik: logik/eintraege.js und logik/tagesnotiz.js, Einstellungen: daten/tagesnotiz.js.
// Zustand: ui.notiz = { id (null = neu), tag, bereiche, stimmung, felder: { gut, schwer }, fehler, loeschenSicher }.
// Das Blatt gilt auf Startseite und Logbuch; auf anderen Bildschirmen schließt es still (wie das Eintragsblatt).
// Psychologie: alles freiwillig, keine XP, kein Zähler für Schreibtage. „Heute nicht“ ohne Rückfrage, bis morgen.
// Datenschutz: Texte und Bereiche gehen nie in Analytics, nur dass eine Notiz entstand oder geändert wurde.
import { trackEvent } from '../analytics.js';
import { EINTRAG_ARTEN, EINTRAG_OPT, STIMMUNGEN } from '../daten/eintrag-arten.js';
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import { TAGESNOTIZ } from '../daten/tagesnotiz.js';
import * as EN from '../logik/eintraege.js';
import * as K from '../logik/kern.js';
import * as TN from '../logik/tagesnotiz.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

export const NOTIZ_ART = 'notiz';
let notizNr = 0;
const BILDSCHIRME = ['start', 'logbuch'];
const feldNamen = () => (EINTRAG_ARTEN[NOTIZ_ART] && EINTRAG_ARTEN[NOTIZ_ART].textFelder) || [];

// ---------- Beschriftung der Lebensbereiche ----------
// Heldenname mit Porträt, wenn ein eigener Held den Bereich vertritt und die Anzeige „Helden“ gilt; sonst Bereichsname.
function bereichEintrag(id) {
  const { spiel } = kx;
  return TN.bereichAuswahl(spiel, LEBENSBEREICHE, { nur: [id] })[0] || null;
}
const alsHeld = d => { const { anzeige } = kx; return !!(d && d.heroId && anzeige.bezug !== 'bereiche'); };
export function bereichName(id) {
  const { nameVon } = kx;
  const d = bereichEintrag(id);
  if (!d) return id;
  return alsHeld(d) ? nameVon(d.heroId) : d.bereichName;
}
export function bereichLabel(id) {
  const { img, nameVon } = kx;
  const d = bereichEintrag(id);
  if (!d) return esc(id);
  if (alsHeld(d)) return `${img(d.heroId, nameVon(d.heroId), 'held', 'rund-klein', '')}${esc(nameVon(d.heroId))}`;
  const lb = LEBENSBEREICHE.find(x => x.id === id);
  return `${icon((lb && lb.icon) || 'sonne')}${esc(d.bereichName)}`;
}
// Bereiche einer Notiz als Text („Trogadon · Familie“) oder „Ganzer Tag“.
export function bereicheText(liste) {
  const { T } = kx;
  return Array.isArray(liste) && liste.length ? liste.map(bereichName).join(' · ') : T('lb.ganzerTag');
}

// Stift in der Kopfzeile der Startseite: öffnet die Tagesnotiz jederzeit, auch tagsüber (04.11.2026).
export function notizKopfKnopf() {
  const { T } = kx;
  const t = esc(T('notiz.kopf'));
  return `<button class="icbtn einst-btn notiz-kopf" data-a="notiz-oeffnen" data-id="" aria-label="${t}" title="${t}">${icon('stift')}</button>`;
}

// ---------- Karte auf der Startseite (am Abend) ----------
function wegTag() {
  const { speicher } = kx;
  try { return speicher.einstellung(TAGESNOTIZ.startseite.weg); } catch (e) { return null; }
}
export function notizKarteHtml() {
  const { T, jetzt, spiel } = kx;
  const heute = K.tagKey(jetzt());
  const heuteNotizen = EN.notizenAm(spiel, heute, EINTRAG_ARTEN);
  const z = TN.karteZustand(TAGESNOTIZ, { jetzt: jetzt(), heuteNotizen: heuteNotizen.length, wegTag: wegTag() });
  if (z === 'aus') return '';
  if (z === 'da') {
    const letzte = heuteNotizen[heuteNotizen.length - 1];
    return `<div class="hinweis notiz-da" role="status"><span>${icon('stift')} ${esc(T('notiz.karte.da'))}</span><span class="notiz-da-knoepfe"><button class="link" data-a="notiz-oeffnen" data-id="">${esc(T('notiz.weitere'))}</button><button class="link" data-a="notiz-oeffnen" data-id="${esc(letzte.id)}">${esc(T('notiz.karte.ansehen'))}</button></span></div>`;
  }
  return `<div class="karte spalte notiz-karte">
    <span class="eyebrow">${esc(T('notiz.karte.eyebrow'))}</span>
    <span class="nm">${esc(T('notiz.titel'))}</span>
    <p class="klein">${esc(T('notiz.karte.text'))}</p>
    <div class="zwei"><button class="btn voll" data-a="notiz-oeffnen" data-id="">${icon('stift')} ${esc(T('notiz.karte.schreiben'))}</button><button class="btn" data-a="notiz-karte-weg">${esc(T('notiz.karte.weg'))}</button></div>
  </div>`;
}

// ---------- Blatt ----------
export function notizBlattHtml() {
  const { T, jetzt, spiel, ui } = kx;
  const n = ui.notiz;
  if (!n) return '';
  if (!BILDSCHIRME.includes(ui.screen)) { ui.notiz = null; return ''; }
  // Beim Bearbeiten: wurde die Notiz inzwischen (auf einem anderen Gerät) gelöscht, schließt das Blatt mit Hinweis
  if (n.id && !EN.eintragVon(spiel, n.id)) { ui.notiz = null; kx.bestaetige(T('notiz.weg')); return ''; }
  const f = n.fehler || {};
  const an = x => `class="opt kurz ${x ? 'sel' : ''}" aria-pressed="${x}"`;
  const tage = n.id ? [] : TN.waehlbareTage(TAGESNOTIZ, jetzt());
  const tagWahl = tage.length > 1 ? `<div class="feld"><span id="notiz-tag-l">${esc(T('notiz.tag'))}</span>
      <div class="wahl eintrag-wahl" role="group" aria-labelledby="notiz-tag-l">${tage.map(t => `<button ${an(n.tag === t.tag)} data-a="notiz-tag" data-id="${esc(t.tag)}">${esc(T('notiz.tag.' + t.name))}</button>`).join('')}</div></div>` : '';
  const bereiche = TN.bereichAuswahl(spiel, LEBENSBEREICHE);
  const felder = feldNamen().map(k => `<label class="feld"><span>${esc(T('notiz.feld.' + k))}</span><textarea id="notiz-${esc(k)}" rows="3" maxlength="${EINTRAG_OPT.textMax}">${esc((n.felder && n.felder[k]) || '')}</textarea></label>`).join('');
  return `<div class="feier unten eintrag-blatt notiz-blatt" role="dialog" aria-modal="true" aria-labelledby="notiz-t">
    <button class="hintergrund" data-a="notiz-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(T('lb.notiz').toUpperCase())} · ${esc(kurzDatum(n.tag).toUpperCase())}</span>
        <h2 id="notiz-t">${esc(T('notiz.titel'))}</h2>
        <p class="klein">${esc(T('notiz.hinweis'))}</p>
        ${tagWahl}
        <div class="feld"><span id="notiz-st-l">${esc(T('eintrag.stimmung'))}</span>
          <div class="wahl eintrag-wahl" role="group" aria-labelledby="notiz-st-l">${STIMMUNGEN.map(w => `<button ${an(n.stimmung === w)} data-a="notiz-stimmung" data-id="${w}">${esc(T('eintrag.stimmung.' + w))}</button>`).join('')}</div></div>
        ${felder}
        <div class="feld"><span id="notiz-b-l">${esc(T('notiz.bereiche'))}</span>
          <div class="wahl eintrag-wahl notiz-bereiche" role="group" aria-labelledby="notiz-b-l">${bereiche.map(b => `<button ${an(n.bereiche.includes(b.id))} data-a="notiz-bereich" data-id="${esc(b.id)}">${bereichLabel(b.id)}</button>`).join('')}</div>
          <p class="klein">${esc(T('notiz.bereicheHinweis'))}</p></div>
        ${f.allgemein ? `<p class="fehler" role="alert">${esc(f.allgemein)}</p>` : ''}
        <p class="klein">${esc(T('eintrag.privat'))}</p>
        <button class="cta" data-a="notiz-speichern">${esc(T('notiz.speichern'))}</button>
        ${n.id ? '' : `<button class="btn" data-a="notiz-speichern-weitere">${esc(T('notiz.speichernWeitere'))}</button>`}
        ${n.id ? `<button class="link notiz-loeschen" data-a="notiz-loeschen">${esc(T(n.loeschenSicher ? 'notiz.loeschenSicher' : 'notiz.loeschen'))}</button>` : ''}
        <button class="link" data-a="notiz-zu">${esc(T('notiz.abbrechen'))}</button>
      </div>
    </div>
  </div>`;
}

// Blatt öffnen: id = bestehende Notiz (bearbeiten) oder leer (neu, Tag heute oder `tag`, z. B. nach „Festhalten und
// weitere“). Eine neue Notiz übernimmt die Stimmung der letzten Notiz dieses Tages als Vorauswahl (ein Tipp ändert sie).
export function notizOeffnen(id, tag = null) {
  const { T, jetzt, spiel, ui } = kx;
  if (id) {
    const e = EN.eintragVon(spiel, id);
    if (!e || e.art !== NOTIZ_ART) { kx.bestaetige(T('notiz.weg')); return false; }
    ui.notiz = { id: e.id, tag: e.tag, bereiche: [...(e.bereiche || [])], stimmung: e.stimmung, felder: { ...(e.felder || {}) }, fehler: {}, loeschenSicher: false };
  } else {
    const t = tag && TN.waehlbareTage(TAGESNOTIZ, jetzt()).some(x => x.tag === tag) ? tag : K.tagKey(jetzt());
    const stimmung = TN.stimmungVorschlag(EN.notizenAm(spiel, t, EINTRAG_ARTEN), STIMMUNGEN);
    notizNr += 1; // „Festhalten und weitere“: neues Blatt = neue Ebene (Einblendung, Scroll oben)
    ui.notiz = { id: null, nr: notizNr, tag: t, bereiche: [], stimmung, felder: {}, fehler: {}, loeschenSicher: false };
  }
  trackEvent(id ? 'note_edit_opened' : 'note_opened', {});
  return true;
}

// Speichern: prüfen, anlegen bzw. ändern, Spielstand sichern. Fehler bleiben im Blatt sichtbar.
// weitere = true: danach gleich ein leeres Blatt für denselben Tag („Festhalten und weitere“, nur bei neuen Notizen).
export function notizSpeichern({ weitere = false } = {}) {
  const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
  const n = ui.notiz;
  if (!n) return;
  const eingabe = { art: NOTIZ_ART, stimmung: n.stimmung, bereiche: n.bereiche, felder: n.felder };
  if (!TN.hatInhalt(eingabe)) { n.fehler = { allgemein: T('notiz.leer') }; render(); return; }
  let r;
  try {
    if (n.id) r = EN.eintragBearbeiten(spiel, n.id, eingabe, EINTRAG_OPT);
    else {
      if (!TN.gueltigerTag(n.tag) || !TN.waehlbareTage(TAGESNOTIZ, jetzt()).some(t => t.tag === n.tag)) throw new EN.EintragFehler('Ungültiger Tag.');
      r = EN.eintragHinzufuegen(spiel, null, eingabe, jetzt(), { ...EINTRAG_OPT, tag: n.tag });
    }
  } catch (err) { n.fehler = { allgemein: err.message }; render(); return; }
  setzeSpiel(r.spiel);
  speichere();
  // Analytics: nur dass es eine Notiz gibt und ob Felder gesetzt sind, nie Text oder Bereiche
  trackEvent(n.id ? 'note_edited' : 'note_saved', {});
  const war = n.id;
  ui.notiz = null;
  kx.bestaetige(T(war ? 'notiz.geaendert' : 'notiz.gespeichert'));
  if (weitere && !war) notizOeffnen(null, n.tag);
  render();
}

// Löschen in zwei Tipps (nicht umkehrbar): erst „Wirklich löschen?“, dann weg.
function notizLoeschen() {
  const { T, render, setzeSpiel, speichere, spiel, ui } = kx;
  const n = ui.notiz;
  if (!n || !n.id) return;
  if (!n.loeschenSicher) { n.loeschenSicher = true; render(); return; }
  try { setzeSpiel(EN.eintragLoeschen(spiel, n.id)); speichere(); }
  catch (err) { n.fehler = { allgemein: err.message }; n.loeschenSicher = false; render(); return; }
  trackEvent('note_deleted', {});
  ui.notiz = null;
  kx.bestaetige(T('notiz.geloescht'));
  render();
}

// ---------- Klicks ----------
export const NOTIZ_KLICKS = {
  'notiz-oeffnen'({ id }) { const { render } = kx; notizOeffnen(id || null); render(); },
  'notiz-zu'() { const { render, ui } = kx; ui.notiz = null; render(); },
  'notiz-speichern'() { notizSpeichern(); },
  'notiz-speichern-weitere'() { notizSpeichern({ weitere: true }); },
  'notiz-loeschen'() { notizLoeschen(); },
  // Erneuter Tipp auf die gewählte Stimmung nimmt sie zurück (alles freiwillig)
  'notiz-stimmung'({ id }) {
    const { render, ui } = kx;
    if (!ui.notiz) return;
    const w = Number(id);
    if (!STIMMUNGEN.includes(w)) { console.warn('Tagesnotiz: unbekannte Stimmung', id); return; }
    ui.notiz.stimmung = ui.notiz.stimmung === w ? null : w;
    ui.notiz.fehler = {};
    render();
  },
  'notiz-bereich'({ id }) {
    const { render, ui } = kx;
    if (!ui.notiz) return;
    if (!LEBENSBEREICHE.some(d => d.id === id)) { console.warn('Tagesnotiz: unbekannter Lebensbereich', id); return; }
    ui.notiz.bereiche = TN.umschalten(ui.notiz.bereiche, id);
    render();
  },
  'notiz-tag'({ id }) {
    const { jetzt, render, ui } = kx;
    if (!ui.notiz || ui.notiz.id) return; // bestehende Notiz behält ihren Tag
    if (!TN.waehlbareTage(TAGESNOTIZ, jetzt()).some(t => t.tag === id)) { console.warn('Tagesnotiz: Tag nicht wählbar', id); return; }
    ui.notiz.tag = id;
    render();
  },
  // „Heute nicht“: bis morgen weg, gemerkt je Gerät, ohne Rückfrage
  'notiz-karte-weg'() {
    const { jetzt, render, speicher } = kx;
    try { speicher.setzeEinstellung(TAGESNOTIZ.startseite.weg, K.tagKey(jetzt())); } catch (e) { console.warn('Tagesnotiz: nicht gemerkt', e.message); }
    trackEvent('note_card_dismissed', {});
    render();
  }
};
// Felder: Text tippen, ohne neu zu zeichnen (Fokus bleibt im Feld). notiz-<name> für jedes Textfeld der Art.
export const NOTIZ_FELDER = {
  'notiz-*': {
    input({ el, wert }) {
      const { ui } = kx;
      if (!ui.notiz || !el || typeof el.id !== 'string') return;
      const k = el.id.slice('notiz-'.length);
      if (!feldNamen().includes(k)) return;
      ui.notiz.felder = { ...ui.notiz.felder, [k]: String(wert ?? '').slice(0, EINTRAG_OPT.textMax) };
      if (ui.notiz.fehler && ui.notiz.fehler.allgemein) ui.notiz.fehler = {};
    }
  }
};
