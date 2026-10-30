// Oberfläche: liest Daten und Logik, rendert Bildschirme, speichert nach jeder Änderung.
import * as K from './logik/kern.js';
import { TABELLE, pruefeTabelle } from './daten/vorlagen.js';
import { STILE, STIL_REIHENFOLGE, STIL_WAEHLBAR, istWaehlbar, stilId, EIGENE_BILDER, BILD_RUECKFALL } from './daten/stile.js';
import * as BR from './logik/bilder.js';
import { DOMAIN_RUECKFALL, LEBENSBEREICHE } from './daten/lebensbereiche.js';
import { hoechsteStufe, hoechstesKapitel, istFrei, pruefeFreischaltung, neuFreigeschaltet, pruefeFreigabe, istFreigegeben, naechsteFreigabe, freigabeKonfig, FREIGABE_ALT } from './logik/freischaltung.js';
import { TABS, MAX_TABS, FUNKTIONEN, ZAEHLER as FREI_ZAEHLER, FREIGABE } from './daten/freischaltung.js';
import { RAMPE } from './daten/rampe.js';
import { TEXTE } from './daten/texte.js';
import { text as textAus, pruefeTexte } from './logik/texte.js';
import { pruefeLogbuchArten } from './logik/logbuch.js';
import { LOGBUCH_ARTEN, LOGBUCH_FILTER, LOGBUCH_TAGE_JE_SEITE } from './daten/logbuch-arten.js';
import { momenteNachCheck, weltenwahlFaellig, pruefeMomente, konfig as momentKonfig, kapitelFaellig, kapitelGesehen, HOEHEPUNKTE } from './logik/momente.js';
import { MOMENTE } from './daten/momente.js';
import { erstelleSpeicher } from './speicher.js';
import { initAnalytics, trackEvent, bewerte, letzteBewertungTag, merke, merkmal, beiAenderung, verbinde, dbSender, datenCode, formSender } from './analytics.js';
import * as X from './logik/austausch.js';
import * as V from './logik/versand.js';
import { VERSAND } from './daten/versand.js';
import { BEWERTUNGEN, EINWILLIGUNG } from './daten/forschung.js';
import * as EW from './logik/einwilligung.js';
import * as I from './logik/inhalte.js';
import * as H from './logik/helden.js';
import { BOTSCHAFTEN, STORIES, MIKRO, MIKRO_JE_TAG, MIKRO_RUECKFALL } from './daten/inhalte.js';
import * as TB from './logik/tabelle.js';
import { PFLEGE_FELDER, PFLEGE_KLICKS, PFLEGE_SCREENS } from './ansicht/pflege.js';
import { START_ABSCHNITTE, START_MOMENTE } from './daten/startseite.js';
import { glanzFaellig } from './logik/startseite.js';
import { NEUIGKEITEN } from './daten/neuigkeiten.js';
import { BEWEGUNG } from './daten/bewegung.js';
import { ablaufEndeMs, pruefeBewegung } from './logik/bewegung.js';
import { esc, icon } from './ansicht/helfer.js';
import { binde } from './ansicht/kontext.js';
import { klickRegister, verteile } from './logik/klicks.js';
import { feldEintrag, feldRegister, feldVerteile } from './logik/felder.js';
import * as P from './logik/pflege.js';
import { ordneAbschnitte, startMomente, tabPunkte, pruefeNeuigkeiten, klappZustand, klappUebernehmen } from './logik/startseite.js';
import { RAHMEN_KLICKS, baldScreen, tabLeiste, testleiste } from './ansicht/rahmen.js';
import { EINSTELLUNGEN_KLICKS, EINSTELLUNGEN_SCREENS } from './ansicht/einstellungen.js';
import { ANALYSE_ZEILEN, ONBOARDING_FELDER, ONBOARDING_KLICKS, ONBOARDING_SCREENS } from './ansicht/onboarding.js';
import { LOGBUCH_KLICKS, LOGBUCH_SCREENS } from './ansicht/logbuch.js';
import { STADT_SCREENS } from './ansicht/stadt.js';
import { KARTE_KLICKS, KARTE_SCREENS, karteBlattHtml } from './ansicht/karte.js';
import { STORY_KLICKS, STORY_SCREENS } from './ansicht/story.js';
import { QUEST_FELDER, QUEST_KLICKS, QUEST_SCREENS } from './ansicht/quest-bearbeiten.js';
import { STILWAHL_KLICKS, STILWAHL_SCREENS } from './ansicht/stilwahl.js';
import { FEEDBACK_FELDER, FEEDBACK_KLICKS, FEEDBACK_SCREENS } from './ansicht/feedback.js';
import { ADMIN_FELDER, ADMIN_KLICKS, ADMIN_SCREENS } from './ansicht/admin.js';
import { BLATT_KLICKS, blattHtml } from './ansicht/blatt.js';
import { FEIER_KLICKS, feierHtml } from './ansicht/feier.js';
import { START_KLICKS, START_KURZ, START_SCREENS, START_TEILE, heldenWahlHtml } from './ansicht/startseite.js';

export const VERSION = { nr: 74, datum: '30.10.2026 · 15:22' };

const istTest = location.hash === '#test';
const istAdmin = location.hash === '#admin';
const speicher = erstelleSpeicher(istTest ? 'test' : 'haupt');
const testerId = speicher.testerId();
let tagVersatz = 0; // nur Testprofil
const jetzt = () => { const d = new Date(); d.setDate(d.getDate() + tagVersatz); return d; };
initAnalytics({ testerId, profil: istTest ? 'test' : 'haupt', heute: jetzt });

// Einwilligung (Version 28): Ohne „ja“ wird nichts übertragen, auch nicht an die Seiten-Datenbank.
// `senderKandidat` = der Sender, den die Umgebung erlaubt (Seiten-Datenbank oder Google-Formular); verbunden wird er nur bei „ja“.
let einw = EW.lies(speicher.einstellung('einwilligung'), EINWILLIGUNG.version);
let senderKandidat = null;
function verbindeSender() { verbinde(EW.darfSenden(einw) ? senderKandidat : null); }
function entscheideDaten(stand) {
  try {
    einw = EW.entscheide(stand, K.tagKey(new Date()), EINWILLIGUNG.version);
  } catch (e) { console.warn('Einwilligung:', e.message); return; }
  if (!speicher.setzeEinstellung('einwilligung', einw)) console.warn('Einwilligung: nur bis zum Schließen gespeichert');
  if (stand === 'ja') { merke('einwilligung', `v${einw.version}`); trackEvent('consent_given', {}); }
  verbindeSender();
}

const app = document.getElementById('app');
const bewegungAus = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Bewegung (Version 46): Werte aus daten/bewegung.js als CSS-Variablen; ungültige Zahl → Standard.
const zahl = (v, std, min, max) => (Number.isFinite(v) && v >= min && v <= max ? v : std);
const BW = {
  versatz: zahl(BEWEGUNG?.auftritt?.versatzMs, 40, 0, 300),
  dauer: zahl(BEWEGUNG?.auftritt?.dauerMs, 380, 0, 1500),
  maxKarten: Math.round(zahl(BEWEGUNG?.auftritt?.maxKarten, 8, 0, 30)),
  auftritt: !bewegungAus && BEWEGUNG?.auftritt?.aus !== true,
  zoom: zahl(BEWEGUNG?.atmosphaere?.zoomS, 20, 0, 120)
};
{
  const r = document.documentElement.style;
  r.setProperty('--bw-versatz', BW.versatz + 'ms');
  r.setProperty('--bw-dauer', BW.dauer + 'ms');
  r.setProperty('--bw-zoom', BW.zoom ? BW.zoom + 's' : '0s');
  if (bewegungAus) document.documentElement.dataset.bewegung = 'aus';
}

// ---------- Zustand ----------

let hinweis = null;
// spiel = gespeicherter Stand mit allen Helden; stand = Ansicht des Helden im Rampenlicht (Format von kern.js)
// Held und Lebensbereich getrennt: Zuordnung kommt aus der Datentabelle (Vorlage → heroId, domainId).
const zuordnung = H.zuordner(TABELLE, DOMAIN_RUECKFALL);
const migWarnung = t => console.warn('Spielstand:', t);
let spiel;
let stand;
{
  const { stand: roh, fehler } = speicher.laden();
  spiel = H.migriereSpiel(roh, testerId, STIL_REIHENFOLGE, zuordnung, migWarnung);
  spiel.stil.aktiv = stilId(spiel.stil.aktiv);
  stand = H.ansicht(spiel, spiel.fokus);
  if (fehler) hinweis = fehler;
}
// Geänderte Heldenansicht zurückschreiben (Standard: Held im Rampenlicht)
function setzeStand(neu, hid = spiel.fokus) {
  spiel = H.uebernehmen(spiel, hid, neu, zuordnung);
  stand = H.ansicht(spiel, spiel.fokus);
}
function setzeSpiel(neu) {
  spiel = neu;
  stand = H.ansicht(spiel, spiel.fokus);
}
const heldenAnsichten = () => spiel.helden.map(h => {
  const a = H.ansicht(spiel, h.heroId);
  return { id: h.heroId, domainId: h.domainId, a, v: mitAktuellemGegner(TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId) || K.vorlageFuer(TABELLE, '*', '*'), a) };
});
const tabFehler = [...pruefeTabelle(), ...pruefeTexte(TEXTE, STILE)];
if (tabFehler.length) console.warn('Vorlagen-Tabelle:', tabFehler);

const ui = {
  screen: istAdmin ? 'admin' : stand.onboarding.fertig ? 'start' : 'ob1',
  blatt: null,        // Detailblatt: 'crew' | 'boss' | 'faehigkeit' | 'premium'
  heldenWahl: false,  // Popup „Helden wechseln“ (Version 43)
  bonusMehr: false,   // alle Bonus-Aufgaben zeigen (Version 45), nur in dieser Sitzung
  einmal: new Set(),  // Einmal-Effekte für das nächste Zeichnen (Version 46): 'check', 'treffer', 'bonus', 'siegel' (48)
  storyOffen: null,   // Story-Teil, dessen Siegel gerade gebrochen wurde (Version 48): bleibt aufgeklappt
  erfolgFrisch: null, // Version 49: { heroId, tag } nach „Ja“ in dieser Sitzung → großes Heldenbild bis Einklappen/Verlassen
  wechselVon: null,   // Version 49: Held vor dem letzten Wechsel (für das Banner beim nächsten Zeichnen)
  xpVon: null,        // XP-Balken vor dem Check in % (Version 46), damit er sichtbar wächst
  schlange: [],       // weitere Einblendungen (Sieg, Level-up, Bewertungen)
  danach: null,       // Bildschirm nach der letzten Einblendung
  fb: {},
  admin: { laden: false, fehler: null, daten: null, test: false, besitzer: false, importInfo: null },
  export: null, // { code, info } für „Daten senden“
  istBesitzer: false,
  premiumGesehen: false,
  obStart: Date.now(),
  neu: false,         // Onboarding für einen weiteren Helden
  bereich: stand.onboarding.bereich,
  problem: stand.onboarding.problem,
  ziel: stand.onboarding.ziel,
  freitext: stand.onboarding.freitext || '',
  feier: null,        // { art: 'sieg' | 'levelup', ... }
  pflege: null,       // Inhalte pflegen (Version 29), siehe neuesPflegeFormular()
  stilAuswahl: null,
  resetFrage: false,
  analyseSchritt: 0,
  wackeln: false,
  xpFlug: null,
  lb: { held: 'alle', gruppe: 'alle', tage: LOGBUCH_TAGE_JE_SEITE, offen: false } // Logbuch-Filter (Version 41), nur in dieser Sitzung; offen = Filter ausgeklappt (Version 56)
};

function speichere() {
  const ok = speicher.speichern(spiel);
  if (!ok && !hinweis) hinweis = T('hinweis.speichernAus');
}

// ---------- Helfer ----------
const stil = () => STILE[stand.stil.aktiv] || STILE.fantasy;
// Vorauswahl in der Weltenwahl (Version 33): gewählte → aktive → erste wählbare Welt; nie eine gesperrte.
const stilVorauswahl = () => [ui.stilAuswahl, stand.stil.aktiv].find(id => id && istWaehlbar(id)) || STIL_WAEHLBAR[0];
const wort = k => stil().wort[k] || STILE.fantasy.wort[k];
// Bildschirmtexte aus dem Register (Stil → Standard); Bezirksname je Stil, sonst Name des Lebensbereichs
// Version 29: Texte aus der Inhalte-Tabelle haben Vorrang (Tabelle Stil → Tabelle alle → Stil-Datei → Standard)
let textCache = { stil: null, map: null };
function stilTexte() {
  const s = stand.stil.aktiv;
  if (textCache.stil !== s || !textCache.map) textCache = { stil: s, map: { ...(stil().texte || {}), ...TB.texteFuer(tabelle, s) } };
  return textCache.map;
}
const T = (k, w) => textAus(TEXTE, stilTexte(), k, w);
const bezirkName = (id, rueckfall) => (stil().bezirke || {})[id] || (STILE.fantasy.bezirke || {})[id] || rueckfall || id;
const nameVon = id => stil().namen[id] || (TABELLE.helden[id] && TABELLE.helden[id].name) || id;

// Vorlage eines Helden mit dem Gegner, gegen den gerade gekämpft wird (Bosskette).
function mitAktuellemGegner(v, st) {
  if (!v || !st.quest) return v;
  const id = K.auswertung(st, jetzt()).gegner;
  return id && TABELLE.gegner[id] ? { ...v, gegner: id } : v;
}
function aktuelleVorlage() {
  if (stand.quest && !ui.neu) return mitAktuellemGegner(TABELLE.vorlagen.find(z => z.id === stand.quest.vorlageId) || K.vorlageFuer(TABELLE, '*', '*'), stand);
  return K.vorlageFuer(TABELLE, ui.bereich, ui.problem || '*');
}

// Inhalte-Tabelle (Version 29): Index aus der Seiten-Datenbank; bis zur Verbindung der letzte Stand dieses Browsers.
let tabelleRoh = { inhalte: [], medien: [] };
let tabelle = TB.leererIndex();
function setzeTabelle(roh, merken) {
  tabelleRoh = { inhalte: Array.isArray(roh && roh.inhalte) ? roh.inhalte : [], medien: Array.isArray(roh && roh.medien) ? roh.medien : [] };
  tabelle = TB.baueIndex(tabelleRoh.inhalte, tabelleRoh.medien, STIL_REIHENFOLGE, TEXTE);
  textCache = { stil: null, map: null };
  if (tabelle.fehler.length) console.warn('Inhalte-Tabelle: ' + tabelle.fehler.length + ' ungültige Zeile(n) ignoriert.');
  if (merken) speicher.setzeEinstellung('tabelle', tabelleRoh);
}
try { const c = speicher.einstellung('tabelle'); if (c) setzeTabelle(JSON.parse(c), false); }
catch (e) { console.warn('Inhalte-Tabelle: gemerkter Stand unlesbar, wird neu geladen.'); }

// Alle bekannten Bildplätze (für Pflege-Vorschläge und Lücken)
function bildPlaetze() {
  const s = new Set(['szene', 'karte']);
  for (const st of Object.values(STILE)) Object.keys(st.bilder || {}).forEach(k => s.add(k));
  for (const m of Object.values(EIGENE_BILDER)) Object.keys(m).forEach(k => s.add(k));
  Object.keys(TABELLE.helden || {}).forEach(h => { s.add(h); s.add('banner-' + h); });
  Object.keys(TABELLE.gegner || {}).forEach(g => { s.add('boss-' + g); s.add('story-' + g); }); // story-: optional (Version 40), sonst Bossbild
  return [...s].sort();
}

// Notfall-Platzhalter (Initialen), falls auch die Platzhalter-Datei nicht lädt
function platzhalter(text, art) {
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue(art === 'boss' ? '--gegner' : '--panel').trim() || '#888';
  const fg = cs.getPropertyValue(art === 'boss' ? '--auf-gegner' : '--ink').trim() || '#000';
  const kurz = String(text || '?').replace(/^(Der|Die|Das)\s+/, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${bg}"/><circle cx="60" cy="60" r="44" fill="none" stroke="${fg}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="4 6"/><text x="60" y="72" text-anchor="middle" font-family="Georgia,serif" font-size="36" font-weight="700" fill="${fg}">${esc(kurz)}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Eingebautes Bild eines Stils (eigenes Bild aus dem alten Prototyp → Datei des Stils) oder null.
function eingebautesBild(stilId, platz) {
  const st = STILE[stilId];
  if (!st) return null;
  const eigen = (EIGENE_BILDER[stilId] || {})[platz];
  if (eigen) return { datei: eigen[0], pos: eigen[1] || (st.pos || {})[platz] || TB.STANDARD_POS };
  const pfad = st.bilder[platz] || (platz === 'karte' ? st.karte : null);
  return pfad ? { datei: pfad, pos: (st.pos || {})[platz] || TB.STANDARD_POS } : null;
}

// Rückfallkette (Version 62): Zuordnungen für BILD_RUECKFALL, Regeln einmal beim Start prüfen.
const BILD_ZUORDNUNG = { bereichHeld: BR.bereichHeld(LEBENSBEREICHE) };
{ const f = BR.pruefeRueckfall(BILD_RUECKFALL, BILD_ZUORDNUNG); if (f.length) console.warn('Bilder: ' + f.join('; ')); }

// Bild für Stil, Platz und Darstellung (Version 30, Rückfallkette seit Version 62).
// Je Platz der Kette: Tabelle (Stil) → Tabelle (alle) → eingebautes Bild; erst danach der nächste Platz der Kette
// (z. B. bezirk-partner → banner-khara → khara), zuletzt der Platzhalter des Stils. Kein Leihen aus anderen Stilen.
// form: 'rund' | 'quadrat' | 'breit' → eigener Ausschnitt je Darstellung, sonst gemeinsamer Ausschnitt.
// `ueber` = Platz, dessen Bild gezeigt wird, wenn es nicht der eigene ist (für die Pflege-Übersicht).
function bildFuer(stilId, platz, art = 'held', form = 'breit') {
  const ph = TB.platzhalterPfad(stilId, art);
  const r = BR.loeseBild(platz, p => {
    const ein = eingebautesBild(stilId, p);
    const tab = TB.bildAus(tabelle, stilId, p);
    return tab || ein ? { tab, ein } : null;
  }, BILD_RUECKFALL, BILD_ZUORDNUNG);
  if (!r) return { src: ph, ph, pos: TB.STANDARD_POS, quelle: 'platzhalter', eingebaut: null, ueber: null };
  const { tab, ein } = r.bild;
  const ueber = r.rueckfall ? r.platz : null;
  if (tab) return { src: tab.url, ph, pos: TB.posFuer(tab, form, ein ? ein.pos : TB.STANDARD_POS), quelle: 'tabelle', eintrag: tab, eingebaut: ein, ueber };
  return { src: ein.datei, ph, pos: ein.pos, quelle: 'eingebaut', eingebaut: ein, ueber };
}
const bild = (platz, text, art = 'held', form = 'breit') => bildFuer(stand.stil.aktiv, platz, art, form);

// Darstellung je CSS-Klasse; Bildstellen mit anderer Form geben `form` beim Aufruf von img() mit.
const FORM_JE_KLASSE = { rund: 'rund', 'rund-klein': 'rund', 'kopf-bild': 'rund', 'stapel-bild': 'rund', 'wahl-bild': 'rund', 'weiter-bild': 'rund', 'mikro-held': 'rund' };
const formVon = cls => String(cls).split(/\s+/).map(c => FORM_JE_KLASSE[c]).find(Boolean) || 'breit';

function img(platz, text, art, cls = '', alt = '', form = formVon(cls)) {
  const b = bild(platz, text, art, form);
  return `<img class="${cls}" src="${esc(b.src)}" data-ph="${esc(b.ph)}" data-ph2="${esc(platzhalter(text, art))}" alt="${esc(alt)}" style="object-position:${esc(b.pos)}" loading="lazy">`;
}

// ---------- Bildschirme ----------
// ---------- Untere Leiste ----------
// Tabs und Freischaltung als Daten: daten/freischaltung.js (Version 37, vorher fest hier).
// Version 26: gesperrte Tabs zeigen ein Schloss und beim Antippen einen Hinweis, statt zu fehlen (Progressive Disclosure).
// `sichtbar` (optional, Funktion) blendet einen Tab ganz aus; `bald: true` zeigt frei geschaltet den Platzhalter.
const tabLabel = t => (t.label && typeof t.label.wort === 'string' ? wort(t.label.wort) : T(t.label && t.label.text));
const tabSichtbar = t => !t.sichtbar || t.sichtbar();
const freiKontext = () => ({
  stufe: hoechsteStufe(spiel, jetzt(), m => console.warn(m)),
  kapitel: hoechstesKapitel(spiel, jetzt(), m => console.warn(m)),
  siege: H.gesamtSiege(spiel),
  zaehler: { siege: H.gesamtSiege(spiel) } // rueckfaelle: kommt mit Sieg/Rückfall (Phase D), bis dahin 0
});
const regelFrei = r => istFrei(r, freiKontext(), m => console.warn(m), FREI_ZAEHLER);
// Version 69: höchstens eine Freischaltung pro Tag (Regeln: daten/freischaltung.js FREIGABE, Logik: logik/freischaltung.js).
// angekuendigt(id): freigegeben (oder nicht getaktet). nutzbar(id): bei sperreBisFreigabe erst nach der Freigabe.
const FG = freigabeKonfig(FREIGABE);
const angekuendigt = id => istFreigegeben(id, spiel.freigaben, FG);
const nutzbar = id => !FG.sperreBisFreigabe || angekuendigt(id);
const tabAktiv = t => regelFrei(t.frei) && nutzbar(t.screen);
const tabVerdientGesperrt = t => regelFrei(t.frei) && !nutzbar(t.screen);
// Version 50: frisch freigeschaltete Bereiche, bis sie geöffnet oder mit „Später“ bestätigt wurden (spiel.neuGesehen)
const neuBereiche = () => neuFreigeschaltet(TABS.filter(tabSichtbar), t => tabAktiv(t) && angekuendigt(t.screen), spiel.neuGesehen);
// Version 69: Welten und erstes „Neues Abenteuer?“ nur, wenn verdient UND freigegeben (bei Sperre)
const weltenFrei = () => !!stand.stil.frei && nutzbar('welten');
const angebotFrei = () => H.zielAngebot(spiel) && nutzbar('angebot');
function alsGesehen(ids) {
  if (!ids.length) return;
  try { setzeSpiel(H.neuGesehen(spiel, ids)); speichere(); } catch (e) { console.warn('Neu für dich:', e.message); }
}
// Abfrage für Funktionen außerhalb der Leiste (Notfallkarte, Wochenrunden, Wheel …). Unbekannte Funktion = gesperrt.
const funktionFrei = id => {
  const f = FUNKTIONEN[id];
  if (!f) { console.warn(`Unbekannte Funktion: ${id}`); return false; }
  return regelFrei(f.frei);
};
const sperrTextVon = t => tabVerdientGesperrt(t) ? T('tab.verdient', { bereich: tabLabel(t) })
  : t.sperrText ? T(t.sperrText, { stadt: wort('stadt'), bereich: tabLabel(t) })
  : t.frei && t.frei.art === 'stufe' ? T('tab.stufeGesperrt', { bereich: tabLabel(t), stufe: wort('stufe'), nr: t.frei.ab })
  : t.frei && t.frei.art === 'kapitel' ? T('tab.kapitelGesperrt', { bereich: tabLabel(t), kapitel: wort('kapitel'), nr: t.frei.ab })
  : T('tab.gesperrt');
pruefeFreischaltung({ tabs: TABS, funktionen: FUNKTIONEN, maxTabs: MAX_TABS, zaehler: FREI_ZAEHLER })
  .forEach(m => console.warn('Freischaltung:', m));
// Neuigkeiten-Punkte (Version 51). Register: daten/neuigkeiten.js. Jede Quelle liefert eine Kennung, solange die
// Neuigkeit besteht (nur für den aktiven Helden, denn die Startseite zeigt ihn), sonst null.
const NEU_QUELLEN = {
  story: () => { const st = story(); const z = I.storyZustaende(st).find(x => x.zustand === 'siegel'); return z ? `${spiel.fokus}:${st.woche}:${z.nr}` : null; },
  botschaft: () => {
    const tag = K.tagKey(jetzt());
    if (H.istGelesen(spiel, spiel.fokus, tag) || K.auswertung(stand, jetzt()).heuteAntwort) return null; // gleiche Regel wie crewKarte()
    const b = I.botschaft(stand, jetzt(), aktuelleVorlage(), TABELLE, BOTSCHAFTEN, nameVon, stilWerte());
    return b.text && b.anlass !== 'erster_tag' ? `${spiel.fokus}:${tag}` : null;
  },
  gegner: () => { const a = K.auswertung(stand, jetzt()); return a.neuerGegner && (a.siegHeute || a.rundeTag <= 0) ? `${spiel.fokus}:${a.gegner}` : null; },
  welten: () => (weltenFrei() && !stand.stil.angeboten ? 'offen' : null),
  // Version 59: „Neues Abenteuer?“ (kein Tab-Punkt, nur Glanz). Kennung = Zahl der Helden: nach einem neuen Helden ist
  // das nächste Angebot eine neue Sache.
  angebot: () => (angebotFrei() ? String(spiel.helden.length) : null)
};
pruefeNeuigkeiten(NEUIGKEITEN, Object.keys(NEU_QUELLEN), TABS.map(t => t.screen), {
  abschnitte: (Array.isArray(START_ABSCHNITTE) ? START_ABSCHNITTE : []).map(z => z && z.id),
  glanzStile: Object.keys((BEWEGUNG && BEWEGUNG.glanz) || {})
}).forEach(m => console.warn(m));
const neuSitzung = new Set(); // Kennungen, die auf ihrem Tab schon offen waren (bis: 'gesehen')
function neuPunkte() {
  if (!stand.quest) return [];
  const p = tabPunkte(NEUIGKEITEN, NEU_QUELLEN, ui.screen, neuSitzung);
  p.aktuell.filter(x => x.tab === ui.screen).forEach(x => neuSitzung.add(x.kennung));
  return p.tabs;
}

// ---------- Weltenwahl als eigener Moment (Version 42) ----------
pruefeMomente(MOMENTE).forEach(m => console.warn('Momente:', m));
const SM = startMomente(START_MOMENTE); // Version 49: Erfolgsbild und Wechsel-Banner
SM.fehler.forEach(m => console.warn('Start-Momente:', m));
let weltenGezeigt = false; // höchstens einmal je Sitzung von selbst
const MK = momentKonfig(MOMENTE); // gültige Moment-Regeln (Version 68: Kapitelwechsel, Puffer)
// Bewegung vereinheitlicht (Version 68): Katalog und Abläufe prüfen; die Pause vor Einblendungen nach dem Tages-Check
// richtet sich nach dem Ende des Ablaufs „tagesCheck“ (eine Quelle), plus Puffer aus MOMENTE.pauseMs.
pruefeBewegung(BEWEGUNG).forEach(m => console.warn('Bewegung:', m));
const PAUSE_NACH_CHECK = ablaufEndeMs(BEWEGUNG, 'tagesCheck') + MK.pauseMs;
const heute = () => K.tagKey(jetzt());
// Einstiegsrampe (30.10.2026): Regel für neue Quests prüfen; ungültig → neue Quests ohne Rampe (feste Anzahl), mit Warnung.
K.pruefeRampe(RAMPE).forEach(m => console.warn('Rampe:', m));
const RAMPE_NEU = K.bereinigeRampe(RAMPE);
// Höhepunkt-Tag merken (je Gerät): an diesem Tag keine Bewertungsfrage mehr (Version 68, fragenNurRuhig)
const hoehepunktHeute = () => merkmal('hoehepunkt_tag') === heute();

// ---------- Kapitelwechsel beim nächsten Besuch (Version 68) ----------
// Am Siegtag nur der Sieg; Weg und neuer Gegner erscheinen beim ersten Öffnen der Startseite, sobald die neue Runde läuft.
// Gesehen je Gerät (merkmal 'kapitel_gesehen'), Kennung = Held | Queststart | Vorlage | Kapitel. Geht nach Pausen nicht verloren.
function kapitelBasis() { return stand.quest ? `${spiel.fokus}|${stand.quest.start}|${stand.quest.vorlageId}` : ''; }
// Ist jetzt ein Kapitelwechsel fällig? Liefert { kennung, momente } oder null, ändert nichts (30.10.2026 getrennt vom Zeigen,
// damit eine ruhige Freigabe im selben Besuch vorher geprüft werden kann).
function kapitelJetzt() {
  if (ui.feier || ui.blatt || ui.screen !== 'start' || !stand.onboarding.fertig || !stand.quest) return null;
  try { return kapitelFaellig(K.auswertung(stand, jetzt()), K.kette(stand), kapitelBasis(), merkmal('kapitel_gesehen'), MOMENTE, { siege: stand.siege }); }
  catch (e) { console.warn('Kapitelwechsel:', e.message); return null; }
}
function pruefeKapitelwechsel(f = kapitelJetzt()) {
  if (!f) return false;
  merke('kapitel_gesehen', kapitelGesehen(merkmal('kapitel_gesehen'), f.kennung));
  ui.schlange.push(...f.momente);
  zeigeNaechstes();
  return true;
}
// ---------- Höchstens eine Freischaltung pro Tag (Version 69) ----------
// Was ist verdient (Regel erfüllt)? Tabs mit eigener Regel (ohne „kommt bald“) über ihre Regel, sonst eine Quelle hier.
// Neue getaktete Sache = Quelle hier + ID in FREIGABE.reihenfolge.
const FREIGABE_QUELLEN = {
  welten: () => !!stand.stil.frei && (stand.stil.angeboten === true || weltenwahlFaellig(spiel, heute(), MOMENTE)),
  angebot: () => H.zielAngebot(spiel)
};
const taktTabs = () => TABS.filter(t => t && t.frei && t.frei.art !== 'immer' && t.bald !== true);
pruefeFreigabe(FREIGABE, [...taktTabs().map(t => t.screen), ...Object.keys(FREIGABE_QUELLEN)], HOEHEPUNKTE).forEach(m => console.warn('Freigabe:', m));
// Freigabe-Pause (30.10.2026): nur Einblendungen aus FREIGABE.pauseBei (Sieg, Stufe, Story) machen einen Höhepunkt-Tag
// (merkmal je Gerät; Siege anderer Geräte zählen über siegTage). pauseInSitzung: der Höhepunkt kam in diesem Besuch,
// dann gilt auch die Höchstwartezeit nicht (nie direkt nach dem Sieg).
let pauseInSitzung = false;
const freigabePauseHeute = () => merkmal('freigabe_pause_tag') === heute();
function verdienteFreigaben() {
  const ids = [];
  for (const t of taktTabs()) { try { if (regelFrei(t.frei)) ids.push(t.screen); } catch (e) { console.warn('Freigabe:', e.message); } }
  for (const [id, q] of Object.entries(FREIGABE_QUELLEN)) { try { if (q()) ids.push(id); } catch (e) { console.warn(`Freigabe ${id}:`, e.message); } }
  return ids;
}
const siegTage = () => spiel.helden.flatMap(h => (h.siege || []).map(x => x && x.tag)).filter(Boolean);
// Altbestand (Stand vor Version 69, freigaben = null): was schon verdient ist, bleibt offen; Neues wird ab jetzt getaktet.
function freigabenAltbestand() {
  if (spiel.freigaben !== null) return;
  try { setzeSpiel(H.freigabenSetzen(spiel, stand.onboarding.fertig ? verdienteFreigaben() : [], FREIGABE_ALT)); speichere(); }
  catch (e) { console.warn('Freigabe (Altbestand):', e.message); setzeSpiel({ ...spiel, freigaben: {} }); }
}
// Gibt höchstens eine verdiente Sache frei (beim Öffnen der Startseite). Liefert die ID oder null.
// mitMoment: in diesem Besuch kommt schon der Kapitelwechsel (dann keine Freigabe, die selbst eine Einblendung ist).
// Muss eine Freigabe wegen eines Höhepunkts warten, merkt sich das Spiel den ersten Tag (Höchstwartezeit, alle Geräte).
function gibFreigabe(mitMoment = false) {
  if (ui.feier || ui.blatt || ui.screen !== 'start' || !stand.onboarding.fertig || !stand.quest) return null;
  let r;
  try {
    r = naechsteFreigabe({ verdient: verdienteFreigaben(), freigaben: spiel.freigaben, heute: heute(), hoehepunktHeute: freigabePauseHeute(), siegTage: siegTage(),
      mitMoment, wartetSeit: spiel.freigabeWartet, frischerHoehepunkt: pauseInSitzung }, FG);
  } catch (e) { console.warn('Freigabe:', e.message); return null; }
  if (r.grund === 'hoehepunkt' || r.grund === 'moment') {
    try { const n = H.freigabeWartetSeit(spiel, heute()); if (n !== spiel) { setzeSpiel(n); speichere(); } }
    catch (e) { console.warn('Freigabe (Wartezeit):', e.message); }
  }
  if (!r.id) return null;
  try { setzeSpiel(H.freigabenSetzen(spiel, r.id, heute())); speichere(); }
  catch (e) { console.warn('Freigabe:', e.message); return null; }
  trackEvent('unlock_released', { bereich: r.id, grund: r.grund });
  return r.id;
}
// Besuchs-Momente: höchstens eine Einblendung je Besuch – erst der Kapitelwechsel, sonst die Weltenwahl.
// Seit 30.10.2026 darf eine ruhige Freigabe („Neu für dich“-Karte, Angebot) im selben Besuch wie der Kapitelwechsel kommen:
// sie wird vor der Einblendung geprüft (danach wäre eine Einblendung offen) und erscheint, wenn die Einblendung zu ist.
function pruefeBesuchsMomente() {
  const kapitel = kapitelJetzt();
  const id = gibFreigabe(!!kapitel);
  if (pruefeKapitelwechsel(kapitel)) { if (id === 'welten') weltenNachKapitel(); return; }
  if (id && id !== 'welten') { render(); return; } // Neu für dich / Angebot erscheinen auf der Startseite
  pruefeWeltenwahl();
}
// Weltenwahl, die nach der Höchstwartezeit im Besuch mit Kapitelwechsel freigegeben wurde: öffnet sich, sobald dessen
// Einblendungen zu sind (ui.danach), statt einen weiteren Tag zu warten.
function weltenNachKapitel() {
  if (weltenGezeigt || !nutzbar('welten')) return;
  let faellig = false;
  try { faellig = weltenwahlFaellig(spiel, K.tagKey(jetzt()), MOMENTE); } catch (e) { console.warn('Weltenwahl:', e.message); }
  if (!faellig) return;
  weltenGezeigt = true;
  trackEvent('world_choice_offered', {});
  ui.stilAuswahl = stand.stil.aktiv;
  ui.danach = 'stilwahl';
}
function pruefeWeltenwahl() {
  if (weltenGezeigt || ui.feier || ui.screen !== 'start' || !stand.onboarding.fertig || !nutzbar('welten')) return;
  let faellig = false;
  try { faellig = weltenwahlFaellig(spiel, K.tagKey(jetzt()), MOMENTE); } catch (e) { console.warn('Weltenwahl:', e.message); }
  if (!faellig) return;
  weltenGezeigt = true;
  trackEvent('world_choice_offered', {});
  ui.stilAuswahl = stand.stil.aktiv;
  geheZu('stilwahl');
}

// ---------- Logbuch (Version 41) ----------
// Reine Ansicht über den Spielstand (logik/logbuch.js), Arten und Filter als Daten (daten/logbuch-arten.js).
pruefeLogbuchArten(LOGBUCH_ARTEN, { texte: TEXTE, filterIds: LOGBUCH_FILTER.map(f => f.id) }).forEach(m => console.warn('Logbuch:', m));

// ---------- Inhalte pflegen (Version 29; Logik seit 30.10.2026 in logik/pflege.js, Ansicht in ansicht/pflege.js) ----------
function pflegeZustand() {
  if (!ui.pflege) ui.pflege = P.neuerZustand();
  return ui.pflege;
}
const pflegeKontext = () => ({ stile: STIL_REIHENFOLGE, medien: tabelle.medien, standardTexte: TEXTE });
// Umgebung der Pflege-Aktionen: Datenbank und Bildspeicher nur über den Adapter (später austauschbar, z. B. eigenes Hosting).
const pflegeUmgebung = () => ({
  speicher: P.dbAdapter(ui.db, ui.assets), T, zeichne: render, jetzt: () => new Date(), tabelle: () => tabelle,
  kontext: pflegeKontext, plaetze: bildPlaetze, stilName: id => (STILE[id] || { name: id }).name
});

// Seiten-Datenbank abonnieren (einmal je Seitenaufruf). Fehler lassen die eingebauten Inhalte stehen.
let tabelleAbo = false;
function abonniereTabelle(db) {
  if (tabelleAbo || !db) return;
  tabelleAbo = true;
  const roh = { inhalte: tabelleRoh.inhalte, medien: tabelleRoh.medien };
  const geladen = { inhalte: false, medien: false };
  const aus = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const neu = () => {
    if (!geladen.inhalte || !geladen.medien) return; // erst beide Tabellen, sonst flackern Bilder auf Platzhalter
    setzeTabelle(roh, true);
    // Beim Tippen in der Pflege nicht neu zeichnen (Fokus bliebe sonst nicht erhalten)
    const tippt = ui.screen === 'pflege' && document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (!tippt) render();
  };
  const fehler = name => e => console.warn(`Inhalte-Tabelle (${name}) nicht geladen: ${P.fehlerText(e, T)}`);
  db.collection('medien').limit(1000).onSnapshot(s => { roh.medien = aus(s); geladen.medien = true; neu(); }, fehler('medien'));
  db.collection('inhalte').limit(1000).onSnapshot(s => { roh.inhalte = aus(s); geladen.inhalte = true; neu(); }, fehler('inhalte'));
}

// Bildschirme (app.js aufteilen, 30.10.2026): je Ansichtsmodul unter ansicht/ ein Register <NAME>_SCREENS.
// Neue Ansicht = neues Modul + eine Zeile hier. Doppelte Namen meldet der Start (der spätere gewinnt), damit kein
// Bildschirm still verschwindet.
const SCREENS = {};
for (const [quelle, teil] of Object.entries({ ONBOARDING_SCREENS, START_SCREENS, LOGBUCH_SCREENS, STADT_SCREENS, KARTE_SCREENS, STORY_SCREENS, QUEST_SCREENS, STILWAHL_SCREENS, FEEDBACK_SCREENS, EINSTELLUNGEN_SCREENS, ADMIN_SCREENS, PFLEGE_SCREENS })) {
  for (const [name, f] of Object.entries(teil || {})) {
    if (typeof f !== 'function') { console.warn(`Bildschirm ${name} (${quelle}) ist keine Funktion`); continue; }
    if (name in SCREENS) console.warn(`Bildschirm ${name} doppelt (${quelle})`);
    SCREENS[name] = f;
  }
}

function erstelleExport() {
  try { ui.export = { code: datenCode(), info: null }; }
  catch (e) { ui.export = { code: null, info: T('export.fehler', { grund: (e && e.message) || '?' }) }; }
  render();
}

async function kopiereExport() {
  const feld = app.querySelector('#export-code');
  let ok = false;
  try { await navigator.clipboard.writeText(ui.export.code); ok = true; }
  catch (e) { try { feld.select(); ok = document.execCommand('copy'); } catch (e2) { ok = false; } }
  ui.export.info = T(ok ? 'export.kopiert' : 'export.manuell');
  render();
  if (!ok) { const f = app.querySelector('#export-code'); if (f) { f.focus(); f.select(); } }
}

async function teileExport() {
  try { await navigator.share({ text: ui.export.code }); }
  catch (e) { if (!e || e.name !== 'AbortError') kopiereExport(); }
}

// Schreibt ein Dokument: erst zusammenführen, falls es fehlt neu anlegen (wie dbSender).
async function dbSchreiben(ref, doc) {
  try { await ref.update(doc); }
  catch (e) { if (!e || e.code !== 'invalid_argument') throw e; await ref.set(doc); }
}

// Übernimmt gelesene Tester in die Auswertung und speichert sie, wenn möglich, als Besitzer in der Datenbank.
async function uebernimm(gelesen, kopfText) {
  const A = ui.admin;
  let liste = A.daten || [];
  for (const g of gelesen) liste = X.einfuegen(liste, X.alsTester(g)).liste;
  A.daten = liste; A.fehler = null;
  let text = kopfText;
  if (ui.db && ui.istBesitzer) {
    try {
      for (const g of gelesen) {
        await dbSchreiben(ui.db.doc(`ana/${g.id}`), { ...g.profil, quelle: 'import', importiert: new Date().toISOString() });
        for (const [t, d] of Object.entries(g.tage)) await dbSchreiben(ui.db.doc(`ana/${g.id}/tage/${t}`), d);
      }
      text += ' ' + T('import.gespeichert');
    } catch (e) { text += ' ' + T('import.dbFehler', { grund: (e && e.message) || '?' }); }
  } else text += ' ' + T('import.lokal');
  A.importInfo = { fehler: false, text };
  render();
}

async function importiere() {
  const feld = app.querySelector('#import-code');
  let g;
  try { g = X.leseCode(feld ? feld.value : ''); }
  catch (e) { ui.admin.importInfo = { fehler: true, text: e instanceof X.CodeFehler ? e.message : T('import.codeUnlesbar') }; render(); return; }
  const ersetzt = (ui.admin.daten || []).some(t => t.id === g.id);
  await uebernimm([g], T(ersetzt ? 'import.ersetzt' : 'import.neu', { id: g.id.slice(0, 8), tage: Object.keys(g.tage).length }));
}

// CSV-Download der Google-Tabelle einlesen (Version 25).
async function importiereCsv(datei) {
  if (!datei) return;
  try {
    if (datei.size > 20 * 1024 * 1024) throw new Error(T('import.csvGross'));
    const r = V.ausTabelle(V.leseCsv(await datei.text()));
    await uebernimm(r.tester, T('import.csvOk', { tester: r.tester.length, zeilen: r.zeilen, fehler: r.fehler }));
  } catch (e) {
    ui.admin.importInfo = { fehler: true, text: T('import.csvFehler', { grund: (e && e.message) || '?' }) };
    render();
  }
}

function mikroBereich(v) {
  if (v.gruppe && v.gruppe !== '*') return v.gruppe;
  return stand.onboarding.bereich || MIKRO_RUECKFALL;
}
// Mikroquests je Held: 1 Held → 3, 2 Helden → je 2, 3 Helden → je 1
const mikroJeHeld = () => (spiel.helden.length <= 1 ? MIKRO_JE_TAG : spiel.helden.length === 2 ? 2 : 1);
const mikroListe = () => heldenAnsichten().flatMap(({ id, a, v }) =>
  I.mikroHeute(a, jetzt(), mikroBereich(v), MIKRO, mikroJeHeld(), MIKRO_RUECKFALL).map(m => ({ ...m, held: id })));
// Version 64: Stil-Wörter als Platzhalter in Geschichten und Botschaften (z. B. {stadtname})
const stilWerte = () => Object.fromEntries(I.STIL_PLATZHALTER.map(k => [k, wort(k)]));
const story = () => I.storyWoche(stand, jetzt(), aktuelleVorlage(), TABELLE, STORIES, nameVon, stilWerte());

klappZustand(START_ABSCHNITTE, Object.keys(START_KURZ), []).fehler.forEach(m => console.warn(m));
// Version 63 (Etappe C): alte Einzel-Merkmale je Abschnitt → einmalig in 'start_klein' übernehmen, danach geleert.
// Neuer Umzug eines Sonderwegs = neue Zeile hier (Abschnitt → altes Merkmal).
const KLAPP_ALT = { premium: 'premium_klein' };
try {
  const u = klappUebernehmen(merkmal('start_klein'), Object.fromEntries(Object.entries(KLAPP_ALT).map(([id, k]) => [id, merkmal(k)])));
  if (u.aufraeumen.length) { merke('start_klein', u.liste); u.aufraeumen.forEach(id => merke(KLAPP_ALT[id], null)); }
} catch (e) { console.warn('Startseite: Übernahme alter Klapp-Wahl fehlgeschlagen:', e.message); }

const START_IDS = (() => {
  const { ids, fehler } = ordneAbschnitte(START_ABSCHNITTE, Object.keys(START_TEILE));
  if (fehler.length) console.warn(fehler.join('\n'));
  return ids.length ? ids : Object.keys(START_TEILE); // kaputte Liste → alle Abschnitte in eingebauter Reihenfolge
})();

// Andeutungs-Ereignis höchstens einmal je Tag und Art zählen
const angedeutet = {};
function andeutungGesehen(art) {
  const k = K.tagKey(jetzt());
  if (angedeutet[art] === k) return;
  angedeutet[art] = k;
  trackEvent(art + '_teaser_seen', {});
}

function mikro(schluessel) {
  const [hid, id] = String(schluessel).split('|');
  const ids = mikroListe().filter(m => m.held === hid).map(m => m.id);
  let r;
  try { r = K.mikroUmschalten(H.ansicht(spiel, hid), jetzt(), id, ids); }
  catch (e) { hinweis = e.message; render(); return; }
  setzeStand(r.stand, hid);
  speichere();
  trackEvent(r.an ? 'mikroquest_done' : 'mikroquest_undone', { id, held: hid });
  const xp = r.ereignisse.find(e => e.typ === 'xp');
  if (xp && xp.xp > 0) {
    ui.xpFlug = xp.xp;
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) { /* optional */ }
    setTimeout(() => { ui.xpFlug = null; if (ui.screen === 'start' && !ui.feier) render(); }, 1300);
  }
  const lvl = r.ereignisse.find(e => e.typ === 'levelup');
  if (lvl) { ui.schlange.push({ art: 'levelup', level: lvl.level, titel: lvl.titel, held: hid }); if (!ui.feier) zeigeNaechstes(); return; }
  render();
}

function storyGelesenBis(nr) {
  const st = story();
  if (nr > st.gelesen) {
    for (let i = st.gelesen + 1; i <= nr; i++) trackEvent('story_part_read', { teil: i, woche: st.wocheNr });
    setzeStand(K.storyGelesen(stand, st.woche, nr));
    speichere();
  }
}

// ---------- Rendern ----------
let letzterScreen = null;
let letztesOverlay = null;
// Kein verschachteltes Neuzeichnen (Version 31): Entfernt render() ein fokussiertes Feld, löst der Browser
// „blur“/„change“ aus; ein Handler, der dann wieder render() ruft, würde mitten im Austausch zeichnen.
let rendertGerade = false, nochmalRendern = false;
function render() {
  if (rendertGerade) { nochmalRendern = true; return; }
  rendertGerade = true;
  try { renderJetzt(); }
  finally {
    rendertGerade = false;
    if (nochmalRendern) { nochmalRendern = false; render(); }
  }
}
let letzterFokus = null;
function renderJetzt() {
  document.documentElement.dataset.stil = stand.stil.aktiv;
  // Version 46: Auftritt nur bei neuem Bildschirm oder Heldenwechsel, nie bei jedem Neuzeichnen
  const auftritt = BW.auftritt && (letzterScreen !== ui.screen || letzterFokus !== spiel.fokus);
  letzterFokus = spiel.fokus;
  // Tab-Bildschirme nur, solange der Tab frei ist (z. B. nach Zeitsprung im Testprofil); noch nicht gebaute Tabs → „bald“.
  const tab = TABS.find(t => t.screen === ui.screen);
  if (tab && !tabAktiv(tab)) ui.screen = 'start';
  const fn = tab && tab.bald && tabAktiv(tab) ? () => baldScreen(tab) : (SCREENS[ui.screen] || SCREENS.start);
  // Scrollstand halten (30.10.2026): Neu zeichnen ersetzt den ganzen Bildschirm, der Browser setzte dabei die Scroll-
  // position auf 0. Wer unten etwas abhakte, landete ganz oben beim Heldenkopf. Nur ein neuer Bildschirm beginnt oben.
  const gleicherScreen = letzterScreen === ui.screen;
  const scrollVorher = gleicherScreen ? (app.querySelector('.screen')?.scrollTop || 0) : 0;
  // XP-Rückmeldung schwebt über dem sichtbaren Ausschnitt (nicht mehr im Heldenkopf, der beim Scrollen weg ist)
  const xpFlug = ui.xpFlug && ui.screen === 'start' ? `<span class="xpflug schwebend" aria-hidden="true">${ui.xpFlug > 0 ? '+' : ''}${ui.xpFlug} XP</span>` : '';
  app.innerHTML = testleiste() + fn() + tabLeiste() + xpFlug + blattHtml() + karteBlattHtml() + heldenWahlHtml() + feierHtml();
  if (scrollVorher) { const s = app.querySelector('.screen'); if (s) s.scrollTop = scrollVorher; }
  if (letzterScreen !== ui.screen) {
    app.querySelector('.screen')?.scrollTo?.(0, 0);
    const h = app.querySelector('.feier h2, .screen h1');
    if (h && letzterScreen !== null) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    letzterScreen = ui.screen;
  }
  bewegungNachZeichnen(auftritt);
  const banner = app.querySelector('.wechsel-banner');
  if (banner) setTimeout(() => banner.remove(), SM.wechsel.dauerMs); // Version 49: nur dieses Element, kein Neuzeichnen
  const key = ui.feier ? ui.feier.art + (ui.feier.bewertung || '') : ui.blatt || (ui.heldenWahl ? 'heldenwahl' : null);
  if (key && key !== letztesOverlay) app.querySelector(key === 'heldenwahl' ? '.wahl-zeile.an .wahl-info' : '.feier .cta, .feier .sc')?.focus({ preventScroll: true });
  if (!key && letztesOverlay === 'heldenwahl') app.querySelector('.wechsel-knopf')?.focus({ preventScroll: true });
  letztesOverlay = key || null;
}

// Glanz (Version 57, seit 59 aus daten/neuigkeiten.js): nur beim ersten Erscheinen einer neuen Sache, je Gerät gemerkt
// (Merkmal `glanz`: Neuigkeit → Kennung). Stil → Klasse aus daten/bewegung.js. Bei „Bewegung reduzieren“ wird nichts
// bewegt, aber trotzdem gemerkt (sonst käme die Bewegung nach dem Umschalten nachträglich).
const GLANZ = BEWEGUNG && BEWEGUNG.glanz && typeof BEWEGUNG.glanz === 'object' ? BEWEGUNG.glanz : {};
let startGlanz = []; // von SCREENS.start gesetzt: [{ id, abschnitt, stil, kennung }]
function setzeStartGlanz(g) { startGlanz = Array.isArray(g) ? g : []; } // Ansicht darf startGlanz nicht selbst schreiben (kontext.js)
function glanzNachZeichnen() {
  if (ui.screen !== 'start' || !startGlanz.length) return;
  const aktuell = {};
  const ziel = {};
  for (const g of startGlanz) {
    const el = app.querySelector(`.start-inhalt [data-abschnitt="${g.abschnitt}"]`);
    if (!el) continue; // Abschnitt zeigt gerade nichts (z. B. ausgeschaltet) → nicht als gesehen merken
    aktuell[g.id] = g.kennung;
    ziel[g.id] = { el, stil: g.stil };
  }
  const r = glanzFaellig(merkmal('glanz'), aktuell);
  if (!bewegungAus) for (const id of r.arten) {
    const klasse = GLANZ[ziel[id].stil];
    if (typeof klasse === 'string') ziel[id].el.classList.add(klasse); // unbekannter Stil: beim Start gemeldet
  }
  if (r.geaendert) merke('glanz', r.neu);
}

// Bewegung nach dem Zeichnen (Version 46). Reine Darstellung; Fehler hier dürfen nie das Spiel stören.
function bewegungNachZeichnen(auftritt) {
  try {
    if (auftritt && ui.screen === 'start') {
      app.querySelectorAll('.start-inhalt > *').forEach((el, i) => {
        el.style.setProperty('--i', String(Math.min(i, BW.maxKarten)));
        el.classList.add('auftritt');
      });
      app.querySelector('.kopf-bild')?.classList.add('auftritt-ring');
    }
    glanzNachZeichnen();
    const balken = app.querySelector('.kopf-xp i');
    if (!bewegungAus && ui.einmal.has('check') && balken && Number.isFinite(ui.xpVon)) {
      const ziel = balken.style.width;
      if (parseFloat(ziel) > ui.xpVon) { // bei Level-up (Balken springt zurück) kein Wachsen von alt nach neu
        balken.style.transition = 'none';
        balken.style.width = ui.xpVon + '%';
        void balken.offsetWidth; // Startbreite übernehmen
        balken.style.transition = '';
        balken.style.width = ziel;
      }
    }
  } catch (e) { console.warn('Bewegung:', e.message); }
  ui.einmal.clear();
  ui.xpVon = null;
}

// Fehlende Bilder → Platzhalter des Stils → Initialen (kein Leihen aus anderen Stilen)
app.addEventListener('error', e => {
  const t = e.target;
  if (t.tagName !== 'IMG') return;
  const stufe = t.dataset.stufe || '0';
  if (stufe === '0' && t.dataset.ph) { t.dataset.stufe = '1'; t.src = t.dataset.ph; }
  else if (stufe !== '2' && t.dataset.ph2) { t.dataset.stufe = '2'; t.src = t.dataset.ph2; }
}, true);

function geheZu(screen) {
  if (screen !== 'start') ui.erfolgFrisch = null; // Version 49: beim nächsten Öffnen der Startseite klein
  if (neuBereiche().includes(screen)) { alsGesehen([screen]); trackEvent('unlock_opened', { bereich: screen }); } // Version 50
  if (ui.screen !== screen) {
    trackEvent('screen_leave', { screen: ui.screen });
    trackEvent('screen_enter', { screen });
  }
  ui.screen = screen;
  ui.heldenWahl = false;
  ui.resetFrage = false;
  if (screen === 'ob4') starteAnalyse();
  render();
}

let analyseTimer = null;
function starteAnalyse() {
  clearInterval(analyseTimer);
  ui.analyseSchritt = bewegungAus ? ANALYSE_ZEILEN.length : 0;
  if (bewegungAus) return;
  analyseTimer = setInterval(() => {
    ui.analyseSchritt++;
    if (ui.analyseSchritt >= ANALYSE_ZEILEN.length) {
      clearInterval(analyseTimer);
      setTimeout(() => { if (ui.screen === 'ob4') geheZu('ob5'); }, 600);
    }
    if (ui.screen === 'ob4') render();
  }, 750);
}

function merkeAuswahl() {
  if (ui.neu) return; // Auswahl für weiteren Helden nicht als Onboarding-Stand speichern
  setzeStand({ ...stand, onboarding: { ...stand.onboarding, bereich: ui.bereich, problem: ui.problem, ziel: ui.ziel, freitext: ui.freitext } }, stand.quest ? spiel.fokus : null);
  speichere();
}

const REIHE = ['ob1', 'ob2', 'ob3', 'ob4', 'ob5', 'ob6', 'ob7', 'ob8'];

function weiter() {
  const i = REIHE.indexOf(ui.screen);
  if (i < 0) return;
  if (ui.screen === 'ob1' && (!ui.bereich || (!ui.neu && EW.istOffen(einw)))) return;
  if (ui.screen === 'ob2') {
    if (!ui.problem || (ui.problem === '*' && !ui.freitext.trim())) return;
  }
  if (ui.screen === 'ob3') {
    if (!ui.ziel || !ui.ziel.trim()) return;
    trackEvent('goal_created', { bereich: ui.bereich, problem: ui.problem, domain: (aktuelleVorlage() || {}).domain, eigen: ui.problem === '*' });
  }
  if (ui.screen === 'ob4') clearInterval(analyseTimer);
  const naechster = REIHE[i + 1];
  if (naechster === 'ob5') trackEvent('crew_received', { verbuendeter: aktuelleVorlage().held, domain: aktuelleVorlage().domain });
  if (naechster === 'ob6') trackEvent('boss_revealed', { gegner: aktuelleVorlage().gegner });
  merkeAuswahl();
  geheZu(naechster);
}

function zurueck() {
  const i = REIHE.indexOf(ui.screen);
  if (i === 0 && ui.neu) { ui.neu = false; geheZu('start'); return; }
  if (i <= 0) return;
  let ziel = REIHE[i - 1];
  if (ziel === 'ob4') ziel = 'ob3'; // Analyse beim Zurückgehen überspringen
  if (ui.screen === 'ob4') clearInterval(analyseTimer);
  geheZu(ziel);
}

function beginnen() {
  const v = aktuelleVorlage();
  if (!v) { hinweis = T('hinweis.ohneVorlage'); geheZu('ob1'); return; }
  try {
    if (ui.neu) {
      setzeSpiel(H.heldHinzufuegen(spiel, v, ui.ziel, jetzt(), zuordnung, RAMPE_NEU));
      trackEvent('hero_added', { vorlage: v.id, domain: v.domain, helden: spiel.helden.length });
    } else {
      setzeStand(K.questAnlegen(stand, v, ui.ziel, jetzt(), RAMPE_NEU), null);
    }
  } catch (e) {
    hinweis = e.message; ui.neu = false; geheZu('start'); return;
  }
  speichere();
  if (ui.neu) { ui.neu = false; geheZu('start'); return; }
  merke('onboarding_ms', Date.now() - ui.obStart);
  merke('vorlage', v.id);
  trackEvent('quest_started', { vorlage: v.id, domain: v.domain, anzahl: stand.quest.anzahl });
  trackEvent('onboarding_finished', { vorlage: v.id });
  geheZu('start');
}

function darfFragen(art) {
  const c = BEWERTUNGEN[art];
  if (!c) return false;
  const letzte = letzteBewertungTag(art);
  if (!letzte) return true;
  return Math.round((K.ausTagKey(K.tagKey(jetzt())) - K.ausTagKey(letzte)) / 864e5) >= c.abstandTage;
}

function frage(art) {
  return darfFragen(art) ? [{ art: 'frage', bewertung: art }] : [];
}

function zeigeNaechstes() {
  const war = ui.feier;
  if (war && war.art === 'sieg') { trackEvent('story_completed', {}); trackEvent('screen_enter', { screen: ui.screen }); }
  if (war && war.art === 'story') { storyGelesenBis(war.nr); trackEvent('screen_enter', { screen: ui.screen }); }
  ui.feier = ui.schlange.shift() || null;
  if (ui.feier && HOEHEPUNKTE.includes(ui.feier.art) && merkmal('hoehepunkt_tag') !== heute()) merke('hoehepunkt_tag', heute());
  if (ui.feier && FG.pauseBei.includes(ui.feier.art)) { pauseInSitzung = true; if (!freigabePauseHeute()) merke('freigabe_pause_tag', heute()); }
  if (ui.feier && ui.feier.art === 'sieg') { trackEvent('story_opened', {}); trackEvent('screen_enter', { screen: 'sieg' }); }
  if (ui.feier && ui.feier.art === 'story') { trackEvent('story_opened', { teil: ui.feier.nr }); trackEvent('screen_enter', { screen: 'story' }); }
  if (ui.feier && ui.feier.art === 'gegner') trackEvent('screen_enter', { screen: 'neuer_gegner' });
  if (war && war.art === 'gegner') trackEvent('screen_enter', { screen: ui.screen });
  if (!ui.feier && ui.danach) {
    const z = ui.danach; ui.danach = null;
    geheZu(z);
    return;
  }
  render();
}

function check(antwort) {
  let r;
  let xpVon = null;
  try { const v = K.auswertung(stand, jetzt()); xpVon = v.proLevel > 0 ? Math.round(100 * v.imLevel / v.proLevel) : null; } catch (e) { /* nur Darstellung */ }
  try { r = K.tagesCheck(stand, jetzt(), antwort); }
  catch (e) { hinweis = e.message; render(); return; }
  // Version 46: Rückmeldungen nur beim nächsten Zeichnen (Haken zeichnet sich, Segment bricht, XP wächst)
  // Version 49: großes Heldenbild nur direkt nach dem eigenen „Ja“ (nicht nach Nein oder Rückgängig)
  ui.erfolgFrisch = antwort === 'ja' ? { heroId: spiel.fokus, tag: K.tagKey(jetzt()) } : null;
  if (antwort) {
    ui.einmal.add('check');
    ui.xpVon = xpVon;
    if (r.nachher && r.vorher && r.nachher.treffer > r.vorher.treffer) ui.einmal.add('treffer');
  }
  setzeStand(r.stand);
  speichere();
  trackEvent('quest_checkin', { antwort });
  zeigeEreignisse(r, antwort);
}

// Belohnung, Sieg, Level-up und Bewertungsfragen nach einer Änderung am Stand (Tages-Check, Quest bearbeiten).
function zeigeEreignisse(r, antwort) {
  const xp = r.ereignisse.find(e => e.typ === 'xp');
  if (xp && xp.xp > 0) {
    ui.xpFlug = xp.xp;
    ui.wackeln = !bewegungAus;
    try { navigator.vibrate && navigator.vibrate(20); } catch (e) { /* optional */ }
    setTimeout(() => { ui.xpFlug = null; ui.wackeln = false; if (ui.screen === 'start' && !ui.feier) render(); }, 1300);
  }
  // Version 42: Reihenfolge und Anzahl der Einblendungen als Regeln (daten/momente.js, logik/momente.js)
  const sieg = r.ereignisse.find(e => e.typ === 'sieg');
  if (sieg) trackEvent('quest_completed', { woche: sieg.woche, gegner: sieg.gegner });
  if (sieg && sieg.neuerGegner) trackEvent('boss_revealed', { gegner: sieg.naechster, kapitel: sieg.kapitel });
  const st = story();
  const { momente: neu, weltenwahlSofort } = momenteNachCheck(
    { ereignisse: r.ereignisse, story: { neu: st.neu, nr: st.frei }, antwort, trefferVorher: r.vorher.treffer, trefferNachher: r.nachher.treffer,
      vorigeGewonnen: r.nachher.vorigeGewonnen, hoehepunktHeute: hoehepunktHeute() },
    MOMENTE, darfFragen);
  if (weltenwahlSofort) ui.danach = 'stilwahl';
  if (neu.length) {
    ui.schlange.push(...neu);
    // Version 68: erst Haken und Rückmeldung (Ablauf „tagesCheck“ in daten/bewegung.js), dann die Einblendung
    if (!ui.feier) setTimeout(() => { if (!ui.feier) zeigeNaechstes(); }, bewegungAus ? 0 : PAUSE_NACH_CHECK);
  }
  render();
}

// Quest bearbeiten (Version 38)
function questBearbeitenOeffnen() {
  if (!stand.quest || !funktionFrei('quests_bearbeiten')) return;
  ui.qe = { ziel: stand.quest.ziel, anzahl: stand.quest.anzahl, fehler: {} };
  trackEvent('quest_edit_opened', {});
  geheZu('quest_bearbeiten');
}
function questBearbeitenSpeichern() {
  const q = ui.qe;
  if (!q) return geheZu('start');
  const p = K.questPruefen(q);
  if (!p.ok) { q.fehler = p.fehler; render(); app.querySelector('[aria-invalid="true"]')?.focus(); return; }
  let r;
  try { r = K.questBearbeiten(stand, p.werte, jetzt()); }
  catch (e) { q.fehler = { ziel: e.message }; render(); return; }
  ui.qe = null;
  if (r.geaendert.length) {
    setzeStand(r.stand);
    speichere();
    trackEvent('quest_edited', { felder: r.geaendert.join(','), anzahl: r.stand.quest.anzahl });
    hinweis = T('qe.gespeichert');
  }
  geheZu('start');
  if (r.ereignisse.length) zeigeEreignisse(r, null);
}

const ZAEHLER = { crew: 'crew_besuche', boss: 'boss_besuche', faehigkeit: 'skill_besuche' };
function oeffneBlatt(art) {
  ui.blatt = art;
  if (ZAEHLER[art]) {
    const n = (merkmal(ZAEHLER[art]) || 0) + 1;
    merke(ZAEHLER[art], n);
    if (art === 'crew') { trackEvent('crew_viewed', {}); trackEvent('character_opened', {}); if (n > 1) trackEvent('crew_revisited', { n }); }
    if (art === 'boss') { trackEvent('boss_viewed', {}); if (n > 1) trackEvent('boss_revisited', { n }); }
    if (art === 'faehigkeit') trackEvent('skill_viewed', {});
  }
  trackEvent('screen_enter', { screen: art });
  render();
}

function schliesseBlatt() {
  const art = ui.blatt;
  ui.blatt = null;
  trackEvent('screen_enter', { screen: ui.screen });
  // Zweiter Besuch beim Verbündeten → Crew-Bewertung
  if (art === 'crew' && (merkmal('crew_besuche') || 0) >= 2) {
    const q = frage('crew_score');
    if (q.length) { ui.schlange.push(...q); if (!ui.feier) zeigeNaechstes(); return; }
  }
  render();
}

// ---------- Admin ----------
async function ladeAdmin() {
  ui.admin.laden = true; ui.admin.fehler = null; render();
  try {
    if (!ui.db) throw new Error(T('import.ohneDb'));
    if (!ui.istBesitzer) throw new Error(T('admin.nurBesitzer'));
    const profile = await ui.db.collection('ana').limit(500).get();
    const tester = [];
    for (const d of profile.docs) {
      const p = d.data() || {};
      const tage = {};
      const ts = await ui.db.collection(`ana/${d.id}/tage`).limit(400).get();
      for (const t of ts.docs) { const x = t.data() || {}; if (x.tag) tage[x.tag] = x; }
      tester.push({ id: d.id, profil: p.profil, istBesitzer: !!(p.merkmale && p.merkmale.ist_besitzer), erster: p.erster, merkmale: p.merkmale || {}, bewertungen: p.bewertungen || {}, feedback: p.feedback || null, tage, zuletzt: p.zuletzt, quelle: p.quelle || 'db' });
    }
    ui.admin.daten = tester;
  } catch (e) {
    ui.admin.fehler = (e && e.message) || T('admin.ladeFehler');
  }
  ui.admin.laden = false;
  render();
}

// ---------- Ereignisse ----------
// Klicks (Klick-Logik aufteilen, 30.10.2026): jede Ansicht hat ihr Register <NAME>_KLICKS (Aktion data-a → Funktion).
// Neue Ansicht = Register exportieren + eine Zeile hier. Fehler im Register (doppelt, keine Funktion) meldet der Start;
// klick.test.js verlangt, dass es keine gibt und jeder Knopf eine Aktion hat.
const KLICKS = klickRegister({ ONBOARDING_KLICKS, START_KLICKS, RAHMEN_KLICKS, FEIER_KLICKS, BLATT_KLICKS, FEEDBACK_KLICKS, EINSTELLUNGEN_KLICKS, ADMIN_KLICKS, STILWAHL_KLICKS, LOGBUCH_KLICKS, QUEST_KLICKS, STORY_KLICKS, PFLEGE_KLICKS, KARTE_KLICKS });
KLICKS.fehler.forEach(m => console.error(m));
// Fehler in einer Aktion: Spiel läuft weiter, kurzer Hinweis statt stillem Nichts (Einzelheiten in der Konsole).
function klickFehler(err, aktion) {
  console.warn(`Klick „${aktion}“:`, (err && err.message) || err);
  hinweis = T('rahmen.klickFehler');
  try { render(); } catch (e) { console.warn('Zeichnen nach Klickfehler:', e.message); }
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  verteile(KLICKS.register, b.dataset.a, { id: b.dataset.id, el: b }, { warn: m => console.warn(m), fehler: klickFehler });
});

// Ein „change“ beim Verlassen eines Feldes kommt vor dem Klick. Würde sofort neu gezeichnet, verschwände der
// angetippte Knopf unter dem Finger und der Klick ginge verloren. Deshalb erst nach dem Loslassen zeichnen.
let zeigerUnten = false, zeichnenOffen = false;
function renderNachZeiger() { if (zeigerUnten) zeichnenOffen = true; else render(); }
document.addEventListener('pointerdown', () => { zeigerUnten = true; }, true);
const zeigerLos = () => setTimeout(() => { zeigerUnten = false; if (zeichnenOffen) { zeichnenOffen = false; render(); } }, 0);
document.addEventListener('pointerup', zeigerLos, true);
document.addEventListener('pointercancel', zeigerLos, true);

// Felder (Feld-Eingaben aufteilen, 30.10.2026): change/input/Enter je Element-ID über die Register <NAME>_FELDER der
// Ansichten. Felder ohne Eintrag bleiben still (z. B. Import-Code, wird beim Klick gelesen).
const FELDER = feldRegister({ ONBOARDING_FELDER, QUEST_FELDER, FEEDBACK_FELDER, ADMIN_FELDER, PFLEGE_FELDER });
FELDER.fehler.forEach(m => console.error(m));
function feldFehler(err, id) {
  console.warn(`Eingabe „${id}“:`, (err && err.message) || err);
  hinweis = T('rahmen.klickFehler');
  try { render(); } catch (e) { console.warn('Zeichnen nach Eingabefehler:', e.message); }
}
function feld(art, e) {
  const el = e.target;
  if (!el || !el.id) return 'keins';
  return feldVerteile(FELDER, el.id, art, { el, wert: el.value, ereignis: e }, { fehler: feldFehler });
}
const hatEnter = id => { const x = feldEintrag(FELDER, id); return !!(x && x.arten.enter); };
app.addEventListener('change', e => feld('change', e));
app.addEventListener('input', e => feld('input', e));

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target && e.target.id && hatEnter(e.target.id)) { e.preventDefault(); feld('enter', e); return; }
  if (e.key !== 'Escape') return;
  if (ui.feier) { if (ui.feier.art === 'frage') bewerte(ui.feier.bewertung, null); zeigeNaechstes(); }
  else if (ui.blatt) schliesseBlatt();
  else if (ui.heldenWahl) { ui.heldenWahl = false; render(); }
});

// Setzer für veränderliche Werte, die Klick-Aktionen der Ansichten ändern dürfen (kx ist schreibgeschützt).
const finde = sel => app.querySelector(sel);
const setzeHinweis = t => { hinweis = t || null; };
const stoppeAnalyse = () => clearInterval(analyseTimer);
function zeitSprung(n) { // nur Testprofil (Testleiste)
  tagVersatz = n === 0 ? 0 : tagVersatz + n;
  weltenGezeigt = false; // Zeitsprung = wie ein neuer Besuch
  pauseInSitzung = false;
  render(); pruefeBesuchsMomente();
}

// <kontext> Namen, die die Ansichten über kx lesen (ansicht/kontext.js): veränderliche Werte (let) als Getter, der Rest fest.
// Neuer Name: hier ergänzen. Fehlt einer, meldet kx beim Zeichnen genau diesen Namen.
binde(
  { einw: () => einw, hinweis: () => hinweis, spiel: () => spiel, stand: () => stand, tabelle: () => tabelle },
  { NEU_QUELLEN, SCREENS, SM, START_IDS, T, VERSION, aktuelleVorlage, angebotFrei, weltenFrei, andeutungGesehen, bewegungAus, bezirkName, bild, bildFuer, funktionFrei, heldenAnsichten, img, istTest, jetzt, mikroListe, nameVon, neuBereiche, neuPunkte, platzhalter, setzeStartGlanz, speicher, stil, stilVorauswahl, stilWerte, story, tabAktiv, tabLabel, tabSichtbar, testerId, ui, wort,
    // Aktionen für die Klick-Register (Klick-Logik aufteilen)
    alsGesehen, beginnen, check, entscheideDaten, erstelleExport, finde, geheZu, importiere, importiereCsv, kopiereExport,
    ladeAdmin, mikro, oeffneBlatt, zeichneNachZeiger: renderNachZeiger,
    // Pflege (Pflege-Logik auslagern): Zustand, Umgebung mit Datenbank-Adapter, Bildplätze
    bildPlaetze, eingebautesBild, pflegeUmgebung, pflegeZustand,
    pruefeBesuchsMomente, questBearbeitenOeffnen, questBearbeitenSpeichern, render, schliesseBlatt, setzeHinweis, setzeSpiel, setzeStand, speichere, sperrTextVon, stoppeAnalyse,
    storyGelesenBis, teileExport, weiter, zeigeNaechstes, zeitSprung, zurueck }
);
// </kontext>

// ---------- Start ----------
// Wechsel zwischen #test, #admin und Hauptprofil bei offener Seite: neu laden, damit Profil und Ansicht stimmen.
addEventListener('hashchange', () => { try { location.reload(); } catch (e) { /* ignorieren */ } });
trackEvent('session_started', { screen: ui.screen });
if (!stand.onboarding.fertig && !stand.onboarding.bereich) trackEvent('onboarding_started', {});
if (ui.screen === 'ob4') starteAnalyse();
// Unterbrochenes Onboarding mitten in der Analyse: dort fortsetzen, wo die Auswahl vollständig ist
if (!istAdmin && !stand.onboarding.fertig && ui.bereich) {
  ui.screen = ui.ziel ? 'ob3' : ui.problem ? 'ob2' : 'ob1';
}
trackEvent('screen_enter', { screen: ui.screen });
freigabenAltbestand(); // Version 69
render();
pruefeBesuchsMomente();

// Seiten-Datenbank verbinden (nur auf claude.ai). Ohne Datenbank bleibt alles im Browser.
beiAenderung(() => { if (ui.screen === 'einstellungen') render(); });
(async () => {
  const c = window.claude;
  if (!c || typeof c.use !== 'function') { senderKandidat = VERSAND.art ? formSender(VERSAND) : null; verbindeSender(); if (istAdmin) ladeAdmin(); return; }
  try {
    const [db, user, assets] = await Promise.all([c.use('db'), c.use('user'), c.use('assets')]);
    ui.db = db;
    ui.assets = assets; // null für Betrachter ohne Bearbeitungsrecht
    abonniereTabelle(db);
    ui.istBesitzer = user ? await user.isOwner() : false;
    if (ui.istBesitzer) merke('ist_besitzer', true);
    senderKandidat = db ? dbSender(db) : null;
    verbindeSender();
  } catch (e) {
    senderKandidat = null;
    verbindeSender();
  }
  if (ui.screen === 'admin') ladeAdmin(); else render();
})();
