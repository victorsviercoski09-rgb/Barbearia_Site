// ==========================================================================
// agendamento.js — validação e confirmação simulada do agendamento
// ==========================================================================

(function () {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const overlay = document.getElementById('confirmOverlay');
  const closeBtn = document.getElementById('confirmClose');

  const requiredFields = ['nome', 'telefone', 'servico', 'data', 'horario'];

  // pré-seleciona o serviço se o usuário veio de um card em servicos.html
  const params = new URLSearchParams(window.location.search);
  const servicoParam = params.get('servico');
  const servicoMap = {
    corte: 'Corte Masculino',
    barba: 'Barba',
    combo: 'Corte + Barba',
    acabamento: 'Acabamento',
    sobrancelha: 'Sobrancelha',
  };
  if (servicoParam && servicoMap[servicoParam]) {
    const select = document.getElementById('servico');
    select.value = servicoMap[servicoParam];
  }

  function fieldWrapper(name) {
    return document.getElementById(name).closest('.field');
  }

  function validate() {
    let valid = true;
    requiredFields.forEach((name) => {
      const input = document.getElementById(name);
      const wrapper = fieldWrapper(name);
      const filled = input.value && input.value.trim() !== '';
      wrapper.classList.toggle('invalid', !filled);
      if (!filled) valid = false;
    });
    return valid;
  }

  // remove o erro assim que o campo é corrigido
  requiredFields.forEach((name) => {
    const input = document.getElementById(name);
    input.addEventListener('input', () => {
      if (input.value.trim() !== '') fieldWrapper(name).classList.remove('invalid');
    });
    input.addEventListener('change', () => {
      if (input.value.trim() !== '') fieldWrapper(name).classList.remove('invalid');
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstInvalid = form.querySelector('.field.invalid input, .field.invalid select');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const servico = document.getElementById('servico').value;
    const dataRaw = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;

    document.getElementById('confirmServico').textContent = servico;
    document.getElementById('confirmData').textContent = formatDate(dataRaw);
    document.getElementById('confirmHorario').textContent = horario;

    overlay.classList.add('open');
  });

  function formatDate(iso) {
    if (!iso) return '—';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function closeOverlay() {
    overlay.classList.remove('open');
  }

  closeBtn.addEventListener('click', () => {
    closeOverlay();
    form.reset();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });
})();
