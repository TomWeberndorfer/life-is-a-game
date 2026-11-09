// Plan- und Warum-Check (Version 167): reine Funktionen ohne DOM und Uhr, werfen nie. Daten: daten/plancheck.js.
// Gespeichert wird nichts in einem eigenen Feld: Ein Check ist ein Eintrag der Art „plancheck“ (spiel.eintraege), also
// braucht der Spielstand kein neues Feld und Altbestand hat einfach noch keine Checks.
import { PLANCHECK } from '../daten/plancheck.js';
import { wennDann } from './startseite.js';

const liste = x => (Array.isArray(x) ? x.filter(e => e && typeof e === 'object') : []);
const TAG = /^\d{4}-\d{2}-\d{2}$/;
// Zeit eines Eintrags für den Vergleich: erstellt (ISO), sonst der Tag (alte oder kaputte Einträge)
const zeit = e => (typeof e.erstellt === 'string' && !Number.isNaN(Date.parse(e.erstellt)) ? new Date(e.erstellt).toISOString() : TAG.test(String(e.tag)) ? `${e.tag}T00:00:00.000Z` : null);

const nachWert = cfg => (Number.isInteger(cfg && cfg.nach) && cfg.nach >= 1 && cfg.nach <= 52 ? cfg.nach : 4);

// Alle Textschlüssel, die Karte, Seite und Logbuch brauchen.
export function plancheckSchluessel(cfg = PLANCHECK) {
  const k = ['lb.plancheck', 'pc.titel', 'pc.plan', 'pc.lead', 'pc.fuer', 'pc.zurueck', 'pc.fertig', 'pc.spaeter', 'pc.ueberspringen',
    'pc.wennDann.frage', 'pc.wennDann.satz', 'pc.wennDann.hinweis', 'pc.warum.frage', 'pc.warum.zeile', 'pc.warum.neu', 'pc.warum.hinweis',
    'pc.gespeichert', 'pc.gespeichertWarum', 'pc.uebersprungen', 'pc.fehler', 'pc.warumZuLang',
    'pc.karte.eyebrow', 'pc.karte.titel', 'pc.karte.text', 'pc.karte.pruefen', 'pc.karte.spaeter'];
  const a = (cfg && cfg.antworten) || {};
  for (const frage of Array.isArray(cfg && cfg.fragen) ? cfg.fragen : []) {
    for (const w of Array.isArray(a[frage]) ? a[frage] : []) k.push(`antwort.${frage}.${w}`, `antwort.lb.${frage}.${w}`);
  }
  return k;
}

// Konfiguration und Texte prüfen: Liste lesbarer Fehler, leer = in Ordnung.
export function pruefePlancheck(cfg = PLANCHECK, texte = {}, arten = null) {
  const f = [];
  if (!cfg || typeof cfg !== 'object') return ['Plan-Check: Daten fehlen'];
  if (typeof cfg.art !== 'string' || !/^[a-z]+$/.test(cfg.art)) f.push('Plan-Check: Art ungültig');
  if (!Number.isInteger(cfg.nach) || cfg.nach < 1 || cfg.nach > 52) f.push('Plan-Check: „nach“ muss eine ganze Zahl von 1 bis 52 sein');
  if (!Array.isArray(cfg.fragen) || !cfg.fragen.length) f.push('Plan-Check: Fragen fehlen');
  if (!cfg.antworten || typeof cfg.antworten !== 'object') f.push('Plan-Check: Antworten fehlen');
  else {
    for (const frage of Array.isArray(cfg.fragen) ? cfg.fragen : []) {
      const w = cfg.antworten[frage];
      if (!/^[a-z]+$/.test(String(frage))) f.push(`Plan-Check: Frage „${frage}“ ungültig`);
      if (!Array.isArray(w) || !w.length || w.some(x => typeof x !== 'string' || !/^[a-z]+$/.test(x))) f.push(`Plan-Check: Antworten für „${frage}“ ungültig`);
    }
    for (const [nm, liste2] of [['plan', cfg.plan], ['warumNeu', cfg.warumNeu]]) {
      const erlaubt = nm === 'plan' ? cfg.antworten.wenndann : cfg.antworten.warum;
      if (!Array.isArray(liste2) || liste2.some(x => !Array.isArray(erlaubt) || !erlaubt.includes(x))) f.push(`Plan-Check: „${nm}“ nennt unbekannte Antworten`);
    }
  }
  if (typeof cfg.merkmalHeute !== 'string' || !/^[a-z_]+$/.test(cfg.merkmalHeute)) f.push('Plan-Check: Merkmal ungültig');
  for (const k of plancheckSchluessel(cfg)) if (typeof texte[k] !== 'string' || !texte[k].trim()) f.push(`Plan-Check: Text fehlt: ${k}`);
  if (arten) {
    const a = arten[cfg.art];
    if (!a) f.push(`Plan-Check: Eintragsart ${cfg.art} fehlt`);
    else if (!a.plan) f.push('Plan-Check: die Eintragsart braucht einen Plan („plan“)');
  }
  return f;
}

// Wie viele Rückblicke seit dem letzten Check besprochen wurden und ob der nächste Check fällig ist.
// eintraege = spiel.eintraege (alle Helden). Rückblicke ohne gültige Zeit zählen nicht; ohne bisherigen Check zählen alle.
// Liefert { faellig, anzahl, noetig }. Wirft nie.
export function plancheckFaellig(eintraege, cfg = PLANCHECK) {
  const alle = liste(eintraege);
  const art = cfg && typeof cfg.art === 'string' ? cfg.art : PLANCHECK.art;
  const noetig = nachWert(cfg);
  const checks = alle.filter(e => e.art === art).map(zeit).filter(Boolean).sort();
  const letzter = checks.length ? checks[checks.length - 1] : null;
  const anzahl = alle.filter(e => e.art === 'rueckblick').map(zeit).filter(z => z && (!letzter || z > letzter)).length;
  return { faellig: anzahl >= noetig, anzahl, noetig };
}

// Was der Check dem Helden zeigt: Wenn-dann aus der Vorlage seiner Quest, eigenes Warum.
//   quest    Quest des Helden (vorlageId, warum); tabelle  { vorlagen: [], faehigkeiten: {} }
// Fehlt etwas, bleibt das Feld leer: Eine Frage ohne Gegenstand wird nicht gestellt (Entscheidung 08.11.2026).
export function planDaten(quest, tabelle) {
  const v = quest && tabelle && Array.isArray(tabelle.vorlagen) ? tabelle.vorlagen.find(z => z && z.id === quest.vorlageId) : null;
  const f = v && tabelle.faehigkeiten ? tabelle.faehigkeiten[v.faehigkeit] : null;
  const wd = f ? wennDann(f) : { wenn: '', dann: '' };
  const warum = quest && typeof quest.warum === 'string' ? quest.warum.replace(/\s+/g, ' ').trim() : '';
  return { wenn: wd.wenn, dann: wd.dann, warum, hatWennDann: !!(wd.wenn && wd.dann), hatWarum: !!warum };
}

// Fragen, die für diese Daten gestellt werden (Reihenfolge wie cfg.fragen).
export function fragenFuer(daten, cfg = PLANCHECK) {
  const d = daten || {};
  const gilt = { wenndann: !!d.hatWennDann, warum: !!d.hatWarum };
  return (Array.isArray(cfg && cfg.fragen) ? cfg.fragen : []).filter(f => gilt[f]);
}

// Eingabe für eintragHinzufuegen aus den Antworten der Seite.
//   wahl  { wenndann, warum, plan }  (alles optional; Unbekanntes wird ignoriert)
// Der Plan gehört nur dazu, wenn das Wenn-dann „manchmal“ oder „nein“ hieß und Text da ist.
export function eintragEingabe(wahl, cfg = PLANCHECK) {
  const w = wahl && typeof wahl === 'object' ? wahl : {};
  const antworten = {};
  for (const frage of cfg.fragen) if (Array.isArray(cfg.antworten[frage]) && cfg.antworten[frage].includes(w[frage])) antworten[frage] = w[frage];
  const e = { art: cfg.art, antworten };
  const plan = typeof w.plan === 'string' ? w.plan.trim() : '';
  if (plan && cfg.plan.includes(antworten.wenndann)) e.naechstesMal = plan;
  return e;
}

// Neues Warum aus dem Feld der Seite. alt = bisheriges Warum. Leer oder unverändert → keine Änderung (nie versehentlich löschen).
// Liefert { aendern, warum, fehler }: fehler nur bei zu langem Text (max = WARUM_MAX aus kern.js).
export function warumAenderung(alt, neu, max = 200) {
  const norm = t => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim() : '');
  const n = norm(neu);
  if (!n || n === norm(alt)) return { aendern: false, warum: null, fehler: null };
  if (n.length > max) return { aendern: false, warum: null, fehler: 'zu lang' };
  return { aendern: true, warum: n, fehler: null };
}

// Detailzeile fürs Logbuch aus den Antworten eines Eintrags (Texte holt die Ansicht): Liste von [frage, wert].
export function antwortPaare(antworten, cfg = PLANCHECK) {
  const a = antworten && typeof antworten === 'object' ? antworten : {};
  return cfg.fragen.filter(f => Array.isArray(cfg.antworten[f]) && cfg.antworten[f].includes(a[f])).map(f => [f, a[f]]);
}
