// Kettenende: Abschluss und Weitergehen (Version 169, 09.11.2026). Daten: daten/abschluss.js, Logik: logik/abschluss.js,
// Texte: daten/texte.js (`abschluss.*`). Ist die Kette eines Helden geschafft, öffnet sich beim nächsten Öffnen der App (nicht am
// Siegtag, nie über einer anderen Ebene) eine ruhige Seite: ein Rückblick auf den eigenen Weg, einmal die Frage „Wie siehst du
// dieses Ziel?“ (Abschluss oder Meilenstein) und dann „Wie geht es weiter?“ mit drei Wegen, keiner vorgewählt.
// Mehrere Helden am selben Ende: eine Seite, ein Abschnitt je Held (wie „Willkommen zurück“).
// Daneben eine Karte im Neuigkeiten-Platz: `abschluss` (noch nichts gewählt) und `abschlussSpaeter` (leise, „Später entscheiden“
// wartet dauerhaft ohne Zähler und ohne Erinnerung). „Neues Ziel“ (Version 171) startet den Ablauf mit festem Helden, siehe daten/kapitel.js.
// Zustand nur für die Sitzung: ui.abschluss = { zu, alle, fehler, gezeigt, ergebnis: { heroId: { wahl, letzter } }, beleg: { heroId } }.
// Analytics: nur Zähler (chain_end_shown/typ/choice/…), nie Texte.
import { trackEvent } from '../analytics.js';
import { ABSCHLUSS } from '../daten/abschluss.js';
import { KAPITEL } from '../daten/kapitel.js';
import { BEWEISBUCH } from '../daten/beweisbuch.js';
import { EINTRAG_ARTEN } from '../daten/eintrag-arten.js';
import * as AB from '../logik/abschluss.js';
import * as BB from '../logik/beweisbuch.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import * as M from '../logik/mindest.js';
import { esc, kurzDatum } from './helfer.js';
import { HELDENMODI_KLICKS } from './heldenmodi.js';
import { kx } from './kontext.js';
import { rueckblickOffen } from './rueckblick.js';
import { willkommenOffen } from './willkommen.js';

const zustand = () => {
  const { ui } = kx;
  if (!ui.abschluss) ui.abschluss = { zu: false, alle: false, fehler: null, gezeigt: false, ergebnis: {}, beleg: {} };
  return ui.abschluss;
};
const heute = () => { const { jetzt } = kx; return K.tagKey(jetzt()); };

// Helden mit offener Entscheidung, denen die Seite jetzt gezeigt werden darf: [{ heroId, ...Stand }]. Wirft nie.
export function abschlussHelden(mitSpaeter = false) {
  const { spiel } = kx;
  try { return AB.abschlussHelden(spiel, heute(), { mitSpaeter }); }
  catch (e) { console.warn('Abschluss:', e.message); return []; }
}
// Abschnitte der Seite: die offenen Helden und die, über die in dieser Sitzung schon entschieden wurde (damit ihr Ergebnis
// stehen bleibt, bis man „Fertig“ tippt). Reihenfolge wie in der Heldenliste, der fokussierte zuerst.
function abschnittIds() {
  const { spiel } = kx;
  const z = zustand();
  const ids = new Set([...abschlussHelden(z.alle).map(x => x.heroId), ...Object.keys(z.ergebnis)]);
  return spiel.helden.map(h => h.heroId).filter(id => ids.has(id)).sort((a, b) => (b === spiel.fokus) - (a === spiel.fokus));
}

// Andere Ebenen haben Vorrang (Einblendung, Blätter, Notfallkarte, Begrüßung, Rückblick); die Seite wartet dann bis zum nächsten Zeichnen.
function darfZeigen() {
  const { ui } = kx;
  return ui.screen === 'start' && !ui.feier && !ui.blatt && !ui.notfall && !ui.eintrag && !ui.messziel && !ui.heldenWahl && !ui.ruhetag && !ui.karteOrt
    && !ui.woche && !ui.crew && !ui.notiz && !ui.stadtBlatt && !ui.notfallWahl && !zustand().zu && !willkommenOffen() && !rueckblickOffen();
}
export const abschlussOffen = () => darfZeigen() && abschnittIds().length > 0;

// ---------- Karte im Neuigkeiten-Platz ----------
// leise = false: noch nichts gewählt (NEU_PLATZ.vorrang, ID `abschluss`); leise = true: „Später entscheiden“ (NEU_PLATZ.leise, ID
// `abschlussSpaeter`, nur bei freiem Platz). Beide öffnen dieselbe Seite. Wirft nie.
export function abschlussKarte(leise = false) {
  const { T, nameVon } = kx;
  try {
    const l = abschlussHelden(true).filter(x => (leise ? x.spaeter : x.neu));
    if (!l.length) return '';
    const einer = l.length === 1;
    return `<div class="karte spalte abschluss-karte">
      <span class="eyebrow akzent">${esc(T('abschluss.karte.eyebrow'))}</span>
      <p class="klein">${esc(T(leise ? (einer ? 'abschluss.karte.spaeterEiner' : 'abschluss.karte.spaeterMehrere') : (einer ? 'abschluss.karte.einer' : 'abschluss.karte.mehrere'), { held: nameVon(l[0].heroId), n: l.length }))}</p>
      <button class="btn voll" data-a="abschluss-oeffnen">${esc(T(leise ? 'abschluss.karte.ansehen' : 'abschluss.karte.oeffnen'))}</button>
    </div>`;
  } catch (e) { console.warn('Abschluss (Karte):', e.message); return ''; }
}

// ---------- Seite ----------
// Ein Gruß des früheren Ichs (Brief, sonst markierter Eintrag), höchstens einer, einmal gezogen und gemerkt. Wirft nie.
function belegHtml(heroId) {
  const { T, spiel } = kx;
  if (!BEWEISBUCH.willkommen) return '';
  try {
    const z = zustand();
    if (z.beleg[heroId] === undefined) { const b = BB.belegFuer(spiel, heroId, { arten: EINTRAG_ARTEN }); z.beleg[heroId] = b ? { id: b.eintrag.id, art: b.art } : null; }
    const g = z.beleg[heroId];
    if (!g) return '';
    const e = (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).find(x => x && x.id === g.id);
    const text = e ? BB.belegText(e) : '';
    if (!text) return '';
    return `<div class="wk-beleg"><p class="klein">${esc(T(`abschluss.beleg.${g.art === 'merken' ? 'merken' : 'brief'}`, { datum: kurzDatum(e.tag) }))}</p><p class="notfall-warum" style="white-space:pre-wrap">${esc(text)}</p></div>`;
  } catch (err) { console.warn('Abschluss (Beleg):', err.message); return ''; }
}

function rueckschauHtml(r) {
  const { T } = kx;
  const zeilen = [];
  if (r.start && r.tage > 0) zeilen.push(T(r.tage === 1 ? 'abschluss.rueck.startEiner' : 'abschluss.rueck.start', { datum: kurzDatum(r.start), n: r.tage }));
  if (r.kette > 0) zeilen.push(T(r.kette === 1 ? 'abschluss.rueck.ketteEine' : 'abschluss.rueck.kette', { n: r.kette }));
  if (r.wiedereinstiege > 0) zeilen.push(T(r.wiedereinstiege === 1 ? 'abschluss.rueck.wiederEinmal' : 'abschluss.rueck.wieder', { n: r.wiedereinstiege }));
  if (r.warum) zeilen.push(T('abschluss.rueck.warum', { warum: r.warum }));
  if (!zeilen.length) return '';
  return `<div class="abschluss-rueck"><span class="eyebrow">${esc(T('abschluss.rueck.eyebrow'))}</span>${zeilen.map(z => `<p class="klein">${esc(z)}</p>`).join('')}</div>`;
}

function mindestHtml(heroId) {
  const { T, jetzt, spiel } = kx;
  let st = null;
  try { st = M.mindestStand(spiel, heroId, jetzt()); } catch (e) { return ''; }
  if (!st.gilt) return '';
  if (st.aufgabe) return `<p class="klein">${esc(T('abschluss.mindest.da', { taetigkeit: st.aufgabe.taetigkeit }))}</p>`;
  return `<p class="klein">${esc(T('abschluss.mindest.frage'))}</p><button class="btn" data-a="abschluss-mindest" data-id="${esc(heroId)}">${esc(T('abschluss.mindest.festlegen'))}</button>`;
}

// Wege in Anzeigereihenfolge: „Neues Ziel“ (Version 171, wird nicht als Entscheidung gespeichert) steht vor „Später entscheiden“.
const wegeMitNeu = () => { const w = ABSCHLUSS.wege.slice(); w.splice(Math.max(0, w.length - 1), 0, KAPITEL.weg); return w; };

function abschnitt(id, mehrere) {
  const { T, img, nameVon, spiel, wort } = kx;
  const st = AB.abschlussStand(spiel, id, heute());
  if (!st.erreicht) return '';
  const z = zustand();
  const werte = { held: nameVon(id), erhalt: wort('modus_erhalt'), fokus: wort('modus_fokus'), n: st.bezug };
  const r = AB.rueckschau(H.ansicht(spiel, id), heute());
  const typ = st.typ;
  const erg = z.ergebnis[id] || null;
  const werteText = { ...werte, ziel: r.ziel };
  const kopf = mehrere ? `<div class="abschluss-kopf">${img(id, nameVon(id), 'held', 'wk-mini', '')}<span class="nm">${esc(nameVon(id))}</span></div>` : '';
  const typKnoepfe = `<span class="klein" id="ab-typ-l-${esc(id)}">${esc(T('abschluss.typ.frage'))}</span>
    <div class="wahl abschluss-typ" role="group" aria-labelledby="ab-typ-l-${esc(id)}">${ABSCHLUSS.typen.map(t => `<button class="opt ${typ === t ? 'sel' : ''}" aria-pressed="${typ === t}" data-a="abschluss-typ" data-id="${esc(`${id}|${t}`)}"><span>${esc(T(`abschluss.typ.${t}`))}<small>${esc(T(`abschluss.typ.${t}.text`))}</small></span></button>`).join('')}</div>
    <p class="klein">${esc(T('abschluss.typ.klein'))}</p>`;
  let weiter = '';
  if (erg) {
    weiter = `<div class="abschluss-ergebnis" role="status"><p class="lead">${esc(T(`abschluss.fertig.${erg.wahl}`, werte))}</p>
      ${erg.wahl === 'erhalt' && erg.letzter ? `<p class="klein">${esc(T('abschluss.fertig.erhaltLetzter', werte))}</p>` : ''}
      ${erg.wahl === 'erhalt' ? mindestHtml(id) : ''}</div>`;
  } else if (typ) {
    weiter = `<span class="eyebrow">${esc(T('abschluss.weg.frage'))}</span><p class="klein">${esc(T('abschluss.weg.keinDruck'))}</p>
      <div class="abschluss-wege">${wegeMitNeu().map(w => `<button class="opt" ${w === KAPITEL.weg ? `data-a="abschluss-neu" data-id="${esc(id)}"` : `data-a="abschluss-weg" data-id="${esc(`${id}|${w}`)}"`}><span>${esc(T(`abschluss.weg.${w}`, werte))}<small>${esc(T(`abschluss.weg.${w}.text`, werte))}</small></span></button>`).join('')}</div>`;
  }
  return `<section class="abschluss-held" aria-label="${esc(nameVon(id))}">${kopf}
    <span class="eyebrow akzent">${esc(T(`abschluss.eyebrow.${typ || 'offen'}`))}</span>
    <p class="lead">${esc(T(`abschluss.text.${typ || 'offen'}`, werteText))}</p>
    ${rueckschauHtml(r)}${belegHtml(id)}
    ${erg ? '' : typKnoepfe}${weiter}
  </section>`;
}

export function abschlussSeiteHtml() {
  const { T } = kx;
  if (!darfZeigen()) return '';
  const ids = abschnittIds();
  if (!ids.length) return '';
  const z = zustand();
  if (!z.gezeigt) { z.gezeigt = true; trackEvent('chain_end_shown', { helden: ids.length }); }
  const teile = ids.map(id => { try { return abschnitt(id, ids.length > 1); } catch (e) { console.warn('Abschluss:', e.message); return ''; } }).filter(Boolean);
  if (!teile.length) return '';
  const alleFertig = ids.every(id => z.ergebnis[id]);
  return `<div class="feier ruhe-seite abschluss-seite erscheint" role="dialog" aria-modal="true" aria-labelledby="abschluss-t">
    <div class="nf-seite">
      <div class="nf-kopf"><span></span><button class="link" data-a="abschluss-zu">${esc(T('abschluss.spaeterSitzung'))}</button></div>
      <div class="nf-inhalt">
        <h2 id="abschluss-t">${esc(T('abschluss.titel'))}</h2>
        ${teile.join('')}
        ${z.fehler ? `<p class="fehler" role="alert">${esc(z.fehler)}</p>` : ''}
        ${alleFertig ? `<button class="cta" data-a="abschluss-fertig">${esc(T('abschluss.fertigKnopf'))}</button>` : ''}
      </div>
    </div>
  </div>`;
}

// ---------- Klicks ----------
// id = „heroId|wert“. Nur Helden, die jetzt in der Seite stehen, werden angenommen (alles andere: Warnung, nichts ändert sich).
const teile = id => { const t = String(id || '').split('|'); return t.length === 2 && t[0] && t[1] ? t : null; };
function entscheide(id, aktion) {
  const { render, setzeSpiel, speichere, spiel, T } = kx;
  const z = zustand();
  const p = teile(id);
  z.fehler = null;
  if (!p) { console.warn('Abschluss: ungültige Angabe', id); render(); return; }
  const [heroId, wert] = p;
  if (!abschnittIds().includes(heroId)) { console.warn('Abschluss: Held nicht fällig', heroId); render(); return; }
  try {
    if (aktion === 'typ') {
      const r = AB.typSetzen(spiel, heroId, wert, heute());
      if (r.geaendert) { setzeSpiel(r.spiel); speichere(); trackEvent('chain_end_type', { typ: wert }); }
    } else {
      const r = AB.wahlSetzen(spiel, heroId, wert, heute());
      if (r.geaendert) { setzeSpiel(r.spiel); speichere(); }
      z.ergebnis[heroId] = { wahl: wert, letzter: r.letzterFokus };
      trackEvent('chain_end_choice', { wahl: wert, typ: AB.abschlussStand(kx.spiel, heroId, heute()).typ || '' });
    }
  } catch (e) {
    console.warn('Abschluss:', e.message);
    z.fehler = e instanceof AB.AbschlussFehler ? e.message : T('abschluss.fehler');
  }
  render();
}

export const ABSCHLUSS_KLICKS = {
  'abschluss-typ'({ id }) { entscheide(id, 'typ'); },
  'abschluss-weg'({ id }) { entscheide(id, 'weg'); },
  // Neues Ziel (Version 171): nichts wird gespeichert, bis das neue Ziel angelegt ist. Die Seite schließt sich für diese Sitzung und
  // der Ablauf „Ein neues Ziel“ beginnt mit festem Helden (ui.kapitelFuer). Abbrechen lässt alles beim Alten (Entscheidung bleibt offen).
  'abschluss-neu'({ id }) {
    const { geheZu, render, spiel, ui } = kx;
    const z = zustand();
    if (!abschnittIds().includes(id) || !AB.abschlussStand(spiel, id, heute()).erreicht) { console.warn('Abschluss: Held nicht fällig', id); render(); return; }
    z.zu = true;
    Object.assign(ui, { heldenWahl: false, blatt: null, neu: true, kapitelFuer: id, mehrfach: null, bereich: null, problem: null, ziel: null, freitext: '', warum: '', zielart: 'aendern', zq: null, obStart: Date.now() });
    trackEvent('chapter_new_started', {});
    geheZu(kx.obAnfang());
  },
  // Die Mindestaufgabe legt das vorhandene Formular fest (Heldenblatt, Abschnitt „Das Kleinste, das noch zählt“): die Seite schließt
  // sich, der Held wird der aktive, und das Blatt mit dem Formular öffnet sich.
  'abschluss-mindest'({ id }) {
    const { setzeSpiel, speichere, spiel, render } = kx;
    const z = zustand();
    const e = z.ergebnis[id];
    if (!e || e.wahl !== 'erhalt') { console.warn('Abschluss: Mindestaufgabe nur nach „Erhalt“', id); render(); return; }
    try {
      if (spiel.fokus !== id) { setzeSpiel(H.fokusSetzen(spiel, id)); speichere(); }
    } catch (err) { console.warn('Abschluss:', err.message); render(); return; }
    z.zu = true;
    trackEvent('chain_end_minimum', {});
    HELDENMODI_KLICKS['mindest-neu']({});
  },
  // „Fertig“: die Seite ist für diese Sitzung abgeschlossen (die Entscheidungen stehen schon im Spielstand).
  'abschluss-fertig'() { const { render } = kx; zustand().zu = true; trackEvent('chain_end_done', {}); render(); },
  // „Jetzt nicht“: nur für diese Sitzung. Nichts wird gespeichert; beim nächsten Öffnen oder über die Karte ist die Seite wieder da.
  'abschluss-zu'() { const { render } = kx; zustand().zu = true; trackEvent('chain_end_not_now', {}); render(); },
  // Karte: öffnet die Seite wieder, auch für Helden, die „Später entscheiden“ gewählt haben
  'abschluss-oeffnen'() { const { render } = kx; const z = zustand(); z.zu = false; z.alle = true; z.ergebnis = {}; z.fehler = null; trackEvent('chain_end_card_open', {}); render(); }
};
