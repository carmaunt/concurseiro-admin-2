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
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { api } from '@/services/api';

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

    try {
      const response = await api.post('/api/v1/auth/login', {
        email: data.email,
        senha: data.senha,
      });

      const accessToken = response.data?.data?.accessToken;
      const refreshToken = response.data?.data?.refreshToken;
      const email = response.data?.data?.email;

      if (!accessToken) {
        setErro('Token não encontrado na resposta.');
        return;
      }

      localStorage.setItem('token', accessToken);

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      if (email) {
        localStorage.setItem('userEmail', email);
      }

      router.push('/questoes');
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401) {
        setErro('Email ou senha inválidos.');
        return;
      }

      if (status === 403) {
        setErro('Usuário ainda não aprovado pelo administrador.');
        return;
      }

      setErro('Não foi possível realizar o login.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #f4f6fb 0%, #eef2ff 50%, #f8fafc 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
            bgcolor: '#fff',
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              p: 7,
              color: '#fff',
              background:
                'linear-gradient(160deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.14)',
                mb: 3,
              }}
            >
              <ShieldOutlinedIcon fontSize="large" />
            </Box>

            <Typography variant="h3" fontWeight={700} mb={2}>
              Admin Panel
            </Typography>

            <Typography variant="h6" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
              Acesse o painel administrativo com segurança e gerencie usuários,
              questões e provas em um só lugar.
            </Typography>

            <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.16)' }} />

            <Stack spacing={1.25}>
              <Typography sx={{ opacity: 0.9 }}>
                • Aprovação e gerenciamento de usuários
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>
                • Controle de questões e provas
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>
                • Acesso autenticado com JWT
              </Typography>
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
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: '#e8f0fe',
                      color: '#1d4ed8',
                    }}
                  >
                    <ShieldOutlinedIcon />
                  </Box>
                </Box>

                <Typography variant="h4" fontWeight={700} mb={1}>
                  Entrar
                </Typography>

                <Typography color="text.secondary" mb={4}>
                  Informe suas credenciais para acessar o painel.
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
                      boxShadow: '0 10px 24px rgba(37, 99, 235, 0.28)',
                    }}
                  >
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  mt={3}
                >
                  Ainda não tem acesso?{' '}
                  <Box
                    component={Link}
                    href="/cadastro"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Solicitar cadastro
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