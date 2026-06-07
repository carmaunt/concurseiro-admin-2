// src/app/(dashboard)/questoes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { getCurrentUserRole } from '@/services/auth';
import type { ApiResponse, QuestaoListItem, QuestoesPageData } from '@/types/api';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

function extrairLetraAlternativa(alternativa: string) {
  return alternativa.trim().charAt(0).replace(')', '').toUpperCase();
}

function isGabaritoAnulada(gabarito: string | null | undefined) {
  const normalizado = String(gabarito || '').toUpperCase();
  return normalizado === 'X' || normalizado === 'ANULADA';
}

export default function QuestoesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [questaoSelecionada, setQuestaoSelecionada] = useState<QuestaoListItem | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondeu, setRespondeu] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(getCurrentUserRole());
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['questoes', page, size],
    queryFn: async () => {
      const res = await api.get<ApiResponse<QuestoesPageData>>('/api/v1/questoes', {
        params: { page, size, sort: 'criadoEm,desc' },
      });
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
  const totalElements = data?.page?.totalElements ?? 0;
  const pageAtual = data?.page?.number ?? page;
  const sizeAtual = data?.page?.size ?? size;
  const isAdmin = userRole === 'ADMIN';

  const handleExcluir = (idQuestion: string) => {
    const confirmou = window.confirm('Tem certeza que deseja excluir esta questão? Essa ação não pode ser desfeita.');
    if (confirmou) excluirQuestao.mutate(idQuestion);
  };

  const abrirQuestao = (questao: QuestaoListItem) => {
    setQuestaoSelecionada(questao);
    setRespostaSelecionada(null);
    setRespondeu(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">{(error as any)?.response?.data?.message || 'Não foi possível carregar as questões.'}</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, backgroundColor: '#f6f8fb', minHeight: '100%', width: '100%', overflowX: 'hidden' }}>
      <Stack spacing={{ xs: 2, md: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={800} sx={{ wordBreak: 'break-word' }}>Questões</Typography>
            <Typography color="text.secondary" mt={0.5} sx={{ maxWidth: 560 }}>Gerencie a listagem e visualize rapidamente as questões cadastradas.</Typography>
          </Box>

          <Button
            fullWidth={isMobile}
            variant="contained"
            onClick={() => router.push('/questoes/nova')}
            sx={{ borderRadius: 2.5, px: 2.5, py: 1.15, fontWeight: 700, textTransform: 'none', boxShadow: 'none', minWidth: { sm: 150 } }}
          >
            Nova questão
          </Button>
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: { xs: 3, md: 4 }, border: '1px solid #e8edf3', overflow: 'hidden', bgcolor: '#fff' }}>
          <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: '1px solid #eef2f7' }}>
            <Typography variant="h6" fontWeight={800}>Lista de questões</Typography>
            <Typography variant="body2" color="text.secondary">Exibindo banca, disciplina, assunto, instituição, ano e texto de apoio.</Typography>
          </Box>

          {isMobile ? (
            <Stack spacing={1.5} sx={{ p: 1.5 }}>
              {questoes.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">Nenhuma questão encontrada.</Typography>
                </Box>
              ) : (
                questoes.map((q) => (
                  <Paper key={q.idQuestion} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                    <Stack spacing={1.2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={800} sx={{ color: '#1e293b', wordBreak: 'break-word' }}>{q.disciplina}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{q.assunto}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={800} sx={{ color: '#2563eb', flexShrink: 0 }}>{q.ano}</Typography>
                      </Stack>

                      <Stack spacing={0.4}>
                        <Typography variant="body2"><Box component="span" fontWeight={700}>Banca:</Box> {q.banca}</Typography>
                        <Typography variant="body2"><Box component="span" fontWeight={700}>Instituição:</Box> {q.instituicao}</Typography>
                        {q.textoApoioId && (
                          <Typography variant="body2" sx={{ color: '#1d4ed8' }}><Box component="span" fontWeight={700}>Texto:</Box> {q.textoApoioTitulo || `#${q.textoApoioId}`}</Typography>
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button fullWidth variant="outlined" onClick={() => abrirQuestao(q)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Ver</Button>
                        <Button fullWidth variant="outlined" color="error" onClick={() => handleExcluir(q.idQuestion)} disabled={!isAdmin || excluirQuestao.isPending} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Excluir</Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbfc' }}>
                  <TableCell><strong>Banca</strong></TableCell>
                  <TableCell><strong>Disciplina</strong></TableCell>
                  <TableCell><strong>Assunto</strong></TableCell>
                  <TableCell><strong>Instituição</strong></TableCell>
                  <TableCell><strong>Ano</strong></TableCell>
                  <TableCell><strong>Texto apoio</strong></TableCell>
                  <TableCell align="right"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {questoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Nenhuma questão encontrada.</Typography>
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
                      <TableCell>{q.textoApoioId ? q.textoApoioTitulo || `#${q.textoApoioId}` : '-'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Ver questão completa">
                            <IconButton color="primary" onClick={() => abrirQuestao(q)}><VisibilityOutlinedIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title={isAdmin ? 'Excluir questão' : 'Apenas administradores podem excluir questões'}>
                            <span><IconButton color="error" onClick={() => handleExcluir(q.idQuestion)} disabled={!isAdmin || excluirQuestao.isPending}><DeleteOutlineIcon /></IconButton></span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

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
              labelRowsPerPage={isMobile ? 'Por página' : 'Itens por página'}
              sx={{ '.MuiTablePagination-toolbar': { px: { xs: 1, sm: 2 }, flexWrap: { xs: 'wrap', sm: 'nowrap' }, justifyContent: { xs: 'center', sm: 'flex-end' } } }}
            />
          )}
        </Paper>
      </Stack>

      <Dialog open={Boolean(questaoSelecionada)} onClose={() => setQuestaoSelecionada(null)} fullWidth maxWidth="md" fullScreen={isMobile} PaperProps={{ sx: { borderRadius: { xs: 0, md: 4 }, overflow: 'hidden', boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)', backgroundColor: '#f8fafc' } }}>
        {questaoSelecionada && (
          <>
            <DialogContent sx={{ p: { xs: 2, md: 3 }, pt: { xs: 2, md: 4 }, backgroundColor: '#f8fafc' }}>
              <Paper elevation={0} sx={{ borderRadius: { xs: 2.5, md: 3 }, border: '1px solid #e5e7eb', overflow: 'hidden', backgroundColor: '#fff' }}>
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: '#334155', wordBreak: 'break-all' }}>{questaoSelecionada.idQuestion}</Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, wordBreak: 'break-word' }}>{questaoSelecionada.disciplina} {'›'} {questaoSelecionada.assunto}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ color: '#475569' }}>
                      <Typography variant="body2"><Box component="span" sx={{ fontWeight: 700 }}>Ano:</Box> {questaoSelecionada.ano}</Typography>
                      <Typography variant="body2"><Box component="span" sx={{ fontWeight: 700 }}>Banca:</Box> {questaoSelecionada.banca}</Typography>
                      <Typography variant="body2"><Box component="span" sx={{ fontWeight: 700 }}>Instituição:</Box> {questaoSelecionada.instituicao}</Typography>
                      <Typography variant="body2"><Box component="span" sx={{ fontWeight: 700 }}>Nível:</Box> {questaoSelecionada.nivel}</Typography>
                      <Typography variant="body2"><Box component="span" sx={{ fontWeight: 700 }}>Modalidade:</Box> {questaoSelecionada.modalidade}</Typography>
                    </Stack>

                    {questaoSelecionada.textoApoioConteudo && (
                      <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: '1px solid #dbeafe', backgroundColor: '#eff6ff' }}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2" fontWeight={800} color="#1e40af">{questaoSelecionada.textoApoioTitulo || 'Texto de apoio'}</Typography>
                          <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{questaoSelecionada.textoApoioConteudo}</Typography>
                        </Stack>
                      </Paper>
                    )}

                    <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{questaoSelecionada.enunciado}</Typography>

                    <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: '1px solid #e5e7eb', backgroundColor: '#fcfcfd' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, fontWeight: 600, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{questaoSelecionada.questao}</Typography>
                    </Paper>

                    {isGabaritoAnulada(questaoSelecionada.gabarito) && (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>Questão anulada.</Alert>
                    )}

                    <Stack spacing={1.5}>
                      {(questaoSelecionada.alternativas || '').split('\n').filter((item) => item.trim()).map((alternativa, index) => {
                        const letra = extrairLetraAlternativa(alternativa);
                        const isSelecionada = respostaSelecionada === letra;
                        const isAnulada = isGabaritoAnulada(questaoSelecionada.gabarito);
                        const isCorreta = !isAnulada && letra === String(questaoSelecionada.gabarito).toUpperCase();

                        return (
                          <Box
                            key={`${letra}-${index}`}
                            onClick={() => !respondeu && setRespostaSelecionada(letra)}
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              border: respondeu && !isAnulada ? (isCorreta ? '2px solid #16a34a' : isSelecionada ? '2px solid #dc2626' : '1px solid #e5e7eb') : isSelecionada ? '2px solid #2563eb' : '1px solid #e5e7eb',
                              backgroundColor: respondeu && !isAnulada ? (isCorreta ? '#dcfce7' : isSelecionada ? '#fee2e2' : '#fff') : isSelecionada ? '#eff6ff' : '#fff',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                              cursor: respondeu ? 'default' : 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Box sx={{ width: 22, height: 22, minWidth: 22, borderRadius: '50%', border: respondeu && !isAnulada ? (isCorreta ? '2px solid #16a34a' : isSelecionada ? '2px solid #dc2626' : '2px solid #cbd5e1') : isSelecionada ? '2px solid #2563eb' : '2px solid #cbd5e1', mt: '2px', position: 'relative', '&::after': (respondeu && !isAnulada && (isCorreta || isSelecionada)) || (!respondeu && isSelecionada) || (respondeu && isAnulada && isSelecionada) ? { content: '""', position: 'absolute', inset: 4, borderRadius: '50%', backgroundColor: respondeu && !isAnulada ? (isCorreta ? '#16a34a' : '#dc2626') : '#2563eb' } : undefined }} />
                            <Typography variant="body1" sx={{ fontWeight: isCorreta && respondeu ? 700 : 600, color: '#374151', lineHeight: 1.7, wordBreak: 'break-word' }}>{alternativa}</Typography>
                          </Box>
                        );
                      })}
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <Button fullWidth={isMobile} variant="contained" disableElevation onClick={() => { if (respostaSelecionada) setRespondeu(true); }} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5, backgroundColor: '#2563eb' }}>Responder</Button>
                      <Button fullWidth={isMobile} variant="text" onClick={() => { setRespostaSelecionada(null); setRespondeu(false); }} sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b' }}>Limpar</Button>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: '1px solid #e5e7eb', backgroundColor: '#fff', justifyContent: 'flex-end' }}>
              <Button fullWidth={isMobile} variant="contained" onClick={() => setQuestaoSelecionada(null)} sx={{ borderRadius: 2, px: 2.5, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
