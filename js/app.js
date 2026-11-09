// Oberfläche: liest Daten und Logik, rendert Bildschirme, speichert nach jeder Änderung.
import { zeigeToast } from './ansicht/toast.js'; // Etappe 3: kurze Bestätigungen als Popup
import * as K from './logik/kern.js';
import { TABELLE, pruefeTabelle } from './daten/vorlagen.js';
import { STILE, STIL_REIHENFOLGE, STIL_WAEHLBAR, istWaehlbar, stilId, EIGENE_BILDER, BILD_RUECKFALL, KULISSE_SEITEN } from './daten/stile.js';
import { KARTE, KARTE_HINTERGRUND } from './daten/karte.js';
import { bilderNoetig, fehlendeKartenbilder, istKartenPlatz, reiseTeile, reiseWeg } from './logik/karte.js';
import { AUSBAU } from './daten/stadt.js'; // Version 82: Bildplätze des Stadt-Ausbaus (Pflege)
import * as BR from './logik/bilder.js';
import { DOMAIN_RUECKFALL, LEBENSBEREICHE } from './daten/lebensbereiche.js';
import { hoechsteStufe, hoechstesKapitel, istFrei, pruefeFreischaltung, neuFreigeschaltet, pruefeFreigabe, istFreigegeben, naechsteFreigabe, freigabeKonfig, FREIGABE_ALT, allesFreiErlaubt, allesFreiAktiv, pruefeAllesFrei } from './logik/freischaltung.js';
import { TABS, MAX_TABS, FUNKTIONEN, ZAEHLER as FREI_ZAEHLER, FREIGABE, ALLES_FREI } from './daten/freischaltung.js';
import { stuetzenKonfig } from './logik/stuetzen.js'; // Version 152: Schalter „Alles freischalten“
import { RAMPE } from './daten/rampe.js';
import { TEXTE } from './daten/texte.js';
import { text as textAus, pruefeTexte } from './logik/texte.js';
import { pruefeLogbuchArten } from './logik/logbuch.js';
import { pruefeChronik } from './logik/chronik.js'; // Chronik als Buch (Etappe 2, Schritt C)
import { CHRONIK, CHRONIK_SIEGEL } from './daten/chronik.js';
import { LOGBUCH_ARTEN, LOGBUCH_FILTER, LOGBUCH_TAGE_JE_SEITE } from './daten/logbuch-arten.js';
import { momenteNachCheck, weltenwahlFaellig, pruefeMomente, konfig as momentKonfig, kapitelFaellig, kapitelGesehen, HOEHEPUNKTE } from './logik/momente.js';
import * as VS from './logik/vorstellung.js'; // Version 115: Einführung vor Anzeige
import { MOMENTE } from './daten/momente.js';
import { erstelleSpeicher } from './speicher.js';
import { erstelleAbgleich } from './abgleich.js';
import { initAnalytics, trackEvent, bewerte, letzteBewertungTag, merke, merkmal, beiAenderung, verbinde, dbSender, datenCode, formSender } from './analytics.js';
import * as X from './logik/austausch.js';
import * as V from './logik/versand.js';
import { VERSAND } from './daten/versand.js';
import { BEWERTUNGEN, EINWILLIGUNG } from './daten/forschung.js';
import * as EW from './logik/einwilligung.js';
import { TESTERHINWEIS } from './daten/testerhinweis.js'; // 09.11.2026: einmaliger Tester-Hinweis
import * as TH from './logik/testerhinweis.js';
import { TESTER_KLICKS } from './ansicht/testerhinweis.js';
import * as I from './logik/inhalte.js';
import * as H from './logik/helden.js';
import * as KAP from './logik/kapitel.js'; // Version 171: Kapitel-Archiv
import { schwereTageZahl } from './logik/antworten.js'; // Version 141: „War schwer“ zählt als schwerer Tag
import { BOTSCHAFTEN, STORIES, MIKRO, MIKRO_JE_TAG, MIKRO_RUECKFALL } from './daten/inhalte.js';
import * as TB from './logik/tabelle.js';
import { PFLEGE_FELDER, PFLEGE_KLICKS, PFLEGE_SCREENS } from './ansicht/pflege.js';
import { KAMPFBUEHNE, START_ABSCHNITTE, START_MOMENTE } from './daten/startseite.js';
import { buehneArtWahl, glanzFaellig, kurzRegel, trefferTageVor } from './logik/startseite.js';
import { comebackStand } from './ansicht/bestaendigkeit.js'; // Version 139: voller Treffer am Comeback-Tag
import { NEUIGKEITEN } from './daten/neuigkeiten.js';
import { BEWEGUNG, SPRECHBLASEN } from './daten/bewegung.js';
import { ANZEIGE } from './daten/anzeige.js'; // Blatt „Anzeige“ (Version 125)
import * as AZ from './logik/anzeige.js';
import * as GN from './logik/gegner-namen.js'; // Version 164: Gegnernamen je Stil
const { pruefeAnzeige } = AZ;
import { ablaufEndeMs, ablaufJetzt, funkenStoss, funkenWann, naechsterHalt, naechsterHaltepunkt, musterVariablen, pruefeBewegung, uebersprungenStart, weiterNachPause } from './logik/bewegung.js';
import { esc, icon, ohneEinblendung } from './ansicht/helfer.js';
import { SYMBOLE, AKTION_SYMBOLE } from './daten/symbole.js';
import { symbolFuer, pruefeSymbole, funkenListe } from './logik/symbole.js'; // Version 84: Stil-Kulisse
import { binde } from './ansicht/kontext.js';
import { klickRegister, verteile } from './logik/klicks.js';
import { feldEintrag, feldRegister, feldVerteile } from './logik/felder.js';
import * as P from './logik/pflege.js';
import { hauptAnzahl, hauptGrenzen, hauptZaehlweise, pruefeZaehlweisen, pruefeZielarten } from './logik/teilziele.js'; // Teilziele: Fundament (31.10.2026), Zählweisen (04.11.2026)
import { ordneAbschnitte, startMomente, tabPunkte, pruefeNeuigkeiten, klappZustand, klappUebernehmen } from './logik/startseite.js';
import { RAHMEN_KLICKS, baldScreen, tabLeiste, testleiste } from './ansicht/rahmen.js';
import { EINSTELLUNGEN_KLICKS, EINSTELLUNGEN_SCREENS } from './ansicht/einstellungen.js';
import { ANALYSE_ZEILEN, ONBOARDING_FELDER, ONBOARDING_KLICKS, ONBOARDING_SCREENS } from './ansicht/onboarding.js';
import { LOGBUCH_FELDER, LOGBUCH_KLICKS, LOGBUCH_SCREENS } from './ansicht/logbuch.js';
import { NOTIZ_FELDER, NOTIZ_KLICKS, notizBlattHtml } from './ansicht/notiz.js'; // Tagesnotiz (04.11.2026)
import { TAGESNOTIZ } from './daten/tagesnotiz.js';
import { pruefeTagesnotiz } from './logik/tagesnotiz.js';
import { WOCHE_FELDER, WOCHE_KLICKS, wochenBlattHtml, wochenEbene } from './ansicht/wochenrunde.js'; // Wochenrunde (05.11.2026)
import { CREW_KLICKS, crewBlattHtml, crewEbene } from './ansicht/crew.js'; // Crew-Übersicht (06.11.2026)
import { WOCHENRUNDE } from './daten/wochenrunde.js';
import { pruefeWochenrunde } from './logik/wochenrunde.js';
import { STADT_KLICKS, STADT_SCREENS, stadtBlattHtml } from './ansicht/stadt.js';
import { KARTE_KLICKS, KARTE_SCREENS, karteBlattHtml } from './ansicht/karte.js';
import { STORY_KLICKS, STORY_SCREENS } from './ansicht/story.js';
import { QUEST_FELDER, QUEST_KLICKS, QUEST_SCREENS } from './ansicht/quest-bearbeiten.js';
import { STUETZEN_FELDER, STUETZEN_KLICKS } from './ansicht/stuetzen.js';
import * as MF from './logik/mehrfach.js'; // Mehrere Helden auf einmal (05.11.2026)
import * as SP from './logik/startpaket.js'; // Startpaket mit drei Helden (02.11.2026) // Schritt „Zähler“: Stützgewohnheiten
import { STILWAHL_KLICKS, STILWAHL_SCREENS } from './ansicht/stilwahl.js';
import { FEEDBACK_FELDER, FEEDBACK_KLICKS, FEEDBACK_SCREENS } from './ansicht/feedback.js';
import { ADMIN_FELDER, ADMIN_KLICKS, ADMIN_SCREENS } from './ansicht/admin.js';
import { BLATT_KLICKS, blattHtml } from './ansicht/blatt.js';
import { EINTRAG_FELDER, EINTRAG_KLICKS, eintragBlattHtml } from './ansicht/eintrag.js';
import { NOTFALL_FELDER, NOTFALL_KLICKS, notfallBlattHtml, notfallErinnerungHtml, notfallErinnerungOffen, notfallWahlHtml, oeffneNotfall } from './ansicht/notfall.js';
import { WILLKOMMEN_KLICKS, willkommenHtml, willkommenOffen } from './ansicht/willkommen.js'; // Version 98
import { DENKEN_KLICKS, DENKEN_SCREENS } from './ansicht/denken.js'; // Seite „Wie diese App denkt“ (Version 165)
import { PLANCHECK_FELDER, PLANCHECK_KLICKS, PLANCHECK_SCREENS } from './ansicht/plancheck.js'; // Plan- und Warum-Check (Version 167)
import { PLANCHECK } from './daten/plancheck.js';
import { pruefePlancheck } from './logik/plancheck.js';
import { BEWEIS_FELDER, BEWEIS_KLICKS, BEWEIS_SCREENS } from './ansicht/beweisbuch.js'; // Brief und Beweisbuch (Version 166)
import { BEWEISBUCH } from './daten/beweisbuch.js';
import { pruefeBeweisbuch } from './logik/beweisbuch.js';
import { DENKEN } from './daten/denken.js';
import { pruefeDenken } from './logik/denken.js';
import { ABSCHLUSS_KLICKS, abschlussOffen, abschlussSeiteHtml } from './ansicht/abschluss.js'; // Version 169: Kettenende
import { RUECKBLICK_FELDER, RUECKBLICK_KLICKS, rueckblickOffen, rueckblickSeiteHtml } from './ansicht/rueckblick.js'; // Rundenrückblick (02.11.2026)
import { PROBE_KLICKS, probeBlattHtml } from './ansicht/probe.js'; // Version 81: Morgenprobe
import { ANZEIGE_KLICKS, anzeigeBlattHtml } from './ansicht/anzeige.js'; // Version 125: Blatt „Anzeige“
import { RUHETAG_KLICKS, ruhetagBlattHtml } from './ansicht/ruhetag.js'; // Version 90: Ruhetag
import { HELDENMODI_FELDER, HELDENMODI_KLICKS, neuImErhaltText } from './ansicht/heldenmodi.js'; // Heldenmodi (04.11.2026)
import { pruefeMindestRegeln, pruefeModiRegeln, rampenlichtBeimStart, rueckkehrAnwenden } from './logik/heldenmodi.js';
import { HELDENMODI } from './daten/heldenmodi.js';
import { LINK_BASIS, PROFILE, SPRUNGZIELE } from './daten/sprungziele.js';
import { NACHTRAGEN } from './daten/nachtragen.js';
import * as RT from './logik/ruhetag.js'; // Version 90: Ruhetag
import { hashFuer, leseHash, linkFuer, pruefeSprungziele, sprungEntscheid } from './logik/sprung.js';
import { MESSZIEL_FELDER, MESSZIEL_KLICKS, messzielBlattHtml, messzielSchluessel } from './ansicht/messziele.js';
import { ZIELQUEST_FELDER, ZIELQUEST_KLICKS, pruefeZielWahl } from './ansicht/zielquest.js'; // Ziel-Quests (31.10.2026)
import * as ZQ from './logik/zielquest.js';
import { IDEEN_KATEGORIEN, IDEE_TEXT_MAX, NOTFALL, NOTFALL_BEKANNT, STARTIDEEN } from './daten/notfall.js';
import { pruefeIdeen } from './logik/ideen.js';
import { EINTRAG_ARTEN, STIMMUNGEN } from './daten/eintrag-arten.js';
import { pruefeEintragArten } from './logik/eintraege.js';
import { FEIER_KLICKS, feierHtml } from './ansicht/feier.js';
import { START_KLICKS, START_KURZ, START_SCREENS, START_TEILE, buehneDauerMs, buehneLauf, buehneLesezeiten, heldenWahlHtml } from './ansicht/startseite.js';
import { BUEHNE_KLICKS } from './ansicht/buehne.js'; // 02.11.2026: aus startseite.js ausgelagert
import { NACHTRAG_KLICKS } from './ansicht/nachtrag.js';

export const VERSION = { nr: 172, datum: '09.11.2026 · 15:28' };

// Version 78: Hash aus Profil und Sprungziel (daten/sprungziele.js), z. B. #notfall oder #test+notfall.
const HASH = leseHash(location.hash, { profile: PROFILE, ziele: SPRUNGZIELE });
if (HASH.unbekannt.length) console.warn('Adresse: unbekannte Teile ignoriert:', HASH.unbekannt.join(', '));
const istTest = HASH.profil === 'test';
const istAdmin = HASH.profil === 'admin';
const speicher = erstelleSpeicher(istTest ? 'test' : 'haupt');
const testerId = speicher.testerId();
let tagVersatz = 0; // nur Testprofil
let stundenVersatz = 0; // nur Testprofil (Version 130): Uhrzeit verschieben, z. B. für die Tagesnotiz am Abend
const jetzt = () => { const d = new Date(); d.setDate(d.getDate() + tagVersatz); if (stundenVersatz) d.setTime(d.getTime() + stundenVersatz * 3600000); return d; };
initAnalytics({ testerId, profil: istTest ? 'test' : 'haupt', heute: jetzt, app: VERSION.nr });

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
// Tester-Hinweis (09.11.2026): einmalige Kenntnisnahme, je Browser gespeichert wie die Einwilligung (kein Spielstand-Feld).
// Das ist keine Einwilligung und ändert nichts an der Übertragung. Kaputte oder fehlende Werte = noch nicht gesehen.
let testerHinweis = TH.lies(speicher.einstellung(TESTERHINWEIS.einstellung), TESTERHINWEIS.version);
function bestaetigeTesterHinweis() {
  try {
    testerHinweis = TH.lies(TH.bestaetige(K.tagKey(new Date()), TESTERHINWEIS.version), TESTERHINWEIS.version);
  } catch (e) { console.warn('Tester-Hinweis:', e.message); return; }
  if (!speicher.setzeEinstellung(TESTERHINWEIS.einstellung, { tag: testerHinweis.tag, version: testerHinweis.version })) console.warn('Tester-Hinweis: nur bis zum Schließen gespeichert');
}
TH.pruefeTesterhinweis(TESTERHINWEIS, TEXTE).forEach(m => console.warn(m));

const app = document.getElementById('app');
const systemRuhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Blatt „Anzeige“ (Version 125): Einstellungen dieses Geräts (daten/anzeige.js). bewegungAus folgt seither der Wahl
// „Bewegung“ (Standard: wie das Betriebssystem), atmosphaereAus zusätzlich bei „Ruhig“ (Auftritt, Zoom, Funken, Nebel).
pruefeAnzeige(ANZEIGE).forEach(m => console.warn(m));
pruefeTagesnotiz(TAGESNOTIZ, { texte: TEXTE }).forEach(m => console.warn(m)); // Tagesnotiz (04.11.2026)
pruefeWochenrunde(WOCHENRUNDE, { texte: TEXTE }).forEach(m => console.warn(m)); // Wochenrunde (05.11.2026)
pruefeModiRegeln(HELDENMODI).forEach(m => console.warn('Heldenmodi:', m)); // Heldenmodi (04.11.2026)
pruefeMindestRegeln(undefined, HELDENMODI, Object.keys(K.XP)).forEach(m => console.warn('Mindestaufgabe:', m)); // 04.11.2026
let anzeigeGewaehlt = AZ.liesGewaehlt(speicher.einstellung(ANZEIGE.einstellung), ANZEIGE);
let anzeige = AZ.wirksam(anzeigeGewaehlt, ANZEIGE, { systemRuhig });
let bewegungAus = anzeige.bewegung === 'aus';
let atmosphaereAus = anzeige.bewegung !== 'voll';
// Bewegung (Version 46): Werte aus daten/bewegung.js als CSS-Variablen; ungültige Zahl → Standard.
const zahl = (v, std, min, max) => (Number.isFinite(v) && v >= min && v <= max ? v : std);
const BW = {
  versatz: zahl(BEWEGUNG?.auftritt?.versatzMs, 40, 0, 300),
  dauer: zahl(BEWEGUNG?.auftritt?.dauerMs, 380, 0, 1500),
  maxKarten: Math.round(zahl(BEWEGUNG?.auftritt?.maxKarten, 8, 0, 30)),
  auftritt: BEWEGUNG?.auftritt?.aus !== true, // zusätzlich nur bei Bewegung „Voll“ (atmosphaereAus)
  zoom: zahl(BEWEGUNG?.atmosphaere?.zoomS, 20, 0, 120),
  fackel: zahl(BEWEGUNG?.atmosphaere?.fackelS, 3.2, 0, 30), // Version 84: Fackelschein der Arena
  nebel: zahl(BEWEGUNG?.atmosphaere?.nebelS, 40, 0, 300) // 04.11.2026: ziehender Nebel am Ende der Karte
};
{
  const r = document.documentElement.style;
  r.setProperty('--bw-versatz', BW.versatz + 'ms');
  r.setProperty('--bw-dauer', BW.dauer + 'ms');
  r.setProperty('--bw-zoom', BW.zoom ? BW.zoom + 's' : '0s');
  r.setProperty('--bw-fackel', BW.fackel ? BW.fackel + 's' : '0s');
  r.setProperty('--bw-nebel', BW.nebel ? BW.nebel + 's' : '0s');
  for (const [k, w] of Object.entries(musterVariablen(BEWEGUNG))) r.setProperty(k, w); // Übergangs-Muster (Version 162)
}
// Anzeige auf <html> anwenden: data-Attribute (bilder, prunk, bewegung, text) und --text-skala. Wirft nie.
function wendeAnzeigeAn() {
  try {
    const d = AZ.rootDaten(anzeige, ANZEIGE);
    const el = document.documentElement;
    for (const [name, wert] of Object.entries(d.attribute)) {
      if (wert === null) delete el.dataset[name]; else el.dataset[name] = wert;
    }
    // Bewegung „Aus“ durch das System: data-bewegung bleibt „aus“ (wie bisher), auch ohne eigene Wahl
    if (bewegungAus) el.dataset.bewegung = 'aus';
    if (d.skala === 1) el.style.removeProperty('--text-skala'); else el.style.setProperty('--text-skala', String(d.skala));
  } catch (e) { console.warn('Anzeige:', e.message); }
}
wendeAnzeigeAn();
// Wahl im Blatt „Anzeige“: prüfen, auf diesem Gerät merken, anwenden. Unbekannte Option/Wert → Warnung, nichts ändert sich.
function setzeAnzeige(k, wert) {
  let neu;
  try { neu = AZ.waehle(anzeigeGewaehlt, k, wert, ANZEIGE); }
  catch (e) { console.warn('Anzeige:', e.message); return false; }
  anzeigeGewaehlt = neu;
  anzeige = AZ.wirksam(anzeigeGewaehlt, ANZEIGE, { systemRuhig });
  bewegungAus = anzeige.bewegung === 'aus';
  atmosphaereAus = anzeige.bewegung !== 'voll';
  if (!speicher.setzeEinstellung(ANZEIGE.einstellung, anzeigeGewaehlt)) console.warn('Anzeige: nur bis zum Schließen gespeichert');
  wendeAnzeigeAn();
  trackEvent('display_changed', { option: k, wert }); // nur Option und Wert, nichts Persönliches
  return true;
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
  // Pause mit Rückkehr-Datum (09.11.2026): vorbei? Dann kehrt der Held in den Modus davor zurück (Fokus voll: Erhalt).
  // Hier ohne Speichern (der Abgleich ist noch nicht bereit); der Schritt ist wiederholbar und wird beim nächsten Speichern festgehalten.
  try { spiel = rueckkehrAnwenden(spiel, K.tagKey(jetzt())).spiel; } catch (e) { console.warn('Rückkehr aus der Pause:', e.message); }
  // Heldenmodi (04.11.2026): pausiert der zuletzt gewählte Held heute, beginnt der Tag mit einem Helden im Fokus
  const imFokus = rampenlichtBeimStart(spiel, K.tagKey(jetzt()));
  if (imFokus) spiel = { ...spiel, fokus: imFokus };
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
  stadtBlatt: null,   // Bezirksblatt der Stadt (05.11.2026): domainId eines Bezirks ohne oder mit mehreren Helden
  eintrag: null,      // Eintragsblatt (Version 75): { art, heroId, situation, stimmung, text, fehler }
  woche: null,        // Wochenrunde (05.11.2026): { woche, schritt, wheel, vorher, gewaehlt, vorsatz, vorsatzAlt, info, fehler }, ansicht/wochenrunde.js
  beweis: null,       // Brief und Beweisbuch (Version 166): Editor { id, heroId, text, fehler, loeschenSicher } oder null, ansicht/beweisbuch.js
  beweisZurueck: null,
  plancheck: null,    // Plan- und Warum-Check (Version 167): Antworten der Seite { wenndann, warum, plan, warumNeu, fehler } oder null, ansicht/plancheck.js
  notiz: null,        // Tagesnotiz (04.11.2026): { id, tag, bereiche, stimmung, felder, fehler, loeschenSicher }, ansicht/notiz.js
  notfall: null,      // Notfallkarte (Version 75, Seite seit 97): { heroId, schritt, idee, verwalten, neuText, neuKat, fehler, frage }
  messziel: null,     // Messziele (Version 76): { heroId, modus, zielId, form, wert, fehler, frage, erreicht }
  heldenWahl: false,  // Popup „Helden wechseln“ (Version 43)
  crew: null,         // Blatt „Crew planen“ (06.11.2026): { info }, ansicht/crew.js; crewRuhe: { modus: true } = Gruppe aufgeklappt
  crewRuhe: null,
  notfallWahl: false, // Wahl „Für wen?“ des Schnellwegs „Gerade schwer“ (Version 139)
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
  kapitelFuer: null,  // Version 171: gilt nur mit neu = true: heroId, dessen neues Ziel (Kapitel) gewählt wird; sonst null
  mehrfach: null,     // Mehrere Helden auf einmal (05.11.2026): { auswahl, fehler }; Startpaket (06.11.): + paket, zurueck
  obAura: null,       // Aura des ersten Gegners im Onboarding (05.11.2026): { gegner, auraStart }
  bereich: stand.onboarding.bereich,
  problem: stand.onboarding.problem,
  ziel: stand.onboarding.ziel,
  freitext: stand.onboarding.freitext || '',
  warum: '',          // Warum-Feld im Onboarding (Version 75), nur in dieser Sitzung
  zielart: 'aendern', // Ziel-Quests (31.10.2026): Tür im Onboarding, 'aendern' | 'erreichen' (ZIEL_TUEREN)
  zq: null,           // Ziel-Quests: { vorlage, form, fehler, werte } für die Tür „erreichen“, nur in dieser Sitzung
  feier: null,        // { art: 'sieg' | 'levelup', ... }
  pflege: null,       // Inhalte pflegen (Version 29), siehe neuesPflegeFormular()
  stilAuswahl: null,
  resetFrage: false,
  sprungInfo: null,
  probe: null,         // Version 81: Held, dessen Morgenprobe aufgeklappt ist (nur diese Sitzung)
  probeBlatt: null,    // Version 81: ausführliche Morgenprobe offen ({ fehler })
  ruhetag: null,       // Version 90: Ruhetag-Blatt offen ({ tag, aus, fehler, meldung })
  nachtrag: null,      // Version 79: { heroId, tag } – Heldentat zeigt einen vergangenen Tag
  nachtragWahl: false, // Version 79: Tageswahl „Anderen Tag eintragen“ offen
  buehne: null,        // Kampfbühne (31.10.2026): { heroId, tag, startMs, art } nach „Ja“ → Ablauf bis zum Ruhezustand (nur diese Sitzung)
  ratOffen: null,      // Kampfbühne: Held, dessen „Rat für heute“ aufgeklappt ist (nur diese Sitzung)   // Version 78: Rückmeldung zu „Link kopieren“ in den Einstellungen { id, text }
  analyseSchritt: 0,
  wackeln: false,
  xpFlug: null,
  lb: { held: 'alle', gruppe: 'alle', tage: LOGBUCH_TAGE_JE_SEITE, offen: false, ansicht: null, buchTage: CHRONIK.tageJeSeite, bereiche: [], suche: '', sucheEingabe: '' } // Logbuch-Filter (Version 41), nur in dieser Sitzung; offen = Filter ausgeklappt (Version 56); ansicht: Buch/Liste (Chronik, aus dem Browser beim ersten Öffnen)
};

function speichere() {
  const ok = speicher.speichern(spiel);
  if (!ok && !hinweis) hinweis = T('hinweis.speichernAus');
  if (abgleich) abgleich.geaendert(); // Version 77: gebündelt in die Datenbank (nur claude.ai)
}

// ---------- Abgleich mit der Datenbank (Version 77) ----------
// Nur auf claude.ai mit Konto; GitHub Pages und Betrachter ohne Schreibrecht bleiben beim Browser (abgleich = null
// bzw. Status „nur-browser“). Logik: abgleich.js und logik/abgleich.js.
let abgleich = null;
let abgleichGemeldet = false;
const abgleichMetaName = 'abgleich-' + (istTest ? 'test' : 'haupt');
const abgleichStatus = () => (abgleich ? abgleich.status() : 'aus');
// Stand von einem anderen Gerät übernehmen: wie beim Laden prüfen und migrieren, nur im Browser sichern
// (nicht erneut hochladen), Bildschirm passend wählen.
function uebernimmFremdenStand(roh, info = {}) {
  const neu = H.migriereSpiel(roh, testerId, STIL_REIHENFOLGE, zuordnung, migWarnung);
  neu.stil.aktiv = stilId(neu.stil.aktiv);
  setzeSpiel(neu);
  vorstellungAltbestand(false); // Version 115: älterer Stand vom anderen Gerät ohne „vorgestellt“
  if (!speicher.speichern(spiel) && !hinweis) hinweis = T('hinweis.speichernAus');
  const ob = stand.onboarding;
  if (ob.fertig && /^ob/.test(ui.screen)) ui.screen = 'start';
  else if (!ob.fertig && !istAdmin && !/^ob/.test(ui.screen)) ui.screen = 'ob1';
  if (!ob.fertig) Object.assign(ui, { bereich: ob.bereich, problem: ob.problem, ziel: ob.ziel, freitext: ob.freitext || '' });
  if (info.sicherung || !abgleichGemeldet) hinweis = T(info.sicherung ? 'abgleich.uebernommenSicherung' : 'abgleich.uebernommen');
  abgleichGemeldet = true;
  render();
  if (sprungOffen) sprungAusfuehren(true); // Version 78: neues Gerät, #notfall wartete auf den Spielstand aus dem Konto
}
async function starteAbgleich(db, user) {
  if (!db || !user || typeof user.id !== 'function') return;
  let uid = null;
  try { uid = await user.id(); } catch (e) { console.warn('Abgleich (Konto):', e.message); }
  if (!uid) return; // abgemeldet: kein privater Bereich, alles bleibt im Browser
  try {
    abgleich = erstelleAbgleich({
      db, uid, profil: istTest ? 'test' : 'haupt',
      leseMeta: () => { const r = speicher.einstellung(abgleichMetaName); return r ? JSON.parse(r) : null; },
      schreibeMeta: m => speicher.setzeEinstellung(abgleichMetaName, m),
      holeSpiel: () => spiel,
      uebernimm: uebernimmFremdenStand,
      melde: art => { if (art === 'zu-gross' || art === 'fehler') { hinweis = T(`einst.abgleich.${art}`); render(); } }
    });
  } catch (e) { console.warn('Abgleich:', e.message); abgleich = null; return; }
  abgleich.beiStatus(() => { if (ui.screen === 'einstellungen') render(); });
  addEventListener('pagehide', () => abgleich && abgleich.jetztSichern());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && abgleich) abgleich.jetztSichern(); });
  abgleich.start();
}

// ---------- Helfer ----------
// Gegnernamen je Stil (Version 164, logik/gegner-namen.js): Standardnamen einmal merken, bei Stilwechsel die Gegner-Tabelle angleichen.
const GEGNER_BASIS = GN.macheBasis(TABELLE.gegner);
GN.pruefeGegnerNamen(STILE, TABELLE.gegner).forEach(m => console.warn(m));
pruefeDenken(DENKEN, TEXTE, STILE).forEach(m => console.warn(m)); // Version 165: Zusagen und Glossar vollständig?
pruefeBeweisbuch(BEWEISBUCH, TEXTE, { arten: EINTRAG_ARTEN, notfallPfade: NOTFALL.pfade, notfallBekannt: NOTFALL_BEKANNT }).forEach(m => console.warn(m)); // Version 166: Brief und Beweisbuch vollständig?
pruefePlancheck(PLANCHECK, TEXTE, EINTRAG_ARTEN).forEach(m => console.warn(m)); // Version 167: Plan-Check vollständig?
let gegnerNamenStil = null;
function gegnerNamenAbgleichen() {
  const id = stand && stand.stil ? stand.stil.aktiv : null;
  if (!id || id === gegnerNamenStil) return;
  gegnerNamenStil = id;
  GN.wendeGegnerNamenAn(TABELLE.gegner, GEGNER_BASIS, STILE, id);
}
const stil = () => { gegnerNamenAbgleichen(); return STILE[stand.stil.aktiv] || STILE.fantasy; };
// Vorauswahl in der Weltenwahl (Version 33): gewählte → aktive → erste wählbare Welt; nie eine gesperrte.
const stilVorauswahl = () => [ui.stilAuswahl, stand.stil.aktiv].find(id => id && istWaehlbar(id)) || STIL_WAEHLBAR[0];
const wort = k => stil().wort[k] || STILE.fantasy.wort[k];
// Rangnamen je Stil (Version 80); fehlt die Liste im Stil, gelten die Standard-Titel aus kern.js
const titel = level => K.titelFuer(level, stil().titel);
const naechsterTitel = level => K.naechsterTitel(level, stil().titel);
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
// Version 84: Symbol je Stil und Schlüssel (stile.js `symbole`), Rückfall Fantasy → standard (logik/symbole.js)
const symbol = (schluessel, standard) => symbolFuer(STILE, SYMBOLE, stand.stil.aktiv, schluessel, standard);
// Funken der Arena (Anzahl und Dauer aus daten/bewegung.js `atmosphaere`); bei „Bewegung reduzieren“ keine.
// 02.11.2026 (Entscheidung 25): ohne stoss nur bei funkenWann 'immer' (dauernd); mit stoss = { ablauf, vergangenMs } ein
// kurzer Stoß im Ablauf nach „Ja“ (Teil „funken“), außer funkenWann 'nie'.
const arenaFunken = (stoss = null) => {
  if (bewegungAus) return [];
  const wann = funkenWann(BEWEGUNG);
  const n = BEWEGUNG?.atmosphaere?.funken;
  if (stoss) return wann === 'nie' ? [] : funkenStoss(BEWEGUNG, stoss.ablauf, 'funken', funkenListe(n, [0.7, 1]), stoss.vergangenMs);
  // Dauerfunken sind Atmosphäre: bei Bewegung „Ruhig“ keine (der Stoß nach „Ja“ ist Rückmeldung und bleibt)
  return wann === 'immer' && !atmosphaereAus ? funkenListe(n, BEWEGUNG?.atmosphaere?.funkenS) : [];
};
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
  const s = new Set(['szene', 'karte', KARTE_HINTERGRUND.platz]); // karte = Bild der Welt in der Stilwahl, karte-hintergrund = Tab Karte (Version 122)
  // Version 126: Bildfolge der Karte, so viele Nummern wie die längste Reise braucht (mindestens 3). Plätze je Held
  // (karte-hintergrund-<held>-<nr>) werden nicht aufgezählt; die Pflege kennt sie über istKartenPlatz.
  for (let nr = 1; nr <= Math.max(3, kartenBedarf()); nr++) s.add(`${KARTE_HINTERGRUND.platz}-${nr}`);
  for (const st of Object.values(STILE)) Object.keys(st.bilder || {}).forEach(k => s.add(k));
  for (const m of Object.values(EIGENE_BILDER)) Object.keys(m).forEach(k => s.add(k));
  Object.keys(TABELLE.helden || {}).forEach(h => { s.add(h); s.add('banner-' + h); });
  Object.keys(TABELLE.gegner || {}).forEach(g => { s.add('boss-' + g); s.add('story-' + g); }); // story-: optional (Version 40), sonst Bossbild
  AUSBAU.schwellen.forEach((_, i) => s.add(AUSBAU.platz + (i + 1))); // Version 82: Ausbau der Stadt je Stil selbst pflegbar
  return [...s].sort();
}

// Wie viele Kartenbilder die längste Reise aller Helden braucht (Version 126, für die Pflege). Fehler → 1.
function kartenBedarf() {
  let n = 1;
  for (const h of (spiel && spiel.helden) || []) {
    try { n = Math.max(n, bilderNoetig(reiseTeile(reiseWeg(H.ansicht(spiel, h.heroId), jetzt(), KARTE).orte).orte.length, KARTE_HINTERGRUND)); }
    catch (e) { /* Held ohne Quest: zählt nicht */ }
  }
  return n;
}
// Fehlende Bilder der gemeinsamen Kartenfolge eines Stils (Pflege-Hinweis „Kartenbild 3 fehlt“), nie in der App.
const kartenLuecken = stilId => fehlendeKartenbilder(kartenBedarf(), p => bildFuer(stilId, p, 'szene', 'breit'), KARTE_HINTERGRUND);
const kartenPlatzBekannt = k => istKartenPlatz(k, KARTE_HINTERGRUND);

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
// form: 'rund' | 'quadrat' | 'auftritt' | 'breit' | 'arena' → eigener Ausschnitt je Darstellung, sonst gemeinsamer Ausschnitt.
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
const FORM_JE_KLASSE = { rund: 'rund', 'rund-klein': 'rund', 'kopf-bild': 'rund', 'stapel-bild': 'rund', 'wahl-bild': 'rund', 'weiter-bild': 'rund', 'tl-bild': 'rund', 'rb-wachs-bild': 'rund', 'mikro-held': 'rund', 'arena-bild': 'arena' };
const formVon = cls => String(cls).split(/\s+/).map(c => FORM_JE_KLASSE[c]).find(Boolean) || 'breit';

function img(platz, text, art, cls = '', alt = '', form = formVon(cls)) {
  // Blatt „Anzeige“ (Version 125): „Bilder aus“ zeigt bei großen Darstellungen die stilfarbene Fläche des Stils
  // (Platzhalter-Datei, wenige hundert Byte); runde Porträts bleiben. Größe und Ausschnitt bleiben gleich.
  if (AZ.bildVerborgen(anzeige, form)) {
    const ph = TB.platzhalterPfad(stand.stil.aktiv, art);
    return `<img class="${cls} bild-aus" src="${esc(ph)}" data-ph2="${esc(platzhalter(text, art))}" alt="${esc(alt)}" loading="lazy">`;
  }
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
  // rueckfaelle (Version 75): Zahl der schweren Tage (schaltet die Notfallkarte frei); seit Version 141 Einträge „schwer“
  // und Antworten „War schwer“, je Held und Tag einmal
  zaehler: { siege: H.gesamtSiege(spiel), rueckfaelle: schwereTageZahl(spiel) }
});
// Version 152: Schalter „Alles freischalten“ (daten/freischaltung.js ALLES_FREI): nur im Testprofil und für den Besitzer,
// gemerkt im Browser je Profil (nicht im Spielstand). Hebt Regeln, Taktung, Weltenwahl- und Stützgewohnheiten-Sperre auf.
pruefeAllesFrei(ALLES_FREI).forEach(m => console.warn('Alles freischalten:', m));
const profilName = istTest ? 'test' : 'haupt';
const allesFreiAblage = `${ALLES_FREI.schluessel}.${profilName}`;
let allesFreiAn = (() => { try { return localStorage.getItem(allesFreiAblage) === '1'; } catch (e) { return false; } })();
const allesFreiMoeglich = () => allesFreiErlaubt({ profil: profilName, istBesitzer: ui.istBesitzer });
const allesFrei = () => allesFreiAktiv({ profil: profilName, istBesitzer: ui.istBesitzer, an: allesFreiAn });
function setzeAllesFrei(an) {
  if (!allesFreiMoeglich()) { console.warn('Alles freischalten: nur im Testprofil für den Besitzer'); return false; }
  allesFreiAn = an === true;
  try { if (allesFreiAn) localStorage.setItem(allesFreiAblage, '1'); else localStorage.removeItem(allesFreiAblage); }
  catch (e) { console.warn('Alles freischalten: Browser speichert nicht, gilt nur bis zum Neuladen'); }
  trackEvent('test_alles_frei', { an: allesFreiAn });
  return true;
}
const stuetzenCfg = () => stuetzenKonfig(allesFrei());
const regelFrei = r => allesFrei() || istFrei(r, freiKontext(), m => console.warn(m), FREI_ZAEHLER);
// Version 69: höchstens eine Freischaltung pro Tag (Regeln: daten/freischaltung.js FREIGABE, Logik: logik/freischaltung.js).
// angekuendigt(id): freigegeben (oder nicht getaktet). nutzbar(id): bei sperreBisFreigabe erst nach der Freigabe.
const FG = freigabeKonfig(FREIGABE);
const angekuendigt = id => istFreigegeben(id, spiel.freigaben, FG);
const nutzbar = id => allesFrei() || !FG.sperreBisFreigabe || angekuendigt(id);
const tabAktiv = t => regelFrei(t.frei) && nutzbar(t.screen);
const tabVerdientGesperrt = t => regelFrei(t.frei) && !nutzbar(t.screen);
// Etappe 3, Teil A: Status je Tab für die Aufteilung Leiste / „Bald“ (logik/freischaltung.js teileBald)
const tabStatus = t => (tabAktiv(t) ? 'frei' : tabVerdientGesperrt(t) ? 'verdient' : 'gesperrt');
// Version 50: frisch freigeschaltete Bereiche, bis sie geöffnet oder mit „Später“ bestätigt wurden (spiel.neuGesehen)
const neuBereiche = () => neuFreigeschaltet(TABS.filter(tabSichtbar), t => tabAktiv(t) && angekuendigt(t.screen), spiel.neuGesehen);
// Version 69: Welten und erstes „Neues Abenteuer?“ nur, wenn verdient UND freigegeben (bei Sperre)
const weltenFrei = () => (allesFrei() || !!stand.stil.frei) && nutzbar('welten');
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
// richtet sich nach dem Ende des Ablaufs, der gerade läuft, plus Puffer aus MOMENTE.pauseMs (02.11.2026: vorher immer
// „tagesCheck“, auch wenn die Bühne einen anderen Ablauf zeigte). Ohne Bühnen-Ablauf gilt „tagesCheck“.
pruefeBewegung(BEWEGUNG, { pauseMs: MK.pauseMs }).forEach(m => console.warn('Bewegung:', m));
// Zeit ab Start des Ablaufs (Lesezeiten des Durchgangs eingerechnet); ohne Bühnen-Ablauf ab jetzt.
const pauseNachCheck = art => {
  if (bewegungAus) return 0;
  const id = art && KAMPFBUEHNE.ablauf[art];
  return (id ? ablaufEndeMs(buehneLauf(ui.buehne), id) : ablaufEndeMs(BEWEGUNG, 'tagesCheck')) + MK.pauseMs;
};
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
// Version 115 ('vorstellung'): gesehen gilt auf allen Geräten (spiel.vorgestellt) und erst, wenn die Vorstellung durchgetippt
// ist (zeigeNaechstes). Kennung mit Präfix „boss:“ (logik/vorstellung.js).
const mitVorstellung = () => MK.kapitelwechsel === 'vorstellung';
function kapitelJetzt() {
  if (ui.feier || ui.blatt || ui.screen !== 'start' || !stand.onboarding.fertig || !stand.quest) return null;
  try {
    const a = K.auswertung(stand, jetzt());
    if (mitVorstellung()) return kapitelFaellig(a, K.kette(stand), `boss:${kapitelBasis()}`, spiel.vorgestellt || [], MOMENTE, { siege: stand.siege });
    return kapitelFaellig(a, K.kette(stand), kapitelBasis(), merkmal('kapitel_gesehen'), MOMENTE, { siege: stand.siege });
  }
  catch (e) { console.warn('Kapitelwechsel:', e.message); return null; }
}
function pruefeKapitelwechsel(f = kapitelJetzt()) {
  if (!f) return false;
  if (!mitVorstellung()) merke('kapitel_gesehen', kapitelGesehen(merkmal('kapitel_gesehen'), f.kennung));
  ui.schlange.push(...f.momente);
  zeigeNaechstes();
  return true;
}
// ---------- Einführung vor Anzeige (Version 115) ----------
// Offene Vorstellung des Helden im Rampenlicht (oder null). Wirft nie.
function vorstellungOffen(a = null) {
  if (!mitVorstellung() || !stand.quest) return null;
  try { return VS.offeneVorstellung(a || K.auswertung(stand, jetzt()), K.kette(stand), kapitelBasis(), spiel.vorgestellt); }
  catch (e) { console.warn('Vorstellung:', e.message); return null; }
}
// Bleibt der neue Gegner verhüllt? Für die Ansichten (startseite.js besiegtHeuteVorNeuem, Karte).
function gegnerVerhuellt(a) { return !!vorstellungOffen(a); }
// Vorstellung als gesehen merken (alle Geräte).
function vorstellungGesehen(k) {
  if (VS.istVorgestellt(spiel.vorgestellt, k) && Array.isArray(spiel.vorgestellt)) return;
  setzeSpiel({ ...spiel, vorgestellt: VS.merkeVorgestellt(spiel.vorgestellt, k) });
  speichere();
}
// Hinweis „Später ansehen“ → Vorstellung jetzt zeigen.
function vorstellungZeigen() {
  const v = vorstellungOffen();
  const m = VS.vorstellungMoment(v);
  if (!m) { render(); return; }
  trackEvent('boss_intro_opened', { kapitel: m.kapitel });
  ui.schlange.unshift(m);
  if (!ui.feier) zeigeNaechstes(); else render();
}
// „Später ansehen“: Vorstellung schließen, ohne sie als gesehen zu merken (der Neue bleibt verhüllt, Hinweis auf der Startseite).
function vorstellungSpaeter() {
  if (ui.feier && ui.feier.art === 'gegner') { ui.feier.spaeter = true; trackEvent('boss_intro_later', { kapitel: ui.feier.kapitel }); }
  zeigeNaechstes();
}
// Altbestand (Stand vor Version 115, vorgestellt = null): bekannte Gegner gelten als gesehen. Offen bleibt nur der Neue am
// Siegtag (nach der alten Regel noch verhüllt). Den je Gerät gemerkten Kapitelwechsel (Version 68) nutzen wir bewusst nicht:
// ein zweites Gerät ohne diese Notiz würde sonst einen längst bekannten Gegner noch einmal vorstellen.
function vorstellungAltbestand(mitSpeichern = true) {
  if (spiel.vorgestellt !== null && spiel.vorgestellt !== undefined) return;
  const helden = [];
  for (const h of spiel.helden) {
    try {
      const st = H.ansicht(spiel, h.heroId);
      if (!st.quest) continue;
      const a = K.auswertung(st, jetzt());
      const basis = `${h.heroId}|${st.quest.start}|${st.quest.vorlageId}`;
      helden.push({ basis, gegnerNr: a.gegnerNr, offen: a.siegHeute === true && a.neuerGegner === true && a.rundeTag < 0 });
    } catch (e) { console.warn('Vorstellung (Altbestand):', e.message); }
  }
  setzeSpiel({ ...spiel, vorgestellt: VS.vorgestelltAltbestand(helden) });
  if (mitSpeichern) speichere();
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
  if (allesFrei()) return null; // Version 152: alles schon nutzbar, keine Ankündigungen (Takt und „Verdient!“ ruhen)
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
  // Pause mit Rückkehr-Datum (09.11.2026): bei jedem Besuch und nach jedem Zeitsprung prüfen, ob eine Rückkehr fällig ist
  try {
    const rk = rueckkehrAnwenden(spiel, K.tagKey(jetzt()));
    if (rk.zurueck.length) { setzeSpiel(rk.spiel); speichere(); render(); }
  } catch (e) { console.warn('Rückkehr aus der Pause:', e.message); }
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
pruefeChronik(CHRONIK, { logbuchArten: LOGBUCH_ARTEN, siegelAussehen: CHRONIK_SIEGEL, texte: TEXTE }).forEach(m => console.warn(m));
pruefeZielarten().forEach(m => console.warn('Zielarten:', m));
pruefeZaehlweisen().forEach(m => console.warn('Zählweisen:', m)); // Zählweisen (04.11.2026)
pruefeIdeen(STARTIDEEN, { kats: IDEEN_KATEGORIEN, max: IDEE_TEXT_MAX, faehigkeiten: Object.keys(TABELLE.faehigkeiten) }).forEach(m => console.warn('Ideenglas:', m));
// Version 127: alle Pfade der Weiche; unbekannte Abschnitte und Zustände ohne Text melden (sie würden still fehlen)
Object.entries(NOTFALL.pfade).forEach(([z, p]) => p.filter(a => !NOTFALL_BEKANNT.includes(a)).forEach(a => console.warn('Notfallkarte: unbekannter Abschnitt', a, 'im Pfad', z)));
NOTFALL.zustaende.filter(z => !(`notfall.zustand.${z}` in TEXTE)).forEach(z => console.warn('Notfallkarte: Text fehlt für Zustand', z));
pruefeEintragArten(EINTRAG_ARTEN, { texte: TEXTE, logbuchArten: LOGBUCH_ARTEN, stimmungen: STIMMUNGEN }).forEach(m => console.warn('Einträge:', m));

// ---------- Inhalte pflegen (Version 29; Logik seit 30.10.2026 in logik/pflege.js, Ansicht in ansicht/pflege.js) ----------
function pflegeZustand() {
  if (!ui.pflege) ui.pflege = P.neuerZustand();
  return ui.pflege;
}
const pflegeKontext = () => ({ stile: STIL_REIHENFOLGE, medien: tabelle.medien, standardTexte: TEXTE });
// Umgebung der Pflege-Aktionen: Datenbank und Bildspeicher nur über den Adapter (später austauschbar, z. B. eigenes Hosting).
const pflegeUmgebung = () => ({
  speicher: P.dbAdapter(ui.db, ui.assets), T, zeichne: render, jetzt: () => new Date(), tabelle: () => tabelle,
  kontext: pflegeKontext, plaetze: bildPlaetze, platzBekannt: kartenPlatzBekannt, stilName: id => (STILE[id] || { name: id }).name
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
for (const [quelle, teil] of Object.entries({ ONBOARDING_SCREENS, START_SCREENS, LOGBUCH_SCREENS, STADT_SCREENS, KARTE_SCREENS, STORY_SCREENS, QUEST_SCREENS, STILWAHL_SCREENS, FEEDBACK_SCREENS, DENKEN_SCREENS, PLANCHECK_SCREENS, BEWEIS_SCREENS, EINSTELLUNGEN_SCREENS, ADMIN_SCREENS, PFLEGE_SCREENS })) {
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
// Welche Ebene über dem Bildschirm offen ist (Einblendung, Blatt, Heldenwahl …); null = keine. Nach dem Zeichnen
// abgefragt, weil Blätter sich beim Zeichnen selbst schließen können.
function ebenenSchluessel() {
  if (ui.feier) return 'feier:' + ui.feier.art + ':' + (ui.feier.bewertung || ui.feier.nr || ui.feier.gegner || '');
  if (ui.blatt) return 'blatt:' + ui.blatt;
  if (ui.stadtBlatt) return 'stadt:' + ui.stadtBlatt; // Stadt als Einstieg (05.11.2026)
  if (ui.karteOrt) return 'karte:' + ui.karteOrt.heroId + ':' + ui.karteOrt.i;
  if (ui.eintrag) return 'eintrag:' + ui.eintrag.art;
  if (ui.woche) return wochenEbene(); // Wochenrunde: jeder Schritt beginnt oben
  if (ui.crew) return crewEbene(); // Crew planen (06.11.2026)
  if (ui.notiz) return 'notiz:' + (ui.notiz.id || 'neu:' + (ui.notiz.nr || 0)); // Tagesnotiz: jedes neue Blatt beginnt oben
  if (ui.notfall) return 'notfall:' + (ui.notfall.verwalten ? 'ideen' : 'karte');
  if (notfallErinnerungOffen()) return 'notfall-erinnerung'; // Version 127
  if (ui.messziel) return messzielSchluessel(ui.messziel);
  if (ui.heldenWahl) return 'heldenwahl';
  if (ui.notfallWahl) return 'notfallwahl'; // Version 139
  if (ui.ruhetag) return 'ruhetag'; // Version 90
  if (ui.anzeigeBlatt) return 'anzeige'; // Version 125
  if (willkommenOffen()) return 'willkommen'; // Version 98
  if (rueckblickOffen()) return 'rueckblick'; // Rundenrückblick (02.11.2026)
  if (abschlussOffen()) return 'abschluss'; // Version 169: Kettenende
  return null;
}
let letzteEbene = null;
// Version 75: Der langsame Zoom im Gegnerbild (bw-zoom, endlos) begann bei jedem Neuzeichnen von vorn (kleiner Sprung).
// Ein negativer Versatz ab Seitenstart lässt ihn dort weiterlaufen, wo er war. Seit 04.11.2026 gilt er auch für den ziehenden Nebel der Karte.
const ZOOM_START = Date.now();
function zoomWeiter() {
  try { document.documentElement.style.setProperty('--bw-zoom-versatz', `${-Math.round((Date.now() - ZOOM_START) / 100) / 10}s`); }
  catch (e) { /* nur Darstellung */ }
}
function renderJetzt() {
  gegnerNamenAbgleichen();
  document.documentElement.dataset.stil = stand.stil.aktiv;
  zoomWeiter();
  // Version 46: Auftritt nur bei neuem Bildschirm oder Heldenwechsel, nie bei jedem Neuzeichnen
  const auftritt = BW.auftritt && !atmosphaereAus && (letzterScreen !== ui.screen || letzterFokus !== spiel.fokus);
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
  const blattScroll = app.querySelector('.feier .blatt')?.scrollTop || 0;
  const seite = testleiste() + fn() + tabLeiste() + xpFlug;
  let ebenen = blattHtml() + stadtBlattHtml() + karteBlattHtml() + eintragBlattHtml() + notizBlattHtml() + wochenBlattHtml() + crewBlattHtml() + probeBlattHtml() + anzeigeBlattHtml() + ruhetagBlattHtml() + notfallBlattHtml() + notfallWahlHtml() + notfallErinnerungHtml() + messzielBlattHtml() + heldenWahlHtml() + feierHtml() + willkommenHtml() + rueckblickSeiteHtml() + abschlussSeiteHtml();
  // Version 75: Ein offenes Blatt, in dem man tippt (Eintragsblatt, Notfallkarte, Heldenwahl …), wird mit dem Bildschirm
  // neu gezeichnet. Die Einblendung („erscheint“) gehört nur zum Öffnen; sonst wächst das Blatt bei jedem Tipp neu auf
  // und springt nach oben (wirkte wie Flackern). Gleiche Ebene wie zuvor → ohne Einblendung, Scrollstand im Blatt bleibt.
  const ebeneJetzt = ebenenSchluessel();
  const gleicheEbene = !!ebeneJetzt && ebeneJetzt === letzteEbene;
  if (gleicheEbene) ebenen = ohneEinblendung(ebenen);
  letzteEbene = ebeneJetzt;
  app.innerHTML = seite + ebenen;
  // Stil-Kulisse je Seite (31.10.2026): Liste in daten/stile.js; ui.screen gilt erst nach dem Zeichnen (Umleitungen)
  const scr = app.querySelector('.screen');
  if (scr) scr.classList.toggle('kulisse', Array.isArray(KULISSE_SEITEN) && KULISSE_SEITEN.includes(ui.screen));
  if (scrollVorher) { const s = app.querySelector('.screen'); if (s) s.scrollTop = scrollVorher; }
  if (gleicheEbene && blattScroll) { const b = app.querySelector('.feier .blatt'); if (b) b.scrollTop = blattScroll; }
  if (letzterScreen !== ui.screen) {
    app.querySelector('.screen')?.scrollTo?.(0, 0);
    if (letzterScreen !== null && !(auftritt && ui.screen === 'start')) app.querySelector('.screen')?.classList.add('seite-wechsel'); // Tab-Wechsel: kurz überblenden (Version 162)
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
    // 31.10.2026: Im festen Neuigkeiten-Platz trägt jede Karte data-neu=<id>. Dort glänzt nur die eigene Karte; wartet sie
    // bis morgen, ist sie nicht da und gilt nicht als gesehen (sonst bliebe ihr Glanz für morgen aus).
    // Kampfbühne (31.10.2026): Gehört die Neuigkeit zu einem Teil im Abschnitt (data-neu, z. B. Sprechblase, Arena), glänzt
    // nur dieser Teil. Ist der Abschnitt leer, aber der Teil steht anderswo (Geschichte im Ruhezustand der Bühne), dort.
    const sek = app.querySelector(`.start-inhalt [data-abschnitt="${g.abschnitt}"]`);
    const teil = sek && sek.querySelector(`[data-neu="${g.id}"]`);
    const el = sek && sek.hasAttribute('data-neu-platz') ? teil : teil || sek || app.querySelector(`.start-inhalt [data-neu="${g.id}"]`);
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
  const erreichen = ui.zielart === 'erreichen'; // Ziel-Quests (31.10.2026): Schritt 2 = Ziel, Schritt 3 = Weg
  if (ui.screen === 'ob2') {
    if (erreichen) { if (!pruefeZielWahl()) { render(); return; } }
    else if (!ui.problem || (ui.problem === '*' && !ui.freitext.trim())) return;
  }
  if (ui.screen === 'ob3') {
    if (!ui.ziel || !ui.ziel.trim() || (erreichen && (!ui.problem || !ui.zq || !ui.zq.werte))) return;
    trackEvent('goal_created', { bereich: ui.bereich, problem: ui.problem, domain: (aktuelleVorlage() || {}).domain, eigen: ui.problem === '*', art: erreichen ? 'ergebnis' : 'gewohnheit', zielVorlage: erreichen ? ui.zq.vorlage : null });
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

// Startpaket (02.11.2026, daten/startpakete.js): mehrere Helden in einem Rutsch, nur für Besitzer und #test.
// Seit 06.11.2026: Der Knopf öffnet die Auswahl „Mehrere Helden auf einmal“ (obmehr) mit allen Helden des Pakets
// vorausgewählt; abwählen geht vor dem Anlegen. Zurück führt dorthin, wo der Knopf stand. Scheitert es, bleibt der
// Spielstand unverändert (Meldung auf dem Bildschirm).
const startpaketErlaubt = () => istTest || ui.istBesitzer;
function startpaket(id) {
  if (!startpaketErlaubt()) { console.warn('Startpaket: nur für den Besitzer oder im Testprofil'); return; }
  const helden = SP.paketHelden(id, spiel, TABELLE);
  if (!helden.length) { console.warn('Startpaket: unbekannt oder leer', id); return; }
  ui.mehrfach = { paket: id, auswahl: helden.map(h => h.heroId), fehler: null, zurueck: ui.screen };
  trackEvent('starter_pack_opened', { paket: id });
  geheZu('obmehr');
}
function startpaketAnlegenAuswahl() {
  const id = ui.mehrfach.paket;
  let r;
  try { r = SP.startpaketAnlegen(spiel, id, jetzt(), TABELLE, { rampe: RAMPE_NEU, zuordnung, cfg: stuetzenCfg(), nur: ui.mehrfach.auswahl }); }
  catch (e) { console.warn('Startpaket:', e.message); ui.mehrfach.fehler = e.message; render(); return; }
  stoppeAnalyse();
  setzeSpiel(r.spiel);
  Object.assign(ui, { mehrfach: null, neu: false, bereich: null, problem: null, ziel: null, freitext: '', warum: '', zielart: 'aendern', zq: null });
  speichere();
  trackEvent('starter_pack_added', { paket: id, helden: r.angelegt.length, ergaenzt: r.ergaenzt.length - r.uebersprungen.length, uebersprungen: r.uebersprungen.length });
  hinweis = [SP.ergebnisText(r, TABELLE), ...r.hinweise].join(' ');
  geheZu('start');
}

// Mehrere Helden auf einmal (05.11.2026, logik/mehrfach.js): nur Besitzer und #test, alles oder nichts.
// Scheitert es, bleibt der Spielstand unverändert und die Meldung steht auf dem Bildschirm.
function mehrfachAnlegen() {
  if (startpaketErlaubt() && ui.mehrfach && ui.mehrfach.paket) return startpaketAnlegenAuswahl(); // Startpaket (06.11.2026)
  if (!startpaketErlaubt() || !ui.neu || !ui.mehrfach) { console.warn('Mehrere Helden: nur für den Besitzer oder im Testprofil'); return; }
  let r;
  try { r = MF.mehrereAnlegen(spiel, ui.mehrfach.auswahl, TABELLE, jetzt(), zuordnung, { rampe: RAMPE_NEU }); }
  catch (e) { console.warn('Mehrere Helden:', e.message); ui.mehrfach.fehler = e.message; render(); return; }
  setzeSpiel(r.spiel);
  Object.assign(ui, { mehrfach: null, neu: false, bereich: null, problem: null, ziel: null, freitext: '', warum: '', zielart: 'aendern', zq: null });
  speichere();
  trackEvent('multi_heroes_added', { helden: r.angelegt.length, gesamt: spiel.helden.length });
  const erhalt = r.angelegt.map(id => neuImErhaltText(id)).filter(Boolean);
  hinweis = [T('mehr.angelegt', { namen: r.angelegt.map(nameVon).join(', ') }), ...new Set(erhalt)].join(' ');
  geheZu('start');
}

function beginnen() {
  const v = aktuelleVorlage();
  if (!v) { hinweis = T('hinweis.ohneVorlage'); geheZu('ob1'); return; }
  try {
    if (ui.neu && ui.kapitelFuer) {
      // Neues Ziel für einen vorhandenen Helden (Version 171): das alte Ziel wandert ins Archiv, XP und Siege bleiben
      const hid = ui.kapitelFuer;
      setzeSpiel(H.neuesKapitel(spiel, hid, v, ui.ziel, jetzt(), zuordnung, RAMPE_NEU, ui.warum));
      trackEvent('chapter_started', { vorlage: v.id, domain: v.domain, kapitel: KAP.kapitelVon(spiel, hid).length + 1 });
      const neuH = H.heldVon(spiel, hid);
      hinweis = T(neuH && neuH.quest && neuH.quest.start > K.tagKey(jetzt()) ? 'kapitel.beginntMorgen' : 'kapitel.begonnen', { held: nameVon(hid) });
      ui.kapitelFuer = null;
    } else if (ui.neu) {
      setzeSpiel(H.heldHinzufuegen(spiel, v, ui.ziel, jetzt(), zuordnung, RAMPE_NEU, ui.warum));
      trackEvent('hero_added', { vorlage: v.id, domain: v.domain, helden: spiel.helden.length });
      const imErhalt = neuImErhaltText(v.held); // Heldenmodi: Fokus voll → startet im Erhalt, mit Hinweis
      if (imErhalt) hinweis = imErhalt;
    } else {
      setzeStand(K.questAnlegen(stand, v, ui.ziel, jetzt(), RAMPE_NEU, ui.warum), null);
    }
    // Ziel-Quests (31.10.2026): Messziel anlegen und verknüpfen. Scheitert das, bleibt die Quest (Gewohnheit) und ein
    // Hinweis sagt, dass das Ziel unter „Messziele“ nachgetragen werden kann; nichts geht still verloren.
    if (ui.zielart === 'erreichen' && ui.zq && ui.zq.werte) {
      try {
        setzeSpiel(ZQ.verknuepfen(spiel, v.held, ui.zq.werte).spiel);
        trackEvent('goal_outcome_set', { zielVorlage: ui.zq.vorlage, mitDatum: !!ui.zq.werte.bis }); // nie die Werte
      } catch (e) { console.warn('Ziel-Quest:', e.message); hinweis = T('zq.hinweisFehler'); }
    }
    ui.zielart = 'aendern'; ui.zq = null;
    if (stand.quest && stand.quest.warum) trackEvent('quest_why_set', { domain: v.domain }); // nur, DASS es gesetzt ist; nie der Text
    ui.warum = '';
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
  // Version 115: Vorstellung durchgetippt → gesehen (nicht bei „Später ansehen“)
  if (war && war.art === 'gegner' && war.kennung && !war.spaeter) { vorstellungGesehen(war.kennung); trackEvent('boss_intro_seen', { kapitel: war.kapitel }); }
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
  if (antwort === 'ja') setzeSpiel(RT.nachJa(spiel, spiel.fokus, K.tagKey(jetzt()))); // Version 90: „Ja“ hebt einen Ruhetag auf
  // 02.11.2026: Bühne erst nach dem Übernehmen starten, die Lesezeit der Gegner-Reaktion hängt von der heutigen Antwort ab
  const buehneArt = starteBuehne(antwort, r);
  speichere();
  trackEvent('quest_checkin', { antwort });
  zeigeEreignisse(r, antwort, buehneArt);
}

// Sieg nachholen (06.11.2026, Bosskette mit Bedingungen): ein gespeicherter Eintrag (Gestalt, Fähigkeit, Schwierigkeit)
// erfüllt die letzte Bedingung, die Treffer sind schon da. Dann fällt der Gegner jetzt, mit Bühne und Siegkarte wie nach
// einem „Ja“; keine Antwort ändert sich. Liefert true, wenn ein Sieg kam.
function siegNachholen() {
  if (!stand || !stand.quest) return false;
  let r;
  try { r = K.siegNachholen(stand, jetzt()); } catch (e) { console.warn('Sieg nachholen:', e.message); return false; }
  if (!r.ereignisse.some(e => e && e.typ === 'sieg')) return false;
  setzeStand(r.stand);
  const buehneArt = starteBuehne('ja', r);
  speichere();
  trackEvent('boss_won_by_condition', {});
  zeigeEreignisse(r, 'ja', buehneArt);
  return true;
}

// Kampfbühne (31.10.2026): nach „Ja“ läuft der Ablauf (Treffer → Heldenbild → Boss-Sprechblase) nach der Uhr; danach wird
// einmal neu gezeichnet, damit die Bühne in den Ruhezustand geht. Am Siegtag nur der Treffer (Siegkarte ist der Höhepunkt).
// Ohne Bühne auf der Seite, bei „Bewegung reduzieren“, nach „nicht gebraucht“ oder Rückgängig: sofort Ruhe bzw. offen.
let buehneTimer = null;
let einblendungTimer = null;
const KURZ = kurzRegel(KAMPFBUEHNE); // Version 139: Regel einmal prüfen, Fehler beim Start melden
KURZ.fehler.forEach(m => console.warn(m));
// Zeitpunkt (ms ab Start des Ablaufs), an dem die wartende Einblendung kommt; null = keine wartet
let einblendungBei = null;
function starteBuehne(antwort, r) {
  clearTimeout(buehneTimer);
  ui.buehne = null;
  if (antwort !== 'ja' || bewegungAus || !START_IDS.includes('buehne')) return null;
  // Version 139: nach vielen Treffern die kurze Fassung (KAMPFBUEHNE.kurz); Siegtag und Comeback bleiben groß
  const sieg = !!(r && Array.isArray(r.ereignisse) && r.ereignisse.some(e => e && e.typ === 'sieg'));
  let art = sieg ? 'sieg' : 'treffer';
  if (!sieg) {
    try {
      const k = heute();
      art = buehneArtWahl(KAMPFBUEHNE, { sieg, trefferVorher: trefferTageVor(stand.tage, k), comeback: KURZ.vollBeiComeback && comebackStand(k).heute });
    } catch (e) { console.warn('Kampfbühne (kurz):', e.message); art = 'treffer'; }
  }
  // Lesezeiten (02.11.2026): Sprechblasen stehen so lange, wie man zum Lesen braucht (Text des Tages)
  const lesen = art === 'treffer' ? buehneLesezeiten() : null;
  if (!buehneDauerMs(art, lesen)) return null;
  ui.buehne = { heroId: spiel.fokus, tag: heute(), startMs: Date.now(), art, lesen };
  planeRuhe();
  planeHalt();
  return art;
}
// ---------- Sprechblasen anhalten (02.11.2026) ----------
// „Nur per Tippen“ (spiel.einstellungen.blasen): der Ablauf hält an jeder Blase an (Haltepunkt aus daten/bewegung.js),
// bis man tippt. „Automatisch“: Gedrückthalten auf der Arena hält an, Loslassen läuft weiter. Angehalten zählt die Zeit
// nicht (ui.buehne.pauseSeit); Ruhezustand und wartende Einblendung warten mit. Grund: jeder liest in seinem Tempo,
// ohne Zeitdruck (Autonomie); die Leiste zeigt nur, wie lange noch, und hetzt nicht.
const blasenModus = () => H.bereinigeEinstellungen(spiel.einstellungen).blasen;
let haltTimer = null;
function buehneAktiv(b = ui.buehne) { return !!b && b.heroId === spiel.fokus && b.tag === heute(); }
function planeHalt() {
  clearTimeout(haltTimer); haltTimer = null;
  const b = ui.buehne;
  if (!buehneAktiv(b) || Number.isFinite(b.pauseSeit) || blasenModus() !== 'tippen') return;
  const vergangen = Date.now() - b.startMs;
  const halt = naechsterHaltepunkt(buehneLauf(b), KAMPFBUEHNE.ablauf[b.art], vergangen);
  if (halt === null) return;
  haltTimer = setTimeout(() => { haltTimer = null; if (ui.buehne === b) halteBuehne(b.startMs + halt); }, Math.max(0, halt - vergangen));
}
// Anhalten bei bei (Zeitpunkt in ms, Standard jetzt). Zeichnet neu, damit die Bühne angehalten stehen bleibt.
function halteBuehne(bei = Date.now()) {
  const b = ui.buehne;
  if (!buehneAktiv(b) || Number.isFinite(b.pauseSeit)) return false;
  b.pauseSeit = Math.min(bei, Date.now());
  clearTimeout(buehneTimer); clearTimeout(haltTimer); haltTimer = null;
  if (einblendungTimer) { clearTimeout(einblendungTimer); einblendungTimer = null; }
  if (ui.screen === 'start' && !ui.feier) render();
  return true;
}
// Weiterlaufen: der Start rückt um die Pause nach, alles wird neu geplant. zeichnen = false, wenn gleich ohnehin gezeichnet wird.
function weiterBuehne(zeichnen = true) {
  const b = ui.buehne;
  if (!b || !Number.isFinite(b.pauseSeit)) return false;
  ui.buehne = weiterNachPause(b, Date.now());
  planeRuhe();
  if (einblendungBei !== null) planeEinblendung(einblendungBei);
  planeHalt();
  if (zeichnen && ui.screen === 'start' && !ui.feier) render();
  return true;
}
// Ruhezustand zeichnen, wenn der Ablauf (samt Pause) vorbei ist; nach einem Sprung neu geplant.
function planeRuhe() {
  clearTimeout(buehneTimer);
  const b = ui.buehne;
  if (!b || Number.isFinite(b.pauseSeit)) return; // angehalten: plant weiterBuehne() neu
  const rest = buehneDauerMs(b.art, b.lesen) - (Date.now() - b.startMs);
  buehneTimer = setTimeout(() => {
    if (ui.screen !== 'start') return;
    ui.einmal.add('ruhe'); // Bühne schrumpft einmal sichtbar (Ablauf „buehneRuhe“)
    if (!ui.feier) render();
  }, Math.max(0, rest) + 30);
}
// Wartende Einblendung (Sieg, Stufe, Frage) nach dem Ablauf; bei ms = Zeit ab Start des Ablaufs (ohne Bühne: ab jetzt).
function planeEinblendung(bei) {
  clearTimeout(einblendungTimer);
  einblendungBei = bei;
  if (ui.buehne && Number.isFinite(ui.buehne.pauseSeit)) return; // angehalten: wartet mit (weiterBuehne)
  const start = ui.buehne ? ui.buehne.startMs : Date.now();
  einblendungTimer = setTimeout(einblendungJetzt, Math.max(0, start + bei - Date.now()));
}
function einblendungJetzt() {
  clearTimeout(einblendungTimer); einblendungTimer = null; einblendungBei = null;
  if (!ui.feier) zeigeNaechstes();
}

// ---------- Überspringen (02.11.2026, „Der letzte Schlag“) ----------
// Ein Tipp neben einen Knopf oder Escape: steht noch eine Sprechblase aus, springt der Ablauf zu ihr (Tippen = weiter,
// wie bei Dialogen in Spielen); sonst ist er vorbei: Ruhezustand, wartende Einblendung sofort, Siegblatt ohne Nachklang,
// alle endlichen CSS-Animationen der App im Endzustand. Grund: Bewegung soll den Moment tragen, nie warten lassen und nie
// hetzen (jeder liest in seinem Tempo). Liefert true, wenn etwas übersprungen wurde.
function ueberspringe() {
  let zeichnen = false;
  weiterBuehne(false); // angehalten (Haltepunkt oder Gedrückthalten): der Tipp geht von dort weiter
  const b = ui.buehne;
  if (b && b.heroId === spiel.fokus && b.tag === heute()) {
    const dauer = buehneDauerMs(b.art, b.lesen);
    const vergangen = Date.now() - b.startMs;
    const halt = vergangen < dauer ? naechsterHalt(buehneLauf(b), KAMPFBUEHNE.ablauf[b.art], vergangen) : null;
    if (halt !== null) {
      b.startMs = Date.now() - halt;
      planeRuhe();
      if (einblendungBei !== null) planeEinblendung(einblendungBei);
      planeHalt();
      render();
      return true;
    }
    const start = uebersprungenStart(b.startMs, dauer, Date.now());
    if (start !== b.startMs) { b.startMs = start; clearTimeout(buehneTimer); zeichnen = true; }
  }
  if (ui.feier && ui.feier.art === 'sieg' && !ui.feier.ohneBewegung) { ui.feier.ohneBewegung = true; zeichnen = true; }
  let css = false;
  try {
    for (const an of app.getAnimations ? app.getAnimations({ subtree: true }) : []) {
      const t = an.effect && an.effect.getTiming ? an.effect.getTiming() : null;
      if (t && Number.isFinite(t.iterations) && an.playState === 'running') { an.finish(); css = true; }
    }
  } catch (e) { console.warn('Überspringen:', e.message); }
  if (einblendungTimer) {
    if (!ui.feier) { einblendungJetzt(); return true; } // zeichnet selbst
    clearTimeout(einblendungTimer); einblendungTimer = null; einblendungBei = null;
  }
  if (zeichnen) render();
  return zeichnen || css;
}

// Nachtragen (Version 79): Antwort für einen vergangenen Tag (K.nachtragen, Grenzen in daten/nachtragen.js). Danach ist
// wieder heute dran (kein Dauer-Modus). meldung: ruhige Bestätigung („Für gestern eingetragen.“). Bewertungsfragen und
// das große Heldenbild gibt es nur für heute; Sieg und Stufe werden wie gewohnt gefeiert.
function nachtrage(tag, antwort, meldung) {
  let r;
  try { r = K.nachtragen(stand, tag, jetzt(), antwort, NACHTRAGEN.maxTage); }
  catch (e) { hinweis = e.message; ui.nachtrag = null; render(); return; }
  setzeStand(r.stand);
  if (antwort === 'ja') setzeSpiel(RT.nachJa(spiel, spiel.fokus, tag)); // Version 90: „Ja“ hebt einen Ruhetag auf
  speichere();
  trackEvent(antwort === 'ja' ? 'quest_backfill_yes' : antwort === 'nein' ? 'quest_backfill_no' : antwort === 'schwer' ? 'quest_backfill_hard' : 'quest_backfill_undo', {});
  ui.nachtrag = null;
  if (meldung) hinweis = meldung;
  zeigeEreignisse(r, null);
}

// Version 115: Wurde der Gegner nach diesem Sieg schon vorgestellt (z. B. vor einem Rückgängig am selben Tag)?
function vorstellungSchon(sieg) {
  if (!sieg || !sieg.neuerGegner || !mitVorstellung() || !stand.quest) return false;
  return Array.isArray(spiel.vorgestellt) && VS.istVorgestellt(spiel.vorgestellt, VS.kennung('boss', kapitelBasis(), sieg.kapitel));
}
function vorstellungDaten(m) {
  let morgen = false;
  try { morgen = K.auswertung(stand, jetzt()).rundeTag < 0; } catch (e) { /* ohne „morgen“ */ }
  return { kennung: VS.kennung('boss', kapitelBasis(), m.kapitel), morgen };
}
// Belohnung, Sieg, Level-up und Bewertungsfragen nach einer Änderung am Stand (Tages-Check, Quest bearbeiten).
// buehneArt: Art des Bühnen-Ablaufs, der gerade gestartet wurde ('treffer' | 'kurz' | 'sieg'), sonst null (02.11.2026).
function zeigeEreignisse(r, antwort, buehneArt = null) {
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
      vorigeGewonnen: r.nachher.vorigeGewonnen, hoehepunktHeute: hoehepunktHeute(), vorgestellt: vorstellungSchon(sieg) },
    MOMENTE, darfFragen);
  // Version 115: Vorstellung bekommt Kennung und „morgen“ (Kampf beginnt erst morgen) aus dem Stand nach dem Check
  for (const m of neu) if (m.art === 'gegner' && m.vorstellung) Object.assign(m, vorstellungDaten(m));
  if (weltenwahlSofort) ui.danach = 'stilwahl';
  if (neu.length) {
    ui.schlange.push(...neu);
    // Version 68: erst Haken und Rückmeldung, dann die Einblendung. Seit 02.11.2026 nach dem Ablauf, der wirklich läuft
    // (Siegtag: „Der letzte Schlag“ in der Arena); ein Tipp daneben holt die Einblendung sofort (ueberspringe).
    if (!ui.feier) planeEinblendung(pauseNachCheck(buehneArt));
  }
  render();
}

// Quest bearbeiten (Version 38)
function questBearbeitenOeffnen() {
  if (!stand.quest || !funktionFrei('quests_bearbeiten')) return;
  // anzahl: neuester Wert (auch eine Änderung, die erst ab der nächsten Runde gilt); st/stInfo/archivFrage: Stützgewohnheiten
  // zaehlweise (04.11.2026): neueste Zählweise (auch eine, die erst ab der nächsten Runde gilt)
  ui.qe = { ziel: stand.quest.ziel, anzahl: hauptAnzahl(stand.quest), warum: stand.quest.warum || '', zaehlweise: hauptZaehlweise(stand.quest), fehler: {}, st: null, stInfo: null, archivFrage: null };
  trackEvent('quest_edit_opened', {});
  geheZu('quest_bearbeiten');
}
function questBearbeitenSpeichern() {
  const q = ui.qe;
  if (!q) return geheZu('start');
  const p = K.questPruefen(q, hauptGrenzen(stand.quest)); // Beständigkeit: höchstens 6
  if (!p.ok) { q.fehler = p.fehler; render(); app.querySelector('[aria-invalid="true"]')?.focus(); return; }
  let r;
  try { r = K.questBearbeiten(stand, p.werte, jetzt()); }
  catch (e) { q.fehler = { ziel: e.message }; render(); return; }
  ui.qe = null;
  if (r.geaendert.length) {
    setzeStand(r.stand);
    speichere();
    trackEvent('quest_edited', { felder: r.geaendert.join(','), anzahl: r.stand.quest.anzahl });
    if (r.geaendert.includes('zaehlweise')) trackEvent('counting_mode_set', {}); // nur die Zahl der Wechsel (Zusatzangaben siehe forschung.js)
    if (r.geaendert.includes('warum') && r.stand.quest.warum) trackEvent('quest_why_set', {}); // nie der Text
    bestaetige(T(r.anzahlAb === 'naechsteRunde' ? 'qe.gespeichertNaechste' : r.zaehlweiseAb && r.zaehlweiseAb !== 'sofort' ? 'qe.zwGespeichertNaechste' : 'qe.gespeichert')); // Schritt „Zähler“; Popup seit Etappe 3
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
const KLICKS = klickRegister({ ONBOARDING_KLICKS, START_KLICKS, BUEHNE_KLICKS, NACHTRAG_KLICKS, RAHMEN_KLICKS, FEIER_KLICKS, BLATT_KLICKS, FEEDBACK_KLICKS, TESTER_KLICKS, DENKEN_KLICKS, PLANCHECK_KLICKS, BEWEIS_KLICKS, EINSTELLUNGEN_KLICKS, ADMIN_KLICKS, STILWAHL_KLICKS, LOGBUCH_KLICKS, QUEST_KLICKS, STORY_KLICKS, PFLEGE_KLICKS, KARTE_KLICKS, EINTRAG_KLICKS, NOTFALL_KLICKS, MESSZIEL_KLICKS, PROBE_KLICKS, RUHETAG_KLICKS, STUETZEN_KLICKS, ZIELQUEST_KLICKS, WILLKOMMEN_KLICKS, RUECKBLICK_KLICKS, ABSCHLUSS_KLICKS, ANZEIGE_KLICKS, NOTIZ_KLICKS, HELDENMODI_KLICKS, WOCHE_KLICKS, CREW_KLICKS, STADT_KLICKS });
KLICKS.fehler.forEach(m => console.error(m));
// Fehler in einer Aktion: Spiel läuft weiter, kurzer Hinweis statt stillem Nichts (Einzelheiten in der Konsole).
function klickFehler(err, aktion) {
  console.warn(`Klick „${aktion}“:`, (err && err.message) || err);
  hinweis = T('rahmen.klickFehler');
  try { render(); } catch (e) { console.warn('Zeichnen nach Klickfehler:', e.message); }
}
// Gedrückthalten auf der Arena (02.11.2026, nur „Automatisch“): nach SPRECHBLASEN.haltenMs hält die Blase an, Loslassen
// läuft weiter. Der Klick danach zählt nicht als Tipp (sonst spränge der Ablauf gleich weiter).
let haltenTimer = null, gehalten = false, klickSchlucken = false;
app.addEventListener('pointerdown', e => {
  clearTimeout(haltenTimer); haltenTimer = null;
  if (!buehneAktiv() || Number.isFinite(ui.buehne.pauseSeit) || blasenModus() !== 'auto') return;
  if (!e.target || typeof e.target.closest !== 'function' || !e.target.closest('.arena') || e.target.closest('.crew-blase')) return;
  const ms = Number.isFinite(SPRECHBLASEN.haltenMs) && SPRECHBLASEN.haltenMs > 0 ? SPRECHBLASEN.haltenMs : 350;
  haltenTimer = setTimeout(() => { haltenTimer = null; if (halteBuehne()) gehalten = true; }, ms);
});
const haltenLos = () => {
  clearTimeout(haltenTimer); haltenTimer = null;
  if (!gehalten) return;
  gehalten = false; klickSchlucken = true;
  setTimeout(() => { klickSchlucken = false; }, 400); // kommt kein Klick (z. B. weggezogen), gilt der nächste wieder
  weiterBuehne();
};
app.addEventListener('pointerup', haltenLos);
app.addEventListener('pointercancel', haltenLos);
app.addEventListener('click', e => {
  if (klickSchlucken) { klickSchlucken = false; e.preventDefault(); return; }
  const b = e.target.closest('[data-a]');
  // Überspringen (02.11.2026): Tipp neben einen Knopf, oder auf die Arena während ihres Ablaufs, beendet die Bewegung.
  // Felder, Links und Knöpfe ohne data-a behalten ihre eigene Wirkung.
  const eigen = e.target.closest('a, button, input, textarea, select, label, summary');
  const inArena = !!b && typeof b.closest === 'function' && !!b.closest('.arena') && !b.closest('.crew-blase');
  if ((!b && !eigen) || (inArena && ui.buehne)) {
    if (ueberspringe()) { e.preventDefault(); return; }
  }
  if (!b || b.disabled) return;
  verteile(KLICKS.register, b.dataset.a, { id: b.dataset.id, el: b }, { warn: m => console.warn(m), fehler: klickFehler });
  besuchNachSprung();
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
const FELDER = feldRegister({ ONBOARDING_FELDER, QUEST_FELDER, FEEDBACK_FELDER, ADMIN_FELDER, PFLEGE_FELDER, EINTRAG_FELDER, BEWEIS_FELDER, PLANCHECK_FELDER, NOTFALL_FELDER, MESSZIEL_FELDER, STUETZEN_FELDER, ZIELQUEST_FELDER, RUECKBLICK_FELDER, NOTIZ_FELDER, LOGBUCH_FELDER, HELDENMODI_FELDER, WOCHE_FELDER });
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
  if (ueberspringe()) return; // 02.11.2026: erst die Bewegung beenden, ein zweites Escape schließt
  if (ui.feier) { if (ui.feier.art === 'frage') bewerte(ui.feier.bewertung, null); zeigeNaechstes(); }
  else if (ui.blatt) schliesseBlatt();
  else if (ui.notiz) { ui.notiz = null; render(); } // Tagesnotiz (04.11.2026)
  else if (ui.woche) { ui.woche = null; render(); } // Wochenrunde (05.11.2026)
  else if (ui.heldenWahl) { ui.heldenWahl = false; render(); }
});

// Setzer für veränderliche Werte, die Klick-Aktionen der Ansichten ändern dürfen (kx ist schreibgeschützt).
const finde = sel => app.querySelector(sel);
const setzeHinweis = t => { hinweis = t || null; };
// Kurze Bestätigung als Popup (ansicht/toast.js); ohne DOM wie bisher als Box. Liefert true, wenn das Popup erschien.
const bestaetige = t => { if (!t) return false; if (zeigeToast(t)) return true; hinweis = t; return false; };
const stoppeAnalyse = () => clearInterval(analyseTimer);
function zeitSprung(n, einheit = 'tag') { // nur Testprofil (Testleiste); einheit 'stunde' seit Version 130
  if (einheit === 'stunde') stundenVersatz += n;
  else if (n === 0) { tagVersatz = 0; stundenVersatz = 0; } // „Heute“ = echtes Jetzt
  else tagVersatz += n;
  weltenGezeigt = false; // Zeitsprung = wie ein neuer Besuch
  pauseInSitzung = false;
  render(); pruefeBesuchsMomente();
}

// <kontext> Namen, die die Ansichten über kx lesen (ansicht/kontext.js): veränderliche Werte (let) als Getter, der Rest fest.
// Neuer Name: hier ergänzen. Fehlt einer, meldet kx beim Zeichnen genau diesen Namen.
binde(
  { anzeige: () => anzeige, bewegungAus: () => bewegungAus, einw: () => einw, hinweis: () => hinweis, spiel: () => spiel, stand: () => stand, tabelle: () => tabelle, testerHinweis: () => testerHinweis },
  { NEU_QUELLEN, SCREENS, SM, START_IDS, T, VERSION, abgleichStatus, aktuelleVorlage, angebotFrei, weltenFrei, andeutungGesehen, bezirkName, bild, bildFuer, funktionFrei, heldenAnsichten, img, istTest, jetzt, mikroListe, nameVon, naechsterTitel, titel, neuBereiche, neuPunkte, platzhalter, setzeStartGlanz, speicher, stil, stilVorauswahl, stilWerte, story, symbol, arenaFunken, tabAktiv, tabLabel, tabSichtbar, tabStatus, testerId, ui, wort, allesFrei, allesFreiMoeglich, setzeAllesFrei, stuetzenCfg,
    // Aktionen für die Klick-Register (Klick-Logik aufteilen)
    alsGesehen, beginnen, bestaetigeTesterHinweis, check, entscheideDaten, erstelleExport, finde, geheZu, importiere, importiereCsv, kopiereExport,
    ladeAdmin, mikro, oeffneBlatt, zeichneNachZeiger: renderNachZeiger,
    // Pflege (Pflege-Logik auslagern): Zustand, Umgebung mit Datenbank-Adapter, Bildplätze
    bildPlaetze, eingebautesBild, kartenLuecken, kartenPlatzBekannt, pflegeUmgebung, pflegeZustand, sprungLink, nachtrage,
    bestaetige, setzeAnzeige, systemRuhig, gegnerVerhuellt, vorstellungSpaeter, vorstellungZeigen, startpaket, startpaketErlaubt, mehrfachAnlegen, pruefeBesuchsMomente, questBearbeitenOeffnen, questBearbeitenSpeichern, render, schliesseBlatt, setzeHinweis, setzeSpiel, setzeStand, speichere, sperrTextVon, stoppeAnalyse,
    storyGelesenBis, teileExport, weiter, zeigeNaechstes, zeitSprung, zurueck, siegNachholen }
);
// </kontext>

// ---------- Sprungziele (Version 78) ----------
// Ein Link wie …#notfall öffnet direkt ein Blatt. Daten: daten/sprungziele.js, Logik: logik/sprung.js.
// Öffner je `blatt` des Registers; neues Ziel = Eintrag im Register + Öffner hier (geprüft beim Start).
const SPRUNG_OEFFNER = {
  notfall: () => oeffneNotfall({ ausLink: true })
};
pruefeSymbole(STILE, SYMBOLE, [...TABS.map(t => 'tab.' + t.screen), 'siegel.treffer', 'siegel.ruhe', ...Object.keys(AKTION_SYMBOLE)]).forEach(m => console.warn('Symbole:', m));
pruefeSprungziele(SPRUNGZIELE, { profile: PROFILE, funktionen: FUNKTIONEN, oeffner: Object.keys(SPRUNG_OEFFNER), texte: TEXTE })
  .forEach(m => console.warn('Sprungziele:', m));
let sprungOffen = HASH.ziel;  // wartet ggf. auf den Spielstand aus dem Konto (neues Gerät)
let besuchWartet = null;      // Blatt, nach dessen Schließen die Besuchsmomente nachgeholt werden
// Ziel aus der Adresse nehmen (Profil bleibt), damit Neuladen oder Zurück nicht erneut springt. replaceState löst
// kein „hashchange“ aus (sonst lüde die Seite neu).
if (HASH.ziel) {
  try { history.replaceState(null, '', hashFuer(HASH.profil) || location.pathname + location.search); }
  catch (e) { console.warn('Adresse:', e.message); }
}
// Liefert true, wenn ein Blatt geöffnet wurde. letzterVersuch: nach dem Abgleich; wer dann noch keinen Helden hat
// (Onboarding offen), bekommt die App normal, der Sprung verfällt.
function sprungAusfuehren(letzterVersuch = false) {
  const ziel = sprungOffen;
  if (!ziel) return false;
  const e = sprungEntscheid(ziel, { bereit: !!stand.onboarding.fertig && ui.screen === 'start', heroId: spiel.fokus, frei: funktionFrei }, SPRUNGZIELE);
  if (e.aktion === 'warten' && !letzterVersuch) return false;
  sprungOffen = null;
  if (e.aktion !== 'oeffnen') { if (e.grund !== 'kein-held') console.warn(`Sprungziel ${ziel}: ${e.grund}`); return false; }
  const def = SPRUNGZIELE[ziel];
  let offen = false;
  try { offen = !!SPRUNG_OEFFNER[def.blatt](); } catch (err) { console.warn(`Sprungziel ${ziel}:`, err.message); }
  if (offen) besuchWartet = def.blatt;
  return offen;
}
// Besuchsmomente (Kapitelwechsel, Freigaben, Weltenwahl) erst, wenn das Sprung-Blatt und was daraus folgt zu ist.
// Sonst läge z. B. ein Kapitelwechsel über der Notfallkarte, genau im schwierigen Moment.
function besuchNachSprung() {
  if (!besuchWartet || ui[besuchWartet] || ui.eintrag || ui.notiz || ui.woche || ui.feier) return;
  besuchWartet = null;
  try { pruefeBesuchsMomente(); } catch (e) { console.warn('Besuchsmomente:', e.message); }
}
// Link für „Link kopieren“ in den Einstellungen (im Testprofil mit #test davor).
// Funktionsdeklaration (nicht const): wird schon im Block // <kontext> weiter oben gebunden.
function sprungLink(ziel) {
  let ort = null;
  try { ort = { protocol: location.protocol, hostname: location.hostname, origin: location.origin, pathname: location.pathname }; } catch (e) { ort = null; }
  return linkFuer(ziel, istTest ? 'test' : 'haupt', LINK_BASIS, ort);
}

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
vorstellungAltbestand(); // Version 115
render();
if (!sprungAusfuehren()) pruefeBesuchsMomente();

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
    starteAbgleich(db, user); // Version 77, läuft nebenher
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
