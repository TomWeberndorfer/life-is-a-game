// Versand der Nutzungsdaten außerhalb von claude.ai (Version 25).
// Auf claude.ai gilt immer die Seiten-Datenbank; diese Einstellung greift nur, wenn sie fehlt (z. B. GitHub Pages).
// art: null = nur lokal (Daten-Code als Rückfall) · 'google-form' = Google-Formular → verknüpfte Google-Tabelle.
// Die entry-Nummern stammen aus dem vorausgefüllten Link des Formulars.

export const VERSAND = {
  art: 'google-form',
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSdKbaoNR7I4ZOSKc_4QSehj-KJQoun6jGmjZ3JNtQH2rO2-DQ/formResponse',
  felder: { testerId: 'entry.148195704', art: 'entry.499079050', tag: 'entry.419306794', stand: 'entry.1899238235', daten: 'entry.264575233' }, // aus dem vorausgefüllten Link (Reihenfolge der Fragen)
  abstandMs: 5 * 60 * 1000, // gebündelt senden: höchstens alle 5 Minuten (plus beim Verlassen der Seite)
  maxZeichen: 45000 // Google-Tabelle: höchstens 50.000 Zeichen je Zelle
};
