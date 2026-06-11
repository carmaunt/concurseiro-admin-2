'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TableRowsIcon from '@mui/icons-material/TableRows';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

export type TextoApoioTipo = 'TEXTO' | 'CODIGO' | 'TABELA';

type TabelaTextoApoio = {
  colunas: string[];
  linhas: string[][];
};

export type TextoApoioEditorValue = {
  textoApoioTitulo: string;
  textoApoioTipo: TextoApoioTipo;
  textoApoioConteudo: string;
  textoApoioJson: string;
};

type Props = {
  value: TextoApoioEditorValue;
  onChange: <K extends keyof TextoApoioEditorValue>(key: K, value: TextoApoioEditorValue[K]) => void;
};

const tabelaVazia: TabelaTextoApoio = {
  colunas: [''],
  linhas: [['']],
};

export function normalizarTipoTextoApoio(tipo?: string | null): TextoApoioTipo {
  if (tipo === 'CODIGO' || tipo === 'TABELA') return tipo;
  return 'TEXTO';
}

export function montarFallbackTabela(tabela: TabelaTextoApoio) {
  const linhas = [
    tabela.colunas,
    ...tabela.linhas,
  ];

  return linhas
    .map((linha) => linha.map((celula) => celula.trim()).join(' | ').trim())
    .filter(Boolean)
    .join('\n');
}

export function parseTabelaPipe(raw: string): TabelaTextoApoio {
  const linhas = raw
    .split(/\r?\n/)
    .map((linha) => linha.split('|').map((celula) => celula.trim()))
    .filter((linha) => linha.some(Boolean));

  if (linhas.length === 0) return tabelaVazia;

  const colunas = linhas[0].length ? linhas[0] : [''];
  const corpo = linhas.slice(1).map((linha) => ajustarLinha(linha, colunas.length));

  return {
    colunas,
    linhas: corpo.length ? corpo : [Array.from({ length: colunas.length }, () => '')],
  };
}

function parseTabelaJson(json: string, fallback: string): TabelaTextoApoio {
  if (json.trim()) {
    try {
      const parsed = JSON.parse(json) as Partial<TabelaTextoApoio>;
      if (Array.isArray(parsed.colunas) && Array.isArray(parsed.linhas)) {
        const colunas = parsed.colunas.map(String);
        return {
          colunas: colunas.length ? colunas : [''],
          linhas: parsed.linhas.length
            ? parsed.linhas.map((linha) => ajustarLinha(Array.isArray(linha) ? linha.map(String) : [], colunas.length || 1))
            : [Array.from({ length: colunas.length || 1 }, () => '')],
        };
      }
    } catch {
      // O fallback textual segue editável quando o JSON estiver inválido.
    }
  }

  return fallback.trim() ? parseTabelaPipe(fallback) : tabelaVazia;
}

function ajustarLinha(linha: string[], tamanho: number) {
  return Array.from({ length: tamanho }, (_, index) => linha[index] ?? '');
}

export function serializarTabela(tabela: TabelaTextoApoio) {
  const limpa: TabelaTextoApoio = {
    colunas: tabela.colunas.map((coluna) => coluna.trim()),
    linhas: tabela.linhas.map((linha) => ajustarLinha(linha, tabela.colunas.length).map((celula) => celula.trim())),
  };

  return {
    conteudo: montarFallbackTabela(limpa),
    conteudoJson: JSON.stringify(limpa),
  };
}

export default function TextoApoioEditor({ value, onChange }: Props) {
  const tabela = parseTabelaJson(value.textoApoioJson, value.textoApoioConteudo);

  const atualizarTabela = (proxima: TabelaTextoApoio) => {
    const serializada = serializarTabela(proxima);
    onChange('textoApoioConteudo', serializada.conteudo);
    onChange('textoApoioJson', serializada.conteudoJson);
  };

  const atualizarColunas = (raw: string) => {
    const colunas = raw.split('|').map((coluna) => coluna.trim());
    atualizarTabela({
      colunas: colunas.length ? colunas : [''],
      linhas: tabela.linhas.map((linha) => ajustarLinha(linha, colunas.length || 1)),
    });
  };

  return (
    <Stack spacing={2}>
      <TextField label="Título do novo texto de apoio" fullWidth value={value.textoApoioTitulo} onChange={(e) => onChange('textoApoioTitulo', e.target.value)} />

      <TextField
        select
        label="Tipo do texto de apoio"
        fullWidth
        value={value.textoApoioTipo}
        onChange={(e) => {
          const tipo = normalizarTipoTextoApoio(e.target.value);
          onChange('textoApoioTipo', tipo);
          if (tipo !== 'TABELA') onChange('textoApoioJson', '');
        }}
      >
        <MenuItem value="TEXTO">Texto</MenuItem>
        <MenuItem value="CODIGO">Código</MenuItem>
        <MenuItem value="TABELA">Tabela</MenuItem>
      </TextField>

      {value.textoApoioTipo !== 'TABELA' && (
        <TextField
          label={value.textoApoioTipo === 'CODIGO' ? 'Código de apoio' : 'Novo texto de apoio'}
          multiline
          minRows={6}
          fullWidth
          value={value.textoApoioConteudo}
          onChange={(e) => onChange('textoApoioConteudo', e.target.value)}
          slotProps={{
            input: {
              sx: value.textoApoioTipo === 'CODIGO' ? { fontFamily: 'monospace' } : undefined,
            },
          }}
        />
      )}

      {value.textoApoioTipo === 'TABELA' && (
        <Stack spacing={1.5}>
          <TextField
            label="Colunas"
            helperText="Separe os nomes com |"
            fullWidth
            value={tabela.colunas.join(' | ')}
            onChange={(e) => atualizarColunas(e.target.value)}
          />

          <TextField
            label="Tabela colada"
            multiline
            minRows={4}
            fullWidth
            value={value.textoApoioConteudo}
            onChange={(e) => onChange('textoApoioConteudo', e.target.value)}
          />

          <Box>
            <Button
              variant="outlined"
              startIcon={<TableRowsIcon />}
              onClick={() => atualizarTabela(parseTabelaPipe(value.textoApoioConteudo))}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Converter texto colado
            </Button>
          </Box>

          <Stack spacing={1}>
            {tabela.linhas.map((linha, rowIndex) => (
              <Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(tabela.colunas.length, 1)}, minmax(120px, 1fr)) auto`, gap: 1, alignItems: 'center' }}>
                {tabela.colunas.map((coluna, colIndex) => (
                  <TextField
                    key={`${rowIndex}-${coluna}-${colIndex}`}
                    label={coluna || `Coluna ${colIndex + 1}`}
                    value={linha[colIndex] ?? ''}
                    onChange={(e) => {
                      const linhas = tabela.linhas.map((item, index) => (
                        index === rowIndex
                          ? ajustarLinha(item, tabela.colunas.length).map((celula, cellIndex) => (cellIndex === colIndex ? e.target.value : celula))
                          : item
                      ));
                      atualizarTabela({ ...tabela, linhas });
                    }}
                  />
                ))}

                <Tooltip title="Remover linha">
                  <span>
                    <IconButton
                      aria-label="Remover linha"
                      onClick={() => atualizarTabela({ ...tabela, linhas: tabela.linhas.filter((_, index) => index !== rowIndex) })}
                      disabled={tabela.linhas.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => atualizarTabela({ ...tabela, linhas: [...tabela.linhas, Array.from({ length: tabela.colunas.length }, () => '')] })}
            sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
          >
            Adicionar linha
          </Button>

          <Typography variant="caption" color="text.secondary">
            O conteúdo textual será salvo junto com a tabela para manter compatibilidade com versões antigas.
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
