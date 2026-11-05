// Ruhetag (Version 90): leiser Link unter der Heldentat und ein Blatt zum Einplanen. Regeln: daten/ruhetag.js,
// Logik: logik/ruhetag.js (status, setzen, entfernen), Wirkung auf die Runde: logik/kern.js (runden).
// Entscheidung 31.10.2026: Runde verlängert sich um einen Tag (1a), einer je Runde und Held (2a), vorab oder bis
// zurueckTage nachträglich (3b), im Blatt alle Helden vorgewählt und abwählbar (4c).
// Ton: Pause ist erlaubt. Kein Rot, keine XP, kein „verpasst“; das Blatt erklärt die Wirkung in einem Satz.
// Zustand nur für die Sitzung: ui.ruhetag = { tag, aus: [heroId, …] (abgewählt), fehler, meldung } oder null.
import { trackEvent } from '../analytics.js';
import { EINTRAG_OPT } from '../daten/eintrag-arten.js';
import { RUHETAG } from '../daten/ruhetag.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import * as RT from '../logik/ruhetag.js';
import { esc, icon, kurzDatum, kachel } from './helfer.js';
import { kx } from './kontext.js';

const heuteK = () => { const { jetzt } = kx; return K.tagKey(jetzt()); };
const vorlageVon = h => TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId) || null;
const heldName = h => { const { nameVon } = kx; const v = vorlageVon(h); return v ? nameVon(v.held) : h.heroId; };

// „Heute“, „Morgen“, „Gestern“, „Vorgestern“, sonst der Wochentag
function tagName(tag) {
  const { T } = kx;
  const d = Math.round((K.ausTagKey(tag) - K.ausTagKey(heuteK())) / 864e5);
  if (d === 0) return T('ruhetag.heute');
  if (d === 1) return T('ruhetag.morgen');
  if (d === -1) return T('ruhetag.gestern');
  if (d === -2) return T('ruhetag.vorgestern');
  return K.ausTagKey(tag).toLocaleDateString('de-AT', { weekday: 'long' });
}

const heuteRuhetag = () => { const { spiel } = kx; return !!spiel.fokus && RT.ruhetageVon(spiel, spiel.fokus, heuteK())[0] === heuteK(); };
// Leiser Link unter der Heldentat (Held im Rampenlicht): heute Ruhetag, geplanter Ruhetag oder „einplanen“.
// ohneHeute: im „Rat für heute“ nichts zeigen, wenn heute Ruhetag ist (dann steht er schon sichtbar über der Frage).
export function ruhetagLink({ ohneHeute = false, alsKachel = false } = {}) {
  const { T, spiel } = kx;
  if (!RUHETAG.an || !spiel.fokus) return '';
  if (ohneHeute && heuteRuhetag()) return '';
  const h = heuteK();
  const geplant = RT.ruhetageVon(spiel, spiel.fokus, h);
  const text = geplant[0] === h ? T('ruhetag.linkHeute') : geplant.length ? T('ruhetag.linkGeplant', { tag: kurzDatum(geplant[0]) }) : T('ruhetag.link');
  if (alsKachel) return kachel({ aktion: 'ruhetag-blatt', symbol: icon('tasse'), kurz: geplant.length ? T('kachel.ruhetagAm', { tag: kurzDatum(geplant[0]) }) : T('kachel.ruhetag'), lang: text, klasse: 'ruhetag' }); // Version 93
  return `<button class="link eintrag-link ruhetag-link" data-a="ruhetag-blatt">${icon('tasse')}${esc(text)}</button>`;
}

// Kampfbühne vor dem Check: ist heute Ruhetag, steht das als leise Zeile über der Frage (antippen öffnet das Blatt).
export function ruhetagHeuteZeile() {
  if (!RUHETAG.an || !heuteRuhetag()) return '';
  return `<div class="ruhetag-heute">${ruhetagLink()}</div>`;
}

// Hinweiszeile für das Gegnerblatt: Ruhetag in der laufenden Runde
export function ruhetagRundeText(a) {
  const { T } = kx;
  const l = a && Array.isArray(a.ruhetageRunde) ? a.ruhetageRunde : [];
  return l.length ? ` ${T('ruhetag.inRunde', { tag: kurzDatum(l[0]) })}` : '';
}

function grundText(st) {
  const { T } = kx;
  if (st.grund === 'kontingent') return T('ruhetag.grund.kontingent', { tag: kurzDatum(st.vorhanden) });
  return T(`ruhetag.grund.${['gesetzt', 'angewendet', 'gewonnen', 'vorbei', 'vorStart', 'ohneZeit'].includes(st.grund) ? st.grund : 'sonst'}`);
}

// Blatt: Tag wählen, Helden (alle vorgewählt), eintragen; darunter die eingetragenen Ruhetage zum Entfernen.
export function ruhetagBlattHtml() {
  const { T, img, jetzt, spiel, ui } = kx;
  const u = ui.ruhetag;
  if (!u) return '';
  if (ui.screen !== 'start' || !spiel.helden.length) { ui.ruhetag = null; return ''; }
  const tage = RT.waehlbareTage(jetzt(), RUHETAG);
  const tagWahl = tage.map(t => `<button class="opt kurz ${u.tag === t.tag ? 'sel' : ''}" aria-pressed="${u.tag === t.tag}" data-a="ruhetag-tag" data-id="${esc(t.tag)}"><span class="spalte"><span>${esc(tagName(t.tag))}</span><small>${esc(kurzDatum(t.tag))}</small></span></button>`).join('');
  const helden = [...spiel.helden].sort((a, b) => (a.heroId === spiel.fokus ? -1 : b.heroId === spiel.fokus ? 1 : 0));
  const zeilen = helden.map(h => {
    const st = RT.status(spiel, h.heroId, u.tag, jetzt(), RUHETAG);
    const an = st.ok && !u.aus.includes(h.heroId);
    const v = vorlageVon(h);
    const info = st.ok ? T('ruhetag.bis', { bis: kurzDatum(K.tagKey(new Date(K.ausTagKey(st.runde.bis).getTime() + 864e5))) }) : grundText(st);
    return `<li><button class="opt ruhetag-held ${an ? 'sel' : ''}" aria-pressed="${an}" data-a="ruhetag-held" data-id="${esc(h.heroId)}" ${st.ok ? '' : 'disabled'}>
      ${v ? img(v.held, heldName(h), 'held', 'rund-klein', '') : ''}<span class="spalte"><span class="nm">${esc(heldName(h))}</span><small>${esc(info)}</small></span>${an ? icon('check') : ''}</button></li>`;
  }).join('');
  const h = heuteK();
  const liste = helden.flatMap(x => RT.ruhetageVon(spiel, x.heroId, null)
    .filter(t => RT.entfernbar(spiel, x.heroId, t, jetzt(), RUHETAG))
    .map(t => ({ heroId: x.heroId, tag: t })))
    .sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const eingetragen = liste.length ? `<span class="eyebrow">${esc(T('ruhetag.eingetragen'))}</span>
    <ul class="ruhetag-liste">${liste.map(x => `<li><span>${esc(heldName(H.heldVon(spiel, x.heroId)))} · ${esc(tagName(x.tag))}${x.tag === h ? '' : `, ${esc(kurzDatum(x.tag))}`}</span><button class="link" data-a="ruhetag-entfernen" data-id="${esc(`${x.heroId}|${x.tag}`)}">${esc(T('ruhetag.entfernen'))}</button></li>`).join('')}</ul>` : '';
  const moeglich = helden.some(x => RT.status(spiel, x.heroId, u.tag, jetzt(), RUHETAG).ok && !u.aus.includes(x.heroId));
  return `<div class="feier unten ruhetag-blatt" role="dialog" aria-modal="true" aria-labelledby="ruhetag-t">
    <button class="hintergrund" data-a="ruhetag-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(T('ruhetag.eyebrow'))}</span>
        <h2 id="ruhetag-t">${esc(T('ruhetag.titel'))}</h2>
        <p class="klein">${esc(T('ruhetag.text'))}</p>
        <p class="klein">${esc(T('ruhetag.regel'))}</p>
        <span class="eyebrow">${esc(T('ruhetag.welcherTag'))}</span>
        <div class="wahl ruhetag-tage" role="group" aria-label="${esc(T('ruhetag.welcherTag'))}">${tagWahl}</div>
        ${helden.length > 1 ? `<span class="eyebrow">${esc(T('ruhetag.fuer'))}</span>` : ''}
        <ul class="ruhetag-helden">${zeilen}</ul>
        ${u.fehler ? `<p class="fehler" role="alert">${esc(u.fehler)}</p>` : ''}
        ${u.meldung ? `<p class="klein gut-text" role="status">${esc(u.meldung)}</p>` : ''}
        <button class="cta" data-a="ruhetag-setzen" ${moeglich ? '' : 'disabled'}>${esc(T('ruhetag.setzen'))}</button>
        ${eingetragen}
        <button class="link" data-a="ruhetag-zu">${esc(T('nav.schliessen'))}</button>
      </div>
    </div>
  </div>`;
}

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
// Analytics zählt nur Öffnen, Setzen (Anzahl Helden, vorab/heute/nachträglich) und Entfernen, nie Held oder Tag.
export const RUHETAG_KLICKS = {
  'ruhetag-blatt'() {
    const { render, spiel, ui } = kx;
    if (!RUHETAG.an || !spiel.helden.length) return;
    const h = heuteK();
    // Vorwahl: der nächste schon geplante Tag des Helden im Rampenlicht, sonst heute
    const geplant = RT.ruhetageVon(spiel, spiel.fokus, h);
    ui.ruhetag = { tag: geplant[0] || h, aus: RUHETAG.alleVorwahl === false ? spiel.helden.map(x => x.heroId).filter(id => id !== spiel.fokus) : [], fehler: null, meldung: null };
    trackEvent('rest_day_opened', {});
    render();
  },
  'ruhetag-zu'() { const { render, ui } = kx; ui.ruhetag = null; render(); },
  'ruhetag-tag'({ id }) {
    const { jetzt, render, ui } = kx;
    if (!ui.ruhetag) return;
    if (!RT.waehlbareTage(jetzt(), RUHETAG).some(t => t.tag === id)) { console.warn('Ruhetag: Tag nicht wählbar', id); return; }
    Object.assign(ui.ruhetag, { tag: id, fehler: null, meldung: null });
    render();
  },
  'ruhetag-held'({ id }) {
    const { render, spiel, ui } = kx;
    if (!ui.ruhetag) return;
    if (!H.heldVon(spiel, id)) { console.warn('Ruhetag: unbekannter Held', id); return; }
    const aus = ui.ruhetag.aus;
    ui.ruhetag.aus = aus.includes(id) ? aus.filter(x => x !== id) : [...aus, id];
    Object.assign(ui.ruhetag, { fehler: null, meldung: null });
    render();
  },
  'ruhetag-setzen'() {
    const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    const u = ui.ruhetag;
    if (!u) return;
    const ids = spiel.helden.map(h => h.heroId).filter(id => !u.aus.includes(id) && RT.status(spiel, id, u.tag, jetzt(), RUHETAG).ok);
    try {
      const r = RT.setzen(spiel, ids, u.tag, jetzt(), RUHETAG, EINTRAG_OPT);
      if (!r.gesetzt.length) { u.fehler = T('ruhetag.keiner'); render(); return; }
      setzeSpiel(r.spiel);
      speichere();
      const namen = r.gesetzt.map(g => heldName(H.heldVon(r.spiel, g.heroId))).join(', ');
      u.meldung = T(spiel.helden.length > 1 ? 'ruhetag.fertigFuer' : 'ruhetag.fertig', { namen, tag: tagName(u.tag) });
      u.fehler = null;
      const h = heuteK();
      trackEvent('rest_day_set', { helden: r.gesetzt.length, wann: u.tag > h ? 'vorab' : u.tag === h ? 'heute' : 'nachtraeglich' });
    } catch (e) {
      u.fehler = T('ruhetag.fehler', { grund: e.message });
      u.meldung = null;
    }
    render();
  },
  'ruhetag-entfernen'({ id }) {
    const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    if (!ui.ruhetag) return;
    const [heroId, tag] = String(id ?? '').split('|');
    try {
      setzeSpiel(RT.entfernen(spiel, heroId, tag, jetzt(), RUHETAG));
      speichere();
      Object.assign(ui.ruhetag, { meldung: T('ruhetag.entfernt'), fehler: null });
      trackEvent('rest_day_removed', {});
    } catch (e) {
      Object.assign(ui.ruhetag, { fehler: T('ruhetag.fehler', { grund: e.message }), meldung: null });
    }
    render();
  }
};
