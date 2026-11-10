// Welten-Intro (Version 175, Entscheidung 10.11.2026): einmaliger Einstieg in die gewählte Welt, nach „Weiter“ auf der ersten
// Onboarding-Seite (dort steht die Stilfrage). Oberfläche: ansicht/intro.js, Regeln und Prüfung: logik/intro.js.
// Psychologie: Ein kurzes, überspringbares Ankommen in „meiner“ Welt stärkt die Identifikation (Autonomie: ein Tipp beendet es)
// und setzt den ersten Ton ohne Druck: keine Aufgabe, kein Zähler, keine Wiederholung. Wirkt es nicht, kostet es nur 3 Sekunden.
//
// INTRO_EFFEKTE  Register der Effekte: je Effekt die Farbplätze (`farben`) mit dem Standard-Token (Name einer CSS-Variable des
//                Stils aus index.html, z. B. --nacht). Neuer Effekt = Eintrag hier + Funktion in ansicht/intro.js (gleicher Name).
// INTRO.stile    ein Eintrag je Stil, alles außer `effekt` optional:
//   effekt       Name aus INTRO_EFFEKTE; fehlt er oder ist er unbekannt → schlichte Aufblende (`fallback`)
//   dauerMs      Dauer des Effekts (minMs…maxMs, sonst Standard `dauerMs`)
//   farben       { <Farbplatz>: '--token' } überschreibt den Standard-Token; die Farben kommen immer aus den echten Stil-Tokens
//   satz         Einstiegssatz (Platzhalter, später in inhalte.md pflegen); leer = nur der Titel
//   titelAnim    'weich' | 'flackern' | 'stufen' (wie der Titel erscheint)
//   titelGroesse Schriftgröße des Titels in px (lange Pixelschrift braucht weniger)
// Stil ohne Eintrag, unbekannter Stil, „Bewegung reduzieren“, Anzeige „Ruhig“ → nur die kurze Aufblende (`reduziertMs`).
export const INTRO_EFFEKTE = Object.freeze({
  aufblende: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht' }) }),
  nebel: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht', nebel: '--nacht-ink' }) }),
  sternflug: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht', stern: '--nacht-ink', glow: '--ac' }) }),
  neonscan: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht', raster: '--ac', neon: '--ac', neon2: '--glanz' }) }),
  tor: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht', kante: '--glanz', licht: '--feuer-kern', staub: '--feuer-funke' }) }),
  sonnenaufgang: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht', sonne: '--glanz' }) }),
  gluehwuermchen: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht', glut: '--feuer-funke', lampe: '--feuer-glut' }) }),
  pixel: Object.freeze({ farben: Object.freeze({ abdeckung: '--nacht', abdeckung2: '--tief' }) })
});

export const INTRO = Object.freeze({
  titel: 'Life is a Game',
  fallback: 'aufblende',
  dauerMs: 2800,
  minMs: 800,
  maxMs: 4000,
  reduziertMs: 600,
  ausblendMs: 350, // Ebene blendet nach dem Effekt aus
  ueberspringenMs: 200, // Ausblenden nach einem Tipp
  stile: Object.freeze({
    fantasy: Object.freeze({ effekt: 'nebel', dauerMs: 3400, satz: 'Der Nebel lichtet sich. Dein Weg beginnt.', titelAnim: 'weich', titelGroesse: '32px' }),
    scifi: Object.freeze({ effekt: 'sternflug', dauerMs: 3000, satz: 'Systeme bereit. Dein Kurs steht.', titelAnim: 'weich', titelGroesse: '26px' }),
    strasse: Object.freeze({ effekt: 'neonscan', dauerMs: 2800, satz: 'Neon City erwacht. Du bist dran.', titelAnim: 'flackern', titelGroesse: '34px' }),
    rom: Object.freeze({ effekt: 'tor', dauerMs: 3400, satz: 'Das Tor ist offen. Tritt ein.', titelAnim: 'weich', titelGroesse: '32px' }),
    myth: Object.freeze({ effekt: 'sonnenaufgang', dauerMs: 3200, satz: 'Ein neuer Morgen. Dein Weg liegt offen.', titelAnim: 'weich', titelGroesse: '30px' }),
    cozy: Object.freeze({ effekt: 'gluehwuermchen', dauerMs: 3400, satz: 'Es ist warm hier. Fang klein an.', titelAnim: 'weich', titelGroesse: '32px' }),
    monster: Object.freeze({ effekt: 'pixel', dauerMs: 2800, satz: 'Level geladen. Los geht’s.', titelAnim: 'stufen', titelGroesse: '17px' })
  })
});
