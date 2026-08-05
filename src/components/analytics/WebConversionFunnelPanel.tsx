import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { AnalyticsDashboard } from '@/services/analyticsService';

type WebConversionFunnel = NonNullable<AnalyticsDashboard['webConversionFunnel']>;

const number = (value: number, decimals = 0) => new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: decimals,
}).format(value);

export function WebConversionFunnelPanel({ funnel }: { funnel: WebConversionFunnel }) {
  const stages = [
    { label: 'Visitantes do portal', value: funnel.portalVisitors, hint: 'Entrada da coorte' },
    { label: 'Amostra iniciada', value: funnel.sampleStarted, hint: `${number(funnel.portalToSampleRate, 1)}% dos visitantes` },
    { label: 'Amostra concluída', value: funnel.sampleCompleted, hint: `${number(funnel.sampleCompletionRate, 1)}% dos inícios` },
    { label: 'Cadastro iniciado', value: funnel.signupStarted, hint: `${number(funnel.portalToSignupRate, 1)}% dos visitantes` },
    { label: 'Conta criada', value: funnel.signupCompleted, hint: `${number(funnel.signupCompletionRate, 1)}% dos cadastros iniciados` },
  ];

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }} data-testid="web-conversion-funnel">
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Portal → amostra → cadastro</Typography>
          <Typography color="text.secondary">
            Conversão do produto web para acompanhar se o tráfego editorial se transforma em prática e conta criada.
          </Typography>
        </Box>
        <Chip
          color={funnel.status === 'MEDINDO' ? 'success' : 'info'}
          label={funnel.status === 'MEDINDO' ? 'Medição conectada' : 'Aguardando dados'}
          sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
        />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 1.5 }}>
        {stages.map((stage, index) => (
          <Paper key={stage.label} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: index === stages.length - 1 ? '#f0fdf4' : '#fafbfc' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>{stage.label}</Typography>
            <Typography variant="h4" fontWeight={900} mt={.75}>{number(stage.value)}</Typography>
            <Typography variant="caption" color="text.secondary">{stage.hint}</Typography>
          </Paper>
        ))}
      </Box>

      {funnel.status === 'SEM_DADOS' ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          A instrumentação está pronta. Os números aparecerão quando a versão publicada receber novas visitas.
        </Alert>
      ) : null}

      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
        {funnel.definition}. Cadastros diretos pela página pilar são contabilizados mesmo quando o visitante não passa pela amostra.
      </Typography>
    </Paper>
  );
}
