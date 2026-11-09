// Tester-Hinweis (Entscheidung 09.11.2026): Karte unter den Neuigkeiten der Startseite (einmal, „Verstanden“) und der
// Eintrag „Info & Datenschutz“ in den Einstellungen (immer da, ohne Knopf). Daten: daten/testerhinweis.js,
// Regel: logik/testerhinweis.js, Texte: daten/texte.js (`tester.*`).
// Tonregel: sachlich und ohne Alarm. Keine Zusage ohne Entsprechung im Code (Übertragung nur nach Einwilligung: app.js verbindeSender).
import { esc } from './helfer.js';
import { karteOffen } from '../logik/testerhinweis.js';
import { kx } from './kontext.js';

// Karte unter den Neuigkeiten (NEU_KARTEN.testerhinweis, „leise“: nur bei freiem Platz, verdrängt nichts, wartet nie).
export function testerKarte() {
  const { T, stand, testerHinweis } = kx;
  if (!karteOffen(testerHinweis, !!(stand && stand.quest))) return '';
  return `<div class="karte spalte tester-karte">
    <span class="eyebrow akzent">${esc(T('tester.eyebrow'))}</span>
    <span class="nm">${esc(T('tester.titel'))}</span>
    <p class="klein">${esc(T('tester.text'))} ${esc(T('tester.verweis'))}</p>
    <button class="btn voll" data-a="tester-verstanden">${esc(T('tester.verstanden'))}</button>
  </div>`;
}

// Eintrag unter Einstellungen › Testphase: derselbe Text zum Nachlesen, ohne Knopf (nichts ist hier eine Aufgabe).
export function testerEintrag() {
  const { T } = kx;
  return `<details class="einw-mehr"><summary>${esc(T('tester.menueTitel'))}</summary><p class="klein">${esc(T('tester.text'))} ${esc(T('tester.menue'))}</p></details>`;
}

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const TESTER_KLICKS = {
  'tester-verstanden'() { const { bestaetigeTesterHinweis, render } = kx; bestaetigeTesterHinweis(); render(); }
};
