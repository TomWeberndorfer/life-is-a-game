// Morgenprobe (Version 81): „Wo könnte es heute schwierig werden?“ Einstellung und Regeln: PROBE in daten/startseite.js,
// Logik: logik/eintraege.js (letzterPlan, probeUmschalten, musterHinweis). Entscheidung 30.10.2026 (Punkte 4, 7, 8, 10, 13a).
// Zwei Varianten, je Person wählbar (spiel.einstellungen.probe):
//   kurz          leise Zeile auf der Heldentat, klappt eine Box auf (Plan durchspielen, letzter Plan). Nichts gespeichert.
//   ausfuehrlich  dieselbe Zeile öffnet ein Blatt mit allen Helden: Wenn-dann, letzter Plan, Muster-Hinweis und je Held
//                 „Könnte heute kommen“ (Eintrag der Art probe). Danach zeigt die Zeile „Heute vorbereitet“.
// Psychologie: Die Situation vorher kurz vor Augen zu haben, macht den Auslöser im Moment eher erkennbar (mentale Probe
// des Wenn-dann-Plans). Keine XP, keine Serie, kein „verpasst“: ein ausgelassener Morgen darf nichts kosten.
// Zustand nur für die Sitzung: ui.probe (Held mit offener Box), ui.probeBlatt ({ fehler } oder null).
import { trackEvent } from '../analytics.js';
import { EINTRAG_OPT } from '../daten/eintrag-arten.js';
import { PROBE } from '../daten/startseite.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as EN from '../logik/eintraege.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { wennDann } from '../logik/startseite.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

const planTage = () => (Number.isInteger(PROBE.planTage) && PROBE.planTage >= 0 && PROBE.planTage <= 90 ? PROBE.planTage : 30);
const musterMin = () => (Number.isInteger(PROBE.musterMin) && PROBE.musterMin >= 1 && PROBE.musterMin <= 20 ? PROBE.musterMin : 3);
// Gewählte Variante (fehlt oder ungültig → Standard, wie beim Laden)
export function probeVariante() {
  const { spiel } = kx;
  return H.bereinigeEinstellungen(spiel.einstellungen).probe;
}
const heuteK = () => { const { jetzt } = kx; return K.tagKey(jetzt()); };
function letzterPlanSicher(heroId) {
  const { spiel } = kx;
  try { return EN.letzterPlan(spiel, heroId, heuteK(), planTage()); } catch (e) { console.warn('Morgenprobe:', e.message); return null; }
}
const planZeile = plan => {
  const { T } = kx;
  return plan ? `<p class="klein">${esc(T('probe.letzterPlan', { tag: kurzDatum(plan.tag) }))}</p><p class="probe-plan">${esc(plan.text)}</p>` : '';
};
const vorbereitetHeute = () => { const { spiel } = kx; const t = heuteK(); return (spiel.eintraege || []).some(e => e.art === 'probe' && e.tag === t); };

// Zeile auf der Heldentat-Karte (vor dem Tages-Check). wd = Wenn-dann des Helden im Rampenlicht.
export function probeHtml(wd) {
  const { T, spiel, ui } = kx;
  if (!PROBE.an || !spiel.fokus) return '';
  if (probeVariante() === 'ausfuehrlich') {
    const fertig = vorbereitetHeute();
    return `<div class="probe"><button class="link eintrag-link probe-link" data-a="probe-blatt">${icon(fertig ? 'check' : 'kompass')}${esc(T(fertig ? 'probe.vorbereitet' : 'probe.link'))}</button></div>`;
  }
  const offen = ui.probe === spiel.fokus;
  const knopf = `<button class="link eintrag-link probe-link" data-a="probe" aria-expanded="${offen}">${icon('kompass')}${esc(T('probe.link'))}</button>`;
  if (!offen) return `<div class="probe">${knopf}</div>`;
  return `<div class="probe offen">${knopf}
    <div class="probe-box" role="region" aria-label="${esc(T('probe.link'))}">
      <p>${esc(T(wd && (wd.wenn || wd.dann) ? 'probe.text' : 'probe.textOhnePlan'))}</p>
      ${planZeile(letzterPlanSicher(spiel.fokus))}
      <button class="link" data-a="probe">${esc(T('probe.bereit'))}</button>
    </div>
  </div>`;
}

// Blatt der ausführlichen Probe: alle Helden untereinander, der im Rampenlicht zuerst.
export function probeBlattHtml() {
  const { T, img, nameVon, spiel, ui } = kx;
  if (!ui.probeBlatt) return '';
  if (ui.screen !== 'start' || !spiel.helden.length) { ui.probeBlatt = null; return ''; }
  const t = heuteK();
  const helden = [...spiel.helden].sort((a, b) => (a.heroId === spiel.fokus ? -1 : b.heroId === spiel.fokus ? 1 : 0));
  const wtName = d => d.toLocaleDateString('de-AT', { weekday: 'long' });
  const zeilen = helden.map(h => {
    const v = TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId);
    const f = v && TABELLE.faehigkeiten[v.faehigkeit];
    const wd = wennDann(f);
    const an = EN.eintraegeVon(spiel, h.heroId, { art: 'probe', tag: t }).length > 0;
    let m = null;
    try { m = EN.musterHinweis(spiel, h.heroId, t, musterMin()); } catch (e) { console.warn('Morgenprobe (Muster):', e.message); }
    return `<li class="probe-held${an ? ' an' : ''}">
      <div class="probe-kopf">${v ? img(v.held, nameVon(v.held), 'held', 'rund-klein', '') : ''}<span class="nm">${esc(v ? nameVon(v.held) : h.heroId)}</span></div>
      ${wd.wenn || wd.dann ? `<p class="probe-wd">${wd.wenn ? `<b>${esc(T('tat.wenn'))}</b> ${esc(wd.wenn)}` : ''}${wd.dann ? `<br><b>${esc(T('tat.dannLabel'))}</b> ${esc(wd.dann)}` : ''}</p>` : `<p class="klein">${esc(T('probe.keinPlan'))}</p>`}
      ${m ? `<p class="klein probe-muster">${esc(T('probe.muster', { wochentag: wtName(K.ausTagKey(t)), n: m.anzahl }))}</p>` : ''}
      ${planZeile(letzterPlanSicher(h.heroId))}
      <button class="opt kurz probe-merker ${an ? 'sel' : ''}" aria-pressed="${an}" data-a="probe-merker" data-id="${esc(h.heroId)}">${icon(an ? 'check' : 'kompass')}${esc(T(an ? 'probe.koennteAn' : 'probe.koennte'))}</button>
    </li>`;
  }).join('');
  const f = ui.probeBlatt.fehler;
  return `<div class="feier unten probe-blatt" role="dialog" aria-modal="true" aria-labelledby="probe-t">
    <button class="hintergrund" data-a="probe-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(T('probe.frage').toUpperCase())}</span>
        <h2 id="probe-t">${esc(T('probe.titel'))}</h2>
        <p class="klein">${esc(T('probe.einleitung'))}</p>
        <ul class="probe-liste">${zeilen}</ul>
        ${f ? `<p class="fehler" role="alert">${esc(f)}</p>` : ''}
        <button class="cta" data-a="probe-zu">${esc(T('probe.bereit'))}</button>
      </div>
    </div>
  </div>`;
}

// Karte in den Einstellungen: Variante wählen (sofort, ohne Freischaltung, Entscheidung 13a).
export function probeEinstellung() {
  const { T } = kx;
  if (!PROBE.an) return '';
  const jetzt = probeVariante();
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('einst.probe'))}</span>
    <p class="klein">${esc(T('einst.probeText'))}</p>
    <div class="wahl" role="group" aria-label="${esc(T('einst.probe'))}">${(PROBE.varianten || []).map(x => `<button class="opt kurz ${jetzt === x ? 'sel' : ''}" aria-pressed="${jetzt === x}" data-a="probe-variante" data-id="${esc(x)}">${esc(T('einst.probe.' + x))}</button>`).join('')}</div>
  </div>`;
}

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
// Analytics zählt nur das Öffnen, die Variante und das Setzen eines Merkers, nie Held oder Text.
export const PROBE_KLICKS = {
  probe() {
    const { render, spiel, ui } = kx;
    if (!spiel.fokus) return;
    ui.probe = ui.probe === spiel.fokus ? null : spiel.fokus;
    if (ui.probe) trackEvent('probe_opened', { variante: 'kurz' });
    render();
  },
  'probe-blatt'() {
    const { render, spiel, ui } = kx;
    if (!spiel.helden.length) return;
    ui.probeBlatt = { fehler: null };
    trackEvent('probe_opened', { variante: 'ausfuehrlich' });
    render();
  },
  'probe-zu'() { const { render, ui } = kx; ui.probeBlatt = null; render(); },
  'probe-merker'({ id }) {
    const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    if (!ui.probeBlatt) return;
    if (!H.heldVon(spiel, id)) { console.warn('Morgenprobe: unbekannter Held', id); return; }
    try {
      const r = EN.probeUmschalten(spiel, id, jetzt(), EINTRAG_OPT);
      setzeSpiel(r.spiel);
      speichere();
      ui.probeBlatt.fehler = null;
      if (r.an) trackEvent('probe_marked', {});
    } catch (e) {
      ui.probeBlatt.fehler = T('probe.fehler', { grund: e.message });
    }
    render();
  },
  'probe-variante'({ id }) {
    const { render, setzeSpiel, speichere, spiel, ui } = kx;
    if (!(PROBE.varianten || []).includes(id)) { console.warn('Morgenprobe: unbekannte Variante', id); return; }
    setzeSpiel({ ...spiel, einstellungen: { ...H.bereinigeEinstellungen(spiel.einstellungen), probe: id } });
    speichere();
    ui.probe = null;
    trackEvent('probe_variant', { variante: id });
    render();
  }
};
