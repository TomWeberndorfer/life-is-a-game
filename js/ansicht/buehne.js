// Kampfbühne (31.10.2026; aus startseite.js ausgelagert, 02.11.2026): Arena, Heldentat mit Siegeln, Ablauf nach „Treffer“,
// Ruhezustand, „Rat für heute“. Seit Etappe 1 (Version 95) mit Daumenleiste und Rückgängig.
import { trackEvent } from '../analytics.js';
import { BEWEGUNG } from '../daten/bewegung.js';
import { KAMPFBUEHNE, RUECKGAENGIG } from '../daten/startseite.js';
import { BOTSCHAFTEN, STORIES } from '../daten/inhalte.js';
import { LAGERFEUER } from '../daten/lagerfeuer.js'; // Etappe 3, Teil C
import { SIEGELLEISTE } from '../daten/siegelleiste.js'; // Etappe 3, Teil D
import { TABELLE } from '../daten/vorlagen.js';
import * as H from '../logik/helden.js';
import * as I from '../logik/inhalte.js';
import * as K from '../logik/kern.js';
import { lagerfeuerSatz, lagerfeuerStand } from '../logik/lagerfeuer.js';
import { erfolgsSatz, siegelleiste } from '../logik/siegelleiste.js';
import { ablaufEndeMs, ablaufJetzt, leisteAnimation, lesedauerMs, mitLesezeit } from '../logik/bewegung.js';
import { buehneDauer, buehneZustand, naechsterOffener, planFrage, rueckDauer, tagesfrage, wennDann } from '../logik/startseite.js';
import { AKTION_SYMBOLE } from '../daten/symbole.js'; // Version 174: Symbol des Knopfes „Rat für heute“
import { blitzEbene, bwStil, esc, fortschrittHier, grossAnfang, icon, kachelLeiste } from './helfer.js';
import { kx } from './kontext.js';
import { eintragLink, oeffneEintrag } from './eintrag.js';
import { ANTWORT_ARTEN, antwortArt, istAntwort, siegelAntworten } from '../logik/antworten.js'; // Version 141: Antwort-Register
import { probeHtml } from './probe.js';
import { messzielKarte } from './messziele.js'; // Lagerfeuer: Messziele unter „Noch etwas?“ (Entscheidung 02.11., 2b)
import { ruhetagHeuteZeile, ruhetagLink } from './ruhetag.js';
import { stuetzeBereitHtml, stuetzenHakenHtml } from './stuetzen.js';
import { artSchluessel, artText, bogenTeile, comebackHtml, erledigtIcon, erledigtText } from './bestaendigkeit.js'; // Beständigkeit (04.11.2026)
import { nachtragHinweis, nachtragHtml, nachtragKachel, nachtragModus, nachtragName, nachtragWahlHtml, nachtragZusatz } from './nachtrag.js';
import { arenaHtml, beginntText, besiegtHeuteVorNeuem, vorstellungHinweisHtml, botschaftGesehen, botschaftHeute, bossReaktion, eintragLinks, heldenHeute, storyMorgen, weiterZuKnopf } from './startseite.js';
import { vorsatzZeileHtml } from './wochenrunde.js'; // Vorsatz der Woche unter der Tagesfrage (05.11.2026)
import { bedingungenHtml } from './bedingungen.js'; // Bosskette mit Bedingungen (06.11.2026)

// ---------- Kampfbühne (31.10.2026, Entscheidungen Abschnitt 18) ----------
// Crew-Botschaft, Heldentat und Duell in EINER Karte: oben die Arena mit dem Gegner (Kraft, Sprechblase der Crew),
// darunter die Heldentat mit zwei gleichwertigen Siegeln. Grund: Handlung und sichtbare Wirkung an einem Ort stärken das
// Kompetenzerleben; „nicht gebraucht“ ist kein schlechterer Tag und sieht darum nicht wie zweite Wahl aus.
// Zustände (logik/startseite.js buehneZustand): offen → nach „Ja“ der Ablauf (Treffer, Heldenbild, Boss-Sprechblase,
// daten/bewegung.js) → Ruhezustand (Bühne klein, Tagesende oder „Weiter zu …“). Ein klares Ende bindet gesünder als
// eine Seite, die nie fertig ist. Check-Logik unverändert (check() in app.js).
const BUEHNE = (() => {
  const r = buehneDauer(KAMPFBUEHNE, id => ablaufEndeMs(BEWEGUNG, id));
  r.fehler.forEach(m => console.warn(m));
  return r.dauer;
})();
// app.js: wann der Ruhezustand gezeichnet wird. lesen (02.11.2026) = Lesezeiten dieses Durchgangs { teil: ms }.
export function buehneDauerMs(art, lesen = null) {
  if (!lesen) return BUEHNE[art] || 0;
  const r = buehneDauer(KAMPFBUEHNE, id => ablaufEndeMs(mitLesezeit(BEWEGUNG, id, lesen), id));
  return r.dauer[art] || BUEHNE[art] || 0;
}
// Bewegungs-Konfiguration eines Durchgangs (mit Lesezeiten) oder die Standarddaten.
export const buehneLauf = b => (b && b.lesen && KAMPFBUEHNE.ablauf[b.art] ? mitLesezeit(BEWEGUNG, KAMPFBUEHNE.ablauf[b.art], b.lesen) : BEWEGUNG);
// Lesezeiten der Sprechblasen nach „Treffer“ (heute, gewählter Held): aus der Textlänge (daten/bewegung.js `lesen`).
// 0 = Blase fällt weg. Muss nach dem Speichern des Checks laufen (die Reaktion hängt von der heutigen Antwort ab).
// Fehler → null (dann gelten die festen Zeiten aus den Daten).
export function buehneLesezeiten() {
  const { SM, T, aktuelleVorlage, jetzt, stand } = kx;
  try {
    const v = aktuelleVorlage();
    const r = bossReaktion(v, K.auswertung(stand, jetzt()));
    return { heldBlase: SM.erfolg.an ? lesedauerMs(T('erfolg.blase'), BEWEGUNG.lesen) : 0, bossBlase: r && r.text ? lesedauerMs(r.text, BEWEGUNG.lesen) : 0 };
  } catch (e) { console.warn('Lesezeit:', e.message); return null; }
}
// Hinweis „Tippen: weiter“ nur beim ersten Mal je Gerät (Entscheidung 02.11.2026, Punkt 4); im selben Durchgang bleibt er.
const TIPP_KEY = 'liag.hinweis.tippenWeiter';
function tippHinweis(b) {
  if (!b) return false;
  if (b.hinweis === undefined) {
    let gesehen = true;
    try { gesehen = localStorage.getItem(TIPP_KEY) === '1'; if (!gesehen) localStorage.setItem(TIPP_KEY, '1'); } catch (e) { gesehen = true; }
    b.hinweis = !gesehen;
  }
  return b.hinweis;
}
// Sprechblasen (02.11.2026): „Automatisch“ mit Restzeit-Leiste (gleiche Zeit wie die Blase), „Nur per Tippen“ mit dem
// Hinweis in jeder Blase statt Leiste. Liefert das Ende der Blase (Leiste und/oder Hinweis) als HTML.
function blasenFuss(ablaufId, teil, lauf, vergangenMs, ersterHinweis) {
  const { T, spiel } = kx;
  if (H.bereinigeEinstellungen(spiel.einstellungen).blasen === 'tippen') return `<small class="blase-hinweis">${esc(T('buehne.tippenWeiter'))}</small>`;
  const an = leisteAnimation(lauf, ablaufId, teil, vergangenMs);
  return `${ersterHinweis ? `<small class="blase-hinweis">${esc(T('buehne.tippenWeiter'))}</small>` : ''}${an ? `<i class="blase-leiste" aria-hidden="true" style="animation:${esc(an)}"></i>` : ''}`;
}
const BUCH_SVG = '<svg class="ic buch-blaettert" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 6C9.5 4.5 6 4.3 3 5v13c3-.7 6.5-.5 9 1 2.5-1.5 6-1.7 9-1V5c-3-.7-6.5-.5-9 1Z"/><path d="M12 6v13"/><path class="blatt" d="M12 6.6c1.8-1 4.3-1.3 6.5-.9v11.6c-2.2-.4-4.7-.1-6.5.9Z" fill="currentColor" fill-opacity=".35"/></svg>';

export function buehneHtml({ v, f, g, a }) {
  const { SM, T, img, jetzt, nameVon, spiel, ui, wort } = kx;
  // Version 95: Rückgängig-Hinweis eines anderen Helden oder Tages schließen (er gilt nur, wo er entstand)
  if (rueckFuer && (rueckFuer.heroId !== spiel.fokus || rueckFuer.tag !== K.tagKey(jetzt()))) schliesseRueckgaengig();
  const nt = nachtragModus();
  const antw = a.heuteAntwort;
  const z = zustandJetzt(a);
  const feuer = z.zustand === 'ruhe' ? feuerStand() : null; // Etappe 3, Teil C: alle Taten beantwortet
  const ablaufId = z.zustand === 'ablauf' ? KAMPFBUEHNE.ablauf[z.art] : null;
  const lauf = ablaufId ? buehneLauf(ui.buehne) : BEWEGUNG; // mit den Lesezeiten dieses Durchgangs
  const bw = teil => (ablaufId ? bwStil(ablaufId, teil, true, z.vergangenMs, lauf) : '');
  const ruheNeu = z.zustand === 'ruhe' && ui.einmal.has('ruhe');
  const bwRuhe = teil => (ruheNeu ? bwStil(KAMPFBUEHNE.ruheAblauf, teil) : '');
  const held = nameVon(v.held);
  const bid = besiegtHeuteVorNeuem(a); // Siegtag mit neuem Gegner: der Besiegte grau, der Neue kommt beim nächsten Besuch
  const gid = bid || v.gegner;
  const gg = TABELLE.gegner[gid] || g;
  const kraft = bid ? 0 : a.anzahl - a.treffer;
  // Siegtag: Segmente nach dem Ziel der gewonnenen Runde, nicht der nächsten (02.11.2026, Fehler: 3 statt 2 Balken)
  const anzahl = bid ? (K.siegRundenZiel(kx.stand, a.heute) ?? a.anzahl) : a.anzahl;
  const besiegt = !!bid || (a.bossKraft === 0 && !a.bedingungenOffen); // 06.11.2026: offene Bedingung = noch nicht besiegt
  // „Der letzte Schlag“ (02.11.2026): am Siegtag erlischt der Gegner im Ablauf selbst (erst danach dauerhaft grau)
  const letzterSchlag = !!ablaufId && z.art === 'sieg';

  // Arena: Gegner, Licht und Funken, Treffer, Heldenbild, Sprechblasen, Kraft
  const segBricht = ablaufId && ui.buehne && ui.buehne.art && z.vergangenMs < 700; // nur direkt nach dem Treffer
  const unter = bid ? T('duell.besiegtMorgen', { sieg: wort('sieg') })
    : a.gegnerAnzahl > 1 ? T('weg.kapitel', { kapitel: wort('kapitel'), nr: a.gegnerNr }) : a.siege ? T('gegner.siege', { n: a.siege, sieg: wort('sieg') }) : T('gegner.unbesiegt');
  const name = bid ? `<span class="gegner-name">${esc(gg.name)}</span>`
    : `<button class="gegner-name tippbar" data-a="blatt" data-id="boss" aria-label="${esc(T('duell.ansehen', { gegner: gg.name }))}">${esc(gg.name)}</button>`;
  // „Der Held tritt ins Bild“ (02.11.2026): Porträt links statt Bannerbild über der ganzen Arena, Satz als Sprechblase;
  // Gegner und Kraft rücken nach rechts und bleiben sichtbar. Das Porträt gibt es für jeden Helden in jedem Stil.
  let erfolg = '';
  const mitHeld = !!ablaufId && z.art === 'treffer' && SM.erfolg.an;
  if (mitHeld) {
    // Blasen dort, wo keine Gesichter sind (02.11.2026): Held unten in seinem Bild, Gegner rechts über seinem Namen
    erfolg = `<span class="buehne-erfolg"${bw('erfolg')}>${img(spiel.fokus, held, 'held', 'cover', '')}
      <span class="held-blase" role="status"${bw('heldBlase')}><b>${esc(held.toUpperCase())}</b>${esc(T('erfolg.blase'))}${blasenFuss(ablaufId, 'heldBlase', lauf, z.vergangenMs, tippHinweis(ui.buehne))}</span></span>`;
  }
  const reaktion = antw ? bossReaktion(v, a) : null;
  const bossBlase = ablaufId && z.art === 'treffer' && reaktion
    ? `<p class="boss-blase art-${esc(reaktion.art)}${mitHeld ? ' neben-held' : ''}" role="status"${bw('bossBlase')}><b>${esc(String(gg.kurz || gg.name).toUpperCase())}</b>${esc(reaktion.text)}${blasenFuss(ablaufId, 'bossBlase', lauf, z.vergangenMs, false)}</p>` : '';
  let crew = '';
  if (z.zustand !== 'ruhe' && !nt) {
    let d = null;
    try { d = botschaftHeute(); } catch (e) { console.warn('Sprechblase:', e.message); }
    // Sichtbar bis „gelesen“ (ein Tipp blendet sie aus); im Ablauf weicht sie dem Treffer
    if (d && !d.gelesen && (z.zustand === 'offen' || ablaufId)) {
      if (z.zustand === 'offen') botschaftGesehen(d.b, d.tag);
      crew = `<button class="crew-blase" data-a="botschaft-zu" data-neu="botschaft" aria-label="${esc(T('buehne.blaseAria', { held: nameVon(d.v.held) }))}"${bw('crewBlase')}>${img(d.v.held, nameVon(d.v.held), 'held', 'blase-bild', '')}<span class="blase-text"><b>${esc(nameVon(d.v.held).toUpperCase())}</b><span class="blase-satz">${esc(d.b.text)}</span></span></button>`;
    }
  }
  // Version 96: Tipp irgendwo auf die Arena öffnet das Gegnerblatt (größere Trefferfläche als nur der Name, Fitts).
  // Die Crew-Blase behält ihre eigene Aktion (closest('[data-a]') trifft sie zuerst). Am Siegtag nicht: das Blatt
  // zeigte den neuen Gegner, der erst beim nächsten Besuch erscheinen soll. Tastatur: weiterhin über den Namen-Knopf.
  const arenaTipp = bid ? '' : ' data-a="blatt" data-id="boss"';
  const angehalten = !!ablaufId && !!ui.buehne && Number.isFinite(ui.buehne.pauseSeit); // 02.11.2026: Bewegung steht still
  const arena = `<div class="arena${bid ? '' : ' arena-tipp'}${angehalten ? ' angehalten' : ''}"${arenaTipp} data-neu="gegner"${bwRuhe('arena')}>
      <span class="arena-bildrahmen"${bw('arenaBild')}><span class="gegner-bild"${bw('gegnerBild')}>${img('boss-' + gid, gg.name, 'boss', 'arena-bild' + (besiegt && !letzterSchlag ? ' grau' : ''), '')}</span></span>
      ${besiegt && !ablaufId ? '' : arenaHtml({ licht: !besiegt, stoss: ablaufId ? { ablauf: ablaufId, vergangenMs: z.vergangenMs } : null })}${ablaufId ? blitzEbene(ablaufId, 'arenaBlitz', true, z.vergangenMs) : ''}
      ${letzterSchlag ? `<span class="besiegt-stempel" aria-hidden="true"><b${bw('stempel')}>${esc(T('buehne.besiegt', { sieg: grossAnfang(wort('sieg')) }))}</b></span>`
        : ablaufId ? `<span class="treffer-wort" aria-hidden="true"${bw('trefferWort')}>${esc(T('buehne.treffer'))}</span>` : ''}
      ${erfolg}${bossBlase}${crew}
      <div class="arena-text"${bw('arenaText')}>
        <span class="gegner-zeile">${name}<small${bid ? ' class="besiegt-text"' : ''}>${esc(unter)}</small></span>
        <span class="segmente" role="img" aria-label="${esc(T('gegner.kraftAria', { kraft, anzahl }))}">${Array.from({ length: anzahl }, (_, i) => `<i class="${i < kraft ? 'voll' : segBricht && i === kraft ? 'bricht' : ''}"></i>`).join('')}</span>
        <span class="kraft-zeile${a.wocheZaehler > a.anzahl || (!bid && a.rundeTag < 0) ? '' : ' schlicht'}"><span>${esc(T('buehne.kraft'))}</span><span>${kraft} / ${anzahl}${a.wocheZaehler > a.anzahl ? ` · ${esc(T('duell.extra'))}` : ''}${!bid && a.rundeTag < 0 ? ` · ${esc(T('gegner.abMorgen'))}` : ''}</span></span>
      </div>
    </div>`;

  // Heldentat
  let tat = '';
  if (z.zustand === 'offen') {
    const wd = wennDann(f);
    // Version 174: `mehr` = Knopf „Rat für heute“ (drei Punkte) rechts neben dem Titel; nur auf der offenen Karte ohne Nachtrag
    const kopf = (mehr = '') => `<div class="tat-kopf"><span class="tat-medaille" aria-hidden="true">${icon(f.icon || 'stern')}</span>
        <span class="spalte"><span class="eyebrow tat-eyebrow">${esc(nt ? T('nachtrag.eyebrow', { tag: nachtragName(nt).toUpperCase() }) : T('tat.eyebrow'))}</span>
        <button class="tat-name tippbar" data-a="blatt" data-id="faehigkeit" aria-label="${esc(T('tat.ansehen', { faehigkeit: f.name }))}">${esc(f.name)}</button></span>${mehr}</div>`;
    // Version 146 (Bewertung 05.11.2026, Punkt 9a): Der Wenn-dann-Plan steht IN der haftenden Daumenleiste direkt über
    // der Tagesfrage. Vorher stand er darüber im mitscrollenden Teil und war am Handy oft hinter der Leiste verborgen,
    // gerade im Moment der Entscheidung. Psychologie: Ein Wenn-dann-Plan wirkt, wenn er vor der Entscheidung abgerufen
    // wird (Gollwitzer). Nachtrag und „beginnt später“ haben keine Daumenleiste: dort bleibt er unter dem Namen.
    const regel = regelHtml(wd);
    // Startpaket (18a): Quest beginnt erst später → keine Siegel, nur ein ruhiger Hinweis (heute ist nichts zu tun)
    // Version 174 (Entscheidung 10.11.2026): Plan und Frage in EINEM Block (die Situation steht schon im Plan, die Frage wird kurz,
    // siehe planFrage); Nebenaktionen (Schwerer Tag, Nachtragen, Ruhetag, Morgenkarte) hinter „⋯“ neben dem Titel, „Gerade schwer“
    // bleibt in der Kopfzeile. Psychologie: eine Entscheidung je Moment (weniger Wahl, weniger Reibung); die Hilfe steht nicht
    // dauernd da, sondern erscheint nach „War schwer“ von selbst (Hilfe im Moment der Schwierigkeit).
    const vorBeginn = !nt && K.vorBeginn(kx.stand, K.tagKey(jetzt()));
    const rat = nt || vorBeginn ? { knopf: '', liste: '' } : ratHtml(); // Menü nur auf der Karte mit Siegeln
    const standardFrage = artSchluessel('frage', 'tat.frage');
    const frage = planFrage(wd, standardFrage === 'tat.frage', T('tat.frageMitPlan'), tagesfrage(v, f, T(standardFrage, { faehigkeit: f.name })));
    const block = `<div class="tat-block">${regelHtml(wd, true)}<p class="tat-frage">${esc(frage)}</p></div>`;
    const hilfeLink = schwerSiegelDa(a.ohneFrage) ? '' : eintragLink('schwer', 'eintrag.link.schwer');
    tat = nt ? kopf() + regel + nachtragHtml(nt, f)
      : vorBeginn ? `${kopf()}${regel}<div class="ruhe-zeile vor-beginn" role="status"><span class="eyebrow">${esc(beginntText(kx.stand).toUpperCase())}</span><p class="ruhe-text">${esc(T('beginn.titel'))}</p><p class="klein">${esc(T('beginn.text', { faehigkeit: f.name }))}</p></div>`
      : `${kopf(rat.knopf)}${rat.liste}${nachtragHinweis()}${ruhetagHeuteZeile()}${bid ? '' : bedingungenHtml(a)}
      <div class="tat-daumen${ersterTag() ? ' erster' : ''}">${block}${ersterTagHtml()}${vorsatzZeileHtml(spiel.fokus)}
      ${a.ohneFrage ? `<p class="klein tat-zw-hinweis">${esc(artText('hinweis', 'tat.frage'))}</p>` : ''}
      ${siegelReiheHtml(a.ohneFrage)}
      ${hilfeLink ? `<div class="daumen-hilfen">${hilfeLink}</div>` : ''}</div>`;
  } else {
    const erledigt = `<div class="erledigt${ui.einmal.has('check') ? ' neu' : ''}${antw ? ' art-' + esc(antw) : ''}" role="status">${erledigtIcon(antw)}<span>${esc(erledigtText(antw, f))}</span><button class="link" data-a="check" data-id="">${esc(T('tat.aendern'))}</button></div>`;
    // Im Ablauf schon die leisen Links (festhalten, schwerer Moment), damit man nicht 9 Sekunden warten muss
    // Schritt „Zähler“: Stützgewohnheiten erst nach der Antwort des Tages, als leise Haken (ohne XP, ohne Treffer)
    const bed = bid ? '' : bedingungenHtml(a);
    tat = z.zustand === 'ablauf' ? `${erledigt}${bed}${stuetzenHakenHtml()}${eintragLinks(antw)}` : feuer ? lagerfeuerHtml(feuer, a, antw, reaktion) : `${siegelleisteHtml(spiel.fokus, 'ruhe')}${ruheBilanzHtml(a)}${ruheZeile(bwRuhe('ruheZeile'))}${erledigt}${bed}${stuetzenHakenHtml()}${stuetzeBereitHtml(a)}
      ${comebackHtml()}${auffrischungHtml(a)}${reaktion ? `<p class="buehne-reaktion art-${esc(reaktion.art)}">${esc(reaktion.text)}</p>` : ''}
      ${storyRuheHtml()}${eintragLinks(antw, { nachtrag: true })}${nachtragZusatz()}${ruheWeiter()}`;
  }
  return `<section class="karte buehne ${z.zustand}${mitHeld ? ' mit-held' : ''}${feuer ? ' feuer' : ''}${besiegt ? ' besiegt' : ''}${nt ? ' nachtrag' : ''}" aria-label="${esc(T('buehne.aria', { gegner: gg.name }))}">
    ${arena}
    ${bid && !ablaufId && !ui.feier ? vorstellungHinweisHtml() : ''}
    <div class="buehne-tat heldentat">${tat}</div>
  </section>`;
}
// Wenn-dann-Zeile der Fähigkeit (leer ohne Text in der Vorlage). Wirft nie.
// block = true (Version 174): zwei Zeilen WENN / DANN im Block mit der Frage; sonst eine Zeile mit Pfeil (Nachtrag, „beginnt später“).
function regelHtml(wd, block = false) {
  const { T } = kx;
  if (!wd || (!wd.wenn && !wd.dann)) return '';
  if (block) return `<p class="tat-regel im-block">${wd.wenn ? `<b>${esc(T('tat.wenn'))}</b><span>${esc(wd.wenn)}</span>` : ''}${wd.dann ? `<b class="dann">${esc(T('tat.dannLabel'))}</b><span>${esc(wd.dann)}</span>` : ''}</p>`;
  return `<p class="tat-regel">${wd.wenn ? `<b>${esc(T('tat.wenn'))}</b> <span>${esc(wd.wenn)}</span>` : ''}${wd.wenn && wd.dann ? ' <span class="tat-pfeil" aria-hidden="true">→</span> ' : ''}${wd.dann ? `<b class="dann">${esc(T('tat.dannLabel'))}</b> <span>${esc(wd.dann)}</span>` : ''}</p>`;
}
// Siegel statt großer Knöpfe: gleich groß, Wort und Symbol je Stil (stile.js `texte` / `symbole`)
// wortKey (Zählweisen, 04.11.2026): eigener Textschlüssel fürs Wort (Rhythmus „Erledigt“); ohne = Wort des Stils.
// Ohne Tagesfrage (Rhythmus, Wache) gibt es nur das Treffer-Siegel: „Keine Versuchung“ und „War schwer“ wären tägliche
// Pflichtantworten (Register daten/antworten.js, `nurMitFrage`). Version 141: Reihe aus dem Register, drei gleich große Siegel.
function siegelReiheHtml(ohneFrage) {
  const ids = siegelAntworten(!ohneFrage);
  const klasse = ids.length === 1 ? ' einzeln' : ids.length >= 3 ? ' drei' : '';
  return `<div class="tat-siegel-reihe${klasse}">${ids.map(id => {
    const art = ANTWORT_ARTEN[id];
    return siegelKnopf(id, art.siegel, art.symbol, ohneFrage && id === 'ja' ? artSchluessel('siegel', 'siegel.treffer') : null);
  }).join('')}</div>`;
}
// Version 141: Gibt es ein Siegel, das selbst den Eintrag „schwer“ öffnet, fällt der Link daneben weg (zwei Wege mit
// verschiedener Wirkung nebeneinander verwirren). Im „Rat für heute“ bleibt er: dort hält man einen schweren Moment fest,
// ohne den Tag abzuschließen.
const schwerSiegelDa = ohneFrage => siegelAntworten(!ohneFrage).some(id => ANTWORT_ARTEN[id].eintrag === 'schwer');
function siegelKnopf(antwort, art, standard, wortKey = null) {
  const { T, symbol } = kx;
  return `<button class="tat-siegel ${art}" data-a="check" data-id="${antwort}"><span class="siegel-rund" aria-hidden="true">${icon(symbol('siegel.' + art, standard))}</span><span class="siegel-wort">${esc(T(wortKey || 'siegel.' + art))}</span></button>`;
}
// „Rat für heute“ (Name je Stil): Schwerer Tag, Nachtragen, Ruhetag und Morgenkarte hinter einem leisen Knopf (drei Punkte) neben
// dem Titel der Heldentat. Grund: Hilfe ist da, wenn man sie sucht, ohne Links vor die Hauptaktion zu stellen.
// Version 174: Knopf und Liste getrennt ({ knopf, liste }), weil der Knopf im Kopf der Karte und die Liste darunter steht.
// Die Notfallkarte fehlt hier bewusst: „Gerade schwer“ in der Kopfzeile öffnet sie jederzeit (gleiche Freigabe, FUNKTIONEN.notfallkarte).
// Nachtragen (vorher eine eigene Zeile über der Frage) ist die Kachel „Nachtragen“, die Tageswahl steht unter der Leiste.
function ratHtml() {
  const { T, spiel, symbol, ui } = kx;
  const leiste = kachelLeiste([eintragLink('schwer', 'eintrag.link.schwer', { alsKachel: true }), nachtragKachel(), ruhetagLink({ ohneHeute: true, alsKachel: true })]);
  const teile = [leiste, nachtragWahlHtml(), probeHtml()].filter(x => String(x || '').trim());
  if (!teile.length) return { knopf: '', liste: '' };
  const offen = ui.ratOffen === spiel.fokus;
  const titel = T('rat.titel');
  const knopf = `<button class="rat-knopf rat-mehr" data-a="rat" aria-expanded="${offen}" aria-label="${esc(titel)}" title="${esc(titel)}">${icon(symbol('aktion.mehr', AKTION_SYMBOLE['aktion.mehr']))}</button>`;
  const liste = offen ? `<div class="rat offen"><div class="rat-liste" role="group" aria-label="${esc(T('rat.aria'))}"><span class="eyebrow rat-titel">${esc(titel.toUpperCase())}</span>${teile.join('')}</div></div>` : '';
  return { knopf, liste };
}
// Ruhezustand: „Für heute ist alles getan“ erst, wenn alle Helden fertig sind; sonst „<Held> ist fertig“ + Weiter zu …
function ruheNaechster() {
  const { spiel } = kx;
  if (spiel.helden.length < 2) return null;
  return naechsterOffener(heldenHeute(), spiel.fokus); // seit Teil C: ein Held mit Ruhetag gilt als fertig
}
function ruheZeile(stil) {
  const { T, nameVon, spiel } = kx;
  let n = null;
  try { n = ruheNaechster(); } catch (e) { console.warn('Ruhezustand:', e.message); }
  return `<div class="ruhe-zeile"${stil}><span class="eyebrow">${esc(T('ruhe.marke'))}</span><p class="ruhe-text">${esc(n ? T('ruhe.held', { held: nameVon(spiel.fokus) }) : T('ruhe.alle'))}</p></div>`;
}
function ruheWeiter() {
  const { T, spiel, ui } = kx;
  let n = null;
  try { n = ruheNaechster(); } catch (e) { return ''; }
  // „Später“ (Etappe 3, Teil B): blendet „Weiter zu …“ für diesen Helden in dieser Sitzung aus, ohne Hinweis auf Offenes.
  // Die Tagesleiste oben bleibt der Weg zurück.
  if (!n || ui.weiterSpaeter === spiel.fokus) return '';
  // Etappe 3 (Punkt 4): in der Daumenleiste, damit der nächste Schritt ohne Suchen erreichbar ist. Bewusst nur der Wechsel,
  // nicht die Siegel des nächsten Helden: beim Wechsel steht erst sein Wenn-Dann-Plan da (Erinnern macht die Tat wahrscheinlicher).
  // 04.11.2026: Rückgängig steht als Zeile in der Leiste statt als Popup darüber (das Popup verdeckte „Weiter zu …“)
  return `<div class="tat-daumen weiter-daumen">${rueckZeileHtml()}${weiterZuKnopf(n)}<button class="link weiter-spaeter" data-a="weiter-spaeter">${esc(T('tat.spaeter'))}</button></div>`;
}
// Geschichte im Ruhezustand: wartet ein Siegel → „Teil n ist frei · Lesen“ (Belohnung im Moment der Tat); sonst leise.
function storyRuheHtml() {
  const { T, andeutungGesehen, story } = kx;
  let st;
  try { st = story(); } catch (e) { console.warn('Geschichte:', e.message); return ''; }
  if (!st || !Array.isArray(st.teile)) return '';
  const siegel = I.storyZustaende(st).find(x => x.zustand === 'siegel');
  if (siegel) {
    andeutungGesehen('story_siegel');
    return `<div class="buehne-story frei" data-neu="story"><span class="spalte"><span class="eyebrow akzent">${esc(T('story.eyebrow', { nr: st.wocheNr }))}</span><span class="nm">${esc(st.titel)}</span><span class="klein">${esc(T('buehne.teilFrei', { nr: siegel.nr }))}</span></span>
      <button class="lesen-knopf" data-a="story-oeffnen">${BUCH_SVG}${esc(T('story.lesen'))}</button></div>`;
  }
  const morgen = storyMorgen();
  if (morgen) andeutungGesehen('story');
  const sub = morgen ? (morgen.neueGeschichte ? T('story.morgenNeu', { titel: morgen.titelWoche }) : T('story.morgenTeil', { nr: morgen.nr, titel: morgen.vorschau || morgen.titel }))
    : st.frei >= st.teile.length ? T('story.fertig') : T('story.hinweisGelesen');
  return `<div class="buehne-story"><span class="spalte"><span class="eyebrow">${esc(T('story.eyebrow', { nr: st.wocheNr }))}</span><span class="klein">${esc(sub)}</span></span>
    <button class="lesen-knopf leise" data-a="story-oeffnen">${esc(T('story.lesen'))}</button></div>`; // Version 93: Knopf statt Link
}

// ---------- Etappe 1 (Version 95) ----------
// Daumenleiste: Tagesfrage, Siegel und Hilfen in .tat-daumen (CSS: sticky unten, solange die Bühne sichtbar ist).
// Grund: die eine Handlung des Tages ohne Scrollen erreichbar (Reibung senken, Fogg). Siegel bleiben gleich groß (Abschnitt 18).

// Erster Tag: noch keine einzige Antwort für diesen Helden → ein ruhiger Satz, dass Lücken normal sind (kein Rückstand von
// Anfang an). An diesem Tag fließt die Leiste normal mit (.erster), damit der Wenn-Dann-Plan beim ersten Lesen nicht verdeckt ist.
function ersterTag() {
  const { stand } = kx;
  const tage = stand && stand.tage && typeof stand.tage === 'object' ? stand.tage : null;
  return !!tage && !Object.keys(tage).length;
}
function ersterTagHtml() {
  const { T } = kx;
  return ersterTag() ? `<p class="tat-erster">${esc(T('tat.ersterTag'))}</p>` : '';
}

// Rückgängig: RUECK_MS lang nach einer neuen Antwort von heute. Rückgängig = dieselbe Logik wie „Ändern“ (check(null)).
// Zwei Orte (04.11.2026, Entscheidung 1): Gibt es die Daumenleiste mit „Weiter zu …“, steht der Hinweis als Zeile darin
// (rueckZeileHtml, übersteht render() über den Zustand hier, Ablaufleiste läuft mit negativer Verzögerung weiter). Sonst
// (Ablauf, Lagerfeuer, ein Held) bleibt das Popup über der Tableiste, außerhalb von #app mit eigenem Hörer. Steht die Zeile
// auf der Seite, blendet CSS das Popup aus (:has). Grund: Rückgängig bleibt beim Daumen, ohne den nächsten Schritt zu verdecken.
// Der Zustand gilt auch ohne echtes DOM (Rauchtest prüft die Zeile).
const RUECK_MS = rueckDauer(RUECKGAENGIG); // Version 147: aus den Daten (vorher fest 6000)
let rueckTimer = null;
let rueckFuer = null; // { heroId, tag, antwort, seit }: Rückgängig gilt nur für diesen Helden an diesem Tag
function rueckgaengigMachen() {
  const { T, check, jetzt, render, spiel } = kx;
  const fuer = rueckFuer;
  schliesseRueckgaengig();
  // Held oder Tag gewechselt (z. B. „Weiter zu …“ oder Zeitsprung im Testprofil): nichts zurücknehmen, sonst träfe es den Falschen
  if (!fuer || fuer.heroId !== spiel.fokus || fuer.tag !== K.tagKey(jetzt())) { console.warn('Rückgängig: Held oder Tag gewechselt, nichts geändert'); render(); return; }
  kx.bestaetige(T('rueck.erledigt')); // Etappe 3: Popup statt Box
  check(null);
  trackEvent('checkin_undone', {});
}
function entferneRueckElemente() {
  if (typeof document === 'undefined') return;
  try {
    const t = typeof document.getElementById === 'function' ? document.getElementById('rueck-hinweis') : null;
    if (t && typeof t.remove === 'function') t.remove();
    const zeilen = typeof document.querySelectorAll === 'function' ? document.querySelectorAll('.rueck-zeile') : [];
    for (const z of zeilen) if (z && typeof z.remove === 'function') z.remove();
  } catch (e) { console.warn('Rückgängig (Aufräumen):', e.message); }
}
function schliesseRueckgaengig() {
  clearTimeout(rueckTimer);
  rueckTimer = null;
  rueckFuer = null;
  entferneRueckElemente();
}
// Gilt der Hinweis noch für den gewählten Helden heute? Liefert die schon vergangene Zeit in ms oder null.
function rueckVergangen() {
  const { jetzt, spiel } = kx;
  if (!rueckFuer || rueckFuer.heroId !== spiel.fokus || rueckFuer.tag !== K.tagKey(jetzt())) return null;
  const ms = Date.now() - rueckFuer.seit;
  return ms >= 0 && ms < RUECK_MS ? ms : null;
}
const rueckText = antwort => { const { T } = kx; const id = antwortArt(antwort) ? antwort : 'ja'; return T('rueck.' + id, { wort: T('siegel.' + ANTWORT_ARTEN[id].siegel) }); }; // Version 141: je Antwort
function rueckAnsage() {
  const { T, aktuelleVorlage, jetzt, stand } = kx;
  try {
    const a = K.auswertung(stand, jetzt());
    const g = TABELLE.gegner[aktuelleVorlage().gegner];
    return g ? T('rueck.ansage', { gegner: g.kurz || g.name, kraft: Math.max(0, a.anzahl - a.treffer), anzahl: a.anzahl }) : '';
  } catch (e) { console.warn('Rückgängig (Ansage):', e.message); return ''; }
}
// Zeile in der Daumenleiste oder ''
export function rueckZeileHtml() {
  const { T } = kx;
  const ms = rueckVergangen();
  if (ms === null) return '';
  return `<div class="rueck-zeile"><span class="rueck-wort">${icon('check')}<span>${esc(rueckText(rueckFuer.antwort))}</span></span><button class="link" data-a="rueck-gaengig">${esc(T('rueck.knopf'))}</button><i aria-hidden="true" style="animation-duration:${RUECK_MS}ms;animation-delay:-${Math.round(ms)}ms"></i></div>`;
}
// Vor der Antwort merken, damit schon die erste Zeichnung danach die Zeile enthält; Timer räumt beide Orte ab.
function merkeRueckgaengig(antwort) {
  const { jetzt, spiel } = kx;
  schliesseRueckgaengig();
  rueckFuer = { heroId: spiel.fokus, tag: K.tagKey(jetzt()), antwort, seit: Date.now() };
  rueckTimer = setTimeout(schliesseRueckgaengig, RUECK_MS);
}
function zeigeRueckPopup() {
  const { T } = kx;
  // Ohne echtes DOM (Rauchtest) kein Popup; die Zeile in der Leiste kommt aus dem Zustand
  if (!rueckFuer || typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.body) return;
  try {
    const alt = document.getElementById('rueck-hinweis');
    if (alt) alt.remove();
    const ansage = rueckAnsage();
    const el = document.createElement('div');
    el.id = 'rueck-hinweis'; el.className = 'rueck-hinweis'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>${esc(rueckText(rueckFuer.antwort))}${ansage ? `<span class="nur-sr"> ${esc(ansage)}</span>` : ''}</span><button type="button">${esc(T('rueck.knopf'))}</button><i aria-hidden="true" style="animation-duration:${RUECK_MS}ms"></i>`;
    el.querySelector('button').addEventListener('click', rueckgaengigMachen);
    document.body.appendChild(el);
  } catch (e) { console.warn('Rückgängig (Hinweis):', e.message); }
}

// Bilanz im Ruhezustand (Version 140, Register FORTSCHRITT in daten/startseite.js): nach dem Check eine leise Zeile mit
// Stufe und Beständigkeit, statt sie vor der Tat in der Kopfleiste zu zeigen. Im Lagerfeuer nur, wenn der sprechende Held
// der aktive ist (die Zahlen gehören zu ihm; mit einem Helden ist das Lagerfeuer der Ruhezustand).
function ruheBilanzHtml(a) {
  const { T, titel, wort } = kx;
  const teile = [];
  try {
    if (fortschrittHier('stufe', 'ruhe') && a && Number.isFinite(a.level)) teile.push(T('blatt.stufeZeile', { stufe: wort('stufe'), nr: a.level, titel: titel(a.level) }));
    if (fortschrittHier('bestaendigkeit', 'ruhe')) teile.push(...bogenTeile());
  } catch (e) { console.warn('Bühne (Bilanz):', e.message); return ''; }
  return teile.length ? `<p class="klein ruhe-bilanz">${esc(teile.join(' · '))}</p>` : '';
}
// ---------- Siegelleiste und Erfolgssatz (Etappe 3, Teil D, 02.11.2026, Entscheidungen Abschnitt 27) ----------
// Tage der laufenden Runde als Siegel (Wachssiegel = Treffer, Blatt = keine Versuchung, Mond = Ruhetag, offen gestrichelt),
// darunter ein Satz über dich ab dem ersten Treffer. Im Ruhezustand unter der Arena und im Lagerfeuer beim Sprecher (7a).
// Tipp aufs heutige Siegel = „Heute ändern“ (wie der Link in der Erledigt-Zeile), nur für den gewählten Helden.
// Einstellungen: daten/siegelleiste.js; Logik: logik/siegelleiste.js. Nichts gespeichert.
const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
function siegelleisteHtml(id, ort) {
  const { T, heldenAnsichten, jetzt, nameVon, spiel, stilWerte, symbol } = kx;
  if (!SIEGELLEISTE.an || !SIEGELLEISTE.orte.includes(ort)) return '';
  let h = null, l = null;
  try {
    h = heldenAnsichten().find(x => x.id === id);
    l = h ? siegelleiste(h.a, K.tagKey(jetzt()), SIEGELLEISTE) : null;
  } catch (e) { console.warn('Siegelleiste:', e.message); return ''; }
  if (!l) return '';
  const tag = x => {
    const a = SIEGELLEISTE.zeichen[x.siegel];
    const inhalt = a ? icon(a.symbol ? symbol(a.symbol, a.icon) : a.icon) : '';
    const klasse = `sl-siegel ${a ? esc(a.klasse || '') : 'offen'}${x.heute ? ' heute' : ''}`;
    const wt = `<small>${esc(x.heute ? T('sl.heute') : WOCHENTAG[K.ausTagKey(x.tag).getDay()])}</small>`;
    // Heute mit Antwort: antippen = „Heute ändern“ (nur beim gewählten Helden; ein Ruhetag ändert sich über sein Blatt).
    // Version 127: nur an den Orten aus SIEGELLEISTE.aendernOrte (im Lagerfeuer nur Anzeige, dort steht „Ändern“ darunter).
    const aendernHier = Array.isArray(SIEGELLEISTE.aendernOrte) && SIEGELLEISTE.aendernOrte.includes(ort);
    if (aendernHier && x.heute && id === spiel.fokus && istAntwort(h.a.tage && h.a.tage[x.tag])) { // Version 141: jede Antwort
      return `<button class="sl-tag" data-a="check" data-id="" aria-label="${esc(T('sl.aendernAria'))}"><span class="${klasse}" aria-hidden="true">${inhalt}</span>${wt}</button>`;
    }
    return `<span class="sl-tag" aria-hidden="true"><span class="${klasse}">${inhalt}</span>${wt}</span>`;
  };
  let satz = '';
  if (l.anlass) {
    try {
      const b = BOTSCHAFTEN.find(x => x.anlass === l.anlass);
      const text = erfolgsSatz(b && b.texte, K.tagKey(jetzt()), id);
      if (text) {
        const w = { ...I.werteFuer(h.a, jetzt(), h.v, TABELLE, nameVon, stilWerte()), n: l.n, anzahl: l.ziel, rest: Math.max(0, l.ziel - l.n) };
        satz = `<p class="sl-satz">${esc(I.fuelle(text, w))}</p>`;
      }
    } catch (e) { console.warn('Erfolgssatz:', e.message); }
  }
  return `<div class="siegelleiste ${esc(ort)}"><div class="sl-tage" role="group" aria-label="${esc(T('sl.aria', { n: l.n, anzahl: l.ziel }))}">${l.tage.map(tag).join('')}</div>${satz}</div>`;
}

// ---------- Lagerfeuer (Etappe 3, Teil C, 02.11.2026, Entscheidungen Abschnitt 27) ----------
// Sind alle Taten des Tages beantwortet (ein Ruhetag zählt mit), ersetzt das Lagerfeuer den Ruhezustand der Bühne: Szene mit
// Glut, ein Satz des gewählten Helden (im normalen Ablauf der, der zuletzt fertig wurde), je Held eine Zeile mit Siegel und
// Antwort. Keine Zahlen, keine Bonus-Aufgaben; Stützgewohnheiten, Messziele und leise Links nur eingeklappt unter „Noch etwas?“.
// Am Siegtag bleibt die leise Andeutung „morgen“ (Boss-Reaktion): Neugier auf den nächsten Tag passt zum Abschluss.
// Grund: ein endlicher Tag mit klarem Ende (Ziel-Gradient), Identität statt Punkte. Nichts gespeichert.

// Zustand der Bühne wie in buehneHtml (Nachtragen = offen). Auch für die Startseite (Abschnitte mit wann 'vorFeuer').
function zustandJetzt(a) {
  const { jetzt, spiel, ui } = kx;
  if (nachtragModus()) return { zustand: 'offen', art: null, vergangenMs: 0 };
  const b = ui.buehne;
  const dauer = b && b.lesen ? { ...BUEHNE, [b.art]: buehneDauerMs(b.art, b.lesen) } : BUEHNE; // Lesezeiten (02.11.2026)
  return buehneZustand(a.heuteAntwort, b, spiel.fokus, K.tagKey(jetzt()), ablaufJetzt(b, Date.now()), dauer); // angehalten: Zeit steht
}
function feuerStand() {
  const { spiel } = kx;
  if (!LAGERFEUER.an) return null;
  try {
    const st = lagerfeuerStand(heldenHeute(), spiel.fokus, LAGERFEUER);
    return st.faellig && st.sprecher ? st : null;
  } catch (e) { console.warn('Lagerfeuer:', e.message); return null; }
}
// Brennt das Lagerfeuer gerade auf der Startseite? a = Auswertung des gewählten Helden.
export function lagerfeuerSichtbar(a) {
  return !!a && zustandJetzt(a).zustand === 'ruhe' && !!feuerStand();
}
// Satz des Abends: fest je Tag (logik/lagerfeuer.js), Platzhalter aus dem sprechenden Helden; ohne Sätze der Ersatztext.
function feuerSatz(id) {
  const { T, heldenAnsichten, jetzt, nameVon, stilWerte } = kx;
  const b = BOTSCHAFTEN.find(x => x.anlass === LAGERFEUER.anlass);
  const text = lagerfeuerSatz(b && b.texte, K.tagKey(jetzt()));
  if (!text) return T('feuer.ersatz');
  try {
    const h = heldenAnsichten().find(x => x.id === id);
    return I.fuelle(text, h ? I.werteFuer(h.a, jetzt(), h.v, TABELLE, nameVon, stilWerte()) : stilWerte());
  } catch (e) { console.warn('Lagerfeuer (Satz):', e.message); return I.fuelle(text, stilWerte()); }
}
// Wartet für diesen Helden ein Teil der Geschichte (Siegel)? Für den gewählten Helden wie in storyRuheHtml.
function storyWartet(id) {
  const { andeutungGesehen, heldenAnsichten, jetzt, nameVon, spiel, stilWerte, story } = kx;
  try {
    let st = null;
    if (id === spiel.fokus) st = story();
    else {
      const h = heldenAnsichten().find(x => x.id === id);
      st = h ? I.storyWoche(h.a, jetzt(), h.v, TABELLE, STORIES, nameVon, stilWerte()) : null;
    }
    const wartet = !!st && Array.isArray(st.teile) && I.storyZustaende(st).some(x => x.zustand === 'siegel');
    if (wartet && id === spiel.fokus) andeutungGesehen('story_siegel');
    return wartet;
  } catch (e) { console.warn('Lagerfeuer (Geschichte):', e.message); return false; }
}
// Version 141: Siegel je Antwort aus dem Register (daten/antworten.js)
const FEUER_SIEGEL = Object.fromEntries(Object.entries(ANTWORT_ARTEN).map(([id, a]) => [id, [a.siegel, a.symbol]]));
// haupt (Version 140): diese Zeile trägt den einen roten Knopf des Lagerfeuers (die erste wartende Geschichte). Rot heißt
// „die eine Hauptaktion dieses Moments“: die Tat ist erledigt, die Geschichte ist der natürliche nächste Schritt.
function feuerZeile(z, mitNamen, haupt = false) {
  const { T, nameVon, symbol } = kx;
  const name = nameVon(z.id);
  const s = FEUER_SIEGEL[z.art];
  const wartet = z.art === 'wartet'; // Startpaket (18a): Quest beginnt erst später
  const zeichen = s ? icon(symbol('siegel.' + s[0], s[1])) : icon(wartet ? 'sanduhr' : 'tasse');
  const wort = s ? T('siegel.' + s[0]) : wartet ? T('beginn.morgen') : T('feuer.ruhetag');
  const story = storyWartet(z.id) ? `<button class="lesen-knopf${haupt ? '' : ' leise'} feuer-knopf" data-a="feuer-story" data-id="${esc(z.id)}" aria-label="${esc(T('feuer.storyAria', { held: name }))}">${BUCH_SVG}${esc(T('feuer.story'))}</button>` : '';
  // Ändern nur für echte Antworten; ein Ruhetag wird über sein Blatt geändert (nach dem Wechsel zum Helden)
  const aendern = s ? `<button class="link feuer-aendern" data-a="feuer-aendern" data-id="${esc(z.id)}" aria-label="${esc(T('feuer.aendernAria', { held: name }))}">${esc(T('feuer.aendern'))}</button>` : '';
  return `<li class="feuer-zeile ${s ? s[0] : 'ruhetag'}"><span class="feuer-siegel" aria-hidden="true">${zeichen}</span>
    <span class="feuer-zeile-text">${mitNamen ? `<b>${esc(name)}</b>` : ''}<span>${esc(wort)}</span></span>${story}${aendern}</li>`;
}
// Glut als Zeichnung (kein Bild aus dem Bildspeicher): Holzscheite, drei Flammen, Funken. Farben aus dem Stil (--ac, --gut).
// Version 123: die Glut liegt im „Himmel“ (.feuer-himmel, Abendszene je Stil über Tokens --abend-*); jeder Text, auch der
// Titel, steht darunter auf der ruhigen Fläche des Stils (Rückmeldung 02.11.: Text immer auf ruhigem Grund).
const FEUER_SVG = `<svg class="feuer-glut" viewBox="0 0 120 80" aria-hidden="true">
  <ellipse class="feuer-schein" cx="60" cy="66" rx="54" ry="12"/>
  <path class="feuer-flamme f1" d="M60 64C46 60 44 44 52 34c1 8 6 10 8 10-3-10 2-22 12-28-3 10 4 16 7 24 3 10-4 22-19 24Z"/>
  <path class="feuer-flamme f2" d="M60 64c-8-2-10-10-6-16 1 4 4 6 6 6-1-6 2-11 7-14-1 6 3 9 4 13 1 6-3 10-11 11Z"/>
  <path class="feuer-holz" d="M28 70l60-10M32 60l58 12" stroke-linecap="round"/>
</svg>`;
// Auffrischung nach langer Pause (Version 159): leise Zeile am ersten guten Tag nach einer langen Pause (a.auffrischungHeute
// = Bonus-XP von heute, abgeleitet in logik/kern.js auswertung); sonst ''. Informativ, ohne Wertung (wie 'tat.erledigtJa').
function auffrischungHtml(a) {
  const xp = a && Number.isInteger(a.auffrischungHeute) ? a.auffrischungHeute : 0;
  return xp > 0 ? `<p class="buehne-reaktion art-auffrischung" role="status">${esc(kx.T('tat.auffrischung', { xp }))}</p>` : '';
}
function lagerfeuerHtml(st, a, antw, reaktion) {
  const { T, img, nameVon, spiel, ui } = kx;
  const titel = T('feuer.titel');
  const sprecher = nameVon(st.sprecher);
  // Was sonst nach der Antwort stünde, bleibt erreichbar, aber eingeklappt (2a): Haken, Stütz-Frage am Siegtag, Messziele
  // (wöchentlich messen bleibt am Abend leicht, 2b), Festhalten …
  const mehr = [stuetzenHakenHtml(), stuetzeBereitHtml(a), messzielKarte(), eintragLinks(antw, { nachtrag: true }), nachtragZusatz()].filter(x => String(x || '').trim()).join('');
  const offen = ui.feuerMehr === true;
  return `<div class="feuer-platz${ui.einmal.has('ruhe') ? ' neu' : ''}" role="group" aria-label="${esc(T('feuer.aria', { titel }))}">
    <div class="feuer-himmel"><div class="feuer-szene" aria-hidden="true">${FEUER_SVG}<span class="feuer-funken"><i></i><i></i><i></i><i></i><i></i></span></div></div>
    <span class="eyebrow feuer-titel">${esc(titel.toUpperCase())}</span>
    <div class="feuer-gruss"><span class="feuer-portraet">${img(st.sprecher, sprecher, 'held', 'cover', '')}</span>
      <p class="feuer-satz"><b>${esc(sprecher.toUpperCase())}</b>„${esc(feuerSatz(st.sprecher))}“</p></div>
    ${siegelleisteHtml(st.sprecher, 'feuer')}${st.sprecher === spiel.fokus ? ruheBilanzHtml(a) : ''}
    ${comebackHtml()}${auffrischungHtml(a)}${reaktion && reaktion.art === 'morgen' ? `<p class="buehne-reaktion art-morgen">${esc(reaktion.text)}</p>` : ''}
    <ul class="feuer-zeilen" aria-label="${esc(T('feuer.zeilenAria'))}">${(() => { const h = st.zeilen.findIndex(z => storyWartet(z.id)); return st.zeilen.map((z, i) => feuerZeile(z, st.mitNamen, i === h)).join(''); })()}</ul>
    ${mehr ? `<div class="feuer-mehr${offen ? ' offen' : ''}"><button class="link feuer-mehr-knopf" data-a="feuer-mehr" aria-expanded="${offen}">${esc(T('feuer.mehr'))}${icon('runter')}</button>${offen ? `<div class="feuer-mehr-liste">${mehr}</div>` : ''}</div>` : ''}
  </div>`;
}
// Wechsel zum Helden einer Zeile (wie die Tagesleiste, ohne Banner: es geht gleich weiter zur Geschichte bzw. zur Frage)
function feuerFokus(id) {
  const { T, render, setzeHinweis, setzeSpiel, speichere, spiel } = kx;
  if (!spiel.helden.some(h => h.heroId === id)) { console.warn('Lagerfeuer: Held fehlt', id); setzeHinweis(T('kopf.heldFehlt')); render(); return false; }
  if (id === spiel.fokus) return true;
  try {
    setzeSpiel(H.fokusSetzen(spiel, id)); speichere(); trackEvent('hero_focus', { held: id, quelle: 'lagerfeuer' });
    return true;
  } catch (e) { console.warn('Lagerfeuer (Fokus):', e.message); setzeHinweis(T('kopf.heldFehlt')); render(); return false; }
}

// ---------- Klicks der Kampfbühne (aus startseite.js, 02.11.2026) ----------
export const BUEHNE_KLICKS = {
  check({ id }) {
    const { check, jetzt, stand } = kx;
    const antwort = istAntwort(id) ? id : null;
    const art = antwortArt(antwort);
    let vorher = null;
    try { vorher = K.auswertung(stand, jetzt()).heuteAntwort || null; } catch (e) { vorher = null; }
    // Version 95: Hinweis nur für eine neue Antwort von heute (nicht für „Ändern“, nicht beim Nachtragen).
    // Seit 04.11.2026 vor check() gemerkt (Zeile in der Daumenleiste schon in der ersten Zeichnung); klappt die Antwort
    // nicht, wird er wieder geschlossen.
    // Version 141: „War schwer“ öffnet gleich den freiwilligen Eintrag; dort gibt es „Abbrechen“ und „Doch geschafft?“,
    // darum kein Rückgängig-Popup darüber (zwei Ebenen auf einmal wären zu viel). Ändern bleibt wie gewohnt.
    const mitEintrag = !!(art && art.eintrag);
    const neu = !!antwort && !vorher;
    if (neu && !mitEintrag) merkeRueckgaengig(antwort);
    check(antwort);
    if (!neu) return;
    let jetztAntwort = null;
    try { jetztAntwort = K.auswertung(kx.stand, jetzt()).heuteAntwort || null; } catch (e) { jetztAntwort = null; }
    if (mitEintrag) { if (jetztAntwort === antwort) oeffneEintrag(art.eintrag, { ausSiegel: antwort }); return; }
    if (jetztAntwort === antwort) zeigeRueckPopup(); else schliesseRueckgaengig();
  },
  // 04.11.2026: Rückgängig aus der Zeile in der Daumenleiste (das Popup hat einen eigenen Hörer)
  'rueck-gaengig'() { rueckgaengigMachen(); },
  // Lagerfeuer (Etappe 3, Teil C): „Noch etwas?“ auf- und zuklappen (nur diese Sitzung)
  'feuer-mehr'() { const { render, ui } = kx; ui.feuerMehr = !ui.feuerMehr; render(); },
  // Geschichte eines Helden lesen (wechselt zu ihm, damit die Geschichtsseite seine Woche zeigt)
  'feuer-story'({ id }) {
    const { geheZu, ui } = kx;
    if (!feuerFokus(id)) return;
    trackEvent('story_opened', { quelle: 'lagerfeuer' }); ui.storyOffen = null; geheZu('story');
  },
  // Antwort eines Helden ändern = wie „Ändern“ in der Bühne (check(null)); das Feuer erlischt, bis wieder alle fertig sind
  'feuer-aendern'({ id }) {
    const { check, ui } = kx;
    if (!feuerFokus(id)) return;
    ui.feuerMehr = false; schliesseRueckgaengig();
    check(null);
  },
  // Kampfbühne: „Rat für heute“ auf- und zuklappen (je Held, nur diese Sitzung)
  rat() {
    const { render, spiel, ui } = kx;
    ui.ratOffen = ui.ratOffen === spiel.fokus ? null : spiel.fokus;
    if (ui.ratOffen) trackEvent('advice_opened', {});
    else ui.nachtragWahl = false; // Version 174: die Tageswahl steht im Menü und schließt mit ihm
    render();
  }
};
