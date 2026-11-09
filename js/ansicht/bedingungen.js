// Bosskette mit Bedingungen in der Oberfläche (06.11.2026). Logik: logik/bedingungen.js und kern.bedingungenStand, Register
// daten/bedingungen.js, Gestalten und eigene Fähigkeiten: logik/gestalten.js.
// - bedingungenJetzt: Stand der Bedingungen des aktuellen Gegners (aktiver Held, heute)
// - bedingungenHtml: ruhiger Kasten unter der Arena („Velkra fällt, wenn …“ mit „Gestalten 1 von 2“); sind die Treffer
//   schon da, eine Zeile „Noch eine neue Gestalt, dann fällt Velkra.“ Ohne Bedingungen: nichts.
// - Felder im Eintragsblatt „geschafft“ (Gestalt, Fähigkeit, Schwierigkeit), nur für offene Bedingungen.
// Tonregel: Fortschritt statt Sperre. Kein Rot, kein „fehlt“, kein Schloss; erfüllte Punkte bekommen einen Haken.
import { BEDINGUNGEN, BEDINGUNG_OPT } from '../daten/bedingungen.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as K from '../logik/kern.js';
import { eigeneFaehigkeitenVon, gestaltenVon, gestaltVorschlaege } from '../logik/gestalten.js';
import { esc, grossAnfang, icon } from './helfer.js';
import { kx } from './kontext.js';

const LEER = { gegnerIdx: null, liste: [], erfuellt: true, offen: new Set() };

// Stand der Bedingungen des aktiven Helden heute. Wirft nie.
export function bedingungenJetzt() {
  const { jetzt, stand } = kx;
  try { return K.bedingungenStand(stand, K.tagKey(jetzt())); } catch (e) { console.warn('Bedingungen:', e.message); return LEER; }
}
// Gegner (ID, Name, Kurzname) der laufenden Runde; null ohne Quest.
export function gegnerJetzt() {
  const { jetzt, stand } = kx;
  try {
    const id = K.auswertung(stand, jetzt()).gegner;
    const g = TABELLE.gegner[id];
    return id && g ? { id, name: g.name, kurz: g.kurz || g.name } : null;
  } catch (e) { return null; }
}

// Text einer Bedingung: Stand („Gestalten 1 von 2“) oder offen („noch eine neue Gestalt“).
function werte(x) { return { ist: x.ist, soll: x.soll, n: Math.max(0, x.soll - x.ist), min: x.b && x.b.min }; }
export function standText(x) {
  const { T } = kx;
  const a = BEDINGUNGEN[x.art];
  if (!a) return '';
  if (x.ohneSchwer) return `${T(a.texte.stand)} (${T('bed.ohneSchwer')})`;
  return T(a.texte.stand, werte(x));
}
export function offenText(x) {
  const { T } = kx;
  const a = BEDINGUNGEN[x.art];
  if (!a) return '';
  const w = werte(x);
  return T(w.n === 1 ? a.texte.offenEins : a.texte.offen, w);
}
// „noch eine neue Gestalt und noch eine weitere Fähigkeit“
const verbinde = teile => (teile.length < 2 ? teile.join('') : `${teile.slice(0, -1).join(', ')} und ${teile[teile.length - 1]}`);

export function bedingungenHtml(a) {
  const { T } = kx;
  const st = bedingungenJetzt();
  if (!st.liste.length) return '';
  const g = gegnerJetzt();
  if (!g) return '';
  const namen = { gegner: g.kurz, Gegner: grossAnfang(g.kurz) };
  const punkte = st.liste.map(x => `<li class="${x.erfuellt ? 'erfuellt' : 'offen'}">${x.erfuellt ? icon('check') : '<span class="bed-punkt" aria-hidden="true"></span>'}<span>${esc(standText(x))}</span></li>`).join('');
  const offen = st.liste.filter(x => !x.erfuellt);
  const fast = a && a.treffer >= a.anzahl && offen.length
    ? `<p class="klein bed-fast" role="status">${esc(T('bed.fast', { ...namen, offen: verbinde(offen.map(offenText)) }))}</p>` : '';
  const hinweis = st.offen.size && !fast ? `<p class="klein bed-hinweis">${esc(T('bed.hinweis', namen))}</p>` : '';
  return `<div class="bed-kasten${st.erfuellt ? ' alle' : ''}">
    <span class="eyebrow">${esc(T('bed.titel', namen))}</span>
    <ul class="bed-liste">${punkte}</ul>${fast}${hinweis}
  </div>`;
}

// ---------- Eintragsblatt „geschafft“ ----------
// Welche Felder das Blatt zeigt: nur Felder offener Bedingungen des aktuellen Gegners (Entscheidung 3, 06.11.2026);
// ein schon gewähltes Feld bleibt sichtbar, damit eine Wahl nie still verschwindet. Nachtrag: Gegner von heute.
export function begegnungsFelder(e) {
  const st = bedingungenJetzt();
  const felder = new Set(st.offen);
  for (const k of ['gestalt', 'faehigkeit', 'schwierigkeit']) if (e && e[k] !== null && e[k] !== undefined) felder.add(k);
  return felder;
}

// Wählbare Fähigkeiten: die der Vorlage und die eigenen des Helden ({ id, name }).
export function faehigkeitenWahl(heroId) {
  const { aktuelleVorlage, spiel } = kx;
  const aus = [];
  try {
    const v = aktuelleVorlage();
    const f = v && TABELLE.faehigkeiten[v.faehigkeit];
    if (f) aus.push({ id: v.faehigkeit, name: f.name });
  } catch (e) { /* ohne Vorlage nur eigene */ }
  return [...aus, ...eigeneFaehigkeitenVon(spiel, heroId).map(x => ({ id: x.id, name: x.name, so: x.so }))];
}

export function begegnungHtml(e) {
  const { T, spiel } = kx;
  if (!e || e.art !== 'geschafft') return '';
  const felder = begegnungsFelder(e);
  if (!felder.size) return '';
  const g = gegnerJetzt();
  if (!g) return '';
  const f = e.fehler || {};
  const an = x => `class="opt kurz ${x ? 'sel' : ''}" aria-pressed="${x}"`;
  const fehler = k => (f[k] ? `<p class="fehler" role="alert">${esc(f[k])}</p>` : '');
  const teile = [];
  if (felder.has('gestalt')) {
    const liste = gestaltenVon(spiel, e.heroId, g.id);
    // Vorschläge (06.11.2026): antippen legt die Gestalt an und wählt sie; eigene Eingabe bleibt darunter
    const vorschlaege = gestaltVorschlaege(TABELLE.gegner[g.id], liste);
    const vorschlagHtml = vorschlaege.length
      ? `<span class="klein bed-vorschlag-l" id="bed-vorschlag-l">${esc(T(liste.length ? 'bed.eintrag.vorschlagWeitere' : 'bed.eintrag.vorschlag'))}</span>
      <div class="wahl eintrag-wahl bed-vorschlaege" role="group" aria-labelledby="bed-vorschlag-l">${vorschlaege.map(x => `<button class="opt kurz vorschlag" data-a="eintrag-gestalt-vorschlag" data-id="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : '';
    teile.push(`<div class="feld bed-feld"><span id="bed-gestalt-l">${esc(T('bed.eintrag.gestalt', { gegner: g.kurz }))}</span>
      ${liste.length ? `<div class="wahl eintrag-wahl" role="group" aria-labelledby="bed-gestalt-l">${liste.map(x => `<button ${an(e.gestalt === x.id)} data-a="eintrag-gestalt" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>` : ''}
      ${vorschlagHtml}
      <span class="bed-neu"><input id="eintrag-gestalt-name" type="text" maxlength="${BEDINGUNG_OPT.nameMax}" placeholder="${esc(T('bed.eintrag.gestaltNeu'))}" aria-label="${esc(T('bed.eintrag.gestaltNeu'))}" value="${esc(e.gestaltName || '')}">
      <button class="btn klein-btn" data-a="eintrag-gestalt-neu">${esc(T('bed.eintrag.hinzufuegen'))}</button></span></div>${fehler('gestalt')}`);
  }
  if (felder.has('faehigkeit')) {
    const liste = faehigkeitenWahl(e.heroId);
    teile.push(`<div class="feld bed-feld"><span id="bed-faeh-l">${esc(T('bed.eintrag.faehigkeit'))}</span>
      <div class="wahl eintrag-wahl" role="group" aria-labelledby="bed-faeh-l">${liste.map(x => `<button ${an(e.faehigkeit === x.id)} data-a="eintrag-faehigkeit" data-id="${esc(x.id)}"${x.so ? ` title="${esc(x.so)}"` : ''}>${esc(x.name)}</button>`).join('')}</div>
      <span class="bed-neu"><input id="eintrag-faehigkeit-name" type="text" maxlength="${BEDINGUNG_OPT.nameMax}" placeholder="${esc(T('bed.eintrag.faehigkeitNeu'))}" aria-label="${esc(T('bed.eintrag.faehigkeitNeu'))}" value="${esc(e.faehName || '')}">
      <input id="eintrag-faehigkeit-so" type="text" maxlength="${BEDINGUNG_OPT.soMax}" placeholder="${esc(T('bed.eintrag.soGehts'))}" aria-label="${esc(T('bed.eintrag.soGehts'))}" value="${esc(e.faehSo || '')}">
      <button class="btn klein-btn" data-a="eintrag-faehigkeit-neu">${esc(T('bed.eintrag.hinzufuegen'))}</button></span></div>${fehler('faehigkeit')}`);
  }
  if (felder.has('schwierigkeit')) {
    const { min, max } = BEDINGUNG_OPT.schwierigkeit;
    const stufen = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    teile.push(`<div class="feld bed-feld"><span id="bed-schwer-l">${esc(T('bed.eintrag.schwierigkeit'))}</span>
      <div class="wahl eintrag-wahl bed-skala" role="group" aria-labelledby="bed-schwer-l">${stufen.map(n => `<button ${an(e.schwierigkeit === n)} data-a="eintrag-schwierigkeit" data-id="${n}">${n}</button>`).join('')}</div></div>${fehler('schwierigkeit')}`);
  }
  return `<div class="bed-eintrag">${teile.join('')}</div>`;
}
