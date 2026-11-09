// Willkommen zurück (Version 98, Etappe 2 B, Entscheidungen Abschnitt 26): ruhige Seite über der App nach einer Lücke.
// Daten: daten/willkommen.js, Logik: logik/willkommen.js. Zustand nur für diese Sitzung: ui.willkommen = { grund, zu, fehler, gezeigt }.
// Mehrere Helden mit Lücke: eine Seite, Wahl je Held. Die Seite schließt sich, wenn für alle gewählt ist.
import { trackEvent } from '../analytics.js';
import { EINTRAG_OPT } from '../daten/eintrag-arten.js';
import { WILLKOMMEN } from '../daten/willkommen.js';
import * as EN from '../logik/eintraege.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import * as W from '../logik/willkommen.js';
import { BEWEISBUCH } from '../daten/beweisbuch.js'; // Version 166: Gruß aus dem Beweisbuch
import { EINTRAG_ARTEN } from '../daten/eintrag-arten.js';
import * as BB from '../logik/beweisbuch.js';
import { esc, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

const zustand = () => { const { ui } = kx; if (!ui.willkommen) ui.willkommen = { grund: null, zu: false, fehler: null, gezeigt: false }; return ui.willkommen; };

// Helden, für die die Seite fällig ist (Reihenfolge wie in der Heldenliste, der fokussierte zuerst)
export function willkommenHelden() {
  const { jetzt, spiel } = kx;
  const heute = K.tagKey(jetzt());
  const eintraege = Array.isArray(spiel.eintraege) ? spiel.eintraege : [];
  const ids = spiel.helden.map(h => h.heroId).sort((a, b) => (b === spiel.fokus) - (a === spiel.fokus));
  return ids.filter(id => {
    try { return W.faellig(H.ansicht(spiel, id), heute, eintraege.filter(e => e && e.heroId === id), WILLKOMMEN); }
    catch (e) { console.warn('Willkommen zurück:', e.message); return false; }
  });
}

// Andere Ebenen haben Vorrang (Einblendung, Blätter, Notfallkarte); die Seite wartet dann bis zum nächsten Zeichnen.
function darfZeigen() {
  const { ui } = kx;
  return ui.screen === 'start' && !ui.feier && !ui.blatt && !ui.notfall && !ui.eintrag && !ui.messziel && !ui.heldenWahl && !ui.ruhetag && !ui.karteOrt && !zustand().zu;
}
export const willkommenOffen = () => darfZeigen() && willkommenHelden().length > 0;

// Version 99 (Optik): Begrüßung im Stil-Look statt Formular. Kulisse gedämpft, Satz des Helden als Sprechblase, Gründe als
// kleine Chips. Ein Held: „Dort weitermachen“ groß, „Lieber frisch anfangen“ als Textlink. Mehrere Helden: je Held eine
// leichte Zeile (Tipp schaltet weitermachen ↔ frisch anfangen, weitermachen vorgewählt), dann ein Knopf für alle.
const wahlVon = id => { const z = zustand(); return (z.wahl && z.wahl[id]) || WILLKOMMEN.vorwahl; };

// Gruß des früheren Ichs (Version 166): ein Brief an mich, sonst ein markierter Eintrag, höchstens einer, einmal gezogen
// (z.beleg), damit Neuzeichnen ihn nicht wechselt. Nichts da → nichts (kein leerer Kasten). Wirft nie.
function belegHtml(heroId) {
  const { T, spiel } = kx;
  if (!BEWEISBUCH.willkommen) return '';
  try {
    const z = zustand();
    if (z.beleg === undefined) { const b = BB.belegFuer(spiel, heroId, { arten: EINTRAG_ARTEN }); z.beleg = b ? { id: b.eintrag.id, art: b.art } : null; }
    if (!z.beleg) return '';
    const e = (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).find(x => x && x.id === z.beleg.id);
    const text = e ? BB.belegText(e) : '';
    if (!text) return '';
    return `<div class="wk-beleg"><p class="klein">${esc(T('willkommen.gruss.' + (z.beleg.art === 'merken' ? 'merken' : 'brief'), { datum: kurzDatum(e.tag) }))}</p><p class="notfall-warum" style="white-space:pre-wrap">${esc(text)}</p></div>`;
  } catch (err) { console.warn('Willkommen zurück (Beleg):', err.message); return ''; }
}

export function willkommenHtml() {
  const { T, img, jetzt, nameVon, spiel, wort } = kx;
  if (!darfZeigen()) return '';
  const ids = willkommenHelden();
  if (!ids.length) return '';
  const z = zustand();
  if (!z.gezeigt) { z.gezeigt = true; trackEvent('welcome_back_shown', { helden: ids.length }); }
  const siege = ids.reduce((n, id) => { const h = spiel.helden.find(x => x.heroId === id); return n + ((h && Array.isArray(h.siege)) ? h.siege.length + H.siegeFrueher(spiel, id) : 0); }, 0);
  const einer = ids.length === 1;
  // Auffrischung (Version 159): nach einer langen Pause ein zusätzlicher ruhiger Satz. Ohne Zahl der Tage, ohne Wertung und
  // ohne den Bonus anzukündigen (er kommt als leise Zeile nach dem ersten guten Tag, siehe daten/auffrischung.js).
  const heuteK = K.tagKey(jetzt());
  const lang = ids.some(id => { try { return W.langePauseFuer(H.ansicht(spiel, id), heuteK); } catch (e) { return false; } });
  const satz = T(`willkommen.satz.${W.satzNr(K.tagKey(jetzt()), ids[0], WILLKOMMEN.saetze)}`);
  const gruende = `<p class="klein">${esc(T('willkommen.wasWar'))}</p><div class="wk-gruende" role="group" aria-label="${esc(T('willkommen.wasWar'))}">${WILLKOMMEN.gruende.map(g => `<button class="wahl-chip ${z.grund === g ? 'an' : ''}" aria-pressed="${z.grund === g}" data-a="willkommen-grund" data-id="${esc(g)}">${esc(T(`eintrag.sit.${g}`))}</button>`).join('')}</div>`;
  const zeile = id => {
    const w = wahlVon(id);
    return `<button class="wk-held ${w === 'neustart' ? 'frisch' : ''}" aria-pressed="${w === 'neustart'}" data-a="willkommen-umschalten" data-id="${esc(id)}">${img(id, nameVon(id), 'held', 'wk-mini', '')}<span class="nm">${esc(nameVon(id))}</span><span class="wk-macht">${esc(T(`willkommen.macht.${w}`))}</span></button>`;
  };
  const wahl = einer
    ? `<button class="cta" data-a="willkommen-weiter" data-id="${esc(ids[0])}">${esc(T('willkommen.weiter'))}</button>
       <button class="link wk-frisch" data-a="willkommen-frisch" data-id="${esc(ids[0])}">${esc(T('willkommen.lieberFrisch'))}</button>
       <p class="klein">${esc(T('willkommen.frischText', { kapitel: wort('kapitel') }))}</p>`
    : `<p class="klein">${esc(T('willkommen.waehleText'))}</p><div class="wk-helden">${ids.map(zeile).join('')}</div>
       <button class="cta" data-a="willkommen-los">${esc(T('willkommen.los'))}</button>
       <p class="klein">${esc(T('willkommen.frischText', { kapitel: wort('kapitel') }))}</p>`;
  return `<div class="feier ruhe-seite willkommen-seite erscheint" role="dialog" aria-modal="true" aria-labelledby="willkommen-t">
    <div class="nf-seite">
      <div class="nf-kopf"><span></span><button class="link" data-a="willkommen-zu">${esc(T('willkommen.spaeter'))}</button></div>
      <div class="nf-inhalt">
        <div class="wk-gruss"><span class="wk-portrait">${img(ids[0], nameVon(ids[0]), 'held', 'cover', '')}</span>
          <p class="blase wk-blase"><b>${esc(nameVon(ids[0]))}</b>${esc(satz)}</p></div>
        <h2 id="willkommen-t">${esc(T('willkommen.titel'))}</h2>
        <p class="lead">${esc(T(einer ? 'willkommen.textEiner' : 'willkommen.textMehrere', { held: nameVon(ids[0]) }))} ${esc(T(siege ? 'willkommen.bleibtSiege' : 'willkommen.bleibt', { gegner: wort('gegner') }))}</p>
        ${lang ? `<p class="lead wk-lang">${esc(T('willkommen.lang'))}</p>` : ''}
        ${belegHtml(ids[0])}
        ${gruende}
        ${z.fehler ? `<p class="fehler" role="alert">${esc(z.fehler)}</p>` : ''}
        ${wahl}
      </div>
    </div>
  </div>`;
}

// Wahl eintragen: art 'neustart' (Frisch anfangen) oder 'wiederda' (Dort weitermachen), Grund optional.
// Mehrere Helden in einem Rutsch: jeder Eintrag baut auf dem vorigen Spielstand auf; scheitert einer, bleiben die
// schon eingetragenen erhalten (die Seite zeigt dann nur noch die übrigen Helden mit Fehlerhinweis).
function waehle(paare) {
  const { jetzt, render, setzeSpiel, speichere } = kx;
  const z = zustand();
  const faellig = willkommenHelden();
  let geaendert = false;
  z.fehler = null;
  for (const [id, art] of paare) {
    if (!faellig.includes(id)) { console.warn('Willkommen zurück: Held nicht fällig', id); continue; }
    try {
      const r = EN.eintragHinzufuegen(kx.spiel, id, { art, situation: z.grund }, jetzt(), EINTRAG_OPT);
      setzeSpiel(r.spiel);
      geaendert = true;
      trackEvent(art === 'neustart' ? 'welcome_fresh' : 'welcome_continue', { grund: !!z.grund });
    } catch (e) {
      console.warn('Willkommen zurück:', e.message);
      z.fehler = e instanceof EN.EintragFehler ? e.message : 'Das hat nicht geklappt.';
      break;
    }
  }
  if (geaendert) speichere();
  render();
}

export const WILLKOMMEN_KLICKS = {
  'willkommen-frisch'({ id }) { waehle([[id, 'neustart']]); },
  'willkommen-weiter'({ id }) { waehle([[id, 'wiederda']]); },
  // Mehrere Helden: Tipp auf die Zeile schaltet zwischen weitermachen und frisch anfangen
  'willkommen-umschalten'({ id }) {
    const { render } = kx;
    const z = zustand();
    if (!willkommenHelden().includes(id)) { console.warn('Willkommen zurück: Held nicht fällig', id); render(); return; }
    z.wahl = { ...(z.wahl || {}), [id]: wahlVon(id) === 'neustart' ? 'wiederda' : 'neustart' };
    render();
  },
  'willkommen-los'() { waehle(willkommenHelden().map(id => [id, wahlVon(id)])); },
  'willkommen-grund'({ id }) { const { render } = kx; const z = zustand(); if (WILLKOMMEN.gruende.includes(id)) z.grund = z.grund === id ? null : id; render(); },
  // „Später“: nur für diese Sitzung; beim nächsten Öffnen kommt die Seite wieder (die Lücke ist ja noch da)
  'willkommen-zu'() { const { render } = kx; zustand().zu = true; trackEvent('welcome_later', {}); render(); }
};
