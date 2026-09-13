document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('form-profissional');
  const alertBox = document.getElementById('alert');
  const tabela = document.getElementById('tabela-profissionais');
  const listaEspecialidades = document.getElementById('lista-especialidades');

  let profissionais = [];
  let especialidades = [];
  try {
    profissionais = await carregarMock('profissionais', 'js/data/mockProfissionais.json');
    especialidades = await carregarMock('especialidades', 'js/data/mockEspecialidades.json');
  } catch (e) {
    mostrarAlerta('error', 'Não foi possível carregar os dados iniciais. Confira se o projeto está sendo aberto por um servidor local (veja o README).');
    return;
  }

  renderCheckboxes();
  renderTabela();

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    limparErros(form);
    alertBox.style.display = 'none';

    const nome = document.getElementById('nome').value.trim();
    const registro = document.getElementById('registro').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email = document.getElementById('email').value.trim();
    const especialidadeIds = Array.from(
      listaEspecialidades.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => parseInt(cb.value, 10));

    let valido = true;

    if (nome.length < 3) { marcarErro('nome', 'Informe o nome completo.'); valido = false; }
    if (registro.length < 3) { marcarErro('registro', 'Informe o número de registro profissional (ex.: CRM).'); valido = false; }
    if (telefone.replace(/\D/g, '').length < 10) { marcarErro('telefone', 'Informe um telefone válido com DDD.'); valido = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { marcarErro('email', 'Informe um e-mail válido.'); valido = false; }
    if (especialidadeIds.length === 0) { valido = false; }

    if (!valido) {
      mostrarAlerta('error', especialidadeIds.length === 0
        ? 'Selecione ao menos uma especialidade e corrija os campos destacados.'
        : 'Corrija os campos destacados antes de continuar.');
      return;
    }

    const novo = { id: proximoId(profissionais), nome, registro, telefone, email, especialidadeIds };
    profissionais.push(novo);
    salvarMock('profissionais', profissionais);
    renderTabela();
    form.reset();
    mostrarAlerta('success', `Profissional ${nome} cadastrado com sucesso.`);
  });

  function renderCheckboxes() {
    listaEspecialidades.innerHTML = especialidades.map(e =>
      `<label><input type="checkbox" value="${e.id}"> ${escapeHtml(e.nome)}</label>`
    ).join('');
  }

  function nomesEspecialidades(ids) {
    return (ids || [])
      .map(id => especialidades.find(e => e.id === id))
      .filter(Boolean)
      .map(e => e.nome)
      .join(', ');
  }

  function renderTabela() {
    if (profissionais.length === 0) {
      tabela.innerHTML = '<p class="empty-state">Nenhum profissional cadastrado ainda.</p>';
      return;
    }
    const linhas = profissionais.slice().reverse().map(p =>
      `<tr><td>${escapeHtml(p.nome)}</td><td>${escapeHtml(p.registro)}</td><td>${escapeHtml(nomesEspecialidades(p.especialidadeIds))}</td></tr>`
    ).join('');
    tabela.innerHTML = `<table><thead><tr><th>Nome</th><th>Registro</th><th>Especialidades</th></tr></thead><tbody>${linhas}</tbody></table>`;
  }

  function marcarErro(campoId, mensagem) {
    const field = document.getElementById(campoId).closest('.field');
    field.classList.add('has-error');
    field.querySelector('.field-error').textContent = mensagem;
  }
  function limparErros(form) {
    form.querySelectorAll('.field').forEach(f => f.classList.remove('has-error'));
  }
  function mostrarAlerta(tipo, mensagem) {
    alertBox.className = `alert ${tipo}`;
    alertBox.textContent = mensagem;
    alertBox.style.display = 'block';
  }
});
