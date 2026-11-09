// Kapitel-Archiv (Version 171, 09.11.2026): Ein Held kann ein neues Ziel beginnen, ohne dass das Erreichte an Wert verliert.
// Logik: logik/kapitel.js. Weg dorthin: Seite „Kettenende“ (ansicht/abschluss.js), Onboarding mit festem Helden (ui.kapitelFuer).
//
// Gespeichert in spiel.kapitel = { heroId: [ { quest, tage, siege, mikro, haken, von, ende } ] } (Spielebene, ältestes zuerst).
// Ein Kapitel ist die abgeschlossene Quest eines Helden samt seinen Tagen und Siegen. XP werden nicht eingefroren, sondern wie
// überall aus Tagen und Siegen abgeleitet (logik/kapitel.js xpFrueher); so bleiben Level und Siege des Helden erhalten und der
// Held wächst weiter. Psychologie: Ein neues Ziel soll sich wie ein nächstes Kapitel anfühlen, nicht wie Neustart bei null.
//
//   max          höchstens so viele Kapitel je Held bleiben gespeichert (die ältesten fallen zuerst weg; Sicherheitsnetz)
//   weg          Name des Weges auf der Abschluss-Seite (steht NICHT in ABSCHLUSS.wege: er wird nicht gespeichert)
export const KAPITEL = Object.freeze({
  max: 20,
  weg: 'neu'
});
