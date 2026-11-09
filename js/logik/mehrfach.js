// Mehrere Helden auf einmal (05.11.2026): nur für den Besitzer und im Testprofil (wie das Startpaket). Wer die App kennt,
// holt so mehrere Helden in einem Schritt, statt das Abenteuer je Held einzeln zu durchlaufen. Tester behalten den Weg
// mit einem Helden nach dem anderen: ein Held am Anfang schützt vor Überforderung (klarer Fokus, Selbstwirksamkeit).
// Auswahl = Herausforderungen (Problem einer Onboarding-Gruppe); jede bestimmt Held und Gegnerkette. Je Held höchstens eine.
// Das Ziel der Quest ist das erste Ziel der Herausforderung; ändern geht danach wie immer (Quest bearbeiten).
// Nutzt nur den bestehenden Anlege-Weg (H.heldHinzufuegen), kein neues Feld im Spielstand.
//
// Regeln beim Anlegen (alles oder nichts, wie das Startpaket):
//   - erst die ganze Auswahl prüfen (leer, unbekannt, doppelter Held, Held schon in der Crew, kein Platz), dann anlegen;
//     scheitert ein Schritt, bleibt der Spielstand unverändert (MehrfachFehler mit lesbarer Meldung).
//   - Fokus bleibt beim bisherigen Helden; ohne bisherigen der erste neue. Heldenmodi ordnen jeden neuen Helden ein
//     (Fokus voll → Erhalt), genau wie beim einzelnen Anlegen.
import * as H from './helden.js';

export class MehrfachFehler extends Error {}

// Vorlage genau für Gruppe und Problem (ohne Rückfall auf „*“: jede Zeile der Auswahl ist eine echte Herausforderung).
function vorlageGenau(tabelle, gruppeId, problemId) {
  return ((tabelle && tabelle.vorlagen) || []).find(v => v.gruppe === gruppeId && v.problem === problemId) || null;
}

// Angebot für die Auswahl: [{ gruppe: { id, name, icon }, eintraege: [{ vorlage, problem, text, held, ziel, belegt }] }].
// Nur Gruppen fürs Onboarding, nur Herausforderungen mit eigener Vorlage und mindestens einem Ziel. belegt = Held ist schon
// in der Crew. Leere Gruppen fallen weg. Wirft nie.
export function angebot(tabelle, spiel) {
  const gruppen = (tabelle && Array.isArray(tabelle.gruppen) ? tabelle.gruppen : []).filter(g => g && g.onboarding);
  const aus = [];
  for (const g of gruppen) {
    const probleme = (tabelle.probleme && Array.isArray(tabelle.probleme[g.id])) ? tabelle.probleme[g.id] : [];
    const eintraege = [];
    for (const p of probleme) {
      if (!p || p.id === '*') continue;
      const v = vorlageGenau(tabelle, g.id, p.id);
      const ziel = Array.isArray(p.ziele) ? p.ziele.find(z => typeof z === 'string' && z.trim()) : null;
      if (!v || !ziel) continue;
      let belegt = false;
      try { belegt = !!H.heldVon(spiel, v.held); } catch (e) { belegt = false; }
      eintraege.push({ vorlage: v.id, problem: p.id, text: p.text, held: v.held, ziel, belegt });
    }
    if (eintraege.length) aus.push({ gruppe: { id: g.id, name: g.name, icon: g.icon }, eintraege });
  }
  return aus;
}

const eintragVon = (ang, vorlageId) => {
  for (const g of ang || []) for (const e of g.eintraege) if (e.vorlage === vorlageId) return e;
  return null;
};

// Auswahl umschalten: gewählt → ab; sonst dazu und eine andere Herausforderung DESSELBEN Helden ersetzen (je Held eine).
// Belegte oder unbekannte Einträge ändern nichts. Liefert eine neue Liste (Vorlagen-IDs in Wahlreihenfolge).
export function umschalten(auswahl, vorlageId, ang) {
  const alt = Array.isArray(auswahl) ? auswahl.filter(x => typeof x === 'string') : [];
  const e = eintragVon(ang, vorlageId);
  if (!e || e.belegt) return alt;
  if (alt.includes(vorlageId)) return alt.filter(x => x !== vorlageId);
  return [...alt.filter(x => { const y = eintragVon(ang, x); return !y || y.held !== e.held; }), vorlageId];
}

// Wie viele Helden passen noch dazu (0 = keiner).
export const platzFrei = spiel => Math.max(0, H.MAX_HELDEN - ((spiel && Array.isArray(spiel.helden)) ? spiel.helden.length : 0));

// Auswahl prüfen. Liefert lesbare Fehler (leer = in Ordnung). Wirft nie.
export function pruefeAuswahl(spiel, auswahl, tabelle) {
  const f = [];
  const liste = Array.isArray(auswahl) ? auswahl : [];
  if (!liste.length) return ['Wähle mindestens eine Herausforderung.'];
  const ang = angebot(tabelle, spiel);
  const helden = new Set();
  for (const id of liste) {
    const e = eintragVon(ang, id);
    if (!e) { f.push(`Unbekannte Herausforderung: ${id}.`); continue; }
    const name = nameVon(tabelle, e.held);
    if (e.belegt) f.push(`${name} ist schon in deiner Crew.`);
    else if (helden.has(e.held)) f.push(`${name} ist doppelt gewählt.`);
    helden.add(e.held);
  }
  if (!f.length && liste.length > platzFrei(spiel)) f.push(`Dafür ist kein Platz: höchstens ${H.MAX_HELDEN} Helden gleichzeitig, ${spiel.helden.length} sind schon da.`);
  return f;
}

// Legt alle gewählten Helden an. auswahl = Vorlagen-IDs. Liefert { spiel, angelegt: [heroId] } oder wirft MehrfachFehler.
export function mehrereAnlegen(spiel, auswahl, tabelle, heute, zuordnung, { rampe = null } = {}) {
  if (!spiel || !Array.isArray(spiel.helden)) throw new MehrfachFehler('Kein Spielstand.');
  const fehler = pruefeAuswahl(spiel, auswahl, tabelle);
  if (fehler.length) throw new MehrfachFehler(fehler.join(' '));
  const ang = angebot(tabelle, spiel);
  const fokusVorher = spiel.fokus && H.heldVon(spiel, spiel.fokus) ? spiel.fokus : null;
  const angebotVorher = spiel.angebot;
  let s = spiel;
  const angelegt = [];
  try {
    for (const id of auswahl) {
      const e = eintragVon(ang, id);
      const v = vorlageGenau(tabelle, ...gruppeUndProblem(ang, id));
      s = H.heldHinzufuegen(s, v, e.ziel, heute, zuordnung, rampe);
      angelegt.push(v.held);
    }
  } catch (err) {
    throw new MehrfachFehler(`Nicht angelegt: ${err.message}`);
  }
  // Fokus: bisheriger Held, sonst der erste neue. Angebot „neues Abenteuer“ wie beim einzelnen Anlegen bzw. unverändert.
  s = { ...s, fokus: fokusVorher || angelegt[0], angebot: fokusVorher && angebotVorher ? angebotVorher : s.angebot };
  return { spiel: s, angelegt };
}

function gruppeUndProblem(ang, vorlageId) {
  for (const g of ang) for (const e of g.eintraege) if (e.vorlage === vorlageId) return [g.gruppe.id, e.problem];
  return [null, null];
}

function nameVon(tabelle, heroId) {
  const h = tabelle && tabelle.helden && tabelle.helden[heroId];
  return (h && h.name) || heroId;
}
