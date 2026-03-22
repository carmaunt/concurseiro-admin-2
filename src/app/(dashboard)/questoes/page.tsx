// src/app/(dashboard)/questoes/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useRouter } from 'next/navigation';

type QuestaoListItem = {
  idQuestion: string;
  enunciado: string;
  questao: string;
  alternativas: string;
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
  page: {
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

export default function QuestoesPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [questaoSelecionada, setQuestaoSelecionada] =
    useState<QuestaoListItem | null>(null);

  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondeu, setRespondeu] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['questoes', page, size],
    queryFn: async () => {
      const res = await api.get<ApiResponse<QuestoesPageData>>(
        '/api/v1/questoes',
        {
          params: {
            page,
            size,
            sort: 'criadoEm,desc',
          },
        }
      );

      return res.data.data;
    },
  });

  const excluirQuestao = useMutation({
    mutationFn: async (idQuestion: string) => {
      await api.delete(`/api/v1/admin/questoes/${idQuestion}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questoes'] });
      setQuestaoSelecionada(null);
    },
  });

  const questoes = data?.content ?? [];

  const stats = useMemo(() => {
    const total = questoes.length;
    const bancas = new Set(questoes.map((q) => q.banca)).size;
    const disciplinas = new Set(questoes.map((q) => q.disciplina)).size;
    const anos = new Set(questoes.map((q) => q.ano)).size;

    return { total, bancas, disciplinas, anos };
  }, [questoes]);

  const totalElements = data?.page?.totalElements ?? 0;
  const pageAtual = data?.page?.number ?? page;
  const sizeAtual = data?.page?.size ?? size;
  const router = useRouter();

  const handleExcluir = (idQuestion: string) => {
    const confirmou = window.confirm(
      'Tem certeza que deseja excluir esta questão? Essa ação não pode ser desfeita.'
    );

    if (!confirmou) return;

    excluirQuestao.mutate(idQuestion);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        {(error as any)?.response?.data?.message ||
          'Não foi possível carregar as questões.'}
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
                Questões
                </Typography>
                <Typography color="text.secondary" mt={0.5}>
                Gerencie a listagem e visualize rapidamente as questões cadastradas.
                </Typography>
            </Box>

            <Button
                variant="contained"
                onClick={() => router.push('/questoes/nova')}
                sx={{
                borderRadius: 2.5,
                px: 2.5,
                py: 1.1,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: 'none',
                }}
            >
                Nova questão
            </Button>
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
              Lista de questões
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exibindo banca, disciplina, assunto, instituição e ano.
            </Typography>
          </Box>

          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell><strong>Banca</strong></TableCell>
                <TableCell><strong>Disciplina</strong></TableCell>
                <TableCell><strong>Assunto</strong></TableCell>
                <TableCell><strong>Instituição</strong></TableCell>
                <TableCell><strong>Ano</strong></TableCell>
                <TableCell align="right"><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {questoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      Nenhuma questão encontrada.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                questoes.map((q) => (
                  <TableRow key={q.idQuestion} hover>
                    <TableCell>{q.banca}</TableCell>
                    <TableCell>{q.disciplina}</TableCell>
                    <TableCell>{q.assunto}</TableCell>
                    <TableCell>{q.instituicao}</TableCell>
                    <TableCell>{q.ano}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Ver questão completa">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setQuestaoSelecionada(q);
                              setRespostaSelecionada(null);
                              setRespondeu(false);
                            }}
                          >
                            <VisibilityOutlinedIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Excluir questão">
                          <IconButton
                            color="error"
                            onClick={() => handleExcluir(q.idQuestion)}
                            disabled={excluirQuestao.isPending}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {questoes.length > 0 && (
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
        open={Boolean(questaoSelecionada)}
        onClose={() => setQuestaoSelecionada(null)}
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
        {questaoSelecionada && (
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
                        <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{ color: '#334155', wordBreak: 'break-all' }}
                        >
                        {questaoSelecionada.idQuestion}
                        </Typography>

                        <Typography
                        variant="body2"
                        sx={{ color: '#64748b', fontWeight: 600 }}
                        >
                        {questaoSelecionada.disciplina} {'›'} {questaoSelecionada.assunto}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={2}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ color: '#475569' }}
                    >
                        <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                            Ano:
                        </Box>{' '}
                        {questaoSelecionada.ano}
                        </Typography>

                        <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                            Banca:
                        </Box>{' '}
                        {questaoSelecionada.banca}
                        </Typography>

                        <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                            Instituição:
                        </Box>{' '}
                        {questaoSelecionada.instituicao}
                        </Typography>

                        <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                            Nível:
                        </Box>{' '}
                        {questaoSelecionada.nivel}
                        </Typography>

                        <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                            Modalidade:
                        </Box>{' '}
                        {questaoSelecionada.modalidade}
                        </Typography>
                    </Stack>

                    <Typography
                        variant="body1"
                        sx={{
                        color: '#475569',
                        lineHeight: 1.8,
                        }}
                    >
                        {questaoSelecionada.enunciado}
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#fcfcfd',
                        }}
                    >
                        <Typography
                        variant="body1"
                        sx={{
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            color: '#374151',
                            lineHeight: 1.7,
                        }}
                        >
                        {questaoSelecionada.questao}
                        </Typography>
                    </Paper>

                    <Stack spacing={1.5}>
                        {questaoSelecionada.alternativas
                          .split('\n')
                          .filter((item) => item.trim())
                          .map((alternativa, index) => {
                            const letra = alternativa.trim().charAt(0).replace(')', '');
                            const isSelecionada = respostaSelecionada === letra;
                            const isCorreta =
                              letra.toUpperCase() ===
                              String(questaoSelecionada.gabarito).toUpperCase();

                            return (
                            <Box
                              key={`${letra}-${index}`}
                              onClick={() => !respondeu && setRespostaSelecionada(letra)}
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                border: respondeu
                                  ? isCorreta
                                    ? '2px solid #16a34a'
                                    : isSelecionada
                                    ? '2px solid #dc2626'
                                    : '1px solid #e5e7eb'
                                  : isSelecionada
                                  ? '2px solid #2563eb'
                                  : '1px solid #e5e7eb',
                                backgroundColor: respondeu
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
                                cursor: respondeu ? 'default' : 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': respondeu
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
                                    border: respondeu
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
                                      (respondeu && (isCorreta || isSelecionada)) || (!respondeu && isSelecionada)
                                        ? {
                                            content: '""',
                                            position: 'absolute',
                                            inset: 4,
                                            borderRadius: '50%',
                                            backgroundColor: respondeu
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
                    >
                        <Button
                          variant="contained"
                          disableElevation
                          onClick={() => {
                            if (!respostaSelecionada) return;
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
                onClick={() => setQuestaoSelecionada(null)}
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