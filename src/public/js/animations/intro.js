export function createIntroAnim() {
  const tl = gsap.timeline({ paused: true });

  // set initial states first
  tl.set(
    [
      '#g66',
      '#g65',
      '#g17',
      '#g50',
      '#g28',
      '#g19',
      '#g31',
      '#g33',
      '#g43',
      '#g40',
      '#g38',
      '#g49',
      '#g24',
      '#g56',
      '#g6',
      '#g15',
      '#g7',
      '#g61',
      '#g62',
      '#stack-btns',
    ],
    { opacity: 0 },
  );

  // reveal wrapper immediately after set
  tl.set('.stack-stage', { visibility: 'visible' });

  // Main Blocks
  tl.from('#g66', { y: 200, opacity: 0, duration: 1.2, ease: 'power2.out' });
  tl.from(
    '#g65',
    { y: 200, opacity: 0, duration: 1.2, ease: 'power2.out' },
    '-=.8',
  );

  // Foundations and Services
  tl.from(
    '#g17',
    {
      scaleX: 0,
      opacity: 0,
      transformOrigin: 'left center',
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=.8',
  );
  tl.from(
    '#g50',
    {
      scaleX: 0,
      opacity: 0,
      transformOrigin: 'right center',
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.8',
  );

  //Individual Services
  //Foundations:
  tl.from(
    '#g28',
    {
      x: 80,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=.4',
  );
  tl.from(
    '#g19',
    {
      x: 80,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=.2',
  );
  tl.from(
    '#g31',
    {
      x: 80,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=.2',
  );
  tl.from(
    '#g33',
    {
      x: 80,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=.2',
  );

  //Services:
  tl.from(
    '#g43',
    {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=1.8',
  );
  tl.from(
    '#g40',
    {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=1.4',
  );
  tl.from(
    '#g38',
    {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=1.0',
  );
  tl.from(
    '#g49',
    {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.6',
  );

  // Ancelary services
  tl.from(
    '#g24',
    {
      scaleX: 0,
      opacity: 0,
      transformOrigin: 'left center',
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.2',
  );
  tl.from(
    '#g56',
    {
      scaleX: 0,
      opacity: 0,
      transformOrigin: 'right center',
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.6',
  );

  //externals
  tl.from(
    '#g6',
    {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.4',
  );
  tl.from(
    '#g15',
    {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.4',
  );
  tl.from(
    '#g7',
    {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.4',
  );

  //Gateways
  tl.from(
    '#g61',
    {
      y: -20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.4',
  );
  tl.from(
    '#g62',
    {
      y: 155,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.4',
  );

  tl.from(
    '#stack-btns',
    {
      scaleY: 0,
      transformOrigin: 'center top',
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    },
    '-=0.4',
  );

  return tl;
}
