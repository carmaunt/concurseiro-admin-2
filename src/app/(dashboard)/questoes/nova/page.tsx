// src/app/(dashboard)/questoes/nova/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '@/services/api';

type FormData = {
  enunciado: string;
  banca: string;
  ano: string;
  assunto: string;
  modalidade: string;
};

export default function NovaQuestaoPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    enunciado: '',
    banca: '',
    ano: '',
    assunto: '',
    modalidade: '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      await api.post('/questoes', {
        enunciado: form.enunciado,
        banca: form.banca,
        ano: Number(form.ano),
        assunto: form.assunto,
        modalidade: form.modalidade,
      });

      router.push('/questoes');
    } catch {
      setErro('Não foi possível cadastrar a questão.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={2}>
        <Typography variant="h5" mb={3}>
          Nova Questão
        </Typography>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Enunciado"
            multiline
            minRows={5}
            value={form.enunciado}
            onChange={handleChange('enunciado')}
            required
            fullWidth
          />

          <TextField
            label="Banca"
            value={form.banca}
            onChange={handleChange('banca')}
            required
            fullWidth
          />

          <TextField
            label="Ano"
            type="number"
            value={form.ano}
            onChange={handleChange('ano')}
            required
            fullWidth
          />

          <TextField
            label="Assunto"
            value={form.assunto}
            onChange={handleChange('assunto')}
            required
            fullWidth
          />

          <TextField
            label="Modalidade"
            value={form.modalidade}
            onChange={handleChange('modalidade')}
            required
            fullWidth
            select
          >
            <MenuItem value="MULTIPLA_ESCOLHA">Múltipla escolha</MenuItem>
            <MenuItem value="CERTO_ERRADO">Certo ou errado</MenuItem>
          </TextField>

          <Box display="flex" gap={2} mt={1}>
            <Button type="submit" variant="contained" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>

            <Button variant="outlined" onClick={() => router.push('/questoes')}>
              Cancelar
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}