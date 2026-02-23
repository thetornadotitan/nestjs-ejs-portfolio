/** @typedef {import('../tooltip.js').Tooltip} Tooltip */
import { undrawPath } from './utils/drawPath.js';
import { showAllPaths } from './utils/hideAllPaths.js';

export function createHidePathsAnim(tooltip) {
  showAllPaths(undefined, { ensureDrawn: true, ensureDash: true });
  const tl = gsap.timeline({ paused: true });
  tl.call(
    () => showAllPaths(undefined, { ensureDrawn: true, ensureDash: true }),
    null,
    0,
  );

  // Group 1: LAN / internal request flow (reverse order)
  undrawPath(tl, {
    target: '#traf2port',
    startAt: 0,
    label: 'h1',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#traf2ad',
    startAt: 'h1:done',
    label: 'h12',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#lan2found',
    startAt: 'h12:done',
    label: 'h13',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#dev2lan',
    startAt: 'h13:done',
    label: 'h14',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  // Group 2: Dev push / deploy flow (reverse order)
  undrawPath(tl, {
    target: '#build2serv',
    startAt: 0,
    label: 'h2',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#dep2serv',
    startAt: 'h2:done',
    label: 'h21',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#git2dep',
    startAt: 'h21:done',
    label: 'h22',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#dev2git',
    startAt: 'h22:done',
    label: 'h23',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  // Group 3: Public web request flow (reverse order)
  undrawPath(tl, {
    target: '#traf2website',
    startAt: 0,
    label: 'h3',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#traf2tool',
    startAt: 'h3:done',
    label: 'h31',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#tun2traf',
    startAt: 'h31:done',
    label: 'h32',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#web2found',
    startAt: 'h32:done',
    label: 'h33',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  undrawPath(tl, {
    target: '#user2web',
    startAt: 'h33:done',
    label: 'h34',
    duration: 0.337,
    to: 'start',
    skipIfUndrawn: false,
    fade: true, // keep true if you like the fade-out, but read note below
  });

  return tl;
}
