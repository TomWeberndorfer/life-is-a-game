// Ruhetag (Version 90, Entscheidung 31.10.2026): ein bewusst ausgesetzter Tag, z. B. Geburtstag, Krankheit oder Reise.
// Er unterscheidet sich von „nicht gebraucht“ (der Gegner kam nicht) und vom schweren Tag (es kam zum Kampf).
// Wirkung: Die Runde verlängert sich um einen Tag; Treffer-Ziel und Gegnerkraft bleiben gleich, die folgenden Runden
// verschieben sich (wie beim Nachtragen). Keine XP, keine Strafe, kein Rot. Ein „Ja“ am Ruhetag zählt als Treffer und hebt
// den Ruhetag auf (das Kontingent ist dann wieder frei).
// Psychologie: Geplante Ausnahmen stützen die Zielbindung (Coelho do Vale u. a. 2016); ein knapper „Notfallpass“ hält länger
// bei der Stange als ein starres Ziel (Sharif & Shu 2017). Knapp, damit er nicht zur Ausrede wird; vorab geplant wirkt am
// besten, nachträglich ist trotzdem möglich (Krankheit kommt unangekündigt). Schützt vor „jetzt ist eh alles egal“.
// Gespeichert als Eintrag der Art „ruhetag“ in spiel.eintraege (daten/eintrag-arten.js). Logik: logik/ruhetag.js.
//
// an           false = kein Ruhetag in der App (Link und Blatt verschwinden, vorhandene wirken weiter)
// jeRunde      so viele Ruhetage je Runde und Held
// vorausTage   so weit im Voraus planbar (heute = 0)
// zurueckTage  so weit nachträglich (gestern = 1), wie beim Nachtragen; nie vor dem Questbeginn
// alleVorwahl  true = im Blatt sind alle Helden vorgewählt (abwählbar)
import { NACHTRAGEN } from './nachtragen.js';

export const RUHETAG = { an: true, jeRunde: 1, vorausTage: 7, zurueckTage: NACHTRAGEN.maxTage, alleVorwahl: true };
