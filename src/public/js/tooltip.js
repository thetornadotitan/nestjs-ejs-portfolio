export class Tooltip {
  constructor({
    el,
    hideDelay = 300,
    offset = { x: 12, y: -40 },
    makeListeners = true,
  }) {
    this.el = typeof el === 'string' ? document.querySelector(el) : el;
    this.hideDelay = hideDelay;
    this.offset = offset;
    this.isOpen = false;
    this.makeListeners = makeListeners;

    this.openedBy = null;
    this._hideTimer = null;

    this.hoveringTooltip = false;

    if (!this.el) throw new Error('Tooltip element not found');

    this.el.style.position = 'absolute';
    this.el.style.display = 'none';

    // Track whether mouse is currently over the tooltip bubble
    if (this.makeListeners) {
      this.el.addEventListener('mouseenter', () => {
        this._clearHideTimer();
        this.hoveringTooltip = true;
        this.isOpen = true;
      });

      this.el.addEventListener('mouseleave', () => {
        this.hoveringTooltip = false;
        this.hideDelayed();
      });
    }
  }

  _clearHideTimer() {
    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = null;
  }

  setContent(html) {
    this.el.innerHTML = html;
  }

  showAt(x, y, openedBy = null) {
    this._clearHideTimer();
    this.el.style.left = `${Math.round(x)}px`;
    this.el.style.top = `${Math.round(y)}px`;
    this.el.style.display = 'block';
    this.el.setAttribute('aria-hidden', 'false');
    this.openedBy = openedBy;
    this.isOpen = true;
  }

  showForElement(targetEl, html, opts = {}) {
    if (!targetEl) return;

    this._clearHideTimer();
    this.openedBy = targetEl;

    const rect = targetEl.getBoundingClientRect();
    const off = { ...this.offset, ...(opts.offset || {}) };
    const pad = opts.clampPadding ?? 6;

    // 1) Set content
    this.setContent(html);

    // 2) Make it measurable (NOT display:none)
    //    Keep it invisible + out of the way so there's no flicker
    const prevVisibility = this.el.style.visibility;

    this.el.style.display = 'block';
    this.el.style.visibility = 'hidden';
    this.el.style.left = '-9999px';
    this.el.style.top = '-9999px';

    // 3) Measure real size after layout
    const tipRect = this.el.getBoundingClientRect();
    const w = tipRect.width || 260;
    const h = tipRect.height || 120;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Desired in viewport coords
    let cx = rect.left + rect.width + off.x;
    let cy = rect.top + off.y;

    // 4) Clamp/flip (viewport coords)
    if (opts.clamp !== false) {
      // flip to left if overflow right
      if (cx + w > vw - pad) cx = rect.left - w - off.x;

      // clamp vertically
      cy = Math.max(pad, Math.min(cy, vh - h - pad));

      // also clamp horizontally just in case
      cx = Math.max(pad, Math.min(cx, vw - w - pad));
    }

    // Convert to page coords
    const x = cx + window.scrollX;
    const y = cy + window.scrollY;

    // 5) Show at final position (restores visibility)
    this.el.style.visibility = prevVisibility || '';
    this.showAt(x, y, targetEl);

    // ensure it’s visible (showAt sets display block; keep it)
    this.el.style.visibility = 'visible';
    this.isOpen = true;
  }

  hide() {
    this._clearHideTimer();
    this.el.innerHTML = '';
    this.el.style.display = 'none';
    this.el.setAttribute('aria-hidden', 'true');
    this.openedBy = null;
    this.hoveringTooltip = false;
    this.isOpen = false;
  }

  hideDelayed(delay = this.hideDelay) {
    this._clearHideTimer();
    this._hideTimer = setTimeout(() => {
      // only keep open if cursor is actually on tooltip
      if (!this.hoveringTooltip) {
        this.hide();
        this.isOpen = false;
      }
    }, delay);
  }
}
