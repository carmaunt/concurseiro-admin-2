'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  IconButton, InputLabel, MenuItem, Paper, Select, Snackbar, Stack, Table, TableBody,
  TableCell, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/services/api';
import {
  alterarStatusCategoria, alterarStatusTag, atualizarCategoria, atualizarTag, criarCategoria,
  criarTag, listarCategorias, listarTags, type TaxonomiaFilters,
} from '@/services/taxonomiasService';
import type { TaxonomiaStatus } from '@/types/api';

type TaxonomyItem = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  status: TaxonomiaStatus;
  quantidadeConteudos: number;
};

type Props = { kind: 'categoria' | 'tag' };

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function TaxonomyManager({ kind }: Props) {
  const isCategoria = kind === 'categoria';
  const singular = isCategoria ? 'categoria' : 'tag';
  const plural = isCategoria ? 'Categorias' : 'Tags';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<TaxonomiaFilters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaxonomyItem | null>(null);
  const [form, setForm] = useState({ nome: '', slug: '', descricao: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryKey = useMemo(() => ['taxonomias', kind, page, size, filters], [kind, page, size, filters]);

  const query = useQuery({
    queryKey,
    queryFn: () => isCategoria ? listarCategorias(page, size, filters) : listarTags(page, size, filters),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome, slug: form.slug, ...(isCategoria ? { descricao: form.descricao } : {}) };
      if (isCategoria) return editing ? atualizarCategoria(editing.id, payload) : criarCategoria(payload);
      return editing ? atualizarTag(editing.id, payload) : criarTag(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomias'] });
      setDialogOpen(false);
      setFeedback({ type: 'success', message: `${isCategoria ? 'Categoria' : 'Tag'} ${editing ? 'atualizada' : 'criada'} com sucesso.` });
    },
    onError: (error) => setFeedback({ type: 'error', message: getApiErrorMessage(error, `Não foi possível salvar a ${singular}.`) }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaxonomiaStatus }) => isCategoria
      ? alterarStatusCategoria(id, status) : alterarStatusTag(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taxonomias'] });
      setFeedback({ type: 'success', message: `${isCategoria ? 'Categoria' : 'Tag'} ${variables.status === 'ATIVA' ? 'reativada' : 'arquivada'}.` });
    },
    onError: (error) => setFeedback({ type: 'error', message: getApiErrorMessage(error, `Não foi possível alterar a ${singular}.`) }),
  });

  const items = (query.data?.content ?? []) as TaxonomyItem[];
  const total = query.data?.page?.totalElements ?? 0;

  function openNew() {
    setEditing(null);
    setForm({ nome: '', slug: '', descricao: '' });
    setSlugTouched(false);
    setDialogOpen(true);
  }

  function openEdit(item: TaxonomyItem) {
    setEditing(item);
    setForm({ nome: item.nome, slug: item.slug, descricao: item.descricao ?? '' });
    setSlugTouched(true);
    setDialogOpen(true);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, bgcolor: '#f6f8fb', minHeight: '100%' }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800}>{plural}</Typography>
            <Typography color="text.secondary" mt={0.5}>Organize a classificação editorial usada nos conteúdos do portal.</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew} sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#1e344d' }}>
            Nova {singular}
          </Button>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e8edf3' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label={`Buscar ${singular}`} fullWidth value={filters.q ?? ''} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, q: event.target.value })); }} />
            <FormControl fullWidth>
              <InputLabel id={`${kind}-status-filter-label`}>Status</InputLabel>
              <Select id={`${kind}-status-filter`} labelId={`${kind}-status-filter-label`} label="Status" value={filters.status ?? ''} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, status: event.target.value as TaxonomiaStatus | '' })); }}>
                <MenuItem value="">Todos</MenuItem><MenuItem value="ATIVA">Ativas</MenuItem><MenuItem value="ARQUIVADA">Arquivadas</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {query.isError ? <Alert severity="error">{getApiErrorMessage(query.error, `Não foi possível carregar ${plural.toLowerCase()}.`)}</Alert> : query.isLoading ? (
          <Paper elevation={0} sx={{ minHeight: 220, border: '1px solid #e8edf3', display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={32} aria-label={`Carregando ${plural.toLowerCase()}`} />
          </Paper>
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {items.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, border: '1px solid #e8edf3', textAlign: 'center' }}>
                <Typography color="text.secondary">Nenhuma {singular} encontrada.</Typography>
              </Paper>
            ) : items.map((item) => (
              <Paper key={item.id} elevation={0} sx={{ p: 2, border: '1px solid #e8edf3' }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800}>{item.nome}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>/{item.slug}</Typography>
                    </Box>
                    <Chip size="small" color={item.status === 'ATIVA' ? 'success' : 'default'} label={item.status === 'ATIVA' ? 'Ativa' : 'Arquivada'} />
                  </Stack>
                  {isCategoria && item.descricao ? <Typography variant="body2" color="text.secondary">{item.descricao}</Typography> : null}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">{item.quantidadeConteudos} {item.quantidadeConteudos === 1 ? 'conteúdo' : 'conteúdos'}</Typography>
                    <Stack direction="row">
                      <IconButton aria-label={`Editar ${item.nome}`} onClick={() => openEdit(item)} color="primary"><EditOutlinedIcon /></IconButton>
                      <IconButton aria-label={`${item.status === 'ATIVA' ? 'Arquivar' : 'Reativar'} ${item.nome}`} color={item.status === 'ATIVA' ? 'default' : 'primary'} onClick={() => statusMutation.mutate({ id: item.id, status: item.status === 'ATIVA' ? 'ARQUIVADA' : 'ATIVA' })}>{item.status === 'ATIVA' ? <ArchiveOutlinedIcon /> : <UnarchiveOutlinedIcon />}</IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {items.length > 0 ? <Paper elevation={0} sx={{ border: '1px solid #e8edf3' }}><TablePagination component="div" count={total} page={query.data?.page?.number ?? page} rowsPerPage={query.data?.page?.size ?? size} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => { setSize(Number(event.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} labelRowsPerPage="Itens por página" sx={{ '.MuiTablePagination-selectLabel, .MuiTablePagination-input': { display: 'none' }, '.MuiTablePagination-toolbar': { px: 1 } }} /></Paper> : null}
          </Stack>
        ) : (
          <Paper elevation={0} sx={{ border: '1px solid #e8edf3', overflowX: 'auto', bgcolor: '#fff' }}>
            <Table sx={{ minWidth: 680 }}>
              <TableHead><TableRow sx={{ bgcolor: '#fafbfc' }}><TableCell><strong>Nome</strong></TableCell><TableCell><strong>Slug</strong></TableCell><TableCell><strong>Status</strong></TableCell><TableCell><strong>Conteúdos</strong></TableCell><TableCell align="right"><strong>Ações</strong></TableCell></TableRow></TableHead>
              <TableBody>
                {items.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">Nenhuma {singular} encontrada.</Typography></TableCell></TableRow> : items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell><Typography fontWeight={700}>{item.nome}</Typography>{isCategoria && item.descricao ? <Typography variant="body2" color="text.secondary">{item.descricao}</Typography> : null}</TableCell>
                    <TableCell>/{item.slug}</TableCell>
                    <TableCell><Chip size="small" color={item.status === 'ATIVA' ? 'success' : 'default'} label={item.status === 'ATIVA' ? 'Ativa' : 'Arquivada'} /></TableCell>
                    <TableCell>{item.quantidadeConteudos}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar"><IconButton aria-label={`Editar ${item.nome}`} onClick={() => openEdit(item)} color="primary"><EditOutlinedIcon /></IconButton></Tooltip>
                      <Tooltip title={item.status === 'ATIVA' ? 'Arquivar' : 'Reativar'}><IconButton aria-label={`${item.status === 'ATIVA' ? 'Arquivar' : 'Reativar'} ${item.nome}`} color={item.status === 'ATIVA' ? 'default' : 'primary'} onClick={() => statusMutation.mutate({ id: item.id, status: item.status === 'ATIVA' ? 'ARQUIVADA' : 'ATIVA' })}>{item.status === 'ATIVA' ? <ArchiveOutlinedIcon /> : <UnarchiveOutlinedIcon />}</IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {items.length > 0 ? <TablePagination component="div" count={total} page={query.data?.page?.number ?? page} rowsPerPage={query.data?.page?.size ?? size} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => { setSize(Number(event.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} labelRowsPerPage="Itens por página" /> : null}
          </Paper>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={submit}>
          <DialogTitle>{editing ? `Editar ${singular}` : `Nova ${singular}`}</DialogTitle>
          <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nome" required value={form.nome} onChange={(event) => { const nome = event.target.value; setForm((current) => ({ ...current, nome, slug: slugTouched ? current.slug : slugify(nome) })); }} />
            <TextField label="Slug" required value={form.slug} helperText="Usado nas URLs e integrações" onChange={(event) => { setSlugTouched(true); setForm((current) => ({ ...current, slug: slugify(event.target.value) })); }} />
            {isCategoria ? <TextField label="Descrição" multiline minRows={3} value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} /> : null}
          </Stack></DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" variant="contained" disabled={saveMutation.isPending} sx={{ bgcolor: '#1e344d', fontWeight: 700 }}>{saveMutation.isPending ? 'Salvando...' : 'Salvar'}</Button></DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={Boolean(feedback)} autoHideDuration={4500} onClose={() => setFeedback(null)}>{feedback ? <Alert severity={feedback.type} onClose={() => setFeedback(null)}>{feedback.message}</Alert> : undefined}</Snackbar>
    </Box>
  );
}
