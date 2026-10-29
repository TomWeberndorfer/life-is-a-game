// Oberfläche: liest Daten und Logik, rendert Bildschirme, speichert nach jeder Änderung.
import * as K from './logik/kern.js';
import { TABELLE, pruefeTabelle } from './daten/vorlagen.js';
import { STILE, STIL_REIHENFOLGE, STIL_WAEHLBAR, STIL_ARCHIV_VORSCHAU, istWaehlbar, stilId, EIGENE_BILDER } from './daten/stile.js';
import { DOMAIN_RUECKFALL, LEBENSBEREICHE } from './daten/lebensbereiche.js';
import { SILHOUETTEN } from './daten/stadt.js';
import { stadtAnsicht, stadtSichtbar, STATUS } from './logik/stadt.js';
import { hoechsteStufe, istFrei, pruefeFreischaltung, neuFreigeschaltet } from './logik/freischaltung.js';
import { TABS, MAX_TABS, FUNKTIONEN, ZAEHLER as FREI_ZAEHLER } from './daten/freischaltung.js';
import * as W from './logik/weg.js';
import { TEXTE } from './daten/texte.js';
import { text as textAus, pruefeTexte } from './logik/texte.js';
import { entwicklung } from './logik/entwicklung.js';
import { logbuchEintraege, logbuchAnsicht, pruefeLogbuchArten } from './logik/logbuch.js';
import { LOGBUCH_ARTEN, LOGBUCH_FILTER, LOGBUCH_TAGE_JE_SEITE } from './daten/logbuch-arten.js';
import { momenteNachCheck, weltenwahlFaellig, pruefeMomente } from './logik/momente.js';
import { MOMENTE } from './daten/momente.js';
import { erstelleSpeicher } from './speicher.js';
import { initAnalytics, trackEvent, bewerte, letzteBewertungTag, merke, merkmal, feedback as sendeFeedback, hatFeedback, aktiveTage, analyticsStatus, beiAenderung, verbinde, dbSender, datenCode, formSender } from './analytics.js';
import * as M from './logik/kennzahlen.js';
import * as X from './logik/austausch.js';
import * as V from './logik/versand.js';
import { VERSAND } from './daten/versand.js';
import { BEWERTUNGEN, SKALA, FEEDBACK, PREMIUM, EINWILLIGUNG } from './daten/forschung.js';
import * as EW from './logik/einwilligung.js';
import * as I from './logik/inhalte.js';
import * as H from './logik/helden.js';
import { BOTSCHAFTEN, STORIES, MIKRO, MIKRO_JE_TAG, MIKRO_RUECKFALL } from './daten/inhalte.js';
import * as TB from './logik/tabelle.js';
import { pflegeHtml, formPos } from './ansicht/pflege.js';
import { START_ABSCHNITTE, HELDENKOPF, BONUS, START_MOMENTE } from './daten/startseite.js';
import { vorziehen, glanzFaellig, neuAufStart } from './logik/startseite.js';
import { NEUIGKEITEN } from './daten/neuigkeiten.js';
import { BEWEGUNG } from './daten/bewegung.js';
import { ordneAbschnitte, heldenKopf, tagesfrage, naechsterOffener, bonusAnsicht, startMomente, erfolgGroesse, wechselBanner, tabPunkte, pruefeNeuigkeiten, klappZustand, klappUmschalten } from './logik/startseite.js';

export const VERSION = { nr: 59, datum: '29.10.2026 · 11:15' };

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
  if (!ok && !hinweis) hinweis = 'Dieser Browser speichert gerade nicht. Dein Fortschritt geht beim Schließen verloren.';
}

// ---------- Helfer ----------
// Kurzes Datum „Mo, 2. Nov.“ aus einem Tagesschlüssel; versatz in Tagen (z. B. −1 = Vortag).
function kurzDatum(k, versatz = 0) {
  const d = K.ausTagKey(k);
  if (!d) return '';
  d.setDate(d.getDate() + versatz);
  return d.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short' });
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
const hatDatei = (stilId, platz) => !!((EIGENE_BILDER[stilId] || {})[platz] || (STILE[stilId] && (STILE[stilId].bilder[platz] || (platz === 'karte' && STILE[stilId].karte))));

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

// Bild für Stil, Platz und Darstellung (Version 30).
// Reihenfolge: Tabelle (Stil) → Tabelle (alle) → eingebautes Bild → Platzhalter des Stils. Kein Leihen aus anderen Stilen.
// form: 'rund' | 'quadrat' | 'breit' → eigener Ausschnitt je Darstellung, sonst gemeinsamer Ausschnitt.
function bildFuer(stilId, platz, art = 'held', form = 'breit') {
  const ph = TB.platzhalterPfad(stilId, art);
  const ein = eingebautesBild(stilId, platz);
  const tab = TB.bildAus(tabelle, stilId, platz);
  if (tab) return { src: tab.url, ph, pos: TB.posFuer(tab, form, ein ? ein.pos : TB.STANDARD_POS), quelle: 'tabelle', eintrag: tab, eingebaut: ein };
  if (ein) return { src: ein.datei, ph, pos: ein.pos, quelle: 'eingebaut', eingebaut: ein };
  return { src: ph, ph, pos: TB.STANDARD_POS, quelle: 'platzhalter', eingebaut: null };
}
const bild = (platz, text, art = 'held', form = 'breit') => bildFuer(stand.stil.aktiv, platz, art, form);
// Bild für das Story-Popup (Version 40): eigenes Story-Bild des Gegners → Bossbild (mit Platzhalter des Stils) → keins.
function storyBildPlatz(gid) {
  if (!gid) return null;
  return bild('story-' + gid, '', 'szene').quelle !== 'platzhalter' ? 'story-' + gid : 'boss-' + gid;
}

// Darstellung je CSS-Klasse; Bildstellen mit anderer Form geben `form` beim Aufruf von img() mit.
const FORM_JE_KLASSE = { rund: 'rund', 'rund-klein': 'rund', 'kopf-bild': 'rund', 'stapel-bild': 'rund', 'wahl-bild': 'rund', 'weiter-bild': 'rund', 'mikro-held': 'rund' };
const formVon = cls => String(cls).split(/\s+/).map(c => FORM_JE_KLASSE[c]).find(Boolean) || 'breit';

function img(platz, text, art, cls = '', alt = '', form = formVon(cls)) {
  const b = bild(platz, text, art, form);
  return `<img class="${cls}" src="${esc(b.src)}" data-ph="${esc(b.ph)}" data-ph2="${esc(platzhalter(text, art))}" alt="${esc(alt)}" style="object-position:${esc(b.pos)}" loading="lazy">`;
}

const ICON = {
  siegel: '<circle cx="12" cy="11" r="6"/><path d="M12 8v6M9 11h6"/><path d="M8 16l-2 5 3-1 1 3 2-4M16 16l2 5-3-1-1 3-2-4"/>',
  herz: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  menschen: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>',
  ziel: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  muenzen: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  welle: '<path d="M3 10c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/><path d="M3 15c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/>',
  sonne: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  teller: '<ellipse cx="12" cy="15" rx="9" ry="3.5"/><ellipse cx="12" cy="14.4" rx="5" ry="1.6"/><circle cx="10" cy="11" r="1.6"/><circle cx="13.6" cy="10.4" r="1.4"/>',
  schuh: '<path d="M3 16h18v3H3zM4 16l1-7h5l2 4 7 1.5V16"/>',
  mond: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  glas: '<path d="M7 4h10l-1 16H8zM7 9h10"/>',
  kalender: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  liste: '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
  zahnrad: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  zurueck: '<path d="M15 5l-7 7 7 7"/>',
  runter: '<path d="M6 9l6 6 6-6"/>',
  pfeilRechts: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  stift: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  stern: '<path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.6-.8z"/>',
  kompass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  buch: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  pfeil: '<path d="M4 18l6-6 4 4 6-8"/>',
  haus: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
  burg: '<path d="M4 20V9h3V6h3v3h4V6h3v3h3v11z"/><path d="M10 20v-5h4v5"/>',
  karte: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  schloss: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};
const icon = (n, cls = 'ic') => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ICON.stern}</svg>`;

// Einstellungen-Knopf oben rechts (eine Stelle für alle Kopfzeilen).
const einstellungenKnopf = () => `<button class="icbtn einst-btn" data-a="einstellungen" aria-label="Einstellungen" title="Einstellungen">${icon('zahnrad')}</button>`;

function fortschritt(nr) {
  return `<div class="prog" role="progressbar" aria-valuemin="1" aria-valuemax="8" aria-valuenow="${nr}" aria-label="Schritt ${nr} von 8">${Array.from({ length: 8 }, (_, i) => `<i class="${i < nr ? 'on' : ''}"></i>`).join('')}</div><span class="schritt">${nr} / 8</span>`;
}

function kopf(nr, zurueck = true, hell = false) {
  return `<div class="ob-kopf ${hell ? 'hell' : ''}">${zurueck ? `<button class="icbtn" data-a="zurueck" aria-label="Zurück">${icon('zurueck')}</button>` : '<span class="icplatz"></span>'}${fortschritt(nr)}</div>`;
}

function hinweisBox() {
  return hinweis ? `<div class="hinweis" role="status"><span>${esc(hinweis)}</span><button class="link" data-a="hinweis-weg">OK</button></div>` : '';
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
  siege: H.gesamtSiege(spiel),
  zaehler: { siege: H.gesamtSiege(spiel) } // rueckfaelle: kommt mit Sieg/Rückfall (Phase D), bis dahin 0
});
const regelFrei = r => istFrei(r, freiKontext(), m => console.warn(m), FREI_ZAEHLER);
const tabAktiv = t => regelFrei(t.frei);
// Version 50: frisch freigeschaltete Bereiche, bis sie geöffnet oder mit „Später“ bestätigt wurden (spiel.neuGesehen)
const neuBereiche = () => neuFreigeschaltet(TABS.filter(tabSichtbar), tabAktiv, spiel.neuGesehen);
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
const sperrTextVon = t => t.sperrText ? T(t.sperrText, { stadt: wort('stadt'), bereich: tabLabel(t) })
  : t.frei && t.frei.art === 'stufe' ? T('tab.stufeGesperrt', { bereich: tabLabel(t), stufe: wort('stufe'), nr: t.frei.ab })
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
    const b = I.botschaft(stand, jetzt(), aktuelleVorlage(), TABELLE, BOTSCHAFTEN, nameVon);
    return b.text && b.anlass !== 'erster_tag' ? `${spiel.fokus}:${tag}` : null;
  },
  gegner: () => { const a = K.auswertung(stand, jetzt()); return a.neuerGegner && (a.siegHeute || a.rundeTag <= 0) ? `${spiel.fokus}:${a.gegner}` : null; },
  welten: () => (stand.stil.frei && !stand.stil.angeboten ? 'offen' : null),
  // Version 59: „Neues Abenteuer?“ (kein Tab-Punkt, nur Glanz). Kennung = Zahl der Helden: nach einem neuen Helden ist
  // das nächste Angebot eine neue Sache.
  angebot: () => (H.zielAngebot(spiel) ? String(spiel.helden.length) : null)
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

function tabLeiste() {
  if (!stand.onboarding.fertig || !TABS.some(t => t.screen === ui.screen)) return '';
  const sichtbar = TABS.filter(tabSichtbar).slice(0, MAX_TABS);
  if (sichtbar.length < 2) return '';
  const neu = [...neuBereiche(), ...neuPunkte()];
  return `<nav class="tabs" aria-label="Bereiche">${sichtbar.map(t => {
    const an = ui.screen === t.screen, frei = tabAktiv(t), istNeu = neu.includes(t.screen);
    return `<button class="tab ${an ? 'an' : ''} ${frei ? '' : 'gesperrt'}${istNeu ? ' neu-tab' : ''}" data-a="tab" data-id="${t.screen}" ${an ? 'aria-current="page"' : ''} ${frei ? '' : 'aria-disabled="true"'} aria-label="${esc(tabLabel(t))}${istNeu ? esc(', ' + T('neu.tab')) : ''}"><span class="tab-ic">${icon(t.icon)}${frei ? '' : icon('schloss', 'ic tab-schloss')}${istNeu ? '<span class="tab-neu" aria-hidden="true"></span>' : ''}</span><span class="tab-nm">${esc(tabLabel(t))}</span></button>`;
  }).join('')}</nav>`;
}

// Platzhalter für freigeschaltete, aber noch nicht gebaute Bereiche (Version 27)
function baldScreen(t) {
  return `<section class="screen bald">
      <div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${einstellungenKnopf()}</div>
      <div class="inhalt mitte">
        <span class="medaille">${icon(t.icon, 'ic gross')}</span>
        <h1>${esc(T('bald.titel', { bereich: tabLabel(t) }))}</h1>
        <p class="lead">${esc(T('bald.text'))}</p>
      </div>
    </section>`;
}

// ---------- Weltenwahl als eigener Moment (Version 42) ----------
pruefeMomente(MOMENTE).forEach(m => console.warn('Momente:', m));
const SM = startMomente(START_MOMENTE); // Version 49: Erfolgsbild und Wechsel-Banner
SM.fehler.forEach(m => console.warn('Start-Momente:', m));
// Bis zur Wahl: ruhige Karte auf der Startseite. An einem späteren Tag öffnet sich die Weltenwahl einmal von selbst.
function weltenKarte() {
  if (!stand.stil.frei || stand.stil.angeboten) return '';
  return `<button class="karte welten-karte tippbar" data-a="stilwahl">
      <span class="stern-klein" aria-hidden="true">${icon('stern')}</span>
      <span class="spalte"><span class="eyebrow akzent">${esc(T('welten.eyebrow'))}</span><span class="nm">${esc(T('welten.titel'))}</span><span class="klein">${esc(T('welten.text'))}</span></span>
    </button>`;
}
let weltenGezeigt = false; // höchstens einmal je Sitzung von selbst
function pruefeWeltenwahl() {
  if (weltenGezeigt || ui.feier || ui.screen !== 'start' || !stand.onboarding.fertig) return;
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
const MIKRO_TEXTE = Object.fromEntries(Object.values(MIKRO).flat().filter(x => Array.isArray(x)).map(([id, t]) => [id, t]));
const lbWarn = m => console.warn(m);
const vorlageVonHeld = hid => { const h = H.heldVon(spiel, hid); return h && TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId); };
const gegnerName = id => (TABELLE.gegner[id] && TABELLE.gegner[id].name) || wort('gegner');
function lbTagTitel(tag) {
  const heute = K.tagKey(jetzt());
  if (tag === heute) return T('lb.heute');
  const g = K.ausTagKey(heute); g.setDate(g.getDate() - 1);
  return tag === K.tagKey(g) ? T('lb.gestern') : kurzDatum(tag);
}
// Titel und optionale zweite Zeile eines Eintrags (Texte aus dem Register, Wörter aus dem Stil)
const gross = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
function lbText(e) {
  const d = e.daten || {};
  switch (e.art) {
    case 'anwendung': {
      const v = vorlageVonHeld(e.heroId); const f = v && TABELLE.faehigkeiten[v.faehigkeit];
      return { titel: T('lb.anwendung', { Verb: gross(f ? f.verb : wort('faehigkeit')) }), detail: f ? T('lb.anwendungDetail', { faehigkeit: f.name }) : '' };
    }
    case 'nicht': return { titel: T('lb.nicht'), detail: T('lb.nichtDetail') };
    case 'mikro': return { titel: d.text ? T('lb.mikro', { text: d.text }) : T('lb.mikroOhneText'), detail: '' };
    case 'sieg': return { titel: T('lb.sieg', { gegner: gegnerName(d.gegner), sieg: wort('sieg') }), detail: '' };
    case 'kapitel': return { titel: T('lb.kapitel', { kapitel: wort('kapitel'), nr: d.nr, gegner: gegnerName(d.gegner) }), detail: '' };
    case 'start': return { titel: T('lb.start', { ziel: d.ziel || '' }), detail: '' };
    default: return { titel: T(LOGBUCH_ARTEN[e.art].text, d), detail: '' };
  }
}
function logbuchDaten() {
  try { return logbuchAnsicht(logbuchEintraege(spiel, jetzt(), { arten: LOGBUCH_ARTEN, mikroTexte: MIKRO_TEXTE, warn: lbWarn }), LOGBUCH_ARTEN, ui.lb, LOGBUCH_TAGE_JE_SEITE); }
  catch (e) { console.warn('Logbuch:', e.message); return null; }
}
const lbChip = (aktion, id, label, an) => `<button class="lb-chip ${an ? 'an' : ''}" data-a="${aktion}" data-id="${esc(id)}" aria-pressed="${an}">${label}</button>`;
function lbZeile(e, mehrereHelden) {
  const art = LOGBUCH_ARTEN[e.art];
  const t = lbText(e);
  const bildTeil = mehrereHelden ? img(e.heroId, nameVon(e.heroId), 'held', 'rund-klein', '') : '';
  return `<li class="lb-eintrag lb-g-${esc(art.gruppe)} art-${esc(e.art)}">
      <span class="lb-ic" aria-hidden="true">${icon(art.icon)}</span>
      <span class="lb-text">${esc(t.titel)}${t.detail || mehrereHelden ? `<small>${bildTeil}${esc([mehrereHelden ? nameVon(e.heroId) : '', t.detail].filter(Boolean).join(' · '))}</small>` : ''}</span>
      ${e.xp ? `<span class="lb-xp">${esc(T('lb.xp', { xp: e.xp }))}</span>` : ''}
    </li>`;
}

// Filter eingeklappt (Version 56): Standard „Alles“, die Chips erst auf Tipp. Ein aktiver Filter steht im Knopf
// und bleibt sichtbar, auch eingeklappt (sonst wirkt das Logbuch leer, ohne dass man den Grund sieht).
function lbFilterHtml(v, mehrere) {
  const gruppe = LOGBUCH_FILTER.find(f => f.id === v.filter.gruppe);
  const aktiv = [v.filter.gruppe !== 'alle' && gruppe ? T(gruppe.text) : '', mehrere && v.filter.held !== 'alle' ? nameVon(v.filter.held) : ''].filter(Boolean);
  const offen = !!ui.lb.offen;
  const knopf = `<div class="lb-filter-kopf">
      <button class="lb-chip lb-filter-knopf ${aktiv.length ? 'an' : ''}" data-a="lb-filter-klapp" aria-expanded="${offen}" aria-controls="lb-filter-feld">${icon('filter')}${esc(aktiv.length ? T('lb.filterAktiv', { filter: aktiv.join(' · ') }) : T('lb.filterKnopf'))}</button>
      ${aktiv.length ? `<button class="link lb-filter-weg" data-a="lb-filter-weg">${esc(T('lb.filterWeg'))}</button>` : ''}
    </div>`;
  if (!offen) return knopf;
  return `${knopf}<div id="lb-filter-feld" class="lb-filter-feld">
      <div class="lb-filter" role="group" aria-label="${esc(T('lb.filterArt'))}">
        ${LOGBUCH_FILTER.map(f => lbChip('lb-gruppe', f.id, esc(T(f.text)), v.filter.gruppe === f.id)).join('')}
      </div>
      ${mehrere ? `<div class="lb-filter" role="group" aria-label="${esc(T('lb.filterHeld'))}">
        ${lbChip('lb-held', 'alle', esc(T('lb.alleHelden')), v.filter.held === 'alle')}
        ${spiel.helden.map(h => lbChip('lb-held', h.heroId, `${img(h.heroId, nameVon(h.heroId), 'held', 'rund-klein', '')}${esc(nameVon(h.heroId))}`, v.filter.held === h.heroId)).join('')}
      </div>` : ''}
    </div>`;
}

// Bezirksbild: eigenes Bild → Datei des Stils → gezeichnete Silhouette (kein Leihen aus anderen Stilen)
function bezirkBild(domainId, name) {
  const platz = 'bezirk-' + domainId;
  const hatBild = TB.bildAus(tabelle, stand.stil.aktiv, platz) || hatDatei(stand.stil.aktiv, platz);
  if (hatBild) return img(platz, name, 'szene', 'bezirk-img');
  return `<svg class="bezirk-svg" viewBox="0 0 64 48" aria-hidden="true">${SILHOUETTEN[domainId] || SILHOUETTEN._standard}</svg>`;
}

// ---------- Inhalte pflegen (Version 29) ----------
const leeresFormular = () => ({ typ: 'bild', schluessel: '', stil: TB.ALLE, medium: '', datei: '', pos: TB.STANDARD_POS, formen: {}, text: '', titel: '', art: '' });
// Formular für einen Bildplatz: vorhandener Eintrag dieses Stils, sonst das eingebaute Bild als Ausgangspunkt (Version 30).
function formularFuerPlatz(stilId, platz) {
  const z = tabelle.zeilen.find(x => x.id === TB.docId(stilId, platz));
  if (z) return { form: zeileAlsFormular(z), bearbeitet: z.id };
  const ein = stilId !== TB.ALLE ? eingebautesBild(stilId, platz) : null;
  return { form: { ...leeresFormular(), typ: 'bild', schluessel: platz, stil: stilId, datei: ein ? ein.datei : '', pos: ein ? ein.pos : TB.STANDARD_POS, art: TB.artVon(platz) }, bearbeitet: null };
}
const zeileAlsFormular = z => ({ ...leeresFormular(), typ: z.typ, schluessel: z.schluessel, stil: z.stil, medium: z.medium || '', datei: z.datei || '', pos: TB.normPos(z.pos) || TB.STANDARD_POS, formen: { ...(z.formen || {}) }, text: z.text || '' });
// Schlüssel oder Stil geändert (neuer Eintrag ohne gewähltes Upload-Bild): eingebautes Bild des Platzes vorschlagen.
function eingebautVorschlagen(p) {
  if (p.bearbeitet || p.form.typ !== 'bild' || p.form.medium) return;
  const ein = p.form.stil !== TB.ALLE && p.form.schluessel ? eingebautesBild(p.form.stil, TB.normSchluessel(p.form.schluessel, 'bild')) : null;
  p.form.datei = ein ? ein.datei : '';
  if (ein) p.form.pos = ein.pos;
}
function pflegeZustand() {
  if (!ui.pflege) ui.pflege = { form: leeresFormular(), bearbeitet: null, filter: '*', fehler: [], status: '', loeschen: null, laedt: false, speichert: false, formWahl: 'alle', nurLuecken: false, uploadOffen: false };
  return ui.pflege;
}
const pflegeKontext = () => ({ stile: STIL_REIHENFOLGE, medien: tabelle.medien, standardTexte: TEXTE });
const dbFehlerText = e => (e && e.code === 'permission_denied' ? 'Keine Berechtigung (nur der Besitzer darf die Tabelle ändern).'
  : e && e.code === 'quota_exceeded' ? 'Speicher der Seite ist voll.'
  : (e && e.message) || 'Unbekannter Fehler');

async function pflegeSpeichern() {
  const p = pflegeZustand();
  const r = TB.neueZeile(p.form, pflegeKontext());
  p.status = '';
  if (r.fehler) { p.fehler = r.fehler; render(); return; }
  // Version 32: unbekannter Bildplatz → einmal nachfragen (zweites Tippen speichert trotzdem)
  const chk = TB.schluesselPruefen(r.zeile.schluessel, r.zeile.typ, bildPlaetze());
  if (r.zeile.typ === 'bild' && !chk.bekannt && p.unbekanntFrage !== r.zeile.schluessel) {
    p.unbekanntFrage = r.zeile.schluessel; p.fehler = []; render(); return;
  }
  p.unbekanntFrage = null;
  p.fehler = []; p.speichert = true; render();
  try {
    await ui.db.doc('inhalte/' + r.id).set({ ...r.zeile, geaendert: new Date().toISOString() });
    // Schlüssel oder Stil beim Bearbeiten geändert: alte Zeile entfernen, sonst gäbe es zwei
    if (p.bearbeitet && p.bearbeitet !== r.id) await ui.db.doc('inhalte/' + p.bearbeitet).delete();
    p.status = `Gespeichert: ${r.zeile.schluessel} (${r.zeile.stil === TB.ALLE ? 'alle Stile' : STILE[r.zeile.stil].name}).`;
    p.form = { ...leeresFormular(), typ: r.zeile.typ, stil: r.zeile.stil }; p.formWahl = 'alle';
    p.bearbeitet = null;
  } catch (e) { p.fehler = ['Nicht gespeichert: ' + dbFehlerText(e)]; }
  p.speichert = false; render();
}

async function pflegeHochladen(datei) {
  const p = pflegeZustand();
  p.fehler = []; p.status = '';
  if (!datei) return;
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(datei.type)) { p.fehler = ['Nur PNG, JPG, WebP oder SVG.']; render(); return; }
  if (datei.size > (datei.type === 'image/svg+xml' ? 2 : 20) * 1024 * 1024) { p.fehler = ['Die Datei ist zu groß (Bilder bis 20 MB, SVG bis 2 MB).']; render(); return; }
  if (!ui.assets) { p.fehler = ['Hochladen ist hier nicht möglich.']; render(); return; }
  const art = TB.ARTEN.includes(p.form.art) ? p.form.art : TB.artVon(p.form.schluessel);
  const titel = (p.form.titel || datei.name.replace(/\.[^.]+$/, '')).slice(0, TB.GRENZEN.titel);
  p.laedt = true; render();
  try {
    const up = await ui.assets.upload(datei);
    await ui.db.doc('medien/' + up.id).set({ asset: up.id, art, titel, erstellt: new Date().toISOString() });
    p.form.medium = up.id; p.form.datei = ''; p.form.titel = ''; p.uploadOffen = false;
    p.status = `Hochgeladen: ${titel}. Jetzt Schlüssel und Stil wählen und speichern.`;
  } catch (e) { p.fehler = ['Hochladen fehlgeschlagen: ' + dbFehlerText(e)]; }
  p.laedt = false; render();
}

// ----- Medienliste (Version 31) -----
async function medienSpeichern(id) {
  const p = pflegeZustand();
  const r = TB.medienAenderung(p.medienForm);
  p.status = '';
  if (r.fehler) { p.fehler = r.fehler; render(); return; }
  try {
    await ui.db.doc('medien/' + id).update(r.daten);
    p.medienBearbeitet = null; p.fehler = []; p.status = 'Gespeichert.';
  } catch (e) { p.fehler = ['Nicht gespeichert: ' + dbFehlerText(e)]; }
  render();
}

async function medienLoeschen(id) {
  const p = pflegeZustand();
  p.status = ''; p.fehler = [];
  if (!TB.darfLoeschen(tabelle, id)) { p.medienLoeschen = null; p.fehler = ['Dieses Bild wird noch verwendet und kann nicht gelöscht werden.']; render(); return; }
  if (p.medienLoeschen !== id) { p.medienLoeschen = id; render(); return; }
  p.medienLoeschen = null;
  try {
    // Erst die Datei, dann der Eintrag: scheitert die Datei, bleibt alles sichtbar und kann erneut gelöscht werden.
    if (ui.assets) {
      try { await ui.assets.delete(id); }
      catch (e) { if (!e || e.code !== 'not_found') throw e; } // Datei schon weg: Eintrag trotzdem entfernen
    }
    await ui.db.doc('medien/' + id).delete();
    p.status = 'Bild gelöscht.';
  } catch (e) { p.fehler = ['Nicht gelöscht: ' + dbFehlerText(e)]; }
  render();
}

async function pflegeLoeschen(id) {
  const p = pflegeZustand();
  if (p.loeschen !== id) { p.loeschen = id; render(); return; }
  p.loeschen = null;
  try { await ui.db.doc('inhalte/' + id).delete(); p.status = 'Eintrag gelöscht. Das Bild bleibt in der Medien-Tabelle.'; p.fehler = []; }
  catch (e) { p.fehler = ['Nicht gelöscht: ' + dbFehlerText(e)]; }
  render();
}

function pflegeBearbeiten(id) {
  const p = pflegeZustand();
  const z = tabelle.zeilen.find(x => x.id === id);
  if (!z) return;
  p.form = zeileAlsFormular(z);
  p.bearbeitet = id; p.formWahl = 'alle'; p.fehler = []; p.status = ''; p.loeschen = null;
  render();
  app.querySelector('#pf-form')?.scrollIntoView({ block: 'start' });
}

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
  const fehler = name => e => console.warn(`Inhalte-Tabelle (${name}) nicht geladen: ${dbFehlerText(e)}`);
  db.collection('medien').limit(1000).onSnapshot(s => { roh.medien = aus(s); geladen.medien = true; neu(); }, fehler('medien'));
  db.collection('inhalte').limit(1000).onSnapshot(s => { roh.inhalte = aus(s); geladen.inhalte = true; neu(); }, fehler('inhalte'));
}

const SCREENS = {
  pflege() {
    if (!ui.istBesitzer) return SCREENS.einstellungen();
    return pflegeHtml({
      esc, icon, index: tabelle, p: pflegeZustand(),
      stile: STIL_REIHENFOLGE.map(id => ({ id, name: STILE[id].name })),
      plaetze: bildPlaetze(), standardTexte: TEXTE, bildFuer, eingebautesBild,
      eingebaut: stilId => bildPlaetze().map(platz => ({ platz, ...eingebautesBild(stilId, platz) })).filter(b => b.datei).map(b => ({ ...b, eigen: b.datei.startsWith('/_blob/') })),
      kannHochladen: !!ui.assets, verbunden: !!ui.db
    });
  },
  ob1() {
    const bereiche = TABELLE.gruppen.filter(b => b.onboarding);
    return `<section class="screen">
      <div class="ob-bild klein">${img('szene', 'Life is a Game', 'szene', 'cover')}<div class="verlauf"></div></div>
      <div class="ob-kopf ueber">${ui.neu ? `<button class="icbtn hell-btn" data-a="zurueck" aria-label="Abbrechen">${icon('zurueck')}</button>` : '<span class="icplatz"></span>'}${fortschritt(1)}</div>
      <div class="inhalt">
        ${ui.neu ? `<h1>Ein neues Abenteuer</h1>
        <p class="lead">Ein weiterer Held kommt dazu. Wähle den Lebensbereich, in dem er dich begleiten soll.</p>`
        : `<h1>Willkommen bei Life is a Game</h1>
        <p class="lead">Jeder Mensch hat Ziele. Jeder Mensch hat Hindernisse. Wir machen aus deinen Herausforderungen ein Abenteuer, Schritt für Schritt.</p>`}
        <p class="frage" id="f1">Welchen Bereich möchtest du als Erstes verbessern?</p>
        <div class="optionen" role="group" aria-labelledby="f1">
          ${bereiche.map(b => bereichBelegt(b.id)
            ? `<button class="opt belegt" disabled>${icon(b.icon)}<span>${esc(b.name)}<small>Held schon dabei</small></span></button>`
            : `<button class="opt ${ui.bereich === b.id ? 'sel' : ''}" aria-pressed="${ui.bereich === b.id}" data-a="bereich" data-id="${b.id}">${icon(b.icon)}<span>${esc(b.name)}</span></button>`).join('')}
        </div>
        ${ui.neu ? '' : einwKarte(true)}
      </div>
      <div class="fuss"><button class="cta" data-a="weiter" ${ui.bereich && (ui.neu || !EW.istOffen(einw)) ? '' : 'disabled'}>Weiter</button></div>
    </section>`;
  },

  logbuch() {
    const tab = TABS.find(t => t.screen === 'logbuch');
    const v = logbuchDaten();
    if (v && v.korrigiert.length) ui.lb = { ...ui.lb, ...v.filter }; // unbekannter Filter → „Alles“
    const mehrere = spiel.helden.length > 1;
    const kopfHtml = `<div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${einstellungenKnopf()}</div>`;
    if (!v) return `<section class="screen logbuch">${kopfHtml}<div class="inhalt"><h1>${esc(tab ? tabLabel(tab) : 'Logbuch')}</h1><p class="lead">${esc(T('lb.leer'))}</p></div></section>`;
    return `<section class="screen logbuch">
      ${kopfHtml}
      <div class="inhalt start-inhalt">
        <div><span class="eyebrow">${esc(T('lb.eyebrow'))}</span>
        <h1>${esc(tab ? tabLabel(tab) : 'Logbuch')}</h1>
        <p class="klein">${esc(T('lb.intro'))}</p>
        ${v.seit ? `<p class="klein lb-seit">${esc(T('lb.seit', { datum: kurzDatum(v.seit), n: v.gesamt }))}</p>` : ''}</div>
        ${lbFilterHtml(v, mehrere)}
        ${v.tage.length ? v.tage.map(t => `<section class="lb-tag" aria-label="${esc(lbTagTitel(t.tag))}">
            <h2 class="lb-tag-kopf"><span>${esc(lbTagTitel(t.tag))}</span>${t.xp ? `<span class="lb-xp">${esc(T('lb.xp', { xp: t.xp }))}</span>` : ''}</h2>
            <ul class="lb-liste">${t.eintraege.map(e => lbZeile(e, mehrere && v.filter.held === 'alle')).join('')}</ul>
          </section>`).join('') : `<p class="klein mitte-text">${esc(T('lb.leer'))}</p>`}
        ${v.mehr ? `<button class="btn lb-mehr" data-a="lb-mehr">${esc(T('lb.mehr'))}</button>` : ''}
      </div>
    </section>`;
  },

  stadt() {
    if (!stadtSichtbar(spiel)) { ui.screen = 'start'; return SCREENS.start(); }
    let bezirke;
    try { bezirke = stadtAnsicht(spiel, LEBENSBEREICHE); }
    catch (e) { console.warn('Stadt:', e.message); bezirke = []; }
    const entsteht = bezirke.filter(b => b.status === STATUS.entsteht);
    return `<section class="screen stadt">
      <div class="start-kopf"><span class="datum">${esc(kurzDatum(K.tagKey(jetzt())))}</span>${einstellungenKnopf()}</div>
      <div class="inhalt start-inhalt">
        <div><span class="eyebrow">${esc(T('stadt.eyebrow', { STADT: wort('stadt').toUpperCase() }))}</span>
        <h1>${esc(T('stadt.titel', { stadtname: wort('stadtname') }))}</h1>
        <p class="klein">${esc(T('stadt.intro', { bezirk: wort('bezirk') }))}</p></div>
        <div class="skyline" aria-hidden="true">${bezirke.map(b => `<span class="sky ${b.status}">${bezirkBild(b.domainId, b.name)}</span>`).join('')}</div>
        <ul class="bezirke" aria-label="${esc(wort('bezirk'))}e">
          ${bezirke.map(b => `<li class="bezirk ${b.status}">
            <span class="bezirk-bild">${bezirkBild(b.domainId, b.name)}</span>
            <b>${esc(bezirkName(b.domainId, b.name))}</b>
            <span>${esc(b.status === STATUS.entsteht ? T('bezirk.entsteht', { helden: b.helden.map(nameVon).join(', ') }) : T('bezirk.unentdeckt'))}</span>
          </li>`).join('')}
        </ul>
        <p class="klein mitte-text">${entsteht.length ? esc(T('stadt.fuss', { bezirk: wort('bezirk') })) : ''}</p>
      </div>
    </section>`;
  },

  ob2() {
    const b = TABELLE.gruppen.find(x => x.id === ui.bereich);
    const probleme = TABELLE.probleme[ui.bereich] || [];
    const anders = ui.problem === '*';
    return `<section class="screen">
      ${kopf(2)}
      <div class="inhalt">
        <span class="chip">${esc(b ? b.name : '')}</span>
        <h1>Was fällt dir aktuell am schwersten?</h1>
        <p class="lead">Wähle das, was dich gerade am meisten beschäftigt.</p>
        <div class="optionen" role="group" aria-label="Herausforderung">
          ${probleme.map(p => problemBelegt(ui.bereich, p.id)
            ? `<button class="opt belegt" disabled><span>${esc(p.text)}<small>${esc(nameVon(K.vorlageFuer(TABELLE, ui.bereich, p.id).held))} ist schon dabei</small></span></button>`
            : `<button class="opt ${ui.problem === p.id ? 'sel' : ''}" aria-pressed="${ui.problem === p.id}" data-a="problem" data-id="${p.id}"><span>${esc(p.text)}</span></button>`).join('')}
          ${problemBelegt(ui.bereich, '*') ? '' : `<button class="opt leise ${anders ? 'sel' : ''}" aria-pressed="${anders}" data-a="problem" data-id="*"><span>Etwas anderes …</span></button>`}
        </div>
        ${anders ? `<label class="feld"><span>Was ist es?</span><input id="freitext" maxlength="120" value="${esc(ui.freitext)}" placeholder="Zum Beispiel: Ich komme morgens schlecht aus dem Bett" autocomplete="off"></label>` : ''}
      </div>
      <div class="fuss"><button class="cta" data-a="weiter" ${ui.problem && (!anders || ui.freitext.trim()) ? '' : 'disabled'}>Weiter</button></div>
    </section>`;
  },

  ob3() {
    const p = (TABELLE.probleme[ui.bereich] || []).find(x => x.id === ui.problem);
    const ziele = p ? p.ziele : [];
    const eigen = ui.problem === '*';
    return `<section class="screen">
      ${kopf(3)}
      <div class="inhalt">
        <h1 class="mittel">Welche Veränderung hätte gerade den größten positiven Einfluss auf dein Leben?</h1>
        ${eigen ? `<label class="feld"><span>Dein Ziel in wenigen Worten</span><input id="zieltext" maxlength="120" value="${esc(ui.ziel || '')}" placeholder="Zum Beispiel: Morgens pünktlich aufstehen" autocomplete="off"></label>`
          : `<div class="optionen" role="group" aria-label="Ziel">${ziele.map(z => `<button class="opt ${ui.ziel === z ? 'sel' : ''}" aria-pressed="${ui.ziel === z}" data-a="ziel" data-id="${esc(z)}">${ui.ziel === z ? icon('check') : ''}<span>${esc(z)}</span></button>`).join('')}</div>`}
        <div class="notiz">${icon('buch')}<p>Für den Start konzentrieren wir uns auf eine Hauptquest. Weitere Ziele kannst du später hinzufügen.</p></div>
      </div>
      <div class="fuss"><button class="cta" data-a="weiter" ${ui.ziel && ui.ziel.trim() ? '' : 'disabled'}>Das ist mein Ziel</button></div>
    </section>`;
  },

  ob4() {
    const zeilen = ['Bereich wird untersucht …', 'Verbündeter wird gesucht …', 'Hindernisse werden erkannt …', 'Abenteuer wird vorbereitet …'];
    const fertig = ui.analyseSchritt >= zeilen.length;
    return `<section class="screen analyse">
      <div class="ob-kopf"><span class="icplatz"></span>${fortschritt(4)}</div>
      <div class="inhalt mitte">
        <div class="ring ${fertig ? 'still' : ''}" aria-hidden="true"><svg viewBox="0 0 190 190"><circle cx="95" cy="95" r="88" class="r1"/><circle cx="95" cy="95" r="74" class="r2"/></svg><span>${icon('kompass', 'ic gross')}</span></div>
        <h1>Dein Abenteuer entsteht</h1>
        <ul class="analyse-liste" role="status" aria-live="polite">
          ${zeilen.map((z, i) => `<li class="${i < ui.analyseSchritt ? 'ok' : i === ui.analyseSchritt ? 'jetzt' : ''}"><span class="dot">${i < ui.analyseSchritt ? icon('check') : ''}</span>${z}</li>`).join('')}
        </ul>
      </div>
      <div class="fuss">${fertig ? '<button class="cta" data-a="weiter">Weiter</button>' : '<button class="link" data-a="weiter">Überspringen</button>'}</div>
    </section>`;
  },

  ob5() {
    const v = aktuelleVorlage();
    const vb = TABELLE.helden[v.held];
    return `<section class="screen">
      <div class="ob-bild gross">${img(v.held, vb.name, 'held', 'cover', `${nameVon(v.held)}, ${vb.rolle}`)}<div class="verlauf dunkel-oben"></div></div>
      ${kopf(5, true, true).replace('ob-kopf', 'ob-kopf ueber')}
      <div class="inhalt hoch">
        <span class="chip gut">DEIN ${esc(wort('verbuendeter').toUpperCase())}</span>
        <div><h1 class="name">${esc(nameVon(v.held))}</h1><p class="rolle">${esc(vb.rolle)}</p></div>
        <p class="lead">${esc(nameVon(v.held))} hilft Menschen dabei:</p>
        <ul class="haken">${vb.hilft.map(h => `<li>${icon('check')}${esc(h)}</li>`).join('')}</ul>
        <p class="stark">${esc(nameVon(v.held))} begleitet dich auf deiner ${ui.neu ? 'neuen' : 'ersten'} Quest.</p>
      </div>
      <div class="fuss"><button class="cta" data-a="weiter">Weiter</button></div>
    </section>`;
  },

  ob6() {
    const v = aktuelleVorlage();
    const g = TABELLE.gegner[v.gegner];
    return `<section class="screen dunkel">
      ${kopf(6, true, true)}
      <div class="inhalt">
        <span class="chip schlecht">DEIN AKTUELLES HINDERNIS</span>
        <div class="boss-bild">${img('boss-' + v.gegner, g.name, 'boss', 'cover', g.name)}</div>
        <h1 class="name">${esc(g.name)}</h1>
        <div class="kraft"><span>KRAFT</span><div class="balken boss"><i style="width:100%"></i></div></div>
        <p class="lead">${esc(g.text)}</p>
        <div class="zwei">
          <div class="box schlecht"><b>WIRD STÄRKER</b>${esc(g.staerker)}</div>
          <div class="box gut"><b>VERLIERT KRAFT</b>${esc(g.schwaecher)}</div>
        </div>
      </div>
      <div class="fuss"><button class="cta rot" data-a="weiter">Wie besiege ich ${/^Die /.test(g.name) ? 'sie' : /^Das /.test(g.name) ? 'es' : 'ihn'}?</button></div>
    </section>`;
  },

  ob7() {
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    return `<section class="screen">
      ${kopf(7)}
      <div class="inhalt">
        <p class="eyebrow mitte-text">${esc(wort('faehigkeit').toUpperCase())} FREIGESCHALTET</p>
        <div class="karte faehigkeit erscheint">
          <span class="medaille">${icon(f.icon, 'ic gross')}</span>
          <h1 class="name">${esc(f.name)}</h1>
          <p class="wenn">${esc(f.wenn)}</p>
          <ul class="haken">${f.schritte.map(s => `<li>${icon('check')}${esc(s)}</li>`).join('')}</ul>
        </div>
        <div class="gegen">${img('boss-' + v.gegner, g.name, 'boss', 'rund')}<span>Besonders wirksam gegen ${esc(g.name.replace(/^(Der|Die|Das) /, m => ({ 'Der ': 'den ', 'Die ': 'die ', 'Das ': 'das ' }[m])))}.</span></div>
      </div>
      <div class="fuss"><button class="cta" data-a="weiter">Weiter</button></div>
    </section>`;
  },

  ob8() {
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    const n = v.quest.anzahl;
    return `<section class="screen">
      <div class="ob-bild mittel">${img('banner-' + v.held, 'Quest', 'szene', 'cover')}<div class="verlauf dunkel-oben"></div></div>
      ${kopf(8, true, true).replace('ob-kopf', 'ob-kopf ueber')}
      <div class="inhalt hoch">
        <div class="karte quest">
          <span class="eyebrow">${esc(wort('woche').toUpperCase())}</span>
          <h1 class="mittel">Wende „${esc(f.name)}“ diese Woche ${n === 1 ? 'einmal' : `mindestens ${n}-mal`} an.</h1>
          <div class="siegel-reihe" aria-label="0 von ${n} erledigt">${Array.from({ length: n }, (_, i) => `<span class="siegel">${i + 1}</span>`).join('')}</div>
          <p class="klein mitte-text">0 von ${n} · bis Sonntag</p>
        </div>
        <p class="eyebrow">BELOHNUNG</p>
        <ul class="belohnung">
          <li><span class="rund-ic gut">${icon('pfeil')}</span>Fortschritt für dein Ziel</li>
          <li>${img('boss-' + v.gegner, g.name, 'boss', 'rund')}Schaden gegen ${esc(g.name.replace(/^(Der|Die|Das) /, m => ({ 'Der ': 'den ', 'Die ': 'die ', 'Das ': 'das ' }[m])))}</li>
          <li>${img(v.held, nameVon(v.held), 'held', 'rund')}Erfahrung für ${esc(nameVon(v.held))}</li>
        </ul>
      </div>
      <div class="fuss"><button class="cta" data-a="beginnen">Abenteuer beginnen</button></div>
    </section>`;
  },

  start() {
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    const a = K.auswertung(stand, jetzt());
    const datum = jetzt().toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'short' });
    const ctx = { v, f, g, a };
    // Version 43: Reihenfolge aus daten/startseite.js; ein kaputter Abschnitt bricht nicht die ganze Seite.
    const k = klapp();
    // Version 59: Neuigkeiten aus EINER Quelle (daten/neuigkeiten.js): höchstens eine rückt vor, alle glänzen einmal.
    const neu = neuAufStart(NEUIGKEITEN, NEU_QUELLEN);
    startGlanz = neu.glanz;
    const reihe = neu.vor ? vorziehen(START_IDS, [{ id: neu.vor.abschnitt, vorziehen: { nach: neu.vor.nach } }], { [neu.vor.abschnitt]: true }) : { ids: START_IDS };
    const teile = reihe.ids.map(id => {
      try { return markiere(mitKlappe(id, START_TEILE[id](ctx), ctx, k), id); }
      catch (e) {
        console.warn(`Startseite: Abschnitt ${id}:`, e.message);
        // Version 55: im Testprofil sichtbar machen (sonst fällt ein fehlender Abschnitt nicht auf, siehe Version 54)
        return istTest ? `<div class="hinweis test-fehler" role="alert"><span>Testprofil: Abschnitt „${esc(id)}“ konnte nicht angezeigt werden (${esc(e.message)}).</span></div>` : '';
      }
    }).join('');
    return `<section class="screen start">
      <div class="start-kopf"><span class="datum">${esc(datum)}</span>${einstellungenKnopf()}</div>
      <div class="inhalt start-inhalt">${teile}</div>
      <div class="start-fuss">${stand.stil.frei ? `<button class="link" data-a="stilwahl">${icon('stern')} Neue Welten freigeschaltet · Stil wählen</button>` : 'Weitere Bereiche öffnen sich nach dem ersten Sieg.'}<span class="version">Version ${VERSION.nr} · ${VERSION.datum}</span></div>
    </section>`;
  },

  // Quest bearbeiten (Version 38): Ziel-Text und Anzahl je Runde, gilt sofort.
  quest_bearbeiten() {
    if (!stand.quest || !ui.qe) { ui.screen = 'start'; return SCREENS.start(); }
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    const a = K.auswertung(stand, jetzt());
    const q = ui.qe;
    const anz = Number(q.anzahl);
    const sofortSieg = !a.siegHeute && anz < a.anzahl && a.wocheZaehler >= anz;
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="qe-abbrechen">${icon('zurueck')} ${esc(T('qe.abbrechen'))}</button></div>
      <div class="inhalt">
        <span class="eyebrow akzent">${esc(nameVon(v.held).toUpperCase())}</span>
        <h1>${esc(T('qe.titel', { quest: wort('quest') }))}</h1>
        <label class="feld"><span>${esc(T('qe.ziel'))}</span><input id="qe-ziel" maxlength="${K.ZIEL_MAX}" value="${esc(q.ziel)}" autocomplete="off" ${q.fehler.ziel ? 'aria-invalid="true" aria-describedby="qe-ziel-f"' : ''}></label>
        ${q.fehler.ziel ? `<p class="fehler" id="qe-ziel-f" role="alert">${esc(q.fehler.ziel)}</p>` : ''}
        <div class="feld"><span id="qe-anz-l">${esc(T('qe.anzahl'))}</span>
          <div class="wahl qe-anzahl" role="group" aria-labelledby="qe-anz-l">${Array.from({ length: K.ANZAHL_MAX - K.ANZAHL_MIN + 1 }, (_, i) => i + K.ANZAHL_MIN).map(n => `<button class="opt kurz ${anz === n ? 'sel' : ''}" aria-pressed="${anz === n}" data-a="qe-anzahl" data-id="${n}">${n}</button>`).join('')}</div>
        </div>
        ${q.fehler.anzahl ? `<p class="fehler" role="alert">${esc(q.fehler.anzahl)}</p>` : ''}
        <p class="klein">${esc(T('qe.anzahlHilfe', { faehigkeit: f.name, anzahl: anz || '?' }))}</p>
        <p class="klein">${esc(T('qe.sofort', { geschafft: a.wocheZaehler }))}</p>
        ${sofortSieg ? `<div class="notiz" role="status">${icon('stern')}<p>${esc(T('qe.siegHinweis', { gegner: g.name, sieg: wort('sieg') }))}</p></div>` : ''}
        <p class="klein">${esc(T('qe.festHinweis', { faehigkeit: wort('faehigkeit') }))}</p>
      </div>
      <div class="fuss"><button class="cta" data-a="qe-speichern">${esc(T('qe.speichern'))}</button></div>
    </section>`;
  },

  stilwahl() {
    const sel = stilVorauswahl();
    const g = TABELLE.gegner[aktuelleVorlage().gegner];
    return `<section class="screen stilwahl dunkel">
      <div class="inhalt mitte stilwahl-inhalt">
        <div class="stil-kopf">
          <span class="stern-klein erscheint" aria-hidden="true">${icon('stern')}</span>
          <div class="stil-kopf-text">
            <span class="chip gut">${esc(g.kurz.toUpperCase())} BESIEGT</span>
            <h1 class="stil-titel">Neue Welten freigeschaltet</h1>
          </div>
        </div>
        <p class="lead">Wähle deine Welt</p>
        <div class="welten" role="group" aria-label="Stil">
          ${STIL_REIHENFOLGE.map(id => {
            const frei = istWaehlbar(id);
            const zusatz = stand.stil.aktiv === id ? ' · aktiv' : (frei ? '' : ' · bald');
            return `<button class="welt ${sel === id ? 'sel' : ''} ${frei ? '' : 'gesperrt'}" ${frei ? `aria-pressed="${sel === id}"` : 'disabled aria-disabled="true"'} data-a="stil" data-id="${id}"><img src="${esc((TB.bildAus(tabelle, id, 'karte') || {}).url || STILE[id].karte)}" data-ph="${esc(TB.platzhalterPfad(id, 'szene'))}" data-ph2="${esc(platzhalter(STILE[id].name, 'szene'))}" alt="">${frei ? '' : `<span class="welt-schloss" aria-hidden="true">${icon('schloss')}</span>`}<span>${esc(STILE[id].name)}${zusatz}</span></button>`;
          }).join('')}
          ${STIL_ARCHIV_VORSCHAU.map(w => `<button class="welt gesperrt" disabled aria-disabled="true"><img src="${esc(platzhalter(w.name, 'szene'))}" alt=""><span class="welt-schloss" aria-hidden="true">${icon('schloss')}</span><span>${esc(w.name)} · bald</span></button>`).join('')}
        </div>
      </div>
      <div class="fuss">
        <p class="klein mitte-text">Der Stil verändert nur die Darstellung. Ziel, Fähigkeit und Fortschritt bleiben gleich.</p>
        <button class="cta" data-a="stil-uebernehmen">Welt übernehmen</button>
        <button class="link" data-a="stil-spaeter">Später</button>
      </div>
    </section>`;
  },

  feedback() {
    const wahlBtn = (q, w, label) => `<button class="opt kurz ${ui.fb[q] === w ? 'sel' : ''}" aria-pressed="${ui.fb[q] === w}" data-a="fb-wahl" data-id="${q}:${w}">${esc(label)}</button>`;
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} Zurück</button></div>
      <div class="inhalt">
        <h1>Deine Meinung</h1>
        <p class="lead">Fünf kurze Fragen. Es gibt keine falschen Antworten.</p>
        ${FEEDBACK.fragen.map(q => q.art === 'text'
          ? `<label class="feld"><span>${esc(q.text)}</span><textarea id="fb-${q.id}" maxlength="600" rows="3">${esc(ui.fb[q.id] || '')}</textarea></label>`
          : `<div class="feld"><span id="fbq-${q.id}">${esc(q.text)}</span><div class="wahl" role="group" aria-labelledby="fbq-${q.id}">${FEEDBACK.wahl.map(([w, l]) => wahlBtn(q.id, w, l)).join('')}</div></div>`).join('')}
        ${ui.fbFehler ? '<p class="fehler" role="alert">Bitte beantworte die beiden Ja/Nein-Fragen.</p>' : ''}
      </div>
      <div class="fuss"><button class="cta" data-a="feedback-senden">Absenden</button></div>
    </section>`;
  },

  admin() {
    const A = ui.admin;
    const kopf = `<div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} Zur App</button><button class="btn klein-btn" data-a="admin-neu">Aktualisieren</button></div>`;
    if (A.laden && !A.daten) return `<section class="screen admin">${kopf}<div class="inhalt"><h1>Auswertung</h1><p class="lead" role="status">Daten werden geladen …</p>${importHtml()}</div></section>`;
    if (A.fehler) return `<section class="screen admin">${kopf}<div class="inhalt"><h1>Auswertung</h1><p class="fehler" role="alert">${esc(A.fehler)}</p>${importHtml()}</div></section>`;
    if (!A.daten) return `<section class="screen admin">${kopf}<div class="inhalt"><h1>Auswertung</h1><p class="lead">Noch nicht geladen.</p>${importHtml()}</div></section>`;
    const heute = K.tagKey(new Date());
    const t = M.filtere(A.daten, { testprofile: A.test, besitzer: A.besitzer });
    const g = M.grundzahlen(t, heute);
    const h = M.heroEngagement(t);
    const tr = M.trichter(t);
    const rk = M.featureRanking(t);
    const er = M.erkenntnisse(t, heute);
    const fb = M.feedbackAuswertung(t);
    const kp = M.kapitel(t);
    const lb = M.lebensbereiche(t);
    const lbName = id => (LEBENSBEREICHE.find(d => d.id === id) || { name: id }).name;
    const { pct, minSek } = M.format;
    const kachel = (l, v, s) => `<div class="kachel"><span class="eyebrow">${l}</span><span class="zahl">${v}</span><span class="klein">${s}</span></div>`;
    const balken = (l, w, txt) => `<div class="bz"><span>${esc(l)}</span><div class="balken"><i style="width:${Math.max(0, Math.min(100, Math.round(w)))}%"></i></div><b>${txt}</b></div>`;
    const ret = x => (x.wert === null ? `–` : pct(x.wert));
    const maxT = Math.max(1, ...tr.schritte.map(s => s.anzahl));
    const komma = x => (x === null || x === undefined ? '–' : x.toFixed(1).replace('.', ','));
    return `<section class="screen admin">${kopf}
      <div class="inhalt">
        <h1>Auswertung Testphase</h1>
        <p class="klein">App-Version ${VERSION.nr} · ${VERSION.datum}</p>
        <p class="klein">${A.daten.length} Profile geladen · Stand ${new Date().toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })}</p>
        <div class="filter">
          <button class="opt kurz ${A.test ? 'sel' : ''}" aria-pressed="${A.test}" data-a="admin-test">Testprofile einbeziehen</button>
          <button class="opt kurz ${A.besitzer ? 'sel' : ''}" aria-pressed="${A.besitzer}" data-a="admin-besitzer">Eigene Daten einbeziehen</button>
        </div>
        ${importHtml()}
        <div class="kacheln">
          ${kachel('TESTER', g.tester, 'ohne Test/eigene')}
          ${kachel('SESSIONS', g.sessions, 'gesamt')}
          ${kachel('Ø SITZUNG', minSek(g.dauerMs), 'Min, nur sichtbare Zeit')}
          ${kachel('PREMIUM', pct(g.premium.rate), `${g.premium.geklickt} von ${g.premium.gesehen} gesehen`)}
          ${kachel('D1', ret(g.d1), `${g.d1.zurueck} von ${g.d1.basis}`)}
          ${kachel('D3', ret(g.d3), `${g.d3.zurueck} von ${g.d3.basis}`)}
          ${kachel('D7', ret(g.d7), `${g.d7.zurueck} von ${g.d7.basis}`)}
        </div>
        <div class="karte spalte"><span class="eyebrow">HERO ENGAGEMENT SCORE</span><span class="zahl gross-z">${h.score === null ? '–' : h.score}<small> von 100</small></span>
          ${balken('Heldengefühl 40 %', h.held === null ? 0 : 100 * (h.held - 1) / 4, komma(h.held))}
          ${balken('Wiederbesuche 25 %', h.wiederbesuche || 0, h.wiederbesuche === null ? '–' : h.wiederbesuche)}
          ${balken('Verweildauer 20 %', h.verweildauer || 0, h.verweildauer === null ? '–' : h.verweildauer)}
          ${balken('Story-Neugier 15 %', h.story === null ? 0 : 100 * (h.story - 1) / 4, komma(h.story))}
        </div>
        <div class="karte spalte"><span class="eyebrow">AUTOMATISCHE ERKENNTNISSE</span><ul class="erkenntnisse">${er.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="karte spalte"><span class="eyebrow">FEATURE-RANKING</span><span class="klein">30 % Verweildauer · 30 % Wiederbesuche · 20 % Interaktionen · 20 % Bewertungen</span>
          ${rk.map((r, i) => balken(`${i + 1} ${r.name}`, r.score, r.score)).join('')}</div>
        <div class="karte spalte"><span class="eyebrow">BOSSKETTE</span>
          ${balken('Gegner besiegt', kp.basis ? 100 * kp.sieger / kp.basis : 0, `${kp.sieger} von ${kp.basis}`)}
          ${kp.stufen.map(s => balken(`Kapitel ${s.kapitel} erreicht`, kp.basis ? 100 * s.tester / kp.basis : 0, `${s.tester}`)).join('') || '<span class="klein">Noch niemand hat Kapitel 2 erreicht.</span>'}
          <span class="klein">Gezählt ab Version 17.</span></div>
        <div class="karte spalte"><span class="eyebrow">LEBENSBEREICHE BEIM START</span>
          ${lb.map(x => balken(lbName(x.domain), 100 * x.anzahl / Math.max(1, ...lb.map(y => y.anzahl)), x.anzahl)).join('') || '<span class="klein">Noch keine Daten (gezählt ab Version 17).</span>'}</div>
        <div class="karte spalte"><span class="eyebrow">ONBOARDING-TRICHTER</span>
          ${tr.schritte.map(s => balken(s.label, 100 * s.anzahl / maxT, s.anzahl)).join('')}
          <span class="klein">Ø Dauer bis „Abenteuer beginnen“: ${minSek(tr.dauerMs)} Min (Ziel höchstens 3:00)</span></div>
        <div class="karte spalte"><span class="eyebrow">FEEDBACK (${fb.anzahl})</span>
          <span class="klein">Morgen wieder öffnen: ${pct(fb.morgenJa)} ja · Bezahlen: ${pct(fb.bezahlenJa)} ja</span>
          ${fb.texte.map(f => `<div class="fb-eintrag">${['spannend', 'langweilig', 'verbessern'].filter(k => f[k]).map(k => `<p><b>${{ spannend: 'Spannend', langweilig: 'Langweilig', verbessern: 'Verbessern' }[k]}:</b> ${esc(f[k])}</p>`).join('') || '<p class="klein">Nur Ja/Nein beantwortet.</p>'}</div>`).join('')}</div>
        <div class="karte spalte"><span class="eyebrow">TESTER</span>
          <div class="tabelle-box"><table><thead><tr><th>Tester</th><th>Erster Tag</th><th>Aktive Tage</th><th>HES</th></tr></thead><tbody>
          ${t.map(x => `<tr><td>${esc(String(x.id).slice(0, 8))}</td><td>${esc(x.erster || '–')}</td><td>${Object.keys(x.tage).length}</td><td>${(h.je.find(j => j.id === x.id) || {}).score ?? '–'}</td></tr>`).join('') || '<tr><td colspan="4">Noch keine Tester.</td></tr>'}
          </tbody></table></div></div>
      </div>
    </section>`;
  },

  story() {
    const st = story();
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} Zurück</button></div>
      <div class="inhalt">
        <span class="eyebrow akzent">GESCHICHTE · WOCHE ${st.wocheNr}</span>
        <h1>${esc(st.titel)}</h1>
        <p class="klein">${esc(T('story.seite'))} ${esc(T('story.frei', { frei: st.frei, gesamt: st.teile.length }))}.</p>
        <div class="teile">${storyAnsicht()}</div>
      </div>
    </section>`;
  },

  einstellungen() {
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} Zurück</button></div>
      <div class="inhalt">
        <h1>Einstellungen</h1>
        <p class="klein">Version ${VERSION.nr} · ${VERSION.datum}</p>
        <div class="karte spalte">
          <span class="eyebrow">STIL</span>
          ${stand.stil.frei ? `<button class="btn" data-a="stilwahl">Welt wählen (jetzt: ${esc(stil().name)})</button>` : '<p class="klein">Weitere Welten öffnen sich nach dem ersten Sieg. Bis dahin: Fantasy.</p>'}
        </div>
        <div class="karte spalte">
          <span class="eyebrow">SPEICHERN</span>
          <p class="klein">${speicher.verfuegbar ? 'Dein Spielstand liegt in diesem Browser. Auf einem anderen Gerät beginnst du neu.' : 'Dieser Browser speichert gerade nicht. Dein Fortschritt gilt nur bis zum Schließen.'}</p>
          ${istTest ? '<p class="klein">Du bist im Testprofil. Es speichert getrennt vom Hauptprofil.</p>' : ''}
        </div>
        <div class="karte spalte">
          <span class="eyebrow">TESTPHASE</span>
          <p class="klein">${esc(einwStatus())}</p>
          ${EW.istOffen(einw) ? einwKarte(false, true) : `<button class="btn voll" data-a="daten" data-id="${einw.stand === 'ja' ? 'nein' : 'ja'}">${esc(T(einw.stand === 'ja' ? 'daten.zuruecknehmen' : 'daten.erlauben'))}</button>`}
          ${EW.istOffen(einw) ? '' : einwDetails()}
          <div class="zwei"><button class="btn" data-a="feedback-oeffnen">${hatFeedback() ? 'Feedback ändern' : 'Feedback geben'}</button><button class="btn" data-a="premium">Premium ansehen</button></div>
          ${EW.darfSenden(einw) && analyticsStatus() !== 'zentral' ? exportHtml() : ''}
          ${ui.istBesitzer ? '<button class="btn voll" data-a="admin">Auswertung öffnen</button>' : ''}
          ${ui.istBesitzer && ui.db ? '<button class="btn" data-a="pflege">Inhalte pflegen</button>' : ''}
        </div>
        <div class="karte spalte">
          <span class="eyebrow">NEU BEGINNEN</span>
          <p class="klein">Löscht Quest, Fortschritt und Stil und startet das Onboarding neu.</p>
          <button class="btn ${ui.resetFrage ? 'warn' : ''}" data-a="reset">${ui.resetFrage ? 'Wirklich alles löschen? Nochmal tippen' : 'Zurücksetzen'}</button>
        </div>
        <p class="klein">Version ${VERSION.nr} · ${VERSION.datum} · Tester ${esc(testerId.slice(0, 8))}</p>
      </div>
    </section>`;
  }
};

// ---------- Daten senden / importieren (Version 24) ----------
// Einwilligungs-Karte (Version 28). imOnboarding: zeigt nach der Wahl eine Bestätigungszeile statt zu verschwinden.
// eingebettet: ohne eigene Karte/Überschrift (z. B. in den Einstellungen).
function einwDetails() {
  const kontakt = EINWILLIGUNG.kontakt || T('daten.kontaktStandard');
  return `<details class="einw-mehr"><summary>${esc(T('daten.mehr'))}</summary><p class="klein">${esc(T('daten.lang', { monate: EINWILLIGUNG.loeschenNachMonaten, id: testerId.slice(0, 8), kontakt }))}</p></details>`;
}
function einwKarte(imOnboarding, eingebettet = false) {
  if (!EW.istOffen(einw)) {
    return imOnboarding ? `<p class="klein einw-ok" role="status">${icon('check')} ${esc(T(einw.stand === 'ja' ? 'daten.gewaehltJa' : 'daten.gewaehltNein'))}</p>` : '';
  }
  const inhalt = `${eingebettet ? '' : `<span class="eyebrow">${esc(T('daten.eyebrow'))}</span>`}
    ${einw.veraltet ? `<p class="klein">${esc(T('daten.neu'))}</p>` : ''}
    <p class="frage">${esc(T('daten.frage'))}</p>
    <p class="klein">${esc(T('daten.kurz'))}</p>
    ${einwDetails()}
    <div class="zwei"><button class="btn" data-a="daten" data-id="nein">${esc(T('daten.nein'))}</button><button class="btn ja" data-a="daten" data-id="ja">${esc(T('daten.ja'))}</button></div>`;
  return eingebettet ? inhalt : `<div class="karte spalte einw">${inhalt}</div>`;
}
function einwStatus() {
  if (einw.stand === 'ja') return T('daten.statusJa', { datum: K.ausTagKey(einw.tag).toLocaleDateString('de-AT') });
  if (einw.stand === 'nein') return T('daten.statusNein');
  return T('daten.statusOffen');
}

function exportHtml() {
  const x = ui.export;
  if (!x) return `<p class="klein">${esc(T('export.text'))}</p><button class="btn voll" data-a="export">${esc(T('export.knopf'))}</button>`;
  if (!x.code) return `<p class="fehler" role="alert">${esc(x.info || '')}</p><button class="btn voll" data-a="export">${esc(T('export.knopf'))}</button>`;
  const teilen = typeof navigator !== 'undefined' && navigator.share;
  return `<p class="klein">${esc(T('export.hinweis'))}</p>
    <label class="feld"><textarea id="export-code" readonly rows="3">${esc(x.code)}</textarea></label>
    <div class="zwei"><button class="btn" data-a="export-kopieren">${esc(T('export.kopieren'))}</button>${teilen ? `<button class="btn" data-a="export-teilen">${esc(T('export.teilen'))}</button>` : ''}</div>
    ${x.info ? `<p class="klein" role="status">${esc(x.info)}</p>` : ''}`;
}

function importHtml() {
  const i = ui.admin.importInfo;
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('import.titel'))}</span>
    <p class="klein">${esc(T('import.text'))}</p>
    <label class="feld"><textarea id="import-code" rows="3" placeholder="LIAG1.…"></textarea></label>
    <button class="btn" data-a="admin-import">${esc(T('import.knopf'))}</button>
    <label class="feld"><span>${esc(T('import.csv'))}</span><input type="file" id="import-csv" accept=".csv,text/csv"></label>
    ${i ? `<p class="${i.fehler ? 'fehler' : 'klein'}" role="${i.fehler ? 'alert' : 'status'}">${esc(i.text)}</p>` : ''}
  </div>`;
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
  catch (e) { ui.admin.importInfo = { fehler: true, text: e instanceof X.CodeFehler ? e.message : 'Der Code konnte nicht gelesen werden.' }; render(); return; }
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

function frageText(art) {
  const v = aktuelleVorlage();
  return (BEWERTUNGEN[art] ? BEWERTUNGEN[art].frage : '').replace('{name}', nameVon(v.held));
}

function frageBild(art) {
  const v = aktuelleVorlage();
  const g = TABELLE.gegner[v.gegner];
  const b = BEWERTUNGEN[art] ? BEWERTUNGEN[art].bild : 'szene';
  if (b === 'gegner') return img('boss-' + v.gegner, g.name, 'boss', 'cover');
  if (b === 'verbuendeter') return img(v.held, nameVon(v.held), 'held', 'cover');
  if (b === 'banner') return img('banner-' + v.held, 'Held', 'szene', 'cover');
  return img('szene', 'Geschichte', 'szene', 'cover');
}

function feierHtml() {
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
        <div class="skala" role="group" aria-label="Bewertung 1 bis 5">${[1, 2, 3, 4, 5].map(n => `<button class="sc" data-a="bewerte" data-id="${n}" aria-label="${n} von 5">${n}</button>`).join('')}</div>
        <div class="skala-text"><span>${esc(SKALA.links)}</span><span>${esc(SKALA.rechts)}</span></div>
        <button class="link" data-a="bewerte" data-id="0">Überspringen</button>
      </div>
    </div>`;
  }
  if (f.art === 'story') {
    // Version 40: Story-Popup als Kapitelmoment: Bild, „Teil n von 7“, offenes Ende, Knopf aus dem Stil-Vokabular.
    const st = story();
    const teil = st.teile.find(t => t.nr === f.nr && t.frei);
    if (!teil) { console.warn('Story-Popup: Teil nicht frei', f.nr); return ''; } // Rückfall: nichts zeigen statt leerer Karte
    const letzter = f.nr >= st.teile.length;
    const gid = TABELLE.gegner[v.gegner] ? v.gegner : null;
    const platz = storyBildPlatz(gid);
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte story-blatt story-moment erscheint">
        ${platz ? `<div class="story-bild" aria-hidden="true">${img(platz, gid ? TABELLE.gegner[gid].name : '', platz.startsWith('boss-') ? 'boss' : 'szene', 'cover')}<span class="story-bild-verlauf"></span></div>` : ''}
        <div class="story-text">
          <span class="eyebrow akzent">${esc(st.titel.toUpperCase())}</span>
          <span class="chip story-chip">${esc(T('story.teilVon', { nr: f.nr, gesamt: st.teile.length }))}</span>
          <h2 id="feier-t">${esc(teil.titel)}</h2>
          <p class="story-absatz">${esc(teil.text)}</p>
          ${letzter ? '' : `<p class="story-folgt">${esc(T('story.folgt'))}</p>`}
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
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <div class="feier-bild">${img('boss-' + gid, gs.name, 'boss', 'cover grau')}</div>
        <span class="chip gut">SIEG · +${K.XP.sieg} XP</span>
        <h2 id="feier-t">${esc(gs.name)} ist ${esc(wort('sieg'))}!</h2>
        ${f.level ? `<p class="sieg-stufe">${icon('stern')}<b>${esc(T('sieg.stufe', { held: nameVon(v.held), stufe: wort('stufe'), nr: f.level, titel: f.titel }))}</b></p>` : ''}
        <p>Du hast „${esc(TABELLE.faehigkeiten[v.faehigkeit].name)}“ ${v.quest.anzahl === 1 ? 'eingesetzt' : `${v.quest.anzahl}-mal eingesetzt`}. ${esc(weiter)}</p>
        <button class="cta" data-a="feier-weiter">Weiter</button>
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
        <button class="cta" data-a="feier-weiter">Weiter</button>
      </div>
    </div>`;
  }
  if (f.art === 'gegner') {
    const gid = TABELLE.gegner[f.gegner] ? f.gegner : v.gegner;
    const gn = TABELLE.gegner[gid];
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <div class="feier-bild">${img('boss-' + gid, gn.name, 'boss', 'cover')}</div>
        <span class="chip schlecht">${esc(T('neuerGegner.chip', { KAPITEL: wort('kapitel').toUpperCase(), nr: f.kapitel, GEGNER: wort('gegner').toUpperCase() }))}</span>
        <h2 id="feier-t">${esc(gn.name)}</h2>
        <p>${esc(gn.text)}</p>
        <div class="zwei"><div class="box schlecht"><b>WIRD STÄRKER</b>${esc(gn.staerker)}</div><div class="box gut"><b>VERLIERT KRAFT</b>${esc(gn.schwaecher)}</div></div>
        <p class="klein">${esc(T('neuerGegner.ziel', { faehigkeit: wort('faehigkeit'), name: TABELLE.faehigkeiten[v.faehigkeit].name, anzahl: v.quest.anzahl }))}</p>
        <button class="cta" data-a="feier-weiter">${esc(T('neuerGegner.knopf'))}</button>
      </div>
    </div>`;
  }
  if (f.art === 'levelup') {
    return `<div class="feier" role="dialog" aria-modal="true" aria-labelledby="feier-t">
      <div class="feier-karte erscheint">
        <span class="stern-gross" aria-hidden="true">${icon('stern', 'ic gross')}</span>
        <h2 id="feier-t">${esc(nameVon(f.held || v.held))} erreicht ${esc(wort('stufe'))} ${f.level}</h2>
        <p>Neuer Titel: ${esc(f.titel)}</p>
        <button class="cta" data-a="feier-weiter">Weiter</button>
      </div>
    </div>`;
  }
  return '';
}

// Fortschritt im Leben (Version 21): echtes Verhalten seit Questbeginn, nicht nur XP.
function entw() {
  try { return entwicklung(stand, jetzt()); } catch (e) { console.warn('Entwicklung:', e.message); return null; }
}
function lebenZeile(v) {
  const e = entw();
  if (!e || !e.anwendungen) return '';
  const f = TABELLE.faehigkeiten[v.faehigkeit];
  return `<p class="leben">${icon('check')}<span><b>${esc(T('leben.anwendungen', { n: e.anwendungen, verb: f.verb }))}</b> ${esc(T('leben.seit', { datum: kurzDatum(e.start) }))}${e.siege ? ` · ${esc(T('leben.siege', { n: e.siege, sieg: wort('sieg') }))}` : ''}</span></p>`;
}
function entwicklungHtml(v) {
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
    <div class="verlauf-runden" role="img" aria-label="${esc(e.verlauf.map(r => `Woche ${r.nr}: ${r.anwendungen} von ${r.ziel}${r.sieg ? ', Sieg' : ''}`).join('; '))}">
      ${e.verlauf.map(r => `<span class="runde ${r.sieg ? 'sieg' : ''}"><i style="height:${Math.round(100 * Math.min(r.anwendungen, maxZ) / maxZ)}%"></i><b>${r.anwendungen}</b><small>${esc(T('entw.runde', { nr: r.nr }))}</small></span>`).join('')}
    </div>
    <p class="klein">${esc(T('entw.legende', { anzahl: e.verlauf[0] ? e.verlauf[0].ziel : '', gegner: wort('gegner'), sieg: wort('sieg') }))}${e.naechsterTitel ? ` ${esc(T('entw.naechsterTitel', { titel: e.naechsterTitel.titel, stufe: wort('stufe'), nr: e.naechsterTitel.abStufe }))}` : ''}</p>`;
}

// Weg der Bosskette auf der Quest-Karte (Version 19): Stationen = Gegner, Held rückt mit jedem Treffer vor.
const prozent = (wert, max) => `${Math.round(1000 * wert / max) / 10}%`;
function wegHtml(a, v, g) {
  let w;
  try { w = W.wegFenster(W.wegAnsicht(a, K.kette(stand))); }
  catch (e) { console.warn('Weg:', e.message); return `<span class="mini gut-text">Woche ${a.wocheNr}</span>`; }
  const n = w.stationen.length;
  const pkt = w.stationen.map((_, i) => W.wegPunkt(i, n));
  const held = W.wegPunkt(w.position, n);
  const linie = l => l.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
  const geschafft = [...pkt.slice(0, Math.floor(w.position) + 1), held];
  const rest = Math.max(0, a.anzahl - a.treffer);
  const stationHtml = (st, i) => {
    const q = pkt[i];
    const lage = `left:${prozent(q.x, 300)};top:${prozent(q.y, 92)}`;
    if (st.status === W.STATION.start) return `<span class="station start" style="${lage}"></span>`;
    if (st.status === W.STATION.nebel) return `<span class="station nebel" style="${lage}"></span>`;
    const gg = TABELLE.gegner[st.gegner] || g;
    const bildCls = st.status === W.STATION.verborgen ? 'cover schatten' : st.status === W.STATION.besiegt ? 'cover grau' : 'cover';
    return `<span class="station ${st.status}" style="${lage}">${img('boss-' + st.gegner, gg.name, 'boss', bildCls, '', 'rund')}${st.status === W.STATION.besiegt ? `<i class="station-haken">${icon('check')}</i>` : ''}</span>`;
  };
  const text = a.rundeTag < 0 ? T('weg.morgen', { kapitel: wort('kapitel'), gegner: g.kurz })
    : [T('weg.stand', { treffer: a.treffer, anzahl: a.anzahl }), rest ? T('weg.rest', { rest, gegner: g.kurz }) : '', T('weg.kapitel', { kapitel: wort('kapitel'), nr: w.kapitel })].filter(Boolean).join(' · ');
  return `<div class="weg" role="img" aria-label="${esc(T('weg.aria', { held: nameVon(v.held), text }))}">
      <svg viewBox="0 0 300 92" preserveAspectRatio="none" aria-hidden="true"><path class="weg-rest" d="${linie(pkt)}"/><path class="weg-geschafft" d="${linie(geschafft)}"/></svg>
      ${w.stationen.map(stationHtml).join('')}
      <span class="weg-held" style="left:${prozent(held.x, 300)};top:${prozent(held.y, 92)}">${img(v.held, nameVon(v.held), 'held', 'cover', '', 'rund')}</span>
    </div>
    <span class="mini gut-text">${esc(text)}</span>`;
}

// Andeutung: nächster Gegner der Kette als Silhouette (Name bleibt verborgen)
function naechsterGegnerHtml(a, g) {
  const kette = K.kette(stand);
  const id = a.gegnerNr < a.gegnerAnzahl ? kette[a.gegnerNr] : null;
  if (!id || !TABELLE.gegner[id]) return '';
  andeutungGesehen('boss');
  return `<div class="naechster">
    <span class="naechster-bild" aria-hidden="true">${img('boss-' + id, '?', 'boss', 'cover schatten', '', 'quadrat')}</span>
    <span class="spalte"><span class="eyebrow">${esc(T('teaser.kapitel', { KAPITEL: wort('kapitel').toUpperCase(), nr: a.gegnerNr + 1 }))}</span><span class="nm">${esc(T('teaser.name'))}</span>
    <span class="klein">${esc(T('teaser.wartet', { gegner: I.gegnerFormen(g).nom, sieg: wort('sieg') }))}</span></span></div>`;
}

function blattHtml() {
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
    inhalt = `<span class="eyebrow gut-text">DEIN ${esc(wort('verbuendeter').toUpperCase())}</span>
      <h2 id="blatt-t">${esc(nameVon(v.held))}</h2><p class="rolle">${esc(vb.rolle)}</p>
      <div class="zeile"><div class="balken xp gross-b"><i style="width:${Math.round(100 * a.imLevel / a.proLevel)}%"></i></div><span class="mini">${esc(wort('stufe'))} ${a.level} · ${esc(a.titel)}</span></div>
      <p class="klein">${a.xp} XP gesamt · ${a.proLevel - a.imLevel} XP bis zur nächsten ${esc(wort('stufe'))}</p>
      ${entwicklungHtml(v)}
      <p class="lead">${esc(nameVon(v.held))} hilft dir dabei:</p>
      <ul class="haken">${vb.hilft.map(h => `<li>${icon('check')}${esc(h)}</li>`).join('')}</ul>`;
  } else if (ui.blatt === 'boss') {
    kopfbild = img('boss-' + v.gegner, g.name, 'boss', 'cover', g.name);
    inhalt = `<span class="eyebrow akzent">DEIN ${esc(wort('gegner').toUpperCase())}</span>
      <h2 id="blatt-t">${esc(g.name)}</h2>
      <div class="segmente gross-s" role="img" aria-label="Kraft ${a.anzahl - a.treffer} von ${a.anzahl}">${Array.from({ length: a.anzahl }, (_, i) => `<i class="${i < a.anzahl - a.treffer ? 'voll' : ''}"></i>`).join('')}</div>
      <p class="klein">Kraft ${a.anzahl - a.treffer} von ${a.anzahl} diese Woche · ${a.siege ? `${a.siege}× ${esc(wort('sieg'))}` : 'noch unbesiegt'}</p>
      <p class="klein">${esc(T(a.rundeTag < 0 ? 'gegner.rundeMorgen' : 'gegner.rundeLaeuft', { bis: kurzDatum(a.rundeBis) }))}${a.gegnerAnzahl > 1 ? ` ${esc(T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }))}.` : ''}</p>
      <p class="lead">${esc(g.text)}</p>
      <div class="zwei"><div class="box schlecht"><b>WIRD STÄRKER</b>${esc(g.staerker)}</div><div class="box gut"><b>VERLIERT KRAFT</b>${esc(g.schwaecher)}</div></div>
      ${naechsterGegnerHtml(a, g)}`;
  } else if (ui.blatt === 'faehigkeit') {
    inhalt = `<span class="medaille">${icon(f.icon, 'ic gross')}</span>
      <span class="eyebrow">DEINE ${esc(wort('faehigkeit').toUpperCase())}</span>
      <h2 id="blatt-t">${esc(f.name)}</h2>
      <p class="wenn">${esc(f.wenn)}</p>
      <ul class="haken">${f.schritte.map(s => `<li>${icon('check')}${esc(s)}</li>`).join('')}</ul>
      <p class="klein">Besonders wirksam gegen ${esc(g.name.replace(/^(Der|Die|Das) /, m => ({ 'Der ': 'den ', 'Die ': 'die ', 'Das ': 'das ' }[m])))}.</p>`;
  } else if (ui.blatt === 'premium') {
    inhalt = `<span class="stern-gross" aria-hidden="true">${icon('stern', 'ic gross')}</span>
      <h2 id="blatt-t">Danke für dein Interesse!</h2>
      <p class="lead">${esc(PREMIUM.titel)} ist noch nicht verfügbar. Wir prüfen gerade, ob es sich lohnt, es zu bauen. Dein Klick hilft uns dabei.</p>
      <p class="klein">Es wurde nichts gekauft und nichts berechnet.</p>`;
  }
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="blatt-t">
    <button class="hintergrund" data-a="blatt-zu" aria-label="Schließen" tabindex="-1"></button>
    <div class="blatt erscheint">
      ${kopfbild ? `<div class="blatt-bild">${kopfbild}</div>` : ''}
      <div class="blatt-inhalt">${inhalt}<button class="cta" data-a="blatt-zu">Schließen</button></div>
    </div>
  </div>`;
}

function mikroBereich(v) {
  if (v.gruppe && v.gruppe !== '*') return v.gruppe;
  return stand.onboarding.bereich || MIKRO_RUECKFALL;
}
// Mikroquests je Held: 1 Held → 3, 2 Helden → je 2, 3 Helden → je 1
const mikroJeHeld = () => (spiel.helden.length <= 1 ? MIKRO_JE_TAG : spiel.helden.length === 2 ? 2 : 1);
const mikroListe = () => heldenAnsichten().flatMap(({ id, a, v }) =>
  I.mikroHeute(a, jetzt(), mikroBereich(v), MIKRO, mikroJeHeld(), MIKRO_RUECKFALL).map(m => ({ ...m, held: id })));
const story = () => I.storyWoche(stand, jetzt(), aktuelleVorlage(), TABELLE, STORIES, nameVon);

// Heldenkopf (Version 43): aktiver Held groß, daneben „Helden wechseln“ mit Mini-Porträts und Zahl offener Checks.
// Ersetzt Crew-Leiste und „Weitere Helden“. Feste Reihenfolge der Crew (kein Umsortieren), Logik in logik/startseite.js.
const bereichName = domainId => (LEBENSBEREICHE.find(d => d.id === domainId) || {}).name || '';
function heldenKopfDaten() {
  const ansichten = heldenAnsichten().map(h => ({ ...h, x: K.auswertung(h.a, jetzt()) }));
  const k = heldenKopf(ansichten.map(h => ({ id: h.id, erledigt: !!h.x.heuteAntwort })), spiel.fokus, HELDENKOPF.stapelMax);
  return { k, ansichten };
}

// „Neu für dich“ (Version 50): ruhiger Hinweis nach einer Freischaltung statt stiller Änderung der Leiste.
function neuKarte() {
  const ids = neuBereiche();
  if (!ids.length) return '';
  const tabs = ids.map(id => TABS.find(t => t.screen === id)).filter(Boolean);
  const namen = tabs.map(tabLabel);
  return `<div class="karte neu-karte" role="status">
    <span class="eyebrow akzent">${esc(T('neu.eyebrow'))}</span>
    <span class="nm gross-nm">${esc(T('neu.titel', { bereiche: namen.join(' · ') }))}</span>
    ${tabs.map(t => `<div class="neu-zeile"><span class="neu-ic" aria-hidden="true">${icon(t.icon)}</span><span class="spalte"><b>${esc(tabLabel(t))}</b>${t.neuText ? `<span class="klein">${esc(T(t.neuText, { stadt: wort('stadt'), bereich: tabLabel(t) }))}</span>` : ''}</span><button class="btn klein-btn voll" data-a="tab" data-id="${esc(t.screen)}">${esc(T('neu.oeffnen', { bereich: tabLabel(t) }))}</button></div>`).join('')}
    <button class="link neu-ok" data-a="neu-ok">${esc(T('neu.ok'))}</button>
  </div>`;
}

// Erfolgsmoment (Version 49): großes Heldenbild direkt nach „Ja“, einklappbar; danach klein (siehe erfolgGroesse).
function erfolgHtml(antw) {
  if (erfolgGroesse(antw, ui.erfolgFrisch, spiel.fokus, K.tagKey(jetzt()), SM.erfolg.an) !== 'gross') return '';
  const id = spiel.fokus;
  const name = nameVon(id);
  return `<figure class="erfolg-bild${ui.einmal.has('check') ? ' neu' : ''}">${img('banner-' + id, name, 'szene', 'cover', '')}<span class="erfolg-verlauf" aria-hidden="true"></span>
    <figcaption><span class="eyebrow">${esc(T('erfolg.eyebrow'))}</span><span class="erfolg-text">${esc(T('erfolg.text', { held: name }))}</span></figcaption>
    <button class="klein-knopf auf-bild" data-a="erfolg-klein">${esc(T('erfolg.klein'))}</button></figure>`;
}

// Wechsel-Banner (Version 49): kurz Bild und Name beim bewussten Heldenwechsel; verschwindet nach SM.wechsel.dauerMs.
function wechselBannerHtml(h) {
  if (!ui.einmal.has('wechsel') || !wechselBanner(ui.wechselVon, h.id, spiel.helden.map(x => x.heroId), SM.wechsel.an)) return '';
  const name = nameVon(h.id);
  const f = TABELLE.faehigkeiten[h.v.faehigkeit];
  const zeile = h.x.heuteAntwort ? T('wechsel.erledigt') : T('wechsel.offen', { faehigkeit: f ? f.name : '' });
  return `<div class="wechsel-banner" role="status" style="--dauer:${SM.wechsel.dauerMs}ms">${img('banner-' + h.id, name, 'szene', 'cover', '')}<span class="erfolg-verlauf" aria-hidden="true"></span>
    <span class="wechsel-text"><span class="eyebrow">${esc(T('wechsel.eyebrow'))}</span><span class="wechsel-name">${esc(name)}</span><span class="klein">${esc(zeile)}</span></span></div>`;
}

function heldenkopfHtml() {
  const { k, ansichten } = heldenKopfDaten();
  const h = ansichten.find(x => x.id === k.aktiv);
  if (!h) return '';
  const banner = wechselBannerHtml(h);
  const name = nameVon(h.id);
  const bereich = bereichName(h.domainId);
  const knopf = k.mitWechsel ? `<button class="wechsel-knopf" data-a="helden-wahl" aria-haspopup="dialog" aria-expanded="${!!ui.heldenWahl}" aria-label="${esc(T('kopf.wechseln'))}${k.offen ? esc(', ' + T('kopf.offen', { n: k.offen })) : ''}">
      <span class="stapel" aria-hidden="true">${k.stapel.map(id => img(id, nameVon(id), 'held', 'stapel-bild')).join('')}</span>
      ${k.offen ? `<span class="offen-zahl" aria-hidden="true">${k.offen}</span>` : ''}${icon('runter')}</button>` : '';
  // Version 45: Porträt öffnet die Heldenseite (Detailblatt „crew“), XP-Balken aus der früheren Verbündeten-Karte.
  const x = h.x;
  const xpProzent = x.proLevel > 0 ? Math.round(100 * x.imLevel / x.proLevel) : 0;
  return `${banner}<div class="heldenkopf">
    <button class="kopf-portraet" data-a="blatt" data-id="crew" aria-label="${esc(T('kopf.ansehen', { held: name }))}">${img(h.id, name, 'held', 'kopf-bild', '')}<span class="kopf-info" aria-hidden="true">i</span></button>
    <div class="kopf-text"><span class="eyebrow">${esc(T('kopf.aktiv'))}</span><span class="kopf-name">${esc(name)}</span><span class="klein">${esc([bereich, `${wort('stufe')} ${x.level}`].filter(Boolean).join(' · '))}</span>
      <div class="balken xp kopf-xp" role="img" aria-label="${esc(`${x.imLevel} von ${x.proLevel} XP bis ${wort('stufe')} ${x.level + 1}`)}"><i style="width:${xpProzent}%"></i></div></div>
    ${knopf}
    ${ui.xpFlug ? `<span class="xpflug kopf-flug" aria-hidden="true">${ui.xpFlug > 0 ? '+' : ''}${ui.xpFlug} XP</span>` : ''}</div>`;
}

// „Weiter zu …“ (Version 45): nach dem Check des aktiven Helden der nächste mit offenem Check (feste Reihenfolge).
function weiterZuHtml() {
  if (spiel.helden.length < 2) return '';
  const { k, ansichten } = heldenKopfDaten();
  const id = naechsterOffener(ansichten.map(h => ({ id: h.id, erledigt: !!h.x.heuteAntwort })), k.aktiv);
  if (!id) return `<p class="tat-alle${ui.einmal.has('check') ? ' neu' : ''}" role="status">${esc(T('tat.alleErledigt'))}</p>`;
  const name = nameVon(id);
  return `<button class="weiter-zu${ui.einmal.has('check') ? ' neu' : ''}" data-a="fokus" data-id="${esc(id)}">${img(id, name, 'held', 'weiter-bild', '')}<span class="spalte"><span class="klein">${esc(T('tat.naechster'))}</span><span class="nm">${esc(T('tat.weiter', { held: name }))}</span></span>${icon('pfeilRechts')}</button>`;
}

// Popup „Helden wechseln“ als Blatt von unten (gleiches Muster wie die Detailblätter, Daumen-Reichweite am Handy).
function heldenWahlHtml() {
  if (!ui.heldenWahl || ui.screen !== 'start') return '';
  const { k, ansichten } = heldenKopfDaten();
  if (!k.mitWechsel) { ui.heldenWahl = false; return ''; }
  const zeilen = ansichten.map(({ id, domainId, v, x }) => {
    const aktiv = id === k.aktiv;
    const name = nameVon(id);
    const status = aktiv ? T('kopf.statusAktiv') : x.heuteAntwort ? T('kopf.statusErledigt') : T('kopf.statusOffen');
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const schnell = !aktiv && !x.heuteAntwort && f
      ? `<button class="schnell" data-a="schnell" data-id="${esc(id)}" aria-label="${esc(name)}: heute ${esc(f.verb)}">${icon('check')}</button>` : '';
    return `<div class="wahl-zeile${aktiv ? ' an' : ''}">
      <button class="wahl-info" data-a="fokus" data-id="${esc(id)}" ${aktiv ? 'aria-current="true"' : ''}>${img(id, name, 'held', 'wahl-bild')}
        <span class="spalte"><span class="nm">${esc(name)}</span><span class="klein">${esc([bereichName(domainId), `${wort('stufe')} ${x.level}`].filter(Boolean).join(' · '))}</span></span>
        <span class="wahl-status ${aktiv ? 'akzent-text' : x.heuteAntwort ? 'gut-text' : 'offen-text'}">${esc(status)}</span></button>${schnell}</div>`;
  }).join('');
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="wahl-t">
    <button class="hintergrund" data-a="helden-wahl-zu" aria-label="Schließen" tabindex="-1"></button>
    <div class="blatt erscheint"><div class="blatt-inhalt"><h2 id="wahl-t">${esc(T('kopf.wahlTitel', { crew: wort('crew') }))}</h2>${zeilen}<button class="cta" data-a="helden-wahl-zu">Schließen</button></div></div>
  </div>`;
}

// Abschnitte der Startseite (Version 43). Reihenfolge und Ein/Aus: daten/startseite.js.
const START_TEILE = {
  hinweise: () => `${neuKarte()}${hinweisBox()}${EW.istOffen(einw) ? einwKarte(false) : ''}${ui.fbDanke ? '<div class="hinweis gut-rand" role="status"><span>Danke für dein Feedback!</span><button class="link" data-a="danke-weg">OK</button></div>' : ''}`,
  heldenkopf: () => heldenkopfHtml(),
  angebot: () => angebotKarte(),
  botschaft: () => crewKarte(),
  quest: ({ v, g, a }) => `<div class="karte haupt">
      <span class="eyebrow akzent">MEINE ${esc(wort('quest').toUpperCase())}</span>
      <div class="quest-zeile"><span class="questtitel">${esc(stand.quest.ziel)}</span>${funktionFrei('quests_bearbeiten') ? `<button class="link qe-knopf" data-a="quest-bearbeiten" aria-label="${esc(T('qe.titel', { quest: wort('quest') }))}">${icon('stift')}${esc(T('qe.knopf'))}</button>` : ''}</div>
      ${wegHtml(a, v, g)}
      ${lebenZeile(v)}
    </div>`,
  // Version 44: Heutige Heldentat (ersetzt „Nächste Aufgabe“ und die Fähigkeits-Karte). Check-Logik unverändert (check()).
  // Version 44/45: Heutige Heldentat. Check-Logik unverändert (check()). Wochenstand zeigt seit 45 die Duell-Karte.
  heldentat: ({ v, f, a }) => {
    const antw = a.heuteAntwort;
    const frage = tagesfrage(v, f, T('tat.frage', { faehigkeit: f.name }));
    return `<div class="karte heldentat${antw ? ' fertig' : ''}">
      <span class="eyebrow tat-eyebrow">${esc(T('tat.eyebrow'))}</span>
      <button class="tat-name tippbar" data-a="blatt" data-id="faehigkeit" aria-label="${esc(f.name)} ansehen">${esc(f.name)}</button>
      <p class="tat-plan">${esc(f.wenn)} <b>${esc(T('tat.dann'))}</b> ${esc(f.kurz)}</p>
      ${antw ? `${erfolgHtml(antw)}<div class="erledigt${ui.einmal.has('check') ? ' neu' : ''}" role="status">${erfolgGroesse(antw, ui.erfolgFrisch, spiel.fokus, K.tagKey(jetzt()), SM.erfolg.an) === 'klein' ? img(v.held, nameVon(v.held), 'held', 'erfolg-mini', '') : icon('check')}<span>${antw === 'ja' ? `Heute ${esc(f.verb)}. Stark!` : 'Heute nicht gebraucht. Auch gut.'}</span><button class="link" data-a="check" data-id="">Ändern</button></div>${weiterZuHtml()}`
        : `<p class="tat-frage">${esc(frage)}</p>
      <div class="zwei"><button class="btn voll" data-a="check" data-id="ja">${esc(T('tat.ja'))}</button><button class="btn tat-nein" data-a="check" data-id="nein">${esc(T('tat.nein'))}</button></div>`}
    </div>`;
  },
  // Version 45: eine Duell-Karte statt Verbündeter + Gegner. Tipp öffnet die Gegnerseite.
  duell: ({ v, g, a }) => {
    const held = nameVon(v.held);
    const kraft = a.anzahl - a.treffer;
    const unter = a.gegnerAnzahl > 1 ? T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }) : a.siege ? `${a.siege}× ${wort('sieg')}` : 'noch unbesiegt';
    return `<button class="karte duell tippbar ${ui.wackeln ? 'wackelt' : ''} ${a.bossKraft === 0 ? 'besiegt' : ''}" data-a="blatt" data-id="boss" aria-label="${esc(g.name)} ansehen">
      <span class="duell-bildrahmen">${img('boss-' + v.gegner, g.name, 'boss', 'duell-bild', '')}
        <span class="duell-titel">${esc(held)} <span class="duell-vs">${esc(T('duell.vs'))}</span> ${esc(g.kurz)}</span></span>
      <span class="duell-text">
        <span class="duell-zeile"><span>${esc(T('duell.kraft', { gegner: g.kurz }))}</span><span>${kraft} / ${a.anzahl}</span></span>
        <span class="segmente" role="img" aria-label="Kraft ${kraft} von ${a.anzahl}">${Array.from({ length: a.anzahl }, (_, i) => `<i class="${i < kraft ? 'voll' : ui.einmal.has('treffer') && i === kraft ? 'bricht' : ''}"></i>`).join('')}</span>
        <span class="klein">${esc(T('tat.woche', { n: a.wocheZaehler, anzahl: a.anzahl }))}${a.wocheZaehler > a.anzahl ? ' · Extra!' : ''} · ${esc(unter)}${a.rundeTag < 0 ? ` · ${esc(T('gegner.abMorgen'))}` : ''}</span>
      </span>
    </button>`;
  },
  bonus: () => mikroKarte(),
  story: () => storyKarte(),
  welten: () => weltenKarte(),
  extra: () => extraKarten()
};
// Kurzzeilen eingeklappter Abschnitte (Version 52). Neue klappbare Karte = Eintrag hier + `klappbar: true` in den Daten.
const START_KURZ = {
  quest: ({ a }) => `<span class="eyebrow akzent">MEINE ${esc(wort('quest').toUpperCase())}</span><span class="nm">${esc(stand.quest.ziel)}</span><span class="klein">${esc([T('weg.stand', { treffer: a.treffer, anzahl: a.anzahl }), a.gegnerAnzahl > 1 ? T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }) : ''].filter(Boolean).join(' · '))}</span>`
};
const klapp = () => klappZustand(START_ABSCHNITTE, Object.keys(START_KURZ), merkmal('start_klein'));
klappZustand(START_ABSCHNITTE, Object.keys(START_KURZ), []).fehler.forEach(m => console.warn(m));
// Abschnitt mit Klapp-Knopf: klein → Kurzzeile (tippbar zum Aufklappen), offen → normale Karte + „Kleiner“.
function mitKlappe(id, html, ctx, k) {
  if (!k.klappbar.includes(id) || !html) return html;
  if (k.klein.includes(id)) return `<button class="karte klapp-zeile tippbar" data-a="klapp-auf" data-id="${esc(id)}" aria-expanded="false"><span class="spalte">${START_KURZ[id](ctx)}</span><span class="klapp-mehr">${esc(T('klapp.mehr'))}</span></button>`;
  return `<div class="klapp-rahmen">${html}<button class="klein-knopf" data-a="klapp-zu" data-id="${esc(id)}" aria-expanded="true">${esc(T('klapp.kleiner'))}</button></div>`;
}

const START_IDS = (() => {
  const { ids, fehler } = ordneAbschnitte(START_ABSCHNITTE, Object.keys(START_TEILE));
  if (fehler.length) console.warn(fehler.join('\n'));
  return ids.length ? ids : Object.keys(START_TEILE); // kaputte Liste → alle Abschnitte in eingebauter Reihenfolge
})();
// Version 59: äußerstes Element eines Abschnitts markieren (data-abschnitt), damit Glanz & Co. ihn finden,
// ohne dass jede Karte selbst Attribute setzen muss. Leerer Abschnitt bleibt leer.
function markiere(html, id) {
  if (typeof html !== 'string' || !html.trim()) return html;
  return html.replace(/^(\s*<[a-zA-Z][\w-]*)/, `$1 data-abschnitt="${esc(id)}"`);
}

function angebotKarte() {
  if (!H.zielAngebot(spiel)) return '';
  // Version 58: hervorgehoben wie Siegel und Botschaft (goldener Stern, Glanz einmal je Angebot; Kennung = Zahl der Helden,
  // denn nach einem neuen Helden ist das nächste Angebot eine neue Sache)
  return `<div class="karte spalte angebot"><span class="angebot-kopf"><span class="stern-klein" aria-hidden="true">${icon('stern')}</span><span class="eyebrow akzent">NEUES ABENTEUER</span></span>
    <span class="nm gross-nm">Willst du ein neues Abenteuer beginnen?</span>
    <p class="klein">Ein weiterer Held für einen anderen Lebensbereich. Du kannst bis zu ${H.MAX_HELDEN} Helden gleichzeitig begleiten.</p>
    <div class="zwei"><button class="btn voll" data-a="neues-abenteuer">Ja, neues Ziel</button><button class="btn" data-a="angebot-spaeter">Später</button></div></div>`;
}

// Bereiche/Probleme, deren Held schon in der Crew ist, sind im Onboarding für weitere Helden gesperrt.
const heldBelegt = vorlage => !!vorlage && ui.neu && !!H.heldVon(spiel, vorlage.held);
const problemBelegt = (bereich, problem) => heldBelegt(K.vorlageFuer(TABELLE, bereich, problem));
const bereichBelegt = b => [...(TABELLE.probleme[b] || []).map(p => p.id), '*'].every(p => problemBelegt(b, p));

function crewKarte() {
  const v = aktuelleVorlage();
  const b = I.botschaft(stand, jetzt(), v, TABELLE, BOTSCHAFTEN, nameVon);
  // Am ersten Tag nicht zeigen: das Onboarding hat Verbündeten und Gegner gerade erst vorgestellt.
  if (!b.text || b.anlass === 'erster_tag') return '';
  const tag = K.tagKey(jetzt());
  const gelesen = H.istGelesen(spiel, spiel.fokus, tag);
  const klein = !ui.botschaftOffen && (gelesen || K.auswertung(stand, jetzt()).heuteAntwort);
  // Version 57: ungelesen → hervorgehoben (größeres Porträt, Akzentrahmen, „neu“); gelesen → ruhig wie bisher. Wippen: daten/neuigkeiten.js
  if (klein && gelesen) return `<button class="botschaft-klein" data-a="botschaft-auf">${img(v.held, nameVon(v.held), 'held', 'rund-klein')}<span>${esc(T('botschaft.klein', { held: nameVon(v.held) }))}</span></button>`;
  if (klein) return `<button class="botschaft-klein botschaft-neu" data-a="botschaft-auf">${img(v.held, nameVon(v.held), 'held', 'rund-klein')}<span>${esc(T('botschaft.ungelesen', { held: nameVon(v.held) }))}</span><span class="neu">${esc(T('botschaft.neu'))}</span></button>`;
  if (merkmal('crew_msg_tag') !== tag) { merke('crew_msg_tag', tag); trackEvent('crew_message_seen', { anlass: b.anlass }); }
  return `<div class="botschaft">${img(v.held, nameVon(v.held), 'held', 'rund gut-rand-b')}<p class="blase"><b>${esc(nameVon(v.held))}</b>${esc(b.text)}<button class="link botschaft-ok" data-a="botschaft-zu">${esc(T('botschaft.ok'))}</button></p></div>`;
}

// Andeutung: Welcher Story-Teil wird morgen frei? (nur wenn heute schon eingecheckt; berücksichtigt Runden- und Gegnerwechsel)
function storyMorgen() {
  if (!stand.quest || !K.auswertung(stand, jetzt()).heuteAntwort) return null;
  const d = jetzt(); d.setDate(d.getDate() + 1);
  try {
    const st = I.storyWoche(stand, d, aktuelleVorlage(), TABELLE, STORIES, nameVon);
    return st.teile[st.frei] ? { ...st.teile[st.frei], titelWoche: st.titel, neueGeschichte: st.woche !== story().woche } : null;
  } catch (e) { console.warn('Story-Andeutung:', e.message); return null; }
}
// Andeutungs-Ereignis höchstens einmal je Tag und Art zählen
const angedeutet = {};
function andeutungGesehen(art) {
  const k = K.tagKey(jetzt());
  if (angedeutet[art] === k) return;
  angedeutet[art] = k;
  trackEvent(art + '_teaser_seen', {});
}

// Bonus-Aufgaben (Version 45). Version 54: wieder eingefügt, war in Version 48 versehentlich entfernt worden.
function mikroKarte() {
  const liste = mikroListe();
  if (!liste.length) return '';
  const fertig = liste.filter(m => m.erledigt).length;
  // Version 45: nur die ersten BONUS.sichtbar zeigen, Rest hinter „+ N weitere“ (feste Reihenfolge, nichts springt).
  const b = bonusAnsicht(liste, BONUS.sichtbar, ui.bonusMehr);
  const umschalten = b.umschaltbar ? `<button class="link bonus-mehr" data-a="bonus-mehr" aria-expanded="${!!ui.bonusMehr}">${esc(ui.bonusMehr ? T('bonus.weniger') : T('bonus.mehr', { n: b.weitere }))}</button>` : '';
  return `<div class="karte spalte mikro">
    <div class="zeile"><span class="eyebrow">${esc(T('bonus.titel'))}</span><span class="mini rechts-oben">${fertig} von ${liste.length} · je +${K.XP.mikro} XP</span></div>
    ${b.sichtbar.map((m, i) => `<button class="mikro-zeile ${m.erledigt ? 'fertig' : ''}${ui.einmal.has('bonus') && i >= BONUS.sichtbar ? ' neu' : ''}" style="--i:${Math.max(0, i - BONUS.sichtbar)}" data-a="mikro" data-id="${esc(m.held + '|' + m.id)}" aria-pressed="${m.erledigt}"><span class="haken-kreis">${m.erledigt ? icon('check') : ''}</span><span class="mikro-text">${esc(m.text)}</span>${spiel.helden.length > 1 ? img(m.held, nameVon(m.held), 'held', 'mikro-held', nameVon(m.held)) : ''}</button>`).join('')}
    ${umschalten}
  </div>`;
}


// Story-Karte (Version 48, „Story nur, wenn neu“): groß nur, wenn ein Siegel wartet; sonst eine ruhige Hinweiszeile.
function storyKarte() {
  const st = story();
  const siegel = I.storyZustaende(st).find(z => z.zustand === 'siegel');
  if (siegel) {
    const teil = st.teile[siegel.nr - 1] || {};
    andeutungGesehen('story_siegel');
    return `<button class="karte story-karte story-neu tippbar" data-a="story-oeffnen" aria-label="${esc(T('story.siegel'))}: ${esc(st.titel)}">
    <span class="siegel-mark" aria-hidden="true">${icon('siegel')}</span>
    <span class="spalte"><span class="eyebrow akzent">GESCHICHTE · WOCHE ${st.wocheNr} · <span class="neu">NEUER TEIL</span></span>
    <span class="nm gross-nm">${esc(T('story.siegel'))}</span><span class="story-andeutung">${esc(teil.vorschau || T('story.siegelOhne'))}</span></span>${icon('pfeilRechts')}</button>`;
  }
  const morgen = storyMorgen();
  if (morgen) andeutungGesehen('story');
  const sub = st.frei === 0 && !morgen ? T('story.hinweisLeer')
    : morgen ? (morgen.neueGeschichte ? T('story.morgenNeu', { titel: morgen.titelWoche }) : T('story.morgenTeil', { nr: morgen.nr, titel: morgen.vorschau || morgen.titel }))
    : st.frei >= st.teile.length ? T('story.fertig') : T('story.hinweisGelesen');
  // Version 55: als Karte im Stil der eingeklappten Quest (vorher eine kleine Zeile, schwer lesbar)
  return `<button class="karte story-ruhig tippbar" data-a="story-oeffnen" aria-label="Geschichte: ${esc(st.titel)}">${icon('buch')}<span class="spalte"><span class="eyebrow akzent">GESCHICHTE · WOCHE ${st.wocheNr}</span><span class="nm">${esc(st.titel)}</span><span class="klein">${esc(sub)}</span></span><span class="klapp-mehr">${esc(T('story.lesen'))}</span></button>`;
}

// Story-Seite (Version 48): gelesen eingeklappt, erster ungelesener Teil versiegelt mit Andeutung,
// nächster noch nicht freier Teil versiegelt, alles Weitere als ein Nebelblock. Zustände: logik/inhalte.js storyZustaende().
function storyAnsicht() {
  const st = story();
  const satzweise = ui.einmal.has('siegel') && !bewegungAus;
  let nebel = false;
  return I.storyZustaende(st).map(({ nr, zustand }) => {
    const t = st.teile[nr - 1] || {};
    const andeutung = `<p class="andeutung">${esc(t.vorschau || T('story.siegelOhne'))}</p>`;
    if (zustand === 'gelesen') {
      const frisch = ui.storyOffen === nr;
      const text = frisch && satzweise ? I.saetze(t.text).map((x, i) => `<span class="satz" style="--i:${i}">${esc(x)} </span>`).join('') : esc(t.text);
      return `<details class="teil gelesen${frisch && ui.einmal.has('siegel') ? ' gebrochen' : ''}"${frisch ? ' open' : ''}><summary><span class="eyebrow">TEIL ${nr}</span><h3>${esc(t.titel)}</h3></summary><p>${text}</p></details>`;
    }
    if (zustand === 'siegel') return `<article class="teil versiegelt frei-siegel"><span class="eyebrow akzent">TEIL ${nr} · NEU</span>${andeutung}<button class="btn voll siegel-knopf" data-a="story-siegel" data-id="${nr}">${icon('siegel')} ${esc(T('story.siegelBrechen'))}</button></article>`;
    if (zustand === 'bereit' || zustand === 'wartet') return `<article class="teil versiegelt"><span class="eyebrow">TEIL ${nr}</span>${andeutung}<p class="klein">${esc(T(zustand === 'bereit' ? 'story.bereit' : 'story.wartet'))}</p></article>`;
    if (nebel) return '';
    nebel = true;
    return `<div class="teil nebel" role="note"><span class="nebel-schleier" aria-hidden="true"></span><span class="klein">${esc(T('story.nebel'))}</span></div>`;
  }).join('');
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

function extraKarten() {
  const teile = [];
  const tag = K.tagKey(jetzt());
  const spaeter = merkmal('feedback_spaeter');
  const tageSeit = d => (d ? Math.round((K.ausTagKey(tag) - K.ausTagKey(d)) / 864e5) : Infinity);
  if (!hatFeedback() && aktiveTage() >= FEEDBACK.abAktivenTagen && tageSeit(spaeter) >= FEEDBACK.erneutNachTagen) {
    teile.push(`<div class="karte spalte"><span class="eyebrow akzent">DEINE MEINUNG</span><span class="nm">5 kurze Fragen zum Prototyp</span><p class="klein">Dauert etwa 2 Minuten und hilft sehr.</p><div class="zwei"><button class="btn voll" data-a="feedback-oeffnen">Antworten</button><button class="btn" data-a="feedback-spaeter">Später</button></div></div>`);
  }
  if (aktiveTage() >= PREMIUM.ab) {
    if (!ui.premiumGesehen) { ui.premiumGesehen = true; trackEvent('premium_viewed', {}); }
    // Version 50: verkleinerbar (Wahl je Gerät in den Analytics-Merkmalen, kein Spielstand)
    teile.push(merkmal('premium_klein') === true
      ? `<div class="premium-klein"><button class="premium-zeile" data-a="premium"><span class="stern-mini" aria-hidden="true">${icon('stern')}</span><span>${esc(PREMIUM.titel)} · ${esc(PREMIUM.preis)}</span></button><button class="link" data-a="premium-gross">${esc(T('premium.groesser'))}</button></div>`
      : `<div class="premium-rahmen"><button class="karte premium tippbar" data-a="premium"><span class="stern-klein" aria-hidden="true">${icon('stern')}</span><span class="spalte"><span class="nm">${esc(PREMIUM.titel)}</span><span class="klein">${PREMIUM.punkte.map(esc).join(' · ')}</span><span class="preis">${esc(PREMIUM.preis)}</span></span></button><button class="klein-knopf" data-a="premium-klein">${esc(T('premium.kleiner'))}</button></div>`);
  }
  return teile.join('');
}

function testleiste() {
  if (!istTest) return '';
  return `<div class="testleiste"><span>TESTPROFIL · ${esc(K.tagKey(jetzt()))}</span><span class="tl-knoepfe"><button data-a="tag" data-id="-1">−1 Tag</button><button data-a="tag" data-id="1">+1 Tag</button><button data-a="tag" data-id="0">Heute</button></span></div>`;
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
  app.innerHTML = testleiste() + fn() + tabLeiste() + blattHtml() + heldenWahlHtml() + feierHtml();
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
  ui.analyseSchritt = bewegungAus ? 4 : 0;
  if (bewegungAus) return;
  analyseTimer = setInterval(() => {
    ui.analyseSchritt++;
    if (ui.analyseSchritt >= 4) {
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
  if (!v) { hinweis = 'Für diese Auswahl gibt es noch keine Vorlage. Bitte wähle einen anderen Bereich.'; geheZu('ob1'); return; }
  try {
    if (ui.neu) {
      setzeSpiel(H.heldHinzufuegen(spiel, v, ui.ziel, jetzt(), zuordnung));
      trackEvent('hero_added', { vorlage: v.id, domain: v.domain, helden: spiel.helden.length });
    } else {
      setzeStand(K.questAnlegen(stand, v, ui.ziel, jetzt()), null);
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
    { ereignisse: r.ereignisse, story: { neu: st.neu, nr: st.frei }, antwort, trefferVorher: r.vorher.treffer, trefferNachher: r.nachher.treffer },
    MOMENTE, darfFragen);
  if (weltenwahlSofort) ui.danach = 'stilwahl';
  if (neu.length) {
    ui.schlange.push(...neu);
    if (!ui.feier) setTimeout(() => { if (!ui.feier) zeigeNaechstes(); }, bewegungAus ? 0 : 700);
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
    if (!ui.istBesitzer) throw new Error('Die Auswertung ist nur für den Besitzer der App sichtbar.');
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
    ui.admin.fehler = (e && e.message) || 'Die Daten konnten nicht geladen werden.';
  }
  ui.admin.laden = false;
  render();
}

// ---------- Ereignisse ----------
app.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const id = b.dataset.id;
  switch (b.dataset.a) {
    case 'bereich': ui.bereich = id; ui.problem = null; ui.ziel = null; ui.freitext = ''; render(); break;
    case 'problem': {
      ui.problem = id; ui.ziel = null;
      render();
      if (id === '*') app.querySelector('#freitext')?.focus();
      break;
    }
    case 'ziel': ui.ziel = id; render(); break;
    case 'weiter': weiter(); break;
    case 'daten': if (id === 'ja' || id === 'nein') { entscheideDaten(id); render(); } break;
    case 'zurueck': zurueck(); break;
    case 'beginnen': beginnen(); break;
    case 'check': check(id === 'ja' || id === 'nein' ? id : null); break;
    case 'feier-weiter': zeigeNaechstes(); break;
    case 'bewerte': {
      const n = Number(id);
      if (ui.feier && ui.feier.art === 'frage') bewerte(ui.feier.bewertung, n >= 1 && n <= 5 ? n : null);
      zeigeNaechstes(); break;
    }
    case 'blatt': oeffneBlatt(id); break;
    case 'blatt-zu': schliesseBlatt(); break;
    case 'premium': trackEvent('premium_clicked', { preis: PREMIUM.preis }); oeffneBlatt('premium'); break;
    case 'feedback-oeffnen': ui.fb = {}; ui.fbFehler = false; geheZu('feedback'); break;
    case 'neu-ok': { const ids = neuBereiche(); alsGesehen(ids); trackEvent('unlock_later', { anzahl: ids.length }); render(); break; }
    case 'klapp-zu': case 'klapp-auf':
      if (klapp().klappbar.includes(id)) { merke('start_klein', klappUmschalten(merkmal('start_klein'), id, b.dataset.a === 'klapp-zu')); trackEvent(b.dataset.a === 'klapp-zu' ? 'section_collapsed' : 'section_expanded', { abschnitt: id }); }
      render(); break;
    case 'premium-klein': merke('premium_klein', true); trackEvent('premium_collapsed', {}); render(); break;
    case 'premium-gross': merke('premium_klein', false); render(); break;
    case 'feedback-spaeter': merke('feedback_spaeter', K.tagKey(jetzt())); render(); break;
    case 'fb-wahl': { const [k, w] = id.split(':'); ui.fb[k] = w; render(); break; }
    case 'feedback-senden': {
      const fehlt = FEEDBACK.fragen.some(q => q.art === 'wahl' && !ui.fb[q.id]);
      if (fehlt) { ui.fbFehler = true; render(); break; }
      sendeFeedback(ui.fb); ui.fbDanke = true; geheZu('start'); break;
    }
    case 'admin': geheZu('admin'); ladeAdmin(); break;
    case 'pflege': pflegeZustand(); geheZu('pflege'); break;
    case 'pf-typ': { const p = pflegeZustand(); if (id === 'bild' || id === 'text') { p.form.typ = id; p.fehler = []; } render(); break; }
    case 'pf-neu': { const p = pflegeZustand(); p.form = leeresFormular(); p.bearbeitet = null; p.fehler = []; p.status = ''; p.formWahl = 'alle'; render(); break; }
    case 'pf-formwahl': { const p = pflegeZustand(); if (id === 'alle' || TB.FORMEN.includes(id)) p.formWahl = id; render(); break; }
    case 'pf-form-zurueck': { const p = pflegeZustand(); if (p.form.formen) delete p.form.formen[id]; render(); break; }
    case 'pf-ansicht': { const p = pflegeZustand(); if (id === 'eintraege' || id === 'medien') { p.ansicht = id; p.fehler = []; p.status = ''; p.medienLoeschen = null; } render(); break; }
    case 'pf-m-bearbeiten': { const p = pflegeZustand(); const m = tabelle.medien[id]; if (m) { p.medienBearbeitet = id; p.medienForm = { titel: m.titel || '', art: m.art }; p.medienLoeschen = null; } render(); break; }
    case 'pf-m-abbrechen': { const p = pflegeZustand(); p.medienBearbeitet = null; p.fehler = []; render(); break; }
    case 'pf-m-speichern': medienSpeichern(id); break;
    case 'pf-m-loeschen': medienLoeschen(id); break;
    case 'pf-m-verwenden': {
      const p = pflegeZustand();
      if (!tabelle.medien[id]) break;
      p.form = { ...leeresFormular(), typ: 'bild', medium: id, stil: p.form.stil || TB.ALLE };
      Object.assign(p, { ansicht: 'eintraege', bearbeitet: null, fehler: [], status: 'Bild gewählt. Jetzt Schlüssel und Stil eintragen und speichern.', formWahl: 'alle' });
      render(); app.querySelector('#pf-form')?.scrollIntoView({ block: 'start' }); break;
    }
    case 'pf-vorschlag': { const p = pflegeZustand(); p.form.schluessel = id; p.unbekanntFrage = null; eingebautVorschlagen(p); render(); break; }
    case 'pf-nur-luecken': { const p = pflegeZustand(); p.nurLuecken = !p.nurLuecken; render(); break; }
    case 'pf-speichern': pflegeSpeichern(); break;
    case 'pf-bearbeiten': pflegeBearbeiten(id); break;
    case 'pf-loeschen': pflegeLoeschen(id); break;
    case 'pf-platz': {
      const p = pflegeZustand();
      if (!STILE[p.filter]) break;
      Object.assign(p, formularFuerPlatz(p.filter, id), { fehler: [], status: '', formWahl: 'alle', loeschen: null });
      render(); app.querySelector('#pf-form')?.scrollIntoView({ block: 'start' }); break;
    }
    case 'admin-neu': ladeAdmin(); break;
    case 'admin-import': importiere(); break;
    case 'export': erstelleExport(); break;
    case 'export-kopieren': kopiereExport(); break;
    case 'export-teilen': teileExport(); break;
    case 'admin-test': ui.admin.test = !ui.admin.test; render(); break;
    case 'admin-besitzer': ui.admin.besitzer = !ui.admin.besitzer; render(); break;
    case 'stilwahl': ui.stilAuswahl = stand.stil.aktiv; geheZu('stilwahl'); break;
    case 'stil': if (istWaehlbar(id)) { ui.stilAuswahl = id; render(); } break;
    case 'stil-uebernehmen':
      try { setzeStand(K.stilWaehlen(stand, stilVorauswahl(), STIL_REIHENFOLGE, STIL_WAEHLBAR)); }
      catch (err) { hinweis = err.message; }
      speichere(); trackEvent('style_selected', { stil: stand.stil.aktiv }); geheZu('start'); break;
    case 'stil-spaeter': setzeStand(K.stilAngeboten(stand)); speichere(); geheZu('start'); break;
    case 'einstellungen': geheZu('einstellungen'); break;
    case 'start': geheZu('start'); break;
    case 'botschaft-zu':
      ui.botschaftOffen = false;
      try { setzeSpiel(H.botschaftGelesen(spiel, spiel.fokus, K.tagKey(jetzt()))); speichere(); } catch (e) { console.warn('Botschaft:', e.message); }
      render(); break;
    case 'botschaft-auf': ui.botschaftOffen = true; trackEvent('crew_message_reopened', {}); render(); break;
    case 'tab': {
      const t = TABS.find(x => x.screen === id && tabSichtbar(x));
      if (!t) break;
      if (tabAktiv(t)) { geheZu(id); break; }
      hinweis = sperrTextVon(t);
      if (ui.screen !== 'start') { geheZu('start'); break; }
      render(); break;
    }
    case 'hinweis-weg': hinweis = null; render(); break;
    case 'lb-gruppe':
      if (id === 'alle' || LOGBUCH_FILTER.some(f => f.id === id)) { ui.lb = { ...ui.lb, gruppe: id, tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_filter', {}); }
      render(); break;
    case 'lb-held':
      if (id === 'alle' || H.heldVon(spiel, id)) { ui.lb = { ...ui.lb, held: id, tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_filter', {}); }
      render(); break;
    case 'lb-filter-klapp': ui.lb = { ...ui.lb, offen: !ui.lb.offen }; render(); break;
    case 'lb-filter-weg': ui.lb = { ...ui.lb, held: 'alle', gruppe: 'alle', tage: LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_filter', {}); render(); break;
    case 'lb-mehr': ui.lb = { ...ui.lb, tage: ui.lb.tage + LOGBUCH_TAGE_JE_SEITE }; trackEvent('logbook_more', {}); render(); break;
    case 'quest-bearbeiten': questBearbeitenOeffnen(); break;
    case 'qe-anzahl': if (ui.qe) { ui.qe.anzahl = Number(id); ui.qe.fehler = { ...ui.qe.fehler, anzahl: undefined }; render(); } break;
    case 'qe-speichern': questBearbeitenSpeichern(); break;
    case 'qe-abbrechen': ui.qe = null; geheZu('start'); break;
    case 'danke-weg': ui.fbDanke = false; render(); break;
    case 'reset':
      if (!ui.resetFrage) { ui.resetFrage = true; render(); break; }
      speicher.loeschen();
      setzeSpiel(H.neuesSpiel(testerId));
      Object.assign(ui, { bereich: null, problem: null, ziel: null, freitext: '', feier: null, resetFrage: false });
      speichere();
      trackEvent('onboarding_started', { neu: true });
      geheZu('ob1');
      break;
    case 'mikro': mikro(id); break;
    case 'fokus': {
      const ausWahl = ui.heldenWahl;
      ui.heldenWahl = false; ui.botschaftOffen = false;
      if (id !== spiel.fokus) {
        const von = spiel.fokus;
        try {
          setzeSpiel(H.fokusSetzen(spiel, id)); speichere(); trackEvent('hero_focus', { held: id, quelle: ausWahl ? 'wahl' : 'karte' });
          ui.wechselVon = von; ui.einmal.add('wechsel'); ui.erfolgFrisch = null; // Version 49: Banner beim nächsten Zeichnen
        }
        catch (err) { hinweis = T('kopf.heldFehlt'); console.warn('Fokus:', err.message); }
      }
      render(); app.querySelector('.screen')?.scrollTo?.(0, 0); break;
    }
    case 'schnell':
      ui.heldenWahl = false;
      try { setzeSpiel(H.fokusSetzen(spiel, id)); }
      catch (err) { hinweis = T('kopf.heldFehlt'); console.warn('Schnell-Check:', err.message); render(); break; }
      trackEvent('hero_focus', { held: id, quelle: 'schnell' }); check('ja'); break;
    case 'helden-wahl':
      ui.heldenWahl = !ui.heldenWahl;
      if (ui.heldenWahl) trackEvent('hero_switcher_opened', {});
      render(); break;
    case 'helden-wahl-zu': ui.heldenWahl = false; render(); break;
    case 'bonus-mehr': ui.bonusMehr = !ui.bonusMehr; if (ui.bonusMehr) ui.einmal.add('bonus'); render(); break;
    case 'neues-abenteuer':
      Object.assign(ui, { neu: true, bereich: null, problem: null, ziel: null, freitext: '', obStart: Date.now() });
      trackEvent('new_adventure_started', { helden: spiel.helden.length });
      geheZu('ob1'); break;
    case 'angebot-spaeter': setzeSpiel(H.angebotAblehnen(spiel)); speichere(); trackEvent('new_adventure_declined', {}); render(); break;
    // Version 48: Öffnen der Seite liest nichts mehr; erst „Siegel brechen“ zählt den Teil als gelesen
    case 'erfolg-klein': ui.erfolgFrisch = null; trackEvent('erfolg_eingeklappt', {}); render(); break;
    case 'story-oeffnen': trackEvent('story_opened', { quelle: 'karte' }); ui.storyOffen = null; geheZu('story'); break;
    case 'story-siegel': {
      const nr = parseInt(id, 10);
      const z = I.storyZustaende(story()).find(x => x.nr === nr);
      if (!z || z.zustand !== 'siegel') { console.warn('Siegel: Teil nicht versiegelt', id); render(); break; } // z. B. doppelt getippt oder anderes Gerät war schneller
      trackEvent('story_opened', { quelle: 'siegel', teil: nr });
      storyGelesenBis(nr);
      ui.storyOffen = nr;
      ui.einmal.add('siegel');
      render();
      break;
    }
    case 'tag': {
      const n = Number(id);
      tagVersatz = n === 0 ? 0 : tagVersatz + n;
      weltenGezeigt = false; // Zeitsprung im Testprofil = wie ein neuer Besuch
      render(); pruefeWeltenwahl(); break;
    }
  }
});

// Ein „change“ beim Verlassen eines Feldes kommt vor dem Klick. Würde sofort neu gezeichnet, verschwände der
// angetippte Knopf unter dem Finger und der Klick ginge verloren. Deshalb erst nach dem Loslassen zeichnen.
let zeigerUnten = false, zeichnenOffen = false;
function renderNachZeiger() { if (zeigerUnten) zeichnenOffen = true; else render(); }
document.addEventListener('pointerdown', () => { zeigerUnten = true; }, true);
const zeigerLos = () => setTimeout(() => { zeigerUnten = false; if (zeichnenOffen) { zeichnenOffen = false; render(); } }, 0);
document.addEventListener('pointerup', zeigerLos, true);
document.addEventListener('pointercancel', zeigerLos, true);

app.addEventListener('change', e => {
  if (e.target.id === 'import-csv') importiereCsv(e.target.files && e.target.files[0]);
  if (ui.screen === 'pflege' && ui.pflege) {
    const p = ui.pflege, t = e.target;
    if (t.id === 'pf-datei') { pflegeHochladen(t.files && t.files[0]); t.value = ''; }
    else if (t.id === 'pf-medium') {
      if (t.value === '__datei') { const ein = eingebautesBild(p.form.stil, TB.normSchluessel(p.form.schluessel, 'bild')); p.form.medium = ''; p.form.datei = ein ? ein.datei : ''; }
      else { p.form.medium = t.value; p.form.datei = ''; }
      render();
    }
    else if (t.id === 'pf-stil') { p.form.stil = t.value; eingebautVorschlagen(p); render(); }
    else if (t.id === 'pf-schluessel') { p.unbekanntFrage = null; eingebautVorschlagen(p); renderNachZeiger(); }
    else if (t.id === 'pf-art') { p.form.art = t.value; }
    else if (t.id === 'pf-m-art' && p.medienForm) { p.medienForm.art = t.value; }
    else if (t.id === 'pf-filter') { p.filter = t.value; p.loeschen = null; render(); }
  }
});

app.addEventListener('input', e => {
  if (e.target.id === 'freitext') {
    ui.freitext = e.target.value.slice(0, 120);
    // Freitext wird als Ziel vorgeschlagen, bleibt aber änderbar
    if (!ui.ziel || ui.ziel === ui.letzterFreitext) ui.ziel = ui.freitext;
    ui.letzterFreitext = ui.freitext;
    const btn = app.querySelector('.fuss .cta');
    if (btn) btn.disabled = !ui.freitext.trim();
  }
  if (ui.screen === 'pflege' && ui.pflege && e.target.id && e.target.id.startsWith('pf-')) {
    const p = ui.pflege, t = e.target;
    if (t.id === 'pf-schluessel') p.form.schluessel = t.value;
    else if (t.id === 'pf-text') p.form.text = t.value;
    else if (t.id === 'pf-titel') p.form.titel = t.value;
    else if (t.id === 'pf-m-titel' && p.medienForm) p.medienForm.titel = t.value;
    else if (t.id === 'pf-x' || t.id === 'pf-y') {
      const wahl = p.formWahl || 'alle';
      const [x, y] = formPos(p.form, wahl).split(' ');
      const neu = t.id === 'pf-x' ? `${t.value}% ${y}` : `${x} ${t.value}%`;
      if (wahl === 'alle') p.form.pos = neu; else (p.form.formen ||= {})[wahl] = neu;
      // Vorschau direkt anpassen, ohne neu zu zeichnen (Regler bleibt greifbar)
      for (const k of TB.FORMEN) { const i = app.querySelector(`.pf-v-${k} img`); if (i) i.style.objectPosition = formPos(p.form, k); }
      const w = app.querySelector('#' + t.id + '-wert'); if (w) w.textContent = t.value + '%';
    }
    return;
  }
  if (e.target.id === 'qe-ziel' && ui.qe) {
    ui.qe.ziel = e.target.value.slice(0, K.ZIEL_MAX);
    // Fehlermeldung beim Tippen entfernen, ohne neu zu zeichnen (Fokus bleibt im Feld)
    if (ui.qe.fehler.ziel && ui.qe.ziel.trim()) {
      ui.qe.fehler = { ...ui.qe.fehler, ziel: undefined };
      app.querySelector('#qe-ziel-f')?.remove();
      e.target.removeAttribute('aria-invalid'); e.target.removeAttribute('aria-describedby');
    }
    return;
  }
  if (e.target.id && e.target.id.startsWith('fb-')) {
    ui.fb[e.target.id.slice(3)] = e.target.value.slice(0, 600);
    return;
  }
  if (e.target.id === 'zieltext') {
    ui.ziel = e.target.value.slice(0, 120);
    const btn = app.querySelector('.fuss .cta');
    if (btn) btn.disabled = !ui.ziel.trim();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target && e.target.id === 'qe-ziel') { e.preventDefault(); questBearbeitenSpeichern(); return; }
  if (e.key !== 'Escape') return;
  if (ui.feier) { if (ui.feier.art === 'frage') bewerte(ui.feier.bewertung, null); zeigeNaechstes(); }
  else if (ui.blatt) schliesseBlatt();
  else if (ui.heldenWahl) { ui.heldenWahl = false; render(); }
});

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
render();
pruefeWeltenwahl();

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
