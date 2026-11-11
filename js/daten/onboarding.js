// Onboarding: Einzelfragen (Version 178, 10.11.2026, Entscheidungen Abschnitt 61). Eine Entscheidung je Seite statt vier auf
// der ersten (vorher ob1: Welt, Tür, Bereich, Datenfrage). Logik: logik/onboarding.js, Oberfläche: ansicht/onboarding.js.
//
// Die Reihenfolge ist eine Schrittliste. Jeder Schritt sagt selbst, auf welchem Weg er steht (zeigen(kontext)); so hat jeder
// Weg seine eigene Länge und „Schritt x von n“ stimmt. Neuer Schritt = neue Zeile hier + ein Bildschirm gleichen Namens in
// ansicht/onboarding.js (der Start prüft beides, logik/onboarding.js pruefeSchritte).
// Psychologie: Eine Frage je Seite senkt die Last beim ersten Öffnen. Erst der Bereich, dann „ändern oder erreichen“: Man
// entscheidet, worum es geht, bevor man entscheidet, wie, statt ein Formular mit vier Fragen abzuarbeiten.
//
// kontext (baut app.js, obKontext):
//   weg           'erst' (erster Start), 'neu' (weiterer Held, ui.neu) oder 'kapitel' (neues Ziel für einen Helden, ui.kapitelFuer)
//   welten        Anzahl wählbarer Welten (STIL_WAEHLBAR)
//   datenFrage    true = die Datenfrage gehört zu diesem Durchlauf (beim Start des Onboardings offen; bleibt bis zum Ende,
//                 damit der Schritt nach der Antwort nicht verschwindet und die Zählung springt)
//   bereich       gewählter Bereich (Onboarding-Gruppe) oder null
//   zielVorlagen  true = der gewählte Bereich hat Ziele mit Zahl (daten/zielvorlagen.js); sonst entfällt die Tür
//   freieBereiche Anzahl der Bereiche, die auf diesem Weg wählbar sind (beim neuen Ziel nur die des Helden)
//
// Felder je Schritt:
//   id                    Name des Bildschirms (beginnt mit „ob“; ob2–ob8 heißen wie vor Version 178, damit die Auswertung
//                         der Bildschirme vergleichbar bleibt)
//   zeigen                (kontext) → boolean; fehlt = immer
//   alt                   früherer Bildschirm, zu dem der Schritt gehörte (nur Auswertung: Trichter zählt beide)
//   zurueckUeberspringen  Zurück geht über diesen Schritt hinweg (die Analyse-Animation)
export const ONBOARDING_SCHRITTE = Object.freeze([
  { id: 'obwelt', alt: 'ob1', zeigen: k => k.weg === 'erst' && k.welten >= 2 },
  { id: 'obdaten', alt: 'ob1', zeigen: k => k.weg === 'erst' && k.datenFrage === true },
  { id: 'obbereich', alt: 'ob1', zeigen: k => !(k.weg === 'kapitel' && k.freieBereiche === 1) },
  { id: 'obtuer', alt: 'ob1', zeigen: k => k.zielVorlagen === true },
  { id: 'ob2' },
  { id: 'ob3' },
  { id: 'ob4', zurueckUeberspringen: true },
  { id: 'ob5' },
  { id: 'ob6' },
  { id: 'ob7' },
  { id: 'ob8' }
]);

// Bildschirme, die zum Onboarding gehören, aber keine Schritte sind (eigene Zurück-Wege).
export const ONBOARDING_NEBEN = Object.freeze(['obmehr']);

// Wohin „Zurück“ aus „Mehrere auf einmal“ führt, wenn nichts anderes gemerkt ist.
export const ONBOARDING_MEHRFACH_ZURUECK = 'obbereich';
