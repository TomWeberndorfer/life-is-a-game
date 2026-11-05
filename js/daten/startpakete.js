// ERZEUGT aus startpakete.md (03.11.2026, 06:50) mit claude/werkzeuge/inhalte-uebernehmen.mjs – nicht von Hand ändern.
// Pakete ändern: in der Markdown-Datei (Format: js/logik/startpakete-md.js), dann „Inhalte übernehmen“.
// Bedeutung der Felder und Regeln beim Anlegen: js/logik/startpaket.js.

export const STARTPAKETE = {
  "drei-helden": {
    "name": "Startpaket mit drei Helden",
    "text": "Goldwin, Trogadon und Jelninolan mit Quest und Messzielen. Startwerte, die fehlen, trägst du selbst ein.",
    "helden": [
      {
        "vorlage": "finanzen-sparen",
        "ziel": "Ausgaben-Check 1× pro Woche",
        "versatzTage": 0,
        "zielquest": {
          "vorlage": "ruecklage",
          "ziel": 15000,
          "bis": "2027-06-30"
        }
      },
      {
        "vorlage": "gesundheit-bewegung",
        "ziel": "Training 3× pro Woche",
        "versatzTage": 0,
        "messziele": [
          {
            "name": "Bizeps rechts",
            "einheit": "cm",
            "richtung": "hoch",
            "ziel": 38,
            "start": 32.3
          },
          {
            "name": "Bauchumfang",
            "einheit": "cm",
            "richtung": "runter",
            "ziel": 78,
            "start": 88
          },
          {
            "name": "Brustumfang",
            "einheit": "cm",
            "richtung": "hoch",
            "ziel": 100
          },
          {
            "name": "Klimmzüge am Stück",
            "einheit": "Wdh.",
            "richtung": "hoch",
            "ziel": 10
          }
        ],
        "stuetzen": [
          {
            "name": "Portionieren",
            "anzahl": 3,
            "zeitraum": "runde"
          }
        ]
      },
      {
        "vorlage": "gelassenheit-wut",
        "ziel": "Nicht reagieren und durchatmen",
        "versatzTage": 1,
        "ideen": [
          [
            "drinnen",
            "Wut erkennen"
          ],
          [
            "drinnen",
            "In andere hineinversetzen"
          ],
          [
            "drinnen",
            "Mitleid empfinden"
          ],
          [
            "drinnen",
            "Innerlich anschreien"
          ],
          [
            "drinnen",
            "Wappnen"
          ]
        ]
      }
    ]
  }
};

// Höchster erlaubter Versatz (mehr würde „ab morgen“ falsch anzeigen und Tage vor dem Beginn zählen lassen).
export const STARTPAKET_VERSATZ_MAX = 1;
