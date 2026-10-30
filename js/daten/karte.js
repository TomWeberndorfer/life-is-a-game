// Karte (30.10.2026): Einstellungen der Reise-Chronik (Logik: logik/karte.js, Ansicht: ansicht/karte.js).
// voraus  wie viele kommende Gegner als Silhouette erscheinen (0–3, sonst Standard 1); danach immer Nebel.
//         Die Vergangenheit zeigt die Karte immer vollständig.
export const KARTE = { voraus: 1 };

// Zeichnung des Pfads: Höhe einer Zeile (px) und Lage der Orte (Prozent der Breite, abwechselnd links/rechts).
export const KARTE_PFAD = { zeile: 84, links: 22, rechts: 78 };
