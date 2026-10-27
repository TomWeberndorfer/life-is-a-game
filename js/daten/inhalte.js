// Tägliche Inhalte als Daten: Crew-Botschaften, Story-Häppchen, Mikroquests.
// Platzhalter: {verbuendeter} {faehigkeit} {ziel} {n} {rest} {anzahl}
//   {gegner} / {Gegner} = Gegner im Nominativ (klein / am Satzanfang), {er} {Er} {ihn} = passendes Fürwort.
// Neue Texte oder Geschichten = neue Einträge, keine Programmierung.

// Anlässe in Prüfreihenfolge; der erste passende gewinnt. Die Variante wechselt täglich.
export const BOTSCHAFTEN = [
  { anlass: 'erster_tag', texte: [
    '{Gegner} und ich kennen uns schon lange. Heute zeige ich dir, wie wir {ihn} packen.',
    'Ein neues Abenteuer! Merk dir nur eines: {faehigkeit}. Den Rest machen wir gemeinsam.'
  ] },
  { anlass: 'neuer_gegner', texte: [
    'Kaum liegt der eine am Boden, steht schon der Nächste vor der Tür: {Gegner}. Gleiche Fähigkeit, neuer Kampf.',
    '{Gegner} hat von deinem Sieg gehört und will es jetzt selbst wissen. Wir sind bereit.'
  ] },
  { anlass: 'besiegt', texte: [
    '{Gegner} liegt am Boden. Ich habe {ihn} noch nie so schnell fallen sehen. Was machst du mit dem Rest der Woche?',
    'Sieg! Jede weitere Anwendung diese Woche ist pure Stärke, kein Muss.',
    'Ich habe von dir erzählt, unten im Lager. Sie wollten es kaum glauben.'
  ] },
  { anlass: 'fast', texte: [
    'Noch ein einziges Mal {faehigkeit}, dann fällt {gegner}. Ich kann es schon riechen.',
    '{Gegner} wankt. Ein Treffer noch. Heute vielleicht?'
  ] },
  { anlass: 'montag_sieg', texte: [
    'Neue Woche, und {gegner} ist zurück. {Er} hat aber gelernt, dass du gefährlich bist.',
    'Letzte Woche hast du gewonnen. {Er} weiß das. Und du auch.'
  ] },
  { anlass: 'montag', texte: [
    'Neue Woche, neues Glück. {Gegner} hat nur einen Vorsprung, keinen Sieg.',
    'Was letzte Woche war, zählt nicht mehr gegen dich. Heute fängt eine neue Runde an.'
  ] },
  { anlass: 'gestern_ja', texte: [
    'Gestern hast du {faehigkeit} eingesetzt. {Gegner} hat es gespürt, glaub mir.',
    'Das war stark gestern. {n} von {anzahl} diese Woche. Weiter so.',
    'Ich habe gesehen, wie du gestern gehandelt hast, statt einfach zuzugreifen. So fängt es an.'
  ] },
  { anlass: 'gestern_nein', texte: [
    'Gestern hat sich {gegner} nicht blicken lassen. Ruhige Tage sind auch gute Tage.',
    'Kein Kampf gestern? Dann hattest du Kraft übrig. Die heben wir auf.'
  ] },
  { anlass: 'pause', texte: [
    'Schön, dass du wieder da bist. Wir machen einfach da weiter, wo wir waren.',
    'Ich habe die Stellung gehalten. Kein Problem, jeder Held braucht Pausen.',
    'Ein Tag Pause ist kein Rückschritt. Heute zählt.'
  ] },
  { anlass: 'sonst', texte: [
    'Kleiner Trick: Je früher du an {faehigkeit} denkst, desto leichter wird es.',
    '{Gegner} mag Müdigkeit und Eile. Wenn du beides bemerkst, sei wachsam.',
    'Du musst nicht perfekt sein. Du musst nur öfter gewinnen als {gegner}.',
    'Sag es dir laut: Ich entscheide, nicht die Gewohnheit.',
    'Heute ist ein guter Tag für einen Treffer. Ich bin bereit, wenn du es bist.'
  ] }
];

const t = (titel, text) => ({ titel, text });

// Woche 1 je Gegner, ab Woche 2 die allgemeine Woche.
export const STORIES = {
  zuckerkobold: { titel: 'Die Vorratskammer von Talwacht', teile: [
    t('Das Knistern', 'In der Nacht hörst du es zum ersten Mal: ein leises Knistern aus der Vorratskammer von Talwacht. {verbuendeter} steht schon mit der Laterne an der Tür. „Er ist zurück“, flüstert er. Auf dem Boden liegt eine leere Verpackung, sorgfältig gefaltet, wie eine Botschaft.'),
    t('Die Spur aus Zucker', 'Am Morgen zieht sich eine glitzernde Spur durch das ganze Dorf, von Haus zu Haus. „Der Zuckerkobold geht nicht in die Häuser“, sagt {verbuendeter}. „Er wartet, bis man ihn hineinlässt.“ Die Spur endet vor deiner Tür.'),
    t('Der Teller', '{verbuendeter} holt einen alten Holzteller aus seiner Truhe, in den Rand sind Runen geschnitzt. „Mein Großvater hat ihn benutzt. Was auf dem Teller liegt, gehört dir. Was in der Packung bleibt, gehört niemandem.“ Als du den Teller berührst, wird er kurz warm.'),
    t('Das Flüstern', 'Am Abend sitzt der Kobold auf dem Fensterbrett. „Nur noch ein Stück“, flüstert er, „du hast es dir verdient.“ Er hat eine angenehme Stimme. Zu angenehm. {verbuendeter} hebt den Kopf: „Hörst du, wie er es macht? Er lobt dich, damit du nicht nachdenkst.“'),
    t('Die Falle', 'Ihr stellt die Packungen in den obersten Schrank, hinter die Mehlsäcke. Der Kobold tobt die halbe Nacht. Am Morgen findet ihr winzige Kratzspuren an der Schranktür, aber sie ist zu. {verbuendeter} grinst zum ersten Mal: „Er ist kleiner, als er tut.“'),
    t('Der Ruf', 'Aus dem Nachbardorf kommt eine Botin: Auch dort wurde der Kobold gesehen, aber dort ist er riesig geworden, so groß wie ein Fass. „Er wächst, wo niemand ihn bemerkt“, sagt {verbuendeter} leise. „Bei dir schrumpft er.“ Er sieht dich lange an. „Bist du bereit für mehr?“'),
    t('Die Entscheidung', 'Am letzten Abend der Woche steht der Kobold mitten in der Küche und schaut dich direkt an. Kein Flüstern mehr, nur Warten. Du nimmst den Teller. {verbuendeter} nickt. Was dann passiert, erzählt man sich in Talwacht noch lange – und nächste Woche erfährst du, warum der Kobold nicht allein gekommen ist.')
  ] },
  gaehnor: { titel: 'Der Nebel über dem Pfad', teile: [
    t('Der Nebel', 'Über dem Pfad aus dem Dorf liegt seit Tagen ein grauer Nebel. Wer hineingeht, wird müde und setzt sich nach drei Schritten wieder hin. {verbuendeter} zeigt auf eine Gestalt im Dunst, die laut gähnt. „Gähnor“, sagt er. „Er hat noch nie einen Kampf verloren, weil nie jemand angefangen hat.“'),
    t('Die Schuhe', '{verbuendeter} stellt dir ein Paar Stiefel vor die Tür. „Du musst nicht wandern“, sagt er. „Zieh sie nur an.“ Kaum sind sie an den Füßen, lichtet sich der Nebel einen Schritt weit.'),
    t('Zwei Minuten', 'Ihr geht hinaus, nur zwei Minuten, wie abgemacht. Gähnor sitzt am Wegrand und schaut verwirrt. „Ihr wolltet doch morgen“, murmelt er. Als ihr umkehrt, ist der Nebel hinter euch dünner geworden.'),
    t('Das Sofa', 'Am Abend ruft Gähnor dich mit warmer Stimme: „Bleib liegen, du hattest einen langen Tag.“ {verbuendeter} lacht leise. „Er hat recht, du hattest einen langen Tag. Gerade deshalb tun zwei Minuten gut.“'),
    t('Die Spuren', 'Am Morgen siehst du Fußspuren im taufeuchten Gras: deine eigenen, von den letzten Tagen. Sie bilden einen kleinen Pfad. „So entstehen Wege“, sagt {verbuendeter}.'),
    t('Der Riese wird klein', 'Gähnor ist geschrumpft, er reicht dir jetzt nur noch bis zum Knie. Er gähnt trotzdem, aber niemand setzt sich mehr hin. „Er lebt vom Warten“, sagt {verbuendeter}. „Und du wartest nicht mehr.“'),
    t('Der klare Morgen', 'Zum ersten Mal seit Wochen siehst du die Berge hinter dem Dorf. Gähnor hockt beleidigt auf einem Stein. „Ich komme wieder“, murmelt er. „Gut“, antwortest du. „Dann weißt du, wo du mich findest.“')
  ] },
  nachtschwaermer: { titel: 'Die Laterne, die nie ausgeht', teile: [
    t('Das Licht im Fenster', 'Jede Nacht brennt in deinem Fenster ein bläuliches Licht, lange nachdem alle anderen schlafen. {verbuendeter} klopft leise an. „Der Nachtschwärmer ist bei dir eingezogen“, sagt er. „Er liebt Licht, das nie ausgeht.“'),
    t('Nur noch eine', 'Der Nachtschwärmer sitzt auf deiner Bettkante und flüstert: „Nur noch eine Folge, nur noch eine Nachricht.“ Er klingt freundlich. {verbuendeter} gähnt im Türrahmen. „Er sagt das jede Nacht. Zähl mal mit.“'),
    t('Der Korb vor der Tür', '{verbuendeter} stellt einen Korb vor dein Schlafzimmer. „Was leuchtet, schläft hier draußen“, sagt er. Du legst das Leuchtende hinein, und im Zimmer wird es zum ersten Mal richtig dunkel.'),
    t('Die Stille', 'Ohne Licht ist es merkwürdig still. Du hörst den Wind, dann deinen Atem. Draußen vor der Tür hörst du den Nachtschwärmer leise schimpfen.'),
    t('Der Morgen danach', 'Du wachst auf, bevor der Hahn kräht, und fühlst dich wie nach einem langen Urlaub. {verbuendeter} sitzt schon am Tisch. „So sieht ein Held aus, der geschlafen hat“, sagt er.'),
    t('Die List', 'Der Nachtschwärmer versucht es heute anders: „Du musst noch kurz etwas nachsehen, es ist wichtig.“ Du hältst inne. Nichts davon ist wichtiger als der Schlaf, und das weißt du jetzt.'),
    t('Das dunkle Fenster', 'Heute brennt in deinem Fenster kein Licht. Der Nachtschwärmer flattert ratlos ums Haus und zieht schließlich weiter. {verbuendeter} flüstert: „Er wird wiederkommen. Aber du kennst jetzt den Korb.“')
  ] },
  heisshunger: { titel: 'Das Knurren im Gebirge', teile: [
    t('Das Knurren', 'Aus den Bergen kommt ein dumpfes Knurren, immer dann, wenn du müde oder gestresst bist. „Das ist der Heißhunger“, sagt {verbuendeter}. „Er frisst nicht viel. Er frisst nur schnell.“'),
    t('Die Quelle', '{verbuendeter} führt dich zu einer klaren Quelle am Dorfrand. „Bevor du entscheidest, trink“, sagt er. Du trinkst, und das Knurren in den Bergen wird für einen Moment leiser.'),
    t('Fünf Minuten', 'Der Heißhunger stürmt heran, du hältst die Hand hoch: „Fünf Minuten.“ Er bleibt verdutzt stehen, schnaubt und wartet. Nach fünf Minuten ist er nur noch halb so groß.'),
    t('Die Verkleidung', 'Heute kommt der Heißhunger verkleidet als Langeweile. Fast hättest du ihn hereingelassen. „Er hat viele Kostüme“, sagt {verbuendeter}. „Aber er kann nicht gut warten.“'),
    t('Der Markt', 'Auf dem Markt duftet es nach frischem Brot. Du kaufst, was du brauchst, und gehst weiter. Hinter dir hörst du ein enttäuschtes Knurren.'),
    t('Die Frage', '{verbuendeter} fragt dich: „Hattest du Hunger, oder warst du müde?“ Du denkst nach, und zum ersten Mal kennst du die Antwort. Der Heißhunger zieht sich in die Berge zurück.'),
    t('Der stille Gipfel', 'Heute bleibt es in den Bergen ruhig. Du sitzt mit {verbuendeter} vor dem Haus und isst in Ruhe, ohne Eile. „Er ist nicht weg“, sagt er. „Aber er hat jetzt Respekt vor dir.“')
  ] },
  hetzra: { titel: 'Die gestohlenen Abende', teile: [
    t('Die leeren Abende', 'Jeden Abend verschwinden Stunden, als hätte jemand sie gestohlen. {verbuendeter} zeigt auf eine flinke Gestalt, die mit einem Sack voller Uhren über die Dächer rennt. „Hetzra“, sagt sie. „Sie nimmt euch die Zeit, bevor ihr sie bemerkt.“'),
    t('Das Buch der Tage', '{verbuendeter} legt ein großes Buch auf den Tisch. „Was hier eingetragen ist, kann sie nicht stehlen.“ Ihr schreibt einen Abend hinein, nur für euch zwei.'),
    t('Hetzras Angebot', 'Hetzra klopft und bietet dir etwas an: „Ich mache dir Platz für etwas Wichtigeres.“ Du schaust ins Buch. Wichtiger als euer Abend? {verbuendeter} schließt ihr freundlich die Tür vor der Nase.'),
    t('Der Abend', 'Der eingetragene Abend kommt, und Hetzra steht wütend vor dem Fenster, kann aber nicht hinein. Drinnen redet ihr, lacht, und die Uhr bleibt erstaunlich langsam.'),
    t('Die Rückkehr der Stunden', 'Am nächsten Morgen findet ihr vor der Tür ein paar Uhren, die aus Hetzras Sack gefallen sind. „Sie verliert, wenn ihr plant“, sagt {verbuendeter}.'),
    t('Der Sturm', 'Eine volle Woche zieht auf, Termine prasseln wie Hagel. Hetzra lacht vom Dach. Doch im Buch steht euer Abend, schwarz auf weiß, und er bleibt.'),
    t('Die Uhr auf dem Tisch', 'Ihr stellt eine der geretteten Uhren auf den Tisch, als Erinnerung. Hetzra rennt weiter über die Dächer, aber euer Haus macht sie nervös. {verbuendeter} lächelt: „Nächste Woche tragen wir zwei Abende ein.“')
  ] },
  langeweile: { titel: 'Das Ideenglas', teile: [
    t('Der graue Schleier', 'An manchen Nachmittagen legt sich ein grauer Schleier über das Haus, und niemand weiß, was zu tun ist. Die Kinder starren auf Bildschirme. {verbuendeter} flüstert: „Der Graue Nachmittag ist da.“'),
    t('Das leere Glas', '{verbuendeter} stellt ein großes leeres Glas auf den Küchentisch. „Jeder schreibt eine Idee auf.“ Bald liegen bunte Zettel darin: Höhle bauen, Schatzsuche, Pfannkuchen-Wettbewerb.'),
    t('Der erste Zug', 'Der Graue Nachmittag schleicht herein, du greifst ins Glas. „Deckenburg“, steht auf dem Zettel. Zehn Minuten später ist das Wohnzimmer eine Festung, und der Schleier hat ein Loch.'),
    t('Das Murren', 'Heute murren die Kinder: „Keine Lust.“ Du ziehst trotzdem einen Zettel und fängst einfach an. Nach einer Weile kommen sie, einer nach dem anderen.'),
    t('Neue Zettel', 'Die Kinder werfen heimlich eigene Ideen ins Glas. Manche sind sehr seltsam, alle sind großartig. {verbuendeter} lacht: „Jetzt wird das Glas stärker als der Nachmittag.“'),
    t('Draußen', 'Ein Zettel schickt euch hinaus in den Regen, Pfützen messen. Der Graue Nachmittag bleibt drinnen und weiß nicht, wohin.'),
    t('Das volle Glas', 'Am Ende der Woche ist das Glas voller als am Anfang. Der Graue Nachmittag kommt seltener und geht schneller. {verbuendeter} hält einen Zettel hoch, den du nicht kennst: „Großes Abenteuer.“ Er wandert zurück ins Glas. „Nächste Woche.“')
  ] },
  aufschieberitis: { titel: 'Der Berg, der wächst', teile: [
    t('Der Berg', 'Hinter deinem Haus steht ein Berg aus unerledigten Dingen, jeden Tag ein Stück höher. Auf dem Gipfel sitzt die Aufschieberitis und winkt. „Morgen“, ruft sie. „Morgen ist alles leichter.“'),
    t('Der Kieselstein', '{verbuendeter} gibt dir keinen Spaten, sondern einen einzigen Kieselstein. „Trag nur diesen hinunter.“ Du trägst ihn, und der Berg ist ein winziges Stück kleiner.'),
    t('Der zweite Stein', 'Mit dem ersten Stein in der Hand fällt der zweite leichter. Plötzlich hast du zehn getragen. Die Aufschieberitis rutscht auf dem Gipfel unruhig hin und her.'),
    t('Die große Aufgabe', 'Heute wartet ein riesiger Brocken. Die Aufschieberitis lacht: „Den schaffst du nie.“ {verbuendeter} zeigt auf eine kleine Ecke des Brockens. „Dann fang hier an.“'),
    t('Das Werkzeug', 'Du schreibst den kleinsten ersten Schritt auf ein Stück Rinde und nagelst es an die Tür. Jeden Morgen weißt du nun, wo du anfängst. Die Aufschieberitis hasst diese Rinde.'),
    t('Die Flucht', 'Die Aufschieberitis versucht dich mit Dringendem abzulenken, das nicht wichtig ist. Du lächelst und trägst weiter. „Du lernst schnell“, sagt {verbuendeter}.'),
    t('Der Ausblick', 'Der Berg ist nur noch ein Hügel, und du kannst darüber hinwegsehen. Die Aufschieberitis sitzt jetzt viel tiefer. „Sie geht nie ganz“, sagt {verbuendeter}. „Aber von hier oben sieht sie klein aus.“')
  ] },
  irrlicht: { titel: 'Das Licht im Moor', teile: [
    t('Das Irrlicht', 'Wann immer du dich konzentrierst, tanzt ein kleines Licht am Rand deines Blicks. Folgst du ihm, findest du dich eine halbe Stunde später im Moor wieder. „Das Handy-Irrlicht“, sagt {verbuendeter}. „Es lockt, aber es führt nirgendwo hin.“'),
    t('Die Kiste', '{verbuendeter} baut dir eine kleine Kiste mit Deckel. „Was leuchtet, kommt hier hinein, im anderen Zimmer.“ Als der Deckel zu ist, wird es im Raum erstaunlich ruhig.'),
    t('Fünfundzwanzig Minuten', 'Ihr stellt eine Sanduhr auf. Fünfundzwanzig Minuten lang arbeitest du an einer Sache, nur an einer. Das Irrlicht klopft gegen die Kiste, aber der Deckel hält.'),
    t('Die Pause', 'Als der Sand durch ist, darfst du die Kiste öffnen. Das Irrlicht leuchtet, aber jetzt bist du es, der entscheidet. {verbuendeter} nickt: „So rum ist es richtig.“'),
    t('Das Flackern', 'Heute flackert das Irrlicht besonders hell, es ruft mit tausend kleinen Neuigkeiten. Du hörst es und arbeitest weiter. Es wird kleiner, wenn man es nicht beachtet.'),
    t('Der Weg durchs Moor', 'Du merkst, wie viel du schaffst, wenn das Licht schläft. Wo früher Moor war, ist jetzt ein fester Pfad. {verbuendeter} geht ihn mit dir ab.'),
    t('Das stille Moor', 'Am Ende der Woche liegt das Moor ruhig da. Das Irrlicht glimmt nur noch schwach in seiner Kiste. „Es braucht dich mehr als du es“, sagt {verbuendeter}. „Vergiss das nicht.“')
  ] },
  kaufrausch: { titel: 'Der Händler um Mitternacht', teile: [
    t('Der Händler', 'Um Mitternacht klopft ein Händler mit glänzendem Wagen an deine Tür. „Nur heute“, flüstert er, „nur für dich.“ {verbuendeter} kneift die Augen zusammen. „Das ist der Kaufrausch. Er hat jeden Tag ‚nur heute‘.“'),
    t('Die Merkliste', '{verbuendeter} gibt dir ein kleines Buch. „Was du willst, schreibst du hier hinein. Morgen entscheidest du.“ Der Händler runzelt die Stirn.'),
    t('Der Morgen danach', 'Am Morgen liest du die Liste. Die Hälfte davon willst du gar nicht mehr. Der Händler steht an der Ecke und schaut beleidigt weg.'),
    t('Das glänzende Ding', 'Heute bietet der Kaufrausch etwas wirklich Schönes an. Du schreibst es auf. Morgen willst du es immer noch, und dann kaufst du es, ruhig und ohne Eile.'),
    t('Der schwere Beutel', 'Dein Geldbeutel ist schwerer als sonst am Ende der Woche. {verbuendeter} wiegt ihn in der Hand. „Gold, das bleibt, statt Gold, das rennt.“'),
    t('Die Falle', 'Der Händler versucht es mit „Nur noch drei Stück!“. Du lachst laut. Er packt seinen Wagen ein und rollt ein paar Häuser weiter.'),
    t('Der leere Wagen', 'Um Mitternacht klopft niemand mehr. Auf der Straße steht der Wagen des Händlers, halb leer. „Er wird wiederkommen“, sagt {verbuendeter}. „Aber du hast jetzt ein Buch.“')
  ] },
  geldfresser: { titel: 'Das Loch in der Truhe', teile: [
    t('Die leere Truhe', 'Am Ende jedes Monats ist deine Truhe leer, und du weißt nicht, wohin das Gold verschwunden ist. Nachts hörst du ein leises Schmatzen. „Der Geldfresser“, sagt {verbuendeter}. „Er nimmt, was übrig bleibt.“'),
    t('Die zweite Truhe', '{verbuendeter} stellt eine zweite, kleinere Truhe mit schwerem Schloss neben die erste. „Wenn Gold hereinkommt, geht zuerst ein Teil hier hinein. Dann bleibt für ihn nichts übrig.“'),
    t('Der erste Taler', 'Du legst den ersten Taler in die kleine Truhe, es klingt wunderbar. Der Geldfresser schnuppert daran, aber das Schloss hält.'),
    t('Der Hunger', 'Der Geldfresser wird hungrig und versucht es an der großen Truhe. Dort findet er weniger als sonst. Er knurrt und schleicht davon.'),
    t('Das Klingen', 'Jeden Abend hörst du nun das Klingen in der kleinen Truhe, wenn du sie schüttelst. „Das ist das schönste Geräusch im ganzen Dorf“, sagt {verbuendeter}.'),
    t('Der Notfall', 'Ein Rad am Karren bricht, und zum ersten Mal ist Geld dafür da. Du musst nichts leihen. {verbuendeter} klopft auf die kleine Truhe: „Dafür ist sie da.“'),
    t('Die volle Truhe', 'Die kleine Truhe ist schwerer geworden. Der Geldfresser sitzt hungrig vor dem Haus und blickt neidisch hinein. „Er bleibt dünn, solange du zuerst sparst“, sagt {verbuendeter}.')
  ] },
  leere: { titel: 'Der Abend ohne Farbe', teile: [
    t('Der farblose Abend', 'Manche Abende verlieren ihre Farbe. Alles wird grau, und du scrollst, ohne etwas zu sehen. {verbuendeter} sitzt neben dir. „Die Leere ist da. Sie wartet, bis dir nichts einfällt.“'),
    t('Die kleine Liste', '{verbuendeter} gibt dir ein Stück Papier. „Schreib fünf Dinge auf, die dir früher Freude gemacht haben.“ Es dauert, dann fallen dir sieben ein.'),
    t('Die erste Farbe', 'Als die Leere heute kommt, nimmst du die Liste und wählst: zeichnen. Nach zehn Minuten ist an der Wand ein kleiner Fleck Farbe zurück.'),
    t('Der Widerstand', 'Heute flüstert die Leere: „Das bringt doch nichts.“ Du fängst trotzdem an, nur fünf Minuten. Am Ende werden es vierzig.'),
    t('Neue Einträge', 'Du ergänzt die Liste um Dinge, die du nie probiert hast. {verbuendeter} liest mit und lacht über einen Eintrag. „Den machen wir zusammen.“'),
    t('Der bunte Raum', 'Dein Zimmer bekommt nach und nach Farbe zurück: ein Buch, ein Lied, ein angefangenes Bild. Die Leere sitzt in der Ecke und hat weniger Platz.'),
    t('Das Leuchten', 'Am Ende der Woche brennt ein warmes Licht in deinem Fenster. Die Leere schaut von draußen hinein. „Sie verschwindet nicht“, sagt {verbuendeter}. „Aber deine Liste ist jetzt größer als sie.“')
  ] },
  einsiedler: { titel: 'Die verwachsene Brücke', teile: [
    t('Die Brücke', 'Zwischen deinem Haus und den Häusern deiner Freunde führt eine alte Brücke, inzwischen von Ranken überwuchert. Auf ihr sitzt der Einsiedler. „Die anderen melden sich schon“, brummt er. „Warte einfach.“'),
    t('Der erste Brief', '{verbuendeter} gibt dir eine Feder. „Schreib eine Zeile, jetzt gleich.“ Du schickst sie los, und auf der Brücke welkt eine Ranke.'),
    t('Die Antwort', 'Am Abend kommt eine Antwort zurück, schneller als gedacht. „Schön, von dir zu hören!“, steht darin. Der Einsiedler tut so, als hätte er nichts gesehen.'),
    t('Der Vorschlag', 'Heute schreibst du nicht nur „Wie geht\'s?“, sondern: „Kaffee am Samstag?“ {verbuendeter} klatscht in die Hände. „Konkret ist stärker als freundlich.“'),
    t('Das Treffen', 'Ihr sitzt zusammen und lacht über alte Geschichten. Auf dem Heimweg ist die Brücke breiter, die Ranken sind fast weg.'),
    t('Der Rückzug', 'Der Einsiedler versucht es mit Müdigkeit: „Heute nicht, nächste Woche.“ Du schickst trotzdem eine kurze Nachricht. Kleine Fäden halten große Brücken.'),
    t('Die freie Brücke', 'Am Ende der Woche ist die Brücke frei, und auf der anderen Seite winkt jemand. Der Einsiedler sitzt jetzt am Ufer statt in der Mitte. „Er war nie stark“, sagt {verbuendeter}. „Nur geduldig.“')
  ] },
  trott: { titel: 'Die ausgetretenen Pfade', teile: [
    t('Die Rillen', 'Im Boden vor deinem Haus sind tiefe Rillen, ausgetreten von Jahren derselben Schritte. In ihnen sitzt der alte Trott und lächelt. „Warum etwas ändern?“, fragt er. „Es geht doch auch so.“'),
    t('Ein Schritt daneben', '{verbuendeter} zeigt dir eine Stelle neben den Rillen. „Nur ein Schritt.“ Du setzt den Fuß daneben, und es fühlt sich ungewohnt an, aber gut.'),
    t('Der neue Abdruck', 'Am nächsten Morgen siehst du deinen Fußabdruck neben der Rille, frisch und klar. Der alte Trott schaut ihn misstrauisch an.'),
    t('Die Bequemlichkeit', 'Heute ist alles anstrengend, und die Rillen locken. Du machst trotzdem den einen Schritt daneben. „Es geht nicht um große Sprünge“, sagt {verbuendeter}. „Es geht um die Richtung.“'),
    t('Der Pfad', 'Deine neuen Abdrücke bilden langsam einen eigenen Weg. Er führt irgendwohin, wo du noch nie warst. {verbuendeter} geht ihn neugierig mit.'),
    t('Der Einwand', 'Der alte Trott erinnert dich an alle Male, die es nicht geklappt hat. Du hörst zu, nickst und gehst weiter. Diesmal ist es anders, weil du klein anfängst.'),
    t('Zwei Wege', 'Am Ende der Woche gibt es vor deinem Haus zwei Wege: die alten Rillen und deinen neuen Pfad. Der alte Trott sitzt noch in seinen Rillen. „Er bleibt dort“, sagt {verbuendeter}. „Du nicht.“')
  ] },
  _allgemein: { titel: 'Neue Spuren', teile: [
    t('Neue Spuren', 'Eine neue Woche beginnt, und {verbuendeter} hat Neuigkeiten: {Gegner} wurde wieder gesehen, diesmal an einem Ort, an dem ihr {ihn} nicht erwartet habt. „{Er} probiert neue Wege. Das heißt, die alten funktionieren nicht mehr.“'),
    t('Der Bote', 'Ein Bote bringt eine Karte mit einem roten Kreis darauf. Darunter steht nur: „Hier ist {er} am stärksten.“ {verbuendeter} faltet sie zusammen. „Wenn wir wissen, wo, wissen wir auch, wann.“'),
    t('Das Training', '{verbuendeter} lässt dich {faehigkeit} immer wieder üben, bis es sich anfühlt wie Atmen. „Im echten Moment denkt keiner nach. Darum muss es vorher sitzen.“'),
    t('Die List', '{Gegner} versucht es mit einem Trick und tarnt sich als Belohnung. Fast hättest du es nicht bemerkt. {verbuendeter} legt dir eine Hand auf die Schulter: „Belohnungen kommen nach dem Sieg. Nicht statt ihm.“'),
    t('Verbündete', 'Andere aus dem Dorf haben von euch gehört und wollen helfen. Eine alte Frau bringt dir ein Amulett: „Es erinnert dich, wenn du es vergisst.“ {verbuendeter} lächelt: „Siehst du? Du bist nicht mehr allein in diesem Kampf.“'),
    t('Die Ruhe vor dem Sturm', 'Zwei Tage lang zeigt sich {gegner} gar nicht. Zu ruhig. {verbuendeter} schläft mit offenen Augen. „{Er} sammelt Kraft. Und wir auch.“'),
    t('Das Ende der Woche', 'Am Ende der Woche steht ihr beide auf dem Hügel und seht zurück. Was auch passiert ist: Du bist nicht mehr derselbe Mensch wie am Montag. {verbuendeter} zeigt in die Ferne. „Da drüben wartet etwas, das größer ist als {gegner}.“')
  ] }
};

// Mikroquests: feste IDs, damit Haken beim Ändern der Texte nicht verrutschen.
export const MIKRO_JE_TAG = 3;
export const MIKRO = {
  gesundheit: [
    ['g-wasser', 'Ein großes Glas Wasser trinken'], ['g-gehen', '10 Minuten spazieren gehen'], ['g-obst', 'Obst statt Süßem als Snack'],
    ['g-treppe', 'Treppe statt Lift nehmen'], ['g-dehnen', '5 Minuten dehnen'], ['g-mahlzeit', 'Eine Mahlzeit ohne Bildschirm essen'],
    ['g-bett', 'Vor 23 Uhr im Bett sein'], ['g-regal', 'Beim Einkaufen am Süßigkeitenregal vorbeigehen']
  ],
  familie: [
    ['f-kompliment', 'Jemandem aus der Familie ein ehrliches Kompliment machen'], ['f-zuhoeren', '10 Minuten ungestört zuhören, ohne Handy'],
    ['f-ueberraschung', 'Eine kleine Überraschung vorbereiten'], ['f-essen', 'Ein gemeinsames Essen ohne Bildschirm'],
    ['f-danke', '„Danke“ für etwas Alltägliches sagen'], ['f-wochenende', 'Eine Idee für das Wochenende vorschlagen'],
    ['f-foto', 'Ein Foto von einem schönen Moment machen'], ['f-umarmung', 'Eine Umarmung mehr als sonst']
  ],
  fokus: [
    ['k-wichtig', 'Die wichtigste Aufgabe des Tages aufschreiben'], ['k-25', '25 Minuten an einer Sache arbeiten, Handy weg'],
    ['k-tisch', 'Den Schreibtisch 5 Minuten aufräumen'], ['k-klein', 'Eine aufgeschobene Kleinigkeit erledigen'],
    ['k-stumm', 'Benachrichtigungen für 2 Stunden ausschalten'], ['k-morgen', 'Morgen schon heute planen (3 Punkte)'],
    ['k-sofort', 'Eine Nachricht sofort beantworten statt später'], ['k-tab', 'Einen Tab schließen, den du nicht brauchst']
  ],
  finanzen: [
    ['n-notieren', 'Eine Ausgabe von heute notieren'], ['n-merkliste', 'Einen Spontankauf auf die Merkliste statt in den Warenkorb'],
    ['n-abo', 'Ein Abo prüfen: Brauche ich es noch?'], ['n-beiseite', 'Einen kleinen Betrag zur Seite legen'],
    ['n-konto', 'Den Kontostand ansehen, ohne zu bewerten'], ['n-mittag', 'Mittagessen mitnehmen statt kaufen'],
    ['n-preis', 'Einen Preis vergleichen, bevor du kaufst'], ['n-verkaufen', 'Eine Sache verkaufen oder verschenken, die du nicht nutzt']
  ],
  lebensfreude: [
    ['l-spass', '10 Minuten etwas tun, nur weil es Spaß macht'], ['l-lied', 'Ein Lied laut hören'],
    ['l-schreiben', 'Jemandem schreiben, an den du gerade denkst'], ['l-neu', 'Etwas Neues ausprobieren, auch winzig'],
    ['l-draussen', '5 Minuten draußen sein und bewusst atmen'], ['l-drei', 'Drei Dinge aufschreiben, die heute gut waren'],
    ['l-hobby', 'Ein altes Hobby für 10 Minuten aufnehmen'], ['l-ort', 'Einen Ort besuchen, an dem du länger nicht warst']
  ]
};
export const MIKRO_RUECKFALL = 'lebensfreude';
