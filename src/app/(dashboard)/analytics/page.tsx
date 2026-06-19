'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import OnlinePredictionOutlinedIcon from '@mui/icons-material/OnlinePredictionOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { getApiErrorMessage } from '@/services/api';
import { type AnalyticsPeriod, useAnalyticsDashboard } from '@/hooks/useAnalytics';
import type { AnalyticsRankingItem } from '@/types/api';

const periodOptions: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0);
}

function formatSeconds(value: number | undefined) {
  const seconds = Math.round(value ?? 0);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}min`;
}

function StatCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ flex: 1, minWidth: 220, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={800}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{helper}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function RankingCard({ title, items }: { title: string; items: AnalyticsRankingItem[] }) {
  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff', minHeight: 260 }}>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Ranking do período selecionado.</Typography>
      <Divider sx={{ mb: 2 }} />

      {items.length === 0 ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography color="text.secondary">Sem dados suficientes ainda.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.6}>
          {items.map((item) => (
            <Box key={item.label}>
              <Stack direction="row" justifyContent="space-between" spacing={2} mb={0.7}>
                <Typography variant="body2" fontWeight={700} noWrap title={item.label}>{item.label}</Typography>
                <Typography variant="body2" color="text.secondary">{formatNumber(item.total)}</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={(item.total / max) * 100} sx={{ height: 7, borderRadius: 999 }} />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const { data, isLoading, isError, error, refetch, isFetching } = useAnalyticsDashboard(period);

  if (isLoading) {
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Carregando estatísticas do aplicativo...</Typography>
        </Stack>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100%', bgcolor: '#f6f8fb' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e8edf3', textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={800} mb={1}>Erro ao carregar estatísticas</Typography>
          <Typography color="text.secondary" mb={3}>{getApiErrorMessage(error, 'Não foi possível carregar o analytics.')}</Typography>
          <Button variant="contained" onClick={() => refetch()} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Tentar novamente
          </Button>
        </Paper>
      </Box>
    );
  }

  const summary = data?.summary;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f6f8fb', minHeight: '100%' }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Estatísticas</Typography>
            <Typography color="text.secondary" mt={0.5}>
              Acompanhe uso do app, engajamento e comportamento dos estudantes.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? 'contained' : 'outlined'}
                onClick={() => setPeriod(option.value)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {option.label}
              </Button>
            ))}
            {isFetching && <CircularProgress size={20} />}
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          <StatCard title="Dispositivos" value={formatNumber(summary?.totalDevices)} helper="IDs únicos já vistos" icon={<DevicesOtherOutlinedIcon />} />
          <StatCard title="Ativos hoje" value={formatNumber(summary?.activeUsersToday)} helper="Usuários/dispositivos únicos" icon={<GroupOutlinedIcon />} />
          <StatCard title="Online agora" value={formatNumber(summary?.onlineNow)} helper="Eventos nos últimos 5 min" icon={<OnlinePredictionOutlinedIcon />} />
          <StatCard title="Questões hoje" value={formatNumber(summary?.questionsAnsweredToday)} helper="Respostas registradas" icon={<FactCheckOutlinedIcon />} />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <StatCard title="Ativos no período" value={formatNumber(summary?.activeUsersInPeriod)} helper="Usuários/dispositivos únicos" icon={<GroupOutlinedIcon />} />
          <StatCard title="Questões no período" value={formatNumber(summary?.questionsAnsweredInPeriod)} helper="Evento question_answered" icon={<FactCheckOutlinedIcon />} />
          <StatCard title="Tempo médio" value={formatSeconds(summary?.averageInteractionSeconds)} helper="Com base nos eventos com duração" icon={<AccessTimeOutlinedIcon />} />
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
          <RankingCard title="Telas mais acessadas" items={data?.topScreens ?? []} />
          <RankingCard title="Filtros mais usados" items={data?.topFilters ?? []} />
          <RankingCard title="Disciplinas mais acessadas" items={data?.topDisciplinas ?? []} />
          <RankingCard title="Assuntos mais acessados" items={data?.topAssuntos ?? []} />
          <RankingCard title="Subassuntos mais acessados" items={data?.topSubassuntos ?? []} />
        </Box>
      </Stack>
    </Box>
  );
}
