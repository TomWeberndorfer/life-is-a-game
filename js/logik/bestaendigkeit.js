// Beständigkeit und Comeback (04.11.2026, Entscheidungen Abschnitt 37). Reine Funktionen ohne Zeitbezug und ohne DOM,
// werfen nie. Was als guter Tag zählt, kommt aus der Zielart (daten/zielarten.js, `zaehlt`; logik/teilziele.js,
// zaehltAntworten); gezählt und gesiegt wird in logik/kern.js (runden) wie beim Zähler.
//
// Psychologie: Statt einer Serie, die bei einem Ausrutscher auf null fällt (Abstinenzverletzungs-Effekt), zählt die App
// gute Tage je Runde. Dazu macht sie zwei Dinge sichtbar, die Selbstwirksamkeit stärken, ohne Druck zu machen:
//   - beste Folge: nur als leise Information im Heldenblatt, nie als Bedingung für einen Sieg
//   - Comeback: der erste gute Tag nach einem schweren Tag. Gezählt wird der Wiedereinstieg, nicht der Rückfall.

const TAG = /^\d{4}-\d{2}-\d{2}$/;
const istTag = t => typeof t === 'string' && TAG.test(t);
const plus = (k, n) => { const [y, m, d] = k.split('-').map(Number); const x = new Date(y, m - 1, d + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const abstand = (a, b) => { const z = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((z(b) - z(a)) / 864e5); };

// Gute Tage (sortiert): Tage, deren Antwort in `zaehlt` steht, bis einschließlich bisK (ohne bisK: alle).
export function guteTage(tage, zaehlt = ['ja'], bisK = null) {
  if (!tage || typeof tage !== 'object') return [];
  const z = Array.isArray(zaehlt) ? zaehlt : ['ja'];
  return Object.keys(tage).filter(t => istTag(t) && z.includes(tage[t]) && (!bisK || t <= bisK)).sort();
}

// Längste Folge guter Tage. bruecken: Tage, die weder zählen noch die Folge unterbrechen (Ruhetage, Pausen der
// Heldenmodi). Ein guter Tag, der zugleich Brücke ist, zählt trotzdem. Liefert eine Zahl ≥ 0.
export function besteFolge(tage, zaehlt = ['ja'], bruecken = [], bisK = null) {
  const gut = new Set(guteTage(tage, zaehlt, bisK));
  if (!gut.size) return 0;
  const bruecke = new Set((Array.isArray(bruecken) ? bruecken : []).filter(istTag));
  const liste = [...gut].sort();
  let best = 0, lauf = 0, letzter = null;
  for (const t of liste) {
    if (letzter) {
      // Lücke zwischen letzter und t nur aus Brücken? Dann läuft die Folge weiter.
      let k = plus(letzter, 1), ok = true, schritte = 0;
      while (k < t && schritte < 400) { if (!bruecke.has(k)) { ok = false; break; } k = plus(k, 1); schritte++; }
      lauf = ok && schritte < 400 ? lauf + 1 : 1;
    } else lauf = 1;
    if (lauf > best) best = lauf;
    letzter = t;
  }
  return best;
}

// Comebacks: guter Tag, dessen letzter markierter Tag davor ein schwerer Tag ohne guten Tag war.
// schwerTage: Tage mit einem Eintrag „schwer“. Ein Tag, der schwer UND gut ist (schwerer Moment, trotzdem standgehalten),
// ist ein guter Tag und beginnt keine schwere Phase. Liefert
//   { anzahl, heute, nachTagen } – anzahl bis einschließlich heuteK; heute = heuteK ist ein Comeback;
//   nachTagen = Tage seit dem schweren Tag (nur wenn heute, sonst null).
export function comebacks(tage, zaehlt = ['ja'], schwerTage = [], heuteK = null) {
  const leer = { anzahl: 0, heute: false, nachTagen: null };
  const bis = istTag(heuteK) ? heuteK : null;
  const gut = new Set(guteTage(tage, zaehlt, bis));
  const schwer = new Set((Array.isArray(schwerTage) ? schwerTage : []).filter(t => istTag(t) && (!bis || t <= bis) && !gut.has(t)));
  if (!gut.size || !schwer.size) return leer;
  const alle = [...new Set([...gut, ...schwer])].sort();
  let anzahl = 0, heute = false, nachTagen = null, vorher = null;
  for (const t of alle) {
    if (gut.has(t) && vorher && schwer.has(vorher)) {
      anzahl++;
      if (t === bis) { heute = true; nachTagen = abstand(vorher, t); }
    }
    vorher = t;
  }
  return { anzahl, heute, nachTagen };
}
