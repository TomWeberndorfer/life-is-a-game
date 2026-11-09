// Symbol-Verzeichnis (seit Version 84, vorher ICON in ansicht/helfer.js): Pfade für ein 24er-Raster, Strich in currentColor,
// damit jede Stilfarbe greift. Neues Symbol = neue Zeile. Unbekannter Name → Stern (kein Absturz; Warnung beim Start,
// wenn stile.js auf ein fehlendes Symbol zeigt, logik/symbole.js pruefeSymbole).
// Welcher Stil welches Symbol wofür nimmt, steht in daten/stile.js (`symbole`), nie hier.
export const SYMBOLE = {
  siegel: '<circle cx="12" cy="11" r="6"/><path d="M12 8v6M9 11h6"/><path d="M8 16l-2 5 3-1 1 3 2-4M16 16l2 5-3-1-1 3-2-4"/>',
  herz: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  menschen: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>',
  ziel: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  muenzen: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  welle: '<path d="M3 10c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/><path d="M3 15c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/>',
  sonne: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  teller: '<ellipse cx="12" cy="15" rx="9" ry="3.5"/><ellipse cx="12" cy="14.4" rx="5" ry="1.6"/><circle cx="10" cy="11" r="1.6"/><circle cx="13.6" cy="10.4" r="1.4"/>',
  schuh: '<path d="M3 16h18v3H3zM4 16l1-7h5l2 4 7 1.5V16"/>',
  brief: '<rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3.5 7l8.5 6.5L20.5 7"/>', // Rundenrückblick (Etappe 3)
  sanduhr: '<path d="M6 3h12M6 21h12"/><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>', // Tab „Bald“ (Etappe 3)
  mond: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  glas: '<path d="M7 4h10l-1 16H8zM7 9h10"/>',
  kalender: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  lupe: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', // Suche im Logbuch (Tagesnotiz, 04.11.2026)
  liste: '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
  zahnrad: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  zurueck: '<path d="M15 5l-7 7 7 7"/>',
  runter: '<path d="M6 9l6 6 6-6"/>',
  hoch: '<path d="M6 15l6-6 6 6"/>', // Schritt „Zähler“: Stützgewohnheit nach oben
  pfeilRechts: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  stift: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  stern: '<path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.6-.8z"/>',
  kompass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  buch: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  pfeil: '<path d="M4 18l6-6 4 4 6-8"/>',
  haus: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
  burg: '<path d="M4 20V9h3V6h3v3h4V6h3v3h3v11z"/><path d="M10 20v-5h4v5"/>',
  karte: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  schloss: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  // Version 84 (Startseite als Kampfbühne, Schritt Stil-Kulisse): Tab- und Siegel-Symbole je Stil (Zuordnung in stile.js `symbole`)
  zelt: '<path d="M3 20L12 4l9 16z"/><path d="M12 4v16M9 20l3-6 3 6"/>',
  rakete: '<path d="M12 3c3 2 4 6 4 10l-4 4-4-4c0-4 1-8 4-10z"/><circle cx="12" cy="10" r="1.5"/><path d="M8 13l-3 3v3l3-2M16 13l3 3v3l-3-2"/>',
  planet: '<circle cx="12" cy="12" r="5"/><path d="M3.5 16c2.5 2 14.5-1.5 17-7"/>',
  palme: '<path d="M12 21c0-5 0-9 1-12"/><path d="M13 9c-2-3-6-3-8-1M13 9c1-3 5-4 7-2M13 9c-3 0-5 2-5 5M13 9c3 0 5 2 5 5"/>',
  skyline: '<path d="M3 21V12h4V7h4v5h2V4h4v8h4v9z"/><path d="M3 21h18"/>',
  saeule: '<path d="M5 5h14M6 8h12M5 20h14M8 8v12M12 8v12M16 8v12M7 5l5-2 5 2"/>',
  amphore: '<path d="M9 3h6M10 3v3c-3 2-4 5-3 9 1 3 3 5 5 6 2-1 4-3 5-6 1-4 0-7-3-9V3"/><path d="M7.5 9c-2 0-3 2-1.5 3.5M16.5 9c2 0 3 2 1.5 3.5"/>',
  feuer: '<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-10 3 2 3 5 3 6 1-1 2-2 2-3 2 2 3 4 3 7 0 3-2 6-6 6z"/>',
  blume: '<circle cx="12" cy="8" r="2"/><path d="M12 6V3.5M12 10.5V21M10 8H7.5M14 8h2.5M12 16c-2-2-4-2-5-1M12 18c2-2 4-2 5-1"/>',
  pfote: '<circle cx="12" cy="16" r="4"/><circle cx="5.5" cy="10.5" r="2"/><circle cx="9.5" cy="6" r="2"/><circle cx="14.5" cy="6" r="2"/><circle cx="18.5" cy="10.5" r="2"/>',
  forum: '<path d="M3 9l9-5 9 5z"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 21h18M4 18h16"/>',
  schwert: '<path d="M19.5 4.5L9.5 14.5"/><path d="M19.5 4.5h-3.5M19.5 4.5V8"/><path d="M6.5 11.5l6 6"/><path d="M8.5 15.5l-4 4"/>',
  schild: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  blitz: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  kraftfeld: '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3.2 2.4"/><circle cx="12" cy="12" r="3.5"/>',
  faust: '<path d="M7 12V8a1.5 1.5 0 0 1 3 0v3M10 11V7a1.5 1.5 0 0 1 3 0v4M13 11V8a1.5 1.5 0 0 1 3 0v4M16 12v-2a1.5 1.5 0 0 1 3 0v4c0 4-2.5 7-6.5 7S7 19 7 16v-1.5A2 2 0 0 1 9 12.5h3"/>',
  sonnenbrille: '<path d="M2 9h20"/><path d="M3 9l1 5a3 3 0 0 0 3 2h1a3 3 0 0 0 3-2l.5-2h1l.5 2a3 3 0 0 0 3 2h1a3 3 0 0 0 3-2l1-5"/>',
  olive: '<path d="M4 20C9 15 13 10 20 4"/><ellipse cx="9" cy="12" rx="1.6" ry="3" transform="rotate(-50 9 12)"/><ellipse cx="13.5" cy="8.5" rx="1.6" ry="3" transform="rotate(40 13.5 8.5)"/><ellipse cx="15" cy="13" rx="1.6" ry="3" transform="rotate(-50 15 13)"/>',
  spross: '<path d="M12 21V11"/><path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
  tasse: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3c-1 1.5 1 2.5 0 4M12 3c-1 1.5 1 2.5 0 4"/>',
  netz: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/><circle cx="12" cy="12" r="4.5"/>',
  blatt: '<path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z"/><path d="M5 19L14 10"/>',
  scutum: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M12 3v18M6 12h12"/><circle cx="12" cy="12" r="2"/>',
  // Version 89: Nachtragen (Kalender mit Pfeil zurück), ruhig und neutral, kein Warnzeichen
  kalenderZurueck: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M15 15h-6M11.5 12.5L9 15l2.5 2.5"/>',
  // Version 139: Rettungsring für den Schnellweg „Gerade schwer“ (ruhig, kein Warnzeichen)
  // Version 153: Notizbuch für die Tagesnotiz (vorher der Stift, den auch „Quest bearbeiten“ trägt: zwei Bedeutungen, ein Zeichen)
  notizbuch: '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 3v18M11.5 8h4M11.5 12h4"/>',
  rettungsring: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M6.3 6.3l3.2 3.2M14.5 14.5l3.2 3.2M17.7 6.3l-3.2 3.2M9.5 14.5l-3.2 3.2"/>'
};

// Nebenaktionen unter der Heldentat (Version 89, Entscheidung 31.10.2026: ein gemeinsames Symbol für alle Stile).
// Schlüssel → Standardsymbol. Ein Stil kann einen Schlüssel in stile.js `symbole` überschreiben (wie Tabs und Siegel);
// heute tut das keiner. Aufruf in den Ansichten: icon(symbol('aktion.<art>', AKTION_SYMBOLE['aktion.<art>'])).
export const AKTION_SYMBOLE = Object.freeze({
  'aktion.geschafft': 'stift',          // „Etwas dazu festhalten“
  'aktion.schwer': 'welle',             // „Heute war es schwer“
  'aktion.nachtragen': 'kalenderZurueck', // „Anderen Tag eintragen“, „Gestern noch offen?“
  'aktion.notfall': 'herz',             // Notfallkarte
  'aktion.schnellweg': 'rettungsring',  // Knopf „Gerade schwer“ in der Kopfzeile (Version 139)
  'aktion.notiz': 'notizbuch'           // Tagesnotiz „Wie war dein Tag?“ (Version 153)
});
