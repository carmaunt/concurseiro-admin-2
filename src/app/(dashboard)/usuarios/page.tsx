// src/app/(dashboard)/usuarios/page.tsx
'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
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
type TipoContaFilter = 'PAINEL' | 'APP';
type RoleFilter = '' | 'ADMIN' | 'VISITANTE' | 'USUARIO_FINAL';
type StatusFilter = '' | 'ATIVO' | 'PENDENTE';

function getRoleLabel(role: string) {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'VISITANTE') return 'Visitante';
  if (role === 'USUARIO_FINAL') return 'Usuário do App';
  return role;
}

function getTipoContaLabel(tipoConta?: string, role?: string) {
  const resolved = tipoConta ?? (role === 'USUARIO_FINAL' ? 'APP' : 'PAINEL');

  if (resolved === 'APP') return 'App';
  if (resolved === 'PAINEL') return 'Painel';
  return resolved;
}

function getRoleStyle(role: string) {
  if (role === 'ADMIN') {
    return { backgroundColor: '#1976d2', color: '#fff' };
  }

  if (role === 'USUARIO_FINAL') {
    return { backgroundColor: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9' };
  }

  return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
}

function getTipoContaStyle(tipoConta?: string, role?: string) {
  const resolved = tipoConta ?? (role === 'USUARIO_FINAL' ? 'APP' : 'PAINEL');

  if (resolved === 'APP') {
    return { backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' };
  }

  return { backgroundColor: '#ecfeff', color: '#155e75', border: '1px solid #a5f3fc' };
}

function getTotalElements(data: unknown, fallback: number) {
  if (!data || typeof data !== 'object') return fallback;

  const page = 'page' in data ? (data as { page?: { totalElements?: number } }).page : undefined;
  const rootTotal = 'totalElements' in data ? (data as { totalElements?: number }).totalElements : undefined;

  return page?.totalElements ?? rootTotal ?? fallback;
}

export default function UsuariosPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [tipoConta, setTipoConta] = useState<TipoContaFilter>('PAINEL');
  const [role, setRole] = useState<RoleFilter>('');
  const [status, setStatus] = useState<StatusFilter>('');

  const { data, isLoading, isError, error, refetch } = useUsuarios({
    page,
    size: rowsPerPage,
    tipoConta,
    role: role || undefined,
    status: status || undefined,
  });

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
  const totalElements = getTotalElements(data, usuarios.length);

  const stats = useMemo(() => {
    const total = totalElements;
    const ativos = usuarios.filter((u) => u.status === 'ATIVO').length;
    const pendentes = usuarios.filter((u) => u.status === 'PENDENTE').length;
    const admins = usuarios.filter((u) => u.role === 'ADMIN').length;

    return { total, ativos, pendentes, admins };
  }, [usuarios, totalElements]);

  const confirmarExclusao = () => {
    if (!usuarioParaExcluir) return;
    deletarUsuario.mutate(usuarioParaExcluir);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTipoContaChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTipoConta(event.target.value as TipoContaFilter);
    setRole('');
    setPage(0);
  };

  const handleRoleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRole(event.target.value as RoleFilter);
    setPage(0);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStatus(event.target.value as StatusFilter);
    setPage(0);
  };

  const filtroDescricao =
    tipoConta === 'PAINEL'
      ? 'Mostrando usuários do painel administrativo.'
      : 'Mostrando usuários finais cadastrados pelo app.';

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
            Gerencie aprovações, usuários do painel e usuários finais do app.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Filtros
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                fullWidth
                label="Tipo de conta"
                value={tipoConta}
                onChange={handleTipoContaChange}
              >
                <MenuItem value="PAINEL">Painel: admins e visitantes</MenuItem>
                <MenuItem value="APP">App: usuários finais</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="Perfil"
                value={role}
                onChange={handleRoleChange}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="VISITANTE">Visitante</MenuItem>
                <MenuItem value="USUARIO_FINAL">Usuário do App</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="Status"
                value={status}
                onChange={handleStatusChange}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ATIVO">Ativo</MenuItem>
                <MenuItem value="PENDENTE">Pendente</MenuItem>
              </TextField>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {filtroDescricao}
            </Typography>
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GroupOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">Total no filtro</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VerifiedUserOutlinedIcon color="success" />
              <Box>
                <Typography variant="body2" color="text.secondary">Ativos nesta página</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.ativos}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PendingActionsOutlinedIcon sx={{ color: '#ed6c02' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Pendentes nesta página</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.pendentes}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VerifiedUserOutlinedIcon sx={{ color: '#1565c0' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Admins nesta página</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.admins}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        <ListPanel title="Lista de usuários" description="Registros mais recentes primeiro.">
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell><strong>Nome</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Conta</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {usuarios.length === 0 ? (
                <ListTableEmptyState
                  colSpan={6}
                  title="Nenhum usuário encontrado."
                  description="Altere os filtros para consultar usuários do painel ou usuários finais do app."
                />
              ) : (
                usuarios.map((user) => {
                  const isUsuarioFinal = user.role === 'USUARIO_FINAL' || user.tipoConta === 'APP';
                  const podeGerenciar = !isUsuarioFinal && user.role !== 'ADMIN';

                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getTipoContaLabel(user.tipoConta, user.role)}
                          size="small"
                          sx={{
                            minWidth: 90,
                            px: 1,
                            justifyContent: 'center',
                            fontWeight: 600,
                            ...getTipoContaStyle(user.tipoConta, user.role),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(user.role)}
                          size="small"
                          sx={{
                            minWidth: 120,
                            px: 1,
                            justifyContent: 'center',
                            fontWeight: 600,
                            ...getRoleStyle(user.role),
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
                        {podeGerenciar ? (
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
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Itens por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
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
