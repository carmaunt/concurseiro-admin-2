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
import { getApiErrorMessage } from '@/services/api';
import {
  criarAssuntoCatalogo,
  criarItemCatalogo,
  criarSubassuntoCatalogo,
  listarAssuntosPorDisciplina,
  listarDisciplinas,
  listarSubassuntosPorAssunto,
  listarTextosApoio,
} from '@/services/catalogoService';
import { criarQuestaoDaProva, obterProva } from '@/services/provasService';
import {
  prepararTextoApoioQuestao,
  validarTextoApoioQuestao,
} from '@/services/textosApoioService';
import type { CatalogoItem, ProvaDetalhe, TextoApoio } from '@/types/api';
import TextoApoioEditor, { type TextoApoioEditorValue, type TextoApoioTipo } from '@/components/questoes/TextoApoioEditor';
import TextoApoioViewer from '@/components/questoes/TextoApoioViewer';

type Prova = ProvaDetalhe;
type Item = CatalogoItem;

type FormData = {
  textoApoioId: string;
  textoApoioTitulo: string;
  textoApoioTipo: TextoApoioTipo;
  textoApoioConteudo: string;
  textoApoioJson: string;
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
  textoApoioTipo: 'TEXTO',
  textoApoioConteudo: '',
  textoApoioJson: '',
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
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);

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
  const textoApoioTitulo = watch('textoApoioTitulo');
  const textoApoioTipo = watch('textoApoioTipo');
  const textoApoioConteudo = watch('textoApoioConteudo');
  const textoApoioJson = watch('textoApoioJson');
  const gabaritoOptions = useMemo(() => gabaritos(prova?.modalidade), [prova?.modalidade]);
  const textoApoioSelecionado = textosApoio.find((item) => String(item.id) === textoApoioId);

  const setTextoApoioField = <K extends keyof TextoApoioEditorValue>(key: K, value: TextoApoioEditorValue[K]) => {
    switch (key) {
      case 'textoApoioTitulo':
        setValue('textoApoioTitulo', value);
        break;
      case 'textoApoioTipo':
        setValue('textoApoioTipo', value as TextoApoioTipo);
        break;
      case 'textoApoioConteudo':
        setValue('textoApoioConteudo', value);
        break;
      case 'textoApoioJson':
        setValue('textoApoioJson', value);
        break;
    }
  };

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [provaData, disciplinasData, textosData] = await Promise.all([
          obterProva(provaId),
          listarDisciplinas(),
          listarTextosApoio(),
        ]);
        setProva(provaData);
        setDisciplinas(disciplinasData);
        setTextosApoio(textosData);
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
      setAssuntos(await listarAssuntosPorDisciplina(disciplinaId));
    }
    load().catch(() => setAssuntos([]));
  }, [disciplinaId, setValue]);

  useEffect(() => {
    async function load() {
      setSubassuntos([]);
      setValue('subassunto', '');
      if (!assuntoId) return;
      setSubassuntos(await listarSubassuntosPorAssunto(assuntoId));
    }
    load().catch(() => setSubassuntos([]));
  }, [assuntoId, setValue]);

  async function criarDisciplina() {
    const nome = window.prompt('Nome da nova disciplina:')?.trim();
    if (!nome) return;

    try {
      const novo = await criarItemCatalogo('disciplinas', nome);
      setDisciplinas((atual) => [novo, ...atual.filter((item) => item.id !== novo.id)]);
      setValue('disciplinaId', String(novo.id));
      setSucesso(`Disciplina "${novo.nome}" adicionada.`);
    } catch (error: unknown) {
      setErro(getApiErrorMessage(error, 'Não foi possível adicionar a disciplina.'));
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
      const novo = await criarAssuntoCatalogo({
        disciplinaId: Number(disciplinaId),
        nome,
      });
      setAssuntos((atual) => [novo, ...atual.filter((item) => item.id !== novo.id)]);
      setValue('assuntoId', String(novo.id));
      setSucesso(`Assunto "${novo.nome}" adicionado.`);
    } catch (error: unknown) {
      setErro(getApiErrorMessage(error, 'Não foi possível adicionar o assunto.'));
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
      const novo = await criarSubassuntoCatalogo({
        assuntoId: Number(assuntoId),
        nome,
      });
      setSubassuntos((atual) => [novo, ...atual.filter((item) => item.nome !== novo.nome)]);
      setValue('subassunto', novo.nome);
      setSucesso(`Subassunto "${novo.nome}" adicionado.`);
    } catch (error: unknown) {
      setErro(getApiErrorMessage(error, 'Não foi possível adicionar o subassunto.'));
    }
  }

  async function onSubmit(data: FormData) {
    setErro('');
    setSucesso('');

    if (data.textoApoioId && (data.textoApoioConteudo.trim() || data.textoApoioJson.trim())) {
      setErro('Use texto de apoio existente ou cole um novo texto, não os dois ao mesmo tempo.');
      return;
    }

    const erroTextoApoio = validarTextoApoioQuestao({ ...data, imagemArquivo });
    if (erroTextoApoio) {
      setErro(erroTextoApoio);
      return;
    }

    try {
      const textoApoio = await prepararTextoApoioQuestao({ ...data, imagemArquivo });
      await criarQuestaoDaProva(provaId, {
        enunciado: data.enunciado.trim(),
        questao: data.questao.trim(),
        alternativas: montarAlternativas(prova, data),
        ...textoApoio,
        disciplinaId: Number(data.disciplinaId),
        assuntoId: Number(data.assuntoId),
        subassunto: data.subassunto || null,
        gabarito: data.gabarito,
      });
      setSucesso('Questão cadastrada com sucesso nesta prova.');
      setImagemArquivo(null);
      reset({
        ...defaults,
        textoApoioId: data.textoApoioId,
        disciplinaId: data.disciplinaId,
        assuntoId: data.assuntoId,
        subassunto: data.subassunto,
      });
    } catch (error: unknown) {
      setErro(getApiErrorMessage(error, 'Não foi possível cadastrar a questão.'));
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
                            setValue('textoApoioTipo', 'TEXTO');
                            setValue('textoApoioConteudo', '');
                            setValue('textoApoioJson', '');
                            setImagemArquivo(null);
                          }
                        }}
                      >
                        <MenuItem value="">Nenhum</MenuItem>
                        {textosApoio.map((t) => (
                          <MenuItem key={t.id} value={String(t.id)}>{t.titulo || `Texto de apoio #${t.id}`} · {t.tipo || 'TEXTO'}</MenuItem>
                        ))}
                      </TextField>

                      {textoApoioSelecionado && (
                        <TextoApoioViewer
                          titulo={textoApoioSelecionado.titulo}
                          tipo={textoApoioSelecionado.tipo}
                          conteudo={textoApoioSelecionado.conteudo}
                          conteudoJson={textoApoioSelecionado.conteudoJson}
                          compact
                        />
                      )}

                      {!textoApoioId && (
                        <TextoApoioEditor
                          value={{
                            textoApoioTitulo,
                            textoApoioTipo,
                            textoApoioConteudo,
                            textoApoioJson,
                          }}
                          onChange={setTextoApoioField}
                          imagemArquivo={imagemArquivo}
                          onImagemArquivoChange={setImagemArquivo}
                        />
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
