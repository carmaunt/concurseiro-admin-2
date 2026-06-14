'use client';

import { Autocomplete, Box, Stack, TextField } from '@mui/material';
import type { Enunciado } from '@/types/api';

type Props = {
  enunciados: Enunciado[];
  enunciadoId: string;
  conteudo: string;
  onChange: (enunciadoId: string, conteudo: string) => void;
  error?: boolean;
  helperText?: string;
};

function resumir(conteudo: string) {
  const texto = conteudo.replace(/\s+/g, ' ').trim();
  return texto.length > 120 ? `${texto.slice(0, 117)}...` : texto;
}

export default function EnunciadoSelector({
  enunciados,
  enunciadoId,
  conteudo,
  onChange,
  error,
  helperText,
}: Props) {
  const selecionado = enunciados.find((item) => String(item.id) === enunciadoId) || null;

  return (
    <Stack spacing={1.5}>
      <Autocomplete
        options={enunciados}
        value={selecionado}
        onChange={(_, novoValor) => {
          onChange(novoValor ? String(novoValor.id) : '', novoValor?.conteudo || '');
        }}
        getOptionLabel={(item) => item.conteudo.replace(/\s+/g, ' ').trim()}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="Nenhum enunciado encontrado"
        renderOption={(props, item) => (
          <Box
            component="li"
            {...props}
            key={item.id}
            sx={{ display: 'block', whiteSpace: 'normal', lineHeight: 1.35 }}
          >
            {resumir(item.conteudo) || `Enunciado #${item.id}`}
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Reaproveitar enunciado existente"
            placeholder="Buscar enunciado"
            fullWidth
          />
        )}
      />

      <TextField
        label="Enunciado"
        multiline
        minRows={3}
        fullWidth
        value={conteudo}
        onChange={(event) => onChange('', event.target.value)}
        disabled={Boolean(enunciadoId)}
        error={error}
        helperText={helperText}
      />
    </Stack>
  );
}
