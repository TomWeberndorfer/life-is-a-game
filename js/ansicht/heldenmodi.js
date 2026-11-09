// Heldenmodi (04.11.2026): Auswahl im Charakterbogen, Tauschfrage bei vollem Fokus und Rastkarte auf der Startseite.
// Regeln: daten/heldenmodi.js, Logik: logik/heldenmodi.js. Namen je Stil: wort(modus_<id>), Erklärung in texte.js unter modus.<id>.text.
// Zustand: ui.modusTausch = { heroId } (Tauschfrage offen), ui.modusInfo = Text unter der Auswahl (nur diese Sitzung).
// Psychologie: Die Wahl ist eine Energie-Entscheidung, kein Aufgeben. Darum kein Rot, kein „verpasst“, und die Rastkarte
// sagt ausdrücklich, dass Treffer und Siege bleiben.
import { trackEvent } from '../analytics.js';
import { HELDENMODI, MINDEST } from '../daten/heldenmodi.js';
import * as HM from '../logik/heldenmodi.js';
import * as K from '../logik/kern.js';
import * as M from '../logik/mindest.js'; // Mindestaufgabe im Erhalt (04.11.2026)
import { akkusativ, esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { vorsatzZeileHtml } from './wochenrunde.js'; // Vorsatz der Woche auch auf der Rastkarte (05.11.2026)

const modusName = m => kx.wort(`modus_${m}`) || m;
// Modus des Helden heute (Pause zählt ab dem Tag des Wechsels) und gewählter Modus (kann erst morgen beginnen).
export function modusHeute(heroId) {
  const { jetzt, spiel } = kx;
  try { return HM.modusAm(spiel, heroId, K.tagKey(jetzt())); } catch (e) { console.warn('Heldenmodus:', e.message); return HELDENMODI.standard; }
}
export const pausiertHeute = heroId => HM.istPausiert(modusHeute(heroId));

// Tauschfrage: wer macht Platz im Fokus? Leer, wenn keine Frage offen ist.
function tauschHtml() {
  const { T, img, nameVon, spiel, ui } = kx;
  const t = ui.modusTausch;
  if (!t) return '';
  const fokus = HM.fokusHelden(spiel).filter(id => id !== t.heroId);
  if (!fokus.length) { ui.modusTausch = null; return ''; }
  const werte = { fokus: modusName('fokus'), erhalt: modusName(HELDENMODI.neuOhnePlatz), max: HELDENMODI.fokusMax };
  return `<div class="modus-tausch" role="group" aria-labelledby="modus-tausch-t">
    <p class="klein" id="modus-tausch-t">${esc(T('modus.voll', werte))}</p>
    ${fokus.map(id => `<button class="btn modus-tausch-held" data-a="modus-tausch" data-id="${esc(id)}">${img(id, nameVon(id), 'held', 'wahl-bild', '')}<span>${esc(T('modus.tausch', { ...werte, held: nameVon(id) }))}</span></button>`).join('')}
    <button class="link" data-a="modus-tausch-zu">${esc(T('modus.tauschZu'))}</button>
  </div>`;
}
const infoHtml = () => (kx.ui.modusInfo ? `<p class="klein modus-info" role="status">${esc(kx.ui.modusInfo)}</p>` : '');

// ---------- Pause mit Rückkehr-Datum (09.11.2026, Urlaub und Krankheit) ----------
// Zustand: ui.modusBis = { heroId, modus, rueck, alle, fehler } (Formular offen; rueck = erster Tag zurück, „YYYY-MM-DD“).
// Im Verlauf steht `bis` = letzter Pausentag = rueck − 1. Psychologie: Ein geplantes Ende nimmt der Pause die Unsicherheit („Wann
// fange ich wieder an?“) und das schlechte Gewissen; der Neuanfang kommt von selbst (ruhige Seite „Willkommen zurück“ statt Aufholen).
function bisFormHtml(f) {
  const { T, jetzt, nameVon, spiel } = kx;
  const heute = K.tagKey(jetzt());
  const knopf = m => `<button class="opt kurz ${f.modus === m ? 'sel' : ''}" aria-pressed="${f.modus === m}" data-a="modus-bis-modus" data-id="${esc(m)}">${esc(modusName(m))}</button>`;
  const werte = { held: nameVon(f.heroId), fokus: modusName(HELDENMODI.standard), erhalt: modusName(HELDENMODI.neuOhnePlatz) };
  return `<div class="stuetze-form modus-bis-form">
    <div class="feld"><span id="modus-bis-m">${esc(T('modus.rueckkehr.frageModus', werte))}</span><div class="wahl" role="group" aria-labelledby="modus-bis-m">${HELDENMODI.pausiert.map(knopf).join('')}</div></div>
    <label class="feld"><span>${esc(T('modus.rueckkehr.frage'))}</span><input id="modus-bis" type="date" min="${esc(HM.plusTage(heute, 1))}" max="${esc(HM.plusTage(heute, HELDENMODI.bisMaxTage + 1))}" value="${esc(f.rueck)}" ${f.fehler ? 'aria-invalid="true"' : ''}></label>
    ${f.fehler ? `<p class="fehler" role="alert">${esc(f.fehler)}</p>` : ''}
    ${spiel.helden.length > 1 ? `<button class="opt kurz ${f.alle ? 'sel' : ''}" aria-pressed="${f.alle}" data-a="modus-bis-alle">${esc(T('modus.rueckkehr.alle'))}</button>` : ''}
    <p class="klein">${esc(T('modus.rueckkehr.hinweis', werte))}</p>
    <div class="zwei"><button class="btn" data-a="modus-bis-abbrechen">${esc(T('modus.rueckkehr.abbrechen'))}</button><button class="btn ja" data-a="modus-bis-ok">${esc(T('modus.rueckkehr.ok'))}</button></div>
  </div>`;
}
function bisAbschnittHtml(heroId) {
  const { T, nameVon, spiel, ui } = kx;
  const f = ui.modusBis && ui.modusBis.heroId === heroId ? ui.modusBis : null;
  if (f) return bisFormHtml(f);
  const p = HM.pauseBis(spiel, heroId);
  if (p) {
    return `<div class="modus-bis"><p class="klein">${esc(T('modus.rueckkehr.bis', { held: nameVon(heroId), datum: kurzDatum(p.rueckkehr), modus: modusName(p.davor) }))}</p>
      <div class="zwei"><button class="link" data-a="modus-bis-neu">${esc(T('modus.rueckkehr.aendern'))}</button><button class="link" data-a="modus-bis-weg">${esc(T('modus.rueckkehr.weg'))}</button></div></div>`;
  }
  return `<button class="link" data-a="modus-bis-neu">${esc(T('modus.rueckkehr.neu'))}</button>`;
}

// Abschnitt „Energie“ im Charakterbogen des Helden im Rampenlicht.
export function modusAbschnittHtml(heroId) {
  const { T, nameVon, spiel } = kx;
  if (!heroId || !spiel.helden.some(h => h.heroId === heroId)) return '';
  const gewaehlt = HM.modusGewaehlt(spiel, heroId);
  const knopf = m => `<button class="opt modus-opt ${gewaehlt === m ? 'sel' : ''}" aria-pressed="${gewaehlt === m}" data-a="modus-wahl" data-id="${esc(m)}">
      <b>${esc(modusName(m))}</b><span class="klein">${esc(T(`modus.${m}.text`))}</span></button>`;
  return `<section class="bogen-abschnitt modus-abschnitt"><span class="eyebrow">${esc(T('modus.eyebrow'))}</span>
    <p class="klein">${esc(T('modus.frage', { held: nameVon(heroId) }))}</p>
    <div class="modus-wahl" role="group" aria-label="${esc(T('modus.eyebrow'))}">${HELDENMODI.modi.map(knopf).join('')}</div>
    ${infoHtml()}${tauschHtml()}${bisAbschnittHtml(heroId)}</section>
    ${mindestBogenHtml(heroId)}`;
}

// Startseite: statt der Kampfbühne, wenn der gewählte Held heute pausiert. Gegner und Runde bleiben sichtbar, aber still.
export function rastHtml({ v, g, a }) {
  const { T, img, nameVon, spiel } = kx;
  const id = spiel.fokus;
  const m = modusHeute(id);
  const held = nameVon(id);
  const runde = a.treffer ? T('rast.treffer', { n: a.treffer, anzahl: a.anzahl }) : '';
  return `<section class="karte rast" aria-labelledby="rast-t">
    <div class="rast-kopf">${img(v.held, held, 'held', 'rast-bild', '')}
      <span class="spalte"><span class="eyebrow">${esc(modusName(m).toUpperCase())}</span><h2 id="rast-t" class="nm gross-nm">${esc(T(`rast.titel.${m}`, { held }))}</h2></span></div>
    <p class="klein">${esc(T('rast.text', { held, gegner: g ? akkusativ(g.name) : '', fokus: modusName('fokus') }))}${runde ? ` ${esc(runde)}` : ''}</p>
    ${rastRueckkehrHtml(id)}${mindestRastHtml(id)}${vorsatzZeileHtml(id)}
    <div class="zwei"><button class="btn voll" data-a="modus-wahl" data-id="${esc(HELDENMODI.standard)}">${esc(T('rast.zurueck', { fokus: modusName('fokus') }))}</button><button class="btn" data-a="blatt" data-id="crew">${esc(T('rast.aendern'))}</button></div>
    ${infoHtml()}${tauschHtml()}
  </section>`;
}

// Rastkarte: „Zurück am …“, wenn die Pause ein Rückkehr-Datum hat ('' sonst).
function rastRueckkehrHtml(heroId) {
  const { T, spiel } = kx;
  const p = HM.pauseBis(spiel, heroId);
  return p ? `<p class="klein">${esc(T('rast.rueckkehr', { datum: kurzDatum(p.rueckkehr) }))}</p>` : '';
}

// Hinweis nach dem Anlegen eines Helden, der ohne Platz im Fokus startet ('' = startet im Fokus).
export function neuImErhaltText(heroId) {
  const { T, nameVon, spiel } = kx;
  const m = HM.modusGewaehlt(spiel, heroId);
  return m === HELDENMODI.standard ? '' : T('modus.neuOhnePlatz', { held: nameVon(heroId), modus: modusName(m), fokus: modusName('fokus'), max: HELDENMODI.fokusMax });
}

function anwenden(r, heroId) {
  const { T, jetzt, nameVon, setzeSpiel, speichere, ui } = kx;
  setzeSpiel(r.spiel); speichere();
  const m = HM.modusGewaehlt(r.spiel, heroId);
  ui.modusTausch = null;
  ui.modusInfo = r.ab && r.ab > K.tagKey(jetzt()) ? T('modus.abMorgen', { held: nameVon(heroId), modus: modusName(m) }) : T('modus.gesetzt', { held: nameVon(heroId), modus: modusName(m) });
  trackEvent('hero_mode_set', { modus: m, fokus: HM.fokusHelden(r.spiel).length });
}

// ---------- Mindestaufgabe im Erhalt (04.11.2026) ----------
// Zustand: ui.mindestForm = { heroId, taetigkeit, anzahl, zeitraum, zaehltFuer, fehler } (Formular im Bogen offen),
// ui.mindestInfo = Rückmeldung (nur ohne Popup). Logik: logik/mindest.js.
function mindestStandVon(heroId) {
  const { jetzt, spiel } = kx;
  return M.mindestStand(spiel, heroId, jetzt());
}
const mindestInfoHtml = () => (kx.ui.mindestInfo ? `<p class="klein modus-info" role="status">${esc(kx.ui.mindestInfo)}</p>` : '');

// Fortschritt und Haken (Bogen und Rastkarte). Ohne Aufgabe ''.
function mindestFortschrittHtml(st) {
  const { T } = kx;
  const a = st.aufgabe;
  if (!a) return '';
  if (st.startetMorgen) return `<p class="klein">${esc(T('mindest.abMorgen', { taetigkeit: a.taetigkeit, erhalt: modusName(HELDENMODI.neuOhnePlatz) }))}</p>`;
  if (!st.aktiv) return '';
  const punkte = Array.from({ length: st.ziel }, (_, i) => `<i class="${i < st.geschafft ? 'voll' : ''}"></i>`).join('');
  return `<div class="mindest-stand">
    <p class="nm">${esc(a.taetigkeit)}</p>
    <div class="segmente" role="img" aria-label="${esc(T('mindest.zeile', { n: st.geschafft, anzahl: st.ziel, bis: kurzDatum(st.periode.bis) }))}">${punkte}</div>
    <p class="klein">${esc(T('mindest.zeile', { n: st.geschafft, anzahl: st.ziel, bis: kurzDatum(st.periode.bis) }))}${st.zaehltFuerName ? ` ${esc(T('mindest.mitStuetze', { name: st.zaehltFuerName }))}` : ''}</p>
    <button class="btn ${st.heute ? '' : 'ja'}" data-a="mindest-haken" aria-pressed="${st.heute}">${st.heute ? `${icon('check')} ${esc(T('mindest.hakenAn'))}` : esc(T('mindest.haken'))}</button>
  </div>`;
}

function mindestFormHtml(f) {
  const { T, jetzt, spiel } = kx;
  const r = MINDEST.zeitraeume[f.zeitraum];
  const stuetzen = M.stuetzenFuer(spiel, f.heroId, jetzt());
  const fehler = k => (f.fehler && f.fehler[k] ? `<p class="fehler" role="alert">${esc(f.fehler[k])}</p>` : '');
  const zrKnopf = (id, sel, text) => `<button class="opt kurz ${sel ? 'sel' : ''}" aria-pressed="${sel}" data-a="mindest-zeitraum" data-id="${esc(id)}">${esc(text)}</button>`;
  const linkKnopf = (id, sel, text) => `<button class="opt kurz ${sel ? 'sel' : ''}" aria-pressed="${sel}" data-a="mindest-link" data-id="${esc(id)}">${esc(text)}</button>`;
  const anz = Number(f.anzahl);
  return `<div class="stuetze-form mindest-form">
    <label class="feld"><span>${esc(T('mindest.taetigkeit'))}</span><input id="mindest-taetigkeit" maxlength="${MINDEST.taetigkeitMax}" value="${esc(f.taetigkeit)}" placeholder="${esc(T('mindest.platzhalter'))}" autocomplete="off" ${f.fehler && f.fehler.taetigkeit ? 'aria-invalid="true"' : ''}></label>
    ${fehler('taetigkeit')}
    <div class="feld"><span id="mindest-zr-l">${esc(T('mindest.zeitraum'))}</span><div class="wahl" role="group" aria-labelledby="mindest-zr-l">${Object.keys(MINDEST.zeitraeume).map(z => zrKnopf(z, f.zeitraum === z, T(`mindest.zeitraum.${z}`))).join('')}</div></div>
    ${fehler('zeitraum')}
    <label class="feld"><span>${esc(T('mindest.anzahl', { max: r ? r.max : '' }))}</span><input id="mindest-anzahl" type="number" inputmode="numeric" min="${MINDEST.anzahlMin}" max="${r ? r.max : ''}" value="${Number.isInteger(anz) ? anz : ''}" ${f.fehler && f.fehler.anzahl ? 'aria-invalid="true"' : ''}></label>
    ${fehler('anzahl')}
    ${stuetzen.length ? `<div class="feld"><span id="mindest-link-l">${esc(T('mindest.zaehltFuer'))}</span><div class="wahl" role="group" aria-labelledby="mindest-link-l">${linkKnopf('', !f.zaehltFuer, T('mindest.nurSich'))}${stuetzen.map(x => linkKnopf(x.id, f.zaehltFuer === x.id, x.name)).join('')}</div></div>${fehler('zaehltFuer')}` : ''}
    <p class="klein">${esc(T('mindest.abWechsel', { erhalt: modusName(HELDENMODI.neuOhnePlatz) }))}</p>
    <div class="zwei"><button class="btn" data-a="mindest-abbrechen">${esc(T('mindest.abbrechen'))}</button><button class="btn ja" data-a="mindest-ok">${esc(T('mindest.uebernehmen'))}</button></div>
  </div>`;
}

// Abschnitt im Charakterbogen, nur wenn der gewählte Modus eine Mindestaufgabe kennt (Erhalt).
export function mindestBogenHtml(heroId) {
  const { T, nameVon, ui } = kx;
  const st = mindestStandVon(heroId);
  if (!st.gilt) return '';
  const f = ui.mindestForm && ui.mindestForm.heroId === heroId ? ui.mindestForm : null;
  let inhalt;
  if (f) inhalt = mindestFormHtml(f);
  else if (st.aufgabe) inhalt = `${mindestFortschrittHtml(st)}<div class="zwei"><button class="link" data-a="mindest-neu">${esc(T('mindest.aendern'))}</button><button class="link" data-a="mindest-entfernen">${esc(T('mindest.entfernen'))}</button></div>`;
  else inhalt = `<p class="klein">${esc(T('mindest.intro'))}</p><button class="btn" data-a="mindest-neu">${esc(T('mindest.festlegen'))}</button>`;
  return `<section class="bogen-abschnitt mindest-abschnitt"><span class="eyebrow">${esc(T('mindest.eyebrow'))}</span>
    <p class="klein">${esc(T('mindest.frage', { held: nameVon(heroId) }))}</p>${inhalt}${mindestInfoHtml()}</section>`;
}

// Rastkarte: Fortschritt mit Haken, ohne Aufgabe ein Knopf zum Festlegen (öffnet den Bogen mit dem Formular).
export function mindestRastHtml(heroId) {
  const { T } = kx;
  const st = mindestStandVon(heroId);
  if (!st.gilt) return '';
  if (!st.aufgabe) return `<div class="mindest-stand"><p class="klein">${esc(T('mindest.leer'))}</p><button class="btn" data-a="mindest-neu">${esc(T('mindest.festlegen'))}</button></div>`;
  return `${mindestFortschrittHtml(st)}${mindestInfoHtml()}`;
}

function mindestMelde(text) {
  const { bestaetige, ui } = kx;
  ui.mindestInfo = text && bestaetige(text) ? null : text;
}

// ---------- Klicks ----------
export const HELDENMODI_KLICKS = {
  'modus-wahl'({ id }) {
    const { T, jetzt, render, spiel, ui } = kx;
    const heroId = spiel.fokus;
    ui.modusInfo = null; ui.modusTausch = null;
    try {
      const r = HM.modusSetzen(spiel, heroId, id, K.tagKey(jetzt()));
      if (r.geaendert) anwenden(r, heroId);
      else ui.modusInfo = T('modus.gesetzt', { held: kx.nameVon(heroId), modus: modusName(id) }); // schon gewählt: bestätigen
    } catch (e) {
      if (e instanceof HM.ModusFehler && e.code === 'voll') ui.modusTausch = { heroId };
      else if (e instanceof HM.ModusFehler && e.code === 'letzter') ui.modusInfo = T('modus.letzter', { fokus: modusName('fokus') });
      else { console.warn('Heldenmodus:', e.message); ui.modusInfo = T('modus.fehler'); }
    }
    render();
  },
  'modus-tausch'({ id }) {
    const { T, jetzt, render, spiel, ui } = kx;
    const t = ui.modusTausch;
    if (!t) { render(); return; }
    try { anwenden(HM.modusTauschen(spiel, t.heroId, id, K.tagKey(jetzt())), t.heroId); }
    catch (e) { console.warn('Heldenmodus (Tausch):', e.message); ui.modusTausch = null; ui.modusInfo = T('modus.fehler'); }
    render();
  },
  'modus-tausch-zu'() { const { render, ui } = kx; ui.modusTausch = null; render(); },
  // Pause mit Rückkehr-Datum: Formular öffnen (neu oder Datum ändern), Modus und „alle“ wählen, übernehmen, Datum entfernen
  'modus-bis-neu'() {
    const { render, spiel, ui } = kx;
    const heroId = spiel.fokus;
    const gewaehlt = HM.modusGewaehlt(spiel, heroId);
    const p = HM.pauseBis(spiel, heroId);
    ui.modusInfo = null; ui.modusTausch = null;
    ui.modusBis = { heroId, modus: HM.istPausiert(gewaehlt) ? gewaehlt : 'ruhe', rueck: p ? p.rueckkehr : '', alle: false, fehler: null };
    render();
  },
  'modus-bis-modus'({ id }) {
    const { render, ui } = kx;
    if (ui.modusBis && HELDENMODI.pausiert.includes(id)) { ui.modusBis.modus = id; ui.modusBis.fehler = null; } else console.warn('Pause mit Datum: ungültiger Modus', id);
    render();
  },
  'modus-bis-alle'() { const { render, ui } = kx; if (ui.modusBis) ui.modusBis.alle = !ui.modusBis.alle; render(); },
  'modus-bis-abbrechen'() { const { render, ui } = kx; ui.modusBis = null; render(); },
  'modus-bis-ok'() {
    const { T, jetzt, nameVon, render, setzeSpiel, speichere, spiel, ui } = kx;
    const f = ui.modusBis;
    if (!f) { render(); return; }
    const heute = K.tagKey(jetzt());
    // Erster Tag zurück muss ein gültiger, künftiger Tag sein; im Verlauf steht der Tag davor (`bis`)
    if (!HM.istTag(f.rueck) || f.rueck <= heute) { f.fehler = T('modus.rueckkehr.fehlerTag'); render(); return; }
    const bis = HM.plusTage(f.rueck, -1);
    try {
      const r = f.alle ? HM.pauseFuerAlle(spiel, f.modus, bis, heute) : HM.modusSetzen(spiel, f.heroId, f.modus, heute, HELDENMODI, { bis });
      setzeSpiel(r.spiel); speichere();
      ui.modusBis = null; ui.modusTausch = null;
      const datum = kurzDatum(f.rueck);
      ui.modusInfo = f.alle ? T('modus.rueckkehr.gesetztAlle', { modus: modusName(f.modus), datum }) : T('modus.rueckkehr.gesetzt', { held: nameVon(f.heroId), modus: modusName(f.modus), datum });
      trackEvent('hero_pause_dated', { modus: f.modus, alle: !!f.alle, tage: Math.round((K.ausTagKey(f.rueck) - K.ausTagKey(heute)) / 864e5) });
    } catch (e) {
      if (e instanceof HM.ModusFehler && e.code === 'bis') f.fehler = e.max ? T('modus.rueckkehr.fehlerWeit', { tage: e.max }) : T('modus.rueckkehr.fehlerTag');
      else { console.warn('Pause mit Datum:', e.message); f.fehler = T('modus.fehler'); }
    }
    render();
  },
  'modus-bis-weg'() {
    const { T, jetzt, nameVon, render, setzeSpiel, speichere, spiel, ui } = kx;
    const heroId = spiel.fokus;
    try {
      const r = HM.modusSetzen(spiel, heroId, HM.modusGewaehlt(spiel, heroId), K.tagKey(jetzt()), HELDENMODI, { bis: null });
      if (r.geaendert) { setzeSpiel(r.spiel); speichere(); ui.modusInfo = T('modus.rueckkehr.entfernt', { held: nameVon(heroId) }); trackEvent('hero_pause_date_removed', {}); }
    } catch (e) { console.warn('Pause mit Datum:', e.message); ui.modusInfo = T('modus.fehler'); }
    ui.modusBis = null;
    render();
  },
  // Mindestaufgabe: Formular öffnen (neu oder ändern). Von der Rastkarte aus öffnet es den Bogen.
  'mindest-neu'() {
    const { oeffneBlatt, render, spiel, ui } = kx;
    const heroId = spiel.fokus;
    const st = mindestStandVon(heroId);
    if (!st.gilt) { console.warn('Mindestaufgabe: gilt im gewählten Modus nicht'); render(); return; }
    const a = st.aufgabe;
    ui.mindestInfo = null;
    ui.mindestForm = { heroId, taetigkeit: a ? a.taetigkeit : '', anzahl: a ? a.anzahl : MINDEST.anzahlMin, zeitraum: a ? a.zeitraum : MINDEST.standardZeitraum, zaehltFuer: a ? a.zaehltFuer : null, fehler: {} };
    if (ui.blatt !== 'crew') oeffneBlatt('crew'); else render();
  },
  'mindest-zeitraum'({ id }) {
    const { render, ui } = kx;
    const f = ui.mindestForm;
    if (f && MINDEST.zeitraeume[id]) { f.zeitraum = id; f.fehler = {}; } else console.warn('Mindestaufgabe: ungültiger Zeitraum', id);
    render();
  },
  'mindest-link'({ id }) { const { render, ui } = kx; if (ui.mindestForm) ui.mindestForm.zaehltFuer = id ? String(id) : null; render(); },
  'mindest-abbrechen'() { const { render, ui } = kx; ui.mindestForm = null; render(); },
  'mindest-ok'() {
    const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    const f = ui.mindestForm;
    if (!f) { render(); return; }
    try {
      const r = M.mindestSetzen(spiel, f.heroId, f, jetzt());
      setzeSpiel(r.spiel); speichere();
      ui.mindestForm = null;
      mindestMelde(T('mindest.gespeichert', { taetigkeit: r.aufgabe.taetigkeit }));
      trackEvent('minimum_task_set', { zeitraum: r.aufgabe.zeitraum, anzahl: r.aufgabe.anzahl, verknuepft: !!r.aufgabe.zaehltFuer });
    } catch (e) {
      if (e instanceof M.MindestFehler && e.code === 'eingabe') f.fehler = e.fehler;
      else { console.warn('Mindestaufgabe:', e.message); ui.mindestInfo = T('mindest.fehler'); }
    }
    render();
  },
  'mindest-entfernen'() {
    const { T, render, setzeSpiel, speichere, spiel, ui } = kx;
    try {
      const r = M.mindestEntfernen(spiel, spiel.fokus);
      if (r.geaendert) { setzeSpiel(r.spiel); speichere(); mindestMelde(T('mindest.entfernt')); trackEvent('minimum_task_removed', {}); }
    } catch (e) { console.warn('Mindestaufgabe:', e.message); ui.mindestInfo = T('mindest.fehler'); }
    ui.mindestForm = null;
    render();
  },
  'mindest-haken'() {
    const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    try {
      const r = M.mindestAbhaken(spiel, spiel.fokus, jetzt());
      setzeSpiel(r.spiel); speichere();
      const xp = K.XP[MINDEST.xp] || 0;
      mindestMelde(!r.an ? T('mindest.zurueck') : !r.xp ? T('mindest.extra') : r.erreicht ? T('mindest.geschafft', { xp }) : T('mindest.gezaehlt', { xp }));
      trackEvent('minimum_task_ticked', { an: r.an, xp: r.xp, stuetze: r.stuetze });
    } catch (e) {
      console.warn('Mindestaufgabe:', e.message);
      ui.mindestInfo = T('mindest.fehler');
    }
    render();
  }
};

// ---------- Felder ----------
// Beim Tippen nicht neu zeichnen (Fokus bleibt), nur den Wert merken; Enter übernimmt.
export const HELDENMODI_FELDER = {
  // Rückkehr-Datum (Datumsfeld): nur merken, nicht neu zeichnen (Fokus bleibt); „Übernehmen“ prüft
  'modus-bis': {
    input({ wert }) { const f = kx.ui.modusBis; if (f) { f.rueck = String(wert ?? ''); f.fehler = null; } },
    change({ wert }) { const f = kx.ui.modusBis; if (f) { f.rueck = String(wert ?? ''); f.fehler = null; } },
    enter() { HELDENMODI_KLICKS['modus-bis-ok'](); }
  },
  'mindest-taetigkeit': {
    input({ wert }) { const f = kx.ui.mindestForm; if (f) f.taetigkeit = String(wert ?? '').slice(0, MINDEST.taetigkeitMax); },
    enter() { HELDENMODI_KLICKS['mindest-ok'](); }
  },
  'mindest-anzahl': {
    input({ wert }) { const f = kx.ui.mindestForm; if (f) f.anzahl = wert === '' ? NaN : Number(wert); },
    enter() { HELDENMODI_KLICKS['mindest-ok'](); }
  }
};
