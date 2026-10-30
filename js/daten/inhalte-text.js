// ERZEUGT aus claude/inhalte.md (30.10.2026, 11:11) mit claude/werkzeuge/inhalte-uebernehmen.mjs – nicht von Hand ändern.
// Texte ändern: in der Markdown-Datei, dann „Geschichten übernehmen“. Einstellungen (Anzahl je Tag, Rückfall) stehen in inhalte.js.

export const BOTSCHAFTEN = [
  {
    "anlass": "erster_tag",
    "texte": [
      "{Gegner} und ich kennen uns schon lange. Heute zeige ich dir, wie wir {ihn} packen.",
      "Ein neues Abenteuer! Merk dir nur eines: {faehigkeit}. Den Rest machen wir gemeinsam.",
      "Ich kenne {gegner} besser als jeder andere. {Er} wirkt groß, aber {er} hat eine Schwäche. Wir finden sie zusammen."
    ]
  },
  {
    "anlass": "neuer_gegner",
    "texte": [
      "Kaum liegt der eine am Boden, steht schon der Nächste vor der Tür: {Gegner}. Gleiche Fähigkeit, neuer Kampf.",
      "{Gegner} hat von deinem Sieg gehört und will es jetzt selbst wissen. Wir sind bereit.",
      "Neuer Gegner, alte Stärke: Du weißt jetzt, wie man gewinnt. {Gegner} weiß es noch nicht.",
      "Ich habe {gegner} beobachtet, während du gekämpft hast. {Er} ist anders, aber nicht stärker."
    ]
  },
  {
    "anlass": "besiegt",
    "texte": [
      "{Gegner} liegt am Boden. Ich habe {ihn} noch nie so schnell fallen sehen. Was du dabei gelernt hast, nimmt dir keiner mehr.",
      "Sieg! Merk dir, wie sich das gerade anfühlt. Genau dieses Gefühl nehmen wir in den nächsten Kampf mit.",
      "Ich habe von dir erzählt, unten im Lager. Sie wollten es kaum glauben.",
      "Das war kein Glück. Das warst du, Tag für Tag. Heute darfst du stolz sein."
    ]
  },
  {
    "anlass": "fast",
    "texte": [
      "Noch ein einziges Mal {faehigkeit}, dann fällt {gegner}. Ich kann es schon riechen.",
      "{Gegner} wankt. Ein Treffer noch. Heute vielleicht?",
      "Nur noch ein Treffer. {Gegner} weiß das, und {er} wird nervös.",
      "Ich spüre, dass es kippt. Noch ein Treffer, und {gegner} liegt am Boden."
    ]
  },
  {
    "anlass": "montag_sieg",
    "texte": [
      "Neue Woche, und {gegner} ist zurück. {Er} hat aber gelernt, dass du gefährlich bist.",
      "Letzte Woche hast du gewonnen. {Er} weiß das. Und du auch.",
      "Du hast schon einmal gewonnen. Das kann dir niemand mehr nehmen, auch {gegner} nicht."
    ]
  },
  {
    "anlass": "montag",
    "texte": [
      "Neue Woche, neues Glück. {Gegner} hat nur einen Vorsprung, keinen Sieg.",
      "Was letzte Woche war, zählt nicht mehr gegen dich. Heute fängt eine neue Runde an.",
      "Neue Runde. Ich habe die Karte schon ausgebreitet. Wo wartet {gegner} diesmal?"
    ]
  },
  {
    "anlass": "gestern_ja",
    "texte": [
      "Gestern hast du {faehigkeit} eingesetzt. {Gegner} hat es gespürt, glaub mir.",
      "Das war stark gestern. {n} von {anzahl} diese Woche. Weiter so.",
      "Ich habe gesehen, wie du gestern gehandelt hast, statt einfach zuzugreifen. So fängt es an.",
      "Ein Treffer gestern. {Gegner} hat die Nacht damit verbracht, die Wunde zu lecken.",
      "{n} von {anzahl}. Jeder Haken macht den nächsten leichter, das ist kein Spruch, das ist Übung.",
      "Ich habe heute Morgen allen erzählt, was du gestern geschafft hast. Ein bisschen angeben darf ich.",
      "Gestern hat {faehigkeit} funktioniert. Merk dir, wie es sich angefühlt hat. Das hilft heute."
    ]
  },
  {
    "anlass": "gestern_nein",
    "texte": [
      "Gestern hat sich {gegner} nicht blicken lassen. Ruhige Tage sind auch gute Tage.",
      "Kein Kampf gestern? Dann hattest du Kraft übrig. Die heben wir auf.",
      "Gestern war ruhig. Ich habe die Zeit genutzt und {gegner} ein wenig ausgekundschaftet.",
      "Nicht jeder Tag braucht einen Kampf. Wichtig ist, dass du hingeschaut hast.",
      "Ruhe gestern. {Gegner} sammelt vielleicht Kraft. Wir auch."
    ]
  },
  {
    "anlass": "pause",
    "texte": [
      "Schön, dass du wieder da bist. Wir machen einfach da weiter, wo wir waren.",
      "Ich habe die Stellung gehalten. Kein Problem, jeder Held braucht Pausen.",
      "Ein Tag Pause ist kein Rückschritt. Heute zählt.",
      "Da bist du ja. Ich habe {faehigkeit} schon bereitgelegt. Ein Schritt reicht für heute."
    ]
  },
  {
    "anlass": "sonst",
    "texte": [
      "Kleiner Trick: Je früher du an {faehigkeit} denkst, desto leichter wird es.",
      "{Gegner} mag Müdigkeit und Eile. Wenn du beides bemerkst, sei wachsam.",
      "Du musst nicht perfekt sein. Du musst nur öfter gewinnen als {gegner}.",
      "Sag es dir laut: Ich entscheide, nicht die Gewohnheit.",
      "Heute ist ein guter Tag für einen Treffer. Ich bin bereit, wenn du es bist.",
      "Wenn {gegner} heute auftaucht: kurz anhalten, an {faehigkeit} denken, dann handeln.",
      "Ein kleiner Sieg heute zählt mehr als ein großer Plan für morgen.",
      "Ich frage mich, wo {gegner} sich heute versteckt. Halt die Augen offen."
    ]
  }
];

export const STORIES = {
  "zuckerkobold": {
    "titel": "Die Vorratskammer von {stadtname}",
    "teile": [
      {
        "titel": "Das Knistern",
        "text": "In der Nacht hörst du es zum ersten Mal: ein leises Knistern aus der Vorratskammer von {stadtname}. {verbuendeter} steht schon mit der Laterne an der Tür. „Er ist zurück“, flüstert er. Auf dem Boden liegt eine leere Verpackung, sorgfältig gefaltet, wie eine Botschaft."
      },
      {
        "titel": "Die Spur aus Zucker",
        "text": "Am Morgen zieht sich eine glitzernde Spur durch das ganze Dorf, von Haus zu Haus. „Der Zuckerkobold geht nicht in die Häuser“, sagt {verbuendeter}. „Er wartet, bis man ihn hineinlässt.“ Die Spur endet vor deiner Tür."
      },
      {
        "titel": "Der Teller",
        "text": "{verbuendeter} holt einen alten Holzteller aus seiner Truhe, in den Rand sind Runen geschnitzt. „Mein Großvater hat ihn benutzt. Was auf dem Teller liegt, gehört dir. Was in der Packung bleibt, gehört niemandem.“ Als du den Teller berührst, wird er kurz warm."
      },
      {
        "titel": "Das Flüstern",
        "text": "Am Abend sitzt der Kobold auf dem Fensterbrett. „Nur noch ein Stück“, flüstert er, „du hast es dir verdient.“ Er hat eine angenehme Stimme. Zu angenehm. {verbuendeter} hebt den Kopf: „Hörst du, wie er es macht? Er lobt dich, damit du nicht nachdenkst.“"
      },
      {
        "titel": "Die Falle",
        "text": "Ihr stellt die Packungen in den obersten Schrank, hinter die Mehlsäcke. Der Kobold tobt die halbe Nacht. Am Morgen findet ihr winzige Kratzspuren an der Schranktür, aber sie ist zu. {verbuendeter} grinst zum ersten Mal: „Er ist kleiner, als er tut.“"
      },
      {
        "titel": "Der Ruf",
        "text": "Aus dem Nachbardorf kommt eine Botin: Auch dort wurde der Kobold gesehen, aber dort ist er riesig geworden, so groß wie ein Fass. „Er wächst, wo niemand ihn bemerkt“, sagt {verbuendeter} leise. „Bei dir schrumpft er.“ Er sieht dich lange an. „Bist du bereit für mehr?“"
      },
      {
        "titel": "Die Entscheidung",
        "text": "Am letzten Abend der Woche steht der Kobold mitten in der Küche und schaut dich direkt an. Kein Flüstern mehr, nur Warten. Du nimmst den Teller. {verbuendeter} nickt. Was dann passiert, erzählt man sich in {stadtname} noch lange – und nächste Woche erfährst du, warum der Kobold nicht allein gekommen ist."
      }
    ]
  },
  "gaehnor": {
    "titel": "Der Nebel über dem Pfad",
    "teile": [
      {
        "titel": "Der Nebel",
        "text": "Über dem Pfad aus dem Dorf liegt seit Tagen ein grauer Nebel. Wer hineingeht, wird müde und setzt sich nach drei Schritten wieder hin. {verbuendeter} zeigt auf eine Gestalt im Dunst, die laut gähnt. „Gähnor“, sagt er. „Er hat noch nie einen Kampf verloren, weil nie jemand angefangen hat.“"
      },
      {
        "titel": "Die Schuhe",
        "text": "{verbuendeter} stellt dir ein Paar Stiefel vor die Tür. „Du musst nicht wandern“, sagt er. „Zieh sie nur an.“ Kaum sind sie an den Füßen, lichtet sich der Nebel einen Schritt weit."
      },
      {
        "titel": "Zwei Minuten",
        "text": "Ihr geht hinaus, nur zwei Minuten, wie abgemacht. Gähnor sitzt am Wegrand und schaut verwirrt. „Ihr wolltet doch morgen“, murmelt er. Als ihr umkehrt, ist der Nebel hinter euch dünner geworden."
      },
      {
        "titel": "Das Sofa",
        "text": "Am Abend ruft Gähnor dich mit warmer Stimme: „Bleib liegen, du hattest einen langen Tag.“ {verbuendeter} lacht leise. „Er hat recht, du hattest einen langen Tag. Gerade deshalb tun zwei Minuten gut.“"
      },
      {
        "titel": "Die Spuren",
        "text": "Am Morgen siehst du Fußspuren im taufeuchten Gras: deine eigenen, von den letzten Tagen. Sie bilden einen kleinen Pfad. „So entstehen Wege“, sagt {verbuendeter}."
      },
      {
        "titel": "Der Riese wird klein",
        "text": "Gähnor ist geschrumpft, er reicht dir jetzt nur noch bis zum Knie. Er gähnt trotzdem, aber niemand setzt sich mehr hin. „Er lebt vom Warten“, sagt {verbuendeter}. „Und du wartest nicht mehr.“"
      },
      {
        "titel": "Der klare Morgen",
        "text": "Zum ersten Mal seit Wochen siehst du die Berge hinter dem Dorf. Gähnor hockt beleidigt auf einem Stein. „Ich komme wieder“, murmelt er. „Gut“, antwortest du. „Dann weißt du, wo du mich findest.“"
      }
    ]
  },
  "nachtschwaermer": {
    "titel": "Die Laterne, die nie ausgeht",
    "teile": [
      {
        "titel": "Das Licht im Fenster",
        "text": "Jede Nacht brennt in deinem Fenster ein bläuliches Licht, lange nachdem alle anderen schlafen. {verbuendeter} klopft leise an. „Der Nachtschwärmer ist bei dir eingezogen“, sagt er. „Er liebt Licht, das nie ausgeht.“"
      },
      {
        "titel": "Nur noch eine",
        "text": "Der Nachtschwärmer sitzt auf deiner Bettkante und flüstert: „Nur noch eine Folge, nur noch eine Nachricht.“ Er klingt freundlich. {verbuendeter} gähnt im Türrahmen. „Er sagt das jede Nacht. Zähl mal mit.“"
      },
      {
        "titel": "Der Korb vor der Tür",
        "text": "{verbuendeter} stellt einen Korb vor dein Schlafzimmer. „Was leuchtet, schläft hier draußen“, sagt er. Du legst das Leuchtende hinein, und im Zimmer wird es zum ersten Mal richtig dunkel."
      },
      {
        "titel": "Die Stille",
        "text": "Ohne Licht ist es merkwürdig still. Du hörst den Wind, dann deinen Atem. Draußen vor der Tür hörst du den Nachtschwärmer leise schimpfen."
      },
      {
        "titel": "Der Morgen danach",
        "text": "Du wachst auf, bevor der Hahn kräht, und fühlst dich wie nach einem langen Urlaub. {verbuendeter} sitzt schon am Tisch. „So sieht ein Held aus, der geschlafen hat“, sagt er."
      },
      {
        "titel": "Die List",
        "text": "Der Nachtschwärmer versucht es heute anders: „Du musst noch kurz etwas nachsehen, es ist wichtig.“ Du hältst inne. Nichts davon ist wichtiger als der Schlaf, und das weißt du jetzt."
      },
      {
        "titel": "Das dunkle Fenster",
        "text": "Heute brennt in deinem Fenster kein Licht. Der Nachtschwärmer flattert ratlos ums Haus und zieht schließlich weiter. {verbuendeter} flüstert: „Er wird wiederkommen. Aber du kennst jetzt den Korb.“"
      }
    ]
  },
  "heisshunger": {
    "titel": "Das Knurren im Gebirge",
    "teile": [
      {
        "titel": "Das Knurren",
        "text": "Aus den Bergen kommt ein dumpfes Knurren, immer dann, wenn du müde oder gestresst bist. „Das ist der Heißhunger“, sagt {verbuendeter}. „Er frisst nicht viel. Er frisst nur schnell.“"
      },
      {
        "titel": "Die Quelle",
        "text": "{verbuendeter} führt dich zu einer klaren Quelle am Dorfrand. „Bevor du entscheidest, trink“, sagt er. Du trinkst, und das Knurren in den Bergen wird für einen Moment leiser."
      },
      {
        "titel": "Fünf Minuten",
        "text": "Der Heißhunger stürmt heran, du hältst die Hand hoch: „Fünf Minuten.“ Er bleibt verdutzt stehen, schnaubt und wartet. Nach fünf Minuten ist er nur noch halb so groß."
      },
      {
        "titel": "Die Verkleidung",
        "text": "Heute kommt der Heißhunger verkleidet als Langeweile. Fast hättest du ihn hereingelassen. „Er hat viele Kostüme“, sagt {verbuendeter}. „Aber er kann nicht gut warten.“"
      },
      {
        "titel": "Der Markt",
        "text": "Auf dem Markt duftet es nach frischem Brot. Du kaufst, was du brauchst, und gehst weiter. Hinter dir hörst du ein enttäuschtes Knurren."
      },
      {
        "titel": "Die Frage",
        "text": "{verbuendeter} fragt dich: „Hattest du Hunger, oder warst du müde?“ Du denkst nach, und zum ersten Mal kennst du die Antwort. Der Heißhunger zieht sich in die Berge zurück."
      },
      {
        "titel": "Der stille Gipfel",
        "text": "Heute bleibt es in den Bergen ruhig. Du sitzt mit {verbuendeter} vor dem Haus und isst in Ruhe, ohne Eile. „Er ist nicht weg“, sagt er. „Aber er hat jetzt Respekt vor dir.“"
      }
    ]
  },
  "hetzra": {
    "titel": "Die gestohlenen Abende",
    "teile": [
      {
        "titel": "Die leeren Abende",
        "text": "Jeden Abend verschwinden Stunden, als hätte jemand sie gestohlen. {verbuendeter} zeigt auf eine flinke Gestalt, die mit einem Sack voller Uhren über die Dächer rennt. „Hetzra“, sagt sie. „Sie nimmt euch die Zeit, bevor ihr sie bemerkt.“"
      },
      {
        "titel": "Das Buch der Tage",
        "text": "{verbuendeter} legt ein großes Buch auf den Tisch. „Was hier eingetragen ist, kann sie nicht stehlen.“ Ihr schreibt einen Abend hinein, nur für euch zwei."
      },
      {
        "titel": "Hetzras Angebot",
        "text": "Hetzra klopft und bietet dir etwas an: „Ich mache dir Platz für etwas Wichtigeres.“ Du schaust ins Buch. Wichtiger als euer Abend? {verbuendeter} schließt ihr freundlich die Tür vor der Nase."
      },
      {
        "titel": "Der Abend",
        "text": "Der eingetragene Abend kommt, und Hetzra steht wütend vor dem Fenster, kann aber nicht hinein. Drinnen redet ihr, lacht, und die Uhr bleibt erstaunlich langsam."
      },
      {
        "titel": "Die Rückkehr der Stunden",
        "text": "Am nächsten Morgen findet ihr vor der Tür ein paar Uhren, die aus Hetzras Sack gefallen sind. „Sie verliert, wenn ihr plant“, sagt {verbuendeter}."
      },
      {
        "titel": "Der Sturm",
        "text": "Eine volle Woche zieht auf, Termine prasseln wie Hagel. Hetzra lacht vom Dach. Doch im Buch steht euer Abend, schwarz auf weiß, und er bleibt."
      },
      {
        "titel": "Die Uhr auf dem Tisch",
        "text": "Ihr stellt eine der geretteten Uhren auf den Tisch, als Erinnerung. Hetzra rennt weiter über die Dächer, aber euer Haus macht sie nervös. {verbuendeter} lächelt: „Nächste Woche tragen wir zwei Abende ein.“"
      }
    ]
  },
  "langeweile": {
    "titel": "Das Ideenglas",
    "teile": [
      {
        "titel": "Der graue Schleier",
        "text": "An manchen Nachmittagen legt sich ein grauer Schleier über das Haus, und niemand weiß, was zu tun ist. Die Kinder starren auf Bildschirme. {verbuendeter} flüstert: „Der Graue Nachmittag ist da.“"
      },
      {
        "titel": "Das leere Glas",
        "text": "{verbuendeter} stellt ein großes leeres Glas auf den Küchentisch. „Jeder schreibt eine Idee auf.“ Bald liegen bunte Zettel darin: Höhle bauen, Schatzsuche, Pfannkuchen-Wettbewerb."
      },
      {
        "titel": "Der erste Zug",
        "text": "Der Graue Nachmittag schleicht herein, du greifst ins Glas. „Deckenburg“, steht auf dem Zettel. Zehn Minuten später ist das Wohnzimmer eine Festung, und der Schleier hat ein Loch."
      },
      {
        "titel": "Das Murren",
        "text": "Heute murren die Kinder: „Keine Lust.“ Du ziehst trotzdem einen Zettel und fängst einfach an. Nach einer Weile kommen sie, einer nach dem anderen."
      },
      {
        "titel": "Neue Zettel",
        "text": "Die Kinder werfen heimlich eigene Ideen ins Glas. Manche sind sehr seltsam, alle sind großartig. {verbuendeter} lacht: „Jetzt wird das Glas stärker als der Nachmittag.“"
      },
      {
        "titel": "Draußen",
        "text": "Ein Zettel schickt euch hinaus in den Regen, Pfützen messen. Der Graue Nachmittag bleibt drinnen und weiß nicht, wohin."
      },
      {
        "titel": "Das volle Glas",
        "text": "Am Ende der Woche ist das Glas voller als am Anfang. Der Graue Nachmittag kommt seltener und geht schneller. {verbuendeter} hält einen Zettel hoch, den du nicht kennst: „Großes Abenteuer.“ Er wandert zurück ins Glas. „Nächste Woche.“"
      }
    ]
  },
  "aufschieberitis": {
    "titel": "Der Berg, der wächst",
    "teile": [
      {
        "titel": "Der Berg",
        "text": "Hinter deinem Haus steht ein Berg aus unerledigten Dingen, jeden Tag ein Stück höher. Auf dem Gipfel sitzt die Aufschieberitis und winkt. „Morgen“, ruft sie. „Morgen ist alles leichter.“"
      },
      {
        "titel": "Der Kieselstein",
        "text": "{verbuendeter} gibt dir keinen Spaten, sondern einen einzigen Kieselstein. „Trag nur diesen hinunter.“ Du trägst ihn, und der Berg ist ein winziges Stück kleiner."
      },
      {
        "titel": "Der zweite Stein",
        "text": "Mit dem ersten Stein in der Hand fällt der zweite leichter. Plötzlich hast du zehn getragen. Die Aufschieberitis rutscht auf dem Gipfel unruhig hin und her."
      },
      {
        "titel": "Die große Aufgabe",
        "text": "Heute wartet ein riesiger Brocken. Die Aufschieberitis lacht: „Den schaffst du nie.“ {verbuendeter} zeigt auf eine kleine Ecke des Brockens. „Dann fang hier an.“"
      },
      {
        "titel": "Das Werkzeug",
        "text": "Du schreibst den kleinsten ersten Schritt auf ein Stück Rinde und nagelst es an die Tür. Jeden Morgen weißt du nun, wo du anfängst. Die Aufschieberitis hasst diese Rinde."
      },
      {
        "titel": "Die Flucht",
        "text": "Die Aufschieberitis versucht dich mit Dringendem abzulenken, das nicht wichtig ist. Du lächelst und trägst weiter. „Du lernst schnell“, sagt {verbuendeter}."
      },
      {
        "titel": "Der Ausblick",
        "text": "Der Berg ist nur noch ein Hügel, und du kannst darüber hinwegsehen. Die Aufschieberitis sitzt jetzt viel tiefer. „Sie geht nie ganz“, sagt {verbuendeter}. „Aber von hier oben sieht sie klein aus.“"
      }
    ]
  },
  "irrlicht": {
    "titel": "Das Licht im Moor",
    "teile": [
      {
        "titel": "Das Irrlicht",
        "text": "Wann immer du dich konzentrierst, tanzt ein kleines Licht am Rand deines Blicks. Folgst du ihm, findest du dich eine halbe Stunde später im Moor wieder. „Das Handy-Irrlicht“, sagt {verbuendeter}. „Es lockt, aber es führt nirgendwo hin.“"
      },
      {
        "titel": "Die Kiste",
        "text": "{verbuendeter} baut dir eine kleine Kiste mit Deckel. „Was leuchtet, kommt hier hinein, im anderen Zimmer.“ Als der Deckel zu ist, wird es im Raum erstaunlich ruhig."
      },
      {
        "titel": "Fünfundzwanzig Minuten",
        "text": "Ihr stellt eine Sanduhr auf. Fünfundzwanzig Minuten lang arbeitest du an einer Sache, nur an einer. Das Irrlicht klopft gegen die Kiste, aber der Deckel hält."
      },
      {
        "titel": "Die Pause",
        "text": "Als der Sand durch ist, darfst du die Kiste öffnen. Das Irrlicht leuchtet, aber jetzt bist du es, der entscheidet. {verbuendeter} nickt: „So rum ist es richtig.“"
      },
      {
        "titel": "Das Flackern",
        "text": "Heute flackert das Irrlicht besonders hell, es ruft mit tausend kleinen Neuigkeiten. Du hörst es und arbeitest weiter. Es wird kleiner, wenn man es nicht beachtet."
      },
      {
        "titel": "Der Weg durchs Moor",
        "text": "Du merkst, wie viel du schaffst, wenn das Licht schläft. Wo früher Moor war, ist jetzt ein fester Pfad. {verbuendeter} geht ihn mit dir ab."
      },
      {
        "titel": "Das stille Moor",
        "text": "Am Ende der Woche liegt das Moor ruhig da. Das Irrlicht glimmt nur noch schwach in seiner Kiste. „Es braucht dich mehr als du es“, sagt {verbuendeter}. „Vergiss das nicht.“"
      }
    ]
  },
  "kaufrausch": {
    "titel": "Der Händler um Mitternacht",
    "teile": [
      {
        "titel": "Der Händler",
        "text": "Um Mitternacht klopft ein Händler mit glänzendem Wagen an deine Tür. „Nur heute“, flüstert er, „nur für dich.“ {verbuendeter} kneift die Augen zusammen. „Das ist der Kaufrausch. Er hat jeden Tag ‚nur heute‘.“"
      },
      {
        "titel": "Die Merkliste",
        "text": "{verbuendeter} gibt dir ein kleines Buch. „Was du willst, schreibst du hier hinein. Morgen entscheidest du.“ Der Händler runzelt die Stirn."
      },
      {
        "titel": "Der Morgen danach",
        "text": "Am Morgen liest du die Liste. Die Hälfte davon willst du gar nicht mehr. Der Händler steht an der Ecke und schaut beleidigt weg."
      },
      {
        "titel": "Das glänzende Ding",
        "text": "Heute bietet der Kaufrausch etwas wirklich Schönes an. Du schreibst es auf. Morgen willst du es immer noch, und dann kaufst du es, ruhig und ohne Eile."
      },
      {
        "titel": "Der schwere Beutel",
        "text": "Dein Geldbeutel ist schwerer als sonst am Ende der Woche. {verbuendeter} wiegt ihn in der Hand. „Gold, das bleibt, statt Gold, das rennt.“"
      },
      {
        "titel": "Die Falle",
        "text": "Der Händler versucht es mit „Nur noch drei Stück!“. Du lachst laut. Er packt seinen Wagen ein und rollt ein paar Häuser weiter."
      },
      {
        "titel": "Der leere Wagen",
        "text": "Um Mitternacht klopft niemand mehr. Auf der Straße steht der Wagen des Händlers, halb leer. „Er wird wiederkommen“, sagt {verbuendeter}. „Aber du hast jetzt ein Buch.“"
      }
    ]
  },
  "geldfresser": {
    "titel": "Das Loch in der Truhe",
    "teile": [
      {
        "titel": "Die leere Truhe",
        "text": "Am Ende jedes Monats ist deine Truhe leer, und du weißt nicht, wohin das Gold verschwunden ist. Nachts hörst du ein leises Schmatzen. „Der Geldfresser“, sagt {verbuendeter}. „Er nimmt, was übrig bleibt.“"
      },
      {
        "titel": "Die zweite Truhe",
        "text": "{verbuendeter} stellt eine zweite, kleinere Truhe mit schwerem Schloss neben die erste. „Wenn Gold hereinkommt, geht zuerst ein Teil hier hinein. Dann bleibt für ihn nichts übrig.“"
      },
      {
        "titel": "Der erste Taler",
        "text": "Du legst den ersten Taler in die kleine Truhe, es klingt wunderbar. Der Geldfresser schnuppert daran, aber das Schloss hält."
      },
      {
        "titel": "Der Hunger",
        "text": "Der Geldfresser wird hungrig und versucht es an der großen Truhe. Dort findet er weniger als sonst. Er knurrt und schleicht davon."
      },
      {
        "titel": "Das Klingen",
        "text": "Jeden Abend hörst du nun das Klingen in der kleinen Truhe, wenn du sie schüttelst. „Das ist das schönste Geräusch im ganzen Dorf“, sagt {verbuendeter}."
      },
      {
        "titel": "Der Notfall",
        "text": "Ein Rad am Karren bricht, und zum ersten Mal ist Geld dafür da. Du musst nichts leihen. {verbuendeter} klopft auf die kleine Truhe: „Dafür ist sie da.“"
      },
      {
        "titel": "Die volle Truhe",
        "text": "Die kleine Truhe ist schwerer geworden. Der Geldfresser sitzt hungrig vor dem Haus und blickt neidisch hinein. „Er bleibt dünn, solange du zuerst sparst“, sagt {verbuendeter}."
      }
    ]
  },
  "leere": {
    "titel": "Der Abend ohne Farbe",
    "teile": [
      {
        "titel": "Der farblose Abend",
        "text": "Manche Abende verlieren ihre Farbe. Alles wird grau, und du scrollst, ohne etwas zu sehen. {verbuendeter} sitzt neben dir. „Die Leere ist da. Sie wartet, bis dir nichts einfällt.“"
      },
      {
        "titel": "Die kleine Liste",
        "text": "{verbuendeter} gibt dir ein Stück Papier. „Schreib fünf Dinge auf, die dir früher Freude gemacht haben.“ Es dauert, dann fallen dir sieben ein."
      },
      {
        "titel": "Die erste Farbe",
        "text": "Als die Leere heute kommt, nimmst du die Liste und wählst: zeichnen. Nach zehn Minuten ist an der Wand ein kleiner Fleck Farbe zurück."
      },
      {
        "titel": "Der Widerstand",
        "text": "Heute flüstert die Leere: „Das bringt doch nichts.“ Du fängst trotzdem an, nur fünf Minuten. Am Ende werden es vierzig."
      },
      {
        "titel": "Neue Einträge",
        "text": "Du ergänzt die Liste um Dinge, die du nie probiert hast. {verbuendeter} liest mit und lacht über einen Eintrag. „Den machen wir zusammen.“"
      },
      {
        "titel": "Der bunte Raum",
        "text": "Dein Zimmer bekommt nach und nach Farbe zurück: ein Buch, ein Lied, ein angefangenes Bild. Die Leere sitzt in der Ecke und hat weniger Platz."
      },
      {
        "titel": "Das Leuchten",
        "text": "Am Ende der Woche brennt ein warmes Licht in deinem Fenster. Die Leere schaut von draußen hinein. „Sie verschwindet nicht“, sagt {verbuendeter}. „Aber deine Liste ist jetzt größer als sie.“"
      }
    ]
  },
  "einsiedler": {
    "titel": "Die verwachsene Brücke",
    "teile": [
      {
        "titel": "Die Brücke",
        "text": "Zwischen deinem Haus und den Häusern deiner Freunde führt eine alte Brücke, inzwischen von Ranken überwuchert. Auf ihr sitzt der Einsiedler. „Die anderen melden sich schon“, brummt er. „Warte einfach.“"
      },
      {
        "titel": "Der erste Brief",
        "text": "{verbuendeter} gibt dir eine Feder. „Schreib eine Zeile, jetzt gleich.“ Du schickst sie los, und auf der Brücke welkt eine Ranke."
      },
      {
        "titel": "Die Antwort",
        "text": "Am Abend kommt eine Antwort zurück, schneller als gedacht. „Schön, von dir zu hören!“, steht darin. Der Einsiedler tut so, als hätte er nichts gesehen."
      },
      {
        "titel": "Der Vorschlag",
        "text": "Heute schreibst du nicht nur „Wie geht's?“, sondern: „Kaffee am Samstag?“ {verbuendeter} klatscht in die Hände. „Konkret ist stärker als freundlich.“"
      },
      {
        "titel": "Das Treffen",
        "text": "Ihr sitzt zusammen und lacht über alte Geschichten. Auf dem Heimweg ist die Brücke breiter, die Ranken sind fast weg."
      },
      {
        "titel": "Der Rückzug",
        "text": "Der Einsiedler versucht es mit Müdigkeit: „Heute nicht, nächste Woche.“ Du schickst trotzdem eine kurze Nachricht. Kleine Fäden halten große Brücken."
      },
      {
        "titel": "Die freie Brücke",
        "text": "Am Ende der Woche ist die Brücke frei, und auf der anderen Seite winkt jemand. Der Einsiedler sitzt jetzt am Ufer statt in der Mitte. „Er war nie stark“, sagt {verbuendeter}. „Nur geduldig.“"
      }
    ]
  },
  "trott": {
    "titel": "Die ausgetretenen Pfade",
    "teile": [
      {
        "titel": "Die Rillen",
        "text": "Im Boden vor deinem Haus sind tiefe Rillen, ausgetreten von Jahren derselben Schritte. In ihnen sitzt der alte Trott und lächelt. „Warum etwas ändern?“, fragt er. „Es geht doch auch so.“"
      },
      {
        "titel": "Ein Schritt daneben",
        "text": "{verbuendeter} zeigt dir eine Stelle neben den Rillen. „Nur ein Schritt.“ Du setzt den Fuß daneben, und es fühlt sich ungewohnt an, aber gut."
      },
      {
        "titel": "Der neue Abdruck",
        "text": "Am nächsten Morgen siehst du deinen Fußabdruck neben der Rille, frisch und klar. Der alte Trott schaut ihn misstrauisch an."
      },
      {
        "titel": "Die Bequemlichkeit",
        "text": "Heute ist alles anstrengend, und die Rillen locken. Du machst trotzdem den einen Schritt daneben. „Es geht nicht um große Sprünge“, sagt {verbuendeter}. „Es geht um die Richtung.“"
      },
      {
        "titel": "Der Pfad",
        "text": "Deine neuen Abdrücke bilden langsam einen eigenen Weg. Er führt irgendwohin, wo du noch nie warst. {verbuendeter} geht ihn neugierig mit."
      },
      {
        "titel": "Der Einwand",
        "text": "Der alte Trott erinnert dich an alle Male, die es nicht geklappt hat. Du hörst zu, nickst und gehst weiter. Diesmal ist es anders, weil du klein anfängst."
      },
      {
        "titel": "Zwei Wege",
        "text": "Am Ende der Woche gibt es vor deinem Haus zwei Wege: die alten Rillen und deinen neuen Pfad. Der alte Trott sitzt noch in seinen Rillen. „Er bleibt dort“, sagt {verbuendeter}. „Du nicht.“"
      }
    ]
  },
  "drycha": {
    "titel": "Die verbrannte Linie",
    "teile": [
      {
        "titel": "Die verbrannte Linie",
        "vorschau": "Vor deiner Tür riecht es nach Rauch.",
        "text": {
          "ja": "Am Morgen ist der Boden vor deiner Tür verkohlt, eine dünne Linie, noch warm. {verbuendeter} kniet sich hin und wird still. „{Gegner}“, kommt es leise. Dann ein langer, prüfender Blick zu dir. „{Er} hat nicht dich gesucht. {Er} hat etwas mitgenommen.“",
          "nein": "Ein ruhiger Tag. Erst am Abend bemerkst du die verkohlte Linie vor deiner Tür, längst kalt. {verbuendeter} fährt mit dem Finger darüber. „{Gegner} war hier, während alles still war. {Er} hat etwas mitgenommen.“"
        }
      },
      {
        "titel": "Das Fehlende",
        "vorschau": "Was hat {gegner} mitgenommen?",
        "text": {
          "ja": "Du gehst durchs Haus und suchst. Alles ist da, und doch fehlt etwas. Dann merkst du es: Das Lachen ist leiser geworden, als läge eine Decke darüber. Heute, als du {faehigkeit} gewirkt hast, kam ein kleines Stück davon zurück. {verbuendeter} hat es auch gehört.",
          "nein": "Du gehst durchs Haus und suchst. Alles ist da, und doch fehlt etwas: Das Lachen klingt gedämpft, als käme es aus einem anderen Raum. {verbuendeter} schreibt etwas in ein kleines Buch und klappt es schnell zu, als du hinsiehst."
        }
      },
      {
        "titel": "Das Zeichen",
        "vorschau": "Im Holz der Schwelle steckt etwas.",
        "text": {
          "ja": "Im verkohlten Holz der Schwelle steckt ein Splitter. Darauf ein Zeichen: zwei Flammen, die sich umschlingen. {verbuendeter} wird blass. Dasselbe Zeichen ist in den eigenen Stab geschnitzt, halb abgeschliffen. „Frag nicht“, kommt es leise. „Noch nicht.“",
          "nein": "Beim Fegen der Schwelle findest du einen Splitter mit einem eingebrannten Zeichen: zwei verschlungene Flammen. Als du ihn {verbuendeter} zeigst, verschwindet er wortlos in einer Tasche. Später siehst du dasselbe Zeichen am Stab von {verbuendeter}, fast abgeschliffen."
        }
      },
      {
        "titel": "Mitten am Tag",
        "vorschau": "{Gegner} wartet nicht mehr auf die Nacht.",
        "text": {
          "ja": "Diesmal kommt {gegner} am helllichten Tag, in einem müden Moment. Du spürst die Hitze im Nacken, den Funken, der überspringen will. Du bleibst stehen. {faehigkeit}. Der Funke findet nichts, woran er sich festhalten kann. Hinter dir zischt etwas, wütend und überrascht.",
          "nein": "Heute bleibt es still, fast zu still. {verbuendeter} sitzt am Fenster und lässt die Straße nicht aus den Augen. „{Er} hat gemerkt, dass die Nacht nicht reicht. Wenn {er} wiederkommt, dann mitten am Tag. Dann, wenn du müde bist.“"
        }
      },
      {
        "titel": "Worte aus Asche",
        "vorschau": "Jemand hat dir eine Nachricht hinterlassen.",
        "text": {
          "ja": "Auf dem Tisch liegt Asche, zu Buchstaben geformt: DU KANNST ES NICHT FÜR IMMER. Dein Herz schlägt schneller. Dann siehst du, dass ein Buchstabe fehlt, weggeweht, als hätte die Asche selbst gezögert. {verbuendeter} liest mit und lächelt zum ersten Mal in dieser Woche. „{Er} hat Angst.“",
          "nein": "Auf dem Tisch liegt Asche, zu Buchstaben geformt: DU KANNST ES NICHT FÜR IMMER. {verbuendeter} betrachtet sie lange. Dann öffnet sich das Fenster, und ein Luftzug trägt die Worte hinaus. Nur das Wort NICHT bleibt liegen, als wollte es nicht gehen."
        }
      },
      {
        "titel": "Der alte Name",
        "vorschau": "{verbuendeter} kennt {gegner}. Schon sehr lange.",
        "text": {
          "ja": "Am Feuer bricht {verbuendeter} das Schweigen. „Früher hat {gegner} gewacht, so wie ich. {Er} hat die Menschen beschützt, mit aller Kraft und ohne Pause. Aber Kraft, die nie zur Ruhe kommt, wird irgendwann zu Feuer.“ Du verstehst plötzlich, warum {gegner} ausgerechnet dich gefunden hat.",
          "nein": "In der Nacht hörst du {verbuendeter} im Schlaf einen Namen murmeln. Nicht {gegner}, sondern einen anderen, älteren Namen. Am Morgen fragst du nach. Lange keine Antwort. Dann: „So hieß {er}, bevor das Feuer kam.“"
        }
      },
      {
        "titel": "Der verschlossene Raum",
        "vorschau": "Eine Tür in deinem Haus ging die ganze Woche nicht auf.",
        "text": {
          "ja": "Hinter der Tür, die nie klemmte und diese Woche nicht aufging, liegt das Fehlende: das Lachen, die leisen Abende, gesammelt wie Glut in einer Schale. Jeder Tag, an dem du dich gestellt hast, hat ein Stück davon zurückgebracht. Als du die Schale hebst, ist sie warm, nicht heiß. Draußen tritt jemand auf die verbrannte Linie und bleibt stehen. Es ist nicht {gegner}. Die Schritte sind ungeduldiger.",
          "nein": "Die Tür, die die ganze Woche klemmte, gibt nach. Dahinter eine Schale voller Glut, warm, nicht heiß. Weniger, als du gehofft hast, aber genug, um zu sehen: Es kommt zurück. Draußen gehen ungeduldige Schritte auf und ab. Jemand klopft auf eine Uhr."
        }
      }
    ]
  },
  "_allgemein": {
    "titel": "Das Kräftemessen",
    "teile": [
      {
        "titel": "Die Linie",
        "text": "Über Nacht hat jemand eine Linie vor deine Tür gezogen, und dahinter wartet {gegner}. {verbuendeter} geht in die Hocke und betrachtet sie. „{Er} will wissen, wie ernst du es meinst. Sieben Tage, dann wissen wir es beide.“ Als du aufschaust, ist {gegner} verschwunden. Nur die Linie bleibt."
      },
      {
        "titel": "Der schwache Moment",
        "text": "{verbuendeter} breitet eine Karte deiner Woche aus. „Wann wird es schwer? Wenn du müde bist, hungrig, nach einem langen Tag?“ Du zeigst auf eine Stelle, ohne lange zu überlegen. „Genau dort wartet {er}“, sagt {verbuendeter} und zieht einen Kreis darum. „Und genau dort legen wir {faehigkeit} bereit.“"
      },
      {
        "titel": "Hingeschaut",
        "text": "Ob heute ein guter Tag war oder nicht: Du hast hingeschaut und es eingetragen. {verbuendeter} nickt zufrieden. „Wer zählt, verliert nicht aus Versehen. Wer zählt, lernt.“ In der Nacht hörst du draußen Schritte, die vor deiner Tür kurz stehen bleiben."
      },
      {
        "titel": "Die Verkleidung",
        "text": "Heute kommt {gegner} verkleidet, als kleine Ausnahme mit freundlichem Gesicht: „Nur heute, du hast es dir verdient.“ Fast hättest du genickt. {verbuendeter} hebt eine Augenbraue. „Belohnungen kommen nach dem Sieg, nicht statt ihm.“ Du denkst an {faehigkeit}, und die Maske verrutscht."
      },
      {
        "titel": "Die fremde Spur",
        "text": "Hinter dir liegen deine Einträge dieser Woche wie Abdrücke im Boden. Jeder steht für einen Tag, an dem du dich gestellt hast. {verbuendeter} geht sie ab und zählt leise mit. Dann bleibt {verbuendeter} stehen und zeigt nach unten. Eine der Spuren ist nicht deine."
      },
      {
        "titel": "Der Kreis",
        "text": "Die fremde Spur führt in einem weiten Kreis um deinen Weg. {Gegner} beobachtet dich und sucht die Lücke. „{Er} wartet auf den einen Tag, an dem du aufgibst“, sagt {verbuendeter}. „Also bekommt {er} keinen. Ein kleiner Schritt reicht, auch an einem schlechten Tag.“"
      },
      {
        "titel": "Der Blick zurück",
        "text": "Am Ende der Woche steht ihr auf einer Anhöhe und schaut zurück. Was auch passiert ist: {Gegner} kennt dich jetzt ein wenig, aber du kennst {ihn} besser. {verbuendeter} zeigt in die Ferne, wo sich etwas im Dunst bewegt. „Nächste Woche sehen wir, wer mehr dazugelernt hat.“"
      }
    ]
  }
};

export const MIKRO = {
  "gesundheit": [
    [
      "g-wasser",
      "Ein großes Glas Wasser trinken"
    ],
    [
      "g-gehen",
      "10 Minuten spazieren gehen"
    ],
    [
      "g-obst",
      "Obst statt Süßem als Snack"
    ],
    [
      "g-treppe",
      "Treppe statt Lift nehmen"
    ],
    [
      "g-dehnen",
      "5 Minuten dehnen"
    ],
    [
      "g-mahlzeit",
      "Eine Mahlzeit ohne Bildschirm essen"
    ],
    [
      "g-bett",
      "Vor 23 Uhr im Bett sein"
    ],
    [
      "g-regal",
      "Beim Einkaufen am Süßigkeitenregal vorbeigehen"
    ],
    [
      "g-gemuese",
      "Eine Portion Gemüse mehr essen"
    ],
    [
      "g-stehen",
      "Beim Telefonieren aufstehen und gehen"
    ],
    [
      "g-wasserflasche",
      "Eine Wasserflasche griffbereit hinstellen"
    ],
    [
      "g-strecken",
      "Morgens 2 Minuten strecken"
    ],
    [
      "g-langsam",
      "Eine Mahlzeit bewusst langsam essen"
    ],
    [
      "g-licht",
      "10 Minuten Tageslicht tanken"
    ],
    [
      "g-snack",
      "Einen Snack vorbereiten, statt spontan zu kaufen"
    ]
  ],
  "gelassenheit": [
    [
      "r-atmen",
      "Dreimal lang ausatmen (4 ein, 6 aus)"
    ],
    [
      "r-pause",
      "5 Minuten Pause ohne Handy"
    ],
    [
      "r-gut",
      "Einen Satz aufschreiben, was heute gut gelaufen ist"
    ],
    [
      "r-gefuehl",
      "Ein Gefühl von heute beim Namen nennen"
    ],
    [
      "r-verschieben",
      "Eine Bitte freundlich verschieben statt sofort zusagen"
    ],
    [
      "r-langsam",
      "Eine Sache bewusst langsam machen"
    ],
    [
      "r-gehen",
      "5 Minuten ohne Ziel spazieren gehen"
    ],
    [
      "r-freundlich",
      "Einen freundlichen Satz zu dir selbst sagen"
    ],
    [
      "r-schultern",
      "Die Schultern bewusst sinken lassen"
    ],
    [
      "r-nein",
      "Einmal freundlich Nein sagen"
    ],
    [
      "r-musik",
      "Ein ruhiges Lied in Ruhe anhören"
    ],
    [
      "r-tee",
      "Eine Tasse Tee ohne Ablenkung trinken"
    ],
    [
      "r-sorge",
      "Eine Sorge aufschreiben und das Blatt weglegen"
    ],
    [
      "r-boden",
      "Die Füße auf dem Boden spüren, 30 Sekunden"
    ],
    [
      "r-lob",
      "Dich für eine Kleinigkeit loben"
    ]
  ],
  "familie": [
    [
      "f-kompliment",
      "Jemandem aus der Familie ein ehrliches Kompliment machen"
    ],
    [
      "f-zuhoeren",
      "10 Minuten ungestört zuhören, ohne Handy"
    ],
    [
      "f-ueberraschung",
      "Eine kleine Überraschung vorbereiten"
    ],
    [
      "f-essen",
      "Ein gemeinsames Essen ohne Bildschirm"
    ],
    [
      "f-danke",
      "„Danke“ für etwas Alltägliches sagen"
    ],
    [
      "f-wochenende",
      "Eine Idee für das Wochenende vorschlagen"
    ],
    [
      "f-foto",
      "Ein Foto von einem schönen Moment machen"
    ],
    [
      "f-umarmung",
      "Eine Umarmung mehr als sonst"
    ],
    [
      "f-spiel",
      "10 Minuten gemeinsam spielen"
    ],
    [
      "f-frage",
      "Eine offene Frage stellen: „Was war heute schön?“"
    ],
    [
      "f-zettel",
      "Einen kleinen Zettel mit einem lieben Satz hinterlassen"
    ],
    [
      "f-erinnerung",
      "Gemeinsam an einen schönen Moment erinnern"
    ],
    [
      "f-helfen",
      "Ungefragt bei etwas helfen"
    ],
    [
      "f-spaziergang",
      "Einen kurzen Spaziergang zu zweit machen"
    ],
    [
      "f-lachen",
      "Etwas Lustiges teilen"
    ]
  ],
  "fokus": [
    [
      "k-wichtig",
      "Die wichtigste Aufgabe des Tages aufschreiben"
    ],
    [
      "k-25",
      "25 Minuten an einer Sache arbeiten, Handy weg"
    ],
    [
      "k-tisch",
      "Den Schreibtisch 5 Minuten aufräumen"
    ],
    [
      "k-klein",
      "Eine aufgeschobene Kleinigkeit erledigen"
    ],
    [
      "k-stumm",
      "Benachrichtigungen für 2 Stunden ausschalten"
    ],
    [
      "k-morgen",
      "Morgen schon heute planen (3 Punkte)"
    ],
    [
      "k-sofort",
      "Eine Nachricht sofort beantworten statt später"
    ],
    [
      "k-tab",
      "Einen Tab schließen, den du nicht brauchst"
    ],
    [
      "k-glas",
      "Ein Glas Wasser holen, bevor du anfängst"
    ],
    [
      "k-liste",
      "Eine Sache von der Liste streichen"
    ],
    [
      "k-pause",
      "Nach 25 Minuten bewusst 5 Minuten Pause"
    ],
    [
      "k-mail",
      "Das Postfach einmal auf null bringen oder 10 Minuten sortieren"
    ],
    [
      "k-start",
      "Eine Aufgabe 2 Minuten anfangen, nur anfangen"
    ],
    [
      "k-ablage",
      "Einen Stapel Papiere sortieren"
    ],
    [
      "k-ziel",
      "Für die nächste Stunde ein einziges Ziel setzen"
    ]
  ],
  "finanzen": [
    [
      "n-notieren",
      "Eine Ausgabe von heute notieren"
    ],
    [
      "n-merkliste",
      "Einen Spontankauf auf die Merkliste statt in den Warenkorb"
    ],
    [
      "n-abo",
      "Ein Abo prüfen: Brauche ich es noch?"
    ],
    [
      "n-beiseite",
      "Einen kleinen Betrag zur Seite legen"
    ],
    [
      "n-konto",
      "Den Kontostand ansehen, ohne zu bewerten"
    ],
    [
      "n-mittag",
      "Mittagessen mitnehmen statt kaufen"
    ],
    [
      "n-preis",
      "Einen Preis vergleichen, bevor du kaufst"
    ],
    [
      "n-verkaufen",
      "Eine Sache verkaufen oder verschenken, die du nicht nutzt"
    ],
    [
      "n-wunsch",
      "Einen Wunsch aufschreiben und eine Woche warten"
    ],
    [
      "n-rechnung",
      "Eine offene Rechnung prüfen oder bezahlen"
    ],
    [
      "n-bar",
      "Einen Tag nur mit Bargeld oder festem Betrag auskommen"
    ],
    [
      "n-vergleich",
      "Einen Vertrag (Strom, Handy) auf einen günstigeren prüfen"
    ],
    [
      "n-reste",
      "Aus Resten kochen statt einzukaufen"
    ],
    [
      "n-newsletter",
      "Einen Werbe-Newsletter abbestellen"
    ],
    [
      "n-ziel",
      "Ein Sparziel mit Betrag aufschreiben"
    ]
  ],
  "lebensfreude": [
    [
      "l-spass",
      "10 Minuten etwas tun, nur weil es Spaß macht"
    ],
    [
      "l-lied",
      "Ein Lied laut hören"
    ],
    [
      "l-schreiben",
      "Jemandem schreiben, an den du gerade denkst"
    ],
    [
      "l-neu",
      "Etwas Neues ausprobieren, auch winzig"
    ],
    [
      "l-draussen",
      "5 Minuten draußen sein und bewusst atmen"
    ],
    [
      "l-drei",
      "Drei Dinge aufschreiben, die heute gut waren"
    ],
    [
      "l-hobby",
      "Ein altes Hobby für 10 Minuten aufnehmen"
    ],
    [
      "l-ort",
      "Einen Ort besuchen, an dem du länger nicht warst"
    ],
    [
      "l-kaffee",
      "Einen Kaffee oder Tee draußen trinken"
    ],
    [
      "l-buch",
      "10 Seiten in einem Buch lesen"
    ],
    [
      "l-foto",
      "Ein Foto von etwas Schönem machen"
    ],
    [
      "l-plan",
      "Etwas für das Wochenende planen, das dich freut"
    ],
    [
      "l-tanzen",
      "Zu einem Lied tanzen, auch allein"
    ],
    [
      "l-kochen",
      "Etwas Neues kochen oder backen"
    ],
    [
      "l-danke",
      "Jemandem für etwas danken"
    ]
  ]
};

// Boss-Reaktionen (Version 69): Bedeutung der Arten und Einstellungen in boss-reaktionen.js.
export const BOSS_REAKTIONEN = {
  "_allgemein": {
    "treffer": [
      "{Gegner} taumelt. Dein Treffer sitzt.",
      "Ein Riss geht durch {gegner}. {Er} weicht einen Schritt zurück.",
      "{verbuendeter} nickt dir zu. Diesen Schlag hat {gegner} nicht kommen sehen.",
      "{Gegner} wankt und sucht Halt. {Er} findet keinen.",
      "Ein sauberer Treffer. {Gegner} ist heute schwächer als gestern."
    ],
    "ruhe": [
      "{Gegner} hat sich heute nicht gezeigt. {Er} lauert irgendwo am Rand.",
      "Eine ruhige Runde. {Gegner} sammelt Kraft, und du auch.",
      "Kein Kampf heute. {verbuendeter} hält Wache."
    ],
    "phase": [
      "{Gegner} wird unruhig. {Er} spürt, dass du stärker wirst.",
      "Nur noch ein Rest Kraft. {Gegner} weicht zurück und wird vorsichtig."
    ],
    "morgen": [
      "Ruh dich aus. Irgendwo zieht schon etwas Neues auf. Morgen zeigt es sich.",
      "Der Kampf ist vorbei. Doch in der Ferne wartet schon jemand auf dich."
    ]
  },
  "drycha": {
    "treffer": [
      "{Gegner} taumelt. Dein Atem war schneller als ihr Zorn.",
      "Ein Riss im Feuer. {Gegner} weicht einen Schritt zurück.",
      "Die Flammen werden kleiner. {Gegner} faucht, aber sie trifft nicht.",
      "Zehn ruhige Schläge, ein Treffer. {Gegner} wankt.",
      "Funken fallen zu Boden und verlöschen. Heute hat {gegner} dich nicht entzündet."
    ],
    "ruhe": [
      "Heute keine Glut. {Gegner} schleicht um das Lager und findet keinen Funken.",
      "{Gegner} hat sich nicht gezeigt. Irgendwo knistert es leise.",
      "Ein stiller Tag im Wutwald. {verbuendeter} legt Holz nach, nicht für {gegner}."
    ],
    "phase": [
      "{Gegner} wird unruhig. Ihr Feuer flackert, sie spürt, dass du stärker wirst."
    ],
    "morgen": [
      "Drychas Glut ist erloschen. Doch tiefer im Wutwald knurrt schon etwas Ungeduldiges."
    ]
  },
  "murrgrim": {
    "treffer": [
      "{Gegner} knurrt und tritt von einem Fuß auf den anderen. Dein Warten hat ihn getroffen.",
      "Du hast dir Zeit gelassen, und {gegner} hat sie nicht ausgehalten. Treffer.",
      "{Gegner} trommelt mit den Fingern. Es hilft ihm nichts."
    ],
    "ruhe": [
      "{Gegner} hat heute niemanden zum Drängeln gefunden.",
      "Kein Gedränge heute. {Gegner} murrt allein vor sich hin."
    ],
    "phase": [
      "{Gegner} wird hektisch. Er merkt, dass du nicht mehr springst, wenn er drängt."
    ]
  },
  "zuckerkobold": {
    "treffer": [
      "Der Teller bleibt, wie er ist. {Gegner} kratzt vergeblich am Schrank.",
      "{Gegner} flüstert ins Leere. Du hast bewusst entschieden, und {er} schrumpft.",
      "Ein Stück, ganz bewusst. {Gegner} hatte mit der ganzen Packung gerechnet."
    ],
    "ruhe": [
      "Heute kein Knistern in der Vorratskammer. {Gegner} schläft, du auch.",
      "{Gegner} hat sich nicht blicken lassen. Die Packungen bleiben, wo sie sind."
    ],
    "phase": [
      "{Gegner} wird klein und hektisch. {Er} merkt, dass sein Flüstern nicht mehr wirkt."
    ]
  },
  "gaehnor": {
    "treffer": [
      "Zwei Minuten, und {gegner} reibt sich ungläubig die Augen. Der Nebel lichtet sich.",
      "Du hast einfach angefangen. {Gegner} gähnt, aber diesmal allein.",
      "Die Stiefel sind an, der erste Schritt ist gemacht. {Gegner} sinkt ein Stück tiefer in sein Kissen."
    ],
    "ruhe": [
      "Ein ruhiger Tag. {Gegner} döst am Wegrand und wartet vergeblich auf dich.",
      "Heute kein Kampf mit {gegner}. Der Nebel bleibt dünn."
    ],
    "phase": [
      "{Gegner} ist hellwach vor Sorge. {Er} spürt, dass Warten bei dir nicht mehr zieht."
    ]
  },
  "nachtschwaermer": {
    "treffer": [
      "Der Bildschirm ist aus, das Zimmer wird dunkel. {Gegner} flattert ratlos vor der Tür.",
      "Kein „nur noch eine“. {Gegner} verliert die Hälfte seines Lichts.",
      "Du hast den Abend beendet, nicht {gegner}. Treffer."
    ],
    "ruhe": [
      "Heute war {gegner} nicht da. Dein Fenster bleibt dunkel und ruhig.",
      "Eine stille Nacht. {Gegner} sucht sich ein anderes Licht."
    ],
    "phase": [
      "{Gegner} flackert nur noch schwach. {Er} merkt, dass der Korb vor der Tür gewinnt."
    ]
  },
  "heisshunger": {
    "treffer": [
      "Du hast kurz innegehalten. {Gegner} bleibt verdutzt stehen und knurrt leiser.",
      "Erst trinken, dann entscheiden. {Gegner} hat damit nicht gerechnet.",
      "Fünf Minuten haben gereicht. {Gegner} zieht sich in die Berge zurück."
    ],
    "ruhe": [
      "Heute blieb es ruhig in den Bergen. Kein Knurren, kein Kampf.",
      "{Gegner} hat dich heute in Ruhe gelassen. Auch das ist ein guter Tag."
    ],
    "phase": [
      "{Gegner} wird unsicher. {Er} merkt, dass du die Pause vor dem Zugreifen kennst."
    ]
  },
  "hetzra": {
    "treffer": [
      "Der Abend stand im Kalender, und er hat gehalten. {Gegner} rennt wütend über die Dächer.",
      "Ihr hattet eure Zeit. {Gegner} hat ein paar Uhren aus ihrem Sack verloren.",
      "Geplant ist geschützt. {Gegner} kommt nicht durch die Tür."
    ],
    "ruhe": [
      "Heute hat {gegner} keine Stunden gestohlen. Ein ruhiger Tag.",
      "{Gegner} war beschäftigt, nur nicht bei euch."
    ],
    "phase": [
      "{Gegner} wird nervös. Ihr Sack wird leichter, und das gefällt ihr gar nicht."
    ]
  },
  "langeweile": {
    "treffer": [
      "Ein Zettel aus dem Glas, und der graue Schleier bekommt ein Loch.",
      "Ihr habt angefangen, statt zu warten. {Gegner} weicht in die Ecke zurück.",
      "Gelächter im Wohnzimmer. {Gegner} weiß nicht, wohin mit sich."
    ],
    "ruhe": [
      "Heute blieb der Nachmittag bunt. {Gegner} hat keine Lücke gefunden.",
      "Kein grauer Schleier heute. Das Ideenglas wartet geduldig."
    ],
    "phase": [
      "{Gegner} wird blass. Das Glas ist voller, als {er} dachte."
    ]
  },
  "aufschieberitis": {
    "treffer": [
      "Ein winziger erster Schritt, und {gegner} rutscht ein Stück den Berg hinunter.",
      "Du hast angefangen, bevor sie „morgen“ rufen konnte. Treffer.",
      "Ein Stein weniger auf dem Berg. {Gegner} hält sich am Gipfel fest."
    ],
    "ruhe": [
      "Heute hat {gegner} geschwiegen. Der Berg ist nicht gewachsen.",
      "Ein ruhiger Tag ohne „morgen“. {Gegner} wartet auf ihre Chance."
    ],
    "phase": [
      "{Gegner} wird unruhig. Der Berg ist kleiner, als sie ihn gern hätte."
    ]
  },
  "irrlicht": {
    "treffer": [
      "Das Handy lag außer Sicht. {Gegner} klopft vergeblich gegen die Kiste.",
      "Du bist bei deiner Sache geblieben. {Gegner} flackert und wird blasser.",
      "Kein kurzer Blick, kein Umweg ins Moor. Treffer."
    ],
    "ruhe": [
      "Heute hat {gegner} nicht gelockt. Das Moor liegt still.",
      "{Gegner} glimmt irgendwo leise vor sich hin. Kein Kampf heute."
    ],
    "phase": [
      "{Gegner} leuchtet nur noch schwach. {Er} spürt, dass du die Kiste zu nutzen weißt."
    ]
  },
  "kaufrausch": {
    "treffer": [
      "Eine Nacht drüber geschlafen, und der Wagen von {gegner} bleibt halb voll.",
      "„Nur heute“ hat nicht gezogen. {Gegner} packt beleidigt ein.",
      "Auf die Merkliste statt in den Korb. Treffer."
    ],
    "ruhe": [
      "Heute hat {gegner} nicht geklopft. Dein Beutel bleibt schwer.",
      "Kein Händler um Mitternacht. Ein ruhiger Tag."
    ],
    "phase": [
      "{Gegner} wird hektisch und ruft lauter. Ein sicheres Zeichen, dass {er} verliert."
    ]
  },
  "geldfresser": {
    "treffer": [
      "Zuerst gespart, dann ausgegeben. {Gegner} findet nur Krümel.",
      "Ein Taler mehr in der kleinen Truhe. {Gegner} schmatzt ins Leere.",
      "Das Schloss hält. {Gegner} schleicht hungrig davon."
    ],
    "ruhe": [
      "Heute kein Schmatzen in der Nacht. Die Truhe bleibt, wie sie ist.",
      "{Gegner} hat sich heute nicht gezeigt. Dein Gold auch nicht."
    ],
    "phase": [
      "{Gegner} wird dünn und unruhig. Die kleine Truhe klingt schon zu voll für {ihn}."
    ]
  },
  "leere": {
    "treffer": [
      "Ein Punkt von der Liste, und an der Wand ist ein Fleck Farbe zurück.",
      "Du hast etwas getan, statt zu scrollen. {Gegner} weicht in die Ecke.",
      "Zehn Minuten Freude. {Gegner} hat heute weniger Platz."
    ],
    "ruhe": [
      "Heute blieb der Abend in Farbe. {Gegner} kam nicht herein.",
      "Ein ruhiger Tag. Deine Liste liegt bereit, falls {gegner} kommt."
    ],
    "phase": [
      "{Gegner} wird kleiner. Deine Liste ist inzwischen länger als ihre Geduld."
    ]
  },
  "einsiedler": {
    "treffer": [
      "Du hast den ersten Schritt gemacht. Auf der Brücke welkt eine Ranke.",
      "Eine Nachricht ist unterwegs. {Gegner} brummt und rückt ein Stück zur Seite.",
      "Du hast nicht gewartet. Treffer."
    ],
    "ruhe": [
      "Heute blieb die Brücke ruhig. {Gegner} sitzt allein am Ufer.",
      "{Gegner} hat sich nicht gemeldet. Wie immer, nur diesmal ohne Folgen."
    ],
    "phase": [
      "{Gegner} wird unsicher. Die Brücke ist breiter, als {er} sie in Erinnerung hat."
    ]
  },
  "trott": {
    "treffer": [
      "Ein Schritt neben die alten Rillen. {Gegner} schaut misstrauisch auf deinen Abdruck.",
      "Du hast bewusst gehandelt. {Gegner} rutscht tiefer in seine Rille.",
      "Ein neuer Abdruck auf deinem Weg. Treffer."
    ],
    "ruhe": [
      "Heute hat {gegner} nicht gezogen. Die Rillen bleiben leer.",
      "Ein ruhiger Tag. {Gegner} wartet in seinen alten Spuren."
    ],
    "phase": [
      "{Gegner} wird unruhig. Dein neuer Pfad ist schon gut zu sehen."
    ]
  },
  "velkra": {
    "treffer": [
      "Du hast Gefühl und Wunsch ausgesprochen. {Gegner} lässt einen alten Groll fallen.",
      "Nichts unausgesprochen gelassen. {Gegner} verliert eine ihrer Erinnerungen.",
      "{Gegner} sucht nach altem Ärger und findet heute keinen. Treffer."
    ],
    "ruhe": [
      "Heute blieb {gegner} still. Keine alten Geschichten.",
      "{Gegner} hat sich nicht gezeigt. Ihr Sack mit altem Ärger bleibt zu."
    ],
    "phase": [
      "{Gegner} hält ihren Groll fester. {Er} spürt, dass er ihr entgleitet."
    ]
  },
  "morvane": {
    "treffer": [
      "Dein neuer Weg war schneller als das alte Muster. {Gegner} weicht zurück.",
      "{Gegner} rief alle alten Reaktionen. Du hast trotzdem deine eigene gewählt.",
      "Eine Krone mit einem Riss. Treffer."
    ],
    "ruhe": [
      "Heute blieb {gegner} auf ihrem Thron. Kein Ruf, kein Kampf.",
      "Ein stiller Tag im Reich der alten Muster."
    ],
    "phase": [
      "{Gegner} wird unruhig. Ihre alten Muster gehorchen ihr nicht mehr so schnell."
    ]
  },
  "sturmgeist": {
    "treffer": [
      "Dein Atem wurde langsamer, und {gegner} verliert den Wind.",
      "Einmal tief ausgeatmet. {Gegner} wirbelt ins Leere.",
      "Mitten im Trubel klar geblieben. Treffer."
    ],
    "ruhe": [
      "Heute blieb es windstill. {Gegner} hat sich nicht gezeigt.",
      "Ein ruhiger Tag ohne Sturm. {verbuendeter} öffnet das Fenster."
    ],
    "phase": [
      "{Gegner} weht nur noch als Brise. {Er} spürt, dass dein Atem stärker ist."
    ]
  },
  "gedankenkarussell": {
    "treffer": [
      "Die Gedanken stehen auf Papier. {Gegner} dreht sich langsamer.",
      "Du hast eine Sorge geparkt. {Gegner} quietscht und stockt.",
      "Ein Gedanke weniger in der Runde. Treffer."
    ],
    "ruhe": [
      "Heute stand {gegner} still. Eine ruhige Nacht.",
      "Kein Kreisen heute. {Gegner} wartet auf der Kirmes."
    ],
    "phase": [
      "{Gegner} ruckelt nur noch. Bald steigt keiner mehr ein."
    ]
  },
  "kritiker": {
    "treffer": [
      "Du hast mit dir gesprochen wie mit einem Freund. {Gegner} verstummt mitten im Satz.",
      "{Gegner} suchte einen Fehler und fand nur dich, freundlich zu dir selbst.",
      "Ein milder Satz statt eines harten. Treffer."
    ],
    "ruhe": [
      "Heute hat {gegner} geschwiegen. Ein leiser Tag.",
      "{Gegner} hat sich nicht gemeldet. Du hast ihn auch nicht vermisst."
    ],
    "phase": [
      "{Gegner} wird unsicher. Seine Stimme ist nicht mehr die lauteste in deinem Kopf."
    ]
  },
  "jasager": {
    "treffer": [
      "Du hast dir Bedenkzeit genommen. {Gegner} steht mit offenem Mund da.",
      "Erst nachgedacht, dann geantwortet. {Gegner} verliert ein „gern“.",
      "Ein ehrliches „Ich melde mich“. Treffer."
    ],
    "ruhe": [
      "Heute wollte niemand etwas von dir. {Gegner} hatte frei.",
      "Ein ruhiger Tag ohne vorschnelles Ja."
    ],
    "phase": [
      "{Gegner} wird kleinlaut. {Er} merkt, dass dein Ja jetzt etwas wert ist."
    ]
  }
};
