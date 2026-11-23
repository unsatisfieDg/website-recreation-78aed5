export function initSectionJumper(scope) {
  const jumper = document.querySelector('[data-section-jumper]');
  const trigger = jumper.querySelector('summary');
  const header = jumper.closest('.site-header');
  const stops = [...jumper.querySelectorAll('a')].map(link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
  })).filter(stop => stop.section);
  let frame = 0;

  function closeMenu() {
    jumper.open = false;
    trigger.focus({preventScroll: true});
  }

  function updateCurrent() {
    frame = 0;
    if (!jumper.open || !stops.length) return;
    const readingLine = header.getBoundingClientRect().bottom + Math.min(120, innerHeight * .18);
    const atEnd = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight;
    const current = atEnd ? stops.at(-1) : stops.findLast(stop => stop.section.getBoundingClientRect().top <= readingLine) || stops[0];
    for (const stop of stops) {
      if (stop === current) stop.link.setAttribute('aria-current', 'location');
      else stop.link.removeAttribute('aria-current');
    }
  }

  function queueUpdate() {
    if (jumper.open && !frame) frame = requestAnimationFrame(updateCurrent);
  }

  scope.on(jumper, 'toggle', queueUpdate);
  scope.on(jumper.querySelector('.section-jumper__close'), 'click', closeMenu);
  scope.on(window, 'scroll', queueUpdate, {passive: true});
  scope.on(window, 'resize', queueUpdate);
  scope.on(document, 'pointerdown', event => {
    if (jumper.open && !jumper.contains(event.target)) jumper.open = false;
  });
  scope.on(jumper, 'focusout', event => {
    if (event.relatedTarget && !jumper.contains(event.relatedTarget)) jumper.open = false;
  });
  scope.on(jumper, 'keydown', event => {
    if (event.key !== 'Escape' || !jumper.open) return;
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
  });
  scope.on(jumper, 'click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const stop = stops.find(({link}) => link === event.target.closest('a'));
    if (!stop) return;
    jumper.open = false;
    const headingId = stop.section.getAttribute('aria-labelledby');
    const target = (headingId && document.getElementById(headingId)) || (stop.section.id === 'main' && stop.section.querySelector('h1')) || stop.section;
    target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
    // The shared page navigation handles the link's scrolling and history.
  });
  scope.cleanup(() => cancelAnimationFrame(frame));
}
