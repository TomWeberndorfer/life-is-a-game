// Heldenstadt (Version 15): nur Darstellung, keine eigene Progression (Entscheidung: claude/entscheidung-heldenstadt.md).
// Ein Bezirk je Lebensbereich (domainId). Bilder je Stil in stile.js unter `bezirk-<domainId>`;
// fehlt ein Bild, zeigt die App die gezeichnete Silhouette unten (in den Farben des Stils).
// Neuer Lebensbereich ohne Silhouette → Rückfall `_standard`.

// Gezeichnete Silhouetten, viewBox 0 0 64 48. Nur Formen, Farbe kommt aus dem Stil (currentColor).
export const SILHOUETTEN = {
  health: '<path d="M6 44V26a26 14 0 0 1 52 0v18z"/><path d="M12 44V30M20 44V28M28 44V27M36 44V27M44 44V28M52 44V30" style="stroke:var(--panel);stroke-width:2;fill:none"/><rect x="2" y="42" width="60" height="4"/>',
  mindset: '<rect x="24" y="12" width="16" height="32"/><path d="M21 12h22l-4-8H25z"/><rect x="29" y="18" width="6" height="8" style="fill:var(--panel)"/><rect x="18" y="38" width="28" height="6"/><rect x="2" y="44" width="60" height="2"/>',
  partner: '<path d="M10 44V30a22 22 0 0 1 44 0v14h-8V30a14 14 0 0 0-28 0v14z"/><path d="M32 22c-3-4-9-2-8 3 1 4 8 8 8 8s7-4 8-8c1-5-5-7-8-3z"/><circle cx="8" cy="40" r="4"/><circle cx="56" cy="40" r="4"/><rect x="2" y="44" width="60" height="2"/>',
  family: '<path d="M8 26 32 8l24 18v18H8z"/><rect x="27" y="32" width="10" height="12" style="fill:var(--panel)"/><rect x="14" y="28" width="8" height="7" style="fill:var(--panel)"/><rect x="42" y="28" width="8" height="7" style="fill:var(--panel)"/><rect x="44" y="10" width="5" height="10"/><rect x="2" y="44" width="60" height="2"/>',
  friends: '<path d="M4 44V28l10-10 10 10v16z"/><path d="M24 44V24l10-12 10 12v20z"/><path d="M42 44V30l9-9 9 9v14z"/><path d="M8 30h12M28 26h12M46 32h10" style="stroke:var(--panel);stroke-width:2;fill:none"/><rect x="2" y="44" width="60" height="2"/>',
  career: '<rect x="14" y="16" width="36" height="28"/><path d="M10 16h44L32 4z"/><path d="M20 22v16M28 22v16M36 22v16M44 22v16" style="stroke:var(--panel);stroke-width:3;fill:none"/><rect x="10" y="42" width="44" height="2"/><rect x="2" y="44" width="60" height="2"/>',
  finance: '<rect x="12" y="20" width="40" height="24" rx="2"/><path d="M8 20h48L32 6z"/><circle cx="32" cy="32" r="7" style="fill:var(--panel)"/><circle cx="32" cy="32" r="3"/><rect x="2" y="44" width="60" height="2"/>',
  adventure: '<path d="M6 34h52l-8 10H14z"/><path d="M30 6v28h2V6z"/><path d="M32 8l16 20H32z"/><path d="M30 12 16 30h14z"/><path d="M2 44c6-3 10 3 16 0s10 3 16 0 10 3 16 0 8 2 12 0v2H2z"/>',
  growth: '<rect x="10" y="22" width="44" height="22"/><path d="M6 22h52L32 8z"/><path d="M18 28v12M26 28v12M38 28v12M46 28v12" style="stroke:var(--panel);stroke-width:3;fill:none"/><circle cx="32" cy="15" r="3" style="fill:var(--panel)"/><rect x="2" y="44" width="60" height="2"/>',
  _standard: '<path d="M10 44V24l22-16 22 16v20z"/><rect x="27" y="32" width="10" height="12" style="fill:var(--panel)"/><rect x="2" y="44" width="60" height="2"/>'
};
