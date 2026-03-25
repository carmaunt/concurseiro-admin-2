'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { useRouter } from 'next/navigation';

type ProvaListItem = {
  id: number;
  banca: string;
  ano: number;
  instituicao: string;
  modalidade: string;
  nivel?: string;
  cargo?: string;
  descricao?: string;
  totalQuestoes?: number;
  criadoEm?: string;
};

type ProvasPageData = {
  content: ProvaListItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

type QuestaoListItem = {
  idQuestion: string;
  enunciado: string;
  questao: string;
  alternativas: string | null;
  disciplina: string;
  disciplinaId: number;
  assunto: string;
  assuntoId: number;
  banca: string;
  bancaId: number;
  instituicao: string;
  instituicaoId: number;
  ano: number;
  cargo: string;
  nivel: string;
  modalidade: string;
  gabarito: string;
  provaId: number | null;
  criadoEm: string;
};

type QuestoesPageData = {
  content: QuestaoListItem[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
};

function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    return payload.role ?? payload.authorities?.[0] ?? null;
  } catch {
    return null;
  }
}

export default function ProvasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = getRoleFromToken(token);
    setUserRole(role);
  }, []);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [provaSelecionada, setProvaSelecionada] = useState<ProvaListItem | null>(null);
  const [questoesDaProva, setQuestoesDaProva] = useState<QuestaoListItem[]>([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [erroQuestoes, setErroQuestoes] = useState('');
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondeu, setRespondeu] = useState(false);
  const [questaoEmResolucao, setQuestaoEmResolucao] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['provas', page, size],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProvasPageData> | ProvaListItem[]>('/api/v1/provas', {
        params: {
          page,
          size,
          sort: 'criadoEm,desc',
        },
      });

      if (Array.isArray(res.data)) {
        return {
          content: res.data,
          page: {
            size,
            number: page,
            totalElements: res.data.length,
            totalPages: 1,
          },
        };
      }

      if (Array.isArray((res.data as any)?.data)) {
        const list = (res.data as any).data as ProvaListItem[];
        return {
          content: list,
          page: {
            size,
            number: page,
            totalElements: list.length,
            totalPages: 1,
          },
        };
      }

      return (res.data as ApiResponse<ProvasPageData>).data;
    },
  });

  const deletarProva = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/provas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provas'] });
      setProvaSelecionada(null);
    },
    onError: (error: any) => {
      alert(
        error?.response?.data?.message ||
        'Não foi possível excluir a prova.'
      );
    },
  });

  const provas = data?.content ?? [];

  const stats = useMemo(() => {
    const total = provas.length;
    const bancas = new Set(provas.map((p) => p.banca)).size;
    const instituicoes = new Set(provas.map((p) => p.instituicao)).size;
    const anos = new Set(provas.map((p) => p.ano)).size;

    return { total, bancas, instituicoes, anos };
  }, [provas]);

  const totalElements = data?.page?.totalElements ?? 0;
  const pageAtual = data?.page?.number ?? page;
  const sizeAtual = data?.page?.size ?? size;
  const isAdmin = userRole === 'ADMIN';

  const handleVisualizarProva = async (prova: ProvaListItem) => {
    setProvaSelecionada(prova);
    setErroQuestoes('');
    setLoadingQuestoes(true);
    setQuestoesDaProva([]);
    setRespostaSelecionada(null);
    setRespondeu(false);
    setQuestaoEmResolucao(null);

    try {
      const res = await api.get<ApiResponse<QuestoesPageData> | QuestoesPageData | QuestaoListItem[]>(
        '/api/v1/questoes',
        {
          params: {
            page: 0,
            size: 50,
            sort: 'criadoEm,desc',
          },
        }
      );

      let lista: QuestaoListItem[] = [];

      if (Array.isArray(res.data)) {
        lista = res.data;
      } else if (Array.isArray((res.data as any)?.content)) {
        lista = (res.data as QuestoesPageData).content;
      } else if (Array.isArray((res.data as any)?.data?.content)) {
        lista = (res.data as any).data.content;
      } else if (Array.isArray((res.data as any)?.data)) {
        lista = (res.data as any).data;
      }

      setQuestoesDaProva(lista.filter((q) => q.provaId === prova.id));
    } catch (error: any) {
      setErroQuestoes(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Não foi possível carregar as questões da prova.'
      );
    } finally {
      setLoadingQuestoes(false);
    }
  };

  const handleExcluir = (id: number) => {
    const confirmou = window.confirm(
      'Tem certeza que deseja excluir esta prova? Essa ação não pode ser desfeita.'
    );

    if (!confirmou) return;

    deletarProva.mutate(id);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        {(error as any)?.response?.data?.message || 'Não foi possível carregar as provas.'}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f6f8fb', minHeight: '100%' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Provas
            </Typography>
            <Typography color="text.secondary" mt={0.5}>
              Gerencie a listagem e visualize rapidamente as provas cadastradas.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => router.push('/provas/nova')}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              py: 1.1,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            Nova prova
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <DescriptionOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.total}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccountBalanceOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Bancas
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.bancas}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <SchoolOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Instituições
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.instituicoes}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CalendarTodayOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Anos
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.anos}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid #e8edf3',
            overflow: 'hidden',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid #eef2f7' }}>
            <Typography variant="h6" fontWeight={700}>
              Lista de provas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exibindo banca, instituição, ano e modalidade.
            </Typography>
          </Box>

          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ width: '25%' }}>
                  <strong>Instituição</strong>
                </TableCell>
                <TableCell sx={{ width: '15%' }}>
                  <strong>Banca</strong>
                </TableCell>
                <TableCell sx={{ width: '10%' }}>
                  <strong>Ano</strong>
                </TableCell>
                <TableCell sx={{ width: '20%' }}>
                  <strong>Modalidade</strong>
                </TableCell>
                <TableCell sx={{ width: '10%' }}>
                  <strong>Questões</strong>
                </TableCell>
                <TableCell align="right" sx={{ width: '20%' }}>
                  <strong>Ações</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {provas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Nenhuma prova encontrada.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                provas.map((prova) => (
                  <TableRow key={prova.id} hover>
                    <TableCell>{prova.instituicao}</TableCell>
                    <TableCell>{prova.banca}</TableCell>
                    <TableCell>{prova.ano}</TableCell>
                    <TableCell>
                      {prova.modalidade === 'CERTO_ERRADO'
                        ? 'CERTO ERRADO'
                        : prova.modalidade === 'A_E' || prova.modalidade === 'A_D'
                        ? 'MULTIPLA ESCOLHA'
                        : prova.modalidade}
                    </TableCell>
                    <TableCell>{prova.totalQuestoes ?? 0}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Ver prova completa">
                          <IconButton color="primary" onClick={() => handleVisualizarProva(prova)}>
                            <VisibilityOutlinedIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Adicionar questão nesta prova">
                          <IconButton
                            color="success"
                            onClick={() => router.push(`/provas/${prova.id}/questoes/nova`)}
                          >
                            <AddCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={isAdmin ? 'Excluir prova' : 'Apenas administradores podem excluir provas'}>
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => handleExcluir(prova.id)}
                              disabled={!isAdmin || deletarProva.isPending}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {provas.length > 0 && (
            <TablePagination
              component="div"
              count={totalElements}
              page={pageAtual}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={sizeAtual}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Itens por página"
            />
          )}
        </Paper>
      </Stack>

      <Dialog
        open={Boolean(provaSelecionada)}
        onClose={() => setProvaSelecionada(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)',
            backgroundColor: '#f8fafc',
          },
        }}
      >
        {provaSelecionada && (
          <>
            <DialogContent sx={{ p: 3, pt: 4, backgroundColor: '#f8fafc' }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                    >
                      <Typography variant="h6" fontWeight={800} sx={{ color: '#334155' }}>
                        {provaSelecionada.instituicao}
                      </Typography>

                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Prova #{provaSelecionada.id}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ color: '#475569' }}>
                      <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          Banca:
                        </Box>{' '}
                        {provaSelecionada.banca}
                      </Typography>

                      <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          Ano:
                        </Box>{' '}
                        {provaSelecionada.ano}
                      </Typography>

                      <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          Modalidade:
                        </Box>{' '}
                        {provaSelecionada.modalidade}
                      </Typography>

                      {provaSelecionada.nivel && (
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            Nível:
                          </Box>{' '}
                          {provaSelecionada.nivel}
                        </Typography>
                      )}

                      {provaSelecionada.cargo && (
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            Cargo:
                          </Box>{' '}
                          {provaSelecionada.cargo}
                        </Typography>
                      )}

                      {typeof provaSelecionada.totalQuestoes === 'number' && (
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            Questões:
                          </Box>{' '}
                          {provaSelecionada.totalQuestoes}
                        </Typography>
                      )}
                    </Stack>

                    <Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: '#334155', mb: 2 }}>
                        Questões cadastradas
                      </Typography>

                      {loadingQuestoes && (
                        <Box display="flex" justifyContent="center" py={4}>
                          <CircularProgress />
                        </Box>
                      )}

                      {!loadingQuestoes && erroQuestoes && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                          {erroQuestoes}
                        </Alert>
                      )}

                      {!loadingQuestoes && !erroQuestoes && questoesDaProva.length === 0 && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#fcfcfd',
                          }}
                        >
                          <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                            Nenhuma questão cadastrada para esta prova.
                          </Typography>
                        </Paper>
                      )}

                      {!loadingQuestoes && !erroQuestoes && questoesDaProva.length > 0 && (
                        <Stack spacing={2}>
                          {questoesDaProva.map((questao) => (
                            <Paper
                              key={questao.idQuestion}
                              elevation={0}
                              sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#fcfcfd',
                              }}
                            >
                              <Stack spacing={1.25}>
                                <Stack spacing={0.5} alignItems="flex-start">
                                  <Stack direction="row" spacing={3} flexWrap="wrap">
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                      <strong>Disciplina:</strong> {questao.disciplina}
                                    </Typography>

                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                      <strong>Assunto:</strong> {questao.assunto}
                                    </Typography>
                                  </Stack>

                                  {('subassunto' in questao) && (questao as any).subassunto && (
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                      <strong>Subassunto:</strong> {(questao as any).subassunto}
                                    </Typography>
                                  )}
                                </Stack>

                                <Typography sx={{ color: '#374151' }}>
                                  {questao.enunciado}
                                </Typography>

                                
                                <Typography sx={{ color: '#374151' }}>
                                  {questao.questao}
                                </Typography>

                                <Stack spacing={1.5}>
                                  {(questao.alternativas || 'C) CERTO\nE) ERRADO')
                                    .split('\n')
                                    .filter((item) => item.trim())
                                    .map((alternativa, index) => {
                                      const letra = alternativa.trim().charAt(0).replace(')', '');
                                      const isSelecionada =
                                        questaoEmResolucao === questao.idQuestion && respostaSelecionada === letra;

                                      const gabaritoNormalizado =
                                        String(questao.gabarito).toUpperCase() === 'ERRADO'
                                          ? 'E'
                                          : String(questao.gabarito).toUpperCase() === 'CERTO'
                                          ? 'C'
                                          : String(questao.gabarito).toUpperCase();

                                      const isCorreta = letra.toUpperCase() === gabaritoNormalizado;

                                      const respondeuQuestao =
                                        questaoEmResolucao === questao.idQuestion && respondeu;

                                      return (
                                        <Box
                                          key={`${letra}-${index}`}
                                          onClick={() => {
                                            if (respondeuQuestao) return;
                                            setQuestaoEmResolucao(questao.idQuestion);
                                            setRespostaSelecionada(letra);
                                          }}
                                          sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            border: respondeuQuestao
                                              ? isCorreta
                                                ? '2px solid #16a34a'
                                                : isSelecionada
                                                ? '2px solid #dc2626'
                                                : '1px solid #e5e7eb'
                                              : isSelecionada
                                              ? '2px solid #2563eb'
                                              : '1px solid #e5e7eb',
                                            backgroundColor: respondeuQuestao
                                              ? isCorreta
                                                ? '#dcfce7'
                                                : isSelecionada
                                                ? '#fee2e2'
                                                : '#fff'
                                              : isSelecionada
                                              ? '#eff6ff'
                                              : '#fff',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 1.5,
                                            cursor: respondeuQuestao ? 'default' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': respondeuQuestao
                                              ? {}
                                              : {
                                                  borderColor: '#2563eb',
                                                  backgroundColor: '#f1f5f9',
                                                },
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              width: 22,
                                              height: 22,
                                              minWidth: 22,
                                              borderRadius: '50%',
                                              border: respondeuQuestao
                                                ? isCorreta
                                                  ? '2px solid #16a34a'
                                                  : isSelecionada
                                                  ? '2px solid #dc2626'
                                                  : '2px solid #cbd5e1'
                                                : isSelecionada
                                                ? '2px solid #2563eb'
                                                : '2px solid #cbd5e1',
                                              mt: '2px',
                                              position: 'relative',
                                              '&::after':
                                                (respondeuQuestao && (isCorreta || isSelecionada)) ||
                                                (!respondeuQuestao && isSelecionada)
                                                  ? {
                                                      content: '""',
                                                      position: 'absolute',
                                                      inset: 4,
                                                      borderRadius: '50%',
                                                      backgroundColor: respondeuQuestao
                                                        ? isCorreta
                                                          ? '#16a34a'
                                                          : '#dc2626'
                                                        : '#2563eb',
                                                    }
                                                  : undefined,
                                            }}
                                          />

                                          <Box sx={{ flex: 1 }}>
                                            <Typography
                                              variant="body1"
                                              sx={{
                                                fontWeight: isCorreta ? 700 : 600,
                                                color: '#374151',
                                                lineHeight: 1.7,
                                                whiteSpace: 'pre-line',
                                              }}
                                            >
                                              {alternativa}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                </Stack>

                                <Stack
                                  direction={{ xs: 'column', sm: 'row' }}
                                  spacing={1.5}
                                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                                  pt={1}
                                >
                                  <Button
                                    variant="contained"
                                    disableElevation
                                    onClick={() => {
                                      if (questaoEmResolucao !== questao.idQuestion || !respostaSelecionada) return;
                                      setRespondeu(true);
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      borderRadius: 2,
                                      px: 2.5,
                                      backgroundColor: '#2563eb',
                                    }}
                                  >
                                    Responder
                                  </Button>

                                  <Button
                                    variant="text"
                                    onClick={() => {
                                      setQuestaoEmResolucao(questao.idQuestion);
                                      setRespostaSelecionada(null);
                                      setRespondeu(false);
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      color: '#64748b',
                                    }}
                                  >
                                    Limpar
                                  </Button>
                                </Stack>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="contained"
                onClick={() => setProvaSelecionada(null)}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  boxShadow: 'none',
                }}
              >
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}