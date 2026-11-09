// Crew-Übersicht (06.11.2026): eine Ansicht, zwei Einstiege. Schritt „Energie“ der Wochenrunde (ansicht/wochenrunde.js)
// und Blatt „Crew planen“ aus der Heldenwahl (ansicht/startseite.js, ab CREW.abHelden Helden, jederzeit).
// Daten: daten/crew.js, Logik: logik/crew.js. Zustand nur für die Sitzung: ui.crew = { info } (Blatt offen), ui.crewRuhe
// (eingeklappte Gruppen aufgeklappt). Moduswechsel gelten sofort, mit den Grenzen der Heldenmodi (Fokus höchstens n,
// mindestens einer bleibt im Fokus); Rückmeldung in ui.woche.info (Wochenrunde) bzw. ui.crew.info (Blatt).
// Tonregel: kein „offen“, kein Zähler, kein Rot. Ein fehlender Wert (z. B. Lebensrad ohne Wochenrunde) fällt still weg.
import { trackEvent } from '../analytics.js';
import { CREW } from '../daten/crew.js';
import { HELDENMODI } from '../daten/heldenmodi.js';
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import * as C from '../logik/crew.js';
import * as HM from '../logik/heldenmodi.js';
import * as K from '../logik/kern.js';
import * as W from '../logik/wochenrunde.js';
import { esc, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

const BILDSCHIRME = ['start', 'karte'];
const modusName = m => kx.wort(`modus_${m}`) || m;
const bereichName = id => (LEBENSBEREICHE.find(d => d.id === id) || {}).name || '';
const istAufgeklappt = modus => !!(kx.ui.crewRuhe && kx.ui.crewRuhe[modus]);

// Seit-Zeile: „seit heute“, „seit Mo, 2. Nov.“ oder „ab Di, 10. Nov.“ (Wechsel beginnt erst später).
function seitText(seit, heuteK) {
  const { T } = kx;
  if (!seit) return '';
  if (seit.kommt) return T('crew.ab', { datum: kurzDatum(seit.ab) });
  return seit.ab === heuteK ? T('crew.seitHeute') : T('crew.seit', { datum: kurzDatum(seit.ab) });
}

function heldHtml(x, modus, heuteK) {
  const { T, img, nameVon } = kx;
  const name = nameVon(x.heroId);
  const { max } = W.skalaVon();
  const zeilen = [];
  if (x.ziel) zeilen.push(`<span class="crew-quest">${esc(x.ziel)}</span>`);
  if (x.mindest) zeilen.push(`<span class="klein">${esc(T('crew.mindest', { taetigkeit: x.mindest.taetigkeit, anzahl: x.mindest.anzahl, zeitraum: T(`mindest.zeitraum.${x.mindest.zeitraum}`) }))}</span>`);
  if (x.stuetzen.length) {
    const n = CREW.stuetzenMax;
    const namen = x.stuetzen.slice(0, n).join(', ') + (x.stuetzen.length > n ? ` ${T('crew.mehr', { n: x.stuetzen.length - n })}` : '');
    zeilen.push(`<span class="klein">${esc(T('crew.stuetzen', { namen }))}</span>`);
  }
  if (Number.isInteger(x.wheel)) zeilen.push(`<span class="klein">${esc(T('crew.wheel', { bereich: bereichName(x.domainId), wert: x.wheel, max }))}</span>`);
  const seit = seitText(x.seit, heuteK);
  const kopf = [bereichName(x.domainId), seit].filter(Boolean).join(' · ');
  const knoepfe = HELDENMODI.modi.map(m => `<button class="opt kurz ${m === modus ? 'sel' : ''}" aria-pressed="${m === modus}" data-a="crew-modus" data-id="${esc(x.heroId)}:${esc(m)}">${esc(modusName(m))}</button>`).join('');
  return `<li class="crew-held">${img(x.heroId, name, 'held', 'rund-klein', '')}<span class="spalte">
    <b id="crew-m-${esc(x.heroId)}">${esc(name)}</b>${kopf ? `<span class="eyebrow">${esc(kopf)}</span>` : ''}
    ${zeilen.join('')}
    <span class="wahl" role="group" aria-labelledby="crew-m-${esc(x.heroId)}">${knoepfe}</span></span></li>`;
}

// Gruppierte Übersicht (Fokus · Erhalt · Ruhe). Wirft nie; im Fehlerfall ein ruhiger Hinweis statt der Liste.
export function crewHtml() {
  const { T, jetzt, nameVon, spiel } = kx;
  let u;
  try { u = C.crewUebersicht(spiel, jetzt()); } catch (e) { console.warn('Crew-Übersicht:', e.message); return `<p class="klein">${esc(T('modus.fehler'))}</p>`; }
  const heuteK = K.tagKey(jetzt());
  return `<div class="crew-liste">${u.gruppen.map(g => {
    const zu = g.eingeklappt && !istAufgeklappt(g.modus);
    const kopf = `<span class="eyebrow">${esc(modusName(g.modus).toUpperCase())}</span><span class="klein">${esc(T('wr.en.modus.' + g.modus))}</span>`;
    if (zu) {
      const namen = g.helden.map(x => nameVon(x.heroId)).join(', ');
      return `<section class="crew-gruppe crew-${esc(g.modus)}">${kopf}
        <button class="btn crew-klappe" data-a="crew-klappe" data-id="${esc(g.modus)}" aria-expanded="false">${esc(T('crew.zeigen', { namen }))}</button></section>`;
    }
    const platz = g.platz > 0 ? `<li class="crew-platz">${esc(g.platz === 1 ? T('crew.platzEins') : T('crew.platz', { n: g.platz }))}</li>` : '';
    const klappe = g.eingeklappt ? `<button class="link crew-klappe" data-a="crew-klappe" data-id="${esc(g.modus)}" aria-expanded="true">${esc(T('crew.verbergen'))}</button>` : '';
    return `<section class="crew-gruppe crew-${esc(g.modus)}">${kopf}
      <ul class="crew-helden">${g.helden.map(x => heldHtml(x, g.modus, heuteK)).join('')}${platz}</ul>${klappe}</section>`;
  }).join('')}</div>`;
}

// Knopf in der Heldenwahl (ab CREW.abHelden Helden).
export function crewKnopfHtml() {
  const { T, spiel, wort } = kx;
  return C.crewPlanbar(spiel) ? `<button class="btn wahl-neu" data-a="crew-oeffnen">${esc(T('crew.knopf', { crew: wort('crew') }))}</button>` : '';
}

export function crewBlattHtml() {
  const { T, spiel, ui, wort } = kx;
  if (!ui.crew) return '';
  if (!BILDSCHIRME.includes(ui.screen) || !C.crewPlanbar(spiel)) { ui.crew = null; return ''; }
  return `<div class="feier unten eintrag-blatt crew-blatt" role="dialog" aria-modal="true" aria-labelledby="crew-t">
    <button class="hintergrund" data-a="crew-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(wort('crew').toUpperCase())}</span>
        <h2 id="crew-t">${esc(T('crew.titel', { crew: wort('crew') }))}</h2>
        <p class="klein">${esc(T('crew.intro'))}</p>
        ${crewHtml()}
        <p class="klein">${esc(T('wr.en.hinweis', { max: HELDENMODI.fokusMax, fokus: modusName(HELDENMODI.standard) }))}</p>
        ${ui.crew.info ? `<p class="klein modus-info" role="status">${esc(ui.crew.info)}</p>` : ''}
        <button class="cta" data-a="crew-zu">${esc(T('nav.schliessen'))}</button>
      </div>
    </div>
  </div>`;
}

// Modus setzen mit den Grenzen der Heldenmodi; liefert die Rückmeldung als Text (Wochenrunde und Blatt). Wirft nie.
export function modusWechseln(id) {
  const { T, jetzt, nameVon, setzeSpiel, speichere, spiel } = kx;
  const s = String(id ?? '');
  const i = s.lastIndexOf(':');
  const [heroId, modus] = i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, ''];
  const werte = { fokus: modusName(HELDENMODI.standard), erhalt: modusName(HELDENMODI.neuOhnePlatz) };
  try {
    const heute = K.tagKey(jetzt());
    const r = HM.modusSetzen(spiel, heroId, modus, heute);
    if (r.geaendert) {
      setzeSpiel(r.spiel); speichere();
      trackEvent('hero_mode_set', { modus, fokus: HM.fokusHelden(r.spiel).length });
      return T(r.ab && r.ab > heute ? 'modus.abMorgen' : 'modus.gesetzt', { held: nameVon(heroId), modus: modusName(modus) });
    }
    return T('modus.gesetzt', { held: nameVon(heroId), modus: modusName(modus) });
  } catch (e) {
    if (e instanceof HM.ModusFehler && e.code === 'voll') return T('wr.en.voll', werte);
    if (e instanceof HM.ModusFehler && e.code === 'letzter') return T('modus.letzter', werte);
    console.warn('Crew (Modus):', e.message);
    return T('modus.fehler');
  }
}

// Schlüssel für die Ebene (Blatt beginnt oben, Tippen blendet nicht neu ein)
export const crewEbene = () => (kx.ui.crew ? 'crew' : null);

// ---------- Klicks ----------
export const CREW_KLICKS = {
  'crew-oeffnen'() {
    const { render, spiel, ui } = kx;
    if (!C.crewPlanbar(spiel)) { console.warn('Crew planen: erst ab', CREW.abHelden, 'Helden'); return; }
    ui.heldenWahl = false; ui.crew = { info: null };
    trackEvent('crew_plan_opened', {});
    render();
  },
  'crew-zu'() { const { render, ui } = kx; ui.crew = null; render(); },
  // id = „heroId:modus“. Gilt in der Wochenrunde (Schritt Energie) und im Blatt.
  'crew-modus'({ id }) {
    const { render, ui } = kx;
    const ziel = ui.woche || ui.crew;
    if (!ziel) return;
    ziel.info = modusWechseln(id);
    render();
  },
  // id = Modus einer eingeklappten Gruppe (CREW.eingeklappt); auf- und zuklappen nur für die Sitzung
  'crew-klappe'({ id }) {
    const { render, ui } = kx;
    if (!CREW.eingeklappt.includes(id)) { console.warn('Crew: Gruppe nicht einklappbar', id); return; }
    ui.crewRuhe = { ...(ui.crewRuhe || {}), [id]: !istAufgeklappt(id) };
    render();
  }
};
