# Consulta Fácil HN — Front-end (Entrega 2)

Sistema de agendamento de consultas para a rede pública de Hugo Napoleão – PI.
Projeto Integrador II — Equipe Inova.

## Sobre esta entrega

Esta entrega cobre **apenas o front-end**, com dados simulados (mock em JSON).
Não há backend/banco de dados real ainda — isso fica para uma etapa futura do projeto.

## Tecnologias

- HTML5 + CSS3 + JavaScript (ES6+), sem frameworks nem etapa de build (Opção 1 do slide 16).
- Dados simulados em arquivos `.json`, carregados no navegador e persistidos em `localStorage`
  (assim os cadastros continuam aparecendo mesmo depois de recarregar a página, já que arquivos
  `.json` não podem ser reescritos pelo navegador sem um servidor/backend).

## Como executar

⚠️ **Importante:** por causa da política de segurança dos navegadores (CORS), abrir o
`index.html` direto com duplo clique pode falhar ao carregar os arquivos `.json`.
Rode um servidor local simples — qualquer uma destas opções funciona:

**Opção A — VS Code (mais fácil para quem está começando)**
1. Instale a extensão "Live Server" no VS Code.
2. Clique com o botão direito em `index.html` → "Open with Live Server".

**Opção B — Python (se já tiver Python instalado)**
```bash
cd consulta-facil-hn
python3 -m http.server 8000
```
Depois acesse `http://localhost:8000` no navegador.

## Estrutura do projeto

```
consulta-facil-hn/
├── index.html                    # Página inicial (hub)
├── cadastro-usuario.html         # RF01 — Cadastro de pacientes
├── cadastro-profissional.html    # RF02 — Cadastro de profissionais
├── cadastro-especialidade.html   # RF02 — Cadastro de especialidades
├── css/
│   └── style.css
├── js/
│   ├── data/                     # Dados mockados (semente inicial)
│   │   ├── mockUsuarios.json
│   │   ├── mockProfissionais.json
│   │   └── mockEspecialidades.json
│   ├── mockLoader.js             # Helper para carregar/gravar mock no localStorage
│   ├── cpfValidator.js           # Validação e máscara de CPF
│   ├── cadastroUsuario.js
│   ├── cadastroProfissional.js
│   └── cadastroEspecialidade.js
└── README.md
```

## Funcionalidades implementadas (Sprint 1)

| Tarefa Trello | Status |
|---|---|
| [DATA] Estruturação do Mock Data em JSON | ✅ Concluído |
| [UI] Cadastro de usuários (pacientes) | ✅ Concluído |
| [UI] Cadastro de profissionais de saúde | ✅ Concluído |
| [UI] Cadastro de especialidades médicas | ✅ Concluído |

Regras de negócio aplicadas:
- Não permite CPF duplicado (Regra de Negócio 1, Entrega 1, seção 6.2).
- Validação de CPF pelo algoritmo oficial de dígitos verificadores.
- Interface responsiva (RNF01) e com foco visível no teclado, pensada para facilitar o
  acesso por grupos prioritários (idosos e PCD).

## Limitações desta entrega [A FAZER nas próximas etapas]

- [ ] Sem backend real: os dados ficam salvos no `localStorage` do navegador, não em um
  banco de dados compartilhado entre usuários. Será resolvido quando o backend for definido
  (fora do escopo desta entrega — ver Etapa 1/Auditoria).
- [ ] Sem autenticação real (tela de login existe só no protótipo Figma).
- [ ] O campo "senha" não é criptografado nesta etapa, pois não há backend. **Precisa** ser
  corrigido antes de qualquer uso real.
- [ ] Telas de agendamento, cancelamento e reagendamento (RF03, RF04, RF05, RF06) ficam
  para as próximas sprints.
