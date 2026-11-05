// Beständigkeit und Comeback in der Oberfläche (04.11.2026, Entscheidungen Abschnitt 37). Logik: logik/bestaendigkeit.js.
// - artText: Text je Zählweise (daten/zaehlweisen.js), dann je Zielart (daten/zielarten.js, `texte`), sonst der
//   allgemeine Schlüssel. Wirft nie.
// - comebackHtml: ruhige Zeile auf der Heldentat-Karte am ersten guten Tag nach einem schweren Tag (alle Zielarten).
// - bogenZeileHtml: leise Zeile im Heldenblatt (beste Folge nur bei Beständigkeit, Comebacks wenn mindestens eins).
// Tonregel: kein Rot, kein „Serie“, kein „Rückfall“; nichts davon ist eine Bedingung für einen Sieg.
import * as B from '../logik/bestaendigkeit.js';
import { eintraegeVon } from '../logik/eintraege.js';
import * as K from '../logik/kern.js';
import { hauptArt, hauptArtId, zaehltAntworten } from '../logik/teilziele.js';
import { ANTWORT_ARTEN, antwortArt, tageMit } from '../logik/antworten.js'; // Version 141: Antwort-Register
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

// Textschlüssel der Zielart des aktiven Helden für `teil` (z. B. 'frage'), sonst `standard`.
// Zählweisen (04.11.2026): Texte der Zählweise (Rhythmus, Wache) gehen vor den Texten der Zielart.
export function artSchluessel(teil, standard) {
  try {
    const zw = K.zaehlweiseHeute(kx.stand, K.tagKey(kx.jetzt())).texte;
    if (zw && typeof zw[teil] === 'string' && zw[teil]) return zw[teil];
    const t = hauptArt(kx.stand && kx.stand.quest).texte;
    return (t && typeof t[teil] === 'string' && t[teil]) || standard;
  } catch (e) { return standard; }
}
export function artText(teil, standard, werte = {}) { return kx.T(artSchluessel(teil, standard), werte); }
// Zeile nach der Antwort (Version 141, Register daten/antworten.js `erledigt`): „Heute {verb} …“, „Heute nicht gebraucht …“,
// „War schwer …“. Unbekannte Antwort → Text von „ja“ (wie bisher jede Antwort außer „nein“). f = Fähigkeit (verb).
export function erledigtText(antw, f) {
  const [teil, standard] = (antwortArt(antw) || ANTWORT_ARTEN.ja).erledigt;
  return artText(teil, standard, { verb: (f && f.verb) || '' });
}
// Zeichen davor: Haken für zählbare Antworten; „War schwer“ zeigt sein ruhiges Siegel-Symbol (kein Haken = kein „geschafft“).
export function erledigtIcon(antw) {
  const a = antwortArt(antw);
  return a && !a.zaehlbar ? icon(kx.symbol('siegel.' + a.siegel, a.symbol)) : icon('check');
}
export const istBestaendigkeit = () => { try { return hauptArtId(kx.stand && kx.stand.quest) === 'bestaendigkeit'; } catch (e) { return false; } };

// Schwere Tage für Comebacks: Einträge „schwer“ und (Version 141) Tage mit der Antwort „War schwer“.
function schwerTage() {
  const { spiel, stand } = kx;
  let aus = [];
  try { aus = eintraegeVon(spiel, spiel.fokus, { art: 'schwer' }).map(e => e.tag); } catch (e) { aus = []; }
  return [...aus, ...tageMit(stand && stand.tage, 'schwer')];
}

// Comeback des aktiven Helden am Tag heuteK (Standard: heute). Wirft nie.
export function comebackStand(heuteK) {
  const { jetzt, stand } = kx;
  try {
    const k = heuteK || K.tagKey(jetzt());
    return B.comebacks(stand.tage, zaehltAntworten(stand.quest), schwerTage(), k);
  } catch (e) { console.warn('Comeback:', e.message); return { anzahl: 0, heute: false, nachTagen: null }; }
}

export function comebackHtml() {
  const { T } = kx;
  const c = comebackStand();
  if (!c.heute) return '';
  const text = c.nachTagen === 1 ? T('cb.heuteGleich') : T('cb.heute', { n: c.nachTagen });
  return `<p class="buehne-reaktion art-comeback" role="status">${esc(text)}</p>`;
}

// Teile der Beständigkeits-Zeile (beste Folge, Comebacks) als Texte; leer = nichts zu zeigen. Wirft nie.
// Version 140: auch für die Bilanz im Ruhezustand der Bühne (Register FORTSCHRITT, Anzeige „bestaendigkeit“).
export function bogenTeile() {
  const { T, jetzt, stand } = kx;
  const teile = [];
  try {
    const heuteK = K.tagKey(jetzt());
    if (istBestaendigkeit()) {
      // Version 141 (Punkt 2a): „War schwer“ hält die Folge offen, ohne sie zu verlängern (kein Folgenretter, kein Bruch)
      const bruecken = [...K.ruhetageVon(stand), ...K.pausenVon(stand, heuteK), ...tageMit(stand.tage, 'bruecke', heuteK)];
      const n = B.besteFolge(stand.tage, zaehltAntworten(stand.quest), bruecken, heuteK);
      if (n >= 2) teile.push(T('bst.besteFolge', { n }));
    }
    const c = comebackStand(heuteK);
    if (c.anzahl > 0) teile.push(T(c.anzahl === 1 ? 'cb.zeileEins' : 'cb.zeile', { n: c.anzahl }));
  } catch (e) { console.warn('Heldenblatt (Beständigkeit):', e.message); return []; }
  return teile;
}
export function bogenZeileHtml() {
  const teile = bogenTeile();
  return teile.length ? `<p class="klein bogen-bestaendig">${esc(teile.join(' · '))}</p>` : '';
}
