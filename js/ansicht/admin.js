// Auswertung #admin (aus app.js ausgelagert, 30.10.2026): nur für den Besitzer. Kennzahlen aus logik/kennzahlen.js,
// Laden und Import (Code, CSV) in app.js (ladeAdmin, importiere, importiereCsv).
import { LEBENSBEREICHE } from '../daten/lebensbereiche.js';
import * as M from '../logik/kennzahlen.js';
import * as K from '../logik/kern.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

export const ADMIN_SCREENS = {
  admin() {
    const { T, VERSION, ui } = kx;
    const A = ui.admin;
    const kopf = `<div class="start-kopf"><button class="link" data-a="start">${icon('zurueck')} ${esc(T('admin.zurApp'))}</button><button class="btn klein-btn" data-a="admin-neu">${esc(T('admin.aktualisieren'))}</button></div>`;
    if (A.laden && !A.daten) return `<section class="screen admin">${kopf}<div class="inhalt"><h1>${esc(T('admin.titel'))}</h1><p class="lead" role="status">${esc(T('admin.laedt'))}</p>${importHtml()}</div></section>`;
    if (A.fehler) return `<section class="screen admin">${kopf}<div class="inhalt"><h1>${esc(T('admin.titel'))}</h1><p class="fehler" role="alert">${esc(A.fehler)}</p>${importHtml()}</div></section>`;
    if (!A.daten) return `<section class="screen admin">${kopf}<div class="inhalt"><h1>${esc(T('admin.titel'))}</h1><p class="lead">${esc(T('admin.nichtGeladen'))}</p>${importHtml()}</div></section>`;
    const heute = K.tagKey(new Date());
    const t = M.filtere(A.daten, { testprofile: A.test, besitzer: A.besitzer });
    const g = M.grundzahlen(t, heute);
    const h = M.heroEngagement(t);
    const tr = M.trichter(t);
    const rk = M.featureRanking(t);
    const er = M.erkenntnisse(t, heute);
    const fb = M.feedbackAuswertung(t);
    const kp = M.kapitel(t);
    const lb = M.lebensbereiche(t);
    const fs = M.freischaltungen(t);
    const kl = M.klappen(t);
    const lbName = id => (LEBENSBEREICHE.find(d => d.id === id) || { name: id }).name;
    const { pct, minSek } = M.format;
    const kachel = (l, v, s) => `<div class="kachel"><span class="eyebrow">${l}</span><span class="zahl">${v}</span><span class="klein">${s}</span></div>`;
    const balken = (l, w, txt) => `<div class="bz"><span>${esc(l)}</span><div class="balken"><i style="width:${Math.max(0, Math.min(100, Math.round(w)))}%"></i></div><b>${txt}</b></div>`;
    const ret = x => (x.wert === null ? `–` : pct(x.wert));
    const maxT = Math.max(1, ...tr.schritte.map(s => s.anzahl));
    const komma = x => (x === null || x === undefined ? '–' : x.toFixed(1).replace('.', ','));
    return `<section class="screen admin">${kopf}
      <div class="inhalt">
        <h1>${esc(T('admin.titelVoll'))}</h1>
        <p class="klein">${esc(T('admin.version', { nr: VERSION.nr, datum: VERSION.datum }))}</p>
        <p class="klein">${esc(T('admin.geladen', { n: A.daten.length, zeit: new Date().toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) }))}</p>
        <div class="filter">
          <button class="opt kurz ${A.test ? 'sel' : ''}" aria-pressed="${A.test}" data-a="admin-test">${esc(T('admin.mitTest'))}</button>
          <button class="opt kurz ${A.besitzer ? 'sel' : ''}" aria-pressed="${A.besitzer}" data-a="admin-besitzer">${esc(T('admin.mitBesitzer'))}</button>
        </div>
        ${importHtml()}
        <div class="kacheln">
          ${kachel(esc(T('admin.tester')), g.tester, esc(T('admin.testerText')))}
          ${kachel(esc(T('admin.sessions')), g.sessions, esc(T('admin.sessionsText')))}
          ${kachel(esc(T('admin.sitzung')), minSek(g.dauerMs), esc(T('admin.sitzungText')))}
          ${kachel(esc(T('admin.premium')), pct(g.premium.rate), esc(T('admin.premiumText', { geklickt: g.premium.geklickt, gesehen: g.premium.gesehen })))}
          ${kachel('D1', ret(g.d1), esc(T('admin.vonBasis', { n: g.d1.zurueck, basis: g.d1.basis })))}
          ${kachel('D3', ret(g.d3), esc(T('admin.vonBasis', { n: g.d3.zurueck, basis: g.d3.basis })))}
          ${kachel('D7', ret(g.d7), esc(T('admin.vonBasis', { n: g.d7.zurueck, basis: g.d7.basis })))}
        </div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.hes'))}</span><span class="zahl gross-z">${h.score === null ? '–' : h.score}<small> ${esc(T('admin.von100'))}</small></span>
          ${balken(T('admin.hesHeld'), h.held === null ? 0 : 100 * (h.held - 1) / 4, komma(h.held))}
          ${balken(T('admin.hesWieder'), h.wiederbesuche || 0, h.wiederbesuche === null ? '–' : h.wiederbesuche)}
          ${balken(T('admin.hesDauer'), h.verweildauer || 0, h.verweildauer === null ? '–' : h.verweildauer)}
          ${balken(T('admin.hesStory'), h.story === null ? 0 : 100 * (h.story - 1) / 4, komma(h.story))}
        </div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.erkenntnisse'))}</span><ul class="erkenntnisse">${er.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.ranking'))}</span><span class="klein">${esc(T('admin.rankingText'))}</span>
          ${rk.map((r, i) => balken(`${i + 1} ${r.name}`, r.score, r.score)).join('')}</div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.bosskette'))}</span>
          ${balken(T('admin.besiegt'), kp.basis ? 100 * kp.sieger / kp.basis : 0, esc(T('admin.vonBasis', { n: kp.sieger, basis: kp.basis })))}
          ${kp.stufen.map(s => balken(T('admin.kapitel', { kapitel: s.kapitel }), kp.basis ? 100 * s.tester / kp.basis : 0, `${s.tester}`)).join('') || `<span class="klein">${esc(T('admin.kapitelLeer'))}</span>`}
          <span class="klein">${esc(T('admin.ab17'))}</span></div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.bereiche'))}</span>
          ${lb.map(x => balken(lbName(x.domain), 100 * x.anzahl / Math.max(1, ...lb.map(y => y.anzahl)), x.anzahl)).join('') || `<span class="klein">${esc(T('admin.bereicheLeer'))}</span>`}</div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.freischaltungen'))}</span>
          ${fs.bereiche.map(b => balken(M.screenName(b.bereich), 100 * b.genutzt / Math.max(1, b.freigegeben), esc(T('admin.genutztVon', { n: b.genutzt, basis: b.freigegeben })))).join('') || `<span class="klein">${esc(T('admin.freischaltungenLeer'))}</span>`}
          <span class="klein">${esc(T('admin.freischaltungenText', { n: fs.spaeter }))}</span></div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.klappen'))}</span>
          ${kl.map(k => balken(M.screenName(k.abschnitt), t.length ? 100 * k.zu / t.length : 0, esc(T('admin.klappenZeile', { zu: k.zu, auf: k.auf })))).join('') || `<span class="klein">${esc(T('admin.klappenLeer'))}</span>`}</div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.trichter'))}</span>
          ${tr.schritte.map(s => balken(s.label, 100 * s.anzahl / maxT, s.anzahl)).join('')}
          <span class="klein">${esc(T('admin.trichterDauer', { dauer: minSek(tr.dauerMs) }))}</span></div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.feedback', { n: fb.anzahl }))}</span>
          <span class="klein">${esc(T('admin.feedbackQuoten', { morgen: pct(fb.morgenJa), bezahlen: pct(fb.bezahlenJa) }))}</span>
          ${fb.texte.map(f => `<div class="fb-eintrag">${['spannend', 'langweilig', 'verbessern'].filter(k => f[k]).map(k => `<p><b>${esc(T('admin.fb.' + k))}:</b> ${esc(f[k])}</p>`).join('') || `<p class="klein">${esc(T('admin.fbNurWahl'))}</p>`}</div>`).join('')}</div>
        <div class="karte spalte"><span class="eyebrow">${esc(T('admin.liste'))}</span>
          <div class="tabelle-box"><table><thead><tr><th>${esc(T('admin.spalteTester'))}</th><th>${esc(T('admin.spalteErster'))}</th><th>${esc(T('admin.spalteTage'))}</th><th>${esc(T('admin.spalteHes'))}</th></tr></thead><tbody>
          ${t.map(x => `<tr><td>${esc(String(x.id).slice(0, 8))}</td><td>${esc(x.erster || '–')}</td><td>${Object.keys(x.tage).length}</td><td>${(h.je.find(j => j.id === x.id) || {}).score ?? '–'}</td></tr>`).join('') || `<tr><td colspan="4">${esc(T('admin.listeLeer'))}</td></tr>`}
          </tbody></table></div></div>
      </div>
    </section>`;
  }
};
export function importHtml() {
  const { T, ui } = kx;
  const i = ui.admin.importInfo;
  return `<div class="karte spalte">
    <span class="eyebrow">${esc(T('import.titel'))}</span>
    <p class="klein">${esc(T('import.text'))}</p>
    <label class="feld"><textarea id="import-code" rows="3" placeholder="LIAG1.…"></textarea></label>
    <button class="btn" data-a="admin-import">${esc(T('import.knopf'))}</button>
    <label class="feld"><span>${esc(T('import.csv'))}</span><input type="file" id="import-csv" accept=".csv,text/csv"></label>
    ${i ? `<p class="${i.fehler ? 'fehler' : 'klein'}" role="${i.fehler ? 'alert' : 'status'}">${esc(i.text)}</p>` : ''}
  </div>`;
}

// ---------- Klicks (Klick-Logik aufteilen, 30.10.2026) ----------
// Aktion (data-a) → Funktion({ id, aktion, el }). Zusammengeführt und verteilt in app.js über logik/klicks.js.
export const ADMIN_KLICKS = {
  'admin-neu'() { const { ladeAdmin } = kx; ladeAdmin(); },
  'admin-import'() { const { importiere } = kx; importiere(); },
  'admin-test'() { const { render, ui } = kx; ui.admin.test = !ui.admin.test; render(); },
  'admin-besitzer'() { const { render, ui } = kx; ui.admin.besitzer = !ui.admin.besitzer; render(); }
};
// Felder (Feld-Eingaben aufteilen, 30.10.2026): CSV-Datei der Google-Tabelle einlesen.
export const ADMIN_FELDER = {
  'import-csv': { change({ el }) { const { importiereCsv } = kx; return importiereCsv(el.files && el.files[0]); } }
};
