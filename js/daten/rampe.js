// Einstiegsrampe (Entscheidung 30.10.2026): Gegner werden schwerer, bis das eigene Ziel erreicht ist.
// Der erste Gegner braucht `start` Anwendungen, jeder weitere `schritt` mehr, höchstens das Ziel der Quest (quest.anzahl).
// Beispiel start 1, schritt 1: Ziel 3 → 1, 2, 3, 3 … · Ziel 5 → 1, 2, 3, 4, 5, 5 … · Ziel 1 → immer 1.
// Warum: ein schneller erster Sieg (Selbstwirksamkeit), dann steigende Anforderung (Flow), aber nie über das eigene Ziel
// hinaus (Autonomie; tägliche Pflicht würde Alles-oder-nichts-Denken fördern). Mehr als das Ziel nur freiwillig (Backlog).
//
// Gilt für NEUE Quests: die Regel wird beim Anlegen in die Quest kopiert (quest.rampe) und bleibt für sie fest, auch wenn
// sich dieser Wert später ändert. Quests von vorher behalten die feste Anzahl. null = Rampe aus für neue Quests.
// Logik: logik/kern.js (rundenZiel, bereinigeRampe, pruefeRampe).
export const RAMPE = { start: 1, schritt: 1 };
