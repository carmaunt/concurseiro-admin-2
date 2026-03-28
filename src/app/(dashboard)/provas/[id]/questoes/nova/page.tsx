// src/app/provas/[id]/questoes/nova/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '@/services/api';


type ProvaResponse = {
  id: number;
  banca: string;
  instituicao: string;
  instituicaoId: number;
  ano: number;
  cargo: string;
  nivel: string;
  modalidade: string;
  totalQuestoes: number;
  criadoEm: string;
};

type Disciplina = {
  id: number;
  nome: string;
};

type Assunto = {
  id: number;
  nome: string;
};

type FormData = {
  enunciado: string;
  questao: string;
  alternativas?: string;
  disciplinaId: string;
  assuntoId: string;
  subassunto?: string;
  gabarito: string;
  alternativa_A?: string;
  alternativa_B?: string;
  alternativa_C?: string;
  alternativa_D?: string;
  alternativa_E?: string;
};

function getGabaritoOptions(modalidade?: string) {
  const valor = (modalidade || '').toUpperCase().trim();

  if (
    valor === 'A_E' ||
    valor === 'A-D' ||
    valor === 'A_D' ||
    valor.includes('MULTIPLA') ||
    valor.includes('MÚLTIPLA')
  ) {
    return ['A', 'B', 'C', 'D', 'E'];
  }

  if (
    valor === 'CERTO_ERRADO' ||
    valor.includes('CERTO') ||
    valor.includes('ERRADO')
  ) {
    return ['CERTO', 'ERRADO'];
  }

  return [];
}

export default function NovaQuestaoDaProvaPage() {
  const params = useParams();
  const router = useRouter();
  const provaId = Number(params?.id);

  const [prova, setProva] = useState<ProvaResponse | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    resetField,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: {
      enunciado: '',
      questao: '',
      alternativas: '',
      disciplinaId: '',
      assuntoId: '',
      subassunto: '',
      gabarito: '',
    },
  });

  const disciplinaId = watch('disciplinaId');
  const modalidade = prova?.modalidade;
  console.log('prova carregada:', prova);
  console.log('modalidade recebida:', modalidade);

  const isCertoErrado =
    typeof modalidade === 'string' &&
    modalidade
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/\//g, '_')
      .includes('CERTO_ERRADO');

  const gabaritoOptions = useMemo(() => getGabaritoOptions(modalidade), [modalidade]);

  useEffect(() => {
    async function carregarDadosIniciais() {
      if (!provaId || Number.isNaN(provaId)) {
        setErro('Prova inválida.');
        setLoadingPage(false);
        return;
      }

      try {
        setErro('');
        setLoadingPage(true);

        const [provaRes, disciplinasRes] = await Promise.all([
          api.get<ProvaResponse>(`/api/v1/provas/${provaId}`),
          api.get('/api/v1/catalogo/disciplinas'),
        ]);

        const provaData = provaRes.data as ProvaResponse | { data: ProvaResponse };

        setProva(
          'data' in provaData ? provaData.data : provaData
        );
        setDisciplinas(Array.isArray(disciplinasRes.data) ? disciplinasRes.data : disciplinasRes.data.data);
      } catch (error: any) {
        const status = error?.response?.status;

        if (status === 404) {
          setErro('Prova não encontrada.');
        } else {
          setErro('Não foi possível carregar os dados da página.');
        }
      } finally {
        setLoadingPage(false);
      }
    }

    carregarDadosIniciais();
  }, [provaId]);

  useEffect(() => {
    async function carregarAssuntos() {
      if (!disciplinaId) {
        setAssuntos([]);
        resetField('assuntoId');
        return;
      }

      try {
        setLoadingAssuntos(true);
        resetField('assuntoId');

        const response = await api.get(
            `/api/v1/catalogo/disciplinas/${disciplinaId}/assuntos`
        );

        setAssuntos(
            Array.isArray(response.data)
                ? (response.data as Assunto[])
                : ((response.data as { data: Assunto[] }).data ?? [])
            );
      } catch {
        setAssuntos([]);
      } finally {
        setLoadingAssuntos(false);
      }
    }

    carregarAssuntos();
  }, [disciplinaId, resetField]);

  useEffect(() => {
    setValue('gabarito', '');
  }, [modalidade, setValue]);

  const onSubmit = async (data: FormData) => {
    setErro('');
    setSucesso('');

    try {
      await api.post(`/api/v1/provas/${provaId}/questoes`, {
        enunciado: data.enunciado,
        questao: data.questao,
        alternativas:
          isCertoErrado
            ? 'C) CERTO\nE) ERRADO'
            : ['A', 'B', 'C', 'D', 'E']
                .map((letra) => data[`alternativa_${letra}` as keyof FormData])
                .filter(Boolean)
                .map((alt, index) => `${String.fromCharCode(65 + index)}) ${alt}`)
                .join('\n'),
        disciplinaId: Number(data.disciplinaId),
        assuntoId: Number(data.assuntoId),
        subassunto: data.subassunto?.trim() || null,
        gabarito: data.gabarito,
      });

      setSucesso('Questão cadastrada com sucesso nesta prova.');

      reset({
        enunciado: '',
        questao: '',
        alternativas: '',
        disciplinaId: '',
        assuntoId: '',
        subassunto: '',
        gabarito: '',
        alternativa_A: '',
        alternativa_B: '',
        alternativa_C: '',
        alternativa_D: '',
        alternativa_E: '',
      });

      setAssuntos([]);
    } catch (error: any) {
      console.log('erro cadastro questão:', error?.response?.data);
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      const message = error?.response?.data?.message;

      if (status === 400) {
        setErro(detail || message || 'Dados inválidos para cadastrar a questão.');
        return;
      }

      if (status === 404) {
        setErro(detail || message || 'Recurso não encontrado no catálogo.');
        return;
      }

      if (status === 401) {
        setErro('Sessão expirada. Faça login novamente.');
        return;
      }

      if (status === 403) {
        setErro('Você não tem permissão para cadastrar questão nesta prova.');
        return;
      }

      setErro(detail || message || 'Não foi possível cadastrar a questão.');
    }
  };

  if (loadingPage) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#f6f8fb',
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Carregando dados da prova...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f8fb', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                border: '1px solid #dbe3ee',
                bgcolor: '#fff',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
            }}
            >
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <Stack spacing={2}>
                <Box>
                    <Typography
                    sx={{
                        fontSize: { xs: 32, md: 40 },
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: '#0f172a',
                        letterSpacing: '-0.02em',
                    }}
                    >
                    Cadastro de Questão
                    </Typography>
                </Box>

              {erro && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                  {erro}
                </Alert>
              )}

              {sucesso && (
                <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                  {sucesso}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ mt: 4 }}
              >
                <Stack spacing={2.5}>
                  <TextField
                    label="Enunciado"
                    fullWidth
                    multiline
                    minRows={4}
                    error={!!errors.enunciado}
                    helperText={errors.enunciado?.message}
                    {...register('enunciado', {
                      required: 'Informe o enunciado.',
                    })}
                  />

                  <TextField
                    label="Questão"
                    fullWidth
                    multiline
                    minRows={4}
                    error={!!errors.questao}
                    helperText={errors.questao?.message}
                    {...register('questao', {
                      required: 'Informe o texto da questão.',
                    })}
                  />

                  {isCertoErrado && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px dashed #cbd5e1',
                        bgcolor: '#f8fafc',
                      }}
                    >
                      <Typography fontWeight={600}>
                        Alternativas (Certo / Errado)
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        As alternativas são definidas automaticamente como <strong>CERTO</strong> e <strong>ERRADO</strong>.
                      </Typography>
                    </Box>
                  )}

                   {!isCertoErrado && (
                      <Stack spacing={1.5}>
                        <Typography fontWeight={600}>Alternativas</Typography>

                        {['A', 'B', 'C', 'D', 'E'].map((letra) => (
                          <TextField
                            key={letra}
                            label={`Alternativa ${letra}`}
                            fullWidth
                            {...register(`alternativa_${letra}` as keyof FormData)}
                          />
                        ))}
                      </Stack>
                    )}

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      select
                      label="Disciplina"
                      fullWidth
                      error={!!errors.disciplinaId}
                      helperText={errors.disciplinaId?.message}
                      defaultValue=""
                      {...register('disciplinaId', {
                        required: 'Selecione a disciplina.',
                      })}
                    >
                      <MenuItem value="">Selecione</MenuItem>
                      {disciplinas.map((disciplina) => (
                        <MenuItem key={disciplina.id} value={String(disciplina.id)}>
                          {disciplina.nome}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Assunto"
                      fullWidth
                      disabled={!disciplinaId || loadingAssuntos}
                      error={!!errors.assuntoId}
                      helperText={
                        errors.assuntoId?.message ||
                        (loadingAssuntos ? 'Carregando assuntos...' : '')
                      }
                      defaultValue=""
                      {...register('assuntoId', {
                        required: 'Selecione o assunto.',
                      })}
                    >
                      <MenuItem value="">Selecione</MenuItem>
                      {assuntos.map((assunto) => (
                        <MenuItem key={assunto.id} value={String(assunto.id)}>
                          {assunto.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Subassunto"
                      fullWidth
                      helperText="Opcional."
                      {...register('subassunto')}
                    />

                    <TextField
                      select
                      label="Gabarito"
                      fullWidth
                      disabled={gabaritoOptions.length === 0}
                      error={!!errors.gabarito}
                      helperText={
                        errors.gabarito?.message ||
                        (gabaritoOptions.length === 0
                          ? 'Modalidade da prova sem mapeamento de gabarito no front.'
                          : `Opções válidas para ${modalidade}`)
                      }
                      defaultValue=""
                      {...register('gabarito', {
                        required: 'Selecione o gabarito.',
                      })}
                    >
                      <MenuItem value="">Selecione</MenuItem>
                      {gabaritoOptions.map((opcao) => (
                        <MenuItem key={opcao} value={opcao}>
                          {opcao}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1.5}
                    justifyContent="flex-start"
                    sx={{ pt: 1 }}
                  >
                    <Button
                      component={Link}
                      href={`/provas/${provaId}`}
                      variant="outlined"
                      size="large"
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isSubmitting}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 2.5,
                        height: 44,
                        fontWeight: 700,
                        bgcolor: '#e5e7eb',
                        color: '#111827',
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: '#d1d5db',
                            boxShadow: 'none',
                        },
                      }}
                    >
                      {isSubmitting ? 'Salvando...' : 'Cadastrar questão'}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}