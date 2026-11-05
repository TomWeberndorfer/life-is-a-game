// Wochenrunde (05.11.2026, Entscheidungen Abschnitt 36): Blatt mit drei Schritten (Lebensbereiche · Rückblick · Energie),
// Karte am Rundentag auf der Startseite und Knopf im Heldenbogen. Daten: daten/wochenrunde.js, Logik: logik/wochenrunde.js.
// Zustand nur für die Sitzung: ui.woche = { woche, schritt, wheel, vorher, gewaehlt, vorsatz, vorsatzHeld, vorsatzAlt, info, fehler }.
// Vorsatz (Punkt 3a, 4): optional einem Helden zugeordnet; während der Woche als leise Zeile unter dessen Tagesfrage
// (vorsatzZeileHtml), ohne Abhaken und ohne Zähler.
// Gespeichert wird erst mit „Runde abschließen“ (spiel.wochen); Moduswechsel in Schritt 3 gelten sofort (echte Wahl).
// Wheel (Entscheidung 10a): Tipp in einen Ring des Bereichs setzt den Wert (außen = zufriedener), − und + stellen den
// gewählten Bereich genauer ein; die Bereiche stehen zusätzlich als Knöpfe darunter (Tastatur, Bildschirmleser).
// Psychologie: keine XP, keine Serie, keine Wertung der Zahlen; die Einladung bei sinkendem Wert ist eine Frage.
// Datenschutz: Werte und Vorsatz gehen nie in Analytics, nur dass eine Runde abgeschlossen wurde.
import { trackEvent } from '../analytics.js';
import { HELDENMODI } from '../daten/heldenmodi.js';
import { LEBENSBEREICHE, DOMAIN_IDS } from '../daten/lebensbereiche.js';
import { WOCHENRUNDE } from '../daten/wochenrunde.js';
import * as HM from '../logik/heldenmodi.js';
import * as K from '../logik/kern.js';
import * as W from '../logik/wochenrunde.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

const BILDSCHIRME = ['start'];
const modusName = m => kx.wort(`modus_${m}`) || m;
const bereichName = id => (LEBENSBEREICHE.find(d => d.id === id) || { name: id }).name;
const schritte = () => (Array.isArray(WOCHENRUNDE.schritte) && WOCHENRUNDE.schritte.length ? WOCHENRUNDE.schritte : ['wheel', 'rueckblick', 'energie']);
const frei = () => { try { return !!kx.funktionFrei('wochenrunden'); } catch (e) { return false; } };

// ---------- Öffnen ----------
export function wocheOeffnen() {
  const { jetzt, spiel, ui } = kx;
  const woche = W.zielWoche(spiel, jetzt());
  const e = W.entwurf(spiel, woche, DOMAIN_IDS);
  ui.woche = { woche, schritt: 0, wheel: e.wheel, vorher: e.vorher, vorbelegt: !!e.vorwoche, gewaehlt: DOMAIN_IDS[0],
    vorsatz: e.vorsatz, vorsatzHeld: e.vorsatzHeld, vorsatzAlt: W.letzterVorsatz(spiel, woche), info: null, fehler: null };
  trackEvent('week_round_opened', {});
}

// ---------- Karte auf der Startseite ----------
function wegWoche() {
  const { speicher } = kx;
  try { return speicher.einstellung(WOCHENRUNDE.weg); } catch (e) { return null; }
}
export function wochenKarteHtml() {
  const { T, jetzt, spiel } = kx;
  let z = 'aus';
  try { z = W.karteZustand(spiel, { jetzt: jetzt(), frei: frei(), wegWoche: wegWoche() }); } catch (e) { console.warn('Wochenrunde (Karte):', e.message); }
  if (z !== 'angebot') return '';
  const eyebrow = W.ersteRunde(spiel) ? T('wr.karte.neu') : T('wr.eyebrow');
  return `<div class="karte spalte wr-karte">
    <span class="eyebrow">${esc(eyebrow)}</span>
    <span class="nm">${esc(T('wr.karte.titel'))}</span>
    <p class="klein">${esc(T('wr.karte.text'))}</p>
    <div class="zwei"><button class="btn voll" data-a="woche-oeffnen">${icon('kompass')} ${esc(T('wr.karte.los'))}</button><button class="btn" data-a="woche-karte-weg">${esc(T('wr.karte.weg'))}</button></div>
  </div>`;
}

// Knopf im Heldenbogen (jederzeit, sobald freigeschaltet).
export function wochenBogenHtml() {
  const { T } = kx;
  if (!frei()) return '';
  return `<section class="bogen-abschnitt wr-bogen"><span class="eyebrow">${esc(T('wr.eyebrow'))}</span>
    <p class="klein">${esc(T('wr.bogenText'))}</p>
    <button class="btn" data-a="woche-oeffnen">${icon('kompass')} ${esc(T('wr.bogen'))}</button></section>`;
}

// ---------- Wheel als SVG ----------
// Ringstück (Kreisringsektor) zwischen den Radien r0 und r1 und den Winkeln a0 und a1 (Grad, 0 = oben, im Uhrzeigersinn).
const pt = (r, a) => { const w = (a - 90) * Math.PI / 180; return `${(r * Math.cos(w)).toFixed(1)} ${(r * Math.sin(w)).toFixed(1)}`; };
function ringstueck(r0, r1, a0, a1) {
  const gross = a1 - a0 > 180 ? 1 : 0;
  return `M ${pt(r1, a0)} A ${r1} ${r1} 0 ${gross} 1 ${pt(r1, a1)} L ${pt(r0, a1)} A ${r0} ${r0} 0 ${gross} 0 ${pt(r0, a0)} Z`;
}
export function wheelSvg(wheel, gewaehlt) {
  const { T } = kx;
  const { min, max } = W.skalaVon();
  const ids = DOMAIN_IDS;
  const R = 100, R0 = 9, luecke = 1.2;
  const schritt = 360 / ids.length;
  const stufen = max - min + 1;
  const ring = k => R0 + (R - R0) * k / stufen;
  const vor = W.vorschlagWert(); // Version 147: blasser Vorschlag für Bereiche ohne Wert (nur Anzeige)
  let teile = '';
  ids.forEach((id, i) => {
    const a0 = i * schritt - schritt / 2 + luecke, a1 = i * schritt + schritt / 2 - luecke;
    const wert = Number.isInteger(wheel[id]) ? wheel[id] : null;
    for (let k = 1; k <= stufen; k++) {
      const v = min + k - 1;
      const voll = wert !== null && v <= wert;
      const vorschlag = wert === null && vor !== null && v <= vor;
      teile += `<path class="wr-ring${voll ? ' voll' : ''}${vorschlag ? ' vorschlag' : ''}${id === gewaehlt ? ' gewaehlt' : ''}" d="${ringstueck(ring(k - 1), ring(k), a0, a1)}" data-a="woche-wert" data-id="${esc(id)}:${v}" aria-hidden="true"></path>`;
    }
    const [x, y] = pt(R + 10, i * schritt).split(' ').map(Number);
    const anker = Math.abs(x) < 8 ? 'middle' : x > 0 ? 'start' : 'end';
    teile += `<text class="wr-label${id === gewaehlt ? ' gewaehlt' : ''}" x="${x}" y="${(y + 4).toFixed(1)}" text-anchor="${anker}" data-a="woche-bereich" data-id="${esc(id)}" aria-hidden="true">${esc(bereichName(id))}${wert !== null ? ` ${wert}` : ''}</text>`;
  });
  return `<svg class="wr-wheel" viewBox="-200 -126 400 252" role="img" aria-label="${esc(T('wr.wheel.aria', { max }))}">${teile}</svg>`;
}

// ---------- Schritte ----------
function schrittWheel(w) {
  const { T } = kx;
  const { max } = W.skalaVon();
  const g = w.gewaehlt;
  const wert = Number.isInteger(w.wheel[g]) ? w.wheel[g] : null;
  const chips = DOMAIN_IDS.map(id => {
    const v = Number.isInteger(w.wheel[id]) ? w.wheel[id] : null;
    return `<button class="opt kurz ${id === g ? 'sel' : ''}" aria-pressed="${id === g}" data-a="woche-bereich" data-id="${esc(id)}">${esc(bereichName(id))}<b class="wr-zahl">${v === null ? '–' : v}</b></button>`;
  }).join('');
  const vor = W.vorschlagWert();
  const offenText = vor === null ? T('wr.wheel.offen', { bereich: bereichName(g) }) : T('wr.wheel.vorschlag', { bereich: bereichName(g), wert: vor });
  return `<p class="lead">${esc(T('wr.wheel.frage'))}</p>
    <p class="klein">${esc(T('wr.wheel.privat'))} ${esc(T(w.vorbelegt ? 'wr.wheel.vorbelegt' : vor === null ? 'wr.wheel.hinweis' : 'wr.wheel.hinweisVorschlag'))}</p>
    ${wheelSvg(w.wheel, g)}
    <div class="wr-fein" role="group" aria-label="${esc(bereichName(g))}">
      <button class="icbtn" data-a="woche-minus" data-id="${esc(g)}" aria-label="${esc(T('wr.wheel.minus', { bereich: bereichName(g) }))}">−</button>
      <span class="wr-fein-text" role="status">${esc(wert === null ? offenText : T('wr.wheel.wert', { bereich: bereichName(g), wert, max }))}</span>
      <button class="icbtn" data-a="woche-plus" data-id="${esc(g)}" aria-label="${esc(T('wr.wheel.plus', { bereich: bereichName(g) }))}">+</button>
    </div>
    <div class="wahl wr-chips">${chips}</div>`;
}

function schrittRueckblick(w) {
  const { T, img, jetzt, nameVon, spiel } = kx;
  const bilanz = W.wochenBilanz(spiel, w.woche, K.tagKey(jetzt()));
  const zeilen = bilanz.map(b => {
    const teile = [b.guteTage === 0 ? T('wr.rb.guteKeine') : b.guteTage === 1 ? T('wr.rb.guteEins') : T('wr.rb.gute', { n: b.guteTage })];
    if (b.schwer > 0) teile.push(T('wr.rb.schwer', { n: b.schwer }));
    if (b.modus && b.modus !== HELDENMODI.standard) teile.push(T('wr.rb.pause', { modus: modusName(b.modus) }));
    return `<li class="wr-held">${img(b.heroId, nameVon(b.heroId), 'held', 'rund-klein', '')}<span class="spalte"><b>${esc(nameVon(b.heroId))}</b><span class="klein">${esc(teile.join(' · '))}</span></span></li>`;
  }).join('');
  return `<p class="lead">${esc(T('wr.rb.frage'))}</p>
    <ul class="wr-helden">${zeilen}</ul>
    ${w.vorsatzAlt ? `<p class="klein wr-vorsatz-alt">${esc(T('wr.rb.vorsatzAlt', { text: w.vorsatzAlt }))}</p>` : ''}
    <label class="feld"><span>${esc(T('wr.rb.vorsatz'))}</span><textarea id="woche-vorsatz" rows="2" maxlength="${WOCHENRUNDE.vorsatzMax}">${esc(w.vorsatz || '')}</textarea></label>
    <p class="klein">${esc(T('wr.rb.vorsatzHinweis'))}</p>
    ${spiel.helden.length > 1 ? `<div class="feld"><span id="wr-vh-l">${esc(T('wr.rb.vorsatzHeld'))}</span>
      <div class="wahl eintrag-wahl" role="group" aria-labelledby="wr-vh-l">
        <button class="opt kurz ${!w.vorsatzHeld ? 'sel' : ''}" aria-pressed="${!w.vorsatzHeld}" data-a="woche-vorsatz-held" data-id="">${esc(T('wr.rb.vorsatzKeiner'))}</button>
        ${spiel.helden.map(h => `<button class="opt kurz ${w.vorsatzHeld === h.heroId ? 'sel' : ''}" aria-pressed="${w.vorsatzHeld === h.heroId}" data-a="woche-vorsatz-held" data-id="${esc(h.heroId)}">${esc(nameVon(h.heroId))}</button>`).join('')}
      </div></div>` : ''}`;
}

function schrittEnergie(w) {
  const { T, img, nameVon, spiel } = kx;
  const fokus = modusName(HELDENMODI.standard);
  const einl = W.einladungen(spiel, w.wheel, w.vorher).map(e => `<div class="wr-einladung"><p class="klein">${esc(T('wr.en.einladung', { bereich: bereichName(e.bereich), alt: e.alt, neu: e.neu, held: nameVon(e.heroId), fokus }))}</p>
      <button class="btn" data-a="woche-modus" data-id="${esc(e.heroId)}:${esc(HELDENMODI.standard)}">${esc(T('wr.en.einladungKnopf', { held: nameVon(e.heroId), fokus }))}</button></div>`).join('');
  const zeilen = spiel.helden.map(h => {
    const m = HM.modusGewaehlt(spiel, h.heroId);
    const knoepfe = HELDENMODI.modi.map(x => `<button class="opt kurz ${m === x ? 'sel' : ''}" aria-pressed="${m === x}" data-a="woche-modus" data-id="${esc(h.heroId)}:${esc(x)}">${esc(modusName(x))}</button>`).join('');
    return `<li class="wr-held">${img(h.heroId, nameVon(h.heroId), 'held', 'rund-klein', '')}<span class="spalte"><b id="wr-m-${esc(h.heroId)}">${esc(nameVon(h.heroId))}</b>
      <span class="wahl" role="group" aria-labelledby="wr-m-${esc(h.heroId)}">${knoepfe}</span></span></li>`;
  }).join('');
  return `<p class="lead">${esc(T('wr.en.frage'))}</p>
    ${einl}
    <ul class="wr-modi klein">${HELDENMODI.modi.map(x => `<li><b>${esc(modusName(x))}:</b> ${esc(T('wr.en.modus.' + x))}</li>`).join('')}</ul>
    <ul class="wr-helden">${zeilen}</ul>
    <p class="klein">${esc(T('wr.en.hinweis', { max: HELDENMODI.fokusMax, fokus }))}</p>
    ${w.info ? `<p class="klein modus-info" role="status">${esc(w.info)}</p>` : ''}`;
}
const SCHRITT_HTML = { wheel: schrittWheel, rueckblick: schrittRueckblick, energie: schrittEnergie };

export function wochenBlattHtml() {
  const { T, ui } = kx;
  const w = ui.woche;
  if (!w) return '';
  if (!BILDSCHIRME.includes(ui.screen)) { ui.woche = null; return ''; }
  const liste = schritte();
  const nr = Math.max(0, Math.min(liste.length - 1, w.schritt || 0));
  const id = liste[nr];
  const inhalt = (SCHRITT_HTML[id] || (() => ''))(w);
  const letzter = nr === liste.length - 1;
  return `<div class="feier unten eintrag-blatt wr-blatt" role="dialog" aria-modal="true" aria-labelledby="wr-t">
    <button class="hintergrund" data-a="woche-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(T('wr.eyebrow'))} · ${esc(T('wr.schrittVon', { nr: nr + 1, n: liste.length, name: T('wr.schritt.' + id) }).toUpperCase())}</span>
        <h2 id="wr-t">${esc(T('wr.titel'))}</h2>
        <div class="wr-punkte" aria-hidden="true">${liste.map((_, i) => `<i class="${i === nr ? 'an' : i < nr ? 'war' : ''}"></i>`).join('')}</div>
        ${inhalt}
        ${w.fehler ? `<p class="fehler" role="alert">${esc(w.fehler)}</p>` : ''}
        ${letzter ? `<button class="cta" data-a="woche-abschliessen">${esc(T('wr.abschliessen'))}</button>` : `<button class="cta" data-a="woche-weiter">${esc(T('wr.weiter'))}</button>`}
        <div class="zwei">${nr > 0 ? `<button class="btn" data-a="woche-zurueck">${esc(T('wr.zurueck'))}</button>` : ''}<button class="link" data-a="woche-zu">${esc(T('wr.spaeter'))}</button></div>
      </div>
    </div>
  </div>`;
}
// Schlüssel für die Ebene (Scroll oben bei jedem Schritt)
export const wochenEbene = () => (kx.ui.woche ? `woche:${kx.ui.woche.schritt}` : null);

// ---------- Klicks ----------
function teile(id) {
  const s = String(id ?? '');
  const i = s.lastIndexOf(':');
  return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, ''];
}
export const WOCHE_KLICKS = {
  'woche-oeffnen'() {
    const { render, schliesseBlatt, ui } = kx;
    if (!frei()) { console.warn('Wochenrunde: noch nicht freigeschaltet'); return; }
    if (ui.blatt) schliesseBlatt();
    wocheOeffnen(); render();
  },
  'woche-zu'() { const { render, ui } = kx; ui.woche = null; render(); },
  'woche-weiter'() { const { render, ui } = kx; if (!ui.woche) return; ui.woche.schritt = Math.min(schritte().length - 1, (ui.woche.schritt || 0) + 1); ui.woche.fehler = null; render(); },
  'woche-zurueck'() { const { render, ui } = kx; if (!ui.woche) return; ui.woche.schritt = Math.max(0, (ui.woche.schritt || 0) - 1); ui.woche.fehler = null; render(); },
  'woche-bereich'({ id }) {
    const { render, ui } = kx;
    if (!ui.woche) return;
    if (!DOMAIN_IDS.includes(id)) { console.warn('Wochenrunde: unbekannter Lebensbereich', id); return; }
    ui.woche.gewaehlt = id; render();
  },
  // id = „bereich:wert“ (Tipp in den Ring)
  'woche-wert'({ id }) {
    const { render, ui } = kx;
    if (!ui.woche) return;
    const [b, v] = teile(id);
    if (!DOMAIN_IDS.includes(b) || !/^\d+$/.test(v)) { console.warn('Wochenrunde: ungültiger Wert', id); return; }
    ui.woche.wheel = W.wertSetzen(ui.woche.wheel, b, Number(v));
    ui.woche.gewaehlt = b; render();
  },
  'woche-plus'({ id }) { const { render, ui } = kx; if (!ui.woche || !DOMAIN_IDS.includes(id)) return; ui.woche.wheel = W.wertAendern(ui.woche.wheel, id, 1); render(); },
  'woche-minus'({ id }) { const { render, ui } = kx; if (!ui.woche || !DOMAIN_IDS.includes(id)) return; ui.woche.wheel = W.wertAendern(ui.woche.wheel, id, -1); render(); },
  // id = „heroId:modus“. Gilt sofort (wie im Heldenbogen); Grenzen der Heldenmodi bleiben.
  'woche-modus'({ id }) {
    const { T, jetzt, nameVon, render, setzeSpiel, speichere, spiel, ui } = kx;
    if (!ui.woche) return;
    const [heroId, modus] = teile(id);
    const werte = { fokus: modusName(HELDENMODI.standard), erhalt: modusName(HELDENMODI.neuOhnePlatz) };
    try {
      const r = HM.modusSetzen(spiel, heroId, modus, K.tagKey(jetzt()));
      if (r.geaendert) {
        setzeSpiel(r.spiel); speichere();
        trackEvent('hero_mode_set', { modus, fokus: HM.fokusHelden(r.spiel).length });
        ui.woche.info = T(r.ab && r.ab > K.tagKey(jetzt()) ? 'modus.abMorgen' : 'modus.gesetzt', { held: nameVon(heroId), modus: modusName(modus) });
      } else ui.woche.info = T('modus.gesetzt', { held: nameVon(heroId), modus: modusName(modus) });
    } catch (e) {
      if (e instanceof HM.ModusFehler && e.code === 'voll') ui.woche.info = T('wr.en.voll', werte);
      else if (e instanceof HM.ModusFehler && e.code === 'letzter') ui.woche.info = T('modus.letzter', werte);
      else { console.warn('Wochenrunde (Modus):', e.message); ui.woche.info = T('modus.fehler'); }
    }
    render();
  },
  'woche-abschliessen'() {
    const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    const w = ui.woche;
    if (!w) return;
    try {
      setzeSpiel(W.wocheAbschliessen(spiel, w.woche, { wheel: w.wheel, vorsatz: w.vorsatz, vorsatzHeld: w.vorsatzHeld }, K.tagKey(jetzt()), { bereichIds: new Set(DOMAIN_IDS) }));
      speichere();
    } catch (e) { console.warn('Wochenrunde:', e.message); w.fehler = T('wr.fehler'); render(); return; }
    trackEvent('week_round_done', {});
    ui.woche = null;
    kx.bestaetige(T('wr.fertig'));
    render();
  },
  // Held des Vorsatzes (leer = keiner, dann gilt er beim ersten Helden im Fokus)
  'woche-vorsatz-held'({ id }) {
    const { render, spiel, ui } = kx;
    if (!ui.woche) return;
    if (id && !spiel.helden.some(h => h.heroId === id)) { console.warn('Wochenrunde: unbekannter Held', id); return; }
    ui.woche.vorsatzHeld = id || null; render();
  },
  // „Diese Woche nicht“: bis zur nächsten Runde weg, gemerkt je Gerät, ohne Rückfrage
  'woche-karte-weg'() {
    const { jetzt, render, speicher } = kx;
    const r = W.rundenWoche(jetzt());
    try { if (r) speicher.setzeEinstellung(WOCHENRUNDE.weg, r.woche); } catch (e) { console.warn('Wochenrunde: nicht gemerkt', e.message); }
    trackEvent('week_round_dismissed', {});
    render();
  }
};
// Felder: Vorsatz tippen, ohne neu zu zeichnen (Fokus bleibt im Feld).
export const WOCHE_FELDER = {
  'woche-vorsatz': { input({ wert }) { const { ui } = kx; if (ui.woche) ui.woche.vorsatz = String(wert ?? '').slice(0, WOCHENRUNDE.vorsatzMax); } }
};

// Leise Zeile unter der Tagesfrage (Punkt 4): der Vorsatz der Woche beim zugeordneten Helden, sonst beim ersten im Fokus.
export function vorsatzZeileHtml(heroId) {
  const { T, jetzt, spiel } = kx;
  let v = null;
  try { v = W.vorsatzBeiHeld(spiel, heroId, K.tagKey(jetzt())); } catch (e) { v = null; }
  return v ? `<p class="klein wr-vorsatz-zeile">${icon('kompass')} ${esc(T('wr.vorsatz.zeile', { text: v.text }))}</p>` : '';
}
