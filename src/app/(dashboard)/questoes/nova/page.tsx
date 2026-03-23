'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { api } from '@/services/api';

type CatalogoItem = {
  id: number;
  nome: string;
};

type ModalidadeUI =
  | ''
  | 'Múltipla Escolha (A até E)'
  | 'Múltipla Escolha (A até D)'
  | 'Certo/Errado';

type MetaState = {
  disciplinaId: number | null;
  disciplina: string;
  assuntoId: number | null;
  assunto: string;
  subassuntoId: number | null;
  subassunto: string;
  bancaId: number | null;
  banca: string;
  instituicaoId: number | null;
  instituicao: string;
  cargo: string;
  ano: string;
  nivel: string;
  modalidade: ModalidadeUI;
};

type FormConteudo = {
  enunciado: string;
  questao: string;
  gabarito: string;
  altA: string;
  altB: string;
  altC: string;
  altD: string;
  altE: string;
};

const ENDPOINTS = {
  disciplina: '/api/v1/catalogo/disciplinas',
  assunto: (disciplinaId: number | string) =>
    `/api/v1/catalogo/disciplinas/${encodeURIComponent(String(disciplinaId))}/assuntos`,
  subassunto: (assuntoId: number | string) =>
    `/api/v1/catalogo/assuntos/${encodeURIComponent(String(assuntoId))}/subassuntos`,
  banca: '/api/v1/catalogo/bancas',
  instituicao: '/api/v1/catalogo/instituicoes',
};

const NOVO_VALOR = '__new__';
const CONFIRMED_PREFIX = '__confirmed__:';

function normalizarLista(data: any): CatalogoItem[] {
  const arr = Array.isArray(data) ? data : data?.data ?? [];
  return arr
    .map((x: any) => ({
      id:
        x.id ??
        x.idDisciplina ??
        x.idAssunto ??
        x.idSubassunto ??
        x.idBanca ??
        x.idInstituicao,
      nome: x.nome ?? x.titulo ?? x.descricao ?? x.name,
    }))
    .filter((x: CatalogoItem) => x.id != null && x.nome);
}

function escapeLine(s: string) {
  return (s || '').replace(/\r?\n/g, ' ').trim();
}

function mapModalidadeToApi(modalidade: ModalidadeUI) {
  if (modalidade === 'Múltipla Escolha (A até E)') return 'A_E';
  if (modalidade === 'Múltipla Escolha (A até D)') return 'A_D';
  return 'CERTO_ERRADO';
}

function gabaritoPermitido(modalidade: ModalidadeUI) {
  if (modalidade === 'Múltipla Escolha (A até E)') return ['A', 'B', 'C', 'D', 'E'];
  if (modalidade === 'Múltipla Escolha (A até D)') return ['A', 'B', 'C', 'D'];
  return ['C', 'E'];
}

function montarAlternativasTexto(modalidade: ModalidadeUI, form: FormConteudo) {
  if (modalidade === 'Múltipla Escolha (A até E)') {
    return [
      `A) ${escapeLine(form.altA)}`,
      `B) ${escapeLine(form.altB)}`,
      `C) ${escapeLine(form.altC)}`,
      `D) ${escapeLine(form.altD)}`,
      `E) ${escapeLine(form.altE)}`,
    ].join('\n');
  }

  if (modalidade === 'Múltipla Escolha (A até D)') {
    return [
      `A) ${escapeLine(form.altA)}`,
      `B) ${escapeLine(form.altB)}`,
      `C) ${escapeLine(form.altC)}`,
      `D) ${escapeLine(form.altD)}`,
    ].join('\n');
  }

  return `C) Certo\nE) Errado`;
}

export default function NovaQuestaoPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [meta, setMeta] = useState<MetaState>({
    disciplinaId: null,
    disciplina: '',
    assuntoId: null,
    assunto: '',
    subassuntoId: null,
    subassunto: '',
    bancaId: null,
    banca: '',
    instituicaoId: null,
    instituicao: '',
    cargo: '',
    ano: '',
    nivel: '',
    modalidade: '',
  });

  const [conteudo, setConteudo] = useState<FormConteudo>({
    enunciado: '',
    questao: '',
    gabarito: '',
    altA: '',
    altB: '',
    altC: '',
    altD: '',
    altE: '',
  });

  const [disciplinas, setDisciplinas] = useState<CatalogoItem[]>([]);
  const [assuntos, setAssuntos] = useState<CatalogoItem[]>([]);
  const [subassuntos, setSubassuntos] = useState<CatalogoItem[]>([]);
  const [bancas, setBancas] = useState<CatalogoItem[]>([]);
  const [instituicoes, setInstituicoes] = useState<CatalogoItem[]>([]);

  const [disciplinaSel, setDisciplinaSel] = useState<string>('');
  const [assuntoSel, setAssuntoSel] = useState<string>('');
  const [subassuntoSel, setSubassuntoSel] = useState<string>('');
  const [bancaSel, setBancaSel] = useState<string>('');
  const [instituicaoSel, setInstituicaoSel] = useState<string>('');

  const [disciplinaNew, setDisciplinaNew] = useState('');
  const [assuntoNew, setAssuntoNew] = useState('');
  const [subassuntoNew, setSubassuntoNew] = useState('');
  const [bancaNew, setBancaNew] = useState('');
  const [instituicaoNew, setInstituicaoNew] = useState('');

  const [savingInline, setSavingInline] = useState<
    null | 'disciplina' | 'assunto' | 'subassunto' | 'banca' | 'instituicao'
  >(null);

  const assuntoIsConfirmed = useMemo(
    () => assuntoSel.startsWith(CONFIRMED_PREFIX),
    [assuntoSel]
  );

  const showError = (text: string) => setMsg({ type: 'error', text });
  const showSuccess = (text: string) => setMsg({ type: 'success', text });
  const clearMsg = () => setMsg(null);

  async function carregarCatalogo(
    tipo: 'disciplina' | 'assunto' | 'subassunto' | 'banca' | 'instituicao',
    parentId?: number | string
  ) {
    let url = '';

    if (tipo === 'assunto') {
      if (!parentId) {
        setAssuntos([]);
        return;
      }
      url = ENDPOINTS.assunto(parentId);
    } else if (tipo === 'subassunto') {
      if (!parentId) {
        setSubassuntos([]);
        return;
      }
      url = ENDPOINTS.subassunto(parentId);
    } else {
      url = ENDPOINTS[tipo];
    }

    const res = await api.get(url);
    const lista = normalizarLista(res.data);

    if (tipo === 'disciplina') setDisciplinas(lista);
    if (tipo === 'assunto') setAssuntos(lista);
    if (tipo === 'subassunto') setSubassuntos(lista);
    if (tipo === 'banca') setBancas(lista);
    if (tipo === 'instituicao') setInstituicoes(lista);
  }

  async function criarItemCatalogo(
    tipo: 'disciplina' | 'assunto' | 'subassunto' | 'banca' | 'instituicao',
    nome: string
  ) {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) throw new Error('Digite um nome válido.');

    let path = '';
    let payload: any = {};

    if (tipo === 'disciplina') {
      path = '/api/v1/admin/catalogo/disciplinas';
      payload = { nome: nomeLimpo };
    } else if (tipo === 'banca') {
      path = '/api/v1/admin/catalogo/bancas';
      payload = { nome: nomeLimpo };
    } else if (tipo === 'instituicao') {
      path = '/api/v1/admin/catalogo/instituicoes';
      payload = { nome: nomeLimpo };
    } else if (tipo === 'assunto') {
      if (!meta.disciplinaId) throw new Error('Escolha uma disciplina antes.');
      path = '/api/v1/admin/catalogo/assuntos';
      payload = { disciplinaId: meta.disciplinaId, nome: nomeLimpo };
    } else {
      if (!meta.assuntoId) throw new Error('Escolha um assunto antes.');
      path = '/api/v1/admin/catalogo/subassuntos';
      payload = { assuntoId: meta.assuntoId, nome: nomeLimpo };
    }

    const res = await api.post(path, payload);
    const created = res.data?.data ?? res.data;

    const id =
      created?.id ??
      created?.idDisciplina ??
      created?.idAssunto ??
      created?.idSubassunto ??
      created?.idBanca ??
      created?.idInstituicao;

    const nomeResp = created?.nome ?? nomeLimpo;

    if (id == null) throw new Error('O backend não retornou o id do item criado.');

    return { id, nome: nomeResp } as CatalogoItem;
  }

  useEffect(() => {
    (async () => {
      try {
        setLoadingBoot(true);
        clearMsg();

        await Promise.all([
          carregarCatalogo('disciplina'),
          carregarCatalogo('banca'),
          carregarCatalogo('instituicao'),
        ]);
      } catch (error: any) {
        showError(
          error?.response?.data?.message || 'Não foi possível carregar os catálogos.'
        );
      } finally {
        setLoadingBoot(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!meta.disciplinaId) return;

    (async () => {
      try {
        await carregarCatalogo('assunto', meta.disciplinaId ?? undefined);
      } catch {
        setAssuntos([]);
      }
    })();
  }, [meta.disciplinaId]);

  useEffect(() => {
    if (!assuntos.length) {
      setAssuntoSel('');
      return;
    }

    if (assuntoSel && !assuntoSel.startsWith(CONFIRMED_PREFIX)) return;

    const first = assuntos[0];
    setAssuntoSel(String(first.id));
    setMeta((prev) => ({
      ...prev,
      assuntoId: first.id,
      assunto: first.nome,
      subassuntoId: null,
      subassunto: '',
    }));
  }, [assuntos]);

  useEffect(() => {
    if (!meta.assuntoId) {
      setSubassuntos([]);
      setSubassuntoSel('');
      return;
    }

    (async () => {
      try {
        await carregarCatalogo('subassunto', meta.assuntoId ?? undefined);
      } catch {
        setSubassuntos([]);
      }
    })();
  }, [meta.assuntoId]);

  const handleInlineCreate = async (
    tipo: 'disciplina' | 'assunto' | 'subassunto' | 'banca' | 'instituicao'
  ) => {
    try {
      clearMsg();
      setSavingInline(tipo);

      if (tipo === 'disciplina') {
        const created = await criarItemCatalogo('disciplina', disciplinaNew);
        setDisciplinas((prev) => [...prev, created]);
        setDisciplinaSel(String(created.id));
        setDisciplinaNew('');
        setMeta((prev) => ({
          ...prev,
          disciplinaId: created.id,
          disciplina: created.nome,
          assuntoId: null,
          assunto: '',
          subassuntoId: null,
          subassunto: '',
        }));
        showSuccess(`Disciplina "${created.nome}" criada com sucesso!`);
        return;
      }

      if (tipo === 'assunto') {
        const nome = assuntoNew.trim();
        if (!nome) throw new Error('Digite o assunto para confirmar.');

        const confirmedValue = `${CONFIRMED_PREFIX}${nome}`;
        setAssuntoSel(confirmedValue);
        setAssuntoNew('');
        setMeta((prev) => ({
          ...prev,
          assuntoId: null,
          assunto: nome,
          subassuntoId: null,
          subassunto: '',
        }));
        showSuccess(`Assunto "${nome}" confirmado para esta questão.`);
        return;
      }

      if (tipo === 'subassunto') {
        const nomeSub = subassuntoNew.trim();
        if (!nomeSub) throw new Error('Digite o subassunto para confirmar.');

        let assuntoIdReal = meta.assuntoId;
        let assuntoNomeReal = meta.assunto;

        if (assuntoIsConfirmed) {
          const nomeAssunto = assuntoSel.replace(CONFIRMED_PREFIX, '').trim();
          const createdAssunto = await criarItemCatalogo('assunto', nomeAssunto);

          assuntoIdReal = createdAssunto.id;
          assuntoNomeReal = createdAssunto.nome;

          setAssuntos((prev) => [...prev, createdAssunto]);
          setAssuntoSel(String(createdAssunto.id));
        }

        if (!assuntoIdReal) throw new Error('Escolha ou confirme um assunto antes.');

        setMeta((prev) => ({
          ...prev,
          assuntoId: assuntoIdReal,
          assunto: assuntoNomeReal,
        }));

        const res = await api.post('/api/v1/admin/catalogo/subassuntos', {
          assuntoId: assuntoIdReal,
          nome: nomeSub,
        });

        const createdRaw = res.data?.data ?? res.data;
        const created: CatalogoItem = {
          id: createdRaw?.idSubassunto ?? createdRaw?.id,
          nome: createdRaw?.nome ?? nomeSub,
        };

        if (!created.id) throw new Error('Backend não retornou id do subassunto.');

        setSubassuntos((prev) => [...prev, created]);
        setSubassuntoSel(String(created.id));
        setSubassuntoNew('');
        setMeta((prev) => ({
          ...prev,
          subassuntoId: created.id,
          subassunto: created.nome,
        }));
        showSuccess(`Subassunto "${created.nome}" criado com sucesso!`);
        return;
      }

      if (tipo === 'banca') {
        const created = await criarItemCatalogo('banca', bancaNew);
        setBancas((prev) => [...prev, created]);
        setBancaSel(String(created.id));
        setBancaNew('');
        setMeta((prev) => ({
          ...prev,
          bancaId: created.id,
          banca: created.nome,
        }));
        showSuccess(`Banca "${created.nome}" criada com sucesso!`);
        return;
      }

      if (tipo === 'instituicao') {
        const created = await criarItemCatalogo('instituicao', instituicaoNew);
        setInstituicoes((prev) => [...prev, created]);
        setInstituicaoSel(String(created.id));
        setInstituicaoNew('');
        setMeta((prev) => ({
          ...prev,
          instituicaoId: created.id,
          instituicao: created.nome,
        }));
        showSuccess(`Instituição "${created.nome}" criada com sucesso!`);
      }
    } catch (error: any) {
      showError(
        error?.response?.data?.message || error?.message || 'Erro ao criar item.'
      );
    } finally {
      setSavingInline(null);
    }
  };

  const podeIrParaStep2 = () => {
    if (!meta.disciplinaId) return false;
    if (!assuntoSel || assuntoSel === NOVO_VALOR) return false;
    if (subassuntoSel === NOVO_VALOR) return false;
    if (!meta.bancaId) return false;
    if (!meta.instituicaoId) return false;
    if (!meta.cargo.trim() || !meta.nivel.trim() || !meta.ano.trim()) return false;

    const ano = Number(meta.ano);
    if (!Number.isFinite(ano) || ano < 1900 || ano > 2100) return false;

    return true;
  };

  const validarStep1 = () => {
    clearMsg();

    if (!meta.disciplinaId) {
      showError('Selecione uma disciplina.');
      return false;
    }

    if (!assuntoSel || assuntoSel === NOVO_VALOR) {
      showError('Selecione ou confirme um assunto.');
      return false;
    }

    if (subassuntoSel === NOVO_VALOR) {
      showError('Confirme o novo subassunto no botão +.');
      return false;
    }

    if (!meta.bancaId) {
      showError('Selecione uma banca.');
      return false;
    }

    if (!meta.instituicaoId) {
      showError('Selecione uma instituição.');
      return false;
    }

    if (!meta.cargo.trim() || !meta.nivel.trim() || !meta.ano.trim()) {
      showError('Preencha Cargo, Ano e Nível.');
      return false;
    }

    const ano = Number(meta.ano);
    if (!Number.isFinite(ano) || ano < 1900 || ano > 2100) {
      showError('Ano inválido (1900–2100).');
      return false;
    }

    return true;
  };

  const validarStep2 = () => {
    clearMsg();

    if (!conteudo.enunciado.trim() || !conteudo.questao.trim()) {
      showError('Preencha Enunciado e Questão.');
      return false;
    }

    const g = conteudo.gabarito.trim().toUpperCase();
    const permitidos = gabaritoPermitido(meta.modalidade);
    if (!permitidos.includes(g)) {
      showError(`Gabarito inválido. Permitidos: ${permitidos.join(', ')}`);
      return false;
    }

    if (meta.modalidade === 'Múltipla Escolha (A até E)') {
      if (
        !conteudo.altA.trim() ||
        !conteudo.altB.trim() ||
        !conteudo.altC.trim() ||
        !conteudo.altD.trim() ||
        !conteudo.altE.trim()
      ) {
        showError('Preencha todas as alternativas de A até E.');
        return false;
      }
    }

    if (meta.modalidade === 'Múltipla Escolha (A até D)') {
      if (
        !conteudo.altA.trim() ||
        !conteudo.altB.trim() ||
        !conteudo.altC.trim() ||
        !conteudo.altD.trim()
      ) {
        showError('Preencha todas as alternativas de A até D.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validarStep2()) return;

    const payload = {
      enunciado: conteudo.enunciado.trim(),
      questao: conteudo.questao.trim(),
      alternativas: montarAlternativasTexto(meta.modalidade, conteudo),

      disciplinaId: meta.disciplinaId,
      disciplina: meta.disciplina,

      assuntoId: meta.assuntoId,
      assunto: meta.assunto,

      subassuntoId: meta.subassuntoId,
      subassunto: meta.subassunto,

      bancaId: meta.bancaId,
      banca: meta.banca,

      instituicaoId: meta.instituicaoId,
      instituicao: meta.instituicao,

      cargo: meta.cargo.trim(),
      ano: Number(meta.ano),
      nivel: meta.nivel.trim(),
      modalidade: mapModalidadeToApi(meta.modalidade),
      gabarito: conteudo.gabarito.trim().toUpperCase(),
    };

    try {
      clearMsg();
      setSaving(true);

      await api.post('/api/v1/questoes', payload);

      showSuccess('Questão cadastrada com sucesso!');
      setTimeout(() => router.push('/questoes'), 700);
    } catch (error: any) {
      showError(
        error?.response?.data?.message || 'Falha ao salvar a questão.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingBoot) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #dbe3ef',
          p: { xs: 2, md: 3 },
          bgcolor: '#fff',
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#1e293b">
              Cadastro de Questão
            </Typography>

            <Stack direction="row" spacing={1} mt={2}>
              <Box
                onClick={() => setStep(1)}
                sx={{
                  px: 1.2,
                  py: 0.7,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: step === 1 ? '#93c5fd' : '#cbd5e1',
                  backgroundColor: step === 1 ? '#eff6ff' : '#f8fafc',
                  color: step === 1 ? '#1d4ed8' : '#64748b',
                }}
              >
                1) Metadados
              </Box>

              <Box
                onClick={() => {
                  if (podeIrParaStep2()) setStep(2);
                }}
                sx={{
                  px: 1.2,
                  py: 0.7,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: podeIrParaStep2() ? 'pointer' : 'not-allowed',
                  border: '1px solid',
                  borderColor: step === 2 ? '#93c5fd' : '#cbd5e1',
                  backgroundColor: step === 2 ? '#eff6ff' : '#f8fafc',
                  color: step === 2 ? '#1d4ed8' : '#64748b',
                }}
              >
                2) Conteúdo
              </Box>
            </Stack>
          </Box>

          {msg && (
            <Alert severity={msg.type} sx={{ borderRadius: 2 }}>
              {msg.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {step === 1 && (
              <Stack spacing={2.5}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Disciplina
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={disciplinaSel}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDisciplinaSel(value);
                        setAssuntoSel('');
                        setSubassuntoSel('');
                        setAssuntos([]);
                        setSubassuntos([]);

                        if (value === NOVO_VALOR) {
                          setMeta((prev) => ({
                            ...prev,
                            disciplinaId: null,
                            disciplina: '',
                            assuntoId: null,
                            assunto: '',
                            subassuntoId: null,
                            subassunto: '',
                          }));
                          return;
                        }

                        const selected = disciplinas.find((i) => String(i.id) === value);
                        setMeta((prev) => ({
                          ...prev,
                          disciplinaId: selected?.id ?? null,
                          disciplina: selected?.nome ?? '',
                          assuntoId: null,
                          assunto: '',
                          subassuntoId: null,
                          subassunto: '',
                        }));
                      }}
                    >
                      {disciplinas.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {item.nome}
                        </MenuItem>
                      ))}
                      <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
                    </TextField>

                    {disciplinaSel === NOVO_VALOR && (
                      <Stack direction="row" spacing={1.5} mt={1.5}>
                        <TextField
                          fullWidth
                          placeholder="Nova disciplina"
                          value={disciplinaNew}
                          onChange={(e) => setDisciplinaNew(e.target.value)}
                        />
                        <Button
                          variant="contained"
                          onClick={() => handleInlineCreate('disciplina')}
                          disabled={savingInline === 'disciplina'}
                          sx={{ minWidth: 90, textTransform: 'none', fontWeight: 700 }}
                        >
                          +
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Assunto
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={assuntoSel}
                      disabled={!meta.disciplinaId && disciplinaSel !== NOVO_VALOR}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAssuntoSel(value);
                        setSubassuntoSel('');
                        setSubassuntos([]);

                        if (value === NOVO_VALOR) {
                          setMeta((prev) => ({
                            ...prev,
                            assuntoId: null,
                            assunto: '',
                            subassuntoId: null,
                            subassunto: '',
                          }));
                          return;
                        }

                        if (value.startsWith(CONFIRMED_PREFIX)) {
                          const nome = value.replace(CONFIRMED_PREFIX, '');
                          setMeta((prev) => ({
                            ...prev,
                            assuntoId: null,
                            assunto: nome,
                            subassuntoId: null,
                            subassunto: '',
                          }));
                          return;
                        }

                        const selected = assuntos.find((i) => String(i.id) === value);
                        setMeta((prev) => ({
                          ...prev,
                          assuntoId: selected?.id ?? null,
                          assunto: selected?.nome ?? '',
                          subassuntoId: null,
                          subassunto: '',
                        }));
                      }}
                    >
                      {assuntoIsConfirmed && (
                        <MenuItem value={assuntoSel}>
                          {assuntoSel.replace(CONFIRMED_PREFIX, '')}
                        </MenuItem>
                      )}

                      {assuntos.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {item.nome}
                        </MenuItem>
                      ))}
                      <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
                    </TextField>

                    {assuntoSel === NOVO_VALOR && (
                      <Stack direction="row" spacing={1.5} mt={1.5}>
                        <TextField
                          fullWidth
                          placeholder="Novo assunto"
                          value={assuntoNew}
                          onChange={(e) => setAssuntoNew(e.target.value)}
                        />
                        <Button
                          variant="contained"
                          onClick={() => handleInlineCreate('assunto')}
                          disabled={savingInline === 'assunto'}
                          sx={{ minWidth: 90, textTransform: 'none', fontWeight: 700 }}
                        >
                          +
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Subassunto
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={subassuntoSel}
                      disabled={!assuntoSel || assuntoSel === NOVO_VALOR}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSubassuntoSel(value);

                        if (!value || value === NOVO_VALOR) {
                          setMeta((prev) => ({
                            ...prev,
                            subassuntoId: null,
                            subassunto: '',
                          }));
                          return;
                        }

                        const selected = subassuntos.find((i) => String(i.id) === value);
                        setMeta((prev) => ({
                          ...prev,
                          subassuntoId: selected?.id ?? null,
                          subassunto: selected?.nome ?? '',
                        }));
                      }}
                    >
                    
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
                          placeholder="Novo subassunto"
                          value={subassuntoNew}
                          onChange={(e) => setSubassuntoNew(e.target.value)}
                        />
                        <Button
                          variant="contained"
                          onClick={() => handleInlineCreate('subassunto')}
                          disabled={savingInline === 'subassunto'}
                          sx={{ minWidth: 90, textTransform: 'none', fontWeight: 700 }}
                        >
                          +
                        </Button>
                      </Stack>
                    )}

                    <Typography variant="body2" color="text.secondary" mt={0.75}>
                      Opcional — preencha apenas se o assunto possuir subassuntos.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Banca
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={bancaSel}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBancaSel(value);

                        if (value === NOVO_VALOR) {
                          setMeta((prev) => ({ ...prev, bancaId: null, banca: '' }));
                          return;
                        }

                        const selected = bancas.find((i) => String(i.id) === value);
                        setMeta((prev) => ({
                          ...prev,
                          bancaId: selected?.id ?? null,
                          banca: selected?.nome ?? '',
                        }));
                      }}
                    >
                      {bancas.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {item.nome}
                        </MenuItem>
                      ))}
                      <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
                    </TextField>

                    {bancaSel === NOVO_VALOR && (
                      <Stack direction="row" spacing={1.5} mt={1.5}>
                        <TextField
                          fullWidth
                          placeholder="Nova banca"
                          value={bancaNew}
                          onChange={(e) => setBancaNew(e.target.value)}
                        />
                        <Button
                          variant="contained"
                          onClick={() => handleInlineCreate('banca')}
                          disabled={savingInline === 'banca'}
                          sx={{ minWidth: 90, textTransform: 'none', fontWeight: 700 }}
                        >
                          +
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Instituição
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={instituicaoSel}
                      onChange={(e) => {
                        const value = e.target.value;
                        setInstituicaoSel(value);

                        if (value === NOVO_VALOR) {
                          setMeta((prev) => ({
                            ...prev,
                            instituicaoId: null,
                            instituicao: '',
                          }));
                          return;
                        }

                        const selected = instituicoes.find((i) => String(i.id) === value);
                        setMeta((prev) => ({
                          ...prev,
                          instituicaoId: selected?.id ?? null,
                          instituicao: selected?.nome ?? '',
                        }));
                      }}
                    >
                      {instituicoes.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {item.nome}
                        </MenuItem>
                      ))}
                      <MenuItem value={NOVO_VALOR}>➕ Adicionar novo...</MenuItem>
                    </TextField>

                    {instituicaoSel === NOVO_VALOR && (
                      <Stack direction="row" spacing={1.5} mt={1.5}>
                        <TextField
                          fullWidth
                          placeholder="Nova instituição"
                          value={instituicaoNew}
                          onChange={(e) => setInstituicaoNew(e.target.value)}
                        />
                        <Button
                          variant="contained"
                          onClick={() => handleInlineCreate('instituicao')}
                          disabled={savingInline === 'instituicao'}
                          sx={{ minWidth: 90, textTransform: 'none', fontWeight: 700 }}
                        >
                          +
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Cargo
                    </Typography>
                    <TextField
                      fullWidth
                      value={meta.cargo}
                      onChange={(e) =>
                        setMeta((prev) => ({ ...prev, cargo: e.target.value }))
                      }
                    />
                  </Box>

                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Ano
                    </Typography>
                    <TextField
                      type="number"
                      fullWidth
                      value={meta.ano}
                      onChange={(e) =>
                        setMeta((prev) => ({ ...prev, ano: e.target.value }))
                      }
                    />
                  </Box>

                  <Box>
                    <Typography fontWeight={700} mb={1}>
                      Nível
                    </Typography>
                    <TextField
                      fullWidth
                      value={meta.nivel}
                      onChange={(e) =>
                        setMeta((prev) => ({ ...prev, nivel: e.target.value }))
                      }
                    />
                  </Box>
                </Box>

                <Box sx={{ maxWidth: { xs: '100%', md: '50%' } }}>
                  <Typography fontWeight={700} mb={1}>
                    Modalidade
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={meta.modalidade}
                    onChange={(e) =>
                      setMeta((prev) => ({
                        ...prev,
                        modalidade: e.target.value as ModalidadeUI,
                      }))
                    }
                  >
                    <MenuItem value="Múltipla Escolha (A até E)">
                      Múltipla Escolha (A até E)
                    </MenuItem>
                    <MenuItem value="Múltipla Escolha (A até D)">
                      Múltipla Escolha (A até D)
                    </MenuItem>
                    <MenuItem value="Certo/Errado">Certo/Errado</MenuItem>
                  </TextField>

                  <Typography variant="body2" color="text.secondary" mt={0.75}>
                    A etapa 2 muda os campos de alternativas conforme essa modalidade.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (!podeIrParaStep2()) return;
                      setStep(2);
                    }}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: 'none',
                    }}
                  >
                    Continuar
                  </Button>

                  <Button
                    variant="contained"
                    color="inherit"
                    onClick={() => router.push('/questoes')}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: 'none',
                    }}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            )}

            {step === 2 && (
              <Stack spacing={2.5}>
                <TextField
                  label="Enunciado"
                  multiline
                  minRows={4}
                  fullWidth
                  value={conteudo.enunciado}
                  onChange={(e) =>
                    setConteudo((prev) => ({ ...prev, enunciado: e.target.value }))
                  }
                />

                <TextField
                  label="Questão"
                  multiline
                  minRows={4}
                  fullWidth
                  value={conteudo.questao}
                  onChange={(e) =>
                    setConteudo((prev) => ({ ...prev, questao: e.target.value }))
                  }
                />

                {meta.modalidade !== 'Certo/Errado' && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="A)"
                      value={conteudo.altA}
                      onChange={(e) =>
                        setConteudo((prev) => ({ ...prev, altA: e.target.value }))
                      }
                    />
                    <TextField
                      label="B)"
                      value={conteudo.altB}
                      onChange={(e) =>
                        setConteudo((prev) => ({ ...prev, altB: e.target.value }))
                      }
                    />
                    <TextField
                      label="C)"
                      value={conteudo.altC}
                      onChange={(e) =>
                        setConteudo((prev) => ({ ...prev, altC: e.target.value }))
                      }
                    />
                    <TextField
                      label="D)"
                      value={conteudo.altD}
                      onChange={(e) =>
                        setConteudo((prev) => ({ ...prev, altD: e.target.value }))
                      }
                    />
                    {meta.modalidade === 'Múltipla Escolha (A até E)' && (
                      <TextField
                        label="E)"
                        value={conteudo.altE}
                        onChange={(e) =>
                          setConteudo((prev) => ({ ...prev, altE: e.target.value }))
                        }
                      />
                    )}
                  </Box>
                )}

                {meta.modalidade === 'Certo/Errado' && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    As alternativas serão preenchidas automaticamente como C) Certo e E) Errado.
                  </Alert>
                )}

                <TextField
                  label={`Gabarito (${gabaritoPermitido(meta.modalidade).join(', ')})`}
                  fullWidth
                  value={conteudo.gabarito}
                  onChange={(e) =>
                    setConteudo((prev) => ({
                      ...prev,
                      gabarito: e.target.value.toUpperCase(),
                    }))
                  }
                />

                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    onClick={() => setStep(1)}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                    }}
                  >
                    Voltar
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: 'none',
                    }}
                  >
                    {saving ? 'Salvando...' : 'Salvar questão'}
                  </Button>

                  <Button
                    variant="contained"
                    color="inherit"
                    onClick={() => router.push('/questoes')}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: 'none',
                    }}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}