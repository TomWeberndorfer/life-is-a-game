// Morgenkarte und Morgenprobe. Daten und Regeln: PROBE in daten/startseite.js, Auswahl: logik/morgenkarte.js,
// Einträge und Muster: logik/eintraege.js (letzterPlan, probeUmschalten, musterHinweis).
// Version 81 (Entscheidung 30.10.2026): Morgenprobe „Wo könnte es heute schwierig werden?“. Version 173 (Entscheidung 10.11.2026,
// claude/entscheidung-morgenkarte.md) ersetzt die kurze Zeile auf der Heldentat und die Variantenwahl durch:
//   Morgenkarte   einmal am Tag beim ersten Öffnen, vor dem Tages-Check: je Held ein Gegner-Bild, das Ziel und der Wenn-dann-Plan
//                 (Auswahl siehe logik/morgenkarte.js), dazu der Satz zur Vorstellung. „Alle Helden ansehen“ öffnet das Blatt.
//   Blatt         alle Helden untereinander: Wenn-dann, letzter Plan, Muster-Hinweis und je Held „Könnte heute kommen“
//                 (Eintrag der Art probe, nur ein Merker). Auch aus dem „Rat für heute“ erreichbar („Heute vorbereitet“, sobald markiert).
// Psychologie: Wenn-dann-Pläne wirken über die Situation (Gollwitzer); das Durchspielen des eigenen Tuns hilft mehr als das
// Ausmalen des Ergebnisses (Pham & Taylor; Oettingen). Keine XP, keine Serie, kein „verpasst“: ein ausgelassener Morgen kostet nichts.
// Zustand nur für die Sitzung: ui.probeBlatt ({ fehler } oder null), ui.karteGemeldet (Zähler einmal je Sitzung).
import { trackEvent } from '../analytics.js';
import { EINTRAG_OPT } from '../daten/eintrag-arten.js';
import { PROBE } from '../daten/startseite.js';
import { TABELLE } from '../daten/vorlagen.js';
import * as EN from '../logik/eintraege.js';
import * as H from '../logik/helden.js';
import * as K from '../logik/kern.js';
import * as MK from '../logik/morgenkarte.js';
import { wennDann } from '../logik/startseite.js';
import { esc, icon, kurzDatum } from './helfer.js';
import { kx } from './kontext.js';

const planTage = () => (Number.isInteger(PROBE.planTage) && PROBE.planTage >= 0 && PROBE.planTage <= 90 ? PROBE.planTage : 30);
const musterMin = () => (Number.isInteger(PROBE.musterMin) && PROBE.musterMin >= 1 && PROBE.musterMin <= 20 ? PROBE.musterMin : 3);
// Einstellung der Person: Morgenkarte 'an' | 'aus' (fehlt oder ungültig → Standard, wie beim Laden)
export function karteModus() {
  const { spiel } = kx;
  return H.bereinigeEinstellungen(spiel.einstellungen).karte;
}
const heuteK = () => { const { jetzt } = kx; return K.tagKey(jetzt()); };
function letzterPlanSicher(heroId) {
  const { spiel } = kx;
  try { return EN.letzterPlan(spiel, heroId, heuteK(), planTage()); } catch (e) { console.warn('Morgenprobe:', e.message); return null; }
}
const planZeile = plan => {
  const { T } = kx;
  return plan ? `<p class="klein">${esc(T('probe.letzterPlan', { tag: kurzDatum(plan.tag) }))}</p><p class="probe-plan">${esc(plan.text)}</p>` : '';
};
const vorbereitetHeute = () => { const { spiel } = kx; const t = heuteK(); return (spiel.eintraege || []).some(e => e.art === 'probe' && e.tag === t); };

// Wenn-dann-Block (Wenn / Dann); leer ohne Plan. Gemeinsam für Karte und Blatt.
const wdHtml = wd => {
  const { T } = kx;
  return wd.wenn || wd.dann ? `<p class="probe-wd">${wd.wenn ? `<b>${esc(T('tat.wenn'))}</b> ${esc(wd.wenn)}` : ''}${wd.dann ? `<br><b>${esc(T('tat.dannLabel'))}</b> ${esc(wd.dann)}` : ''}</p>` : '';
};
const musterSicher = heroId => {
  const { spiel } = kx;
  try { return EN.musterHinweis(spiel, heroId, heuteK(), musterMin()); } catch (e) { console.warn('Morgenprobe (Muster):', e.message); return null; }
};
const musterZeile = (heroId, t) => {
  const { T } = kx;
  const m = musterSicher(heroId);
  return m ? `<p class="klein probe-muster">${esc(T('probe.muster', { wochentag: K.ausTagKey(t).toLocaleDateString('de-AT', { weekday: 'long' }), n: m.anzahl }))}</p>` : '';
};

// Leiser Link ins Blatt (im „Rat für heute“): ersetzt die Zeile auf der Heldentat. Zeigt „Heute vorbereitet“, sobald ein Merker steht.
export function probeHtml() {
  const { T, spiel } = kx;
  if (!PROBE.an || !spiel.fokus) return '';
  const fertig = vorbereitetHeute();
  return `<div class="probe"><button class="link eintrag-link probe-link" data-a="probe-blatt">${icon(fertig ? 'check' : 'kompass')}${esc(T(fertig ? 'probe.vorbereitet' : 'probe.link'))}</button></div>`;
}

// Steckbrief eines Helden für die Auswahl (logik/morgenkarte.js). ansichten: heldenKopfDaten().ansichten.
function steckbrief(h) {
  const f = TABELLE.faehigkeiten[h.v && h.v.faehigkeit];
  const wd = wennDann(f);
  return { id: h.id, modus: h.modus, zaehlweise: h.x && h.x.zaehlweise, wartet: !!h.wartet, ziel: h.a && h.a.quest ? h.a.quest.ziel : '', wenn: wd.wenn, dann: wd.dann, gegner: (h.x && h.x.gegner) || (h.v && h.v.gegner) || null };
}

// Morgenkarte (Abschnitt `morgenkarte` der Startseite): '' wenn aus, heute gesehen oder kein Held passt. Wirft nie nach außen.
export function morgenkarteHtml(ansichten) {
  const { T, img, jetzt, spiel, ui } = kx;
  const t = K.tagKey(jetzt());
  if (!Array.isArray(ansichten) || !MK.karteFaellig(spiel, t, karteModus())) return '';
  let auswahl;
  try { auswahl = MK.waehleZeilen(ansichten.map(steckbrief), { rampenlicht: spiel.fokus }); }
  catch (e) { console.warn('Morgenkarte:', e.message); return ''; }
  if (!auswahl.zeilen.length) return '';
  if (!ui.karteGemeldet) { ui.karteGemeldet = true; trackEvent('karte_shown', {}); }
  const zeilen = auswahl.zeilen.map(z => {
    const g = z.gegner && TABELLE.gegner[z.gegner];
    return `<li class="probe-held">
      <div class="probe-kopf">${g ? img('boss-' + z.gegner, g.name, 'boss', 'rund-klein', g.name) : ''}<span class="nm">${esc(z.ziel)}</span></div>
      ${wdHtml({ wenn: z.wenn, dann: z.dann })}${musterZeile(z.id, t)}
    </li>`;
  }).join('');
  const mitPlan = auswahl.zeilen.some(z => z.wenn || z.dann);
  return `<div class="karte spalte morgenkarte" role="region" aria-label="${esc(T('morgen.aria'))}">
    <span class="eyebrow akzent">${esc(T('morgen.eyebrow'))}</span>
    <ul class="probe-liste">${zeilen}</ul>
    <p class="klein">${esc(T(mitPlan ? 'probe.text' : 'probe.textOhnePlan'))}</p>
    <button class="btn voll" data-a="karte-zu">${esc(T('morgen.ok'))}</button>
    <div class="zeile"><button class="link" data-a="probe-blatt">${esc(T('morgen.alle'))}</button><button class="link" data-a="karte-modus" data-id="aus">${esc(T('morgen.aus'))}</button></div>
  </div>`;
}

// Blatt der ausführlichen Probe: alle Helden untereinander, der im Rampenlicht zuerst.
export function probeBlattHtml() {
  const { T, img, nameVon, spiel, ui } = kx;
  if (!ui.probeBlatt) return '';
  if (ui.screen !== 'start' || !spiel.helden.length) { ui.probeBlatt = null; return ''; }
  const t = heuteK();
  const helden = [...spiel.helden].sort((a, b) => (a.heroId === spiel.fokus ? -1 : b.heroId === spiel.fokus ? 1 : 0));
  const zeilen = helden.map(h => {
    const v = TABELLE.vorlagen.find(z => z.id === h.quest.vorlageId);
    const f = v && TABELLE.faehigkeiten[v.faehigkeit];
    const wd = wennDann(f);
    const an = EN.eintraegeVon(spiel, h.heroId, { art: 'probe', tag: t }).length > 0;
    return `<li class="probe-held${an ? ' an' : ''}">
      <div class="probe-kopf">${v ? img(v.held, nameVon(v.held), 'held', 'rund-klein', '') : ''}<span class="nm">${esc(v ? nameVon(v.held) : h.heroId)}</span></div>
      ${wd.wenn || wd.dann ? wdHtml(wd) : `<p class="klein">${esc(T('probe.keinPlan'))}</p>`}
      ${musterZeile(h.heroId, t)}
      ${planZeile(letzterPlanSicher(h.heroId))}
      <button class="opt kurz probe-merker ${an ? 'sel' : ''}" aria-pressed="${an}" data-a="probe-merker" data-id="${esc(h.heroId)}">${icon(an ? 'check' : 'kompass')}${esc(T(an ? 'probe.koennteAn' : 'probe.koennte'))}</button>
    </li>`;
  }).join('');
  const f = ui.probeBlatt.fehler;
  return `<div class="feier unten probe-blatt" role="dialog" aria-modal="true" aria-labelledby="probe-t">
    <button class="hintergrund" data-a="probe-zu" aria-label="${esc(T('nav.schliessen'))}" tabindex="-1"></button>
    <div class="blatt erscheint">
      <div class="blatt-inhalt">
        <span class="eyebrow">${esc(T('probe.frage').toUpperCase())}</span>
        <h2 id="probe-t">${esc(T('probe.titel'))}</h2>
        <p class="klein">${esc(T('probe.einleitung'))}</p>
        <ul class="probe-liste">${zeilen}</ul>
        ${f ? `<p class="fehler" role="alert">${esc(f)}</p>` : ''}
        <button class="cta" data-a="probe-zu">${esc(T('probe.bereit'))}</button>
      </div>
    </div>
  </div>`;
}

// Karte in den Einstellungen: Morgenkarte an oder aus (sofort, ohne Freischaltung; gespeichert in spiel.einstellungen.karte).
export function karteEinstellung() {
  const { T } = kx;
  if (!PROBE.an) return '';
  const jetzt = karteModus();
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('einst.karte'))}</span>
    <p class="klein">${esc(T('einst.karteText'))}</p>
    <div class="wahl" role="group" aria-label="${esc(T('einst.karte'))}">${(PROBE.karte.varianten || []).map(x => `<button class="opt kurz ${jetzt === x ? 'sel' : ''}" aria-pressed="${jetzt === x}" data-a="karte-modus" data-id="${esc(x)}">${esc(T('einst.karte.' + x))}</button>`).join('')}</div>
  </div>`;
}

// ---------- Klicks ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
// Analytics zählt nur: Karte gesehen (in der Ansicht), Karte weggetippt, Blatt geöffnet, Merker gesetzt, Karte an/aus; nie Held oder Text.
export const PROBE_KLICKS = {
  'probe-blatt'() {
    const { render, spiel, ui } = kx;
    if (!spiel.helden.length) return;
    ui.probeBlatt = { fehler: null };
    trackEvent('probe_opened', { variante: 'ausfuehrlich' });
    render();
  },
  'probe-zu'() { const { render, ui } = kx; ui.probeBlatt = null; render(); },
  // „Los geht’s“: die Karte gilt für heute als gesehen (auf jedem Gerät, Feld spiel.karteGesehen)
  'karte-zu'() {
    const { jetzt, render, setzeSpiel, speichere, spiel } = kx;
    const n = MK.karteGesehenSetzen(spiel, K.tagKey(jetzt()));
    if (n !== spiel) { setzeSpiel(n); speichere(); }
    trackEvent('karte_closed', {});
    render();
  },
  // id = 'an' | 'aus' (Einstellungen und „Nicht mehr zeigen“ auf der Karte). Unbekanntes: Warnung, nichts ändert sich.
  'karte-modus'({ id }) {
    const { render, setzeSpiel, speichere, spiel } = kx;
    if (!(PROBE.karte.varianten || []).includes(id)) { console.warn('Morgenkarte: unbekannte Wahl', id); return; }
    setzeSpiel({ ...spiel, einstellungen: { ...H.bereinigeEinstellungen(spiel.einstellungen), karte: id } });
    speichere();
    trackEvent('karte_modus', { modus: id });
    render();
  },
  'probe-merker'({ id }) {
    const { T, jetzt, render, setzeSpiel, speichere, spiel, ui } = kx;
    if (!ui.probeBlatt) return;
    if (!H.heldVon(spiel, id)) { console.warn('Morgenprobe: unbekannter Held', id); return; }
    try {
      const r = EN.probeUmschalten(spiel, id, jetzt(), EINTRAG_OPT);
      setzeSpiel(r.spiel);
      speichere();
      ui.probeBlatt.fehler = null;
      if (r.an) trackEvent('probe_marked', {});
    } catch (e) {
      ui.probeBlatt.fehler = T('probe.fehler', { grund: e.message });
    }
    render();
  }
};
