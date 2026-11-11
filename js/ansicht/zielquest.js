// Ziel-Quests (31.10.2026, Entscheidungen Abschnitt 24): zwei Türen im Onboarding („Etwas ändern“, „Etwas erreichen“),
// Ziel und Weg wählen, Zielzeile in der Kopfleiste und eine ruhige Neuigkeit, wenn das Ziel erreicht oder der Stichtag
// vorbei ist. Daten: daten/zielvorlagen.js, Logik: logik/zielquest.js. Das Messziel selbst bearbeitet weiter das
// Messziel-Blatt (ansicht/messziele.js).
// Zustand (nur diese Sitzung): ui.zielart ('aendern'|'erreichen'), ui.zq = { vorlage, form, fehler, werte }
//   form   Feldtexte wie im Messziel-Formular { name, einheit, richtung, ziel, start, bis }
//   werte  geprüfte Werte (MZ.zielPruefen) nach „Weiter“ auf Schritt 2; daraus entsteht beim Beginnen das Messziel
import { trackEvent } from '../analytics.js';
import { EINHEIT_VORSCHLAEGE, MESSZIEL_OPT, MESSZIEL_RICHTUNGEN } from '../daten/messziele.js';
import { TABELLE } from '../daten/vorlagen.js';
import { ZIEL_EIGEN, ZIEL_TUEREN } from '../daten/zielvorlagen.js';
import { entwicklung } from '../logik/entwicklung.js';
import * as K from '../logik/kern.js';
import * as MZ from '../logik/messziele.js';
import * as ZQ from '../logik/zielquest.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';
import { MESSZIEL_KLICKS } from './messziele.js';

const heute = () => { const { jetzt } = kx; return K.tagKey(jetzt()); };
const datum = t => (MZ.tagOk(t) ? K.ausTagKey(t).toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric', year: 'numeric' }) : '');
const mitEinheit = (x, e) => `${MZ.zahlText(x)}${e ? ' ' + e : ''}`;
export const erreichenGewaehlt = () => { const { ui } = kx; return ui.zielart === 'erreichen'; };

// „mindestens 15.000 € bis 30.6.2027“ (Werte aus Formular oder Messziel)
function zielBeschreibung(w) {
  const { T } = kx;
  const basis = T(`zq.richtung.${w.richtung}`, { wert: mitEinheit(w.ziel, w.einheit) });
  return w.bis ? `${basis} · ${T('messziel.bis', { datum: datum(w.bis) })}` : basis;
}

// ---------- Onboarding ----------
// Seit Version 178 eigene Seite nach dem Bereich (obtuer): zwei Türen. „Etwas ändern“ ist vorausgewählt (bisheriger Weg, ein Tipp).
export function tuerHtml() {
  const { T, ui } = kx;
  const art = ZIEL_TUEREN.includes(ui.zielart) ? ui.zielart : ZIEL_TUEREN[0];
  return `<h1 id="f-tuer">${esc(T('zq.tuerFrage'))}</h1>
    <div class="optionen zwei-tueren" role="group" aria-labelledby="f-tuer">
      ${ZIEL_TUEREN.map(id => `<button class="opt ${art === id ? 'sel' : ''}" aria-pressed="${art === id}" data-a="zielart" data-id="${id}">${icon(id === 'erreichen' ? 'ziel' : 'pfeil')}<span>${esc(T(`zq.tuer.${id}`))}<small>${esc(T(`zq.tuer.${id}Text`))}</small></span></button>`).join('')}
    </div>`;
}

// Schritt 2 (Tür „erreichen“): Ziel-Vorlage wählen, darunter das Formular für den Messwert.
export function zielWahlHtml() {
  const { T, ui } = kx;
  const b = TABELLE.gruppen.find(x => x.id === ui.bereich);
  const ziele = ZQ.zieleFuer(ui.bereich);
  const zq = ui.zq || {};
  return `<span class="chip">${esc(b ? b.name : '')}</span>
    <h1>${esc(T('zq.zielTitel'))}</h1>
    <p class="lead">${esc(T('zq.zielText'))}</p>
    <div class="optionen" role="group" aria-label="${esc(T('zq.zielAria'))}">
      ${ziele.map(z => `<button class="opt ${zq.vorlage === z.id ? 'sel' : ''} ${z.id === 'eigen' ? 'leise' : ''}" aria-pressed="${zq.vorlage === z.id}" data-a="zq-vorlage" data-id="${esc(z.id)}"><span>${esc(z.name)}<small>${esc(z.text)}</small></span></button>`).join('')}
    </div>
    ${zq.vorlage ? formHtml(zq) : ''}`;
}
// Formular (seit Version 178): sichtbar sind nur Zielwert und Einheit (beim eigenen Ziel auch Name und Einheiten-Vorschläge);
// Name, Richtung, Startwert und Datum stehen unter „Genauer festlegen“. Das Feld zum Zielwert heißt nach der Richtung
// („Mindestens“ / „Höchstens“), damit sie auch zugeklappt sichtbar ist. Fehler in einem verborgenen Feld klappen es auf.
function formHtml(zq) {
  const { T } = kx;
  const f = zq.form;
  const fe = zq.fehler || {};
  const eigen = zq.vorlage === ZIEL_EIGEN.id;
  const fehler = k => (fe[k] ? `<p class="fehler" role="alert">${esc(fe[k])}</p>` : '');
  const inv = k => (fe[k] ? 'aria-invalid="true"' : '');
  const an = x => `class="opt kurz ${x ? 'sel' : ''}" aria-pressed="${x}"`;
  const name = `<label class="feld"><span>${esc(T('zq.feld.name'))}</span><input id="zq-name" maxlength="${MESSZIEL_OPT.nameMax}" value="${esc(f.name)}" placeholder="${esc(T('messziel.feld.nameBeispiel'))}" autocomplete="off" ${inv('name')}></label>${fehler('name')}`;
  const richtung = MESSZIEL_RICHTUNGEN.includes(f.richtung) ? f.richtung : MESSZIEL_RICHTUNGEN[0];
  const offen = !!zq.offen || ['richtung', 'start', 'bis'].some(k => fe[k]) || (!eigen && !!fe.name);
  return `<div class="karte spalte zq-form">
    ${eigen ? name : ''}
    <div class="zwei messziel-zahlen">
      <label class="feld"><span>${esc(T('messziel.richtung.' + richtung))}</span><input id="zq-ziel" inputmode="decimal" value="${esc(f.ziel)}" placeholder="${esc(T('messziel.feld.ziel'))}" autocomplete="off" ${inv('ziel')}></label>
      <label class="feld"><span>${esc(T('messziel.feld.einheit'))}</span><input id="zq-einheit" maxlength="${MESSZIEL_OPT.einheitMax}" value="${esc(f.einheit)}" autocomplete="off" ${inv('einheit')}></label>
    </div>${fehler('ziel')}${fehler('einheit')}
    ${eigen ? `<div class="wahl messziel-einheiten" role="group" aria-label="${esc(T('messziel.feld.einheitAria'))}">${EINHEIT_VORSCHLAEGE.map(e => `<button ${an(f.einheit === e)} data-a="zq-einheit" data-id="${esc(e)}">${esc(e)}</button>`).join('')}</div>` : ''}
    <details class="einw-mehr zq-genauer" ${offen ? 'open' : ''}><summary data-a="zq-genauer">${esc(T('zq.genauer'))}</summary>
      <div class="spalte">
      ${eigen ? '' : name}
      <div class="feld"><span id="zq-r-l">${esc(T('messziel.feld.richtung'))}</span>
        <div class="wahl" role="group" aria-labelledby="zq-r-l">${MESSZIEL_RICHTUNGEN.map(r => `<button ${an(f.richtung === r)} data-a="zq-richtung" data-id="${r}">${esc(T('messziel.richtung.' + r))}</button>`).join('')}</div></div>${fehler('richtung')}
      <label class="feld"><span>${esc(T('zq.feld.start'))}</span><input id="zq-start" inputmode="decimal" value="${esc(f.start)}" autocomplete="off" ${inv('start')}></label>${fehler('start')}
      <label class="feld"><span>${esc(T('messziel.feld.bis'))}</span><input id="zq-bis" type="date" value="${esc(f.bis)}" ${inv('bis')}></label>${fehler('bis')}
      <p class="klein">${esc(T('zq.formHinweis'))}</p>
      </div>
    </details>
  </div>`;
}
// Weiter auf Schritt 2 erlaubt? (Ziel gewählt und Zielwert eingetippt; die volle Prüfung macht pruefeZielWahl)
export const zielWahlBereit = () => { const { ui } = kx; return !!(ui.zq && ui.zq.vorlage && String(ui.zq.form.ziel).trim()); };
// Beim „Weiter“ von Schritt 2: Formular prüfen. ok → Werte merken und Quest-Titel vorschlagen; sonst Fehler zeigen.
export function pruefeZielWahl() {
  const { ui } = kx;
  const zq = ui.zq;
  if (!zq || !zq.vorlage) return false;
  const p = MZ.zielPruefen(zq.form, heute());
  zq.fehler = p.fehler || {};
  if (!p.ok) { zq.werte = null; return false; }
  zq.werte = p.werte;
  const zv = ZQ.zielVorlage(zq.vorlage, ui.bereich);
  // Titel der Quest: Name der Vorlage, beim eigenen Ziel der Name des Messziels (bleibt später änderbar)
  ui.ziel = String(zv && zv.id !== 'eigen' ? zv.name : p.werte.name).slice(0, K.ZIEL_MAX);
  ui.freitext = '';
  return true;
}

// Schritt 3 (Tür „erreichen“): Weg wählen, also die Gewohnheit, die jede Runde zählt.
export function wegWahlHtml(belegt) {
  const { T, nameVon, ui } = kx;
  const zq = ui.zq || {};
  const zv = ZQ.zielVorlage(zq.vorlage, ui.bereich);
  const wege = ZQ.wegeFuer(zv, ui.bereich, TABELLE);
  const w = zq.werte;
  return `${w ? `<span class="chip gut">${esc(T('zq.chip', { name: w.name }))}</span><p class="klein">${esc(zielBeschreibung(w))}</p>` : ''}
    <h1 class="mittel">${esc(T('zq.wegTitel'))}</h1>
    <p class="lead">${esc(T('zq.wegText'))}</p>
    <div class="optionen" role="group" aria-label="${esc(T('zq.wegAria'))}">
      ${wege.map(({ vorlage: v, empfohlen }) => {
        const f = TABELLE.faehigkeiten[v.faehigkeit];
        if (belegt(ui.bereich, v.problem)) return `<button class="opt belegt" disabled><span>${esc(f.name)}<small>${esc(T('ob.heldDabei', { held: nameVon(v.held) }))}</small></span></button>`;
        const sel = ui.problem === v.problem;
        return `<button class="opt ${sel ? 'sel' : ''}" aria-pressed="${sel}" data-a="zq-weg" data-id="${esc(v.id)}">${sel ? icon('check') : ''}<span>${esc(f.name)}${empfohlen ? ` <em class="zq-passt">${esc(T('zq.passt'))}</em>` : ''}<small>${esc(f.kurz)}</small></span></button>`;
      }).join('')}
    </div>`;
}
// Kleine Zeile auf dem letzten Schritt: woran die Quest arbeitet.
export function zielVorschauHtml() {
  const { T, ui } = kx;
  const w = erreichenGewaehlt() && ui.zq && ui.zq.werte;
  return w ? `<p class="klein mitte-text zq-vorschau">${icon('ziel')} ${esc(T('zq.vorschau', { name: w.name, ziel: zielBeschreibung(w) }))}</p>` : '';
}

// ---------- Startseite ----------
// Zielzeile in der Kopfleiste (nur bei Ziel-Quests): „Ziel: mindestens 15.000 € · bis 30.6.2027 · noch 3.000 €“.
// Tipp öffnet das Messziel-Blatt. Neutral (Abstand statt Bewertung, kein Rot), wie die Messziele.
export function zielZeileHtml() {
  const { T } = kx;
  const st = safeStatus();
  if (!st) return '';
  const { ziel: z, f } = st;
  const teile = [zielBeschreibung(z)];
  if (f.erreichtJetzt) teile.push(T('zq.zeileErreicht'));
  else if (f.abstand !== null) teile.push(T('zq.zeileNoch', { abstand: mitEinheit(f.abstand, z.einheit) }));
  return `<button class="link quest-ziel" data-a="messziel-oeffnen" aria-label="${esc(T('zq.zeileAria', { name: z.name }))}">${icon('ziel')}<span>${esc(`${z.name}: ${teile.join(' · ')}`)}</span></button>`;
}
function safeStatus() {
  const { spiel } = kx;
  try { return spiel && spiel.fokus ? ZQ.zielStatus(spiel, spiel.fokus, heute()) : null; }
  catch (e) { console.warn('Ziel-Quest:', e.message); return null; }
}

// Neuigkeit (NEU_PLATZ): Ziel erreicht (Entscheidung 14) oder Stichtag vorbei (Entscheidung 13). Ruhig, nie Rot.
export function zielstandKarte() {
  const { T, jetzt, stand } = kx;
  const st = safeStatus();
  if (!st || st.art === 'laeuft') return '';
  const z = st.ziel;
  if (st.art === 'erreicht') {
    let e = null;
    try { e = stand.quest ? entwicklung(stand, jetzt()) : null; } catch (err) { console.warn('Ziel-Quest:', err.message); }
    const v = TABELLE.vorlagen.find(x => x.id === (stand.quest && stand.quest.vorlageId));
    const f = v && TABELLE.faehigkeiten[v.faehigkeit];
    const weg = e ? T('zq.erreicht.weg', { runden: e.rundenGesamt, siege: e.siege, n: e.anwendungen, verb: f ? f.verb : '' }) : '';
    return `<div class="karte spalte zq-karte zq-erreicht" role="status">
      <span class="eyebrow gut-text">${icon('stern')} ${esc(T('zq.erreicht.eyebrow'))}</span>
      <p class="nm">${esc(T('zq.erreicht.titel', { name: z.name }))}</p>
      ${weg ? `<p class="klein">${esc(weg)}</p>` : ''}
      <p class="klein">${esc(T('zq.erreicht.frage'))}</p>
      <div class="zwei"><button class="btn ja" data-a="zq-weiterfuehren">${esc(T('zq.erreicht.halten'))}</button><button class="btn" data-a="zq-neues-ziel">${esc(T('zq.erreicht.neu'))}</button></div>
    </div>`;
  }
  const weg = st.f.anteil !== null ? T('zq.ueber.anteil', { pct: Math.round(100 * st.f.anteil) }) : '';
  return `<div class="karte spalte zq-karte zq-ueber">
    <span class="eyebrow">${icon('kalender')} ${esc(T('zq.ueber.eyebrow'))}</span>
    <p class="nm">${esc(T('zq.ueber.titel', { name: z.name, datum: datum(z.bis) }))}</p>
    <p class="klein">${esc([T('zq.ueber.text'), weg].filter(Boolean).join(' '))}</p>
    <div class="zwei"><button class="btn" data-a="zq-anpassen">${esc(T('zq.ueber.anpassen'))}</button><button class="btn" data-a="zq-ohne-datum">${esc(T('zq.ueber.ohne'))}</button></div>
  </div>`;
}

// ---------- Aktionen ----------
function aendereSpiel(fn, ereignis) {
  const { render, setzeSpiel, speichere, spiel, setzeHinweis } = kx;
  try {
    setzeSpiel(fn(spiel));
    speichere();
    if (ereignis) trackEvent(ereignis, {});
    return true;
  } catch (e) {
    console.warn('Ziel-Quest:', e.message);
    if (typeof setzeHinweis === 'function') setzeHinweis(e instanceof ZQ.ZielquestFehler || e instanceof MZ.MesszielFehler ? e.message : 'Das hat nicht geklappt.');
    render();
    return false;
  }
}
// Messziel-Blatt direkt im Formular des verknüpften Ziels öffnen.
function zielBearbeiten() {
  const { spiel } = kx;
  const z = spiel.fokus ? ZQ.zielVon(spiel, spiel.fokus) : null;
  if (!z) return;
  MESSZIEL_KLICKS['messziel-oeffnen']();
  MESSZIEL_KLICKS['messziel-bearbeiten']({ id: z.id });
}

export const ZIELQUEST_KLICKS = {
  zielart({ id }) {
    const { render, ui } = kx;
    if (!ZIEL_TUEREN.includes(id) || ui.zielart === id) return;
    Object.assign(ui, { zielart: id, problem: null, ziel: null, freitext: '', zq: null });
    render();
  },
  'zq-vorlage'({ id }) {
    const { render, ui } = kx;
    const zv = ZQ.zielVorlage(id, ui.bereich);
    if (!zv) { console.warn('Ziel-Quest: unbekannte Ziel-Vorlage', id); return; }
    if (ui.zq && ui.zq.vorlage === id) return;
    ui.zq = { vorlage: id, form: ZQ.formAus(zv), fehler: {}, werte: null, offen: false };
    render();
  },
  'zq-richtung'({ id }) { const { render, ui } = kx; if (ui.zq && MESSZIEL_RICHTUNGEN.includes(id)) { ui.zq.form.richtung = id; ui.zq.offen = true; ui.zq.fehler = { ...ui.zq.fehler, richtung: undefined }; render(); } },
  // „Genauer festlegen“ (Version 178): das <details> klappt selbst; hier nur merken, damit es nach dem nächsten Zeichnen so bleibt.
  'zq-genauer'() { const { ui } = kx; if (ui.zq) ui.zq.offen = !ui.zq.offen; },
  'zq-einheit'({ id }) { const { render, ui } = kx; if (ui.zq && EINHEIT_VORSCHLAEGE.includes(id)) { ui.zq.form.einheit = ui.zq.form.einheit === id ? '' : id; render(); } },
  'zq-weg'({ id }) {
    const { render, ui } = kx;
    const v = TABELLE.vorlagen.find(x => x.id === id && x.gruppe === ui.bereich);
    if (!v) { console.warn('Ziel-Quest: unbekannter Weg', id); return; }
    ui.problem = v.problem;
    render();
  },
  'zq-weiterfuehren'() { const { render, spiel } = kx; if (aendereSpiel(s => ZQ.feierBestaetigen(s, spiel.fokus), 'goal_outcome_kept')) render(); },
  'zq-neues-ziel'() { const { spiel } = kx; if (aendereSpiel(s => ZQ.feierBestaetigen(s, spiel.fokus), 'goal_outcome_new')) zielBearbeiten(); },
  'zq-anpassen'() { trackEvent('goal_overdue_adjust', {}); zielBearbeiten(); },
  'zq-ohne-datum'() { const { render, spiel } = kx; if (aendereSpiel(s => ZQ.ohneDatum(s, spiel.fokus), 'goal_overdue_nodate')) render(); }
};

// Felder: tippen ohne neu zu zeichnen (Fokus bleibt); „Weiter“ wird direkt freigeschaltet.
function weiterKnopf() { const { finde } = kx; const btn = finde('.fuss .cta'); if (btn) btn.disabled = !zielWahlBereit(); }
const formFeld = k => ({ input({ wert }) { const { ui } = kx; if (ui.zq) { ui.zq.form[k] = String(wert ?? ''); weiterKnopf(); } } });
export const ZIELQUEST_FELDER = {
  'zq-name': formFeld('name'),
  'zq-einheit': formFeld('einheit'),
  'zq-ziel': formFeld('ziel'),
  'zq-start': formFeld('start'),
  'zq-bis': { change({ wert }) { const { ui } = kx; if (ui.zq) ui.zq.form.bis = String(wert ?? ''); } }
};
