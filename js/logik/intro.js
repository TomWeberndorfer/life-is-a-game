// Welten-Intro (Version 175): wann es läuft, was läuft, und die Prüfung der Daten. Reine Funktionen ohne DOM und Uhr.
// Daten: daten/intro.js, Oberfläche: ansicht/intro.js. Spielstand-Feld `introGesehen` (neues Spiel nein, Altbestand ja).
// Grundsatz: Das Intro darf nie etwas kaputt machen oder blockieren. Kaputte Daten fallen auf die schlichte Aufblende zurück,
// waehleIntro wirft nie. Im Zweifel lieber kein Intro als ein Intro, das jeden Start wiederholt.
import { INTRO, INTRO_EFFEKTE } from '../daten/intro.js';

export class IntroFehler extends Error {}

const TOKEN = /^--[a-z][a-z0-9-]*$/;
const GROESSE = /^\d{1,3}(\.\d+)?px$/;
export const TITEL_ANIMATIONEN = Object.freeze(['weich', 'flackern', 'stufen']);
const STANDARD = { dauerMs: 2800, minMs: 800, maxMs: 4000, reduziertMs: 600, ausblendMs: 350, ueberspringenMs: 200, fallback: 'aufblende' };

const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const hat = (o, k) => obj(o) && Object.prototype.hasOwnProperty.call(o, k);
const zahl = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

// Altbestand-Regel für das Spielstand-Feld: nur ein ausdrückliches `false` (neues Spiel) bleibt „noch nicht gesehen“.
// Fehlt das Feld (Stand von vor Version 175) oder ist es ungültig → gesehen, damit niemand ein altes Spiel mit Intro startet
// und ein kaputtes Feld nie jeden Start wiederholt.
export const bereinigeIntroGesehen = roh => roh !== false;

// Läuft das Intro jetzt? Nur im ersten Öffnen: Feld ausdrücklich „nein“ und noch kein Held.
export const introFaellig = spiel => obj(spiel) && spiel.introGesehen === false && !(Array.isArray(spiel.helden) && spiel.helden.length > 0);

// Kopie des Spielstands mit gesetztem Merker. Wirft IntroFehler bei ungültigem Spielstand (Programmierfehler).
export function introMarkieren(spiel) {
  if (!obj(spiel)) throw new IntroFehler('Intro: kein Spielstand');
  return { ...spiel, introGesehen: true };
}

// Was läuft für diesen Stil? opt = { reduziert, effekte (in der Oberfläche vorhandene Effekte), meta (Register) }.
// Liefert immer ein vollständiges Ergebnis: { stil, effekt, dauerMs, ausblendMs, ueberspringenMs, farben, satz, titel,
// titelAnim, titelGroesse, reduziert }. Unbekannter Stil, fehlender oder unbekannter Effekt, kaputte Zahlen → Aufblende bzw. Standard.
export function waehleIntro(cfg, stilId, opt = {}) {
  const c = obj(cfg) ? cfg : INTRO;
  const meta = obj(opt.meta) ? opt.meta : INTRO_EFFEKTE;
  const erlaubt = Array.isArray(opt.effekte) ? opt.effekte : Object.keys(meta);
  const fallback = typeof c.fallback === 'string' && hat(meta, c.fallback) ? c.fallback : STANDARD.fallback;
  const min = zahl(c.minMs, 100, 10000) ? c.minMs : STANDARD.minMs;
  const max = zahl(c.maxMs, min, 20000) ? c.maxMs : Math.max(STANDARD.maxMs, min);
  const standardDauer = zahl(c.dauerMs, min, max) ? c.dauerMs : Math.min(Math.max(STANDARD.dauerMs, min), max);
  const reduziert = opt.reduziert === true;
  const e = hat(c.stile, stilId) && obj(c.stile[stilId]) ? c.stile[stilId] : null;

  let effekt = e && typeof e.effekt === 'string' && hat(meta, e.effekt) && erlaubt.includes(e.effekt) ? e.effekt : fallback;
  if (reduziert) effekt = fallback;
  if (!hat(meta, effekt)) effekt = STANDARD.fallback;

  const dauer = reduziert
    ? (zahl(c.reduziertMs, 100, 3000) ? c.reduziertMs : STANDARD.reduziertMs)
    : (e && typeof e.dauerMs === 'number' && Number.isFinite(e.dauerMs) ? Math.round(Math.min(max, Math.max(min, e.dauerMs))) : standardDauer);

  const standardFarben = obj(meta[effekt]) && obj(meta[effekt].farben) ? meta[effekt].farben : { abdeckung: '--nacht' };
  const farben = {};
  for (const [platz, std] of Object.entries(standardFarben)) {
    const eigen = e && obj(e.farben) ? e.farben[platz] : undefined;
    farben[platz] = typeof eigen === 'string' && TOKEN.test(eigen) ? eigen : std;
  }

  return {
    stil: typeof stilId === 'string' ? stilId : null,
    effekt,
    dauerMs: Math.round(dauer),
    ausblendMs: zahl(c.ausblendMs, 0, 2000) ? Math.round(c.ausblendMs) : STANDARD.ausblendMs,
    ueberspringenMs: zahl(c.ueberspringenMs, 0, 1000) ? Math.round(c.ueberspringenMs) : STANDARD.ueberspringenMs,
    farben,
    satz: !reduziert && e && typeof e.satz === 'string' ? e.satz.trim() : '',
    titel: !reduziert && typeof c.titel === 'string' ? c.titel.trim() : '',
    titelAnim: e && TITEL_ANIMATIONEN.includes(e.titelAnim) ? e.titelAnim : 'weich',
    titelGroesse: e && typeof e.titelGroesse === 'string' && GROESSE.test(e.titelGroesse) ? e.titelGroesse : '',
    reduziert
  };
}

// Daten prüfen: Liste lesbarer Fehler, leer = in Ordnung. stilIds = bekannte Stile (optional, meldet Einträge für unbekannte Stile).
// Ein Stil OHNE Eintrag ist erlaubt (Aufblende) und wird nicht gemeldet. Wirft nie.
export function pruefeIntro(cfg, meta = INTRO_EFFEKTE, stilIds = null, effekteVorhanden = null) {
  const f = [];
  if (!obj(cfg)) return ['Intro: Daten fehlen'];
  if (!obj(meta)) return ['Intro: Effekt-Register fehlt'];
  if (typeof cfg.titel !== 'string' || !cfg.titel.trim()) f.push('Intro: Titel fehlt');
  if (typeof cfg.fallback !== 'string' || !hat(meta, cfg.fallback)) f.push('Intro: fallback muss ein Effekt aus dem Register sein');
  if (!zahl(cfg.minMs, 100, 10000)) f.push('Intro: minMs ungültig');
  if (!zahl(cfg.maxMs, 100, 20000) || (zahl(cfg.minMs, 100, 10000) && cfg.maxMs < cfg.minMs)) f.push('Intro: maxMs ungültig');
  if (!zahl(cfg.dauerMs, cfg.minMs, cfg.maxMs)) f.push('Intro: dauerMs muss zwischen minMs und maxMs liegen');
  if (!zahl(cfg.reduziertMs, 100, 3000)) f.push('Intro: reduziertMs ungültig (100 bis 3000)');
  if (!zahl(cfg.ausblendMs, 0, 2000)) f.push('Intro: ausblendMs ungültig (0 bis 2000)');
  if (!zahl(cfg.ueberspringenMs, 0, 1000)) f.push('Intro: ueberspringenMs ungültig (0 bis 1000)');
  for (const [id, m] of Object.entries(meta)) {
    if (!obj(m) || !obj(m.farben) || !Object.keys(m.farben).length) { f.push(`Intro-Effekt „${id}“: farben fehlt`); continue; }
    for (const [platz, t] of Object.entries(m.farben)) if (!TOKEN.test(String(t))) f.push(`Intro-Effekt „${id}“: Farbplatz „${platz}“ braucht einen Token wie --nacht`);
  }
  if (Array.isArray(effekteVorhanden)) {
    for (const id of Object.keys(meta)) if (!effekteVorhanden.includes(id)) f.push(`Intro-Effekt „${id}“: keine Funktion in der Oberfläche`);
    for (const id of effekteVorhanden) if (!hat(meta, id)) f.push(`Intro-Effekt „${id}“: Funktion ohne Eintrag im Register`);
  }
  if (!obj(cfg.stile)) { f.push('Intro: stile fehlt'); return f; }
  for (const [stil, e] of Object.entries(cfg.stile)) {
    const wo = `Intro „${stil}“`;
    if (Array.isArray(stilIds) && !stilIds.includes(stil)) f.push(`${wo}: unbekannter Stil`);
    if (!obj(e)) { f.push(`${wo}: kein Eintrag`); continue; }
    if (typeof e.effekt !== 'string' || !hat(meta, e.effekt)) f.push(`${wo}: unbekannter Effekt „${e.effekt}“`);
    if (e.dauerMs !== undefined && !zahl(e.dauerMs, cfg.minMs, cfg.maxMs)) f.push(`${wo}: dauerMs muss zwischen ${cfg.minMs} und ${cfg.maxMs} liegen`);
    if (e.satz !== undefined && (typeof e.satz !== 'string' || e.satz.length > 80)) f.push(`${wo}: satz muss ein Text bis 80 Zeichen sein`);
    if (e.titelAnim !== undefined && !TITEL_ANIMATIONEN.includes(e.titelAnim)) f.push(`${wo}: titelAnim muss ${TITEL_ANIMATIONEN.join(', ')} sein`);
    if (e.titelGroesse !== undefined && !GROESSE.test(String(e.titelGroesse))) f.push(`${wo}: titelGroesse braucht eine Größe in px, z. B. 32px`);
    if (e.farben !== undefined) {
      const plaetze = hat(meta, e.effekt) && obj(meta[e.effekt].farben) ? Object.keys(meta[e.effekt].farben) : [];
      if (!obj(e.farben)) f.push(`${wo}: farben muss ein Objekt sein`);
      else for (const [platz, t] of Object.entries(e.farben)) {
        if (!plaetze.includes(platz)) f.push(`${wo}: Farbplatz „${platz}“ gibt es bei diesem Effekt nicht`);
        else if (!TOKEN.test(String(t))) f.push(`${wo}: Farbplatz „${platz}“ braucht einen Token wie --nacht`);
      }
    }
  }
  return f;
}
