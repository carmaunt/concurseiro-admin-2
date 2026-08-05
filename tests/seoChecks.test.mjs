import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateSeoDraft } from '../src/components/conteudos/seoChecks.ts';

const completeDraft = {
  titulo: 'Como montar um caderno de erros para concursos',
  slug: 'como-montar-caderno-erros-concursos',
  resumo: 'Aprenda a registrar erros, revisar padrões e transformar cada questão respondida em uma decisão objetiva para o próximo ciclo de estudos.',
  conteudo: '## Como organizar\n\nRegistre o motivo do erro e [pratique questões](/questoes-de-concursos).',
  imagemCapa: '',
  imagemCapaAlt: 'Pessoa revisando um caderno de erros ao lado do computador',
  autorNome: 'O Concurseiro',
  categoriaId: 1,
  tagIds: [1, 2, 3],
  fontesOficiais: [{ nome: 'Portal oficial', url: 'https://www.gov.br/exemplo' }],
  seoTitulo: 'Caderno de erros para concursos: como montar',
  seoDescricao: 'Aprenda como montar um caderno de erros para concursos, revisar padrões e usar questões para escolher com clareza o próximo conteúdo de estudo.',
};

test('aprova requisitos essenciais quando o conteúdo e a nova capa estão completos', () => {
  const report = evaluateSeoDraft(completeDraft, {
    hasSelectedCover: true,
    coverDimensions: { width: 1280, height: 720 },
  });

  assert.equal(report.blockingIssues.length, 0);
  assert.equal(report.checks.find((item) => item.id === 'cover-width')?.status, 'pass');
});

test('bloqueia publicação sem fonte, alt, categoria e com H1 duplicado', () => {
  const report = evaluateSeoDraft({
    ...completeDraft,
    conteudo: '# Título repetido\n\nTexto sem seção.',
    imagemCapaAlt: '',
    categoriaId: null,
    fontesOficiais: [],
  }, { hasSelectedCover: true, coverDimensions: { width: 900, height: 600 } });

  assert.deepEqual(
    report.blockingIssues.map((item) => item.id).sort(),
    ['category', 'cover-alt', 'cover-width', 'heading', 'sources'],
  );
});

test('não bloqueia uma capa antiga cuja dimensão ainda não está armazenada', () => {
  const report = evaluateSeoDraft({ ...completeDraft, imagemCapa: 'https://assets.example/capa.webp' });
  const coverWidth = report.checks.find((item) => item.id === 'cover-width');

  assert.equal(coverWidth?.status, 'warning');
  assert.equal(coverWidth?.blocking, false);
});
