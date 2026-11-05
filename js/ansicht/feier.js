// Einblendungen nach Handlungen (aus app.js ausgelagert, 30.10.2026): Sieg, Weg zum nächsten Gegner (lauf), neuer Gegner,
// Stufe, Story-Teil und Bewertungsfrage. Welche in welcher Reihenfolge: daten/momente.js; Schlange: ui.schlange / ui.feier.
import { bewerte as bewertungSpeichern } from '../analytics.js';
import { BEWERTUNGEN, SKALA } from '../daten/forschung.js';
import { BOTSCHAFTEN } from '../daten/inhalte.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as I from '../logik/inhalte.js';
import { bwStil, esc, gegnerKopfHtml, grossAnfang, icon } from './helfer.js';
import { kx } from './kontext.js';

// Bild für das Story-Popup (Version 40): eigenes Story-Bild des Gegners → Bossbild (mit Platzhalter des Stils) → keins.
export function storyBildPlatz(gid) {
  const { bild } = kx;
  if (!gid) return null;
  return bild('story-' + gid, '', 'szene').quelle !== 'platzhalter' ? 'story-' + gid : 'boss-' + gid;
}
export function frageText(art) {
  const { aktuelleVorlage, nameVon } = kx;
  const v = aktuelleVorlage();
  return (BEWERTUNGEN[art] ? BEWERTUNGEN[art].frage : '').replace('{name}', nameVon(v.held));
}
export function frageBild(art) {
  const { T, aktuelleVorlage, img, nameVon } = kx;
  const v = aktuelleVorlage();
  const g = TABELLE.gegner[v.gegner];
  const b = BEWERTUNGEN[art] ? BEWERTUNGEN[art].bild : 'szene';
  if (b === 'gegner') return img('boss-' + v.gegner, g.name, 'boss', 'cover');
  if (b === 'verbuendeter') return img(v.held, nameVon(v.held), 'held', 'cover');
  if (b === 'banner') return img('banner-' + v.held, T('feier.bildHeld'), 'szene', 'cover');
  return img('szene', T('feier.bildStory'), 'szene', 'cover');
}
// Ein Satz der Crew zum neuen Gegner (Anlass „neuer_gegner“ der Crew-Botschaften) oder ''. Wirft nie.
function crewSatz(v, gid) {
  const { jetzt, nameVon, stand, stilWerte } = kx;
  try { return I.botschaft(stand, jetzt(), { ...v, gegner: gid }, TABELLE, BOTSCHAFTEN, nameVon, stilWerte(), 'neuer_gegner').text || ''; }
  catch (e) { console.warn('Vorstellung (Crew):', e.message); return ''; }
}
export function feierHtml() {
  const { T, aktuelleVorlage, img, nameVon, story, titel, ui, wort } = kx;
  const f = ui.feier;
  if (!f) return '';
  const v = aktuelleVorlage();
  const g = TABELLE.gegner[v.gegner];
  if (f.art === 'frage') {
    const c = BEWERTUNGEN[f.bewertung];
    return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="frage-bild">${frageBild(f.bewertung)}</div>
      <div class="frage-blatt erscheint">
        <span class="griff" aria-hidden="true"></span>
        <span class="eyebrow">${esc(c.titel)}</span>
        <h2 id="feier-t">${esc(frageText(f.bewertung))}</h2>
        <div class="skala" role="group" aria-label="${esc(T('frage.skalaAria'))}">${[1, 2, 3, 4, 5].map(n => `<button class="sc" data-a="bewerte" data-id="${n}" aria-label="${esc(T('frage.punktAria', { n }))}">${n}</button>`).join('')}</div>
        <div class="skala-text"><span>${esc(SKALA.links)}</span><span>${esc(SKALA.rechts)}</span></div>
        <button class="link" data-a="bewerte" data-id="0">${esc(T('frage.ueberspringen'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'story') {
    // Version 40: Story-Popup als Kapitelmoment: Bild, „Teil n von 7“, offenes Ende, Knopf aus dem Stil-Vokabular.
    // Buch-Look (Etappe 3, F, 02.11.2026): gleiche Buchseite wie die Leseseite (Rahmen des Stils, Wachssiegel bricht, Initiale, Nebel).
    const st = story();
    const teil = st.teile.find(t => t.nr === f.nr && t.frei);
    if (!teil) { console.warn('Story-Popup: Teil nicht frei', f.nr); return ''; } // Rückfall: nichts zeigen statt leerer Karte
    const letzter = f.nr >= st.teile.length;
    const gid = TABELLE.gegner[v.gegner] ? v.gegner : null;
    const platz = storyBildPlatz(gid);
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte story-blatt story-moment st-moment erscheint">
        ${platz ? `<div class="story-bild" aria-hidden="true">${img(platz, gid ? TABELLE.gegner[gid].name : '', platz.startsWith('boss-') ? 'boss' : 'szene', 'cover')}<span class="story-bild-verlauf"></span></div>` : ''}
        <span class="st-siegel wachs gross gebrochen st-moment-siegel" aria-hidden="true">${icon('siegel')}</span>
        <div class="story-text">
          <span class="eyebrow akzent">${esc(st.titel.toUpperCase())}</span>
          <span class="chip story-chip">${esc(T('story.teilVon', { nr: f.nr, gesamt: st.teile.length }))}</span>
          <h2 id="feier-t">${esc(teil.titel)}</h2>
          <p class="story-absatz st-initiale">${esc(teil.text)}</p>
          ${letzter ? '' : `<p class="story-folgt st-folgt"><span class="st-nebel-streifen" aria-hidden="true"><i></i><i></i></span><span>${esc(T('story.folgt'))}</span></p>`}
        </div>
        <button class="cta" data-a="feier-weiter">${esc(T(letzter ? 'story.knopfEnde' : 'story.knopf'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'sieg') {
    const gid = TABELLE.gegner[f.gegner] ? f.gegner : v.gegner;
    const gs = TABELLE.gegner[gid];
    const fw = I.gegnerFormen(gs);
    const weiter = f.neuerGegner ? T('sieg.weiterNeu') : T('sieg.weiterGleich', { er: fw.er });
    // Version 68: Ablauf „sieg“ in daten/bewegung.js. Seit 02.11.2026 („Der letzte Schlag“) ist alles sofort da, nur ein
    // kurzer Nachklang; der Knopf bewegt sich nie. Nach dem Überspringen (ohneBewegung) ganz ohne Bewegung.
    const bw = teil => (f.ohneBewegung ? '' : bwStil('sieg', teil));
    // Kapitelsieg (Version 119, Etappe 4): Vollbild mit Schleier statt Karte. Der Höhepunkt zeigt die Leistung, nicht die
    // Punkte (kein XP-Chip; XP stehen im Heldenblatt). Der Stempel liegt schon auf dem Bild: er ist eben in der Arena
    // aufgeschlagen („Der letzte Schlag“), ein zweites Einstempeln wäre doppelt. Stufe nur bei echtem Aufstieg.
    // Ohne Kapitelende (gleicher Gegner kommt zurück) bleibt der Gegnername der Titel.
    const sTitel = T('sieg.titel', { gegner: gs.name, sieg: wort('sieg') });
    const kap = Number.isInteger(f.kapitel) && f.kapitel > 0 ? f.kapitel : null;
    const n = Number.isInteger(f.anzahl) ? f.anzahl : v.quest.anzahl; // Einstiegsrampe: Anzahl dieses Siegs
    return `<div class="feier kapitelsieg" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte${f.ohneBewegung ? '' : ' erscheint'} sieg-karte">
        <div class="ks-bild erloschen"${bw('bild')}><span class="ks-rund">${img('boss-' + gid, gs.name, 'boss', 'cover')}</span>
          <span class="besiegt-stempel ks-stempel" aria-hidden="true"><b>${esc(T('buehne.besiegt', { sieg: grossAnfang(wort('sieg')) }))}</b></span></div>
        <h2 id="feier-t"${bw('titel')}>${esc(kap ? T('sieg.kapitelTitel', { kapitel: wort('kapitel'), nr: kap }) : sTitel)}</h2>
        ${kap ? `<p class="ks-unter"${bw('titel')}>${esc(sTitel)}</p>` : ''}
        <p${bw('text')}>${esc(T(n === 1 ? 'sieg.einmal' : 'sieg.mehrmals', { faehigkeit: TABELLE.faehigkeiten[v.faehigkeit].name, n }))} ${esc(weiter)}</p>
        ${f.level ? `<div class="ks-beute"${bw('stufe')}><span class="ks-orden"${bw('stern')}>${esc(String(f.level))}</span><span>${esc(T('sieg.stufe', { held: nameVon(v.held), stufe: wort('stufe'), nr: f.level, titel: titel(f.level) }))}</span></div>` : ''}
        <button class="cta" data-a="feier-weiter"${bw('knopf')}>${esc(T('feier.weiter'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'lauf') {
    const alt = TABELLE.gegner[f.von] ? f.von : v.gegner;
    const neuId = TABELLE.gegner[f.nach] ? f.nach : v.gegner;
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <h2 id="feier-t">${esc(T('lauf.titel', { held: nameVon(v.held) }))}</h2>
        <div class="lauf-bahn" aria-hidden="true">
          <span class="lauf-station links">${img('boss-' + alt, '', 'boss', 'cover grau', '', 'rund')}<i class="station-haken">${icon('check')}</i></span>
          <span class="lauf-station rechts">${img('boss-' + neuId, '?', 'boss', 'cover schatten', '', 'rund')}</span>
          <span class="lauf-held">${img(v.held, nameVon(v.held), 'held', 'cover', '', 'rund')}</span>
        </div>
        <p>${esc(T('lauf.text', { gegner: I.gegnerFormen(TABELLE.gegner[alt]).nom }))}</p>
        <button class="cta" data-a="feier-weiter">${esc(T('feier.weiter'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'gegner') {
    const gid = TABELLE.gegner[f.gegner] ? f.gegner : v.gegner;
    const gn = TABELLE.gegner[gid];
    // Version 115: Vorstellung am Siegtag mit einem Satz der Crew, „Der Kampf beginnt morgen“ und „Später ansehen“
    const crew = f.vorstellung ? crewSatz(v, gid) : '';
    const knopf = f.morgen ? T('vorstellung.knopfMorgen') : T('neuerGegner.knopf');
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte auftritt-karte erscheint">
        ${gegnerKopfHtml({ bild: img('boss-' + gid, gn.name, 'boss', 'cover', '', 'auftritt'), klasse: 'feier-bild auftritt', id: 'feier-t', name: gn.name,
          chip: T('neuerGegner.chip', { KAPITEL: wort('kapitel').toUpperCase(), nr: f.kapitel, GEGNER: wort('gegner').toUpperCase() }) })}
        <div class="auftritt-text">
          <p>${esc(gn.text)}</p>
          <div class="zwei"><div class="box schlecht"><b>${esc(T('gegner.wirdStaerker'))}</b>${esc(gn.staerker)}</div><div class="box gut"><b>${esc(T('gegner.verliertKraft'))}</b>${esc(gn.schwaecher)}</div></div>
          ${crew ? `<p class="vorstellung-crew">${img(v.held, nameVon(v.held), 'held', 'blase-bild', '')}<span><b>${esc(nameVon(v.held).toUpperCase())}</b> ${esc(crew)}</span></p>` : ''}
          <p class="klein">${esc(T(f.staerker ? 'neuerGegner.zielStaerker' : 'neuerGegner.ziel', { faehigkeit: wort('faehigkeit'), name: TABELLE.faehigkeiten[v.faehigkeit].name, anzahl: Number.isInteger(f.anzahl) ? f.anzahl : v.quest.anzahl }))}</p>
          ${f.morgen ? `<p class="vorstellung-morgen"><b>${esc(T('vorstellung.morgen'))}</b></p>` : ''}
        </div>
        <div class="auftritt-fuss"><button class="cta" data-a="feier-weiter">${esc(knopf)}</button>${f.vorstellung && f.morgen ? `<button class="link" data-a="vorstellung-spaeter">${esc(T('vorstellung.spaeter'))}</button>` : ''}</div>
      </div>
    </div>`;
  }
  if (f.art === 'levelup') {
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <span class="stern-gross" aria-hidden="true">${icon('stern', 'ic gross')}</span>
        <h2 id="feier-t">${esc(T('levelup.titel', { held: nameVon(f.held || v.held), stufe: wort('stufe'), nr: f.level }))}</h2>
        <p>${esc(T('levelup.neuerTitel', { titel: titel(f.level) }))}</p>
        <button class="cta" data-a="feier-weiter">${esc(T('feier.weiter'))}</button>
      </div>
    </div>`;
  }
  return '';
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const FEIER_KLICKS = {
  'feier-weiter'() { const { zeigeNaechstes } = kx; zeigeNaechstes(); },
  'vorstellung-spaeter'() { const { vorstellungSpaeter } = kx; vorstellungSpaeter(); }, // Version 115
  'vorstellung-zeigen'() { const { vorstellungZeigen } = kx; vorstellungZeigen(); },
  bewerte({ id }) {
    const { ui, zeigeNaechstes } = kx;
    const n = Number(id);
    if (ui.feier && ui.feier.art === 'frage') bewertungSpeichern(ui.feier.bewertung, n >= 1 && n <= 5 ? n : null);
    zeigeNaechstes();
  }
};
