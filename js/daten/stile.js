// Stil-Register. Feste IDs (nie ändern; wenn doch, alte ID unter `alt`).
// Ein Stil ändert nur Darstellung: Farben ([data-stil=<id>] in index.html), Wörter, Namen, Bilder.
// Wörter: crew = alle Helden zusammen (ohne eigene XP), verbuendeter = ein einzelner Held an deiner Seite.
// Optional je Stil: texte: { 'schluessel': '…' } überschreibt Texte aus daten/texte.js; bezirke: { health: '…' } benennt Bezirke.
// Fehlt ein Wort (z. B. kapitel) oder ein Bezirksname, gilt Fantasy bzw. der Name des Lebensbereichs.
// stadt/bezirk/stadtname: Heldenstadt (nur Darstellung). Bezirksbilder: Bildplatz `bezirk-<domainId>`, sonst gezeichnete Silhouette.
// Regel: Kein Stil leiht Bilder eines anderen. Fehlt ein Bild, zeigt die App den Platzhalter des Stils.
// Archiviert (nur im alten Prototyp): midnight (Mitternachtsgold/Aufgabenplaner), modern, zombie.

export const STIL_REIHENFOLGE = ['fantasy', 'scifi', 'myth', 'cozy', 'monster', 'strasse'];

// Version 33: `waehlbar` je Stil steuert, ob die Welt gewählt werden kann. Gesperrte Welten werden
// in der Auswahl gezeigt, aber mit Schloss. Fehlt das Feld, gilt der Stil als gesperrt (sicherer Rückfall).
// Zum Freigeben einer Welt nur `waehlbar: true` setzen – kein Code ändern.

export const STILE = {
  fantasy: {
    name: 'Fantasy', alt: [], waehlbar: true,
    karte: 'bilder/fantasy/szene.jpg',
    wort: { crew: 'Gefährten', verbuendeter: 'Verbündeter', gegner: 'Gegner', quest: 'Hauptquest', woche: 'Quest der Woche', faehigkeit: 'Fähigkeit', stufe: 'Stufe', sieg: 'besiegt', stadt: 'Stadt', bezirk: 'Bezirk', stadtname: 'Talwacht', kapitel: 'Kapitel' },
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
      // Kopien aus vorhandenen Bildern desselben Stils (Version 16), einzeln ersetzbar
      'bezirk-health': 'bilder/fantasy/bezirk-health.jpg',
      'bezirk-mindset': 'bilder/fantasy/bezirk-mindset.jpg',
      'bezirk-partner': 'bilder/fantasy/bezirk-partner.jpg',
      'bezirk-family': 'bilder/fantasy/bezirk-family.jpg',
      'bezirk-friends': 'bilder/fantasy/bezirk-friends.jpg',
      'bezirk-career': 'bilder/fantasy/bezirk-career.jpg',
      'bezirk-finance': 'bilder/fantasy/bezirk-finance.jpg',
      'bezirk-adventure': 'bilder/fantasy/bezirk-adventure.jpg',
      'bezirk-growth': 'bilder/fantasy/bezirk-growth.jpg',
      'banner-khara': 'bilder/fantasy/banner-khara.jpg',
      'banner-fisker': 'bilder/fantasy/banner-fisker.jpg',
      'banner-uldini': 'bilder/fantasy/banner-uldini.jpg',
      'banner-goldwin': 'bilder/fantasy/banner-goldwin.jpg',
      'banner-der-erste': 'bilder/fantasy/banner-der-erste.jpg',
      'banner-ahren': 'bilder/fantasy/banner-ahren.jpg',
      'boss-heisshunger': 'bilder/fantasy/boss-heisshunger.jpg',
      'boss-kaufrausch': 'bilder/fantasy/boss-kaufrausch.jpg',
      'boss-trott': 'bilder/fantasy/boss-trott.jpg',
      'boss-nachtschwaermer': 'bilder/fantasy/boss-nachtschwaermer.jpg',
      'boss-einsiedler': 'bilder/fantasy/boss-einsiedler.jpg'
    },
    pos: { trogadon: '50% 22%', 'boss-zuckerkobold': '50% 30%' }
  },
  scifi: {
    name: 'Sci-Fi', alt: [], waehlbar: true,
    karte: 'bilder/scifi/karte.jpg',
    wort: { crew: 'Crew', verbuendeter: 'Copilot', gegner: 'Störsignal', quest: 'Hauptmission', woche: 'Mission der Woche', faehigkeit: 'Protokoll', stufe: 'Rang', sieg: 'neutralisiert', stadt: 'Station', bezirk: 'Sektor', stadtname: 'Station Aurora' },
    namen: { trogadon: 'Kommandant Trog-7', khara: 'Funkerin Kha-4', fisker: 'Scout Fisk-3', uldini: 'Administrator Uld-1', goldwin: 'Quartiermeister Gold-5', ahren: 'Offizier Ahr-2' },
    bilder: {
      trogadon: 'bilder/scifi/trogadon.jpg', khara: 'bilder/scifi/khara.jpg', fisker: 'bilder/scifi/fisker.jpg',
      uldini: 'bilder/scifi/uldini.jpg', goldwin: 'bilder/scifi/goldwin.jpg', 'der-erste': 'bilder/scifi/der-erste.jpg',
      ahren: 'bilder/scifi/ahren.jpg',
      // Kopien aus vorhandenen Bildern desselben Stils (Version 16), einzeln ersetzbar
      'bezirk-health': 'bilder/scifi/bezirk-health.jpg',
      'bezirk-mindset': 'bilder/scifi/bezirk-mindset.jpg',
      'bezirk-partner': 'bilder/scifi/bezirk-partner.jpg',
      'bezirk-family': 'bilder/scifi/bezirk-family.jpg',
      'bezirk-friends': 'bilder/scifi/bezirk-friends.jpg',
      'bezirk-career': 'bilder/scifi/bezirk-career.jpg',
      'bezirk-finance': 'bilder/scifi/bezirk-finance.jpg',
      'bezirk-adventure': 'bilder/scifi/bezirk-adventure.jpg',
      'bezirk-growth': 'bilder/scifi/bezirk-growth.jpg',
      'banner-trogadon': 'bilder/scifi/banner-trogadon.jpg',
      'banner-khara': 'bilder/scifi/banner-khara.jpg',
      'banner-fisker': 'bilder/scifi/banner-fisker.jpg',
      'banner-uldini': 'bilder/scifi/banner-uldini.jpg',
      'banner-goldwin': 'bilder/scifi/banner-goldwin.jpg',
      'banner-der-erste': 'bilder/scifi/banner-der-erste.jpg',
      'banner-ahren': 'bilder/scifi/banner-ahren.jpg',
      'szene': 'bilder/scifi/szene.jpg',
      'boss-kaufrausch': 'bilder/scifi/boss-kaufrausch.jpg'
    },
    pos: {}
  },
  myth: {
    name: 'Mythologie', alt: [], waehlbar: false,
    karte: 'bilder/myth/szene.jpg',
    wort: { crew: 'Bund', verbuendeter: 'Gefährte', gegner: 'Prüfung', quest: 'Heldenfahrt', woche: 'Prüfung der Woche', faehigkeit: 'Gabe', stufe: 'Rang', sieg: 'bestanden', stadt: 'Polis', bezirk: 'Viertel', stadtname: 'Neu-Ithaka' },
    namen: { trogadon: 'Trogaides', khara: 'Charis', fisker: 'Fiskeus', uldini: 'Uldinos', goldwin: 'Ploutos', ahren: 'Ahrenos' },
    bilder: { szene: 'bilder/myth/szene.jpg' },
    pos: {}
  },
  cozy: {
    name: 'Cozy', alt: [], waehlbar: false,
    karte: 'bilder/cozy/szene.jpg',
    wort: { crew: 'Nachbarschaft', verbuendeter: 'Nachbar', gegner: 'Sturm', quest: 'Ernteziel', woche: 'Aufgabe der Woche', faehigkeit: 'Werkzeug', stufe: 'Stufe', sieg: 'vorübergezogen', stadt: 'Dorf', bezirk: 'Hof', stadtname: 'Sonnenhang' },
    namen: { trogadon: 'Trogi', khara: 'Kari', fisker: 'Fiski', uldini: 'Uldi', goldwin: 'Goldi', ahren: 'Ahri' },
    bilder: { szene: 'bilder/cozy/szene.jpg',
      // Kopien aus vorhandenen Bildern desselben Stils (Version 16), einzeln ersetzbar
      'bezirk-health': 'bilder/cozy/bezirk-health.jpg',
      'bezirk-mindset': 'bilder/cozy/bezirk-mindset.jpg',
      'bezirk-partner': 'bilder/cozy/bezirk-partner.jpg',
      'bezirk-family': 'bilder/cozy/bezirk-family.jpg',
      'bezirk-friends': 'bilder/cozy/bezirk-friends.jpg',
      'bezirk-career': 'bilder/cozy/bezirk-career.jpg',
      'bezirk-finance': 'bilder/cozy/bezirk-finance.jpg',
      'bezirk-adventure': 'bilder/cozy/bezirk-adventure.jpg',
      'bezirk-growth': 'bilder/cozy/bezirk-growth.jpg',
      'banner-trogadon': 'bilder/cozy/banner-trogadon.jpg',
      'banner-khara': 'bilder/cozy/banner-khara.jpg',
      'banner-fisker': 'bilder/cozy/banner-fisker.jpg',
      'banner-uldini': 'bilder/cozy/banner-uldini.jpg',
      'banner-goldwin': 'bilder/cozy/banner-goldwin.jpg',
      'banner-der-erste': 'bilder/cozy/banner-der-erste.jpg',
      'banner-ahren': 'bilder/cozy/banner-ahren.jpg'
    },
    pos: {}
  },
  monster: {
    name: 'Monsterjäger', alt: [], waehlbar: false,
    karte: 'bilder/monster/szene.jpg',
    wort: { crew: 'Team', verbuendeter: 'Partner', gegner: 'Monster', quest: 'Hauptauftrag', woche: 'Auftrag der Woche', faehigkeit: 'Attacke', stufe: 'Level', sieg: 'gefangen', stadt: 'Basis', bezirk: 'Zone', stadtname: 'Basislager' },
    namen: {},
    bilder: {
      szene: 'bilder/monster/szene.jpg',
      khara: 'bilder/monster/khara.png', fisker: 'bilder/monster/fisker.png', uldini: 'bilder/monster/uldini.png',
      'der-erste': 'bilder/monster/der-erste.png', ahren: 'bilder/monster/ahren.png',
      // Kopien aus vorhandenen Bildern desselben Stils (Version 16), einzeln ersetzbar
      'bezirk-partner': 'bilder/monster/bezirk-partner.png',
      'bezirk-friends': 'bilder/monster/bezirk-friends.png',
      'bezirk-career': 'bilder/monster/bezirk-career.png',
      'bezirk-adventure': 'bilder/monster/bezirk-adventure.png',
      'bezirk-growth': 'bilder/monster/bezirk-growth.png',
      'banner-khara': 'bilder/monster/banner-khara.png',
      'banner-fisker': 'bilder/monster/banner-fisker.png',
      'banner-uldini': 'bilder/monster/banner-uldini.png',
      'banner-der-erste': 'bilder/monster/banner-der-erste.png',
      'banner-ahren': 'bilder/monster/banner-ahren.png'
    },
    pos: {}
  },
  strasse: {
    name: 'Miami Nights', alt: [], waehlbar: true,
    karte: 'bilder/strasse/szene.jpg',
    wort: { crew: 'Crew', verbuendeter: 'Partner', gegner: 'Rivale', quest: 'Hauptmission', woche: 'Mission der Woche', faehigkeit: 'Move', stufe: 'Rang', sieg: 'erledigt', stadt: 'City', bezirk: 'Block', stadtname: 'Neon City' },
    namen: { trogadon: 'Tank Trogg', khara: 'Lady Kay', fisker: 'Captain Fisk', uldini: 'Mr. Uld', goldwin: 'Der Quartiermeister', 'der-erste': 'Brick', ahren: 'Party-Ari' },
    bilder: {
      szene: 'bilder/strasse/szene.jpg',
      trogadon: 'bilder/strasse/trogadon.jpg', khara: 'bilder/strasse/khara.jpg', fisker: 'bilder/strasse/fisker.jpg',
      uldini: 'bilder/strasse/uldini.jpg', 'der-erste': 'bilder/strasse/der-erste.jpg', ahren: 'bilder/strasse/ahren.jpg',
      // Kopien aus vorhandenen Bildern desselben Stils (Version 16), einzeln ersetzbar
      'bezirk-health': 'bilder/strasse/bezirk-health.jpg',
      'bezirk-mindset': 'bilder/strasse/bezirk-mindset.jpg',
      'bezirk-partner': 'bilder/strasse/bezirk-partner.jpg',
      'bezirk-family': 'bilder/strasse/bezirk-family.jpg',
      'bezirk-friends': 'bilder/strasse/bezirk-friends.jpg',
      'bezirk-career': 'bilder/strasse/bezirk-career.jpg',
      'bezirk-adventure': 'bilder/strasse/bezirk-adventure.jpg',
      'bezirk-growth': 'bilder/strasse/bezirk-growth.jpg',
      'banner-trogadon': 'bilder/strasse/banner-trogadon.jpg',
      'banner-khara': 'bilder/strasse/banner-khara.jpg',
      'banner-fisker': 'bilder/strasse/banner-fisker.jpg',
      'banner-uldini': 'bilder/strasse/banner-uldini.jpg',
      'banner-der-erste': 'bilder/strasse/banner-der-erste.jpg',
      'banner-ahren': 'bilder/strasse/banner-ahren.jpg'
    },
    pos: {}
  }
};

// Eigene Bilder aus dem alten Prototyp (Bildspeicher, übernommen am 25.10.2026).
// Haben Vorrang vor den Dateien. Eintrag: [Adresse, Bildausschnitt]. Zoom aus dem alten Prototyp ist noch nicht übernommen.
// GitHub-Pages-Fassung: Bilder aus dem claude.ai-Bildspeicher (/_blob/…) sind hier nicht erreichbar → Dateien gelten.
export const EIGENE_BILDER = {};

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
export const STIL_ARCHIV_VORSCHAU = [
  { id: 'midnight', name: 'Mitternachtsgold' },
  { id: 'modern', name: 'Modern' },
  { id: 'zombie', name: 'Zombie' }
].filter(x => !STILE[x.id]); // Schutz: ein zurückgeholter Stil erscheint nie doppelt

// Alte oder unbekannte IDs → gültige ID (Rückfall: fantasy).
export function stilId(id) {
  if (STILE[id]) return id;
  for (const [k, s] of Object.entries(STILE)) if ((s.alt || []).includes(id)) return k;
  return 'fantasy';
}
