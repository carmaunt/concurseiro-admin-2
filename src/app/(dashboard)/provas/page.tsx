'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import { FeedbackSnackbar, ListPageState } from '@/components/listing/ListLayout';
import { ProvaDeleteDialog } from '@/components/provas/ProvaDeleteDialog';
import { ProvaDetalheDialog } from '@/components/provas/ProvaDetalheDialog';
import { ProvasStats } from '@/components/provas/ProvasStats';
import { ProvasTable } from '@/components/provas/ProvasTable';
import { useCurrentUserRole } from '@/hooks/useAuthSession';
import { useExcluirProva, useProvas, useQuestoesDaProva } from '@/hooks/useProvas';
import { getApiErrorMessage } from '@/services/api';
import type { ProvaListItem } from '@/types/api';

export default function ProvasPage() {
  const router = useRouter();
  const userRole = useCurrentUserRole();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [provaSelecionada, setProvaSelecionada] = useState<ProvaListItem | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondeu, setRespondeu] = useState(false);
  const [questaoEmResolucao, setQuestaoEmResolucao] = useState<string | null>(null);
  const [provaParaExcluir, setProvaParaExcluir] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useProvas(page, size);
  const questoesDaProvaQuery = useQuestoesDaProva(provaSelecionada?.id ?? null);

  const deletarProva = useExcluirProva({
    onSuccess: () => {
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

  const handleVisualizarProva = (prova: ProvaListItem) => {
    setProvaSelecionada(prova);
    setRespostaSelecionada(null);
    setRespondeu(false);
    setQuestaoEmResolucao(null);
  };

  const confirmarExclusao = () => {
    if (!provaParaExcluir) return;
    deletarProva.mutate(provaParaExcluir);
  };

  if (isLoading) {
    return (
      <ListPageState
        type="loading"
        title="Carregando provas"
        message="Buscando os registros cadastrados."
      />
    );
  }

  if (isError) {
    return (
      <ListPageState
        type="error"
        title="Erro ao carregar provas"
        message={getApiErrorMessage(error, 'Não foi possível carregar as provas.')}
        action={
          <Button variant="contained" onClick={() => refetch()} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f6f8fb', minHeight: '100%' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
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
              minWidth: { sm: 150 },
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
        questoes={questoesDaProvaQuery.data ?? []}
        loadingQuestoes={questoesDaProvaQuery.isFetching}
        erroQuestoes={
          questoesDaProvaQuery.isError
            ? getApiErrorMessage(questoesDaProvaQuery.error, 'Não foi possível carregar as questões da prova.')
            : ''
        }
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

      <FeedbackSnackbar feedback={feedback} onClose={() => setFeedback(null)} />
    </Box>
  );
}
