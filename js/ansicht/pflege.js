// Pflegeansicht der Inhalte-Tabelle (Version 29, erweitert in 30). Nur für den Besitzer.
// Reines HTML aus dem Zustand; Speichern, Hochladen und Löschen erledigt app.js (Datenbank, Assets).
// Version 30: alle Bildplätze je Stil sichtbar (auch eingebaute), Ausschnitt je Form (rund, quadrat, breit).
import * as TB from '../logik/tabelle.js';

const kurz = (s, n = 70) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const FORM_NAME = { alle: 'Alle Formen', rund: 'Rund', quadrat: 'Quadrat', breit: 'Breit' };
const QUELLE_NAME = { tabelle: 'Tabelle', eingebaut: 'eingebaut', platzhalter: 'Platzhalter' };

// Ausschnitt, den das Formular gerade für eine Form zeigt.
export const formPos = (f, form) => (form !== 'alle' && f.formen && f.formen[form]) || TB.normPos(f.pos) || TB.STANDARD_POS;

export function pflegeHtml(c) {
  const { esc, icon, index, p, stile, plaetze, standardTexte, bildFuer, eingebautesBild, kannHochladen, verbunden } = c;
  const ansichtWahl = `<div class="zwei" role="group" aria-label="Ansicht">${[['eintraege', 'Einträge'], ['medien', 'Medien']].map(([k, t]) => `<button class="opt kurz ${(p.ansicht || 'eintraege') === k ? 'sel' : ''}" aria-pressed="${(p.ansicht || 'eintraege') === k}" data-a="pf-ansicht" data-id="${k}">${t}</button>`).join('')}</div>`;
  const f = p.form;
  const stilName = id => (id === TB.ALLE ? 'Alle Stile' : (stile.find(s => s.id === id) || {}).name || id);
  const optionen = (wert, liste) => liste.map(([v, t]) => `<option value="${esc(v)}" ${v === wert ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const stilListe = [[TB.ALLE, 'Alle Stile'], ...stile.map(s => [s.id, s.name])];
  const kopf = `<div class="start-kopf"><button class="link" data-a="einstellungen">${icon('zurueck')} Einstellungen</button></div>`;
  const bildTag = (src, ph, pos, cls) => `<img class="${cls}" src="${esc(src)}" data-ph="${esc(ph)}" alt="" style="object-position:${esc(pos)}" loading="lazy">`;

  if (!verbunden) {
    return `<section class="screen">${kopf}<div class="inhalt"><h1>Inhalte pflegen</h1>
      <div class="notiz"><p>Die Tabelle braucht die Seiten-Datenbank. Öffne die App auf claude.ai, angemeldet als Besitzer.</p></div></div></section>`;
  }

  if (p.ansicht === 'medien') {
    return `<section class="screen">${kopf}<div class="inhalt"><h1>Inhalte pflegen</h1>${ansichtWahl}${medienHtml(c, stilName)}</div></section>`;
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
  const medienListe = [['', '– Bild wählen –'],
    ...(ein ? [['__datei', 'Eingebautes Bild dieses Stils']] : []),
    ...Object.values(index.medien)
      .sort((a, b) => (a.titel || a.asset).localeCompare(b.titel || b.asset))
      .map(m => [m.asset, `${m.titel || 'ohne Titel'} · ${m.art}`])];
  const datalist = (f.typ === 'bild' ? plaetze : Object.keys(standardTexte)).map(k => `<option value="${esc(k)}">`).join('');
  const std = f.typ === 'text' && typeof standardTexte[f.schluessel] === 'string' ? standardTexte[f.schluessel] : null;
  const eigeneForm = wahl !== 'alle' && f.formen && f.formen[wahl];
  // Version 32: unbekannte Schlüssel melden und Ähnliches vorschlagen
  const chk = TB.schluesselPruefen(f.schluessel, f.typ, f.typ === 'bild' ? plaetze : Object.keys(standardTexte));
  const normKey = TB.normSchluessel(f.schluessel, f.typ);
  const vorschlagKnopf = chk.vorschlag ? ` <button class="link" data-a="pf-vorschlag" data-id="${esc(chk.vorschlag)}">„${esc(chk.vorschlag)}“ übernehmen</button>` : '';
  const schluesselHinweis = chk.bekannt ? ''
    : f.typ === 'bild'
      ? `<div class="pf-hinweis" role="status"><p>Diesen Bildplatz verwendet die App nicht${chk.vorschlag ? `. Meintest du <b>${esc(chk.vorschlag)}</b>?` : '. Bildplätze heißen wie Helden und Gegner, z. B. trogadon, banner-trogadon, boss-hetzra.'}${vorschlagKnopf}</p></div>`
      : chk.vorschlag ? `<div class="pf-hinweis" role="status"><p>Unbekannter Textschlüssel. Meintest du <b>${esc(chk.vorschlag)}</b>?${vorschlagKnopf}</p></div>` : '';
  const trotzdem = f.typ === 'bild' && !chk.bekannt && p.unbekanntFrage === normKey;

  const bildTeil = `
      <label class="feld">Bild<select id="pf-medium">${optionen(bildWahl, medienListe)}</select></label>
      ${f.stil === TB.ALLE && f.datei ? '<p class="klein pf-warn">Eingebaute Bilder gehören zu einem Stil. Wähle einen Stil oder ein hochgeladenes Bild.</p>' : ''}
      ${kannHochladen ? `<details class="pf-upload-box" ${p.uploadOffen ? 'open' : ''}><summary>Neues Bild hochladen</summary><div class="pf-upload">
        <label class="feld">Titel<input id="pf-titel" maxlength="${TB.GRENZEN.titel}" value="${esc(f.titel || '')}" placeholder="z. B. Trogadon Sci-Fi"></label>
        <label class="feld">Art<select id="pf-art">${optionen(f.art || art, TB.ARTEN.map(a => [a, { held: 'Held', boss: 'Boss', szene: 'Szene' }[a]]))}</select></label>
        <label class="btn pf-datei">${p.laedt ? 'Lädt hoch …' : 'Datei wählen'}<input id="pf-datei" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" ${p.laedt ? 'disabled' : ''}></label>
      </div></details>` : '<p class="klein">Hochladen geht nur mit Bearbeitungsrechten an dieser Seite.</p>'}
      <span class="eyebrow">AUSSCHNITT</span>
      <div class="pf-vorschau" aria-label="Vorschau der Ausschnitte">
        ${TB.FORMEN.map(k => `<figure class="pf-v pf-v-${k}${wahl === k ? ' an' : ''}">${bildTag(vorschauSrc, ph, formPos(f, k), 'pf-v-bild')}<figcaption>${FORM_NAME[k]}${f.formen && f.formen[k] ? ' · eigen' : ''}</figcaption></figure>`).join('')}
      </div>
      <div class="pf-formwahl" role="group" aria-label="Ausschnitt bearbeiten für">
        ${['alle', ...TB.FORMEN].map(k => `<button class="opt kurz ${wahl === k ? 'sel' : ''}" aria-pressed="${wahl === k}" data-a="pf-formwahl" data-id="${k}">${FORM_NAME[k]}</button>`).join('')}
      </div>
      <p class="klein">${wahl === 'alle' ? 'Gilt für alle Formen ohne eigenen Ausschnitt.' : eigeneForm ? `Eigener Ausschnitt für ${FORM_NAME[wahl]}.` : `${FORM_NAME[wahl]} nutzt noch den gemeinsamen Ausschnitt. Regler bewegen legt einen eigenen an.`}
        ${eigeneForm ? `<button class="link" data-a="pf-form-zurueck" data-id="${wahl}">Wie alle Formen</button>` : ''}</p>
      <label class="feld">Links ↔ rechts <span class="pf-wert" id="pf-x-wert">${px}%</span><input id="pf-x" type="range" min="0" max="100" value="${px}"></label>
      <label class="feld">Oben ↕ unten <span class="pf-wert" id="pf-y-wert">${py}%</span><input id="pf-y" type="range" min="0" max="100" value="${py}"></label>`;

  const textTeil = `
      <label class="feld">Text<textarea id="pf-text" maxlength="${TB.GRENZEN.text}">${esc(f.text || '')}</textarea></label>
      ${std ? `<p class="klein">Eingebaut: „${esc(std)}“</p>` : '<p class="klein">Eigener Schlüssel ohne eingebauten Text: Die App zeigt ihn erst, wenn eine Stelle ihn nutzt.</p>'}`;

  const formular = `<div class="karte spalte" id="pf-form">
      <span class="eyebrow akzent">${p.bearbeitet ? 'EINTRAG BEARBEITEN' : 'NEUER EINTRAG'}</span>
      <div class="zwei"><button class="opt kurz ${f.typ === 'bild' ? 'sel' : ''}" aria-pressed="${f.typ === 'bild'}" data-a="pf-typ" data-id="bild">Bild</button><button class="opt kurz ${f.typ === 'text' ? 'sel' : ''}" aria-pressed="${f.typ === 'text'}" data-a="pf-typ" data-id="text">Text</button></div>
      <label class="feld">Schlüssel (Bildplatz oder Text)<input id="pf-schluessel" list="pf-liste" maxlength="${TB.GRENZEN.schluessel}" autocomplete="off" value="${esc(f.schluessel || '')}" placeholder="${f.typ === 'bild' ? 'z. B. trogadon, boss-hetzra' : 'z. B. tab.start'}"><datalist id="pf-liste">${datalist}</datalist></label>
      ${schluesselHinweis}
      <label class="feld">Stil<select id="pf-stil">${optionen(f.stil, stilListe)}</select></label>
      ${f.typ === 'bild' ? bildTeil : textTeil}
      ${p.fehler.length ? `<ul class="pf-fehler" role="alert">${p.fehler.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${p.status ? `<p class="klein gut-text" role="status">${esc(p.status)}</p>` : ''}
      <div class="zwei"><button class="btn voll" data-a="pf-speichern" ${p.speichert ? 'disabled' : ''}>${p.speichert ? 'Speichert …' : trotzdem ? 'Trotzdem speichern' : 'Speichern'}</button><button class="btn" data-a="pf-neu">${p.bearbeitet ? 'Abbrechen' : 'Leeren'}</button></div>
    </div>`;

  // ----- Filter -----
  const filter = p.filter || '*';
  const filterKarte = `<label class="feld">Anzeigen<select id="pf-filter">${optionen(filter, [['*', 'Alle Einträge'], ...stilListe])}</select></label>`;

  // ----- Alle Bildplätze eines Stils (auch eingebaute) -----
  const platzStil = filter !== '*' && filter !== TB.ALLE ? filter : null;
  let platzKarte = '';
  if (platzStil) {
    const alle = plaetze.map(k => ({ k, b: bildFuer(platzStil, k, TB.artVon(k), 'quadrat') }));
    const zahl = q => alle.filter(x => x.b.quelle === q).length;
    const sicht = p.nurLuecken ? alle.filter(x => x.b.quelle === 'platzhalter') : alle;
    platzKarte = `<div class="karte spalte">
      <span class="eyebrow">BILDPLÄTZE IN ${esc(stilName(platzStil).toUpperCase())}</span>
      <p class="klein">${zahl('tabelle')} aus der Tabelle · ${zahl('eingebaut')} eingebaut · ${zahl('platzhalter')} Platzhalter. Antippen zum Ändern.</p>
      <button class="opt kurz ${p.nurLuecken ? 'sel' : ''}" aria-pressed="${!!p.nurLuecken}" data-a="pf-nur-luecken">Nur Plätze mit Platzhalter</button>
      <div class="pf-plaetze">${sicht.map(({ k, b }) => `<button class="pf-platz q-${b.quelle}" data-a="pf-platz" data-id="${esc(k)}" aria-label="${esc(k)}, ${QUELLE_NAME[b.quelle]}">${bildTag(b.src, b.ph, b.pos, 'pf-platz-bild')}<span class="pf-platz-nm">${esc(k)}</span><span class="pf-platz-q">${QUELLE_NAME[b.quelle]}</span></button>`).join('') || '<span class="klein">Keine Plätze.</span>'}</div>
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
    const formen = z.formen ? Object.keys(z.formen).map(k => FORM_NAME[k]).join(', ') : '';
    const info = z.typ === 'text' ? ' · ' + esc(kurz(z.text)) : (z.datei ? ' · eingebautes Bild' : '') + (formen ? ' · eigene Ausschnitte: ' + esc(formen) : '');
    const loeschFrage = p.loeschen === z.id;
    return `<li class="pf-zeile">${vorschau}<span class="spalte"><b>${esc(z.schluessel)}</b><span class="klein">${esc(stilName(z.stil))}${info}</span></span>
      <span class="pf-knoepfe"><button class="btn klein-btn" data-a="pf-bearbeiten" data-id="${esc(z.id)}">Ändern</button><button class="btn klein-btn ${loeschFrage ? 'warn' : ''}" data-a="pf-loeschen" data-id="${esc(z.id)}">${loeschFrage ? 'Sicher?' : 'Löschen'}</button></span></li>`;
  };
  const liste = `<div class="karte spalte">
      <span class="eyebrow">EINTRÄGE IN DER TABELLE (${zeilen.length}${filter === '*' ? '' : ' von ' + index.zeilen.length})</span>
      ${zeilen.length ? `<ul class="pf-liste">${zeilen.map(zeileHtml).join('')}</ul>` : '<p class="klein">Keine Einträge. Die App zeigt die eingebauten Bilder und Texte.</p>'}
      <p class="klein">Löschen entfernt nur den Eintrag; danach gilt wieder das eingebaute Bild bzw. der Platzhalter.</p>
    </div>`;

  const ungueltig = index.fehler.length ? `<div class="karte spalte">
      <span class="eyebrow">NICHT VERWENDET (${index.fehler.length})</span>
      <p class="klein">Diese Zeilen sind fehlerhaft und werden ignoriert.</p>
      <ul class="pf-fehler">${index.fehler.map(x => `<li>${esc(x.tabelle)}/${esc(x.id || '?')}: ${esc(x.fehler.join(', '))}</li>`).join('')}</ul>
    </div>` : '';

  return `<section class="screen">${kopf}
    <div class="inhalt">
      <h1>Inhalte pflegen</h1>
      ${ansichtWahl}
      <p class="klein">Einträge hier haben Vorrang vor den eingebauten Bildern und Texten. Reihenfolge: eigener Stil → Alle Stile → eingebaut → Platzhalter. Ein Bild wird einmal hochgeladen und kann mehrfach verwendet werden.</p>
      ${formular}${filterKarte}${platzKarte}${liste}${ungueltig}
    </div></section>`;
}

// ---------- Medienliste (Version 31) ----------
// Hochgeladene Bilder: Vorschau, Titel, Art, Verwendung, Bearbeiten, Löschen (nur unbenutzte), „Verwenden“.
// Eingebaute Bilder: nur Übersicht je Stil (eingeklappt), unveränderlich.
function medienHtml(c, stilName) {
  const { esc, index, p, stile, eingebaut, kannHochladen } = c;
  const ARTNAME = { held: 'Held', boss: 'Boss', szene: 'Szene' };
  const liste = TB.medienListe(index);
  const zeile = m => {
    const bearb = p.medienBearbeitet === m.asset;
    const frage = p.medienLoeschen === m.asset;
    const verw = m.verwendet.length
      ? `Verwendet in: ${m.verwendet.map(v => `${esc(v.schluessel)} (${esc(stilName(v.stil))})`).join(', ')}`
      : '<span class="pf-unbenutzt">nicht verwendet</span>';
    const kopf = bearb
      ? `<label class="feld">Titel<input id="pf-m-titel" maxlength="${TB.GRENZEN.titel}" value="${esc(p.medienForm.titel)}"></label>
         <label class="feld">Art<select id="pf-m-art">${TB.ARTEN.map(a => `<option value="${a}" ${p.medienForm.art === a ? 'selected' : ''}>${ARTNAME[a]}</option>`).join('')}</select></label>`
      : `<b>${esc(m.titel || 'ohne Titel')}</b><span class="klein">${ARTNAME[m.art] || m.art}</span>`;
    const knoepfe = bearb
      ? `<button class="btn klein-btn voll" data-a="pf-m-speichern" data-id="${m.asset}">Speichern</button><button class="btn klein-btn" data-a="pf-m-abbrechen">Abbrechen</button>`
      : `<button class="btn klein-btn" data-a="pf-m-verwenden" data-id="${m.asset}">Verwenden</button>
         ${kannHochladen ? `<button class="btn klein-btn" data-a="pf-m-bearbeiten" data-id="${m.asset}">Ändern</button>` : ''}
         ${kannHochladen && !m.verwendet.length ? `<button class="btn klein-btn ${frage ? 'warn' : ''}" data-a="pf-m-loeschen" data-id="${m.asset}">${frage ? 'Endgültig?' : 'Löschen'}</button>` : ''}`;
    return `<li class="pf-medium"><img class="pf-mini gross" src="${esc(TB.assetUrl(m.asset))}" data-ph="${esc(TB.platzhalterPfad((stile[0] || {}).id, m.art))}" alt="" loading="lazy">
      <span class="spalte">${kopf}<span class="klein">${verw}</span></span>
      <span class="pf-knoepfe">${knoepfe}</span></li>`;
  };
  const hoch = `<div class="karte spalte">
      <span class="eyebrow">HOCHGELADEN (${liste.length})</span>
      ${liste.length ? `<ul class="pf-liste">${liste.map(zeile).join('')}</ul>` : '<p class="klein">Noch keine Uploads. Neue Bilder lädst du unter „Einträge“ im Formular hoch.</p>'}
      ${liste.some(m => m.verwendet.length) ? '<p class="klein">Benutzte Bilder lassen sich nicht löschen. Entferne zuerst die Einträge, die sie verwenden.</p>' : ''}
      ${p.fehler.length ? `<ul class="pf-fehler" role="alert">${p.fehler.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${p.status ? `<p class="klein gut-text" role="status">${esc(p.status)}</p>` : ''}
    </div>`;
  const ein = `<div class="karte spalte">
      <span class="eyebrow">EINGEBAUT (NUR ANSICHT)</span>
      <p class="klein">Diese Bilder gehören fest zur App. Ändern kannst du sie unter „Einträge“, Filter auf den Stil, Bildplatz antippen.</p>
      ${stile.map(s => {
        const bilder = eingebaut(s.id);
        const eigene = bilder.filter(b => b.eigen).length;
        return `<details class="pf-stilgruppe"><summary>${esc(s.name)} · ${bilder.length} Bilder${eigene ? ` (${eigene} aus dem alten Prototyp)` : ''}</summary>
          <div class="pf-plaetze">${bilder.map(b => `<span class="pf-platz${b.eigen ? ' q-eigen' : ''}"><img class="pf-platz-bild" src="${esc(b.datei)}" data-ph="${esc(TB.platzhalterPfad(s.id, TB.artVon(b.platz)))}" alt="" loading="lazy" style="object-position:${esc(b.pos)}"><span class="pf-platz-nm">${esc(b.platz)}</span>${b.eigen ? '<span class="pf-platz-q">alter Prototyp</span>' : ''}</span>`).join('') || '<span class="klein">Keine.</span>'}</div>
        </details>`;
      }).join('')}
    </div>`;
  return hoch + ein;
}
