// Welten-Intro (Version 175): die Oberfläche. Daten: daten/intro.js, Regeln: logik/intro.js.
// Eigene Ebene direkt unter <body>, nicht in #app: Neuzeichnen der App löscht sie nicht, und sie blockiert nichts, was darunter
// gerade lädt. Ein Tipp oder Escape/Enter/Leertaste beendet sie sofort. Farben kommen als var(--token) aus den echten Stil-Tokens.
// Grundsatz: Das Intro darf den Start nie stören. Jeder Fehler (fehlende Animations-Funktion, Ausnahme im Effekt) räumt die Ebene
// weg und die App läuft ohne Intro weiter. Das Intro merkt sich, BEVOR etwas zu sehen ist (introGesehen), und läuft nie zweimal.
// „Bewegung reduzieren“ (Betriebssystem oder Einstellung) und Anzeige „Ruhig“: nur die kurze Aufblende. Die CSS-Regel in
// index.html schaltet Web-Animationen (element.animate) nicht ab, darum wird das hier im Code entschieden.
import { INTRO, INTRO_EFFEKTE } from '../daten/intro.js';
import * as I from '../logik/intro.js';
import { kx } from './kontext.js';

const CSS = `
.li-wurzel{position:fixed;inset:0;z-index:2147483000;overflow:hidden;isolation:isolate;cursor:pointer;touch-action:manipulation;background:var(--nacht-verlauf,var(--nacht,#000))}
.li-wurzel.reduziert{background:transparent}
.li-welt{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;color:var(--nacht-ink,#fff)}
.li-titel{font-family:var(--fh,serif);line-height:1.2;letter-spacing:.02em;text-wrap:balance;opacity:0}
.li-satz{font-family:var(--fb,serif);font-size:15px;margin:14px auto 0;max-width:24ch;opacity:0;color:var(--nacht-soft,var(--nacht-ink,#fff))}
.li-lage{position:absolute;inset:0}
.li-schwaden{position:absolute;width:200%;background-size:700px 700px;background-repeat:repeat;will-change:transform,opacity}
.li-stern{position:absolute;left:50%;top:50%;width:3px;height:2px;border-radius:2px;transform-origin:0 50%;opacity:0}
.li-kern{position:absolute;left:50%;top:50%;width:70vmin;aspect-ratio:1;margin:-35vmin 0 0 -35vmin;border-radius:50%}
.li-balken{position:absolute;left:0;right:0;height:3px;margin-top:-1px}
.li-torhaelfte{position:absolute;top:0;bottom:0;width:50.5%}
.li-torhaelfte.links{left:0;border-right:2px solid var(--li-kante)}
.li-torhaelfte.rechts{right:0;border-left:2px solid var(--li-kante)}
.li-licht{position:absolute;top:0;bottom:0;left:43%;width:14%}
.li-staub{position:absolute;width:3px;height:3px;border-radius:50%}
.li-sonne{position:absolute;left:-10%;width:120%;aspect-ratio:1;bottom:-55%;border-radius:50%}
.li-glut{position:absolute;border-radius:50%}
.li-lampe{position:absolute;inset:0}
.li-pixel{position:absolute;inset:0;display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(16,1fr)}
`;

let lauf = null;
const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
const rnd = (a, b) => a + Math.random() * (b - a);
const mix = (farbe, pct) => `color-mix(in srgb, ${farbe} ${pct}%, transparent)`;
function anim(c, node, kf, opt) {
  const a = node.animate(kf, { fill: 'both', ...opt });
  c.anims.push(a);
  return a;
}
function decke(c, hintergrund) {
  const d = el('div', 'li-lage');
  d.style.background = hintergrund;
  c.wurzel.appendChild(d);
  return d;
}
// Farbe einer var(--token)-Angabe als [r, g, b] (nur der Nebel braucht Zahlen für sein SVG). Fehler → ruhiges Hellgrau.
function rgbVon(wurzel, farbe) {
  try {
    const p = el('span');
    p.style.color = farbe;
    wurzel.appendChild(p);
    const m = /(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(String(getComputedStyle(p).color));
    p.remove();
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  } catch (e) { /* Rückfall unten */ }
  return [210, 224, 216];
}

// ---------- Effekte: c = { wurzel, T (ms), f(platz) → var(--token), reduziert, anims } ----------
// Nebel: Wolkenstruktur aus SVG-Rauschen (einmal erzeugt), die Schwaden driften nur per transform.
function nebelTextur([r, g, b], seed, fx, fy) {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='700' height='700'>" +
    "<filter id='n' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>" +
    `<feTurbulence type='fractalNoise' baseFrequency='${fx} ${fy}' numOctaves='4' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix values='0 0 0 0 ${(r / 255).toFixed(3)} 0 0 0 0 ${(g / 255).toFixed(3)} 0 0 0 0 ${(b / 255).toFixed(3)} 0 0 0 1.9 -.55'/>` +
    "</filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
// [Seed, Frequenz x, y, links %, oben %, Höhe %, Weg von, Weg nach, Deckkraft]
const SCHWADEN = [
  [2, .006, .010, 0, -10, 120, 'translate(0,0)', 'translate(-45%,-4%)', .95],
  [7, .009, .013, -100, -5, 115, 'translate(0,0)', 'translate(45%,3%)', .8],
  [11, .007, .007, -10, -30, 170, 'translate(0,8%)', 'translate(-8%,-22%)', .9]
];

const EFFEKTE = {
  aufblende(c) {
    const d = decke(c, c.f('abdeckung'));
    if (c.reduziert) anim(c, d, [{ opacity: 1 }, { opacity: 0 }], { duration: c.T, easing: 'ease-out' });
    else anim(c, d, [{ opacity: 1 }, { opacity: 1, offset: .3 }, { opacity: 0 }], { duration: c.T * .9, easing: 'ease-out' });
  },
  nebel(c) {
    const T = c.T;
    const d = decke(c, c.f('abdeckung'));
    anim(c, d, [{ opacity: 1 }, { opacity: 1, offset: .3 }, { opacity: 0 }], { duration: T, easing: 'ease-in-out' });
    const rgb = rgbVon(c.wurzel, c.f('nebel'));
    SCHWADEN.forEach((s, i) => {
      const w = el('div', 'li-schwaden');
      w.style.cssText = `left:${s[3]}%;top:${s[4]}%;height:${s[5]}%;background-image:${nebelTextur(rgb, s[0], s[1], s[2])}`;
      c.wurzel.appendChild(w);
      anim(c, w, [{ transform: s[6], opacity: 0 }, { opacity: s[8], offset: .2 }, { opacity: s[8] * .75, offset: .6 }, { transform: s[7], opacity: 0 }],
        { duration: T, easing: 'ease-in-out', delay: i * 60 });
    });
  },
  sternflug(c) {
    const T = c.T;
    const d = decke(c, c.f('abdeckung'));
    anim(c, d, [{ opacity: 1 }, { opacity: 1, offset: .45 }, { opacity: 0 }], { duration: T });
    const k = el('div', 'li-kern');
    k.style.background = `radial-gradient(closest-side,${mix(c.f('glow'), 55)},transparent)`;
    c.wurzel.appendChild(k);
    anim(c, k, [{ transform: 'scale(.2)', opacity: 0 }, { opacity: 1, offset: .4 }, { transform: 'scale(3)', opacity: 0 }], { duration: T, easing: 'ease-in' });
    const diag = Math.hypot(globalThis.innerWidth || 400, globalThis.innerHeight || 800);
    for (let i = 0; i < 60; i++) {
      const s = el('div', 'li-stern');
      const a = rnd(0, 360), r0 = rnd(4, 30), r1 = rnd(.35, .8) * diag, len = rnd(6, 16);
      s.style.background = c.f('stern');
      s.style.boxShadow = `0 0 6px ${c.f('stern')}`;
      c.wurzel.appendChild(s);
      anim(c, s, [{ transform: `rotate(${a}deg) translateX(${r0}px) scaleX(1)`, opacity: 0 }, { opacity: 1, offset: .25 },
        { transform: `rotate(${a}deg) translateX(${r1}px) scaleX(${len})`, opacity: 0 }],
      { duration: rnd(T * .35, T * .6), delay: rnd(0, T * .35), easing: 'cubic-bezier(.5,0,1,1)' });
    }
  },
  neonscan(c) {
    const T = c.T;
    const d = el('div', 'li-lage');
    d.style.background = `repeating-linear-gradient(0deg,transparent 0 22px,${mix(c.f('raster'), 14)} 22px 23px),${c.f('abdeckung')}`;
    c.wurzel.appendChild(d);
    const b = el('div', 'li-balken');
    b.style.background = c.f('neon');
    b.style.boxShadow = `0 0 12px ${c.f('neon')},0 0 34px ${c.f('neon2')}`;
    c.wurzel.appendChild(b);
    const o = { duration: T * .85, delay: T * .1, easing: 'cubic-bezier(.6,0,.3,1)' };
    anim(c, d, [{ clipPath: 'inset(0% 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }], o);
    anim(c, b, [{ top: '0%', opacity: 1 }, { top: '100%', opacity: 1, offset: .97 }, { top: '100%', opacity: 0 }], o);
  },
  tor(c) {
    const T = c.T;
    const li = el('div', 'li-licht');
    li.style.background = `linear-gradient(90deg,transparent,${c.f('licht')},transparent)`;
    c.wurzel.appendChild(li);
    anim(c, li, [{ transform: 'scaleX(.3)', opacity: 0 }, { opacity: 1, offset: .45 }, { transform: 'scaleX(5)', opacity: 0 }], { duration: T });
    ['links', 'rechts'].forEach(seite => {
      const h = el('div', `li-torhaelfte ${seite}`);
      h.style.setProperty('--li-kante', c.f('kante'));
      h.style.background = `repeating-linear-gradient(90deg,${mix('var(--nacht-ink,#fff)', 6)} 0 2px,transparent 2px 18px),${c.f('abdeckung')}`;
      c.wurzel.appendChild(h);
      const dx = seite === 'links' ? '-102%' : '102%';
      anim(c, h, [{ transform: 'translateX(0)' }, { transform: 'translateX(0)', offset: .22 }, { transform: `translateX(${dx})` }],
        { duration: T * .92, easing: 'cubic-bezier(.65,0,.35,1)' });
    });
    for (let i = 0; i < 28; i++) {
      const m = el('div', 'li-staub');
      m.style.cssText = `left:${rnd(20, 80)}%;top:${rnd(50, 100)}%;background:${c.f('staub')}`;
      c.wurzel.appendChild(m);
      anim(c, m, [{ transform: 'translateY(0)', opacity: 0 }, { opacity: .9, offset: .4 }, { transform: `translateY(${-rnd(80, 230)}px)`, opacity: 0 }],
        { duration: rnd(T * .4, T * .5), delay: rnd(T * .2, T * .45), easing: 'ease-out' });
    }
  },
  sonnenaufgang(c) {
    const T = c.T;
    const d = decke(c, c.f('abdeckung'));
    anim(c, d, [{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0 }], { duration: T, easing: 'ease-in' });
    const s = el('div', 'li-sonne');
    s.style.background = `radial-gradient(closest-side,${c.f('sonne')},transparent)`;
    c.wurzel.appendChild(s);
    anim(c, s, [{ transform: 'translateY(10%) scale(.6)', opacity: 0 }, { opacity: 1, offset: .4 }, { transform: 'translateY(-75%) scale(1.3)', opacity: 0 }], { duration: T, easing: 'ease-in-out' });
  },
  gluehwuermchen(c) {
    const T = c.T;
    const d = decke(c, c.f('abdeckung'));
    anim(c, d, [{ opacity: 1 }, { opacity: .9, offset: .35 }, { opacity: 0 }], { duration: T, easing: 'ease-in-out' });
    const lp = el('div', 'li-lampe');
    lp.style.background = `radial-gradient(circle at 50% 55%,${mix(c.f('lampe'), 55)},transparent 60%)`;
    c.wurzel.appendChild(lp);
    anim(c, lp, [{ transform: 'scale(.6)', opacity: 0 }, { opacity: .85, offset: .5 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: T, easing: 'ease-in-out' });
    for (let i = 0; i < 20; i++) {
      const f = el('div', 'li-glut');
      const g = rnd(4, 8);
      f.style.cssText = `left:${rnd(5, 95)}%;top:${rnd(40, 95)}%;width:${g}px;height:${g}px;background:${c.f('glut')};box-shadow:0 0 10px 3px ${c.f('glut')}`;
      c.wurzel.appendChild(f);
      anim(c, f, [{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 1, offset: .7 },
        { transform: `translate(${rnd(-60, 60)}px,${-rnd(40, 140)}px)`, opacity: 0 }],
      { duration: rnd(T * .5, T * .78), delay: rnd(0, T * .2), easing: 'ease-in-out' });
    }
  },
  pixel(c) {
    const T = c.T, spalten = 9, zeilen = 16;
    const g = el('div', 'li-pixel');
    c.wurzel.appendChild(g);
    for (let r = 0; r < zeilen; r++) {
      for (let k = 0; k < spalten; k++) {
        const z = el('div');
        z.style.background = (r + k) % 2 === 0 ? c.f('abdeckung') : c.f('abdeckung2');
        g.appendChild(z);
        anim(c, z, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, delay: T * .1 + ((r + k) / (zeilen + spalten)) * T * .55 + rnd(0, T * .22), easing: 'steps(1,end)' });
      }
    }
  }
};
export const EFFEKT_IDS = Object.freeze(Object.keys(EFFEKTE));

// Titel und Satz liegen unter den Effekten und werden sichtbar, wenn sie sich heben.
function weltBauen(c, w) {
  const welt = el('div', 'li-welt');
  const innen = el('div');
  const titel = el('div', 'li-titel');
  titel.textContent = w.titel;
  if (w.titelGroesse) titel.style.fontSize = w.titelGroesse;
  else titel.style.fontSize = '30px';
  innen.appendChild(titel);
  c.titel = titel;
  if (w.satz) {
    const satz = el('div', 'li-satz');
    satz.textContent = w.satz;
    innen.appendChild(satz);
    c.satz = satz;
  }
  welt.appendChild(innen);
  c.wurzel.appendChild(welt);
}
function enthuelle(c, w) {
  const T = c.T;
  let kf, opt;
  if (w.titelAnim === 'flackern') {
    kf = [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: .2, offset: .3 }, { opacity: 1, offset: .45 }, { opacity: .5, offset: .6 }, { opacity: 1 }];
    opt = { duration: 700, delay: T * .56 };
  } else if (w.titelAnim === 'stufen') {
    kf = [{ opacity: 0 }, { opacity: 1 }];
    opt = { duration: 600, delay: T * .56, easing: 'steps(4,end)' };
  } else {
    kf = [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }];
    opt = { duration: 800, delay: T * .56, easing: 'ease-out' };
  }
  if (c.titel) anim(c, c.titel, kf, opt);
  if (c.satz) anim(c, c.satz, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: T * .68 });
}

// ---------- Ablauf ----------
function entferne(l) {
  if (!l) return;
  try { clearTimeout(l.timer); } catch (e) { /* nur Aufräumen */ }
  try { document.removeEventListener('keydown', l.taste); } catch (e) { /* nur Aufräumen */ }
  l.anims.forEach(a => { try { a.cancel(); } catch (e) { /* nur Aufräumen */ } });
  try { l.wurzel.remove(); } catch (e) { /* nur Aufräumen */ }
  if (lauf === l) lauf = null;
}
function ausblenden(ms) {
  const l = lauf;
  if (!l || l.endet) return;
  l.endet = true;
  clearTimeout(l.timer);
  if (!(ms > 0)) { entferne(l); return; }
  try {
    const a = l.wurzel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards', easing: 'ease-out' });
    a.onfinish = () => entferne(l);
    l.timer = setTimeout(() => entferne(l), ms + 200); // Sicherheitsnetz, falls das Ende nie gemeldet wird
  } catch (e) { entferne(l); }
}

export const introLaeuft = () => !!lauf;

// Startet das Intro für den aktiven Stil. true = es läuft, false = es läuft nicht (nie ein Fehler nach außen).
// Aufrufer prüfen vorher mit logik/intro.js introFaellig(spiel).
export function starteIntro() {
  if (lauf) return false;
  let wurzel = null;
  try {
    // Zuerst merken und speichern: Läuft danach etwas schief, wiederholt sich das Intro nie.
    kx.setzeSpiel(I.introMarkieren(kx.spiel));
    kx.speichere();
    if (typeof document === 'undefined' || !document.body || typeof document.body.animate !== 'function') return false;
    const stilId = kx.stand && kx.stand.stil ? kx.stand.stil.aktiv : null;
    const reduziert = kx.bewegungAus === true || !(kx.anzeige && kx.anzeige.bewegung === 'voll');
    const w = I.waehleIntro(INTRO, stilId, { reduziert, effekte: EFFEKT_IDS, meta: INTRO_EFFEKTE });
    const bau = EFFEKTE[w.effekt];
    if (typeof bau !== 'function') return false;
    if (!document.getElementById('li-css')) {
      const s = el('style');
      s.id = 'li-css';
      s.textContent = CSS;
      (document.head || document.body).appendChild(s);
    }
    wurzel = el('div', w.reduziert ? 'li-wurzel reduziert' : 'li-wurzel');
    wurzel.setAttribute('aria-hidden', 'true');
    document.body.appendChild(wurzel);
    const farben = Object.fromEntries(Object.entries(w.farben).map(([platz, token]) => [platz, `var(${token})`]));
    const c = { wurzel, T: w.dauerMs, f: platz => farben[platz], reduziert: w.reduziert, anims: [], titel: null, satz: null };
    if (!w.reduziert) weltBauen(c, w);
    bau(c);
    if (!w.reduziert) enthuelle(c, w);
    const l = { wurzel, anims: c.anims, timer: null, endet: false, ueberspringenMs: w.ueberspringenMs, taste: null };
    l.taste = e => { if (e && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) { if (e.preventDefault) e.preventDefault(); ausblenden(l.ueberspringenMs); } };
    wurzel.addEventListener('pointerdown', e => { if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); ausblenden(l.ueberspringenMs); });
    document.addEventListener('keydown', l.taste);
    lauf = l;
    l.timer = setTimeout(() => ausblenden(w.reduziert ? 0 : w.ausblendMs), w.dauerMs + 150);
    return true;
  } catch (e) {
    console.warn('Intro-Effekt fehlgeschlagen, die App startet ohne Intro:', e && e.message ? e.message : e);
    try { if (wurzel) wurzel.remove(); } catch (err) { /* nur Aufräumen */ }
    lauf = null;
    return false;
  }
}
