'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { ProvaDeleteDialog } from '@/components/provas/ProvaDeleteDialog';
import { ProvaDetalheDialog } from '@/components/provas/ProvaDetalheDialog';
import { ProvasStats } from '@/components/provas/ProvasStats';
import { ProvasTable } from '@/components/provas/ProvasTable';
import { getApiErrorMessage } from '@/services/api';
import { getCurrentUserRole } from '@/services/auth';
import { excluirProva, listarProvas, listarQuestoesDaProva } from '@/services/provasService';
import type { ProvaListItem, QuestaoListItem } from '@/types/api';

export default function ProvasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [provaSelecionada, setProvaSelecionada] = useState<ProvaListItem | null>(null);
  const [questoesDaProva, setQuestoesDaProva] = useState<QuestaoListItem[]>([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [erroQuestoes, setErroQuestoes] = useState('');
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondeu, setRespondeu] = useState(false);
  const [questaoEmResolucao, setQuestaoEmResolucao] = useState<string | null>(null);
  const [provaParaExcluir, setProvaParaExcluir] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setUserRole(getCurrentUserRole());
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['provas', page, size],
    queryFn: () => listarProvas(page, size),
  });

  const deletarProva = useMutation({
    mutationFn: excluirProva,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provas'] });
      setProvaSelecionada(null);
      setProvaParaExcluir(null);
      setFeedback({ type: 'success', message: 'Prova excluída com sucesso.' });
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Não foi possível excluir a prova.'),
      });
    },
  });

  const provas = useMemo(() => data?.content ?? [], [data?.content]);

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
      setQuestoesDaProva(await listarQuestoesDaProva(prova.id));
    } catch (error: unknown) {
      setErroQuestoes(getApiErrorMessage(error, 'Não foi possível carregar as questões da prova.'));
    } finally {
      setLoadingQuestoes(false);
    }
  };

  const confirmarExclusao = () => {
    if (!provaParaExcluir) return;
    deletarProva.mutate(provaParaExcluir);
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
        {getApiErrorMessage(error, 'Não foi possível carregar as provas.')}
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

        <ProvasStats stats={stats} />

        <ProvasTable
          provas={provas}
          totalElements={totalElements}
          pageAtual={pageAtual}
          sizeAtual={sizeAtual}
          isAdmin={isAdmin}
          isDeleting={deletarProva.isPending}
          onView={handleVisualizarProva}
          onAddQuestion={(provaId) => router.push(`/provas/${provaId}/questoes/nova`)}
          onDelete={setProvaParaExcluir}
          onPageChange={setPage}
          onRowsPerPageChange={(nextSize) => {
            setSize(nextSize);
            setPage(0);
          }}
        />
      </Stack>

      <ProvaDetalheDialog
        prova={provaSelecionada}
        questoes={questoesDaProva}
        loadingQuestoes={loadingQuestoes}
        erroQuestoes={erroQuestoes}
        respostaSelecionada={respostaSelecionada}
        respondeu={respondeu}
        questaoEmResolucao={questaoEmResolucao}
        onClose={() => setProvaSelecionada(null)}
        onSelecionarQuestao={setQuestaoEmResolucao}
        onSelecionarResposta={setRespostaSelecionada}
        onResponder={() => {
          if (!questaoEmResolucao || !respostaSelecionada) return;
          setRespondeu(true);
        }}
        onResetResposta={() => setRespondeu(false)}
      />

      <ProvaDeleteDialog
        open={Boolean(provaParaExcluir)}
        isDeleting={deletarProva.isPending}
        onClose={() => setProvaParaExcluir(null)}
        onConfirm={confirmarExclusao}
      />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ width: '100%' }}>
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
