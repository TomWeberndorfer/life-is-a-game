// Rundenrückblick (Etappe 2, Schritt D, 02.11.2026, Entscheidungen Abschnitt 26). Daten: daten/rueckblick.js,
// Logik: logik/rueckblick.js. Eine Karte im Neuigkeiten-Platz (zählt ins Tageslimit) öffnet eine ruhige Seite über der
// App: je Held mit beendeter Runde ein Brief mit den Siegeln der Runde, „Was hat geholfen?“ (Notizen der Runde als Chips,
// dazu eigener Text) und „Zu leicht / Passt / Zu schwer“ mit Vorschlag. Mehrere Helden: eine Seite, ein Abschnitt je Held
// (Entscheidung 1b vom 02.11.). „Diesmal überspringen“ gilt als besprochen und ändert nichts (Entscheidung 2).
// Zustand nur für die Sitzung: ui.rueckblick = { offen, zu, wahl: {heroId}, hilft: {heroId: [ids]}, text: {heroId},
// eigenes: {heroId}, fehler, gezeigt }.
// Analytics (Entscheidung 4a): nur Zähler je Einschätzung und ob übernommen; nie Text oder Notizen.
import { trackEvent } from '../analytics.js';
import { CHRONIK_SIEGEL } from '../daten/chronik.js';
import { EINTRAG_OPT } from '../daten/eintrag-arten.js';
import { BOTSCHAFTEN } from '../daten/inhalte.js';
import { RUECKBLICK, RUECKBLICK_SIEGEL } from '../daten/rueckblick.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as EN from '../logik/eintraege.js';
import * as H from '../logik/helden.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import * as RB from '../logik/rueckblick.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { willkommenHelden } from './willkommen.js';

const zustand = () => {
  const { ui } = kx;
  if (!ui.rueckblick) ui.rueckblick = { offen: false, zu: false, wahl: {}, hilft: {}, text: {}, eigenes: {}, fehler: null, gezeigt: false };
  return ui.rueckblick;
};
const heute = () => { const { jetzt } = kx; return K.tagKey(jetzt()); };
const eintraegeVon = id => { const { spiel } = kx; return (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).filter(e => e && e.heroId === id); };

// Helden mit fälliger Runde: [{ id, runde }] (fokussierter Held zuerst). Helden, für die gerade „Willkommen zurück“ dran
// ist, warten (dort wird erst über die Lücke entschieden). Fehler eines Helden lassen die anderen unberührt.
export function rueckblickHelden() {
  const { spiel } = kx;
  let wartet = [];
  try { wartet = willkommenHelden(); } catch (e) { console.warn('Rückblick:', e.message); }
  const ids = spiel.helden.map(h => h.heroId).sort((a, b) => (b === spiel.fokus) - (a === spiel.fokus));
  const aus = [];
  for (const id of ids) {
    if (wartet.includes(id)) continue;
    try {
      const runde = RB.faelligeRunde(H.ansicht(spiel, id), heute(), eintraegeVon(id), RUECKBLICK);
      if (runde) aus.push({ id, runde });
    } catch (e) { console.warn('Rückblick:', e.message); }
  }
  return aus;
}

// Neuigkeit (NEU_PLATZ): ruhige Karte mit „Brief lesen“ und leisem „Diesmal überspringen“.
export function rueckblickKarte() {
  const { T, img, nameVon, symbol } = kx;
  const l = rueckblickHelden();
  if (!l.length) return '';
  const einer = l.length === 1;
  // Versiegelter Brief (02.11.2026, Punkt 1): Umschlag im Stil-Look, Wachssiegel mit dem Porträt (mehrere Helden: Siegel
  // nebeneinander), ein Hauptknopf; Überspringen nur als leiser Link. Grund: Lesen ist die einladende Wahl, Überspringen
  // bleibt möglich, ohne gleiches Gewicht. Wörter je Stil über stile.js `texte` (Fantasy-Wortlaut als Standard).
  // Version 140 (05.11.2026): kompakt. Siegel und Satz in einer Zeile, darunter leise „beiseitelegen“ und „Öffnen“ im
  // zweiten Knopfstil. Grund: Der Brief ist eine Belohnung; die Heldentat bleibt der einzige gefüllte Hauptknopf der
  // Seite. Die Neugier auf den versiegelten Brief trägt auch klein.
  return `<div class="karte rb-karte rb-umschlag">
    <span class="rb-klappe" aria-hidden="true"></span>
    <div class="rb-zeile">
      <span class="rb-siegel-reihe">${l.map(x => `<span class="rb-wachs">${img(x.id, nameVon(x.id), 'held', 'rb-wachs-bild', '')}</span>`).join('')}</span>
      <span class="rb-text"><span class="eyebrow akzent">${icon(symbol('brief', 'brief'))} ${esc(T('rb.karte.eyebrow'))}</span>
      <p class="rb-karte-satz">${esc(T(einer ? 'rb.karte.einer' : 'rb.karte.mehrere', { held: nameVon(l[0].id) }))}</p></span>
    </div>
    <div class="rb-knoepfe">
      <button class="link rb-leise" data-a="rb-ueberspringen">${esc(T('rb.ueberspringen'))}</button>
      <button class="btn rb-cta" data-a="rb-oeffnen">${icon(symbol('rb.oeffnen', 'siegel'))}<span>${esc(T('rb.karte.lesen'))}</span></button>
    </div>
  </div>`;
}

// Andere Ebenen haben Vorrang; die Seite wartet dann bis zum nächsten Zeichnen.
function darfZeigen() {
  const { ui } = kx;
  const z = zustand();
  return z.offen && !z.zu && ui.screen === 'start' && !ui.feier && !ui.blatt && !ui.notfall && !ui.eintrag && !ui.messziel && !ui.heldenWahl && !ui.ruhetag && !ui.karteOrt;
}
export const rueckblickOffen = () => darfZeigen() && rueckblickHelden().length > 0;

// Brief des Helden: Satz aus den Botschaften (Anlass je Ergebnis), fest je Runde und Held. Fehlt der Anlass → Ersatztext.
function briefText(id, runde) {
  const { T, nameVon, spiel, stilWerte } = kx;
  const anlass = RUECKBLICK.anlaesse[runde.ergebnis];
  const b = BOTSCHAFTEN.find(x => x.anlass === anlass);
  if (!b || !b.texte.length) return T('rb.ersatz');
  const h = H.heldVon(spiel, id);
  const v0 = h && TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId);
  if (!v0) return T('rb.ersatz');
  const v = { ...v0, gegner: runde.gegner && TABELLE.gegner[runde.gegner] ? runde.gegner : v0.gegner };
  if (!TABELLE.gegner[v.gegner] || !TABELLE.faehigkeiten[v.faehigkeit]) return T('rb.ersatz');
  const text = b.texte[I.streuwert(`${runde.von}|${id}`) % b.texte.length];
  const w = { ...I.werteFuer(H.ansicht(spiel, id), K.ausTagKey(heute()), v, TABELLE, nameVon, stilWerte()), n: runde.anwendungen, anzahl: runde.ziel, rest: Math.max(0, runde.ziel - runde.anwendungen) };
  return I.fuelle(text, w);
}

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
function siegelLeiste(id, runde) {
  const { T, spiel, symbol } = kx;
  const tage = RB.rundenSiegel(H.ansicht(spiel, id), runde, eintraegeVon(id), RUECKBLICK_SIEGEL);
  const s = x => {
    const a = CHRONIK_SIEGEL[x.siegel];
    const inhalt = a ? icon(a.symbol ? symbol(a.symbol, a.icon) : a.icon) : '';
    return `<span class="rb-tag"><span class="ch-siegel ${a ? esc(a.klasse || '') : 'leer rb-offen'}">${inhalt}</span><small>${esc(WOCHENTAG[K.ausTagKey(x.tag).getDay()])}</small></span>`;
  };
  // Version 146: leise Nachfrage bei vielen ruhigen Tagen (ohne Wertung, ohne Folgen)
  const frage = RB.vieleRuhige(tage, RUECKBLICK.ruhigeFrage) ? `<p class="klein rb-ruhig-frage">${esc(T('rb.ruhigFrage'))}</p>` : '';
  return `<div class="rb-siegel" role="img" aria-label="${esc(T('rb.siegelAria', { n: runde.anwendungen, anzahl: runde.ziel }))}">${tage.map(s).join('')}</div>${frage}`;
}

// Vorschlag zur gewählten Einschätzung als ein ruhiger Satz.
function vorschlagDaten(id, runde, wahl) {
  const { jetzt, spiel } = kx;
  const st = H.ansicht(spiel, id);
  const eigenes = RB.eigenesZiel(st.quest);
  const v = RB.vorschlag(wahl, eigenes, runde.ziel, { schritt: RUECKBLICK.schritt });
  const aktuell = K.runden(st, K.tagKey(jetzt())).aktuell;
  return { ...v, eigenes, sofort: aktuell.anwendungen === 0 };
}
function vorschlagHtml(id, runde, wahl) {
  const { T } = kx;
  if (!wahl) return '';
  const v = vorschlagDaten(id, runde, wahl);
  const satz = v.grund === 'aendern' ? T('rb.vor.aendern', { neu: v.anzahl, alt: v.eigenes, ab: T(v.sofort ? 'rb.vor.ab.sofort' : 'rb.vor.ab.naechste') })
    : v.grund === 'max' ? T('rb.vor.max', { max: K.ANZAHL_MAX })
    : v.grund === 'min' ? T('rb.vor.min')
    : v.grund === 'steigt' ? T('rb.vor.steigt', { alt: v.eigenes })
    : T('rb.vor.gleich', { alt: v.eigenes });
  return `<p class="rb-vorschlag" role="status">${esc(satz)}</p>`;
}

function abschnitt(x, mehrere) {
  const { T, img, nameVon } = kx;
  const z = zustand();
  const { id, runde } = x;
  const wahl = z.wahl[id] || null;
  const hilft = z.hilft[id] || [];
  const notizen = RB.rundenNotizen(eintraegeVon(id), runde, RUECKBLICK);
  const eigenesOffen = !!z.eigenes[id] || !!(z.text[id] || '').trim() || !notizen.length;
  const chips = notizen.map(n => `<button class="wahl-chip ${hilft.includes(n.id) ? 'an' : ''}" aria-pressed="${hilft.includes(n.id)}" data-a="rb-hilft" data-id="${esc(`${id}|${n.id}`)}">${esc(n.text)}</button>`).join('');
  const eigenesChip = notizen.length && !eigenesOffen ? `<button class="wahl-chip" data-a="rb-eigenes" data-id="${esc(id)}">${icon('stift')}${esc(T('rb.eigenes'))}</button>` : '';
  return `<section class="rb-abschnitt" aria-labelledby="rb-h-${esc(id)}">
    <div class="karte spalte rb-brief${RB.briefMitSchmuck(runde) ? ' sieg' : ''}">
      <div class="wk-gruss"><span class="wk-portrait rb-portrait">${img(id, nameVon(id), 'held', 'cover', '')}</span>
        <div class="spalte"><h3 id="rb-h-${esc(id)}">${esc(T('rb.schreibt', { held: nameVon(id) }))}</h3><small class="klein">${esc(T('rb.runde', { nr: runde.nr, von: kurzDatum(runde.von), bis: kurzDatum(runde.bis) }))}</small></div></div>
      ${siegelLeiste(id, runde)}
      <p class="rb-anrede">„${esc(briefText(id, runde))}“</p>
    </div>
    <div class="karte spalte rb-teil">
      <h3>${esc(T('rb.geholfen'))}</h3>
      <p class="klein">${esc(T('rb.geholfenText'))}</p>
      ${chips || eigenesChip ? `<div class="wk-gruende rb-chips" role="group" aria-label="${esc(T('rb.geholfen'))}">${chips}${eigenesChip}</div>` : ''}
      ${eigenesOffen ? `<label class="feld"><textarea id="rb-text-${esc(id)}" rows="2" maxlength="${EINTRAG_OPT.textMax}" aria-label="${esc(T('rb.geholfen'))}">${esc(z.text[id] || '')}</textarea></label>` : ''}
    </div>
    <div class="karte spalte rb-teil">
      <h3>${esc(T('rb.schwierigkeit'))}</h3>
      <div class="wahl rb-wahl" role="group" aria-label="${esc(T('rb.schwierigkeit'))}">${RUECKBLICK.wahlen.map(w => `<button class="opt kurz ${wahl === w ? 'sel' : ''}" aria-pressed="${wahl === w}" data-a="rb-wahl" data-id="${esc(`${id}|${w}`)}">${esc(T(`rb.wahl.${w}`))}</button>`).join('')}</div>
      ${vorschlagHtml(id, runde, wahl)}
      ${runde.ergebnis === 'schwer' ? `<p class="klein rb-hinweis">${esc(T('rb.schwerHinweis'))}</p>` : ''}
    </div>
    ${mehrere ? '<hr class="rb-trenner">' : ''}
  </section>`;
}

export function rueckblickSeiteHtml() {
  const { T } = kx;
  const z = zustand();
  if (!z.offen) return '';
  if (!darfZeigen()) return '';
  const l = rueckblickHelden();
  if (!l.length) { z.offen = false; return ''; }
  if (!z.gezeigt) { z.gezeigt = true; trackEvent('round_review_shown', {}); }
  return `<div class="feier ruhe-seite willkommen-seite rueckblick-seite" role="dialog" aria-modal="true" aria-labelledby="rb-titel">
    <div class="nf-seite">
      <div class="nf-kopf"><span></span><button class="link" data-a="rb-zu">${esc(T('rb.spaeter'))}</button></div>
      <div class="nf-inhalt rb-inhalt">
        <h2 id="rb-titel">${esc(T(l.every(x => x.runde.sieg) ? 'rb.titelSieg' : 'rb.titel'))}</h2>
        ${l.map((x, i) => abschnitt(x, l.length > 1 && i < l.length - 1)).join('')}
        ${z.fehler ? `<p class="fehler" role="alert">${esc(z.fehler)}</p>` : ''}
        <button class="cta" data-a="rb-fertig">${esc(T('rb.fertig'))}</button>
        <button class="link" data-a="rb-ueberspringen">${esc(T('rb.ueberspringen'))}</button>
      </div>
    </div>
  </div>`;
}

// Abschließen: je Held ein Eintrag „rueckblick“ (bezug = Rundenbeginn) und, wenn gewählt und möglich, die neue Anzahl
// nach der Zähler-Regel. ueberspringen = Einträge ohne Inhalt (besprochen, ändert nichts, im Logbuch still).
// Jeder Held baut auf dem vorigen Spielstand auf; scheitert einer, bleiben die schon eingetragenen erhalten.
function abschliessen(ueberspringen) {
  const { T, jetzt, render, setzeHinweis, setzeSpiel, setzeStand, speichere } = kx;
  const z = zustand();
  const l = rueckblickHelden();
  z.fehler = null;
  let geaendert = false;
  const hinweise = [];
  for (const { id, runde } of l) {
    const wahl = ueberspringen ? null : z.wahl[id] || null;
    try {
      const eingabe = ueberspringen ? { art: 'rueckblick', bezug: runde.von }
        : { art: 'rueckblick', bezug: runde.von, wahl, text: z.text[id] || null, verweise: (z.hilft[id] || []).slice(0, RUECKBLICK.verweiseMax) };
      const r = EN.eintragHinzufuegen(kx.spiel, id, eingabe, jetzt(), { ...EINTRAG_OPT, gegner: runde.gegner || null });
      setzeSpiel(r.spiel);
      geaendert = true;
      let uebernommen = false;
      if (wahl && wahl !== 'passt') {
        const v = vorschlagDaten(id, runde, wahl);
        if (v.grund === 'aendern') {
          const q = RB.uebernehmeAnzahl(H.ansicht(kx.spiel, id), v.anzahl, jetzt());
          if (q.geaendert.includes('anzahl')) {
            setzeStand(q.stand, id);
            uebernommen = true;
            hinweise.push(T('rb.gespeichertAnzahl', { neu: v.anzahl, ab: T(q.anzahlAb === 'sofort' ? 'rb.ab.sofort' : 'rb.ab.naechste') }));
          }
        }
      }
      if (ueberspringen) trackEvent('round_review_skipped', {});
      else {
        trackEvent(`round_review_${wahl || 'ohne'}`, {}); // leicht / passt / schwer / ohne – nie Text oder Notizen
        if (uebernommen) trackEvent('round_review_adjusted', {});
      }
    } catch (e) {
      console.warn('Rückblick:', e.message);
      z.fehler = e instanceof EN.EintragFehler ? e.message : 'Das hat nicht geklappt.';
      break;
    }
  }
  if (geaendert) speichere();
  if (!z.fehler) {
    Object.assign(z, { offen: false, wahl: {}, hilft: {}, text: {}, eigenes: {} });
    if (!ueberspringen) kx.bestaetige(hinweise.length ? hinweise.join(' ') : T('rb.gespeichert')); // Etappe 3: Popup
  }
  render();
}

// „held|wert“ zerlegen und gegen die fälligen Helden prüfen
function teile(roh) {
  const [id, wert] = String(roh ?? '').split('|');
  const ok = rueckblickHelden().some(x => x.id === id);
  if (!ok) console.warn('Rückblick: Held nicht fällig', id);
  return ok ? { id, wert } : null;
}

export const RUECKBLICK_KLICKS = {
  'rb-oeffnen'() { const { render } = kx; const z = zustand(); Object.assign(z, { offen: true, zu: false }); render(); },
  'rb-zu'() { const { render } = kx; zustand().zu = true; trackEvent('round_review_later', {}); render(); },
  'rb-ueberspringen'() { abschliessen(true); },
  'rb-fertig'() { abschliessen(false); },
  'rb-wahl'({ id }) {
    const { render } = kx;
    const t = teile(id);
    if (!t || !RUECKBLICK.wahlen.includes(t.wert)) { render(); return; }
    const z = zustand();
    z.wahl = { ...z.wahl, [t.id]: z.wahl[t.id] === t.wert ? null : t.wert }; // erneut tippen nimmt die Wahl zurück
    render();
  },
  'rb-hilft'({ id }) {
    const { render } = kx;
    const t = teile(id);
    if (!t) { render(); return; }
    const z = zustand();
    const l = z.hilft[t.id] || [];
    z.hilft = { ...z.hilft, [t.id]: l.includes(t.wert) ? l.filter(x => x !== t.wert) : [...l, t.wert].slice(0, RUECKBLICK.verweiseMax) };
    render();
  },
  'rb-eigenes'({ id }) {
    const { finde, render } = kx;
    const z = zustand();
    z.eigenes = { ...z.eigenes, [id]: true };
    render();
    try { const el = finde(`#rb-text-${id}`); if (el) el.focus(); } catch (e) { /* nur Fokus */ }
  }
};

// Tippen ohne neu zu zeichnen (Fokus bleibt). Länge begrenzt wie beim Eintrag.
export const RUECKBLICK_FELDER = {
  'rb-text-*': { input({ el, wert }) { const z = zustand(); z.text = { ...z.text, [el.id.slice('rb-text-'.length)]: String(wert ?? '').slice(0, EINTRAG_OPT.textMax) }; } }
};
