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
import { api } from '@/services/api';

type ImportacaoResponse = {
  disciplinaId: number;
  disciplina: string;
  assuntosProcessados: number;
  assuntosCriados: number;
  assuntosExistentes: number;
  subassuntosProcessados: number;
  subassuntosCriados: number;
  subassuntosExistentes: number;
};

const exemplo = `Português

1. Interpretação e compreensão de texto
* Ideia principal
* Ideias secundárias
* Informações explícitas

2. Gênero textual
* Notícia
* Reportagem
* Entrevista`;

function extrairMensagemErro(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { detail?: unknown; message?: unknown } } }).response?.data === 'object'
  ) {
    const data = (error as { response: { data?: { detail?: unknown; message?: unknown } } }).response.data;
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.message === 'string') return data.message;
  }

  return 'Não foi possível importar o catálogo.';
}

export default function ImportacaoCatalogoPage() {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<ImportacaoResponse | null>(null);
  const [erro, setErro] = useState('');

  const linhasValidas = useMemo(
    () => texto.split('\n').map((linha) => linha.trim()).filter(Boolean).length,
    [texto]
  );

  const importarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ImportacaoResponse>('/api/v1/admin/catalogo/importar-texto', texto, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResultado(data);
      setErro('');
    },
    onError: (error) => {
      setResultado(null);
      setErro(extrairMensagemErro(error));
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
