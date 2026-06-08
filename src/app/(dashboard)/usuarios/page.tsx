// src/app/(dashboard)/usuarios/page.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
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
import {
  ConfirmDeleteDialog,
  FeedbackSnackbar,
  ListPanel,
  ListPageState,
  ListTableEmptyState,
} from '@/components/listing/ListLayout';
import { useAtivarUsuario, useExcluirUsuario, useUsuarios } from '@/hooks/useUsuarios';
import { getApiErrorMessage } from '@/services/api';

type Feedback = { type: 'success' | 'error'; message: string } | null;

export default function UsuariosPage() {
  const { data, isLoading, isError, error, refetch } = useUsuarios();
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const ativarUsuario = useAtivarUsuario({
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Usuário ativado com sucesso.' });
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Não foi possível ativar o usuário.'),
      });
    },
  });

  const deletarUsuario = useExcluirUsuario({
    onSuccess: () => {
      setUsuarioParaExcluir(null);
      setFeedback({ type: 'success', message: 'Usuário excluído com sucesso.' });
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Não foi possível excluir o usuário.'),
      });
    },
  });

  const usuarios = useMemo(() => data?.content ?? [], [data?.content]);

  const stats = useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter((u) => u.status === 'ATIVO').length;
    const pendentes = usuarios.filter((u) => u.status === 'PENDENTE').length;
    const admins = usuarios.filter((u) => u.role === 'ADMIN').length;

    return { total, ativos, pendentes, admins };
  }, [usuarios]);

  const confirmarExclusao = () => {
    if (!usuarioParaExcluir) return;
    deletarUsuario.mutate(usuarioParaExcluir);
  };

  if (isLoading) {
    return (
      <ListPageState
        type="loading"
        title="Carregando usuários"
        message="Buscando usuários cadastrados e seus status de aprovação."
      />
    );
  }

  if (isError) {
    return (
      <ListPageState
        type="error"
        title="Erro ao carregar usuários"
        message={getApiErrorMessage(error, 'Não foi possível carregar os usuários.')}
        action={
          <Button variant="contained" onClick={() => refetch()} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f6f8fb', minHeight: '100%' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Usuários
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Gerencie aprovações e acompanhe os usuários cadastrados.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GroupOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">Total</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VerifiedUserOutlinedIcon color="success" />
              <Box>
                <Typography variant="body2" color="text.secondary">Ativos</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.ativos}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PendingActionsOutlinedIcon sx={{ color: '#ed6c02' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Pendentes</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.pendentes}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VerifiedUserOutlinedIcon sx={{ color: '#1565c0' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Admins</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.admins}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        <ListPanel title="Lista de usuários" description="Registros mais recentes primeiro.">
          <Table sx={{ minWidth: 720 }}>
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
                <ListTableEmptyState
                  colSpan={5}
                  title="Nenhum usuário encontrado."
                  description="Quando novos usuários se cadastrarem, eles aparecerão aqui para acompanhamento e aprovação."
                />
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
                            ? { backgroundColor: '#1976d2', color: '#fff' }
                            : { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }),
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
                            ? { backgroundColor: '#2e7d32', color: '#fff' }
                            : { backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }),
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {user.status === 'PENDENTE' && (
                          <Tooltip title="Ativar usuário">
                            <span>
                              <IconButton
                                color="success"
                                onClick={() => ativarUsuario.mutate(user.id)}
                                disabled={ativarUsuario.isPending || deletarUsuario.isPending}
                              >
                                <CheckCircleOutlineIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        <Tooltip title="Excluir usuário">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => setUsuarioParaExcluir(user.id)}
                              disabled={deletarUsuario.isPending || ativarUsuario.isPending}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ListPanel>
      </Stack>

      <ConfirmDeleteDialog
        open={Boolean(usuarioParaExcluir)}
        title="Excluir usuário?"
        description="Essa ação remove o acesso do usuário selecionado e não pode ser desfeita."
        isPending={deletarUsuario.isPending}
        onClose={() => setUsuarioParaExcluir(null)}
        onConfirm={confirmarExclusao}
      />

      <FeedbackSnackbar feedback={feedback} onClose={() => setFeedback(null)} />
    </Box>
  );
}
