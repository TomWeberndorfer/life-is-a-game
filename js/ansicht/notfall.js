// Notfallkarte mit Ideenglas (Version 75): für den schwierigen Moment, gezeichnet auf oberster Ebene in app.js.
// Seit Version 97 (Etappe 2, Abschnitt 26) eine ruhige Seite über der ganzen App (auch über der Tableiste): ohne Kulisse,
// Funken und Zahlen, ein Schritt je Ansicht, „Zurück“ immer sichtbar. Grund: Unter Stress sinkt die Planungsfähigkeit;
// ein einziger nächster Schritt entlastet (Entwürfe, Iteration 13). Daten: daten/notfall.js, Logik: logik/ideen.js. Frei nach dem ersten schweren Tag (FUNKTIONEN.notfallkarte).
// Zustand: ui.notfall = { heroId, schritt, idee, verwalten, neuText, neuKat, fehler, frage, ausLink }.
// ausLink (Version 78): über den Link #notfall geöffnet; dann auch vor der Freischaltung (daten/sprungziele.js).
// Ablauf: innehalten → „Was ist gerade da?“ (Weiche, Version 127) → Pfad je Zustand (daten/notfall.js NOTFALL.pfade):
// Standard (Druck, Drang, weiß nicht) eigenes Wenn-dann → eigenes Warum → eine Idee; Wut: Später antworten → Was ist
// dir wichtig? → Warum; Ohnmacht: Was liegt bei dir? → kleinster Schritt → früherer geschafft-Eintrag → Selbstmitgefühl.
// Zustand zusätzlich: n.zustand (gewählt oder null), n.frueher (gezogene Eintrags-ID oder ''), n.satz (Index des Satzes),
// n.erinnert (Erinnerung gesetzt). Der Zustand geht als Feld `zustand` in den Eintrag (nicht bei „weiß nicht“). Abschluss: „Hat geholfen“ (ist die Tagesfrage
// noch offen, auf Wunsch gleich als angewendet eintragen) oder „War trotzdem schwer“ (Eintragsblatt).
import { trackEvent } from '../analytics.js';
import { IDEEN_OPT, IDEE_TEXT_MAX, NOTFALL } from '../daten/notfall.js';
import { BOTSCHAFTEN } from '../daten/inhalte.js';
import * as I from '../logik/inhalte.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as ID from '../logik/ideen.js';
import { BEWEISBUCH } from '../daten/beweisbuch.js'; // Version 166: Brief und Beweisbuch
import { EINTRAG_ARTEN } from '../daten/eintrag-arten.js';
import * as BB from '../logik/beweisbuch.js';
import * as K from '../logik/kern.js';
import * as H from '../logik/helden.js';
import { AKTION_SYMBOLE } from '../daten/symbole.js';
import { esc, icon, kachel, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

// Fähigkeit des Helden (für Wenn-dann und Startideen); unbekannt → null.
function faehigkeitVon(heroId) {
  const { spiel } = kx;
  const h = spiel.helden.find(x => x.heroId === heroId);
  const v = h && TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId);
  return v && TABELLE.faehigkeiten[v.faehigkeit] ? { id: v.faehigkeit, ...TABELLE.faehigkeiten[v.faehigkeit] } : null;
}
const optFuer = heroId => ({ ...IDEEN_OPT, faehigkeit: (faehigkeitVon(heroId) || {}).id || null });
const ideen = heroId => { const { spiel } = kx; return ID.ideenVon(spiel, heroId, IDEEN_OPT.start, optFuer(heroId).faehigkeit); };

// Knopf zum Öffnen (Heldentat-Karte und Eintragsblatt). Nur, wenn frei geschaltet.
export function notfallKnopf(klasse = '', { alsKachel = false } = {}) {
  const { T, funktionFrei, symbol } = kx;
  if (!funktionFrei('notfallkarte')) return '';
  if (alsKachel) return kachel({ aktion: 'notfall-oeffnen', symbol: icon(symbol('aktion.notfall', AKTION_SYMBOLE['aktion.notfall'])), kurz: T('kachel.notfall'), lang: T('notfall.oeffnen'), klasse: 'notfall' }); // Version 93
  return `<button class="link notfall-link ${esc(klasse)}" data-a="notfall-oeffnen">${icon(symbol('aktion.notfall', AKTION_SYMBOLE['aktion.notfall']))}${esc(T('notfall.oeffnen'))}</button>`;
}

// ---------- Schnellweg „Gerade schwer“ (Version 139, Bewertung der Startseite 05.11.2026, Punkt 4) ----------
// Kleiner Knopf oben rechts in der Kopfzeile jeder Seite mit Kulisse. Er öffnet immer zuerst die Wahl „Für wen?“
// (Entscheidung 05.11.2026, 5b), mit nur einem Helden direkt die Notfallkarte (eine Wahl mit einer Option ist keine).
// Die Wahl setzt den Fokus still auf den gewählten Helden (ohne Wechsel-Banner) und wechselt zur Startseite, weil die
// Notfallkarte dort lebt (Tagesfrage, Gegner). Schreibt sonst nichts in den Spielstand; nur Zähler. Sichtbar erst, wenn die
// Notfallkarte frei ist (FUNKTIONEN.notfallkarte). Wort und Symbol: Text 'notfall.kopf' und Symbol 'aktion.schnellweg',
// beide je Stil überschreibbar (stile.js `texte`, `symbole`).
// Psychologie: Hilfe im Moment der Versuchung muss ohne Suchen erreichbar sein; ruhig gestaltet, damit der Knopf nicht
// wie ein Alarm wirkt und ihn niemand aus Scham meidet.
export function schnellwegKnopf() {
  const { T, funktionFrei, spiel, symbol } = kx;
  try {
    if (!spiel || !Array.isArray(spiel.helden) || !spiel.helden.length || !funktionFrei('notfallkarte')) return '';
  } catch (e) { console.warn('Schnellweg:', e.message); return ''; }
  return `<button class="schnellweg" data-a="notfall-schnell" aria-haspopup="dialog" aria-label="${esc(T('notfall.kopfAria'))}">${icon(symbol('aktion.schnellweg', AKTION_SYMBOLE['aktion.schnellweg']))}<span>${esc(T('notfall.kopf'))}</span></button>`;
}
// Wahlblatt „Für wen ist es gerade schwer?“ (ui.notfallWahl). Aktiver Held zuerst. Schließt sich selbst, wenn die
// Notfallkarte offen oder nicht mehr frei ist.
export function notfallWahlHtml() {
  const { T, funktionFrei, img, nameVon, spiel, ui } = kx;
  if (!ui.notfallWahl) return '';
  if (ui.notfall || !Array.isArray(spiel.helden) || spiel.helden.length < 2 || !funktionFrei('notfallkarte')) { ui.notfallWahl = false; return ''; }
  const ids = spiel.helden.map(h => h.heroId).sort((a, b) => (a === spiel.fokus ? -1 : b === spiel.fokus ? 1 : 0));
  const zeilen = ids.map(id => `<div class="wahl-zeile"><button class="wahl-info" data-a="notfall-fuer" data-id="${esc(id)}">${img(id, nameVon(id), 'held', 'wahl-bild')}<span class="spalte"><span class="nm">${esc(nameVon(id))}</span></span>${icon('pfeilRechts')}</button></div>`).join('');
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="nf-wahl-t">
    <button class="hintergrund" data-a="notfall-wahl-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint"><div class="blatt-inhalt"><h2 id="nf-wahl-t">${esc(T('notfall.wahlTitel'))}</h2><p class="klein">${esc(T('notfall.wahlText'))}</p>${zeilen}<button class="cta" data-a="notfall-wahl-zu">${esc(T('nav.schliessen'))}</button></div></div>
  </div>`;
}
// Notfallkarte für heroId öffnen: Fokus still setzen, zur Startseite, dann öffnen. Unbekannter Held → Hinweis. Wirft nie.
function notfallFuer(heroId) {
  const { T, geheZu, render, setzeHinweis, setzeSpiel, speichere, spiel, ui } = kx;
  ui.notfallWahl = false;
  if (!spiel.helden.some(h => h.heroId === heroId)) { setzeHinweis(T('kopf.heldFehlt')); render(); return false; }
  if (heroId !== spiel.fokus) {
    try { setzeSpiel(H.fokusSetzen(spiel, heroId)); speichere(); trackEvent('hero_focus', { held: heroId, quelle: 'notfall' }); ui.erfolgFrisch = null; }
    catch (e) { console.warn('Schnellweg (Fokus):', e.message); setzeHinweis(T('kopf.heldFehlt')); render(); return false; }
  }
  if (ui.screen !== 'start') geheZu('start');
  return oeffneNotfall();
}

// Ein Schritt der Seite: Überschrift und Inhalt. Abschnitte ohne Inhalt sind schon in schritteVon() herausgefallen.
function schrittHtml(art, n, f) {
  const { T, spiel } = kx;
  const held = spiel.helden.find(x => x.heroId === n.heroId);
  const titel = T(`notfall.schritt.${art}`);
  let inhalt = '';
  if (art === 'innehalten') inhalt = `<span class="nf-atem" aria-hidden="true"><i></i></span><p class="lead">${esc(T('notfall.innehalten.weiche'))}</p>`;
  else if (art === 'zustand') {
    // Antippen wählt und geht weiter („weiß nicht“ = Standardpfad, wird nicht gespeichert)
    inhalt = `<p class="lead">${esc(T('notfall.zustandText'))}</p>
      <div class="nf-zustaende" role="group" aria-label="${esc(T('notfall.zustandAria'))}">${NOTFALL.zustaende.map(z => `<button class="opt nf-zustand ${n.zustand === z ? 'sel' : ''}" aria-pressed="${n.zustand === z}" data-a="notfall-zustand" data-id="${esc(z)}">${esc(T('notfall.zustand.' + z))}</button>`).join('')}</div>`;
  } else if (art === 'aufschub') {
    const min = NOTFALL.erinnerung.nachMin;
    inhalt = `${gegnerHtml(n)}<p class="lead">${esc(T('notfall.aufschub', { min }))}</p>
      ${n.erinnert ? `<p class="klein" role="status">${esc(T('notfall.aufschubGesetzt', { min }))}</p>` : `<button class="btn voll" data-a="notfall-spaeter">${esc(T('notfall.aufschubKnopf', { min }))}</button>`}`;
  } else if (art === 'wichtig') inhalt = `${gegnerHtml(n)}<p class="lead">${esc(T('notfall.wichtig'))}</p><p class="klein">${esc(T('notfall.wichtigBeispiel'))}</p>`;
  else if (art === 'einfluss') inhalt = `<p class="lead">${esc(T('notfall.einfluss'))}</p>`;
  else if (art === 'kleinster') inhalt = `<p class="lead">${esc(T('notfall.kleinster'))}</p>`;
  else if (art === 'frueher') {
    const e = fruehererVon(n);
    inhalt = e ? `<p class="klein">${esc(T('notfall.frueherAm', { datum: kurzDatum(e.tag) }))}</p><p class="notfall-warum">${esc(e.text)}</p>`
      : `<p class="lead">${esc(T('notfall.frueherLeer'))}</p>`;
  } else if (art === 'beleg') {
    // Version 166: ein Brief an mich oder ein markierter Eintrag, einmal gezogen; „vom früheren Ich“ statt Befehl oder Versprechen
    const b = belegVon(n);
    inhalt = b ? `<p class="klein">${esc(T('notfall.beleg.' + b.art, { datum: kurzDatum(b.eintrag.tag) }))}</p><p class="notfall-warum">${esc(BB.belegText(b.eintrag))}</p>` : '';
  } else if (art === 'mitgefuehl') inhalt = `<p class="notfall-warum">${esc(mitgefuehlSatz(n))}</p>`;
  else if (art === 'wenndann') inhalt = f ? `<div class="notfall-schritt"><p class="notfall-wenn">${esc(f.wenn)}</p>
      <ul class="haken">${(f.schritte || []).map(s => `<li>${icon('check')}${esc(s)}</li>`).join('')}</ul></div>` : '';
  else if (art === 'warum') inhalt = `<p class="notfall-warum">${esc((held && held.quest && held.quest.warum) || '')}</p>`;
  else if (art === 'idee') {
    const liste = ideen(n.heroId);
    const idee = liste.find(x => x.id === n.idee) || null;
    inhalt = `${idee ? `<p class="notfall-idee">${esc(idee.text)}<small>${esc(T('ideen.kat.' + idee.kat))}</small></p>` : `<p class="lead">${esc(T(liste.length ? 'notfall.ideeZiehen' : 'notfall.ideeLeer'))}</p>`}
      <div class="zwei">${liste.length ? `<button class="btn" data-a="notfall-ziehen">${esc(T(idee ? 'notfall.andere' : 'notfall.ziehen'))}</button>` : ''}<button class="btn" data-a="notfall-verwalten">${esc(T('notfall.verwalten'))}</button></div>`;
  } else if (art === 'ende') {
    // Abschluss ohne Wertung; „Hat geholfen“ fragt bei offener Tagesfrage, ob es zählen soll (24a)
    inhalt = n.frage ? `<p class="lead" role="status">${esc(T('notfall.frageJa', { faehigkeit: f ? f.name : '' }))}</p>
        <button class="cta" data-a="notfall-ja">${esc(T('notfall.jaEintragen'))}</button><button class="btn" data-a="notfall-festhalten">${esc(T('notfall.nurFesthalten'))}</button>`
      : `<p class="lead">${esc(T('notfall.endeText'))}</p>
        <button class="cta" data-a="notfall-geholfen">${esc(T('notfall.geholfen'))}</button><button class="btn" data-a="notfall-schwer">${esc(T('notfall.schwer'))}</button>`;
  } else console.warn('Notfallkarte: unbekannter Abschnitt', art);
  return { titel, inhalt };
}
// Schritte dieses Helden (leere Abschnitte fallen weg, zum Schluss „Wie ist es jetzt?“)
function schritteVon(n) {
  const { spiel } = kx;
  const held = spiel.helden.find(x => x.heroId === n.heroId);
  // Version 166: Beleg nur, wenn es einen gibt; er ersetzt dann die Abschnitte aus BEWEISBUCH.notfall.ersetzt (sonst dieselbe Aussage doppelt)
  const hat = !!belegVon(n);
  const hatAbschnitte = { wenndann: !!faehigkeitVon(n.heroId), warum: !!(held && held.quest && held.quest.warum), [BEWEISBUCH.notfall.abschnitt]: hat };
  if (hat) for (const a of BEWEISBUCH.notfall.ersetzt) hatAbschnitte[a] = false;
  return ID.notfallSchritte(ID.notfallPfad(NOTFALL.pfade, n.zustand), hatAbschnitte);
}

// Gegner klein und gedämpft, nur in Pfaden aus NOTFALL.gegnerIn (Wut), weicht ruhig zurück (ohne Bewegung: steht still).
// Nur für den gewählten Helden (dessen aktueller Gegner bekannt ist); sonst nichts.
function gegnerHtml(n) {
  const { T, aktuelleVorlage, img, spiel } = kx;
  if (!NOTFALL.gegnerIn.includes(n.zustand) || n.heroId !== spiel.fokus) return '';
  let g = null, id = null;
  try { const v = aktuelleVorlage(); id = v && v.gegner; g = id ? TABELLE.gegner[id] : null; } catch (e) { console.warn('Notfallkarte (Gegner):', e.message); }
  if (!g) return '';
  return `<div class="nf-gegner"><span class="nf-gegner-bild" aria-hidden="true">${img('boss-' + id, g.name, 'boss', 'cover', '', 'quadrat')}</span>
    <p class="klein">${esc(T('notfall.gegnerNichtDu', { gegner: I.gegnerFormen(g).nom }))}</p></div>`;
}
// Früherer geschafft-Eintrag: einmal gezogen (n.frueher), damit Neuzeichnen ihn nicht wechselt. '' = keiner da.
function fruehererVon(n) {
  const { spiel } = kx;
  const liste = Array.isArray(spiel.eintraege) ? spiel.eintraege : [];
  if (n.frueher === undefined || n.frueher === null) {
    const e = ID.fruehererGeschafft(liste, n.heroId, { zustand: ID.notfallZustand(n.zustand, NOTFALL.merken), letzte: NOTFALL.frueher.letzte });
    n.frueher = e ? e.id : '';
  }
  return n.frueher ? liste.find(e => e.id === n.frueher) || null : null;
}
// Beleg (Version 166): einmal gezogen (n.beleg = Eintrags-ID, '' = keiner da), damit Neuzeichnen ihn nicht wechselt.
// Liefert { art, eintrag } oder null. Wirft nie (kaputte Daten → kein Beleg).
function belegVon(n) {
  const { spiel } = kx;
  try {
    if (n.beleg === undefined || n.beleg === null) {
      const b = BB.belegFuer(spiel, n.heroId, { arten: EINTRAG_ARTEN });
      n.beleg = b ? b.eintrag.id : '';
      n.belegArt = b ? b.art : null;
    }
    if (!n.beleg) return null;
    const e = (Array.isArray(spiel.eintraege) ? spiel.eintraege : []).find(x => x && x.id === n.beleg);
    return e && BB.belegText(e) ? { art: n.belegArt === 'merken' ? 'merken' : 'brief', eintrag: e } : null;
  } catch (err) { console.warn('Notfallkarte (Beleg):', err.message); return null; }
}
// Satz Selbstmitgefühl aus dem Anlass NOTFALL.mitgefuehl (inhalte.md), einmal je Karte gezogen; sonst Ersatztext.
function mitgefuehlSatz(n) {
  const { T } = kx;
  const b = BOTSCHAFTEN.find(x => x.anlass === NOTFALL.mitgefuehl);
  const texte = b && Array.isArray(b.texte) ? b.texte.filter(t => typeof t === 'string' && t.trim()) : [];
  if (!texte.length) return T('notfall.mitgefuehl.ersatz');
  if (!Number.isInteger(n.satz) || n.satz < 0 || n.satz >= texte.length) n.satz = Math.floor(Math.random() * texte.length);
  return texte[n.satz];
}

function verwaltenHtml(n) {
  const { T } = kx;
  const liste = ideen(n.heroId);
  return `<span class="eyebrow">${esc(T('ideen.titel'))}</span>
    <h2 id="notfall-t">${esc(T('ideen.ueberschrift'))}</h2>
    <p class="klein">${esc(T('ideen.text'))}</p>
    <ul class="ideen-liste">${liste.map(x => `<li><span class="spalte">${esc(x.text)}<small>${esc(T('ideen.kat.' + x.kat))}</small></span><button class="link" data-a="idee-loeschen" data-id="${esc(x.id)}" aria-label="${esc(T('ideen.loeschenAria', { idee: x.text }))}">${esc(T('ideen.loeschen'))}</button></li>`).join('') || `<li class="klein">${esc(T('notfall.ideeLeer'))}</li>`}</ul>
    <label class="feld"><span>${esc(T('ideen.neu'))}</span><input id="idee-text" maxlength="${IDEE_TEXT_MAX}" value="${esc(n.neuText || '')}" autocomplete="off"></label>
    <div class="wahl wahl-chips" role="group" aria-label="${esc(T('ideen.katAria'))}">${IDEEN_OPT.kats.map(k => `<button class="wahl-chip ${n.neuKat === k ? 'an' : ''}" aria-pressed="${n.neuKat === k}" data-a="idee-kat" data-id="${esc(k)}">${esc(T('ideen.kat.' + k))}</button>`).join('')}</div>
    ${n.fehler ? `<p class="fehler" role="alert">${esc(n.fehler)}</p>` : ''}
    <button class="btn voll" data-a="idee-hinzufuegen">${esc(T('ideen.hinzufuegen'))}</button>
    <button class="link" data-a="notfall-zurueck">${esc(T('ideen.zurueck'))}</button>`;
}

export function notfallBlattHtml() {
  const { T, funktionFrei, img, nameVon, spiel, ui } = kx;
  const n = ui.notfall;
  if (!n) return '';
  if (ui.screen !== 'start' || !spiel.helden.some(h => h.heroId === n.heroId) || !(n.ausLink || funktionFrei('notfallkarte'))) { ui.notfall = null; return ''; }
  const f = faehigkeitVon(n.heroId);
  const liste = schritteVon(n);
  n.schritt = ID.notfallSchritt(n.schritt, liste.length);
  const art = liste[n.schritt];
  let inhalt;
  if (n.verwalten) inhalt = verwaltenHtml(n);
  else {
    const s = schrittHtml(art, n, f);
    const weiter = art === 'ende' || art === 'zustand' ? '' : `<button class="cta" data-a="notfall-weiter">${esc(T('notfall.weiter'))}</button>`;
    // Heldenbild klein und ruhig über jedem Schritt (Version 127): ein vertrautes Gesicht, kein Kampf
    const bild = `<span class="nf-held" aria-hidden="true">${img(n.heroId, nameVon(n.heroId), 'held', 'kopf-bild', '')}</span>`;
    inhalt = `${bild}<span class="eyebrow">${esc(nameVon(n.heroId).toUpperCase())}</span><h2 id="notfall-t">${esc(s.titel)}</h2>${s.inhalt}${weiter}`;
  }
  const punkte = n.verwalten ? '' : `<span class="nf-punkte" role="img" aria-label="${esc(T('notfall.schrittAria', { nr: n.schritt + 1, n: liste.length }))}">${liste.map((_, i) => `<i class="${i <= n.schritt ? 'an' : ''}"></i>`).join('')}</span>`;
  return `<div class="feier notfall-blatt notfall-seite schritt-${esc(n.verwalten ? 'ideen' : art)}${n.zustand ? ' zustand-' + esc(n.zustand) : ''}" role="dialog" aria-modal="true" aria-labelledby="notfall-t">
    <div class="nf-seite">
      <div class="nf-kopf"><button class="link" data-a="notfall-zurueck-schritt">${icon('zurueck')} ${esc(T('notfall.zurueck'))}</button>${punkte}<button class="link" data-a="notfall-zu">${esc(T('nav.schliessen'))}</button></div>
      <div class="nf-inhalt">${inhalt}</div>
    </div>
  </div>`;
}

// Eintragsblatt öffnen (Notfallkarte schließt). art: 'geschafft' | 'schwer'
function zumEintrag(art) {
  const { render, ui } = kx;
  const hid = ui.notfall && ui.notfall.heroId;
  const zustand = ID.notfallZustand(ui.notfall && ui.notfall.zustand, NOTFALL.merken); // Version 127, null = unbekannt
  ui.notfall = null;
  ui.eintrag = { art, heroId: hid, situation: null, stimmung: null, text: '', fehler: {} };
  if (zustand) ui.eintrag.zustand = zustand;
  render();
}
function aendere(fn) {
  const { render, setzeSpiel, speichere, spiel, ui } = kx;
  const n = ui.notfall;
  if (!n) return;
  try { setzeSpiel(fn(spiel, n)); speichere(); n.fehler = null; }
  catch (e) { n.fehler = e instanceof ID.IdeenFehler ? e.message : 'Das hat nicht geklappt.'; if (!(e instanceof ID.IdeenFehler)) console.warn('Ideenglas:', e.message); }
  render();
}

// Öffnen für Knopf und Link (Version 78). ausLink: über #notfall, dann auch vor der Freischaltung.
// Liefert true, wenn die Karte offen ist (kein Held, Onboarding offen oder gesperrt ohne Link → false).
export function oeffneNotfall({ ausLink = false } = {}) {
  const { funktionFrei, render, spiel, ui } = kx;
  if (!spiel.fokus || ui.screen !== 'start' || !(ausLink || funktionFrei('notfallkarte'))) return false;
  ui.eintrag = null;
  ui.notfall = { heroId: spiel.fokus, schritt: 0, idee: null, verwalten: false, neuText: '', neuKat: IDEEN_OPT.kats[0], fehler: null, frage: false, ausLink, zustand: null, frueher: null, beleg: null, belegArt: null, satz: null, erinnert: false };
  trackEvent('emergency_opened', {});
  if (ausLink) trackEvent('emergency_link_opened', {}); // zählt, wie oft der Link genutzt wird (nur Zähler)
  render();
  return true;
}

// ---------- Klicks ----------
export const NOTFALL_KLICKS = {
  'notfall-oeffnen'() { oeffneNotfall(); },
  // Schnellweg (Version 139): mehrere Helden → Wahl, sonst direkt
  'notfall-schnell'() {
    const { render, spiel, ui } = kx;
    trackEvent('emergency_quick', {});
    if (spiel.helden.length === 1) { notfallFuer(spiel.helden[0].heroId); return; }
    ui.heldenWahl = false; ui.notfallWahl = true; render();
  },
  'notfall-fuer'({ id }) { notfallFuer(id); },
  'notfall-wahl-zu'() { const { render, ui } = kx; ui.notfallWahl = false; render(); },
  'notfall-zu'() { const { render, ui } = kx; ui.notfall = null; render(); },
  // Version 97: ein Schritt weiter; „Zurück“ geht einen Schritt zurück (aus dem Ideenglas zurück zur Seite, vom ersten
  // Schritt aus schließt es die Karte)
  'notfall-weiter'() { const { render, ui } = kx; const n = ui.notfall; if (!n) return; n.schritt = ID.notfallSchritt((n.schritt || 0) + 1, schritteVon(n).length); render(); },
  'notfall-zurueck-schritt'() {
    const { render, ui } = kx;
    const n = ui.notfall;
    if (!n) return;
    if (n.verwalten) { n.verwalten = false; n.fehler = null; }
    else if (n.frage) n.frage = false;
    else if ((n.schritt || 0) > 0) n.schritt -= 1;
    else ui.notfall = null;
    render();
  },
  // Weiche (Version 127): Zustand wählen und weiter; ein neuer Zustand zieht Eintrag und Satz neu
  'notfall-zustand'({ id }) {
    const { render, ui } = kx;
    const n = ui.notfall;
    if (!n) return;
    if (!NOTFALL.zustaende.includes(id)) { console.warn('Notfallkarte: unbekannter Zustand', id); return; }
    if (n.zustand !== id) { n.zustand = id; n.frueher = null; n.beleg = null; n.belegArt = null; n.satz = null; }
    trackEvent('emergency_state', {}); // nur ein Zähler: der Zustand selbst ist ein Gefühl und bleibt auf dem Gerät
    const liste = schritteVon(n);
    const hier = liste.indexOf('zustand');
    n.schritt = ID.notfallSchritt((hier < 0 ? n.schritt || 0 : hier) + 1, liste.length);
    render();
  },
  // „Später antworten“: Erinnerung auf diesem Gerät (nichts im Spielstand); ersetzt eine ältere
  'notfall-spaeter'() {
    const { render, ui } = kx;
    const n = ui.notfall;
    if (!n) return;
    if (setzeErinnerung(n.heroId)) { n.erinnert = true; trackEvent('emergency_later', {}); }
    render();
  },
  'notfall-erinnerung-weg'() { const { render } = kx; loescheErinnerung(); trackEvent('emergency_reminder_done', {}); render(); },
  'notfall-ziehen'() {
    const { render, ui } = kx;
    const n = ui.notfall;
    if (!n) return;
    const z = ID.ziehe(ideen(n.heroId), { vorher: n.idee });
    n.idee = z ? z.id : null;
    trackEvent('idea_drawn', {});
    render();
  },
  'notfall-verwalten'() { const { render, ui } = kx; if (ui.notfall) { ui.notfall.verwalten = true; ui.notfall.fehler = null; render(); } },
  'notfall-zurueck'() { const { render, ui } = kx; if (ui.notfall) { ui.notfall.verwalten = false; ui.notfall.fehler = null; render(); } },
  'idee-kat'({ id }) { const { render, ui } = kx; if (ui.notfall && IDEEN_OPT.kats.includes(id)) { ui.notfall.neuKat = id; render(); } },
  'idee-hinzufuegen'() {
    aendere((spiel, n) => { const r = ID.ideeHinzufuegen(spiel, n.heroId, { text: n.neuText, kat: n.neuKat }, optFuer(n.heroId)); n.neuText = ''; trackEvent('idea_added', {}); return r.spiel; });
  },
  'idee-loeschen'({ id }) {
    aendere((spiel, n) => { const s = ID.ideeLoeschen(spiel, n.heroId, id, optFuer(n.heroId)); if (n.idee === id) n.idee = null; return s; });
  },
  // „Hat geholfen“: ist die Tagesfrage dieses Helden noch offen, erst fragen, ob es als angewendet zählen soll (24a).
  'notfall-geholfen'() {
    const { jetzt, render, spiel, stand, ui } = kx;
    const n = ui.notfall;
    if (!n) return;
    trackEvent('emergency_helped', {});
    let offen = false;
    try { offen = n.heroId === spiel.fokus && !!stand.quest && !K.auswertung(stand, jetzt()).heuteAntwort; } catch (e) { console.warn('Notfallkarte:', e.message); }
    if (offen) { n.frage = true; render(); return; }
    zumEintrag('geschafft');
  },
  'notfall-ja'() {
    const { check, ui } = kx;
    ui.notfall = null;
    check('ja'); // wie „Ja, geschafft“: Belohnung und Einblendungen wie gewohnt
  },
  'notfall-festhalten'() { zumEintrag('geschafft'); },
  'notfall-schwer'() { trackEvent('emergency_hard', {}); zumEintrag('schwer'); }
};
// Felder: neue Idee tippen (ohne neu zu zeichnen), Enter fügt hinzu.
export const NOTFALL_FELDER = {
  'idee-text': {
    input({ wert }) { const { ui } = kx; if (ui.notfall) ui.notfall.neuText = String(wert ?? '').slice(0, IDEE_TEXT_MAX); },
    enter() { NOTFALL_KLICKS['idee-hinzufuegen'](); }
  }
};

// ---------- Erinnerung „Später antworten“ (Version 127) ----------
// Nur auf diesem Gerät (speicher.einstellung, je Profil), nie im Spielstand: Es ist ein Moment, keine Geschichte.
// Erscheint als ruhiges Blatt beim nächsten Öffnen (oder Neuzeichnen) ab NOTFALL.erinnerung.nachMin Minuten, einmal;
// „Schon erledigt“ oder der Hintergrund schließt es. Verfallen (verfallStd) = still löschen.
let erinnerungTimer = null;
const erinnerungName = () => { const { istTest } = kx; return `${NOTFALL.erinnerung.einstellung}-${istTest ? 'test' : 'haupt'}`; };
function liesErinnerung() {
  const { speicher } = kx;
  try { return ID.erinnerungLesen(speicher.einstellung(erinnerungName())); } catch (e) { console.warn('Notfallkarte (Erinnerung):', e.message); return null; }
}
function setzeErinnerung(heroId) {
  const { jetzt, render, speicher } = kx;
  const e = ID.erinnerungNeu(heroId, jetzt().getTime(), NOTFALL.erinnerung.nachMin);
  if (!e) return false;
  if (!speicher.setzeEinstellung(erinnerungName(), e)) console.warn('Notfallkarte: Erinnerung nur bis zum Schließen gespeichert');
  // Bleibt die App offen, erscheint sie ohne Zutun (sonst beim nächsten Öffnen)
  if (erinnerungTimer) clearTimeout(erinnerungTimer);
  erinnerungTimer = setTimeout(() => { erinnerungTimer = null; render(); }, NOTFALL.erinnerung.nachMin * 60000 + 1000);
  return true;
}
function loescheErinnerung() {
  const { speicher } = kx;
  if (erinnerungTimer) { clearTimeout(erinnerungTimer); erinnerungTimer = null; }
  try { speicher.setzeEinstellung(erinnerungName(), null); } catch (e) { console.warn('Notfallkarte (Erinnerung):', e.message); }
}
// Ist die Erinnerung jetzt zu zeigen? Nur auf der Startseite, ohne andere offene Ebene, Held noch da.
export function notfallErinnerungOffen() {
  const { jetzt, spiel, ui } = kx;
  if (ui.screen !== 'start' || ui.notfall || ui.eintrag || ui.feier || ui.blatt || ui.messziel || ui.heldenWahl || ui.ruhetag || ui.karteOrt) return false;
  const e = liesErinnerung();
  if (!e) return false;
  const z = ID.erinnerungZustand(e, jetzt().getTime(), NOTFALL.erinnerung.verfallStd);
  if (z === 'verfallen' || !spiel.helden.some(h => h.heroId === e.heroId)) { loescheErinnerung(); return false; }
  return z === 'faellig';
}
export function notfallErinnerungHtml() {
  const { T } = kx;
  if (!notfallErinnerungOffen()) return '';
  return `<div class="feier unten notfall-erinnerung" role="dialog" aria-modal="true" aria-labelledby="nf-erinnerung-t">
    <button class="hintergrund" data-a="notfall-erinnerung-weg" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint"><div class="blatt-inhalt">
      <h2 id="nf-erinnerung-t">${esc(T('notfall.erinnerungTitel'))}</h2>
      <p class="lead">${esc(T('notfall.erinnerungText'))}</p>
      <button class="cta" data-a="notfall-erinnerung-weg">${esc(T('notfall.erinnerungWeg'))}</button>
    </div></div>
  </div>`;
}
