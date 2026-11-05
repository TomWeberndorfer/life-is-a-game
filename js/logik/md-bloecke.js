// Allgemeiner Markdown-Leser für Inhalts-Dateien (02.11.2026, Chat „v113 – Helden – Wege und Ziele aus Markdown“).
// Grundlage für jeden Inhaltstyp, der in Obsidian gepflegt wird (Startpakete, später Bosse, Gestalten …). Er kennt
// keine Bedeutung, nur die Form: Überschriften bilden einen Baum, darunter Punkte („- …“) und Absätze, jeweils mit
// Zeilennummer für verständliche Fehlermeldungen. Was ein Block bedeutet, entscheidet das Modul des Inhaltstyps.
// Reine Funktionen, kein Dateizugriff, wirft nie.
//
// Form:
//   # / ## / ### …  <Text>     Überschrift (Ebene = Zahl der #). Eine Ebene darf nicht übersprungen werden.
//   - <Text>                   Punkt (auch „* “). „- feld: wert“ teilt teileFeld() in Schlüssel und Wert.
//   <Text>                     Absatz; Folgezeilen gehören dazu, eine Leerzeile beendet ihn.
//   > <Text>                   Notiz, wird ignoriert (Hilfe in der Datei, Namen zum Nachlesen).
//   [[id]] oder [[id|Text]]    Obsidian-Link auf eine ID; ohneLink() liefert die ID.
// Obsidian-Komfort (Version 128, 04.11.2026): vorbereiteZeilen() entfernt vor dem Lesen, was Obsidian-Plugins
// in die Datei schreiben, damit die Bedeutung gleich bleibt:
//   - Frontmatter am Dateianfang („---“ … „---“), z. B. Einstellungen des Plugins „Number Headings“
//   - Titelzeile aus einer Abfrage, z. B. „# `=this.file.name`“ (Obsidian zeigt dort den Dateinamen)
//   - führende Nummern in Überschriften („## 1.2 Held …“), samt einem folgenden „·“ und der alten
//     Teilnummer „1 · “ der Geschichten. Folge: ein Titel darf nicht selbst mit einer Zahl beginnen.
// Zeilennummern bleiben erhalten (entfernte Zeilen werden leer). Auch inhalte-md.js nutzt das.

const UEBERSCHRIFT = /^(#{1,6})\s+(.+)$/;
const PUNKT = /^[-*]\s+(.*)$/;
const FELD = /^([A-Za-zÄÖÜäöüß][A-Za-z0-9ÄÖÜäöüß_-]*)\s*:\s*(.*)$/;
const LINK = /^\[\[\s*([^\]|]+?)\s*(?:\|[^\]]*)?\]\]$/;
export const ID = /^[a-z0-9][a-z0-9_-]*$/;
const TITELZEILE = /^#{1,6}\s*`?\s*=/;

// Überschrift ohne führende Nummer: „1.2 Held“ → „Held“, „1 · Das Knistern“ → „Das Knistern“,
// „1.1.1 1 · Das Knistern“ → „Das Knistern“. Nur eine Nummer → ''.
export function ohneNummer(titel) {
  return String(titel ?? '').trim()
    .replace(/^\d+(?:\.\d+)*\.?(?:\s+|$)/, '')
    .replace(/^·\s*/, '')
    .replace(/^\d+\s*·\s*/, '')
    .trim();
}

// Titelzeile einer Obsidian-Abfrage („# `=this.file.name`“, auch „#=this.file.name“)?
export const istTitelzeile = zeile => TITELZEILE.test(String(zeile ?? '').trim());

// Text → { zeilen, fehler }: Zeilen (ohne Zeilenende) mit Frontmatter und Titelzeilen als Leerzeilen und
// Überschriften ohne führende Nummer. Wirft nie.
export function vorbereiteZeilen(text) {
  const fehler = [];
  const zeilen = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  if (zeilen[0].trim() === '---') {
    const ende = zeilen.findIndex((z, i) => i > 0 && z.trim() === '---');
    if (ende > 0) for (let i = 0; i <= ende; i++) zeilen[i] = '';
    else fehler.push('Zeile 1: Frontmatter („---“) ohne schließendes „---“');
  }
  zeilen.forEach((roh, i) => {
    const z = roh.trim();
    if (istTitelzeile(z)) { zeilen[i] = ''; return; }
    const m = /^(#{1,6})\s+(.+)$/.exec(z);
    if (!m) return;
    const t = ohneNummer(m[2]);
    if (t) zeilen[i] = `${m[1]} ${t}`;
    else { fehler.push(`Zeile ${i + 1}: Überschrift „${z}“ hat nach der Nummer keinen Text`); zeilen[i] = ''; }
  });
  return { zeilen, fehler };
}

// Text → { wurzel, fehler }. wurzel = { ebene: 0, titel: '', zeile: 0, punkte: [], absaetze: [], kinder: [] };
// jeder Block hat dieselbe Form. punkte: [{ text, zeile }], absaetze: [{ text, zeile }].
export function leseBloecke(text) {
  const neu = (ebene, titel, zeile) => ({ ebene, titel, zeile, punkte: [], absaetze: [], kinder: [] });
  const wurzel = neu(0, '', 0);
  if (typeof text !== 'string' || !text.trim()) return { wurzel, fehler: ['Die Datei ist leer.'] };
  const { zeilen, fehler } = vorbereiteZeilen(text);
  const stapel = [wurzel];
  let absatz = null;
  const schliesse = () => { if (absatz) { absatz.text = absatz.text.replace(/\s+/g, ' ').trim(); absatz = null; } };

  zeilen.forEach((roh, i) => {
    const nr = i + 1;
    const z = roh.trim();
    if (!z) { schliesse(); return; }
    if (z.startsWith('>')) return;
    let m;
    if ((m = UEBERSCHRIFT.exec(z))) {
      schliesse();
      const ebene = m[1].length;
      while (stapel[stapel.length - 1].ebene >= ebene) stapel.pop();
      const eltern = stapel[stapel.length - 1];
      if (ebene > eltern.ebene + 1) fehler.push(`Zeile ${nr}: „${m[1]} ${m[2].trim()}“ steht ohne Überschrift der Ebene ${'#'.repeat(eltern.ebene + 1)} darüber`);
      const b = neu(ebene, m[2].trim(), nr);
      eltern.kinder.push(b);
      stapel.push(b);
      return;
    }
    const block = stapel[stapel.length - 1];
    if ((m = PUNKT.exec(z))) { schliesse(); block.punkte.push({ text: m[1].trim(), zeile: nr }); return; }
    if (absatz) absatz.text += ' ' + z;
    else { absatz = { text: z, zeile: nr }; block.absaetze.push(absatz); }
  });
  schliesse();
  return { wurzel, fehler };
}

// „feld: wert“ → { feld (klein), wert } oder null. Der Wert darf leer sein (Platzhalter in der Vorlage).
export function teileFeld(text) {
  const m = FELD.exec(String(text ?? '').trim());
  return m ? { feld: m[1].toLowerCase(), wert: m[2].trim() } : null;
}

// „[[id]]“, „[[id|Anzeige]]“ oder „id“ → { id, link }. Leerer Text → { id: '', link: false }.
export function ohneLink(text) {
  const t = String(text ?? '').trim();
  const m = LINK.exec(t);
  return m ? { id: m[1], link: true } : { id: t, link: false };
}

// Zahl im deutschen oder englischen Format: „32,3“, „32.3“, „15000“, „15.000“ (Tausenderpunkt), „-2“.
// Leer → null; nicht lesbar → NaN (der Aufrufer meldet den Fehler mit Zeile).
export function alsZahl(text) {
  const t = String(text ?? '').trim().replace(/[\s ]/g, '');
  if (!t) return null;
  let s = t;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d+(,\d+)?$/.test(s)) s = s.replace(',', '.');
  else if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

// Datum „2027-06-30“ oder „30.06.2027“ → „2027-06-30“. Leer → null; ungültig → undefined.
export function alsDatum(text) {
  const t = String(text ?? '').trim();
  if (!t) return null;
  let j, mo, ta, m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t))) [, j, mo, ta] = m;
  else if ((m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(t))) [, ta, mo, j] = m;
  else return undefined;
  const d = new Date(Number(j), Number(mo) - 1, Number(ta), 12);
  if (d.getFullYear() !== Number(j) || d.getMonth() !== Number(mo) - 1 || d.getDate() !== Number(ta)) return undefined;
  return `${j}-${String(mo).padStart(2, '0')}-${String(ta).padStart(2, '0')}`;
}

// Zahl für die Datei: Komma statt Punkt („32,3“), ganze Zahlen ohne Tausenderpunkt.
export const zahlText = x => (typeof x === 'number' && Number.isFinite(x) ? String(x).replace('.', ',') : '');
