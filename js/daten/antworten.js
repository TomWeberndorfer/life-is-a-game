// Antworten des Tages-Checks (Version 141, 05.11.2026, Entscheidungen Abschnitt 18): EIN Register statt verstreuter
// Vergleiche mit 'ja' / 'nein'. Helfer: logik/antworten.js. Gespeichert wird nur die ID im Feld `tage` des Helden
// ({ 'YYYY-MM-DD': 'ja' | 'nein' | 'schwer' }); alles andere folgt aus diesem Register.
// Neue Antwort = neue Zeile hier + Texte in daten/texte.js (+ Wort und Symbol je Stil in stile.js, Schlüssel 'siegel.<siegel>').
//
// Je Antwort:
//   siegel        Art des Siegels (CSS-Klasse und Stil-Schlüssel 'siegel.<siegel>' für Wort und Symbol)
//   symbol        Standard-Symbol (daten/symbole.js), wenn der Stil keins nennt
//   zaehlbar      darf in einer Zielart unter `zaehlt` stehen (daten/zielarten.js). Nicht zählbar = nie Treffer, nie guter Tag
//   nurMitFrage   Siegel nur bei einer Zählweise mit Tagesfrage (Rhythmus und Wache fragen nicht täglich, daten/zaehlweisen.js)
//   logbuch       Logbuch-Art des Tages (daten/logbuch-arten.js)
//   erledigt      [Teil, Standardschlüssel] der Zeile nach der Antwort; Zielart oder Zählweise können den Teil überschreiben
//   nachtragStand Textschlüssel „Eingetragen: …“ im Nachtrag; nachtragKnopf = Beschriftung des Knopfs dort
//   anlassGestern Botschaften-Anlass am Tag danach (claude/inhalte.md, „# Botschaften“); ohne Text dort gilt „sonst“
//   bruecke       unterbricht die beste Folge nicht, verlängert sie aber auch nicht (Ruhetage, Pausen ebenso)
//   schwer        gilt für Comebacks als schwerer Tag (wie ein Eintrag „schwer“) und zählt für die Notfallkarte
//   eintrag       Eintragsart, deren Blatt sich direkt nach der Antwort öffnet (alles darin bleibt freiwillig)
//
// „War schwer“ (Version 141): ehrlich hingeschaut statt geschönt. Zählt neutral: kein Treffer, kein guter Tag, keine Lücke
// (Willkommen zurück zählt den Tag als Besuch). Psychologie: Wer einen schweren Tag benennen darf, ohne dass er als
// Versagen zählt, bleibt im Spiel (Selbstmitgefühl, Abstinenzverletzungs-Effekt). Darum ruhige Farbe, nie Rot, und der
// Gegner schweigt (logik/boss-reaktion.js: keine Reaktion außer bei „ja“ und „nein“). Wer doch standgehalten hat,
// wechselt im Eintrag mit einem Tipp zu „Getroffen“: der Tag, an dem es schwer war und man es trotzdem geschafft hat,
// ist der wertvollste Treffer und darf nicht neutral bleiben.
export const ANTWORT_ARTEN = Object.freeze({
  ja: Object.freeze({
    siegel: 'treffer', symbol: 'schwert', zaehlbar: true, nurMitFrage: false, logbuch: 'anwendung',
    erledigt: Object.freeze(['erledigtJa', 'tat.erledigtJa']), nachtragStand: 'nachtrag.standJa', nachtragKnopf: 'tat.ja', anlassGestern: 'gestern_ja'
  }),
  nein: Object.freeze({
    siegel: 'ruhe', symbol: 'schild', zaehlbar: true, nurMitFrage: true, logbuch: 'nicht',
    erledigt: Object.freeze(['erledigtNein', 'tat.erledigtNein']), nachtragStand: 'nachtrag.standNein', nachtragKnopf: 'nachtrag.nein', anlassGestern: 'gestern_nein'
  }),
  schwer: Object.freeze({
    siegel: 'schwer', symbol: 'welle', zaehlbar: false, nurMitFrage: true, logbuch: 'warSchwer',
    erledigt: Object.freeze(['erledigtSchwer', 'tat.erledigtSchwer']), nachtragStand: 'nachtrag.standSchwer', nachtragKnopf: 'nachtrag.schwer', anlassGestern: 'gestern_schwer',
    bruecke: true, schwer: true, eintrag: 'schwer'
  })
});

// Reihenfolge der Siegel und Knöpfe (links nach rechts) = Reihenfolge im Register.
export const ANTWORTEN = Object.freeze(Object.keys(ANTWORT_ARTEN));
