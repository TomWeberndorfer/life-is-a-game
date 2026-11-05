// Blatt „Anzeige“ (Version 125): Gerät-Einstellungen lesen, prüfen und anwenden. Daten: daten/anzeige.js.
// Reine Funktionen ohne DOM; app.js setzt das Ergebnis von rootDaten() als data-Attribute und CSS-Variable.
// Gespeichert wird nur, was jemand ausdrücklich gewählt hat (gewaehlt). Was fehlt, folgt dem Standard bzw. dem
// Betriebssystem (z. B. „Bewegung reduzieren“), damit eine spätere Änderung des Systems weiter greift.

export class AnzeigeFehler extends Error {}

// Konfiguration prüfen (beim Start). Liefert Meldungen, leer = in Ordnung.
export function pruefeAnzeige(cfg) {
  const m = [];
  if (!cfg || typeof cfg !== 'object' || !cfg.optionen || typeof cfg.optionen !== 'object') return ['Anzeige: Optionen fehlen'];
  const attribute = new Set();
  for (const [k, o] of Object.entries(cfg.optionen)) {
    if (!/^[a-z]+$/.test(k)) m.push(`Anzeige: ungültiger Name „${k}“`);
    if (!o || !Array.isArray(o.werte) || o.werte.length < 2) { m.push(`Anzeige: „${k}“ braucht mindestens zwei Werte`); continue; }
    if (new Set(o.werte).size !== o.werte.length) m.push(`Anzeige: „${k}“ hat doppelte Werte`);
    if (o.werte.some(w => typeof w !== 'string' || !/^[a-z]+$/.test(w))) m.push(`Anzeige: „${k}“ hat ungültige Werte`);
    if (!o.werte.includes(o.standard)) m.push(`Anzeige: Standard von „${k}“ ist kein erlaubter Wert`);
    if (o.system !== undefined && !o.werte.includes(o.system)) m.push(`Anzeige: System-Wert von „${k}“ ist kein erlaubter Wert`);
    if (typeof o.attribut !== 'string' || !/^[a-z]+$/.test(o.attribut)) m.push(`Anzeige: „${k}“ ohne gültiges Attribut`);
    else if (attribute.has(o.attribut)) m.push(`Anzeige: Attribut „${o.attribut}“ doppelt`);
    else attribute.add(o.attribut);
    if (o.skala !== undefined) {
      for (const w of o.werte) {
        const z = o.skala && o.skala[w];
        if (!Number.isFinite(z) || z < 0.5 || z > 2) m.push(`Anzeige: Skala von „${k}“ für „${w}“ fehlt oder ist ungültig`);
      }
    }
  }
  return m;
}

// Gespeicherten Rohwert (JSON-Text, Objekt oder nichts) → nur gültige, ausdrücklich gewählte Werte. Wirft nie.
export function liesGewaehlt(roh, cfg) {
  let o = roh;
  if (typeof roh === 'string') { try { o = JSON.parse(roh); } catch (e) { return {}; } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
  const aus = {};
  for (const [k, opt] of Object.entries((cfg && cfg.optionen) || {})) {
    if (opt && Array.isArray(opt.werte) && opt.werte.includes(o[k])) aus[k] = o[k];
  }
  return aus;
}

// Wirksame Werte je Option: gewählt → System (nur wenn verlangt und für die Option vorgesehen) → Standard.
export function wirksam(gewaehlt, cfg, { systemRuhig = false } = {}) {
  const aus = {};
  for (const [k, o] of Object.entries((cfg && cfg.optionen) || {})) {
    if (gewaehlt && o.werte.includes(gewaehlt[k])) aus[k] = gewaehlt[k];
    else if (systemRuhig && o.system !== undefined) aus[k] = o.system;
    else aus[k] = o.standard;
  }
  return aus;
}

// Einen Wert wählen → neues gewählt-Objekt (das alte bleibt unverändert). Unbekannte Option oder Wert → AnzeigeFehler.
export function waehle(gewaehlt, k, wert, cfg) {
  const o = cfg && cfg.optionen && cfg.optionen[k];
  if (!o) throw new AnzeigeFehler(`Unbekannte Anzeige-Option: ${k}`);
  if (!o.werte.includes(wert)) throw new AnzeigeFehler(`Unbekannter Wert für ${k}: ${wert}`);
  return { ...(gewaehlt || {}), [k]: wert };
}

// Wirksame Werte → data-Attribute am <html> (Standardwert = null, also Attribut entfernen) und Textskala.
export function rootDaten(werte, cfg) {
  const attribute = {};
  let skala = 1;
  for (const [k, o] of Object.entries((cfg && cfg.optionen) || {})) {
    const w = werte && o.werte.includes(werte[k]) ? werte[k] : o.standard;
    attribute[o.attribut] = w === o.standard ? null : w;
    if (o.skala && Number.isFinite(o.skala[w])) skala = o.skala[w];
  }
  return { attribute, skala };
}

// Bild aus? Große Darstellungen weichen der Fläche, runde Porträts bleiben (daten/anzeige.js, bilder).
export const bildVerborgen = (werte, form) => !!werte && werte.bilder === 'aus' && form !== 'rund';
