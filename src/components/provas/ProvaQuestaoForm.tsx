'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '@/services/api';
import type { CatalogoItem, ProvaDetalhe, TextoApoio } from '@/types/api';

type Prova = ProvaDetalhe;
type Item = CatalogoItem;

type FormData = {
  textoApoioId: string;
  textoApoioTitulo: string;
  textoApoioConteudo: string;
  enunciado: string;
  questao: string;
  disciplinaId: string;
  assuntoId: string;
  subassunto: string;
  gabarito: string;
  alternativa_A: string;
  alternativa_B: string;
  alternativa_C: string;
  alternativa_D: string;
  alternativa_E: string;
};

const defaults: FormData = {
  textoApoioId: '',
  textoApoioTitulo: '',
  textoApoioConteudo: '',
  enunciado: '',
  questao: '',
  disciplinaId: '',
  assuntoId: '',
  subassunto: '',
  gabarito: '',
  alternativa_A: '',
  alternativa_B: '',
  alternativa_C: '',
  alternativa_D: '',
  alternativa_E: '',
};

const ADD_NEW = '__ADD_NEW__';
const GABARITO_ANULADA = 'X';

function dataOf<T>(value: T | { data: T }): T {
  return value && typeof value === 'object' && 'data' in value ? (value as { data: T }).data : (value as T);
}

function arrayOf(value: any): any[] {
  return Array.isArray(value)
    ? value
    : Array.isArray(value?.data)
      ? value.data
      : Array.isArray(value?.content)
        ? value.content
        : Array.isArray(value?.data?.content)
          ? value.data.content
          : [];
}

function itens(value: any): Item[] {
  return arrayOf(value)
    .map((x) => ({
      id: x.id ?? x.idDisciplina ?? x.idAssunto ?? x.idSubassunto,
      nome: x.nome ?? x.titulo ?? x.descricao ?? x.name,
    }))
    .filter((x) => x.id && x.nome);
}

function itemOf(value: any): Item {
  const raw = dataOf<any>(value);
  return {
    id: Number(raw.id ?? raw.idDisciplina ?? raw.idAssunto ?? raw.idSubassunto),
    nome: String(raw.nome ?? raw.titulo ?? raw.descricao ?? raw.name),
  };
}

function textos(value: any): TextoApoio[] {
  return arrayOf(value)
    .map((x) => ({ id: x.id, titulo: x.titulo ?? null, conteudo: x.conteudo ?? '' }))
    .filter((x) => x.id && x.conteudo);
}

function norm(value?: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/\//g, '_');
}

function certoErrado(value?: string) {
  return norm(value).includes('CERTO_ERRADO');
}

function gabaritos(value?: string) {
  if (certoErrado(value)) return ['CERTO', 'ERRADO', GABARITO_ANULADA];
  return norm(value) === 'A_D'
    ? ['A', 'B', 'C', 'D', GABARITO_ANULADA]
    : ['A', 'B', 'C', 'D', 'E', GABARITO_ANULADA];
}

function labelGabarito(gabarito: string) {
  return gabarito === GABARITO_ANULADA ? 'Questão anulada' : gabarito;
}

function montarAlternativas(prova: Prova | null, data: FormData) {
  if (certoErrado(prova?.modalidade)) return 'C) CERTO\nE) ERRADO';

  return gabaritos(prova?.modalidade)
    .map((letra) => {
      const valor = data[`alternativa_${letra}` as keyof FormData]?.trim();
      return valor ? `${letra}) ${valor}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

export default function ProvaQuestaoForm({ provaId }: { provaId: number }) {
  const router = useRouter();
  const [prova, setProva] = useState<Prova | null>(null);
  const [disciplinas, setDisciplinas] = useState<Item[]>([]);
  const [assuntos, setAssuntos] = useState<Item[]>([]);
  const [subassuntos, setSubassuntos] = useState<Item[]>([]);
  const [textosApoio, setTextosApoio] = useState<TextoApoio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues: defaults });

  const disciplinaId = watch('disciplinaId');
  const assuntoId = watch('assuntoId');
  const textoApoioId = watch('textoApoioId');
  const gabaritoOptions = useMemo(() => gabaritos(prova?.modalidade), [prova?.modalidade]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [provaRes, disciplinasRes, textosRes] = await Promise.all([
          api.get(`/api/v1/provas/${provaId}`),
          api.get('/api/v1/catalogo/disciplinas'),
          api.get('/api/v1/textos-apoio', { params: { page: 0, size: 50 } }),
        ]);
        setProva(dataOf<Prova>(provaRes.data));
        setDisciplinas(itens(disciplinasRes.data));
        setTextosApoio(textos(textosRes.data));
      } catch {
        setErro('Não foi possível carregar os dados da página.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [provaId]);

  useEffect(() => {
    async function load() {
      setAssuntos([]);
      setSubassuntos([]);
      setValue('assuntoId', '');
      setValue('subassunto', '');
      if (!disciplinaId) return;
      const res = await api.get(`/api/v1/catalogo/disciplinas/${disciplinaId}/assuntos`);
      setAssuntos(itens(res.data));
    }
    load().catch(() => setAssuntos([]));
  }, [disciplinaId, setValue]);

  useEffect(() => {
    async function load() {
      setSubassuntos([]);
      setValue('subassunto', '');
      if (!assuntoId) return;
      const res = await api.get(`/api/v1/catalogo/assuntos/${assuntoId}/subassuntos`);
      setSubassuntos(itens(res.data));
    }
    load().catch(() => setSubassuntos([]));
  }, [assuntoId, setValue]);

  async function criarDisciplina() {
    const nome = window.prompt('Nome da nova disciplina:')?.trim();
    if (!nome) return;

    try {
      const res = await api.post('/api/v1/admin/catalogo/disciplinas', { nome });
      const novo = itemOf(res.data);
      setDisciplinas((atual) => [novo, ...atual.filter((item) => item.id !== novo.id)]);
      setValue('disciplinaId', String(novo.id));
      setSucesso(`Disciplina "${novo.nome}" adicionada.`);
    } catch (e: any) {
      setErro(e?.response?.data?.detail || e?.response?.data?.message || 'Não foi possível adicionar a disciplina.');
    }
  }

  async function criarAssunto() {
    if (!disciplinaId) {
      setErro('Selecione uma disciplina antes de adicionar um assunto.');
      return;
    }

    const nome = window.prompt('Nome do novo assunto:')?.trim();
    if (!nome) return;

    try {
      const res = await api.post('/api/v1/admin/catalogo/assuntos', {
        disciplinaId: Number(disciplinaId),
        nome,
      });
      const novo = itemOf(res.data);
      setAssuntos((atual) => [novo, ...atual.filter((item) => item.id !== novo.id)]);
      setValue('assuntoId', String(novo.id));
      setSucesso(`Assunto "${novo.nome}" adicionado.`);
    } catch (e: any) {
      setErro(e?.response?.data?.detail || e?.response?.data?.message || 'Não foi possível adicionar o assunto.');
    }
  }

  async function criarSubassunto() {
    if (!assuntoId) {
      setErro('Selecione um assunto antes de adicionar um subassunto.');
      return;
    }

    const nome = window.prompt('Nome do novo subassunto:')?.trim();
    if (!nome) return;

    try {
      const res = await api.post('/api/v1/admin/catalogo/subassuntos', {
        assuntoId: Number(assuntoId),
        nome,
      });
      const novo = itemOf(res.data);
      setSubassuntos((atual) => [novo, ...atual.filter((item) => item.nome !== novo.nome)]);
      setValue('subassunto', novo.nome);
      setSucesso(`Subassunto "${novo.nome}" adicionado.`);
    } catch (e: any) {
      setErro(e?.response?.data?.detail || e?.response?.data?.message || 'Não foi possível adicionar o subassunto.');
    }
  }

  async function onSubmit(data: FormData) {
    setErro('');
    setSucesso('');

    if (data.textoApoioId && data.textoApoioConteudo.trim()) {
      setErro('Use texto de apoio existente ou cole um novo texto, não os dois ao mesmo tempo.');
      return;
    }

    try {
      await api.post(`/api/v1/provas/${provaId}/questoes`, {
        enunciado: data.enunciado.trim(),
        questao: data.questao.trim(),
        alternativas: montarAlternativas(prova, data),
        textoApoioId: data.textoApoioId ? Number(data.textoApoioId) : null,
        textoApoioTitulo: data.textoApoioId ? null : data.textoApoioTitulo.trim() || null,
        textoApoioConteudo: data.textoApoioId ? null : data.textoApoioConteudo.trim() || null,
        disciplinaId: Number(data.disciplinaId),
        assuntoId: Number(data.assuntoId),
        subassunto: data.subassunto || null,
        gabarito: data.gabarito,
      });
      setSucesso('Questão cadastrada com sucesso nesta prova.');
      reset({
        ...defaults,
        textoApoioId: data.textoApoioId,
        disciplinaId: data.disciplinaId,
        assuntoId: data.assuntoId,
        subassunto: data.subassunto,
      });
    } catch (e: any) {
      setErro(e?.response?.data?.detail || e?.response?.data?.message || 'Não foi possível cadastrar a questão.');
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f8fb', py: { xs: 2, md: 5 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Card elevation={0} sx={{ borderRadius: { xs: 3, md: 4 }, border: '1px solid #dbe3ee' }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 4 } }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography sx={{ fontSize: { xs: 30, sm: 34, md: 40 }, fontWeight: 800, lineHeight: 1.1, color: '#0f172a' }}>
                  Cadastro de Questão
                </Typography>
                {prova && (
                  <Typography color="text.secondary" mt={1}>
                    {prova.banca} • {prova.instituicao} • {prova.cargo} • {prova.ano}
                  </Typography>
                )}
              </Box>

              {erro && <Alert severity="error" sx={{ borderRadius: 2 }}>{erro}</Alert>}
              {sucesso && <Alert severity="success" sx={{ borderRadius: 2 }}>{sucesso}</Alert>}

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2.5}>
                  <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: '1px solid #dbeafe', bgcolor: '#eff6ff' }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography fontWeight={800} color="#1e40af">Texto de apoio</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reaproveite um texto existente ou cole um novo texto para várias questões.
                        </Typography>
                      </Box>

                      <TextField
                        select
                        label="Reaproveitar texto existente"
                        fullWidth
                        {...register('textoApoioId')}
                        onChange={(e) => {
                          setValue('textoApoioId', e.target.value);
                          if (e.target.value) {
                            setValue('textoApoioTitulo', '');
                            setValue('textoApoioConteudo', '');
                          }
                        }}
                      >
                        <MenuItem value="">Nenhum</MenuItem>
                        {textosApoio.map((t) => (
                          <MenuItem key={t.id} value={String(t.id)}>{t.titulo || `Texto de apoio #${t.id}`}</MenuItem>
                        ))}
                      </TextField>

                      {!textoApoioId && (
                        <>
                          <TextField label="Título do novo texto de apoio" fullWidth {...register('textoApoioTitulo')} />
                          <TextField label="Novo texto de apoio" multiline minRows={6} fullWidth {...register('textoApoioConteudo')} />
                        </>
                      )}
                    </Stack>
                  </Paper>

                  <TextField
                    label="Enunciado"
                    multiline
                    minRows={4}
                    fullWidth
                    helperText="Opcional. Use apenas para comandos curtos, como: Julgue o item a seguir."
                    {...register('enunciado')}
                  />

                  <TextField
                    label="Questão"
                    multiline
                    minRows={4}
                    fullWidth
                    error={!!errors.questao}
                    helperText={errors.questao?.message}
                    {...register('questao', { required: 'Informe o texto da questão.' })}
                  />

                  {certoErrado(prova?.modalidade) ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      As alternativas serão preenchidas automaticamente como CERTO e ERRADO.
                    </Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {gabaritoOptions.map((letra) => (
                        <TextField key={letra} label={`Alternativa ${letra}`} fullWidth {...register(`alternativa_${letra}` as keyof FormData)} />
                      ))}
                    </Stack>
                  )}

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      select
                      label="Disciplina"
                      fullWidth
                      error={!!errors.disciplinaId}
                      helperText={errors.disciplinaId?.message}
                      {...register('disciplinaId', { required: 'Selecione a disciplina.' })}
                      onChange={(e) => {
                        if (e.target.value === ADD_NEW) {
                          criarDisciplina();
                          return;
                        }
                        setValue('disciplinaId', e.target.value);
                      }}
                    >
                      <MenuItem value={ADD_NEW}>+ Adicionar nova disciplina</MenuItem>
                      <MenuItem value="">Selecione</MenuItem>
                      {disciplinas.map((d) => (
                        <MenuItem key={d.id} value={String(d.id)}>{d.nome}</MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Assunto"
                      fullWidth
                      disabled={!disciplinaId}
                      error={!!errors.assuntoId}
                      helperText={errors.assuntoId?.message}
                      {...register('assuntoId', { required: 'Selecione o assunto.' })}
                      onChange={(e) => {
                        if (e.target.value === ADD_NEW) {
                          criarAssunto();
                          return;
                        }
                        setValue('assuntoId', e.target.value);
                      }}
                    >
                      <MenuItem value={ADD_NEW}>+ Adicionar novo assunto</MenuItem>
                      <MenuItem value="">Selecione</MenuItem>
                      {assuntos.map((a) => (
                        <MenuItem key={a.id} value={String(a.id)}>{a.nome}</MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Subassunto"
                      fullWidth
                      disabled={!assuntoId}
                      helperText="Opcional."
                      {...register('subassunto')}
                      onChange={(e) => {
                        if (e.target.value === ADD_NEW) {
                          criarSubassunto();
                          return;
                        }
                        setValue('subassunto', e.target.value);
                      }}
                    >
                      <MenuItem value={ADD_NEW}>+ Adicionar novo subassunto</MenuItem>
                      <MenuItem value="">Selecione</MenuItem>
                      {subassuntos.map((s) => (
                        <MenuItem key={s.id} value={s.nome}>{s.nome}</MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Gabarito"
                      fullWidth
                      error={!!errors.gabarito}
                      helperText={errors.gabarito?.message}
                      {...register('gabarito', { required: 'Selecione o gabarito.' })}
                    >
                      <MenuItem value="">Selecione</MenuItem>
                      {gabaritoOptions.map((g) => (
                        <MenuItem key={g} value={g}>{labelGabarito(g)}</MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 700 }}>
                      {isSubmitting ? 'Cadastrando...' : 'Cadastrar questão'}
                    </Button>
                    <Button variant="outlined" fullWidth onClick={() => router.push(`/provas/${provaId}`)} sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 700 }}>
                      Voltar para prova
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
