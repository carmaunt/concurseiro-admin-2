'use client';

import { useQuery } from '@tanstack/react-query';
import { listarCategoriasAtivas, listarTagsAtivas } from '@/services/taxonomiasService';

export const taxonomiasKeys = { all: ['taxonomias'] as const, categoriasAtivas: ['taxonomias', 'categorias-ativas'] as const, tagsAtivas: ['taxonomias', 'tags-ativas'] as const };

export function useCategoriasAtivas() {
  return useQuery({ queryKey: taxonomiasKeys.categoriasAtivas, queryFn: listarCategoriasAtivas });
}

export function useTagsAtivas() {
  return useQuery({ queryKey: taxonomiasKeys.tagsAtivas, queryFn: () => listarTagsAtivas() });
}
