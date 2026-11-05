// Blatt „Anzeige“ (Version 125, Etappe 4 „Spielgefühl“): wie die App auf DIESEM Gerät aussieht.
// Gilt nur für dieses Gerät (Browser-Einstellung „anzeige“, nicht im Spielstand): am Handy will man oft „Bilder aus“
// wegen Datenvolumen und Ladezeit, am PC nicht. Stil und Spielstand bleiben unverändert.
// Psychologie: Wer Reize selbst dosiert (Autonomie), bleibt länger dabei. „Ruhig“, „Schlicht“ und „Aus“ sind
// gleichwertige Fassungen, keine schlechtere Version des Spiels: kein Hinweis „du verpasst etwas“.
//
// Je Option:
//   werte     erlaubte Werte in der Reihenfolge der Knöpfe (Text: 'anzeige.<schluessel>.<wert>' in texte.js)
//   standard  gilt, wenn nichts gespeichert ist oder der gespeicherte Wert unbekannt ist
//   system    optional: Wert, wenn das Betriebssystem „Bewegung reduzieren“ verlangt und nichts gespeichert ist
//   attribut  data-<attribut> am <html>-Element (CSS reagiert darauf; Standardwert setzt KEIN Attribut)
//   skala     optional: Wert → Zahl für die CSS-Variable --text-skala (nur Textgröße)
// Neue Option = Eintrag hier + Texte + CSS-Regel auf :root[data-<attribut>="…"]; das Blatt zeichnet sich daraus.
export const ANZEIGE = {
  einstellung: 'anzeige', // Name der Browser-Einstellung (speicher.einstellung)
  optionen: {
    // Große Bilder (Arena, Banner, Szenen, Kartenhintergrund) werden zur stilfarbenen Fläche mit Symbol;
    // runde Heldenporträts bleiben (Identifikation mit dem Helden; die Ladezeit steckt in den großen Bildern).
    bilder: { werte: ['an', 'aus'], standard: 'an', attribut: 'bilder' },
    // Prunk-Rahmen (Version 117): Zierkanten, Stufe als Stein, Goldlinien. Schlicht = ohne Zierde, gleiche Größen.
    prunk: { werte: ['an', 'schlicht'], standard: 'an', attribut: 'prunk' },
    // Voll = wie bisher. Ruhig = Rückmeldungen auf Handlungen bleiben (Haken, Balken, Treffer), ohne Auftritt und ohne
    // dauernde Atmosphäre (Zoom, Fackel, Funken, Nebel). Aus = keine Bewegung (wie „Bewegung reduzieren“ im System).
    bewegung: { werte: ['voll', 'ruhig', 'aus'], standard: 'voll', system: 'aus', attribut: 'bewegung' },
    textgroesse: { werte: ['normal', 'gross', 'sehrgross'], standard: 'normal', attribut: 'text', skala: { normal: 1, gross: 1.12, sehrgross: 1.25 } },
    // Tagesnotiz (04.11.2026): Beschriftung der Lebensbereiche bei Notiz und Logbuch-Filter. Gespeichert wird immer der
    // Lebensbereich; das ist nur die Anzeige. Beim Schreiben über den Tag wirkt „Gesundheit“ oft näher als ein Heldenname.
    bezug: { werte: ['helden', 'bereiche'], standard: 'helden', attribut: 'bezug' }
  }
};
