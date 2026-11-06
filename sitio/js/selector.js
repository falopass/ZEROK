const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function setupMessages() {
  for (const form of document.querySelectorAll('[data-message]')) {
    const preview = form.querySelector('.message-preview');
    const bubble = form.querySelector('.message-bubble');
    const result = form.querySelector('.message-result');
    let typing;
    const error = form.querySelector('.form-error');
    let timer;
    const message = () => {
      const values = new FormData(form);
      const name = String(values.get('nombre') || '').trim();
      const sector = String(values.get('sector') || '').trim();
      const symptom = String(values.get('sintoma') || '').trim();
      const equipment = String(values.get('equipo') || '').trim();
      return `Hola ZÉROK, ${name ? `soy ${name}. Tengo` : 'tengo'} un equipo: ${equipment}. ${symptom ? `Le pasa lo siguiente: ${symptom}. ` : ''}${sector ? `Estoy en ${sector}. ` : ''}¿Pueden venir a revisarlo?`;
    };
    const update = () => {
      preview.textContent = message();
      bubble.classList.remove('updating');
      requestAnimationFrame(() => bubble.classList.add('updating'));
    };
    // Choosing an option shows a short typing state before the new message appears.
    const typeThen = () => {
      if (reduced.matches) return update();
      clearTimeout(typing);
      result.classList.add('is-typing');
      typing = setTimeout(() => { result.classList.remove('is-typing'); update(); }, 600);
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      error.hidden = true;
      if (!form.reportValidity()) return;
      // Only a deliberate submit opens WhatsApp. No messages or personal data are stored.
      const url = new URL(`https://wa.me/${form.dataset.whatsapp}`);
      url.searchParams.set('text', message());
      window.location.assign(url.href);
    });
    form.addEventListener('input', event => {
      if (event.target.matches('input[type=radio], select')) return;
      clearTimeout(timer);
      timer = setTimeout(update, 220);
    });
    form.addEventListener('change', event => event.target.matches('input[type=radio], select') ? typeThen() : update());
    for (const control of form.querySelectorAll('[disabled]')) control.disabled = false;
    update();
  }
}
