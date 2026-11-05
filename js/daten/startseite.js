// Startseite als Daten (Version 43, Entscheidung 28.10.2026 „Hauptscreen nach Mockup“).
// Reihenfolge hier = Reihenfolge auf dem Bildschirm. Ändern ohne Programmierung: Zeilen umsortieren
// oder `aus: true` setzen. Jeder Abschnitt entscheidet selbst, ob er gerade etwas zeigt
// (z. B. „messziele“ nur, wenn der Held welche hat).
// klappbar: true = Karte lässt sich mit „Kleiner“ auf eine Zeile einklappen (Version 52, Wahl je Gerät).
//   Braucht eine Kurzzeile in app.js (START_KURZ); ohne sie bleibt die Karte offen und es gibt eine Warnung.
//   Die Heldentat bleibt bewusst nicht klappbar: sie ist die Hauptaktion (Entscheidung 28.10.2026).
// Vorziehen und Glanz bei Neuigkeiten stehen seit Version 59 nur noch in daten/neuigkeiten.js (eine Quelle).
// Unbekannte oder doppelte IDs werden übersprungen und in der Konsole gemeldet (logik/startseite.js).
//
// Seit 31.10.2026 (Startseite als Kampfbühne, Schritt Kopfleiste und Neuigkeiten, Entscheidungen Abschnitt 18):
// Held und Hauptquest in EINER Kopfleiste, darunter ein fester Platz für Neuigkeiten, Premium nur noch in den Einstellungen.
// wann: 'immer' (Standard) | 'vorCheck' | 'nachCheck' – gemessen am Tages-Check des aktiven Helden (logik/startseite.js nachWann).
//   'vorFeuer' (Etappe 3, Teil C) = immer, außer das Lagerfeuer brennt (daten/lagerfeuer.js): der Tag endet ohne Zusatzaufgaben.

// klein: true = eingeklappt, bis man es aufklappt (Kampfbühne, 31.10.2026). Gemerkt je Gerät wie „Kleiner“.
// ersetzt: dieser Abschnitt übernimmt die Rolle der genannten. Verweise auf sie (Neuigkeiten, Glanz, Vorziehen in
//   daten/neuigkeiten.js) zeigen dann auf ihn, solange die genannten aus sind (logik/startseite.js abschnittZiel).
//
// Kampfbühne (31.10.2026, Entscheidungen Abschnitt 18): Crew-Botschaft, Heldentat und Duell sind EINE Karte „buehne“.
// Alter Ablauf wiederherstellen: bei „buehne“ aus: true setzen und bei botschaft, heldentat und duell aus: true löschen.
export const START_ABSCHNITTE = [
  { id: 'hinweise' },   // Systemhinweise und Dank fürs Feedback (keine Neuigkeiten)
  { id: 'tagesleiste' }, // Etappe 3, Teil B: „Heute x von n“ mit Porträts, nur ab 2 Helden
  { id: 'kopfleiste' }, // Held und Hauptquest: Porträt mit ⓘ und Stufe, Titel mit Stift, Warum, Weg, Lebenszeile
  { id: 'neuigkeiten' },// fester Platz, höchstens NEU_PLATZ.max am Tag (Einwilligung, Neu freigeschaltet, Abenteuer, Welten)
  { id: 'buehne', ersetzt: ['botschaft', 'heldentat', 'duell'] }, // Kampfbühne: Gegner, Sprechblase, Heldentat, Siegel, Ruhe
  { id: 'botschaft', aus: true },  // alter Ablauf: Crew-Botschaft des Tages als eigene Karte
  { id: 'heldentat', aus: true },  // alter Ablauf: Heutige Heldentat (Version 44)
  { id: 'duell', aus: true },      // alter Ablauf: Duell-Karte (Version 45)
  { id: 'messziele', klappbar: true, klein: true, wann: 'vorFeuer' }, // Messziele des Helden (Version 76), nur wenn er welche hat
  { id: 'bonus', klappbar: true, klein: true, wann: 'vorFeuer' },     // kleine Tagesaufgaben, ohne XP-Angabe (Überrechtfertigung vermeiden)
  { id: 'story' },
  // Wochenrunde (05.11.2026, daten/wochenrunde.js): am Rundentag (Sonntag, Montag nachholen), ab Stufe 3; „Diese Woche nicht“
  // ohne Rückfrage. Unter der Bühne, damit sie nie vor der Hauptaktion steht.
  { id: 'wochenrunde' },
  // Tagesnotiz (04.11.2026): erst abends (daten/tagesnotiz.js), „Heute nicht“ bis morgen weg. Nach dem Tages-Check
  // (oder wenn das Lagerfeuer brennt) rückt sie direkt unter die Kampfbühne: der Rückblick als Abschluss des Tages.
  // vorziehen.nach = Ziel; wann gezogen wird, entscheidet die Startseite (Signal: Check erledigt oder Feuer).
  { id: 'tagesnotiz', vorziehen: { nach: 'buehne' } },      // nur noch, wenn VOR dem Check ein Siegel wartet; sonst steht die Geschichte im Ruhezustand der Bühne
  { id: 'extra', wann: 'nachCheck' } // Feedback-Bitte erst nach dem Check (nicht vor der Hauptaktion)
];

// Kampfbühne (31.10.2026): welche Abläufe aus daten/bewegung.js nach dem Tages-Check laufen und wann die Bühne in den
// Ruhezustand geht. Ruhezustand = Ende des Ablaufs + ruhePauseMs (0–5000, sonst 900). Fehlt ein Ablauf, geht die Bühne
// sofort in den Ruhezustand (Warnung beim Start). Nach „Heute nicht gebraucht“ gibt es keinen Ablauf (direkt Ruhe).
// ablauf.treffer  nach „Ja“ an einem normalen Tag
// ablauf.sieg     nach „Ja“ am Siegtag (die Siegkarte ist der Höhepunkt, kein Heldenbild, keine Sprechblase)
// ablauf.kurz     nach „Ja“, wenn der volle Treffer schon oft lief (Regel `kurz`; Version 139)
// ruheAblauf      Übergang in den Ruhezustand (Bühne schrumpft, Ruhezeile erscheint)
// kurz (Version 139, 05.11.2026): Treffer-Ablauf mit der Zeit kürzen. Gezählt werden die Treffer-Tage („Ja“) des Helden
//   VOR heute. Liegen schon `abTreffer` zurück, läuft `ablauf.kurz` (Schlag, Segment bricht, Wort „Treffer“, gut
//   2 Sekunden bis zur Ruhe) statt des vollen Ablaufs mit Heldenbild und Sprechblasen. Der Siegtag hat immer seinen
//   eigenen Ablauf; mit `vollBeiComeback` läuft am ersten guten Tag nach einem schweren Tag der volle Ablauf.
//   abTreffer: ganze Zahl 1–365, 0 = nie kürzen (sonst 7). Fehlt `ablauf.kurz`, bleibt es beim vollen Ablauf.
//   Psychologie: Dieselbe lange Animation wird mit der Zeit zur Wartezeit (Gewöhnung). Sie bleibt vorhersehbar, es gibt
//   keine Zufallsbelohnung (kein Spielautomaten-Effekt); groß wird nur, was selten ist: Sieg und Rückkehr.
export const KAMPFBUEHNE = {
  ablauf: { treffer: 'buehneTreffer', kurz: 'buehneTrefferKurz', sieg: 'buehneSieg' },
  ruheAblauf: 'buehneRuhe',
  ruhePauseMs: 900,
  kurz: { abTreffer: 7, vollBeiComeback: true }
};

// Fester Platz für Neuigkeiten (31.10.2026): höchstens `max` verschiedene am Tag, in dieser Reihenfolge (Vorrang).
// Was nicht mehr passt, wartet auf den nächsten Tag; ein erledigter Platz wird heute nicht neu besetzt.
// Erlaubte IDs: Karten in ansicht/startseite.js (NEU_KARTEN); unbekannte werden beim Start gemeldet und übersprungen.
// max: 0–5, sonst 2.
// Ziel-Quests (31.10.2026): 'zielstand' = Ziel erreicht (Feier mit Rückblick) oder Stichtag vorbei (ruhige Frage).
// Rundenrückblick (02.11.2026, Entscheidung 26 9a): 'rueckblick' = Runde vorbei, Brief des Helden (zählt ins Tageslimit).
// Nach der Freigabe: eine Freischaltung ist ein Belohnungsmoment des Tages; der Rückblick darf einen Tag warten (Zeitfenster 3 Tage).
export const NEU_PLATZ = { max: 2, vorrang: ['einwilligung', 'zielstand', 'freigabe', 'rueckblick', 'angebot', 'welten'] };

// Weg der Bosskette auf der Hauptquest-Karte (30.10.2026): wie viele geschaffte Stationen (besiegte Gegner, am Anfang
// der Start) links sichtbar bleiben und wie viele kommende Gegner als Silhouette erscheinen; danach immer Nebel.
// Erlaubt: ganze Zahlen 0–6 (sonst Standard 1/1). Bei mehr besiegten Gegnern rutscht der älteste links aus dem Bild.
export const WEG_FENSTER = { zurueck: 2, voraus: 1 };

// Kopfleiste (31.10.2026, kompakter wie im Entwurf): Form des Wegs der Bosskette.
// weg: 'pfad'  = geschwungener Pfad mit Stationen und Heldenfigur darüber (seit 30.10.2026), flacher
//      'kette' = kleine Kette in einer Zeile: besiegte Gegner, Held, aktueller Gegner, Schatten, Nebel (Entwurf Version 15)
//      'streifen' (Version 135, 04.11.2026) = eingeklappt eine Zeile mit aktuellem Gegner, Balken und „noch n bis …“;
//                antippen klappt große, seitlich wischbare Bilder auf (WEG_FENSTER). Auf/zu wird je Gerät gemerkt
//                (Merkmal weg_offen). Grund: kleine Bilder waren am Handy kaum zu erkennen und nahmen Platz über der Heldentat.
// Unbekannter Wert → 'pfad'.
// warumZeichen (Etappe 3, Teil A): Warum und Lebenszeile teilen sich eine Zeile. Ist das Warum länger, wird es auf
// eine Zeile gekürzt und lässt sich aufklappen (nur in der Sitzung gemerkt). 0 = immer ganz zeigen.
// Version 146: 60 statt 44 Zeichen (das eigene Warum soll meist ganz lesbar sein, Bewertung 05.11.2026 Punkt 10).
export const KOPFLEISTE = { weg: 'streifen', warumZeichen: 60 };

// Heldenkopf: wie viele Mini-Porträts der Knopf „Helden wechseln“ höchstens stapelt.
export const HELDENKOPF = { stapelMax: 3 };

// Tagesleiste (Etappe 3, Teil B, 02.11.2026): ersetzt auf der Startseite den Heldenstapel oben rechts. „Heute 1 von 3“,
// daneben die Porträts mit Haken bei erledigt; ein Tipp wechselt den Helden. Die Karte behält den Stapel.
// an: false = wieder Stapel; abHelden: ab so vielen Helden sichtbar; max: höchstens so viele Taten am Tag.
export const TAGESLEISTE = { an: true, abHelden: 2, max: 3 };

// Morgenprobe (Version 81, schlanke Variante, Entscheidung 30.10.2026 Punkt 9): leise Zeile „Wo könnte es heute
// schwierig werden?“ auf der Heldentat-Karte, nur vor dem Tages-Check. Antippen klappt eine kurze Probe auf: den Plan
// im Kopf durchspielen, dazu der letzte Plan fürs nächste Mal aus einem schweren Tag. Keine eigene Runde, keine XP,
// nichts gespeichert (ein verpasster Morgen darf keine kleine Niederlage sein).
// Psychologie: Wer die Situation vorher kurz vor Augen hat, erkennt den Auslöser im Moment eher (mentale Probe des
// Wenn-dann-Plans, wie bei WOOP).
// an        false = Zeile ausblenden
// planTage  Pläne aus schweren Tagen, die höchstens so alt sind, erscheinen in der Probe (0–90, sonst 30)
// Version 81, Entscheidung 30.10.2026 (Punkt 4, 13a): zwei Varianten, je Person in den Einstellungen wählbar, sofort,
// ohne Freischaltung. Gespeichert in spiel.einstellungen.probe (geräteübergreifend). Fehlt das Feld: `standard`.
// varianten   erlaubte Werte; 'kurz' = Zeile mit Box, 'ausfuehrlich' = Blatt mit allen Helden, „Könnte heute kommen“
//             (Eintrag der Art probe) und Muster-Hinweis
// musterMin   ab so vielen schweren Tagen am selben Wochentag erscheint der Muster-Hinweis (1–20, sonst 3)
export const PROBE = { an: true, planTage: 30, varianten: ['kurz', 'ausfuehrlich'], standard: 'kurz', musterMin: 3 };

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

// Fortschritt ordnen (Version 140, 05.11.2026, Startseiten-Bewertung Punkt 2): welche Fortschrittsanzeige wo steht.
// Psychologie: Auf „Wie weit bin ich?“ gibt die Startseite VOR der Tat eine einzige Antwort (der Gegner-Streifen
// „noch n bis …“ und „n×“ als Identitätszeile). Bilanz-Zahlen (Stufe, Kapitel, „x von y“, Beständigkeit) stehen dort,
// wo man bewusst zurückschaut: im Heldenblatt und im Ruhezustand nach dem Check. Zu viele Zähler auf einmal verwässern
// die Bedeutung jedes einzelnen; die Bilanz nach dem Tun wirkt als Rückblick, nicht als Druck davor.
// orte: 'kopfleiste' | 'ruhe' (Ruhezustand der Kampfbühne, unter der Siegelleiste) | 'heldenblatt'.
// Unbekannte Anzeigen oder Orte werden beim Start gemeldet und übersprungen (logik/startseite.js fortschrittOrte);
// fehlt eine Anzeige ganz, gilt ihr Standard aus FORTSCHRITT_STANDARD.
//   stufe          Stufe (und im Heldenblatt die XP-Leiste)
//   kapitel        Kapitel der Bosskette
//   rundeStand     „x von y“ der laufenden Runde
//   rest           „noch n bis …“ im Gegner-Streifen (der Streifen selbst mit Balken bleibt immer)
//   anwendungen    „n×“ neben dem Warum (bzw. die Lebenszeile ohne Warum)
//   bestaendigkeit beste Folge und Comebacks
// Eigene Einstellungen behalten (eine Quelle): Siegelleiste in daten/siegelleiste.js (`orte`, nur nach dem Check),
// Tagesleiste in TAGESLEISTE (oben). Die Kraft des Gegners in der Arena gehört zur Bühne, nicht in diese Liste.
export const FORTSCHRITT_ORTE = Object.freeze(['kopfleiste', 'ruhe', 'heldenblatt']);
export const FORTSCHRITT_STANDARD = Object.freeze({
  stufe: ['heldenblatt', 'ruhe'],
  kapitel: ['heldenblatt'],
  rundeStand: ['heldenblatt'],
  rest: ['kopfleiste'],
  anwendungen: ['kopfleiste'],
  bestaendigkeit: ['heldenblatt', 'ruhe']
});
export const FORTSCHRITT = {
  stufe: { orte: ['heldenblatt', 'ruhe'] },
  kapitel: { orte: ['heldenblatt'] },
  rundeStand: { orte: ['heldenblatt'] },
  rest: { orte: ['kopfleiste'] },
  anwendungen: { orte: ['kopfleiste'] },
  bestaendigkeit: { orte: ['heldenblatt', 'ruhe'] }
};
