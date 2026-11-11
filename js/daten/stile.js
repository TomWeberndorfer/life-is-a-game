// Stil-Register. Feste IDs (nie ändern; wenn doch, alte ID unter `alt`).
// Ein Stil ändert nur Darstellung: Farben ([data-stil=<id>] in index.html), Wörter, Namen, Bilder.
// Stil-Tokens (Version 116): Farben, Schriften und Formen stehen als CSS-Variablen in index.html, Fantasy auf :root als Rückfall
//   für jeden Stil; ein Stil setzt nur, was bei ihm anders ist (z. B. --r-siegel, --glanz). Feste Farben in allgemeinen Regeln
//   verhindert app-tests/stil-tokens.test.js.
// Wörter: crew = alle Helden zusammen (ohne eigene XP), verbuendeter = ein einzelner Held an deiner Seite.
// Optional je Stil: texte: { 'schluessel': '…' } überschreibt Texte aus daten/texte.js (z. B. tab.logbuch = Name des Logbuchs je Stil, Version 56); bezirke: { health: '…' } benennt Bezirke.
// Fehlt ein Wort (z. B. kapitel) oder ein Bezirksname, gilt Fantasy bzw. der Name des Lebensbereichs.
// titel (optional, Version 80): Rangnamen je Stufe (Stufe 1 = erster Eintrag); fehlt die Liste, gelten die Titel aus kern.js.
// Wörter für Sätze mit Artikel: stadt weiblich („deine Stadt“), bezirk männlich („seinen Bezirk“).
// symbole (optional, Version 84): Symbol je Schlüssel aus daten/symbole.js, z. B. 'tab.start' (Tab-Leiste, je Bildschirm-ID
//   aus freischaltung.js) und 'siegel.treffer' / 'siegel.ruhe' / 'siegel.schwer' (Siegel der Kampfbühne, Version 141). Rückfall je Schlüssel: Fantasy, dann
//   das Standard-Symbol der Stelle (logik/symbole.js). Wörter dazu über `texte` ('tab.start', 'siegel.treffer' …).
//   Kulisse und Arena je Stil stehen als CSS in index.html (:root[data-stil=…], Variablen --k-* und --arena-*).
//   Auf welchen Seiten die Kulisse liegt, steht in KULISSE_SEITEN (unten); app.js setzt dort die Klasse „kulisse“.
// aura (optional, 05.11.2026): Effekt je Gegner bei seiner Vorstellung, { <gegner-id>: '<effekt>' } aus daten/aura.js; '' = bewusst keiner.
// gegnerNamen (optional, Version 164): eigener Name je Gegner im Stil, { <gegner-id>: 'Die Zuckermaschine' } oder { name, kurz?, genus? };
//   die ID bleibt, nur Name, Kurzname und Genus ändern sich (Regeln und Prüfung: logik/gegner-namen.js). Fehlt die Angabe, gilt der Name aus bosse.js.
// marke (optional, Version 61): kleine Marke über der Heldentat-Karte (Sci-Fi „MISSION // HEUTE“); fehlt sie, keine.
// stadt/bezirk/stadtname: Heldenstadt (nur Darstellung). Bezirksbilder: Bildplatz `bezirk-<domainId>`, sonst gezeichnete Silhouette.
// Regel: Kein Stil leiht Bilder eines anderen. Fehlt ein Bild, gilt die Rückfallkette (BILD_RUECKFALL, nur innerhalb
// desselben Stils), danach der Platzhalter des Stils.
// Archiviert (nur im alten Prototyp): midnight (Mitternachtsgold/Aufgabenplaner), modern, zombie.
// In der Weltenwahl als gesperrte Kachel nur noch: zombie (Version 53).

// Rückfallkette für Bildplätze (Version 62): fehlt einem Platz ein eigenes Bild, gilt der nächste Platz DESSELBEN Stils.
// Beispiel: bezirk-partner → banner-khara → khara → Platzhalter. Eigenes Bild (Tabelle oder Datei) hat immer Vorrang,
// ein neues Bild für einen Platz wirkt also sofort, ohne Code. Logik: logik/bilder.js. Neue Regel = neue Zeile.
// `ueber`: Zuordnung, die die App bereitstellt (bereichHeld = Lebensbereich → Standard-Held aus lebensbereiche.js).
export const BILD_RUECKFALL = [
  { von: 'banner-', nach: '' },
  { von: 'bezirk-', nach: 'banner-', ueber: 'bereichHeld' }
];

export const STIL_REIHENFOLGE = ['fantasy', 'scifi', 'myth', 'cozy', 'monster', 'strasse', 'rom'];

// Version 33: `waehlbar` je Stil steuert, ob die Welt gewählt werden kann. Gesperrte Welten werden
// in der Auswahl gezeigt, aber mit Schloss. Fehlt das Feld, gilt der Stil als gesperrt (sicherer Rückfall).
// Zum Freigeben einer Welt nur `waehlbar: true` setzen – kein Code ändern.

export const STILE = {
  fantasy: {
    name: 'Fantasy', alt: [], waehlbar: true,
    karte: 'bilder/fantasy/szene.jpg',
    wort: { modus_fokus: 'Fokus', modus_erhalt: 'Erhalt', modus_ruhe: 'Ruhe', crew: 'Gefährten', verbuendeter: 'Verbündeter', gegner: 'Gegner', quest: 'Hauptquest', woche: 'Quest der Woche', faehigkeit: 'Fähigkeit', stufe: 'Stufe', sieg: 'besiegt', stadt: 'Stadt', bezirk: 'Bezirk', stadtname: 'Talwacht', kapitel: 'Kapitel' },
    texte: { 'story.knopf': 'Zurück ins Lager', 'tab.logbuch': 'Chronik', 'tab.start': 'Lager', 'tab.gruppe': 'Gefährten' },
    symbole: { 'tab.start': 'zelt', 'tab.logbuch': 'buch', 'tab.karte': 'karte', 'tab.stadt': 'burg', 'tab.gruppe': 'menschen', 'siegel.treffer': 'schwert', 'siegel.ruhe': 'schild' },
    namen: {},
    bilder: {
      szene: 'bilder/fantasy/szene.jpg',
      'banner-trogadon': 'bilder/fantasy/banner-trogadon.jpg',
      trogadon: 'bilder/fantasy/trogadon.jpg', khara: 'bilder/fantasy/khara.jpg', fisker: 'bilder/fantasy/fisker.jpg',
      uldini: 'bilder/fantasy/uldini.jpg', goldwin: 'bilder/fantasy/goldwin.jpg', 'der-erste': 'bilder/fantasy/der-erste.jpg',
      ahren: 'bilder/fantasy/ahren.jpg',
      'boss-zuckerkobold': 'bilder/fantasy/boss-naschling.jpg',
      'boss-gaehnor': 'bilder/fantasy/boss-gaehnor.jpg',
      'boss-hetzra': 'bilder/fantasy/boss-hetzra.jpg',
      // Eigene Dateien je Platz; fehlende Banner/Bezirke nutzen die Rückfallkette (Version 62)
      'bezirk-health': 'bilder/fantasy/bezirk-health.jpg',
      'bezirk-mindset': 'bilder/fantasy/bezirk-mindset.jpg',
      'bezirk-family': 'bilder/fantasy/bezirk-family.jpg',
      'boss-heisshunger': 'bilder/fantasy/boss-heisshunger.jpg',
      'boss-kaufrausch': 'bilder/fantasy/boss-kaufrausch.jpg',
      'boss-trott': 'bilder/fantasy/boss-trott.jpg',
      'boss-nachtschwaermer': 'bilder/fantasy/boss-nachtschwaermer.jpg',
      'boss-einsiedler': 'bilder/fantasy/boss-einsiedler.jpg',
      // Ausbau der Stadt (Version 82): Stufe 1–6, siehe AUSBAU in daten/stadt.js
      'ausbau-1': 'bilder/fantasy/ausbau-1.jpg', 'ausbau-2': 'bilder/fantasy/ausbau-2.jpg', 'ausbau-3': 'bilder/fantasy/ausbau-3.jpg',
      'ausbau-4': 'bilder/fantasy/ausbau-4.jpg', 'ausbau-5': 'bilder/fantasy/ausbau-5.jpg', 'ausbau-6': 'bilder/fantasy/ausbau-6.jpg'
    },
    pos: { trogadon: '50% 22%', 'boss-zuckerkobold': '50% 30%' },
    aura: { irrlicht: 'flackern', nachtschwaermer: 'nebel' }, // Aura je Gegner (05.11.2026, daten/aura.js): einmal bei der Vorstellung
  },
  scifi: {
    name: 'Sci-Fi', alt: [], waehlbar: true,
    karte: 'bilder/scifi/szene.jpg',
    wort: { modus_fokus: 'Mission', modus_erhalt: 'Bereitschaft', modus_ruhe: 'Kryoschlaf', marke: 'MISSION // HEUTE', crew: 'Crew', verbuendeter: 'Copilot', gegner: 'Störsignal', quest: 'Hauptmission', woche: 'Mission der Woche', faehigkeit: 'Protokoll', stufe: 'Rang', sieg: 'neutralisiert', stadt: 'Station', bezirk: 'Sektor', stadtname: 'Station Aurora' },
    titel: ['Kadett', 'Fähnrich', 'Leutnant', 'Kommandant', 'Captain', 'Admiral'],
    texte: { 'feuer.titel': 'Bordruhe', 'story.knopf': 'Zurück auf die Brücke', 'tab.logbuch': 'Bordbuch', 'tab.start': 'Brücke', 'tab.gruppe': 'Crew', 'siegel.treffer': 'Neutralisiert', 'siegel.ruhe': 'Kein Einsatz nötig', 'siegel.schwer': 'Schwerer Einsatz', 'rat.titel': 'Lagebericht', 'ruhe.marke': 'EINSATZ BEENDET', 'ruhe.alle': 'Für heute ist alles erledigt. Bis morgen, Kommandant.',
      'rb.karte.eyebrow': 'EINGEHENDE NACHRICHT', 'rb.karte.einer': '{held} hat dir einen Rundenbericht gefunkt.', 'rb.karte.mehrere': 'Deine Crew hat dir Rundenberichte gefunkt.', 'rb.karte.lesen': 'Nachricht öffnen', 'rb.ueberspringen': 'Nicht abspielen', 'rb.geholfen': 'Was hat dir im Einsatz geholfen?', 'rb.schwierigkeit': 'Wie hart war dieser Gegner?' },
    symbole: { 'tab.start': 'rakete', 'tab.karte': 'kompass', 'tab.stadt': 'planet', 'siegel.treffer': 'blitz', 'siegel.ruhe': 'kraftfeld' },
    namen: { trogadon: 'Kommandant Trog-7', khara: 'Funkerin Kha-4', fisker: 'Scout Fisk-3', uldini: 'Administrator Uld-1', goldwin: 'Quartiermeister Gold-5', ahren: 'Offizier Ahr-2', jelninolan: 'Bordärztin Jel-9', 'der-erste': 'Pilot Prim-0' },
    bilder: {
      trogadon: 'bilder/scifi/trogadon.jpg', khara: 'bilder/scifi/khara.jpg', fisker: 'bilder/scifi/fisker.jpg',
      uldini: 'bilder/scifi/uldini.jpg', goldwin: 'bilder/scifi/goldwin.jpg', 'der-erste': 'bilder/scifi/der-erste.jpg',
      ahren: 'bilder/scifi/ahren.jpg',
      // Eigene Dateien je Platz; fehlende Banner/Bezirke nutzen die Rückfallkette (Version 62)
      'bezirk-mindset': 'bilder/scifi/bezirk-mindset.jpg',
      'bezirk-family': 'bilder/scifi/bezirk-family.jpg',
      'banner-trogadon': 'bilder/scifi/banner-trogadon.jpg',
      'banner-fisker': 'bilder/scifi/banner-fisker.jpg',
      'banner-uldini': 'bilder/scifi/banner-uldini.jpg',
      'szene': 'bilder/scifi/szene.jpg',
      'boss-kaufrausch': 'bilder/scifi/boss-kaufrausch.jpg',
      'ausbau-1': 'bilder/scifi/ausbau-1.jpg', 'ausbau-2': 'bilder/scifi/ausbau-2.jpg', 'ausbau-3': 'bilder/scifi/ausbau-3.jpg',
      'ausbau-4': 'bilder/scifi/ausbau-4.jpg', 'ausbau-5': 'bilder/scifi/ausbau-5.jpg', 'ausbau-6': 'bilder/scifi/ausbau-6.jpg'
    },
    pos: {},
    aura: { irrlicht: 'flackern', kaufrausch: 'funken' },
  },
  myth: {
    name: 'Mythologie', alt: [], waehlbar: false,
    karte: 'bilder/myth/szene.jpg',
    wort: { modus_fokus: 'Aufbruch', modus_erhalt: 'Wacht', modus_ruhe: 'Rast', crew: 'Bund', verbuendeter: 'Gefährte', gegner: 'Prüfung', quest: 'Heldenfahrt', woche: 'Prüfung der Woche', faehigkeit: 'Gabe', stufe: 'Rang', sieg: 'bestanden', stadt: 'Polis', bezirk: 'Viertel', stadtname: 'Neu-Ithaka' },
    titel: ['Sterblicher', 'Gefährte', 'Heros', 'Halbgott', 'Legende'],
    texte: { 'feuer.titel': 'Am Herdfeuer', 'story.knopf': 'Zurück ans Feuer', 'tab.logbuch': 'Saga', 'tab.start': 'Tempel', 'tab.gruppe': 'Bund', 'siegel.treffer': 'Bestanden', 'siegel.ruhe': 'Keine Prüfung heute', 'siegel.schwer': 'Schwere Prüfung', 'rat.titel': 'Rat des Orakels' },
    symbole: { 'tab.start': 'saeule', 'tab.karte': 'kompass', 'tab.stadt': 'amphore', 'tab.gruppe': 'feuer', 'siegel.treffer': 'blitz', 'siegel.ruhe': 'olive' },
    namen: { trogadon: 'Trogaides', khara: 'Charis', fisker: 'Fiskeus', uldini: 'Uldinos', goldwin: 'Ploutos', ahren: 'Ahrenos', jelninolan: 'Eleia', 'der-erste': 'Protos' },
    bilder: { szene: 'bilder/myth/szene.jpg' },
    pos: {},
    aura: { gedankenkarussell: 'nebel', sturmgeist: 'schatten' },
  },
  cozy: {
    name: 'Cozy', alt: [], waehlbar: false,
    karte: 'bilder/cozy/szene.jpg',
    wort: { modus_fokus: 'Blüte', modus_erhalt: 'Pflege', modus_ruhe: 'Brache', crew: 'Nachbarschaft', verbuendeter: 'Nachbar', gegner: 'Sturm', quest: 'Ernteziel', woche: 'Aufgabe der Woche', faehigkeit: 'Werkzeug', stufe: 'Stufe', sieg: 'vorübergezogen', stadt: 'Dorf', bezirk: 'Hof', stadtname: 'Sonnenhang' },
    titel: ['Neuling', 'Nachbar', 'Helfer', 'Dorfherz', 'Ehrenbürger'],
    texte: { 'feuer.titel': 'Feierabend', 'story.knopf': 'Zurück ins Dorf', 'tab.logbuch': 'Tagebuch', 'tab.start': 'Hof', 'tab.gruppe': 'Nachbarn', 'siegel.treffer': 'Geschafft', 'siegel.ruhe': 'Ruhiger Tag', 'siegel.schwer': 'Harter Tag', 'rat.titel': 'Tipp für heute' },
    symbole: { 'tab.start': 'haus', 'tab.stadt': 'blume', 'siegel.treffer': 'spross', 'siegel.ruhe': 'tasse' },
    namen: { trogadon: 'Trogi', khara: 'Kari', fisker: 'Fiski', uldini: 'Uldi', goldwin: 'Goldi', ahren: 'Ahri', jelninolan: 'Jelli', 'der-erste': 'Primo' },
    bilder: { szene: 'bilder/cozy/szene.jpg',
      // Eigene Dateien je Platz; fehlende Banner/Bezirke nutzen die Rückfallkette (Version 62)
      'bezirk-mindset': 'bilder/cozy/bezirk-mindset.jpg',
      'bezirk-family': 'bilder/cozy/bezirk-family.jpg',
      'bezirk-friends': 'bilder/cozy/bezirk-friends.jpg',
      'banner-trogadon': 'bilder/cozy/banner-trogadon.jpg',
      'banner-khara': 'bilder/cozy/banner-khara.jpg',
      'banner-fisker': 'bilder/cozy/banner-fisker.jpg',
      'banner-uldini': 'bilder/cozy/banner-uldini.jpg',
      'banner-goldwin': 'bilder/cozy/banner-goldwin.jpg',
      'banner-der-erste': 'bilder/cozy/banner-der-erste.jpg',
      'banner-ahren': 'bilder/cozy/banner-ahren.jpg'
    },
    pos: {},
    aura: { sturmgeist: 'nebel', heisshunger: 'glut' },
  },
  monster: {
    name: 'Monsterjäger', alt: [], waehlbar: false,
    karte: 'bilder/monster/szene.jpg',
    wort: { crew: 'Team', verbuendeter: 'Partner', gegner: 'Monster', quest: 'Hauptauftrag', woche: 'Auftrag der Woche', faehigkeit: 'Attacke', stufe: 'Level', sieg: 'gefangen', stadt: 'Basis', bezirk: 'Zone', stadtname: 'Basislager' },
    titel: ['Anfänger', 'Fährtenleser', 'Jäger', 'Meisterjäger', 'Legende'],
    texte: { 'feuer.titel': 'Im Basislager', 'story.knopf': 'Zurück zur Basis', 'tab.logbuch': 'Jagdbuch', 'tab.start': 'Lager', 'tab.gruppe': 'Team', 'siegel.treffer': 'Gefangen', 'siegel.ruhe': 'Keine Spur heute', 'siegel.schwer': 'Schwere Jagd', 'rat.titel': 'Tipp für heute' },
    symbole: { 'tab.start': 'zelt', 'tab.stadt': 'pfote', 'siegel.treffer': 'netz', 'siegel.ruhe': 'blatt' },
    namen: {},
    bilder: {
      szene: 'bilder/monster/szene.jpg',
      khara: 'bilder/monster/khara.png', fisker: 'bilder/monster/fisker.png', uldini: 'bilder/monster/uldini.png',
      'der-erste': 'bilder/monster/der-erste.png', ahren: 'bilder/monster/ahren.png'
      // Banner und Bezirke nutzen die Rückfallkette (Version 62)
    },
    pos: {},
    aura: { irrlicht: 'funken', heisshunger: 'glut' },
  },
  strasse: {
    name: 'Miami Nights', alt: [], waehlbar: true,
    karte: 'bilder/strasse/szene.jpg',
    wort: { crew: 'Crew', verbuendeter: 'Partner', gegner: 'Rivale', quest: 'Hauptmission', woche: 'Mission der Woche', faehigkeit: 'Move', stufe: 'Rang', sieg: 'erledigt', stadt: 'City', bezirk: 'Block', stadtname: 'Neon City' },
    titel: ['Rookie', 'Player', 'Insider', 'Boss', 'Legende'],
    texte: { 'feuer.titel': 'Nach Schicht', 'story.knopf': 'Zurück auf die Straße', 'tab.logbuch': 'Notizbuch', 'tab.gruppe': 'Crew', 'siegel.treffer': 'Erledigt', 'siegel.ruhe': 'Ruhige Nacht', 'siegel.schwer': 'Harte Nacht', 'rat.titel': 'Tipp für heute', 'ruhe.marke': 'SCHICHT VORBEI',
      'rb.karte.eyebrow': 'POST FÜR DICH', 'rb.karte.einer': '{held} hat dir eine Nachricht hinterlassen.', 'rb.karte.mehrere': 'Deine Crew hat dir Nachrichten hinterlassen.', 'rb.karte.lesen': 'Aufmachen', 'rb.ueberspringen': 'Diesmal nicht', 'rb.geholfen': 'Was hat dir auf der Straße geholfen?', 'rb.schwierigkeit': 'Wie zäh war dieser Gegner?' },
    symbole: { 'tab.start': 'palme', 'tab.stadt': 'skyline', 'siegel.treffer': 'faust', 'siegel.ruhe': 'sonnenbrille' },
    namen: { trogadon: 'Tank Trogg', khara: 'Lady Kay', fisker: 'Captain Fisk', uldini: 'Mr. Uld', goldwin: 'Der Quartiermeister', 'der-erste': 'Brick', ahren: 'Party-Ari', jelninolan: 'Doc Jell' },
    bilder: {
      szene: 'bilder/strasse/szene.jpg',
      // Ausbau der City (Version 83): vom Eckhaus zur Villa, Stufe 1–6, siehe AUSBAU in daten/stadt.js
      'ausbau-1': 'bilder/strasse/ausbau-1.jpg', 'ausbau-2': 'bilder/strasse/ausbau-2.jpg', 'ausbau-3': 'bilder/strasse/ausbau-3.jpg',
      'ausbau-4': 'bilder/strasse/ausbau-4.jpg', 'ausbau-5': 'bilder/strasse/ausbau-5.jpg', 'ausbau-6': 'bilder/strasse/ausbau-6.jpg',
      trogadon: 'bilder/strasse/trogadon.jpg', khara: 'bilder/strasse/khara.jpg', fisker: 'bilder/strasse/fisker.jpg',
      uldini: 'bilder/strasse/uldini.jpg', 'der-erste': 'bilder/strasse/der-erste.jpg', ahren: 'bilder/strasse/ahren.jpg',
      // Eigene Dateien je Platz; fehlende Banner/Bezirke nutzen die Rückfallkette (Version 62)
      'bezirk-mindset': 'bilder/strasse/bezirk-mindset.jpg',
      'bezirk-family': 'bilder/strasse/bezirk-family.jpg',
      'bezirk-adventure': 'bilder/strasse/bezirk-adventure.jpg'
    },
    pos: {},
    aura: { kaufrausch: 'funken', irrlicht: 'flackern' },
    // Version 164: aus der Neon-Stadt selbst (Automaten, Verkehr, Neon), keine Märchenfiguren; feminin, weil „den Automaten“ im Akkusativ unschön wäre
    gegnerNamen: { zuckerkobold: 'Die Zuckermaschine' },
  },
  // Version 80: Rom (Legion). Rot nur, wo man handelt (Heldentat, Knöpfe); ruhige Bereiche bleiben Marmor und Gold.
  // Zitate (Seneca, Marc Aurel, Epiktet) sind eigene Übersetzungen der antiken Originale.
  rom: {
    name: 'Rom', alt: [], waehlbar: false, // gesperrt bis zur Freigabe (Entscheidung 30.10.2026)
    karte: 'bilder/rom/szene.jpg', // Datei folgt; bis dahin zeigt die App den Platzhalter rom-szene.svg
    wort: { marke: 'TAGESBEFEHL', crew: 'Legion', verbuendeter: 'Kamerad', gegner: 'Feind', quest: 'Feldzug', woche: 'Marschbefehl der Woche', faehigkeit: 'Disziplin', stufe: 'Rang', sieg: 'bezwungen', stadt: 'Festung', bezirk: 'Abschnitt', stadtname: 'Castra Nova', kapitel: 'Kapitel' },
    titel: ['Tiro', 'Legionär', 'Optio', 'Centurio', 'Präfekt', 'Tribun', 'Legat'],
    texte: {
      'feuer.titel': 'Im Atrium',
      'story.knopf': 'Zurück in die Festung',
      'tab.logbuch': 'Commentarii',
      'tab.start': 'Forum', 'tab.gruppe': 'Legion', 'siegel.treffer': 'Bezwungen', 'siegel.ruhe': 'Stellung gehalten', 'siegel.schwer': 'Schwerer Kampf', 'rat.titel': 'Rat des Tages',
      'notfall.innehalten': 'Atme dreimal langsam aus. „Nicht die Dinge selbst beunruhigen uns, sondern unser Urteil über sie.“ (Epiktet)',
      'notfall.ideeZiehen': '„Was im Weg steht, wird zum Weg.“ (Marc Aurel) Zieh eine Idee aus deiner Amphore.',
      'notfall.ideeLeer': 'Deine Amphore ist leer. Leg eine Idee hinein, die dir in so einem Moment helfen kann.',
      'notfall.verwalten': 'Amphore füllen',
      'ideen.titel': 'AMPHORE',
      'ideen.text': 'Kleine Dinge, die du statt des alten Musters tun kannst. Die Notfallkarte zieht daraus.',
      'ideen.hinzufuegen': 'In die Amphore legen',
      'eintrag.frage.schwer': 'Heute war es schwer. „Wir leiden öfter in der Vorstellung als in der Wirklichkeit.“ (Seneca)',
      'eintrag.gespeichert.schwer': 'Festgehalten. „Wirst du zurückgeworfen, kehre zurück, und freu dich, wenn das meiste gelingt.“ (Marc Aurel)'
    },
    symbole: { 'tab.start': 'forum', 'tab.stadt': 'burg', 'siegel.treffer': 'schwert', 'siegel.ruhe': 'scutum' },
    bezirke: { health: 'Exerzierfeld', mindset: 'Heiligtum', partner: 'Garten', family: 'Lararium', friends: 'Taverne', career: 'Principia', finance: 'Aerarium', adventure: 'Hafen', growth: 'Bibliothek' },
    namen: { trogadon: 'Trogadus', khara: 'Cara', fisker: 'Piscator', uldini: 'Uldinus', goldwin: 'Aureus', ahren: 'Arrius', jelninolan: 'Iulia', 'der-erste': 'Primus' },
    bilder: {},
    pos: {},
    aura: { heisshunger: 'glut', trott: 'schatten' },
  }
};

// Eigene Bilder aus dem alten Prototyp (Bildspeicher, übernommen am 25.10.2026).
// Haben Vorrang vor den Dateien. Eintrag: [Adresse, Bildausschnitt]. Zoom aus dem alten Prototyp ist noch nicht übernommen.
export const EIGENE_BILDER = {
  'fantasy': {
    'boss-irrlicht': [
      'bilder/speicher/1b8ceb8f2dd81ac7bdcc3ca928daa49c.jpg',
      '50% 30%'
    ],
    'banner-jelninolan': [
      'bilder/speicher/95bf1cb615531ccf3630f974c604cad2.jpg',
      '50% 16%'
    ],
    'boss-aufschieberitis': [
      'bilder/speicher/c1dd443e93d86e586a93b6429da85034.jpg',
      '67% 0%'
    ],
    'boss-drycha': [
      'bilder/speicher/745cb5d6bd0dddeb5b2c131cc602f0ce.jpg',
      '50% 30%'
    ],
    'boss-gedankenkarussell': [
      'bilder/speicher/ed3eb52af7384479c161af7dfc411c11.jpg',
      '50% 30%'
    ],
    'boss-geldfresser': [
      'bilder/speicher/ea0f7adc8de15e05229b2edb13e1a825.jpg',
      '83% 4%'
    ],
    'boss-kritiker': [
      'bilder/speicher/745cb5d6bd0dddeb5b2c131cc602f0ce.jpg',
      '50% 30%'
    ],
    'boss-langeweile': [
      'bilder/speicher/c1dd443e93d86e586a93b6429da85034.jpg',
      '50% 30%'
    ],
    'boss-murrgrim': [
      'bilder/speicher/ea0f7adc8de15e05229b2edb13e1a825.jpg',
      '50% 30%'
    ],
    'jelninolan': [
      'bilder/speicher/95bf1cb615531ccf3630f974c604cad2.jpg',
      '50% 30%'
    ],
    'karte-hintergrund': [
      'bilder/speicher/438340c17076e7d36c2ff3488f1623c5.jpg',
      '50% 30%'
    ],
    'story-drycha': [
      'bilder/speicher/745cb5d6bd0dddeb5b2c131cc602f0ce.jpg',
      '50% 30%'
    ],
    'story-murrgrim': [
      'bilder/speicher/ea0f7adc8de15e05229b2edb13e1a825.jpg',
      '50% 30%'
    ]
  },
  'scifi': {
    'fisker': [
      'bilder/speicher/dd7a5d6b429f31f68832c5031a5e11dc.jpg',
      '8% 6%'
    ],
    'trogadon': [
      'bilder/speicher/89b9d7a746276486a11a8a3c5d4e528a.jpg',
      '25% 30%'
    ],
    'uldini': [
      'bilder/speicher/66f309b9a91cfe6a76d3ccaa49dda788.jpg',
      '50% 30%'
    ],
    'boss-gaehnor': [
      'bilder/speicher/a2e6ab4931d482fdd2e50c1bb1acf604.jpg',
      '50% 30%'
    ],
    'boss-hetzra': [
      'bilder/speicher/4e4fac42824aae558ee4ea64f679d7ce.jpg',
      '50% 30%'
    ],
    'boss-zuckerkobold': [
      'bilder/speicher/e0d4a312a2ebc46e298792603430701f.jpg',
      '50% 42%'
    ],
    'crew': [
      'bilder/speicher/1da928a1241011680b45c4c0b204be38.jpg',
      '50% 30%'
    ],
    'banner-jelninolan': [
      'bilder/speicher/7580b3204eed81e44150c2a2f425560a.jpg',
      '30% 10%'
    ],
    'boss-aufschieberitis': [
      'bilder/speicher/ffde2fa4fe2f45b435117fb4034a94c4.jpg',
      '50% 30%'
    ],
    'boss-drycha': [
      'bilder/speicher/18a2539cfdc21c2125f9f2b6397f5c8a.jpg',
      '50% 30%'
    ],
    'boss-geldfresser': [
      'bilder/speicher/5d0d682ac84ce96a05e9cf8aca04062a.jpg',
      '50% 30%'
    ],
    'boss-heisshunger': [
      'bilder/speicher/24da4f82754b0ee91329dae134857558.png',
      '39% 30%'
    ],
    'boss-langeweile': [
      'bilder/speicher/c72d6aaf1ce37221e389ba47ad719ca4.jpg',
      '87% 0%'
    ],
    'boss-leere': [
      'bilder/speicher/48919425afabf951db3f3689a1db8d8a.jpg',
      '20% 7%'
    ],
    'boss-trott': [
      'bilder/speicher/c72d6aaf1ce37221e389ba47ad719ca4.jpg',
      '100% 0%'
    ],
    'jelninolan': [
      'bilder/speicher/cd3c83e00d957a9aa97e7329abb2222a.jpg',
      '50% 4%'
    ]
  },
  'cozy': {
    'ahren': [
      'bilder/speicher/185fb9a161513b8876515e1d4611c8e9.jpg',
      '50% 30%'
    ],
    'der-erste': [
      'bilder/speicher/05c5ad3021fcc137c58d260ae9ebf11f.jpg',
      '50% 30%'
    ],
    'fisker': [
      'bilder/speicher/c2c5a944ba95ae9a4a5bd209d95c653f.jpg',
      '50% 30%'
    ],
    'goldwin': [
      'bilder/speicher/51934e7ab1bd28de8371075938d3ecd3.jpg',
      '20% 30%'
    ],
    'khara': [
      'bilder/speicher/81a9e6236371856e323834d22ade3270.jpg',
      '50% 30%'
    ],
    'trogadon': [
      'bilder/speicher/e9ecfac3648d5f937a3962ab6ba6383e.jpg',
      '50% 30%'
    ],
    'uldini': [
      'bilder/speicher/bef7429d79289ef87bad5288b628e720.jpg',
      '50% 30%'
    ]
  },
  'strasse': {
    'banner-jelninolan': [
      'bilder/speicher/9b9413c06d9e6f4062317bf35e0db519.jpg',
      '20% 0%'
    ],
    'boss-heisshunger': [
      'bilder/speicher/c7e15ee3e40357ee2e3b7c5caa14513c.png',
      '50% 30%'
    ],
    'boss-zuckerkobold': [
      'bilder/speicher/81de20569aa2b13e074f1a927694cb66.png',
      '50% 30%'
    ],
    'jelninolan': [
      'bilder/speicher/c005502b17651a6497d49fec2593832f.jpg',
      '18% 0%'
    ]
  }
};

// Wählbare Stile in Anzeige-Reihenfolge. Nie leer: ohne wählbaren Stil bleibt Fantasy.
export const STIL_WAEHLBAR = (() => {
  const l = STIL_REIHENFOLGE.filter(id => STILE[id] && STILE[id].waehlbar === true);
  if (!l.length) console.warn('Stile: keine Welt wählbar, Rückfall auf Fantasy');
  return l.length ? l : ['fantasy'];
})();
export const istWaehlbar = id => STIL_WAEHLBAR.includes(id);

// Version 35: Archivierte Stile aus dem alten Prototyp, NUR als gesperrte Kachel in der Weltenwahl.
// Kein Eintrag in STILE (keine Farben, Wörter, Bilder, kein Speichern, keine Pflege). Immer gesperrt.
// Zurückholen = vollständigen Eintrag in STILE anlegen und hier entfernen.
// Version 53: Mitternachtsgold und Modern auf Wunsch aus der Weltenwahl entfernt (bleiben nur im alten Prototyp).
export const STIL_ARCHIV_VORSCHAU = [
  { id: 'zombie', name: 'Zombie' }
].filter(x => !STILE[x.id]); // Schutz: ein zurückgeholter Stil erscheint nie doppelt

// Alte oder unbekannte IDs → gültige ID (Rückfall: fantasy).
export function stilId(id) {
  if (STILE[id]) return id;
  for (const [k, s] of Object.entries(STILE)) if ((s.alt || []).includes(id)) return k;
  return 'fantasy';
}

// Seiten mit Stil-Kulisse (31.10.2026, Schritt Kopfleiste und Neuigkeiten): Bildschirm-IDs (ui.screen). Die Kulisse ist
// reine Darstellung (CSS .screen.kulisse in index.html); eine Seite ohne Eintrag behält den ruhigen Grund des Stils.
// Version 108 (Etappe 3, Teil F): auch die Geschichte (Buch-Look wie die Chronik).
export const KULISSE_SEITEN = ['start', 'logbuch', 'karte', 'stadt', 'story'];
