// web-request.js
/** @typedef {import('../tooltip.js').Tooltip} Tooltip */
import { drawPath } from './utils/drawPath.js';
import { addPopGlowWithTooltip } from './utils/glowWithTooltip.js';
import { hideAllPaths } from './utils/hideAllPaths.js';

export function createDevRequestAnim(tooltip) {
  const tl = gsap.timeline({ paused: true });

  tl.call(() => hideAllPaths(), null, 0);

  addPopGlowWithTooltip(tl, {
    target: '#g7',
    label: 'devPop',
    startAt: 0,
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 1',
    tooltipBody:
      'First, a dev makes a request via the local area network or VPN.',
  });

  drawPath(tl, {
    target: '#dev2lan',
    label: 'dev2lanDraw',
    startAt: 'devPop+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep1', 'devPop:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g31',
    label: 'traefikpri',
    startAt: 'afterStep1',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 2',
    tooltipBody:
      'The request moves directly from the local area network or VPN to Traefik for routing.',
  });

  drawPath(tl, {
    target: '#lan2found',
    label: 'lan2foundDraw',
    startAt: 'traefikpri+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep2', 'traefikpri:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g38',
    label: 'portainer',
    startAt: 'afterStep2',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 3',
    tooltipBody:
      'Traefik matches the host/path rules and routes the request to the correct service.',
  });

  drawPath(tl, {
    target: '#traf2port',
    label: 'traf2portDraw',
    startAt: 'portainer+=0.15',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#traf2ad',
    label: 'traf2adDraw',
    startAt: 'portainer+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep3', 'portainer:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g7',
    label: 'devPopEnd',
    startAt: 'afterStep3',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 4',
    tooltipBody:
      'Finally, the service sends the response back through the same path to the dev, completing the request.',
  });

  return tl;
}
