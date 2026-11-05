// Siegelleiste und Erfolgssatz (Etappe 3, Teil D, 02.11.2026): reine Funktionen ohne Oberfläche.
// Einstellungen: daten/siegelleiste.js. Nichts gespeichert: alles folgt aus den Antworten, Ruhetagen und Runden.
import * as K from './kern.js';
import { rundenSiegel } from './rueckblick.js';
import { streuwert } from './inhalte.js';

const TAG = /^\d{4}-\d{2}-\d{2}$/;

// Runde, zu der heute gehört (auch am Siegtag: die gewonnene, nicht die schon begonnene nächste), mit ihrem Ziel.
// Liefert { nr, von, bis, ziel, anwendungen, sieg } oder null (keine Quest, Runde erst ab morgen, kaputter Stand).
export function leistenRunde(stand, heuteK) {
  if (!stand || !stand.quest || !stand.tage || !TAG.test(String(heuteK))) return null;
  let l;
  try { l = K.runden(stand, heuteK).runden; } catch (e) { return null; }
  const r = l.find(x => x.von <= heuteK && heuteK <= x.bis);
  if (!r) return null;
  return {
    nr: r.nr, von: r.von, bis: r.bis, ziel: K.rundenZiel(stand.quest, r.siegeVorher, r.nr),
    anwendungen: r.anwendungen, sieg: !!r.sieg && r.sieg <= heuteK
  };
}

// Tage der Runde: [{ tag, siegel, heute, zukunft }]; siegel = Regel aus reihenfolge oder 'leer' (offen).
export function leistenTage(stand, runde, heuteK, reihenfolge) {
  const liste = Array.isArray(reihenfolge) ? reihenfolge : ['treffer', 'ruhig', 'schwer', 'ruhetag'];
  return rundenSiegel(stand, runde, [], liste).map(x => ({ ...x, heute: x.tag === heuteK, zukunft: x.tag > heuteK }));
}

// Stufe des Erfolgssatzes: null (noch kein Satz) | 'erster' | 'halb' | 'fast' | 'sieg'. Wirft nie.
//   sieg   Runde gewonnen oder Ziel erreicht
//   fast   noch genau ein Treffer (bei Ziel 1 gibt es kein „fast“)
//   halb   mindestens halbAb × Ziel
//   erster ab cfg.ab Treffern, darunter kein Satz
export function erfolgsStufe(n, ziel, sieg, cfg = {}) {
  const t = Number.isInteger(n) && n > 0 ? n : 0;
  const z = Number.isInteger(ziel) && ziel > 0 ? ziel : 1;
  const ab = Number.isInteger(cfg && cfg.ab) && cfg.ab >= 1 ? cfg.ab : 1;
  const halbAb = typeof (cfg && cfg.halbAb) === 'number' && cfg.halbAb >= 0 && cfg.halbAb <= 1 ? cfg.halbAb : 0.5;
  if (t < ab) return null;
  if (sieg || t >= z) return 'sieg';
  if (z - t === 1) return 'fast';
  if (t >= halbAb * z) return 'halb';
  return 'erster';
}

// Satz des Tages für einen Helden: fest je Tag und Held (bleibt beim Neuladen gleich, wechselt täglich).
// texte = Varianten; leer oder kaputt → null (dann kein Satz).
export function erfolgsSatz(texte, tag, heldId) {
  const l = (Array.isArray(texte) ? texte : []).filter(t => typeof t === 'string' && t.trim());
  if (!l.length) return null;
  return l[streuwert(`${tag}|erfolg|${heldId || ''}`) % l.length];
}

// Alles für die Ansicht: { runde, tage, n, ziel, stufe, anlass } oder null (aus, keine Runde). Wirft nie.
// n = Treffer bis heute (Ja-Tage der Runde), ziel = Ziel der Runde.
export function siegelleiste(stand, heuteK, cfg = {}) {
  if (!cfg || cfg.an === false) return null;
  try {
    const runde = leistenRunde(stand, heuteK);
    if (!runde) return null;
    let tage = leistenTage(stand, runde, heuteK, cfg.reihenfolge);
    const n = tage.filter(x => x.siegel === 'treffer' && !x.zukunft).length;
    // Zählweise Wache (04.11.2026): die Runde hat kein Zeitlimit, Tage ohne Anlass sind neutral. Darum nur die
    // eingetragenen Tage und für jeden noch fehlenden Treffer ein offenes Siegel ohne Tag (kein Kalender voller Lücken).
    if (K.zaehlweiseHeute(stand, heuteK).rundeOffen) {
      tage = tage.filter(x => x.siegel !== 'leer' && !x.zukunft);
      for (let i = n; i < runde.ziel && !runde.sieg; i++) tage.push({ tag: null, siegel: 'leer', heute: false, zukunft: true });
    }
    if (!tage.length) return null;
    const e = cfg.erfolg || {};
    const stufe = e.an === false ? null : erfolgsStufe(n, runde.ziel, runde.sieg, e);
    const anlass = stufe && e.anlaesse && typeof e.anlaesse[stufe] === 'string' ? e.anlaesse[stufe] : null;
    return { runde, tage, n, ziel: runde.ziel, stufe, anlass };
  } catch (err) { return null; }
}
