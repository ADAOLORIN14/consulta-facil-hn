document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('form-especialidade');
  const alertBox = document.getElementById('alert');
  const tabela = document.getElementById('tabela-especialidades');

  let especialidades = [];
  try {
    especialidades = await carregarMock('especialidades', 'js/data/mockEspecialidades.json');
  } catch (e) {
    mostrarAlerta('error', 'Não foi possível carregar os dados iniciais. Confira se o projeto está sendo aberto por um servidor local (veja o README).');
    return;
  }

  renderTabela();

  form.addEventListener('submit', (evento) => {
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
      return;
    }

    const nova = { id: proximoId(especialidades), nome, descricao };
    especialidades.push(nova);
    salvarMock('especialidades', especialidades);
    renderTabela();
    form.reset();
    mostrarAlerta('success', `Especialidade "${nome}" cadastrada com sucesso.`);
  });

  function renderTabela() {
    if (especialidades.length === 0) {
      tabela.innerHTML = '<p class="empty-state">Nenhuma especialidade cadastrada ainda.</p>';
      return;
    }
    const linhas = especialidades.slice().reverse().map(e =>
      `<tr><td>${escapeHtml(e.nome)}</td><td>${escapeHtml(e.descricao)}</td></tr>`
    ).join('');
    tabela.innerHTML = `<table><thead><tr><th>Especialidade</th><th>Descrição</th></tr></thead><tbody>${linhas}</tbody></table>`;
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
