'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined';
import { getApiErrorMessage } from '@/services/api';
import type { ConteudoPortal, ConteudoStatus, ConteudoTipo } from '@/types/api';
import { useAlterarStatusConteudo, useConteudos, useExcluirConteudo, useSalvarConteudo } from '@/hooks/useConteudos';
import { useCategoriasAtivas, useTagsAtivas } from '@/hooks/useTaxonomias';
import type { ConteudoPayload, ConteudosFilters } from '@/services/conteudosService';

const tipos: Array<{ value: ConteudoTipo; label: string }> = [
  { value: 'NOTICIA', label: 'Notícia' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'CONCURSO_ABERTO', label: 'Concurso aberto' },
  { value: 'EDITAL_PREVISTO', label: 'Edital previsto' },
];

const emptyForm: ConteudoPayload = {
  titulo: '',
  slug: '',
  resumo: '',
  conteudo: '',
  imagemCapa: '',
  categoriaId: null,
  tagIds: [],
  status: 'RASCUNHO',
  tipo: 'NOTICIA',
  destaque: false,
  seoTitulo: '',
  seoDescricao: '',
};

function tipoLabel(tipo: ConteudoTipo) {
  return tipos.find((item) => item.value === tipo)?.label ?? tipo;
}

function statusColor(status: ConteudoStatus) {
  return status === 'PUBLICADO' ? 'success' : 'default';
}

function toPayload(conteudo: ConteudoPortal): ConteudoPayload {
  return {
    titulo: conteudo.titulo,
    slug: conteudo.slug,
    resumo: conteudo.resumo,
    conteudo: conteudo.conteudo,
    imagemCapa: conteudo.imagemCapa ?? '',
    categoriaId: conteudo.category?.id ?? null,
    tagIds: conteudo.tags.map((tag) => tag.id),
    status: conteudo.status,
    tipo: conteudo.tipo,
    destaque: conteudo.destaque,
    seoTitulo: conteudo.seoTitulo ?? '',
    seoDescricao: conteudo.seoDescricao ?? '',
  };
}

export default function ConteudosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<ConteudosFilters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ConteudoPortal | null>(null);
  const [form, setForm] = useState<ConteudoPayload>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const queryFilters = useMemo(() => filters, [filters]);
  const { data, isLoading, isError, error } = useConteudos(page, size, queryFilters);
  const categoriasQuery = useCategoriasAtivas();
  const tagsQuery = useTagsAtivas();

  const salvar = useSalvarConteudo({
    onSuccess: () => {
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback({ type: 'success', message: 'Conteúdo salvo com sucesso.' });
    },
    onError: (error) => setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Não foi possível salvar o conteúdo.') }),
  });

  const alterarStatus = useAlterarStatusConteudo({
    onSuccess: () => setFeedback({ type: 'success', message: 'Status atualizado.' }),
    onError: (error) => setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Não foi possível atualizar o status.') }),
  });

  const excluir = useExcluirConteudo({
    onSuccess: () => setFeedback({ type: 'success', message: 'Conteúdo excluído.' }),
    onError: (error) => setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Não foi possível excluir o conteúdo.') }),
  });

  const conteudos = data?.content ?? [];
  const totalElements = data?.page?.totalElements ?? 0;
  const categoriasDisponiveis = useMemo(() => {
    const categorias = [...(categoriasQuery.data ?? [])];
    if (editing?.category && !categorias.some((item) => item.id === editing.category?.id)) categorias.push(editing.category);
    return categorias;
  }, [categoriasQuery.data, editing]);
  const tagsDisponiveis = useMemo(() => {
    const tags = [...(tagsQuery.data ?? [])];
    editing?.tags.forEach((tag) => {
      if (!tags.some((item) => item.id === tag.id)) tags.push(tag);
    });
    return tags;
  }, [tagsQuery.data, editing]);

  function abrirNovo() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function abrirEdicao(conteudo: ConteudoPortal) {
    setEditing(conteudo);
    setForm(toPayload(conteudo));
    setDialogOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    salvar.mutate({ id: editing?.id, payload: form });
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">{getApiErrorMessage(error, 'Não foi possível carregar os conteúdos.')}</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 }, backgroundColor: '#f6f8fb', minHeight: '100%' }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Conteúdos</Typography>
            <Typography color="text.secondary" mt={0.5}>Gerencie notícias, blog, concursos abertos e editais previstos do portal público.</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, bgcolor: '#1e344d' }}>
            Novo conteúdo
          </Button>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e8edf3' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Buscar"
              value={filters.q ?? ''}
              onChange={(event) => {
                setPage(0);
                setFilters((current) => ({ ...current, q: event.target.value }));
              }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={filters.tipo ?? ''}
                onChange={(event) => {
                  setPage(0);
                  setFilters((current) => ({ ...current, tipo: event.target.value as ConteudoTipo | '' }));
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {tipos.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status ?? ''}
                onChange={(event) => {
                  setPage(0);
                  setFilters((current) => ({ ...current, status: event.target.value as ConteudoStatus | '' }));
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="RASCUNHO">Rascunho</MenuItem>
                <MenuItem value="PUBLICADO">Publicado</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', overflow: 'hidden', bgcolor: '#fff' }}>
          {isMobile ? (
            <Stack spacing={1.5} sx={{ p: 1.5 }}>
              {conteudos.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}><Typography color="text.secondary">Nenhum conteúdo encontrado.</Typography></Box>
              ) : conteudos.map((item) => (
                <Paper key={item.id} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                  <Stack spacing={1.2}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800}>{item.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary">{tipoLabel(item.tipo)} · /{item.slug}</Typography>
                      </Box>
                      <Chip size="small" label={item.status} color={statusColor(item.status)} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{item.resumo}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button fullWidth variant="outlined" onClick={() => abrirEdicao(item)} sx={{ textTransform: 'none' }}>Editar</Button>
                      <Button fullWidth variant="outlined" color="error" onClick={() => excluir.mutate(item.id)} sx={{ textTransform: 'none' }}>Excluir</Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbfc' }}>
                  <TableCell><strong>Título</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Destaque</strong></TableCell>
                  <TableCell><strong>Slug</strong></TableCell>
                  <TableCell align="right"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conteudos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Nenhum conteúdo encontrado.</Typography>
                    </TableCell>
                  </TableRow>
                ) : conteudos.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{item.titulo}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.category?.nome || item.categoria || 'Sem categoria'}</Typography>
                    </TableCell>
                    <TableCell>{tipoLabel(item.tipo)}</TableCell>
                    <TableCell><Chip size="small" label={item.status} color={statusColor(item.status)} /></TableCell>
                    <TableCell>{item.destaque ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>/{item.slug}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => abrirEdicao(item)}><EditOutlinedIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title={item.status === 'PUBLICADO' ? 'Despublicar' : 'Publicar'}>
                        <IconButton
                          color="primary"
                          onClick={() => alterarStatus.mutate({ id: item.id, status: item.status === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO' })}
                        >
                          {item.status === 'PUBLICADO' ? <UnpublishedOutlinedIcon /> : <PublishOutlinedIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton color="error" onClick={() => excluir.mutate(item.id)}><DeleteOutlineIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {conteudos.length > 0 && (
            <TablePagination
              component="div"
              count={totalElements}
              page={data?.page?.number ?? page}
              rowsPerPage={data?.page?.size ?? size}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Itens por página"
            />
          )}
        </Paper>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editing ? 'Editar conteúdo' : 'Novo conteúdo'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth required>
                  <InputLabel id="conteudo-tipo-label">Tipo</InputLabel>
                  <Select id="conteudo-tipo" labelId="conteudo-tipo-label" label="Tipo" value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as ConteudoTipo }))}>
                    {tipos.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel id="conteudo-status-label">Status</InputLabel>
                  <Select id="conteudo-status" labelId="conteudo-status-label" label="Status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ConteudoStatus }))}>
                    <MenuItem value="RASCUNHO">Rascunho</MenuItem>
                    <MenuItem value="PUBLICADO">Publicado</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TextField label="Título" required value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} />
              <TextField label="Slug" helperText="Opcional. Se vazio, será gerado pelo backend." value={form.slug ?? ''} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <TextField label="Resumo" required multiline minRows={2} value={form.resumo} onChange={(event) => setForm((current) => ({ ...current, resumo: event.target.value }))} />
              <TextField label="Conteúdo" required multiline minRows={8} value={form.conteudo} onChange={(event) => setForm((current) => ({ ...current, conteudo: event.target.value }))} />

              <FormControl fullWidth>
                <InputLabel id="conteudo-categoria-label">Categoria</InputLabel>
                <Select
                  id="conteudo-categoria"
                  labelId="conteudo-categoria-label"
                  label="Categoria"
                  value={form.categoriaId ?? 0}
                  onChange={(event) => setForm((current) => ({ ...current, categoriaId: Number(event.target.value) || null }))}
                  disabled={categoriasQuery.isLoading}
                >
                  <MenuItem value={0}><em>Sem categoria</em></MenuItem>
                  {categoriasDisponiveis.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}{editing?.category?.id === categoria.id && !categoriasQuery.data?.some((item) => item.id === categoria.id) ? ' (arquivada)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                multiple
                options={tagsDisponiveis}
                value={tagsDisponiveis.filter((tag) => form.tagIds?.includes(tag.id))}
                getOptionLabel={(option) => option.nome}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, values) => setForm((current) => ({ ...current, tagIds: values.map((tag) => tag.id) }))}
                loading={tagsQuery.isLoading}
                renderInput={(params) => <TextField {...params} label="Tags" helperText="Selecione tags já cadastradas" />}
              />

              <TextField label="Imagem de capa" helperText="URL da imagem. Upload fica para a próxima evolução." value={form.imagemCapa ?? ''} onChange={(event) => setForm((current) => ({ ...current, imagemCapa: event.target.value }))} />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Título SEO" fullWidth value={form.seoTitulo ?? ''} onChange={(event) => setForm((current) => ({ ...current, seoTitulo: event.target.value }))} />
                <TextField label="Descrição SEO" fullWidth value={form.seoDescricao ?? ''} onChange={(event) => setForm((current) => ({ ...current, seoDescricao: event.target.value }))} />
              </Stack>

              <FormControlLabel
                control={<Switch checked={form.destaque} onChange={(event) => setForm((current) => ({ ...current, destaque: event.target.checked }))} />}
                label="Destacar na home"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={salvar.isPending} sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#1e344d' }}>
              {salvar.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)}>
        {feedback ? <Alert severity={feedback.type} onClose={() => setFeedback(null)}>{feedback.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
