import { Tooltip } from './tooltip.js';

function dotClass(health) {
  if (health === 'up') return 'bg-emerald-500';
  if (health === 'degraded') return 'bg-amber-500';
  if (health === 'down') return 'bg-rose-500';
  return 'bg-slate-400';
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstLink(urls) {
  return Array.isArray(urls) && urls.length ? urls[0] : null;
}

function renderServiceHtml(svc) {
  const health = svc.health || 'unknown';
  const dot = dotClass(health);
  const name = escHtml(svc.name);
  const desc = escHtml(svc.description || '');
  const rt =
    typeof svc.responseTimeMs === 'number' ? `${svc.responseTimeMs}ms` : '—';

  const visibility = svc.visibility || 'unknown';
  const isPrivate = visibility === 'private';

  const pretty = firstLink(svc.urls);
  const lan = firstLink(svc.lanUrls);
  const checked = svc.checkedUrl || null;

  const linkRow = (label, href) => {
    if (!href) return '';
    const h = escHtml(href);
    return `
      <div class="mt-2">
        <div class="text-xs text-[var(--muted)]">${label}</div>
        <a class="text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--text)] break-all" href="${h}" target="_blank" rel="noreferrer">${h}</a>
      </div>
    `;
  };

  // Only show links for PUBLIC services
  const linksBlock = isPrivate
    ? ''
    : `
      ${linkRow('URL', pretty)}
    `;

  const errorBlock = svc.error
    ? `<div class="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
         <div class="font-medium text-[var(--text)]">Last error</div>
         <div class="mt-1 break-words">${escHtml(svc.error)}</div>
       </div>`
    : '';

  return `
    <div class="min-w-[260px]">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="font-medium text-[var(--text)]">${name}</div>
          ${desc ? `<div class="mt-1 text-sm text-[var(--muted)] leading-relaxed">${desc}</div>` : ''}
        </div>

        <div class="shrink-0 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
          <span class="inline-block h-2 w-2 rounded-full ${dot}" aria-hidden="true"></span>
          ${escHtml(health)}
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2">
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div class="text-xs text-[var(--muted)]">Latency</div>
          <div class="mt-1 text-sm font-medium text-[var(--text)]">${escHtml(rt)}</div>
        </div>
        <div class="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div class="text-xs text-[var(--muted)]">Visibility</div>
          <div class="mt-1 text-sm font-medium text-[var(--text)]">${escHtml(visibility)}</div>
        </div>
      </div>

      ${linksBlock}

      ${errorBlock}

      <div class="mt-3 text-[10px] text-[var(--muted)]">
        Tap outside to close.
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const tipEl = document.getElementById('hosted-services-tooltip');
  if (!tipEl) return;

  const tooltip = new Tooltip({
    el: tipEl,
    hideDelay: 150,
    offset: { x: 12, y: -10 },
    anchor: 'page',
    makeListeners: true,
  });

  const chips = Array.from(document.querySelectorAll('.hs-chip'));

  const showForChip = (chip) => {
    try {
      const script = chip.querySelector('script.hs-data');
      const raw = script?.textContent?.trim() || '{}';
      const svc = JSON.parse(raw);
      tooltip.showForElement(chip, renderServiceHtml(svc), {
        offset: { x: 12, y: -10 },
        clampPadding: 8,
      });
    } catch (e) {
      console.warn('Failed to open hosted service tooltip:', e);
    }
  };

  chips.forEach((chip) => {
    // Hover (mouse only)
    chip.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') showForChip(chip);
    });
    chip.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') tooltip.hideDelayed();
    });

    // Tap/click
    chip.addEventListener('click', () => showForChip(chip));
  });

  // Close when tapping/clicking outside (but NOT when scrolling)
  let downX = 0;
  let downY = 0;
  let moved = false;
  let downTarget = null;

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!tooltip.isOpen) return;
      moved = false;
      downX = e.clientX;
      downY = e.clientY;
      downTarget = e.target;

      try {
        e.target.setPointerCapture?.(e.pointerId);
      } catch {}
    },
    { passive: true },
  );

  document.addEventListener(
    'pointermove',
    (e) => {
      if (!tooltip.isOpen) return;
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if (dx > 8 || dy > 8) moved = true;
    },
    { passive: true },
  );

  document.addEventListener(
    'pointerup',
    (e) => {
      if (!tooltip.isOpen) return;
      if (moved) return;

      const t = downTarget || e.target;
      const insideTip = tooltip.el.contains(t);
      const onTrigger = tooltip.openedBy && tooltip.openedBy.contains(t);

      if (!insideTip && !onTrigger) tooltip.hide();
    },
    { passive: true },
  );
});
