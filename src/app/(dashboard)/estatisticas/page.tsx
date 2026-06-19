'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCurrentUserRole } from '@/hooks/useAuthSession';
import {
  listarAssuntosPorDisciplina,
  listarDisciplinas,
  listarSubassuntosPorAssunto,
} from '@/services/catalogoService';
import { getApiErrorMessage } from '@/services/api';
import type { AnalyticsFilters, AnalyticsRankingItem } from '@/services/analyticsService';

type Preset = 'today' | '7d' | '30d' | 'month' | 'custom';

const presetLabels: Record<Preset, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  month: 'Mês atual',
  custom: 'Personalizado',
};

function localDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function periodFor(preset: Exclude<Preset, 'custom'>): Pick<AnalyticsFilters, 'from' | 'to'> {
  const now = new Date();
  let from = localDayStart(now);
  if (preset === '7d') from.setDate(from.getDate() - 6);
  if (preset === '30d') from.setDate(from.getDate() - 29);
  if (preset === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: from.toISOString(), to: now.toISOString() };
}

function dateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}min ${remaining}s`;
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, minHeight: 128 }}>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

function RankingCard({ title, items, emptyText }: { title: string; items: AnalyticsRankingItem[]; emptyText: string }) {
  const max = Math.max(...items.map((item) => item.total), 1);
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, minHeight: 300 }}>
      <Typography variant="h6" fontWeight={750} sx={{ mb: 2 }}>{title}</Typography>
      {items.length === 0 ? (
        <Typography color="text.secondary" variant="body2">{emptyText}</Typography>
      ) : (
        <Stack spacing={1.75}>
          {items.map((item, index) => (
            <Box key={`${item.id ?? item.label}-${index}`}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2" noWrap title={item.label}>{item.label}</Typography>
                <Typography variant="body2" fontWeight={700}>{formatNumber(item.total)}</Typography>
              </Stack>
              <Box sx={{ height: 7, bgcolor: '#edf1f7', borderRadius: 99, mt: 0.75, overflow: 'hidden' }}>
                <Box sx={{ width: `${Math.max((item.total / max) * 100, 3)}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 99 }} />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function EstatisticasPage() {
  const role = useCurrentUserRole();
  const [preset, setPreset] = useState<Preset>('7d');
  const [period, setPeriod] = useState(() => periodFor('7d'));
  const [customFrom, setCustomFrom] = useState(() => dateInputValue(new Date(Date.now() - 6 * 86_400_000)));
  const [customTo, setCustomTo] = useState(() => dateInputValue(new Date()));
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>();
  const [assuntoId, setAssuntoId] = useState<number | undefined>();
  const [subassuntoId, setSubassuntoId] = useState<number | undefined>();

  const disciplinasQuery = useQuery({ queryKey: ['catalogo', 'disciplinas'], queryFn: listarDisciplinas });
  const assuntosQuery = useQuery({
    queryKey: ['catalogo', 'assuntos', disciplinaId],
    queryFn: () => listarAssuntosPorDisciplina(Number(disciplinaId)),
    enabled: disciplinaId !== undefined,
  });
  const subassuntosQuery = useQuery({
    queryKey: ['catalogo', 'subassuntos', assuntoId],
    queryFn: () => listarSubassuntosPorAssunto(Number(assuntoId)),
    enabled: assuntoId !== undefined,
  });

  const filters = useMemo<AnalyticsFilters>(() => ({
    ...period,
    ...(disciplinaId ? { disciplinaId } : {}),
    ...(assuntoId ? { assuntoId } : {}),
    ...(subassuntoId ? { subassuntoId } : {}),
  }), [period, disciplinaId, assuntoId, subassuntoId]);
  const analytics = useAnalytics(filters);

  const selectPreset = (next: Preset) => {
    setPreset(next);
    setPeriodError(null);
    if (next !== 'custom') setPeriod(periodFor(next));
  };

  const applyCustomPeriod = () => {
    const from = new Date(`${customFrom}T00:00:00`);
    const endExclusive = new Date(`${customTo}T00:00:00`);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const to = new Date(Math.min(endExclusive.getTime(), Date.now()));
    if (!customFrom || !customTo || Number.isNaN(from.getTime()) || from >= to) {
      setPeriodError('Informe um período válido, com a data inicial anterior à final.');
      return;
    }
    if (to.getTime() - from.getTime() > 366 * 86_400_000) {
      setPeriodError('O período máximo para consulta é de 366 dias.');
      return;
    }
    setPeriodError(null);
    setPeriod({ from: from.toISOString(), to: to.toISOString() });
  };

  if (role === null) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }
  if (role !== 'ADMIN') {
    return <Box sx={{ p: 3 }}><Alert severity="error">Esta área é exclusiva para administradores.</Alert></Box>;
  }

  const data = analytics.data;
  const summary = data?.summary;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1500, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Analytics</Typography>
          <Typography color="text.secondary">Uso real do aplicativo e comportamento de estudo.</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: { sm: 'center' } }}>
          Atualização automática a cada 60 segundos
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {(Object.keys(presetLabels) as Preset[]).map((item) => (
              <Button key={item} size="small" variant={preset === item ? 'contained' : 'outlined'} onClick={() => selectPreset(item)}>
                {presetLabels[item]}
              </Button>
            ))}
          </Stack>

          {preset === 'custom' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField label="Data inicial" type="date" size="small" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Data final" type="date" size="small" value={customTo} onChange={(event) => setCustomTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <Button variant="contained" onClick={applyCustomPeriod}>Aplicar período</Button>
            </Stack>
          )}
          {periodError && <Alert severity="warning">{periodError}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
            <TextField
              select size="small" label="Disciplina" value={disciplinaId ?? ''}
              onChange={(event) => { setDisciplinaId(event.target.value ? Number(event.target.value) : undefined); setAssuntoId(undefined); setSubassuntoId(undefined); }}
            >
              <MenuItem value="">Todas</MenuItem>
              {(disciplinasQuery.data ?? []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="Assunto" value={assuntoId ?? ''} disabled={!disciplinaId}
              onChange={(event) => { setAssuntoId(event.target.value ? Number(event.target.value) : undefined); setSubassuntoId(undefined); }}
            >
              <MenuItem value="">Todos</MenuItem>
              {(assuntosQuery.data ?? []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="Subassunto" value={subassuntoId ?? ''} disabled={!assuntoId}
              onChange={(event) => setSubassuntoId(event.target.value ? Number(event.target.value) : undefined)}
            >
              <MenuItem value="">Todos</MenuItem>
              {(subassuntosQuery.data ?? []).map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
            </TextField>
          </Box>
        </Stack>
      </Paper>

      {analytics.isLoading && <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
      {analytics.isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={() => analytics.refetch()}>Tentar novamente</Button>} sx={{ mb: 3 }}>
          {getApiErrorMessage(analytics.error, 'Não foi possível carregar as estatísticas.')}
        </Alert>
      )}

      {summary && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 3 }}>
            <MetricCard label="Dispositivos identificados" value={formatNumber(summary.totalDevices)} hint="Total histórico de IDs opacos" />
            <MetricCard label="Usuários ativos hoje" value={formatNumber(summary.activeUsersToday)} />
            <MetricCard label="Online agora" value={formatNumber(summary.onlineNow)} hint={`Atividade nos últimos ${data.onlineWindowMinutes} min`} />
            <MetricCard label="Questões resolvidas hoje" value={formatNumber(summary.questionsAnsweredToday)} />
            <MetricCard label="Ativos no período" value={formatNumber(summary.activeUsersInPeriod)} />
            <MetricCard label="Questões no período" value={formatNumber(summary.questionsAnsweredInPeriod)} />
            <MetricCard label="Interação média" value={formatDuration(summary.averageInteractionSeconds)} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
            <RankingCard title="Telas mais acessadas" items={data.topScreens} emptyText="Envie eventos screen_view para preencher este ranking." />
            <RankingCard title="Filtros mais utilizados" items={data.topFilters} emptyText="Envie eventos filter_applied para preencher este ranking." />
            <RankingCard title="Disciplinas mais acessadas" items={data.topDisciplinas} emptyText="Ainda não há interações com disciplina no período." />
            <RankingCard title="Assuntos mais acessados" items={data.topAssuntos} emptyText="Ainda não há interações com assunto no período." />
            <RankingCard title="Subassuntos mais acessados" items={data.topSubassuntos} emptyText="Ainda não há interações com subassunto no período." />
          </Box>
        </>
      )}
    </Box>
  );
}
