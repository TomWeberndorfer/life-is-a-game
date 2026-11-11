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
  // Morgenkarte (Version 173, Entscheidung 10.11.2026): beim ersten Öffnen am Tag, vor dem Tages-Check, eine ruhige Erinnerung
  // „woran du heute denken willst“ (Gegner-Bild, Ziel, Wenn-dann). Auswahl und Grenzen: PROBE.karte. Zeigt nichts, wenn kein
  // Held passt, wenn sie heute gesehen wurde oder in den Einstellungen aus ist.
  { id: 'morgenkarte', wann: 'vorCheck' },
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

// Rückgängig nach einer Antwort (Version 147, Klicktest am Handy 05.11.2026, Punkt 6): so lange steht „✓ Getroffen ·
// Rückgängig“ in der Daumenleiste (bzw. als Popup), mit ablaufender Leiste. Vorher 6 Sekunden; 3 reichen, weil man einen
// Fehltipp sofort merkt und „Ändern“ den ganzen Tag bleibt. ms: ganze Zahl 1000–15000, sonst 3000 (logik/startseite.js).
export const RUECKGAENGIG = { ms: 3000 };

// Fester Platz für Neuigkeiten (31.10.2026): höchstens `max` verschiedene am Tag, in dieser Reihenfolge (Vorrang).
// Was nicht mehr passt, wartet auf den nächsten Tag; ein erledigter Platz wird heute nicht neu besetzt.
// Erlaubte IDs: Karten in ansicht/startseite.js (NEU_KARTEN); unbekannte werden beim Start gemeldet und übersprungen.
// max: 0–5, sonst 2.
// Ziel-Quests (31.10.2026): 'zielstand' = Ziel erreicht (Feier mit Rückblick) oder Stichtag vorbei (ruhige Frage).
// Rundenrückblick (02.11.2026, Entscheidung 26 9a): 'rueckblick' = Runde vorbei, Brief des Helden (zählt ins Tageslimit).
// Nach der Freigabe: eine Freischaltung ist ein Belohnungsmoment des Tages; der Rückblick darf einen Tag warten (Zeitfenster 3 Tage).
// Version 165: `leise` = Karten, die nur bei freiem Platz erscheinen, nie einen Platz verdrängen und nie als „wartet bis morgen“
// zählen (z. B. „Wie diese App denkt“, einmalig). Sie stehen nicht in `vorrang`.
// Version 167: auch der Plan-Check ('plancheck', nach je 4 Rückblicken wieder, nie am Tag eines offenen Rückblicks) ist leise.
export const NEU_PLATZ = { max: 2, vorrang: ['einwilligung', 'zielstand', 'freigabe', 'rueckblick', 'abschluss', 'angebot', 'welten'], leise: ['denken', 'brief', 'plancheck', 'abschlussSpaeter', 'testerhinweis'] };

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
// streifen (Version 174, 10.11.2026) = eingeklappte Zeile des Streifens: 'kette' (Punkte je Gegner und „Kapitel n von m“, kein
//                Gegnerbild, kein Balken; die Arena darunter zeigt Gegner, Kraft und Kapitel schon) oder 'status' (wie bis Version 173: Gegnerbild, Balken, „noch n bis …“).
//                Ein einzelner Gegner hat keine Kette und zeigt immer 'status'. Unbekannter Wert → 'status'.
//                Grund: derselbe Gegner stand zweimal untereinander (Leiste und Arena), eingeklappt soll die Leiste kaum Platz brauchen.
// warumZeichen (Etappe 3, Teil A): Warum und Lebenszeile teilen sich eine Zeile. Ist das Warum länger, wird es auf
// eine Zeile gekürzt und lässt sich aufklappen (nur in der Sitzung gemerkt). 0 = immer ganz zeigen.
// Version 146: 60 statt 44 Zeichen (das eigene Warum soll meist ganz lesbar sein, Bewertung 05.11.2026 Punkt 10).
export const KOPFLEISTE = { weg: 'streifen', streifen: 'kette', warumZeichen: 60 };

// Heldenkopf: wie viele Mini-Porträts der Knopf „Helden wechseln“ höchstens stapelt.
export const HELDENKOPF = { stapelMax: 3 };

// Tagesleiste (Etappe 3, Teil B, 02.11.2026): ersetzt auf der Startseite den Heldenstapel oben rechts. „Heute 1 von 3“,
// daneben die Porträts mit Haken bei erledigt; ein Tipp wechselt den Helden. Die Karte behält den Stapel.
// an: false = wieder Stapel; abHelden: ab so vielen Helden sichtbar; max: höchstens so viele Taten am Tag.
// abrufMax (Version 177): so viele Helden ohne Tagesfrage (Rhythmus, Wache) stehen daneben, der Rest im Stapel.
// abrufMaxAllein (Version 179): so viele, wenn KEIN Held eine Tagesfrage hat (dann ist der Platz der Tagesgruppe frei).
// kappeZeichen (Version 179): Beschriftung unter dem Ring höchstens so lang, sonst die kurze Form („3 Momente“ → „3×“).
//   Gemessen am Handy bei 360 px (Ring 44 px, Schrift 10 px): bis rund 10 Zeichen bleibt es unter dem Ring.
// plus (Version 183): „+“ zum Dazuholen eines Helden am Ende der Leiste (Regel: logik/helden.js heldDazu); false = aus.
export const TAGESLEISTE = { an: true, abHelden: 2, max: 3, abrufMax: 2, abrufMaxAllein: 3, kappeZeichen: 10, plus: true };

// Blatt „Helden wechseln“ in Gruppen (Version 179, Punkt 9 vom 10.11.2026: eine ruhige Übersicht statt einer zweiten Startseite).
// reihe: Reihenfolge der Gruppen; eingeklappt: Gruppen, die zu Beginn zu sind; abGruppen: Überschriften erst ab so vielen
// nicht leeren Gruppen (eine einzige Gruppe mit Überschrift wäre Lärm). Keine Gesamtzahl, keine Sortierung nach „hängt hinterher“.
export const HELDENWAHL_GRUPPEN = Object.freeze({ reihe: Object.freeze(['heute', 'keinMuss', 'ruht']), eingeklappt: Object.freeze(['ruht']), abGruppen: 2 });

// Morgenprobe (Version 81) und Morgenkarte (Version 173, Entscheidung 10.11.2026, claude/entscheidung-morgenkarte.md).
// Seit Version 173 gibt es keine Zeile mehr auf der Heldentat und keine kurze Box: die Morgenkarte (Abschnitt `morgenkarte`)
// erinnert einmal am Morgen an das Wichtige; ihr Knopf „Alle Helden ansehen“ und ein leiser Link im „Rat für heute“ öffnen das
// Blatt der ausführlichen Probe (alle Helden, „Könnte heute kommen“, Muster-Hinweis, letzter Plan).
// Psychologie: Wenn-dann-Pläne wirken über die Situation (Gollwitzer). Das Durchspielen des eigenen Tuns hilft mehr als das
// Ausmalen des Ergebnisses (Pham & Taylor; Oettingen), darum zeigt die Karte den Plan, kein Wunschbild. Keine Haken, keine XP,
// keine Serie, kein Rot; ein ausgelassener Morgen kostet nichts.
// an        false = Morgenprobe ganz aus (Karte und Blatt)
// planTage  Pläne aus schweren Tagen, die höchstens so alt sind, erscheinen im Blatt (0–90, sonst 30)
// musterMin ab so vielen schweren Tagen am selben Wochentag erscheint der Muster-Hinweis (1–20, sonst 3)
// varianten, standard  Alt (Version 81): Wahl „kurz“ / „ausfuehrlich“. Wird weiter gelesen und gespeichert, aber nicht mehr
//           ausgewertet (nichts geht verloren, falls die Wahl je zurückkommt).
// karte     Morgenkarte:
//   varianten, standard  Wahl der Person in den Einstellungen (spiel.einstellungen.karte): 'an' | 'aus'
//   max       so viele Zeilen höchstens (1–8, sonst 4); der Held im Rampenlicht steht zuerst, dann nach der Reihenfolge der Regeln
//   regeln    je Heldenmodus (daten/heldenmodi.js): wer gezeigt wird. Ein Modus ohne Eintrag (Ruhe) wird nie gezeigt.
//             zaehlweisen  nur diese Zählweisen (daten/zaehlweisen.js); fehlt die Angabe = alle
//             plan         true = nur mit Wenn-dann-Plan
//             Grund Erhalt + Wache: eine Wache hat keine Tagesfrage und ist nie „offen“, morgens erinnert sonst nichts an sie
//             (Abschnitt 36). Täglich gezählte Helden erinnern Tages-Check und Plan in der Daumenleiste schon.
export const PROBE = {
  an: true, planTage: 30, varianten: ['kurz', 'ausfuehrlich'], standard: 'kurz', musterMin: 3,
  karte: {
    varianten: ['an', 'aus'], standard: 'an', max: 4,
    regeln: { fokus: { plan: false }, erhalt: { zaehlweisen: ['wache'], plan: true } }
  }
};

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
