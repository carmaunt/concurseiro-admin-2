// src/app/(auth)/login/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { API_BASE_URL, getApiErrorMessage, getApiErrorStatus } from '@/services/api';
import { saveAuthSession } from '@/services/auth';
import { login } from '@/services/authService';

type FormData = {
  email: string;
  senha: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [erro, setErro] = useState('');

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setErro('');

    if (!API_BASE_URL) {
      setErro('Ambiente não configurado corretamente. Entre em contato com o responsável pelo sistema.');
      return;
    }

    try {
      const { email, role } = await login({
        email: data.email,
        senha: data.senha,
      });

      if (!email || !role) {
        setErro('Não foi possível validar sua sessão. Tente novamente.');
        return;
      }

      saveAuthSession({ email, role });

      router.push('/questoes');
    } catch (error: unknown) {
      const status = getApiErrorStatus(error);

      if (status === 401) {
        setErro('Email ou senha inválidos.');
        return;
      }

      if (status === 403) {
        setErro('Seu acesso ao painel ainda não foi aprovado.');
        return;
      }

      setErro(getApiErrorMessage(error, 'Não foi possível realizar o login.'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #f8fafc 0%, #eef2f7 48%, #f7f2df 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.14)',
            bgcolor: '#fff',
            border: '1px solid rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              p: 7,
              color: '#f8fafc',
              background:
                'linear-gradient(160deg, #122033 0%, #1e344d 58%, #263f5d 100%)',
            }}
          >
            <Box
              sx={{
                width: 76,
                height: 76,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                mb: 3,
              }}
            >
              <MenuBookOutlinedIcon sx={{ fontSize: 42, color: '#f5edd5' }} />
            </Box>

            <Typography variant="overline" sx={{ letterSpacing: 2.4, color: '#d8e2ef', fontWeight: 700 }}>
              CONCURSEIRO
            </Typography>

            <Typography variant="h3" fontWeight={800} mt={1} mb={2}>
              Painel administrativo
            </Typography>

            <Typography variant="h6" sx={{ opacity: 0.9, lineHeight: 1.65, maxWidth: 520 }}>
              Ambiente interno para organização, revisão e acompanhamento da base de questões do projeto.
            </Typography>

            <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.14)' }} />

            <Stack spacing={1.75}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CheckCircleOutlineIcon sx={{ color: '#b8cbbd' }} />
                <Typography sx={{ opacity: 0.92 }}>
                  Curadoria e padronização do conteúdo.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <CheckCircleOutlineIcon sx={{ color: '#b8cbbd' }} />
                <Typography sx={{ opacity: 0.92 }}>
                  Organização de provas, bancas, disciplinas e assuntos.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <CheckCircleOutlineIcon sx={{ color: '#b8cbbd' }} />
                <Typography sx={{ opacity: 0.92 }}>
                  Acesso restrito a usuários autorizados.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Card
            elevation={0}
            sx={{
              borderRadius: 0,
              minHeight: { md: 680 },
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'transparent',
            }}
          >
            <CardContent sx={{ width: '100%', p: { xs: 3, sm: 6 } }}>
              <Box sx={{ maxWidth: 420, mx: 'auto', width: '100%' }}>
                <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: '#eef2f7',
                      color: '#1e344d',
                      border: '1px solid #dde5ee',
                    }}
                  >
                    <MenuBookOutlinedIcon />
                  </Box>
                </Box>

                <Typography variant="overline" sx={{ letterSpacing: 2, color: 'text.secondary', fontWeight: 700 }}>
                  ACESSO INTERNO
                </Typography>

                <Typography variant="h4" fontWeight={800} mt={1} mb={1}>
                  Entrar no painel
                </Typography>

                <Typography color="text.secondary" mb={4} sx={{ lineHeight: 1.65 }}>
                  Use suas credenciais autorizadas para acessar a administração do Concurseiro.
                </Typography>

                {erro && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {erro}
                  </Alert>
                )}

                <Box
                  component="form"
                  onSubmit={handleSubmit(onSubmit)}
                  display="flex"
                  flexDirection="column"
                  gap={2.5}
                >
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    autoComplete="email"
                    {...register('email')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        bgcolor: '#fff',
                      },
                    }}
                  />

                  <TextField
                    label="Senha"
                    type="password"
                    fullWidth
                    required
                    autoComplete="current-password"
                    {...register('senha')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        bgcolor: '#fff',
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      mt: 1,
                      height: 52,
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      boxShadow: '0 12px 28px rgba(30, 52, 77, 0.24)',
                    }}
                  >
                    {isSubmitting ? 'Validando acesso...' : 'Acessar painel'}
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  mt={3}
                >
                  Precisa de acesso administrativo?{' '}
                  <Box
                    component={Link}
                    href="/cadastro"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Solicitar acesso
                  </Box>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
