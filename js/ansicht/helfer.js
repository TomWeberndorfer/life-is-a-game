// Reine Ansichts-Helfer ohne Zustand (aus app.js ausgelagert, 30.10.2026). Direkt importieren, nicht über den Kontext.
import { BEWEGUNG } from '../daten/bewegung.js';
import { animation } from '../logik/bewegung.js';
import * as K from '../logik/kern.js';

// HTML-sicher: jeder Text aus Daten, Eingaben oder Registern geht vor dem Einsetzen hier durch.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Kurzes Datum „Mo, 2. Nov.“ aus einem Tagesschlüssel; versatz in Tagen (z. B. −1 = Vortag). Ungültig → ''.
export function kurzDatum(k, versatz = 0) {
  const d = K.ausTagKey(k);
  if (!d) return '';
  d.setDate(d.getDate() + versatz);
  return d.toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const gross = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
export const prozent = (wert, max) => `${Math.round(1000 * wert / max) / 10}%`;

// Symbole (Pfade für ein 24er-Raster). Neues Symbol = neue Zeile; unbekannter Name → Stern (kein Absturz).
export const ICON = {
  siegel: '<circle cx="12" cy="11" r="6"/><path d="M12 8v6M9 11h6"/><path d="M8 16l-2 5 3-1 1 3 2-4M16 16l2 5-3-1-1 3-2-4"/>',
  herz: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  menschen: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>',
  ziel: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  muenzen: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  welle: '<path d="M3 10c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/><path d="M3 15c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/>',
  sonne: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  teller: '<ellipse cx="12" cy="15" rx="9" ry="3.5"/><ellipse cx="12" cy="14.4" rx="5" ry="1.6"/><circle cx="10" cy="11" r="1.6"/><circle cx="13.6" cy="10.4" r="1.4"/>',
  schuh: '<path d="M3 16h18v3H3zM4 16l1-7h5l2 4 7 1.5V16"/>',
  mond: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  glas: '<path d="M7 4h10l-1 16H8zM7 9h10"/>',
  kalender: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  liste: '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
  zahnrad: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  zurueck: '<path d="M15 5l-7 7 7 7"/>',
  runter: '<path d="M6 9l6 6 6-6"/>',
  pfeilRechts: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  stift: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  stern: '<path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.6-.8z"/>',
  kompass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  buch: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  pfeil: '<path d="M4 18l6-6 4 4 6-8"/>',
  haus: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
  burg: '<path d="M4 20V9h3V6h3v3h4V6h3v3h3v11z"/><path d="M10 20v-5h4v5"/>',
  karte: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  schloss: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};
export const icon = (n, cls = 'ic') => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ICON.stern}</svg>`;

// Version 59: äußerstes Element eines Abschnitts markieren (data-abschnitt), damit Glanz & Co. ihn finden,
// ohne dass jede Karte selbst Attribute setzen muss. Leerer Abschnitt bleibt leer.
export function markiere(html, id) {
  if (typeof html !== 'string' || !html.trim()) return html;
  return html.replace(/^(\s*<[a-zA-Z][\w-]*)/, `$1 data-abschnitt="${esc(id)}"`);
}

// Gegnername im Akkusativ für „gegen den/die/das …“ (aus drei gleichen Stellen in app.js zusammengeführt).
export const akkusativ = name => String(name).replace(/^(Der|Die|Das) /, m => ({ 'Der ': 'den ', 'Die ': 'die ', 'Das ': 'das ' }[m]));

// Bewegung (Version 68): ` style="animation:…"` für einen Teil eines Ablaufs aus daten/bewegung.js, sonst ''.
// an = false → keine Bewegung (z. B. nur direkt nach einer Handlung). „Bewegung reduzieren“ regelt index.html global.
export function bwStil(ablauf, teil, an = true) {
  if (!an) return '';
  const a = animation(BEWEGUNG, ablauf, teil);
  return a ? ` style="animation:${esc(a)}"` : '';
}
// Roter Blitz über einem Bild (Treffer). Der Rahmen braucht position: relative und overflow: hidden.
export const blitzEbene = (ablauf, teil, an = true) => (an ? `<span class="bw-blitz-ebene" aria-hidden="true"${bwStil(ablauf, teil)}></span>` : '');
