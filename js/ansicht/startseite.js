// Startseite (aus app.js ausgelagert, 30.10.2026): Abschnitte als Funktionen (START_TEILE), Reihenfolge und Ein/Aus in
// daten/startseite.js, Neuigkeiten und Glanz in daten/neuigkeiten.js. Ein kaputter Abschnitt bricht nie die ganze Seite
// (SCREENS.start fängt ihn ab, im Testprofil als roter Hinweis). Heldenkopf, Heldenwahl, Karten für Quest, Heldentat,
// Duell, Bonus, Story, Welten, Angebot, Feedback und Premium.
import { aktiveTage, hatFeedback, merke, merkmal, trackEvent } from '../analytics.js';
import { FEEDBACK } from '../daten/forschung.js';
import { TABS } from '../daten/freischaltung.js';
import { BOSS_REAKTION_EINSTELLUNG, BOSS_REAKTIONEN } from '../daten/boss-reaktionen.js';
import { BOTSCHAFTEN, STORIES } from '../daten/inhalte.js';
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import { NEUIGKEITEN } from '../daten/neuigkeiten.js';
import { BONUS, HELDENKOPF, HELDENWAHL_GRUPPEN, KOPFLEISTE, NEU_PLATZ, START_ABSCHNITTE, TAGESLEISTE, WEG_FENSTER } from '../daten/startseite.js';
import { ruhetagLink } from './ruhetag.js'; // Version 90
import { LAGERFEUER } from '../daten/lagerfeuer.js'; // Etappe 3, Teil C
import { heuteErledigt } from '../logik/lagerfeuer.js';
import * as RT from '../logik/ruhetag.js';
import { stuetzeBereitHtml, stuetzenHakenHtml } from './stuetzen.js'; // Schritt „Zähler“
import { artSchluessel, artText, comebackHtml, erledigtIcon, erledigtText } from './bestaendigkeit.js'; // Beständigkeit (04.11.2026)
import { TABELLE } from '../daten/vorlagen.js';
import * as BR from '../logik/boss-reaktion.js';
import * as EW from '../logik/einwilligung.js';
import * as H from '../logik/helden.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { abschnittZiel, bonusAnsicht, erfolgGroesse, heldenKopf, klappStandardKlein, klappUmschalten, klappZustand, kettenPunkte, nachWann, naechsterOffener, neuAufStart, neuPlatz, streifenForm, tagesfrage, vorziehen, wechselBanner, wegForm, wegText, wennDann, tagesleiste, kappeText, heldenGruppen } from '../logik/startseite.js';
import * as W from '../logik/weg.js';
import { entw } from './blatt.js';
import { einwKarte } from './einstellungen.js';
import { denkenKarte } from './denken.js'; // Version 165
import { testerKarte } from './testerhinweis.js'; // 09.11.2026: einmaliger Tester-Hinweis
import { beweisKarte } from './beweisbuch.js'; // Version 166: leise Anregung „Schreib dir einen Brief“
import { plancheckKarte } from './plancheck.js'; // Version 167: Plan- und Warum-Check
import { abschlussKarte } from './abschluss.js'; // Version 169: Kettenende
import { blitzEbene, bwStil, esc, fortschrittHier, fortschrittRegister, icon, kachelLeiste, kurzDatum, markiere, prozent } from './helfer.js';
import { notizKarteHtml, notizKopfKnopf } from './notiz.js'; // Tagesnotiz (04.11.2026)
import { wochenKarteHtml } from './wochenrunde.js'; // Wochenrunde (05.11.2026)
import { crewKnopfHtml } from './crew.js'; // Crew-Übersicht (06.11.2026): „Crew planen“ in der Heldenwahl
import { kx } from './kontext.js';
import { eintragLink } from './eintrag.js';
import { notfallKnopf } from './notfall.js';
import { morgenkarteHtml } from './probe.js'; // Version 173: Morgenkarte (Version 81: Morgenprobe)
import { messzielKarte, messzielKurz } from './messziele.js';
import { zielstandKarte, zielZeileHtml } from './zielquest.js'; // Ziel-Quests (31.10.2026)
import { rueckblickKarte } from './rueckblick.js'; // Rundenrückblick (02.11.2026)
import { hinweisBox, kopfRechts } from './rahmen.js';
import { buehneHtml, lagerfeuerSichtbar } from './buehne.js'; // Kampfbühne (eigenes Modul seit 02.11.2026)
import { pausiertHeute, rastHtml } from './heldenmodi.js'; // Heldenmodi (04.11.2026)
import * as HM from '../logik/heldenmodi.js';
import { bedingungenJetzt, gegnerJetzt } from './bedingungen.js'; // Bosskette mit Bedingungen (06.11.2026)
import { nachtragHtml, nachtragKachel, nachtragModus, nachtragName, nachtragZeile, nachtragZusatz } from './nachtrag.js';
export { buehneDauerMs, buehneLauf, buehneLesezeiten } from './buehne.js'; // app.js liest die Dauer weiter hier

// Bis zur Wahl: ruhige Karte auf der Startseite. An einem späteren Tag öffnet sich die Weltenwahl einmal von selbst.
export function weltenKarte() {
  const { T, stand, weltenFrei } = kx;
  if (!weltenFrei() || stand.stil.angeboten) return ''; // Version 69: erst nach der Freigabe
  return `<button class="karte welten-karte tippbar" data-a="stilwahl">
      <span class="stern-klein" aria-hidden="true">${icon('stern')}</span>
      <span class="spalte"><span class="eyebrow akzent">${esc(T('welten.eyebrow'))}</span><span class="nm">${esc(T('welten.titel'))}</span><span class="klein">${esc(T('welten.text'))}</span></span>
    </button>`;
}
// Siegtag mit neuem Gegner (Version 68): der Neue bleibt bis zum Kapitelwechsel beim nächsten Besuch verborgen.
// Liefert die ID des heute besiegten Gegners oder null.
// Version 84 (Stil-Kulisse): Licht und Funken der Arena über dem Gegnerbild, Farben je Stil (index.html --arena-*).
// Lage und Dauer der Funken aus logik/symbole.js funkenListe (feste Werte, kein Zufall); „Bewegung reduzieren“ → keine.
// 02.11.2026 (Entscheidung 25): o.stoss = { ablauf, vergangenMs } → Funken nur als kurzer Stoß im Ablauf nach „Ja“
// (Zeiten aus daten/bewegung.js, Teil „funken“); ohne stoss nur bei funkenWann 'immer'. o.licht = false → ohne Fackelschein
// (besiegter Gegner).
export function arenaHtml(o = {}) {
  const { arenaFunken } = kx;
  const stoss = o && o.stoss ? o.stoss : null;
  const f = arenaFunken(stoss);
  const licht = o && o.licht === false ? '' : '<span class="arena-licht" aria-hidden="true"></span>';
  const funke = x => (stoss
    ? `<i style="left:${x.links}%;--dx:${x.dx}px;animation:${esc(`${x.keyframes} ${x.dauerMs}ms ${x.startMs}ms ${x.kurve} both`)}"></i>`
    : `<i style="left:${x.links}%;--dx:${x.dx}px;animation-duration:${x.dauerS}s;animation-delay:-${x.versatzS}s"></i>`);
  return `${licht}${f.length ? `<span class="arena-funken${stoss ? ' stoss' : ''}" aria-hidden="true">${f.map(funke).join('')}</span>` : ''}`;
}
// Version 115 (Einführung vor Anzeige): nur, solange die Vorstellung des Neuen nicht gesehen ist. Danach ist der Neue auch am
// Siegtag überall offen („ab morgen“). Liefert den Besiegten (für die graue Anzeige) oder null.
export function besiegtHeuteVorNeuem(a) {
  const { gegnerVerhuellt, stand } = kx;
  if (!(a && a.siegHeute === true && a.neuerGegner === true && a.rundeTag < 0)) return null;
  if (!gegnerVerhuellt(a)) return null;
  const id = ((stand.siege || []).filter(x => x && x.tag === a.heute).pop() || {}).gegner;
  return typeof id === 'string' && TABELLE.gegner[id] ? id : null;
}
// Hinweis nach „Später ansehen“ (Version 115): ruhig, ohne Zähler und ohne Drängen; Tipp zeigt die Vorstellung.
export function vorstellungHinweisHtml() {
  const { T, wort } = kx;
  return `<button class="link vorstellung-hinweis" data-a="vorstellung-zeigen">${icon('stern')}<span>${esc(T('vorstellung.hinweis', { gegner: wort('gegner') }))} · <b>${esc(T('vorstellung.ansehen'))}</b></span></button>`;
}
// Boss-Reaktion (Version 68): Mini-Bossbild + eine Zeile direkt in der Heldentat-Karte, unter „Erledigt“ – dort, wo der
// Blick nach dem Tippen ist (in der Duell-Karte lag sie unter dem Erfolgsbild außer Sicht). Die Duell-Karte zeigt
// weiter das brechende Segment. Abgeleitet aus dem Stand (Texte: daten/boss-reaktionen.js); Fehler lassen nur die
// Zeile weg, nie die Karte.
// Kampfbühne (31.10.2026): Text und Art getrennt vom Aussehen, damit Sprechblase und Ruhezeile denselben Text nutzen.
// Liefert { art, text } oder null.
export function bossReaktion(v, a) {
  const { jetzt, nameVon, stand, stilWerte } = kx;
  const gid = a.gegner || v.gegner;
  const art = BR.reaktionsArt({ antwort: a.heuteAntwort, kraft: a.anzahl - a.treffer, anzahl: a.anzahl, rundeTag: a.rundeTag, siegHeute: a.siegHeute, neuerGegner: a.neuerGegner, bedingungOffen: a.bedingungenOffen === true }, BOSS_REAKTION_EINSTELLUNG.phaseAb);
  if (!art) return null;
  // „morgen“: Text nach dem besiegten Gegner, Bild = der Neue als Silhouette (Name bleibt verborgen)
  const textId = art === 'morgen' ? besiegtHeuteVorNeuem(a) || '_allgemein' : gid;
  const r = BR.waehleReaktion(BOSS_REAKTIONEN, textId, art, `${a.heute}|${textId}|${art}`);
  if (!r) return null;
  try { return { art: r.art, text: I.fuelle(r.text, I.werteFuer(stand, jetzt(), v, TABELLE, nameVon, stilWerte())) }; }
  catch (e) { console.warn('Boss-Reaktion:', e.message); return null; }
}
export function bossReaktionHtml(v, a) {
  const { img, ui } = kx;
  const gid = a.gegner || v.gegner;
  const r = bossReaktion(v, a);
  if (!r) return '';
  const text = r.text;
  const g = TABELLE.gegner[gid];
  const treffer = ui.einmal.has('treffer'); // Bewegung nur direkt nach dem eigenen Treffer (Ablauf „tagesCheck“)
  const bild = r.art === 'morgen'
    ? '<span class="boss-reaktion-siegel" aria-hidden="true">?</span>' // Silhouette im runden Ausschnitt wäre nur eine dunkle Scheibe
    : `<span class="boss-reaktion-rahmen"${bwStil('tagesCheck', 'reaktionBild', treffer)}>${img('boss-' + gid, g ? g.name : '', 'boss', 'boss-reaktion-bild', '', 'rund')}${blitzEbene('tagesCheck', 'reaktionBlitz', treffer)}</span>`;
  return `<div class="boss-reaktion art-${r.art}" role="status"${bwStil('tagesCheck', 'reaktion', ui.einmal.has('check'))}>${bild}<p>${esc(text)}</p></div>`;
}
// Kopfleiste kompakt (Etappe 3, Teil A, 02.11.2026): Warum und Zahl der Anwendungen in EINER Zeile. Das Warum bleibt
// wörtlich (eigene Worte stärken die eigene Motivation), wird aber bei Länge gekürzt; der volle Lebens-Satz steht im
// aria-label der Zahl. Ohne Anwendungen nur das Warum.
export function warumZeile(v, warum) {
  const { T, ui, wort } = kx;
  const max = Number(KOPFLEISTE && KOPFLEISTE.warumZeichen) || 0;
  const lang = max > 0 && String(warum).length > max;
  const auf = lang && ui.klWarumAuf === true;
  const e = entw();
  const f = TABELLE.faehigkeiten[v.faehigkeit];
  const voll = e && e.anwendungen && f ? `${T('leben.anwendungen', { n: e.anwendungen, verb: f.verb })} ${T('leben.seit', { datum: kurzDatum(e.start) })}${e.siege ? ` · ${T('leben.siege', { n: e.siege, sieg: wort('sieg') })}` : ''}` : '';
  const zahl = voll && fortschrittHier('anwendungen', 'kopfleiste') ? `<span class="kl-zahl" role="img" aria-label="${esc(voll)}" title="${esc(voll)}">${icon('check')}${esc(T('leben.kurz', { n: e.anwendungen }))}</span>` : '';
  const knopf = lang ? `<button class="icbtn kl-warum-knopf" data-a="kl-warum" aria-expanded="${auf}" aria-label="${esc(T(auf ? 'kopf.warumZu' : 'kopf.warumAuf'))}">${icon(auf ? 'hoch' : 'runter')}</button>` : '';
  return `<p class="kl-zeile${auf ? ' auf' : ''}"><span class="quest-warum">${esc(T('quest.warum', { warum }))}</span>${zahl}${knopf}</p>`;
}
export function lebenZeile(v) {
  const { T, wort } = kx;
  const e = entw();
  if (!e || !e.anwendungen) return '';
  const f = TABELLE.faehigkeiten[v.faehigkeit];
  return `<p class="leben">${icon('check')}<span><b>${esc(T('leben.anwendungen', { n: e.anwendungen, verb: f.verb }))}</b> ${esc(T('leben.seit', { datum: kurzDatum(e.start) }))}${e.siege ? ` · ${esc(T('leben.siege', { n: e.siege, sieg: wort('sieg') }))}` : ''}</span></p>`;
}
// Weg der Bosskette auf der Quest-Karte (Version 19): Stationen = Gegner, Held rückt mit jedem Treffer vor.
// 30.10.2026: Der Held ist eine eigene Figur ÜBER dem Weg (Punkt auf dem Pfad markiert die Stelle), damit er keine
// Station mehr verdeckt; links bleiben WEG_FENSTER.zurueck besiegte Gegner sichtbar (kleiner, ruhig, mit Haken).
const WEG_HELD_HOEHE = 30; // Abstand der Heldenfigur über dem Pfad (Einheiten des 300×92-Rasters)
// Weg antippbar (31.10.2026, ersetzt den Knopf „Karte öffnen“ von 30.10.): Ist der Tab Karte nutzbar, werden Weg und
// Statuszeile EIN Knopf mit der Tab-Aktion, ein kleines Karten-Symbol am Ende der Zeile zeigt das an. Sonst bleibt
// der Weg reine Anzeige (kein Schloss, kein Hinweis). bild = Weg-HTML ohne Rolle, text = Statuszeile.
function karteTab() {
  const { tabAktiv, tabSichtbar } = kx;
  const t = TABS.find(x => x.screen === 'karte');
  try { return t && tabSichtbar(t) && tabAktiv(t) ? t : null; } catch (e) { console.warn('Weg (Karte):', e.message); return null; }
}
function wegRahmen(bild, text, v) {
  const { T, nameVon, tabLabel } = kx;
  const aria = T('weg.aria', { held: nameVon(v.held), text });
  const t = karteTab();
  if (!t) return `<span class="weg-bild" role="img" aria-label="${esc(aria)}">${bild}</span><span class="mini gut-text">${esc(text)}</span>`;
  const ziel = T('karte.oeffnen', { bereich: tabLabel(t) });
  return `<button class="weg-tipp" data-a="tab" data-id="karte" aria-label="${esc(`${aria}. ${ziel}`)}"><span class="weg-bild" aria-hidden="true">${bild}</span><span class="mini gut-text weg-zeile"><span>${esc(text)}</span>${icon('karte', 'ic weg-karte-ic')}</span></button>`;
}
// Weg als kleine Kette in einer Zeile (31.10.2026, Entwurf Version 15): besiegte Gegner klein mit Haken, der Held direkt
// vor dem Gegner, gegen den er gerade kämpft, dahinter Schatten und Nebel. Gleiche Daten wie der Pfad (logik/weg.js).
function wegKetteHtml(a, v, g, w, text, neuVerborgen) {
  const { T, img, nameVon } = kx;
  const held = `<span class="kette-held" title="${esc(T('weg.hier'))}">${img(v.held, nameVon(v.held), 'held', 'kette-bild', '', 'rund')}</span>`;
  const glieder = [];
  let heldDa = false;
  for (const st of w.stationen) {
    if (st.status === W.STATION.start) continue;
    if (st.status === W.STATION.nebel) { glieder.push('<span class="kette-st nebel" aria-hidden="true"></span>'); continue; }
    const gg = TABELLE.gegner[st.gegner] || g;
    const verbergen = st.status === W.STATION.verborgen || (st.status === W.STATION.aktuell && neuVerborgen);
    if (st.status === W.STATION.aktuell && !heldDa) { glieder.push(held); heldDa = true; }
    const cls = verbergen ? 'cover schatten' : st.status === W.STATION.besiegt ? 'cover grau' : 'cover';
    glieder.push(`<span class="kette-st ${st.status}">${img('boss-' + st.gegner, verbergen ? '?' : gg.name, 'boss', cls, '', 'rund')}${st.status === W.STATION.besiegt ? `<i class="station-haken">${icon('check')}</i>` : ''}</span>`);
  }
  if (!heldDa) glieder.push(held);
  return wegRahmen(`<span class="weg-kette">${glieder.join('<span class="kette-linie" aria-hidden="true"></span>')}</span>`, text, v);
}
// Weg als Streifen (Version 135, Entscheidung 04.11.2026): eingeklappt aktueller Gegner, Balken und Statuszeile in
// einer Zeile; aufgeklappt eine wischbare Reihe großer Bilder (besiegt · aktuell mit Held · Silhouette · Nebel).
// Auf/zu je Gerät im Merkmal weg_offen (wie „Kleiner“ bei den Karten). Ohne Merkmal: eingeklappt.
// Der Tab Karte bleibt aufgeklappt über „Ganze Karte“ erreichbar, wenn er nutzbar ist.
const wegOffen = () => merkmal('weg_offen') === true;
function wegStreifenHtml(a, v, g, w, text, neuVerborgen) {
  const { T, img, nameVon, wort } = kx;
  const offen = wegOffen();
  const iA = w.stationen.findIndex(st => st.status === W.STATION.aktuell);
  const kapitelVon = i => w.kapitel + (i - (iA < 0 ? 0 : iA));
  const anteil = !neuVerborgen && a.rundeTag >= 0 && a.anzahl > 0 ? Math.min(1, Math.max(0, a.treffer / a.anzahl)) : 0;
  const akt = iA >= 0 ? w.stationen[iA].gegner : v.gegner;
  const ga = TABELLE.gegner[akt] || g;
  const aria = esc(offen ? T('weg.streifenZu') : T('weg.streifenAuf', { text })); // der volle Stand bleibt für Vorlese-Programme
  // Version 174 (Entscheidung 10.11.2026): Die Arena darunter zeigt Gegner, Kraft und „Kapitel n“ schon. Die Leiste zeigt darum
  // nur noch die Kette („wo stehe ich im Weg“) ohne Gegnerbild, Balken und „noch n bis …“. An besonderen Tagen (neuer Gegner
  // wartet, Kampf beginnt morgen) steht stattdessen der ausführliche Text, weil ihn die Arena nicht trägt. Ohne Kette
  // (ein Gegner) oder mit KOPFLEISTE.streifen = 'status' gilt die bisherige Zeile.
  const punkte = streifenForm(KOPFLEISTE) === 'kette' ? kettenPunkte(a.gegnerNr, a.gegnerAnzahl) : [];
  let zeile;
  if (punkte.length) {
    const kurz = !neuVerborgen && a.rundeTag >= 0 ? T('weg.kapitelVon', { kapitel: wort('kapitel'), nr: a.gegnerNr, anzahl: a.gegnerAnzahl }) : text;
    zeile = `<button class="weg-streifen kette" data-a="weg-klapp" aria-expanded="${offen}" aria-controls="weg-reihe" aria-label="${aria}">
      <span class="ws-kette" aria-hidden="true">${punkte.map(s => `<i class="${s}"></i>`).join('')}</span>
      <span class="mini ws-text">${esc(kurz)}</span>
      ${icon('runter', 'ic ws-pfeil')}
    </button>`;
  } else {
    const bossBild = img('boss-' + akt, neuVerborgen ? '?' : ga.name, 'boss', neuVerborgen ? 'cover schatten' : 'cover', '', 'rund');
    zeile = `<button class="weg-streifen" data-a="weg-klapp" aria-expanded="${offen}" aria-controls="weg-reihe" aria-label="${aria}">
      <span class="ws-boss" aria-hidden="true">${bossBild}</span>
      <span class="ws-mitte"><span class="mini gut-text ws-zeile">${esc(text)}</span><span class="ws-balken" aria-hidden="true"><i style="width:${Math.round(anteil * 100)}%"></i></span></span>
      ${icon('runter', 'ic ws-pfeil')}
    </button>`;
  }
  if (!offen) return zeile;
  const haken = `<i class="station-haken">${icon('check')}</i>`;
  const kacheln = w.stationen.map((st, i) => {
    if (st.status === W.STATION.start) return '';
    if (st.status === W.STATION.nebel) return `<li class="ws-kachel nebel"><span class="ws-bild"><span class="klein">${esc(T('karte.nebel'))}</span></span></li>`;
    const gg = TABELLE.gegner[st.gegner] || g;
    const nr = kapitelVon(i);
    const kap = T('weg.kapitel', { kapitel: wort('kapitel'), nr });
    if (st.status === W.STATION.besiegt) return `<li class="ws-kachel besiegt"><span class="ws-bild">${img('boss-' + st.gegner, gg.name, 'boss', 'cover grau', '', 'quadrat')}${haken}</span><b>${esc(gg.name)}</b><span class="klein">${esc(T('weg.besiegt'))}</span></li>`;
    const verbergen = st.status === W.STATION.verborgen || neuVerborgen;
    if (verbergen) return `<li class="ws-kachel verborgen${st.status === W.STATION.aktuell ? ' aktuell' : ''}"><span class="ws-bild">${img('boss-' + st.gegner, '?', 'boss', 'cover schatten', '', 'quadrat')}</span><b>${esc(kap)}</b><span class="klein">${esc(T('weg.unbekannt'))}</span></li>`;
    return `<li class="ws-kachel aktuell"><span class="ws-bild">${img('boss-' + st.gegner, gg.name, 'boss', 'cover', '', 'quadrat')}<span class="ws-held" title="${esc(T('weg.hier'))}">${img(v.held, nameVon(v.held), 'held', 'cover', '', 'rund')}</span></span><b>${esc(`${kap}: ${gg.kurz || gg.name}`)}</b><span class="klein">${esc(T('weg.stand', { treffer: a.treffer, anzahl: a.anzahl }))}</span></li>`;
  }).join('');
  const t = karteTab();
  const karte = t ? `<button class="link ws-karte" data-a="tab" data-id="karte">${icon('karte')} ${esc(T('weg.ganzeKarte'))}</button>` : '';
  return `${zeile}<div class="ws-offen" id="weg-reihe">
      <ol class="ws-reihe" tabindex="0" aria-label="${esc(T('weg.reihe'))}">${kacheln}</ol>
      <div class="ws-fuss"><span class="klein">${esc(T('weg.wisch'))}</span>${karte}</div>
    </div>`;
}
export function wegHtml(a, v, g) {
  const { T, img, nameVon, stand, wort } = kx;
  let w;
  try { w = W.wegFenster(W.wegAnsicht(a, K.kette(stand)), WEG_FENSTER); }
  catch (e) { console.warn('Weg:', e.message); return `<span class="mini gut-text">${esc(T('weg.woche', { nr: a.wocheNr }))}</span>`; }
  const n = w.stationen.length;
  const pkt = w.stationen.map((_, i) => W.wegPunkt(i, n));
  const held = W.wegPunkt(w.position, n);
  const linie = l => l.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
  const geschafft = [...pkt.slice(0, Math.floor(w.position) + 1), held];
  const rest = Math.max(0, a.anzahl - a.treffer);
  const neuVerborgen = !!besiegtHeuteVorNeuem(a); // Version 68: Name und Bild des Neuen erst beim Kapitelwechsel
  const stationHtml = (st, i) => {
    const q = pkt[i];
    const lage = `left:${prozent(q.x, 300)};top:${prozent(q.y, 92)}`;
    if (st.status === W.STATION.start) return `<span class="station start" style="${lage}"></span>`;
    if (st.status === W.STATION.nebel) return `<span class="station nebel" style="${lage}"></span>`;
    const gg = TABELLE.gegner[st.gegner] || g;
    const verbergen = st.status === W.STATION.verborgen || (st.status === W.STATION.aktuell && neuVerborgen);
    const bildCls = verbergen ? 'cover schatten' : st.status === W.STATION.besiegt ? 'cover grau' : 'cover';
    return `<span class="station ${st.status}" style="${lage}">${img('boss-' + st.gegner, verbergen ? '?' : gg.name, 'boss', bildCls, '', 'rund')}${st.status === W.STATION.besiegt ? `<i class="station-haken">${icon('check')}</i>` : ''}</span>`;
  };
  const text = neuVerborgen ? T('weg.morgenNeu', { kapitel: wort('kapitel') })
    : a.rundeTag < 0 ? T('weg.morgen', { kapitel: wort('kapitel'), gegner: g.kurz })
    : wegText(fortschrittRegister(), 'kopfleiste', { // Version 140: welche Teile hier stehen, sagt FORTSCHRITT
      rundeStand: T('weg.stand', { treffer: a.treffer, anzahl: a.anzahl }),
      rest: rest ? T('weg.rest', { rest, gegner: g.kurz }) : '',
      kapitel: T('weg.kapitel', { kapitel: wort('kapitel'), nr: w.kapitel })
    }, a.bedingungenOffen ? T('weg.bedingung', { gegner: g.kurz }) : T('weg.rundeGeschafft', { gegner: g.kurz, sieg: wort('sieg') })); // 06.11.2026
  if (wegForm(KOPFLEISTE) === 'kette') return wegKetteHtml(a, v, g, w, text, neuVerborgen);
  if (wegForm(KOPFLEISTE) === 'streifen') return wegStreifenHtml(a, v, g, w, text, neuVerborgen);
  return wegRahmen(`<span class="weg">
      <svg viewBox="0 0 300 92" preserveAspectRatio="none" aria-hidden="true"><path class="weg-rest" d="${linie(pkt)}"/><path class="weg-geschafft" d="${linie(geschafft)}"/></svg>
      ${w.stationen.map(stationHtml).join('')}
      <span class="weg-held-fuss" style="left:${prozent(held.x, 300)};top:${prozent(held.y, 92)}"></span>
      <span class="weg-held" style="left:${prozent(held.x, 300)};top:${prozent(held.y - WEG_HELD_HOEHE, 92)}">${img(v.held, nameVon(v.held), 'held', 'cover', '', 'rund')}</span>
    </span>`, text, v);
}
// Heldenkopf (Version 43): aktiver Held groß, daneben „Helden wechseln“ mit Mini-Porträts und Zahl offener Checks.
// Ersetzt Crew-Leiste und „Weitere Helden“. Feste Reihenfolge der Crew (kein Umsortieren), Logik in logik/startseite.js.
export const bereichName = domainId => (LEBENSBEREICHE.find(d => d.id === domainId) || {}).name || '';
export function heldenKopfDaten() {
  const { heldenAnsichten, jetzt, spiel } = kx;
  const ansichten = heldenAnsichten().map(h => ({ ...h, x: K.auswertung(h.a, jetzt()) }));
  const tag = K.tagKey(jetzt());
  for (const h of ansichten) h.wartet = K.vorBeginn(h.a, tag); // Startpaket (18a): Quest beginnt erst später
  // Heldenmodi (04.11.2026): wer heute pausiert (Erhalt, Ruhe), hat nichts offen und fehlt in Tagesleiste und Lagerfeuer
  for (const h of ansichten) { h.modus = HM.modusAm(spiel, h.id, tag); h.pausiert = HM.istPausiert(h.modus); }
  // Zählweisen (04.11.2026): Rhythmus und Wache fragen nicht täglich; sie sind nie „offen“ und fehlen in Tagesleiste und
  // Lagerfeuer (wie pausierte Helden), bleiben aber über die Heldenwahl erreichbar
  for (const h of ansichten) h.ohneFrage = !!h.x.ohneFrage;
  const k = heldenKopf(ansichten.map(h => ({ id: h.id, erledigt: !!h.x.heuteAntwort || h.wartet || h.pausiert || h.ohneFrage })), spiel.fokus, HELDENKOPF.stapelMax);
  return { k, ansichten };
}
// Etappe 3, Teil C (02.11.2026): Antwort und Ruhetag je Held für heute. Eine Quelle für Tagesleiste, „Weiter zu …“ und
// Lagerfeuer, damit „fertig“ überall dasselbe heißt (ein Ruhetag zählt mit, LAGERFEUER.ruhetagZaehlt). Wirft nie je Held.
export function heldenHeute(d = heldenKopfDaten()) {
  const { jetzt, spiel } = kx;
  const tag = K.tagKey(jetzt());
  return d.ansichten.filter(h => !h.pausiert && !h.ohneFrage).map(h => { // Heldenmodi: pausierte Helden zählen heute nicht mit; Zählweisen: ohne Tagesfrage ebenso
    let ruhetag = false;
    try { ruhetag = RT.ruhetageVon(spiel, h.id, tag)[0] === tag; } catch (e) { console.warn('Ruhetag heute:', e.message); }
    const e = { id: h.id, antwort: h.x.heuteAntwort || null, ruhetag, wartet: !!h.wartet };
    return { ...e, erledigt: heuteErledigt(e, LAGERFEUER) };
  });
}
// „Neu für dich“ (Version 50): ruhiger Hinweis nach einer Freischaltung statt stiller Änderung der Leiste.
export function neuKarte() {
  const { T, neuBereiche, tabLabel, wort } = kx;
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
export function erfolgHtml(antw) {
  const { SM, T, img, jetzt, nameVon, spiel, ui } = kx;
  if (erfolgGroesse(antw, ui.erfolgFrisch, spiel.fokus, K.tagKey(jetzt()), SM.erfolg.an) !== 'gross') return '';
  const id = spiel.fokus;
  const name = nameVon(id);
  return `<figure class="erfolg-bild${ui.einmal.has('check') ? ' neu' : ''}">${img('banner-' + id, name, 'szene', 'cover', '')}<span class="erfolg-verlauf" aria-hidden="true"></span>
    <figcaption><span class="eyebrow">${esc(T('erfolg.eyebrow'))}</span><span class="erfolg-text">${esc(T('erfolg.text', { held: name }))}</span></figcaption>
    <button class="klein-knopf auf-bild" data-a="erfolg-klein">${esc(T('erfolg.klein'))}</button></figure>`;
}
// Wechsel-Banner (Version 49): kurz Bild und Name beim bewussten Heldenwechsel; verschwindet nach SM.wechsel.dauerMs.
export function wechselBannerHtml(h) {
  const { SM, T, img, nameVon, spiel, ui } = kx;
  if (!ui.einmal.has('wechsel') || !wechselBanner(ui.wechselVon, h.id, spiel.helden.map(x => x.heroId), SM.wechsel.an)) return '';
  const name = nameVon(h.id);
  const f = TABELLE.faehigkeiten[h.v.faehigkeit];
  const zeile = h.x.heuteAntwort ? T('wechsel.erledigt') : T('wechsel.offen', { faehigkeit: f ? f.name : '' });
  return `<div class="wechsel-banner" role="status" style="--dauer:${SM.wechsel.dauerMs}ms">${img('banner-' + h.id, name, 'szene', 'cover', '')}<span class="erfolg-verlauf" aria-hidden="true"></span>
    <span class="wechsel-text"><span class="eyebrow">${esc(T('wechsel.eyebrow'))}</span><span class="wechsel-name">${esc(name)}</span><span class="klein">${esc(zeile)}</span></span></div>`;
}
// Heldenkopf (nur noch auf der Karte, seit 31.10.2026): Porträt, Name, Bereich · Stufe. Wechsel und XP-Leiste sind weg:
// gewechselt wird oben über heldenStapelKnopf(), die XP stehen im Heldenblatt.
export function heldenkopfHtml() {
  const { T, img, nameVon, wort } = kx;
  const { k, ansichten } = heldenKopfDaten();
  const h = ansichten.find(x => x.id === k.aktiv);
  if (!h) return '';
  const name = nameVon(h.id);
  return `<div class="heldenkopf">
    <button class="kopf-portraet" data-a="blatt" data-id="crew" aria-label="${esc(T('kopf.ansehen', { held: name }))}">${img(h.id, name, 'held', 'kopf-bild', '')}<span class="kopf-info" aria-hidden="true">i</span></button>
    <div class="kopf-text"><span class="eyebrow">${esc(T('kopf.aktiv'))}</span><span class="kopf-name">${esc(name)}</span><span class="klein">${esc([bereichName(h.domainId), `${wort('stufe')} ${h.x.level}`].filter(Boolean).join(' · '))}</span></div>
    </div>`;
}
// Helden wechseln (31.10.2026): Porträtstapel oben neben den Einstellungen, auf Startseite und Karte (HELDENWAHL_SCREENS).
// Klasse wechsel-knopf bleibt: app.js setzt nach dem Schließen der Heldenwahl den Fokus darauf zurück.
export function heldenStapelKnopf() {
  const { T, img, nameVon, ui } = kx;
  if (!HELDENWAHL_SCREENS.includes(ui.screen)) return '';
  let d;
  try { d = heldenKopfDaten(); } catch (e) { console.warn('Heldenstapel:', e.message); return ''; }
  const { k } = d;
  if (!k.mitWechsel) return '';
  if (ui.screen === 'start' && tagesleisteDaten(d).zeigen) return ''; // Startseite: Tagesleiste statt Stapel (Etappe 3, Teil B)
  return `<button class="wechsel-knopf oben" data-a="helden-wahl" aria-haspopup="dialog" aria-expanded="${!!ui.heldenWahl}" aria-label="${esc(T('kopf.wechseln'))}${k.offen ? esc(', ' + T('kopf.offen', { n: k.offen })) : ''}">
      <span class="stapel" aria-hidden="true">${k.stapel.map(id => img(id, nameVon(id), 'held', 'stapel-bild')).join('')}</span>
      ${k.offen ? `<span class="offen-zahl" aria-hidden="true">${k.offen}</span>` : ''}${icon('runter')}</button>`;
}
// Tagesleiste (Etappe 3, Teil B, 02.11.2026): „Heute x von n“ und die Porträts in fester Reihenfolge, Haken bei erledigt,
// der gewählte Held mit Rahmen. Ein Tipp wechselt den Helden (gleiche Aktion „fokus“ wie die Heldenwahl). Kein Hinweis auf
// Offenes in Rot und keine Zahl offener Checks: die Leiste zeigt den Tag, sie mahnt nicht. Offene Helden tragen einen
// kleinen Punkt in der Akzentfarbe des Stils (Entscheidung 02.11.2026, Punkt 1b: bewusste Ausnahme von „Punkte nie für
// offene Aufgaben“, weil die Leiste eine Tagesübersicht ist, kein Benachrichtigungspunkt; nie Rot).
function tagesleisteDaten(d = heldenKopfDaten()) {
  const { spiel } = kx;
  // Version 177: Helden ohne Tagesfrage (Rhythmus, Wache) stehen als eigene, ruhige Gruppe daneben; pausierte bleiben im Stapel
  const abruf = d.ansichten.filter(h => h.ohneFrage && !h.pausiert).map(h => ({ id: h.id }));
  return tagesleiste(heldenHeute(d), spiel.fokus, TAGESLEISTE, abruf, { plus: H.heldDazu(spiel) }); // seit Teil C: Ruhetag zählt als fertig
}
export function tagesleisteHtml() {
  const { T, img, nameVon, symbol } = kx;
  const d = heldenKopfDaten();
  const tl = tagesleisteDaten(d);
  if (!tl.zeigen) return '';
  const knopf = e => {
    const name = nameVon(e.id);
    const aria = T(e.aktiv ? 'tl.heldAktiv' : e.erledigt ? 'tl.heldErledigt' : 'tl.held', { held: name });
    return `<button class="tl-held${e.aktiv ? ' an' : ''}${e.erledigt ? ' fertig' : ''}" data-a="fokus" data-id="${esc(e.id)}" aria-label="${esc(aria)}"${e.aktiv ? ' aria-current="true"' : ''}>${img(e.id, name, 'held', 'tl-bild', '')}${e.erledigt ? `<span class="tl-haken" aria-hidden="true">${icon('check')}</span>` : '<span class="tl-offen" aria-hidden="true"></span>'}</button>`;
  };
  // Ohne Tagesfrage: kein Punkt, kein Haken, ruhiger Ring in der Randfarbe des Stils (nie Rot) mit dem Zeichen der Zählweise
  // (Auge, Kreispfeil) und darunter Erreichtes bzw. der Takt („3 Momente“, „2× / Woche“; Version 179, Punkte 11a, 12, 15a)
  const abrufKnopf = e => {
    const name = nameVon(e.id);
    const h = d.ansichten.find(x => x.id === e.id);
    let zw = { texte: {} };
    try { zw = K.zaehlweiseHeute(h.a, K.tagKey(kx.jetzt())); } catch (err) { console.warn('Tagesleiste (Zählweise):', err.message); }
    const t = zw.texte || {};
    const status = T(t.status || 'kopf.statusOffen');
    const zahl = h && h.x && zw.kappeZahl ? h.x[zw.kappeZahl] : 0;
    const kappe = kappeText(t, Number.isInteger(zahl) ? zahl : 0, T, TAGESLEISTE.kappeZeichen, status);
    const zeichen = zw.symbol ? `<span class="tl-zw" aria-hidden="true">${icon(symbol(`zaehlweise.${zw.id}`, zw.symbol))}</span>` : '';
    const aria = T(e.aktiv ? 'tl.heldAktiv' : 'tl.heldAbruf', { held: name, zaehlweise: `${status}, ${kappe}` });
    return `<span class="tl-abruf-wrap"><button class="tl-held abruf${e.aktiv ? ' an' : ''}" data-a="fokus" data-id="${esc(e.id)}" aria-label="${esc(aria)}"${e.aktiv ? ' aria-current="true"' : ''}>${img(e.id, name, 'held', 'tl-bild', '')}${zeichen}</button><span class="tl-kappe" aria-hidden="true">${esc(kappe)}</span></span>`;
  };
  const abruf = tl.abruf.length ? `${tl.eintraege.length ? '<span class="tl-trenner" aria-hidden="true"></span>' : ''}${tl.abruf.map(abrufKnopf).join('')}` : '';
  // Version 179: ohne Held mit Tagesfrage steht „Kein Muss für heute“ statt „0 von 0“. Der Text links öffnet das Blatt
  // „Helden wechseln“ (Übersicht in Gruppen, Punkt 9), daher ein Knopf mit kleinem Pfeil.
  const zahlText = tl.ohneTagesfrage ? `<b class="tl-ohne">${esc(T('tl.keinMuss'))}</b>` : `<b>${esc(T('tl.zahl', { n: tl.erledigt, gesamt: tl.gesamt }))}</b>`;
  const aria = tl.ohneTagesfrage ? T('tl.ariaOhne', { n: tl.abruf.length }) : T('tl.aria', { n: tl.erledigt, gesamt: tl.gesamt });
  return `<div class="karte tagesleiste${tl.ohneTagesfrage ? ' ohne-tf' : ''}" role="group" aria-label="${esc(aria)}">
    ${d.k.mitWechsel ? `<button class="tl-text" data-a="helden-wahl" aria-haspopup="dialog" aria-label="${esc(T('tl.alle'))}"><span class="eyebrow">${esc(T('tl.heute'))} ${icon('runter', 'ic tl-pfeil')}</span>${zahlText}</button>` : `<span class="tl-text tl-nur"><span class="eyebrow">${esc(T('tl.heute'))}</span>${zahlText}</span>`}
    <span class="tl-helden">${tl.eintraege.map(knopf).join('')}${abruf}${pausierteKnopf(d, tl.abruf.map(e => e.id))}${tl.plus ? plusKnopf() : ''}</span>
  </div>`;
}
// „+“ am Ende der Tagesleiste (Version 183, Punkt 8): ruhiger Knopf in der Randfarbe, kein leerer Platzhalter (der lädt zum
// Vervollständigen ein). Gleiche Aktion wie „Neuen Helden dazuholen“; data-id = Herkunft für die Auswertung.
function plusKnopf() {
  const { T, symbol } = kx;
  const t = esc(T('kopf.neuerHeld'));
  return `<button class="tl-plus" data-a="neues-abenteuer" data-id="tagesleiste" aria-label="${t}" title="${t}">${icon(symbol('tl.plus', 'plus'))}</button>`;
}
// Heldenmodi (04.11.2026): pausierte Helden (Erhalt, Ruhe) stehen nicht in der Tagesleiste; ein kleiner Stapel daneben
// öffnet die Heldenwahl, damit sie erreichbar bleiben. Seit Version 177 gehören auch Helden ohne Tagesfrage dazu, die in
// der Leiste keinen Platz mehr haben (TAGESLEISTE.abrufMax). Ohne solche Helden: ''.
function pausierteKnopf(d = heldenKopfDaten(), imPlatz = []) {
  const { T, img, nameVon } = kx;
  let ids = [];
  let ruhen = 0;
  try {
    const l = d.ansichten.filter(h => h.pausiert || (h.ohneFrage && !imPlatz.includes(h.id)));
    ids = l.map(h => h.id);
    ruhen = l.filter(h => h.pausiert).length;
  } catch (e) { console.warn('Tagesleiste (Pausen):', e.message); }
  if (!ids.length) return '';
  const aria = ruhen === ids.length ? T('tl.pausiert', { n: ids.length }) : T('tl.weitere', { n: ids.length });
  return `<button class="tl-pausiert" data-a="helden-wahl" aria-haspopup="dialog" aria-label="${esc(aria)}"><span class="stapel" aria-hidden="true">${ids.slice(0, HELDENKOPF.stapelMax).map(id => img(id, nameVon(id), 'held', 'stapel-bild')).join('')}</span></button>`;
}
// Kopfzeile der Seiten mit Kulisse: Datum links, rechts Schnellweg „Gerade schwer“ (Version 139), Heldenstapel (falls die
// Seite wechseln kann), Tagesnotiz und Einstellungen.
export function kopfZeile(datum) {
  return `<div class="start-kopf"><span class="datum">${esc(datum)}</span>${kopfRechts(heldenStapelKnopf() + notizKopfKnopf())}</div>`;
}
// Kopfleiste (31.10.2026, Entscheidungen Abschnitt 18): Held und Hauptquest in EINER Karte. Porträt mit ⓘ (öffnet das
// Heldenblatt) und Stufe darunter; daneben Held · Bereich · Kapitel, Questtitel mit Stift, Warum und (seit Version 89)
// die Lebenszeile „n-mal …“: sie nutzt den freien Platz neben dem Porträt und gehört zur Quest. Darunter der Weg mit
// Statuszeile über die ganze Breite (bleibt zusammen, weil „noch n bis …“ den Weg erklärt). Keine XP-Leiste (eine
// leere Leiste am Anfang wirkt wie ein Mangel).
export function kopfleisteHtml({ v, g, a }) {
  const { T, funktionFrei, img, nameVon, stand, wort } = kx;
  const { k, ansichten } = heldenKopfDaten();
  const h = ansichten.find(x => x.id === k.aktiv);
  if (!h || !stand.quest) return '';
  const name = nameVon(h.id);
  const kapitelHier = a.gegnerAnzahl > 1 && fortschrittHier('kapitel', 'kopfleiste'); // Version 140
  const zeile = [name, bereichName(h.domainId), kapitelHier ? `${wort('kapitel')} ${a.gegnerNr}` : ''].filter(Boolean).join(' · ');
  const stift = funktionFrei('quests_bearbeiten')
    // Version 153: Knopf mit Wort statt nur Stift (war zu unauffällig für eine Grundfunktion); langer Text bleibt als aria-label
    ? `<button class="kl-bearbeiten" data-a="quest-bearbeiten" aria-label="${esc(T('qe.titel', { quest: wort('quest') }))}">${icon('stift')}<span>${esc(T('qe.knopf'))}</span></button>` : '';
  return `${wechselBannerHtml(h)}<div class="karte kopfleiste" role="group" aria-label="${esc(T('kopf.leisteAria', { held: name, quest: wort('quest') }))}">
    <div class="kl-oben">
      <div class="kl-portraet">
        <button class="kopf-portraet" data-a="blatt" data-id="crew" aria-label="${esc(T('kopf.ansehen', { held: name }))}">${img(h.id, name, 'held', 'kopf-bild', '')}<span class="kopf-info" aria-hidden="true">i</span></button>
        ${fortschrittHier('stufe', 'kopfleiste') ? `<span class="kl-stufe">${esc(`${wort('stufe')} ${h.x.level}`)}</span>` : ''}
      </div>
      <div class="kopf-text">
        <span class="eyebrow">${esc(zeile)}</span>
        <div class="quest-zeile"><span class="questtitel">${esc(stand.quest.ziel)}</span>${stift}</div>
        ${stand.quest.warum ? warumZeile(v, stand.quest.warum) : ''}
        ${zielZeileHtml()}
        ${stand.quest.warum || !fortschrittHier('anwendungen', 'kopfleiste') ? '' : lebenZeile(v)}
      </div>
    </div>
    ${wegHtml(a, v, g)}
  </div>`; // XP-Rückmeldung zeichnet seit 30.10.2026 renderJetzt() über dem sichtbaren Ausschnitt
}
// Neuigkeiten am festen Platz (31.10.2026): Karten nach NEU_PLATZ.vorrang, höchstens NEU_PLATZ.max verschiedene am Tag
// (logik/startseite.js neuPlatz, je Gerät gemerkt im Merkmal neu_platz). Jede Karte trägt data-neu=<id>, damit der Glanz
// genau sie trifft. Eine kaputte Karte fällt allein weg, nie der ganze Platz.
const NEU_KARTEN = {
  einwilligung: () => { const { einw } = kx; return EW.istOffen(einw) ? einwKarte(false) : ''; },
  freigabe: () => neuKarte(),
  angebot: () => angebotKarte(),
  welten: () => weltenKarte(),
  zielstand: () => zielstandKarte(), // Ziel-Quests (31.10.2026): Ziel erreicht oder Stichtag vorbei
  rueckblick: () => rueckblickKarte(), // Rundenrückblick (02.11.2026): Runde vorbei, Brief des Helden
  testerhinweis: () => testerKarte(), // 09.11.2026: „Du testest eine frühe Version“, einmalig, leise
  denken: () => denkenKarte(), // Version 165: „Wie diese App denkt“, einmalig
  brief: () => beweisKarte(), // Version 166: „Schreib dir einen Brief“, einmalig nach dem ersten Sieg
  plancheck: () => plancheckKarte(), // Version 167: „Trägt dein Plan noch?“, nach je 4 Rückblicken
  abschluss: () => abschlussKarte(false), // Version 169: Kette geschafft, noch nichts gewählt
  abschlussSpaeter: () => abschlussKarte(true) // Version 169: „Später entscheiden“, leise
};
const kartenIds = (liste, name) => (Array.isArray(liste) ? liste : []).filter(id => {
  if (Object.prototype.hasOwnProperty.call(NEU_KARTEN, id)) return true;
  console.warn(`Startseite: unbekannte Neuigkeit „${id}“ in NEU_PLATZ.${name}`);
  return false;
});
const NEU_IDS = kartenIds(NEU_PLATZ && NEU_PLATZ.vorrang, 'vorrang');
const NEU_LEISE = kartenIds(NEU_PLATZ && NEU_PLATZ.leise, 'leise');
export function neuigkeitenHtml() {
  const { T, jetzt } = kx;
  const html = {};
  for (const id of [...NEU_IDS, ...NEU_LEISE]) {
    try { html[id] = NEU_KARTEN[id]() || ''; } catch (e) { console.warn(`Neuigkeit ${id}:`, e.message); html[id] = ''; }
  }
  const p = neuPlatz(NEU_IDS.filter(id => String(html[id]).trim()), merkmal('neu_platz'), K.tagKey(jetzt()), NEU_PLATZ && NEU_PLATZ.max);
  if (p.merken) merke('neu_platz', p.merken);
  // Leise Karten: nur wenn noch Platz ist, nie wartend
  const max = NEU_PLATZ && Number.isInteger(NEU_PLATZ.max) ? NEU_PLATZ.max : 2;
  const leise = NEU_LEISE.filter(id => String(html[id]).trim()).slice(0, Math.max(0, max - p.sichtbar.length));
  const sichtbar = [...p.sichtbar, ...leise];
  if (!sichtbar.length && !p.warten.length) return '';
  const n = p.warten.length;
  return `<div class="neuigkeiten" data-neu-platz>${sichtbar.map(id => markiere(html[id], id, 'neu')).join('')}${n ? `<p class="neu-wartet">${esc(T(n === 1 ? 'neu.wartetEine' : 'neu.wartenMehr', { n }))}</p>` : ''}</div>`;
}
// „Beginnt morgen“ bzw. „Beginnt am …“ für eine Quest, die erst später startet (Startpaket, 18a). Wirft nie.
export function beginntText(a) {
  const { T, jetzt } = kx;
  const start = a && a.quest && a.quest.start;
  const d = jetzt();
  const morgen = K.tagKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12));
  return start === morgen || !start ? T('beginn.morgen') : T('beginn.am', { tag: kurzDatum(start) });
}
// „Weiter zu …“ (Version 45): nach dem Check des aktiven Helden der nächste mit offenem Check (feste Reihenfolge).
export function weiterZuHtml() {
  const { T, img, nameVon, spiel, ui } = kx;
  if (spiel.helden.length < 2) return '';
  const { k, ansichten } = heldenKopfDaten();
  const id = naechsterOffener(ansichten.map(h => ({ id: h.id, erledigt: !!h.x.heuteAntwort || h.wartet || h.pausiert || h.ohneFrage })), k.aktiv);
  if (!id) return `<p class="tat-alle${ui.einmal.has('check') ? ' neu' : ''}" role="status">${esc(T('tat.alleErledigt'))}</p>`;
  return weiterZuKnopf(id, ui.einmal.has('check'));
}
export function weiterZuKnopf(id, neu = false) {
  const { T, img, nameVon } = kx;
  const name = nameVon(id);
  return `<button class="weiter-zu${neu ? ' neu' : ''}" data-a="fokus" data-id="${esc(id)}">${img(id, name, 'held', 'weiter-bild', '')}<span class="spalte"><span class="klein">${esc(T('tat.naechster'))}</span><span class="nm">${esc(T('tat.weiter', { held: name }))}</span></span>${icon('pfeilRechts')}</button>`;
}
// Bildschirme mit Heldenkopf und Wechsel (Karte seit 30.10.2026: eine Karte je Held)
const HELDENWAHL_SCREENS = ['start', 'karte'];
// Popup „Helden wechseln“ als Blatt von unten (gleiches Muster wie die Detailblätter, Daumen-Reichweite am Handy).
export function heldenWahlHtml() {
  const { T, img, nameVon, ui, wort } = kx;
  if (!ui.heldenWahl || !HELDENWAHL_SCREENS.includes(ui.screen)) return '';
  const { k, ansichten } = heldenKopfDaten();
  if (!k.mitWechsel) { ui.heldenWahl = false; return ''; }
  const zeileVon = ({ id, domainId, v, x, a, wartet, modus, pausiert, ohneFrage }) => {
    const aktiv = id === k.aktiv;
    const name = nameVon(id);
    // Heldenmodi: pausierte Helden zeigen ihren Modus statt „Check offen“, ohne Schnell-Haken
    // Zählweisen: ohne Tagesfrage steht der Name der Zählweise statt „Check offen“ (der Schnell-Haken bleibt)
    const zwStatus = ohneFrage ? T((K.zaehlweiseHeute(a, K.tagKey(kx.jetzt())).texte || {}).status || 'kopf.statusOffen') : null;
    const status = aktiv ? T('kopf.statusAktiv') : pausiert ? wort(`modus_${modus}`) : x.heuteAntwort ? T('kopf.statusErledigt') : wartet ? beginntText(a) : zwStatus || T('kopf.statusOffen');
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const schnell = !aktiv && !pausiert && !x.heuteAntwort && !wartet && f
      ? `<button class="schnell" data-a="schnell" data-id="${esc(id)}" aria-label="${esc(name)}: heute ${esc(f.verb)}">${icon('check')}</button>` : '';
    return `<div class="wahl-zeile${aktiv ? ' an' : ''}">
      <button class="wahl-info" data-a="fokus" data-id="${esc(id)}" ${aktiv ? 'aria-current="true"' : ''}>${img(id, name, 'held', 'wahl-bild')}
        <span class="spalte"><span class="nm">${esc(name)}</span><span class="klein">${esc([bereichName(domainId), `${wort('stufe')} ${x.level}`].filter(Boolean).join(' · '))}</span></span>
        <span class="wahl-status ${aktiv ? 'akzent-text' : pausiert || ohneFrage && !x.heuteAntwort ? 'ruhig-text' : x.heuteAntwort || wartet ? 'gut-text' : 'offen-text'}">${esc(status)}</span></button>${schnell}</div>`;
  };
  // Version 179 (Punkt 9): Gruppen „Heute dran“ · „Kein Muss für heute“ · „Ruht“ (eingeklappt) statt einer langen Liste.
  // Überschriften erst ab zwei Gruppen; innerhalb der Gruppe die feste Crew-Reihenfolge. Fehler → Liste wie bisher.
  let zeilen;
  try {
    const gr = heldenGruppen(ansichten.map(h => ({ id: h.id, pausiert: h.pausiert, ohneFrage: h.ohneFrage, wartet: h.wartet })), HELDENWAHL_GRUPPEN);
    const nach = id => ansichten.find(h => h.id === id);
    zeilen = gr.gruppen.map(g => {
      const inhalt = g.ids.map(id => zeileVon(nach(id))).join('');
      if (!gr.mitKopf) return inhalt;
      const kopf = esc(T(`wahl.gruppe.${g.gruppe}`));
      // Eingeklappt nur, wenn der aktive Held nicht darin steht (sonst wäre der gewählte Held versteckt)
      return g.zu && !g.ids.includes(k.aktiv)
        ? `<details class="wahl-gruppe"><summary class="eyebrow">${kopf} · ${g.ids.length}</summary>${inhalt}</details>`
        : `<div class="wahl-gruppe" role="group" aria-label="${kopf}"><span class="eyebrow">${kopf}</span>${inhalt}</div>`;
    }).join('');
  } catch (e) {
    console.warn('Heldenwahl (Gruppen):', e.message);
    zeilen = ansichten.map(zeileVon).join('');
  }
  return `<div class="feier unten" role="dialog" aria-modal="true" aria-labelledby="wahl-t">
    <button class="hintergrund" data-a="helden-wahl-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint"><div class="blatt-inhalt"><h2 id="wahl-t">${esc(T('kopf.wahlTitel', { crew: wort('crew') }))}</h2>${zeilen}${crewKnopfHtml()}${H.heldDazu(kx.spiel) ? `<button class="btn wahl-neu" data-a="neues-abenteuer" data-id="heldenwahl">${esc(T('kopf.neuerHeld'))}</button>` : ''}<button class="cta" data-a="helden-wahl-zu">${esc(T('nav.schliessen'))}</button></div></div>
  </div>`;
}
export function angebotKarte() {
  const { T, angebotFrei } = kx;
  if (!angebotFrei()) return ''; // Version 69: erstes Angebot erst nach der Freigabe
  // Version 58: hervorgehoben wie Siegel und Botschaft (goldener Stern, Glanz einmal je Angebot; Kennung = Zahl der Helden,
  // denn nach einem neuen Helden ist das nächste Angebot eine neue Sache)
  return `<div class="karte spalte angebot"><span class="angebot-kopf"><span class="stern-klein" aria-hidden="true">${icon('stern')}</span><span class="eyebrow akzent">${esc(T('angebot.eyebrow'))}</span></span>
    <span class="nm gross-nm">${esc(T('angebot.titel'))}</span>
    <p class="klein">${esc(T('angebot.text', { max: H.MAX_HELDEN }))}</p>
    <div class="zwei"><button class="btn voll" data-a="neues-abenteuer">${esc(T('angebot.ja'))}</button><button class="btn" data-a="angebot-spaeter">${esc(T('angebot.spaeter'))}</button></div></div>`;
}
// Crew-Botschaft des Tages (aus crewKarte herausgelöst, 31.10.2026, für die Sprechblase der Kampfbühne).
// Liefert { v, b, tag, gelesen } oder null, wenn heute nichts zu sagen ist.
export function botschaftHeute() {
  const { aktuelleVorlage, jetzt, nameVon, spiel, stand, stilWerte } = kx;
  const v = aktuelleVorlage();
  // Version 68: am Siegtag mit neuem Gegner spricht die Crew über den Besiegten (der Neue bleibt bis zum Kapitelwechsel verborgen)
  const bid = besiegtHeuteVorNeuem(K.auswertung(stand, jetzt()));
  const b = bid ? I.botschaft(stand, jetzt(), { ...v, gegner: bid }, TABELLE, BOTSCHAFTEN, nameVon, stilWerte(), 'besiegt')
    : I.botschaft(stand, jetzt(), v, TABELLE, BOTSCHAFTEN, nameVon, stilWerte());
  // Am ersten Tag nicht zeigen: das Onboarding hat Verbündeten und Gegner gerade erst vorgestellt.
  if (!b.text || b.anlass === 'erster_tag') return null;
  const tag = K.tagKey(jetzt());
  return { v, b, tag, gelesen: H.istGelesen(spiel, spiel.fokus, tag) };
}
// „Gesehen“ der Crew-Botschaft höchstens einmal am Tag zählen
export function botschaftGesehen(b, tag) { if (merkmal('crew_msg_tag') !== tag) { merke('crew_msg_tag', tag); trackEvent('crew_message_seen', { anlass: b.anlass }); } }
export function crewKarte() {
  const { START_IDS, T, img, jetzt, nameVon, stand, ui } = kx;
  const d = botschaftHeute();
  if (!d) return '';
  const { v, b, tag, gelesen } = d;
  const klein = !ui.botschaftOffen && (gelesen || K.auswertung(stand, jetzt()).heuteAntwort);
  // Version 57: ungelesen → hervorgehoben (größeres Porträt, Akzentrahmen, „neu“); gelesen → ruhig wie bisher. Wippen: daten/neuigkeiten.js
  if (klein && gelesen) return `<button class="botschaft-klein" data-a="botschaft-auf">${img(v.held, nameVon(v.held), 'held', 'rund-klein')}<span>${esc(T('botschaft.klein', { held: nameVon(v.held) }))}</span></button>`;
  if (klein) return `<button class="botschaft-klein botschaft-neu" data-a="botschaft-auf">${img(v.held, nameVon(v.held), 'held', 'rund-klein')}<span>${esc(T('botschaft.ungelesen', { held: nameVon(v.held) }))}</span><span class="neu">${esc(T('botschaft.neu'))}</span></button>`;
  botschaftGesehen(b, tag);
  // Version 68: Porträt weglassen, wenn der Heldenkopf (gleicher Held, gleiches Bild) direkt darüber steht – Name genügt
  const mitBild = !START_IDS.includes('kopfleiste');
  return `<div class="botschaft">${mitBild ? img(v.held, nameVon(v.held), 'held', 'rund gut-rand-b') : ''}<p class="blase${mitBild ? '' : ' ohne-bild'}"><b>${esc(nameVon(v.held))}</b>${esc(b.text)}<button class="link botschaft-ok" data-a="botschaft-zu">${esc(T('botschaft.ok'))}</button></p></div>`;
}
// Gekürzte Crew-Blase aufklappen (Version 142). true = aufgeklappt, der Tipp ist damit erledigt. Wirft nie.
export function blaseAufklappen(el) {
  try {
    if (!el || !el.classList || !el.classList.contains('crew-blase') || el.classList.contains('ganz')) return false;
    const satz = typeof el.querySelector === 'function' ? el.querySelector('.blase-satz') : null;
    if (!satz || !(satz.scrollHeight > satz.clientHeight + 1)) return false;
    el.classList.add('ganz');
    return true;
  } catch (e) { console.warn('Sprechblase:', e.message); return false; }
}
// Andeutung: Welcher Story-Teil wird morgen frei? (nur wenn heute schon eingecheckt; berücksichtigt Runden- und Gegnerwechsel)
export function storyMorgen() {
  const { aktuelleVorlage, jetzt, nameVon, stand, stilWerte, story } = kx;
  if (!stand.quest || !K.auswertung(stand, jetzt()).heuteAntwort) return null;
  const d = jetzt(); d.setDate(d.getDate() + 1);
  try {
    const st = I.storyWoche(stand, d, aktuelleVorlage(), TABELLE, STORIES, nameVon, stilWerte());
    return st.teile[st.frei] ? { ...st.teile[st.frei], titelWoche: st.titel, neueGeschichte: st.woche !== story().woche } : null;
  } catch (e) { console.warn('Story-Andeutung:', e.message); return null; }
}
// Bonus-Aufgaben (Version 45). Version 54: wieder eingefügt, war in Version 48 versehentlich entfernt worden.
export function mikroKarte() {
  const { T, img, mikroListe, nameVon, spiel, ui } = kx;
  const liste = mikroListe();
  if (!liste.length) return '';
  const fertig = liste.filter(m => m.erledigt).length;
  // Version 45: nur die ersten BONUS.sichtbar zeigen, Rest hinter „+ N weitere“ (feste Reihenfolge, nichts springt).
  const b = bonusAnsicht(liste, BONUS.sichtbar, ui.bonusMehr);
  const umschalten = b.umschaltbar ? `<button class="link bonus-mehr" data-a="bonus-mehr" aria-expanded="${!!ui.bonusMehr}">${esc(ui.bonusMehr ? T('bonus.weniger') : T('bonus.mehr', { n: b.weitere }))}</button>` : '';
  return `<div class="karte spalte mikro">
    <div class="zeile"><span class="eyebrow">${esc(T('bonus.titel'))}</span><span class="mini rechts-oben">${fertig} von ${liste.length}</span></div>
    ${b.sichtbar.map((m, i) => `<button class="mikro-zeile ${m.erledigt ? 'fertig' : ''}${ui.einmal.has('bonus') && i >= BONUS.sichtbar ? ' neu' : ''}" style="--i:${Math.max(0, i - BONUS.sichtbar)}" data-a="mikro" data-id="${esc(m.held + '|' + m.id)}" aria-pressed="${m.erledigt}"><span class="haken-kreis">${m.erledigt ? icon('check') : ''}</span><span class="mikro-text">${esc(m.text)}</span>${spiel.helden.length > 1 ? img(m.held, nameVon(m.held), 'held', 'mikro-held', nameVon(m.held)) : ''}</button>`).join('')}
    ${umschalten}
  </div>`;
}
// Story-Karte (Version 48, „Story nur, wenn neu“): groß nur, wenn ein Siegel wartet; sonst eine ruhige Hinweiszeile.
export function storyKarte() {
  const { START_IDS, T, andeutungGesehen, jetzt, stand, story } = kx;
  const st = story();
  const siegel = I.storyZustaende(st).find(z => z.zustand === 'siegel');
  // Kampfbühne (31.10.2026): die Geschichte gehört zur Rückmeldung (Ruhezustand der Bühne). Eigene Karte nur noch,
  // wenn VOR dem Check ein Siegel wartet (z. B. von gestern), damit es nicht bis nach dem Check versteckt bleibt.
  if (START_IDS.includes('buehne') && (!siegel || K.auswertung(stand, jetzt()).heuteAntwort)) return '';
  if (siegel) {
    const teil = st.teile[siegel.nr - 1] || {};
    andeutungGesehen('story_siegel');
    return `<button class="karte story-karte story-neu tippbar" data-a="story-oeffnen" aria-label="${esc(T('story.siegel'))}: ${esc(st.titel)}">
    <span class="siegel-mark" aria-hidden="true">${icon('siegel')}</span>
    <span class="spalte"><span class="eyebrow akzent">${esc(T('story.eyebrow', { nr: st.wocheNr }))} · <span class="neu">${esc(T('story.neuerTeil'))}</span></span>
    <span class="nm gross-nm">${esc(T('story.siegel'))}</span><span class="story-andeutung">${esc(teil.vorschau || T('story.siegelOhne'))}</span></span>${icon('pfeilRechts')}</button>`;
  }
  const morgen = storyMorgen();
  if (morgen) andeutungGesehen('story');
  const sub = st.frei === 0 && !morgen ? T('story.hinweisLeer')
    : morgen ? (morgen.neueGeschichte ? T('story.morgenNeu', { titel: morgen.titelWoche }) : T('story.morgenTeil', { nr: morgen.nr, titel: morgen.vorschau || morgen.titel }))
    : st.frei >= st.teile.length ? T('story.fertig') : T('story.hinweisGelesen');
  // Version 55: als Karte im Stil der eingeklappten Quest (vorher eine kleine Zeile, schwer lesbar)
  return `<button class="karte story-ruhig tippbar" data-a="story-oeffnen" aria-label="${esc(T('story.aria', { titel: st.titel }))}">${icon('buch')}<span class="spalte"><span class="eyebrow akzent">${esc(T('story.eyebrow', { nr: st.wocheNr }))}</span><span class="nm">${esc(st.titel)}</span><span class="klein">${esc(sub)}</span></span><span class="klapp-mehr">${esc(T('story.lesen'))}</span></button>`;
}
export function extraKarten() {
  const { T, jetzt } = kx;
  const teile = [];
  const tag = K.tagKey(jetzt());
  const spaeter = merkmal('feedback_spaeter');
  const tageSeit = d => (d ? Math.round((K.ausTagKey(tag) - K.ausTagKey(d)) / 864e5) : Infinity);
  if (!hatFeedback() && aktiveTage() >= FEEDBACK.abAktivenTagen && tageSeit(spaeter) >= FEEDBACK.erneutNachTagen) {
    teile.push(`<div class="karte spalte"><span class="eyebrow akzent">${esc(T('fbKarte.eyebrow'))}</span><span class="nm">${esc(T('fbKarte.titel'))}</span><p class="klein">${esc(T('fbKarte.text'))}</p><div class="zwei"><button class="btn voll" data-a="feedback-oeffnen">${esc(T('fbKarte.ja'))}</button><button class="btn" data-a="feedback-spaeter">${esc(T('fbKarte.spaeter'))}</button></div></div>`);
  }
  return teile.join('');
}
export const START_SCREENS = {
  start() {
    const { NEU_QUELLEN, START_IDS, T, VERSION, aktuelleVorlage, istTest, jetzt, setzeStartGlanz, stand, weltenFrei } = kx;
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
    // 31.10.2026: Verweise auf ersetzte Abschnitte (heldentat, duell, botschaft) zeigen auf die Kampfbühne
    const ziel = id => abschnittZiel(id, START_ABSCHNITTE, START_IDS);
    setzeStartGlanz(neu.glanz.map(x => ({ ...x, abschnitt: ziel(x.abschnitt) })));
    const vor = neu.vor ? { abschnitt: ziel(neu.vor.abschnitt), nach: ziel(neu.vor.nach) } : null;
    const reihe0 = vor && vor.abschnitt !== vor.nach ? vorziehen(START_IDS, [{ id: vor.abschnitt, vorziehen: { nach: vor.nach } }], { [vor.abschnitt]: true }) : { ids: START_IDS };
    // 31.10.2026: Merkmal „wann“ (vor / nach dem Check) aus daten/startseite.js
    // Etappe 3, Teil C: brennt das Lagerfeuer, fallen Abschnitte mit wann 'vorFeuer' weg (Bonus, Messziele)
    let feuer = false;
    try { feuer = lagerfeuerSichtbar(a); } catch (e) { console.warn('Lagerfeuer:', e.message); }
    // Tagesnotiz (04.11.2026): nach dem Check oder bei brennendem Feuer direkt unter die Bühne (vorziehen in den Daten)
    const tagFertig = !!a.heuteAntwort || feuer;
    const zug = vorziehen(reihe0.ids, START_ABSCHNITTE.filter(z => z && z.vorziehen), { tagesnotiz: tagFertig });
    zug.fehler.forEach(m => console.warn(m));
    const reihe = { ids: zug.ids };
    const teile = nachWann(reihe.ids, START_ABSCHNITTE, !!a.heuteAntwort, feuer).map(id => {
      try { return markiere(mitKlappe(id, START_TEILE[id](ctx), ctx, k), id); }
      catch (e) {
        console.warn(`Startseite: Abschnitt ${id}:`, e.message);
        // Version 55: im Testprofil sichtbar machen (sonst fällt ein fehlender Abschnitt nicht auf, siehe Version 54)
        return istTest ? `<div class="hinweis test-fehler" role="alert"><span>Testprofil: Abschnitt „${esc(id)}“ konnte nicht angezeigt werden (${esc(e.message)}).</span></div>` : '';
      }
    }).join('');
    return `<section class="screen start">
      ${kopfZeile(datum)}
      <div class="inhalt start-inhalt">${teile}</div>
      <div class="start-fuss">${weltenFrei() ? `<button class="link" data-a="stilwahl">${icon('stern')} ${esc(T('start.weltenFrei'))}</button>` : esc(T('start.bereicheSpaeter'))}<span class="version">${esc(T('start.version', { nr: VERSION.nr, datum: VERSION.datum }))}</span></div>
    </section>`;
  }
};
// Abschnitte der Startseite (Version 43). Reihenfolge und Ein/Aus: daten/startseite.js.
export const START_TEILE = {
  hinweise: () => { const { T, ui } = kx; return `${hinweisBox()}${ui.fbDanke ? `<div class="hinweis gut-rand" role="status"><span>${esc(T('fb.danke'))}</span><button class="link" data-a="danke-weg">${esc(T('rahmen.hinweisOk'))}</button></div>` : ''}`; },
  tagesleiste: () => tagesleisteHtml(), // Etappe 3, Teil B
  kopfleiste: ctx => kopfleisteHtml(ctx),
  neuigkeiten: () => neuigkeitenHtml(),
  morgenkarte: () => morgenkarteHtml(heldenKopfDaten().ansichten), // Version 173: Erinnerung beim ersten Öffnen am Tag
  // Kampfbühne (31.10.2026); pausiert der Held heute (Erhalt, Ruhe), steht dort seine Rastkarte (Heldenmodi, 04.11.2026)
  buehne: ctx => (pausiertHeute(kx.spiel.fokus) ? rastHtml(ctx) : buehneHtml(ctx)),
  botschaft: () => crewKarte(),
  // Version 44: Heutige Heldentat (ersetzt „Nächste Aufgabe“ und die Fähigkeits-Karte). Check-Logik unverändert (check()).
  // Version 44/45: Heutige Heldentat. Check-Logik unverändert (check()). Wochenstand zeigt seit 45 die Duell-Karte.
  heldentat: ({ v, f, a }) => {
    const { SM, T, img, jetzt, nameVon, spiel, stil, ui } = kx;
    const antw = a.heuteAntwort;
    const frage = tagesfrage(v, f, T(artSchluessel('frage', 'tat.frage'), { faehigkeit: f.name }));
    // Version 61 (Variante A „Auftragskarte“, Entscheidung 29.10.2026): Rahmen je Welt (CSS je data-stil),
    // Medaille mit Fähigkeits-Symbol, kleines Heldenporträt, Wenn-dann in zwei Feldern, „Ja“ groß, „nicht gebraucht“ schlichter.
    const wd = wennDann(f);
    const marke = (stil().wort && stil().wort.marke) || ''; // nur je Stil, kein Rückfall auf Fantasy
    const nt = nachtragModus();
    return `<div class="karte heldentat${antw && !nt ? ' fertig' : ''}${nt ? ' nachtrag' : ''}">
      ${String(marke).trim() ? `<span class="tat-marke" aria-hidden="true">${esc(marke)}</span>` : ''}
      <div class="tat-kopf"><span class="tat-medaille" aria-hidden="true">${icon(f.icon || 'stern')}</span>
        <span class="spalte"><span class="eyebrow tat-eyebrow">${esc(nt ? T('nachtrag.eyebrow', { tag: nachtragName(nt).toUpperCase() }) : T('tat.eyebrow'))}</span>
        <button class="tat-name tippbar" data-a="blatt" data-id="faehigkeit" aria-label="${esc(T('tat.ansehen', { faehigkeit: f.name }))}">${esc(f.name)}</button></span>
        ${img(v.held, nameVon(v.held), 'held', 'tat-held', '')}</div>
      ${wd.wenn || wd.dann ? `<div class="tat-wd">${wd.wenn ? `<p class="tat-feld wenn"><b>${esc(T('tat.wenn'))}</b>${esc(wd.wenn)}</p>` : ''}${wd.wenn && wd.dann ? '<span class="tat-pfeil" aria-hidden="true">↓</span>' : ''}${wd.dann ? `<p class="tat-feld dann"><b>${esc(T('tat.dannLabel'))}</b>${esc(wd.dann)}</p>` : ''}</div>` : ''}
      ${nt ? nachtragHtml(nt, f) : antw ? `${erfolgHtml(antw)}<div class="erledigt${ui.einmal.has('check') ? ' neu' : ''}" role="status">${erfolgGroesse(antw, ui.erfolgFrisch, spiel.fokus, K.tagKey(jetzt()), SM.erfolg.an) === 'klein' ? img(v.held, nameVon(v.held), 'held', 'erfolg-mini', '') : erledigtIcon(antw)}<span>${esc(erledigtText(antw, f))}</span><button class="link" data-a="check" data-id="">${esc(T('tat.aendern'))}</button></div>${stuetzenHakenHtml()}${stuetzeBereitHtml(a)}${eintragLinks(antw, { nachtrag: true })}${comebackHtml()}${bossReaktionHtml(v, a)}${nachtragZusatz()}${weiterZuHtml()}`
        : `<p class="tat-frage">${esc(frage)}</p>
      <div class="tat-knoepfe"><button class="btn voll tat-ja" data-a="check" data-id="ja">${icon('check')} ${esc(T('tat.ja'))}</button><button class="btn tat-nein" data-a="check" data-id="nein">${esc(T('tat.nein'))}</button><button class="btn tat-schwer" data-a="check" data-id="schwer">${esc(T('siegel.schwer'))}</button></div>
      ${eintragLinks(null)}${nachtragZeile()}`}
    </div>`;
  },
  // Version 45: eine Duell-Karte statt Verbündeter + Gegner. Tipp öffnet die Gegnerseite.
  duell: ({ v, g, a }) => {
    const { T, img, nameVon, ui, wort } = kx;
    const held = nameVon(v.held);
    // Version 68: Siegtag mit neuem Gegner → der Besiegte ausgegraut mit leerem Balken; der Neue kommt beim nächsten Besuch.
    // Nicht antippbar, weil das Gegnerblatt schon den Neuen zeigen würde.
    const bid = besiegtHeuteVorNeuem(a);
    if (bid) {
      const gb = TABELLE.gegner[bid];
      const anzahl = K.siegRundenZiel(kx.stand, a.heute) ?? a.anzahl; // Ziel der gewonnenen Runde (02.11.2026)
      return `<div class="karte duell besiegt" role="group" aria-label="${esc(T('duell.besiegtAria', { gegner: gb.name, sieg: wort('sieg') }))}">
      <span class="duell-bildrahmen">${img('boss-' + bid, gb.name, 'boss', 'duell-bild', '')}
        <span class="duell-titel">${esc(held)} <span class="duell-vs">${esc(T('duell.vs'))}</span> ${esc(gb.kurz)}</span></span>
      <span class="duell-text">
        <span class="duell-zeile"><span>${esc(T('duell.kraft', { gegner: gb.kurz }))}</span><span>0 / ${anzahl}</span></span>
        <span class="segmente" aria-hidden="true">${Array.from({ length: anzahl }, () => '<i></i>').join('')}</span>
        <span class="klein">${esc(T('duell.besiegtMorgen', { sieg: wort('sieg') }))}</span>
        ${ui.feier ? '' : vorstellungHinweisHtml()}
      </span>
    </div>`;
    }
    const kraft = a.anzahl - a.treffer;
    const unter = a.gegnerAnzahl > 1 ? T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }) : a.siege ? T('gegner.siege', { n: a.siege, sieg: wort('sieg') }) : T('gegner.unbesiegt');
    return `<button class="karte duell tippbar ${ui.wackeln ? 'wackelt' : ''} ${a.bossKraft === 0 && !a.bedingungenOffen ? 'besiegt' : ''}" data-a="blatt" data-id="boss" aria-label="${esc(T('duell.ansehen', { gegner: g.name }))}">
      <span class="duell-bildrahmen"${bwStil('tagesCheck', 'duellBild', ui.einmal.has('treffer'))}>${img('boss-' + v.gegner, g.name, 'boss', 'duell-bild', '')}${arenaHtml()}${blitzEbene('tagesCheck', 'duellBlitz', ui.einmal.has('treffer'))}
        <span class="duell-titel">${esc(held)} <span class="duell-vs">${esc(T('duell.vs'))}</span> ${esc(g.kurz)}</span></span>
      <span class="duell-text">
        <span class="duell-zeile"><span>${esc(T('duell.kraft', { gegner: g.kurz }))}</span><span>${kraft} / ${a.anzahl}</span></span>
        <span class="segmente" role="img" aria-label="${esc(T('gegner.kraftAria', { kraft, anzahl: a.anzahl }))}">${Array.from({ length: a.anzahl }, (_, i) => `<i class="${i < kraft ? 'voll' : ui.einmal.has('treffer') && i === kraft ? 'bricht' : ''}"></i>`).join('')}</span>
        <span class="klein">${esc(T('tat.woche', { n: a.wocheZaehler, anzahl: a.anzahl }))}${a.wocheZaehler > a.anzahl ? ` · ${esc(T('duell.extra'))}` : ''} · ${esc(unter)}${a.rundeTag < 0 ? ` · ${esc(T('gegner.abMorgen'))}` : ''}</span>
      </span>
    </button>`;
  },
  messziele: () => messzielKarte(), // Version 76
  bonus: () => mikroKarte(),
  story: () => storyKarte(),
  tagesnotiz: () => notizKarteHtml(), // Tagesnotiz (04.11.2026): abends „Wie war dein Tag?“
  wochenrunde: () => wochenKarteHtml(), // Wochenrunde (05.11.2026): am Rundentag „Wie war deine Woche?“
  extra: () => extraKarten()
};
// Kurzzeilen eingeklappter Abschnitte (Version 52). Neue klappbare Karte = Eintrag hier + `klappbar: true` in den Daten.
export const START_KURZ = {
  messziele: () => messzielKurz(),
  bonus: () => bonusKurz() // 31.10.2026: eingeklappt als Standard
};
function bonusKurz() {
  const { T, mikroListe } = kx;
  const liste = mikroListe();
  return `<span class="nm">${esc(T('bonus.kurzTitel'))}</span><span class="klein">${esc(T('bonus.kurz', { fertig: liste.filter(m => m.erledigt).length, anzahl: liste.length }))}</span>`;
}
export const klapp = () => klappZustand(START_ABSCHNITTE, Object.keys(START_KURZ), merkmal('start_klein'));
// Abschnitt mit Klapp-Knopf: klein → Kurzzeile (tippbar zum Aufklappen), offen → normale Karte + „Kleiner“.
export function mitKlappe(id, html, ctx, k) {
  const { T } = kx;
  if (!k.klappbar.includes(id) || !html || !String(html).trim()) return html;
  if (k.klein.includes(id)) return `<button class="karte klapp-zeile tippbar" data-a="klapp-auf" data-id="${esc(id)}" aria-expanded="false"><span class="spalte">${START_KURZ[id](ctx)}</span><span class="klapp-mehr">${esc(T('klapp.mehr'))}</span></button>`;
  return `<div class="klapp-rahmen">${html}<button class="klein-knopf" data-a="klapp-zu" data-id="${esc(id)}" aria-expanded="true">${esc(T('klapp.kleiner'))}</button></div>`;
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
function klappen({ id, aktion }) {
  const { render } = kx;
  const zu = aktion === 'klapp-zu';
  if (klapp().klappbar.includes(id)) {
    merke('start_klein', klappUmschalten(merkmal('start_klein'), id, zu, klappStandardKlein(START_ABSCHNITTE).includes(id)));
    trackEvent(zu ? 'section_collapsed' : 'section_expanded', { abschnitt: id });
  }
  render();
}
// Eigene Einträge (Version 75): leise Links unter der Heldentat. Vor dem Check nur „schwer“; nach „Ja“ eingeklappt
// „festhalten“ und „schwer“; nach „nicht gebraucht“ ein sanftes Angebot, falls es doch einen schwierigen Moment gab.
// Version 93: Schnellleiste statt Linkliste (Kacheln aus ansicht/helfer.js). Reihenfolge: Notfallkarte, sobald frei;
// festhalten / schwerer Tag; Ruhetag; mit nachtrag zuletzt „Nachtragen“ (die Tageswahl erscheint darunter, nachtragZusatz).
export function eintragLinks(antw, { nachtrag = false } = {}) {
  const k = { alsKachel: true };
  // Bosskette mit Bedingungen (06.11.2026): wartet der Gegner auf eine Gestalt, Fähigkeit oder Schwierigkeit, sagt die Kachel,
  // wofür das Festhalten zählt (sonst geht der Gegner nie, ohne dass man weiß, warum)
  const offen = antw === 'ja' ? bedingungenJetzt().offen.size > 0 : false;
  const g = offen ? gegnerJetzt() : null;
  const teile = antw === 'ja' ? [g ? eintragLink('geschafft', 'bed.festhalten', { ...k, werte: { gegner: g.kurz } }) : eintragLink('geschafft', 'eintrag.link.geschafft', k), eintragLink('schwer', 'eintrag.link.schwer', k)]
    : antw === 'nein' ? [eintragLink('schwer', 'eintrag.link.schwerNein', k)]
    : antw === 'schwer' ? [eintragLink('schwer', 'eintrag.link.schwerFesthalten', k)] // Version 141: Eintrag nachholen
    : [eintragLink('schwer', 'eintrag.link.schwer', k)];
  return kachelLeiste([notfallKnopf('', k), ...teile, ruhetagLink(k), nachtrag ? nachtragKachel() : '']);
}

export const START_KLICKS = {
  'neu-ok'() { const { alsGesehen, neuBereiche, render } = kx; const ids = neuBereiche(); alsGesehen(ids); trackEvent('unlock_later', { anzahl: ids.length }); render(); },
  'klapp-zu': klappen,
  'weiter-spaeter'() { const { render, spiel, ui } = kx; ui.weiterSpaeter = spiel.fokus; render(); }, // Etappe 3, Teil B: nur diese Sitzung
  'kl-warum'() { const { render, ui } = kx; ui.klWarumAuf = !ui.klWarumAuf; render(); }, // Etappe 3, Teil A
  'klapp-auf': klappen,
  // Weg als Streifen (Version 135): auf/zu je Gerät; beim Öffnen den aktuellen Gegner in den Blick holen
  'weg-klapp'() {
    const { finde, render } = kx;
    const auf = !wegOffen();
    merke('weg_offen', auf);
    trackEvent(auf ? 'section_expanded' : 'section_collapsed', { abschnitt: 'weg' });
    render();
    if (auf) { try { finde('.ws-kachel.aktuell')?.scrollIntoView?.({ inline: 'center', block: 'nearest' }); } catch (e) { /* nur Komfort */ } }
  },
  'feedback-spaeter'() { const { jetzt, render } = kx; merke('feedback_spaeter', K.tagKey(jetzt())); render(); },
  'botschaft-zu'({ el } = {}) {
    const { jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    // Version 142: Die Crew-Blase in der Arena zeigt höchstens 3 Zeilen. Ist sie gekürzt, zeigt der erste Tipp den
    // ganzen Text (ohne neu zu zeichnen), erst der nächste blendet sie aus. Ohne echtes DOM: wie bisher ausblenden.
    if (blaseAufklappen(el)) return;
    ui.botschaftOffen = false;
    try { setzeSpiel(H.botschaftGelesen(spiel, spiel.fokus, K.tagKey(jetzt()))); speichere(); } catch (e) { console.warn('Botschaft:', e.message); }
    render();
  },
  'botschaft-auf'() { const { render, ui } = kx; ui.botschaftOffen = true; trackEvent('crew_message_reopened', {}); render(); },
  mikro({ id }) { const { mikro } = kx; mikro(id); },
  fokus({ id }) {
    const { T, finde, pruefeBesuchsMomente, render, setzeHinweis, setzeSpiel, speichere, spiel, ui } = kx;
    const ausWahl = ui.heldenWahl;
    ui.heldenWahl = false; ui.botschaftOffen = false;
    if (id !== spiel.fokus) {
      const von = spiel.fokus;
      try {
        setzeSpiel(H.fokusSetzen(spiel, id)); speichere(); trackEvent('hero_focus', { held: id, quelle: ausWahl ? 'wahl' : 'karte' });
        ui.wechselVon = von; ui.einmal.add('wechsel'); ui.erfolgFrisch = null; // Version 49: Banner beim nächsten Zeichnen
      } catch (err) { setzeHinweis(T('kopf.heldFehlt')); console.warn('Fokus:', err.message); }
    }
    render(); finde('.screen')?.scrollTo?.(0, 0);
    pruefeBesuchsMomente(); // Version 68: Kapitelwechsel dieses Helden, falls fällig
  },
  schnell({ id }) {
    const { T, check, render, setzeHinweis, setzeSpiel, spiel, ui } = kx;
    ui.heldenWahl = false;
    try { setzeSpiel(H.fokusSetzen(spiel, id)); }
    catch (err) { setzeHinweis(T('kopf.heldFehlt')); console.warn('Schnell-Check:', err.message); render(); return; }
    trackEvent('hero_focus', { held: id, quelle: 'schnell' }); check('ja');
  },
  'helden-wahl'() { const { render, ui } = kx; ui.heldenWahl = !ui.heldenWahl; if (ui.heldenWahl) trackEvent('hero_switcher_opened', {}); render(); },
  'helden-wahl-zu'() { const { render, ui } = kx; ui.heldenWahl = false; render(); },
  'bonus-mehr'() { const { render, ui } = kx; ui.bonusMehr = !ui.bonusMehr; if (ui.bonusMehr) ui.einmal.add('bonus'); render(); },
  'angebot-spaeter'() { const { render, setzeSpiel, speichere, spiel } = kx; setzeSpiel(H.angebotAblehnen(spiel)); speichere(); trackEvent('new_adventure_declined', {}); render(); },
  'erfolg-klein'() { const { render, ui } = kx; ui.erfolgFrisch = null; trackEvent('erfolg_eingeklappt', {}); render(); },
  // Version 48: Öffnen der Seite liest nichts; erst „Siegel brechen“ (story.js) zählt den Teil als gelesen
  'story-oeffnen'() { const { geheZu, ui } = kx; trackEvent('story_opened', { quelle: 'karte' }); ui.storyOffen = null; geheZu('story'); },
  'danke-weg'() { const { render, ui } = kx; ui.fbDanke = false; render(); }
};
