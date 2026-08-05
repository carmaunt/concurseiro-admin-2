import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { ConteudoPayload } from '@/services/conteudosService';
import { evaluateSeoDraft, type ImageDimensions } from './seoChecks';

type Props = {
  form: ConteudoPayload;
  hasSelectedCover: boolean;
  coverDimensions: ImageDimensions | null;
};

const statusPresentation = {
  pass: { label: 'OK', color: 'success' as const },
  warning: { label: 'Revisar', color: 'warning' as const },
  error: { label: 'Essencial', color: 'error' as const },
};

export default function SeoChecklist({ form, hasSelectedCover, coverDimensions }: Props) {
  const report = evaluateSeoDraft(form, { hasSelectedCover, coverDimensions });
  const ready = report.blockingIssues.length === 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fafbfc' }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography fontWeight={800}>Revisão SEO antes de publicar</Typography>
          <Typography variant="body2" color="text.secondary">
            {report.passed}/{report.checks.length} verificações atendidas. Recomendações ajudam a revisão, mas não garantem posição no Google.
          </Typography>
        </Box>

        <Alert severity={ready ? (report.warnings.length ? 'warning' : 'success') : 'error'}>
          {ready
            ? report.warnings.length
              ? 'Os requisitos essenciais estão atendidos; revise as recomendações antes de publicar.'
              : 'Conteúdo pronto para publicação segundo a verificação do painel.'
            : `${report.blockingIssues.length} pendência(s) essencial(is) impedem a publicação. O rascunho ainda pode ser salvo.`}
        </Alert>

        <Stack spacing={1}>
          {report.checks.map((item) => {
            const presentation = statusPresentation[item.status];
            return (
              <Stack key={item.id} direction="row" spacing={1.25} alignItems="flex-start">
                <Chip label={presentation.label} color={presentation.color} size="small" sx={{ minWidth: 72, fontWeight: 700 }} />
                <Box>
                  <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.detail}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}
