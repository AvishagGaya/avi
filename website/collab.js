// Collaboration inquiry form: venue fields, inline validation, async submit
(function () {
  const form = document.getElementById('collab-form');
  if (!form) return;

  const venueFields = document.getElementById('venue-fields');
  const thanks = document.getElementById('collab-thanks');
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('button[type="submit"]');
  const fields = form.elements;

  form.querySelectorAll('input[name="collab_type"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      venueFields.hidden = fields.collab_type.value !== 'venue';
      showError('collab_type', false);
    });
  });

  function showError(name, on) {
    const msg = form.querySelector(`[data-error-for="${name}"]`);
    if (msg) msg.classList.toggle('visible', on);
    const input = form.querySelector(`input[name="${name}"]:not([type="radio"])`);
    if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function validate() {
    const checks = {
      collab_type: !!fields.collab_type.value,
      name: fields.name.value.trim() !== '',
      email: fields.email.checkValidity() && fields.email.value.trim() !== '',
    };
    let first = null;
    for (const [name, ok] of Object.entries(checks)) {
      showError(name, !ok);
      if (!ok && !first) first = form.querySelector(`[name="${name}"]`);
    }
    if (first) first.focus();
    return !first;
  }

  ['name', 'email'].forEach((name) => {
    fields[name].addEventListener('input', () => showError(name, false));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    submit.disabled = true;
    submit.textContent = 'Sending';
    status.textContent = '';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(res.status);
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch {
      status.textContent = 'something got lost on the way. please try again, or write to us directly.';
      submit.disabled = false;
      submit.textContent = 'Send';
    }
  });
})();
