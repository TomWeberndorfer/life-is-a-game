// Gegnernamen je Stil (Version 164, 08.11.2026). Reine Funktionen; Daten: `gegnerNamen` in daten/stile.js.
// Ein Stil kann einem Gegner einen eigenen Namen geben (Miami Nights: aus dem Zuckerkobold wird „Die Zuckermaschine“).
// Die Gegner-ID bleibt gleich (Bilder, Geschichten, Ketten und Spielstände hängen daran); nur Name, Kurzname und Genus
// ändern sich, und nur in der Darstellung. Ohne Angabe gilt der Name aus daten/bosse.js.
//
// Eintrag im Stil: { <gegner-id>: 'Die Zuckermaschine' }  oder  { <gegner-id>: { name, kurz?, genus? } }
//   - Kurzschreibweise: Name mit Artikel (Der/Die/Das). Kurzname = Name ohne Artikel, Genus ergibt sich aus dem Artikel.
//   - Ausführlich: bei Namen OHNE Artikel („Gähnor, der Träge“) kurz und genus angeben (genus m|f|n), sonst gilt „m“.
//   - Die Angaben des Stils ersetzen Name, Kurzname und Genus als Ganzes; vom Standardnamen bleibt nichts hängen
//     (sonst bekäme „Rushma“ das weibliche Genus von „Hetzra“).
//
// So wirkt es: die App hält eine Kopie der Standardnamen (macheBasis) und gleicht bei jedem Stilwechsel die Gegner-Tabelle
// an (wendeGegnerNamenAn). Alle Stellen, die TABELLE.gegner lesen (Bühne, Texte, Logbuch, Karte …), sehen dadurch ohne
// Änderung den Namen des aktiven Stils; Platzhalter wie {gegner}/{gegnerAkk} folgen über gegnerFormen().
// Robust (Lehre aus dem Rauchtest): nichts hier wirft. Angefasst werden nur Gegner, die ein Stil umbenennt (und solche,
// die vorher umbenannt waren); ein unlesbarer Eintrag wird je Gegner übersprungen und gemeldet, die App startet trotzdem,
// und ein kaputtes Feld eines anderen Gegners fällt weiter nur dort auf, wo es gebraucht wird.

export const NAME_MAX = 40;
const ARTIKEL = /^(Der|Die|Das) (.+)$/;
const GENUS = ['m', 'f', 'n'];
const hat = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const istObjekt = x => !!x && typeof x === 'object' && !Array.isArray(x);

// Eintrag → { name, kurz, genus? } oder null (ungültig). Wirft nie.
export function normalisiereName(wert) {
  const o = typeof wert === 'string' ? { name: wert } : (istObjekt(wert) ? wert : null);
  if (!o || typeof o.name !== 'string') return null;
  const name = o.name.replace(/\s+/g, ' ').trim();
  if (!name || name.length > NAME_MAX) return null;
  const m = ARTIKEL.exec(name);
  let kurz = m ? m[2] : name;
  if (o.kurz !== undefined) {
    if (typeof o.kurz !== 'string' || !o.kurz.trim() || o.kurz.trim().length > NAME_MAX) return null;
    kurz = o.kurz.replace(/\s+/g, ' ').trim();
  }
  const r = { name, kurz };
  if (o.genus !== undefined) {
    if (!GENUS.includes(o.genus)) return null;
    r.genus = o.genus;
  }
  return r;
}

// Kopie der Standardnamen { id: { name, kurz, genus } }, einmal je Tabelle (bevor ein Stil etwas ändert). Jeder weitere Aufruf
// für dieselbe Tabelle liefert dieselbe Kopie zurück, auch wenn die Tabelle inzwischen angeglichen wurde: so halten mehrere
// Instanzen der App (Rauchtest) oder ein erneutes Laden nie schon umbenannte Namen für die Standardnamen.
const BASIS = new WeakMap();
export function macheBasis(gegner) {
  if (!istObjekt(gegner)) return {};
  if (BASIS.has(gegner)) return BASIS.get(gegner);
  const aus = {};
  for (const id of Object.keys(gegner)) {
    try {
      const g = gegner[id];
      if (g && typeof g === 'object') aus[id] = { name: g.name, kurz: g.kurz, genus: g.genus };
    } catch (e) { console.warn(`Gegnernamen: Standardname von „${id}“ nicht lesbar (${e.message}), ohne Umbenennung`); }
  }
  BASIS.set(gegner, aus);
  return aus;
}

// Welche IDs einer Gegner-Tabelle gerade vom Standardnamen abweichen (damit ein Wechsel zurück genau diese wiederherstellt,
// ohne die übrigen Gegner anzufassen). Hängt an der Tabelle selbst, nicht an der App.
const ANGEPASST = new WeakMap();

// Gegner-Tabelle für den Stil anpassen (ändert `gegner` an Ort und Stelle). Idempotent; unbekannter Stil oder Stil ohne
// Angaben stellt die Standardnamen wieder her. Gibt die IDs zurück, deren Darstellung sich geändert hat. Wirft nie.
export function wendeGegnerNamenAn(gegner, basis, stile, stilId) {
  const geaendert = [];
  if (!istObjekt(gegner) || !istObjekt(basis)) return geaendert;
  const st = stile && hat(stile, stilId) ? stile[stilId] : null;
  const ue = st && istObjekt(st.gegnerNamen) ? st.gegnerNamen : {};
  const vorher = ANGEPASST.get(gegner) || new Set();
  const jetzt = new Set();
  const ids = new Set([...Object.keys(ue).filter(id => hat(basis, id) && hat(gegner, id)), ...vorher]);
  for (const id of ids) {
    const eigen = hat(ue, id) ? normalisiereName(ue[id]) : null; // ungültig → Standardname (die Prüfung meldet es beim Start)
    try {
      const g = gegner[id], b = basis[id];
      if (!g || !b) continue;
      const soll = eigen || b;
      if (g.name !== soll.name || g.kurz !== soll.kurz || g.genus !== soll.genus) {
        g.name = soll.name;
        if (soll.kurz === undefined) delete g.kurz; else g.kurz = soll.kurz;
        if (soll.genus === undefined) delete g.genus; else g.genus = soll.genus;
        geaendert.push(id);
      }
      if (eigen) jetzt.add(id);
    } catch (e) {
      console.warn(`Gegnernamen: „${id}“ nicht angepasst (${e.message})`);
      if (eigen || vorher.has(id)) jetzt.add(id); // beim nächsten Stilwechsel erneut versuchen
    }
  }
  ANGEPASST.set(gegner, jetzt);
  return geaendert;
}

// Alle Angaben prüfen (beim Start einmal, als Warnungen). Leere Liste = alles in Ordnung.
// Prüft: Aufbau, unbekannte Gegner, ungültige Namen, doppelte Namen/Kurznamen innerhalb eines Stils. Wirft nie.
export function pruefeGegnerNamen(stile, gegner) {
  const f = [];
  for (const [stilId, st] of Object.entries(stile || {})) {
    if (!st || st.gegnerNamen === undefined) continue;
    if (!istObjekt(st.gegnerNamen)) { f.push(`Gegnernamen im Stil ${stilId}: muss ein Objekt sein`); continue; }
    const wirksam = {};
    for (const id of Object.keys(gegner || {})) {
      try { const g = gegner[id]; wirksam[id] = { name: g.name, kurz: g.kurz || g.name }; }
      catch (e) { /* unlesbarer Gegner: nimmt an der Doppelt-Prüfung nicht teil */ }
    }
    for (const [gid, w] of Object.entries(st.gegnerNamen)) {
      if (!gegner || !hat(gegner, gid)) { f.push(`Gegnernamen im Stil ${stilId}: Gegner „${gid}“ unbekannt`); continue; }
      const n = normalisiereName(w);
      if (!n) { f.push(`Gegnernamen im Stil ${stilId}, ${gid}: ungültig (Name 1–${NAME_MAX} Zeichen, kurz ebenso, genus m|f|n)`); continue; }
      wirksam[gid] = { name: n.name, kurz: n.kurz };
    }
    const gesehen = new Map();
    for (const [gid, w] of Object.entries(wirksam)) {
      for (const [art, wert] of [['Name', w.name], ['Kurzname', w.kurz]]) {
        const k = `${art}:${String(wert).toLowerCase()}`;
        if (gesehen.has(k)) f.push(`Gegnernamen im Stil ${stilId}: ${art} „${wert}“ doppelt (${gesehen.get(k)} und ${gid})`);
        else gesehen.set(k, gid);
      }
    }
  }
  return f;
}
