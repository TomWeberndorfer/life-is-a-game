// Freischaltung als Daten (Version 37): untere Leiste und Funktionen außerhalb der Leiste.
// Ändern ohne Programmierung: Regel `frei` anpassen, Tab ergänzen oder umsortieren.
// Regeln (geprüft in logik/freischaltung.js):
//   { art: 'immer' }                             frei von Anfang an (auch: kein `frei`)
//   { art: 'sieg' }                              nach dem ersten Sieg eines Helden
//   { art: 'stufe', ab: 3 }                      sobald der höchste Held diese Stufe erreicht
//   { art: 'kapitel', ab: 2 }                    sobald ein Held dieses Kapitel seiner Bosskette erreicht (30.10.2026)
//   { art: 'zaehler', name: 'rueckfaelle', ab: 1 } sobald ein Zähler den Wert erreicht (Namen: ZAEHLER)
// Unbekannte oder kaputte Regeln sperren (sicherer Rückfall) und erscheinen als Warnung in der Konsole.

// Zähler, die Regeln abfragen dürfen. Ein Zähler, den die App noch nicht erfasst, gilt als 0.
// rueckfaelle: kommt mit dem Eintrag Sieg/Rückfall (Startseite Phase D); bis dahin immer 0.
export const ZAEHLER = ['siege', 'rueckfaelle'];

// Untere Leiste, höchstens MAX_TABS Einträge (Handybreite).
// label: { text: '<Textschlüssel>' } oder { wort: '<Stil-Wort>' } (z. B. Stadt heißt in Sci-Fi „Station“).
// sperrText: Textschlüssel für den Hinweis beim Antippen eines gesperrten Tabs (optional).
//   Ohne sperrText: bei Stufen- und Kapitel-Regeln „öffnet sich ab Stufe/Kapitel X“, sonst ein allgemeiner Satz.
// neuText: Textschlüssel für den Hinweis „Neu für dich“ nach der Freischaltung (Version 50, optional).
// bald: true = Bereich ist noch nicht gebaut; frei geschaltet zeigt er den Platzhalter „kommt bald“.
export const MAX_TABS = 5;
export const TABS = [
  { screen: 'start', label: { text: 'tab.start' }, icon: 'haus' },
  // Logbuch („Chronik“ in Fantasy) von Anfang an offen (Entscheidung 30.10.2026, vorher ab Stufe 2): Rückschau auf das eigene
  // Tun stärkt das Erleben von Fortschritt gerade am Anfang; der leere Zustand hat einen eigenen Text (lb.leer).
  { screen: 'logbuch', label: { text: 'tab.logbuch' }, icon: 'buch', frei: { art: 'immer' } }, // gebaut seit Version 41
  { screen: 'karte', label: { text: 'tab.karte' }, icon: 'karte', frei: { art: 'kapitel', ab: 2 }, neuText: 'neu.karte' }, // gebaut seit 30.10.2026; ab Kapitel 2, vorher wäre die Reise fast leer
  // Reihenfolge Start | Logbuch | Karte | Stadt (Wunsch 30.10.2026, vorher Stadt an zweiter Stelle). Die Taktung der Freigaben
  // steht unabhängig davon in FREIGABE.reihenfolge.
  { screen: 'stadt', label: { wort: 'stadt' }, icon: 'burg', frei: { art: 'sieg' }, sperrText: 'tab.stadtGesperrt', neuText: 'neu.stadt' },
  { screen: 'gruppe', label: { text: 'tab.gruppe' }, icon: 'menschen', frei: { art: 'stufe', ab: 4 }, bald: true }
];

// Funktionen außerhalb der Leiste (Entscheidung 27.10.2026). Noch nicht gebaut; die Regeln gelten,
// sobald die Funktion zurückkommt (Abfrage: funktionFrei('<id>') in app.js).
// - quests_bearbeiten: nie gesperrt (Grundfunktion, keine Belohnung)
// - notfallkarte: nach Bedarf, beim ersten Rückfall (nicht nach Stufe: Rückfälle passieren gerade am Anfang)
// - wochenrunden, wheel: ab Stufe 3 (vorher gibt es noch nichts zurückzublicken)
export const FUNKTIONEN = {
  quests_bearbeiten: { frei: { art: 'immer' } },
  notfallkarte: { frei: { art: 'zaehler', name: 'rueckfaelle', ab: 1 } },
  wochenrunden: { frei: { art: 'stufe', ab: 3 } },
  wheel: { frei: { art: 'stufe', ab: 3 } }
};

// Höchstens eine Freischaltung pro Tag (Version 69, Vorschlag 30.10.2026 „ein Höhepunkt je Check“, Punkt 4).
// Am ersten Siegtag fielen Stadt, Logbuch (Stufe 2), „Neues Abenteuer?“ und die Weltenwahl zusammen; jetzt kommt je Tag eins.
// maxProTag          höchstens so viele Freigaben je Tag (0 = Taktung aus, alles sofort wie bis Version 68)
// reihenfolge        welche verdienten Dinge getaktet werden und in welcher Reihenfolge. IDs: Tab-IDs aus TABS mit eigener
//                    Regel (ohne `bald`) und die Quellen in app.js (FREIGABE_QUELLEN: welten, angebot). Nicht genannte = sofort frei.
// nichtAmHoehepunkt  true = keine Freigabe an einem Tag mit Sieg oder gezeigtem Höhepunkt (der Sieg bleibt der Moment des Tages)
// sperreBisFreigabe  true = verdienter Bereich bleibt bis zur Freigabe gesperrt (Hinweis „Verdient! … öffnet sich bald“);
//                    false = sofort benutzbar, nur die Ankündigung („Neu für dich“, Weltenwahl, Angebot) wird getaktet
// Ergänzt 30.10.2026 (Freigabe-Stau bei kurzen Runden: bei Gegnern mit 1 Anwendung war jeder Tag ein Höhepunkt-Tag):
// pauseBei           welche Einblendungen einen Höhepunkt-Tag machen (Arten aus logik/momente.js). Der Kapitelwechsel
//                    („lauf“, „gegner“) zählt NICHT: er ist ein Auftakt, kein Triumph, und kommt fast jeden zweiten Tag.
// eigenerMoment      Freigaben, die selbst eine Einblendung sind (Weltenwahl) und darum nicht im selben Besuch wie der
//                    Kapitelwechsel kommen; ruhige Freigaben („Neu für dich“-Karte) dürfen dann trotzdem.
// maxWarteTage       Sicherheitsnetz: wartet eine verdiente Freigabe so viele Tage wegen Höhepunkten, kommt sie beim nächsten
//                    Öffnen trotzdem (nie direkt nach dem Höhepunkt). 0 = aus. Grund: „Verdient! … öffnet sich bald“ ist ein
//                    Versprechen; unbestimmtes Warten fühlt sich wie ein gebrochenes an.
export const FREIGABE = {
  maxProTag: 1,
  reihenfolge: ['stadt', 'welten', 'angebot', 'karte'],
  nichtAmHoehepunkt: true,
  sperreBisFreigabe: true,
  pauseBei: ['sieg', 'levelup', 'story'],
  eigenerMoment: ['welten'],
  maxWarteTage: 2
};
