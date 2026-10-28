// Startseite als Daten (Version 43, Entscheidung 28.10.2026 „Hauptscreen nach Mockup“).
// Reihenfolge hier = Reihenfolge auf dem Bildschirm. Ändern ohne Programmierung: Zeilen umsortieren
// oder `aus: true` setzen. Jeder Abschnitt entscheidet selbst, ob er gerade etwas zeigt
// (z. B. „angebot“ nur, wenn ein neues Abenteuer fällig ist).
// klappbar: true = Karte lässt sich mit „Kleiner“ auf eine Zeile einklappen (Version 52, Wahl je Gerät).
//   Braucht eine Kurzzeile in app.js (START_KURZ); ohne sie bleibt die Karte offen und es gibt eine Warnung.
//   Die Heldentat bleibt bewusst nicht klappbar: sie ist die Hauptaktion (Entscheidung 28.10.2026).
// Unbekannte oder doppelte IDs werden übersprungen und in der Konsole gemeldet (logik/startseite.js).
//
// Ziel (Mockup): Held → Quest → Heldentat → Duell → Bonus → Story. Die Abschnitte heißen schon so;
// ihr Inhalt wird in den nächsten Schritten umgebaut (Heldentat-Karte, Duell-Karte, Story nur wenn neu).

export const START_ABSCHNITTE = [
  { id: 'hinweise' },   // Hinweise, Einwilligung, Dank fürs Feedback
  { id: 'heldenkopf' }, // aktiver Held groß + „Helden wechseln“
  { id: 'angebot' },    // „Neues Abenteuer?“ nach dem ersten Sieg
  { id: 'botschaft' },  // Crew-Botschaft des Tages
  { id: 'quest', klappbar: true }, // Hauptquest mit Weg und Leben (einklappbar seit Version 52)
  { id: 'heldentat' },  // Heutige Heldentat: Fähigkeit, Wenn-dann, Tagesfrage, Ja / Nicht gebraucht (Version 44)
  { id: 'duell' },      // Duell-Karte: Held vs Gegner mit Lebensbalken (Version 45)
  { id: 'bonus' },      // kleine Tagesaufgaben
  { id: 'story' },
  { id: 'welten' },
  { id: 'extra' }       // Feedback-Bitte, Premium
];

// Heldenkopf: wie viele Mini-Porträts der Knopf „Helden wechseln“ höchstens stapelt.
export const HELDENKOPF = { stapelMax: 3 };

// Bonus-Aufgaben (Version 45): so viele sind sichtbar, der Rest hinter „+ N weitere“.
export const BONUS = { sichtbar: 2 };

// Momente der Startseite (Version 49, Entscheidung 28.10.2026 „Heldenbilder an Momente koppeln“).
// erfolg.an        großes Heldenbild in der Heldentat-Karte direkt nach „Ja, geschafft“ (einklappbar).
//                  Beim nächsten Öffnen der Startseite (auch nach Neuladen, auf einem anderen Gerät, am Folgetag) klein.
// wechsel.an       kurzes Banner mit Heldenbild beim bewussten Heldenwechsel (nicht beim App-Start).
// wechsel.dauerMs  wie lange das Banner sichtbar bleibt (800–8000, sonst Standard)
// Ungültige Werte fallen einzeln auf den Standard zurück (logik/startseite.js startMomente()).
export const START_MOMENTE = {
  erfolg: { an: true },
  wechsel: { an: true, dauerMs: 2600 }
};
