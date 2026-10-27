// Textregister (Version 23): Bildschirmtexte als Daten statt fest im Code.
// Jeder Stil kann einzelne Texte überschreiben: stile.js → <stil>.texte = { 'schluessel': '…' }.
// Platzhalter {name} werden beim Anzeigen gefüllt; GROSS geschriebene Platzhalter ({STADT}) kommen bereits groß.
// Stil-Wörter (wort.stadt, wort.bezirk, wort.kapitel …) stehen weiter in stile.js; fehlt eines, gilt Fantasy.
// Umgestellt sind die Texte der Versionen 14–22 (Bosskette, Stadt, Weg, Entwicklung, Botschaft, Andeutungen);
// ältere Texte in app.js folgen schrittweise.

export const TEXTE = {
  // Untere Leiste
  'tab.start': 'Start',
  'tab.gesperrt': 'Dieser Bereich öffnet sich später.',
  'tab.stadtGesperrt': 'Deine {stadt} öffnet sich nach dem ersten Sieg.',
  'tab.stufeGesperrt': '{bereich} öffnet sich, sobald ein Held {stufe} {nr} erreicht.',
  'tab.logbuch': 'Logbuch',
  'tab.karte': 'Karte',
  'tab.gruppe': 'Gruppe',
  'bald.titel': '{bereich} ist freigeschaltet',
  'bald.text': 'Dieser Bereich wird gerade gebaut und kommt mit einem der nächsten Updates.',

  // Stadt
  'stadt.eyebrow': 'DEINE {STADT}',
  'stadt.titel': '{stadtname} entsteht',
  'stadt.intro': 'Jeder Lebensbereich wird ein {bezirk}. Mit deinen Helden wachsen sie.',
  'stadt.fuss': 'Bald baut jeder Held seinen {bezirk} aus.',
  'bezirk.entsteht': '{helden} · entsteht',
  'bezirk.unentdeckt': 'unentdeckt',

  // Weg der Bosskette und Gegner
  'weg.stand': '{treffer} von {anzahl}',
  'weg.rest': 'noch {rest} bis {gegner}',
  'weg.kapitel': '{kapitel} {nr}',
  'weg.morgen': 'Neues {kapitel} · der Kampf gegen {gegner} beginnt morgen',
  'weg.aria': '{held} auf dem Weg: {text}',
  'gegner.abMorgen': 'ab morgen',
  'gegner.rundeMorgen': 'Der Kampf beginnt morgen und läuft bis {bis}.',
  'gegner.rundeLaeuft': 'Diese Runde läuft bis {bis}.',
  'teaser.kapitel': '{KAPITEL} {nr}',
  'teaser.name': '???',
  'teaser.wartet': 'Wartet, sobald {gegner} {sieg} ist.',

  // Sieg, Laufmoment, neuer Gegner
  'sieg.weiterNeu': 'Doch der Nächste wartet schon.',
  'sieg.weiterGleich': 'Ab morgen beginnt eine neue Runde, dann kommt {er} zurück und du zeigst es wieder.',
  'lauf.titel': '{held} macht sich auf den Weg',
  'lauf.text': 'Hinter dir liegt {gegner}. Vor dir wartet etwas Neues.',
  'neuerGegner.chip': '{KAPITEL} {nr} · NEUER {GEGNER}',
  'neuerGegner.ziel': 'Deine {faehigkeit} bleibt „{name}“. Ziel: {anzahl}× in 7 Tagen, ab morgen.',
  'neuerGegner.knopf': 'Kampf aufnehmen',

  // Entwicklung
  'leben.anwendungen': '{n}-mal {verb}',
  'leben.seit': 'seit {datum}',
  'leben.siege': '{n}× {sieg}',
  'entw.titel': 'ENTWICKLUNG',
  'entw.anwendungen': '-mal {verb}',
  'entw.siege': '× {sieg}',
  'entw.kapitel': '{kapitel}',
  'entw.tag': 'Tag dabei',
  'entw.tage': 'Tage dabei',
  'entw.runde': 'W{nr}',
  'entw.legende': 'Anwendungen je Woche ab deinem Start (Ziel {anzahl}×), grün = {gegner} {sieg}.',
  'entw.naechsterTitel': 'Nächster Titel: {titel} ab {stufe} {nr}.',

  // Crew-Botschaft und Story-Andeutung
  'botschaft.klein': '{held} hat dir heute etwas gesagt',
  'botschaft.ok': 'OK',
  'story.morgenTeil': 'Morgen: Teil {nr} · {titel}',
  'story.morgenNeu': 'Morgen: neue Geschichte „{titel}“',
  'story.frei': 'Teil {frei} von {gesamt} frei',
  'story.weiter': 'nach dem Tages-Check geht es weiter',
  'story.fertig': 'Woche erzählt',

  // Einwilligung zur Datenübertragung (Version 28)
  'daten.eyebrow': 'TESTPHASE · DATENSCHUTZ',
  'daten.frage': 'Darf die App anonyme Nutzungsdaten übertragen, damit wir sie verbessern können?',
  'daten.kurz': 'Übertragen werden nur Zählungen (welche Bildschirme, wie oft, wie lange), deine Bewertungen und dein Feedback, unter einer zufälligen Tester-Nummer. Ziele und Questtexte bleiben auf deinem Gerät.',
  'daten.mehr': 'Mehr erfahren',
  'daten.lang': 'Zweck: Auswertung dieses Prototyps während der Testphase. Speicherort: die Datenbank dieser Seite auf claude.ai oder, wenn du die App ohne Claude-Konto nutzt, ein Google-Formular mit verknüpfter Google-Tabelle (Google kann Daten auch außerhalb der EU verarbeiten). Gelöscht wird spätestens {monate} Monate nach Ende der Testphase. Du kannst die Zustimmung jederzeit in den Einstellungen zurücknehmen, ab dann wird nichts mehr übertragen. Für die Löschung schon übertragener Daten schick deine Tester-Nummer ({id}) an {kontakt}.',
  'daten.kontaktStandard': 'die Person, die dich eingeladen hat',
  'daten.ja': 'Einverstanden',
  'daten.nein': 'Nein, nur auf diesem Gerät',
  'daten.gewaehltJa': 'Übertragung erlaubt. Änderbar in den Einstellungen.',
  'daten.gewaehltNein': 'Keine Übertragung. Änderbar in den Einstellungen.',
  'daten.statusJa': 'Übertragung erlaubt seit {datum}. Namen oder Texte aus deiner Quest werden nicht übertragen.',
  'daten.statusNein': 'Keine Übertragung. Deine Nutzung wird nur in diesem Browser gezählt.',
  'daten.statusOffen': 'Noch nicht entschieden. Bis dahin wird nichts übertragen.',
  'daten.zuruecknehmen': 'Zustimmung zurücknehmen',
  'daten.erlauben': 'Übertragung erlauben',
  'daten.neu': 'Der Datenschutz-Hinweis hat sich geändert. Bitte entscheide neu.',

  // Daten senden ohne Konto (Version 24)
  'export.text': 'Ohne Konto kommen deine Daten nicht automatisch an. Tippe auf „Daten senden“ und schick den Code an die Person, die dich eingeladen hat.',
  'export.knopf': 'Daten senden',
  'export.hinweis': 'Enthält nur anonyme Nutzungszahlen, Bewertungen und dein Feedback, keine Questtexte.',
  'export.kopieren': 'Kopieren',
  'export.teilen': 'Teilen',
  'export.kopiert': 'Kopiert. Jetzt in eine Nachricht einfügen.',
  'export.manuell': 'Kopieren hat nicht geklappt. Bitte den Code markieren und selbst kopieren.',
  'export.fehler': 'Der Code konnte nicht erstellt werden: {grund}',
  'import.titel': 'TESTER IMPORTIEREN',
  'import.text': 'Code von Testern ohne Konto hier einfügen.',
  'import.knopf': 'Importieren',
  'import.neu': 'Tester {id} importiert ({tage} Tage).',
  'import.ersetzt': 'Tester {id} aktualisiert ({tage} Tage im Code).',
  'import.gespeichert': 'In der Datenbank gespeichert.',
  'import.lokal': 'Nur in dieser Ansicht: Ohne Datenbank geht der Import beim Neuladen verloren.',
  'import.dbFehler': 'Anzeige ok, aber Speichern in der Datenbank fehlgeschlagen: {grund}',
  'import.ohneDb': 'Hier gibt es keine Seiten-Datenbank. Lade unten die CSV deiner Google-Tabelle (Datei → Herunterladen → CSV) oder füge einen Daten-Code ein.',
  'import.csv': 'Oder Google-Tabelle als CSV laden',
  'import.csvOk': '{tester} Tester aus {zeilen} Zeilen übernommen ({fehler} unlesbar).',
  'import.csvGross': 'Die Datei ist größer als 20 MB.',
  'import.csvFehler': 'CSV nicht übernommen: {grund}'
};
