// Quest bearbeiten (aus app.js ausgelagert, 30.10.2026; Version 38): Ziel-Text und Anzahl je Runde. Seit dem Schritt
// „Zähler“ (31.10.2026) gilt eine neue Anzahl ab der nächsten Runde (sofort nur ohne Treffer in der laufenden Runde);
// darunter die Stützgewohnheiten (ansicht/stuetzen.js), die sich sofort ändern, ohne „Speichern“.
// Prüfen und Speichern: questBearbeitenSpeichern() in app.js (Logik: K.questPruefen, K.questBearbeiten).
import { TABELLE } from '../daten/vorlagen.js';
import * as K from '../logik/kern.js';
import { hauptGrenzen, hauptZaehlweise, zaehlweiseVon, zaehlweisenFuerQuest } from '../logik/teilziele.js'; // Beständigkeit, Zählweisen (04.11.2026)
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';
import { stuetzenBearbeitenHtml } from './stuetzen.js'; // Schritt „Zähler“

export const QUEST_SCREENS = {
  // Quest bearbeiten (Version 38): Ziel-Text und Anzahl je Runde (ab nächster Runde, Schritt „Zähler“).
  quest_bearbeiten() {
    const { SCREENS, T, aktuelleVorlage, jetzt, nameVon, stand, ui, wort } = kx;
    if (!stand.quest || !ui.qe) { ui.screen = 'start'; return SCREENS.start(); }
    const v = aktuelleVorlage();
    const f = TABELLE.faehigkeiten[v.faehigkeit];
    const a = K.auswertung(stand, jetzt());
    const q = ui.qe;
    const anz = Number(q.anzahl);
    const hg = hauptGrenzen(stand.quest) || { min: K.ANZAHL_MIN, max: K.ANZAHL_MAX };
    // Einstiegsrampe: anz ist das eigene Ziel; die laufende Runde braucht höchstens so viel (K.rundenZiel)
    const neuJetzt = Number.isInteger(anz) ? K.rundenZiel({ ...stand.quest, anzahl: anz }, a.siegeVorher) : a.anzahl;
    // Schritt „Zähler“: ohne Treffer in der laufenden Runde gilt eine neue Anzahl sofort, sonst ab der nächsten Runde
    const sofort = a.wocheZaehler === 0;
    const wartet = a.naechsteZielAnzahl !== a.zielAnzahl ? a.naechsteZielAnzahl : null;
    // Version 181 (Punkt 5 vom 10.11.2026): die gewählte Zählweise bestimmt, was die Zahl heißt (Tage, Male pro Woche,
    // gemeisterte Momente). Texte aus dem Register (`texte.anzahl…`), sonst die allgemeinen `qe.*`. Folgt der Wahl sofort.
    const zwTexte = (zaehlweiseVon(gewaehlteZaehlweise(stand, q)).texte) || {};
    const zwText = (feld, standard) => zwTexte[feld] || standard;
    return `<section class="screen">
      <div class="start-kopf"><button class="link" data-a="qe-abbrechen">${icon('zurueck')} ${esc(T('qe.abbrechen'))}</button></div>
      <div class="inhalt">
        <span class="eyebrow akzent">${esc(nameVon(v.held).toUpperCase())}</span>
        <h1>${esc(T('qe.titel', { quest: wort('quest') }))}</h1>
        <label class="feld"><span>${esc(T('qe.ziel'))}</span><input id="qe-ziel" maxlength="${K.ZIEL_MAX}" value="${esc(q.ziel)}" autocomplete="off" ${q.fehler.ziel ? 'aria-invalid="true" aria-describedby="qe-ziel-f"' : ''}></label>
        ${q.fehler.ziel ? `<p class="fehler" id="qe-ziel-f" role="alert">${esc(q.fehler.ziel)}</p>` : ''}
        <label class="feld"><span>${esc(T('qe.warum'))}</span><textarea id="qe-warum" rows="2" maxlength="${K.WARUM_MAX}" placeholder="${esc(T('ob.warumBeispiel'))}" ${q.fehler.warum ? 'aria-invalid="true"' : ''}>${esc(q.warum || '')}</textarea></label>
        ${q.fehler.warum ? `<p class="fehler" role="alert">${esc(q.fehler.warum)}</p>` : `<p class="klein">${esc(T('qe.warumHilfe'))}</p>`}
        ${zaehlweiseHtml(stand, a, q)}
        <div class="feld"><span id="qe-anz-l">${esc(T(zwText(a.rampe ? 'anzahlZiel' : 'anzahl', a.rampe ? 'qe.anzahlZiel' : 'qe.anzahl')))}</span>
          <div class="wahl qe-anzahl" role="group" aria-labelledby="qe-anz-l">${Array.from({ length: hg.max - hg.min + 1 }, (_, i) => i + hg.min).map(n => `<button class="opt kurz ${anz === n ? 'sel' : ''}" aria-pressed="${anz === n}" data-a="qe-anzahl" data-id="${n}">${n}</button>`).join('')}</div>
        </div>
        ${q.fehler.anzahl ? `<p class="fehler" role="alert">${esc(q.fehler.anzahl)}</p>` : ''}
        <p class="klein">${esc(T(anz === 1 ? zwText('anzahlHilfeEins', zwText('anzahlHilfe', 'qe.anzahlHilfe')) : zwText('anzahlHilfe', 'qe.anzahlHilfe'), { faehigkeit: f.name, anzahl: anz || '?' }))}</p>
        ${a.rampe && Number.isInteger(anz) && neuJetzt < anz ? `<p class="klein">${esc(T('qe.rampeHilfe', { jetzt: neuJetzt, anzahl: anz }))}</p>` : ''}
        ${wartet ? `<p class="klein" role="status">${esc(T('qe.wartet', { anzahl: wartet }))}</p>` : ''}
        ${abWannHtml(stand, a, q, sofort)}
        <p class="klein">${esc(T('qe.festHinweis', { faehigkeit: wort('faehigkeit') }))}</p>
        ${stuetzenBearbeitenHtml()}
      </div>
      <div class="fuss"><button class="cta" data-a="qe-speichern">${esc(T('qe.speichern'))}</button></div>
    </section>`;
  }
};

// Zählweise (04.11.2026, Entscheidungen Abschnitt 36): täglich · Rhythmus · Wache, nur wenn mehr als eine zur Zielart
// passt (Beständigkeit braucht die Tagesfrage). Gilt wie die Anzahl ab der nächsten Runde, sofort ohne Treffer.
// Version 179 (Punkt 10a): jede Wahl mit Namen und Beispielsatz darunter, damit man ohne Vorwissen sieht, was gemeint ist.
// Name und Satz kommen aus den Texten (`texte.name`, `texte.wahl`), sonst aus dem Register.
function zwKnopf(id, an) {
  const { T } = kx;
  const zw = zaehlweiseVon(id);
  const t = zw.texte || {};
  const name = t.name ? T(t.name) : zw.name;
  return `<button class="opt ${an ? 'sel' : ''}" aria-pressed="${an}" data-a="qe-zaehlweise" data-id="${esc(id)}"><span>${esc(name)}${t.wahl ? `<small>${esc(T(t.wahl))}</small>` : ''}</span></button>`;
}
// Gewählte Zählweise im Formular: die Wahl, wenn sie zur Quest passt, sonst die laufende.
function gewaehlteZaehlweise(stand, q) {
  const jetzt = hauptZaehlweise(stand.quest);
  try { const ids = zaehlweisenFuerQuest(stand.quest); return ids.includes(q.zaehlweise) ? q.zaehlweise : jetzt; }
  catch (e) { return jetzt; }
}
// Version 181: steht vor der Zahl, weil sie deren Bedeutung bestimmt.
function zaehlweiseHtml(stand, a, q) {
  const { T } = kx;
  const ids = zaehlweisenFuerQuest(stand.quest);
  if (ids.length < 2) return '';
  const gewaehlt = gewaehlteZaehlweise(stand, q);
  return `<div class="feld"><span id="qe-zw-l">${esc(T('qe.zaehlweise'))}</span>
          <div class="wahl qe-zaehlweise" role="group" aria-labelledby="qe-zw-l">${ids.map(id => zwKnopf(id, id === gewaehlt)).join('')}</div>
        </div>
        ${q.fehler.zaehlweise ? `<p class="fehler" role="alert">${esc(q.fehler.zaehlweise)}</p>` : ''}`;
}
// Version 181: ein gemeinsamer Hinweis, ab wann Änderungen gelten (vorher zweimal „In dieser Runde zählt noch kein Treffer“).
function abWannHtml(stand, a, q, sofort) {
  const { T } = kx;
  const zwNeu = gewaehlteZaehlweise(stand, q) !== hauptZaehlweise(stand.quest);
  if (sofort) return `<p class="klein" role="status">${esc(T(zwNeu ? 'qe.abSofortBeides' : 'qe.abSofort'))}</p>`;
  const zeilen = [T('qe.abNaechster', { geschafft: a.wocheZaehler, anzahl: a.zielAnzahl })];
  if (zwNeu) zeilen.push(a.rundeOffen ? T('qe.zwAbSieg') : T('qe.zwAbNaechster'));
  return zeilen.map((z, i) => `<p class="klein"${i ? ' role="status"' : ''}>${esc(z)}</p>`).join('');
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const QUEST_KLICKS = {
  'quest-bearbeiten'() { const { questBearbeitenOeffnen } = kx; questBearbeitenOeffnen(); },
  'qe-anzahl'({ id }) { const { render, ui } = kx; if (ui.qe) { ui.qe.anzahl = Number(id); ui.qe.fehler = { ...ui.qe.fehler, anzahl: undefined }; render(); } },
  'qe-zaehlweise'({ id }) { const { render, ui } = kx; if (ui.qe) { ui.qe.zaehlweise = String(id); ui.qe.fehler = { ...ui.qe.fehler, zaehlweise: undefined }; render(); } },
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
  },
  // Warum (Version 75): freiwillig; leer löscht es beim Speichern
  'qe-warum': { input({ wert }) { const { ui } = kx; if (ui.qe) ui.qe.warum = String(wert ?? '').slice(0, K.WARUM_MAX); } }
};
