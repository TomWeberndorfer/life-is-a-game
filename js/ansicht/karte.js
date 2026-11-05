// Karte (30.10.2026): große Sicht auf die Hauptquest des AKTIVEN Helden (Logik: logik/karte.js, Einstellungen: daten/karte.js).
// Nur Ansicht, nichts gespeichert. Orte untereinander als gewundener Pfad; besiegte Gegner ruhig mit Haken, der aktuelle
// stark, ein kommender als Silhouette, danach Nebel. Der Held steht als Figur auf dem Pfad vor seinem Gegner.
// Überarbeitet am 30.10.2026 (Entscheidungen 9–12): eine Karte je Held, Wechsel über den Heldenkopf wie auf der Startseite;
// besiegte Orte sind antippbar und öffnen die Rückschau (Zeitraum, Runden, Anwendungen, gelesene Story-Teile zum Nachlesen).
// Psychologie: Die ganze Vergangenheit bleibt sichtbar (Kompetenzerleben, besonders nach schweren Tagen); die Zukunft
// bleibt im Nebel (Neugier ohne sichtbares Ende). Keine roten Markierungen, kein Rückschritt auf der Karte.
// 04.11.2026: Nebel als Zone mit festem, ruhigem Abschluss statt eines Nebel-Orts; Neugier ja, Sog eines
// Endlos-Scrollens nein. Die Heldenfigur weicht Text und Ortsbildern aus (logik/karte.js heldPlatz).
import { trackEvent } from '../analytics.js';
import { STORIES } from '../daten/inhalte.js';
import { KARTE, KARTE_HELD, KARTE_HINTERGRUND, KARTE_NEBEL, KARTE_PFAD } from '../daten/karte.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { ORT, heldKonfig, heldPlatz, hintergrundKonfig, kartenBilder, nebelKonfig, nebelPfadD, ortPunkt, pfadD, pfadKonfig, reiseTeile, reiseWeg } from '../logik/karte.js';
import { esc, gegnerKopfHtml, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { heldenkopfHtml, kopfZeile } from './startseite.js';

const verbVon = v => ((v && TABELLE.faehigkeiten[v.faehigkeit]) || {}).verb || '';

// Reise des aktiven Helden; null bei Fehler (Hinweis statt Karte, Meldung in der Konsole).
function reise() {
  const { gegnerVerhuellt, jetzt, stand } = kx;
  try { return reiseWeg(stand, jetzt(), KARTE, { verhuellt: gegnerVerhuellt(K.auswertung(stand, jetzt())) }); }
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

// Kartenbilder (Version 122, Bildfolge nach Schablone seit Version 126): nur wenn in „Inhalte pflegen“ Bilder liegen
// (Stil vor „alle“, Held vor gemeinsam), sonst nichts. Jedes Bild deckt genau `orte` Zeilen ab und liegt im selben
// Rechennetz wie Pfad und Orte (Vielfache von --zeile), darum passen gemalter und gezeichneter Weg aufeinander.
// Ein Schleier in der Kartenfarbe liegt darüber (CSS .reise.mit-bild), Pfad, Orte und Nebel bleiben obenauf.
// Das letzte Bild läuft weich in den Nebel aus; ein Ersatzbild (fehlende Nummer) liegt unter dichterem Schleier.
const zy = (y, p) => `calc(var(--zeile) * ${Math.round((y / p.zeile) * 10000) / 10000})`; // Rechen-px → echte Höhe

function hintergrundHtml(anzahl, heroId) {
  const { anzeige, bildFuer, stand } = kx;
  const leer = { klasse: '', stil: '', html: '' };
  if (anzeige.bilder === 'aus') return leer; // Blatt „Anzeige“ (Version 125): ohne Kartenbilder
  const k = hintergrundKonfig(KARTE_HINTERGRUND);
  const f = kartenBilder(anzahl, platz => bildFuer(stand.stil.aktiv, platz, 'szene', 'breit'), k, { held: heroId });
  if (!f) return leer;
  const letzt = f.bilder.length;
  const html = f.bilder.map(b => `<img class="reise-hintergrund${b.quelle === 'ersatz' ? ' ersatz' : ''}${b.nr === letzt ? ' letztes' : ''}" src="${esc(b.src)}" alt="" loading="lazy" data-nr="${b.nr}" style="top:calc(var(--zeile) * ${(b.nr - 1) * k.orte});height:calc(var(--zeile) * ${k.orte})" onerror="this.remove()">`).join('');
  return { klasse: ' mit-bild', stil: `--karte-schleier:${f.schleier};`, html };
}

// Nebel-Zone am Ende (04.11.2026): der Weg läuft verblassend hinein, „Weiter im Nebel“ steht in der Mitte, der Nebel
// zieht langsam (CSS bw-nebel, Dauer aus daten/bewegung.js; still bei „Bewegung reduzieren“). Feste Länge, ruhiger
// Abschluss, kein Endlos-Scrollen. x0 = Lage des letzten Orts (Prozent), damit der Weg nahtlos weiterläuft.
function nebelHtml(x0) {
  const { T } = kx;
  const nb = nebelKonfig(KARTE_NEBEL);
  const bis = Math.round(nb.verblassen * 100);
  return `<div class="reise-nebel" style="--nebel-hoehe:clamp(${nb.minPx}px, ${nb.hoeheVh}vh, ${nb.maxPx}px)">
      <svg class="nebel-weg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="nebel-verlauf" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--line);stop-opacity:1"/><stop offset="${bis}%" style="stop-color:var(--line);stop-opacity:0"/></linearGradient></defs>
        <path d="${nebelPfadD(x0)}"/>
      </svg>
      <span class="nebel-schwade a" aria-hidden="true"></span><span class="nebel-schwade b" aria-hidden="true"></span>
      <p class="nebel-text">${esc(T('karte.nebel'))}</p>
    </div>`;
}

function reiseHtml(weg, heroId, verb) {
  const { T, img, nameVon } = kx;
  const held = nameVon(heroId);
  const p = pfadKonfig(KARTE_PFAD);
  const hk = heldKonfig(KARTE_HELD);
  const { orte, nebel } = reiseTeile(weg.orte);
  const hi = Math.min(weg.held, Math.max(0, orte.length - 1));
  const n = orte.length;
  const hoehe = n * p.zeile;
  const hg = hintergrundHtml(n, heroId);
  const kb = hintergrundKonfig(KARTE_HINTERGRUND);
  // Zeilenhöhe aus der Kartenbreite (Container-Einheit cqw = Breite der Karte innen), höchstens maxBreitePx breit
  const geo = `--zeile:max(${p.zeileMinPx}px, 100cqw * ${kb.hoehe} / ${kb.breite * kb.orte});--karte-max:${kb.maxBreitePx}px;`;
  const aktuell = orte[hi];
  const anteil = aktuell && aktuell.art === ORT.aktuell && !aktuell.morgen && aktuell.anzahl > 0 ? Math.min(1, aktuell.treffer / aktuell.anzahl) : 0;
  const platz = heldPlatz(Math.max(0, hi - 1 + anteil), n, p, hk);
  const letzter = ortPunkt(Math.max(0, n - 1), p);
  const orteHtml = orte.map((o, i) => {
    const q = ortPunkt(i, p);
    const seite = q.x < 50 ? 'links' : 'rechts';
    const t = ortTexte(o, verb);
    const lage = `style="left:${q.x}%;top:${zy(q.y, p)}"`;
    // Besiegte Orte sind Knöpfe (Rückschau); alle anderen nur Bild (keine leeren Versprechen bei Silhouette)
    const station = o.art === ORT.besiegt
      ? `<button class="station ${o.art} ort-knopf" ${lage} data-a="karte-ort" data-id="${i}" aria-label="${esc(T('karte.ortAria', { gegner: t.titel }))}">${ortBild(o)}</button>`
      : `<span class="station ${o.art}" ${lage} aria-hidden="true">${ortBild(o)}</span>`;
    const text = `<b>${esc(t.titel)}</b>${t.info ? `<span class="klein">${esc(t.info)}</span>` : ''}`;
    return `<li class="reise-ort ${o.art}">${station}${o.art === ORT.besiegt
      ? `<button class="reise-text ort-knopf ${seite}" style="top:${zy(q.y, p)}" data-a="karte-ort" data-id="${i}" tabindex="-1">${text}</button>`
      : `<span class="reise-text ${seite}" style="top:${zy(q.y, p)}">${text}</span>`}</li>`;
  }).join('');
  // Weg: durch alle Orte; mit Nebel danach senkrecht bis zum Rand, die Nebel-Zone führt ihn weiter
  const anschluss = nebel && n ? `<path class="weg-rest" d="M${letzter.x} ${letzter.y} L${letzter.x} ${hoehe}"/>` : '';
  return `<div class="karte reise${hg.klasse}${nebel ? ' mit-nebel' : ''}" style="${geo}${hg.stil}">
      <div class="reise-pfad" style="height:${zy(hoehe, p)};--text-rand:${hk.textRand}%">${hg.html}
        <svg viewBox="0 0 100 ${hoehe}" preserveAspectRatio="none" aria-hidden="true"><path class="weg-rest" d="${pfadD(0, n - 1, p)}"/>${anschluss}${hi > 1 ? `<path class="weg-geschafft" d="${pfadD(0, hi - 1, p)}"/>` : ''}</svg>
        <ol class="reise-orte" aria-label="${esc(T('karte.aria', { held }))}">${orteHtml}</ol>
        <span class="weg-held-fuss" style="left:${platz.fuss.x}%;top:${zy(platz.fuss.y, p)}" aria-hidden="true"></span>
        <span class="weg-held" style="left:${platz.x}%;top:${zy(platz.y, p)}" aria-hidden="true">${img(heroId, held, 'held', 'cover', '', 'rund')}</span>
      </div>
      ${nebel ? nebelHtml(letzter.x) : ''}
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
      ${gegnerKopfHtml({ bild: img('boss-' + o.gegner, name, 'boss', 'cover grau', name, 'auftritt'), klasse: 'blatt-kopf', id: 'rs-t', name, chip: T('karte.rsEyebrow'), chipArt: 'gut' })}
      <div class="blatt-inhalt">
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
      ${kopfZeile(kurzDatum(K.tagKey(jetzt())))}
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
