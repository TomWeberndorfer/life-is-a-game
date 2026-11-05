// Sprungziele (Version 78): Hash lesen, entscheiden, ob ein Ziel geöffnet wird, Link bauen. Daten: daten/sprungziele.js.
// Reine Funktionen ohne Zustand und ohne Browser-Zugriff (testbar in Node).

const TEIL = /^[a-z0-9-]{1,30}$/;

// '#Test+notfall' → { profil: 'test', ziel: 'notfall', unbekannt: [] }. Leerer Hash → Hauptprofil ohne Ziel.
// profile: Liste der Profil-Teile; ziele: Register der Sprungziele.
export function leseHash(hash, { profile = [], ziele = {} } = {}) {
  const roh = typeof hash === 'string' ? hash.replace(/^#/, '') : '';
  const teile = [...new Set(roh.toLowerCase().split('+').map(t => t.trim()).filter(Boolean))];
  let profil = 'haupt';
  let ziel = null;
  const unbekannt = [];
  for (const t of teile) {
    if (!TEIL.test(t)) unbekannt.push(t.slice(0, 30));
    else if (profile.includes(t)) { if (profil === 'haupt') profil = t; else unbekannt.push(t); }
    else if (Object.prototype.hasOwnProperty.call(ziele, t)) { if (!ziel) ziel = t; else unbekannt.push(t); }
    else unbekannt.push(t);
  }
  // Auswertung (#admin) hat keine Spielansicht: ein Ziel dort wird ignoriert statt halb ausgeführt.
  if (profil === 'admin' && ziel) { unbekannt.push(ziel); ziel = null; }
  return { profil, ziel, unbekannt };
}

// Hash für Profil und optionales Ziel: ('haupt') → '', ('test','notfall') → '#test+notfall'.
export function hashFuer(profil, ziel = null) {
  const teile = [profil && profil !== 'haupt' ? profil : null, ziel].filter(Boolean);
  return teile.length ? '#' + teile.join('+') : '';
}

// Soll das Ziel jetzt geöffnet werden?
// zustand: { bereit (Onboarding fertig und Startseite), heroId (Held im Rampenlicht), frei(funktionId) → bool }
// Ergebnis: { aktion: 'oeffnen' | 'warten' | 'ignorieren', grund }
//   warten: noch kein Held (z. B. neues Gerät, der Spielstand aus dem Konto kommt gleich) → später erneut versuchen
export function sprungEntscheid(ziel, zustand, ziele) {
  const def = ziel && ziele && Object.prototype.hasOwnProperty.call(ziele, ziel) ? ziele[ziel] : null;
  if (!def) return { aktion: 'ignorieren', grund: 'unbekannt' };
  const z = zustand || {};
  if (!z.bereit || !z.heroId) return { aktion: 'warten', grund: 'kein-held' };
  if (def.funktion && !def.trotzSperre) {
    let frei = false;
    try { frei = typeof z.frei === 'function' && !!z.frei(def.funktion); } catch (e) { frei = false; }
    if (!frei) return { aktion: 'ignorieren', grund: 'gesperrt' };
  }
  return { aktion: 'oeffnen', grund: null };
}

// Link für ein Ziel. ort: { protocol, hostname, origin, pathname } der Seite (oder null).
// Auf eigenen Adressen (basis.eigeneAdresse, z. B. GitHub Pages) die Seite selbst, sonst die claude.ai-Adresse.
export function linkFuer(ziel, profil, basis, ort) {
  const eigene = !!(ort && /^https?:$/.test(ort.protocol || '') && typeof ort.hostname === 'string'
    && (basis.eigeneAdresse || []).some(h => ort.hostname === h || ort.hostname.endsWith('.' + h)));
  const vorne = eigene ? `${ort.origin}${ort.pathname || ''}` : basis.claude;
  return vorne + hashFuer(profil, ziel);
}

// Register prüfen (beim Start, wirft nie). funktionen: FUNKTIONEN aus freischaltung.js; oeffner: Namen der Öffner in
// app.js; texte: Textregister; profile: Profil-Teile (ein Ziel darf nicht wie ein Profil heißen).
export function pruefeSprungziele(ziele, { profile = [], funktionen = {}, oeffner = [], texte = {} } = {}) {
  const f = [];
  if (!ziele || typeof ziele !== 'object') return ['Sprungziele: kein Register'];
  for (const [id, d] of Object.entries(ziele)) {
    if (!TEIL.test(id)) f.push(`Sprungziel ${id}: ungültiger Name`);
    if (profile.includes(id)) f.push(`Sprungziel ${id}: heißt wie ein Profil`);
    if (!d || typeof d !== 'object') { f.push(`Sprungziel ${id}: kein Objekt`); continue; }
    if (!oeffner.includes(d.blatt)) f.push(`Sprungziel ${id}: kein Öffner für „${d.blatt}“`);
    if (d.funktion && !(d.funktion in funktionen)) f.push(`Sprungziel ${id}: unbekannte Funktion ${d.funktion}`);
    for (const k of ['titel', 'text']) if (d[k] && !(d[k] in texte)) f.push(`Sprungziel ${id}: Text ${d[k]} fehlt`);
  }
  return f;
}
