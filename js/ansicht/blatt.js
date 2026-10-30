// Detailblätter von unten (aus app.js ausgelagert, 30.10.2026): Verbündeter (crew), Gegner (boss), Fähigkeit,
// Premium. Welches Blatt offen ist: ui.blatt; Öffnen/Schließen mit Zählern in app.js (oeffneBlatt, schliesseBlatt).
import { trackEvent } from '../analytics.js';
import { PREMIUM } from '../daten/forschung.js';
import { TABELLE } from '../daten/vorlagen.js';
import { entwicklung } from '../logik/entwicklung.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { akkusativ, esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

// Fortschritt im Leben (Version 21): echtes Verhalten seit Questbeginn, nicht nur XP.
export function entw() {
  const { jetzt, stand } = kx;
  try { return entwicklung(stand, jetzt()); } catch (e) { console.warn('Entwicklung:', e.message); return null; }
}
export function entwicklungHtml(v) {
  const { T, wort } = kx;
  const e = entw();
  if (!e) return '';
  const f = TABELLE.faehigkeiten[v.faehigkeit];
  const kachel = (zahl, text) => `<div class="kachel"><span class="zahl">${zahl}</span><span class="klein">${esc(text)}</span></div>`;
  const maxZ = Math.max(1, ...e.verlauf.map(r => Math.max(r.anwendungen, r.ziel)));
  return `<span class="eyebrow">${esc(T('entw.titel'))}</span>
    <div class="kacheln">
      ${kachel(e.anwendungen, T('entw.anwendungen', { verb: f.verb }))}
      ${kachel(e.siege, T('entw.siege', { sieg: wort('sieg') }))}
      ${kachel(e.kapitel, T('entw.kapitel', { kapitel: wort('kapitel') }))}
      ${kachel(e.tageSeitStart, T(e.tageSeitStart === 1 ? 'entw.tag' : 'entw.tage'))}
    </div>
    <div class="verlauf-runden" role="img" aria-label="${esc(e.verlauf.map(r => T(r.sieg ? 'entw.verlaufAriaSieg' : 'entw.verlaufAria', { nr: r.nr, n: r.anwendungen, ziel: r.ziel })).join('; '))}">
      ${e.verlauf.map(r => `<span class="runde ${r.sieg ? 'sieg' : ''}"><i style="height:${Math.round(100 * Math.min(r.anwendungen, maxZ) / maxZ)}%"></i><b>${r.anwendungen}</b><small>${esc(T('entw.runde', { nr: r.nr }))}</small></span>`).join('')}
    </div>
    <p class="klein">${esc(T('entw.legende', { anzahl: e.ziel, gegner: wort('gegner'), sieg: wort('sieg') }))}${e.naechsterTitel ? ` ${esc(T('entw.naechsterTitel', { titel: e.naechsterTitel.titel, stufe: wort('stufe'), nr: e.naechsterTitel.abStufe }))}` : ''}</p>`;
}
// Andeutung: nächster Gegner der Kette als Silhouette (Name bleibt verborgen)
export function naechsterGegnerHtml(a, g) {
  const { T, andeutungGesehen, img, stand, wort } = kx;
  const kette = K.kette(stand);
  const id = a.gegnerNr < a.gegnerAnzahl ? kette[a.gegnerNr] : null;
  if (!id || !TABELLE.gegner[id]) return '';
  andeutungGesehen('boss');
  return `<div class="naechster">
    <span class="naechster-bild" aria-hidden="true">${img('boss-' + id, '?', 'boss', 'cover schatten', '', 'quadrat')}</span>
    <span class="spalte"><span class="eyebrow">${esc(T('teaser.kapitel', { KAPITEL: wort('kapitel').toUpperCase(), nr: a.gegnerNr + 1 }))}</span><span class="nm">${esc(T('teaser.name'))}</span>
    <span class="klein">${esc(T('teaser.wartet', { gegner: I.gegnerFormen(g).nom, sieg: wort('sieg') }))}</span></span></div>`;
}
export function blattHtml() {
  const { T, aktuelleVorlage, img, jetzt, nameVon, stand, ui, wort } = kx;
  if (!ui.blatt || !stand.quest) return '';
  const v = aktuelleVorlage();
  const g = TABELLE.gegner[v.gegner];
  const f = TABELLE.faehigkeiten[v.faehigkeit];
  const vb = TABELLE.helden[v.held];
  const a = K.auswertung(stand, jetzt());
  let kopfbild = '';
  let inhalt = '';
  if (ui.blatt === 'crew') {
    kopfbild = img(v.held, vb.name, 'held', 'cover', nameVon(v.held));
    inhalt = `<span class="eyebrow gut-text">${esc(T('blatt.deinVerbuendeter', { VERBUENDETER: wort('verbuendeter').toUpperCase() }))}</span>
      <h2 id="blatt-t">${esc(nameVon(v.held))}</h2><p class="rolle">${esc(vb.rolle)}</p>
      <div class="zeile"><div class="balken xp gross-b"><i style="width:${Math.round(100 * a.imLevel / a.proLevel)}%"></i></div><span class="mini">${esc(T('blatt.stufeZeile', { stufe: wort('stufe'), nr: a.level, titel: a.titel }))}</span></div>
      <p class="klein">${esc(T('blatt.xpZeile', { xp: a.xp, rest: a.proLevel - a.imLevel, stufe: wort('stufe') }))}</p>
      ${entwicklungHtml(v)}
      <p class="lead">${esc(T('blatt.hilft', { held: nameVon(v.held) }))}</p>
      <ul class="haken">${vb.hilft.map(h => `<li>${icon('check')}${esc(h)}</li>`).join('')}</ul>`;
  } else if (ui.blatt === 'boss') {
    kopfbild = img('boss-' + v.gegner, g.name, 'boss', 'cover', g.name);
    inhalt = `<span class="eyebrow akzent">${esc(T('blatt.deinGegner', { GEGNER: wort('gegner').toUpperCase() }))}</span>
      <h2 id="blatt-t">${esc(g.name)}</h2>
      <div class="segmente gross-s" role="img" aria-label="${esc(T('gegner.kraftAria', { kraft: a.anzahl - a.treffer, anzahl: a.anzahl }))}">${Array.from({ length: a.anzahl }, (_, i) => `<i class="${i < a.anzahl - a.treffer ? 'voll' : ''}"></i>`).join('')}</div>
      <p class="klein">${esc(T('blatt.kraftWoche', { kraft: a.anzahl - a.treffer, anzahl: a.anzahl, stand: a.siege ? T('gegner.siege', { n: a.siege, sieg: wort('sieg') }) : T('gegner.unbesiegt') }))}</p>
      <p class="klein">${esc(T(a.rundeTag < 0 ? 'gegner.rundeMorgen' : 'gegner.rundeLaeuft', { bis: kurzDatum(a.rundeBis) }))}${a.gegnerAnzahl > 1 ? ` ${esc(T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }))}.` : ''}</p>
      <p class="lead">${esc(g.text)}</p>
      <div class="zwei"><div class="box schlecht"><b>${esc(T('gegner.wirdStaerker'))}</b>${esc(g.staerker)}</div><div class="box gut"><b>${esc(T('gegner.verliertKraft'))}</b>${esc(g.schwaecher)}</div></div>
      ${naechsterGegnerHtml(a, g)}`;
  } else if (ui.blatt === 'faehigkeit') {
    inhalt = `<span class="medaille">${icon(f.icon, 'ic gross')}</span>
      <span class="eyebrow">${esc(T('blatt.deineFaehigkeit', { FAEHIGKEIT: wort('faehigkeit').toUpperCase() }))}</span>
      <h2 id="blatt-t">${esc(f.name)}</h2>
      <p class="wenn">${esc(f.wenn)}</p>
      <ul class="haken">${f.schritte.map(s => `<li>${icon('check')}${esc(s)}</li>`).join('')}</ul>
      <p class="klein">${esc(T('faehigkeit.wirksam', { gegner: akkusativ(g.name) }))}</p>`;
  } else if (ui.blatt === 'premium') {
    inhalt = `<span class="stern-gross" aria-hidden="true">${icon('stern', 'ic gross')}</span>
      <h2 id="blatt-t">${esc(T('premium.danke'))}</h2>
      <p class="lead">${esc(T('premium.text', { titel: PREMIUM.titel }))}</p>
      <p class="klein">${esc(T('premium.nichts'))}</p>`;
  }
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="blatt-t">
    <button class="hintergrund" data-a="blatt-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      ${kopfbild ? `<div class="blatt-bild">${kopfbild}</div>` : ''}
      <div class="blatt-inhalt">${inhalt}<button class="cta" data-a="blatt-zu">${esc(T('nav.schliessen'))}</button></div>
    </div>
  </div>`;
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const BLATT_KLICKS = {
  blatt({ id }) { const { oeffneBlatt } = kx; oeffneBlatt(id); },
  'blatt-zu'() { const { schliesseBlatt } = kx; schliesseBlatt(); },
  premium() { const { oeffneBlatt } = kx; trackEvent('premium_clicked', { preis: PREMIUM.preis }); oeffneBlatt('premium'); }
};
