document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const form = document.getElementById('form-agendamento');
  const alertBox = document.getElementById('alert');
  const tabela = document.getElementById('tabela-agendamentos');

  const selectPaciente = document.getElementById('paciente');
  const selectEspecialidade = document.getElementById('especialidade');
  const selectProfissional = document.getElementById('profissional');
  const inputData = document.getElementById('data_consulta');
  const selectHorario = document.getElementById('horario');
  const selectLembrete = document.getElementById('canal_lembrete');

  let usuarios = [];
  let especialidades = [];
  let profissionais = [];
  let agendamentos = [];

  // Define data mínima como hoje
  const hoje = new Date().toISOString().split('T')[0];
  inputData.min = hoje;

  if (window.UIHelpers) UIHelpers.mostrarLoading('Carregando agendas e cadastros...');
  try {
    const [rUsu, rEsp, rProf, rAg] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/usuarios`),
      fetch(`${API_BASE_URL}/especialidades`),
      fetch(`${API_BASE_URL}/profissionais`),
      fetch(`${API_BASE_URL}/consultas`)
    ]);

    usuarios = (rUsu.status === 'fulfilled' && rUsu.value.ok)
      ? await rUsu.value.json()
      : await carregarMock('usuarios', 'js/data/mockUsuarios.json');

    especialidades = (rEsp.status === 'fulfilled' && rEsp.value.ok)
      ? await rEsp.value.json()
      : await carregarMock('especialidades', 'js/data/mockEspecialidades.json');

    profissionais = (rProf.status === 'fulfilled' && rProf.value.ok)
      ? await rProf.value.json()
      : await carregarMock('profissionais', 'js/data/mockProfissionais.json');

    if (rAg.status === 'fulfilled' && rAg.value.ok) {
      agendamentos = await rAg.value.json();
    } else {
      agendamentos = JSON.parse(localStorage.getItem('mock_agendamentos') || '[]');
    }
  } catch (e) {
    if (window.UIHelpers) UIHelpers.mostrarToast('Dados carregados em modo local.', 'info');
  } finally {
    if (window.UIHelpers) UIHelpers.esconderLoading();
  }

  preencherSelects();
  renderTabela();

  // Filtra profissionais conforme a especialidade escolhida
  selectEspecialidade.addEventListener('change', () => {
    const espId = parseInt(selectEspecialidade.value, 10);
    const filtrados = espId
      ? profissionais.filter(p => (p.especialidadeIds || p.especialidade_ids || []).includes(espId))
      : profissionais;

    selectProfissional.innerHTML = '<option value="">Selecione o profissional...</option>' +
      filtrados.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${escapeHtml(p.registro || 'CRM')})</option>`).join('');
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErros(form);
    alertBox.style.display = 'none';

    const usuarioId = parseInt(selectPaciente.value, 10);
    const especialidadeId = parseInt(selectEspecialidade.value, 10);
    const profissionalId = parseInt(selectProfissional.value, 10);
    const dataConsulta = inputData.value;
    const horario = selectHorario.value;
    const canalLembrete = selectLembrete.value;

    let valido = true;
    if (!usuarioId) { marcarErro('paciente', 'Selecione um paciente.'); valido = false; }
    if (!especialidadeId) { marcarErro('especialidade', 'Selecione uma especialidade.'); valido = false; }
    if (!profissionalId) { marcarErro('profissional', 'Selecione um profissional.'); valido = false; }
    if (!dataConsulta) { marcarErro('data_consulta', 'Informe a data da consulta.'); valido = false; }
    if (!horario) { marcarErro('horario', 'Selecione um horário disponível.'); valido = false; }

    if (!valido) {
      mostrarAlerta('error', 'Preencha todos os campos obrigatórios para agendar.');
      return;
    }

    // Regra de negócio / concorrência: impede duplo agendamento no mesmo horário e profissional
    const conflito = agendamentos.some(a =>
      Number(a.profissional_id || a.profissionalId) === profissionalId &&
      a.data_consulta === dataConsulta &&
      a.horario === horario
    );

    if (conflito) {
      marcarErro('horario', 'Horário indisponível para este profissional nesta data.');
      mostrarAlerta('error', 'Conflito de horário: já existe uma consulta marcada para este profissional neste horário.');
      return;
    }

    const pacienteObj = usuarios.find(u => Number(u.id) === usuarioId);
    const profissionalObj = profissionais.find(p => Number(p.id) === profissionalId);
    const especialidadeObj = especialidades.find(e => Number(e.id) === especialidadeId);

    const novoAgendamento = {
      id: proximoId(agendamentos),
      usuario_id: usuarioId,
      profissional_id: profissionalId,
      especialidade_id: especialidadeId,
      data_consulta: dataConsulta,
      horario,
      canal_lembrete: canalLembrete,
      paciente_nome: pacienteObj ? pacienteObj.nome : `Paciente #${usuarioId}`,
      paciente_telefone: pacienteObj ? pacienteObj.telefone : '',
      profissional_nome: profissionalObj ? profissionalObj.nome : `Profissional #${profissionalId}`,
      especialidade_nome: especialidadeObj ? especialidadeObj.nome : ''
    };

    if (window.UIHelpers) UIHelpers.mostrarLoading('Registrando agendamento...');
    try {
      const resp = await fetch(`${API_BASE_URL}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoAgendamento)
      });

      if (resp.status === 409) {
        throw new Error('Horário já reservado por outro paciente (conflito de concorrência).');
      }
      if (resp.ok) {
        const salvoApi = await resp.json();
        agendamentos.push({ ...novoAgendamento, ...salvoApi });
      } else {
        agendamentos.push(novoAgendamento);
      }
    } catch (err) {
      if (err.message.includes('concorrência')) {
        mostrarAlerta('error', err.message);
        if (window.UIHelpers) UIHelpers.esconderLoading();
        return;
      }
      agendamentos.push(novoAgendamento);
    } finally {
      if (window.UIHelpers) UIHelpers.esconderLoading();
    }

    localStorage.setItem('mock_agendamentos', JSON.stringify(agendamentos));
    renderTabela();
    form.reset();

    let msgLembrete = '';
    if (canalLembrete === 'whatsapp') {
      msgLembrete = ' Lembrete agendado para envio via WhatsApp.';
    } else if (canalLembrete === 'sms') {
      msgLembrete = ' Lembrete agendado para envio via SMS.';
    }

    mostrarAlerta('success', `Consulta confirmada para ${novoAgendamento.paciente_nome} em ${formatarDataBR(dataConsulta)} às ${horario}.${msgLembrete}`);
  });

  function preencherSelects() {
    selectPaciente.innerHTML = '<option value="">Selecione o paciente...</option>' +
      usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)} — CPF: ${escapeHtml(u.cpf || '')}</option>`).join('');

    selectEspecialidade.innerHTML = '<option value="">Selecione a especialidade...</option>' +
      especialidades.map(e => `<option value="${e.id}">${escapeHtml(e.nome)}</option>`).join('');

    selectProfissional.innerHTML = '<option value="">Selecione o profissional...</option>' +
      profissionais.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${escapeHtml(p.registro || 'CRM')})</option>`).join('');
  }

  function formatarDataBR(isoDate) {
    if (!isoDate || !isoDate.includes('-')) return isoDate;
    const [ano, mes, dia] = isoDate.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function gerarLinkWhatsApp(ag) {
    const foneLimpo = (ag.paciente_telefone || '').replace(/\D/g, '');
    if (!foneLimpo) return '';
    const texto = encodeURIComponent(
      `Olá, ${ag.paciente_nome}! Sua consulta na UBS de Hugo Napoleão está confirmada para ${formatarDataBR(ag.data_consulta)} às ${ag.horario} com ${ag.profissional_nome}.`
    );
    return `<a href="https://wa.me/55${foneLimpo}?text=${texto}" target="_blank" rel="noopener">Enviar WhatsApp</a>`;
  }

  function renderTabela() {
    if (agendamentos.length === 0) {
      tabela.innerHTML = '<p class="empty-state">Nenhuma consulta agendada ainda.</p>';
      return;
    }
    const linhas = agendamentos.slice().reverse().map(a => {
      const canalLabel = a.canal_lembrete === 'whatsapp' ? 'WhatsApp' : (a.canal_lembrete === 'sms' ? 'SMS' : 'Sem lembrete');
      const acaoZap = a.canal_lembrete === 'whatsapp' ? gerarLinkWhatsApp(a) : '—';
      return `<tr>
        <td>${escapeHtml(a.paciente_nome || '')}</td>
        <td>${escapeHtml(a.profissional_nome || '')}</td>
        <td>${escapeHtml(formatarDataBR(a.data_consulta))} às ${escapeHtml(a.horario || '')}</td>
        <td>${escapeHtml(canalLabel)}</td>
        <td>${acaoZap}</td>
      </tr>`;
    }).join('');

    tabela.innerHTML = `<table>
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Profissional</th>
          <th>Data e Horário</th>
          <th>Lembrete</th>
          <th>Ação Rápida</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;
  }

  function marcarErro(campoId, mensagem) {
    const field = document.getElementById(campoId).closest('.field');
    if (field) {
      field.classList.add('has-error');
      const errEl = field.querySelector('.field-error');
      if (errEl) errEl.textContent = mensagem;
    }
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