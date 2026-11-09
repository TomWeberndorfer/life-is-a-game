// Plan- und Warum-Check (Version 167, 08.11.2026): leise Karte unter den Neuigkeiten und eine ruhige Seite mit zwei kurzen
// Fragen für den Helden im Fokus: „Hat dein Wenn-dann gegriffen?“ und „Gilt dein Warum noch?“. Daten: daten/plancheck.js,
// Logik: logik/plancheck.js, Modell: Eintragsart „plancheck“ (daten/eintrag-arten.js), Texte: daten/texte.js (`pc.*`, `antwort.*`).
// Zustand der Seite nur für die Sitzung: ui.plancheck = { wenndann, warum, plan, warumNeu (null = nicht angefasst), fehler }.
// Das Wenn-dann kommt aus der Vorlage der Quest und bleibt; „Manchmal“ oder „Nein“ bietet einen eigenen Plan an („Was probierst du
// stattdessen?“, steht im Eintrag und im Logbuch). Das Warum gehört dem Spieler: bei „Nicht mehr ganz“ lässt es sich neu fassen.
// Psychologie: Die Fragen gelten dem Plan, nie der Person. Kein XP, kein Zähler, nie Pflicht; „Später“ und „Diesmal nicht“ sind
// gleichwertige, kostenlose Antworten. Analytics: nur Zähler je Antwort, nie Text (Plan und Warum bleiben beim Spieler).
import { merke, merkmal, trackEvent } from '../analytics.js';
import { EINTRAG_OPT, EINTRAG_PLAN_MAX } from '../daten/eintrag-arten.js';
import { PLANCHECK } from '../daten/plancheck.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as EN from '../logik/eintraege.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import * as PC from '../logik/plancheck.js';
import * as RB from '../logik/rueckblick.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';
import { rueckblickHelden } from './rueckblick.js';

const leer = () => ({ wenndann: null, warum: null, plan: '', warumNeu: null, fehler: null });
const zustand = () => {
  const { ui } = kx;
  if (!ui.plancheck) ui.plancheck = leer();
  return ui.plancheck;
};

// Held im Fokus mit dem, was der Check zeigt, oder null (keine Quest oder nichts zu fragen). Wirft nie.
function ziel() {
  const { spiel, stand } = kx;
  try {
    if (!spiel || !spiel.fokus || !stand || !stand.quest) return null;
    const daten = PC.planDaten(stand.quest, TABELLE);
    const fragen = PC.fragenFuer(daten, PLANCHECK);
    return fragen.length ? { id: spiel.fokus, daten, fragen } : null;
  } catch (e) { console.warn('Plan-Check:', e.message); return null; }
}

// ---------- Karte (NEU_KARTEN.plancheck, leise: nur bei freiem Platz, nie wartend) ----------
// Erst der Rundenrückblick (nie beides am selben Tag); „Später“ ruht bis morgen; ohne Frage-Gegenstand keine Karte.
export function plancheckKarte() {
  const { T, jetzt, nameVon, spiel } = kx;
  try {
    const z = ziel();
    if (!z) return '';
    if (merkmal(PLANCHECK.merkmalHeute) === K.tagKey(jetzt())) return '';
    if (rueckblickHelden().length) return '';
    if (!PC.plancheckFaellig(spiel.eintraege, PLANCHECK).faellig) return '';
    return `<div class="karte spalte plancheck-karte">
      <span class="eyebrow akzent">${esc(T('pc.karte.eyebrow'))}</span>
      <span class="nm">${esc(T('pc.karte.titel'))}</span>
      <p class="klein">${esc(T('pc.karte.text', { held: nameVon(z.id) }))}</p>
      <div class="zwei"><button class="btn voll" data-a="pc-oeffnen">${esc(T('pc.karte.pruefen'))}</button><button class="btn" data-a="pc-spaeter">${esc(T('pc.karte.spaeter'))}</button></div>
    </div>`;
  } catch (e) { console.warn('Plan-Check (Karte):', e.message); return ''; }
}

// ---------- Seite ----------
function wahlHtml(frage) {
  const { T } = kx;
  const z = zustand();
  return `<div class="wahl rb-wahl" role="group" aria-label="${esc(T(frage === 'wenndann' ? 'pc.wennDann.frage' : 'pc.warum.frage'))}">${PLANCHECK.antworten[frage].map(w => `<button class="opt kurz ${z[frage] === w ? 'sel' : ''}" aria-pressed="${z[frage] === w}" data-a="pc-wahl" data-id="${esc(`${frage}|${w}`)}">${esc(T(`antwort.${frage}.${w}`))}</button>`).join('')}</div>`;
}

function wennDannHtml(z0) {
  const { T } = kx;
  const z = zustand();
  const offen = PLANCHECK.plan.includes(z.wenndann);
  return `<div class="karte spalte pc-teil">
    <h3>${esc(T('pc.wennDann.frage'))}</h3>
    <p class="klein pc-satz">${esc(T('pc.wennDann.satz', { wenn: z0.daten.wenn, dann: z0.daten.dann }))}</p>
    ${wahlHtml('wenndann')}
    ${offen ? `<label class="feld"><span>${esc(T('pc.plan'))}</span><textarea id="pc-plan" rows="2" maxlength="${EINTRAG_PLAN_MAX}" aria-label="${esc(T('pc.plan'))}">${esc(z.plan || '')}</textarea></label>
      <p class="klein">${esc(T('pc.wennDann.hinweis'))}</p>` : ''}
  </div>`;
}

function warumHtml(z0) {
  const { T } = kx;
  const z = zustand();
  const offen = PLANCHECK.warumNeu.includes(z.warum);
  const text = z.warumNeu === null ? z0.daten.warum : z.warumNeu;
  return `<div class="karte spalte pc-teil">
    <h3>${esc(T('pc.warum.frage'))}</h3>
    <p class="klein pc-satz">${esc(T('pc.warum.zeile', { warum: z0.daten.warum }))}</p>
    ${wahlHtml('warum')}
    ${offen ? `<label class="feld"><span>${esc(T('pc.warum.neu'))}</span><textarea id="pc-warum" rows="2" maxlength="${K.WARUM_MAX}" aria-label="${esc(T('pc.warum.neu'))}">${esc(text)}</textarea></label>
      <p class="klein">${esc(T('pc.warum.hinweis'))}</p>` : ''}
  </div>`;
}

export const PLANCHECK_SCREENS = {
  plancheck() {
    const { T, nameVon } = kx;
    const z0 = ziel();
    const z = zustand();
    const kopf = `<div class="start-kopf"><button class="link" data-a="pc-zurueck">${icon('zurueck')} ${esc(T('pc.zurueck'))}</button></div>`;
    if (!z0) return `<section class="screen plancheck">${kopf}<div class="inhalt"><h1>${esc(T('pc.titel'))}</h1><p class="lead">${esc(T('pc.fehler'))}</p></div></section>`;
    return `<section class="screen plancheck">
      ${kopf}
      <div class="inhalt">
        <h1>${esc(T('pc.titel'))}</h1>
        <p class="lead">${esc(T('pc.lead'))}</p>
        <span class="eyebrow">${esc(T('pc.fuer', { held: nameVon(z0.id) }))}</span>
        ${z0.fragen.includes('wenndann') ? wennDannHtml(z0) : ''}
        ${z0.fragen.includes('warum') ? warumHtml(z0) : ''}
        ${z.fehler ? `<p class="fehler" role="alert">${esc(z.fehler)}</p>` : ''}
        <button class="cta" data-a="pc-fertig">${esc(T('pc.fertig'))}</button>
        <button class="link" data-a="pc-spaeter">${esc(T('pc.spaeter'))}</button>
        <button class="link" data-a="pc-ueberspringen">${esc(T('pc.ueberspringen'))}</button>
      </div>
    </section>`;
  }
};

// ---------- Abschließen ----------
// Eintrag „plancheck“ (Antworten, optional Plan) und, wenn das Warum neu gefasst wurde, das Warum der Quest (K.questBearbeiten:
// dieselbe Regel wie „Quest bearbeiten“, Anzahl und Ziel bleiben, es gibt weder XP noch Zähler). Ohne Antwort und ohne Text gilt
// „Fertig“ wie „Diesmal nicht“: ein Eintrag ohne Inhalt, im Logbuch still, damit die Karte erst nach den nächsten Rückblicken wiederkommt.
function abschliessen(ueberspringen) {
  const { T, geheZu, jetzt, render, setzeSpiel, setzeStand, speichere, ui } = kx;
  const z = zustand();
  const z0 = ziel();
  if (!z0) { z.fehler = T('pc.fehler'); render(); return; }
  const id = z0.id;
  z.fehler = null;
  // Nur Fragen, die gestellt wurden, zählen (ein verwaister Rest aus einer früheren Seite bleibt draußen)
  const wahl = ueberspringen ? {} : { wenndann: z0.fragen.includes('wenndann') ? z.wenndann : null, warum: z0.fragen.includes('warum') ? z.warum : null, plan: z.plan };
  const eingabe = PC.eintragEingabe(wahl, PLANCHECK);
  const leerAntwort = !Object.keys(eingabe.antworten).length;
  const warumNeu = !ueberspringen && z0.fragen.includes('warum') && PLANCHECK.warumNeu.includes(z.warum)
    ? PC.warumAenderung(z0.daten.warum, z.warumNeu === null ? z0.daten.warum : z.warumNeu, K.WARUM_MAX) : { aendern: false, warum: null, fehler: null };
  if (warumNeu.fehler) { z.fehler = T('pc.warumZuLang', { max: K.WARUM_MAX }); render(); return; }
  let warumGeaendert = false;
  try {
    const r = EN.eintragHinzufuegen(kx.spiel, id, eingabe, jetzt(), { ...EINTRAG_OPT });
    setzeSpiel(r.spiel);
    if (warumNeu.aendern) {
      const st = H.ansicht(kx.spiel, id);
      const q = K.questBearbeiten(st, { ziel: st.quest.ziel, anzahl: RB.eigenesZiel(st.quest), warum: warumNeu.warum }, jetzt());
      if (q.geaendert.includes('warum')) { setzeStand(q.stand, id); warumGeaendert = true; }
    }
    speichere();
  } catch (e) {
    console.warn('Plan-Check:', e.message);
    z.fehler = e instanceof EN.EintragFehler ? e.message : T('pc.fehler');
    render();
    return;
  }
  const leise = ueberspringen || leerAntwort;
  if (leise) trackEvent('plan_check_skipped', {});
  else {
    trackEvent('plan_check_saved', {});
    for (const [f, w] of PC.antwortPaare(eingabe.antworten, PLANCHECK)) trackEvent(`plan_check_${f}_${w}`, {}); // nur Zähler je Antwort, nie Text
    if (eingabe.naechstesMal) trackEvent('plan_check_plan_added', {});
    if (warumGeaendert) trackEvent('plan_check_why_changed', {});
  }
  ui.plancheck = null;
  kx.bestaetige(T(leise ? 'pc.uebersprungen' : warumGeaendert ? 'pc.gespeichertWarum' : 'pc.gespeichert'));
  geheZu('start');
}

// ---------- Klicks ----------
export const PLANCHECK_KLICKS = {
  'pc-oeffnen'() { const { geheZu, ui } = kx; ui.plancheck = leer(); trackEvent('plan_check_opened', {}); geheZu('plancheck'); },
  // Zurück verwirft die Eingaben der Seite; die Karte bleibt (nur „Später“ lässt sie bis morgen ruhen)
  'pc-zurueck'() { const { geheZu, ui } = kx; ui.plancheck = null; geheZu('start'); },
  'pc-spaeter'() {
    const { geheZu, jetzt, render, ui } = kx;
    merke(PLANCHECK.merkmalHeute, K.tagKey(jetzt()));
    ui.plancheck = null;
    trackEvent('plan_check_later', {});
    if (ui.screen === 'plancheck') geheZu('start'); else render();
  },
  // id = „frage|wert“; erneut tippen nimmt die Antwort zurück
  'pc-wahl'({ id }) {
    const { render } = kx;
    const [frage, wert] = String(id ?? '').split('|');
    if (!PLANCHECK.fragen.includes(frage) || !PLANCHECK.antworten[frage].includes(wert)) { console.warn('Plan-Check: unbekannte Antwort', id); render(); return; }
    const z = zustand();
    z[frage] = z[frage] === wert ? null : wert;
    z.fehler = null;
    render();
  },
  'pc-ueberspringen'() { abschliessen(true); },
  'pc-fertig'() { abschliessen(false); }
};

// Tippen ohne neu zu zeichnen (Fokus bleibt); Länge begrenzt wie im Eintrag
export const PLANCHECK_FELDER = {
  'pc-plan': { input({ wert }) { const z = zustand(); z.plan = String(wert ?? '').slice(0, EINTRAG_PLAN_MAX); z.fehler = null; } },
  'pc-warum': { input({ wert }) { const z = zustand(); z.warumNeu = String(wert ?? '').slice(0, K.WARUM_MAX); z.fehler = null; } }
};
