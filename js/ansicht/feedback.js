// Feedback-Bogen (aus app.js ausgelagert, 30.10.2026): Fragen und Antwortwahl aus daten/forschung.js (FEEDBACK).
// Absenden prüft app.js (nur die Wahlfragen sind Pflicht).
import { feedback as sendeFeedback } from '../analytics.js';
import { FEEDBACK } from '../daten/forschung.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

export const FB_TEXT_MAX = 600; // Länge der freien Antworten (Feld und Speicher)

export const FEEDBACK_SCREENS = {
  feedback() {
    const { T, ui } = kx;
    const wahlBtn = (q, w, label) => `<button class="opt kurz ${ui.fb[q] === w ? 'sel' : ''}" aria-pressed="${ui.fb[q] === w}" data-a="fb-wahl" data-id="${q}:${w}">${esc(label)}</button>`;
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} ${esc(T('nav.zurueck'))}</button></div>
      <div class="inhalt">
        <h1>${esc(T('fb.titel'))}</h1>
        <p class="lead">${esc(T('fb.intro'))}</p>
        ${FEEDBACK.fragen.map(q => q.art === 'text'
          ? `<label class="feld"><span>${esc(q.text)}</span><textarea id="fb-${q.id}" maxlength="${FB_TEXT_MAX}" rows="3">${esc(ui.fb[q.id] || '')}</textarea></label>`
          : `<div class="feld"><span id="fbq-${q.id}">${esc(q.text)}</span><div class="wahl" role="group" aria-labelledby="fbq-${q.id}">${FEEDBACK.wahl.map(([w, l]) => wahlBtn(q.id, w, l)).join('')}</div></div>`).join('')}
        ${ui.fbFehler ? `<p class="fehler" role="alert">${esc(T('fb.fehlt'))}</p>` : ''}
      </div>
      <div class="fuss"><button class="cta" data-a="feedback-senden">${esc(T('fb.senden'))}</button></div>
    </section>`;
  }
};

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const FEEDBACK_KLICKS = {
  'feedback-oeffnen'() { const { geheZu, ui } = kx; ui.fb = {}; ui.fbFehler = false; geheZu('feedback'); },
  'fb-wahl'({ id }) {
    const { render, ui } = kx;
    const [k, w] = String(id ?? '').split(':');
    if (k && w) ui.fb[k] = w; else console.warn('Feedback: ungültige Wahl', id);
    render();
  },
  // Nur die Wahlfragen sind Pflicht; Texte sind freiwillig.
  'feedback-senden'() {
    const { geheZu, render, ui } = kx;
    if (FEEDBACK.fragen.some(q => q.art === 'wahl' && !ui.fb[q.id])) { ui.fbFehler = true; render(); return; }
    sendeFeedback(ui.fb); ui.fbDanke = true; geheZu('start');
  }
};
// Felder (Feld-Eingaben aufteilen, 30.10.2026): alle Texte fb-<frage>.
export const FEEDBACK_FELDER = {
  'fb-*': { input({ el, wert }) { const { ui } = kx; ui.fb[el.id.slice(3)] = String(wert ?? '').slice(0, FB_TEXT_MAX); } }
};
