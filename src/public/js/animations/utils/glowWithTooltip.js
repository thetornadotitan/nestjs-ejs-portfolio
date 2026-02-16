import { makeToolTipTemplate } from '../tooltip-template.js';

function tooltipHoldFor(
  text,
  { base = 0.6, wps = 4.2, min = 1.6, max = 4.0 } = {},
) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const secs = base + words / wps;
  return Math.max(min, Math.min(max, secs));
}

export function addPopGlowWithTooltip(
  tl,
  {
    target, // element or selector (required)
    label = 'pop',
    startAt = 0,
    delay = 0.1,
    hold = undefined,

    // animation (optional overrides)
    scaleUp = 1.1,
    upDur = 0.1,
    downDur = 0.12,
    offset = '0 0',
    size = '1px',

    // tooltip (optional overrides)
    tooltipInstance,
    tooltipTitle = 'Step 1',
    tooltipBody = 'First a user makes a GET request to the hosted public domain.',

    // hide behavior
    hideDelay = 0,
  } = {},
) {
  // ---- internal defaults (extra vars live here) ----
  const tooltipOpts = { clamp: true };
  const heuristic = { base: 1.5, wps: 2.0, min: 2.0, max: 8.0 };

  // compute hold once (non-variable inside timeline)
  const computedHold = hold ? hold : tooltipHoldFor(tooltipBody, heuristic);

  // ---- timeline positions (all derived from label + durations) ----
  const base = `${label}`; // label position
  const scaleUpDoneAt = `${label}+=${upDur}`; // end of scale-up / start of hold
  const scaleDownAt = `${label}+=${upDur + computedHold}`; // start of scale-down
  const doneAt = `${label}+=${upDur + computedHold + downDur}`; // end of scale-down

  // keep your current behavior exactly: show is label + delay (not tied to upDur)
  const showAt = `${label}+=${delay}`;

  // hide is after done (optional extra delay)
  const hideAt = hideDelay
    ? `${label}+=${upDur + computedHold + downDur + hideDelay}`
    : doneAt;

  // single source of truth for labels
  const doneLabel = `${label}:done`;

  // ---- setup ----
  gsap.set(target, { transformOrigin: '50% 50%' });
  tl.addLabel(label, startAt);

  // ---- scale ----
  tl.to(target, { scale: scaleUp, duration: upDur, ease: 'power2.out' }, base);
  tl.to(
    target,
    { scale: scaleUp, duration: computedHold, ease: 'power2.out' },
    scaleUpDoneAt,
  );
  tl.to(
    target,
    { scale: 1, duration: downDur, ease: 'power2.inOut' },
    scaleDownAt,
  );

  // ---- glow (synced to the same phases as scale) ----
  tl.fromTo(
    target,
    { filter: `drop-shadow(${offset} 0 rgba(255,255,255,0))` },
    {
      filter: `drop-shadow(${offset} ${size} var(--accent))`,
      duration: upDur,
      ease: 'power2.out',
    },
    base,
  );
  tl.to(
    target,
    {
      filter: `drop-shadow(${offset} ${size} var(--accent))`,
      duration: computedHold,
      ease: 'power2.out',
    },
    scaleUpDoneAt,
  );
  tl.to(
    target,
    {
      filter: `drop-shadow(${offset} 0 rgba(255,255,255,0))`,
      duration: downDur,
      ease: 'power2.inOut',
    },
    scaleDownAt,
  );

  // ---- tooltip show (exact timing as your current code) ----
  tl.call(
    () => {
      const el =
        typeof target === 'string' ? document.querySelector(target) : target;
      if (!el || !tooltipInstance) return;

      tooltipInstance.showForElement(
        el,
        makeToolTipTemplate(tooltipTitle, tooltipBody),
        tooltipOpts,
      );
    },
    null,
    showAt,
  );

  // ---- done label + tooltip hide ----
  tl.addLabel(doneLabel, doneAt);

  tl.call(
    () => {
      if (!tooltipInstance) return;
      tooltipInstance.hide?.();
    },
    null,
    hideAt,
  );

  return tl;
}
