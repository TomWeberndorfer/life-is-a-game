// Speicher-Adapter. Heute: Browser (ein Spielstand je Tester und Browser).
// Später austauschbar gegen die Datenbank der Seite, ohne Änderungen an Logik oder Oberfläche.

const PREFIX = 'liag.mvp.';

function sicher(fn, fallback) {
  try { return fn(); } catch (e) { return fallback; }
}

export function erstelleSpeicher(profil = 'haupt') {
  const key = PREFIX + profil + '.stand';
  const idKey = PREFIX + 'tester';
  const fluechtig = {}; // wenn der Browser nichts speichern darf
  let verfuegbar = sicher(() => {
    const t = PREFIX + 'probe';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return true;
  }, false);

  function lies(k) {
    return verfuegbar ? sicher(() => localStorage.getItem(k), null) : (fluechtig[k] ?? null);
  }
  function schreib(k, v) {
    if (verfuegbar) {
      const ok = sicher(() => { localStorage.setItem(k, v); return true; }, false);
      if (ok) return true;
      verfuegbar = false; // z. B. Speicher voll oder gesperrt
    }
    fluechtig[k] = v;
    return false;
  }

  return {
    get verfuegbar() { return verfuegbar; },
    testerId() {
      let id = lies(idKey);
      if (!id || !/^[a-z0-9-]{8,64}$/i.test(id)) {
        id = sicher(() => crypto.randomUUID(), null) || ('t-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
        schreib(idKey, id);
      }
      return id;
    },
    laden() {
      const roh = lies(key);
      if (!roh) return { stand: null, fehler: null };
      try { return { stand: JSON.parse(roh), fehler: null }; }
      catch (e) { return { stand: null, fehler: 'Der gespeicherte Spielstand war beschädigt und wurde neu angelegt.' }; }
    },
    speichern(stand) {
      return schreib(key, JSON.stringify(stand));
    },
    loeschen() {
      if (verfuegbar) sicher(() => localStorage.removeItem(key), null);
      delete fluechtig[key];
    }
  };
}
