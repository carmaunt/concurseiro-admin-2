'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '@/services/api';

type CatalogoItem = {
  id: number;
  nome: string;
};

type FormData = {
  banca: string;
  ano: string;
  instituicaoId: string;
  cargo: string;
  nivel: string;
  modalidade: string;
};

export default function NovaProvaPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    banca: '',
    ano: '',
    instituicaoId: '',
    cargo: '',
    nivel: '',
    modalidade: '',
  });

  const [bancas, setBancas] = useState<CatalogoItem[]>([]);
  const [instituicoes, setInstituicoes] = useState<CatalogoItem[]>([]);
  const [carregandoCatalogos, setCarregandoCatalogos] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  useEffect(() => {
    async function carregarCatalogos() {
      try {
        setCarregandoCatalogos(true);

        const [bancasRes, instituicoesRes] = await Promise.all([
          api.get('/api/v1/catalogo/bancas'),
          api.get('/api/v1/catalogo/instituicoes'),
        ]);

        const bancasData = bancasRes.data as CatalogoItem[] | { data: CatalogoItem[] };
        const instituicoesData = instituicoesRes.data as CatalogoItem[] | { data: CatalogoItem[] };

        setBancas(Array.isArray(bancasData) ? bancasData : bancasData.data);
        setInstituicoes(Array.isArray(instituicoesData) ? instituicoesData : instituicoesData.data);
      } catch {
        setErro('Não foi possível carregar bancas e instituições do catálogo.');
      } finally {
        setCarregandoCatalogos(false);
      }
    }

    carregarCatalogos();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      await api.post('/api/v1/provas', {
        banca: form.banca,
        instituicaoId: Number(form.instituicaoId),
        ano: Number(form.ano),
        cargo: form.cargo,
        nivel: form.nivel,
        modalidade: form.modalidade,
      });

      router.push('/provas');
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      const message = error?.response?.data?.message;

      if (status === 409) {
        setErro(detail || 'Já existe uma prova cadastrada com esse cabeçalho.');
        return;
      }

      if (status === 404) {
        setErro(detail || message || 'Instituição ou banca não encontrada no catálogo.');
        return;
      }

      if (status === 400) {
        setErro(detail || message || 'Dados inválidos para cadastro da prova.');
        return;
      }

      setErro('Não foi possível cadastrar a prova.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregandoCatalogos) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Carregando catálogos...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={3}>
        <Typography variant="h5" mb={3} fontWeight={700}>
          Nova Prova
        </Typography>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label="Instituição"
            value={form.instituicaoId}
            onChange={handleChange('instituicaoId')}
            required
            fullWidth
            select
          >
            <MenuItem value="">Selecione</MenuItem>
            {instituicoes.map((instituicao) => (
              <MenuItem key={instituicao.id} value={String(instituicao.id)}>
                {instituicao.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Banca"
            value={form.banca}
            onChange={handleChange('banca')}
            required
            fullWidth
            select
          >
            <MenuItem value="">Selecione</MenuItem>
            {bancas.map((banca) => (
              <MenuItem key={banca.id} value={banca.nome}>
                {banca.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Cargo"
            value={form.cargo}
            onChange={handleChange('cargo')}
            required
            fullWidth
          />

          <TextField
            label="Nível"
            value={form.nivel}
            onChange={handleChange('nivel')}
            required
            fullWidth
            select
          >
            <MenuItem value="">Selecione</MenuItem>
            <MenuItem value="FUNDAMENTAL">Fundamental</MenuItem>
            <MenuItem value="MEDIO">Médio</MenuItem>
            <MenuItem value="SUPERIOR">Superior</MenuItem>
          </TextField>

          <TextField
            label="Ano"
            type="number"
            value={form.ano}
            onChange={handleChange('ano')}
            required
            fullWidth
            inputProps={{ min: 1900, max: 2100 }}
          />

          <TextField
            label="Modalidade"
            value={form.modalidade}
            onChange={handleChange('modalidade')}
            required
            fullWidth
            select
          >
            <MenuItem value="">Selecione</MenuItem>
            <MenuItem value="A_E">Múltipla escolha (A-E)</MenuItem>
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