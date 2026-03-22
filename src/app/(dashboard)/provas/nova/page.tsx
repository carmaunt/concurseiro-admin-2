// src/app/(dashboard)/provas/nova/page.tsx
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
  banca: string;
  ano: string;
  instituicao: string;
  modalidade: string;
};

export default function NovaProvaPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    banca: '',
    ano: '',
    instituicao: '',
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
      await api.post('/provas', {
        banca: form.banca,
        ano: Number(form.ano),
        instituicao: form.instituicao,
        modalidade: form.modalidade,
      });

      router.push('/provas');
    } catch {
      setErro('Não foi possível cadastrar a prova.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={2}>
        <Typography variant="h5" mb={3}>
          Nova Prova
        </Typography>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Instituição"
            value={form.instituicao}
            onChange={handleChange('instituicao')}
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

            <Button variant="outlined" onClick={() => router.push('/provas')}>
              Cancelar
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}