import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { buildFunnelStages } from './funnel';
import type { AnalyticsDashboard } from '@/services/analyticsService';

const number = (value: number, decimals = 0) => new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: decimals,
}).format(value);

const statusConfig = {
  MEDINDO: { label: 'Medição conectada', severity: 'success' as const },
  SEM_DADOS: { label: 'Aguardando dados', severity: 'info' as const },
  ATRIBUICAO_PARCIAL: { label: 'Atribuição parcial', severity: 'warning' as const },
};

export function AcquisitionFunnelPanel({ funnel }: { funnel: AnalyticsDashboard['acquisitionFunnel'] }) {
  const stages = buildFunnelStages(funnel);
  const status = statusConfig[funnel.status];

  return (
    <Stack spacing={2.5} data-testid="acquisition-funnel">
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} mb={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Portal → instalação → valor recorrente</Typography>
            <Typography color="text.secondary">
              Coorte iniciada no portal durante o período selecionado. Filtros de conteúdo não alteram este funil.
            </Typography>
          </Box>
          <Chip color={status.severity} label={status.label} sx={{ alignSelf: 'flex-start', fontWeight: 800 }} />
        </Stack>

        <Stack spacing={1.25} alignItems="center">
          {stages.map((stage) => (
            <Box key={stage.key} sx={{ width: { xs: '100%', md: `${stage.widthPercent}%` }, minWidth: { md: 300 } }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, px: 2, py: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                  <Box>
                    <Typography fontWeight={800}>{stage.label}</Typography>
                    <Typography variant="caption" sx={{ opacity: .82 }}>{stage.conversionLabel}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h5" fontWeight={900}>{number(stage.value)}</Typography>
                    {stage.conversionRate !== null ? (
                      <Typography variant="caption" fontWeight={800}>{number(stage.conversionRate, 1)}%</Typography>
                    ) : null}
                  </Box>
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>Portal → ativação</Typography>
          <Typography variant="h4" fontWeight={900} mt={1}>{number(funnel.portalToActivationRate, 1)}%</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>Cobertura do Install Referrer</Typography>
          <Typography variant="h4" fontWeight={900} mt={1}>{number(funnel.attributionCoverageRate, 1)}%</Typography>
          <Typography variant="caption" color="text.secondary">
            {number(funnel.linkedInstallEvents)} de {number(funnel.totalInstallEvents)} instalações ligadas ao portal
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>Retenção D+7</Typography>
          <Typography variant="h4" fontWeight={900} mt={1}>{number(funnel.retentionDay7Rate, 1)}%</Typography>
          <Typography variant="caption" color="text.secondary">Somente coortes cuja janela D+7 já terminou</Typography>
        </Paper>
      </Box>

      {funnel.status === 'ATRIBUICAO_PARCIAL' ? (
        <Alert severity="warning">
          Parte das instalações não contém o identificador do portal. As taxas são exibidas, mas ainda não representam todo o tráfego.
        </Alert>
      ) : funnel.status === 'SEM_DADOS' ? (
        <Alert severity="info">
          O pipeline está pronto, mas ainda não recebeu uma coorte completa neste período. Nenhuma conversão foi inventada.
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
        <Typography fontWeight={800} mb={1}>Como as etapas são calculadas</Typography>
        <Typography variant="body2" color="text.secondary"><b>Ativação:</b> {funnel.activationDefinition}.</Typography>
        <Typography variant="body2" color="text.secondary" mt={.5}><b>Retenção:</b> {funnel.retentionDefinition}.</Typography>
        <Typography variant="body2" color="text.secondary" mt={.5}>
          A conexão usa somente um identificador aleatório de aquisição enviado pelo referrer do Google Play; não usa nome, e-mail ou documento.
        </Typography>
      </Paper>
    </Stack>
  );
}
