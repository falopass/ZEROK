const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function setupMessages() {
  for (const form of document.querySelectorAll('[data-message]')) {
    const agendaMode = form.dataset.solicitud === 'agenda';
    const sintomas = JSON.parse(form.dataset.sintomas || '{}');
    const lista = form.querySelector('[data-sintomas-lista]');
    const fotoTarget = form.querySelector('[data-message-foto]');
    const preview = form.querySelector('.message-preview');
    const bubble = form.querySelector('.message-bubble');
    const result = form.querySelector('.message-result');
    const waLink = form.querySelector('[data-message-wa]');
    const error = form.querySelector('.form-error');
    const problema = form.querySelector('[name=problema]');
    let typing, timer;
    const message = () => {
      const values = new FormData(form);
      const equipo = String(values.get('equipo') || 'equipo').toLowerCase();
      const falla = String(values.get('problema') || '').trim() || 'tiene una falla';
      const sector = String(values.get('sector') || '').trim();
      return `Mi ${equipo} ${falla}.${sector ? ` Estoy en ${sector}.` : ''}`;
    };
    const update = () => {
      preview.textContent = message();
      bubble.classList.remove('updating');
      requestAnimationFrame(() => bubble.classList.add('updating'));
      if (waLink) {
        const url = new URL(`https://wa.me/${form.dataset.whatsapp}`);
        url.searchParams.set('text', message());
        waLink.href = url.href;
      }
    };
    // Choosing an option shows a short typing state before the request text appears.
    const typeThen = () => {
      if (reduced.matches) return update();
      clearTimeout(typing);
      result.classList.add('is-typing');
      typing = setTimeout(() => { result.classList.remove('is-typing'); update(); }, 600);
    };
    // The chosen equipment photo flies into the request card (FLIP, 280 ms).
    const fly = option => {
      const img = option?.querySelector('img');
      if (!img || !fotoTarget) return;
      const place = () => fotoTarget.replaceChildren(img.cloneNode());
      if (reduced.matches) return place();
      const s = img.getBoundingClientRect();
      const t = fotoTarget.getBoundingClientRect();
      if (!s.width || !t.width) return place();
      const ghost = img.cloneNode();
      ghost.style.cssText = `position:fixed;left:${s.left}px;top:${s.top}px;width:${s.width}px;height:${s.height}px;object-fit:cover;border-radius:14px;z-index:60;pointer-events:none;margin:0`;
      document.body.append(ghost);
      fotoTarget.replaceChildren();
      const scale = Math.min(t.width / s.width, t.height / s.height);
      ghost.animate(
        [{ transform: 'none' }, { transform: `translate(${t.left - s.left}px,${t.top - s.top}px) scale(${scale})` }],
        { duration: 280, easing: 'cubic-bezier(.16,1,.3,1)' }
      ).onfinish = () => { ghost.remove(); place(); };
    };
    const buildSintomas = () => {
      const equipo = String(new FormData(form).get('equipo') || '');
      const chips = [...(sintomas[equipo] || []), 'Otra falla'];
      lista.replaceChildren(...chips.map((texto, i) => {
        const label = document.createElement('label');
        label.className = 'sintoma-chip';
        label.style.setProperty('--i', i);
        label.innerHTML = `<input type="radio" name="sintoma" value="${texto === 'Otra falla' ? '' : texto.toLowerCase()}"><span>${texto}</span>`;
        return label;
      }));
    };
    form.addEventListener('submit', event => {
      // With the agenda on, a native POST carries the request to /agendar/preparar/.
      if (agendaMode) return;
      event.preventDefault();
      error.hidden = true;
      if (!form.reportValidity()) return;
      // Only a deliberate submit opens WhatsApp. No messages or personal data are stored.
      const url = new URL(`https://wa.me/${form.dataset.whatsapp}`);
      url.searchParams.set('text', message());
      window.location.assign(url.href);
    });
    form.addEventListener('input', event => {
      if (event.target.name === 'problema') {
        const chip = lista.querySelector('[name=sintoma]:checked');
        if (chip && chip.value && problema.value !== chip.value) chip.checked = false;
      }
      if (event.target.matches('input[type=radio], select')) return;
      clearTimeout(timer);
      timer = setTimeout(update, 220);
    });
    form.addEventListener('change', event => {
      const target = event.target;
      if (target.name === 'equipo') {
        fly(target.closest('.equipment-option'));
        buildSintomas();
        typeThen();
      } else if (target.name === 'sintoma') {
        if (target.value) {
          problema.value = target.value;
          problema.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          problema.focus();
        }
        typeThen();
      } else {
        update();
      }
    });
    for (const control of form.querySelectorAll('[disabled]')) control.disabled = false;
    buildSintomas();
    const checked = form.querySelector('[name=equipo]:checked');
    if (checked) fly(checked.closest('.equipment-option'));
    update();
  }
}
