// Startseite (aus app.js ausgelagert, 30.10.2026): Abschnitte als Funktionen (START_TEILE), Reihenfolge und Ein/Aus in
// daten/startseite.js, Neuigkeiten und Glanz in daten/neuigkeiten.js. Ein kaputter Abschnitt bricht nie die ganze Seite
// (SCREENS.start fängt ihn ab, im Testprofil als roter Hinweis). Heldenkopf, Heldenwahl, Karten für Quest, Heldentat,
// Duell, Bonus, Story, Welten, Angebot, Feedback und Premium.
import { aktiveTage, hatFeedback, merke, merkmal, trackEvent } from '../analytics.js';
import { FEEDBACK, PREMIUM } from '../daten/forschung.js';
import { TABS } from '../daten/freischaltung.js';
import { BOSS_REAKTION_EINSTELLUNG, BOSS_REAKTIONEN } from '../daten/boss-reaktionen.js';
import { BOTSCHAFTEN, STORIES } from '../daten/inhalte.js';
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import { NEUIGKEITEN } from '../daten/neuigkeiten.js';
import { BONUS, HELDENKOPF, START_ABSCHNITTE, WEG_FENSTER } from '../daten/startseite.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as BR from '../logik/boss-reaktion.js';
import * as EW from '../logik/einwilligung.js';
import * as H from '../logik/helden.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { bonusAnsicht, erfolgGroesse, heldenKopf, klappUmschalten, klappZustand, naechsterOffener, neuAufStart, tagesfrage, vorziehen, wechselBanner, wennDann } from '../logik/startseite.js';
import * as W from '../logik/weg.js';
import { entw } from './blatt.js';
import { einwKarte } from './einstellungen.js';
import { blitzEbene, bwStil, esc, icon, kurzDatum, markiere, prozent } from './helfer.js';
import { kx } from './kontext.js';
import { einstellungenKnopf, hinweisBox } from './rahmen.js';

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
export function besiegtHeuteVorNeuem(a) {
  const { stand } = kx;
  if (!(a && a.siegHeute === true && a.neuerGegner === true && a.rundeTag < 0)) return null;
  const id = ((stand.siege || []).filter(x => x && x.tag === a.heute).pop() || {}).gegner;
  return typeof id === 'string' && TABELLE.gegner[id] ? id : null;
}
// Boss-Reaktion (Version 68): Mini-Bossbild + eine Zeile direkt in der Heldentat-Karte, unter „Erledigt“ – dort, wo der
// Blick nach dem Tippen ist (in der Duell-Karte lag sie unter dem Erfolgsbild außer Sicht). Die Duell-Karte zeigt
// weiter das brechende Segment. Abgeleitet aus dem Stand (Texte: daten/boss-reaktionen.js); Fehler lassen nur die
// Zeile weg, nie die Karte.
export function bossReaktionHtml(v, a) {
  const { img, jetzt, nameVon, stand, stilWerte, ui } = kx;
  const gid = a.gegner || v.gegner;
  const art = BR.reaktionsArt({ antwort: a.heuteAntwort, kraft: a.anzahl - a.treffer, anzahl: a.anzahl, rundeTag: a.rundeTag, siegHeute: a.siegHeute, neuerGegner: a.neuerGegner }, BOSS_REAKTION_EINSTELLUNG.phaseAb);
  if (!art) return '';
  // „morgen“: Text nach dem besiegten Gegner, Bild = der Neue als Silhouette (Name bleibt verborgen)
  const textId = art === 'morgen' ? besiegtHeuteVorNeuem(a) || '_allgemein' : gid;
  const r = BR.waehleReaktion(BOSS_REAKTIONEN, textId, art, `${a.heute}|${textId}|${art}`);
  if (!r) return '';
  let text = '';
  try { text = I.fuelle(r.text, I.werteFuer(stand, jetzt(), v, TABELLE, nameVon, stilWerte())); }
  catch (e) { console.warn('Boss-Reaktion:', e.message); return ''; }
  const g = TABELLE.gegner[gid];
  const treffer = ui.einmal.has('treffer'); // Bewegung nur direkt nach dem eigenen Treffer (Ablauf „tagesCheck“)
  const bild = r.art === 'morgen'
    ? '<span class="boss-reaktion-siegel" aria-hidden="true">?</span>' // Silhouette im runden Ausschnitt wäre nur eine dunkle Scheibe
    : `<span class="boss-reaktion-rahmen"${bwStil('tagesCheck', 'reaktionBild', treffer)}>${img('boss-' + gid, g ? g.name : '', 'boss', 'boss-reaktion-bild', '', 'rund')}${blitzEbene('tagesCheck', 'reaktionBlitz', treffer)}</span>`;
  return `<div class="boss-reaktion art-${r.art}" role="status"${bwStil('tagesCheck', 'reaktion', ui.einmal.has('check'))}>${bild}<p>${esc(text)}</p></div>`;
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
// Knopf „Karte öffnen“ unter dem Weg (30.10.2026): nur wenn der Tab Karte nutzbar ist; nutzt die Tab-Aktion.
function karteKnopfHtml() {
  const { T, tabAktiv, tabLabel, tabSichtbar } = kx;
  const t = TABS.find(x => x.screen === 'karte');
  try { if (!t || !tabSichtbar(t) || !tabAktiv(t)) return ''; } catch (e) { console.warn('Weg (Karte):', e.message); return ''; }
  return `<button class="link weg-karte" data-a="tab" data-id="karte">${icon('karte')} ${esc(T('karte.oeffnen', { bereich: tabLabel(t) }))}</button>`;
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
    : [T('weg.stand', { treffer: a.treffer, anzahl: a.anzahl }), rest ? T('weg.rest', { rest, gegner: g.kurz }) : '', T('weg.kapitel', { kapitel: wort('kapitel'), nr: w.kapitel })].filter(Boolean).join(' · ');
  return `<div class="weg" role="img" aria-label="${esc(T('weg.aria', { held: nameVon(v.held), text }))}">
      <svg viewBox="0 0 300 92" preserveAspectRatio="none" aria-hidden="true"><path class="weg-rest" d="${linie(pkt)}"/><path class="weg-geschafft" d="${linie(geschafft)}"/></svg>
      ${w.stationen.map(stationHtml).join('')}
      <span class="weg-held-fuss" style="left:${prozent(held.x, 300)};top:${prozent(held.y, 92)}"></span>
      <span class="weg-held" style="left:${prozent(held.x, 300)};top:${prozent(held.y - WEG_HELD_HOEHE, 92)}">${img(v.held, nameVon(v.held), 'held', 'cover', '', 'rund')}</span>
    </div>
    <span class="mini gut-text">${esc(text)}</span>${karteKnopfHtml()}`;
}
// Heldenkopf (Version 43): aktiver Held groß, daneben „Helden wechseln“ mit Mini-Porträts und Zahl offener Checks.
// Ersetzt Crew-Leiste und „Weitere Helden“. Feste Reihenfolge der Crew (kein Umsortieren), Logik in logik/startseite.js.
export const bereichName = domainId => (LEBENSBEREICHE.find(d => d.id === domainId) || {}).name || '';
export function heldenKopfDaten() {
  const { heldenAnsichten, jetzt, spiel } = kx;
  const ansichten = heldenAnsichten().map(h => ({ ...h, x: K.auswertung(h.a, jetzt()) }));
  const k = heldenKopf(ansichten.map(h => ({ id: h.id, erledigt: !!h.x.heuteAntwort })), spiel.fokus, HELDENKOPF.stapelMax);
  return { k, ansichten };
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
export function heldenkopfHtml() {
  const { T, img, nameVon, ui, wort } = kx;
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
    </div>`; // XP-Rückmeldung zeichnet seit 30.10.2026 renderJetzt() über dem sichtbaren Ausschnitt
}
// „Weiter zu …“ (Version 45): nach dem Check des aktiven Helden der nächste mit offenem Check (feste Reihenfolge).
export function weiterZuHtml() {
  const { T, img, nameVon, spiel, ui } = kx;
  if (spiel.helden.length < 2) return '';
  const { k, ansichten } = heldenKopfDaten();
  const id = naechsterOffener(ansichten.map(h => ({ id: h.id, erledigt: !!h.x.heuteAntwort })), k.aktiv);
  if (!id) return `<p class="tat-alle${ui.einmal.has('check') ? ' neu' : ''}" role="status">${esc(T('tat.alleErledigt'))}</p>`;
  const name = nameVon(id);
  return `<button class="weiter-zu${ui.einmal.has('check') ? ' neu' : ''}" data-a="fokus" data-id="${esc(id)}">${img(id, name, 'held', 'weiter-bild', '')}<span class="spalte"><span class="klein">${esc(T('tat.naechster'))}</span><span class="nm">${esc(T('tat.weiter', { held: name }))}</span></span>${icon('pfeilRechts')}</button>`;
}
// Bildschirme mit Heldenkopf und Wechsel (Karte seit 30.10.2026: eine Karte je Held)
const HELDENWAHL_SCREENS = ['start', 'karte'];
// Popup „Helden wechseln“ als Blatt von unten (gleiches Muster wie die Detailblätter, Daumen-Reichweite am Handy).
export function heldenWahlHtml() {
  const { T, img, nameVon, ui, wort } = kx;
  if (!ui.heldenWahl || !HELDENWAHL_SCREENS.includes(ui.screen)) return '';
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
    <button class="hintergrund" data-a="helden-wahl-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint"><div class="blatt-inhalt"><h2 id="wahl-t">${esc(T('kopf.wahlTitel', { crew: wort('crew') }))}</h2>${zeilen}<button class="cta" data-a="helden-wahl-zu">${esc(T('nav.schliessen'))}</button></div></div>
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
export function crewKarte() {
  const { START_IDS, T, aktuelleVorlage, img, jetzt, nameVon, spiel, stand, stilWerte, ui } = kx;
  const v = aktuelleVorlage();
  // Version 68: am Siegtag mit neuem Gegner spricht die Crew über den Besiegten (der Neue bleibt bis zum Kapitelwechsel verborgen)
  const bid = besiegtHeuteVorNeuem(K.auswertung(stand, jetzt()));
  const b = bid ? I.botschaft(stand, jetzt(), { ...v, gegner: bid }, TABELLE, BOTSCHAFTEN, nameVon, stilWerte(), 'besiegt')
    : I.botschaft(stand, jetzt(), v, TABELLE, BOTSCHAFTEN, nameVon, stilWerte());
  // Am ersten Tag nicht zeigen: das Onboarding hat Verbündeten und Gegner gerade erst vorgestellt.
  if (!b.text || b.anlass === 'erster_tag') return '';
  const tag = K.tagKey(jetzt());
  const gelesen = H.istGelesen(spiel, spiel.fokus, tag);
  const klein = !ui.botschaftOffen && (gelesen || K.auswertung(stand, jetzt()).heuteAntwort);
  // Version 57: ungelesen → hervorgehoben (größeres Porträt, Akzentrahmen, „neu“); gelesen → ruhig wie bisher. Wippen: daten/neuigkeiten.js
  if (klein && gelesen) return `<button class="botschaft-klein" data-a="botschaft-auf">${img(v.held, nameVon(v.held), 'held', 'rund-klein')}<span>${esc(T('botschaft.klein', { held: nameVon(v.held) }))}</span></button>`;
  if (klein) return `<button class="botschaft-klein botschaft-neu" data-a="botschaft-auf">${img(v.held, nameVon(v.held), 'held', 'rund-klein')}<span>${esc(T('botschaft.ungelesen', { held: nameVon(v.held) }))}</span><span class="neu">${esc(T('botschaft.neu'))}</span></button>`;
  if (merkmal('crew_msg_tag') !== tag) { merke('crew_msg_tag', tag); trackEvent('crew_message_seen', { anlass: b.anlass }); }
  // Version 68: Porträt weglassen, wenn der Heldenkopf (gleicher Held, gleiches Bild) direkt darüber steht – Name genügt
  const mitBild = !START_IDS.includes('heldenkopf');
  return `<div class="botschaft">${mitBild ? img(v.held, nameVon(v.held), 'held', 'rund gut-rand-b') : ''}<p class="blase${mitBild ? '' : ' ohne-bild'}"><b>${esc(nameVon(v.held))}</b>${esc(b.text)}<button class="link botschaft-ok" data-a="botschaft-zu">${esc(T('botschaft.ok'))}</button></p></div>`;
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
    <div class="zeile"><span class="eyebrow">${esc(T('bonus.titel'))}</span><span class="mini rechts-oben">${fertig} von ${liste.length} · je +${K.XP.mikro} XP</span></div>
    ${b.sichtbar.map((m, i) => `<button class="mikro-zeile ${m.erledigt ? 'fertig' : ''}${ui.einmal.has('bonus') && i >= BONUS.sichtbar ? ' neu' : ''}" style="--i:${Math.max(0, i - BONUS.sichtbar)}" data-a="mikro" data-id="${esc(m.held + '|' + m.id)}" aria-pressed="${m.erledigt}"><span class="haken-kreis">${m.erledigt ? icon('check') : ''}</span><span class="mikro-text">${esc(m.text)}</span>${spiel.helden.length > 1 ? img(m.held, nameVon(m.held), 'held', 'mikro-held', nameVon(m.held)) : ''}</button>`).join('')}
    ${umschalten}
  </div>`;
}
// Story-Karte (Version 48, „Story nur, wenn neu“): groß nur, wenn ein Siegel wartet; sonst eine ruhige Hinweiszeile.
export function storyKarte() {
  const { T, andeutungGesehen, story } = kx;
  const st = story();
  const siegel = I.storyZustaende(st).find(z => z.zustand === 'siegel');
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
// Premium-Angebot (Version 63): eigener Abschnitt, Einklappen über den allgemeinen Klapp-Weg (START_KURZ.premium).
// 'premium_viewed' zählt auch, wenn die Karte eingeklappt ist (das Angebot ist dann als Zeile sichtbar).
export function premiumKarte() {
  const { ui } = kx;
  if (aktiveTage() < PREMIUM.ab) return '';
  if (!ui.premiumGesehen) { ui.premiumGesehen = true; trackEvent('premium_viewed', {}); }
  return `<button class="karte premium tippbar" data-a="premium"><span class="stern-klein" aria-hidden="true">${icon('stern')}</span><span class="spalte"><span class="nm">${esc(PREMIUM.titel)}</span><span class="klein">${PREMIUM.punkte.map(esc).join(' · ')}</span><span class="preis">${esc(PREMIUM.preis)}</span></span></button>`;
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
    setzeStartGlanz(neu.glanz);
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
      <div class="start-fuss">${weltenFrei() ? `<button class="link" data-a="stilwahl">${icon('stern')} ${esc(T('start.weltenFrei'))}</button>` : esc(T('start.bereicheSpaeter'))}<span class="version">${esc(T('start.version', { nr: VERSION.nr, datum: VERSION.datum }))}</span></div>
    </section>`;
  }
};
// Abschnitte der Startseite (Version 43). Reihenfolge und Ein/Aus: daten/startseite.js.
export const START_TEILE = {
  hinweise: () => { const { T, einw, ui } = kx; return `${neuKarte()}${hinweisBox()}${EW.istOffen(einw) ? einwKarte(false) : ''}${ui.fbDanke ? `<div class="hinweis gut-rand" role="status"><span>${esc(T('fb.danke'))}</span><button class="link" data-a="danke-weg">${esc(T('rahmen.hinweisOk'))}</button></div>` : ''}`; },
  heldenkopf: () => heldenkopfHtml(),
  angebot: () => angebotKarte(),
  botschaft: () => crewKarte(),
  quest: ({ v, g, a }) => { const { T, funktionFrei, stand, wort } = kx; return `<div class="karte haupt">
      <span class="eyebrow akzent">${esc(T('quest.meine', { QUEST: wort('quest').toUpperCase() }))}</span>
      <div class="quest-zeile"><span class="questtitel">${esc(stand.quest.ziel)}</span>${funktionFrei('quests_bearbeiten') ? `<button class="link qe-knopf" data-a="quest-bearbeiten" aria-label="${esc(T('qe.titel', { quest: wort('quest') }))}">${icon('stift')}${esc(T('qe.knopf'))}</button>` : ''}</div>
      ${wegHtml(a, v, g)}
      ${lebenZeile(v)}
    </div>`; },
  // Version 44: Heutige Heldentat (ersetzt „Nächste Aufgabe“ und die Fähigkeits-Karte). Check-Logik unverändert (check()).
  // Version 44/45: Heutige Heldentat. Check-Logik unverändert (check()). Wochenstand zeigt seit 45 die Duell-Karte.
  heldentat: ({ v, f, a }) => {
    const { SM, T, img, jetzt, nameVon, spiel, stil, ui } = kx;
    const antw = a.heuteAntwort;
    const frage = tagesfrage(v, f, T('tat.frage', { faehigkeit: f.name }));
    // Version 61 (Variante A „Auftragskarte“, Entscheidung 29.10.2026): Rahmen je Welt (CSS je data-stil),
    // Medaille mit Fähigkeits-Symbol, kleines Heldenporträt, Wenn-dann in zwei Feldern, „Ja“ groß, „nicht gebraucht“ schlichter.
    const wd = wennDann(f);
    const marke = (stil().wort && stil().wort.marke) || ''; // nur je Stil, kein Rückfall auf Fantasy
    return `<div class="karte heldentat${antw ? ' fertig' : ''}">
      ${String(marke).trim() ? `<span class="tat-marke" aria-hidden="true">${esc(marke)}</span>` : ''}
      <div class="tat-kopf"><span class="tat-medaille" aria-hidden="true">${icon(f.icon || 'stern')}</span>
        <span class="spalte"><span class="eyebrow tat-eyebrow">${esc(T('tat.eyebrow'))}</span>
        <button class="tat-name tippbar" data-a="blatt" data-id="faehigkeit" aria-label="${esc(T('tat.ansehen', { faehigkeit: f.name }))}">${esc(f.name)}</button></span>
        ${img(v.held, nameVon(v.held), 'held', 'tat-held', '')}</div>
      ${wd.wenn || wd.dann ? `<div class="tat-wd">${wd.wenn ? `<p class="tat-feld wenn"><b>${esc(T('tat.wenn'))}</b>${esc(wd.wenn)}</p>` : ''}${wd.wenn && wd.dann ? '<span class="tat-pfeil" aria-hidden="true">↓</span>' : ''}${wd.dann ? `<p class="tat-feld dann"><b>${esc(T('tat.dannLabel'))}</b>${esc(wd.dann)}</p>` : ''}</div>` : ''}
      ${antw ? `${erfolgHtml(antw)}<div class="erledigt${ui.einmal.has('check') ? ' neu' : ''}" role="status">${erfolgGroesse(antw, ui.erfolgFrisch, spiel.fokus, K.tagKey(jetzt()), SM.erfolg.an) === 'klein' ? img(v.held, nameVon(v.held), 'held', 'erfolg-mini', '') : icon('check')}<span>${antw === 'ja' ? esc(T('tat.erledigtJa', { verb: f.verb })) : esc(T('tat.erledigtNein'))}</span><button class="link" data-a="check" data-id="">${esc(T('tat.aendern'))}</button></div>${bossReaktionHtml(v, a)}${weiterZuHtml()}`
        : `<p class="tat-frage">${esc(frage)}</p>
      <div class="tat-knoepfe"><button class="btn voll tat-ja" data-a="check" data-id="ja">${icon('check')} ${esc(T('tat.ja'))}</button><button class="btn tat-nein" data-a="check" data-id="nein">${esc(T('tat.nein'))}</button></div>`}
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
      return `<div class="karte duell besiegt" role="group" aria-label="${esc(T('duell.besiegtAria', { gegner: gb.name, sieg: wort('sieg') }))}">
      <span class="duell-bildrahmen">${img('boss-' + bid, gb.name, 'boss', 'duell-bild', '')}
        <span class="duell-titel">${esc(held)} <span class="duell-vs">${esc(T('duell.vs'))}</span> ${esc(gb.kurz)}</span></span>
      <span class="duell-text">
        <span class="duell-zeile"><span>${esc(T('duell.kraft', { gegner: gb.kurz }))}</span><span>0 / ${a.anzahl}</span></span>
        <span class="segmente" aria-hidden="true">${Array.from({ length: a.anzahl }, () => '<i></i>').join('')}</span>
        <span class="klein">${esc(T('duell.besiegtMorgen', { sieg: wort('sieg') }))}</span>
      </span>
    </div>`;
    }
    const kraft = a.anzahl - a.treffer;
    const unter = a.gegnerAnzahl > 1 ? T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }) : a.siege ? T('gegner.siege', { n: a.siege, sieg: wort('sieg') }) : T('gegner.unbesiegt');
    return `<button class="karte duell tippbar ${ui.wackeln ? 'wackelt' : ''} ${a.bossKraft === 0 ? 'besiegt' : ''}" data-a="blatt" data-id="boss" aria-label="${esc(T('duell.ansehen', { gegner: g.name }))}">
      <span class="duell-bildrahmen"${bwStil('tagesCheck', 'duellBild', ui.einmal.has('treffer'))}>${img('boss-' + v.gegner, g.name, 'boss', 'duell-bild', '')}${blitzEbene('tagesCheck', 'duellBlitz', ui.einmal.has('treffer'))}
        <span class="duell-titel">${esc(held)} <span class="duell-vs">${esc(T('duell.vs'))}</span> ${esc(g.kurz)}</span></span>
      <span class="duell-text">
        <span class="duell-zeile"><span>${esc(T('duell.kraft', { gegner: g.kurz }))}</span><span>${kraft} / ${a.anzahl}</span></span>
        <span class="segmente" role="img" aria-label="${esc(T('gegner.kraftAria', { kraft, anzahl: a.anzahl }))}">${Array.from({ length: a.anzahl }, (_, i) => `<i class="${i < kraft ? 'voll' : ui.einmal.has('treffer') && i === kraft ? 'bricht' : ''}"></i>`).join('')}</span>
        <span class="klein">${esc(T('tat.woche', { n: a.wocheZaehler, anzahl: a.anzahl }))}${a.wocheZaehler > a.anzahl ? ` · ${esc(T('duell.extra'))}` : ''} · ${esc(unter)}${a.rundeTag < 0 ? ` · ${esc(T('gegner.abMorgen'))}` : ''}</span>
      </span>
    </button>`;
  },
  bonus: () => mikroKarte(),
  story: () => storyKarte(),
  welten: () => weltenKarte(),
  extra: () => extraKarten(),
  premium: () => premiumKarte()
};
// Kurzzeilen eingeklappter Abschnitte (Version 52). Neue klappbare Karte = Eintrag hier + `klappbar: true` in den Daten.
export const START_KURZ = {
  premium: () => `<span class="spalte-zeile"><span class="stern-mini" aria-hidden="true">${icon('stern')}</span><span class="nm">${esc(PREMIUM.titel)} · ${esc(PREMIUM.preis)}</span></span>`,
  quest: ({ a }) => { const { T, stand, wort } = kx; return `<span class="eyebrow akzent">${esc(T('quest.meine', { QUEST: wort('quest').toUpperCase() }))}</span><span class="nm">${esc(stand.quest.ziel)}</span><span class="klein">${esc([T('weg.stand', { treffer: a.treffer, anzahl: a.anzahl }), a.gegnerAnzahl > 1 ? T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }) : ''].filter(Boolean).join(' · '))}</span>`; }
};
export const klapp = () => klappZustand(START_ABSCHNITTE, Object.keys(START_KURZ), merkmal('start_klein'));
// Abschnitt mit Klapp-Knopf: klein → Kurzzeile (tippbar zum Aufklappen), offen → normale Karte + „Kleiner“.
export function mitKlappe(id, html, ctx, k) {
  const { T } = kx;
  if (!k.klappbar.includes(id) || !html) return html;
  if (k.klein.includes(id)) return `<button class="karte klapp-zeile tippbar" data-a="klapp-auf" data-id="${esc(id)}" aria-expanded="false"><span class="spalte">${START_KURZ[id](ctx)}</span><span class="klapp-mehr">${esc(T('klapp.mehr'))}</span></button>`;
  return `<div class="klapp-rahmen">${html}<button class="klein-knopf" data-a="klapp-zu" data-id="${esc(id)}" aria-expanded="true">${esc(T('klapp.kleiner'))}</button></div>`;
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
function klappen({ id, aktion }) {
  const { render } = kx;
  const zu = aktion === 'klapp-zu';
  if (klapp().klappbar.includes(id)) {
    merke('start_klein', klappUmschalten(merkmal('start_klein'), id, zu));
    trackEvent(zu ? 'section_collapsed' : 'section_expanded', { abschnitt: id });
  }
  render();
}
export const START_KLICKS = {
  check({ id }) { const { check } = kx; check(id === 'ja' || id === 'nein' ? id : null); },
  'neu-ok'() { const { alsGesehen, neuBereiche, render } = kx; const ids = neuBereiche(); alsGesehen(ids); trackEvent('unlock_later', { anzahl: ids.length }); render(); },
  'klapp-zu': klappen,
  'klapp-auf': klappen,
  'feedback-spaeter'() { const { jetzt, render } = kx; merke('feedback_spaeter', K.tagKey(jetzt())); render(); },
  'botschaft-zu'() {
    const { jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
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
