// Pflegeansicht der Inhalte-Tabelle (Version 29, erweitert in 30). Nur für den Besitzer.
// Reines HTML aus dem Zustand; Texte über c.T aus texte.js (Schlüssel pflege.*, seit Klick-Logik aufteilen); Speichern, Hochladen und Löschen: logik/pflege.js.
// Version 30: alle Bildplätze je Stil sichtbar (auch eingebaute), Ausschnitt je Form (rund, quadrat, breit).
import { STILE, STIL_REIHENFOLGE } from '../daten/stile.js';
import { TEXTE } from '../daten/texte.js';
import * as P from '../logik/pflege.js';
import * as TB from '../logik/tabelle.js';
import { esc, icon } from './helfer.js';
import { kx } from './kontext.js';

const kurz = (s, n = 70) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
// Anzeigenamen aus texte.js (pflege.form.<form>, pflege.quelle.<quelle>, pflege.art.<art>); geprüft in ansicht.test.js.
export const PFLEGE_NAMEN = { form: ['alle', ...TB.FORMEN], quelle: ['tabelle', 'eingebaut', 'platzhalter'], art: TB.ARTEN };
const name = (T, gruppe, id) => (PFLEGE_NAMEN[gruppe].includes(id) ? T(`pflege.${gruppe}.${id}`) : id);

// Ausschnitt, den das Formular gerade für eine Form zeigt.
export const formPos = (f, form) => (form !== 'alle' && f.formen && f.formen[form]) || TB.normPos(f.pos) || TB.STANDARD_POS;

export function pflegeHtml(c) {
  const { T, esc, icon, index, p, stile, plaetze, standardTexte, bildFuer, eingebautesBild, kannHochladen, verbunden } = c;
  const FORM_NAME = k => name(T, 'form', k);
  const QUELLE_NAME = q => name(T, 'quelle', q);
  const ansichtWahl = `<div class="zwei" role="group" aria-label="${esc(T('pflege.ansichtAria'))}">${[['eintraege', T('pflege.eintraege')], ['medien', T('pflege.medien')]].map(([k, t]) => `<button class="opt kurz ${(p.ansicht || 'eintraege') === k ? 'sel' : ''}" aria-pressed="${(p.ansicht || 'eintraege') === k}" data-a="pf-ansicht" data-id="${k}">${esc(t)}</button>`).join('')}</div>`;
  const f = p.form;
  const stilName = id => (id === TB.ALLE ? T('pflege.alleStile') : (stile.find(s => s.id === id) || {}).name || id);
  const optionen = (wert, liste) => liste.map(([v, t]) => `<option value="${esc(v)}" ${v === wert ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const stilListe = [[TB.ALLE, T('pflege.alleStile')], ...stile.map(s => [s.id, s.name])];
  const kopf = `<div class="start-kopf"><button class="link" data-a="einstellungen">${icon('zurueck')} ${esc(T('pflege.zurueck'))}</button></div>`;
  const bildTag = (src, ph, pos, cls) => `<img class="${cls}" src="${esc(src)}" data-ph="${esc(ph)}" alt="" style="object-position:${esc(pos)}" loading="lazy">`;

  if (!verbunden) {
    return `<section class="screen">${kopf}<div class="inhalt"><h1>${esc(T('pflege.titel'))}</h1>
      <div class="notiz"><p>${esc(T('pflege.ohneDb'))}</p></div></div></section>`;
  }

  if (p.ansicht === 'medien') {
    return `<section class="screen">${kopf}<div class="inhalt"><h1>${esc(T('pflege.titel'))}</h1>${ansichtWahl}${medienHtml(c, stilName)}</div></section>`;
  }

  // ----- Formular -----
  const konkreterStil = f.stil === TB.ALLE ? null : f.stil;
  const vorschauStil = konkreterStil || (stile[0] || {}).id;
  const ein = konkreterStil && f.schluessel ? eingebautesBild(konkreterStil, f.schluessel) : null;
  const art = f.medium && index.medien[f.medium] ? index.medien[f.medium].art : TB.artVon(f.schluessel);
  const ph = TB.platzhalterPfad(vorschauStil, art);
  const vorschauSrc = f.medium && index.medien[f.medium] ? TB.assetUrl(f.medium) : f.datei ? f.datei : ph;
  const wahl = p.formWahl || 'alle';
  const [px, py] = formPos(f, wahl).split(' ').map(v => parseInt(v, 10));
  const bildWahl = f.datei ? '__datei' : (f.medium || '');
  const medienListe = [['', T('pflege.bildWaehlen')],
    ...(ein ? [['__datei', T('pflege.bildEingebaut')]] : []),
    ...Object.values(index.medien)
      .sort((a, b) => (a.titel || a.asset).localeCompare(b.titel || b.asset))
      .map(m => [m.asset, `${m.titel || T('pflege.ohneTitel')} · ${name(T, 'art', m.art)}`])];
  const datalist = (f.typ === 'bild' ? plaetze : Object.keys(standardTexte)).map(k => `<option value="${esc(k)}">`).join('');
  const std = f.typ === 'text' && typeof standardTexte[f.schluessel] === 'string' ? standardTexte[f.schluessel] : null;
  const eigeneForm = wahl !== 'alle' && f.formen && f.formen[wahl];
  // Version 32: unbekannte Schlüssel melden und Ähnliches vorschlagen
  const chk = TB.schluesselPruefen(f.schluessel, f.typ, f.typ === 'bild' ? plaetze : Object.keys(standardTexte));
  const normKey = TB.normSchluessel(f.schluessel, f.typ);
  const vorschlagKnopf = chk.vorschlag ? ` <button class="link" data-a="pf-vorschlag" data-id="${esc(chk.vorschlag)}">${esc(T('pflege.vorschlag', { schluessel: chk.vorschlag }))}</button>` : '';
  const schluesselHinweis = chk.bekannt ? ''
    : f.typ === 'bild'
      ? `<div class="pf-hinweis" role="status"><p>${esc(T('pflege.platzUnbekannt'))}${chk.vorschlag ? ` ${esc(T('pflege.meintest'))} <b>${esc(chk.vorschlag)}</b>?` : ` ${esc(T('pflege.platzBeispiele'))}`}${vorschlagKnopf}</p></div>`
      : chk.vorschlag ? `<div class="pf-hinweis" role="status"><p>${esc(T('pflege.textUnbekannt'))} ${esc(T('pflege.meintest'))} <b>${esc(chk.vorschlag)}</b>?${vorschlagKnopf}</p></div>` : '';
  const trotzdem = f.typ === 'bild' && !chk.bekannt && p.unbekanntFrage === normKey;

  const bildTeil = `
      <label class="feld">${esc(T('pflege.bild'))}<select id="pf-medium">${optionen(bildWahl, medienListe)}</select></label>
      ${f.stil === TB.ALLE && f.datei ? `<p class="klein pf-warn">${esc(T('pflege.eingebautStil'))}</p>` : ''}
      ${kannHochladen ? `<details class="pf-upload-box" ${p.uploadOffen ? 'open' : ''}><summary>${esc(T('pflege.hochladen'))}</summary><div class="pf-upload">
        <label class="feld">${esc(T('pflege.titelFeld'))}<input id="pf-titel" maxlength="${TB.GRENZEN.titel}" value="${esc(f.titel || '')}" placeholder="${esc(T('pflege.titelBeispiel'))}"></label>
        <label class="feld">${esc(T('pflege.artFeld'))}<select id="pf-art">${optionen(f.art || art, TB.ARTEN.map(a => [a, name(T, 'art', a)]))}</select></label>
        <label class="btn pf-datei">${esc(T(p.laedt ? 'pflege.laedt' : 'pflege.dateiWaehlen'))}<input id="pf-datei" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" ${p.laedt ? 'disabled' : ''}></label>
      </div></details>` : `<p class="klein">${esc(T('pflege.ohneRechte'))}</p>`}
      <span class="eyebrow">${esc(T('pflege.ausschnitt').toUpperCase())}</span>
      <div class="pf-vorschau" aria-label="${esc(T('pflege.vorschauAria'))}">
        ${TB.FORMEN.map(k => `<figure class="pf-v pf-v-${k}${wahl === k ? ' an' : ''}">${bildTag(vorschauSrc, ph, formPos(f, k), 'pf-v-bild')}<figcaption>${esc(FORM_NAME(k))}${f.formen && f.formen[k] ? ` · ${esc(T('pflege.eigen'))}` : ''}</figcaption></figure>`).join('')}
      </div>
      <div class="pf-formwahl" role="group" aria-label="${esc(T('pflege.formwahlAria'))}">
        ${['alle', ...TB.FORMEN].map(k => `<button class="opt kurz ${wahl === k ? 'sel' : ''}" aria-pressed="${wahl === k}" data-a="pf-formwahl" data-id="${k}">${esc(FORM_NAME(k))}</button>`).join('')}
      </div>
      <p class="klein">${esc(wahl === 'alle' ? T('pflege.formAlle') : eigeneForm ? T('pflege.formEigen', { form: FORM_NAME(wahl) }) : T('pflege.formGemeinsam', { form: FORM_NAME(wahl) }))}
        ${eigeneForm ? `<button class="link" data-a="pf-form-zurueck" data-id="${wahl}">${esc(T('pflege.wieAlle'))}</button>` : ''}</p>
      <label class="feld">${esc(T('pflege.links'))} <span class="pf-wert" id="pf-x-wert">${px}%</span><input id="pf-x" type="range" min="0" max="100" value="${px}"></label>
      <label class="feld">${esc(T('pflege.oben'))} <span class="pf-wert" id="pf-y-wert">${py}%</span><input id="pf-y" type="range" min="0" max="100" value="${py}"></label>`;

  const textTeil = `
      <label class="feld">${esc(T('pflege.text'))}<textarea id="pf-text" maxlength="${TB.GRENZEN.text}">${esc(f.text || '')}</textarea></label>
      ${std ? `<p class="klein">${esc(T('pflege.textEingebaut', { text: std }))}</p>` : `<p class="klein">${esc(T('pflege.textEigen'))}</p>`}`;

  const formular = `<div class="karte spalte" id="pf-form">
      <span class="eyebrow akzent">${esc(T(p.bearbeitet ? 'pflege.eintragBearbeiten' : 'pflege.eintragNeu').toUpperCase())}</span>
      <div class="zwei"><button class="opt kurz ${f.typ === 'bild' ? 'sel' : ''}" aria-pressed="${f.typ === 'bild'}" data-a="pf-typ" data-id="bild">${esc(T('pflege.bild'))}</button><button class="opt kurz ${f.typ === 'text' ? 'sel' : ''}" aria-pressed="${f.typ === 'text'}" data-a="pf-typ" data-id="text">${esc(T('pflege.text'))}</button></div>
      <label class="feld">${esc(T('pflege.schluessel'))}<input id="pf-schluessel" list="pf-liste" maxlength="${TB.GRENZEN.schluessel}" autocomplete="off" value="${esc(f.schluessel || '')}" placeholder="${esc(T(f.typ === 'bild' ? 'pflege.schluesselBild' : 'pflege.schluesselText'))}"><datalist id="pf-liste">${datalist}</datalist></label>
      ${schluesselHinweis}
      <label class="feld">${esc(T('pflege.stil'))}<select id="pf-stil">${optionen(f.stil, stilListe)}</select></label>
      ${f.typ === 'bild' ? bildTeil : textTeil}
      ${p.fehler.length ? `<ul class="pf-fehler" role="alert">${p.fehler.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${p.status ? `<p class="klein gut-text" role="status">${esc(p.status)}</p>` : ''}
      <div class="zwei"><button class="btn voll" data-a="pf-speichern" ${p.speichert ? 'disabled' : ''}>${esc(T(p.speichert ? 'pflege.speichert' : trotzdem ? 'pflege.trotzdem' : 'pflege.speichern'))}</button><button class="btn" data-a="pf-neu">${esc(T(p.bearbeitet ? 'pflege.abbrechen' : 'pflege.leeren'))}</button></div>
    </div>`;

  // ----- Filter -----
  const filter = p.filter || '*';
  const filterKarte = `<label class="feld">${esc(T('pflege.anzeigen'))}<select id="pf-filter">${optionen(filter, [['*', T('pflege.alleEintraege')], ...stilListe])}</select></label>`;

  // ----- Alle Bildplätze eines Stils (auch eingebaute) -----
  const platzStil = filter !== '*' && filter !== TB.ALLE ? filter : null;
  let platzKarte = '';
  if (platzStil) {
    const alle = plaetze.map(k => ({ k, b: bildFuer(platzStil, k, TB.artVon(k), 'quadrat') }));
    const zahl = q => alle.filter(x => x.b.quelle === q).length;
    const sicht = p.nurLuecken ? alle.filter(x => x.b.quelle === 'platzhalter') : alle;
    platzKarte = `<div class="karte spalte">
      <span class="eyebrow">${esc(T('pflege.plaetzeIn', { stil: stilName(platzStil) }).toUpperCase())}</span>
      <p class="klein">${esc(T('pflege.plaetzeZahl', { tabelle: zahl('tabelle'), eingebaut: zahl('eingebaut'), platzhalter: zahl('platzhalter') }))}</p>
      <button class="opt kurz ${p.nurLuecken ? 'sel' : ''}" aria-pressed="${!!p.nurLuecken}" data-a="pf-nur-luecken">${esc(T('pflege.nurLuecken'))}</button>
      <div class="pf-plaetze">${sicht.map(({ k, b }) => `<button class="pf-platz q-${b.quelle}" data-a="pf-platz" data-id="${esc(k)}" aria-label="${esc(k)}, ${esc(QUELLE_NAME(b.quelle))}${b.ueber ? ', ' + esc(T('pflege.wie', { platz: b.ueber })) : ''}">${bildTag(b.src, b.ph, b.pos, 'pf-platz-bild')}<span class="pf-platz-nm">${esc(k)}</span><span class="pf-platz-q">${esc(QUELLE_NAME(b.quelle))}${b.ueber ? ' · ' + esc(T('pflege.wie', { platz: b.ueber })) : ''}</span></button>`).join('') || `<span class="klein">${esc(T('pflege.keinePlaetze'))}</span>`}</div>
    </div>`;
  }

  // ----- Einträge der Tabelle -----
  const zeilen = index.zeilen
    .filter(z => filter === '*' || z.stil === filter)
    .sort((a, b) => a.schluessel.localeCompare(b.schluessel) || a.stil.localeCompare(b.stil));
  const zeileHtml = z => {
    const e = z.typ === 'bild' ? TB.bildAus(index, z.stil, z.schluessel) : null;
    const vorschau = z.typ === 'bild'
      ? bildTag(z.datei || TB.assetUrl(z.medium), TB.platzhalterPfad(z.stil === TB.ALLE ? (stile[0] || {}).id : z.stil, TB.artVon(z.schluessel)), TB.posFuer(e, 'quadrat'), 'pf-mini')
      : `<span class="pf-mini pf-mini-text" aria-hidden="true">T</span>`;
    const formen = z.formen ? Object.keys(z.formen).map(FORM_NAME).join(', ') : '';
    const info = z.typ === 'text' ? ' · ' + esc(kurz(z.text)) : (z.datei ? ' · ' + esc(T('pflege.eingebautesBild')) : '') + (formen ? ' · ' + esc(T('pflege.eigeneAusschnitte', { formen })) : '');
    const loeschFrage = p.loeschen === z.id;
    return `<li class="pf-zeile">${vorschau}<span class="spalte"><b>${esc(z.schluessel)}</b><span class="klein">${esc(stilName(z.stil))}${info}</span></span>
      <span class="pf-knoepfe"><button class="btn klein-btn" data-a="pf-bearbeiten" data-id="${esc(z.id)}">${esc(T('pflege.aendern'))}</button><button class="btn klein-btn ${loeschFrage ? 'warn' : ''}" data-a="pf-loeschen" data-id="${esc(z.id)}">${esc(T(loeschFrage ? 'pflege.sicher' : 'pflege.loeschen'))}</button></span></li>`;
  };
  const liste = `<div class="karte spalte">
      <span class="eyebrow">${esc(T('pflege.eintraegeTitel').toUpperCase())} (${zeilen.length}${filter === '*' ? '' : ' ' + esc(T('pflege.von', { n: index.zeilen.length }))})</span>
      ${zeilen.length ? `<ul class="pf-liste">${zeilen.map(zeileHtml).join('')}</ul>` : `<p class="klein">${esc(T('pflege.keineEintraege'))}</p>`}
      <p class="klein">${esc(T('pflege.loeschenInfo'))}</p>
    </div>`;

  const ungueltig = index.fehler.length ? `<div class="karte spalte">
      <span class="eyebrow">${esc(T('pflege.nichtVerwendet').toUpperCase())} (${index.fehler.length})</span>
      <p class="klein">${esc(T('pflege.fehlerhaft'))}</p>
      <ul class="pf-fehler">${index.fehler.map(x => `<li>${esc(x.tabelle)}/${esc(x.id || '?')}: ${esc(x.fehler.join(', '))}</li>`).join('')}</ul>
    </div>` : '';

  return `<section class="screen">${kopf}
    <div class="inhalt">
      <h1>${esc(T('pflege.titel'))}</h1>
      ${ansichtWahl}
      <p class="klein">${esc(T('pflege.intro'))}</p>
      ${formular}${filterKarte}${platzKarte}${liste}${ungueltig}
    </div></section>`;
}

// ---------- Medienliste (Version 31) ----------
// Hochgeladene Bilder: Vorschau, Titel, Art, Verwendung, Bearbeiten, Löschen (nur unbenutzte), „Verwenden“.
// Eingebaute Bilder: nur Übersicht je Stil (eingeklappt), unveränderlich.
function medienHtml(c, stilName) {
  const { T, esc, index, p, stile, eingebaut, kannHochladen } = c;
  const ARTNAME = a => name(T, 'art', a);
  const liste = TB.medienListe(index);
  const zeile = m => {
    const bearb = p.medienBearbeitet === m.asset;
    const frage = p.medienLoeschen === m.asset;
    const verw = m.verwendet.length
      ? esc(T('pflege.verwendetIn', { liste: m.verwendet.map(v => `${v.schluessel} (${stilName(v.stil)})`).join(', ') }))
      : `<span class="pf-unbenutzt">${esc(T('pflege.unbenutzt'))}</span>`;
    const kopf = bearb
      ? `<label class="feld">${esc(T('pflege.titelFeld'))}<input id="pf-m-titel" maxlength="${TB.GRENZEN.titel}" value="${esc(p.medienForm.titel)}"></label>
         <label class="feld">${esc(T('pflege.artFeld'))}<select id="pf-m-art">${TB.ARTEN.map(a => `<option value="${a}" ${p.medienForm.art === a ? 'selected' : ''}>${esc(ARTNAME(a))}</option>`).join('')}</select></label>`
      : `<b>${esc(m.titel || T('pflege.ohneTitel'))}</b><span class="klein">${esc(ARTNAME(m.art))}</span>`;
    const knoepfe = bearb
      ? `<button class="btn klein-btn voll" data-a="pf-m-speichern" data-id="${esc(m.asset)}">${esc(T('pflege.speichern'))}</button><button class="btn klein-btn" data-a="pf-m-abbrechen">${esc(T('pflege.abbrechen'))}</button>`
      : `<button class="btn klein-btn" data-a="pf-m-verwenden" data-id="${esc(m.asset)}">${esc(T('pflege.verwenden'))}</button>
         ${kannHochladen ? `<button class="btn klein-btn" data-a="pf-m-bearbeiten" data-id="${esc(m.asset)}">${esc(T('pflege.aendern'))}</button>` : ''}
         ${kannHochladen && !m.verwendet.length ? `<button class="btn klein-btn ${frage ? 'warn' : ''}" data-a="pf-m-loeschen" data-id="${esc(m.asset)}">${esc(T(frage ? 'pflege.endgueltig' : 'pflege.loeschen'))}</button>` : ''}`;
    return `<li class="pf-medium"><img class="pf-mini gross" src="${esc(TB.assetUrl(m.asset))}" data-ph="${esc(TB.platzhalterPfad((stile[0] || {}).id, m.art))}" alt="" loading="lazy">
      <span class="spalte">${kopf}<span class="klein">${verw}</span></span>
      <span class="pf-knoepfe">${knoepfe}</span></li>`;
  };
  const hoch = `<div class="karte spalte">
      <span class="eyebrow">${esc(T('pflege.hochgeladen').toUpperCase())} (${liste.length})</span>
      ${liste.length ? `<ul class="pf-liste">${liste.map(zeile).join('')}</ul>` : `<p class="klein">${esc(T('pflege.keineUploads'))}</p>`}
      ${liste.some(m => m.verwendet.length) ? `<p class="klein">${esc(T('pflege.benutztInfo'))}</p>` : ''}
      ${p.fehler.length ? `<ul class="pf-fehler" role="alert">${p.fehler.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${p.status ? `<p class="klein gut-text" role="status">${esc(p.status)}</p>` : ''}
    </div>`;
  const ein = `<div class="karte spalte">
      <span class="eyebrow">${esc(T('pflege.eingebautTitel').toUpperCase())}</span>
      <p class="klein">${esc(T('pflege.eingebautInfo'))}</p>
      ${stile.map(s => {
        const bilder = eingebaut(s.id);
        const eigene = bilder.filter(b => b.eigen).length;
        return `<details class="pf-stilgruppe"><summary>${esc(s.name)} · ${esc(T('pflege.bilderZahl', { n: bilder.length }))}${eigene ? ` ${esc(T('pflege.ausAltem', { n: eigene }))}` : ''}</summary>
          <div class="pf-plaetze">${bilder.map(b => `<span class="pf-platz${b.eigen ? ' q-eigen' : ''}"><img class="pf-platz-bild" src="${esc(b.datei)}" data-ph="${esc(TB.platzhalterPfad(s.id, TB.artVon(b.platz)))}" alt="" loading="lazy" style="object-position:${esc(b.pos)}"><span class="pf-platz-nm">${esc(b.platz)}</span>${b.eigen ? `<span class="pf-platz-q">${esc(T('pflege.alterPrototyp'))}</span>` : ''}</span>`).join('') || `<span class="klein">${esc(T('pflege.keine'))}</span>`}</div>
        </details>`;
      }).join('')}
    </div>`;
  return hoch + ein;
}

// ---------- Bildschirm, Klicks und Felder (Pflege-Logik auslagern, 30.10.2026) ----------
// Logik in logik/pflege.js; Datenbank und Bildspeicher kommen über kx.pflegeUmgebung() (Adapter aus app.js).
export const PFLEGE_SCREENS = {
  pflege() {
    const { SCREENS, T, bildFuer, bildPlaetze, eingebautesBild, pflegeZustand, tabelle, ui } = kx;
    if (!ui.istBesitzer) return SCREENS.einstellungen();
    const plaetze = bildPlaetze();
    return pflegeHtml({
      T, esc, icon, index: tabelle, p: pflegeZustand(),
      stile: STIL_REIHENFOLGE.map(id => ({ id, name: STILE[id].name })),
      plaetze, standardTexte: TEXTE, bildFuer, eingebautesBild,
      eingebaut: stilId => plaetze.map(platz => ({ platz, ...eingebautesBild(stilId, platz) })).filter(b => b.datei).map(b => ({ ...b, eigen: b.datei.startsWith('/_blob/') })),
      kannHochladen: !!ui.assets, verbunden: !!ui.db
    });
  }
};

const zumFormular = () => { const { finde } = kx; finde('#pf-form')?.scrollIntoView({ block: 'start' }); };
const pz = () => { const { pflegeZustand } = kx; return pflegeZustand(); };
const umgebung = () => { const { pflegeUmgebung } = kx; return pflegeUmgebung(); };

export const PFLEGE_KLICKS = {
  'pf-typ'({ id }) { const { render } = kx; const p = pz(); if (id === 'bild' || id === 'text') { p.form.typ = id; p.fehler = []; } render(); },
  'pf-neu'() { const { render } = kx; Object.assign(pz(), { form: P.leeresFormular(), bearbeitet: null, fehler: [], status: '', formWahl: 'alle' }); render(); },
  'pf-formwahl'({ id }) { const { render } = kx; const p = pz(); if (id === 'alle' || TB.FORMEN.includes(id)) p.formWahl = id; render(); },
  'pf-form-zurueck'({ id }) { const { render } = kx; const p = pz(); if (p.form.formen) delete p.form.formen[id]; render(); },
  'pf-ansicht'({ id }) {
    const { render } = kx;
    if (id === 'eintraege' || id === 'medien') Object.assign(pz(), { ansicht: id, fehler: [], status: '', medienLoeschen: null });
    render();
  },
  'pf-m-bearbeiten'({ id }) {
    const { render, tabelle } = kx;
    const m = tabelle.medien[id];
    if (m) Object.assign(pz(), { medienBearbeitet: id, medienForm: { titel: m.titel || '', art: m.art }, medienLoeschen: null });
    render();
  },
  'pf-m-abbrechen'() { const { render } = kx; Object.assign(pz(), { medienBearbeitet: null, fehler: [] }); render(); },
  'pf-m-speichern'({ id }) { return P.mediumSpeichern(pz(), id, umgebung()); },
  'pf-m-loeschen'({ id }) { return P.mediumLoeschen(pz(), id, umgebung()); },
  'pf-m-verwenden'({ id }) {
    const { T, render, tabelle } = kx;
    const p = pz();
    if (!tabelle.medien[id]) return;
    p.form = { ...P.leeresFormular(), typ: 'bild', medium: id, stil: p.form.stil || TB.ALLE };
    Object.assign(p, { ansicht: 'eintraege', bearbeitet: null, fehler: [], status: T('pflege.statusGewaehlt'), formWahl: 'alle' });
    render(); zumFormular();
  },
  'pf-vorschlag'({ id }) { const { eingebautesBild, render } = kx; const p = pz(); p.form.schluessel = id; p.unbekanntFrage = null; P.eingebautVorschlagen(p, eingebautesBild); render(); },
  'pf-nur-luecken'() { const { render } = kx; const p = pz(); p.nurLuecken = !p.nurLuecken; render(); },
  'pf-speichern'() { return P.speichern(pz(), umgebung()); },
  'pf-bearbeiten'({ id }) { const { render, tabelle } = kx; if (P.bearbeiten(pz(), id, tabelle.zeilen)) { render(); zumFormular(); } },
  'pf-loeschen'({ id }) { return P.eintragLoeschen(pz(), id, umgebung()); },
  'pf-platz'({ id }) {
    const { eingebautesBild, render, tabelle } = kx;
    const p = pz();
    if (!STILE[p.filter]) return;
    Object.assign(p, P.formularFuerPlatz(tabelle.zeilen, p.filter, id, eingebautesBild), { fehler: [], status: '', formWahl: 'alle', loeschen: null });
    render(); zumFormular();
  }
};

// Felder: Zustand nur ändern, solange die Pflege offen ist (ui.pflege). Regler zeichnen NICHT neu (Finger bliebe sonst
// nicht am Regler), sondern setzen die Vorschau direkt.
function mitPflege(f) {
  return d => { const { ui } = kx; if (ui.pflege) return f(ui.pflege, d); };
}
function regler(achse) {
  return mitPflege((p, { el, wert }) => {
    const { finde } = kx;
    if (P.setzeAusschnitt(p.form, p.formWahl || 'alle', achse, wert) === null) return;
    for (const k of TB.FORMEN) { const i = finde(`.pf-v-${k} img`); if (i) i.style.objectPosition = formPos(p.form, k); }
    const w = finde(`#${el.id}-wert`); if (w) w.textContent = wert + '%';
  });
}
export const PFLEGE_FELDER = {
  'pf-datei': { change: mitPflege((p, { el }) => { const datei = el.files && el.files[0]; el.value = ''; return P.hochladen(p, datei, umgebung()); }) },
  'pf-medium': { change: mitPflege((p, { wert }) => { const { eingebautesBild, render } = kx; P.bildWaehlen(p.form, wert, eingebautesBild); render(); }) },
  'pf-stil': { change: mitPflege((p, { wert }) => { const { eingebautesBild, render } = kx; p.form.stil = wert; P.eingebautVorschlagen(p, eingebautesBild); render(); }) },
  'pf-schluessel': {
    input: mitPflege((p, { wert }) => { p.form.schluessel = wert; }),
    // „change“ kommt beim Verlassen des Felds vor dem Klick: erst nach dem Loslassen zeichnen (zeichneNachZeiger)
    change: mitPflege(p => { const { eingebautesBild, zeichneNachZeiger } = kx; p.unbekanntFrage = null; P.eingebautVorschlagen(p, eingebautesBild); zeichneNachZeiger(); })
  },
  'pf-art': { change: mitPflege((p, { wert }) => { p.form.art = wert; }) },
  'pf-m-art': { change: mitPflege((p, { wert }) => { if (p.medienForm) p.medienForm.art = wert; }) },
  'pf-filter': { change: mitPflege((p, { wert }) => { const { render } = kx; p.filter = wert; p.loeschen = null; render(); }) },
  'pf-text': { input: mitPflege((p, { wert }) => { p.form.text = wert; }) },
  'pf-titel': { input: mitPflege((p, { wert }) => { p.form.titel = wert; }) },
  'pf-m-titel': { input: mitPflege((p, { wert }) => { if (p.medienForm) p.medienForm.titel = wert; }) },
  'pf-x': { input: regler('x') },
  'pf-y': { input: regler('y') }
};
