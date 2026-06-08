import { ConfirmDeleteDialog } from '@/components/listing/ListLayout';

type ProvaDeleteDialogProps = {
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ProvaDeleteDialog({ open, isDeleting, onClose, onConfirm }: ProvaDeleteDialogProps) {
  return (
    <ConfirmDeleteDialog
      open={open}
      title="Excluir prova?"
      description="Essa ação remove a prova selecionada e não pode ser desfeita."
      isPending={isDeleting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
