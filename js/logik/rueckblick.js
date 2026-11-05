// Rundenrückblick (Etappe 2, Schritt D, 02.11.2026): reine Funktionen ohne Oberfläche. Einstellungen: daten/rueckblick.js.
// Besprochen ist eine Runde, sobald es einen Eintrag der Art „rueckblick“ mit bezug = Rundenbeginn gibt (auch übersprungen).
// Darum braucht der Spielstand kein neues Feld: Altbestand hat einfach noch keine Rückblicke, und alte Runden fallen
// über das Zeitfenster weg.
import * as K from './kern.js';
import { hauptAnzahl } from './teilziele.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const plus = (k, n) => { const d = K.ausTagKey(k); d.setDate(d.getDate() + n); return K.tagKey(d); };
const liste = x => (Array.isArray(x) ? x.filter(e => e && typeof e === 'object') : []);

// Ergebnis einer Runde: 'stark' (gewonnen), 'gemischt' (mindestens schwelle × Ziel) oder 'schwer'.
export function ergebnisArt(sieg, anwendungen, ziel, schwelle = 0.5) {
  if (sieg) return 'stark';
  const n = Number.isInteger(anwendungen) && anwendungen > 0 ? anwendungen : 0;
  const z = Number.isInteger(ziel) && ziel > 0 ? ziel : 1;
  const s = typeof schwelle === 'number' && schwelle >= 0 && schwelle <= 1 ? schwelle : 0.5;
  return n >= s * z && n > 0 ? 'gemischt' : 'schwer';
}

// Briefpapier des Rückblicks (Version 123, Entscheidung 7a): Zierrand und Siegelglanz nur nach einem Sieg. Nach einer
// gemischten oder schweren Runde bleibt der Brief ruhig, damit er nicht wie ein Trostpreis wirkt. Nur echtes true zählt;
// fehlende oder kaputte Runde → false (schlicht ist der sichere Rückfall).
export function briefMitSchmuck(runde) {
  return !!runde && typeof runde === 'object' && runde.sieg === true;
}

// Runde, die heute besprochen werden darf, oder null. stand = Heldenansicht (helden.ansicht, mit ruhetage/neustarts),
// eintraege = Einträge dieses Helden. Nur die zuletzt beendete Runde (Ende vor heute; der Siegtag selbst gehört der Feier),
// nicht nach einem Neuanfang, nicht älter als fensterTage, nicht schon besprochen, nicht nach „Willkommen zurück“.
export function faelligeRunde(stand, heuteK, eintraege, cfg) {
  if (!stand || !stand.quest || !TAG.test(String(heuteK)) || !K.ausTagKey(heuteK)) return null;
  const { runden } = K.runden(stand, heuteK);
  const fertig = runden.filter(r => r.bis < heuteK);
  const r = fertig[fertig.length - 1];
  if (!r || r.neustart) return null;
  const fenster = Number.isInteger(cfg && cfg.fensterTage) && cfg.fensterTage >= 0 ? cfg.fensterTage : 3;
  if (r.bis < plus(heuteK, -(fenster + 1))) return null;
  const eigene = liste(eintraege);
  if (eigene.some(e => e.art === 'rueckblick' && e.bezug === r.von)) return null;
  const ruhig = Array.isArray(cfg && cfg.ruhigNach) ? cfg.ruhigNach : [];
  if (eigene.some(e => ruhig.includes(e.art) && typeof e.tag === 'string' && e.tag > r.bis && e.tag <= heuteK)) return null;
  const ziel = K.rundenZiel(stand.quest, r.siegeVorher, r.nr);
  return {
    nr: r.nr, von: r.von, bis: r.bis, gegner: r.gegner, sieg: !!r.sieg, anwendungen: r.anwendungen, ziel,
    ergebnis: ergebnisArt(!!r.sieg, r.anwendungen, ziel, cfg && cfg.schwelle)
  };
}

// Siegel je Tag der Runde: [{ tag, siegel }] mit siegel aus reihenfolge (treffer, ruhig, ruhetag, schwer) oder 'leer'.
export function rundenSiegel(stand, runde, eintraege, reihenfolge = ['treffer', 'ruhig', 'ruhetag', 'schwer']) {
  if (!runde || !TAG.test(String(runde.von)) || !TAG.test(String(runde.bis)) || runde.bis < runde.von) return [];
  const tage = (stand && stand.tage) || {};
  const ruhe = new Set(K.ruhetageVon(stand || {}));
  const schwer = new Set(liste(eintraege).filter(e => e.art === 'schwer').map(e => e.tag));
  const gilt = {
    treffer: t => tage[t] === 'ja',
    ruhig: t => tage[t] === 'nein',
    ruhetag: t => ruhe.has(t),
    schwer: t => schwer.has(t) || tage[t] === 'schwer' // Version 141: auch die Antwort „War schwer“
  };
  const aus = [];
  for (let t = runde.von, i = 0; t <= runde.bis && i < 400; t = plus(t, 1), i++) {
    const s = reihenfolge.find(id => gilt[id] && gilt[id](t));
    aus.push({ tag: t, siegel: s || 'leer' });
  }
  return aus;
}

// Viele ruhige Tage (Version 146, Bewertung 05.11.2026 Punkt 12): true, wenn in den Siegeln der Runde (rundenSiegel)
// mindestens `ab` Tage „ruhig“ (Keine Versuchung) sind. Dann fragt der Brief ohne Wertung nach, ob der Moment wirklich
// nicht kam. Psychologie: „Keine Versuchung“ kostet nichts und lässt sich kaum prüfen; eine leise Frage hält die
// Selbstbeobachtung ehrlich, ohne Misstrauen oder Folgen. ab: ganze Zahl 1–31, 0 oder ungültig = aus. Wirft nie.
export function vieleRuhige(tage, ab) {
  if (!Number.isInteger(ab) || ab < 1 || ab > 31 || !Array.isArray(tage)) return false;
  return tage.filter(t => t && t.siegel === 'ruhig').length >= ab;
}

// Eigene Notizen aus der Runde als Chips: Einträge der notizArten mit Text oder Plan, neueste zuerst, höchstens max.
// Ergebnis [{ id, text }] – text gekürzt auf zeichen (mit „…“).
export function rundenNotizen(eintraege, runde, cfg) {
  if (!runde) return [];
  const arten = Array.isArray(cfg && cfg.notizArten) ? cfg.notizArten : [];
  const max = Number.isInteger(cfg && cfg.notizenMax) && cfg.notizenMax >= 0 ? cfg.notizenMax : 6;
  const z = Number.isInteger(cfg && cfg.chipZeichen) && cfg.chipZeichen >= 8 ? cfg.chipZeichen : 40;
  // Kürzen am Wortende (wenn es nicht zu früh liegt), damit kein halbes Wort im Chip steht
  const kurz = t => {
    const s = String(t).replace(/\s+/g, ' ').trim();
    if (s.length <= z) return s;
    let k = s.slice(0, z - 1);
    const leer = k.lastIndexOf(' ');
    if (leer > z / 2) k = k.slice(0, leer);
    return `${k.replace(/[\s,.;:–-]+$/, '')}…`;
  };
  return liste(eintraege)
    .filter(e => arten.includes(e.art) && typeof e.tag === 'string' && e.tag >= runde.von && e.tag <= runde.bis && (e.text || e.naechstesMal))
    .sort((a, b) => (a.tag < b.tag ? 1 : a.tag > b.tag ? -1 : String(b.erstellt || '').localeCompare(String(a.erstellt || ''))))
    .slice(0, max)
    .map(e => ({ id: e.id, text: kurz(e.text || e.naechstesMal) }));
}

// Vorschlag zur Einschätzung. eigenes = eigenes Ziel (neuester Wert), rundenZiel = Ziel der besprochenen Runde.
// Ergebnis { anzahl, grund }: anzahl = neues eigenes Ziel oder null; grund: 'aendern' | 'gleich' (Passt) | 'max' | 'min' |
// 'steigt' (Einstiegsrampe hebt das Rundenziel ohnehin, das eigene Ziel liegt schon höher). Wirft nie.
export function vorschlag(wahl, eigenes, rundenZiel, { min = K.ANZAHL_MIN, max = K.ANZAHL_MAX, schritt = 1 } = {}) {
  const st = Number.isInteger(schritt) && schritt > 0 ? schritt : 1;
  const e = Number.isInteger(eigenes) ? eigenes : null;
  const z = Number.isInteger(rundenZiel) ? rundenZiel : e;
  if (wahl === 'passt' || e === null || z === null) return { anzahl: null, grund: 'gleich' };
  if (wahl === 'leicht') {
    const neu = z + st;
    if (neu > max) return { anzahl: null, grund: 'max' };
    if (neu <= e) return { anzahl: null, grund: 'steigt' };
    return { anzahl: neu, grund: 'aendern' };
  }
  if (wahl === 'schwer') {
    const neu = Math.min(z, e) - st;
    if (neu < min) return { anzahl: null, grund: 'min' };
    return { anzahl: neu, grund: 'aendern' };
  }
  return { anzahl: null, grund: 'gleich' };
}

// Eigenes Ziel der Quest (neuester Wert, auch wenn die Änderung erst ab der nächsten Runde gilt).
export const eigenesZiel = quest => (quest ? hauptAnzahl(quest) : null);

// Vorschlag übernehmen: nutzt K.questBearbeiten (Zähler-Regel: sofort, solange die laufende Runde keinen Treffer hat,
// sonst ab der nächsten Runde). Ergebnis wie questBearbeiten; wirft bei ungültiger Anzahl.
export function uebernehmeAnzahl(stand, anzahl, heute) {
  if (!stand || !stand.quest) throw new Error('Es gibt noch keine Quest.');
  return K.questBearbeiten(stand, { ziel: stand.quest.ziel, anzahl }, heute);
}
