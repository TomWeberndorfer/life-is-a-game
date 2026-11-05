// Sprungziele (Version 78): Links, die eine Stelle der App direkt öffnen, z. B. …/artifact/<id>#notfall.
// Logik: logik/sprung.js. Neues Ziel = neuer Eintrag hier + Öffner in app.js (SPRUNG_OEFFNER); den Rest prüft
// pruefeSprungziele() beim Start.
//
// Aufbau des Hash: Teile mit „+“ verbunden, Groß-/Kleinschreibung egal. Höchstens ein Profil und ein Ziel, z. B.
//   #notfall        Hauptprofil, Notfallkarte
//   #test+notfall   Testprofil, Notfallkarte
//   #test           Testprofil (wie bisher)
// Unbekannte Teile werden ignoriert (Warnung in der Konsole), die App startet normal.
// Nach dem Öffnen entfernt die App das Ziel aus der Adresse (das Profil bleibt), damit Neuladen nicht erneut springt.

// Profil-Teile. 'admin' = Auswertung: dort gibt es keine Spielansicht, ein Ziel wird ignoriert.
export const PROFILE = ['test', 'admin'];

// Je Ziel:
//   blatt        welcher Öffner in app.js zuständig ist (SPRUNG_OEFFNER)
//   funktion     Freischaltung aus daten/freischaltung.js (FUNKTIONEN), die normalerweise gilt (optional)
//   trotzSperre  true = der Link öffnet auch vor der Freischaltung. Begründung Notfallkarte (Entscheidung 30.10.2026):
//                Eine Hilfe für den akuten Moment darf nie hinter einer Hürde liegen; wer den Link tippt, hat den
//                Drang jetzt, ein „noch gesperrt“ wirkte wie eine Abweisung. Der Knopf in der App bleibt bis zur
//                Freischaltung verborgen (Progressive Disclosure), nur der bewusste Link öffnet früher.
//   titel, text  Textschlüssel der Karte in den Einstellungen („Link kopieren“); sichtbar, sobald `funktion` frei ist
export const SPRUNGZIELE = {
  notfall: { blatt: 'notfall', funktion: 'notfallkarte', trotzSperre: true, titel: 'einst.sprung.notfall.titel', text: 'einst.sprung.notfall.text' }
};

// Adresse für „Link kopieren“. In claude.ai läuft die App in einem eingebetteten Rahmen mit fremder Adresse; der Link
// muss aber auf die Artifact-Seite zeigen. Auf eigenen Adressen (GitHub Pages, lokal) gilt die Adresse der Seite selbst.
export const LINK_BASIS = {
  claude: 'https://claude.ai/artifact/FYaS4MdDmcRedE7TgrzoPH',
  eigeneAdresse: ['github.io', 'localhost', '127.0.0.1']
};
