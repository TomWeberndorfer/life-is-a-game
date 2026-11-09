// Bewegungs-Abläufe (Version 68, „Bewegung vereinheitlichen“): reine Funktionen, nichts im DOM.
// Katalog und Abläufe stehen als Daten in daten/bewegung.js, die Keyframes (Präfix bw-) einmal in index.html.
// Eine Ansicht fragt nur noch: „Wie bewegt sich Teil X im Ablauf Y?“ und bekommt den fertigen CSS-Wert für `animation`.
// „Bewegung reduzieren“ braucht hier keine Sonderfälle: EINE Regel in index.html (:root[data-bewegung="aus"] *) schaltet
// jede Animation ab, auch diese inline gesetzten. Endzustände stehen darum immer im normalen CSS, nie nur in der Animation.

const NAME = /^[a-z][a-zA-Z0-9]*$/;
const KEYFRAMES = /^bw-[a-z][a-z0-9-]*$/;
const KURVE = /^(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\))$/;
const MAX_MS = 20000; // 02.11.2026: Lesezeiten können einen Ablauf über 10 s strecken
const ms = x => Number.isFinite(x) && x >= 0 && x <= MAX_MS;

// Prüft Katalog und Abläufe; liefert lesbare Fehler (leer = in Ordnung). Wirft nie.
// opt.pauseMs (02.11.2026): Puffer vor Einblendungen (MOMENTE.pauseMs) für die Regel `bedienbar`.
export function pruefeBewegung(cfg, opt = {}) {
  const f = [];
  const kat = cfg && cfg.katalog;
  const abl = cfg && cfg.ablaeufe;
  if (!kat || typeof kat !== 'object' || Array.isArray(kat)) return ['Bewegung: Katalog fehlt'];
  for (const [name, b] of Object.entries(kat)) {
    const wo = `Bewegung „${name}“`;
    if (!NAME.test(name)) f.push(`${wo}: ungültiger Name`);
    if (!b || typeof b !== 'object') { f.push(`${wo}: kein Eintrag`); continue; }
    if (!KEYFRAMES.test(String(b.keyframes))) f.push(`${wo}: keyframes muss mit „bw-“ beginnen`);
    if (!ms(b.dauerMs) || b.dauerMs === 0) f.push(`${wo}: dauerMs muss zwischen 1 und ${MAX_MS} liegen`);
    if (b.kurve !== undefined && !KURVE.test(String(b.kurve))) f.push(`${wo}: unbekannte Kurve „${b.kurve}“`);
    if (b.unsichtbar !== undefined && typeof b.unsichtbar !== 'boolean') f.push(`${wo}: unsichtbar muss true oder false sein`);
  }
  if (!abl || typeof abl !== 'object' || Array.isArray(abl)) { f.push('Bewegung: Abläufe fehlen'); return f; }
  for (const [id, schritte] of Object.entries(abl)) {
    if (!Array.isArray(schritte)) { f.push(`Ablauf „${id}“: keine Liste`); continue; }
    schritte.forEach((s, i) => {
      const wo = `Ablauf „${id}“[${i + 1}]`;
      if (!s || typeof s !== 'object') { f.push(`${wo}: kein Eintrag`); return; }
      if (!NAME.test(String(s.teil))) f.push(`${wo}: ungültiger Teil „${s.teil}“`);
      if (!Object.prototype.hasOwnProperty.call(kat, s.bewegung)) f.push(`${wo}: unbekannte Bewegung „${s.bewegung}“`);
      if (!ms(s.startMs)) f.push(`${wo}: startMs muss zwischen 0 und ${MAX_MS} liegen`);
      if (s.dauerMs !== undefined && (!ms(s.dauerMs) || s.dauerMs === 0)) f.push(`${wo}: dauerMs ungültig`);
      if (s.lesen !== undefined && typeof s.lesen !== 'boolean') f.push(`${wo}: lesen muss true oder false sein`);
      if (s.nach !== undefined && !schritte.slice(0, i).some(x => x && x.teil === s.nach)) f.push(`${wo}: nach „${s.nach}“ muss ein früherer Teil sein`);
      if (s.abstandMs !== undefined && !ms(s.abstandMs)) f.push(`${wo}: abstandMs ungültig`);
    });
  }
  if (cfg.lesen !== undefined) {
    const l = cfg.lesen;
    if (!l || typeof l !== 'object' || !ms(l.msProZeichen) || !ms(l.minMs) || !ms(l.maxMs) || l.minMs > l.maxMs) f.push('Bewegung: lesen braucht msProZeichen, minMs ≤ maxMs (gilt der Standard)');
    if (l && l.leiste !== undefined && !KEYFRAMES.test(String(l.leiste))) f.push('Bewegung: lesen.leiste muss mit „bw-“ beginnen (keine Leiste)');
    if (l && l.haltAnteil !== undefined && !(Number.isFinite(l.haltAnteil) && l.haltAnteil >= 0.5 && l.haltAnteil <= 0.95)) f.push(`Bewegung: lesen.haltAnteil muss zwischen 0,5 und 0,95 liegen (gilt ${HALT_STANDARD})`);
  }
  if (cfg.atmosphaere && cfg.atmosphaere.funkenWann !== undefined && !FUNKEN_WANN.includes(cfg.atmosphaere.funkenWann)) {
    f.push(`Bewegung: funkenWann muss ${FUNKEN_WANN.join(', ')} sein (gilt „treffer“)`);
  }
  return f.concat(pruefeMuster(cfg), pruefeBedienbar(cfg, opt.pauseMs));
}

// ---------- Übergangs-Muster (Version 162): wie Blatt, Feier, Ruhe-Seite und Tab ins Bild kommen ----------
export const MUSTER_STANDARD = {
  blatt: { dauerMs: 280, kurve: 'cubic-bezier(.2,.8,.3,1)' },
  feier: { dauerMs: 320, kurve: 'ease-out' },
  ruhe: { dauerMs: 300, kurve: 'ease-in-out' },
  tab: { dauerMs: 150, kurve: 'ease-out' }
};
// Fehlt `muster`, gelten die Standardwerte; vorhanden heißt vollständig und gültig. Wirft nie.
export function pruefeMuster(cfg) {
  const m = cfg ? cfg.muster : undefined;
  if (m === undefined) return [];
  if (!m || typeof m !== 'object' || Array.isArray(m)) return ['Bewegung: muster muss eine Liste von Mustern sein'];
  const f = [];
  for (const id of Object.keys(MUSTER_STANDARD)) {
    const b = m[id];
    const wo = `Muster „${id}“`;
    if (!b || typeof b !== 'object') { f.push(`${wo}: fehlt (gilt der Standard)`); continue; }
    if (!KEYFRAMES.test(String(b.keyframes))) f.push(`${wo}: keyframes muss mit „bw-“ beginnen`);
    if (!ms(b.dauerMs) || b.dauerMs === 0) f.push(`${wo}: dauerMs muss zwischen 1 und ${MAX_MS} liegen`);
    if (!KURVE.test(String(b.kurve))) f.push(`${wo}: unbekannte Kurve „${b.kurve}“`);
  }
  for (const id of Object.keys(m)) if (!(id in MUSTER_STANDARD)) f.push(`Muster „${id}“: unbekannt (erlaubt: ${Object.keys(MUSTER_STANDARD).join(', ')})`);
  return f;
}
// CSS-Variablen je Muster ({ '--bw-blatt': '280ms', '--bw-blatt-kurve': '…' }); ungültige oder fehlende Werte → Standard. Wirft nie.
export function musterVariablen(cfg) {
  const m = cfg && cfg.muster && typeof cfg.muster === 'object' ? cfg.muster : {};
  const v = {};
  for (const [id, std] of Object.entries(MUSTER_STANDARD)) {
    const b = m[id] && typeof m[id] === 'object' ? m[id] : {};
    v[`--bw-${id}`] = `${ms(b.dauerMs) && b.dauerMs > 0 ? b.dauerMs : std.dauerMs}ms`;
    v[`--bw-${id}-kurve`] = KURVE.test(String(b.kurve)) ? String(b.kurve) : std.kurve;
  }
  return v;
}

// ---------- „Der letzte Schlag“ (02.11.2026): Bewegung darf nie warten lassen ----------
// Regel `bedienbar` prüfen: Knöpfe (teile) nie mit einer Bewegung, die unsichtbar macht; jede Kette (Ablauf davor →
// Einblendung) höchstens maxMs bis zur ersten Bedienung. Fehlt `bedienbar`, gibt es nichts zu prüfen. Wirft nie.
export function pruefeBedienbar(cfg, pauseMs = 0) {
  const b = cfg && cfg.bedienbar;
  if (b === undefined || b === null) return [];
  if (typeof b !== 'object' || Array.isArray(b)) return ['Bewegung: bedienbar muss ein Objekt sein'];
  const f = [];
  if (!ms(b.maxMs) || b.maxMs === 0) f.push(`Bewegung: bedienbar.maxMs muss zwischen 1 und ${MAX_MS} liegen`);
  const teile = Array.isArray(b.teile) ? b.teile : [];
  if (!Array.isArray(b.teile) || teile.some(t => !NAME.test(String(t)))) f.push('Bewegung: bedienbar.teile muss eine Liste von Teilnamen sein');
  const kat = (cfg && cfg.katalog) || {};
  const abl = (cfg && cfg.ablaeufe) || {};
  for (const [id, schritte] of Object.entries(abl)) {
    if (!Array.isArray(schritte)) continue;
    schritte.forEach(s => {
      if (s && teile.includes(s.teil) && kat[s.bewegung] && kat[s.bewegung].unsichtbar === true) {
        f.push(`Ablauf „${id}“: „${s.teil}“ wird bedient und darf nicht mit „${s.bewegung}“ unsichtbar sein`);
      }
    });
  }
  const ketten = b.ketten === undefined ? [] : b.ketten;
  if (!Array.isArray(ketten)) { f.push('Bewegung: bedienbar.ketten muss eine Liste sein'); return f; }
  for (const k of ketten) {
    if (!k || typeof k.vor !== 'string' || typeof k.danach !== 'string' || !NAME.test(k.vor) || !NAME.test(k.danach)) { f.push('Bewegung: Kette braucht „vor“ und „danach“'); continue; }
    if (!Array.isArray(abl[k.vor])) { f.push(`Bewegung: Kette „${k.vor}“ → „${k.danach}“: Ablauf „${k.vor}“ fehlt`); continue; }
    const n = bedienbarNachMs(cfg, k.vor, k.danach, pauseMs);
    if (ms(b.maxMs) && n > b.maxMs) f.push(`Bewegung: „${k.vor}“ → „${k.danach}“ ist erst nach ${n} ms bedienbar (höchstens ${b.maxMs})`);
  }
  return f;
}

// Wie lange vom Tipp, bis man die Einblendung „danach“ bedienen kann: Ende des Ablaufs „vor“ + Puffer + spätestes Ende
// einer Bewegung der bedienten Teile in „danach“ (normal 0, weil Knöpfe sich nicht bewegen dürfen). Wirft nie.
export function bedienbarNachMs(cfg, vorId, danachId, pauseMs = 0) {
  const teile = cfg && cfg.bedienbar && Array.isArray(cfg.bedienbar.teile) ? cfg.bedienbar.teile : [];
  const knopf = schritte(cfg, danachId).filter(s => teile.includes(s.teil)).reduce((m, s) => Math.max(m, s.startMs + s.dauerMs), 0);
  const p = ms(pauseMs) ? pauseMs : 0;
  return ablaufEndeMs(cfg, vorId) + p + knopf;
}

// Erster gültiger Schritt eines Teils (für Elemente, die sich selbst zeichnen, z. B. Funken) oder null.
export function schritt(cfg, ablaufId, teil) {
  return schritte(cfg, ablaufId).find(s => s.teil === teil) || null;
}

// Wann Funken fliegen: 'treffer' (Standard, nur als Stoß im Ablauf), 'immer' (zusätzlich dauernd), 'nie'.
export const FUNKEN_WANN = ['treffer', 'immer', 'nie'];
export const funkenWann = cfg => {
  const w = cfg && cfg.atmosphaere && cfg.atmosphaere.funkenWann;
  return FUNKEN_WANN.includes(w) ? w : 'treffer';
};

// Funken als Stoß (02.11.2026): liste = funkenListe(n, [0.7, 1]) aus logik/symbole.js (dauerS dient als Faktor 0,7–1 der
// Katalogdauer, versatzS/dauerS als Versatz bis 150 ms). Liefert je Funke { links, dx, keyframes, dauerMs, startMs, kurve };
// startMs ist schon um versatzMs (vergangene Zeit des Ablaufs) verschoben und darf negativ sein. Ohne Schritt → []. Wirft nie.
export function funkenStoss(cfg, ablaufId, teil, liste, versatzMs = 0) {
  const s = schritt(cfg, ablaufId, teil);
  if (!s || !Array.isArray(liste)) return [];
  const v = Number.isFinite(versatzMs) && versatzMs > 0 ? Math.round(versatzMs) : 0;
  return liste.filter(x => x && Number.isFinite(x.links) && Number.isFinite(x.dauerS) && x.dauerS > 0).map(x => {
    const faktor = Math.max(0.5, Math.min(1, x.dauerS));
    const anteil = Number.isFinite(x.versatzS) ? Math.max(0, Math.min(1, x.versatzS / x.dauerS)) : 0;
    return { links: x.links, dx: Number.isFinite(x.dx) ? x.dx : 0, keyframes: s.keyframes, kurve: s.kurve,
      dauerMs: Math.round(s.dauerMs * faktor), startMs: s.startMs + Math.round(anteil * 150) - v };
  });
}

// ---------- Lesezeit (02.11.2026): Sprechblasen stehen so lange, wie man zum Lesen braucht ----------
export const LESEN_STANDARD = { msProZeichen: 55, minMs: 1800, maxMs: 6000 };
const lesenCfg = l => (l && ms(l.msProZeichen) && ms(l.minMs) && ms(l.maxMs) && l.minMs <= l.maxMs ? l : LESEN_STANDARD);
// Lesedauer eines Textes in ms: Zeichen × msProZeichen, begrenzt auf minMs…maxMs. Leerer Text → 0 (Blase fällt weg). Wirft nie.
export function lesedauerMs(text, lesen) {
  const t = typeof text === 'string' ? text.trim() : '';
  if (!t) return 0;
  const l = lesenCfg(lesen);
  return Math.round(Math.max(l.minMs, Math.min(l.maxMs, t.length * l.msProZeichen)));
}

// Ablauf mit den Lesezeiten dieses Durchgangs: Schritte mit `lesen: true` bekommen dauern[teil] (ms; 0 = Blase fällt weg,
// fehlt = Datenwert bleibt); Schritte mit `nach: teil` beginnen abstandMs nach dem Ende dieses Teils (sonst ihr startMs).
// Liefert eine Kopie der Konfiguration, die Daten bleiben unverändert. Wirft nie.
export function mitLesezeit(cfg, ablaufId, dauern) {
  const liste = cfg && cfg.ablaeufe && Array.isArray(cfg.ablaeufe[ablaufId]) ? cfg.ablaeufe[ablaufId] : null;
  if (!liste) return cfg;
  const kat = cfg.katalog || {};
  const d = dauern && typeof dauern === 'object' ? dauern : {};
  const ende = {};
  const neu = [];
  for (const s of liste) {
    if (!s || typeof s !== 'object') continue;
    const x = { ...s };
    if (s.lesen && Object.prototype.hasOwnProperty.call(d, s.teil)) {
      if (d[s.teil] === 0) continue;
      if (ms(d[s.teil])) x.dauerMs = Math.round(d[s.teil]);
    }
    if (s.nach && ende[s.nach] !== undefined) x.startMs = ende[s.nach] + (ms(s.abstandMs) ? s.abstandMs : 0);
    const dauer = ms(x.dauerMs) ? x.dauerMs : kat[x.bewegung] && ms(kat[x.bewegung].dauerMs) ? kat[x.bewegung].dauerMs : 0;
    if (ms(x.startMs)) ende[x.teil] = Math.max(ende[x.teil] || 0, x.startMs + dauer);
    neu.push(x);
  }
  return { ...cfg, ablaeufe: { ...cfg.ablaeufe, [ablaufId]: neu } };
}

// Tippen = weiter: Beginn der nächsten Sprechblase (Schritt mit lesen: true) nach vergangenMs, oder null (dann ans Ende).
export function naechsterHalt(cfg, ablaufId, vergangenMs) {
  const liste = cfg && cfg.ablaeufe && Array.isArray(cfg.ablaeufe[ablaufId]) ? cfg.ablaeufe[ablaufId] : [];
  const v = Number.isFinite(vergangenMs) ? vergangenMs : 0;
  const starts = liste.filter(s => s && s.lesen === true && ms(s.startMs) && s.startMs > v + 50).map(s => s.startMs).sort((a, b) => a - b);
  return starts.length ? starts[0] : null;
}

// ---------- Sprechblasen: Restzeit-Leiste und „Nur per Tippen“ (02.11.2026) ----------
// lesen.leiste      Keyframes der Restzeit-Leiste (Präfix bw-), läuft über die ganze Dauer der Blase; fehlt/ungültig → keine Leiste
// lesen.haltAnteil  „Nur per Tippen“: an diesem Anteil der Blasen-Dauer hält der Ablauf an (0,5–0,95, sonst 0,9), also
//                   bevor die Blase ausblendet. Ein Tipp geht weiter (zur nächsten Blase oder ans Ende).
export const HALT_STANDARD = 0.9;
const haltAnteil = cfg => {
  const h = cfg && cfg.lesen && cfg.lesen.haltAnteil;
  return Number.isFinite(h) && h >= 0.5 && h <= 0.95 ? h : HALT_STANDARD;
};
// CSS-Wert für `animation` der Leiste in der Blase `teil` (Schritt mit lesen: true), z. B. „bw-leiste 4200ms 1150ms linear both“.
// Gleicher Start und gleiche Dauer wie die Blase; versatzMs wie bei animation(). '' = keine Leiste. Wirft nie.
export function leisteAnimation(cfg, ablaufId, teil, versatzMs = 0) {
  const k = cfg && cfg.lesen && cfg.lesen.leiste;
  if (!KEYFRAMES.test(String(k))) return '';
  const liste = cfg && cfg.ablaeufe && Array.isArray(cfg.ablaeufe[ablaufId]) ? cfg.ablaeufe[ablaufId] : [];
  const s = liste.find(x => x && x.teil === teil && x.lesen === true);
  const d = s ? schritt(cfg, ablaufId, teil) : null;
  if (!d) return '';
  const v = Number.isFinite(versatzMs) && versatzMs > 0 ? Math.round(versatzMs) : 0;
  return `${k} ${d.dauerMs}ms ${d.startMs - v}ms linear both`;
}
// Haltepunkte für „Nur per Tippen“ (ms ab Start des Ablaufs): je Sprechblase startMs + Dauer × haltAnteil, aufsteigend.
export function haltePunkte(cfg, ablaufId) {
  const liste = cfg && cfg.ablaeufe && Array.isArray(cfg.ablaeufe[ablaufId]) ? cfg.ablaeufe[ablaufId] : [];
  const h = haltAnteil(cfg);
  return liste.filter(s => s && s.lesen === true).map(s => schritt(cfg, ablaufId, s.teil)).filter(Boolean)
    .map(d => d.startMs + Math.round(d.dauerMs * h)).sort((a, b) => a - b);
}
// Nächster Haltepunkt nach vergangenMs (echt später), oder null. Wirft nie.
export function naechsterHaltepunkt(cfg, ablaufId, vergangenMs) {
  const v = Number.isFinite(vergangenMs) ? vergangenMs : 0;
  return haltePunkte(cfg, ablaufId).find(h => h > v) ?? null;
}
// Anhalten und Weiterlaufen (02.11.2026): Ein Ablauf läuft nach der Uhr ab startMs. Angehalten zählt die Zeit ab
// pauseSeit nicht; beim Weiterlaufen rückt der Start um die Pause nach. b = { startMs, pauseSeit? } (wird nicht verändert).
export const ablaufJetzt = (b, jetztMs) => (b && Number.isFinite(b.pauseSeit) ? b.pauseSeit : jetztMs);
export function weiterNachPause(b, jetztMs) {
  if (!b || !Number.isFinite(b.pauseSeit) || !Number.isFinite(b.startMs) || !Number.isFinite(jetztMs)) return b;
  const { pauseSeit, ...rest } = b;
  return { ...rest, startMs: b.startMs + Math.max(0, jetztMs - pauseSeit) };
}

// Überspringen (02.11.2026): neuer Startzeitpunkt eines Ablaufs, damit er jetzt als vorbei gilt (vergangen = dauerMs).
// Unveränderter Start, wenn er ohnehin vorbei ist oder die Werte ungültig sind. Wirft nie.
export function uebersprungenStart(startMs, dauerMs, jetztMs) {
  if (![startMs, dauerMs, jetztMs].every(Number.isFinite) || dauerMs < 0) return startMs;
  return jetztMs - startMs >= dauerMs ? startMs : jetztMs - dauerMs;
}

// Gültige Schritte eines Ablaufs (kaputte werden übersprungen, damit ein Tippfehler nie die Ansicht bricht).
function schritte(cfg, ablaufId) {
  const kat = (cfg && cfg.katalog) || {};
  const liste = cfg && cfg.ablaeufe && Array.isArray(cfg.ablaeufe[ablaufId]) ? cfg.ablaeufe[ablaufId] : [];
  return liste.filter(s => s && NAME.test(String(s.teil)) && ms(s.startMs) && Object.prototype.hasOwnProperty.call(kat, s.bewegung)
    && KEYFRAMES.test(String(kat[s.bewegung].keyframes)) && ms(kat[s.bewegung].dauerMs))
    .map(s => {
      const b = kat[s.bewegung];
      const dauer = ms(s.dauerMs) && s.dauerMs > 0 ? s.dauerMs : b.dauerMs;
      return { teil: s.teil, keyframes: b.keyframes, dauerMs: Math.round(dauer), startMs: Math.round(s.startMs), kurve: KURVE.test(String(b.kurve)) ? b.kurve : 'ease-out' };
    });
}

// CSS-Wert für `animation` eines Teils, z. B. „bw-treffer 560ms 700ms ease-out both“; mehrere Schritte desselben
// Teils werden mit Komma verbunden. '' = dieser Teil bewegt sich in diesem Ablauf nicht.
// versatzMs (Kampfbühne, 31.10.2026): so viel ist vom Ablauf schon vergangen. Wird die Seite mitten im Ablauf neu
// gezeichnet, läuft er mit negativer Verzögerung dort weiter, wo er war, statt von vorn. Ungültig oder ≤ 0 → 0.
export function animation(cfg, ablaufId, teil, versatzMs = 0) {
  const v = Number.isFinite(versatzMs) && versatzMs > 0 ? Math.round(versatzMs) : 0;
  return schritte(cfg, ablaufId).filter(s => s.teil === teil)
    .map(s => `${s.keyframes} ${s.dauerMs}ms ${s.startMs - v}ms ${s.kurve} both`).join(', ');
}

// Wann ist der Ablauf zu Ende (ms)? 0 = leer. Andere Abläufe richten sich danach (z. B. die Pause vor Einblendungen).
export function ablaufEndeMs(cfg, ablaufId) {
  return schritte(cfg, ablaufId).reduce((m, s) => Math.max(m, s.startMs + s.dauerMs), 0);
}
