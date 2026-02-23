// web-request.js
/** @typedef {import('../tooltip.js').Tooltip} Tooltip */
import { drawPath } from './utils/drawPath.js';
import { hideAllPaths } from './utils/hideAllPaths.js';

export function createShowPathsAnim(tooltip) {
  hideAllPaths(undefined, { resetDraw: true });
  const tl = gsap.timeline({ paused: true });
  tl.call(() => hideAllPaths(undefined, { resetDraw: true }), null, 0);
  drawPath(tl, {
    target: '#dev2lan',
    startAt: '0',
    label: 't1',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#lan2found',
    startAt: 't1:done',
    label: 't12',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#traf2port',
    startAt: 't12:done',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#traf2ad',
    startAt: 't12:done',
    duration: 0.337,
    from: 'start',
  });

  // next

  drawPath(tl, {
    target: '#dev2git',
    startAt: '0',
    label: 't2',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#git2dep',
    startAt: 't2:done',
    label: 't21',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#dep2serv',
    startAt: 't21:done',
    label: 't22',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#build2serv',
    startAt: 't22:done',
    duration: 0.337,
    from: 'start',
  });

  // next

  drawPath(tl, {
    target: '#user2web',
    startAt: '0',
    label: 't3',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#web2found',
    startAt: 't3:done',
    label: 't31',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#tun2traf',
    startAt: 't31:done',
    label: 't32',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#traf2website',
    startAt: 't32:done',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#traf2tool',
    startAt: 't32:done',
    duration: 0.337,
    from: 'start',
  });

  return tl;
}
