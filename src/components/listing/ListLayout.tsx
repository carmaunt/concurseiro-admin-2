'use client';

import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  TableCell,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

type FeedbackMessage = {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
} | null;

type ListPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  contentSx?: SxProps<Theme>;
};

export function ListPanel({ title, description, children, contentSx }: ListPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: { xs: 3, md: 4 },
        border: '1px solid #e8edf3',
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: '1px solid #eef2f7' }}>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ overflowX: 'auto', ...contentSx }}>{children}</Box>
    </Paper>
  );
}

type ListPageStateProps = {
  type: 'loading' | 'error' | 'empty';
  title: string;
  message?: string;
  action?: ReactNode;
};

export function ListPageState({ type, title, message, action }: ListPageStateProps) {
  const isLoading = type === 'loading';
  const isError = type === 'error';

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: '#f6f8fb',
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 'min(100%, 520px)',
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          border: '1px solid #e8edf3',
          textAlign: 'center',
        }}
      >
        <Stack spacing={2} alignItems="center">
          {isLoading ? <CircularProgress size={34} /> : null}

          {isError ? (
            <Alert severity="error" sx={{ width: '100%', borderRadius: 2, textAlign: 'left' }}>
              {message || title}
            </Alert>
          ) : (
            <>
              <Typography variant="h6" fontWeight={800}>
                {title}
              </Typography>
              {message ? (
                <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
                  {message}
                </Typography>
              ) : null}
            </>
          )}

          {action}
        </Stack>
      </Paper>
    </Box>
  );
}

type ListEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
};

export function ListEmptyState({ title, description, action, sx }: ListEmptyStateProps) {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: 'center', ...sx }}>
      <Stack spacing={1.25} alignItems="center">
        <Typography fontWeight={800} color="text.primary">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            {description}
          </Typography>
        ) : null}
        {action}
      </Stack>
    </Box>
  );
}

type ListTableEmptyStateProps = ListEmptyStateProps & {
  colSpan: number;
};

export function ListTableEmptyState({ colSpan, ...props }: ListTableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ p: 0 }}>
        <ListEmptyState {...props} />
      </TableCell>
    </TableRow>
  );
}

type ListPaginationProps = {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  compact?: boolean;
};

export function ListPagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  compact = false,
}: ListPaginationProps) {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
      rowsPerPageOptions={[10, 20, 50]}
      labelRowsPerPage={compact ? 'Por página' : 'Itens por página'}
      sx={{
        borderTop: '1px solid #eef2f7',
        '.MuiTablePagination-toolbar': {
          px: { xs: 1, sm: 2 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          justifyContent: { xs: 'center', sm: 'flex-end' },
        },
      }}
    />
  );
}

type ConfirmDeleteDialogProps = {
  open: boolean;
  title: string;
  description: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  pendingLabel?: string;
};

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  isPending,
  onClose,
  onConfirm,
  confirmLabel = 'Excluir',
  pendingLabel = 'Excluindo...',
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={() => !isPending && onClose()} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{description}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isPending} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isPending}
          sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type FeedbackSnackbarProps = {
  feedback: FeedbackMessage;
  onClose: () => void;
};

export function FeedbackSnackbar({ feedback, onClose }: FeedbackSnackbarProps) {
  return (
    <Snackbar
      open={Boolean(feedback)}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {feedback ? (
        <Alert severity={feedback.type} onClose={onClose} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
