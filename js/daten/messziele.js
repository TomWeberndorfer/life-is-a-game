// Messziele (Version 76): messbare Ziele je Held, z. B. Bauchumfang, Bizeps, Kontostand. Logik: logik/messziele.js,
// Ansicht: ansicht/messziele.js. Die Werte trägt der Spieler selbst ein; im Code stehen keine persönlichen Zahlen.
//
// Ein Messziel im Spielstand (spiel.messziele = { <heroId>: [ziel, …] }):
//   { id, name, einheit, richtung, ziel, start, bis, messungen, erreicht }
//   id         'm-<zeit36>-<zufall>'
//   name       z. B. „Bizeps rechts“ (bis MESSZIEL_OPT.nameMax Zeichen)
//   einheit    z. B. „cm“, „€“ (bis einheitMax Zeichen, darf leer sein)
//   richtung   'hoch' (Ziel ist ein Mindestwert, z. B. Bizeps ≥ 38) oder 'runter' (Höchstwert, z. B. Bauch ≤ 78)
//   ziel       Zahl
//   start      Zahl oder null. null = die erste Messung gilt als Start (Entscheidung 15, 30.10.2026)
//   bis        'YYYY-MM-DD' oder null (Stichtag, nur zur Orientierung, ohne Strafe)
//   messungen  [{ tag: 'YYYY-MM-DD', wert }], nach Tag sortiert, höchstens eine je Tag (eine zweite ersetzt die erste)
//   erreicht   'YYYY-MM-DD' des ersten Tages, an dem das Ziel erreicht war, oder null. Bleibt stehen, auch wenn
//              der Wert später wieder schwankt (es war geschafft).
//
// Psychologie (Entscheidungen 13–17, 30.10.2026): Maße kann man nicht direkt steuern, Verhalten schon. Darum gibt das
// Messen keine XP und zählt nie als Niederlage; die Anzeige bleibt neutral (Abstand statt „schlechter“, kein Rot).
// Empfohlen wird, höchstens wöchentlich zu messen (Schwankungen von Tag zu Tag entmutigen); gesperrt wird nichts.

export const MESSZIEL_RICHTUNGEN = ['hoch', 'runter'];

export const MESSZIEL_OPT = Object.freeze({
  nameMax: 40,
  einheitMax: 10,
  maxJe: 6,            // Messziele je Held
  maxMessungen: 400,   // je Messziel (wöchentlich gemessen reicht das für viele Jahre)
  wertMin: -1e9,
  wertMax: 1e9,
  nachkomma: 2,        // Werte werden auf so viele Nachkommastellen gerundet
  rhythmusTage: 7,     // ab so vielen Tagen seit der letzten Messung lädt die Startseite leise zum Messen ein
  bisMaxJahre: 30      // Stichtag höchstens so weit in der Zukunft
});

// Einheiten zum Antippen im Formular (eigene Einheit bleibt möglich).
export const EINHEIT_VORSCHLAEGE = ['cm', 'kg', '€', 'km', 'Min.'];

// Verlauf als kleines Liniendiagramm im Blatt: so viele Messungen höchstens (die neuesten).
export const VERLAUF = Object.freeze({ punkteMax: 26, breite: 300, hoehe: 110, rand: 14 });
