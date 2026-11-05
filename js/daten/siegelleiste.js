// Siegelleiste und Erfolgssatz (Etappe 3, Teil D, 02.11.2026, Entscheidungen Abschnitt 27): Einstellungen.
// Logik: logik/siegelleiste.js (reine Ableitung aus den Antworten, nichts gespeichert, kein neues Spielstand-Feld).
// Ansicht: ansicht/buehne.js (Ruhezustand unter der Arena und im Lagerfeuer beim sprechenden Helden).
//
// Psychologie: Die Leiste zeigt die Tage der laufenden Runde als Siegel. Fortschritt wird sichtbar, ohne einen neuen
// Zähler einzuführen; offene Tage sind gestrichelt (noch möglich), nie leer-grau oder rot (kein „verpasst“). Ein schwerer
// Tag bekommt kein eigenes Zeichen: er zeigt das Zeichen seiner Antwort, damit er nicht als Makel heraussticht.
// Der Erfolgssatz spricht über dich („Du bist jemand, der …“): Identität stärkt Verhalten mehr als die Handlung allein
// (Selbstwahrnehmung). Er erscheint erst ab dem ersten Treffer der Runde, sonst klänge er hohl.
//
//   an           false = keine Leiste und kein Satz
//   orte         wo sie erscheinen: 'ruhe' (Ruhezustand der Bühne, unter der Arena), 'feuer' (Lagerfeuer, beim Sprecher)
//   aendernOrte  wo das heutige Siegel antippbar ist („Heute ändern“, Version 127). Nicht im Lagerfeuer: dort steht
//                „Ändern“ direkt darunter; zwei Wege zur selben Aktion auf engem Raum führen zu ungewolltem Zurücknehmen,
//                und das Lagerfeuer soll ein ruhiger Abschluss sein. Fehlt die Liste, ist das Siegel nirgends antippbar.
//   reihenfolge  Siegel-Regeln je Tag (wie logik/rueckblick.js rundenSiegel): die erste zutreffende bestimmt das Zeichen.
//                Ein Eintrag „schwer“ bewusst nicht (Entscheidung 2: leistenTage gibt keine Einträge mit). 'schwer' trifft hier nur
//                die Antwort „War schwer“ (Version 141): sie ist die Antwort des Tages und zeigt ihr eigenes, ruhiges Zeichen.
//                Tage ohne Regel sind offen (gestrichelt).
//   zeichen      Aussehen je Siegel: klasse (CSS), symbol (Stil-Symbol aus stile.js, Rückfall icon), text (Textschlüssel)
//   erfolg.an    false = nur die Leiste
//   erfolg.ab    Satz ab so vielen Treffern in der Runde (Entscheidung 4a: 1)
//   erfolg.halbAb  Anteil des Rundenziels, ab dem die Stufe „halb“ gilt (0–1)
//   erfolg.anlaesse  Stufe → Botschaften-Anlass in claude/inhalte.md („# Botschaften“); der Satz wechselt je Tag und Held.
//                Fehlt ein Anlass, erscheint kein Satz (die Leiste bleibt).
export const SIEGELLEISTE = Object.freeze({
  an: true,
  orte: Object.freeze(['ruhe', 'feuer']),
  aendernOrte: Object.freeze(['ruhe']),
  reihenfolge: Object.freeze(['treffer', 'ruhig', 'schwer', 'ruhetag']),
  zeichen: Object.freeze({
    treffer: Object.freeze({ klasse: 'wachs', symbol: 'siegel.treffer', icon: 'schwert', text: 'siegel.treffer' }),
    ruhig: Object.freeze({ klasse: 'blatt', icon: 'blatt', text: 'siegel.ruhe' }),
    schwer: Object.freeze({ klasse: 'welle', symbol: 'siegel.schwer', icon: 'welle', text: 'siegel.schwer' }),
    ruhetag: Object.freeze({ klasse: 'mond', icon: 'mond', text: 'lb.ruhetag' })
  }),
  erfolg: Object.freeze({
    an: true,
    ab: 1,
    halbAb: 0.5,
    anlaesse: Object.freeze({ erster: 'erfolg_erster', halb: 'erfolg_halb', fast: 'erfolg_fast', sieg: 'erfolg_sieg' })
  })
});
