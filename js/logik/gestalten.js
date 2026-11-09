// Gestalten und eigene Fähigkeiten (06.11.2026, Bosskette mit Bedingungen, Entscheidungen Abschnitt 44).
// Gestalt = eine Erscheinungsform eines Gegners, die man selbst benennt („im Stau“, „beim Abendessen“). Eigene Fähigkeit =
// ein weiterer Weg mit dem Satz „So geht es“, neben der Fähigkeit der Vorlage. Beides entsteht beim Eintragen einer
// Begegnung (ansicht/eintrag.js) und bleibt im Spielstand:
//   spiel.gestalten          { heroId: { gegnerId: [{ id, name }] } }
//   spiel.eigeneFaehigkeiten { heroId: [{ id, name, so }] }
// Fehlen die Felder (Altbestand), sind beide {} (es gab noch keine, nichts geht verloren).
// Psychologie: Wer seine Muster selbst benennt, erkennt sie früher wieder (Selbstbeobachtung, Transfer auf neue
// Situationen); eigene Wege stärken Autonomie mehr als vorgegebene. Darum freie Namen. Seit 06.11.2026 (Entscheidung)
// zusätzlich wenige Vorschläge je Gegner (bosse.md › „### Gestalten“): Beispiele erleichtern das Erinnern („ach, das war
// ja auch so eine“). Ein Vorschlag wird erst durch Antippen zur eigenen Gestalt; die freie Eingabe bleibt gleichwertig.
// Reine Funktionen ohne DOM; Bereinigen wirft nie, Anlegen wirft GestaltFehler mit verständlicher Meldung.
import { BEDINGUNG_OPT } from '../daten/bedingungen.js';

export class GestaltFehler extends Error {}
const HELD = /^[a-z0-9-]{1,40}$/;
const GEGNER = /^[a-z0-9-]{1,40}$/i;
const GID = /^g\d{1,4}$/;
const FID = /^e\d{1,4}$/;
const kopie = x => JSON.parse(JSON.stringify(x));
const istObjekt = x => !!x && typeof x === 'object' && !Array.isArray(x);

// Text auf eine Zeile, gekürzt; leer → ''.
export const bereinigeName = (roh, max) => (typeof roh === 'string' ? roh.replace(/\s+/g, ' ').trim().slice(0, max).trim() : '');
const gleich = (a, b) => a.toLocaleLowerCase('de') === b.toLocaleLowerCase('de');

// Gestalten beim Laden: unbekannte Helden, ungültige IDs, leere Namen und Doppelte fallen weg; höchstens gestaltenMax je
// Held und Gegner. opt.heroIds (Set) = Helden im Spielstand.
export function bereinigeGestalten(roh, { heroIds = null } = {}, opt = BEDINGUNG_OPT) {
  const aus = {};
  if (!istObjekt(roh)) return aus;
  for (const [hid, je] of Object.entries(roh)) {
    if (!HELD.test(hid) || (heroIds && !heroIds.has(hid)) || !istObjekt(je)) continue;
    const held = {};
    const ids = new Set();
    for (const [gid, liste] of Object.entries(je)) {
      if (!GEGNER.test(gid) || !Array.isArray(liste)) continue;
      const l = [];
      for (const x of liste) {
        const name = bereinigeName(x && x.name, opt.nameMax);
        if (!x || !GID.test(String(x.id)) || ids.has(x.id) || !name || l.some(y => gleich(y.name, name))) continue;
        ids.add(x.id);
        l.push({ id: x.id, name });
        if (l.length >= opt.gestaltenMax) break;
      }
      if (l.length) held[gid] = l;
    }
    if (Object.keys(held).length) aus[hid] = held;
  }
  return aus;
}

// Eigene Fähigkeiten beim Laden: wie oben, höchstens faehigkeitenMax je Held. „So geht es“ darf leer sein.
export function bereinigeEigeneFaehigkeiten(roh, { heroIds = null } = {}, opt = BEDINGUNG_OPT) {
  const aus = {};
  if (!istObjekt(roh)) return aus;
  for (const [hid, liste] of Object.entries(roh)) {
    if (!HELD.test(hid) || (heroIds && !heroIds.has(hid)) || !Array.isArray(liste)) continue;
    const l = [];
    for (const x of liste) {
      const name = bereinigeName(x && x.name, opt.nameMax);
      if (!x || !FID.test(String(x.id)) || l.some(y => y.id === x.id || gleich(y.name, name)) || !name) continue;
      l.push({ id: x.id, name, so: bereinigeName(x.so, opt.soMax) });
      if (l.length >= opt.faehigkeitenMax) break;
    }
    if (l.length) aus[hid] = l;
  }
  return aus;
}

export const gestaltenVon = (spiel, heroId, gegnerId) => ((spiel && istObjekt(spiel.gestalten) && istObjekt(spiel.gestalten[heroId]) && spiel.gestalten[heroId][gegnerId]) || []).slice();
export const eigeneFaehigkeitenVon = (spiel, heroId) => ((spiel && istObjekt(spiel.eigeneFaehigkeiten) && spiel.eigeneFaehigkeiten[heroId]) || []).slice();

const naechsteId = (praefix, belegt) => { let i = 1; while (belegt.has(`${praefix}${i}`)) i++; return `${praefix}${i}`; };
function heldPruefen(spiel, heroId) {
  if (!spiel || !Array.isArray(spiel.helden) || !spiel.helden.some(h => h.heroId === heroId)) throw new GestaltFehler('Unbekannter Held.');
}

// Neue Gestalt für Held und Gegner. Gleicher Name (ohne Groß-/Kleinschreibung) → die vorhandene, nichts ändert sich.
// Liefert { spiel, gestalt, neu }.
export function gestaltAnlegen(spiel, heroId, gegnerId, nameRoh, opt = BEDINGUNG_OPT) {
  heldPruefen(spiel, heroId);
  if (typeof gegnerId !== 'string' || !GEGNER.test(gegnerId)) throw new GestaltFehler('Unbekannter Gegner.');
  if (typeof nameRoh === 'string' && nameRoh.trim().length > opt.nameMax) throw new GestaltFehler(`Höchstens ${opt.nameMax} Zeichen.`);
  const name = bereinigeName(nameRoh, opt.nameMax);
  if (!name) throw new GestaltFehler('Wie zeigt er sich? Ein paar Worte reichen.');
  const liste = gestaltenVon(spiel, heroId, gegnerId);
  const da = liste.find(x => gleich(x.name, name));
  if (da) return { spiel, gestalt: da, neu: false };
  if (liste.length >= opt.gestaltenMax) throw new GestaltFehler(`Höchstens ${opt.gestaltenMax} Gestalten je Gegner.`);
  const belegt = new Set(Object.values((spiel.gestalten || {})[heroId] || {}).flat().map(x => x.id));
  const gestalt = { id: naechsteId('g', belegt), name };
  const s = kopie(spiel);
  s.gestalten = istObjekt(s.gestalten) ? s.gestalten : {};
  s.gestalten[heroId] = { ...(s.gestalten[heroId] || {}), [gegnerId]: [...liste, gestalt] };
  return { spiel: s, gestalt, neu: true };
}

// Neue eigene Fähigkeit. Gleicher Name → die vorhandene (ein neuer „So geht es“-Satz ersetzt dann einen leeren).
// Liefert { spiel, faehigkeit, neu }.
export function faehigkeitAnlegen(spiel, heroId, nameRoh, soRoh = '', opt = BEDINGUNG_OPT) {
  heldPruefen(spiel, heroId);
  if (typeof nameRoh === 'string' && nameRoh.trim().length > opt.nameMax) throw new GestaltFehler(`Höchstens ${opt.nameMax} Zeichen für den Namen.`);
  if (typeof soRoh === 'string' && soRoh.trim().length > opt.soMax) throw new GestaltFehler(`Höchstens ${opt.soMax} Zeichen für „So geht es“.`);
  const name = bereinigeName(nameRoh, opt.nameMax);
  if (!name) throw new GestaltFehler('Wie heißt dein Weg? Ein paar Worte reichen.');
  const so = bereinigeName(soRoh, opt.soMax);
  const liste = eigeneFaehigkeitenVon(spiel, heroId);
  const i = liste.findIndex(x => gleich(x.name, name));
  if (i >= 0) {
    if (liste[i].so || !so) return { spiel, faehigkeit: liste[i], neu: false };
    const s = kopie(spiel);
    s.eigeneFaehigkeiten[heroId][i].so = so;
    return { spiel: s, faehigkeit: s.eigeneFaehigkeiten[heroId][i], neu: false };
  }
  if (liste.length >= opt.faehigkeitenMax) throw new GestaltFehler(`Höchstens ${opt.faehigkeitenMax} eigene Fähigkeiten.`);
  const faehigkeit = { id: naechsteId('e', new Set(liste.map(x => x.id))), name, so };
  const s = kopie(spiel);
  s.eigeneFaehigkeiten = istObjekt(s.eigeneFaehigkeiten) ? s.eigeneFaehigkeiten : {};
  s.eigeneFaehigkeiten[heroId] = [...liste, faehigkeit];
  return { spiel: s, faehigkeit, neu: true };
}

// Vorschläge für das Blatt „geschafft“ (06.11.2026): Gestalten des Gegners (Register, bosse.md), die der Held noch nicht
// hat (ohne Groß-/Kleinschreibung), höchstens opt.vorschlaegeZeigen, in der Reihenfolge der Datei. Kein Zähler, keine
// „x von y entdeckt“: es sind Anstöße, keine Liste zum Vollmachen. Wirft nie.
export function gestaltVorschlaege(gegner, eigene, opt = BEDINGUNG_OPT) {
  const liste = gegner && Array.isArray(gegner.gestalten) ? gegner.gestalten : [];
  const vorhanden = (Array.isArray(eigene) ? eigene : []).map(x => (x && typeof x.name === 'string' ? x.name : ''));
  const aus = [];
  for (const roh of liste) {
    const name = bereinigeName(roh, opt.nameMax);
    if (!name || vorhanden.some(v => gleich(v, name)) || aus.some(v => gleich(v, name))) continue;
    aus.push(name);
    if (aus.length >= opt.vorschlaegeZeigen) break;
  }
  return aus;
}
