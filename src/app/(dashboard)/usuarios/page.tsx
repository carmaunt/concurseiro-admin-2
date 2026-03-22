// src/app/(dashboard)/usuarios/page.tsx
'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { api } from '@/services/api';

type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: 'ADMIN' | 'VISITANTE';
  status: 'ATIVO' | 'PENDENTE';
};

type UsuariosResponse = {
  content: Usuario[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

export default function UsuariosPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<UsuariosResponse>({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/usuarios?page=0&size=20');
      return res.data?.data ?? res.data;
    },
  });

  const ativarUsuario = useMutation({
    mutationFn: (id: number) => api.patch(`/api/v1/admin/usuarios/${id}/ativar`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const deletarUsuario = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/admin/usuarios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const usuarios = data?.content ?? [];

  const stats = useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter((u) => u.status === 'ATIVO').length;
    const pendentes = usuarios.filter((u) => u.status === 'PENDENTE').length;
    const admins = usuarios.filter((u) => u.role === 'ADMIN').length;

    return { total, ativos, pendentes, admins };
  }, [usuarios]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Não foi possível carregar os usuários.</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f6f8fb', minHeight: '100%' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Usuários
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Gerencie aprovações e acompanhe os usuários cadastrados.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GroupOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.total}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VerifiedUserOutlinedIcon color="success" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ativos
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.ativos}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PendingActionsOutlinedIcon sx={{ color: '#ed6c02' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pendentes
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.pendentes}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e8edf3',
              bgcolor: '#fff',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VerifiedUserOutlinedIcon sx={{ color: '#1565c0' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Admins
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.admins}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid #e8edf3',
            overflow: 'hidden',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid #eef2f7' }}>
            <Typography variant="h6" fontWeight={700}>
              Lista de usuários
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registros mais recentes primeiro.
            </Typography>
          </Box>

          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell><strong>Nome</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      Nenhum usuário encontrado.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                            label={user.role === 'ADMIN' ? 'Admin' : 'Visitante'}
                            size="small"
                            sx={{
                                minWidth: 100,
                                px: 1,
                                justifyContent: 'center',
                                fontWeight: 600,
                                ...(user.role === 'ADMIN'
                                ? {
                                    backgroundColor: '#1976d2',
                                    color: '#fff',
                                    }
                                : {
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #e2e8f0',
                                    }),
                            }}
                       />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status === 'ATIVO' ? 'Ativo' : 'Pendente'}
                        size="small"
                        sx={{
                            minWidth: 100,
                            px: 1,
                            justifyContent: 'center',
                            fontWeight: 600,
                            ...(user.status === 'ATIVO'
                            ? {
                                backgroundColor: '#2e7d32',
                                color: '#fff',
                                }
                            : {
                                backgroundColor: '#fff7ed',
                                color: '#c2410c',
                                border: '1px solid #fed7aa',
                                }),
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {user.status === 'PENDENTE' && (
                          <Tooltip title="Ativar usuário">
                            <IconButton
                              color="success"
                              onClick={() => ativarUsuario.mutate(user.id)}
                              disabled={ativarUsuario.isPending}
                            >
                              <CheckCircleOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Excluir usuário">
                          <IconButton
                            color="error"
                            onClick={() => deletarUsuario.mutate(user.id)}
                            disabled={deletarUsuario.isPending}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Box>
  );
}