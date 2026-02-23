function fitHeatmaps() {
  const containers = document.querySelectorAll('[data-heatmap-container]');
  for (const container of containers) {
    const scaleEl = container.querySelector('[data-heatmap-scale]');
    const gridEl = container.querySelector('[data-heatmap-grid]');

    if (!scaleEl || !gridEl) continue;

    // Available width inside the scroll container
    const available = container.clientWidth;

    // Natural (unscaled) width of the grid content
    // scrollWidth works well for inline-grid content
    const content = gridEl.scrollWidth;

    if (!available || !content) continue;

    // Fit-to-width scale (never scale up)
    const scale = Math.min(1, available / content);

    // Optional: clamp so it doesn't become unreadably tiny
    // tweak 0.65 based on your taste
    const clamped = Math.max(scale, 0.65);

    scaleEl.style.setProperty('--heatmap-scale', String(clamped));
  }
}

// Recompute on resize and when fonts load
function setupHeatmapFitting() {
  fitHeatmaps();

  // ResizeObserver gives the most reliable fit (container width changes due to layout)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => fitHeatmaps());
    document
      .querySelectorAll('[data-heatmap-container]')
      .forEach((el) => ro.observe(el));
  } else {
    window.addEventListener('resize', fitHeatmaps, { passive: true });
  }

  // If fonts load later, widths can shift slightly
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => fitHeatmaps()).catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupHeatmapFitting);
} else {
  setupHeatmapFitting();
}
