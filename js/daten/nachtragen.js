// Nachtragen (Version 79): vergessene Tage eintragen, wie im alten Prototyp („Eintragen für: Heute, Gestern, Vorgestern,
// vor 3 Tagen“). Logik: K.nachtragen() und K.nachtragTage() in logik/kern.js, Ansicht: Heldentat in ansicht/startseite.js.
// Psychologie: Vergessen ist kein Scheitern. Wer einen Tag nicht eintragen kann, hört eher ganz auf („jetzt ist eh alles
// egal“). Darum zählt ein nachgetragener Tag genau wie jeder andere, ohne Abzug und ohne „zu spät“.
// Entscheidung 30.10.2026: Tageswahl in der Heldentat ohne Dauer-Modus (nach der Antwort zurück auf heute), weil ein
// Schalter für die ganze Startseite leicht vergessen wird und der nächste Haken dann am falschen Tag landet.
//
// maxTage         so viele Tage zurück (gestern = 1), nie vor dem Questbeginn; höchstens K.NACHTRAG_MAX_GRENZE
// hinweisGestern  true = ist gestern offen, zeigt die Heldentat einmal je Tag den leisen Hinweis „Gestern noch offen?“.
//                 Bewusst nur gestern und ohne Liste verpasster Tage (eine solche Liste wirkte wie eine Schuldliste).
export const NACHTRAGEN = { maxTage: 3, hinweisGestern: true };
