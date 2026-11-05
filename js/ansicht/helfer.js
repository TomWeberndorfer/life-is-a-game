// Reine Ansichts-Helfer ohne Zustand (aus app.js ausgelagert, 30.10.2026). Direkt importieren, nicht über den Kontext.
import { BEWEGUNG } from '../daten/bewegung.js';
import { animation } from '../logik/bewegung.js';
import * as K from '../logik/kern.js';
import { SYMBOLE } from '../daten/symbole.js';
import { FORTSCHRITT, FORTSCHRITT_ORTE, FORTSCHRITT_STANDARD } from '../daten/startseite.js';
import { fortschrittOrte, zeigtFortschritt } from '../logik/startseite.js';

// Fortschritt ordnen (Version 140): Register einmal prüfen (Meldungen nur einmal), dann je Anzeige und Ort fragen.
let fortschrittCache = null;
export function fortschrittRegister() {
  if (!fortschrittCache) fortschrittCache = fortschrittOrte(FORTSCHRITT, FORTSCHRITT_STANDARD, FORTSCHRITT_ORTE, m => console.warn(m));
  return fortschrittCache;
}
export const fortschrittHier = (id, ort) => zeigtFortschritt(fortschrittRegister(), id, ort);

// HTML-sicher: jeder Text aus Daten, Eingaben oder Registern geht vor dem Einsetzen hier durch.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Kurzes Datum „Mo, 2. Nov.“ aus einem Tagesschlüssel; versatz in Tagen (z. B. −1 = Vortag). Ungültig → ''.
export function kurzDatum(k, versatz = 0) {
  const d = K.ausTagKey(k);
  if (!d) return '';
  d.setDate(d.getDate() + versatz);
  return d.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Großer Gegnerkopf (Version 132): Bild in der Bildform „auftritt“ mit Chip und Name auf dem Bild.
// Eine Vorlage für den Auftritt „Neuer Gegner“ (feier.js), das Gegnerblatt (blatt.js) und die Rückschau auf der Karte
// (karte.js). Größe zentral über --auftritt-max/--auftritt-min in index.html (Regel .gegner-kopf).
// bild = fertiges <img> (img(..., 'auftritt')); chipArt = Klasse des Chips (schlecht | gut); klasse = Zusatzklassen.
export function gegnerKopfHtml({ bild = '', chip = '', chipArt = 'schlecht', name = '', id = '', klasse = '' } = {}) {
  const kl = ['gegner-kopf', ...String(klasse || '').split(/\s+/).filter(Boolean)].join(' ');
  const schild = chip || name
    ? `<div class="auftritt-name">${chip ? `<span class="chip ${esc(chipArt)}">${esc(chip)}</span>` : ''}${name ? `<h2${id ? ` id="${esc(id)}"` : ''}>${esc(name)}</h2>` : ''}</div>`
    : '';
  return `<div class="${esc(kl)}">${bild}${schild}</div>`;
}

export const gross = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
export const prozent = (wert, max) => `${Math.round(1000 * wert / max) / 10}%`;

// Symbole: Verzeichnis in daten/symbole.js (seit Version 84). ICON bleibt als Name für bestehende Aufrufe.
export const ICON = SYMBOLE;
export const icon = (n, cls = 'ic') => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ICON.stern}</svg>`;

// Schnellleiste (31.10.2026, Version 93): Nebenaktion als Kachel mit Symbol und kurzem Wort, statt unterstrichenem Link.
// Grund: gleich große Tippflächen mit klarer Gestalt wirken wie ein Spielmenü und lassen sich leichter treffen; leise Farben
// (nie Rot), damit nach dem Tagesabschluss nichts nach Pflicht aussieht. Der lange Text bleibt als aria-label und Tooltip.
// a: { aktion, id?, symbol (fertiges SVG), kurz, lang?, klasse?, extra? (weitere Attribute, schon escaped) }
export function kachel(a) {
  const lang = a.lang || a.kurz;
  return `<button class="aktion-kachel ${esc(a.klasse || '')}" data-a="${esc(a.aktion)}"${a.id !== undefined ? ` data-id="${esc(a.id)}"` : ''} aria-label="${esc(lang)}" title="${esc(lang)}"${a.extra || ''}><span class="kachel-ic">${a.symbol}</span><span class="kachel-wort">${esc(a.kurz)}</span></button>`;
}
// Mehrere Kacheln in einer Reihe; leere Einträge fallen weg. Keine Kachel → ''.
export const kachelLeiste = (teile, klasse = '') => {
  const t = teile.filter(x => String(x || '').trim());
  return t.length ? `<div class="schnell-leiste ${esc(klasse)}" role="group">${t.join('')}</div>` : '';
};

// Version 59: äußerstes Element eines Abschnitts markieren (data-abschnitt), damit Glanz & Co. ihn finden,
// ohne dass jede Karte selbst Attribute setzen muss. Leerer Abschnitt bleibt leer.
// art (31.10.2026): Name des Attributs, z. B. 'neu' für die Karten im festen Neuigkeiten-Platz (data-neu).
export function markiere(html, id, art = 'abschnitt') {
  if (typeof html !== 'string' || !html.trim()) return html;
  const name = /^[a-z]+$/.test(art) ? art : 'abschnitt';
  return html.replace(/^(\s*<[a-zA-Z][\w-]*)/, `$1 data-${name}="${esc(id)}"`);
}

// Gegnername im Akkusativ für „gegen den/die/das …“ (aus drei gleichen Stellen in app.js zusammengeführt).
export const akkusativ = name => String(name).replace(/^(Der|Die|Das) /, m => ({ 'Der ': 'den ', 'Die ': 'die ', 'Das ': 'das ' }[m]));

// Bewegung (Version 68): ` style="animation:…"` für einen Teil eines Ablaufs aus daten/bewegung.js, sonst ''.
// an = false → keine Bewegung (z. B. nur direkt nach einer Handlung). „Bewegung reduzieren“ regelt index.html global.
// cfg (02.11.2026): eigene Konfiguration für einen Durchgang, z. B. mit Lesezeiten (logik/bewegung.js mitLesezeit).
export function bwStil(ablauf, teil, an = true, versatzMs = 0, cfg = BEWEGUNG) {
  if (!an) return '';
  const a = animation(cfg || BEWEGUNG, ablauf, teil, versatzMs);
  return a ? ` style="animation:${esc(a)}"` : '';
}
// Roter Blitz über einem Bild (Treffer). Der Rahmen braucht position: relative und overflow: hidden.
export const blitzEbene = (ablauf, teil, an = true, versatzMs = 0) => (an ? `<span class="bw-blitz-ebene" aria-hidden="true"${bwStil(ablauf, teil, true, versatzMs)}></span>` : '');

// Version 75: Klasse „erscheint“ (Einblendung beim Öffnen) aus class-Attributen entfernen, z. B. wenn ein offenes Blatt
// nur neu gezeichnet wird. Nur das ganze Wort, nie Text außerhalb von class="…".
// Erster Buchstabe groß (z. B. Stilwort „besiegt“ → „Besiegt“ im Stempel). Leer bei leerem Text.
export const grossAnfang = t => (t ? String(t).charAt(0).toUpperCase() + String(t).slice(1) : '');
export const ohneEinblendung = html => String(html ?? '').replace(/(class="[^"]*?)\s*\berscheint\b/g, '$1');
