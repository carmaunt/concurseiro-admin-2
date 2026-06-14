import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizarTipoTextoApoio,
  parseImagemJson,
  parseTabelaJson,
  parseTabelaPipe,
  serializarTabela,
} from '../src/components/questoes/textoApoio.ts';

test('normaliza os quatro tipos suportados', () => {
  assert.equal(normalizarTipoTextoApoio('TEXTO'), 'TEXTO');
  assert.equal(normalizarTipoTextoApoio('CODIGO'), 'CODIGO');
  assert.equal(normalizarTipoTextoApoio('TABELA'), 'TABELA');
  assert.equal(normalizarTipoTextoApoio('IMAGEM'), 'IMAGEM');
  assert.equal(normalizarTipoTextoApoio('DESCONHECIDO'), 'TEXTO');
});
test('converte tabela colada e ajusta linhas incompletas', () => {
  assert.deepEqual(
    parseTabelaPipe('Nome | Valor\nCaixa | 20.000\nBanco'),
    {
      colunas: ['Nome', 'Valor'],
      linhas: [
        ['Caixa', '20.000'],
        ['Banco', ''],
      ],
    }
  );
});

test('serializa tabela com fallback textual compatível', () => {
  const resultado = serializarTabela({
    colunas: [' Item ', ' Valor '],
    linhas: [[' Caixa ', ' 20.000 ']],
  });

  assert.equal(resultado.conteudo, 'Item | Valor\nCaixa | 20.000');
  assert.deepEqual(JSON.parse(resultado.conteudoJson), {
    colunas: ['Item', 'Valor'],
    linhas: [['Caixa', '20.000']],
  });
});

test('recupera tabela pelo fallback quando o JSON é inválido', () => {
  assert.deepEqual(
    parseTabelaJson('{inválido', 'Item | Valor\nCaixa | 20.000'),
    {
      colunas: ['Item', 'Valor'],
      linhas: [['Caixa', '20.000']],
    }
  );
});

test('interpreta metadados de imagem e rejeita JSON sem URL', () => {
  assert.deepEqual(
    parseImagemJson(JSON.stringify({
      url: 'https://assets.example/imagem.webp',
      alt: 'Gráfico da questão',
      mimeType: 'image/webp',
      largura: 900,
      altura: 420,
    })),
    {
      url: 'https://assets.example/imagem.webp',
      alt: 'Gráfico da questão',
      mimeType: 'image/webp',
      largura: 900,
      altura: 420,
    }
  );

  assert.equal(parseImagemJson('{"alt":"sem endereço"}'), null);
});
