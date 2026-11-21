document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const form = document.getElementById('form-especialidade');
  const alertBox = document.getElementById('alert');
  const tabela = document.getElementById('tabela-especialidades');

  let especialidades = [];

  if (window.UIHelpers) UIHelpers.mostrarLoading('Carregando especialidades...');
  try {
    const resposta = await fetch(`\${API_BASE_URL}/especialidades`);
    if (resposta.ok) {
      especialidades = await resposta.json();
    } else {
      throw new Error('Falha ao consultar API');
    }
  } catch (e) {
    try {
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

  renderTabela();

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErros(form);

    const nome = document.getElementById('nome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    let valido = true;

    if (nome.length < 3) {
      marcarErro('nome', 'Informe o nome da especialidade.');
      valido = false;
    } else if (especialidades.some(e => e.nome.toLowerCase() === nome.toLowerCase())) {
      marcarErro('nome', 'Esta especialidade já está cadastrada.');
      valido = false;
    }
    if (descricao.length < 5) {
      marcarErro('descricao', 'Descreva brevemente a especialidade.');
      valido = false;
    }

    if (!valido) {
      mostrarAlerta('error', 'Corrija os campos destacados antes de continuar.');
      if (window.UIHelpers) UIHelpers.mostrarToast('Corrija os campos destacados.', 'error');
      return;
    }

    const payload = { nome, descricao };

    if (window.UIHelpers) UIHelpers.mostrarLoading('Salvando especialidade...');
    try {
      const resposta = await fetch(`${API_BASE_URL}/especialidades`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });  if (!resposta.ok) { const erroApi = await resposta.json().catch(() => ({})); throw new Error(erroApi.detail \vert{}\vert{} 'Erro ao cadastrar especialidade na API.'); }  const criada = await resposta.json(); especialidades.push(criada); salvarMock('especialidades', especialidades); renderTabela(); form.reset(); mostrarAlerta('success', `Especialidade "${nome}" cadastrada com sucesso.`);
      if (window.UIHelpers) UIHelpers.mostrarToast(`Especialidade "${nome}" cadastrada!`, 'success'); } catch (erro) { const nova = { id: proximoId(especialidades), nome, descricao }; especialidades.push(nova); salvarMock('especialidades', especialidades); renderTabela(); form.reset(); mostrarAlerta('success', `Especialidade "${nome}" salva localmente.`);
      if (window.UIHelpers) UIHelpers.mostrarToast(`Especialidade "\${nome}" salva localmente.`, 'info');
    } finally {
      if (window.UIHelpers) UIHelpers.esconderLoading();
    }
  });

  function renderTabela() {
    if (especialidades.length === 0) {
      tabela.innerHTML = '<p class="empty-state">Nenhuma especialidade cadastrada ainda.</p>';
      return;
    }
    const linhas = especialidades.slice().reverse().map(e =>
      `<tr><td>\${escapeHtml(e.nome)}</td><td>${escapeHtml(e.descricao)}</td></tr>` ).join(''); tabela.innerHTML = `<table><thead><tr><th>Especialidade</th><th>Descrição</th></tr></thead><tbody>${linhas}</tbody></table>`;
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
    alertBox.className = `alert