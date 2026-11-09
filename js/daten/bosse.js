// ERZEUGT aus claude/bosse.md (06.11.2026, Übernahme aus vorlagen.js) mit claude/werkzeuge/inhalte-uebernehmen.mjs – nicht von Hand ändern.
// Gegner und Ketten ändern: in der Markdown-Datei (Format: js/logik/bosse-md.js), dann „Inhalte übernehmen“.
// Regeln (Vorlagen, Auren, Bedingungen): pruefeTabelle in js/daten/vorlagen.js.

// Gegner: id → { name, kurz, aura?, genus?, text, staerker, schwaecher, gestalten? (Vorschläge im Blatt „geschafft“) }
export const GEGNER = {
  "zuckerkobold": {
    "aura": "funken",
    "name": "Der Zuckerkobold",
    "kurz": "Zuckerkobold",
    "text": "Er versucht, dich zu unüberlegtem Naschen zu verleiten.",
    "staerker": "wenn Gewohnheiten automatisch ablaufen",
    "schwaecher": "wenn du bewusst handelst"
  },
  "gaehnor": {
    "aura": "nebel",
    "name": "Gähnor, der Träge",
    "kurz": "Gähnor",
    "genus": "m",
    "text": "Er flüstert dir zu, dass morgen auch noch ein Tag ist.",
    "staerker": "wenn du auf Lust wartest",
    "schwaecher": "wenn du einfach klein anfängst"
  },
  "nachtschwaermer": {
    "aura": "nebel",
    "name": "Der Nachtschwärmer",
    "kurz": "Nachtschwärmer",
    "text": "Er hält dich mit „nur noch eine Folge“ wach.",
    "staerker": "wenn der Bildschirm mit ins Bett kommt",
    "schwaecher": "wenn der Abend ein festes Ende hat"
  },
  "heisshunger": {
    "aura": "glut",
    "name": "Der Heißhunger",
    "kurz": "Heißhunger",
    "text": "Er taucht auf, wenn du müde oder gestresst bist.",
    "staerker": "wenn du hungrig einkaufst oder nebenbei isst",
    "schwaecher": "wenn du kurz innehältst"
  },
  "hetzra": {
    "aura": "flackern",
    "name": "Hetzra, die Eilige",
    "kurz": "Hetzra",
    "genus": "f",
    "text": "Sie füllt jeden Abend, bevor ihr euch seht.",
    "staerker": "wenn nichts fest geplant ist",
    "schwaecher": "wenn eure Zeit im Kalender steht"
  },
  "langeweile": {
    "aura": "schatten",
    "name": "Der Graue Nachmittag",
    "kurz": "Grauer Nachmittag",
    "text": "Er schleicht sich ein, wenn keiner eine Idee hat.",
    "staerker": "wenn der Bildschirm die schnellste Lösung ist",
    "schwaecher": "wenn Ideen griffbereit sind"
  },
  "aufschieberitis": {
    "aura": "nebel",
    "name": "Die Aufschieberitis",
    "kurz": "Aufschieberitis",
    "text": "Sie macht jede Aufgabe größer, als sie ist.",
    "staerker": "wenn der erste Schritt unklar ist",
    "schwaecher": "wenn du winzig anfängst"
  },
  "irrlicht": {
    "aura": "flackern",
    "name": "Das Handy-Irrlicht",
    "kurz": "Handy-Irrlicht",
    "text": "Es lockt dich mit einem kurzen Blick weg.",
    "staerker": "wenn das Handy in Reichweite liegt",
    "schwaecher": "wenn es außer Sicht ist"
  },
  "kaufrausch": {
    "aura": "funken",
    "name": "Der Kaufrausch",
    "kurz": "Kaufrausch",
    "text": "Er macht aus „brauche ich vielleicht“ ein „sofort“.",
    "staerker": "wenn der Kauf mit einem Klick geht",
    "schwaecher": "wenn du eine Nacht darüber schläfst"
  },
  "geldfresser": {
    "aura": "glut",
    "name": "Der Geldfresser",
    "kurz": "Geldfresser",
    "text": "Er nimmt sich, was am Monatsende übrig wäre.",
    "staerker": "wenn zuerst ausgegeben wird",
    "schwaecher": "wenn zuerst gespart wird"
  },
  "leere": {
    "aura": "schatten",
    "name": "Die Leere",
    "kurz": "Leere",
    "text": "Sie lässt dich durch den Abend scrollen.",
    "staerker": "wenn dir gerade nichts einfällt",
    "schwaecher": "wenn eine kleine Liste bereitliegt"
  },
  "einsiedler": {
    "aura": "schatten",
    "name": "Der Einsiedler",
    "kurz": "Einsiedler",
    "text": "Er sagt: Die anderen melden sich schon.",
    "staerker": "wenn du wartest",
    "schwaecher": "wenn du den ersten Schritt machst"
  },
  "trott": {
    "aura": "nebel",
    "name": "Der alte Trott",
    "kurz": "Alter Trott",
    "text": "Er hält dich in deinen alten Gewohnheiten fest.",
    "staerker": "wenn alles automatisch läuft",
    "schwaecher": "wenn du bewusst handelst"
  },
  "drycha": {
    "aura": "glut",
    "name": "Drycha, Herrin des Zorns",
    "kurz": "Drycha",
    "genus": "f",
    "text": "Sie macht aus einem kleinen Funken in Sekunden ein Feuer.",
    "staerker": "wenn du müde oder unter Druck bist",
    "schwaecher": "wenn du kurz Abstand nimmst"
  },
  "murrgrim": {
    "aura": "flackern",
    "name": "Murrgrim, der Ungeduldige",
    "kurz": "Murrgrim",
    "genus": "m",
    "text": "Er tigert auf und ab und klopft auf seine Uhr.",
    "staerker": "wenn etwas länger dauert als gedacht",
    "schwaecher": "wenn du ruhig ansprichst, was dich stört",
    "gestalten": [
      "Im Stau",
      "Beim Warten in der Schlange",
      "Wenn jemand zu spät kommt"
    ]
  },
  "velkra": {
    "aura": "schatten",
    "name": "Velkra, die Nachtragende",
    "kurz": "Velkra",
    "genus": "f",
    "text": "Sie hält alten Ärger fest und holt ihn immer wieder hervor.",
    "staerker": "wenn Ärger unausgesprochen bleibt",
    "schwaecher": "wenn du Gefühl und Wunsch benennst",
    "gestalten": [
      "Bei einem alten Streitthema",
      "Wenn eine Entschuldigung fehlt",
      "Beim Wiedersehen nach einem Streit"
    ]
  },
  "morvane": {
    "aura": "nebel",
    "name": "Morvane, Königin der alten Muster",
    "kurz": "Morvane",
    "genus": "f",
    "text": "Sie ruft alle alten Reaktionen auf einmal zurück.",
    "staerker": "wenn alles automatisch abläuft",
    "schwaecher": "wenn du deine neuen Wege schon oft gegangen bist",
    "gestalten": [
      "Wenn ich müde bin",
      "Unter Zeitdruck",
      "Wenn vieles gleichzeitig schiefgeht"
    ]
  },
  "sturmgeist": {
    "aura": "flackern",
    "name": "Der Sturmgeist",
    "kurz": "Sturmgeist",
    "text": "Er wirbelt alles auf, bis du nicht mehr klar denken kannst.",
    "staerker": "wenn zu viel gleichzeitig passiert",
    "schwaecher": "wenn dein Atem langsamer wird"
  },
  "gedankenkarussell": {
    "aura": "nebel",
    "name": "Das Gedankenkarussell",
    "kurz": "Gedankenkarussell",
    "text": "Es dreht dieselben Sorgen wieder und wieder.",
    "staerker": "wenn du abends wach liegst",
    "schwaecher": "wenn die Gedanken auf Papier landen"
  },
  "kritiker": {
    "aura": "schatten",
    "name": "Der innere Kritiker",
    "kurz": "Innerer Kritiker",
    "text": "Er flüstert dir zu, dass es nie gut genug ist.",
    "staerker": "wenn etwas schiefgeht",
    "schwaecher": "wenn du mit dir sprichst wie mit einem Freund"
  },
  "jasager": {
    "aura": "funken",
    "name": "Der Ja-Sager",
    "kurz": "Ja-Sager",
    "text": "Er sagt „gern“, bevor du nachdenken konntest.",
    "staerker": "wenn du sofort antworten sollst",
    "schwaecher": "wenn du dir Bedenkzeit nimmst"
  }
};

// Ketten: vorlage-id → { kette: [gegner-id …], bedingungen?: [[{ art, n?, min? }] je Platz] } (daten/bedingungen.js)
export const KETTEN = {
  "gesundheit-suess": {
    "kette": [
      "zuckerkobold",
      "heisshunger",
      "nachtschwaermer",
      "trott"
    ]
  },
  "gesundheit-bewegung": {
    "kette": [
      "gaehnor",
      "trott",
      "aufschieberitis",
      "irrlicht"
    ]
  },
  "gesundheit-schlaf": {
    "kette": [
      "nachtschwaermer",
      "irrlicht",
      "gedankenkarussell",
      "trott"
    ]
  },
  "gesundheit-abnehmen": {
    "kette": [
      "heisshunger",
      "zuckerkobold",
      "trott",
      "gaehnor"
    ]
  },
  "gesundheit-anderes": {
    "kette": [
      "trott",
      "gaehnor",
      "heisshunger",
      "nachtschwaermer"
    ]
  },
  "familie-zeit": {
    "kette": [
      "hetzra",
      "irrlicht",
      "trott",
      "jasager"
    ]
  },
  "familie-langeweile": {
    "kette": [
      "langeweile",
      "irrlicht",
      "gaehnor",
      "trott"
    ]
  },
  "familie-anruf": {
    "kette": [
      "einsiedler",
      "hetzra",
      "aufschieberitis",
      "trott"
    ]
  },
  "gelassenheit-wut": {
    "kette": [
      "drycha",
      "murrgrim",
      "velkra",
      "morvane"
    ],
    "bedingungen": [
      [],
      [
        {
          "art": "gestalten",
          "n": 2
        }
      ],
      [
        {
          "art": "faehigkeiten",
          "n": 2
        },
        {
          "art": "gestalten",
          "n": 2
        }
      ],
      [
        {
          "art": "gestalten",
          "n": 3
        },
        {
          "art": "schwierigkeit",
          "min": 7,
          "n": 1
        },
        {
          "art": "wiedereinstieg"
        }
      ]
    ]
  },
  "gelassenheit-laut": {
    "kette": [
      "drycha",
      "murrgrim",
      "morvane"
    ]
  },
  "gelassenheit-stress": {
    "kette": [
      "sturmgeist",
      "gedankenkarussell",
      "hetzra",
      "kritiker"
    ]
  },
  "gelassenheit-hektik": {
    "kette": [
      "hetzra",
      "sturmgeist",
      "jasager",
      "murrgrim"
    ]
  },
  "gelassenheit-gruebeln": {
    "kette": [
      "gedankenkarussell",
      "kritiker",
      "nachtschwaermer",
      "sturmgeist"
    ]
  },
  "gelassenheit-kritiker": {
    "kette": [
      "kritiker",
      "gedankenkarussell",
      "jasager",
      "sturmgeist"
    ]
  },
  "gelassenheit-jasagen": {
    "kette": [
      "jasager",
      "hetzra",
      "kritiker",
      "sturmgeist"
    ]
  },
  "gelassenheit-anderes": {
    "kette": [
      "trott",
      "sturmgeist",
      "gedankenkarussell",
      "kritiker"
    ]
  },
  "familie-anderes": {
    "kette": [
      "trott",
      "hetzra",
      "irrlicht",
      "einsiedler"
    ]
  },
  "fokus-aufschieben": {
    "kette": [
      "aufschieberitis",
      "irrlicht",
      "trott",
      "gaehnor"
    ]
  },
  "fokus-ablenkung": {
    "kette": [
      "irrlicht",
      "aufschieberitis",
      "hetzra",
      "trott"
    ]
  },
  "fokus-anderes": {
    "kette": [
      "trott",
      "aufschieberitis",
      "irrlicht",
      "hetzra"
    ]
  },
  "finanzen-spontankauf": {
    "kette": [
      "kaufrausch",
      "geldfresser",
      "irrlicht",
      "trott"
    ]
  },
  "finanzen-sparen": {
    "kette": [
      "geldfresser",
      "kaufrausch",
      "aufschieberitis",
      "trott"
    ]
  },
  "finanzen-anderes": {
    "kette": [
      "trott",
      "kaufrausch",
      "geldfresser",
      "aufschieberitis"
    ]
  },
  "lebensfreude-leer": {
    "kette": [
      "leere",
      "irrlicht",
      "einsiedler",
      "trott"
    ]
  },
  "lebensfreude-freunde": {
    "kette": [
      "einsiedler",
      "hetzra",
      "leere",
      "irrlicht"
    ]
  },
  "lebensfreude-anderes": {
    "kette": [
      "trott",
      "leere",
      "einsiedler",
      "irrlicht"
    ]
  },
  "allgemein": {
    "kette": [
      "trott",
      "aufschieberitis",
      "irrlicht",
      "hetzra"
    ]
  }
};
