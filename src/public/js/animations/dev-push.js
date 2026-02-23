// web-request.js
/** @typedef {import('../tooltip.js').Tooltip} Tooltip */
import { drawPath } from './utils/drawPath.js';
import { addPopGlowWithTooltip } from './utils/glowWithTooltip.js';
import { hideAllPaths } from './utils/hideAllPaths.js';

export function createDevPushAnim(tooltip) {
  hideAllPaths(undefined, { resetDraw: true });
  const tl = gsap.timeline({ paused: true });

  tl.call(() => hideAllPaths(), null, 0);

  addPopGlowWithTooltip(tl, {
    target: '#g7',
    label: 'devPop',
    startAt: 0,
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 1',
    tooltipBody:
      'First, a developer pushes new code to a monitored repository.',
  });

  drawPath(tl, {
    target: '#dev2git',
    label: 'dev2gitDraw',
    startAt: 'devPop+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep1', 'devPop:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g24',
    label: 'deployd',
    startAt: 'afterStep1',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 2',
    tooltipBody:
      'Deployd, the deployment daemon, detects the change in the repository.',
  });

  drawPath(tl, {
    target: '#git2dep',
    label: 'git2depDraw',
    startAt: 'deployd+=0.15',
    duration: 0.337,
    from: 'end',
  });

  tl.addLabel('afterStep2', 'deployd:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#rect35',
    label: 'services',
    startAt: 'afterStep2',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 3',
    tooltipBody:
      'Deployd sends rebuild requests to services affected by the change.',
  });

  drawPath(tl, {
    target: '#dep2serv',
    label: 'dep2servDraw',
    startAt: 'services+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep3', 'services:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g56',
    label: 'builder',
    startAt: 'afterStep3',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 4',
    tooltipBody:
      'When a service gets a rebuild request, the builder daemon pulls the latest code, installs dependencies, and rebuilds the service inside its container.',
  });

  drawPath(tl, {
    target: '#build2serv',
    label: 'build2servDraw',
    startAt: 'builder+=0.15',
    duration: 0.337,
    from: 'start',
  });

  return tl;
}
