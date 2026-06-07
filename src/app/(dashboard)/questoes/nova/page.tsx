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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { api, getApiErrorMessage } from '@/services/api';
import type { CatalogoItem, TextoApoio } from '@/types/api';
import { arrayOf, numberProp, stringProp } from '@/utils/unknown';

type ModalidadeUI = '' | 'Múltipla Escolha (A até E)' | 'Múltipla Escolha (A até D)' | 'Certo/Errado';

type FormState = {
  disciplinaId: string;
  assuntoId: string;
  subassunto: string;
  bancaId: string;
  instituicaoId: string;
  cargo: string;
  ano: string;
  nivel: string;
  modalidade: ModalidadeUI;
  textoApoioId: string;
  textoApoioTitulo: string;
  textoApoioConteudo: string;
  enunciado: string;
  questao: string;
  gabarito: string;
  altA: string;
  altB: string;
  altC: string;
  altD: string;
  altE: string;
};

const GABARITO_ANULADA = 'X';

const initialForm: FormState = {
  disciplinaId: '',
  assuntoId: '',
  subassunto: '',
  bancaId: '',
  instituicaoId: '',
  cargo: '',
  ano: '',
  nivel: '',
  modalidade: '',
  textoApoioId: '',
  textoApoioTitulo: '',
  textoApoioConteudo: '',
  enunciado: '',
  questao: '',
  gabarito: '',
  altA: '',
  altB: '',
  altC: '',
  altD: '',
  altE: '',
};

function normalizarCatalogo(data: unknown): CatalogoItem[] {
  return arrayOf(data)
    .map((item) => ({
      id: numberProp(item, ['id', 'idDisciplina', 'idAssunto', 'idSubassunto', 'idBanca', 'idInstituicao']),
      nome: stringProp(item, ['nome', 'titulo', 'descricao', 'name']),
    }))
    .filter((item: CatalogoItem) => item.id != null && item.nome);
}

function normalizarTextosApoio(data: unknown): TextoApoio[] {
  return arrayOf(data)
    .map((item) => ({
      id: numberProp(item, ['id']),
      titulo: stringProp(item, ['titulo']) || null,
      conteudo: stringProp(item, ['conteudo']),
    }))
    .filter((item: TextoApoio) => item.id != null && item.conteudo);
}

function escapeLine(value: string) {
  return value.replace(/\r?\n/g, ' ').trim();
}

function mapModalidadeToApi(modalidade: ModalidadeUI) {
  if (modalidade === 'Múltipla Escolha (A até E)') return 'A_E';
  if (modalidade === 'Múltipla Escolha (A até D)') return 'A_D';
  return 'CERTO_ERRADO';
}

function gabaritoPermitido(modalidade: ModalidadeUI) {
  if (modalidade === 'Múltipla Escolha (A até E)') return ['A', 'B', 'C', 'D', 'E', GABARITO_ANULADA];
  if (modalidade === 'Múltipla Escolha (A até D)') return ['A', 'B', 'C', 'D', GABARITO_ANULADA];
  return ['C', 'E', GABARITO_ANULADA];
}

function labelGabarito(gabarito: string) {
  return gabarito === GABARITO_ANULADA ? 'Questão anulada' : gabarito;
}

function montarAlternativas(modalidade: ModalidadeUI, form: FormState) {
  if (modalidade === 'Múltipla Escolha (A até E)') {
    return [`A) ${escapeLine(form.altA)}`, `B) ${escapeLine(form.altB)}`, `C) ${escapeLine(form.altC)}`, `D) ${escapeLine(form.altD)}`, `E) ${escapeLine(form.altE)}`].join('\n');
  }
  if (modalidade === 'Múltipla Escolha (A até D)') {
    return [`A) ${escapeLine(form.altA)}`, `B) ${escapeLine(form.altB)}`, `C) ${escapeLine(form.altC)}`, `D) ${escapeLine(form.altD)}`].join('\n');
  }
  return 'C) Certo\nE) Errado';
}

export default function NovaQuestaoPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [disciplinas, setDisciplinas] = useState<CatalogoItem[]>([]);
  const [assuntos, setAssuntos] = useState<CatalogoItem[]>([]);
  const [bancas, setBancas] = useState<CatalogoItem[]>([]);
  const [instituicoes, setInstituicoes] = useState<CatalogoItem[]>([]);
  const [textosApoio, setTextosApoio] = useState<TextoApoio[]>([]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    async function carregarBase() {
      try {
        setLoading(true);
        const [disciplinasRes, bancasRes, instituicoesRes, textosRes] = await Promise.all([
          api.get('/api/v1/catalogo/disciplinas'),
          api.get('/api/v1/catalogo/bancas'),
          api.get('/api/v1/catalogo/instituicoes'),
          api.get('/api/v1/textos-apoio', { params: { page: 0, size: 50 } }),
        ]);
        setDisciplinas(normalizarCatalogo(disciplinasRes.data));
        setBancas(normalizarCatalogo(bancasRes.data));
        setInstituicoes(normalizarCatalogo(instituicoesRes.data));
        setTextosApoio(normalizarTextosApoio(textosRes.data));
      } catch (error: unknown) {
        setMsg({ type: 'error', text: getApiErrorMessage(error, 'Não foi possível carregar os dados iniciais.') });
      } finally {
        setLoading(false);
      }
    }

    carregarBase();
  }, []);

  useEffect(() => {
    async function carregarAssuntos() {
      if (!form.disciplinaId) {
        setAssuntos([]);
        setField('assuntoId', '');
        return;
      }

      try {
        const res = await api.get(`/api/v1/catalogo/disciplinas/${encodeURIComponent(form.disciplinaId)}/assuntos`);
        setAssuntos(normalizarCatalogo(res.data));
      } catch {
        setAssuntos([]);
      }
    }

    carregarAssuntos();
  }, [form.disciplinaId]);

  const validarStep1 = () => {
    if (!form.disciplinaId || !form.assuntoId || !form.bancaId || !form.instituicaoId) {
      setMsg({ type: 'error', text: 'Selecione disciplina, assunto, banca e instituição.' });
      return false;
    }
    if (!form.cargo.trim() || !form.ano.trim() || !form.nivel.trim() || !form.modalidade) {
      setMsg({ type: 'error', text: 'Preencha cargo, ano, nível e modalidade.' });
      return false;
    }
    const ano = Number(form.ano);
    if (!Number.isFinite(ano) || ano < 1900 || ano > 2100) {
      setMsg({ type: 'error', text: 'Ano inválido. Use um valor entre 1900 e 2100.' });
      return false;
    }
    return true;
  };

  const validarStep2 = () => {
    if (!form.enunciado.trim() || !form.questao.trim()) {
      setMsg({ type: 'error', text: 'Preencha enunciado e questão.' });
      return false;
    }
    if (form.textoApoioId && form.textoApoioConteudo.trim()) {
      setMsg({ type: 'error', text: 'Use texto de apoio existente ou cole um novo texto, não os dois ao mesmo tempo.' });
      return false;
    }
    const gabarito = form.gabarito.trim().toUpperCase();
    const permitidos = gabaritoPermitido(form.modalidade);
    if (!permitidos.includes(gabarito)) {
      setMsg({ type: 'error', text: `Gabarito inválido. Permitidos: ${permitidos.join(', ')}` });
      return false;
    }
    if (form.modalidade === 'Múltipla Escolha (A até E)' && (!form.altA.trim() || !form.altB.trim() || !form.altC.trim() || !form.altD.trim() || !form.altE.trim())) {
      setMsg({ type: 'error', text: 'Preencha todas as alternativas de A até E.' });
      return false;
    }
    if (form.modalidade === 'Múltipla Escolha (A até D)' && (!form.altA.trim() || !form.altB.trim() || !form.altC.trim() || !form.altD.trim())) {
      setMsg({ type: 'error', text: 'Preencha todas as alternativas de A até D.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMsg(null);
    if (!validarStep2()) return;

    const payload = {
      enunciado: form.enunciado.trim(),
      questao: form.questao.trim(),
      alternativas: montarAlternativas(form.modalidade, form),
      textoApoioId: form.textoApoioId ? Number(form.textoApoioId) : null,
      textoApoioTitulo: form.textoApoioId ? null : form.textoApoioTitulo.trim() || null,
      textoApoioConteudo: form.textoApoioId ? null : form.textoApoioConteudo.trim() || null,
      disciplinaId: Number(form.disciplinaId),
      assuntoId: Number(form.assuntoId),
      subassunto: form.subassunto.trim() || null,
      bancaId: Number(form.bancaId),
      instituicaoId: Number(form.instituicaoId),
      cargo: form.cargo.trim(),
      ano: Number(form.ano),
      nivel: form.nivel.trim(),
      modalidade: mapModalidadeToApi(form.modalidade),
      gabarito: form.gabarito.trim().toUpperCase(),
    };

    try {
      setSaving(true);
      await api.post('/api/v1/questoes', payload);
      setMsg({ type: 'success', text: 'Questão cadastrada com sucesso!' });
      setTimeout(() => router.push('/questoes'), 700);
    } catch (error: unknown) {
      setMsg({ type: 'error', text: getApiErrorMessage(error, 'Falha ao salvar a questão.') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #dbe3ef', p: { xs: 2, md: 3 }, bgcolor: '#fff' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#1e293b">Cadastro de Questão</Typography>
            <Stack direction="row" spacing={1} mt={2}>
              <Button variant={step === 1 ? 'contained' : 'outlined'} onClick={() => setStep(1)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>1) Metadados</Button>
              <Button variant={step === 2 ? 'contained' : 'outlined'} onClick={() => { if (validarStep1()) setStep(2); }} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>2) Conteúdo</Button>
            </Stack>
          </Box>

          {msg && <Alert severity={msg.type} sx={{ borderRadius: 2 }}>{msg.text}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            {step === 1 && (
              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextField select label="Disciplina" fullWidth value={form.disciplinaId} onChange={(e) => { setField('disciplinaId', e.target.value); setField('assuntoId', ''); }}>
                    {disciplinas.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nome}</MenuItem>)}
                  </TextField>

                  <TextField select label="Assunto" fullWidth value={form.assuntoId} disabled={!form.disciplinaId} onChange={(e) => setField('assuntoId', e.target.value)}>
                    {assuntos.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nome}</MenuItem>)}
                  </TextField>

                  <TextField label="Subassunto" fullWidth value={form.subassunto} onChange={(e) => setField('subassunto', e.target.value)} helperText="Opcional. Use o texto do subassunto conforme edital." />

                  <TextField select label="Banca" fullWidth value={form.bancaId} onChange={(e) => setField('bancaId', e.target.value)}>
                    {bancas.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nome}</MenuItem>)}
                  </TextField>

                  <TextField select label="Instituição" fullWidth value={form.instituicaoId} onChange={(e) => setField('instituicaoId', e.target.value)}>
                    {instituicoes.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nome}</MenuItem>)}
                  </TextField>

                  <TextField label="Cargo" fullWidth value={form.cargo} onChange={(e) => setField('cargo', e.target.value)} />
                  <TextField label="Ano" type="number" fullWidth value={form.ano} onChange={(e) => setField('ano', e.target.value)} />
                  <TextField label="Nível" fullWidth value={form.nivel} onChange={(e) => setField('nivel', e.target.value)} />

                  <TextField select label="Modalidade" fullWidth value={form.modalidade} onChange={(e) => setField('modalidade', e.target.value as ModalidadeUI)}>
                    <MenuItem value="Múltipla Escolha (A até E)">Múltipla Escolha (A até E)</MenuItem>
                    <MenuItem value="Múltipla Escolha (A até D)">Múltipla Escolha (A até D)</MenuItem>
                    <MenuItem value="Certo/Errado">Certo/Errado</MenuItem>
                  </TextField>
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <Button variant="contained" onClick={() => { if (validarStep1()) setStep(2); }} sx={{ borderRadius: 2, px: 2.5, py: 1.2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>Continuar</Button>
                  <Button variant="contained" color="inherit" onClick={() => router.push('/questoes')} sx={{ borderRadius: 2, px: 2.5, py: 1.2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>Cancelar</Button>
                </Stack>
              </Stack>
            )}

            {step === 2 && (
              <Stack spacing={2.5}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 3, bgcolor: '#f8fafc' }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography fontWeight={800}>Texto de apoio</Typography>
                      <Typography variant="body2" color="text.secondary">Use quando várias questões compartilham o mesmo texto base. Selecione um existente ou cole um novo.</Typography>
                    </Box>

                    <TextField select label="Usar texto de apoio existente" fullWidth value={form.textoApoioId} onChange={(e) => { setField('textoApoioId', e.target.value); if (e.target.value) { setField('textoApoioTitulo', ''); setField('textoApoioConteudo', ''); } }}>
                      <MenuItem value="">Nenhum</MenuItem>
                      {textosApoio.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.titulo || `Texto de apoio #${item.id}`}</MenuItem>)}
                    </TextField>

                    {!form.textoApoioId && (
                      <>
                        <TextField label="Título do novo texto de apoio" fullWidth value={form.textoApoioTitulo} onChange={(e) => setField('textoApoioTitulo', e.target.value)} />
                        <TextField label="Novo texto de apoio" multiline minRows={6} fullWidth value={form.textoApoioConteudo} onChange={(e) => setField('textoApoioConteudo', e.target.value)} />
                      </>
                    )}
                  </Stack>
                </Paper>

                <TextField label="Enunciado" multiline minRows={3} fullWidth value={form.enunciado} onChange={(e) => setField('enunciado', e.target.value)} />
                <TextField label="Questão" multiline minRows={4} fullWidth value={form.questao} onChange={(e) => setField('questao', e.target.value)} />

                {form.modalidade !== 'Certo/Errado' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField label="A)" value={form.altA} onChange={(e) => setField('altA', e.target.value)} />
                    <TextField label="B)" value={form.altB} onChange={(e) => setField('altB', e.target.value)} />
                    <TextField label="C)" value={form.altC} onChange={(e) => setField('altC', e.target.value)} />
                    <TextField label="D)" value={form.altD} onChange={(e) => setField('altD', e.target.value)} />
                    {form.modalidade === 'Múltipla Escolha (A até E)' && <TextField label="E)" value={form.altE} onChange={(e) => setField('altE', e.target.value)} />}
                  </Box>
                )}

                {form.modalidade === 'Certo/Errado' && <Alert severity="info" sx={{ borderRadius: 2 }}>As alternativas serão preenchidas automaticamente como C) Certo e E) Errado.</Alert>}

                <TextField select label="Gabarito" fullWidth value={form.gabarito} onChange={(e) => setField('gabarito', e.target.value.toUpperCase())}>
                  <MenuItem value="">Selecione</MenuItem>
                  {gabaritoPermitido(form.modalidade).map((gabarito) => (
                    <MenuItem key={gabarito} value={gabarito}>{labelGabarito(gabarito)}</MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" spacing={1.5}>
                  <Button variant="outlined" onClick={() => setStep(1)} sx={{ borderRadius: 2, px: 2.5, py: 1.2, textTransform: 'none', fontWeight: 700 }}>Voltar</Button>
                  <Button type="submit" variant="contained" disabled={saving} sx={{ borderRadius: 2, px: 2.5, py: 1.2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>{saving ? 'Salvando...' : 'Salvar questão'}</Button>
                  <Button variant="contained" color="inherit" onClick={() => router.push('/questoes')} sx={{ borderRadius: 2, px: 2.5, py: 1.2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>Cancelar</Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
