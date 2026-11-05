// Symbole je Stil (Version 84, Startseite als Kampfbühne · Stil-Kulisse): reine Funktionen, nichts im DOM.
// Ein Stil nennt in stile.js `symbole: { '<schlüssel>': '<symbolname>' }`, z. B. 'tab.start': 'zelt', 'siegel.treffer': 'schwert'.
// Rückfall je Schlüssel (nicht je Stil): eigener Stil → Fantasy → Standard der Aufrufstelle (z. B. das Tab-Symbol aus
// freischaltung.js). Ein Name, den das Verzeichnis nicht kennt, zählt als fehlend und fällt ebenso zurück.

const SCHLUESSEL = /^[a-z]+(\.[a-zA-Z0-9]+)+$/;
const hat = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

// Symbolname für einen Schlüssel. stile: STILE, verzeichnis: SYMBOLE. Wirft nie.
export function symbolFuer(stile, verzeichnis, stilId, schluessel, standard) {
  const gueltig = n => typeof n === 'string' && hat(verzeichnis, n);
  for (const id of [stilId, 'fantasy']) {
    const s = hat(stile, id) ? stile[id] : null;
    const n = s && hat(s.symbole, schluessel) ? s.symbole[schluessel] : null;
    if (gueltig(n)) return n;
  }
  return gueltig(standard) ? standard : 'stern';
}

// Prüft alle Zuordnungen; liefert lesbare Warnungen (leer = in Ordnung). Wirft nie.
// erlaubt (optional): Liste bekannter Schlüssel; ein anderer Schlüssel ist dann vermutlich ein Tippfehler.
export function pruefeSymbole(stile, verzeichnis, erlaubt = null) {
  const f = [];
  if (!stile || typeof stile !== 'object') return ['Symbole: keine Stile'];
  for (const [id, s] of Object.entries(stile)) {
    if (!s || s.symbole === undefined) continue;
    if (!s.symbole || typeof s.symbole !== 'object' || Array.isArray(s.symbole)) { f.push(`Stil „${id}“: symbole ist kein Objekt`); continue; }
    for (const [k, n] of Object.entries(s.symbole)) {
      if (!SCHLUESSEL.test(k)) f.push(`Stil „${id}“: ungültiger Schlüssel „${k}“`);
      else if (erlaubt && !erlaubt.includes(k)) f.push(`Stil „${id}“: unbekannter Schlüssel „${k}“`);
      if (typeof n !== 'string' || !hat(verzeichnis, n)) f.push(`Stil „${id}“: Symbol „${n}“ für „${k}“ fehlt im Verzeichnis`);
    }
  }
  return f;
}

// Funken der Arena (Version 84): feste Lage je Index, damit die Seite bei jedem Zeichnen gleich aussieht und kein
// Zufall die Tests stört. Liefert [{ links (%), dauerS, versatzS, dx (px) }]. anzahl außerhalb 0–30 → 0 bzw. 30.
export function funkenListe(anzahl, dauerS = [3, 7]) {
  const n = Math.max(0, Math.min(30, Math.floor(Number(anzahl) || 0)));
  const [min, max] = Array.isArray(dauerS) && dauerS.every(Number.isFinite) && dauerS[0] > 0 && dauerS[1] >= dauerS[0] ? dauerS : [3, 7];
  const frac = x => x - Math.floor(x);
  const r = (i, k) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
  return Array.from({ length: n }, (_, i) => {
    const dauer = min + r(i, 2) * (max - min);
    return {
      links: Math.round(r(i, 1) * 1000) / 10,
      dauerS: Math.round(dauer * 100) / 100,
      versatzS: Math.round(r(i, 3) * dauer * 100) / 100,
      dx: Math.round((r(i, 4) - 0.5) * 40)
    };
  });
}
