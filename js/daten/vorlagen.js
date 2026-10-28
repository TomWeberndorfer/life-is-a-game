// Vorlagen-Tabelle: Onboarding-Gruppe → Problem → Lebensbereich (domain), Held, Gegner, Fähigkeit, erste Quest.
// Neue Gruppen, Probleme oder Lebensbereiche = neue Zeile, keine Programmierung.
// Namen und Bilder je Stil stehen in stile.js (Schlüssel = heroId bzw. id der Figur).
import { HELDEN } from './helden.js';
import { LEBENSBEREICHE } from './lebensbereiche.js';

// Onboarding-Gruppen: nur Anzeige im Onboarding (Bildschirm 1). Eine Gruppe kann mehrere
// Lebensbereiche abdecken (z. B. Familie & Beziehungen → partner, adventure). Gespeichert wird je Held die domain.
export const GRUPPEN = [
  { id: 'gesundheit', name: 'Gesundheit', icon: 'herz', onboarding: true },
  { id: 'familie', name: 'Familie & Beziehungen', icon: 'menschen', onboarding: true },
  // Version 39: Resilienz (Jelninolan). Abgrenzung zu Der Erste (growth): hier „ich reagiere / ich fühle mich …“,
  // beim Ersten „ich würde gern / mir fehlt …“ (siehe entscheidungen-gesamt.md).
  { id: 'gelassenheit', name: 'Gelassenheit & Stress', icon: 'welle', onboarding: true },
  { id: 'fokus', name: 'Fokus & Produktivität', icon: 'ziel', onboarding: true },
  { id: 'finanzen', name: 'Finanzen', icon: 'muenzen', onboarding: true },
  { id: 'lebensfreude', name: 'Lebensfreude', icon: 'sonne', onboarding: true }
];

export const PROBLEME = {
  gesundheit: [
    { id: 'suess', text: 'Ich esse zu viele Süßigkeiten', ziele: ['Weniger Süßigkeiten essen', 'Gesünder essen', 'Gewicht reduzieren', 'Mehr Energie haben'] },
    { id: 'bewegung', text: 'Ich bewege mich zu wenig', ziele: ['Mehr bewegen', 'Fitter werden', 'Mehr Energie haben'] },
    { id: 'schlaf', text: 'Ich schlafe schlecht', ziele: ['Besser schlafen', 'Früher ins Bett gehen', 'Ausgeruht aufwachen'] },
    { id: 'abnehmen', text: 'Ich möchte abnehmen', ziele: ['Bewusster essen', 'Gewicht reduzieren', 'Mehr Energie haben'] }
  ],
  familie: [
    { id: 'zeit', text: 'Wir haben zu wenig Zeit füreinander', ziele: ['Mehr gemeinsame Zeit', 'Regelmäßig etwas zu zweit unternehmen'] },
    { id: 'langeweile', text: 'Die Kinder langweilen sich oft', ziele: ['Mehr Erlebnisse mit den Kindern', 'Gemeinsam spielen statt Bildschirm'] },
    { id: 'anruf', text: 'Ich melde mich zu selten bei Eltern oder Geschwistern', ziele: ['Regelmäßig Kontakt halten', 'Öfter bei der Familie anrufen'] }
  ],
  gelassenheit: [
    { id: 'wut', text: 'Ich werde schnell wütend (Kollegen, Familie, Freunde)', ziele: ['Ruhiger reagieren', 'Wut bemerken, bevor sie ausbricht', 'Weniger Streit'] },
    { id: 'laut', text: 'Ich werde mit den Kindern schnell laut', ziele: ['Ruhiger mit den Kindern sein', 'Weniger schimpfen', 'Geduldiger bleiben'] },
    { id: 'stress', text: 'Stress überrollt mich', ziele: ['Gelassener bleiben', 'Stress früher bemerken'] },
    { id: 'hektik', text: 'Morgens und abends ist alles Hektik', ziele: ['Ruhiger durch den Morgen', 'Gelassen bleiben unter Zeitdruck'] },
    { id: 'gruebeln', text: 'Ich grüble viel und komme nicht zur Ruhe', ziele: ['Weniger grübeln', 'Abends abschalten können'] },
    { id: 'kritiker', text: 'Ich bin zu streng mit mir', ziele: ['Freundlicher mit mir sein', 'Rückschläge leichter nehmen'] },
    { id: 'jasagen', text: 'Ich sage zu allem Ja', ziele: ['Öfter Nein sagen', 'Mehr Zeit für mich'] }
  ],
  fokus: [
    { id: 'aufschieben', text: 'Ich schiebe Wichtiges auf', ziele: ['Wichtiges zuerst erledigen', 'Weniger aufschieben'] },
    { id: 'ablenkung', text: 'Ich lasse mich ständig ablenken', ziele: ['Konzentrierter arbeiten', 'Weniger am Handy'] }
  ],
  finanzen: [
    { id: 'spontankauf', text: 'Ich kaufe oft spontan ein', ziele: ['Weniger Spontankäufe', 'Bewusster einkaufen'] },
    { id: 'sparen', text: 'Ich spare zu wenig', ziele: ['Einen Notgroschen aufbauen', 'Regelmäßig sparen'] }
  ],
  lebensfreude: [
    { id: 'leer', text: 'Ich weiß oft nichts mit mir anzufangen', ziele: ['Mehr Freude im Alltag', 'Eigene Hobbys pflegen'] },
    { id: 'freunde', text: 'Ich treffe Freunde zu selten', ziele: ['Freundschaften pflegen', 'Öfter etwas unternehmen'] }
  ]
};

// Gegner: kraft wird aus der Quest berechnet (ein Segment je nötiger Anwendung).
export const GEGNER = {
  zuckerkobold: {
    name: 'Der Zuckerkobold',
    kurz: 'Zuckerkobold',
    text: 'Er versucht, dich zu unüberlegtem Naschen zu verleiten.',
    staerker: 'wenn Gewohnheiten automatisch ablaufen',
    schwaecher: 'wenn du bewusst handelst'
  },
  gaehnor: { name: 'Gähnor, der Träge', kurz: 'Gähnor', genus: 'm', text: 'Er flüstert dir zu, dass morgen auch noch ein Tag ist.', staerker: 'wenn du auf Lust wartest', schwaecher: 'wenn du einfach klein anfängst' },
  nachtschwaermer: { name: 'Der Nachtschwärmer', kurz: 'Nachtschwärmer', text: 'Er hält dich mit „nur noch eine Folge“ wach.', staerker: 'wenn der Bildschirm mit ins Bett kommt', schwaecher: 'wenn der Abend ein festes Ende hat' },
  heisshunger: { name: 'Der Heißhunger', kurz: 'Heißhunger', text: 'Er taucht auf, wenn du müde oder gestresst bist.', staerker: 'wenn du hungrig einkaufst oder nebenbei isst', schwaecher: 'wenn du kurz innehältst' },
  hetzra: { name: 'Hetzra, die Eilige', kurz: 'Hetzra', genus: 'f', text: 'Sie füllt jeden Abend, bevor ihr euch seht.', staerker: 'wenn nichts fest geplant ist', schwaecher: 'wenn eure Zeit im Kalender steht' },
  langeweile: { name: 'Der Graue Nachmittag', kurz: 'Grauer Nachmittag', text: 'Er schleicht sich ein, wenn keiner eine Idee hat.', staerker: 'wenn der Bildschirm die schnellste Lösung ist', schwaecher: 'wenn Ideen griffbereit sind' },
  aufschieberitis: { name: 'Die Aufschieberitis', kurz: 'Aufschieberitis', text: 'Sie macht jede Aufgabe größer, als sie ist.', staerker: 'wenn der erste Schritt unklar ist', schwaecher: 'wenn du winzig anfängst' },
  irrlicht: { name: 'Das Handy-Irrlicht', kurz: 'Handy-Irrlicht', text: 'Es lockt dich mit einem kurzen Blick weg.', staerker: 'wenn das Handy in Reichweite liegt', schwaecher: 'wenn es außer Sicht ist' },
  kaufrausch: { name: 'Der Kaufrausch', kurz: 'Kaufrausch', text: 'Er macht aus „brauche ich vielleicht“ ein „sofort“.', staerker: 'wenn der Kauf mit einem Klick geht', schwaecher: 'wenn du eine Nacht darüber schläfst' },
  geldfresser: { name: 'Der Geldfresser', kurz: 'Geldfresser', text: 'Er nimmt sich, was am Monatsende übrig wäre.', staerker: 'wenn zuerst ausgegeben wird', schwaecher: 'wenn zuerst gespart wird' },
  leere: { name: 'Die Leere', kurz: 'Leere', text: 'Sie lässt dich durch den Abend scrollen.', staerker: 'wenn dir gerade nichts einfällt', schwaecher: 'wenn eine kleine Liste bereitliegt' },
  einsiedler: { name: 'Der Einsiedler', kurz: 'Einsiedler', text: 'Er sagt: Die anderen melden sich schon.', staerker: 'wenn du wartest', schwaecher: 'wenn du den ersten Schritt machst' },
  trott: { name: 'Der alte Trott', kurz: 'Alter Trott', text: 'Er hält dich in deinen alten Gewohnheiten fest.', staerker: 'wenn alles automatisch läuft', schwaecher: 'wenn du bewusst handelst' },
  // Version 39: Resilienz. Wutwald-Kette aus dem alten Prototyp (Drycha → Murrgrim → Velkra → Morvane).
  // Bis Etappe 3 (Serie/Rückfall) zählt sie wie jede Kette: X Anwendungen je Runde.
  drycha: { name: 'Drycha, Herrin des Zorns', kurz: 'Drycha', genus: 'f', text: 'Sie macht aus einem kleinen Funken in Sekunden ein Feuer.', staerker: 'wenn du müde oder unter Druck bist', schwaecher: 'wenn du kurz Abstand nimmst' },
  murrgrim: { name: 'Murrgrim, der Ungeduldige', kurz: 'Murrgrim', genus: 'm', text: 'Er tigert auf und ab und klopft auf seine Uhr.', staerker: 'wenn etwas länger dauert als gedacht', schwaecher: 'wenn du ruhig ansprichst, was dich stört' },
  velkra: { name: 'Velkra, die Nachtragende', kurz: 'Velkra', genus: 'f', text: 'Sie hält alten Ärger fest und holt ihn immer wieder hervor.', staerker: 'wenn Ärger unausgesprochen bleibt', schwaecher: 'wenn du Gefühl und Wunsch benennst' },
  morvane: { name: 'Morvane, Königin der alten Muster', kurz: 'Morvane', genus: 'f', text: 'Sie ruft alle alten Reaktionen auf einmal zurück.', staerker: 'wenn alles automatisch abläuft', schwaecher: 'wenn du deine neuen Wege schon oft gegangen bist' },
  sturmgeist: { name: 'Der Sturmgeist', kurz: 'Sturmgeist', text: 'Er wirbelt alles auf, bis du nicht mehr klar denken kannst.', staerker: 'wenn zu viel gleichzeitig passiert', schwaecher: 'wenn dein Atem langsamer wird' },
  gedankenkarussell: { name: 'Das Gedankenkarussell', kurz: 'Gedankenkarussell', text: 'Es dreht dieselben Sorgen wieder und wieder.', staerker: 'wenn du abends wach liegst', schwaecher: 'wenn die Gedanken auf Papier landen' },
  kritiker: { name: 'Der innere Kritiker', kurz: 'Innerer Kritiker', text: 'Er flüstert dir zu, dass es nie gut genug ist.', staerker: 'wenn etwas schiefgeht', schwaecher: 'wenn du mit dir sprichst wie mit einem Freund' },
  jasager: { name: 'Der Ja-Sager', kurz: 'Ja-Sager', text: 'Er sagt „gern“, bevor du nachdenken konntest.', staerker: 'wenn du sofort antworten sollst', schwaecher: 'wenn du dir Bedenkzeit nimmst' }
};

// Helden stehen in helden.js (Register mit domain).
// Fähigkeit = Wenn-dann-Plan mit Schritten.
// tagesfrage (Version 44): Frage auf der Heldentat-Karte. Fragt nach der Handlung, nicht nach dem Ergebnis,
// und nennt die Wenn-Situation. Eine Vorlage kann sie mit eigenem `tagesfrage` überschreiben; fehlt beides,
// gilt der Text `tat.frage` (allgemein mit Fähigkeitsname).
export const FAEHIGKEITEN = {
  portionieren: { name: 'Portionieren', icon: 'teller', wenn: 'Wenn du Süßigkeiten essen möchtest:', schritte: ['Lege zuerst eine Portion auf einen Teller.', 'Die Packung bleibt außer Reichweite.'], kurz: 'Erst auf den Teller, Packung weg.', verb: 'portioniert', tagesfrage: 'Hast du Süßes heute zuerst auf einen Teller gelegt?' },
  zweiMinuten: { name: 'Zwei-Minuten-Start', icon: 'schuh', wenn: 'Wenn du keine Lust auf Bewegung hast:', schritte: ['Zieh die Schuhe an.', 'Geh zwei Minuten. Danach darfst du aufhören.'], kurz: 'Schuhe an, zwei Minuten los.', verb: 'bewegt', tagesfrage: 'Hast du heute die Schuhe angezogen und bist zwei Minuten losgegangen?' },
  bildschirmAus: { name: 'Bildschirm weglegen', icon: 'mond', wenn: 'Wenn es eine halbe Stunde vor dem Schlafen ist:', schritte: ['Leg das Handy außerhalb des Schlafzimmers ab.', 'Lies oder hör etwas Ruhiges.'], kurz: 'Handy raus, Ruhe rein.', verb: 'abgeschaltet', tagesfrage: 'Lag dein Handy heute vor dem Schlafen außerhalb des Schlafzimmers?' },
  innehalten: { name: 'Kurz innehalten', icon: 'glas', wenn: 'Wenn du plötzlich Hunger bekommst:', schritte: ['Trink zuerst ein Glas Wasser.', 'Warte fünf Minuten, dann entscheide.'], kurz: 'Erst Wasser, dann entscheiden.', verb: 'innegehalten', tagesfrage: 'Hast du bei Hunger heute zuerst ein Glas Wasser getrunken und kurz gewartet?' },
  festeZeit: { name: 'Feste Zeit eintragen', icon: 'kalender', wenn: 'Wenn eine neue Woche beginnt:', schritte: ['Tragt eine gemeinsame Zeit in den Kalender ein.', 'Diese Zeit wird nicht verschoben.'], kurz: 'Zeit zu zweit steht im Kalender.', verb: 'Zeit genommen', tagesfrage: 'Steht eure gemeinsame Zeit für diese Woche im Kalender?' },
  ideenglas: { name: 'Ideenglas ziehen', icon: 'glas', wenn: 'Wenn keiner weiß, was ihr tun sollt:', schritte: ['Zieh eine Idee aus dem Ideenglas.', 'Fangt sofort damit an.'], kurz: 'Idee ziehen, sofort starten.', verb: 'gezogen', tagesfrage: 'Habt ihr heute eine Idee aus dem Ideenglas gezogen und gleich angefangen?' },
  ersterSchritt: { name: 'Kleinster erster Schritt', icon: 'schuh', wenn: 'Wenn du eine Aufgabe vor dir herschiebst:', schritte: ['Schreib den kleinsten ersten Schritt auf.', 'Mach nur diesen Schritt, jetzt.'], kurz: 'Nur der erste Schritt zählt.', verb: 'angefangen', tagesfrage: 'Hast du heute bei einer aufgeschobenen Aufgabe den kleinsten ersten Schritt gemacht?' },
  handyWeg: { name: 'Handy außer Sicht', icon: 'mond', wenn: 'Wenn du dich konzentrieren willst:', schritte: ['Leg das Handy in einen anderen Raum.', 'Arbeite 25 Minuten, dann Pause.'], kurz: 'Handy weg, 25 Minuten Fokus.', verb: 'fokussiert', tagesfrage: 'Lag dein Handy heute beim Arbeiten in einem anderen Raum?' },
  nachtRegel: { name: '24-Stunden-Regel', icon: 'mond', wenn: 'Wenn du etwas spontan kaufen willst:', schritte: ['Leg es nur auf die Merkliste.', 'Entscheide erst morgen.'], kurz: 'Erst morgen kaufen.', verb: 'gewartet', tagesfrage: 'Hast du heute einen spontanen Kauf auf morgen verschoben?' },
  erstSparen: { name: 'Erst sparen', icon: 'muenzen', wenn: 'Wenn Geld hereinkommt:', schritte: ['Überweise zuerst einen festen Betrag aufs Sparkonto.', 'Gib erst danach aus.'], kurz: 'Zuerst zur Seite legen.', verb: 'gespart', tagesfrage: 'Hast du heute zuerst etwas zur Seite gelegt, bevor du ausgegeben hast?' },
  kleineListe: { name: 'Kleine Liste starten', icon: 'liste', wenn: 'Wenn du nicht weißt, was du mit dir anfangen sollst:', schritte: ['Öffne deine kleine Liste mit Ideen.', 'Wähle eine und fang an.'], kurz: 'Liste öffnen, eine Idee wählen.', verb: 'gestartet', tagesfrage: 'Hast du heute eine Idee von deiner kleinen Liste ausprobiert?' },
  nachricht: { name: 'Erste Nachricht schicken', icon: 'menschen', wenn: 'Wenn du an jemanden denkst:', schritte: ['Schick sofort eine kurze Nachricht.', 'Schlag etwas Konkretes vor.'], kurz: 'Gleich schreiben, konkret werden.', verb: 'geschrieben', tagesfrage: 'Hast du heute jemandem, an den du gedacht hast, gleich geschrieben?' },
  // Version 39
  festerAnruf: { name: 'Fester Anruf', icon: 'menschen', wenn: 'Wenn Sonntag ist:', schritte: ['Ruf eine Person aus deiner Familie an.', 'Frag, wie ihre Woche war.'], kurz: 'Sonntags anrufen.', verb: 'angerufen', tagesfrage: 'Hast du heute jemanden aus deiner Familie angerufen?' },
  bisZehn: { name: 'Bis zehn zählen', icon: 'welle', wenn: 'Wenn du merkst, dass Wut in dir hochsteigt:', schritte: ['Sag nichts und zähl langsam bis zehn.', 'Antworte erst danach, ruhig und kurz.'], kurz: 'Erst bis zehn, dann reden.', verb: 'ruhig geblieben', tagesfrage: 'Hast du heute bis zehn gezählt, bevor du in deiner Wut geantwortet hast?' },
  stoppLeise: { name: 'Stopp und leise', icon: 'welle', wenn: 'Wenn du merkst, dass du mit den Kindern lauter wirst:', schritte: ['Bleib stehen und atme einmal lang aus.', 'Geh auf Augenhöhe und sprich leiser weiter.'], kurz: 'Stehen bleiben, leiser werden.', verb: 'leise geblieben', tagesfrage: 'Bist du heute stehen geblieben und leiser geworden, als es laut wurde?' },
  langAusatmen: { name: 'Lange ausatmen', icon: 'welle', wenn: 'Wenn du Druck spürst:', schritte: ['Atme 4 Sekunden ein und 6 Sekunden aus.', 'Wiederhole das dreimal.'], kurz: '4 ein, 6 aus, dreimal.', verb: 'durchgeatmet', tagesfrage: 'Hast du heute bei Druck dreimal lang ausgeatmet?' },
  kurzAnhalten: { name: 'Kurz anhalten', icon: 'welle', wenn: 'Wenn es eng wird und alles gleichzeitig passieren soll:', schritte: ['Bleib einen Moment stehen und atme lang aus.', 'Sag laut den nächsten einzigen Schritt.'], kurz: 'Anhalten, nächster Schritt.', verb: 'angehalten', tagesfrage: 'Hast du heute in der Hektik kurz angehalten und den nächsten Schritt benannt?' },
  gedankenParken: { name: 'Gedanken parken', icon: 'liste', wenn: 'Wenn ein Gedanke immer wieder kreist:', schritte: ['Schreib ihn in einem Satz auf.', 'Denk erst in deiner festen Grübelzeit weiter (10 Minuten am frühen Abend).'], kurz: 'Aufschreiben, später denken.', verb: 'geparkt', tagesfrage: 'Hast du heute einen kreisenden Gedanken aufgeschrieben und geparkt?' },
  freundesSatz: { name: 'Freundes-Satz', icon: 'herz', wenn: 'Wenn du dich innerlich runtermachst:', schritte: ['Frag dich: Was würde ich einem Freund in dieser Lage sagen?', 'Sag dir genau diesen Satz.'], kurz: 'Sprich mit dir wie mit einem Freund.', verb: 'freundlich gewesen', tagesfrage: 'Hast du heute mit dir gesprochen wie mit einem Freund?' },
  bedenkzeit: { name: 'Bedenkzeit', icon: 'kalender', wenn: 'Wenn dich jemand um etwas bittet:', schritte: ['Sag: „Ich melde mich morgen.“', 'Entscheide erst dann, ob du Ja sagst.'], kurz: 'Erst morgen zusagen.', verb: 'Bedenkzeit genommen', tagesfrage: 'Hast du dir heute vor einer Zusage Bedenkzeit genommen?' }
};

// Eine Zeile je Gruppe und Problem. problem '*' = Rückfall für die Gruppe (z. B. „Etwas anderes“).
// kette = Gegner nacheinander (erster = gegner). Nach dem Sieg kommt sofort der nächste; mehr Gegner = Liste verlängern.
// Version 47: Ketten auf mindestens 3 Gegner verlängert (Test über 2 Wochen). Neue Gegner nur HINTEN anhängen:
// laufende Spielstände übernehmen die Kette beim Laden (ketteAuffrischen), die Position zählt die Siege.
export const VORLAGEN = [
  { id: 'gesundheit-suess', gruppe: 'gesundheit', problem: 'suess', domain: 'health', held: 'trogadon', gegner: 'zuckerkobold', kette: ['zuckerkobold', 'heisshunger', 'nachtschwaermer', 'trott'], faehigkeit: 'portionieren', quest: { anzahl: 3 } },
  { id: 'gesundheit-bewegung', gruppe: 'gesundheit', problem: 'bewegung', domain: 'health', held: 'trogadon', gegner: 'gaehnor', kette: ['gaehnor', 'trott', 'aufschieberitis', 'irrlicht'], faehigkeit: 'zweiMinuten', quest: { anzahl: 3 } },
  { id: 'gesundheit-schlaf', gruppe: 'gesundheit', problem: 'schlaf', domain: 'health', held: 'trogadon', gegner: 'nachtschwaermer', kette: ['nachtschwaermer', 'irrlicht', 'gedankenkarussell', 'trott'], faehigkeit: 'bildschirmAus', quest: { anzahl: 4 } },
  { id: 'gesundheit-abnehmen', gruppe: 'gesundheit', problem: 'abnehmen', domain: 'health', held: 'trogadon', gegner: 'heisshunger', kette: ['heisshunger', 'zuckerkobold', 'trott', 'gaehnor'], faehigkeit: 'innehalten', quest: { anzahl: 3 } },
  { id: 'gesundheit-anderes', gruppe: 'gesundheit', problem: '*', domain: 'health', held: 'trogadon', gegner: 'trott', kette: ['trott', 'gaehnor', 'heisshunger', 'nachtschwaermer'], faehigkeit: 'ersterSchritt', quest: { anzahl: 3 } },
  { id: 'familie-zeit', gruppe: 'familie', problem: 'zeit', domain: 'partner', held: 'khara', gegner: 'hetzra', kette: ['hetzra', 'irrlicht', 'trott', 'jasager'], faehigkeit: 'festeZeit', quest: { anzahl: 1 } },
  { id: 'familie-langeweile', gruppe: 'familie', problem: 'langeweile', domain: 'adventure', held: 'fisker', gegner: 'langeweile', kette: ['langeweile', 'irrlicht', 'gaehnor', 'trott'], faehigkeit: 'ideenglas', quest: { anzahl: 2 } },
  { id: 'familie-anruf', gruppe: 'familie', problem: 'anruf', domain: 'friends', held: 'ahren', gegner: 'einsiedler', kette: ['einsiedler', 'hetzra', 'aufschieberitis', 'trott'], faehigkeit: 'festerAnruf', quest: { anzahl: 1 } },
  { id: 'gelassenheit-wut', gruppe: 'gelassenheit', problem: 'wut', domain: 'mindset', held: 'jelninolan', gegner: 'drycha', kette: ['drycha', 'murrgrim', 'velkra', 'morvane'], faehigkeit: 'bisZehn', quest: { anzahl: 3 } },
  { id: 'gelassenheit-laut', gruppe: 'gelassenheit', problem: 'laut', domain: 'mindset', held: 'jelninolan', gegner: 'drycha', kette: ['drycha', 'murrgrim', 'morvane'], faehigkeit: 'stoppLeise', quest: { anzahl: 3 } },
  { id: 'gelassenheit-stress', gruppe: 'gelassenheit', problem: 'stress', domain: 'mindset', held: 'jelninolan', gegner: 'sturmgeist', kette: ['sturmgeist', 'gedankenkarussell', 'hetzra', 'kritiker'], faehigkeit: 'langAusatmen', quest: { anzahl: 3 } },
  { id: 'gelassenheit-hektik', gruppe: 'gelassenheit', problem: 'hektik', domain: 'mindset', held: 'jelninolan', gegner: 'hetzra', kette: ['hetzra', 'sturmgeist', 'jasager', 'murrgrim'], faehigkeit: 'kurzAnhalten', quest: { anzahl: 3 } },
  { id: 'gelassenheit-gruebeln', gruppe: 'gelassenheit', problem: 'gruebeln', domain: 'mindset', held: 'jelninolan', gegner: 'gedankenkarussell', kette: ['gedankenkarussell', 'kritiker', 'nachtschwaermer', 'sturmgeist'], faehigkeit: 'gedankenParken', quest: { anzahl: 3 } },
  { id: 'gelassenheit-kritiker', gruppe: 'gelassenheit', problem: 'kritiker', domain: 'mindset', held: 'jelninolan', gegner: 'kritiker', kette: ['kritiker', 'gedankenkarussell', 'jasager', 'sturmgeist'], faehigkeit: 'freundesSatz', quest: { anzahl: 3 } },
  { id: 'gelassenheit-jasagen', gruppe: 'gelassenheit', problem: 'jasagen', domain: 'mindset', held: 'jelninolan', gegner: 'jasager', kette: ['jasager', 'hetzra', 'kritiker', 'sturmgeist'], faehigkeit: 'bedenkzeit', quest: { anzahl: 2 } },
  { id: 'gelassenheit-anderes', gruppe: 'gelassenheit', problem: '*', domain: 'mindset', held: 'jelninolan', gegner: 'trott', kette: ['trott', 'sturmgeist', 'gedankenkarussell', 'kritiker'], faehigkeit: 'langAusatmen', quest: { anzahl: 3 } },
  { id: 'familie-anderes', gruppe: 'familie', problem: '*', domain: 'partner', held: 'khara', gegner: 'trott', kette: ['trott', 'hetzra', 'irrlicht', 'einsiedler'], faehigkeit: 'ersterSchritt', quest: { anzahl: 2 } },
  { id: 'fokus-aufschieben', gruppe: 'fokus', problem: 'aufschieben', domain: 'career', held: 'uldini', gegner: 'aufschieberitis', kette: ['aufschieberitis', 'irrlicht', 'trott', 'gaehnor'], faehigkeit: 'ersterSchritt', quest: { anzahl: 3 } },
  { id: 'fokus-ablenkung', gruppe: 'fokus', problem: 'ablenkung', domain: 'career', held: 'uldini', gegner: 'irrlicht', kette: ['irrlicht', 'aufschieberitis', 'hetzra', 'trott'], faehigkeit: 'handyWeg', quest: { anzahl: 3 } },
  { id: 'fokus-anderes', gruppe: 'fokus', problem: '*', domain: 'career', held: 'uldini', gegner: 'trott', kette: ['trott', 'aufschieberitis', 'irrlicht', 'hetzra'], faehigkeit: 'ersterSchritt', quest: { anzahl: 3 } },
  { id: 'finanzen-spontankauf', gruppe: 'finanzen', problem: 'spontankauf', domain: 'finance', held: 'goldwin', gegner: 'kaufrausch', kette: ['kaufrausch', 'geldfresser', 'irrlicht', 'trott'], faehigkeit: 'nachtRegel', quest: { anzahl: 2 } },
  { id: 'finanzen-sparen', gruppe: 'finanzen', problem: 'sparen', domain: 'finance', held: 'goldwin', gegner: 'geldfresser', kette: ['geldfresser', 'kaufrausch', 'aufschieberitis', 'trott'], faehigkeit: 'erstSparen', quest: { anzahl: 1 } },
  { id: 'finanzen-anderes', gruppe: 'finanzen', problem: '*', domain: 'finance', held: 'goldwin', gegner: 'trott', kette: ['trott', 'kaufrausch', 'geldfresser', 'aufschieberitis'], faehigkeit: 'ersterSchritt', quest: { anzahl: 2 } },
  { id: 'lebensfreude-leer', gruppe: 'lebensfreude', problem: 'leer', domain: 'growth', held: 'der-erste', gegner: 'leere', kette: ['leere', 'irrlicht', 'einsiedler', 'trott'], faehigkeit: 'kleineListe', quest: { anzahl: 3 } },
  { id: 'lebensfreude-freunde', gruppe: 'lebensfreude', problem: 'freunde', domain: 'friends', held: 'ahren', gegner: 'einsiedler', kette: ['einsiedler', 'hetzra', 'leere', 'irrlicht'], faehigkeit: 'nachricht', quest: { anzahl: 2 } },
  { id: 'lebensfreude-anderes', gruppe: 'lebensfreude', problem: '*', domain: 'growth', held: 'der-erste', gegner: 'trott', kette: ['trott', 'leere', 'einsiedler', 'irrlicht'], faehigkeit: 'ersterSchritt', quest: { anzahl: 3 } },
  { id: 'allgemein', gruppe: '*', problem: '*', domain: 'growth', held: 'der-erste', gegner: 'trott', kette: ['trott', 'aufschieberitis', 'irrlicht', 'hetzra'], faehigkeit: 'ersterSchritt', quest: { anzahl: 3 } }
];

export const TABELLE = { gruppen: GRUPPEN, probleme: PROBLEME, vorlagen: VORLAGEN, gegner: GEGNER, helden: HELDEN, lebensbereiche: LEBENSBEREICHE, faehigkeiten: FAEHIGKEITEN };

// Prüft die Tabelle auf fehlende oder widersprüchliche Verweise; liefert eine Liste von Fehlertexten.
export function pruefeTabelle(t = TABELLE) {
  const fehler = [];
  const domains = new Set();
  for (const d of t.lebensbereiche || []) {
    if (domains.has(d.id)) fehler.push(`Doppelter Lebensbereich: ${d.id}`);
    domains.add(d.id);
    if (d.held && !t.helden[d.held]) fehler.push(`Lebensbereich ${d.id}: Held ${d.held} fehlt`);
    else if (d.held && t.helden[d.held].domain !== d.id) fehler.push(`Lebensbereich ${d.id}: Held ${d.held} gehört zu ${t.helden[d.held].domain}`);
  }
  for (const [id, h] of Object.entries(t.helden || {})) {
    if (!domains.has(h.domain)) fehler.push(`Held ${id}: Lebensbereich ${h.domain} fehlt`);
  }
  const ids = new Set();
  for (const z of t.vorlagen) {
    if (ids.has(z.id)) fehler.push(`Doppelte Vorlage: ${z.id}`);
    ids.add(z.id);
    if (!domains.has(z.domain)) fehler.push(`${z.id}: Lebensbereich ${z.domain} fehlt`);
    if (!t.helden[z.held]) fehler.push(`${z.id}: Held ${z.held} fehlt`);
    else if (t.helden[z.held].domain !== z.domain) fehler.push(`${z.id}: Held ${z.held} gehört zu ${t.helden[z.held].domain}, nicht ${z.domain}`);
    if (!t.gegner[z.gegner]) fehler.push(`${z.id}: Gegner ${z.gegner} fehlt`);
    if (z.kette !== undefined) {
      if (!Array.isArray(z.kette) || !z.kette.length) fehler.push(`${z.id}: Kette leer`);
      else {
        if (z.kette[0] !== z.gegner) fehler.push(`${z.id}: Kette beginnt nicht mit ${z.gegner}`);
        z.kette.forEach((g, i) => {
          if (!t.gegner[g]) fehler.push(`${z.id}: Gegner ${g} in der Kette fehlt`);
          if (i > 0 && z.kette[i - 1] === g) fehler.push(`${z.id}: Gegner ${g} zweimal hintereinander`);
        });
      }
    }
    if (!t.faehigkeiten[z.faehigkeit]) fehler.push(`${z.id}: Fähigkeit ${z.faehigkeit} fehlt`);
    if (z.tagesfrage !== undefined && !(typeof z.tagesfrage === 'string' && z.tagesfrage.trim())) fehler.push(`${z.id}: Tagesfrage leer`);
    if (z.gruppe !== '*' && !t.gruppen.some(g => g.id === z.gruppe)) fehler.push(`${z.id}: Gruppe ${z.gruppe} fehlt`);
    if (z.problem !== '*' && !(t.probleme[z.gruppe] || []).some(p => p.id === z.problem)) fehler.push(`${z.id}: Problem ${z.problem} fehlt`);
  }
  for (const g of t.gruppen.filter(x => x.onboarding)) {
    for (const p of t.probleme[g.id] || []) {
      if (!t.vorlagen.some(z => z.gruppe === g.id && z.problem === p.id)) fehler.push(`Keine Vorlage für ${g.id}/${p.id}`);
    }
    if (!t.vorlagen.some(z => z.gruppe === g.id && z.problem === '*')) fehler.push(`Kein Rückfall für ${g.id}`);
  }
  for (const [id, f] of Object.entries(t.faehigkeiten || {})) {
    if (f.tagesfrage !== undefined && !(typeof f.tagesfrage === 'string' && f.tagesfrage.trim())) fehler.push(`Fähigkeit ${id}: Tagesfrage leer`);
  }
  if (!t.vorlagen.some(z => z.gruppe === '*' && z.problem === '*')) fehler.push('Keine allgemeine Vorlage (*/*)');
  return fehler;
}
