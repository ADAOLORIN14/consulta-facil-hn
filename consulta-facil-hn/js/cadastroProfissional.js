document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const form = document.getElementById('form-profissional');
  const alertBox = document.getElementById('alert');
  const tabela = document.getElementById('tabela-profissionais');
  const listaEspecialidades = document.getElementById('lista-especialidades');

  let profissionais = [];
  let especialidades = [];

  if (window.UIHelpers) UIHelpers.mostrarLoading('Carregando profissionais e especialidades...');
  try {
    const [respProf, respEsp] = await Promise.all([
      fetch(`${API_BASE_URL}/profissionais`),
      fetch(`${API_BASE_URL}/especialidades`)
    ]);

    if (respProf.ok && respEsp.ok) {
      profissionais = await respProf.json();
      especialidades = await respEsp.json();
    } else {
      throw new Error('Falha ao consultar API');
    }
  } catch (e) {
    try {
      profissionais = await carregarMock('profissionais', 'js/data/mockProfissionais.json');
      especialidades = await carregarMock('especialidades', 'js/data/mockEspecialidades.json');
      if (window.UIHelpers) {
        UIHelpers.mostrarToast('Modo local ativo (API offline).', 'info');
      }
    } catch (errMock) {
      mostrarAlerta('error', 'Não foi possível carregar os dados iniciais. Confira se o servidor está ativo.');
      if (window.UIHelpers) UIHelpers.esconderLoading();
      return;
    }
  } finally {
    if (window.UIHelpers) UIHelpers.esconderLoading();
  }

  renderCheckboxes();
  renderTabela();

  form.addEventListener('submit', async (evento) => {
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+\$/.test(email)) { marcarErro('email', 'Informe um e-mail válido.'); valido = false; }
    if (especialidadeIds.length === 0) { valido = false; }

    if (!valido) {
      const msgErro = especialidadeIds.length === 0
        ? 'Selecione ao menos uma especialidade e corrija os campos destacados.'
        : 'Corrija os campos destacados antes de continuar.';
      mostrarAlerta('error', msgErro);
      if (window.UIHelpers) UIHelpers.mostrarToast(msgErro, 'error');
      return;
    }

    const payload = { nome, registro, telefone, email, especialidade_ids: especialidadeIds, especialidadeIds };

    if (window.UIHelpers) UIHelpers.mostrarLoading('Salvando cadastro do profissional...');
    try {
      const resposta = await fetch(`${API_BASE_URL}/profissionais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) {
        const erroApi = await resposta.json().catch(() => ({}));
        throw new Error(erroApi.detail || 'Erro ao cadastrar profissional na API.');
      }

      const criado = await resposta.json();
      profissionais.push(criado);
      salvarMock('profissionais', profissionais);
      renderTabela();
      form.reset();
      mostrarAlerta('success', `Profissional ${nome} cadastrado com sucesso.`);
      if (window.UIHelpers) UIHelpers.mostrarToast(`Profissional ${nome} cadastrado!`, 'success');
    } catch (erro) {
      const novo = { id: proximoId(profissionais), nome, registro, telefone, email, especialidadeIds };
      profissionais.push(novo);
      salvarMock('profissionais', profissionais);
      renderTabela();
      form.reset();
      mostrarAlerta('success', `Profissional ${nome} salvo localmente.`);
      if (window.UIHelpers) UIHelpers.mostrarToast(`Profissional ${nome} salvo localmente.`, 'info');
    } finally {
      if (window.UIHelpers) UIHelpers.esconderLoading();
    }
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
    const linhas = profissionais.slice().reverse().map(p => {
      const ids = p.especialidadeIds || p.especialidade_ids || [];
      return `<tr><td>${escapeHtml(p.nome)}</td><td>${escapeHtml(p.registro)}</td><td>${escapeHtml(nomesEspecialidades(ids))}</td></tr>`;
    }).join('');
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
  function mostrarAlerta(