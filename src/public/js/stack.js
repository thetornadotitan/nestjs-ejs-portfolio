let tooltipShowing = false;
let tooltipTimeout = 300;
let tooltipTimeoutId = null;
let tooltipOpenedby = null;

function createIntroTimeline() {
  console.log('Creating intro timeline');
  const tl = gsap.timeline({ paused: true });

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

function setupTooltipHover() {
  const tooltip = document.getElementById('stack-tooltip');
  tooltip.addEventListener('mouseenter', () => {
    console.log('Tooltip mouse enter');
    clearTimeout(tooltipTimeoutId);
    tooltipShowing = true;
  });
  tooltip.addEventListener('mouseleave', () => {
    console.log('Tooltip mouse leave');
    tooltipShowing = false;
    tooltipTimeoutId = setTimeout(hideTooltip, tooltipTimeout);
  });
}

function showTooltip(html, x, y, openedBy) {
  const tooltip = document.getElementById('stack-tooltip');
  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltipShowing = true;
  tooltipOpenedby = openedBy;
}

function hideTooltip() {
  const tooltip = document.getElementById('stack-tooltip');
  tooltip.textContent = '';
  tooltip.style.display = 'none';
  tooltipShowing = false;
  tooltipOpenedby = null;
}

function templateHTML(id) {
  const tpl = document.getElementById(id);
  return tpl ? tpl.innerHTML.trim() : '';
}

function setupClickHandlers() {
  const elementToHTMLMap = {
    g6: templateHTML('user-tooltip'),
    g15: templateHTML('github-tooltip'),
    g7: templateHTML('dev-tooltip'),
    g61: templateHTML('web-tooltip'),
    g62: templateHTML('lan-tooltip'),
    g24: 'Deploy Daemon',
    g28: 'CloudFlared Tunnel',
    g19: 'Traefik (Public)',
    g31: 'Traefik (Private)',
    g33: 'Adguard',
    g56: 'Builder Container',
    g43: 'Website',
    g40: 'Public Tools',
    g38: 'Portainer',
    g49: 'Adguard UI',
  };
  const elements = Object.keys(elementToHTMLMap).map((id) => {
    console.log(`Getting element with id ${id}`);
    const el = document.getElementById(id);
    if (!el) console.warn(`Element with id ${id} not found`);
    return el;
  });
  elements.forEach((el) => {
    console.log(`Adding click handler to ${el}`);
    el.addEventListener('click', (e) => {
      const tech = elementToHTMLMap[el.id];
      if (tech) {
        clearTimeout(tooltipTimeoutId);
        const rect = el.getBoundingClientRect();
        if (tooltipOpenedby === el) {
          hideTooltip();
          tooltipOpenedby = null;
          return;
        }
        showTooltip(tech, rect.left + rect.width + 10, rect.top - 50, el);
      } else {
        hideTooltip();
      }
    });
    el.addEventListener('mouseleave', () => {
      tooltipTimeoutId = setTimeout(hideTooltip, tooltipTimeout);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const intro = createIntroTimeline();
  intro.restart().play();
  setupTooltipHover();
  setupClickHandlers();
});
