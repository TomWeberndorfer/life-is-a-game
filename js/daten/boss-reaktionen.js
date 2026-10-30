// Boss-Reaktionen (Version 68, Vorschau 30.10.2026): eine Zeile in der Duell-Karte, nachdem der Tages-Check beantwortet ist.
// Der Gegner reagiert auf die Antwort, damit der Kampf zwischen Kapitelstart und Sieg spürbar bleibt.
// Arten (logik/boss-reaktion.js):
//   treffer  nach „Ja, geschafft“: der Gegner verliert sichtbar Kraft
//   ruhe     nach „Heute nicht gebraucht“: kein Kampf heute, der Gegner lauert (bewusst KEIN Rückschlag, keine Strafe)
//   phase    einmal je Gegner und Runde: der Treffer, der die Kraft auf die Schwelle drückt (EINSTELLUNG.phaseAb)
//   morgen   am Siegtag, wenn ein neuer Gegner folgt: Andeutung, Schlüssel = der BESIEGTE Gegner. Ohne {gegner}, {er} …
//            (die wären schon der Neue); der Kapitelwechsel selbst kommt beim nächsten Öffnen (Version 68)
// Schlüssel = Gegner-ID aus vorlagen.js; „_allgemein“ gilt für jeden Gegner ohne eigene Zeilen (Pflicht).
// Rückfall: Gegner.art → _allgemein.art; für „phase“ danach treffer. Fehlt alles, erscheint keine Zeile.
// Platzhalter wie bei den Geschichten: {Gegner} {gegner} {Er} {er} {ihn} {verbuendeter} {faehigkeit} {rest} {anzahl}.
// Seit Version 69 stehen die TEXTE in claude/inhalte.md (Abschnitt „# Bossreaktionen“) und kommen mit „Geschichten übernehmen“
// nach inhalte-text.js. Hier bleiben Bedeutung und Einstellungen; alle Module importieren weiter aus dieser Datei.

export const BOSS_REAKTION_EINSTELLUNG = {
  // Phasenwechsel, wenn die Restkraft auf diesen Anteil der Rundenkraft fällt (abgerundet, mindestens 1 Punkt).
  // 0.5 bei 3 Treffern je Runde: nach dem 2. Treffer. Bei 1 Treffer je Runde gibt es keine Phase (gleich Sieg).
  phaseAb: 0.5
};

export { BOSS_REAKTIONEN } from './inhalte-text.js';
