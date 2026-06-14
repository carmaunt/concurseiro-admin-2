'use client';

import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TableRowsIcon from '@mui/icons-material/TableRows';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ajustarLinha,
  normalizarTipoTextoApoio,
  parseTabelaJson,
  parseTabelaPipe,
  serializarTabela,
  type TabelaTextoApoio,
  type TextoApoioTipo,
} from './textoApoio';

export type { TextoApoioTipo } from './textoApoio';

export type TextoApoioEditorValue = {
  textoApoioTitulo: string;
  textoApoioTipo: TextoApoioTipo;
  textoApoioConteudo: string;
  textoApoioJson: string;
};

type Props = {
  value: TextoApoioEditorValue;
  onChange: <K extends keyof TextoApoioEditorValue>(key: K, value: TextoApoioEditorValue[K]) => void;
  imagemArquivo: File | null;
  onImagemArquivoChange: (arquivo: File | null) => void;
};

export default function TextoApoioEditor({
  value,
  onChange,
  imagemArquivo,
  onImagemArquivoChange,
}: Props) {
  const tabela = parseTabelaJson(value.textoApoioJson, value.textoApoioConteudo);
  const [imagemPreview, setImagemPreview] = useState<{ arquivo: File; url: string } | null>(null);

  useEffect(() => {
    if (!imagemArquivo) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        setImagemPreview({ arquivo: imagemArquivo, url: reader.result });
      }
    });
    reader.readAsDataURL(imagemArquivo);

    return () => reader.abort();
  }, [imagemArquivo]);

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
          onChange('textoApoioJson', '');
          if (tipo !== 'IMAGEM') onImagemArquivoChange(null);
        }}
      >
        <MenuItem value="TEXTO">Texto</MenuItem>
        <MenuItem value="CODIGO">Código</MenuItem>
        <MenuItem value="TABELA">Tabela</MenuItem>
        <MenuItem value="IMAGEM">Imagem</MenuItem>
      </TextField>

      {(value.textoApoioTipo === 'TEXTO' || value.textoApoioTipo === 'CODIGO') && (
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
              <Box
                key={rowIndex}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)',
                    md: `repeat(${Math.max(tabela.colunas.length, 1)}, minmax(120px, 1fr)) auto`,
                  },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
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
                      sx={{ justifySelf: { xs: 'end', md: 'auto' } }}
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

      {value.textoApoioTipo === 'IMAGEM' && (
        <Stack spacing={1.5}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
          >
            Selecionar imagem
            <Box
              component="input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                onImagemArquivoChange(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />
          </Button>

          {imagemArquivo && (
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <ImageOutlinedIcon color="action" />
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{imagemArquivo.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(imagemArquivo.size / 1024).toFixed(1)} KB
              </Typography>
              <Button
                size="small"
                color="error"
                onClick={() => onImagemArquivoChange(null)}
                sx={{ textTransform: 'none' }}
              >
                Remover
              </Button>
            </Stack>
          )}

          <TextField
            label="Texto alternativo"
            multiline
            minRows={3}
            fullWidth
            value={value.textoApoioConteudo}
            onChange={(e) => onChange('textoApoioConteudo', e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${value.textoApoioConteudo.length}/500`}
          />

          {imagemArquivo && imagemPreview?.arquivo === imagemArquivo && (
            <Box
              component="img"
              src={imagemPreview.url}
              alt={value.textoApoioConteudo}
              sx={{
                display: 'block',
                width: 'auto',
                maxWidth: '100%',
                maxHeight: 420,
                mx: 'auto',
                objectFit: 'contain',
                border: '1px solid #dbe3ef',
                borderRadius: 1,
              }}
            />
          )}

          {!imagemArquivo && (
            <Alert severity="info">Selecione um arquivo PNG, JPEG ou WebP.</Alert>
          )}
        </Stack>
      )}
    </Stack>
  );
}
