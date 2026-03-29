// src/app/provas/[id]/questoes/nova/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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

type CatalogoItem = {
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

const NOVO_VALOR = '__new__';
const CONFIRMED_PREFIX = '__confirmed__:';

function normalizarLista(data: any): CatalogoItem[] {
  const arr = Array.isArray(data) ? data : data?.data ?? [];
  return arr
    .map((x: any) => ({
      id: x.id ?? x.idDisciplina ?? x.idAssunto ?? x.idSubassunto,
      nome: x.nome ?? x.titulo ?? x.descricao ?? x.name,
    }))
    .filter((x: CatalogoItem) => x.id != null && x.nome);
}

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
  const provaId = Number(params?.id);

  const [prova, setProva] = useState<ProvaResponse | null>(null);
  const [disciplinas, setDisciplinas] = useState<CatalogoItem[]>([]);
  const [assuntos, setAssuntos] = useState<CatalogoItem[]>([]);
  const [subassuntos, setSubassuntos] = useState<CatalogoItem[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);
  const [loadingSubassuntos, setLoadingSubassuntos] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [disciplinaSel, setDisciplinaSel] = useState('');
  const [assuntoSel, setAssuntoSel] = useState('');
  const [subassuntoSel, setSubassuntoSel] = useState('');

  const [disciplinaNew, setDisciplinaNew] = useState('');
  const [assuntoNew, setAssuntoNew] = useState('');
  const [subassuntoNew, setSubassuntoNew] = useState('');

  const [savingInline, setSavingInline] = useState<null | 'disciplina' | 'assunto' | 'subassunto'>(null);

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
      alternativa_A: '',
      alternativa_B: '',
      alternativa_C: '',
      alternativa_D: '',
      alternativa_E: '',
    },
  });

  const disciplinaId = watch('disciplinaId');
  const assuntoId = watch('assuntoId');
  const modalidade = prova?.modalidade;

  const assuntoIsConfirmed = useMemo(
    () => assuntoSel.startsWith(CONFIRMED_PREFIX),
    [assuntoSel]
  );

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

        setProva('data' in provaData ? provaData.data : provaData);
        setDisciplinas(normalizarLista(disciplinasRes.data));
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
      if (!disciplinaId || disciplinaSel === NOVO_VALOR) {
        setAssuntos([]);
        setSubassuntos([]);
        resetField('assuntoId');
        resetField('subassunto');
        return;
      }

      try {
        setLoadingAssuntos(true);
        resetField('assuntoId');
        resetField('subassunto');
        setSubassuntos([]);
        setAssuntoSel('');
        setSubassuntoSel('');

        const response = await api.get(
          `/api/v1/catalogo/disciplinas/${disciplinaId}/assuntos`
        );

        setAssuntos(normalizarLista(response.data));
      } catch {
        setAssuntos([]);
      } finally {
        setLoadingAssuntos(false);
      }
    }

    carregarAssuntos();
  }, [disciplinaId, disciplinaSel, resetField]);

  useEffect(() => {
    async function carregarSubassuntos() {
      if (!assuntoId || assuntoSel === NOVO_VALOR || assuntoIsConfirmed) {
        setSubassuntos([]);
        resetField('subassunto');
        return;
      }

      try {
        setLoadingSubassuntos(true);
        resetField('subassunto');
        setSubassuntoSel('');

        const response = await api.get(
          `/api/v1/catalogo/assuntos/${assuntoId}/subassuntos`
        );

        setSubassuntos(normalizarLista(response.data));
      } catch {
        setSubassuntos([]);
      } finally {
        setLoadingSubassuntos(false);
      }
    }

    carregarSubassuntos();
  }, [assuntoId, assuntoSel, assuntoIsConfirmed, resetField]);

  useEffect(() => {
    setValue('gabarito', '');
  }, [modalidade, setValue]);

  async function criarItemCatalogo(
    tipo: 'disciplina' | 'assunto' | 'subassunto',
    nome: string,
    disciplinaIdParam?: number | null,
    assuntoIdParam?: number | null
  ) {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) throw new Error('Digite um nome válido.');

    let path = '';
    let payload: any = {};

    if (tipo === 'disciplina') {
      path = '/api/v1/admin/catalogo/disciplinas';
      payload = { nome: nomeLimpo };
    } else if (tipo === 'assunto') {
      if (!disciplinaIdParam) throw new Error('Escolha uma disciplina antes.');
      path = '/api/v1/admin/catalogo/assuntos';
      payload = { disciplinaId: disciplinaIdParam, nome: nomeLimpo };
    } else {
      if (!assuntoIdParam) throw new Error('Escolha um assunto antes.');
      path = '/api/v1/admin/catalogo/subassuntos';
      payload = { assuntoId: assuntoIdParam, nome: nomeLimpo };
    }

    const res = await api.post(path, payload);
    const created = res.data?.data ?? res.data;

    const id =
      created?.id ??
      created?.idDisciplina ??
      created?.idAssunto ??
      created?.idSubassunto;

    const nomeResp = created?.nome ?? nomeLimpo;

    if (id == null) {
      throw new Error('O backend não retornou o id do item criado.');
    }

    return { id, nome: nomeResp } as CatalogoItem;
  }

  const handleInlineCreate = async (tipo: 'disciplina' | 'assunto' | 'subassunto') => {
    try {
      setErro('');
      setSavingInline(tipo);

      if (tipo === 'disciplina') {
        const created = await criarItemCatalogo('disciplina', disciplinaNew);

        setDisciplinas((prev) => [...prev, created]);
        setDisciplinaSel(String(created.id));
        setAssuntos([]);
        setSubassuntos([]);
        setAssuntoSel('');
        setSubassuntoSel('');
        setDisciplinaNew('');

        setValue('disciplinaId', String(created.id));
        setValue('assuntoId', '');
        setValue('subassunto', '');

        return;
      }

      if (tipo === 'assunto') {
        const nome = assuntoNew.trim();
        if (!nome) throw new Error('Digite o assunto para confirmar.');

        const confirmedValue = `${CONFIRMED_PREFIX}${nome}`;
        setAssuntoSel(confirmedValue);
        setAssuntoNew('');
        setSubassuntos([]);
        setSubassuntoSel('');

        setValue('assuntoId', '');
        setValue('subassunto', '');

        return;
      }

      const nomeSub = subassuntoNew.trim();
      if (!nomeSub) throw new Error('Digite o subassunto para confirmar.');

      let assuntoIdReal = Number(assuntoId);

      if (assuntoIsConfirmed) {
        const nomeAssunto = assuntoSel.replace(CONFIRMED_PREFIX, '').trim();
        const createdAssunto = await criarItemCatalogo(
          'assunto',
          nomeAssunto,
          Number(disciplinaId),
          null
        );

        setAssuntos((prev) => [...prev, createdAssunto]);
        setAssuntoSel(String(createdAssunto.id));
        setValue('assuntoId', String(createdAssunto.id));
        assuntoIdReal = createdAssunto.id;
      }

      if (!assuntoIdReal) throw new Error('Escolha ou confirme um assunto antes.');

      const createdSubassunto = await criarItemCatalogo(
        'subassunto',
        nomeSub,
        null,
        assuntoIdReal
      );

      setSubassuntos((prev) => [...prev, createdSubassunto]);
      setSubassuntoSel(String(createdSubassunto.id));
      setSubassuntoNew('');
      setValue('subassunto', createdSubassunto.nome);
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

  const onSubmit = async (data: FormData) => {
    setErro('');
    setSucesso('');

    try {
      await api.post(`/api/v1/provas/${provaId}/questoes`, {
        enunciado: data.enunciado,
        questao: data.questao,
        alternativas: isCertoErrado
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
      setSubassuntos([]);
      setDisciplinaSel('');
      setAssuntoSel('');
      setSubassuntoSel('');
      setDisciplinaNew('');
      setAssuntoNew('');
      setSubassuntoNew('');
    } catch (error: any) {
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

                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 4 }}>
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
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          select
                          label="Disciplina"
                          fullWidth
                          value={disciplinaSel}
                          error={!!errors.disciplinaId}
                          helperText={errors.disciplinaId?.message}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDisciplinaSel(value);

                            if (value === NOVO_VALOR) {
                              setValue('disciplinaId', '');
                              setValue('assuntoId', '');
                              setValue('subassunto', '');
                              setAssuntos([]);
                              setSubassuntos([]);
                              setAssuntoSel('');
                              setSubassuntoSel('');
                              return;
                            }

                            const selected = disciplinas.find((item) => String(item.id) === value);

                            setValue('disciplinaId', selected ? String(selected.id) : '');
                            setValue('assuntoId', '');
                            setValue('subassunto', '');
                            setAssuntoSel('');
                            setSubassuntoSel('');
                            setSubassuntos([]);
                          }}
                        >
                          <MenuItem value="">Selecione</MenuItem>
                          {disciplinas.map((disciplina) => (
                            <MenuItem key={disciplina.id} value={String(disciplina.id)}>
                              {disciplina.nome}
                            </MenuItem>
                          ))}
                          <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
                        </TextField>

                        {disciplinaSel === NOVO_VALOR && (
                          <Stack direction="row" spacing={1.5} mt={1.5}>
                            <TextField
                              fullWidth
                              label="Nova disciplina"
                              value={disciplinaNew}
                              onChange={(e) => setDisciplinaNew(e.target.value)}
                            />
                            <Button
                              variant="contained"
                              onClick={() => handleInlineCreate('disciplina')}
                              disabled={savingInline === 'disciplina'}
                              sx={{ minWidth: 90 }}
                            >
                              +
                            </Button>
                          </Stack>
                        )}
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <TextField
                          select
                          label="Assunto"
                          fullWidth
                          value={assuntoSel}
                          disabled={!disciplinaId || loadingAssuntos}
                          error={!!errors.assuntoId}
                          helperText={
                            errors.assuntoId?.message ||
                            (loadingAssuntos ? 'Carregando assuntos...' : '')
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setAssuntoSel(value);

                            if (value === NOVO_VALOR) {
                              setValue('assuntoId', '');
                              setValue('subassunto', '');
                              setSubassuntos([]);
                              setSubassuntoSel('');
                              return;
                            }

                            if (value.startsWith(CONFIRMED_PREFIX)) {
                              setValue('assuntoId', '');
                              setValue('subassunto', '');
                              setSubassuntos([]);
                              setSubassuntoSel('');
                              return;
                            }

                            const selected = assuntos.find((item) => String(item.id) === value);

                            setValue('assuntoId', selected ? String(selected.id) : '');
                            setValue('subassunto', '');
                            setSubassuntoSel('');
                          }}
                        >
                          <MenuItem value="">Selecione</MenuItem>

                          {assuntoIsConfirmed && (
                            <MenuItem value={assuntoSel}>
                              {assuntoSel.replace(CONFIRMED_PREFIX, '')}
                            </MenuItem>
                          )}

                          {assuntos.map((assunto) => (
                            <MenuItem key={assunto.id} value={String(assunto.id)}>
                              {assunto.nome}
                            </MenuItem>
                          ))}
                          <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
                        </TextField>

                        {assuntoSel === NOVO_VALOR && (
                          <Stack direction="row" spacing={1.5} mt={1.5}>
                            <TextField
                              fullWidth
                              label="Novo assunto"
                              value={assuntoNew}
                              onChange={(e) => setAssuntoNew(e.target.value)}
                            />
                            <Button
                              variant="contained"
                              onClick={() => handleInlineCreate('assunto')}
                              disabled={savingInline === 'assunto'}
                              sx={{ minWidth: 90 }}
                            >
                              +
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          select
                          label="Subassunto"
                          fullWidth
                          value={subassuntoSel}
                          disabled={
                            (!assuntoId && !assuntoIsConfirmed) || loadingSubassuntos
                          }
                          helperText={
                            loadingSubassuntos
                              ? 'Carregando subassuntos...'
                              : 'Opcional.'
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setSubassuntoSel(value);

                            if (value === NOVO_VALOR || !value) {
                              setValue('subassunto', '');
                              return;
                            }

                            const selected = subassuntos.find((item) => String(item.id) === value);
                            setValue('subassunto', selected?.nome ?? '');
                          }}
                        >
                          <MenuItem value="">Selecione</MenuItem>
                          {subassuntos.map((item) => (
                            <MenuItem key={item.id} value={String(item.id)}>
                              {item.nome}
                            </MenuItem>
                          ))}
                          <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
                        </TextField>

                        {subassuntoSel === NOVO_VALOR && (
                          <Stack direction="row" spacing={1.5} mt={1.5}>
                            <TextField
                              fullWidth
                              label="Novo subassunto"
                              value={subassuntoNew}
                              onChange={(e) => setSubassuntoNew(e.target.value)}
                            />
                            <Button
                              variant="contained"
                              onClick={() => handleInlineCreate('subassunto')}
                              disabled={savingInline === 'subassunto'}
                              sx={{ minWidth: 90 }}
                            >
                              +
                            </Button>
                          </Stack>
                        )}
                      </Box>

                      <Box sx={{ flex: 1 }}>
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
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1.5}
                      justifyContent="flex-start"
                      sx={{ pt: 1 }}
                    >
                      <Button
                        component={Link}
                        href={`/provas`}
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