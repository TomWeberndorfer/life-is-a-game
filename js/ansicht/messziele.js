// Messziele (Version 76): Blatt von unten (gezeichnet auf oberster Ebene in app.js) und Karte auf der Startseite.
// Daten und Grenzen: daten/messziele.js, Logik: logik/messziele.js.
// Zustand: ui.messziel = { heroId, modus: 'liste'|'form'|'messen', zielId, form, wert, fehler, frage, erreicht }
//   form     Feldtexte des Formulars { name, einheit, richtung, ziel, start, bis } (Strings wie getippt)
//   fehler   je Feld (Formular) bzw. { wert } / { allgemein }
//   frage    'loeschen' = Löschen wartet auf die zweite Bestätigung
//   erreicht ID des Ziels, das gerade zum ersten Mal erreicht wurde (Erfolgsmoment in der Liste)
// Geöffnet über die Karte auf der Startseite oder das Heldenblatt („Messziele“). Ruhige Sprache, kein Rot (Entscheidung 17).
import { trackEvent } from '../analytics.js';
import { EINHEIT_VORSCHLAEGE, MESSZIEL_OPT, MESSZIEL_RICHTUNGEN, VERLAUF } from '../daten/messziele.js';
import * as K from '../logik/kern.js';
import * as MZ from '../logik/messziele.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

const heute = () => { const { jetzt } = kx; return K.tagKey(jetzt()); };
const leeresForm = () => ({ name: '', einheit: '', richtung: 'hoch', ziel: '', start: '', bis: '' });
const datum = t => (MZ.tagOk(t) ? K.ausTagKey(t).toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric', year: 'numeric' }) : '');
const mitEinheit = (x, e) => `${MZ.zahlText(x)}${e ? ' ' + e : ''}`;

// Zielzeile: „mindestens 38 cm“ / „höchstens 78 cm“, mit Stichtag.
function zielText(z) {
  const { T } = kx;
  const basis = T('messziel.richtung.' + z.richtung + 'Wert', { wert: mitEinheit(z.ziel, z.einheit) });
  return z.bis ? `${basis} · ${T('messziel.bis', { datum: datum(z.bis) })}` : basis;
}
// Standzeile, neutral (Entscheidung 17): Abstand statt Bewertung.
function standText(z, f) {
  const { T } = kx;
  if (f.aktuell === null && f.start === null) return T('messziel.nochKeine');
  if (f.erreichtJetzt) return T('messziel.erreichtJetzt');
  return T('messziel.noch', { abstand: mitEinheit(f.abstand, z.einheit) });
}
const balken = f => (f.anteil === null ? '' : `<span class="balken messziel-balken" aria-hidden="true"><i style="width:${Math.round(100 * f.anteil)}%"></i></span>`);

// ---------- Startseite ----------
// Nur, wenn der Held im Fokus Messziele hat. Tipp öffnet das Blatt.
export function messzielKarte() {
  const { T, spiel } = kx;
  const liste = MZ.messzieleVon(spiel, spiel.fokus);
  if (!liste.length) return '';
  const h = heute();
  const zeilen = liste.map(z => {
    const f = MZ.fortschritt(z, h);
    return `<span class="messziel-zeile"><span class="messziel-kopf"><span class="nm">${esc(z.name)}</span><span class="klein">${esc(standText(z, f))}</span></span>${balken(f)}</span>`;
  }).join('');
  const faellig = liste.some(z => MZ.fortschritt(z, h).messenFaellig);
  return `<button class="karte spalte messziel-karte tippbar" data-a="messziel-oeffnen">
    <span class="eyebrow">${esc(T('messziel.eyebrow'))}</span>${zeilen}
    ${faellig ? `<span class="klein messziel-einladung">${icon('kalender')}${esc(T('messziel.einladung'))}</span>` : ''}
  </button>`;
}
// Kurzzeile, wenn die Karte eingeklappt ist (START_KURZ.messziele).
export function messzielKurz() {
  const { T, spiel } = kx;
  const liste = MZ.messzieleVon(spiel, spiel.fokus);
  const h = heute();
  const teile = liste.slice(0, 2).map(z => `${z.name}: ${standText(z, MZ.fortschritt(z, h))}`);
  return `<span class="eyebrow">${esc(T('messziel.eyebrow'))}</span><span class="klein">${esc(teile.join(' · ') + (liste.length > 2 ? ' …' : ''))}</span>`;
}
// Knopf im Heldenblatt (ansicht/blatt.js).
export function messzielKnopf() {
  const { T, spiel } = kx;
  const n = MZ.messzieleVon(spiel, spiel.fokus).length;
  return `<button class="btn voll" data-a="messziel-oeffnen">${icon('pfeil')} ${esc(T(n ? 'messziel.knopfMit' : 'messziel.knopfNeu', { n }))}</button>`;
}

// Charakterbogen (Etappe 3, Teil E): je Messziel eine Skala Start → Ziel mit Marke beim Stand. Fortschritt läuft immer
// nach rechts, auch bei „höchstens“ (fortschritt().anteil); über das Ziel hinaus bleibt die Marke am Ende, der Text sagt
// „Ziel erreicht“. Ohne Messung und ohne Startwert: nur die Zeile „Noch keine Messung“. Wirft nie.
export function messzielSkalaHtml(z) {
  const { T } = kx;
  let f;
  try { f = MZ.fortschritt(z, heute()); } catch (e) { console.warn('Messziel-Skala:', e.message); return ''; }
  const kopf = `<span class="bogen-mz-kopf"><span class="nm">${esc(z.name)}</span><span class="klein">${esc(standText(z, f))}</span></span>`;
  if (f.anteil === null) return `<div class="bogen-mz">${kopf}</div>`;
  const pct = Math.round(100 * f.anteil);
  const stand = f.aktuell !== null ? f.aktuell : f.start;
  const aria = T('bogen.mzAria', { start: mitEinheit(f.start, z.einheit), stand: mitEinheit(stand, z.einheit), ziel: mitEinheit(z.ziel, z.einheit) });
  return `<div class="bogen-mz${f.erreichtJetzt ? ' erreicht' : ''}">${kopf}
    <span class="mz-skala" role="img" aria-label="${esc(aria)}"><i style="width:${pct}%"></i><b class="mz-marke" style="left:${pct}%"></b></span>
    <span class="mz-enden klein" aria-hidden="true"><span>${esc(T('bogen.mzStart', { wert: mitEinheit(f.start, z.einheit) }))}</span><span class="mz-stand">${esc(T('bogen.mzStand', { wert: mitEinheit(stand, z.einheit) }))}</span><span>${esc(T('bogen.mzZiel', { wert: mitEinheit(z.ziel, z.einheit) }))}</span></span>
  </div>`;
}
// Alle Messziele eines Helden als Abschnitt des Charakterbogens (leer, wenn keine).
export function messzielBogenHtml(heroId) {
  const { T, spiel } = kx;
  const liste = MZ.messzieleVon(spiel, heroId);
  if (!liste.length) return '';
  return `<section class="bogen-abschnitt"><span class="eyebrow">${esc(T('bogen.messziele'))}</span>${liste.map(messzielSkalaHtml).join('')}</section>`;
}

// ---------- Blatt ----------
function verlaufHtml(z) {
  const { T } = kx;
  const v = MZ.verlaufPunkte(z, VERLAUF);
  if (!v) return '';
  const pfad = v.punkte.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const aria = T('messziel.verlaufAria', { n: v.punkte.length, ziel: mitEinheit(z.ziel, z.einheit) });
  return `<svg class="messziel-verlauf" viewBox="0 0 ${v.breite} ${v.hoehe}" role="img" aria-label="${esc(aria)}">
    <line class="ziel-linie" x1="0" x2="${v.breite}" y1="${v.zielY}" y2="${v.zielY}"/>
    <text class="ziel-text" x="${v.breite - 2}" y="${v.zielY < 16 ? v.zielY + 13 : v.zielY - 5}" text-anchor="end">${esc(T('messziel.zielMarke', { wert: mitEinheit(z.ziel, z.einheit) }))}</text>
    ${v.punkte.length > 1 ? `<path class="linie" d="${pfad}"/>` : ''}
    ${v.punkte.map(p => `<circle class="punkt" cx="${p.x}" cy="${p.y}" r="3.5"><title>${esc(datum(p.tag))}: ${esc(mitEinheit(p.wert, z.einheit))}</title></circle>`).join('')}
  </svg>`;
}

function zielKarteHtml(z, m) {
  const { T } = kx;
  const f = MZ.fortschritt(z, heute());
  const werte = [f.start !== null ? T('messziel.start', { wert: mitEinheit(f.start, z.einheit) }) : '', f.aktuell !== null ? T('messziel.jetzt', { wert: mitEinheit(f.aktuell, z.einheit), datum: datum(f.letzteTag) }) : ''].filter(Boolean).join(' · ');
  return `<div class="messziel-eintrag">
    <span class="nm">${esc(z.name)}</span>
    <span class="klein">${esc(zielText(z))}</span>
    ${m.erreicht === z.id ? `<div class="notiz messziel-geschafft" role="status">${icon('stern')}<p>${esc(T('messziel.geschafft', { name: z.name }))}</p></div>` : ''}
    ${werte ? `<span class="klein">${esc(werte)}</span>` : ''}
    <span class="klein messziel-stand">${esc(standText(z, f))}</span>
    ${balken(f)}
    ${verlaufHtml(z)}
    <div class="zwei"><button class="btn ja" data-a="messziel-messen" data-id="${esc(z.id)}">${esc(T('messziel.messen'))}</button><button class="btn" data-a="messziel-bearbeiten" data-id="${esc(z.id)}">${esc(T('messziel.bearbeiten'))}</button></div>
  </div>`;
}

function listeHtml(m) {
  const { T, nameVon, spiel } = kx;
  const liste = MZ.messzieleVon(spiel, m.heroId);
  return `<span class="eyebrow">${esc(nameVon(m.heroId).toUpperCase())}</span>
    <h2 id="messziel-t">${esc(T('messziel.titel'))}</h2>
    <p class="klein">${esc(T('messziel.intro'))}</p>
    ${liste.map(z => zielKarteHtml(z, m)).join('') || `<p class="lead">${esc(T('messziel.leer'))}</p>`}
    ${m.fehler && m.fehler.allgemein ? `<p class="fehler" role="alert">${esc(m.fehler.allgemein)}</p>` : ''}
    ${liste.length < MESSZIEL_OPT.maxJe ? `<button class="btn voll" data-a="messziel-neu">${esc(T('messziel.neu'))}</button>` : `<p class="klein">${esc(T('messziel.voll', { n: MESSZIEL_OPT.maxJe }))}</p>`}
    <button class="link" data-a="messziel-zu">${esc(T('nav.schliessen'))}</button>`;
}

function formHtml(m) {
  const { T } = kx;
  const f = m.form;
  const fe = m.fehler || {};
  const fehler = k => (fe[k] ? `<p class="fehler" role="alert">${esc(fe[k])}</p>` : '');
  const inv = k => (fe[k] ? 'aria-invalid="true"' : '');
  const an = x => `class="opt kurz ${x ? 'sel' : ''}" aria-pressed="${x}"`;
  return `<span class="eyebrow">${esc(T('messziel.eyebrow'))}</span>
    <h2 id="messziel-t">${esc(T(m.zielId ? 'messziel.formBearbeiten' : 'messziel.formNeu'))}</h2>
    <label class="feld"><span>${esc(T('messziel.feld.name'))}</span><input id="messziel-name" maxlength="${MESSZIEL_OPT.nameMax}" value="${esc(f.name)}" placeholder="${esc(T('messziel.feld.nameBeispiel'))}" autocomplete="off" ${inv('name')}></label>${fehler('name')}
    <div class="feld"><span id="messziel-r-l">${esc(T('messziel.feld.richtung'))}</span>
      <div class="wahl" role="group" aria-labelledby="messziel-r-l">${MESSZIEL_RICHTUNGEN.map(r => `<button ${an(f.richtung === r)} data-a="messziel-richtung" data-id="${r}">${esc(T('messziel.richtung.' + r))}</button>`).join('')}</div></div>${fehler('richtung')}
    <div class="zwei messziel-zahlen">
      <label class="feld"><span>${esc(T('messziel.feld.ziel'))}</span><input id="messziel-ziel" inputmode="decimal" value="${esc(f.ziel)}" autocomplete="off" ${inv('ziel')}></label>
      <label class="feld"><span>${esc(T('messziel.feld.einheit'))}</span><input id="messziel-einheit" maxlength="${MESSZIEL_OPT.einheitMax}" value="${esc(f.einheit)}" autocomplete="off" ${inv('einheit')}></label>
    </div>${fehler('ziel')}${fehler('einheit')}
    <div class="wahl messziel-einheiten" role="group" aria-label="${esc(T('messziel.feld.einheitAria'))}">${EINHEIT_VORSCHLAEGE.map(e => `<button ${an(f.einheit === e)} data-a="messziel-einheit" data-id="${esc(e)}">${esc(e)}</button>`).join('')}</div>
    <label class="feld"><span>${esc(T('messziel.feld.start'))}</span><input id="messziel-start" inputmode="decimal" value="${esc(f.start)}" autocomplete="off" ${inv('start')}></label>${fehler('start')}
    <p class="klein">${esc(T('messziel.feld.startHinweis'))}</p>
    <label class="feld"><span>${esc(T('messziel.feld.bis'))}</span><input id="messziel-bis" type="date" value="${esc(f.bis)}" ${inv('bis')}></label>${fehler('bis')}
    ${fe.allgemein ? `<p class="fehler" role="alert">${esc(fe.allgemein)}</p>` : ''}
    <button class="cta" data-a="messziel-speichern">${esc(T('messziel.speichern'))}</button>
    ${m.zielId ? `<button class="btn ${m.frage === 'loeschen' ? 'warn' : ''}" data-a="messziel-loeschen">${esc(T(m.frage === 'loeschen' ? 'messziel.loeschenFrage' : 'messziel.loeschen'))}</button>` : ''}
    <button class="link" data-a="messziel-zurueck">${esc(T('messziel.abbrechen'))}</button>`;
}

function messenHtml(m) {
  const { T, spiel } = kx;
  const z = MZ.messzieleVon(spiel, m.heroId).find(x => x.id === m.zielId);
  if (!z) return listeHtml(m);
  const fe = m.fehler || {};
  const letzte = [...z.messungen].reverse().slice(0, 10);
  return `<span class="eyebrow">${esc(T('messziel.eyebrow'))}</span>
    <h2 id="messziel-t">${esc(z.name)}</h2>
    <p class="klein">${esc(zielText(z))}</p>
    <label class="feld"><span>${esc(T('messziel.feld.wert', { datum: datum(heute()), einheit: z.einheit ? ` (${z.einheit})` : '' }))}</span><input id="messziel-wert" inputmode="decimal" value="${esc(m.wert)}" autocomplete="off" ${fe.wert ? 'aria-invalid="true"' : ''}></label>
    ${fe.wert ? `<p class="fehler" role="alert">${esc(fe.wert)}</p>` : ''}
    <p class="klein">${esc(T('messziel.rhythmus'))}</p>
    <button class="cta" data-a="messziel-eintragen">${esc(T('messziel.eintragen'))}</button>
    ${letzte.length ? `<span class="eyebrow">${esc(T('messziel.bisher'))}</span>
    <ul class="ideen-liste messziel-messungen">${letzte.map(x => `<li><span class="spalte">${esc(mitEinheit(x.wert, z.einheit))}<small>${esc(datum(x.tag))}</small></span><button class="link" data-a="messung-loeschen" data-id="${esc(x.tag)}" aria-label="${esc(T('messziel.messungLoeschenAria', { datum: datum(x.tag) }))}">${esc(T('messziel.messungLoeschen'))}</button></li>`).join('')}</ul>` : ''}
    <button class="link" data-a="messziel-zurueck">${esc(T('messziel.zurListe'))}</button>`;
}

export function messzielBlattHtml() {
  const { T, spiel, ui } = kx;
  const m = ui.messziel;
  if (!m) return '';
  // Passt der Zustand nicht mehr (anderer Bildschirm, Held weg), schließt das Blatt still.
  if (ui.screen !== 'start' || !spiel.helden.some(h => h.heroId === m.heroId)) { ui.messziel = null; return ''; }
  const inhalt = m.modus === 'form' ? formHtml(m) : m.modus === 'messen' ? messenHtml(m) : listeHtml(m);
  return `<div class="feier unten messziel-blatt" role="dialog" aria-modal="true" aria-labelledby="messziel-t">
    <button class="hintergrund" data-a="messziel-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint"><div class="blatt-inhalt">${inhalt}</div></div>
  </div>`;
}
export const messzielSchluessel = m => (m ? `messziel:${m.modus}:${m.zielId || ''}` : null);

// ---------- Aktionen ----------
// Spielstand ändern; MesszielFehler bleiben im Blatt sichtbar, alles andere geht in die Konsole (nichts geht still verloren).
function aendere(fn, fehlerFeld = 'allgemein') {
  const { render, setzeSpiel, speichere, spiel, ui } = kx;
  const m = ui.messziel;
  if (!m) return false;
  try {
    const neu = fn(spiel, m);
    setzeSpiel(neu);
    speichere();
    return true;
  } catch (e) {
    if (!(e instanceof MZ.MesszielFehler)) console.warn('Messziele:', e.message);
    m.fehler = { [fehlerFeld]: e instanceof MZ.MesszielFehler ? e.message : 'Das hat nicht geklappt.' };
    render();
    return false;
  }
}
function zurListe(m, extra = {}) { Object.assign(m, { modus: 'liste', zielId: null, form: leeresForm(), wert: '', fehler: {}, frage: null, erreicht: null }, extra); }

export const MESSZIEL_KLICKS = {
  'messziel-oeffnen'() {
    const { render, spiel, ui } = kx;
    if (!spiel.fokus) return;
    ui.blatt = null; ui.eintrag = null; ui.notfall = null;
    ui.messziel = { heroId: spiel.fokus, modus: 'liste', zielId: null, form: leeresForm(), wert: '', fehler: {}, frage: null, erreicht: null };
    // Ohne Messziel gleich zum Formular (ein Tipp weniger)
    if (!MZ.messzieleVon(spiel, spiel.fokus).length) ui.messziel.modus = 'form';
    trackEvent('measure_opened', {});
    render();
  },
  'messziel-zu'() { const { render, ui } = kx; ui.messziel = null; render(); },
  'messziel-neu'() { const { render, ui } = kx; const m = ui.messziel; if (!m) return; Object.assign(m, { modus: 'form', zielId: null, form: leeresForm(), fehler: {}, frage: null }); render(); },
  'messziel-bearbeiten'({ id }) {
    const { render, spiel, ui } = kx;
    const m = ui.messziel;
    const z = m && MZ.messzieleVon(spiel, m.heroId).find(x => x.id === id);
    if (!z) { console.warn('Messziele: unbekanntes Ziel', id); return; }
    Object.assign(m, { modus: 'form', zielId: id, fehler: {}, frage: null, form: { name: z.name, einheit: z.einheit, richtung: z.richtung, ziel: MZ.zahlText(z.ziel).replace(/\./g, ''), start: z.start === null ? '' : MZ.zahlText(z.start).replace(/\./g, ''), bis: z.bis || '' } });
    render();
  },
  'messziel-messen'({ id }) {
    const { render, spiel, ui } = kx;
    const m = ui.messziel;
    if (!m || !MZ.messzieleVon(spiel, m.heroId).some(x => x.id === id)) { console.warn('Messziele: unbekanntes Ziel', id); return; }
    Object.assign(m, { modus: 'messen', zielId: id, wert: '', fehler: {}, frage: null, erreicht: null });
    render();
  },
  'messziel-zurueck'() { const { render, ui } = kx; if (ui.messziel) { zurListe(ui.messziel); render(); } },
  'messziel-richtung'({ id }) { const { render, ui } = kx; const m = ui.messziel; if (m && MESSZIEL_RICHTUNGEN.includes(id)) { m.form.richtung = id; m.fehler = { ...m.fehler, richtung: undefined }; render(); } },
  'messziel-einheit'({ id }) { const { render, ui } = kx; const m = ui.messziel; if (m && EINHEIT_VORSCHLAEGE.includes(id)) { m.form.einheit = m.form.einheit === id ? '' : id; render(); } },
  'messziel-speichern'() {
    const { render, ui } = kx;
    const m = ui.messziel;
    if (!m) return;
    const p = MZ.zielPruefen(m.form, heute());
    if (!p.ok) { m.fehler = p.fehler; render(); return; }
    const neu = !m.zielId;
    const ok = aendere((spiel, mm) => (neu ? MZ.zielAnlegen(spiel, mm.heroId, p.werte) : MZ.zielAendern(spiel, mm.heroId, mm.zielId, p.werte)).spiel);
    if (!ok) return;
    trackEvent(neu ? 'measure_goal_added' : 'measure_goal_changed', {});
    zurListe(m);
    render();
  },
  // Zweistufig wie „Neu beginnen“: erster Tipp fragt, zweiter löscht.
  'messziel-loeschen'() {
    const { render, ui } = kx;
    const m = ui.messziel;
    if (!m || !m.zielId) return;
    if (m.frage !== 'loeschen') { m.frage = 'loeschen'; render(); return; }
    if (!aendere((spiel, mm) => MZ.zielLoeschen(spiel, mm.heroId, mm.zielId))) return;
    trackEvent('measure_goal_deleted', {});
    zurListe(m);
    render();
  },
  'messziel-eintragen'() {
    const { render, ui } = kx;
    const m = ui.messziel;
    if (!m || !m.zielId) return;
    let r = null;
    const ok = aendere((spiel, mm) => { r = MZ.messen(spiel, mm.heroId, mm.zielId, mm.wert, heute()); return r.spiel; }, 'wert');
    if (!ok) return;
    trackEvent('measure_logged', {}); // nur dass gemessen wurde, nie der Wert
    if (r.erreichtNeu) trackEvent('measure_goal_reached', {});
    zurListe(m, { erreicht: r.erreichtNeu ? r.ziel.id : null });
    render();
  },
  'messung-loeschen'({ id }) {
    const { render, ui } = kx;
    const m = ui.messziel;
    if (!m || !m.zielId) return;
    if (aendere((spiel, mm) => MZ.messungLoeschen(spiel, mm.heroId, mm.zielId, id).spiel, 'wert')) { m.fehler = {}; render(); }
  }
};

// Felder: tippen ohne neu zu zeichnen (Fokus bleibt), Enter speichert.
const formFeld = k => ({
  input({ wert }) { const { ui } = kx; if (ui.messziel) ui.messziel.form[k] = String(wert ?? ''); },
  enter() { MESSZIEL_KLICKS['messziel-speichern'](); }
});
export const MESSZIEL_FELDER = {
  'messziel-name': formFeld('name'),
  'messziel-einheit': formFeld('einheit'),
  'messziel-ziel': formFeld('ziel'),
  'messziel-start': formFeld('start'),
  'messziel-bis': { change({ wert }) { const { ui } = kx; if (ui.messziel) ui.messziel.form.bis = String(wert ?? ''); } },
  'messziel-wert': {
    input({ wert }) { const { ui } = kx; if (ui.messziel) ui.messziel.wert = String(wert ?? ''); },
    enter() { MESSZIEL_KLICKS['messziel-eintragen'](); }
  }
};
