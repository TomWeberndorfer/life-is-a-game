// Rundenrückblick (Etappe 2, Schritt D, 02.11.2026, Entscheidungen Abschnitt 26). Logik: logik/rueckblick.js,
// Ansicht: ansicht/rueckblick.js. Nach dem Ende einer Runde erscheint im Neuigkeiten-Platz eine Karte; sie öffnet eine
// ruhige Seite mit einem Brief des Helden je Held (Siegel der Runde), „Was hat geholfen?“ und „Zu leicht / Passt / Zu schwer“.
// Psychologie: Passende Herausforderung hält im Flow-Kanal (Csikszentmihalyi); die eigene Wahl stärkt Autonomie; kurze
// Reflexion festigt, was wirkt. Nach einer schweren Runde ist „Zu schwer“ ausdrücklich eine gute Wahl (Schutz vor
// „jetzt ist eh alles egal“). Alles freiwillig: „Diesmal überspringen“ gilt als besprochen und ändert nichts.
//
//   fensterTage   Runden, die vor mehr als so vielen Tagen endeten, kommen nicht mehr (kein Stau nach langer Pause;
//                 Altbestand: beim Update erscheinen höchstens Runden der letzten Tage)
//   schwelle      Anteil des Rundenziels, ab dem eine Runde ohne Sieg „gemischt“ statt „schwer“ heißt (0.5 = Hälfte)
//   anlaesse      Botschaften-Anlass je Ergebnis (Texte in claude/inhalte.md, Abschnitt „# Botschaften“)
//   wahlen        Einschätzung der Schwierigkeit; Text unter 'rb.wahl.<id>'
//   schritt       um so viel ändert „Zu leicht“ / „Zu schwer“ das eigene Ziel (Vorschlag, gilt nach der Zähler-Regel)
//   notizArten    Eintragsarten, deren Text als antippbarer Chip unter „Was hat geholfen?“ erscheint
//   notizenMax    höchstens so viele Chips (die neuesten); verweiseMax = so viele dürfen gewählt sein
//   chipZeichen   Länge des Chip-Texts (danach „…“)
//   ruhigeFrage   ab so vielen Tagen „Keine Versuchung“ in der Runde fragt der Brief leise nach (Version 146; 0 = aus)
//   ruhigNach     Eintragsarten, nach denen die alte Runde nicht mehr besprochen wird (Willkommen zurück war schon da)
export const RUECKBLICK = Object.freeze({
  fensterTage: 3,
  schwelle: 0.5,
  anlaesse: Object.freeze({ stark: 'rueckblick_stark', gemischt: 'rueckblick_gemischt', schwer: 'rueckblick_schwer' }),
  wahlen: Object.freeze(['leicht', 'passt', 'schwer']),
  schritt: 1,
  notizArten: Object.freeze(['geschafft', 'schwer']),
  notizenMax: 6,
  verweiseMax: 6,
  chipZeichen: 40,
  ruhigeFrage: 4,
  ruhigNach: Object.freeze(['neustart', 'wiederda'])
});

// Siegel je Tag der Runde: die erste zutreffende Regel gewinnt. Aussehen aus daten/chronik.js (CHRONIK_SIEGEL),
// damit Brief und Chronik dieselben Zeichen zeigen. 'leer' = Tag ohne Antwort (kein Vorwurf, nur ein offener Kreis).
export const RUECKBLICK_SIEGEL = Object.freeze(['treffer', 'ruhig', 'ruhetag', 'schwer']);
