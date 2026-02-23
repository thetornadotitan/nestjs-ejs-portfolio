import { createDevPushAnim } from './animations/dev-push.js';
import { createDevRequestAnim } from './animations/dev-request.js';
import { createHidePathsAnim } from './animations/hide-paths.js';
import { createIntroAnim } from './animations/intro.js';
import { createShowPathsAnim } from './animations/show-paths.js';
import { createWebRequestAnim } from './animations/web-request.js';
import { Tooltip } from './tooltip.js';

let webRequestTl = null;
let devRequestTl = null;
let devPushTl = null;
let showPathsTl = null;
let hidePathsTl = null;

const legendTooltip = new Tooltip({
  el: '#stack-tooltip',
  hideDelay: 250,
  offset: { x: 12, y: -50 },
  anchor: 'page', // absolute; scroll-aware
});

const processTooltip = new Tooltip({
  el: '#process-tooltip',
  hideDelay: 150,
  offset: { x: 12, y: -10 },
  anchor: 'page',
  makeListeners: false,
});

function setupLegendHover() {
  const elementToHTMLMap = {
    g6: templateHTML('user-tooltip'),
    g15: templateHTML('github-tooltip'),
    g7: templateHTML('dev-tooltip'),
    g61: templateHTML('web-tooltip'),
    g62: templateHTML('lan-tooltip'),
    g24: templateHTML('deployd-tooltip'),
    g28: templateHTML('tunnel-tooltip'),
    g19: templateHTML('pubtraefik-tooltip'),
    g31: templateHTML('pritraefik-tooltip'),
    g33: templateHTML('adguard-tooltip'),
    g56: templateHTML('builder-tooltip'),
    g43: templateHTML('website-tooltip'),
    g40: templateHTML('public-tool-tooltip'),
    g38: templateHTML('portainer-tooltip'),
    g49: templateHTML('adguard-ui-tooltip'),
  };

  Object.keys(elementToHTMLMap).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return console.warn(`Element with id ${id} not found`);

    const show = () => {
      if (!processTooltip.isOpen) {
        const html = elementToHTMLMap[id];
        if (html) legendTooltip.showForElement(el, html);
      }
    };

    // Hover (mouse only)
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') show();
    });

    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') legendTooltip.hideDelayed();
    });

    // Tap/click (touch + mouse)
    el.addEventListener('click', show);
  });

  // Close when tapping/clicking outside
  // Close when the user taps outside (but NOT when they scroll)
  let downX = 0;
  let downY = 0;
  let moved = false;
  let downTarget = null;

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!legendTooltip.isOpen) return;

      moved = false;
      downX = e.clientX;
      downY = e.clientY;
      downTarget = e.target;

      // Capture so we still get pointerup even if the finger leaves the element
      try {
        e.target.setPointerCapture?.(e.pointerId);
      } catch {}
    },
    { passive: true },
  );

  document.addEventListener(
    'pointermove',
    (e) => {
      if (!legendTooltip.isOpen) return;

      // If the finger moves more than a few px, treat it as scroll/drag
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if (dx > 8 || dy > 8) moved = true;
    },
    { passive: true },
  );

  document.addEventListener(
    'pointerup',
    (e) => {
      if (!legendTooltip.isOpen) return;
      if (moved) return; // user was scrolling—don’t close

      const t = downTarget || e.target;
      const insideTip = legendTooltip.el.contains(t);
      const onTrigger =
        legendTooltip.openedBy && legendTooltip.openedBy.contains(t);

      if (!insideTip && !onTrigger) legendTooltip.hide();
    },
    { passive: true },
  );
}

function templateHTML(id) {
  const tpl = document.getElementById(id);
  return tpl ? tpl.innerHTML.trim() : '';
}

function setupAnimationButtons() {
  document.getElementById('btn-sim-user-request').onclick = () => {
    if (!webRequestTl) webRequestTl = createWebRequestAnim(processTooltip);
    stopAllTimelines(webRequestTl);
    webRequestTl.restart(true);
  };

  document.getElementById('btn-sim-dev-request').onclick = () => {
    if (!devRequestTl) devRequestTl = createDevRequestAnim(processTooltip);
    stopAllTimelines(devRequestTl);
    devRequestTl.restart(true);
  };

  document.getElementById('btn-sim-dev-push').onclick = () => {
    if (!devPushTl) devPushTl = createDevPushAnim(processTooltip);
    stopAllTimelines(devPushTl);
    devPushTl.restart(true);
  };

  document.getElementById('btn-show-paths').onclick = () => {
    if (!showPathsTl) showPathsTl = createShowPathsAnim(processTooltip);
    stopAllTimelines(showPathsTl);
    showPathsTl.restart(true);
  };

  document.getElementById('btn-hide-paths').onclick = () => {
    if (!hidePathsTl) hidePathsTl = createHidePathsAnim(processTooltip);
    stopAllTimelines(hidePathsTl);
    hidePathsTl.restart(true);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const intro = createIntroAnim();

  intro.eventCallback('onComplete', () => {
    setupLegendHover();
    setupAnimationButtons();
  });

  intro.restart().play();
});

function stopAllTimelines(exceptTl = null) {
  const timelines = [
    webRequestTl,
    devRequestTl,
    devPushTl,
    showPathsTl,
    hidePathsTl,
  ].filter(Boolean);

  timelines.forEach((tl) => {
    if (tl === exceptTl) return;
    tl.pause();
    // reset without triggering callbacks / from() re-application
    tl.invalidate().progress(0, true);
  });

  processTooltip.hide?.();
}
