// Teilziele (Fundament, 31.10.2026; Zähler, 31.10.2026): Quest = Rahmen (Titel, Held, Gegnerkette, Rampe, Warum) mit
// Teilzielen { id, art, haupt, …Parameter der Art, name?, seit?, archiviert? }. Arten als Daten in daten/zielarten.js.
// Reine Funktionen ohne Zeitbezug, werfen nie (außer pruefeZielarten liefert Fehlerlisten). Was Runden und Tage braucht
// (anlegen, abhaken, Fortschritt), steht in logik/stuetzen.js.
//
// Haupt-Teilziel: genau eins je Quest, immer eine Prozess-Art, immer „je Runde“. Es trägt Runden, Siege, XP und Bosskette.
// Neben-Teilziele („Stützgewohnheiten“): höchstens TEILZIELE.max − 1, ohne XP und ohne Bossschaden (Entscheidung 4).
// Anzahl-Verlauf (Schritt „Zähler“): `anzahl` ist der Grundwert ab Runde 1, `verlauf: [{ ab, anzahl }]` die späteren
// Werte ab Runde `ab`. So bleibt jede vergangene Runde bei ihrem Ziel, auch wenn die Anzahl später geändert wird.
// Übergang: quest.anzahl bleibt als Spiegel des neuesten Werts erhalten (eine ältere App-Fassung in einem offenen Tab
// liest und schreibt nur quest.anzahl). Weicht er ab, hat eine ältere Fassung ihn geändert: dann gilt er sofort.
import { ZIELARTEN, TEILZIELE } from '../daten/zielarten.js';
import { ZAEHLWEISEN, ZAEHLWEISE } from '../daten/zaehlweisen.js'; // Zählweisen (04.11.2026): täglich · Rhythmus · Wache

export const TEILZIEL_ID = /^[a-z][a-z0-9-]{0,23}$/;
// Antworten, die für ein Teilziel zählen dürfen (Register daten/antworten.js, `zaehlbar`; „schwer“ zählt nie, Version 141)
export { ZAEHLBARE_ANTWORTEN as ANTWORTEN_ZAEHLBAR } from './antworten.js';
import { ZAEHLBARE_ANTWORTEN as ANTWORTEN_ZAEHLBAR } from './antworten.js';
const TAG = /^\d{4}-\d{2}-\d{2}$/;

// Grenzen der Anzahl einer Art in einem Zeitraum (anzahlJe vor anzahl). null = Art ohne Anzahl.
export function grenzen(art, zeitraum) {
  if (!art) return null;
  return (art.anzahlJe && art.anzahlJe[zeitraum]) || art.anzahl || null;
}
const imBereich = (n, g) => !!g && Number.isInteger(n) && n >= g.min && n <= g.max;

// Verlauf bereinigen: Einträge mit ganzer Runde ab ≥ 2 und gültiger Anzahl, sortiert, je Runde der letzte, höchstens max.
function bereinigeVerlauf(roh, g, max) {
  if (!Array.isArray(roh)) return [];
  const je = new Map();
  for (const e of roh) {
    if (!e || typeof e !== 'object' || !Number.isInteger(e.ab) || e.ab < 2 || e.ab > 9999 || !imBereich(e.anzahl, g)) continue;
    je.set(e.ab, e.anzahl);
  }
  return [...je.entries()].sort((a, b) => a[0] - b[0]).map(([ab, anzahl]) => ({ ab, anzahl })).slice(-max);
}

// Prüffunktionen je Art: Rohdaten → bereinigte Parameter oder null (ungültig). Neue Art = neuer Eintrag.
export const PRUEFER = {
  zaehler(roh, art, cfg = TEILZIELE) {
    const zeitraum = art.zeitraeume.includes(roh.zeitraum) ? roh.zeitraum : art.zeitraeume[0];
    const g = grenzen(art, zeitraum);
    if (!imBereich(roh.anzahl, g)) return null;
    const p = { anzahl: roh.anzahl, zeitraum };
    const verlauf = bereinigeVerlauf(roh.verlauf, g, cfg.verlaufMax);
    if (verlauf.length) p.verlauf = verlauf;
    return p;
  },
  // Beständigkeit (04.11.2026): dieselben Parameter wie der Zähler (Anzahl je Runde, Verlauf); nur was zählt, ist anders
  bestaendigkeit(roh, art, cfg = TEILZIELE) { return PRUEFER.zaehler(roh, art, cfg); }
};

// Datenprüfung des Registers (für Tests und Pflege): Liste lesbarer Fehler, leer = in Ordnung.
export function pruefeZielarten(arten = ZIELARTEN, cfg = TEILZIELE) {
  const f = [];
  if (!arten || typeof arten !== 'object') return ['Zielarten fehlen'];
  const pruefeG = (id, g, wo) => {
    if (![g.min, g.max, g.standard].every(Number.isInteger) || g.min < 1 || g.min > g.standard || g.standard > g.max) f.push(`${id}: ${wo} braucht ganze Zahlen min ≤ standard ≤ max, min ≥ 1`);
  };
  for (const [id, a] of Object.entries(arten)) {
    if (!a || typeof a.name !== 'string' || !a.name.trim()) f.push(`${id}: name fehlt`);
    if (typeof (a && a.prozess) !== 'boolean') f.push(`${id}: prozess muss true oder false sein`);
    if (!Array.isArray(a && a.zeitraeume) || !a.zeitraeume.length) f.push(`${id}: zeitraeume fehlen`);
    if (typeof PRUEFER[id] !== 'function') f.push(`${id}: Prüffunktion fehlt (logik/teilziele.js, PRUEFER)`);
    if (a && a.anzahl) pruefeG(id, a.anzahl, 'anzahl');
    if (a && 'zaehlt' in a && (!Array.isArray(a.zaehlt) || !a.zaehlt.length || a.zaehlt.some(x => !ANTWORTEN_ZAEHLBAR.includes(x)))) f.push(`${id}: zaehlt muss eine Liste aus ${ANTWORTEN_ZAEHLBAR.join(', ')} sein`);
    if (a && a.texte && (typeof a.texte !== 'object' || Object.values(a.texte).some(k => typeof k !== 'string' || !k))) f.push(`${id}: texte müssen Textschlüssel sein`);
    if (a && a.anzahlJe) {
      for (const [z, g] of Object.entries(a.anzahlJe)) {
        if (!Array.isArray(a.zeitraeume) || !a.zeitraeume.includes(z)) f.push(`${id}: anzahlJe.${z} ist kein erlaubter Zeitraum`);
        if (!g || typeof g !== 'object') f.push(`${id}: anzahlJe.${z} fehlt`); else pruefeG(id, g, `anzahlJe.${z}`);
      }
    }
  }
  if (!cfg || !Number.isInteger(cfg.max) || cfg.max < 1) f.push('TEILZIELE.max muss eine ganze Zahl ab 1 sein');
  const std = cfg && arten[cfg.standardArt];
  if (!std || !std.prozess || !std.anzahl) f.push('TEILZIELE.standardArt muss eine Prozess-Art mit Anzahl sein');
  else if (!std.zeitraeume.includes(cfg.hauptZeitraum)) f.push('TEILZIELE.hauptZeitraum muss ein Zeitraum der Standardart sein');
  for (const k of ['nebenAbSiegen', 'nameMax', 'verlaufMax', 'archivMax']) {
    if (cfg && (!Number.isInteger(cfg[k]) || cfg[k] < (k === 'nebenAbSiegen' ? 0 : 1))) f.push(`TEILZIELE.${k} muss eine ganze Zahl sein`);
  }
  for (const k of ['neuAbNaechsterRunde', 'anzahlSofortOhneTreffer']) {
    if (cfg && typeof cfg[k] !== 'boolean') f.push(`TEILZIELE.${k} muss true oder false sein`);
  }
  return f;
}

// Name einer Stützgewohnheit: Leerraum zusammengezogen, gekürzt; leer → null.
export function bereinigeName(roh, cfg = TEILZIELE) {
  if (typeof roh !== 'string') return null;
  const t = roh.replace(/\s+/g, ' ').trim().slice(0, cfg.nameMax);
  return t || null;
}

// Ein Teilziel bereinigen; ungültig → null.
export function bereinigeTeilziel(roh, arten = ZIELARTEN, cfg = TEILZIELE) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
  if (typeof roh.id !== 'string' || !TEILZIEL_ID.test(roh.id)) return null;
  const art = Object.prototype.hasOwnProperty.call(arten, roh.art) ? arten[roh.art] : null;
  const pruefer = art && PRUEFER[roh.art];
  if (!pruefer) return null;
  const p = pruefer(roh, art, cfg);
  if (!p) return null;
  const t = { id: roh.id, art: roh.art, haupt: roh.haupt === true, ...p };
  // Gemeinsame, freiwillige Felder: nur wenn gültig (fehlen = wie vor dem Schritt „Zähler“)
  const name = bereinigeName(roh.name, cfg);
  if (name) t.name = name;
  // Zählweise (04.11.2026): nur gültige, zur Art passende Werte; der Standard wird nicht gespeichert (fehlt = täglich)
  const zw = bereinigeZaehlweise(roh.zaehlweise, roh.art);
  if (zw && zw !== ZAEHLWEISE.standard) t.zaehlweise = zw;
  const zv = bereinigeZwVerlauf(roh.zwVerlauf, roh.art, cfg.verlaufMax);
  if (zv.length) t.zwVerlauf = zv;
  if (Number.isInteger(roh.seit) && roh.seit >= 1 && roh.seit <= 9999) t.seit = roh.seit;
  if (typeof roh.archiviert === 'string' && TAG.test(roh.archiviert)) t.archiviert = roh.archiviert;
  return t;
}

// Anzahl eines Teilziels in Runde nr (laut Verlauf). Ohne nr: der neueste Wert. Ungültiges Teilziel → null.
export function anzahlFuer(tz, nr) {
  if (!tz || !Number.isInteger(tz.anzahl)) return null;
  const v = Array.isArray(tz.verlauf) ? tz.verlauf : [];
  if (!Number.isInteger(nr)) return v.length ? v[v.length - 1].anzahl : tz.anzahl;
  let n = tz.anzahl;
  for (const e of v) if (e.ab <= nr) n = e.anzahl;
  return n;
}

// Standard-Teilziel aus einer alten Anzahl (Übernahme bestehender Quests). Ungültige Anzahl → Standard der Art.
// artId (Beständigkeit, 04.11.2026): Art des neuen Haupt-Teilziels, z. B. aus der Vorlage; unbekannt oder keine
// Prozess-Art mit Runden → Standardart. Eine Anzahl über der Grenze der Art wird auf ihr Maximum gesetzt (nicht auf den
// Standard), damit eine Vorlage mit 7 bei Beständigkeit 6 ergibt.
export function teilzielAusAnzahl(anzahl, id = 'tz1', arten = ZIELARTEN, cfg = TEILZIELE, artId = cfg.standardArt) {
  const ok = Object.prototype.hasOwnProperty.call(arten, artId) && arten[artId].prozess && grenzen(arten[artId], cfg.hauptZeitraum);
  const aid = ok ? artId : cfg.standardArt;
  const g = grenzen(arten[aid], cfg.hauptZeitraum);
  const n = imBereich(anzahl, g) ? anzahl : Number.isInteger(anzahl) && anzahl > g.max ? g.max : g.standard;
  return { id, art: aid, haupt: true, anzahl: n, zeitraum: cfg.hauptZeitraum };
}

export const freieId = belegt => { let i = 1; while (belegt.has(`tz${i}`)) i++; return `tz${i}`; };

// Neben-Teilziele haben keine Zählweise (Stützgewohnheiten sind Haken, sie bestimmen keine Runden)
const ohneZaehlweise = t => { const n = { ...t, haupt: false }; delete n.zaehlweise; delete n.zwVerlauf; return n; };

// Haupt-Teilziel in Form bringen: Zeitraum Runde (Entscheidung 2), ohne Name/seit/Archiv (Name = quest.ziel,
// zählt ab Runde 1, lässt sich nicht archivieren). Anzahl außerhalb der Rundengrenzen → Standard, Verlauf neu bereinigt.
function alsHaupt(t, arten, cfg) {
  const art = arten[t.art];
  const g = grenzen(art, cfg.hauptZeitraum);
  const h = { id: t.id, art: t.art, haupt: true, anzahl: imBereich(t.anzahl, g) ? t.anzahl : g.standard, zeitraum: cfg.hauptZeitraum };
  const v = bereinigeVerlauf(t.verlauf, g, cfg.verlaufMax);
  if (v.length) h.verlauf = v;
  // Zählweise gehört nur zum Haupt-Teilziel (sie bestimmt Runden und Tagesfrage)
  const zw = bereinigeZaehlweise(t.zaehlweise, t.art);
  if (zw && zw !== ZAEHLWEISE.standard) h.zaehlweise = zw;
  const zv = bereinigeZwVerlauf(t.zwVerlauf, t.art, cfg.verlaufMax);
  if (zv.length) h.zwVerlauf = zv;
  return h;
}

// Teilziele einer Quest bereinigen. Liefert immer eine Liste: zuerst das Haupt-Teilziel, dann die aktiven Neben-Teilziele
// (zusammen höchstens max), dann die archivierten (höchstens archivMax, die neuesten). anzahlAlt = quest.anzahl (Übernahme
// und Spiegel, siehe Kopf). Gleiche Eingabe → gleiche Ausgabe (die Übernahme beim Laden darf beliebig oft laufen).
export function bereinigeTeilziele(roh, anzahlAlt, arten = ZIELARTEN, cfg = TEILZIELE) {
  const gesehen = new Set();
  const alle = [];
  for (const x of Array.isArray(roh) ? roh : []) {
    const t = bereinigeTeilziel(x, arten, cfg);
    if (!t || gesehen.has(t.id)) continue;
    gesehen.add(t.id);
    alle.push(t);
  }
  const istProzess = t => !!(arten[t.art] && arten[t.art].prozess && grenzen(arten[t.art], cfg.hauptZeitraum));
  const aktiv = alle.filter(t => !t.archiviert);
  const archiv = alle.filter(t => t.archiviert);
  // Ohne Markierung: lieber ein Teilziel, das schon „je Runde“ zählt (ein „insgesamt“-Ziel würde umgedeutet)
  let haupt = aktiv.find(t => t.haupt && istProzess(t)) || aktiv.find(t => istProzess(t) && t.zeitraum === cfg.hauptZeitraum) || aktiv.find(istProzess);
  let h;
  if (haupt) h = alsHaupt(haupt, arten, cfg);
  else { h = teilzielAusAnzahl(anzahlAlt, freieId(gesehen), arten, cfg); gesehen.add(h.id); }
  // Spiegel: weicht quest.anzahl vom neuesten Wert ab, hat eine ältere Fassung ihn geändert → gilt sofort, Verlauf weg
  const g = grenzen(arten[h.art], cfg.hauptZeitraum);
  if (imBereich(anzahlAlt, g) && anzahlFuer(h) !== anzahlAlt) { h.anzahl = anzahlAlt; delete h.verlauf; }
  const neben = aktiv.filter(t => t !== haupt).slice(0, cfg.max - 1).map(ohneZaehlweise);
  const alt = archiv.map(ohneZaehlweise).slice(-cfg.archivMax);
  return [h, ...neben, ...alt];
}

// Haupt-Teilziel einer Quest. Ohne (gültige) Teilziele, z. B. bei Quests, die nicht durch migriere liefen:
// aus quest.anzahl abgeleitet. Wirft nie; ohne Quest → Standard.
export function hauptTeilziel(quest, arten = ZIELARTEN, cfg = TEILZIELE) {
  const anzahl = quest && quest.anzahl;
  const l = quest && Array.isArray(quest.teilziele) ? quest.teilziele : null;
  const roh = l && l.find(t => t && t.haupt === true && !t.archiviert);
  const b = roh ? bereinigeTeilziel(roh, arten, cfg) : null;
  if (b && arten[b.art].prozess && grenzen(arten[b.art], cfg.hauptZeitraum)) {
    const h = alsHaupt(b, arten, cfg);
    const g = grenzen(arten[h.art], cfg.hauptZeitraum);
    if (imBereich(anzahl, g) && anzahlFuer(h) !== anzahl) { h.anzahl = anzahl; delete h.verlauf; } // Spiegel, siehe Kopf
    return h;
  }
  return teilzielAusAnzahl(anzahl, 'tz1', arten, cfg);
}

// Art des Haupt-Teilziels (Eintrag aus dem Register) und ihre ID. Wirft nie; ohne Quest → Standardart.
export function hauptArtId(quest) { return hauptTeilziel(quest).art; }
export function hauptArt(quest) { return ZIELARTEN[hauptArtId(quest)] || ZIELARTEN[TEILZIELE.standardArt]; }
// Antworten, die für das Haupt-Teilziel zählen (Beständigkeit: auch „Keine Versuchung“). Fehlt die Angabe → ['ja'].
export function zaehltAntworten(quest) {
  const z = hauptArt(quest).zaehlt;
  return Array.isArray(z) && z.length ? z.slice() : ['ja'];
}
// Grenzen der Anzahl des Haupt-Teilziels (Quest bearbeiten zeigt nur diese Zahlen).
export function hauptGrenzen(quest) { return grenzen(hauptArt(quest), TEILZIELE.hauptZeitraum); }

// Anwendungen je Runde laut Haupt-Teilziel (ohne Rampe) in Runde nr; ohne nr der neueste Wert.
export function hauptAnzahl(quest, nr) {
  return anzahlFuer(hauptTeilziel(quest), nr);
}

// Aktive Neben-Teilziele (Stützgewohnheiten) in ihrer Reihenfolge. Wirft nie.
export function nebenTeilziele(quest) {
  if (!quest || !Array.isArray(quest.teilziele)) return [];
  return bereinigeTeilziele(quest.teilziele, quest.anzahl).filter(t => !t.haupt && !t.archiviert);
}

// Anzahl eines Teilziels setzen, gültig ab Runde ab (Verlauf). ab ≤ 1: Grundwert (alles davor gibt es nicht).
// Ändert tz direkt; liefert true, wenn sich etwas geändert hat. Ungültige Anzahl → false.
export function setzeAnzahlAb(tz, anzahl, ab, arten = ZIELARTEN, cfg = TEILZIELE) {
  const g = tz && grenzen(arten[tz.art], tz.zeitraum);
  if (!g || !imBereich(anzahl, g)) return false;
  const vorher = JSON.stringify([tz.anzahl, tz.verlauf || []]);
  if (!Number.isInteger(ab) || ab <= 1) {
    tz.anzahl = anzahl;
    delete tz.verlauf;
  } else {
    const v = (Array.isArray(tz.verlauf) ? tz.verlauf : []).filter(e => e.ab < ab);
    if (anzahlFuer({ anzahl: tz.anzahl, verlauf: v }, ab - 1) !== anzahl) v.push({ ab, anzahl });
    // Zu langer Verlauf: die ältesten Werte gehen im Grundwert auf (betrifft nur die Anzeige sehr alter Runden)
    while (v.length > cfg.verlaufMax) tz.anzahl = v.shift().anzahl;
    if (v.length) tz.verlauf = v; else delete tz.verlauf;
  }
  return JSON.stringify([tz.anzahl, tz.verlauf || []]) !== vorher;
}

// Anzahl des Haupt-Teilziels setzen (Quest bearbeiten). Ändert die übergebene Quest (vorher kopieren); hält
// quest.anzahl als Spiegel. ab = Runde, ab der sie gilt; ohne ab sofort für alle Runden (Verhalten vor dem Schritt
// „Zähler“, für ältere Aufrufer). Liefert true, wenn sich etwas geändert hat.
export function setzeHauptAnzahl(quest, anzahl, ab) {
  if (!quest || typeof quest !== 'object') return false;
  const liste = bereinigeTeilziele(quest.teilziele, quest.anzahl);
  const h = liste[0];
  if (!imBereich(anzahl, grenzen(ZIELARTEN[h.art], h.zeitraum))) return false; // ungültig: Quest bleibt unberührt
  const geaendert = setzeAnzahlAb(h, anzahl, Number.isInteger(ab) ? ab : 1);
  quest.teilziele = liste;
  quest.anzahl = anzahlFuer(h);
  return geaendert;
}

// ---------- Zählweisen (04.11.2026, Entscheidungen Abschnitt 36) ----------
// Gültige Zählweise für eine Art oder null (unbekannt, passt nicht zur Art). Wirft nie.
export function bereinigeZaehlweise(id, artId, zw = ZAEHLWEISEN) {
  if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(zw, id)) return null;
  const e = zw[id];
  return Array.isArray(e.arten) && e.arten.includes(artId) ? id : null;
}
// Verlauf [{ ab, zaehlweise }]: Runde ab ≥ 2, gültige Zählweise, sortiert, je Runde der letzte, höchstens max.
function bereinigeZwVerlauf(roh, artId, max) {
  if (!Array.isArray(roh)) return [];
  const je = new Map();
  for (const e of roh) {
    if (!e || typeof e !== 'object' || !Number.isInteger(e.ab) || e.ab < 2 || e.ab > 9999) continue;
    const z = bereinigeZaehlweise(e.zaehlweise, artId);
    if (z) je.set(e.ab, z);
  }
  return [...je.entries()].sort((a, b) => a[0] - b[0]).map(([ab, zaehlweise]) => ({ ab, zaehlweise })).slice(-max);
}
// Zählweise eines (Haupt-)Teilziels in Runde nr; ohne nr der neueste Wert. Ungültig → Standard.
export function zaehlweiseFuer(tz, nr) {
  const grund = (tz && bereinigeZaehlweise(tz.zaehlweise, tz.art)) || ZAEHLWEISE.standard;
  const v = tz && Array.isArray(tz.zwVerlauf) ? tz.zwVerlauf : [];
  if (!Number.isInteger(nr)) return v.length ? v[v.length - 1].zaehlweise : grund;
  let z = grund;
  for (const e of v) if (e.ab <= nr) z = e.zaehlweise;
  return z;
}
// Zählweise des Haupt-Teilziels einer Quest (ID) in Runde nr. Wirft nie; ohne Quest → Standard.
export function hauptZaehlweise(quest, nr) { return zaehlweiseFuer(hauptTeilziel(quest), nr); }
// Eintrag aus dem Register (mit id); unbekannt → Standard.
export function zaehlweiseVon(id) {
  const k = Object.prototype.hasOwnProperty.call(ZAEHLWEISEN, id) ? id : ZAEHLWEISE.standard;
  return { id: k, ...ZAEHLWEISEN[k] };
}
// Zählweisen, die zur Art des Haupt-Teilziels passen (Reihenfolge laut ZAEHLWEISE.reihe).
export function zaehlweisenFuerQuest(quest) {
  const art = hauptArtId(quest);
  return ZAEHLWEISE.reihe.filter(id => bereinigeZaehlweise(id, art));
}
// Zählweise des Haupt-Teilziels setzen, gültig ab Runde ab (ab ≤ 1: Grundwert). Ändert die übergebene Quest (vorher
// kopieren). Passt die Zählweise nicht zur Art → false, Quest unberührt. Liefert true, wenn sich etwas geändert hat.
export function setzeHauptZaehlweise(quest, id, ab, cfg = TEILZIELE) {
  if (!quest || typeof quest !== 'object') return false;
  const liste = bereinigeTeilziele(quest.teilziele, quest.anzahl);
  const h = liste[0];
  if (!bereinigeZaehlweise(id, h.art)) return false;
  const vorher = JSON.stringify([h.zaehlweise || null, h.zwVerlauf || []]);
  const setzeGrund = z => { if (z === ZAEHLWEISE.standard) delete h.zaehlweise; else h.zaehlweise = z; };
  if (!Number.isInteger(ab) || ab <= 1) {
    setzeGrund(id);
    delete h.zwVerlauf;
  } else {
    const v = (Array.isArray(h.zwVerlauf) ? h.zwVerlauf : []).filter(e => e.ab < ab);
    if (zaehlweiseFuer({ ...h, zwVerlauf: v }, ab - 1) !== id) v.push({ ab, zaehlweise: id });
    while (v.length > cfg.verlaufMax) setzeGrund(v.shift().zaehlweise);
    if (v.length) h.zwVerlauf = v; else delete h.zwVerlauf;
  }
  quest.teilziele = liste;
  return JSON.stringify([h.zaehlweise || null, h.zwVerlauf || []]) !== vorher;
}
// Datenprüfung des Registers: Liste lesbarer Fehler, leer = in Ordnung.
export function pruefeZaehlweisen(zw = ZAEHLWEISEN, cfg = ZAEHLWEISE, arten = ZIELARTEN) {
  const f = [];
  if (!zw || typeof zw !== 'object' || !Object.keys(zw).length) return ['Zählweisen fehlen'];
  for (const [id, e] of Object.entries(zw)) {
    if (!e || typeof e.name !== 'string' || !e.name.trim()) f.push(`${id}: name fehlt`);
    for (const k of ['tagesfrage', 'rundeOffen']) if (typeof (e && e[k]) !== 'boolean') f.push(`${id}: ${k} muss true oder false sein`);
    if (!Array.isArray(e && e.arten) || !e.arten.length) f.push(`${id}: arten fehlen`);
    else for (const a of e.arten) if (!arten[a]) f.push(`${id}: unbekannte Zielart ${a}`);
    if (e && e.texte && (typeof e.texte !== 'object' || Object.values(e.texte).some(k => typeof k !== 'string' || !k))) f.push(`${id}: texte müssen Textschlüssel sein`);
    // Ohne Tagesfrage gibt es kein „Keine Versuchung“: eine Art, die „nein“ zählt, braucht die Tagesfrage
    if (e && e.tagesfrage === false && Array.isArray(e.arten)) for (const a of e.arten) if (arten[a] && Array.isArray(arten[a].zaehlt) && arten[a].zaehlt.includes('nein')) f.push(`${id}: ${a} zählt „nein“ und braucht die Tagesfrage`);
  }
  if (!cfg || !zw[cfg.standard]) f.push('ZAEHLWEISE.standard muss eine Zählweise sein');
  else if (zw[cfg.standard].tagesfrage !== true || zw[cfg.standard].rundeOffen !== false) f.push('ZAEHLWEISE.standard muss täglich mit fester Runde sein (Altbestand)');
  if (!cfg || !Array.isArray(cfg.reihe) || cfg.reihe.some(id => !zw[id])) f.push('ZAEHLWEISE.reihe enthält unbekannte Zählweisen');
  return f;
}
