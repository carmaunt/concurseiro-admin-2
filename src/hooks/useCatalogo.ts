import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import {
  importarCatalogoTexto,
  type ImportacaoCatalogoResponse,
} from '@/services/catalogoService';

export function useImportarCatalogoTexto(
  options?: UseMutationOptions<ImportacaoCatalogoResponse, unknown, string>
) {
  return useMutation({
    mutationFn: importarCatalogoTexto,
    ...options,
  });
}
