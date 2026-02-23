export function drawPath(
  tl,
  {
    target,
    label = 'draw',
    startAt = 0,
    duration = 0.6,
    ease = 'power2.out',
    from = 'start',
    fade = true,
  } = {},
) {
  const el =
    typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return tl;

  tl.addLabel(label, startAt);

  if (typeof el.getTotalLength !== 'function') {
    // show element deterministically
    if (fade) tl.to(el, { autoAlpha: 1, duration: 0.12 }, label);
    else tl.set(el, { autoAlpha: 1 }, label);

    tl.addLabel(`${label}:done`, label);
    return tl;
  }

  const len = el.getTotalLength();

  // PREP happens at runtime (at label), not at creation time
  tl.set(
    el,
    {
      strokeDasharray: len,
      strokeDashoffset: from === 'end' ? -len : len,
      ...(fade ? { autoAlpha: 1 } : null),
    },
    label,
  );

  if (fade) {
    // don't use fromTo(autoAlpha:0) which forces a snap; just ensure visible
    tl.to(el, { autoAlpha: 1, duration: 0.12 }, label);
  }

  tl.to(el, { strokeDashoffset: 0, duration, ease }, label);

  tl.addLabel(`${label}:done`, `${label}+=${duration}`);
  return tl;
}

export function undrawPath(
  tl,
  {
    target,
    label = 'undraw',
    startAt = 0,
    duration = 0.6,
    ease = 'power2.in',
    to = 'start',
    fade = true,
  } = {},
) {
  const el =
    typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return tl;

  tl.addLabel(label, startAt);

  // if (typeof el.getTotalLength !== 'function') {
  //   if (fade) tl.to(el, { autoAlpha: 0, duration: 0.12 }, label);
  //   else tl.set(el, { autoAlpha: 0 }, label);

  //   tl.addLabel(`${label}:done`, label);
  //   return tl;
  // }

  const len = el.getTotalLength();

  // Ensure it's visible and fully drawn at runtime before retracting
  tl.set(
    el,
    {
      strokeDasharray: len,
      strokeDashoffset: 0,
      ...(fade ? { autoAlpha: 1 } : null),
    },
    label,
  );

  tl.to(
    el,
    {
      strokeDashoffset: to === 'end' ? -len : len,
      duration,
      ease,
    },
    label,
  );

  if (fade) {
    tl.to(
      el,
      { autoAlpha: 0, duration: 0.12 },
      `${label}+=${Math.max(0, duration - 0.12)}`,
    );
  } else {
    tl.set(el, { autoAlpha: 0 }, `${label}+=${duration}`);
  }

  tl.addLabel(`${label}:done`, `${label}+=${duration}`);
  return tl;
}
