// src/app/(dashboard)/estatisticas/page.tsx
'use client';

import { Box, Typography } from '@mui/material';

export default function EstatisticasPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Estatísticas
      </Typography>
      <Typography variant="body1">
        Bem-vindo à seção de estatísticas. Aqui você encontrará gráficos e
        informações sobre o uso do aplicativo.
      </Typography>
    </Box>
  );
}
