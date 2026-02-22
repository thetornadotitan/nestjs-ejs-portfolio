export function drawPath(
  tl,
  {
    target, // selector or element
    label = 'draw',
    startAt = 0, // timeline position (label or seconds)
    duration = 0.6,
    ease = 'power2.out',
    from = 'start', // "start" | "end"
    fade = true,
  } = {},
) {
  const el =
    typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return tl;

  // Works on <path>, <line>, <polyline>, etc. (anything with getTotalLength)
  const len = el.getTotalLength();

  // prep
  gsap.set(el, {
    strokeDasharray: len,
    strokeDashoffset: from === 'end' ? -len : len,
    ...(fade ? { autoAlpha: 1 } : null),
  });

  tl.addLabel(label, startAt);

  // optional: fade in slightly as it draws
  if (fade) {
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, label);
  }

  tl.to(
    el,
    {
      strokeDashoffset: 0,
      duration,
      ease,
    },
    label,
  );

  return tl;
}
