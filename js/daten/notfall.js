// Notfallkarte und Ideenglas (Version 75). Logik: logik/ideen.js, Ansicht: ansicht/notfall.js.
// Die Notfallkarte ist für den Moment selbst: der Drang ist da, das alte Muster zieht. Sie bündelt, was der Spieler
// vorher schon festgelegt hat (Wenn-dann, Warum) und gibt eine Alternative zum Handeln (Idee aus dem Ideenglas).
// Psychologie: Eine kurze Pause unterbricht den Automatismus („Drang-Welle“: er steigt und fällt wieder). Der eigene
// Plan und der eigene Grund wirken stärker als fremde Ratschläge. Keine Wertung, kein Rot, kein „Rückfall“.
// Freischaltung: FUNKTIONEN.notfallkarte in daten/freischaltung.js (nach dem ersten schweren Tag).

// Notfallkarte mit Weiche (Version 127, entschieden 02.11.2026): Nach dem Atmen fragt die Karte „Was ist gerade da?“
// und wählt danach einen Pfad. Grund: Die alte Karte war auf einen Drang zugeschnitten (Urge Surfing). Wut braucht
// Beruhigen und Aufschub (wer im Ärger sofort antwortet, bereut es oft; nach rund 20 Minuten ist der Körper ruhiger).
// Ohnmacht braucht das Gegenteil: einen Mini-Schritt und erlebte Kontrolle (Selbstwirksamkeit), den Beweis „ich habe
// so etwas schon geschafft“ und einen Satz Selbstmitgefühl statt Selbstkritik. Kein Ventil („Dampf ablassen“): Ausagieren
// hält Wut eher wach. Das Benennen selbst beruhigt schon ein wenig (Affekt benennen).
//
//   zustaende   Auswahl im Schritt „zustand“ in dieser Reihenfolge; Text unter 'notfall.zustand.<id>'
//   merken      Zustände, die im Eintrag als Feld `zustand` landen ('weissnicht' nicht: das ist „unbekannt“)
//   pfade       Abschnitte je Zustand; ein Zustand ohne eigenen Pfad (oder mit leerer Liste) nimmt '_standard'.
//               Abschnitte ohne Inhalt (z. B. kein Warum gesetzt) fallen still weg, „ende“ kommt immer zuletzt.
//   gegnerIn    Pfade, in denen der Gegner klein und gedämpft erscheint („Das ist {gegner}, nicht du.“); sonst nie,
//               damit ein ohnmächtiger Moment nicht noch einen Gegner vor Augen hat
//   erinnerung  „Später antworten“ im Wut-Pfad: sanfter Hinweis beim nächsten Öffnen nach `nachMin` Minuten, einmal.
//               Gilt nur auf diesem Gerät (Einstellung `einstellung`), nichts im Spielstand. Nach `verfallStd` Stunden
//               ohne Öffnen verfällt er still (dann passt er nicht mehr).
//   frueher     „Du hast das schon geschafft“: zufällig einer der letzten `letzte` eigenen geschafft-Einträge mit Text,
//               bevorzugt mit gleichem Zustand
//   mitgefuehl  Botschaften-Anlass in claude/inhalte.md („# Botschaften“) für den Satz Selbstmitgefühl; fehlt er,
//               gilt 'notfall.mitgefuehl.ersatz'
export const NOTFALL = Object.freeze({
  zustaende: Object.freeze(['wut', 'ohnmacht', 'druck', 'drang', 'weissnicht']),
  merken: Object.freeze(['wut', 'ohnmacht', 'druck', 'drang']),
  pfade: Object.freeze({
    _standard: Object.freeze(['innehalten', 'zustand', 'wenndann', 'warum', 'idee']),
    wut: Object.freeze(['innehalten', 'zustand', 'aufschub', 'wichtig', 'warum']),
    ohnmacht: Object.freeze(['innehalten', 'zustand', 'einfluss', 'kleinster', 'frueher', 'mitgefuehl'])
  }),
  gegnerIn: Object.freeze(['wut']),
  erinnerung: Object.freeze({ nachMin: 20, verfallStd: 12, einstellung: 'notfall-erinnerung' }),
  frueher: Object.freeze({ letzte: 10 }),
  mitgefuehl: 'notfall_mitgefuehl'
});
// Alle Abschnitte, die ansicht/notfall.js zeichnen kann (Prüfung beim Start in app.js).
export const NOTFALL_BEKANNT = Object.freeze(['innehalten', 'zustand', 'wenndann', 'warum', 'idee', 'aufschub', 'wichtig', 'einfluss', 'kleinster', 'frueher', 'mitgefuehl']);
// Bisheriger Name (vor Version 127): der Standardpfad.
export const NOTFALL_ABSCHNITTE = NOTFALL.pfade._standard;

// Kategorien des Ideenglases; Text unter 'ideen.kat.<id>' in daten/texte.js.
export const IDEEN_KATEGORIEN = ['drinnen', 'draussen'];
export const IDEE_TEXT_MAX = 80;
export const IDEEN_JE_HELD = 40;

// Startideen je Fähigkeit (ID aus vorlagen.js), Rückfall „_allgemein“. Sie füllen das Glas, bis der Spieler es zum
// ersten Mal selbst ändert; danach gehört die Liste ihm (Startideen bleiben, bis er sie löscht).
// Je Idee: [kategorie, text].
export const STARTIDEEN = {
  _allgemein: [['drinnen', 'Ein Glas Wasser trinken'], ['draussen', 'Fünf Minuten an die frische Luft'], ['drinnen', 'Ein Lieblingslied hören'], ['drinnen', 'Jemandem kurz schreiben']],
  portionieren: [['drinnen', 'Eine kleine Portion auf einen Teller, die Packung wegräumen'], ['drinnen', 'Erst ein Glas Wasser, dann entscheiden'], ['draussen', 'Kurz um den Block gehen']],
  innehalten: [['drinnen', 'Ein Stück Obst oder eine Handvoll Nüsse'], ['drinnen', 'Einen Tee kochen und dabei warten'], ['draussen', 'Fünf Minuten an die frische Luft']],
  zweiMinuten: [['drinnen', 'Nur die Sportschuhe anziehen'], ['drinnen', 'Zwei Minuten dehnen'], ['draussen', 'Einmal um das Haus gehen']],
  bildschirmAus: [['drinnen', 'Ein Buch ans Bett legen'], ['drinnen', 'Das Handy in einem anderen Raum laden'], ['drinnen', 'Drei Dinge vom Tag aufschreiben']],
  ideenglas: [['draussen', 'Seifenblasen machen'], ['drinnen', 'Mit dem tiptoi-Stift ein Buch entdecken'], ['drinnen', 'An der Werkbank etwas bauen'], ['drinnen', 'Eine Höhle aus Decken bauen'], ['draussen', 'Schatzsuche im Garten']],
  ersterSchritt: [['drinnen', 'Fünf Minuten Wecker stellen und nur anfangen'], ['drinnen', 'Den allerersten Handgriff aufschreiben']],
  handyWeg: [['drinnen', 'Das Handy in eine Schublade legen'], ['drinnen', 'Einen Zettel für ablenkende Gedanken bereitlegen']],
  nachtRegel: [['drinnen', 'Den Artikel auf eine Merkliste setzen'], ['drinnen', 'Aufschreiben, wofür das Geld sonst gedacht ist']],
  kleineListe: [['drinnen', 'Drei kleine Dinge aufschreiben, eins davon tun'], ['draussen', 'Eine Runde spazieren gehen']],
  bisZehn: [['draussen', 'Kurz den Raum verlassen'], ['drinnen', 'Fenster öffnen und lang ausatmen'], ['drinnen', 'Die Schultern bewusst sinken lassen']],
  stoppLeise: [['drinnen', 'In die Hocke gehen, auf Augenhöhe'], ['drinnen', 'Leise flüstern statt rufen'], ['drinnen', 'Kurz ein Glas Wasser holen']],
  langAusatmen: [['drinnen', 'Viermal ein, sechsmal aus'], ['draussen', 'Ein paar Schritte gehen']],
  kurzAnhalten: [['drinnen', 'Eine Sache bewusst streichen'], ['drinnen', 'Die nächste einzige Aufgabe aufschreiben']],
  gedankenParken: [['drinnen', 'Den Gedanken auf einen Zettel schreiben'], ['drinnen', 'Eine Grübelzeit für später festlegen']],
  freundesSatz: [['drinnen', 'Aufschreiben, was eine Freundin jetzt sagen würde'], ['drinnen', 'Eine Sache nennen, die heute gelungen ist']],
  bedenkzeit: [['drinnen', 'Sagen: „Ich melde mich morgen dazu“'], ['drinnen', 'Kurz aufschreiben, was ich eigentlich will']]
};

// Alles zusammen für logik/ideen.js (dort als `opt` übergeben).
export const IDEEN_OPT = Object.freeze({ start: STARTIDEEN, kats: IDEEN_KATEGORIEN, max: IDEE_TEXT_MAX, maxJe: IDEEN_JE_HELD });
