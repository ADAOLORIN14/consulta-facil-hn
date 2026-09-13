function limparCpf(cpf) {
  return (cpf || '').replace(/\D/g, '');
}

function formatarCpf(cpf) {
  const v = limparCpf(cpf).slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Valida o CPF pelos dígitos verificadores oficiais (não checa existência real). */
function cpfValido(cpf) {
  const v = limparCpf(cpf);
  if (v.length !== 11 || /^(\d)\1{10}$/.test(v)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(v[i], 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(v[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(v[i], 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(v[10], 10)) return false;

  return true;
}
