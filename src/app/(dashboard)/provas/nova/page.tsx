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
  novaBanca: string;
  novaInstituicao: string;
};

const NOVO_VALOR = '__new__';

function normalizarLista(data: any): CatalogoItem[] {
  const arr = Array.isArray(data) ? data : data?.data ?? [];
  return arr
    .map((x: any) => ({
      id: x.id ?? x.idBanca ?? x.idInstituicao,
      nome: x.nome ?? x.name,
    }))
    .filter((x: CatalogoItem) => x.id != null && x.nome);
}

export default function NovaProvaPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    banca: '',
    ano: '',
    instituicaoId: '',
    cargo: '',
    nivel: '',
    modalidade: '',
    novaBanca: '',
    novaInstituicao: '',
  });

  const [bancas, setBancas] = useState<CatalogoItem[]>([]);
  const [instituicoes, setInstituicoes] = useState<CatalogoItem[]>([]);
  const [carregandoCatalogos, setCarregandoCatalogos] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [bancaSel, setBancaSel] = useState('');
  const [instituicaoSel, setInstituicaoSel] = useState('');
  const [savingInline, setSavingInline] = useState<null | 'banca' | 'instituicao'>(null);

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

        setBancas(normalizarLista(bancasRes.data));
        setInstituicoes(normalizarLista(instituicoesRes.data));
      } catch {
        setErro('Não foi possível carregar bancas e instituições do catálogo.');
      } finally {
        setCarregandoCatalogos(false);
      }
    }

    carregarCatalogos();
  }, []);

  async function criarItemCatalogo(tipo: 'banca' | 'instituicao', nome: string) {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) throw new Error('Digite um nome válido.');

    const path =
      tipo === 'banca'
        ? '/api/v1/admin/catalogo/bancas'
        : '/api/v1/admin/catalogo/instituicoes';

    const res = await api.post(path, { nome: nomeLimpo });
    const created = res.data?.data ?? res.data;

    const id = created?.id ?? created?.idBanca ?? created?.idInstituicao;
    const nomeResp = created?.nome ?? nomeLimpo;

    if (id == null) {
      throw new Error('O backend não retornou o id do item criado.');
    }

    return { id, nome: nomeResp } as CatalogoItem;
  }

  const handleInlineCreate = async (tipo: 'banca' | 'instituicao') => {
    try {
      setErro('');
      setSavingInline(tipo);

      if (tipo === 'banca') {
        const created = await criarItemCatalogo('banca', form.novaBanca);
        setBancas((prev) => [...prev, created]);
        setBancaSel(String(created.id));
        setForm((prev) => ({
          ...prev,
          banca: created.nome,
          novaBanca: '',
        }));
        return;
      }

      const created = await criarItemCatalogo('instituicao', form.novaInstituicao);
      setInstituicoes((prev) => [...prev, created]);
      setInstituicaoSel(String(created.id));
      setForm((prev) => ({
        ...prev,
        instituicaoId: String(created.id),
        novaInstituicao: '',
      }));
    } catch (error: any) {
      setErro(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          error?.message ||
          'Erro ao criar item do catálogo.'
      );
    } finally {
      setSavingInline(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro('');
    setSalvando(true);

    if (!form.instituicaoId) {
      setErro('Selecione ou crie uma instituição.');
      setSalvando(false);
      return;
    }

    if (!form.banca) {
      setErro('Selecione ou crie uma banca.');
      setSalvando(false);
      return;
    }

    try {
      await api.post('/api/v1/provas', {
        banca: form.banca,
        instituicaoId: Number(form.instituicaoId),
        ano: Number(form.ano),
        cargo: form.cargo.trim(),
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

      if (status === 403) {
        setErro('Seu usuário não tem permissão para adicionar itens ao catálogo.');
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
            value={instituicaoSel}
            onChange={(e) => {
              const value = e.target.value;
              setInstituicaoSel(value);

              if (value === NOVO_VALOR) {
                setForm((prev) => ({ ...prev, instituicaoId: '' }));
                return;
              }

              const selected = instituicoes.find((item) => String(item.id) === value);
              setForm((prev) => ({
                ...prev,
                instituicaoId: selected ? String(selected.id) : '',
              }));
            }}
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
            <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
          </TextField>

          {instituicaoSel === NOVO_VALOR && (
            <Stack direction="row" spacing={1.5}>
              <TextField
                fullWidth
                label="Nova instituição"
                value={form.novaInstituicao}
                onChange={handleChange('novaInstituicao')}
              />
              <Button
                variant="contained"
                onClick={() => handleInlineCreate('instituicao')}
                disabled={savingInline === 'instituicao'}
                sx={{ minWidth: 90 }}
              >
                +
              </Button>
            </Stack>
          )}

          <TextField
            label="Banca"
            value={bancaSel}
            onChange={(e) => {
              const value = e.target.value;
              setBancaSel(value);

              if (value === NOVO_VALOR) {
                setForm((prev) => ({ ...prev, banca: '' }));
                return;
              }

              const selected = bancas.find((item) => String(item.id) === value);
              setForm((prev) => ({
                ...prev,
                banca: selected?.nome ?? '',
              }));
            }}
            required
            fullWidth
            select
          >
            <MenuItem value="">Selecione</MenuItem>
            {bancas.map((banca) => (
              <MenuItem key={banca.id} value={String(banca.id)}>
                {banca.nome}
              </MenuItem>
            ))}
            <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
          </TextField>

          {bancaSel === NOVO_VALOR && (
            <Stack direction="row" spacing={1.5}>
              <TextField
                fullWidth
                label="Nova banca"
                value={form.novaBanca}
                onChange={handleChange('novaBanca')}
              />
              <Button
                variant="contained"
                onClick={() => handleInlineCreate('banca')}
                disabled={savingInline === 'banca'}
                sx={{ minWidth: 90 }}
              >
                +
              </Button>
            </Stack>
          )}

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