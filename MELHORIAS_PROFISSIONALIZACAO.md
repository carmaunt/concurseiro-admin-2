# Checklist de Profissionalizacao

Este checklist guia a evolucao profissional do painel admin e, quando necessario, da API.

Frontend: `/home/mauricio/concurseiro-admin/admin-panel`
Backend: `/home/mauricio/concurseiro-api`

## Regra de trabalho

- Ao iniciar uma melhoria, manter somente ela em andamento.
- Ao concluir, marcar o item como concluido neste arquivo.
- Rodar as verificacoes cabiveis antes de finalizar.
- Fazer commit e push em todo repositorio alterado.
- Quando uma melhoria alterar frontend e backend, commitar e enviar ambos.

## Prioridade 0 - Controle do processo

- [x] Criar checklist versionado de profissionalizacao.

## Prioridade 1 - Fundacao tecnica e seguranca

- [x] Configurar ambiente por variaveis (`NEXT_PUBLIC_API_URL`) e remover URL hardcoded da API.
- [x] Criar `.env.example` do frontend com as variaveis obrigatorias.
- [x] Centralizar cliente HTTP com tratamento padronizado de erro, resposta e redirecionamento em `401`.
- [x] Centralizar autenticacao e leitura de usuario/role, removendo logica duplicada de JWT nas telas.
- [x] Revisar estrategia de armazenamento de tokens com o backend e migrar para abordagem mais segura, preferencialmente cookie `httpOnly`.
- [x] Garantir protecao real de rotas administrativas no backend, deixando o frontend apenas como reflexo da permissao.

## Prioridade 2 - Qualidade de codigo

- [x] Criar tipos compartilhados para respostas da API, paginacao, usuario, questao, prova e catalogo.
- [x] Substituir usos de `any` por tipos seguros ou validacao explicita.
- [x] Elevar regras criticas do ESLint de `warn` para `error` depois da limpeza.
- [x] Extrair helpers repetidos: `unwrapApiData`, `getApiErrorMessage`, parser de role e normalizadores de catalogo.
- [x] Remover `alert()` e `window.confirm()` em favor de Dialog/Snackbar padronizados.
- [x] Isolar renderizacao de markdown/conteudo HTML em componente testado e sanitizado.

## Prioridade 3 - Arquitetura do frontend

- [x] Separar paginas grandes em componentes menores por dominio.
- [x] Criar camada de servicos por dominio: auth, questoes, provas, usuarios e catalogo.
- [ ] Criar hooks de dados por dominio usando React Query.
- [ ] Padronizar layouts de listagem, estados vazios, loading, erro e acoes destrutivas.
- [ ] Criar tema MUI proprio para cores, tipografia, raio, botoes, tabelas e formularios.

## Prioridade 4 - Experiencia do produto

- [ ] Renomear textos genericos como `Admin Panel` para identidade real do produto.
- [ ] Melhorar telas de listagem com busca, filtros e ordenacao.
- [ ] Melhorar cadastro de questoes com validacao mais clara e pre-visualizacao.
- [ ] Melhorar cadastro de provas com confirmacoes, feedbacks e consistencia visual.
- [ ] Melhorar usuarios com paginacao, confirmacao de exclusao e feedback de aprovacao.
- [ ] Melhorar importacao de catalogo com pre-validacao e resumo antes de enviar.

## Prioridade 5 - Testes e confiabilidade

- [ ] Adicionar framework de testes unitarios.
- [ ] Testar helpers de API, normalizadores, validacoes e renderizacao de questoes.
- [ ] Adicionar testes de fluxo com Playwright para login, questoes, provas e usuarios.
- [ ] Criar GitHub Actions para `npm ci`, lint, build e testes.
- [ ] Definir checklist de release/deploy.

## Prioridade 6 - Documentacao e operacao

- [ ] Substituir README padrao por documentacao real do projeto.
- [ ] Documentar setup local, variaveis de ambiente, scripts e troubleshooting.
- [ ] Documentar arquitetura do frontend e contrato com backend.
- [ ] Documentar fluxo de auth, roles e permissoes.
- [ ] Documentar como validar uma entrega antes de merge/deploy.
