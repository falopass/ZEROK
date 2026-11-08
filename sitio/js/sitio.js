import { setupMessages } from './selector.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const canReveal = 'IntersectionObserver' in window;
setupMessages();

const menu = document.querySelector('.mobile-menu');
menu?.addEventListener('keydown', event => {
  if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
});
document.addEventListener('click', event => {
  if (menu?.open && (!menu.contains(event.target) || event.target.closest('a'))) menu.open = false;
});

// Observers leave the content readable if JS, motion, or a vendor script fails.
if (canReveal) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      if (!reduced.matches) entry.target.animate([{ opacity: .3, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
      reveal.unobserve(entry.target);
    }
  }, { threshold: .12 });
  document.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));
  const seen = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); seen.unobserve(entry.target); }
  }, { threshold: .2 });
  document.querySelectorAll('.foto-revela, [data-visible]').forEach(element => seen.observe(element));
  const steps = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('is-on', entry.isIntersecting || entry.boundingClientRect.top < 0);
  }, { rootMargin: '0px 0px -40% 0px' });
  document.querySelectorAll('.journey li').forEach(step => steps.observe(step));
  const bar = document.querySelector('.contact-bar');
  if (bar) {
    const visibleActions = new Set();
    const actionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) entry.isIntersecting ? visibleActions.add(entry.target) : visibleActions.delete(entry.target);
      bar.classList.toggle('out-of-view', visibleActions.size > 0);
    }, { threshold: .3 });
    document.querySelectorAll('.hero-actions, .closing-actions').forEach(actions => actionObserver.observe(actions));
  }
  const first = document.querySelector('.hero, .page-heading, .agenda-layout');
  if (first) new IntersectionObserver(entries => document.querySelector('.site-header')?.classList.toggle('is-compact', !entries[0].isIntersecting)).observe(first);
  const index = document.querySelector('.service-index');
  if (index) {
    const active = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        index.querySelectorAll('a').forEach(a => a.removeAttribute('aria-current'));
        index.querySelector(`a[href="#${CSS.escape(entry.target.id)}"]`)?.setAttribute('aria-current', 'location');
      }
    }, { rootMargin: '-180px 0px -45% 0px', threshold: 0 });
    document.querySelectorAll('.service-detail').forEach(section => active.observe(section));
  }
  if (!reduced.matches) document.documentElement.classList.add('motion-on');
}
reduced.addEventListener('change', () => document.documentElement.classList.toggle('motion-on', !reduced.matches && canReveal));

const serviceMenu = document.querySelector('.service-menu');
let closingService = null;
const closeServiceItem = (item, after) => {
  closingService = item;
  item.classList.add('is-closing');
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    closingService = null;
    item.classList.remove('is-closing');
    item.open = false;
    after?.();
  };
  item.querySelector('.service-item-body')?.addEventListener('transitionend', transition => {
    if (transition.propertyName === 'grid-template-rows') finish();
  }, { once: true });
  setTimeout(finish, 650);
};
for (const item of serviceMenu?.querySelectorAll('.service-item') ?? []) {
  item.querySelector('summary')?.addEventListener('click', event => {
    if (reduced.matches) return;
    if (closingService) { event.preventDefault(); return; }
    const current = serviceMenu.querySelector('.service-item[open]');
    if (item.open) { event.preventDefault(); closeServiceItem(item); }
    else if (current && current !== item) { event.preventDefault(); closeServiceItem(current, () => { item.open = true; }); }
  });
}

for (const group of document.querySelectorAll('[data-audience]')) {
  group.addEventListener('click', event => {
    const button = event.target.closest('[data-audience-choice]');
    if (!button) return;
    group.querySelectorAll('[data-audience-choice]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    group.querySelectorAll('[data-audience-panel]').forEach(panel => {
      panel.hidden = panel.dataset.audiencePanel !== button.dataset.audienceChoice;
      panel.classList.toggle('switching', !panel.hidden && !reduced.matches);
    });
    window.ScrollTrigger?.refresh();
  });
}

// Hero equipment chips mark the matching option in the selector below.
for (const chip of document.querySelectorAll('.hero-chip')) {
  chip.addEventListener('click', () => {
    const radio = document.querySelector(`[data-message] [name=equipo][value="${CSS.escape(chip.dataset.equipo)}"]`);
    if (radio && !radio.checked) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
  });
}

// A deliberate submit disables its button until the page navigates; bfcache restores it.
for (const form of document.querySelectorAll('[data-native-submit]')) {
  const button = form.querySelector('[type=submit]');
  const label = button?.querySelector('span');
  const text = label?.textContent;
  form.addEventListener('submit', () => {
    button.disabled = true;
    if (label) label.textContent = 'Enviando...';
  });
  addEventListener('pageshow', event => {
    if (event.persisted) { button.disabled = false; if (label) label.textContent = text; }
  });
}

// Trabajo real: each card opens a native dialog with the full photo and phrase.
const dialog = document.querySelector('[data-trabajo-dialog]');
if (dialog && typeof dialog.showModal === 'function') {
  dialog.setAttribute('aria-label', 'Foto del trabajo');
  let trigger;
  for (const open of document.querySelectorAll('[data-trabajo-open]')) {
    open.addEventListener('click', event => {
      event.preventDefault();
      trigger = open;
      const link = dialog.querySelector('.trabajo-dialog-foto');
      const img = link.querySelector('img');
      link.href = open.href;
      img.src = open.href;
      img.alt = open.dataset.dialogTexto || '';
      dialog.querySelector('[data-dialog-n]').textContent = `Trabajo ${open.dataset.dialogN}`;
      dialog.querySelector('[data-dialog-texto]').textContent = `«${open.dataset.dialogTexto}.»`;
      dialog.showModal();
    });
  }
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => trigger?.focus());
}

for (const button of document.querySelectorAll('[data-filter]')) {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    document.querySelectorAll('[data-category]').forEach(product => { product.hidden = button.dataset.filter !== '*' && product.dataset.category !== button.dataset.filter; });
  });
}

function updateHours() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santiago', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
  const current = `${parts.hour}:${parts.minute}`;
  const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  for (const element of document.querySelectorAll('[data-hours]')) {
    if (element.dataset.confirmed !== 'true') continue;
    const open = parts.weekday !== 'Sun' && current >= element.dataset.open && current < element.dataset.close;
    const remaining = open ? minutes(element.dataset.close) - minutes(current) : 0;
    element.hidden = false;
    element.classList.toggle('is-open', open);
    element.textContent = open ? `Abierto · cierra en ${Math.floor(remaining / 60)} h ${remaining % 60} min` : `Cerrado · abre ${parts.weekday === 'Sat' && current >= element.dataset.close || parts.weekday === 'Sun' ? 'el lunes ' : current >= element.dataset.close ? 'mañana ' : 'hoy '}${element.dataset.open}`;
  }
}
updateHours();
if (document.querySelector('[data-confirmed="true"]')) setInterval(updateHours, 60000);

const thermal = document.querySelector('[data-thermal]:has(.hero-thermal)');
if (thermal) {
  let frame;
  let x = 65, y = 55, targetX = 65, targetY = 55;
  const draw = () => {
    x += (targetX - x) * .15;
    y += (targetY - y) * .15;
    thermal.style.setProperty('--lx', `${x}%`);
    thermal.style.setProperty('--ly', `${y}%`);
    frame = Math.abs(targetX - x) + Math.abs(targetY - y) > .1 ? requestAnimationFrame(draw) : null;
  };
  thermal.parentElement.addEventListener('pointermove', event => {
    if (reduced.matches) return;
    const rect = thermal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    targetX = (event.clientX - rect.left) / rect.width * 100;
    targetY = (event.clientY - rect.top) / rect.height * 100;
    if (!frame) frame = requestAnimationFrame(draw);
  });
  // The lens sweeps the photo once on every device, then follows the pointer.
  if (!reduced.matches) {
    x = -6; y = 42;
    draw();
  }
}

// Magnetic pull on primary CTAs, at most 6 px, only with a fine pointer.
if (matchMedia('(pointer: fine)').matches) for (const button of document.querySelectorAll('.button.primary')) {
  button.addEventListener('pointermove', event => {
    if (reduced.matches) return;
    const rect = button.getBoundingClientRect();
    button.style.translate = `${((event.clientX - rect.left) / rect.width - .5) * 12}px ${((event.clientY - rect.top) / rect.height - .5) * 8}px`;
  });
  button.addEventListener('pointerleave', () => { button.style.translate = ''; });
}

async function motion() {
  if (reduced.matches || navigator.connection?.saveData) return;
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src; script.onload = resolve; script.onerror = reject;
    document.head.append(script);
  });
  try {
    await load('/js/vendor/gsap.min.js');
    await load('/js/vendor/ScrollTrigger.min.js');
    gsap.registerPlugin(ScrollTrigger);
    const text = document.querySelector('.presentation [data-words]');
    const palabra = part => part.trim() ? `<span class="palabra">${part.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>` : part;
    if (text) text.innerHTML = text.textContent.split(/(\s+)/).map(palabra).join('');
    const cierre = document.querySelector('.closing-hero h2');
    if (cierre) cierre.innerHTML = [...cierre.childNodes].map(node => node.nodeType === 3 ? node.textContent.split(/(\s+)/).map(palabra).join('') : node.outerHTML).join('');
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const giro = document.querySelector('.hero-giro');
      if (giro) gsap.to(giro, { rotate: 75, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      for (const image of gsap.utils.toArray('.parallax')) gsap.fromTo(image, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      const route = document.querySelector('.journey ol');
      if (route) gsap.fromTo(route, { '--route-progress': 0 }, { '--route-progress': 1, ease: 'none', scrollTrigger: { trigger: route, start: 'top 65%', end: 'bottom 55%', scrub: true } });
      const words = gsap.utils.toArray('.presentation .palabra');
      if (words.length) gsap.fromTo(words, { opacity: .16 }, { opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: text, start: 'top 85%', end: 'bottom 50%', scrub: true } });
      const palabras = gsap.utils.toArray('.closing-hero .palabra');
      if (palabras.length) gsap.fromTo(palabras, { opacity: .12, y: 16 }, { opacity: 1, y: 0, stagger: .07, duration: .55, ease: 'power2.out', scrollTrigger: { trigger: '.closing-hero h2', start: 'top 85%', once: true } });
    });
    media.add('(min-width: 1024px) and (min-height: 800px) and (prefers-reduced-motion: no-preference)', () => {
      const sheets = gsap.utils.toArray('.service-sheet');
      for (const sheet of sheets.slice(0, -1)) gsap.to(sheet, { scale: .93, '--dim': .6, ease: 'none', scrollTrigger: { trigger: sheet, start: 'top 96px', end: 'bottom 120px', scrub: true } });
    });
  } catch { /* Native sticky sheets and observer reveals remain available. */ }
}
if ('requestIdleCallback' in window) requestIdleCallback(motion, { timeout: 2000 });
else setTimeout(motion, 1200);

const agenda = document.querySelector('.agenda-form');
if (agenda) {
  agenda.addEventListener('invalid', event => event.target.closest('details')?.setAttribute('open', ''), true);
  document.querySelector('[data-agenda-resumen]').hidden = false;
  const falla = document.querySelector('[data-agenda-problema]');
  const resumen = () => {
    const equipo = agenda.querySelector('[name="equipo"]:checked');
    const dia = agenda.querySelector('[name="dia"]:checked');
    const detalleEquipo = agenda.querySelector('.agenda-detalle-linea b');
    const detalleFalla = agenda.querySelector('.agenda-detalle-falla');
    if (detalleEquipo) detalleEquipo.textContent = equipo?.value || 'Elige tu equipo';
    if (detalleFalla) detalleFalla.textContent = agenda.querySelector('[name=problema]')?.value.trim() || 'Cuéntanos qué le pasa';
    document.querySelector('[data-agenda-equipo]').textContent = equipo?.value || 'Elige tu equipo';
    if (falla) falla.textContent = agenda.querySelector('[name=problema]')?.value.trim() || 'Cuéntanos qué le pasa';
    document.querySelector('[data-agenda-dia]').textContent = dia
      ? new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(dia.value + 'T12:00:00Z'))
      : 'Elige tu día preferido';
  };
  agenda.addEventListener('change', resumen);
  agenda.addEventListener('input', resumen);
  agenda.addEventListener('focusin', event => {
    const pasos = [...agenda.querySelectorAll('.agenda-paso')];
    const actual = pasos.indexOf(event.target.closest('.agenda-paso'));
    if (actual !== -1) document.querySelector('.agenda-etiqueta').textContent = `0${actual + 1} / 04`;
  });
  // With a completed request, the day step gets keyboard focus.
  if (agenda.dataset.prefill !== undefined && !agenda.querySelector('.agenda-error')) {
    const detalle = agenda.querySelector('.agenda-detalle');
    if (detalle) detalle.open = false;
    agenda.querySelector('[name=dia]')?.focus();
  }
  resumen();
}
