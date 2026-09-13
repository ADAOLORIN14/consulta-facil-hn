/**
 * Carrega uma lista mockada. Na primeira vez, busca o arquivo .json "semente"
 * e grava o resultado no localStorage; nas próximas vezes, lê direto do
 * localStorage. Isso simula um banco de dados enquanto o backend (Java)
 * ainda não existe nesta entrega.
 */
async function carregarMock(chaveStorage, caminhoJson) {
  const salvo = localStorage.getItem(chaveStorage);
  if (salvo) {
    return JSON.parse(salvo);
  }
  const resposta = await fetch(caminhoJson);
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar ${caminhoJson}`);
  }
  const dados = await resposta.json();
  localStorage.setItem(chaveStorage, JSON.stringify(dados));
  return dados;
}

function salvarMock(chaveStorage, lista) {
  localStorage.setItem(chaveStorage, JSON.stringify(lista));
}

function proximoId(lista) {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
