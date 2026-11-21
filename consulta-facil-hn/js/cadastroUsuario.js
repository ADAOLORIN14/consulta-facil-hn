document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const form = document.getElementById('form-usuario');
  const cpfInput = document.getElementById('cpf');
  const alertBox = document.getElementById('alert');
  const tabela = document.getElementById('tabela-usuarios');

  let usuarios = [];

  if (window.UIHelpers) UIHelpers.mostrarLoading('Carregando pacientes...');
  try {
    const resposta = await fetch(`${API_BASE_URL}/usuarios`);
    if (resposta.ok) {
      usuarios = await resposta.json();
    } else {
      throw new Error('Falha ao consultar API');
    }
  } catch (e) {
    try {
      usuarios = await carregarMock('usuarios', 'js/data/mockUsuarios.json');
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

  cpfInput.addEventListener('input', () => {
    cpfInput.value = formatarCpf(cpfInput.value);
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErros(form);

    const nome = document.getElementById('nome').value.trim();
    const cpf = limparCpf(cpfInput.value);
    const telefone = document.getElementById('telefone').value.trim();
    const senha = document.getElementById('senha').value;

    let valido = true;

    if (nome.length < 3) {
      marcarErro('nome', 'Informe o nome completo.');
      valido = false;
    }
    if (!cpfValido(cpf)) {
      marcarErro('cpf', 'CPF inválido. Confira os números digitados.');
      valido = false;
    } else if (usuarios.some(u => u.cpf === cpf)) {
      marcarErro('cpf', 'Este CPF já está cadastrado.');
      valido = false;
    }
    if (telefone.replace(/\D/g, '').length < 10) {
      marcarErro('telefone', 'Informe um telefone válido com DDD.');
      valido = false;
    }
    if (senha.length < 8) {
      marcarErro('senha', 'A senha deve ter no mínimo 8 caracteres.');
      valido = false;
    }

    if (!valido) {
      mostrarAlerta('error', 'Corrija os campos destacados antes de continuar.');
      if (window.UIHelpers) UIHelpers.mostrarToast('Verifique os campos destacados.', 'error');
      return;
    }

    const payload = { nome, cpf, telefone, senha, tipo: 'paciente' };

    if (window.UIHelpers) UIHelpers.mostrarLoading('Salvando cadastro do paciente...');
    try {
      const resposta = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) {
        const erroApi = await resposta.json().catch(() => ({}));
        throw new Error(erroApi.detail || 'Erro ao cadastrar paciente na API.');
      }

      const criado = await resposta.json();
      usuarios.push(criado);
      salvarMock('usuarios', usuarios);
      renderTabela();
      form.reset();
      mostrarAlerta('success', `Cadastro de ${nome} realizado com sucesso.`);
      if (window.UIHelpers) UIHelpers.mostrarToast(`Paciente ${nome} cadastrado!`, 'success');
    } catch (erro) {
      // Fallback local caso a API não esteja acessível no momento
      const novoUsuario = { id: proximoId(usuarios), nome, cpf, telefone, tipo: 'paciente' };
      usuarios.push(novoUsuario);
      salvarMock('usuarios', usuarios);
      renderTabela();
      form.reset();
      mostrarAlerta('success', `Cadastro de ${nome} salvo localmente.`);
      if (window.UIHelpers) UIHelpers.mostrarToast(`Cadastro de ${nome} salvo localmente.`, 'info');
    } finally {
      if (window.UIHelpers) UIHelpers.esconderLoading();
    }
  });

  function renderTabela() {
    if (usuarios.length === 0) {
      tabela.innerHTML = '<p class="empty-state">Nenhum paciente cadastrado ainda.</p>';
      return;
    }
    const linhas = usuarios.slice().reverse().map(u =>
      `<tr><td>${escapeHtml(u.nome)}</td><td>${formatarCpf(u.cpf)}</td><td>${escapeHtml(u.telefone)}</td></tr>`
    ).join('');
    tabela.innerHTML = `<table><thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th></tr></thead><tbody>${linhas}</tbody></table>`;
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
    if (window.UIHelpers) {
      UIHelpers.mostrarToast(mensagem, tipo === 'error' ? 'error' : 'success');
    }
  }
});
