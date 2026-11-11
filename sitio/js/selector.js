const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const frasesSolicitud = {
  'Mantención': 'necesita mantención',
  'Instalación': 'necesita instalación',
  'Mantención o limpieza': 'necesita mantención o limpieza',
  'Desinstalación': 'necesita que lo desinstalen',
  'Revisión': 'necesita una revisión',
  'Instalar termostato': 'necesita que le instalen un termostato',
  'Fuga de gas': 'tiene una fuga de gas',
  'Ruido o vibración': 'hace ruido o vibra'
};

export function setupMessages() {
  for (const form of document.querySelectorAll('[data-message]')) {
    const agendaMode = form.dataset.solicitud === 'agenda';
    const sintomas = JSON.parse(form.dataset.sintomas || '{}');
    const lista = form.querySelector('[data-sintomas-lista]');
    const fotoTarget = form.querySelector('[data-message-foto]');
    const ficha = campo => form.querySelector(`[data-ficha="${campo}"]`);
    const estado = form.querySelector('[data-ficha-estado]');
    const termo = form.querySelector('[data-ficha-termo]');
    const result = form.querySelector('.message-result');
    const waLink = form.querySelector('[data-message-wa]');
    const anuncio = form.querySelector('[data-anuncio]');
    const error = form.querySelector('.form-error');
    const problema = form.querySelector('[name=problema]');
    form.querySelector('[name=sector]').required = true;
    let timer;
    const message = () => {
      const values = new FormData(form);
      const equipo = String(values.get('equipo') || 'equipo').toLowerCase();
      const limpia = s => String(s || '').trim().replace(/^[¿¡]+/, '').replace(/[.\s]+$/, '');
      // First letter lowers only in sentence case, so fault codes like "E1" survive.
      const primera = f => f.replace(/^[A-ZÁÉÍÓÚÑ](?=[a-záéíóúñ])/, c => c.toLowerCase());
      const falla = primera(limpia(values.get('problema'))) || 'tiene una falla';
      const sector = limpia(values.get('sector')).replace(/^en\s+/i, '');
      const fin = /[.!?]$/.test(falla) ? '' : '.';
      // «Otro equipo» lleva el aparato en el texto libre: «Mi otro equipo…» no se lee bien.
      const inicio = equipo === 'otro equipo' ? `Tengo un equipo con una falla: ${falla}` : `Mi ${equipo} ${falla}`;
      return `${inicio}${fin}${sector ? ` Estoy en ${sector}.` : ''}`;
    };
    // The visit card mirrors the form; each finished step cools the bar from fault to visit.
    const update = () => {
      const values = new FormData(form);
      const texto = s => String(s || '').trim();
      const datos = { equipo: texto(values.get('equipo')), falla: texto(values.get('problema')), sector: texto(values.get('sector')) };
      let listos = 0;
      for (const [campo, valor] of Object.entries(datos)) {
        const dd = ficha(campo);
        const visible = valor.replace(/^\p{Ll}/u, c => c.toUpperCase());
        if (dd && dd.textContent !== visible) { dd.textContent = visible; dd.classList.remove('cambia'); requestAnimationFrame(() => dd.classList.add('cambia')); }
        form.querySelector(`[data-paso="${campo}"]`)?.toggleAttribute('data-ok', !!valor);
        if (valor) listos++;
      }
      if (termo) termo.style.setProperty('--avance', listos / 3);
      if (estado) estado.textContent = listos === 3 ? 'Lista para enviar' : `${listos} de 3`;
      result.toggleAttribute('data-lista', listos === 3);
      if (waLink) {
        const url = new URL(`https://wa.me/${form.dataset.whatsapp}`);
        url.searchParams.set('text', message());
        waLink.href = url.href;
      }
    };
    // The chosen equipment photo flies into the request card (FLIP, 280 ms).
    const fly = option => {
      const img = option?.querySelector('img');
      if (!img || !fotoTarget) return;
      const place = () => { const copia = img.cloneNode(); copia.loading = 'eager'; fotoTarget.replaceChildren(copia); };
      if (reduced.matches || typeof img.animate !== 'function') return place();
      const s = img.getBoundingClientRect();
      const t = fotoTarget.getBoundingClientRect();
      if (!s.width || !t.width) return place();
      const ghost = img.cloneNode();
      ghost.loading = 'eager';
      ghost.style.cssText = `position:fixed;left:${s.left}px;top:${s.top}px;width:${s.width}px;height:${s.height}px;object-fit:cover;border-radius:14px;z-index:60;pointer-events:none;margin:0`;
      ghost.style.transformOrigin = 'top left';
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
        label.innerHTML = `<input type="radio" name="sintoma" value="${texto === 'Otra falla' ? '' : frasesSolicitud[texto] || texto.toLowerCase()}"><span>${texto}</span>`;
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
      // Discrete picks get announced; the free-text preview never does.
      if (target.name === 'equipo') {
        const anterior = lista.querySelector('[name=sintoma]:checked');
        if (anterior?.value && problema.value === anterior.value) problema.value = '';
        if (anuncio) anuncio.textContent = `Equipo: ${target.value}`;
        fly(target.closest('.equipment-option'));
        buildSintomas();
        update();
      } else if (target.name === 'sintoma') {
        if (anuncio) anuncio.textContent = target.nextElementSibling?.textContent || '';
        if (target.value) {
          problema.value = target.value;
          problema.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          problema.focus();
        }
        update();
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
