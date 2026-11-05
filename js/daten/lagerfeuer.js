// Lagerfeuer (Etappe 3, Teil C, 02.11.2026, Entscheidungen Abschnitt 27). Logik: logik/lagerfeuer.js,
// Ansicht: ansicht/buehne.js (lagerfeuerHtml). Sind alle Taten des Tages beantwortet, ersetzt das Lagerfeuer den
// Ruhezustand der Kampfbühne: Szene mit Glut, ein Satz des Helden, der zuletzt fertig wurde (der gewählte), und je Held
// eine Zeile mit Siegel und Antwort. Keine Zahlen, keine Bonus-Aufgaben.
// Psychologie: Ein sichtbares Ende des Tages schließt die offene Schleife (Ziel-Gradient) und wirkt gegen Endlos-Klicken.
// Der Satz spricht über dich, nicht über Punkte (Identität statt Belohnung). Name der Szene je Stil: stile.js 'feuer.titel'.
//
//   an              false = alter Ruhezustand („Für heute ist alles getan“, Weiter zu …)
//   anlass          Botschaften-Anlass mit den Sätzen (claude/inhalte.md, Abschnitt „# Botschaften“); der Satz wechselt
//                   je Tag, nicht je Held (ein Abend, ein Satz). Fehlt der Anlass, gilt 'feuer.ersatz' aus texte.js.
//   ruhetagZaehlt   true = ein Held mit Ruhetag heute gilt als fertig (auch in der Tagesleiste und für „Weiter zu …“)
//   abHelden        ab so vielen Helden erscheint der Name in der Zeile je Held (bei einem Helden nur Siegel und Antwort)
export const LAGERFEUER = Object.freeze({
  an: true,
  anlass: 'lagerfeuer_abend',
  ruhetagZaehlt: true,
  abHelden: 2
});
