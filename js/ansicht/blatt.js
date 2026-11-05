// Detailblätter von unten (aus app.js ausgelagert, 30.10.2026): Verbündeter (crew), Gegner (boss), Fähigkeit,
// Premium. Welches Blatt offen ist: ui.blatt; Öffnen/Schließen mit Zählern in app.js (oeffneBlatt, schliesseBlatt).
import { trackEvent } from '../analytics.js';
import { PREMIUM } from '../daten/forschung.js';
import { TABELLE } from '../daten/vorlagen.js';
import { entwicklung } from '../logik/entwicklung.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { akkusativ, esc, fortschrittHier, gegnerKopfHtml, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';
import { messzielBogenHtml, messzielKnopf } from './messziele.js';
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import { wennDann } from '../logik/startseite.js'; // Charakterbogen: Wenn-dann wie auf der Bühne
import { ruhetagRundeText } from './ruhetag.js'; // Version 90
import { baldBlattInhalt } from './rahmen.js'; // Etappe 3, Teil A
import { modusAbschnittHtml } from './heldenmodi.js'; // Heldenmodi (04.11.2026)
import { wochenBogenHtml } from './wochenrunde.js'; // Wochenrunde (05.11.2026)
import { bogenZeileHtml, istBestaendigkeit } from './bestaendigkeit.js'; // Beständigkeit (04.11.2026)

// Fortschritt im Leben (Version 21): echtes Verhalten seit Questbeginn, nicht nur XP.
// Charakterbogen (Etappe 3, Teil E, 02.11.2026): das Heldenblatt (ui.blatt 'crew') als Bogen mit Abschnitten
// Werte · Runden · Fähigkeit · Messziele. Runden: Gold = Sieg, schraffiert = läuft, sonst gedämpft (nie rot).
// Reine Ansicht, kein neues Spielstand-Feld; Rundenstatus aus logik/entwicklung.js (rundenStatus).
export function entw() {
  const { jetzt, stand } = kx;
  try { return entwicklung(stand, jetzt()); } catch (e) { console.warn('Entwicklung:', e.message); return null; }
}
export function entwicklungHtml(v) {
  const { T, naechsterTitel, wort } = kx;
  const e = entw();
  if (!e) return '';
  const f = TABELLE.faehigkeiten[v.faehigkeit];
  const kachel = (zahl, text) => `<div class="kachel"><span class="zahl">${zahl}</span><span class="klein">${esc(text)}</span></div>`;
  const maxZ = Math.max(1, ...e.verlauf.map(r => Math.max(r.anwendungen, r.ziel)));
  const nt = naechsterTitel(e.level);
  return `<section class="bogen-abschnitt"><span class="eyebrow">${esc(T('bogen.werte'))}</span>
    <div class="kacheln">
      ${kachel(e.anwendungen, T('entw.anwendungen', { verb: f.verb }))}
      ${kachel(e.siege, T('entw.siege', { sieg: wort('sieg') }))}
      ${kachel(e.kapitel, T('entw.kapitel', { kapitel: wort('kapitel') }))}
      ${kachel(e.tageSeitStart, T(e.tageSeitStart === 1 ? 'entw.tag' : 'entw.tage'))}
    </div>${fortschrittHier('bestaendigkeit', 'heldenblatt') ? bogenZeileHtml() : ''}</section>
    <section class="bogen-abschnitt"><span class="eyebrow">${esc(T('bogen.runden'))}</span>
    <div class="bogen-runden" role="img" aria-label="${esc(e.verlauf.map(r => T('bogen.rundeAria.' + r.status, { nr: r.nr, n: r.anwendungen, ziel: r.ziel })).join('; '))}">
      ${e.verlauf.map(r => `<span class="bogen-runde ${r.status}"><span class="bogen-feld"><i style="height:${Math.round(100 * Math.min(r.anwendungen, maxZ) / maxZ)}%"></i><b>${r.anwendungen}</b></span><small>${esc(T('entw.runde', { nr: r.nr }))}</small></span>`).join('')}
    </div>
    <p class="klein">${esc(T('bogen.legende', { gegner: wort('gegner'), sieg: wort('sieg') }))} ${esc(T('bogen.gesamt', { n: e.siege, sieg: wort('sieg'), runden: e.rundenGesamt }))}${nt ? ` ${esc(T('entw.naechsterTitel', { titel: nt.titel, stufe: wort('stufe'), nr: nt.abStufe }))}` : ''}</p></section>`;
}
// Charakterbogen: Fähigkeit mit Wenn → Dann; tippen öffnet das Fähigkeitsblatt mit allen Schritten.
// Ohne Wenn-dann (Vorlage ohne Text) nur der Name. Wirft nie.
export function bogenFaehigkeitHtml(f) {
  const { T, wort } = kx;
  if (!f) return '';
  const wd = wennDann(f);
  const regel = wd.wenn || wd.dann ? `<span class="bogen-regel">${wd.wenn ? `<b>${esc(T('tat.wenn'))}</b> <span>${esc(wd.wenn)}</span>` : ''}${wd.wenn && wd.dann ? ' <span aria-hidden="true">→</span> ' : ''}${wd.dann ? `<b class="dann">${esc(T('tat.dannLabel'))}</b> <span>${esc(wd.dann)}</span>` : ''}</span>` : '';
  return `<section class="bogen-abschnitt"><span class="eyebrow">${esc(T('bogen.faehigkeit', { FAEHIGKEIT: wort('faehigkeit').toUpperCase() }))}</span>
    <button class="bogen-faehigkeit tippbar" data-a="blatt" data-id="faehigkeit" aria-label="${esc(T('tat.ansehen', { faehigkeit: f.name }))}">
      <span class="medaille klein-m" aria-hidden="true">${icon(f.icon || 'stern')}</span>
      <span class="spalte"><span class="nm">${esc(f.name)}</span>${regel}</span>${icon('pfeilRechts')}
    </button></section>`;
}
// Lebensbereich des Helden im Fokus (Name) oder ''.
function lebensbereichName() {
  const { spiel } = kx;
  const h = spiel && Array.isArray(spiel.helden) ? spiel.helden.find(x => x.heroId === spiel.fokus) : null;
  const d = h && LEBENSBEREICHE.find(x => x.id === h.domainId);
  return d ? d.name : '';
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
  const { T, aktuelleVorlage, img, jetzt, nameVon, spiel, stand, titel, ui, wort } = kx;
  if (!ui.blatt || !stand.quest) return '';
  const v = aktuelleVorlage();
  const g = TABELLE.gegner[v.gegner];
  const f = TABELLE.faehigkeiten[v.faehigkeit];
  const vb = TABELLE.helden[v.held];
  const a = K.auswertung(stand, jetzt());
  let kopfbild = '';
  let kopf = ''; // fertiger Kopf über dem Inhalt (Gegner: großer Gegnerkopf, Version 132)
  let inhalt = '';
  if (ui.blatt === 'crew') {
    // Version 140: Stufe, Kapitel und „x von y“ stehen hier (Register FORTSCHRITT in daten/startseite.js)
    const stufeHier = fortschrittHier('stufe', 'heldenblatt');
    const rundeHier = fortschrittHier('rundeStand', 'heldenblatt') && a.rundeTag >= 0 && !a.rundeOffen;
    const kapitelChip = a.gegnerAnzahl > 1 && fortschrittHier('kapitel', 'heldenblatt') ? `<span class="chip">${esc(T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }))}</span>` : '';
    kopfbild = img(v.held, vb.name, 'held', 'cover', nameVon(v.held));
    inhalt = `<span class="eyebrow gut-text">${esc(T('blatt.deinVerbuendeter', { VERBUENDETER: wort('verbuendeter').toUpperCase() }))}</span>
      <h2 id="blatt-t">${esc(nameVon(v.held))}</h2><p class="rolle">${esc(vb.rolle)}</p>
      <div class="bogen-chips">${stufeHier ? `<span class="chip">${esc(T('blatt.stufeZeile', { stufe: wort('stufe'), nr: a.level, titel: titel(a.level) }))}</span>` : ''}${lebensbereichName() ? `<span class="chip">${esc(lebensbereichName())}</span>` : ''}${kapitelChip}</div>
      ${stufeHier ? `<div class="zeile"><div class="balken xp gross-b"><i style="width:${Math.round(100 * a.imLevel / a.proLevel)}%"></i></div></div>
      <p class="klein">${esc(T('blatt.xpZeile', { xp: a.xp, rest: a.proLevel - a.imLevel, stufe: wort('stufe'), nr: a.level + 1 }))}</p>` : ''}
      ${rundeHier ? `<p class="klein bogen-runde-stand">${esc(T('blatt.rundeStand', { stand: T('weg.stand', { treffer: a.treffer, anzahl: a.anzahl }) }))}</p>` : ''}
      <div class="bogen">
      ${modusAbschnittHtml(spiel.fokus)}
      ${wochenBogenHtml()}
      ${entwicklungHtml(v)}
      ${bogenFaehigkeitHtml(f)}
      ${messzielBogenHtml(spiel.fokus)}
      </div>
      ${messzielKnopf()}
      <p class="lead">${esc(T('blatt.hilft', { held: nameVon(v.held) }))}</p>
      <ul class="haken">${vb.hilft.map(h => `<li>${icon('check')}${esc(h)}</li>`).join('')}</ul>`;
  } else if (ui.blatt === 'boss') {
    // Version 132: groß wie beim Auftritt; Name, „Dein Gegner“ und Kapitel stehen auf dem Bild
    const kapitel = a.gegnerAnzahl > 1 ? ` · ${T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }).toUpperCase()}` : '';
    kopf = gegnerKopfHtml({ bild: img('boss-' + v.gegner, g.name, 'boss', 'cover', g.name, 'auftritt'), klasse: 'blatt-kopf', id: 'blatt-t', name: g.name,
      chip: T('blatt.deinGegner', { GEGNER: wort('gegner').toUpperCase() }) + kapitel });
    inhalt = `<div class="segmente gross-s" role="img" aria-label="${esc(T('gegner.kraftAria', { kraft: a.anzahl - a.treffer, anzahl: a.anzahl }))}">${Array.from({ length: a.anzahl }, (_, i) => `<i class="${i < a.anzahl - a.treffer ? 'voll' : ''}"></i>`).join('')}</div>
      <p class="klein">${esc(istBestaendigkeit()
        ? T('bst.kraftWoche', { n: a.treffer, ziel: a.anzahl, stand: a.siege ? T('gegner.siege', { n: a.siege, sieg: wort('sieg') }) : T('gegner.unbesiegt') })
        : T('blatt.kraftWoche', { kraft: a.anzahl - a.treffer, anzahl: a.anzahl, stand: a.siege ? T('gegner.siege', { n: a.siege, sieg: wort('sieg') }) : T('gegner.unbesiegt') }))}</p>
      <p class="klein">${esc(a.rundeTag < 0 ? T('gegner.rundeMorgen', { bis: kurzDatum(a.rundeBis) }) : a.rundeOffen ? T('zw.wache.runde') : T('gegner.rundeLaeuft', { bis: kurzDatum(a.rundeBis) }))}${a.rundeOffen ? '' : esc(ruhetagRundeText(a))}</p>
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
  } else if (ui.blatt === 'bald') {
    inhalt = baldBlattInhalt();
  } else if (ui.blatt === 'premium') {
    inhalt = `<span class="stern-gross" aria-hidden="true">${icon('stern', 'ic gross')}</span>
      <h2 id="blatt-t">${esc(T('premium.danke'))}</h2>
      <p class="lead">${esc(T('premium.text', { titel: PREMIUM.titel }))}</p>
      <p class="klein">${esc(T('premium.nichts'))}</p>`;
  }
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="blatt-t">
    <button class="hintergrund" data-a="blatt-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      ${kopf || (kopfbild ? `<div class="blatt-bild">${kopfbild}</div>` : '')}
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
