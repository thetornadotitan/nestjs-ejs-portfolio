export const pathIds = [
  'user2web',
  'web2found',
  'tun2traf',
  'traf2website',
  'traf2tool',
  'dev2lan',
  'lan2found',
  'traf2port',
  'traf2ad',
  'dev2git',
  'git2dep',
  'dep2serv',
  'build2serv',
];

/**
 * Normalize ids/selectors into CSS selectors, de-dupe, and filter invalid.
 */
function normalizePathSelectors(idsOrSelectors) {
  const uniq = new Set();

  for (const v of idsOrSelectors || []) {
    if (!v) continue;
    const s = String(v).trim();
    if (!s) continue;

    // If it already looks like a selector (#foo, .bar, svg path, [attr], etc.) keep it.
    // Otherwise treat it as an id.
    uniq.add(
      s.startsWith('#') ||
        s.startsWith('.') ||
        s.includes(' ') ||
        s.startsWith('[')
        ? s
        : `#${s}`,
    );
  }

  return [...uniq];
}

/**
 * Hide all paths (opacity + visibility), and optionally reset draw state.
 * Safe to call at start/end of any animation.
 */
export function hideAllPaths(
  idsOrSelectors = pathIds,
  { resetDraw = false } = {},
) {
  const selectors = normalizePathSelectors(idsOrSelectors);
  const els = selectors.flatMap((sel) =>
    Array.from(document.querySelectorAll(sel)),
  );

  if (!els.length) return;

  if (resetDraw) {
    // If you use stroke-dash drawing, this clears it so next draw can re-init cleanly.
    gsap.set(els, { strokeDasharray: '', strokeDashoffset: '' });
  }

  gsap.set(els, { autoAlpha: 0 });
}

/**
 * Show all paths (opacity + visibility).
 */
/**
 * Show all paths (opacity + visibility), optionally normalizing dash state for determinism.
 *
 * - ensureDrawn: sets dasharray + dashoffset=0 (fully drawn)
 * - ensureDash: sets dasharray if missing; does NOT force dashoffset unless missing
 */
export function showAllPaths(
  idsOrSelectors = pathIds,
  { ensureDrawn = false, ensureDash = false } = {},
) {
  const selectors = normalizePathSelectors(idsOrSelectors);
  const els = selectors.flatMap((sel) =>
    Array.from(document.querySelectorAll(sel)),
  );

  if (!els.length) return;

  if (ensureDrawn || ensureDash) {
    els.forEach((el) => {
      if (!el || typeof el.getTotalLength !== 'function') return;

      const len = el.getTotalLength();
      const cs = window.getComputedStyle(el);

      // If dash isn't set, initialize it
      const dasharray = cs.strokeDasharray;
      const hasDash =
        dasharray &&
        dasharray !== 'none' &&
        Number.isFinite(parseFloat(dasharray));

      if (!hasDash) {
        gsap.set(el, { strokeDasharray: len });
        // If we’re just ensuring dash, give it a sane default start
        if (ensureDash && !ensureDrawn) {
          // leave current dashoffset alone if it exists; otherwise set to 0
          const currentDashoffset = parseFloat(cs.strokeDashoffset);
          if (!Number.isFinite(currentDashoffset)) {
            gsap.set(el, { strokeDashoffset: 0 });
          }
        }
      } else if (ensureDrawn) {
        // ensureDasharray is correct even if already set
        gsap.set(el, { strokeDasharray: len });
      }

      // If asked, force fully drawn
      if (ensureDrawn) {
        gsap.set(el, { strokeDashoffset: 0 });
      }
    });
  }

  gsap.set(els, { autoAlpha: 1 });
}
