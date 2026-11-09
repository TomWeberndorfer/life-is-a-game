// Kettenende: Abschluss und Weitergehen (Version 169, 09.11.2026). Logik: logik/abschluss.js, Oberfläche: ansicht/abschluss.js,
// Texte: daten/texte.js (`abschluss.*`, `lb.abschluss*`). Vorher kam der letzte Gegner einfach endlos wieder (Entscheidung 09.11.2026).
// Ist die Kette eines Helden geschafft (Siege >= Länge der Kette), zeigt die App beim nächsten Öffnen eine ruhige Seite:
// ein kurzer Rückblick auf den eigenen Weg und dann „Wie geht es weiter?“.
//
// Psychologie (kurz): Ein Ziel, das nie endet, nimmt dem Erreichten sein Gewicht (kein Abschluss, kein Stolz) und lässt
// Gewohnheiten ohne Übergang auslaufen. Darum zuerst Würdigung und Rückschau aus dem eigenen Weg (Selbstwirksamkeit), dann eine
// eigene Wahl (Autonomie). Keine Option ist vorausgewählt, keine ist die „richtige“; „Später entscheiden“ kostet nichts und
// löst keine Erinnerung aus. Zahlen stehen nur im Rückblick, nie als Punktesumme oder Vergleich mit anderen.
//
// Gespeichert in spiel.abschluss = { heroId: { typ?, wahl?, bezug, ab } } (Spielebene, nicht am Helden):
//   typ    'endlich' | 'dauerhaft' – wie die Person das Ziel sieht, einmal je Held gefragt (beim ersten Abschluss)
//   wahl   'erhalt' | 'runde' | 'spaeter' – der gewählte Weg
//   bezug  woran die Entscheidung hängt (beim Auslöser „kettenende“: Länge der Kette beim Abschluss). Wächst die Kette später,
//          ist die Bedingung nicht mehr erfüllt; beim nächsten Ende ist der Bezug ein anderer und die Entscheidung wieder offen.
//   ab     Tag der Entscheidung
// Altbestand ohne Feld = {}: Helden, deren Kette schon geschafft ist, bekommen die Seite beim nächsten Start einmal angeboten.
//
//   typen          Reihenfolge der Antworten auf „Wie siehst du dieses Ziel?“ (keine Vorauswahl)
//   wege           Reihenfolge der Wege (Erhalt zuerst). „Neues Ziel“ steht bewusst nicht hier: es wird nicht als Entscheidung gespeichert (daten/kapitel.js, Version 171)
//   abschliessend  Wege, die die Entscheidung abschließen; „spaeter“ bleibt dauerhaft offen
//   wegModus       Weg → Heldenmodus (daten/heldenmodi.js); der Wechsel ignoriert die Fokus-Grenzen (ohneGrenzen)
//   ausloeser      Auslöser (Register AUSLOESER in logik/abschluss.js) – später können Teil- und Messziele eigene bekommen
//   ereignis       Name des Abschlussereignisses: Logbuch-Art und Analytics-Präfix
//   bezugMax       Sicherheitsnetz: größter gelesener Bezug (Länge der Kette)
export const ABSCHLUSS = Object.freeze({
  typen: Object.freeze(['endlich', 'dauerhaft']),
  wege: Object.freeze(['erhalt', 'runde', 'spaeter']),
  abschliessend: Object.freeze(['erhalt', 'runde']),
  wegModus: Object.freeze({ erhalt: 'erhalt' }),
  ausloeser: 'kettenende',
  ereignis: 'abschluss',
  bezugMax: 1000
});
