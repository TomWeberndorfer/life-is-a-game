// Stützgewohnheiten (Schritt „Zähler“, 31.10.2026): Liste und Formular in „Quest bearbeiten“, leise Haken in der Heldentat.
// Logik: logik/stuetzen.js (anlegen, ändern, umsortieren, archivieren, abhaken), Grenzen: daten/zielarten.js (TEILZIELE).
// Psychologie: Das Hauptverhalten bleibt vorne (eine Frage, ein Duell); Stützgewohnheiten erscheinen erst nach der
// Antwort des Tages als kleine Haken ohne XP, damit sie das Hauptverhalten stützen statt mit ihm zu konkurrieren.
import { trackEvent } from '../analytics.js';
import { ZIELARTEN, TEILZIELE } from '../daten/zielarten.js';
import * as K from '../logik/kern.js';
import * as S from '../logik/stuetzen.js';
import { grenzen, nebenTeilziele } from '../logik/teilziele.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { artText } from './bestaendigkeit.js'; // Beständigkeit (04.11.2026): Annäherungs-Gegenstück vorschlagen

const ART = ZIELARTEN[TEILZIELE.standardArt];
const zeileText = (T, zeitraum, anzahl) => T(`st.zeile.${zeitraum}`, { anzahl });

// ---------- Heldentat: Haken nach der Antwort des Tages ----------
export function stuetzenHakenHtml() {
  const { T, jetzt, stand } = kx;
  const liste = S.stuetzenStand(stand, jetzt());
  if (!liste.length) return '';
  const zeilen = liste.map(x => {
    if (!x.aktiv) {
      return `<div class="stuetze wartet"><span class="stuetze-haken" aria-hidden="true"></span><span class="stuetze-text"><span>${esc(x.name)}</span><small>${esc(x.abTag ? T('st.ab', { datum: kurzDatum(x.abTag) }) : T('st.abSpaeter'))}</small></span></div>`;
    }
    const stand_ = x.erreicht ? T('st.stand.erreicht', { n: x.geschafft, anzahl: x.ziel }) : T(`st.stand.${x.zeitraum}`, { n: x.geschafft, anzahl: x.ziel });
    return `<button class="stuetze${x.heute ? ' an' : ''}" data-a="stuetze-haken" data-id="${esc(x.id)}" aria-pressed="${x.heute}" aria-label="${esc(T('st.hakenAria', { name: x.name }))}">
      <span class="stuetze-haken" aria-hidden="true">${x.heute ? icon('check') : ''}</span>
      <span class="stuetze-text"><span>${esc(x.name)}</span><small>${esc(stand_)}</small></span></button>`;
  }).join('');
  return `<div class="stuetzen" role="group" aria-label="${esc(T('st.heute'))}"><span class="eyebrow">${esc(T('st.heute'))}</span>${zeilen}</div>`;
}

// Am Siegtag, sobald Stützgewohnheiten frei sind und noch keine angelegt ist: eine ruhige Frage (kein Druck, kein Punkt).
// Grund: Der Erfolgsmoment ist der natürliche Zeitpunkt für den nächsten kleinen Schritt; an anderen Tagen bleibt es still.
export function stuetzeBereitHtml(a) {
  const { T, funktionFrei, stand } = kx;
  if (!a || !a.siegHeute || !S.nebenFrei(stand) || nebenTeilziele(stand.quest).length || !funktionFrei('quests_bearbeiten')) return '';
  return `<div class="stuetze-bereit"><span class="kachel-ic" aria-hidden="true">${icon('spross')}</span><span class="klein">${esc(artText('bereit', 'st.bereitHeute', { n: TEILZIELE.nebenAbSiegen }))}</span><button class="lesen-knopf leise" data-a="quest-bearbeiten">${esc(T('st.bereitKnopf'))}</button></div>`; // Version 93: Karte mit Knopf
}

// ---------- Quest bearbeiten: Liste und Formular ----------
export function stuetzenBearbeitenHtml() {
  const { T, jetzt, stand, ui } = kx;
  const q = ui.qe;
  const kopf = `<span class="eyebrow">${esc(T('st.titel'))}</span>`;
  if (!S.nebenFrei(stand)) {
    return `<div class="karte spalte stuetzen-bearbeiten">${kopf}<p class="klein">${esc(T('st.gesperrt', { n: TEILZIELE.nebenAbSiegen }))}</p></div>`;
  }
  const liste = S.stuetzenStand(stand, jetzt());
  const zeilen = liste.map((x, i) => {
    const frage = q.archivFrage === x.id;
    const zusatz = !x.aktiv ? (x.abTag ? T('st.ab', { datum: kurzDatum(x.abTag) }) : T('st.abSpaeter')) : x.naechsteAnzahl ? T('st.naechste', { anzahl: x.naechsteAnzahl }) : '';
    return `<div class="stuetze-zeile">
      <span class="spalte"><b>${esc(x.name)}</b><span class="klein">${esc(zeileText(T, x.zeitraum, x.ziel))}${zusatz ? ` · ${esc(zusatz)}` : ''}</span></span>
      <span class="stuetze-knoepfe">
        <button class="icon-btn" data-a="qe-st-hoch" data-id="${esc(x.id)}" aria-label="${esc(T('st.hoch', { name: x.name }))}" ${i === 0 ? 'disabled' : ''}>${icon('hoch')}</button>
        <button class="icon-btn" data-a="qe-st-runter" data-id="${esc(x.id)}" aria-label="${esc(T('st.runter', { name: x.name }))}" ${i === liste.length - 1 ? 'disabled' : ''}>${icon('runter')}</button>
        <button class="link" data-a="qe-st-bearbeiten" data-id="${esc(x.id)}">${esc(T('st.bearbeiten'))}</button>
        <button class="link ${frage ? 'warn' : ''}" data-a="qe-st-archiv" data-id="${esc(x.id)}">${esc(T(frage ? 'st.archivJa' : 'st.archivieren'))}</button>
      </span>
      ${frage ? `<p class="klein" role="status">${esc(T('st.archivFrage'))}</p>` : ''}
    </div>`;
  }).join('');
  const voll = 1 + liste.length >= TEILZIELE.max;
  let unten = '';
  if (q.st) unten = formularHtml(q.st);
  else if (voll) unten = `<p class="klein">${esc(T('st.voll', { n: TEILZIELE.max }))}</p>`;
  else unten = `${liste.length ? '' : `<p class="lead">${esc(T('st.bereit'))}</p>`}<button class="btn" data-a="qe-st-neu">${icon('spross')} ${esc(T('st.neu'))}</button>`;
  return `<div class="karte spalte stuetzen-bearbeiten">${kopf}<p class="klein">${esc(T('st.intro'))}</p>${zeilen}${unten}
    ${q.stInfo ? `<p class="klein" role="status">${esc(q.stInfo)}</p>` : ''}</div>`;
}

function formularHtml(f) {
  const { T } = kx;
  const neu = !f.id;
  const g = grenzen(ART, f.zeitraum);
  const anz = Number(f.anzahl);
  const anzahlWahl = f.zeitraum === 'runde'
    ? `<div class="wahl qe-anzahl" role="group" aria-labelledby="qe-st-anz-l">${Array.from({ length: g.max - g.min + 1 }, (_, i) => i + g.min).map(n => `<button class="opt kurz ${anz === n ? 'sel' : ''}" aria-pressed="${anz === n}" data-a="qe-st-anzahl" data-id="${n}">${n}</button>`).join('')}</div>`
    : `<input id="qe-st-zahl" type="number" inputmode="numeric" min="${g.min}" max="${g.max}" value="${Number.isInteger(anz) ? anz : ''}" ${f.fehler.anzahl ? 'aria-invalid="true"' : ''}>`;
  return `<div class="stuetze-form">
    <label class="feld"><span>${esc(T('st.name'))}</span><input id="qe-st-name" maxlength="${TEILZIELE.nameMax}" value="${esc(f.name)}" placeholder="${esc(T('st.namePlatzhalter'))}" autocomplete="off" ${f.fehler.name ? 'aria-invalid="true"' : ''}></label>
    ${f.fehler.name ? `<p class="fehler" role="alert">${esc(f.fehler.name)}</p>` : ''}
    ${neu ? `<div class="feld"><span id="qe-st-zr-l">${esc(T('st.zeitraum'))}</span><div class="wahl" role="group" aria-labelledby="qe-st-zr-l">${ART.zeitraeume.map(z => `<button class="opt kurz ${f.zeitraum === z ? 'sel' : ''}" aria-pressed="${f.zeitraum === z}" data-a="qe-st-zeitraum" data-id="${z}">${esc(T('st.zeitraum.' + z))}</button>`).join('')}</div></div>` : ''}
    <div class="feld"><span id="qe-st-anz-l">${esc(f.zeitraum === 'runde' ? T('st.anzahlRunde') : T('st.anzahlGesamt', { max: g.max }))}</span>${anzahlWahl}</div>
    ${f.fehler.anzahl ? `<p class="fehler" role="alert">${esc(f.fehler.anzahl)}</p>` : ''}
    ${neu && TEILZIELE.neuAbNaechsterRunde ? `<p class="klein">${esc(T('st.abNaechster'))}</p>` : ''}
    <div class="zwei"><button class="btn" data-a="qe-st-abbrechen">${esc(T('st.abbrechen'))}</button><button class="btn ja" data-a="qe-st-ok">${esc(T(neu ? 'st.hinzufuegen' : 'st.uebernehmen'))}</button></div>
  </div>`;
}

// Änderung speichern und Rückmeldung in der Liste zeigen. fn: () => Ergebnis mit { stand }.
function anwenden(fn, info) {
  const { render, setzeStand, speichere, ui } = kx;
  let r;
  try { r = fn(); }
  catch (e) {
    if (!(e instanceof S.StuetzeFehler)) console.warn('Stützgewohnheit:', e.message);
    if (ui.qe) ui.qe.stInfo = e.message;
    render();
    return null;
  }
  setzeStand(r.stand);
  speichere();
  const text = typeof info === 'function' ? info(r) : info || null;
  // Etappe 3: Bestätigung als Popup; ohne DOM (Rauchtest) wie bisher als Zeile im Formular
  if (ui.qe) ui.qe.stInfo = text && kx.bestaetige(text) ? null : text;
  render();
  return r;
}

export const STUETZEN_KLICKS = {
  // Heldentat: heute abhaken (ohne XP, ohne Einblendung; nur der Haken und die Zahl ändern sich)
  'stuetze-haken'({ id }) {
    const { jetzt, render, setzeHinweis, setzeStand, speichere, stand } = kx;
    let r;
    try { r = S.hakenUmschalten(stand, jetzt(), String(id || '')); }
    catch (e) { setzeHinweis(e.message); render(); return; }
    setzeStand(r.stand);
    speichere();
    trackEvent(r.an ? 'support_habit_checked' : 'support_habit_unchecked', {});
    try { if (r.an) navigator.vibrate && navigator.vibrate(10); } catch (e) { /* optional */ }
    render();
  },
  'qe-st-neu'() {
    const { render, ui } = kx;
    if (!ui.qe) return;
    ui.qe.st = { id: null, name: '', zeitraum: ART.zeitraeume[0], anzahl: grenzen(ART, ART.zeitraeume[0]).standard, fehler: {} };
    ui.qe.stInfo = null; ui.qe.archivFrage = null;
    render();
    kx.finde('#qe-st-name')?.focus();
  },
  'qe-st-bearbeiten'({ id }) {
    const { render, stand, ui } = kx;
    if (!ui.qe) return;
    const tz = nebenTeilziele(stand.quest).find(t => t.id === id);
    if (!tz) { ui.qe.stInfo = kx.T('st.fehlt'); render(); return; }
    // Vorbelegt mit dem neuesten Wert (auch eine wartende Änderung)
    const n = Array.isArray(tz.verlauf) && tz.verlauf.length ? tz.verlauf[tz.verlauf.length - 1].anzahl : tz.anzahl;
    ui.qe.st = { id: tz.id, name: tz.name || '', zeitraum: tz.zeitraum, anzahl: n, fehler: {} };
    ui.qe.stInfo = null; ui.qe.archivFrage = null;
    render();
  },
  'qe-st-zeitraum'({ id }) {
    const { render, ui } = kx;
    const f = ui.qe && ui.qe.st;
    if (!f || f.id || !ART.zeitraeume.includes(id)) return;
    if (f.zeitraum !== id) { f.zeitraum = id; f.anzahl = grenzen(ART, id).standard; f.fehler = { ...f.fehler, anzahl: undefined, zeitraum: undefined }; }
    render();
  },
  'qe-st-anzahl'({ id }) {
    const { render, ui } = kx;
    const f = ui.qe && ui.qe.st;
    if (!f) return;
    f.anzahl = Number(id); f.fehler = { ...f.fehler, anzahl: undefined };
    render();
  },
  'qe-st-abbrechen'() { const { render, ui } = kx; if (ui.qe) { ui.qe.st = null; ui.qe.stInfo = null; } render(); },
  'qe-st-ok'() {
    const { T, jetzt, render, stand, ui } = kx;
    const f = ui.qe && ui.qe.st;
    if (!f) return;
    const p = S.stuetzePruefen(f, f.id ? { mitZeitraum: false, zeitraum: f.zeitraum } : {});
    if (!p.ok) { f.fehler = p.fehler; render(); kx.finde('.stuetze-form [aria-invalid="true"]')?.focus(); return; }
    const neu = !f.id;
    const r = anwenden(
      () => (neu ? S.stuetzeAnlegen(stand, p.werte, jetzt()) : S.stuetzeAendern(stand, f.id, p.werte, jetzt())),
      x => (neu ? T(x.teilziel.seit > K.runden(x.stand, K.tagKey(jetzt())).aktuell.nr ? 'st.angelegt' : 'st.angelegtSofort', { name: x.teilziel.name })
        : x.anzahlAb === 'naechsteRunde' ? T('st.gespeichertNaechste') : T('st.gespeichert'))
    );
    if (r && ui.qe) { ui.qe.st = null; trackEvent(neu ? 'support_habit_added' : 'support_habit_edited', { zeitraum: p.werte.zeitraum, anzahl: p.werte.anzahl }); render(); }
  },
  'qe-st-hoch'({ id }) { const { stand } = kx; anwenden(() => S.stuetzeVerschieben(stand, String(id || ''), -1)); },
  'qe-st-runter'({ id }) { const { stand } = kx; anwenden(() => S.stuetzeVerschieben(stand, String(id || ''), 1)); },
  // Zweistufig wie „Neu beginnen“: erster Tipp fragt nach, zweiter archiviert
  'qe-st-archiv'({ id }) {
    const { T, jetzt, render, stand, ui } = kx;
    if (!ui.qe) return;
    if (ui.qe.archivFrage !== id) { ui.qe.archivFrage = id; ui.qe.stInfo = null; render(); return; }
    ui.qe.archivFrage = null;
    const tz = nebenTeilziele(stand.quest).find(t => t.id === id);
    const r = anwenden(() => S.stuetzeArchivieren(stand, String(id || ''), jetzt()), T('st.archiviert', { name: tz ? tz.name : '' }));
    if (r) trackEvent('support_habit_archived', {});
  }
};

export const STUETZEN_FELDER = {
  // Beim Tippen nicht neu zeichnen (Fokus bleibt), nur den Wert merken
  'qe-st-name': {
    input({ wert }) { const { ui } = kx; const f = ui.qe && ui.qe.st; if (f) f.name = String(wert ?? '').slice(0, TEILZIELE.nameMax); },
    enter() { STUETZEN_KLICKS['qe-st-ok'](); }
  },
  'qe-st-zahl': {
    input({ wert }) { const { ui } = kx; const f = ui.qe && ui.qe.st; if (f) f.anzahl = wert === '' ? NaN : Number(wert); },
    enter() { STUETZEN_KLICKS['qe-st-ok'](); }
  }
};
