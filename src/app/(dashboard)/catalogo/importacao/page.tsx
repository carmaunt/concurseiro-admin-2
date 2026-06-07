'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { getApiErrorMessage } from '@/services/api';
import { importarCatalogoTexto, type ImportacaoCatalogoResponse } from '@/services/catalogoService';

const exemplo = `Português

1. Interpretação e compreensão de texto
* Ideia principal
* Ideias secundárias
* Informações explícitas

2. Gênero textual
* Notícia
* Reportagem
* Entrevista`;

export default function ImportacaoCatalogoPage() {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<ImportacaoCatalogoResponse | null>(null);
  const [erro, setErro] = useState('');

  const linhasValidas = useMemo(
    () => texto.split('\n').map((linha) => linha.trim()).filter(Boolean).length,
    [texto]
  );

  const importarMutation = useMutation({
    mutationFn: () => importarCatalogoTexto(texto),
    onSuccess: (data) => {
      setResultado(data);
      setErro('');
    },
    onError: (error) => {
      setResultado(null);
      setErro(getApiErrorMessage(error, 'Não foi possível importar o catálogo.'));
    },
  });

  const handleImportar = () => {
    if (!texto.trim()) {
      setErro('Cole o texto do catálogo antes de importar.');
      setResultado(null);
      return;
    }

    importarMutation.mutate();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Importação de catálogo
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Cole a disciplina na primeira linha, assuntos numerados e subassuntos iniciados com asterisco.
          </Typography>
        </Box>

        {erro && <Alert severity="error">{erro}</Alert>}

        {resultado && (
          <Alert severity="success">
            {resultado.disciplina}: {resultado.assuntosProcessados} assuntos e{' '}
            {resultado.subassuntosProcessados} subassuntos processados.
          </Alert>
        )}

        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e8edf3', boxShadow: 'none' }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip label={`${linhasValidas} linhas`} size="small" />
                {resultado && <Chip label={`Disciplina: ${resultado.disciplina}`} color="primary" size="small" />}
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => setTexto(exemplo)} disabled={importarMutation.isPending}>
                  Exemplo
                </Button>
                <Button
                  variant="contained"
                  startIcon={
                    importarMutation.isPending ? <CircularProgress color="inherit" size={18} /> : <UploadFileOutlinedIcon />
                  }
                  onClick={handleImportar}
                  disabled={importarMutation.isPending}
                >
                  Importar
                </Button>
              </Stack>
            </Stack>

            <TextField
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              multiline
              minRows={18}
              fullWidth
              placeholder={exemplo}
              inputProps={{ style: { fontFamily: 'monospace', lineHeight: 1.55 } }}
            />
          </Stack>
        </Paper>

        {resultado && (
          <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e8edf3', boxShadow: 'none' }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Resultado da importação
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`Disciplina: ${resultado.disciplina}`} color="primary" />
                <Chip label={`${resultado.assuntosCriados} assuntos criados`} color="success" />
                <Chip label={`${resultado.assuntosExistentes} assuntos existentes`} variant="outlined" />
                <Chip label={`${resultado.subassuntosCriados} subassuntos criados`} color="success" />
                <Chip label={`${resultado.subassuntosExistentes} subassuntos existentes`} variant="outlined" />
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
