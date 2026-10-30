// Karte (30.10.2026): große Sicht auf die Hauptquest des AKTIVEN Helden (Logik: logik/karte.js, Einstellungen: daten/karte.js).
// Nur Ansicht, nichts gespeichert. Orte untereinander als gewundener Pfad; besiegte Gegner ruhig mit Haken, der aktuelle
// stark, ein kommender als Silhouette, danach Nebel. Der Held steht als Figur auf dem Pfad vor seinem Gegner.
// Überarbeitet am 30.10.2026 (Entscheidungen 9–12): eine Karte je Held, Wechsel über den Heldenkopf wie auf der Startseite;
// besiegte Orte sind antippbar und öffnen die Rückschau (Zeitraum, Runden, Anwendungen, gelesene Story-Teile zum Nachlesen).
// Psychologie: Die ganze Vergangenheit bleibt sichtbar (Kompetenzerleben, besonders nach schweren Tagen); die Zukunft
// bleibt im Nebel (Neugier ohne sichtbares Ende). Keine roten Markierungen, kein Rückschritt auf der Karte.
import { trackEvent } from '../analytics.js';
import { STORIES } from '../daten/inhalte.js';
import { KARTE, KARTE_PFAD } from '../daten/karte.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { ORT, ortPunkt, pfadD, pfadKonfig, pfadPunkt, reiseWeg } from '../logik/karte.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { einstellungenKnopf } from './rahmen.js';
import { heldenkopfHtml } from './startseite.js';

const HELD_HOEHE = 30; // Heldenfigur schwebt so viele px über ihrer Stelle auf dem Pfad (wie auf der Startseite)
const verbVon = v => ((v && TABELLE.faehigkeiten[v.faehigkeit]) || {}).verb || '';

// Reise des aktiven Helden; null bei Fehler (Hinweis statt Karte, Meldung in der Konsole).
function reise() {
  const { jetzt, stand } = kx;
  try { return reiseWeg(stand, jetzt(), KARTE); }
  catch (e) { console.warn('Karte:', e.message); return null; }
}

// Titel und Zeile unter einem Ort. verb: Verb der Fähigkeit („portioniert“) für die Zahl der Anwendungen.
function ortTexte(o, verb) {
  const { T, wort } = kx;
  const g = TABELLE.gegner[o.gegner];
  const name = g ? g.name : '?';
  switch (o.art) {
    case ORT.start: return { titel: T('karte.start'), info: T('karte.startInfo', { datum: kurzDatum(o.tag) }) };
    case ORT.besiegt: return {
      titel: name,
      info: [T('karte.besiegtInfo', { sieg: wort('sieg'), datum: kurzDatum(o.tag) }), T(o.runden === 1 ? 'karte.runde' : 'karte.runden', { n: o.runden }), verb ? T('leben.anwendungen', { n: o.anwendungen, verb }) : ''].filter(Boolean).join(' · ')
    };
    case ORT.aktuell: return {
      titel: T('karte.aktuell', { kapitel: wort('kapitel'), nr: o.kapitel, gegner: g ? g.kurz || g.name : '?' }),
      info: o.morgen ? T('karte.morgen') : T('karte.aktuellInfo', { treffer: o.treffer, anzahl: o.anzahl })
    };
    case ORT.verborgen: return { titel: T('karte.verborgen', { kapitel: wort('kapitel'), nr: o.kapitel }), info: o.ab ? T('karte.neuMorgen') : T('karte.verborgenInfo') };
    default: return { titel: T('karte.nebel'), info: '' };
  }
}

function ortBild(o) {
  const { img } = kx;
  if (o.art === ORT.start || o.art === ORT.nebel) return '';
  const g = TABELLE.gegner[o.gegner];
  const verbergen = o.art === ORT.verborgen;
  const cls = verbergen ? 'cover schatten' : o.art === ORT.besiegt ? 'cover grau' : 'cover';
  return `${img('boss-' + o.gegner, verbergen ? '?' : g ? g.name : '?', 'boss', cls, '', 'rund')}${o.art === ORT.besiegt ? `<i class="station-haken">${icon('check')}</i>` : ''}`;
}

function reiseHtml(weg, heroId, verb) {
  const { T, img, nameVon } = kx;
  const held = nameVon(heroId);
  const p = pfadKonfig(KARTE_PFAD);
  const { orte, held: hi } = weg;
  const n = orte.length;
  const hoehe = n * p.zeile;
  const aktuell = orte[hi];
  const anteil = aktuell && aktuell.art === ORT.aktuell && !aktuell.morgen && aktuell.anzahl > 0 ? Math.min(1, aktuell.treffer / aktuell.anzahl) : 0;
  const hp = pfadPunkt(Math.max(0, hi - 1 + anteil), n, p);
  const orteHtml = orte.map((o, i) => {
    const q = ortPunkt(i, p);
    const seite = q.x < 50 ? 'links' : 'rechts';
    const t = ortTexte(o, verb);
    const lage = `style="left:${q.x}%;top:${q.y}px"`;
    // Besiegte Orte sind Knöpfe (Rückschau); alle anderen nur Bild (keine leeren Versprechen bei Silhouette und Nebel)
    const station = o.art === ORT.besiegt
      ? `<button class="station ${o.art} ort-knopf" ${lage} data-a="karte-ort" data-id="${i}" aria-label="${esc(T('karte.ortAria', { gegner: t.titel }))}">${ortBild(o)}</button>`
      : `<span class="station ${o.art}" ${lage} aria-hidden="true">${ortBild(o)}</span>`;
    const text = `<b>${esc(t.titel)}</b>${t.info ? `<span class="klein">${esc(t.info)}</span>` : ''}`;
    return `<li class="reise-ort ${o.art}">${station}${o.art === ORT.besiegt
      ? `<button class="reise-text ort-knopf ${seite}" style="top:${q.y}px" data-a="karte-ort" data-id="${i}" tabindex="-1">${text}</button>`
      : `<span class="reise-text ${seite}" style="top:${q.y}px">${text}</span>`}</li>`;
  }).join('');
  return `<div class="karte reise">
      <div class="reise-pfad" style="height:${hoehe}px">
        <svg viewBox="0 0 100 ${hoehe}" preserveAspectRatio="none" aria-hidden="true"><path class="weg-rest" d="${pfadD(0, n - 1, p)}"/>${hi > 1 ? `<path class="weg-geschafft" d="${pfadD(0, hi - 1, p)}"/>` : ''}</svg>
        <ol class="reise-orte" aria-label="${esc(T('karte.aria', { held }))}">${orteHtml}</ol>
        <span class="weg-held-fuss" style="left:${hp.x}%;top:${hp.y}px" aria-hidden="true"></span>
        <span class="weg-held" style="left:${hp.x}%;top:${hp.y - HELD_HOEHE}px" aria-hidden="true">${img(heroId, held, 'held', 'cover', '', 'rund')}</span>
      </div>
    </div>`;
}

// Rückschau eines besiegten Orts als Blatt von unten (gleiches Muster wie die Detailblätter), gezeichnet von app.js auf
// oberster Ebene neben blattHtml(). ui.karteOrt = { heroId, i }; passt der Ort nicht mehr (anderer Bildschirm,
// Heldenwechsel, Zeitsprung), schließt das Blatt still.
export function karteBlattHtml() {
  const { T, aktuelleVorlage, img, nameVon, spiel, stand, stilWerte, ui, wort } = kx;
  const sel = ui.karteOrt;
  if (!sel) return '';
  if (ui.screen !== 'karte') { ui.karteOrt = null; return ''; }
  const weg = reise();
  let verb = '';
  try { verb = verbVon(aktuelleVorlage()); } catch (e) { console.warn('Karte (Fähigkeit):', e.message); }
  const o = weg && sel.heroId === spiel.fokus ? weg.orte[sel.i] : null;
  if (!o || o.art !== ORT.besiegt) { ui.karteOrt = null; return ''; }
  const g = TABELLE.gegner[o.gegner];
  const name = g ? g.name : '?';
  const tage = Math.max(1, Math.round((K.ausTagKey(o.tag) - K.ausTagKey(o.von)) / 864e5) + 1);
  const kachel = (zahl, text) => `<div class="kachel"><span class="zahl">${esc(String(zahl))}</span><span class="klein">${esc(text)}</span></div>`;
  let story = '';
  try {
    const liste = Array.isArray(o.rundenListe) ? o.rundenListe : [];
    const teile = liste.map((r, nr) => ({ nr: nr + 1, st: I.storyRunde(stand, r, aktuelleVorlage(), TABELLE, STORIES, nameVon, stilWerte()) }))
      .filter(x => x.st.teile.length);
    const mehrere = teile.length > 1;
    story = teile.length
      ? teile.map(({ nr, st }) => `<div class="rs-runde">${mehrere ? `<span class="eyebrow">${esc(T('karte.rsRundeNr', { nr }))}</span>` : ''}<h3>${esc(st.titel)}</h3>
          ${st.teile.map(t => `<details class="teil gelesen"><summary><span class="eyebrow">${esc(T('story.teilNr', { nr: t.nr }))}</span><h3>${esc(t.titel)}</h3></summary><p>${esc(t.text)}</p></details>`).join('')}</div>`).join('')
      : `<p class="klein">${esc(T('karte.rsKeineStory'))}</p>`;
  } catch (e) { console.warn('Karte (Rückschau):', e.message); story = `<p class="klein">${esc(T('karte.rsFehler'))}</p>`; }
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="rs-t">
    <button class="hintergrund" data-a="karte-ort-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-bild">${img('boss-' + o.gegner, name, 'boss', 'cover grau', name)}</div>
      <div class="blatt-inhalt">
        <span class="eyebrow gut-text">${esc(T('karte.rsEyebrow'))}</span>
        <h2 id="rs-t">${esc(name)}</h2>
        <p class="klein">${esc(T('karte.besiegtInfo', { sieg: wort('sieg'), datum: kurzDatum(o.tag) }))} · ${esc(T('karte.rsZeit', { von: kurzDatum(o.von), bis: kurzDatum(o.tag) }))}</p>
        <div class="kacheln">
          ${kachel(o.runden, T(o.runden === 1 ? 'karte.rsRunde' : 'karte.rsRunden'))}
          ${kachel(tage, T(tage === 1 ? 'karte.rsTag' : 'karte.rsTage'))}
          ${verb ? kachel(o.anwendungen, T('karte.rsAnwendungen', { verb })) : ''}
        </div>
        <span class="eyebrow">${esc(T('karte.rsStory'))}</span>
        ${story}
        <button class="cta" data-a="karte-ort-zu">${esc(T('nav.schliessen'))}</button>
      </div>
    </div>
  </div>`;
}

export const KARTE_SCREENS = {
  karte() {
    const { T, aktuelleVorlage, jetzt, nameVon, spiel } = kx;
    const weg = reise();
    let verb = '';
    try { verb = verbVon(aktuelleVorlage()); } catch (e) { console.warn('Karte (Fähigkeit):', e.message); }
    const held = nameVon(spiel.fokus);
    return `<section class="screen karte-screen">
      <div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${einstellungenKnopf()}</div>
      <div class="inhalt start-inhalt">
        ${heldenkopfHtml()}
        <div><span class="eyebrow">${esc(T('karte.eyebrow'))}</span>
        <h1>${esc(T('karte.titel', { held }))}</h1>
        <p class="klein">${esc(T('karte.intro'))}</p></div>
        ${weg ? reiseHtml(weg, spiel.fokus, verb) : `<div class="karte reise"><p class="klein">${esc(T('karte.fehler', { held }))}</p></div>`}
      </div>
    </section>`;
  }
};

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const KARTE_KLICKS = {
  'karte-ort'({ id }) {
    const { render, spiel, ui } = kx;
    const i = Number(id);
    if (!Number.isInteger(i) || i < 0) { console.warn('Karte: ungültiger Ort', id); return; }
    ui.karteOrt = { heroId: spiel.fokus, i };
    trackEvent('map_place_opened', { held: spiel.fokus });
    render();
  },
  'karte-ort-zu'() { const { render, ui } = kx; ui.karteOrt = null; render(); }
};
