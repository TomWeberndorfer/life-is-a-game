// Seite „Wie diese App denkt“ (Version 164, 08.11.2026): fünf Zusagen und ein Mini-Glossar als Daten.
// Texte: daten/texte.js (`denken.*`), Oberfläche: ansicht/denken.js, Prüfung: logik/denken.js.
// Psychologie: Wer nicht weiß, was ein „Nein“ oder eine Pause auslöst, rechnet mit versteckten Strafen und antwortet
// geschönt oder bleibt weg. Offen gesagte Regeln nehmen diese Angst, und nur ehrliche Antworten zeigen, was wirklich trägt.
// Jede Zusage muss im Code wirklich stimmen: keine Versprechen, die eine Version später gebrochen werden.
//
// zusagen   Zusagen in der Reihenfolge der Seite; je id die Texte denken.zusage.<id>.titel und .text
// glossar   Begriffe in der Reihenfolge der Seite; je id denken.glossar.<id>.titel und .text
//           Begriffe, die der Stil umbenennt (Erhalt heißt je Welt anders), tragen `wort`: der Titel nimmt dann das
//           Stilwort (stile.js `wort.<schluessel>`), im Text steht {erhalt} o. Ä. als Platzhalter.
// merkmal   Geräte-Merkmal (analytics.js merke): gesetzt, sobald die Karte auf der Startseite beantwortet oder die Seite
//           einmal geöffnet wurde; danach erscheint die Karte nicht mehr. Die Seite selbst bleibt in den Einstellungen.
export const DENKEN = Object.freeze({
  zusagen: Object.freeze(['schwer', 'bleibt', 'ehrlich', 'texte', 'tempo']),
  glossar: Object.freeze([
    Object.freeze({ id: 'runde' }),
    Object.freeze({ id: 'gestalt' }),
    Object.freeze({ id: 'wache' }),
    Object.freeze({ id: 'erhalt', wort: 'modus_erhalt' })
  ]),
  merkmal: 'denken_gesehen'
});
