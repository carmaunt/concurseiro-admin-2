// src/app/(auth)/cadastro/page.tsx
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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { api } from '@/services/api';

type FormData = {
  nome: string;
  email: string;
  senha: string;
  repetirSenha: string;
};

export default function CadastroPage() {
  const router = useRouter();
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setErro('');
    setSucesso('');

    if (data.senha !== data.repetirSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      await api.post('/api/v1/auth/register', {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
      });

      setSucesso('Solicitação enviada com sucesso. Aguarde a aprovação do administrador.');

      setTimeout(() => {
        router.push('/login');
      }, 1800);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 400) {
        setErro('Dados inválidos ou email já cadastrado.');
        return;
      }

      setErro('Não foi possível realizar o cadastro.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f6f8fb',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Box textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#e8f0fe',
                color: '#1565c0',
              }}
            >
              <HowToRegOutlinedIcon fontSize="large" />
            </Box>

            <Typography variant="h4" fontWeight={700}>
              Solicitar acesso
            </Typography>

            <Typography color="text.secondary" mt={1}>
              Preencha seus dados para entrar na fila de aprovação do painel administrativo.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              alignItems="stretch"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Como funciona
                </Typography>

                <Stack spacing={2}>
                  <Box display="flex" gap={1.5}>
                    <CheckCircleOutlineIcon color="primary" />
                    <Box>
                      <Typography fontWeight={600}>1. Envie seu cadastro</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Informe nome, email e senha para criar sua solicitação.
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1.5}>
                    <CheckCircleOutlineIcon color="primary" />
                    <Box>
                      <Typography fontWeight={600}>2. Aguarde aprovação</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sua conta será criada como visitante e ficará pendente.
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1.5}>
                    <CheckCircleOutlineIcon color="primary" />
                    <Box>
                      <Typography fontWeight={600}>3. Acesse o painel</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Após aprovação do administrador, o login será liberado.
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Card
                elevation={0}
                sx={{
                  flex: 1.2,
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                  bgcolor: '#fcfcfd',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>
                    Dados de acesso
                  </Typography>

                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Todos os novos usuários entram como visitante até aprovação.
                  </Typography>

                  {erro && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                      {erro}
                    </Alert>
                  )}

                  {sucesso && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                      {sucesso}
                    </Alert>
                  )}

                  <Box
                    component="form"
                    onSubmit={handleSubmit(onSubmit)}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                  >
                    <TextField
                      label="Nome completo"
                      fullWidth
                      required
                      {...register('nome')}
                    />

                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      required
                      {...register('email')}
                    />

                    <TextField
                      label="Senha"
                      type="password"
                      fullWidth
                      required
                      {...register('senha')}
                    />

                    <TextField
                      label="Repetir senha"
                      type="password"
                      fullWidth
                      required
                      {...register('repetirSenha')}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isSubmitting}
                      sx={{
                        mt: 1,
                        height: 48,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                      }}
                    >
                      {isSubmitting ? 'Enviando...' : 'Solicitar cadastro'}
                    </Button>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    mt={3}
                  >
                    Já possui acesso?{' '}
                    <Box
                      component={Link}
                      href="/login"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Ir para login
                    </Box>
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}