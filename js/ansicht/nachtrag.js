// Nachtragen (Version 79; aus startseite.js ausgelagert, 02.11.2026): Karte für einen vergangenen Tag in der Heldentat,
// Hinweis „Gestern noch offen?“, Tageswahl. Regeln: daten/nachtragen.js, Logik: K.nachtragen(), Speichern: nachtrage() in app.js.
import { merke, merkmal, trackEvent } from '../analytics.js';
import { NACHTRAGEN } from '../daten/nachtragen.js';
import { AKTION_SYMBOLE } from '../daten/symbole.js';
import * as K from '../logik/kern.js';
import { eintragLink, oeffneEintrag } from './eintrag.js';
import { ANTWORT_ARTEN, antwortArt, istAntwort, siegelAntworten } from '../logik/antworten.js'; // Version 141
import { esc, icon, kachel, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

// ---------- Nachtragen (Version 79) ----------
// Tageswahl in der Heldentat ohne Dauer-Modus (Entscheidung 30.10.2026): ui.nachtrag = { heroId, tag } zeigt die Karte
// für einen vergangenen Tag; nach der Antwort ist wieder heute dran. Regeln: daten/nachtragen.js, Logik: K.nachtragen().
// Ton: Nachtragen ist normal. Kein „verpasst“, kein Rot, keine Liste offener Tage; nur gestern bekommt einen leisen Hinweis.
export const nachtragListe = () => { const { jetzt, stand } = kx; try { return K.nachtragTage(stand, jetzt(), NACHTRAGEN.maxTage); } catch (e) { console.warn('Nachtragen:', e.message); return []; } };
// Aktiver Nachtrag für den Helden im Rampenlicht; passt er nicht mehr (anderer Held, Tag außerhalb der Grenze), null.
export function nachtragModus() {
  const { spiel, ui } = kx;
  const n = ui.nachtrag;
  if (!n || n.heroId !== spiel.fokus) return null;
  const t = nachtragListe().find(x => x.tag === n.tag);
  return t || null;
}
// „Gestern“, „Vorgestern“, „Vor 3 Tagen“ (mit Datum)
export function nachtragName(t) {
  const { T } = kx;
  const name = t.abstand === 1 ? T('nachtrag.gestern') : t.abstand === 2 ? T('nachtrag.vorgestern') : T('nachtrag.vorTagen', { n: t.abstand });
  return `${name}, ${kurzDatum(t.tag)}`;
}
// Im Satz: nur der erste Buchstabe klein („gestern“, „vor 3 Tagen“)
const imSatz = x => String(x).charAt(0).toLowerCase() + String(x).slice(1);
const nachtragKurz = t => { const { T } = kx; return t.abstand === 1 ? T('nachtrag.gestern') : t.abstand === 2 ? T('nachtrag.vorgestern') : T('nachtrag.vorTagen', { n: t.abstand }); };
// Karte für einen vergangenen Tag: Frage, beide Antworten (gewählte markiert), Zurücknehmen, schwerer Tag, zurück zu heute.
export function nachtragHtml(t, f) {
  const { T } = kx;
  const wort = imSatz(nachtragKurz(t));
  const knopf = (w, cls, text) => `<button class="btn ${cls}${t.antwort === w ? ' gewaehlt' : ''}" aria-pressed="${t.antwort === w}" data-a="nachtrag-antwort" data-id="${w}">${w === 'ja' ? icon('check') + ' ' : ''}${esc(text)}</button>`;
  // Version 141: Knöpfe und Stand-Zeile aus dem Antwort-Register (ja, nein, schwer); ohne Tagesfrage nur „ja“
  const gewaehlt = antwortArt(t.antwort);
  const ids = siegelAntworten(!ohneFrage());
  const knoepfe = ids.map(w => knopf(w, w === 'ja' ? 'voll tat-ja' : `tat-${w}`, T(ANTWORT_ARTEN[w].nachtragKnopf))).join('');
  return `<p class="tat-frage">${esc(T('nachtrag.frage', { tag: wort, faehigkeit: f.name }))}</p>
      ${gewaehlt ? `<p class="klein" role="status">${esc(T(gewaehlt.nachtragStand, { tag: nachtragKurz(t), verb: f.verb }))}</p>` : ''}
      <div class="tat-knoepfe${ids.length >= 3 ? ' drei' : ''}">${knoepfe}</div>
      <div class="eintrag-links">${eintragLink('schwer', 'eintrag.link.schwerTag')}${t.antwort ? `<button class="link eintrag-link" data-a="nachtrag-antwort" data-id="">${esc(T('nachtrag.zuruecknehmen'))}</button>` : ''}</div>
      <button class="link nachtrag-link" data-a="nachtrag-zurueck">${icon('zurueck')}${esc(T('nachtrag.zurHeute'))}</button>`;
}
// Zählweisen (04.11.2026): Rhythmus und Wache kennen kein „Keine Versuchung“ und keinen offenen Vortag. Wirft nie.
function ohneFrage() {
  const { jetzt, stand } = kx;
  try { return !K.zaehlweiseHeute(stand, K.tagKey(jetzt())).tagesfrage; } catch (e) { return false; }
}
// Hinweis „Gestern noch offen?“: gestern ohne Antwort, höchstens einmal je Tag (weggetippt = merkmal nachtrag_hinweis)
export function gesternHinweis(tage) {
  const { jetzt } = kx;
  const g = tage[0];
  if (ohneFrage()) return false; // ohne Tagesfrage ist ein Tag ohne Eintrag normal, nichts ist „offen“
  return !!(NACHTRAGEN.hinweisGestern && g && g.abstand === 1 && !g.antwort && merkmal('nachtrag_hinweis') !== K.tagKey(jetzt()));
}
// Leise Zeile unter der Heldentat: Hinweis „Gestern noch offen?“ (einmal je Tag) oder „Anderen Tag eintragen“ mit Tageswahl.
export function nachtragZeile() {
  const { T, symbol, ui } = kx;
  const ic = icon(symbol('aktion.nachtragen', AKTION_SYMBOLE['aktion.nachtragen'])); // Version 89
  const tage = nachtragListe();
  if (!tage.length) return '';
  if (ui.nachtragWahl) {
    return `<div class="nachtrag-zeile"><span class="klein">${esc(T('nachtrag.welcher'))}</span>
      <div class="wahl nachtrag-tage">${tage.map(t => `<button class="opt kurz" data-a="nachtrag-tag" data-id="${esc(t.tag)}">${t.antwort ? icon('check') : ''}<span class="spalte"><span>${esc(nachtragKurz(t))}</span><small>${esc(kurzDatum(t.tag))}</small></span></button>`).join('')}</div>
      <button class="link nachtrag-link" data-a="nachtrag-wahl">${esc(T('nachtrag.abbrechen'))}</button></div>`;
  }
  const gestern = tage[0];
  if (gesternHinweis(tage)) {
    return `<div class="nachtrag-zeile nachtrag-hinweis"><button class="link nachtrag-link" data-a="nachtrag-tag" data-id="${esc(gestern.tag)}">${ic}${esc(T('nachtrag.hinweisGestern'))}</button>
      <button class="link nachtrag-weg" data-a="nachtrag-hinweis-weg">${esc(T('nachtrag.hinweisWeg'))}</button></div>`;
  }
  return `<button class="link nachtrag-link" data-a="nachtrag-wahl">${ic}${esc(T('nachtrag.andererTag'))}</button>`;
}
// Version 174: Auf der offenen Heldentat steht nur noch der leise Hinweis „Gestern noch offen?“ über dem Block (er hilft im
// richtigen Moment und verschwindet, wenn er weggetippt oder gestern beantwortet ist). „Anderen Tag eintragen“ ist die Kachel
// „Nachtragen“ im Menü „Rat für heute“ (nachtragKachel); die Tageswahl steht dort darunter (nachtragWahlHtml). Wirft nie.
export function nachtragHinweis() {
  const { ui } = kx;
  const tage = nachtragListe();
  return tage.length && !ui.nachtragWahl && gesternHinweis(tage) ? nachtragZeile() : '';
}
export function nachtragWahlHtml() {
  const { ui } = kx;
  return ui.nachtragWahl && nachtragListe().length ? nachtragZeile() : '';
}
// Version 93: „Nachtragen“ als Kachel der Schnellleiste (öffnet die Tageswahl); Tageswahl bzw. Hinweis „Gestern noch offen?“
// stehen dann unter der Leiste (nachtragZusatz). Vor der Antwort bleibt die leise Zeile über der Frage (nachtragZeile).
export function nachtragKachel() {
  const { T, symbol, ui } = kx;
  if (!nachtragListe().length) return '';
  return kachel({ aktion: 'nachtrag-wahl', symbol: icon(symbol('aktion.nachtragen', AKTION_SYMBOLE['aktion.nachtragen'])), kurz: T('kachel.nachtragen'), lang: T('nachtrag.andererTag'), klasse: `nachtragen${ui.nachtragWahl ? ' an' : ''}`, extra: ` aria-expanded="${!!ui.nachtragWahl}"` });
}
export function nachtragZusatz() {
  const { ui } = kx;
  const tage = nachtragListe();
  return tage.length && (ui.nachtragWahl || gesternHinweis(tage)) ? nachtragZeile() : '';
}
export const NACHTRAG_KLICKS = {
  'nachtrag-wahl'() { const { render, ui } = kx; ui.nachtragWahl = !ui.nachtragWahl; if (ui.nachtragWahl) trackEvent('backfill_choice_opened', {}); render(); },
  'nachtrag-tag'({ id }) {
    const { jetzt, render, spiel, ui } = kx;
    if (!nachtragListe().some(t => t.tag === id)) { console.warn('Nachtragen: Tag nicht wählbar', id); ui.nachtragWahl = false; render(); return; }
    ui.nachtrag = { heroId: spiel.fokus, tag: id };
    ui.nachtragWahl = false;
    ui.ratOffen = null; // Version 174: das Menü „Rat für heute“ ist beim Zurück zu heute wieder zu
    merke('nachtrag_hinweis', K.tagKey(jetzt())); // Hinweis „Gestern noch offen?“ heute nicht mehr
    trackEvent('backfill_opened', {});
    render();
  },
  'nachtrag-hinweis-weg'() { const { jetzt, render } = kx; merke('nachtrag_hinweis', K.tagKey(jetzt())); trackEvent('backfill_hint_dismissed', {}); render(); },
  'nachtrag-zurueck'() { const { render, ui } = kx; ui.nachtrag = null; render(); },
  'nachtrag-antwort'({ id }) {
    const { T, nachtrage } = kx;
    const t = nachtragModus();
    if (!t) { const { render, ui } = kx; ui.nachtrag = null; render(); return; }
    const antwort = istAntwort(id) ? id : null;
    const art = antwortArt(antwort);
    nachtrage(t.tag, antwort, T(antwort ? 'nachtrag.fertig' : 'nachtrag.zurueckgenommen', { tag: imSatz(nachtragKurz(t)) }));
    // Version 141: „War schwer“ öffnet auch im Nachtrag den freiwilligen Eintrag für diesen Tag (wenn er gespeichert ist)
    const { jetzt, stand } = kx;
    if (art && art.eintrag && stand && stand.tage && stand.tage[t.tag] === antwort && t.tag < K.tagKey(jetzt())) oeffneEintrag(art.eintrag, { tag: t.tag, ausSiegel: antwort });
  }
};
