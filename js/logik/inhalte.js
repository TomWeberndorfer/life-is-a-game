// Auswahl der täglichen Inhalte. Reine Funktionen; Texte kommen aus daten/inhalte.js.
import { tagKey, ausTagKey, auswertung } from './kern.js';

// Stabiler Zahlenwert je Text (gleicher Tag → gleiche Variante, jeden Tag eine andere).
export function streuwert(text) {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

const ARTIKEL = { Der: 'm', Die: 'f', Das: 'n' };
const FUERWORT = { m: { er: 'er', ihn: 'ihn' }, f: { er: 'sie', ihn: 'sie' }, n: { er: 'es', ihn: 'es' } };

// Nominativ für Fließtext und Genus für Fürwörter.
export function gegnerFormen(g) {
  const m = /^(Der|Die|Das) (.+)$/.exec(g.name || '');
  const genus = m ? ARTIKEL[m[1]] : (g.genus || 'm');
  const nom = m ? `${m[1].toLowerCase()} ${m[2]}` : (g.kurz || g.name || 'der Gegner');
  return { nom, genus, ...FUERWORT[genus] };
}

const gross = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function fuelle(text, w) {
  return String(text).replace(/\{(\w+)\}/g, (all, k) => {
    if (k === 'Gegner') return gross(w.gegner);
    if (k === 'Er') return gross(w.er);
    return w[k] !== undefined && w[k] !== null ? String(w[k]) : all;
  });
}

// Platzhalter aus den Wörtern des Stils (Version 64): z. B. {stadtname} = Talwacht / Station Aurora / Neon City.
// Neuer Platzhalter = Wort in stile.js (wort.<name>) + Name hier. app.js liefert die Werte (stilWerte).
export const STIL_PLATZHALTER = ['stadtname'];
// Alle Platzhalter, die werteFuer() füllt (eine Liste für Geschichten, Botschaften und Boss-Reaktionen, Version 68).
export const TEXT_PLATZHALTER = ['verbuendeter', 'faehigkeit', 'ziel', 'n', 'anzahl', 'rest', 'gegner', 'Gegner', 'er', 'Er', 'ihn', ...STIL_PLATZHALTER];

export function werteFuer(stand, heute, vorlage, tabelle, nameVon = id => (tabelle.helden[id] ? tabelle.helden[id].name : id), stilWerte = {}) {
  const a = auswertung(stand, heute);
  const g = gegnerFormen(tabelle.gegner[vorlage.gegner]);
  return {
    verbuendeter: nameVon(vorlage.held),
    faehigkeit: tabelle.faehigkeiten[vorlage.faehigkeit].name,
    ziel: stand.quest ? stand.quest.ziel : '',
    n: a.wocheZaehler, anzahl: a.anzahl, rest: Math.max(0, a.anzahl - a.wocheZaehler),
    gegner: g.nom, er: g.er, ihn: g.ihn,
    // nur bekannte Stil-Platzhalter mit echtem Text; fehlt einer, bleibt {name} sichtbar (fällt im Test auf, statt still zu fehlen)
    ...Object.fromEntries(STIL_PLATZHALTER.filter(k => stilWerte && typeof stilWerte[k] === 'string' && stilWerte[k].trim()).map(k => [k, stilWerte[k]]))
  };
}

function plusTage(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12); return x; }

// Welcher Anlass gilt heute? (Reihenfolge wie in BOTSCHAFTEN)
export function anlass(stand, heute) {
  if (!stand.quest) return 'sonst';
  const a = auswertung(stand, heute);
  const k = tagKey(heute);
  const gestern = tagKey(plusTage(heute, -1));
  const start = stand.quest.start;
  if (start === k) return 'erster_tag';
  if (a.neuerGegner && (a.siegHeute || a.rundeTag <= 0)) return 'neuer_gegner';
  if (a.siegHeute) return 'besiegt';
  if (a.anzahl - a.wocheZaehler === 1) return 'fast';
  // Erster Tag einer neuen Runde (Anlass-IDs „montag…“ aus Version 5 beibehalten)
  if (a.rundeTag === 0 && a.wocheNr > 1) return a.vorigeGewonnen ? 'montag_sieg' : 'montag';
  if (stand.tage[gestern] === 'ja') return 'gestern_ja';
  if (stand.tage[gestern] === 'nein') return 'gestern_nein';
  if (start && start < gestern) return 'pause';
  return 'sonst';
}

// anlassFest (Version 68): Anlass vorgeben statt ermitteln, z. B. 'besiegt' am Siegtag, solange der neue Gegner verborgen bleibt.
export function botschaft(stand, heute, vorlage, tabelle, botschaften, nameVon, stilWerte, anlassFest = null) {
  const an = typeof anlassFest === 'string' && anlassFest ? anlassFest : anlass(stand, heute);
  const eintrag = botschaften.find(b => b.anlass === an) || botschaften.find(b => b.anlass === 'sonst');
  if (!eintrag || !eintrag.texte.length) return { anlass: an, text: '' };
  const i = streuwert(tagKey(heute) + an) % eintrag.texte.length;
  return { anlass: an, text: fuelle(eintrag.texte[i], werteFuer(stand, heute, vorlage, tabelle, nameVon, stilWerte)) };
}

// Text eines Story-Teils (Version 47). `text` ist ein String (eine Fassung) oder { ja, nein }:
// ja = nach „Ja, geschafft“, nein = nach „Heute nicht gebraucht“. Beide erzählen dieselben Tatsachen.
// Rückfall: fehlt die Fassung zur Antwort (oder ist der Tag noch offen), gilt `ja`, sonst die erste vorhandene.
export function storyText(teil, antwort) {
  const t = teil && teil.text;
  if (typeof t === 'string') return t;
  if (!t || typeof t !== 'object') return '';
  const passt = v => typeof v === 'string' && v.trim();
  if (passt(t[antwort])) return t[antwort];
  if (passt(t.ja)) return t.ja;
  return Object.values(t).find(passt) || '';
}

// Story der laufenden Woche: Woche 1 je Gegner, danach die allgemeine Woche.
// Je Tag mit Tages-Check in dieser Woche wird ein Teil frei (höchstens 7).
export function storyWoche(stand, heute, vorlage, tabelle, stories, nameVon, stilWerte) {
  const a = auswertung(stand, heute);
  // Erste Runde gegen einen Gegner: seine eigene Geschichte (falls vorhanden), sonst die allgemeine Woche.
  const geschichte = (a.ersteRundeGegner && stories[a.gegner || vorlage.gegner]) || stories._allgemein;
  const w = werteFuer(stand, heute, vorlage, tabelle, nameVon, stilWerte);
  const frei = Math.min(geschichte.teile.length, a.eintraegeWoche);
  // Teil i wird vom i-ten Eintrag der Runde frei; dessen Antwort wählt die Fassung (Version 47).
  const tageRunde = Object.keys(stand.tage || {}).filter(t => t >= a.rundeVon && t <= a.heute).sort();
  const gelesen = Math.min(frei, (stand.story && stand.story.gelesen[a.woche]) || 0);
  return {
    woche: a.woche,
    wocheNr: a.wocheNr,
    titel: fuelle(geschichte.titel, w),
    teile: geschichte.teile.map((t, i) => ({ nr: i + 1, titel: fuelle(t.titel, w), vorschau: typeof t.vorschau === 'string' && t.vorschau.trim() ? fuelle(t.vorschau, w) : '', text: fuelle(storyText(t, stand.tage[tageRunde[i]]), w), frei: i < frei })),
    frei,
    gelesen,
    neu: frei > gelesen
  };
}

// Story einer vergangenen Runde zum Nachlesen (Karte, 30.10.2026). runde = Eintrag aus rundenListe (logik/karte.js):
// { key, von, bis, gegner, erste, anwendungen }. Gleiche Regeln wie storyWoche: erste Runde gegen einen Gegner = seine
// Geschichte, sonst die allgemeine Woche; Fassung je Tag nach der Antwort. Liefert nur GELESENE Teile (Nachlesen ändert
// nichts; ungelesene bleiben versiegelt, damit die Karte die Siegel nicht umgeht). Platzhalter {n}/{rest} beziehen sich
// auf diese Runde. Wirft bei ungültiger Runde; fehlt die Geschichte, kommt { titel: '', teile: [] }.
export function storyRunde(stand, runde, vorlage, tabelle, stories, nameVon, stilWerte) {
  if (!runde || typeof runde.key !== 'string' || typeof runde.von !== 'string' || typeof runde.bis !== 'string') throw new Error('storyRunde: ungültige Runde');
  const geschichte = (runde.erste && stories[runde.gegner]) || stories._allgemein;
  if (!geschichte || !Array.isArray(geschichte.teile)) return { titel: '', teile: [] };
  const v = tabelle.gegner[runde.gegner] ? { ...vorlage, gegner: runde.gegner } : vorlage;
  const w = werteFuer(stand, ausTagKey(runde.bis), v, tabelle, nameVon, stilWerte);
  const anzahl = Number.isFinite(w.anzahl) ? w.anzahl : 0;
  const n = Number.isFinite(runde.anwendungen) ? runde.anwendungen : 0;
  Object.assign(w, { n, rest: Math.max(0, anzahl - n) });
  const tageRunde = Object.keys(stand.tage || {}).filter(t => t >= runde.von && t <= runde.bis).sort();
  const frei = Math.min(geschichte.teile.length, tageRunde.length);
  const gelesen = Math.min(frei, Math.max(0, (stand.story && stand.story.gelesen && stand.story.gelesen[runde.key]) | 0));
  return {
    titel: fuelle(geschichte.titel, w),
    teile: geschichte.teile.slice(0, gelesen).map((t, i) => ({ nr: i + 1, titel: fuelle(t.titel, w), text: fuelle(storyText(t, stand.tage[tageRunde[i]]), w) }))
  };
}

// Darstellung der Story-Seite (Version 48, „Geschichten geheimnisvoller“). Reine Ableitung aus storyWoche().
// Zustand je Teil:
//   gelesen  schon geöffnet → eingeklappt (Titel sichtbar, Text auf Antippen)
//   siegel   der erste freie, ungelesene Teil → versiegelt mit Andeutung, „Siegel brechen“ öffnet ihn
//   bereit   weitere freie, ungelesene Teile (nach Pausen) → versiegelt, öffnen erst nach dem vorigen (Reihenfolge bleibt)
//   wartet   der erste noch nicht freie Teil → versiegelt mit Andeutung, öffnet sich nach dem nächsten Tages-Check
//   nebel    alles danach → nur Nebel, kein Titel, keine Andeutung (offener Horizont wie beim Weg)
// Kaputte Zahlen werden begrenzt: 0 ≤ gelesen ≤ frei ≤ Zahl der Teile.
export const STORY_ZUSTAENDE = ['gelesen', 'siegel', 'bereit', 'wartet', 'nebel'];
export function storyZustaende(st) {
  const teile = st && Array.isArray(st.teile) ? st.teile : [];
  const ganz = x => (Number.isFinite(x) ? Math.floor(x) : 0);
  const frei = Math.max(0, Math.min(teile.length, ganz(st && st.frei)));
  const gelesen = Math.max(0, Math.min(frei, ganz(st && st.gelesen)));
  return teile.map((t, i) => {
    const nr = i + 1;
    const zustand = nr <= gelesen ? 'gelesen' : nr === gelesen + 1 && nr <= frei ? 'siegel' : nr <= frei ? 'bereit' : nr === frei + 1 ? 'wartet' : 'nebel';
    return { nr, zustand };
  });
}

// Text in Sätze zerlegen (für „Satz für Satz“ beim Öffnen). Satzende: . ! ? … auch vor schließenden Anführungszeichen.
// Leerer oder falscher Text → []; Text ohne Satzzeichen → ein Satz.
export function saetze(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const m = text.trim().match(/[^.!?…]+(?:[.!?…]+[“”"‘’'»«]*|$)/g) || [text.trim()];
  return m.map(x => x.trim()).filter(Boolean);
}

// Heutige Mikroquests: feste Auswahl je Tag aus dem Pool der Onboarding-Gruppe.
export function mikroHeute(stand, heute, bereich, pools, anzahl, rueckfall) {
  const pool = pools[bereich] || pools[rueckfall] || [];
  const k = tagKey(heute);
  const erledigt = (stand.mikro || {})[k] || [];
  const sortiert = pool
    .map(([id, text]) => ({ id, text, w: streuwert(k + id) }))
    .sort((x, y) => x.w - y.w)
    .slice(0, Math.min(anzahl, pool.length));
  return sortiert.map(({ id, text }) => ({ id, text, erledigt: erledigt.includes(id) }));
}

// Erlaubte Fassungen eines Story-Teils; `rueckfall` kommt mit Phase D.
export const FASSUNGEN = ['ja', 'nein'];

// Prüft die Texte auf unbekannte Platzhalter; liefert Fehlertexte.
export function pruefeTexte(botschaften, stories) {
  const erlaubt = new Set(TEXT_PLATZHALTER);
  const fehler = [];
  const pruefe = (wo, text) => { for (const m of String(text).matchAll(/\{(\w+)\}/g)) if (!erlaubt.has(m[1])) fehler.push(`${wo}: {${m[1]}}`); };
  for (const b of botschaften) b.texte.forEach((x, i) => pruefe(`${b.anlass}[${i}]`, x));
  for (const [id, s] of Object.entries(stories)) {
    if (s.teile.length !== 7) fehler.push(`${id}: ${s.teile.length} statt 7 Teile`);
    s.teile.forEach((t, i) => {
      const wo = `${id}[${i}]`;
      pruefe(wo, t.titel);
      if (t.vorschau !== undefined) pruefe(`${wo}.vorschau`, t.vorschau);
      if (typeof t.text === 'string') { pruefe(wo, t.text); return; }
      if (!t.text || typeof t.text !== 'object') { fehler.push(`${wo}: kein Text`); return; }
      if (typeof t.text.ja !== 'string' || !t.text.ja.trim()) fehler.push(`${wo}: Fassung „ja“ fehlt`);
      for (const [k, v] of Object.entries(t.text)) {
        if (!FASSUNGEN.includes(k)) fehler.push(`${wo}: unbekannte Fassung „${k}“`);
        pruefe(`${wo}.${k}`, v);
      }
    });
  }
  return fehler;
}

export { ausTagKey };
