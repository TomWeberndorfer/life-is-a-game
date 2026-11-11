// Onboarding (aus app.js ausgelagert, 30.10.2026): vom ersten Öffnen bis zur ersten Quest, auch für weitere Helden („Ein neues
// Abenteuer“, ui.neu) und ein neues Ziel (ui.kapitelFuer). Seit Version 178 eine Frage je Seite; welche Schritte ein Weg hat,
// steht in daten/onboarding.js (Regeln: logik/onboarding.js).
import { trackEvent } from '../analytics.js';
import { RAMPE } from '../daten/rampe.js';
import { hauptArtId } from '../logik/teilziele.js'; // Beständigkeit (04.11.2026)
import { TABELLE } from '../daten/vorlagen.js';
import * as EW from '../logik/einwilligung.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import * as MF from '../logik/mehrfach.js'; // Mehrere Helden auf einmal (05.11.2026)
import * as SP from '../logik/startpaket.js'; // Startpaket mit Auswahl (06.11.2026)
import { einwDetails, startpaketKnopf } from './einstellungen.js';
import * as OB from '../logik/onboarding.js'; // Einzelfragen (Version 178)
import { ONBOARDING_MEHRFACH_ZURUECK } from '../daten/onboarding.js';
import { STARTPAKETE } from '../daten/startpakete.js'; // Startpaket (02.11.2026)
import { STIL_REIHENFOLGE, STIL_WAEHLBAR, STILE } from '../daten/stile.js'; // Stilfrage am Start (Version 163)
import { weltKachel } from './stilwahl.js';
import { akkusativ, esc, icon } from './helfer.js';
import { kx } from './kontext.js';
import { auraHtml } from './feier.js'; // Aura je Gegner auch beim ersten Gegner (05.11.2026)
import { erreichenGewaehlt, pruefeZielWahl, tuerHtml, wegWahlHtml, zielVorschauHtml, zielWahlBereit, zielWahlHtml } from './zielquest.js'; // Ziel-Quests (31.10.2026)

// Schritte der Fortschrittsanzeige und Zeilen der Analyse (ob4). Die Analyse zählt in app.js bis ANALYSE_ZEILEN.length.
// Startpaket mit Auswahl (06.11.2026): dieselbe Ansicht wie „Mehrere Helden auf einmal“, die Helden des Pakets sind
// vorausgewählt. Je Held: Ziel und was das Paket mitbringt; schon vorhandene Helden „werden ergänzt“ (auch abwählbar).
// Zustand ui.mehrfach = { paket, auswahl: [Helden-IDs], fehler, zurueck }. Anlegen: mehrfachAnlegen → startpaketAnlegenAuswahl.
function paketAuswahlHtml() {
  const { T, nameVon, spiel, ui } = kx;
  const p = STARTPAKETE[ui.mehrfach.paket];
  const helden = SP.paketHelden(ui.mehrfach.paket, spiel, TABELLE);
  const gew = ui.mehrfach.auswahl;
  const neu = helden.filter(h => !h.vorhanden && gew.includes(h.heroId)).length;
  const frei = Math.max(0, H.MAX_HELDEN - ((spiel && spiel.helden) || []).length);
  const mit = h => [h.zielquest ? T('paket.mitZiel') : '', h.messziele ? T(h.messziele === 1 ? 'paket.mitMessziel' : 'paket.mitMessziele', { n: h.messziele }) : '', h.ideen ? T(h.ideen === 1 ? 'paket.mitIdee' : 'paket.mitIdeen', { n: h.ideen }) : ''].filter(Boolean).join(' · ');
  const unter = h => [h.vorhanden ? T('paket.ergaenzt') : h.ziel, mit(h)].filter(Boolean).join(' · ');
  return `<section class="screen">
      <div class="ob-kopf"><button class="icbtn" data-a="mehrfach-zurueck" aria-label="${esc(T('nav.zurueck'))}">${icon('zurueck')}</button><span class="schritt"></span></div>
      <div class="inhalt">
        <span class="eyebrow">${esc(T('einst.startpaket'))}</span>
        <h1>${esc(p ? p.name : '')}</h1>
        <p class="lead">${esc(T('paket.text'))}</p>
        <p class="klein" role="status">${esc(neu > frei ? T('paket.keinPlatz', { n: neu, frei }) : T('paket.gewaehlt', { n: gew.length, alle: helden.length }))}</p>
        <div class="optionen" role="group" aria-label="${esc(T('paket.gruppe'))}">
          ${helden.map(h => `<button class="opt ${gew.includes(h.heroId) ? 'sel' : ''}" aria-pressed="${gew.includes(h.heroId)}" data-a="mehrfach-wahl" data-id="${esc(h.heroId)}">${gew.includes(h.heroId) ? icon('check') : ''}<span>${esc(nameVon(h.heroId))}<small>${esc(unter(h))}</small></span></button>`).join('')}
        </div>
        ${ui.mehrfach.fehler ? `<p class="fehler" role="alert">${esc(ui.mehrfach.fehler)}</p>` : ''}
      </div>
      <div class="fuss"><button class="cta" data-a="mehrfach-anlegen" ${gew.length && neu <= frei ? '' : 'disabled'}>${esc(T('paket.anlegen', { n: gew.length }))}</button></div>
    </section>`;
}

// Stilfrage am Start (Version 163): Welten, die gewählt werden dürfen (`waehlbar` in daten/stile.js), als Kacheln. Seit Version 178
// eine eigene Seite (obwelt), nur im ersten Start und nur, wenn es etwas zu wählen gibt (daten/onboarding.js). Fantasy ist
// vorgewählt. Der Stil wirkt sofort auf Bild und Farben. Die Weltenwahl nach dem ersten Sieg bleibt: kern.stilStartWaehlen lässt
// `angeboten` und `frei` unberührt.
function stilStartHtml() {
  const { T, stand } = kx;
  return `<p class="frage" id="f-stil">${esc(T('ob.stilFrage'))}</p>
        <div class="welten start" role="group" aria-labelledby="f-stil">
          ${STIL_WAEHLBAR.map(id => weltKachel(id, { sel: stand.stil.aktiv === id, zeile: STILE[id].name, aktion: 'ob-stil' })).join('')}
        </div>
        <p class="klein">${esc(T('ob.stilHinweis'))}</p>`;
}

// „Mehrere auf einmal“ (seit 10.11.2026 für alle): leiser Zweitweg unter der Bereichswahl, im ersten Start und bei „Neues
// Abenteuer“, nicht beim neuen Ziel für einen vorhandenen Helden. Im ersten Start steht die Datenfrage seit Version 178 vorher auf
// eigener Seite; die Sperre bleibt als Sicherung (Klick vor der Antwort wird abgewiesen). Es muss Platz für zwei Helden sein.
// Das Startpaket (nur Besitzer und #test) steht in derselben leisen Zeile.
function nebenwegHtml() {
  const { T, einw, mehrfachErlaubt, spiel, ui } = kx;
  const mehr = !kapitelHeld() && mehrfachErlaubt() && MF.platzFrei(spiel) >= 2;
  const paket = !ui.neu && kx.startpaketErlaubt();
  if (!mehr && !paket) return '';
  const gesperrt = EW.istOffen(einw) && !ui.neu;
  return `<div class="ob-nebenweg">
          ${mehr ? `<p class="klein">${esc(T('mehr.einstiegText'))}</p><button class="link" data-a="mehrfach-oeffnen" ${gesperrt ? 'disabled' : ''}>${icon('menschen')} ${esc(T('mehr.einstieg'))}</button>` : ''}
          ${paket ? `<span class="eyebrow">${esc(T('einst.startpaket'))}</span>${Object.keys(STARTPAKETE).map(id => startpaketKnopf(id, 'link')).join('')}` : ''}
        </div>`;
}

// Kontext und Stand der Schrittliste (logik/onboarding.js); app.js baut den Kontext (obKontext).
const obPos = () => { const { obKontext, ui } = kx; return OB.position(ui.screen, obKontext()); };
const obWeg = () => kx.obKontext().weg;

export const ANALYSE_ZEILEN = ['ob.analyse1', 'ob.analyse2', 'ob.analyse3', 'ob.analyse4'];

// „Schritt x von n“: n hängt am Weg (erster Start, neues Abenteuer, neues Ziel) und an der Wahl (die Tür entfällt in Bereichen
// ohne Ziele mit Zahl).
export function fortschritt() {
  const { T } = kx;
  const { nr, n } = obPos();
  return `<div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${nr}" aria-label="${esc(T('ob.schrittAria', { nr, gesamt: n }))}">${Array.from({ length: n }, (_, i) => `<i class="${i < nr ? 'on' : ''}"></i>`).join('')}</div><span class="schritt">${esc(T('ob.schritt', { nr, gesamt: n }))}</span>`;
}
// Weiterer Held (ui.neu): ab dem zweiten Schritt ein „Abbrechen“ rechts im Kopf (30.10.2026). Auf dem ersten Schritt ist der
// Zurück-Knopf links selbst das Abbrechen.
export function abbrechenKnopf() {
  const { T, ui } = kx;
  return ui.neu ? `<button class="link ob-abbrechen" data-a="abenteuer-abbrechen" aria-label="${esc(T('ob.abbrechenAria'))}">${esc(T('ob.abbrechen'))}</button>` : '';
}
// Kopfzeile eines Schritts. Erster Schritt im ersten Start: kein Zurück. ueber = über einem Bild (hell-btn wie früher in ob1).
export function kopf({ zurueck = true, hell = false, ueber = false } = {}) {
  const { T, ui } = kx;
  const erster = obPos().nr === 1;
  const links = !zurueck || (erster && !ui.neu)
    ? '<span class="icplatz"></span>'
    : `<button class="icbtn ${ueber && !hell ? 'hell-btn' : ''}" data-a="zurueck" aria-label="${esc(T(erster ? 'ob.abbrechen' : 'nav.zurueck'))}">${icon('zurueck')}</button>`;
  return `<div class="ob-kopf ${ueber ? 'ueber' : ''} ${hell ? 'hell' : ''}">${links}${fortschritt()}${erster ? '' : abbrechenKnopf()}</div>`;
}
// Einleitung auf dem ersten Schritt eines Weges: Willkommen (erster Start), „Ein neues Abenteuer“ oder „Ein neues Ziel“.
// Auf späteren Schritten nichts. klein = als Zeile über einer Seite, die selbst eine Überschrift hat.
function einleitungHtml(klein = false) {
  const { T, nameVon } = kx;
  if (obPos().nr !== 1) return '';
  const weg = obWeg();
  const titel = weg === 'erst' ? 'ob.willkommen' : weg === 'kapitel' ? 'ob.kapitelTitel' : 'ob.neuTitel';
  const text = weg === 'erst' ? 'ob.willkommenText' : weg === 'kapitel' ? 'ob.kapitelText' : 'ob.neuText';
  const werte = { held: kapitelHeld() ? nameVon(kapitelHeld()) : '' };
  if (klein) return `<span class="eyebrow">${esc(T(titel))}</span><p class="klein">${esc(T(text, werte))}</p>`;
  return `<h1>${esc(T(titel))}</h1><p class="lead">${esc(T(text, werte))}</p>`;
}
// Bild oben auf dem ersten Schritt (wie früher in ob1).
function bildOben() {
  const { T, img } = kx;
  return obPos().nr === 1 ? `<div class="ob-bild klein">${img('szene', T('ob.appName'), 'szene', 'cover')}<div class="verlauf"></div></div>` : '';
}
const kopfOben = () => kopf({ ueber: obPos().nr === 1 });
const bereichChip = () => { const { ui } = kx; const b = TABELLE.gruppen.find(x => x.id === ui.bereich); return b ? `<span class="chip">${esc(b.name)}</span>` : ''; };
const weiterKnopfHtml = (aktiv, text) => { const { T } = kx; return `<div class="fuss"><button class="cta" data-a="weiter" ${aktiv ? '' : 'disabled'}>${esc(text || T('ob.weiter'))}</button></div>`; };

export const ONBOARDING_SCREENS = {
  // Welt wählen, mit Willkommen (erster Start). Danach läuft einmal das Welten-Intro (app.js weiter).
  obwelt() {
    return `<section class="screen">
      ${bildOben()}
      ${kopfOben()}
      <div class="inhalt">
        ${einleitungHtml()}
        ${stilStartHtml()}
      </div>
      ${weiterKnopfHtml(true)}
    </section>`;
  },

  // Datenfrage auf eigener Seite (erster Start, nur solange sie offen war). Weiter erst nach einer Antwort; die Antwort ist bis
  // dahin änderbar und danach in den Einstellungen.
  obdaten() {
    const { T, einw } = kx;
    const offen = EW.istOffen(einw);
    const wahl = id => { const sel = !offen && einw.stand === id; return `<button class="opt ${sel ? 'sel' : ''}" aria-pressed="${sel}" data-a="daten" data-id="${id}">${sel ? icon('check') : ''}<span>${esc(T(`daten.${id}`))}</span></button>`; };
    return `<section class="screen">
      ${bildOben()}
      ${kopfOben()}
      <div class="inhalt">
        ${einleitungHtml(true)}
        <span class="eyebrow">${esc(T('daten.eyebrow'))}</span>
        ${einw.veraltet ? `<p class="klein">${esc(T('daten.neu'))}</p>` : ''}
        <h1 class="mittel">${esc(T('daten.frage'))}</h1>
        <p class="lead">${esc(T('daten.kurz'))}</p>
        ${einwDetails()}
        <div class="optionen" role="group" aria-label="${esc(T('daten.eyebrow'))}">${wahl('ja')}${wahl('nein')}</div>
        ${offen ? '' : `<p class="klein" role="status">${esc(T(einw.stand === 'ja' ? 'daten.gewaehltJa' : 'daten.gewaehltNein'))}</p>`}
      </div>
      ${weiterKnopfHtml(!offen)}
    </section>`;
  },

  // Lebensbereich. Darunter leise „Mehrere auf einmal“ und (Besitzer, #test) das Startpaket.
  obbereich() {
    const { T, ui } = kx;
    const bereiche = TABELLE.gruppen.filter(b => b.onboarding);
    return `<section class="screen">
      ${bildOben()}
      ${kopfOben()}
      <div class="inhalt">
        ${einleitungHtml()}
        <p class="frage" id="f1">${esc(T('ob.bereichFrage'))}</p>
        <div class="optionen" role="group" aria-labelledby="f1">
          ${bereiche.map(b => bereichBelegt(b.id)
            ? `<button class="opt belegt" disabled>${icon(b.icon)}<span>${esc(b.name)}<small>${esc(T(kapitelHeld() ? 'ob.kapitelAnderer' : 'ob.heldSchonDabei'))}</small></span></button>`
            : `<button class="opt ${ui.bereich === b.id ? 'sel' : ''}" aria-pressed="${ui.bereich === b.id}" data-a="bereich" data-id="${b.id}">${icon(b.icon)}<span>${esc(b.name)}</span></button>`).join('')}
        </div>
        ${nebenwegHtml()}
      </div>
      ${weiterKnopfHtml(!!ui.bereich)}
    </section>`;
  },

  // Tür „Etwas ändern“ oder „Etwas erreichen“ (nach dem Bereich; entfällt, wenn der Bereich keine Ziele mit Zahl hat).
  obtuer() {
    return `<section class="screen">
      ${bildOben()}
      ${kopfOben()}
      <div class="inhalt">
        ${einleitungHtml(true)}
        ${bereichChip()}
        ${tuerHtml()}
      </div>
      ${weiterKnopfHtml(true)}
    </section>`;
  },

  // Mehrere Helden auf einmal (05.11.2026): seit 10.11.2026 für alle, im ersten Start (noch kein Held) und bei ui.neu; sonst
  // zurück zum ersten Schritt. Das Startpaket (ui.mehrfach.paket) bleibt bei Besitzer und Testprofil.
  // Zustand ui.mehrfach = { auswahl: [Vorlagen-IDs], fehler }. Logik: logik/mehrfach.js, Anlegen: mehrfachAnlegen in app.js.
  obmehr() {
    const { SCREENS, T, nameVon, spiel, ui } = kx;
    if (ui.mehrfach && ui.mehrfach.paket && kx.startpaketErlaubt()) return paketAuswahlHtml(); // Startpaket (06.11.2026)
    if (!kx.mehrfachErlaubt() || !ui.mehrfach || ui.mehrfach.paket) { ui.screen = ONBOARDING_MEHRFACH_ZURUECK; return SCREENS[ONBOARDING_MEHRFACH_ZURUECK](); }
    const ang = MF.angebot(TABELLE, spiel);
    const frei = MF.platzFrei(spiel);
    const gew = ui.mehrfach.auswahl;
    return `<section class="screen">
      <div class="ob-kopf"><button class="icbtn" data-a="mehrfach-zurueck" aria-label="${esc(T('nav.zurueck'))}">${icon('zurueck')}</button><span class="schritt"></span>${abbrechenKnopf()}</div>
      <div class="inhalt">
        <span class="eyebrow">${esc(T('mehr.eyebrow'))}</span>
        <h1>${esc(T('mehr.titel'))}</h1>
        <p class="lead">${esc(T('mehr.text'))}</p>
        <p class="klein" role="status">${esc(frei ? T('mehr.platz', { n: gew.length, frei }) : T('mehr.kein'))}</p>
        ${ang.map(g => `<p class="frage" id="mehr-${esc(g.gruppe.id)}">${esc(g.gruppe.name)}</p>
        <div class="optionen" role="group" aria-labelledby="mehr-${esc(g.gruppe.id)}">
          ${g.eintraege.map(e => e.belegt
            ? `<button class="opt belegt" disabled><span>${esc(e.text)}<small>${esc(T('ob.heldDabei', { held: nameVon(e.held) }))}</small></span></button>`
            : `<button class="opt ${gew.includes(e.vorlage) ? 'sel' : ''}" aria-pressed="${gew.includes(e.vorlage)}" data-a="mehrfach-wahl" data-id="${esc(e.vorlage)}">${gew.includes(e.vorlage) ? icon('check') : ''}<span>${esc(e.text)}<small>${esc(T('mehr.unter', { held: nameVon(e.held), ziel: e.ziel }))}</small></span></button>`).join('')}
        </div>`).join('')}
        ${ui.mehrfach.fehler ? `<p class="fehler" role="alert">${esc(ui.mehrfach.fehler)}</p>` : ''}
      </div>
      <div class="fuss"><button class="cta" data-a="mehrfach-anlegen" ${gew.length && gew.length <= frei ? '' : 'disabled'}>${esc(T('mehr.anlegen', { n: gew.length }))}</button></div>
    </section>`;
  },

  ob2() {
    const { T, nameVon, ui } = kx;
    const b = TABELLE.gruppen.find(x => x.id === ui.bereich);
    const probleme = TABELLE.probleme[ui.bereich] || [];
    const anders = ui.problem === '*';
    // Ziel-Quests (31.10.2026): Tür „Etwas erreichen“ wählt hier Ziel und Messwert statt einer Herausforderung
    if (erreichenGewaehlt()) return `<section class="screen">
      ${kopf()}
      <div class="inhalt">${einleitungHtml(true)}${zielWahlHtml()}</div>
      <div class="fuss"><button class="cta" data-a="weiter" ${zielWahlBereit() ? '' : 'disabled'}>${esc(T('ob.weiter'))}</button></div>
    </section>`;
    return `<section class="screen">
      ${kopf()}
      <div class="inhalt">
        ${einleitungHtml(true)}
        <span class="chip">${esc(b ? b.name : '')}</span>
        <h1>${esc(T('ob.problemTitel'))}</h1>
        <p class="lead">${esc(T('ob.problemText'))}</p>
        <div class="optionen" role="group" aria-label="${esc(T('ob.problemAria'))}">
          ${probleme.map(p => problemBelegt(ui.bereich, p.id)
            ? `<button class="opt belegt" disabled><span>${esc(p.text)}<small>${esc(kapitelHeld() ? T('ob.kapitelAnderer') : T('ob.heldDabei', { held: nameVon(K.vorlageFuer(TABELLE, ui.bereich, p.id).held) }))}</small></span></button>`
            : `<button class="opt ${ui.problem === p.id ? 'sel' : ''}" aria-pressed="${ui.problem === p.id}" data-a="problem" data-id="${p.id}"><span>${esc(p.text)}</span></button>`).join('')}
          ${problemBelegt(ui.bereich, '*') ? '' : `<button class="opt leise ${anders ? 'sel' : ''}" aria-pressed="${anders}" data-a="problem" data-id="*"><span>${esc(T('ob.anders'))}</span></button>`}
        </div>
        ${anders ? `<label class="feld"><span>${esc(T('ob.andersFrage'))}</span><input id="freitext" maxlength="${K.ZIEL_MAX}" value="${esc(ui.freitext)}" placeholder="${esc(T('ob.andersBeispiel'))}" autocomplete="off"></label>` : ''}
      </div>
      <div class="fuss"><button class="cta" data-a="weiter" ${ui.problem && (!anders || ui.freitext.trim()) ? '' : 'disabled'}>${esc(T('ob.weiter'))}</button></div>
    </section>`;
  },

  ob3() {
    const { T, ui } = kx;
    const p = (TABELLE.probleme[ui.bereich] || []).find(x => x.id === ui.problem);
    const ziele = p ? p.ziele : [];
    const eigen = ui.problem === '*';
    // Ziel-Quests (31.10.2026): Tür „Etwas erreichen“ wählt hier den Weg (die Gewohnheit, die jede Runde zählt)
    if (erreichenGewaehlt()) return `<section class="screen">
      ${kopf()}
      <div class="inhalt">${wegWahlHtml(problemBelegt)}${ui.problem ? warumFeld() : ''}</div>
      <div class="fuss"><button class="cta" data-a="weiter" ${ui.problem ? '' : 'disabled'}>${esc(T('zq.wegKnopf'))}</button></div>
    </section>`;
    return `<section class="screen">
      ${kopf()}
      <div class="inhalt">
        <h1 class="mittel">${esc(T('ob.zielTitel'))}</h1>
        ${eigen ? `<label class="feld"><span>${esc(T('ob.zielEigen'))}</span><input id="zieltext" maxlength="${K.ZIEL_MAX}" value="${esc(ui.ziel || '')}" placeholder="${esc(T('ob.zielBeispiel'))}" autocomplete="off"></label>`
          : `<div class="optionen" role="group" aria-label="${esc(T('ob.zielAria'))}">${ziele.map(z => `<button class="opt ${ui.ziel === z ? 'sel' : ''}" aria-pressed="${ui.ziel === z}" data-a="ziel" data-id="${esc(z)}">${ui.ziel === z ? icon('check') : ''}<span>${esc(z)}</span></button>`).join('')}</div>`}
        ${ui.ziel && ui.ziel.trim() ? warumFeld() : ''}
        <div class="notiz">${icon('buch')}<p>${esc(T('ob.zielNotiz'))}</p></div>
      </div>
      <div class="fuss"><button class="cta" data-a="weiter" ${ui.ziel && ui.ziel.trim() ? '' : 'disabled'}>${esc(T('ob.zielKnopf'))}</button></div>
    </section>`;
  },

  ob4() {
    const { T, ui } = kx;
    const zeilen = ANALYSE_ZEILEN.map(k => esc(T(k)));
    const fertig = ui.analyseSchritt >= zeilen.length;
    return `<section class="screen analyse">
      ${kopf({ zurueck: false })}
      <div class="inhalt mitte">
        <div class="ring ${fertig ? 'still' : ''}" aria-hidden="true"><svg viewBox="0 0 190 190"><circle cx="95" cy="95" r="88" class="r1"/><circle cx="95" cy="95" r="74" class="r2"/></svg><span>${icon('kompass', 'ic gross')}</span></div>
        <h1>${esc(T('ob.analyseTitel'))}</h1>
        <ul class="analyse-liste" role="status" aria-live="polite">
          ${zeilen.map((z, i) => `<li class="${i < ui.analyseSchritt ? 'ok' : i === ui.analyseSchritt ? 'jetzt' : ''}"><span class="dot">${i < ui.analyseSchritt ? icon('check') : ''}</span>${z}</li>`).join('')}
        </ul>
      </div>
      <div class="fuss">${fertig ? `<button class="cta" data-a="weiter">${esc(T('ob.weiter'))}</button>` : `<button class="link" data-a="weiter">${esc(T('ob.ueberspringen'))}</button>`}</div>
    </section>`;
  },

  ob5() {
    const { T, aktuelleVorlage, img, nameVon, ui, wort } = kx;
    const v = aktuelleVorlage();
    const vb = TABELLE.helden[v.held];
    return `<section class="screen">
      <div class="ob-bild gross">${img(v.held, vb.name, 'held', 'cover', `${nameVon(v.held)}, ${vb.rolle}`)}<div class="verlauf dunkel-oben"></div></div>
      ${kopf({ hell: true, ueber: true })}
      <div class="inhalt hoch">
        <span class="chip gut">${esc(T('ob.deinVerbuendeter', { VERBUENDETER: wort('verbuendeter').toUpperCase() }))}</span>
        <div><h1 class="name">${esc(nameVon(v.held))}</h1><p class="rolle">${esc(vb.rolle)}</p></div>
        <p class="lead">${esc(T('ob.hilft', { held: nameVon(v.held) }))}</p>
        <ul class="haken">${vb.hilft.map(h => `<li>${icon('check')}${esc(h)}</li>`).join('')}</ul>
        <p class="stark">${esc(T(ui.neu ? 'ob.begleitetNeu' : 'ob.begleitetErst', { held: nameVon(v.held) }))}</p>
      </div>
      <div class="fuss"><button class="cta" data-a="weiter">${esc(T('ob.weiter'))}</button></div>
    </section>`;
  },

  ob6() {
    const { T, aktuelleVorlage, img, ui } = kx;
    const v = aktuelleVorlage();
    const g = TABELLE.gegner[v.gegner];
    // Aura (05.11.2026): einmal, wenn der erste Gegner hier vorgestellt wird; Zurück und wieder Weiter spielt sie nicht erneut
    if (!ui.obAura || ui.obAura.gegner !== v.gegner) ui.obAura = { gegner: v.gegner };
    return `<section class="screen dunkel">
      ${kopf({ hell: true })}
      <div class="inhalt">
        <span class="chip schlecht">${esc(T('ob.hindernis'))}</span>
        <div class="boss-bild auftritt">${img('boss-' + v.gegner, g.name, 'boss', 'cover', g.name, 'auftritt')}${auraHtml(v.gegner, ui.obAura)}</div>
        <h1 class="name">${esc(g.name)}</h1>
        <div class="kraft"><span>${esc(T('ob.kraft'))}</span><div class="balken boss"><i style="width:100%"></i></div></div>
        <p class="lead">${esc(g.text)}</p>
        <div class="zwei">
          <div class="box schlecht"><b>${esc(T('gegner.wirdStaerker'))}</b>${esc(g.staerker)}</div>
          <div class="box gut"><b>${esc(T('gegner.verliertKraft'))}</b>${esc(g.schwaecher)}</div>
        </div>
      </div>
      <div class="fuss"><button class="cta rot" data-a="weiter">${esc(T('ob.wieBesiegen', { ihn: /^Die /.test(g.name) ? 'sie' : /^Das /.test(g.name) ? 'es' : 'ihn' }))}</button></div>
    </section>`;
  },

  ob7() {
    const { T, aktuelleVorlage, img, wort } = kx;
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    return `<section class="screen">
      ${kopf()}
      <div class="inhalt">
        <p class="eyebrow mitte-text">${esc(T('ob.faehigkeitFrei', { FAEHIGKEIT: wort('faehigkeit').toUpperCase() }))}</p>
        <div class="karte faehigkeit erscheint">
          <span class="medaille">${icon(f.icon, 'ic gross')}</span>
          <h1 class="name">${esc(f.name)}</h1>
          <p class="wenn">${esc(f.wenn)}</p>
          <ul class="haken">${f.schritte.map(s => `<li>${icon('check')}${esc(s)}</li>`).join('')}</ul>
        </div>
        <div class="gegen">${img('boss-' + v.gegner, g.name, 'boss', 'rund')}<span>${esc(T('faehigkeit.wirksam', { gegner: akkusativ(g.name) }))}</span></div>
      </div>
      <div class="fuss"><button class="cta" data-a="weiter">${esc(T('ob.weiter'))}</button></div>
    </section>`;
  },

  // Version 146 (Bewertung 05.11.2026, Punkt 11): Auslöser-Hinweis beim ersten Helden. Ohne Push-Nachrichten braucht der
  // tägliche Besuch einen festen Anker im Alltag (Gewohnheit an eine bestehende Routine koppeln). Nur Text, nichts gespeichert.
  ob8() {
    const { T, aktuelleVorlage, img, nameVon, ui, wort } = kx;
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    // Einstiegsrampe (30.10.2026): die erste Woche zeigt das Ziel des ersten Gegners; das eigene Ziel kommt schrittweise
    // Beständigkeit (04.11.2026): Art, Grenzen und Rampe der Vorlage (z. B. Wutwald 3 · 4 · 5 · 6 von 7)
    const probe = K.questAnlegen(K.neuerStand('probe'), v, '', new Date(), RAMPE).quest;
    const ziel = probe.anzahl;
    const n = K.rundenZiel(probe, 0, 1);
    const bst = hauptArtId(probe) === 'bestaendigkeit';
    return `<section class="screen">
      <div class="ob-bild mittel">${img('banner-' + v.held, T('ob.questBild'), 'szene', 'cover')}<div class="verlauf dunkel-oben"></div></div>
      ${kopf({ hell: true, ueber: true })}
      <div class="inhalt hoch">
        <div class="karte quest">
          <span class="eyebrow">${esc(wort('woche').toUpperCase())}</span>
          <h1 class="mittel">${esc(bst ? T('bst.obQuest', { n }) : T(n === 1 ? 'ob.questEinmal' : 'ob.questMehr', { faehigkeit: f.name, n }))}</h1>
          ${bst ? `<p class="klein mitte-text">${esc(T('bst.obText', { faehigkeit: f.name }))}</p>` : ''}
          <div class="siegel-reihe" aria-label="${esc(T('ob.siegelAria', { n }))}">${Array.from({ length: n }, (_, i) => `<span class="siegel">${i + 1}</span>`).join('')}</div>
          <p class="klein mitte-text">${esc(T(bst ? 'bst.obStand' : 'ob.siegelStand', { n }))}</p>
          ${ziel > n ? `<p class="klein mitte-text">${esc(T(bst ? 'bst.obRampe' : 'ob.rampe', { ziel }))}</p>` : ''}
          ${zielVorschauHtml()}
        </div>
        <p class="eyebrow">${esc(T('ob.belohnung'))}</p>
        <ul class="belohnung">
          <li><span class="rund-ic gut">${icon('pfeil')}</span>${esc(T('ob.belohnungZiel'))}</li>
          <li>${img('boss-' + v.gegner, g.name, 'boss', 'rund')}${esc(T('ob.belohnungGegner', { gegner: akkusativ(g.name) }))}</li>
          <li>${img(v.held, nameVon(v.held), 'held', 'rund')}${esc(T('ob.belohnungHeld', { held: nameVon(v.held) }))}</li>
        </ul>
        ${ui.neu ? '' : `<div class="notiz ob-ausloeser">${icon('sonne')}<p><b>${esc(T('ob.ausloeserTitel'))}</b> ${esc(T('ob.ausloeserText'))}</p></div>`}
      </div>
      <div class="fuss"><button class="cta" data-a="beginnen">${esc(T('ob.beginnen'))}</button></div>
    </section>`;
  }
};
// Warum-Feld (Version 75): freiwillig, erscheint erst, wenn ein Ziel gewählt ist (eine Entscheidung nach der anderen).
// Psychologie: Ein selbst formulierter Grund stärkt die eigene Motivation; Pflicht würde ihn zur Hürde machen.
export function warumFeld() {
  const { T, ui } = kx;
  return `<label class="feld"><span>${esc(T('ob.warumFrage'))}</span><textarea id="warumtext" rows="2" maxlength="${K.WARUM_MAX}" placeholder="${esc(T('ob.warumBeispiel'))}">${esc(ui.warum || '')}</textarea></label>
        <p class="klein">${esc(T('ob.warumHilfe'))}</p>`;
}
// Bereiche/Probleme, deren Held schon in der Crew ist, sind im Onboarding für weitere Helden gesperrt.
// Neues Ziel für einen vorhandenen Helden (Version 171, ui.kapitelFuer): nur Auswahl, die zu diesem Helden gehört, ist frei;
// alles andere ist gesperrt. Sonst („Neues Abenteuer“): gesperrt ist, wer schon in der Crew ist.
export const kapitelHeld = () => { const { ui } = kx; return ui.neu && ui.kapitelFuer ? ui.kapitelFuer : null; };
export const heldBelegt = vorlage => { const { spiel, ui } = kx; const kh = kapitelHeld(); return !!vorlage && ui.neu && (kh ? vorlage.held !== kh : !!H.heldVon(spiel, vorlage.held)); };
export const problemBelegt = (bereich, problem) => heldBelegt(K.vorlageFuer(TABELLE, bereich, problem));
export const bereichBelegt = b => [...(TABELLE.probleme[b] || []).map(p => p.id), '*'].every(p => problemBelegt(b, p));

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const ONBOARDING_KLICKS = {
  // Stilfrage am Start (Version 163): setzt nur den aktiven Stil (kern.stilStartWaehlen), speichert und zeichnet neu.
  'ob-stil'({ id }) {
    const { render, setzeHinweis, setzeStand, speichere, stand, ui } = kx;
    if (ui.neu) return;
    try { setzeStand(K.stilStartWaehlen(stand, id, STIL_REIHENFOLGE, STIL_WAEHLBAR)); }
    catch (err) { setzeHinweis(err.message); render(); return; }
    speichere();
    trackEvent('style_selected', { stil: kx.stand.stil.aktiv, start: true }); // neu lesen: setzeStand hat den Stand ersetzt
    render();
  },
  bereich({ id }) { const { render, ui } = kx; Object.assign(ui, { bereich: id, problem: null, ziel: null, freitext: '', warum: '', zq: null }); render(); },
  problem({ id }) {
    const { finde, render, ui } = kx;
    ui.problem = id; ui.ziel = null;
    render();
    if (id === '*') finde('#freitext')?.focus();
  },
  ziel({ id }) { const { render, ui } = kx; ui.ziel = id; render(); },
  weiter() { const { weiter } = kx; weiter(); },
  zurueck() { const { zurueck } = kx; zurueck(); },
  beginnen() { const { beginnen } = kx; beginnen(); },
  'neues-abenteuer'({ id } = {}) {
    const { geheZu, spiel, ui } = kx;
    Object.assign(ui, { heldenWahl: false, blatt: null, neu: true, kapitelFuer: null, bereich: null, problem: null, ziel: null, freitext: '', warum: '', zielart: 'aendern', zq: null, obStart: Date.now() });
    // Version 183: Herkunft als feste ID (tagesleiste, heldenwahl), damit die Auswertung sieht, ob das „+“ genutzt wird
    trackEvent('new_adventure_started', { helden: spiel.helden.length, ...(/^[a-z]{1,30}$/.test(id || '') ? { abschnitt: id } : {}) });
    geheZu(kx.obAnfang());
  },
  // Mehrere Helden auf einmal (05.11.2026, seit 10.11.2026 für alle)
  'mehrfach-oeffnen'() {
    const { einw, geheZu, ui } = kx;
    if (!kx.mehrfachErlaubt() || kapitelHeld()) { console.warn('Mehrere Helden: hier nicht möglich'); return; }
    if (!ui.neu && EW.istOffen(einw)) { console.warn('Mehrere Helden: erst die Datenfrage beantworten'); return; }
    ui.mehrfach = { auswahl: [], fehler: null };
    trackEvent('multi_heroes_opened', {});
    geheZu('obmehr');
  },
  'mehrfach-wahl'({ id }) {
    const { render, spiel, ui } = kx;
    if (!ui.mehrfach) return;
    ui.mehrfach.auswahl = ui.mehrfach.paket
      ? SP.paketUmschalten(ui.mehrfach.auswahl, id, SP.paketHelden(ui.mehrfach.paket, spiel, TABELLE))
      : MF.umschalten(ui.mehrfach.auswahl, id, MF.angebot(TABELLE, spiel));
    ui.mehrfach.fehler = null;
    render();
  },
  'mehrfach-zurueck'() { const { geheZu, ui } = kx; const ziel = (ui.mehrfach && ui.mehrfach.zurueck) || ONBOARDING_MEHRFACH_ZURUECK; ui.mehrfach = null; geheZu(ziel === 'obmehr' ? ONBOARDING_MEHRFACH_ZURUECK : ziel); },
  'mehrfach-anlegen'() { const { mehrfachAnlegen } = kx; mehrfachAnlegen(); },
  // Weiteres Abenteuer jederzeit abbrechen: nichts ist gespeichert (merkeAuswahl speichert bei ui.neu nicht),
  // Auswahl zurück auf den Stand des Spielstands, Analyse-Zeitgeber stoppen.
  'abenteuer-abbrechen'() {
    const { geheZu, stand, stoppeAnalyse, ui } = kx;
    if (!ui.neu) return;
    stoppeAnalyse();
    trackEvent('new_adventure_cancelled', { schritt: ui.screen });
    Object.assign(ui, { mehrfach: null, neu: false, kapitelFuer: null, bereich: stand.onboarding.bereich, problem: stand.onboarding.problem, ziel: stand.onboarding.ziel, freitext: stand.onboarding.freitext || '', warum: '', zielart: 'aendern', zq: null });
    geheZu('start');
  }
};
// Felder (Feld-Eingaben aufteilen, 30.10.2026): Freitext und eigenes Ziel. Länge wie beim Quest-Ziel (K.ZIEL_MAX).
// Weiter-Knopf direkt freischalten, ohne neu zu zeichnen (Fokus bleibt im Feld).
function weiterKnopf(aktiv) { const { finde } = kx; const btn = finde('.fuss .cta'); if (btn) btn.disabled = !aktiv; }
export const ONBOARDING_FELDER = {
  freitext: {
    input({ wert }) {
      const { ui } = kx;
      ui.freitext = String(wert ?? '').slice(0, K.ZIEL_MAX);
      if (!ui.ziel || ui.ziel === ui.letzterFreitext) ui.ziel = ui.freitext; // als Ziel vorgeschlagen, bleibt änderbar
      ui.letzterFreitext = ui.freitext;
      weiterKnopf(ui.freitext.trim());
    }
  },
  zieltext: { input({ wert }) { const { ui } = kx; ui.ziel = String(wert ?? '').slice(0, K.ZIEL_MAX); weiterKnopf(ui.ziel.trim()); } },
  // Warum (Version 75): nur merken; bereinigt wird beim Anlegen der Quest (K.bereinigeWarum)
  warumtext: { input({ wert }) { const { ui } = kx; ui.warum = String(wert ?? '').slice(0, K.WARUM_MAX); } }
};
