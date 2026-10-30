// Onboarding (aus app.js ausgelagert, 30.10.2026): acht Schritte vom Lebensbereich bis zur ersten Quest,
// auch für weitere Helden („Ein neues Abenteuer“, ui.neu). Reihenfolge der Schritte: REIHE in app.js.
import { trackEvent } from '../analytics.js';
import { RAMPE } from '../daten/rampe.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as EW from '../logik/einwilligung.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import { einwKarte } from './einstellungen.js';
import { akkusativ, esc, icon } from './helfer.js';
import { kx } from './kontext.js';

// Schritte der Fortschrittsanzeige und Zeilen der Analyse (ob4). Die Analyse zählt in app.js bis ANALYSE_ZEILEN.length.
export const OB_SCHRITTE = 8;
export const ANALYSE_ZEILEN = ['ob.analyse1', 'ob.analyse2', 'ob.analyse3', 'ob.analyse4'];

export function fortschritt(nr) {
  const { T } = kx;
  const n = OB_SCHRITTE;
  return `<div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${nr}" aria-label="${esc(T('ob.schrittAria', { nr, gesamt: n }))}">${Array.from({ length: n }, (_, i) => `<i class="${i < nr ? 'on' : ''}"></i>`).join('')}</div><span class="schritt">${esc(T('ob.schritt', { nr, gesamt: n }))}</span>`;
}
// Weiterer Held (ui.neu): auf jedem Schritt ab 2 ein „Abbrechen“ rechts im Kopf (30.10.2026). Vorher ging es nur über
// „Zurück“ bis Schritt 1; ab der Analyse (Schritt 4) gab es gar keinen Weg zurück. Schritt 1 hat schon „Abbrechen“ links.
export function abbrechenKnopf() {
  const { T, ui } = kx;
  return ui.neu ? `<button class="link ob-abbrechen" data-a="abenteuer-abbrechen" aria-label="${esc(T('ob.abbrechenAria'))}">${esc(T('ob.abbrechen'))}</button>` : '';
}
export function kopf(nr, zurueck = true, hell = false) {
  const { T } = kx;
  return `<div class="ob-kopf ${hell ? 'hell' : ''}">${zurueck ? `<button class="icbtn" data-a="zurueck" aria-label="${esc(T('nav.zurueck'))}">${icon('zurueck')}</button>` : '<span class="icplatz"></span>'}${fortschritt(nr)}${abbrechenKnopf()}</div>`;
}
export const ONBOARDING_SCREENS = {
  ob1() {
    const { T, einw, img, ui } = kx;
    const bereiche = TABELLE.gruppen.filter(b => b.onboarding);
    return `<section class="screen">
      <div class="ob-bild klein">${img('szene', T('ob.appName'), 'szene', 'cover')}<div class="verlauf"></div></div>
      <div class="ob-kopf ueber">${ui.neu ? `<button class="icbtn hell-btn" data-a="zurueck" aria-label="${esc(T('ob.abbrechen'))}">${icon('zurueck')}</button>` : '<span class="icplatz"></span>'}${fortschritt(1)}</div>
      <div class="inhalt">
        ${ui.neu ? `<h1>${esc(T('ob.neuTitel'))}</h1>
        <p class="lead">${esc(T('ob.neuText'))}</p>`
        : `<h1>${esc(T('ob.willkommen'))}</h1>
        <p class="lead">${esc(T('ob.willkommenText'))}</p>`}
        <p class="frage" id="f1">${esc(T('ob.bereichFrage'))}</p>
        <div class="optionen" role="group" aria-labelledby="f1">
          ${bereiche.map(b => bereichBelegt(b.id)
            ? `<button class="opt belegt" disabled>${icon(b.icon)}<span>${esc(b.name)}<small>${esc(T('ob.heldSchonDabei'))}</small></span></button>`
            : `<button class="opt ${ui.bereich === b.id ? 'sel' : ''}" aria-pressed="${ui.bereich === b.id}" data-a="bereich" data-id="${b.id}">${icon(b.icon)}<span>${esc(b.name)}</span></button>`).join('')}
        </div>
        ${ui.neu ? '' : einwKarte(true)}
      </div>
      <div class="fuss"><button class="cta" data-a="weiter" ${ui.bereich && (ui.neu || !EW.istOffen(einw)) ? '' : 'disabled'}>${esc(T('ob.weiter'))}</button></div>
    </section>`;
  },

  ob2() {
    const { T, nameVon, ui } = kx;
    const b = TABELLE.gruppen.find(x => x.id === ui.bereich);
    const probleme = TABELLE.probleme[ui.bereich] || [];
    const anders = ui.problem === '*';
    return `<section class="screen">
      ${kopf(2)}
      <div class="inhalt">
        <span class="chip">${esc(b ? b.name : '')}</span>
        <h1>${esc(T('ob.problemTitel'))}</h1>
        <p class="lead">${esc(T('ob.problemText'))}</p>
        <div class="optionen" role="group" aria-label="${esc(T('ob.problemAria'))}">
          ${probleme.map(p => problemBelegt(ui.bereich, p.id)
            ? `<button class="opt belegt" disabled><span>${esc(p.text)}<small>${esc(T('ob.heldDabei', { held: nameVon(K.vorlageFuer(TABELLE, ui.bereich, p.id).held) }))}</small></span></button>`
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
    return `<section class="screen">
      ${kopf(3)}
      <div class="inhalt">
        <h1 class="mittel">${esc(T('ob.zielTitel'))}</h1>
        ${eigen ? `<label class="feld"><span>${esc(T('ob.zielEigen'))}</span><input id="zieltext" maxlength="${K.ZIEL_MAX}" value="${esc(ui.ziel || '')}" placeholder="${esc(T('ob.zielBeispiel'))}" autocomplete="off"></label>`
          : `<div class="optionen" role="group" aria-label="${esc(T('ob.zielAria'))}">${ziele.map(z => `<button class="opt ${ui.ziel === z ? 'sel' : ''}" aria-pressed="${ui.ziel === z}" data-a="ziel" data-id="${esc(z)}">${ui.ziel === z ? icon('check') : ''}<span>${esc(z)}</span></button>`).join('')}</div>`}
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
      <div class="ob-kopf"><span class="icplatz"></span>${fortschritt(4)}${abbrechenKnopf()}</div>
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
      ${kopf(5, true, true).replace('ob-kopf', 'ob-kopf ueber')}
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
    const { T, aktuelleVorlage, img } = kx;
    const v = aktuelleVorlage();
    const g = TABELLE.gegner[v.gegner];
    return `<section class="screen dunkel">
      ${kopf(6, true, true)}
      <div class="inhalt">
        <span class="chip schlecht">${esc(T('ob.hindernis'))}</span>
        <div class="boss-bild">${img('boss-' + v.gegner, g.name, 'boss', 'cover', g.name)}</div>
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
      ${kopf(7)}
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

  ob8() {
    const { T, aktuelleVorlage, img, nameVon, wort } = kx;
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    // Einstiegsrampe (30.10.2026): die erste Woche zeigt das Ziel des ersten Gegners; das eigene Ziel kommt schrittweise
    const ziel = v.quest.anzahl;
    const n = K.rundenZiel({ anzahl: ziel, rampe: RAMPE }, 0);
    return `<section class="screen">
      <div class="ob-bild mittel">${img('banner-' + v.held, T('ob.questBild'), 'szene', 'cover')}<div class="verlauf dunkel-oben"></div></div>
      ${kopf(8, true, true).replace('ob-kopf', 'ob-kopf ueber')}
      <div class="inhalt hoch">
        <div class="karte quest">
          <span class="eyebrow">${esc(wort('woche').toUpperCase())}</span>
          <h1 class="mittel">${esc(T(n === 1 ? 'ob.questEinmal' : 'ob.questMehr', { faehigkeit: f.name, n }))}</h1>
          <div class="siegel-reihe" aria-label="${esc(T('ob.siegelAria', { n }))}">${Array.from({ length: n }, (_, i) => `<span class="siegel">${i + 1}</span>`).join('')}</div>
          <p class="klein mitte-text">${esc(T('ob.siegelStand', { n }))}</p>
          ${ziel > n ? `<p class="klein mitte-text">${esc(T('ob.rampe', { ziel }))}</p>` : ''}
        </div>
        <p class="eyebrow">${esc(T('ob.belohnung'))}</p>
        <ul class="belohnung">
          <li><span class="rund-ic gut">${icon('pfeil')}</span>${esc(T('ob.belohnungZiel'))}</li>
          <li>${img('boss-' + v.gegner, g.name, 'boss', 'rund')}${esc(T('ob.belohnungGegner', { gegner: akkusativ(g.name) }))}</li>
          <li>${img(v.held, nameVon(v.held), 'held', 'rund')}${esc(T('ob.belohnungHeld', { held: nameVon(v.held) }))}</li>
        </ul>
      </div>
      <div class="fuss"><button class="cta" data-a="beginnen">${esc(T('ob.beginnen'))}</button></div>
    </section>`;
  }
};
// Bereiche/Probleme, deren Held schon in der Crew ist, sind im Onboarding für weitere Helden gesperrt.
export const heldBelegt = vorlage => { const { spiel, ui } = kx; return !!vorlage && ui.neu && !!H.heldVon(spiel, vorlage.held); };
export const problemBelegt = (bereich, problem) => heldBelegt(K.vorlageFuer(TABELLE, bereich, problem));
export const bereichBelegt = b => [...(TABELLE.probleme[b] || []).map(p => p.id), '*'].every(p => problemBelegt(b, p));

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const ONBOARDING_KLICKS = {
  bereich({ id }) { const { render, ui } = kx; Object.assign(ui, { bereich: id, problem: null, ziel: null, freitext: '' }); render(); },
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
  'neues-abenteuer'() {
    const { geheZu, spiel, ui } = kx;
    Object.assign(ui, { neu: true, bereich: null, problem: null, ziel: null, freitext: '', obStart: Date.now() });
    trackEvent('new_adventure_started', { helden: spiel.helden.length });
    geheZu('ob1');
  },
  // Weiteres Abenteuer jederzeit abbrechen: nichts ist gespeichert (merkeAuswahl speichert bei ui.neu nicht),
  // Auswahl zurück auf den Stand des Spielstands, Analyse-Zeitgeber stoppen.
  'abenteuer-abbrechen'() {
    const { geheZu, stand, stoppeAnalyse, ui } = kx;
    if (!ui.neu) return;
    stoppeAnalyse();
    trackEvent('new_adventure_cancelled', { schritt: ui.screen });
    Object.assign(ui, { neu: false, bereich: stand.onboarding.bereich, problem: stand.onboarding.problem, ziel: stand.onboarding.ziel, freitext: stand.onboarding.freitext || '' });
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
  zieltext: { input({ wert }) { const { ui } = kx; ui.ziel = String(wert ?? '').slice(0, K.ZIEL_MAX); weiterKnopf(ui.ziel.trim()); } }
};
