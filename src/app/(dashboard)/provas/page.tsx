'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { ProvaDeleteDialog } from '@/components/provas/ProvaDeleteDialog';
import { ProvaDetalheDialog } from '@/components/provas/ProvaDetalheDialog';
import { ProvasStats } from '@/components/provas/ProvasStats';
import { ProvasTable } from '@/components/provas/ProvasTable';
import { api, getApiErrorMessage } from '@/services/api';
import { getCurrentUserRole } from '@/services/auth';
import type { ApiResponse, OptionalPageResponse, ProvaListItem, ProvasPageData, QuestaoListItem } from '@/types/api';
import { dataOf, prop } from '@/utils/unknown';

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

      const directData = prop(res.data, 'data');

      if (Array.isArray(directData)) {
        const list = directData as ProvaListItem[];
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
      const res = await api.get<ApiResponse<OptionalPageResponse<QuestaoListItem>> | OptionalPageResponse<QuestaoListItem> | QuestaoListItem[]>(
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
      } else if (Array.isArray(prop(res.data, 'content'))) {
        lista = (res.data as OptionalPageResponse<QuestaoListItem>).content;
      } else if (Array.isArray(prop(dataOf<unknown>(res.data), 'content'))) {
        lista = prop(dataOf<unknown>(res.data), 'content') as QuestaoListItem[];
      } else if (Array.isArray(dataOf<unknown>(res.data))) {
        lista = dataOf<QuestaoListItem[]>(res.data);
      }

      setQuestoesDaProva(lista.filter((q) => q.provaId === prova.id));
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
