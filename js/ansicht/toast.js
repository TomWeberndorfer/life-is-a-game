// Kurze Bestätigungen als kleines Popup unten (Etappe 3, Entscheidung 02.11.2026, Punkte 2 und 3a): „Festgehalten.“,
// „Gespeichert.“ und Ähnliches erscheinen wie der Rückgängig-Hinweis über der Tableiste, werden vorgelesen (role="status")
// und verschwinden von selbst. Hinweise mit Inhalt (Sperrtexte, Fehler, „Neu für dich …“) bleiben als Box auf der Seite.
// Liegt außerhalb von #app, damit render() es nicht löscht. Ohne echtes DOM (Rauchtest) → false: der Aufrufer zeigt dann
// die Box wie bisher (kein stiller Verlust der Rückmeldung).
import { esc } from './helfer.js';

// Anzeigedauer wächst mit der Länge (Lesezeit), in Grenzen. Reine Funktion, testbar.
export const TOAST = { minMs: 3000, maxMs: 8000, msJeZeichen: 55 };
export function toastDauer(text, cfg = TOAST) {
  const n = String(text ?? '').length;
  const min = Number(cfg && cfg.minMs) || 3000, max = Number(cfg && cfg.maxMs) || 8000, je = Number(cfg && cfg.msJeZeichen) || 0;
  return Math.max(min, Math.min(max, min + Math.max(0, n - 20) * je));
}

let timer = null;
export function schliesseToast() {
  clearTimeout(timer); timer = null;
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
  const t = document.getElementById('toast');
  if (t && typeof t.remove === 'function') t.remove();
}
export function zeigeToast(text) {
  if (!text || typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.body) return false;
  try {
    schliesseToast();
    const el = document.createElement('div');
    el.id = 'toast'; el.className = 'rueck-hinweis toast'; el.setAttribute('role', 'status');
    el.innerHTML = `<span>${esc(text)}</span>`;
    el.addEventListener('click', schliesseToast); // antippen schließt sofort
    document.body.appendChild(el);
    timer = setTimeout(schliesseToast, toastDauer(text));
    return true;
  } catch (e) { console.warn('Bestätigung:', e.message); return false; }
}
