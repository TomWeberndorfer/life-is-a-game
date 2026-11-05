// Tagesnotiz (04.11.2026, Entscheidung „Notiz und Stimmung“): „Wie war dein Tag?“ mit Stimmung, „Was war gut?“ und
// „Was war schwer?“, für einen, mehrere oder keinen Lebensbereich (= ganzer Tag). Gespeichert als Eintrag der Art
// „notiz“ in spiel.eintraege (daten/eintrag-arten.js). Logik: logik/tagesnotiz.js, Ansicht: ansicht/notiz.js.
// Psychologie: Kurzes Schreiben über den Tag ordnet Erlebtes (expressives Schreiben), Gutes festhalten stärkt den Blick
// auf eigene Erfolge („Three Good Things“). Darum leicht und freiwillig: keine XP, keine Schreibserie, keine Mahnung.
// Die Karte auf der Startseite erscheint erst abends und verschwindet mit einem Tipp bis morgen, ohne Rückfrage.
//
// startseite.an        false = keine Karte auf der Startseite (Notiz bleibt im Logbuch erreichbar)
// startseite.abStunde  ab dieser Stunde (0–23, Ortszeit) erscheint die Karte, sonst 18
// startseite.weg       Name der Browser-Einstellung für „Heute nicht“ (gemerkt je Gerät: der Tag des Tipps)
// tage                 wählbare Tage für eine NEUE Notiz, in Tagen vor heute (0 = heute, 1 = gestern); Text
//                      'notiz.tag.<name>' mit name aus tagNamen. Eine bestehende Notiz behält ihren Tag.
export const TAGESNOTIZ = {
  startseite: { an: true, abStunde: 18, weg: 'notizWeg' },
  tage: [0, 1],
  tagNamen: { 0: 'heute', 1: 'gestern' }
};
