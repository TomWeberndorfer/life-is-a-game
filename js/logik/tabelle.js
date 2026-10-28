// Inhalte-Tabelle (Version 29): Bilder und Texte, die der Besitzer selbst in der App pflegt.
// Zwei Tabellen in der Seiten-Datenbank:
//   medien/<assetId>            = eine hochgeladene Datei, einmal gespeichert   { art, titel, asset }
//   inhalte/<stil>~<schluessel> = eine Verwendung (Bild oder Text) je Stil      { schluessel, stil, typ, medium | datei | text, pos, formen }
// Version 30: `datei` = eingebaute Datei des Stils (nur Ausschnitt ändern, Bild behalten);
//             `formen` = eigener Ausschnitt je Darstellung { rund, quadrat, breit }, sonst gilt `pos`.
// Vorrang beim Anzeigen: Tabelle (eigener Stil) → Tabelle („alle“) → Dateien (stile.js, texte.js) → Platzhalter des Stils.
// Reine Funktionen ohne Zugriff auf Datenbank oder Oberfläche (testbar mit node --test).

export const ALLE = 'alle';
export const ARTEN = ['held', 'boss', 'szene'];
export const TYPEN = ['bild', 'text'];
export const GRENZEN = { schluessel: 80, titel: 80, text: 2000 };
const SCHLUESSEL = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const ASSET = /^[0-9a-f]{32}$/;
const POS = /^(\d{1,3})% (\d{1,3})%$/;
const DATEI = /^(bilder\/[a-z0-9][a-z0-9_\-\/]*\.(jpg|jpeg|png|webp|svg)|\/_blob\/[0-9a-f]{32})$/i;
export const FORMEN = ['rund', 'quadrat', 'breit'];
export const STANDARD_POS = '50% 30%';

export const docId = (stil, schluessel) => `${stil}~${schluessel}`;
export const assetUrl = id => '/_blob/' + id;

// Welche Bildart ein Bildplatz hat (bestimmt den Platzhalter).
export function artVon(schluessel) {
  const k = String(schluessel || '');
  if (k.startsWith('boss-')) return 'boss';
  if (k === 'szene' || k === 'karte' || k.startsWith('bezirk-') || k.startsWith('banner-') || k.startsWith('story-')) return 'szene';
  return 'held';
}

export function platzhalterPfad(stil, art) {
  return `bilder/platzhalter/${stil}-${ARTEN.includes(art) ? art : 'held'}.svg`;
}

// „50% 30%“ → gültige Position oder null (Werte 0–100).
export function normPos(pos) {
  const m = POS.exec(String(pos ?? '').trim());
  if (!m) return null;
  const x = Number(m[1]), y = Number(m[2]);
  return x <= 100 && y <= 100 ? `${x}% ${y}%` : null;
}

export function pruefeMedium(m) {
  const f = [];
  if (!m || typeof m !== 'object') return ['kein Eintrag'];
  if (!ASSET.test(String(m.asset || ''))) f.push('Datei fehlt oder ist ungültig');
  if (!ARTEN.includes(m.art)) f.push(`Art muss ${ARTEN.join(', ')} sein`);
  if (m.titel !== undefined && (typeof m.titel !== 'string' || m.titel.length > GRENZEN.titel)) f.push(`Titel höchstens ${GRENZEN.titel} Zeichen`);
  return f;
}

// stile: gültige Stil-IDs; medien: { assetId: Medium }; standardTexte (optional): prüft Platzhalter {name} gegen den Standardtext.
export function pruefeInhalt(e, { stile, medien = {}, standardTexte = null }) {
  const f = [];
  if (!e || typeof e !== 'object') return ['kein Eintrag'];
  if (!SCHLUESSEL.test(String(e.schluessel || ''))) f.push('Schlüssel: nur Buchstaben, Ziffern, Punkt, Minus, Unterstrich (höchstens 80)');
  if (e.stil !== ALLE && !(stile || []).includes(e.stil)) f.push(`unbekannter Stil „${e.stil}“`);
  if (!TYPEN.includes(e.typ)) f.push('Typ muss Bild oder Text sein');
  if (e.typ === 'bild') {
    const hatMedium = e.medium !== undefined && e.medium !== null && e.medium !== '';
    const hatDatei = e.datei !== undefined && e.datei !== null && e.datei !== '';
    if (hatMedium && hatDatei) f.push('Entweder hochgeladenes Bild oder eingebaute Datei, nicht beides');
    else if (hatDatei) {
      if (!DATEI.test(String(e.datei)) || String(e.datei).includes('..')) f.push('Eingebaute Datei ist ungültig');
      if (e.stil === ALLE) f.push('Eingebaute Dateien gehören zu einem Stil, nicht zu „Alle Stile“');
    } else if (!hatMedium) f.push(e.stil === ALLE ? 'Bitte ein hochgeladenes Bild wählen (eingebaute Bilder gehören zu einem Stil)' : 'Bitte ein Bild wählen');
    else if (!medien[e.medium]) f.push('Bild fehlt in der Medien-Tabelle');
    if (e.pos !== undefined && e.pos !== null && e.pos !== '' && !normPos(e.pos)) f.push('Ausschnitt muss „x% y%“ mit 0–100 sein');
    if (e.formen !== undefined && e.formen !== null) {
      if (typeof e.formen !== 'object' || Array.isArray(e.formen)) f.push('Ausschnitte je Form sind ungültig');
      else for (const [k, v] of Object.entries(e.formen)) {
        if (!FORMEN.includes(k)) f.push(`unbekannte Form „${k}“`);
        else if (!normPos(v)) f.push(`Ausschnitt ${k} muss „x% y%“ mit 0–100 sein`);
      }
    }
  }
  if (e.typ === 'text') {
    if (typeof e.text !== 'string' || !e.text.trim()) f.push('Text ist leer');
    else if (e.text.length > GRENZEN.text) f.push(`Text höchstens ${GRENZEN.text} Zeichen`);
    else if (standardTexte && typeof standardTexte[e.schluessel] === 'string') {
      const erlaubt = new Set([...standardTexte[e.schluessel].matchAll(/\{(\w+)\}/g)].map(m => m[1]));
      for (const m of e.text.matchAll(/\{(\w+)\}/g)) if (!erlaubt.has(m[1])) f.push(`unbekannter Platzhalter {${m[1]}}`);
    }
  }
  return f;
}

// zeilen: [{ id, ...daten }] aus der Datenbank. Ungültige Zeilen werden übersprungen und gemeldet, nie stillschweigend genutzt.
export function baueIndex(inhaltZeilen, medienZeilen, stile, standardTexte = null) {
  const medien = {};
  const fehler = [];
  for (const m of medienZeilen || []) {
    const f = pruefeMedium(m);
    if (f.length) fehler.push({ tabelle: 'medien', id: m && m.id, fehler: f });
    else medien[m.asset] = { art: m.art, titel: m.titel || '', asset: m.asset };
  }
  const bilder = {}, texte = {}, zeilen = [];
  for (const e of inhaltZeilen || []) {
    const f = pruefeInhalt(e, { stile, medien, standardTexte });
    if (f.length) { fehler.push({ tabelle: 'inhalte', id: e && e.id, fehler: f }); continue; }
    if (e.id && e.id !== docId(e.stil, e.schluessel)) { fehler.push({ tabelle: 'inhalte', id: e.id, fehler: ['Zeilen-ID passt nicht zu Stil und Schlüssel'] }); continue; }
    zeilen.push(e);
    if (e.typ === 'bild') {
      const formen = {};
      for (const [k, v] of Object.entries(e.formen || {})) formen[k] = normPos(v);
      (bilder[e.stil] ||= {})[e.schluessel] = e.datei
        ? { url: e.datei, datei: e.datei, pos: normPos(e.pos), formen, art: artVon(e.schluessel) }
        : { url: assetUrl(e.medium), medium: e.medium, pos: normPos(e.pos), formen, art: medien[e.medium].art };
    }
    else (texte[e.stil] ||= {})[e.schluessel] = e.text;
  }
  return { bilder, texte, medien, zeilen, fehler };
}

export const leererIndex = () => baueIndex([], [], []);

export function bildAus(index, stil, schluessel) {
  return (index.bilder[stil] || {})[schluessel] || (index.bilder[ALLE] || {})[schluessel] || null;
}

// Ausschnitt eines Eintrags für eine Darstellung: Form → gemeinsamer Ausschnitt → Rückfall.
export function posFuer(eintrag, form, rueckfall = STANDARD_POS) {
  if (!eintrag) return rueckfall;
  return (eintrag.formen && eintrag.formen[form]) || eintrag.pos || rueckfall;
}

// Texte der Tabelle für einen Stil: eigener Stil überschreibt „alle“.
export function texteFuer(index, stil) {
  return { ...(index.texte[ALLE] || {}), ...(index.texte[stil] || {}) };
}

// Bildplätze eines Stils ohne Bild (Tabelle oder Datei) → dort erscheint der Platzhalter.
export function luecken(index, stil, plaetze, hatDatei) {
  return [...new Set(plaetze)].filter(p => !bildAus(index, stil, p) && !hatDatei(p)).sort();
}

// Eingabe aus dem Formular → Datenbank-Zeile (oder Fehlerliste).
export function neueZeile(form, kontext) {
  const zeile = {
    schluessel: normSchluessel(form.schluessel, form.typ),
    stil: form.stil,
    typ: form.typ
  };
  if (form.typ === 'bild') {
    if (form.datei) zeile.datei = form.datei; else zeile.medium = form.medium;
    zeile.pos = normPos(form.pos) || STANDARD_POS;
    const formen = {};
    for (const k of FORMEN) if (form.formen && form.formen[k]) formen[k] = form.formen[k];
    if (Object.keys(formen).length) zeile.formen = formen;
  }
  else zeile.text = String(form.text ?? '');
  const fehler = pruefeInhalt(zeile, kontext);
  return fehler.length ? { fehler } : { id: docId(zeile.stil, zeile.schluessel), zeile };
}

// ---------- Medienliste (Version 31) ----------
// Wo wird ein hochgeladenes Bild verwendet? → [{ id, stil, schluessel }], sortiert.
export function verwendungen(index, assetId) {
  return index.zeilen
    .filter(z => z.typ === 'bild' && z.medium === assetId)
    .map(z => ({ id: z.id, stil: z.stil, schluessel: z.schluessel }))
    .sort((a, b) => a.schluessel.localeCompare(b.schluessel) || a.stil.localeCompare(b.stil));
}

// Alle hochgeladenen Bilder mit Verwendung; unbenutzte zuerst, dann nach Titel.
export function medienListe(index) {
  return Object.values(index.medien)
    .map(m => ({ ...m, verwendet: verwendungen(index, m.asset) }))
    .sort((a, b) => (a.verwendet.length > 0) - (b.verwendet.length > 0) || (a.titel || a.asset).localeCompare(b.titel || b.asset));
}

// Änderung an Titel/Art prüfen → { daten } oder { fehler }.
export function medienAenderung(eingabe) {
  const daten = { titel: String(eingabe.titel ?? '').trim(), art: eingabe.art };
  const fehler = pruefeMedium({ asset: 'f'.repeat(32), ...daten }).filter(f => !f.startsWith('Datei'));
  return fehler.length ? { fehler } : { daten };
}

// Darf ein Medium gelöscht werden? Nur wenn kein Eintrag es nutzt (sonst zeigten diese Plätze ein kaputtes Bild).
export function darfLoeschen(index, assetId) {
  return !!index.medien[assetId] && verwendungen(index, assetId).length === 0;
}

// ---------- Schlüssel prüfen (Version 32) ----------
// Bildschlüssel sind immer klein (Bildplätze heißen wie Helden-/Gegner-IDs). Textschlüssel behalten ihre Schreibweise
// (z. B. „tab.stadtGesperrt“), nur Leerzeichen am Rand fallen weg.
export function normSchluessel(schluessel, typ) {
  const k = String(schluessel ?? '').trim();
  return typ === 'bild' ? k.toLowerCase() : k;
}

const grob = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
function abstand(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let vor = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, vor + (a[i - 1] === b[j - 1] ? 0 : 1));
      vor = t;
    }
  }
  return d[b.length];
}

// Ähnlichster bekannter Schlüssel oder null. Reihenfolge: gleich bis auf Schreibweise → enthält ihn (längster Treffer)
// → kleinster Tippabstand (höchstens 3 bzw. ein Drittel der Länge).
export function vorschlag(schluessel, bekannte) {
  const g = grob(schluessel);
  if (!g) return null;
  const liste = [...new Set(bekannte || [])];
  const gleich = liste.find(k => grob(k) === g);
  if (gleich) return gleich;
  const enthalten = liste.filter(k => grob(k).length >= 4 && g.includes(grob(k))).sort((a, b) => grob(b).length - grob(a).length);
  if (enthalten.length) return enthalten[0];
  let best = null, min = Infinity;
  for (const k of liste) { const d = abstand(g, grob(k)); if (d < min) { min = d; best = k; } }
  return best && min <= Math.min(3, Math.ceil(g.length / 3)) ? best : null;
}

// Bekannt? → { bekannt, vorschlag } für den Hinweis im Formular.
export function schluesselPruefen(schluessel, typ, bekannte) {
  const k = normSchluessel(schluessel, typ);
  if (!k) return { bekannt: true, vorschlag: null };
  const bekannt = (bekannte || []).includes(k);
  return { bekannt, vorschlag: bekannt ? null : vorschlag(k, bekannte) };
}
