// web-request.js
/** @typedef {import('../tooltip.js').Tooltip} Tooltip */
import { drawPath } from './utils/drawPath.js';
import { addPopGlowWithTooltip } from './utils/glowWithTooltip.js';
import { hideAllPaths } from './utils/hideAllPaths.js';

export function createWebRequestAnim(tooltip) {
  const tl = gsap.timeline({ paused: true });

  tl.call(() => hideAllPaths(), null, 0);

  addPopGlowWithTooltip(tl, {
    target: '#g6',
    label: 'userPop',
    startAt: 0,
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 1',
    tooltipBody: 'First, a user makes a request to the configured domain.',
  });

  drawPath(tl, {
    target: '#user2web',
    label: 'user2webDraw',
    startAt: 'userPop+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep1', 'userPop:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g28',
    label: 'tunnel',
    startAt: 'afterStep1',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 2',
    tooltipBody:
      'Cloudflare receives the request (via DNS) and forwards it through the Cloudflared Tunnel.',
  });

  drawPath(tl, {
    target: '#web2found',
    label: 'web2foundDraw',
    startAt: 'tunnel+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep2', 'tunnel:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g19',
    label: 'traefikpub',
    startAt: 'afterStep2',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 3',
    tooltipBody:
      'The Cloudflared Tunnel service forwards the request to Traefik for routing.',
  });

  drawPath(tl, {
    target: '#tun2traf',
    label: 'tun2trafDraw',
    startAt: 'traefikpub+=0.15',
    duration: 0.337,
    from: 'end',
  });

  tl.addLabel('afterStep3', 'traefikpub:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g43',
    label: 'website',
    startAt: 'afterStep3',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 4',
    tooltipBody:
      'Traefik matches the host/path rules and routes the request to the correct service.',
  });

  drawPath(tl, {
    target: '#traf2website',
    label: 'traf2websiteDraw',
    startAt: 'website+=0.15',
    duration: 0.337,
    from: 'start',
  });

  drawPath(tl, {
    target: '#traf2tool',
    label: 'traf2toolDraw',
    startAt: 'website+=0.15',
    duration: 0.337,
    from: 'start',
  });

  tl.addLabel('afterStep4', 'website:done+=1.0');

  addPopGlowWithTooltip(tl, {
    target: '#g6',
    label: 'userPopEnd',
    startAt: 'afterStep4',
    tooltipInstance: tooltip,
    tooltipTitle: 'Step 5',
    tooltipBody:
      'Finally, the service sends the response back through the same path to the user, completing the request.',
  });

  return tl;
}
