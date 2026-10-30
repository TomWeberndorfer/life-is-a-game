// Quest bearbeiten (aus app.js ausgelagert, 30.10.2026; Version 38): Ziel-Text und Anzahl je Runde, gilt sofort.
// Prüfen und Speichern: questBearbeitenSpeichern() in app.js (Logik: K.questPruefen, K.questBearbeiten).
import { TABELLE } from '../daten/vorlagen.js';
import * as K from '../logik/kern.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

export const QUEST_SCREENS = {
  // Quest bearbeiten (Version 38): Ziel-Text und Anzahl je Runde, gilt sofort.
  quest_bearbeiten() {
    const { SCREENS, T, aktuelleVorlage, jetzt, nameVon, stand, ui, wort } = kx;
    if (!stand.quest || !ui.qe) { ui.screen = 'start'; return SCREENS.start(); }
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const g = TABELLE.gegner[v.gegner];
    const a = K.auswertung(stand, jetzt());
    const q = ui.qe;
    const anz = Number(q.anzahl);
    // Einstiegsrampe: anz ist das eigene Ziel; die laufende Runde braucht höchstens so viel (K.rundenZiel)
    const neuJetzt = Number.isInteger(anz) ? K.rundenZiel({ ...stand.quest, anzahl: anz }, a.siegeVorher) : a.anzahl;
    const sofortSieg = !a.siegHeute && neuJetzt < a.anzahl && a.wocheZaehler >= neuJetzt;
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="qe-abbrechen">${icon('zurueck')} ${esc(T('qe.abbrechen'))}</button></div>
      <div class="inhalt">
        <span class="eyebrow akzent">${esc(nameVon(v.held).toUpperCase())}</span>
        <h1>${esc(T('qe.titel', { quest: wort('quest') }))}</h1>
        <label class="feld"><span>${esc(T('qe.ziel'))}</span><input id="qe-ziel" maxlength="${K.ZIEL_MAX}" value="${esc(q.ziel)}" autocomplete="off" ${q.fehler.ziel ? 'aria-invalid="true" aria-describedby="qe-ziel-f"' : ''}></label>
        ${q.fehler.ziel ? `<p class="fehler" id="qe-ziel-f" role="alert">${esc(q.fehler.ziel)}</p>` : ''}
        <div class="feld"><span id="qe-anz-l">${esc(T(a.rampe ? 'qe.anzahlZiel' : 'qe.anzahl'))}</span>
          <div class="wahl qe-anzahl" role="group" aria-labelledby="qe-anz-l">${Array.from({ length: K.ANZAHL_MAX - K.ANZAHL_MIN + 1 }, (_, i) => i + K.ANZAHL_MIN).map(n => `<button class="opt kurz ${anz === n ? 'sel' : ''}" aria-pressed="${anz === n}" data-a="qe-anzahl" data-id="${n}">${n}</button>`).join('')}</div>
        </div>
        ${q.fehler.anzahl ? `<p class="fehler" role="alert">${esc(q.fehler.anzahl)}</p>` : ''}
        <p class="klein">${esc(T('qe.anzahlHilfe', { faehigkeit: f.name, anzahl: anz || '?' }))}</p>
        ${a.rampe && Number.isInteger(anz) && neuJetzt < anz ? `<p class="klein">${esc(T('qe.rampeHilfe', { jetzt: neuJetzt, anzahl: anz }))}</p>` : ''}
        <p class="klein">${esc(T('qe.sofort', { geschafft: a.wocheZaehler }))}</p>
        ${sofortSieg ? `<div class="notiz" role="status">${icon('stern')}<p>${esc(T('qe.siegHinweis', { gegner: g.name, sieg: wort('sieg') }))}</p></div>` : ''}
        <p class="klein">${esc(T('qe.festHinweis', { faehigkeit: wort('faehigkeit') }))}</p>
      </div>
      <div class="fuss"><button class="cta" data-a="qe-speichern">${esc(T('qe.speichern'))}</button></div>
    </section>`;
  }
};

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const QUEST_KLICKS = {
  'quest-bearbeiten'() { const { questBearbeitenOeffnen } = kx; questBearbeitenOeffnen(); },
  'qe-anzahl'({ id }) { const { render, ui } = kx; if (ui.qe) { ui.qe.anzahl = Number(id); ui.qe.fehler = { ...ui.qe.fehler, anzahl: undefined }; render(); } },
  'qe-speichern'() { const { questBearbeitenSpeichern } = kx; questBearbeitenSpeichern(); },
  'qe-abbrechen'() { const { geheZu, ui } = kx; ui.qe = null; geheZu('start'); }
};
// Felder (Feld-Eingaben aufteilen, 30.10.2026): Ziel tippen, Enter speichert.
export const QUEST_FELDER = {
  'qe-ziel': {
    input({ el, wert }) {
      const { finde, ui } = kx;
      if (!ui.qe) return;
      ui.qe.ziel = String(wert ?? '').slice(0, K.ZIEL_MAX);
      // Fehlermeldung beim Tippen entfernen, ohne neu zu zeichnen (Fokus bleibt im Feld)
      if (ui.qe.fehler.ziel && ui.qe.ziel.trim()) {
        ui.qe.fehler = { ...ui.qe.fehler, ziel: undefined };
        finde('#qe-ziel-f')?.remove();
        el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby');
      }
    },
    enter() { const { questBearbeitenSpeichern } = kx; questBearbeitenSpeichern(); }
  }
};
