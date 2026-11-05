// Eintragsblatt (Version 75): eigener Eintrag zum Tag als Blatt von unten, gezeichnet auf oberster Ebene in app.js.
// Arten: „geschafft“ (eingeklappt nach „Ja“) und „schwer“ (jederzeit über einen leisen Link auf der Heldentat-Karte).
// Modell und Prüfung: daten/eintrag-arten.js, logik/eintraege.js. Zustand: ui.eintrag = { art, heroId, situation,
// stimmung, text, naechstesMal, planOffen, fehler, tag, ausSiegel }. ausSiegel (Version 141): Antwort, aus der das Blatt
// direkt geöffnet wurde („schwer“ = Siegel „War schwer“); dann stehen Comeback-Zeile und „Doch geschafft?“ im Blatt. tag (Version 79): Tag eines Nachtrags ('YYYY-MM-DD'), sonst null = heute. Alles ist freiwillig; Speichern ohne Angaben ist erlaubt („Heute war es schwer“ reicht).
// Psychologie: Ein schwerer Tag kostet nichts (keine XP, keine Gegnerkraft). Wer ehrlich festhält, ohne sich zu
// schämen, lernt seine Muster kennen; wer bestraft wird, verschweigt sie. Darum ruhige Farben, nie „Rückfall“.
import { trackEvent } from '../analytics.js';
import { EINTRAG_ARTEN, EINTRAG_OPT, STIMMUNGEN } from '../daten/eintrag-arten.js';
import * as EN from '../logik/eintraege.js';
import * as K from '../logik/kern.js';
import { AKTION_SYMBOLE } from '../daten/symbole.js';
import { esc, icon, kurzDatum, kachel } from './helfer.js';
import { kx } from './kontext.js';
import { notfallKnopf } from './notfall.js';

// Leiser Link, der das Blatt öffnet (auf der Heldentat-Karte). text: Textschlüssel.
export function eintragLink(art, text, { alsKachel = false } = {}) {
  const { T, symbol } = kx;
  if (!EINTRAG_ARTEN[art] || EINTRAG_ARTEN[art].ohneBlatt) return '';
  const k = 'aktion.' + art; // Version 89: Symbol aus dem Verzeichnis statt fest im Code; unbekannte Art → Stift
  if (alsKachel) return kachel({ aktion: 'eintrag-oeffnen', id: art, symbol: icon(symbol(k, AKTION_SYMBOLE[k] || 'stift')), kurz: T(`kachel.${art}`), lang: T(text), klasse: `art-${art}` }); // Version 93
  return `<button class="link eintrag-link art-${esc(art)}" data-a="eintrag-oeffnen" data-id="${esc(art)}">${icon(symbol(k, AKTION_SYMBOLE[k] || 'stift'))}${esc(T(text))}</button>`;
}

export function eintragBlattHtml() {
  const { T, nameVon, spiel, ui } = kx;
  const e = ui.eintrag;
  if (!e) return '';
  const art = EINTRAG_ARTEN[e.art];
  // Passt der Zustand nicht mehr (anderer Bildschirm, Held weg), schließt das Blatt still.
  if (!art || art.ohneBlatt || ui.screen !== 'start' || !spiel.helden.some(h => h.heroId === e.heroId)) { ui.eintrag = null; return ''; }
  const f = e.fehler || {};
  const an = x => `class="opt kurz ${x ? 'sel' : ''}" aria-pressed="${x}"`;
  return `<div class="feier unten eintrag-blatt art-${esc(e.art)}" role="dialog" aria-modal="true" aria-labelledby="eintrag-t">
    <button class="hintergrund" data-a="eintrag-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(nameVon(e.heroId).toUpperCase())}${e.tag ? ` · ${esc(kurzDatum(e.tag).toUpperCase())}` : ''}</span>
        <h2 id="eintrag-t">${esc(e.tag ? T(e.art === 'schwer' ? 'eintrag.frage.schwerTag' : 'eintrag.frage.geschafftTag') : T(art.frage))}</h2>
        <p class="klein">${esc(T('eintrag.hinweis.' + e.art))}</p>
        ${e.ausSiegel ? siegelZeilen(e) : ''}
        ${e.art === 'schwer' && !e.tag ? notfallKnopf('im-blatt') : ''}
        <div class="feld"><span id="eintrag-sit-l">${esc(T('eintrag.situation'))}</span>
          <div class="wahl eintrag-wahl" role="group" aria-labelledby="eintrag-sit-l">${art.situationen.map(s => `<button ${an(e.situation === s)} data-a="eintrag-situation" data-id="${esc(s)}">${esc(T('eintrag.sit.' + s))}</button>`).join('')}</div></div>
        ${f.situation ? `<p class="fehler" role="alert">${esc(f.situation)}</p>` : ''}
        <div class="feld"><span id="eintrag-st-l">${esc(T('eintrag.stimmung'))}</span>
          <div class="wahl eintrag-wahl" role="group" aria-labelledby="eintrag-st-l">${STIMMUNGEN.map(w => `<button ${an(e.stimmung === w)} data-a="eintrag-stimmung" data-id="${w}">${esc(T('eintrag.stimmung.' + w))}</button>`).join('')}</div></div>
        ${f.stimmung ? `<p class="fehler" role="alert">${esc(f.stimmung)}</p>` : ''}
        <label class="feld"><span>${esc(T(art.text || 'eintrag.text'))}</span><textarea id="eintrag-text" rows="3" maxlength="${EINTRAG_OPT.textMax}" ${f.text ? 'aria-invalid="true"' : ''}>${esc(e.text || '')}</textarea></label>
        ${f.text ? `<p class="fehler" role="alert">${esc(f.text)}</p>` : ''}
        ${planFeld(art, e, f)}
        ${f.allgemein ? `<p class="fehler" role="alert">${esc(f.allgemein)}</p>` : ''}
        <p class="klein">${esc(T('eintrag.privat'))}</p>
        <button class="cta" data-a="eintrag-speichern">${esc(T('eintrag.speichern'))}</button>
        <button class="link" data-a="eintrag-zu">${esc(T('eintrag.abbrechen'))}</button>
      </div>
    </div>
  </div>`;
}

// Version 141: nach dem Siegel „War schwer“. Comeback-Zeile: der Blick geht nach vorn (der nächste gute Tag zählt als
// Comeback, logik/bestaendigkeit.js). „Doch geschafft?“: wer trotz allem standgehalten hat, zählt den Tag als Treffer;
// gerade dieser Tag darf nicht neutral bleiben. Nur solange der Tag noch „schwer“ als Antwort hat.
function siegelZeilen(e) {
  const { T, jetzt, stand } = kx;
  let antwort = null;
  try { antwort = stand && stand.tage ? stand.tage[e.tag || K.tagKey(jetzt())] || null : null; } catch (err) { antwort = null; }
  if (antwort !== e.ausSiegel) return '';
  return `<p class="klein eintrag-comeback" role="note">${esc(T('eintrag.comeback'))}</p>
        <button class="link eintrag-link eintrag-doch" data-a="eintrag-doch-treffer">${icon('check')}${esc(T('eintrag.dochTreffer', { wort: T('siegel.treffer') }))}</button>`;
}

// Plan fürs nächste Mal (Version 81, Nachbesprechung): eingeklappt als leiser Link, damit das Blatt kurz bleibt.
// Offen, sobald angetippt oder schon Text da ist. Psychologie: Ein konkreter nächster Versuch macht aus dem schweren Tag
// einen Lernschritt („Was probiere ich?“ statt „Was habe ich falsch gemacht?“) und wirkt dem Alles-egal-Effekt entgegen.
function planFeld(art, e, f) {
  const { T } = kx;
  if (!art.plan) return '';
  if (!e.planOffen && !e.naechstesMal && !f.naechstesMal) return `<button class="link eintrag-link" data-a="eintrag-plan-auf" aria-expanded="false">${icon('stift')}${esc(T(art.plan))}</button>`;
  return `<label class="feld eintrag-plan"><span>${esc(T(art.plan))}</span><textarea id="eintrag-plan" rows="2" maxlength="${EINTRAG_OPT.planMax}" placeholder="${esc(T('eintrag.planBeispiel'))}" ${f.naechstesMal ? 'aria-invalid="true"' : ''}>${esc(e.naechstesMal || '')}</textarea></label>
        ${f.naechstesMal ? `<p class="fehler" role="alert">${esc(f.naechstesMal)}</p>` : ''}`;
}

// Blatt öffnen (auch aus dem Siegel „War schwer“, Version 141). tag: Tag eines Nachtrags oder null = heute.
// Liefert true, wenn es offen ist. Unbekannte Art oder kein Held → Warnung, nichts passiert.
export function oeffneEintrag(art, { tag = null, ausSiegel = null } = {}) {
  const { render, spiel, ui } = kx;
  if (!EINTRAG_ARTEN[art] || EINTRAG_ARTEN[art].ohneBlatt || !spiel.fokus) { console.warn('Eintrag: unbekannte Art', art); return false; }
  ui.eintrag = { art, heroId: spiel.fokus, situation: null, stimmung: null, text: '', naechstesMal: '', planOffen: false, fehler: {}, tag, ausSiegel };
  trackEvent(art === 'schwer' ? 'entry_hard_day_opened' : 'entry_done_opened', ausSiegel ? { quelle: 'siegel' } : {});
  render();
  return true;
}
// Hat der Spieler im Blatt schon etwas angegeben? (dann wird es vor „Doch geschafft?“ gesichert, nichts geht verloren)
const hatInhalt = e => !!(e && (e.situation || e.stimmung || String(e.text || '').trim() || String(e.naechstesMal || '').trim()));

// Speichern: prüfen, anlegen, Spielstand sichern. Fehler bleiben im Blatt sichtbar (nichts geht still verloren).
// still (Version 141): ohne Bestätigungs-Popup (wenn gleich danach eine andere Rückmeldung kommt). Liefert true bei Erfolg.
export function eintragSpeichern({ still = false } = {}) {
  const { T, aktuelleVorlage, funktionFrei, jetzt, render, setzeHinweis, setzeSpiel, speichere, spiel, stand, ui } = kx;
  const e = ui.eintrag;
  if (!e) return false;
  const p = EN.eintragPruefen(e, EINTRAG_OPT);
  if (!p.ok) { e.fehler = p.fehler; render(); return false; }
  // Version 79: Eintrag für einen nachgetragenen Tag bekommt dessen Datum (und den Gegner von damals)
  const datum = e.tag ? K.ausTagKey(e.tag) : jetzt();
  if (!datum) { e.fehler = { allgemein: 'Ungültiger Tag.' }; render(); return false; }
  let gegner = null;
  try { gegner = stand.quest && e.heroId === spiel.fokus ? K.auswertung(stand, datum).gegner || (aktuelleVorlage() || {}).gegner || null : null; }
  catch (err) { console.warn('Eintrag (Gegner):', err.message); }
  let r;
  try { r = EN.eintragHinzufuegen(spiel, e.heroId, p.werte, datum, { ...EINTRAG_OPT, gegner }); }
  catch (err) { e.fehler = { allgemein: err.message }; render(); return false; }
  const notfallVorher = funktionFrei('notfallkarte');
  setzeSpiel(r.spiel);
  speichere();
  // Analytics: nur Art und ob Felder gesetzt sind, nie Text oder Situation (Entscheidung 28.10.2026)
  trackEvent(e.art === 'schwer' ? 'entry_hard_day' : 'entry_done', {});
  if (r.eintrag.text) trackEvent('entry_text', {});
  if (r.eintrag.naechstesMal) trackEvent('entry_plan', {}); // Version 81: nur ob, nie was
  ui.eintrag = null;
  // Erster schwerer Tag schaltet die Notfallkarte frei (FUNKTIONEN.notfallkarte): einmal ruhig ankündigen
  const neuFrei = !notfallVorher && funktionFrei('notfallkarte');
  if (neuFrei) trackEvent('unlock_opened', { bereich: 'notfallkarte' });
  const schluessel = neuFrei ? 'notfall.neu' : `eintrag.gespeichert.${r.eintrag.art}`;
  if (neuFrei) setzeHinweis(T(schluessel)); else if (!still) kx.bestaetige(T(schluessel)); // Etappe 3: „Festgehalten.“ als Popup
  render();
  return true;
}

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const EINTRAG_KLICKS = {
  'eintrag-oeffnen'({ id }) {
    const { spiel, ui } = kx;
    // Version 79: im Nachtrag (ui.nachtrag) gilt der Eintrag für diesen Tag
    const tag = ui.nachtrag && ui.nachtrag.heroId === spiel.fokus ? ui.nachtrag.tag : null;
    oeffneEintrag(id, { tag });
  },
  // Version 141: „Doch geschafft?“ im Blatt nach „War schwer“. Schon Angegebenes wird erst gesichert (als schwerer Moment,
  // er war ja da), dann zählt der Tag als Treffer (heute: wie das Siegel „Getroffen“, sonst als Nachtrag für den Tag).
  'eintrag-doch-treffer'() {
    const { T, check, jetzt, nachtrage, render, stand, ui } = kx;
    const e = ui.eintrag;
    if (!e || !e.ausSiegel) return;
    const tag = e.tag || K.tagKey(jetzt());
    if (!stand || !stand.tage || stand.tage[tag] !== e.ausSiegel) { ui.eintrag = null; render(); return; } // inzwischen geändert
    if (hatInhalt(e) && !eintragSpeichern({ still: true })) return; // Fehler stehen im Blatt
    ui.eintrag = null;
    trackEvent('entry_hard_day_to_hit', {});
    if (e.tag) nachtrage(e.tag, 'ja', T('nachtrag.fertig', { tag: kurzDatum(e.tag) }));
    else check('ja');
  },
  'eintrag-zu'() { const { render, ui } = kx; ui.eintrag = null; render(); },
  // Erneuter Tipp auf die gewählte Situation bzw. Stimmung nimmt die Wahl zurück (alles bleibt freiwillig).
  'eintrag-situation'({ id }) {
    const { render, ui } = kx;
    const e = ui.eintrag;
    if (!e) return;
    e.situation = e.situation === id ? null : id;
    e.fehler = { ...e.fehler, situation: undefined };
    render();
  },
  'eintrag-stimmung'({ id }) {
    const { render, ui } = kx;
    const e = ui.eintrag;
    if (!e) return;
    const w = Number(id);
    e.stimmung = e.stimmung === w ? null : w;
    e.fehler = { ...e.fehler, stimmung: undefined };
    render();
  },
  'eintrag-speichern'() { eintragSpeichern(); },
  // Version 81: Feld „Was probierst du nächstes Mal?“ aufklappen; Fokus ins Feld, damit man gleich tippen kann
  'eintrag-plan-auf'() {
    const { render, ui } = kx;
    if (!ui.eintrag) return;
    ui.eintrag.planOffen = true;
    render();
    try { const el = typeof document !== 'undefined' && document.getElementById('eintrag-plan'); if (el && el.focus) el.focus(); } catch (err) { /* nur Komfort */ }
  }
};
// Felder: Text tippen, ohne neu zu zeichnen (Fokus bleibt im Feld).
export const EINTRAG_FELDER = {
  'eintrag-text': { input({ wert }) { const { ui } = kx; if (ui.eintrag) ui.eintrag.text = String(wert ?? '').slice(0, EINTRAG_OPT.textMax); } },
  'eintrag-plan': { input({ wert }) { const { ui } = kx; if (ui.eintrag) ui.eintrag.naechstesMal = String(wert ?? '').slice(0, EINTRAG_OPT.planMax); } }
};
