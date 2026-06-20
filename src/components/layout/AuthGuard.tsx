// src/components/layout/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { clearAuthSession, hasAuthSession, saveAuthSession } from '@/services/auth';
import { me } from '@/services/authService';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function validarSessao() {
      if (!hasAuthSession()) {
        router.replace('/login');
        return;
      }

      try {
        const session = await me();

        if (!session.email || !session.role) {
          throw new Error('Sessão inválida');
        }

        if (session.role === 'USUARIO_FINAL' || session.tipoConta === 'APP') {
          throw new Error('Usuário do app não pode acessar o painel');
        }

        saveAuthSession(session);

        if (active) {
          setAuthorized(true);
        }
      } catch {
        clearAuthSession();

        if (active) {
          router.replace('/login');
        }
      }
    }

    validarSessao();

    return () => {
      active = false;
    };
  }, [router]);

  if (!authorized) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
