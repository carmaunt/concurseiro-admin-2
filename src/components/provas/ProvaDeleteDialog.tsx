import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type ProvaDeleteDialogProps = {
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ProvaDeleteDialog({ open, isDeleting, onClose, onConfirm }: ProvaDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={() => !isDeleting && onClose()} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Excluir prova?</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          Essa ação não pode ser desfeita.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDeleting} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isDeleting}
          sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
        >
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
