// src/app/(dashboard)/provas/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

type Prova = {
  id: number;
  banca: string;
  ano: number;
  instituicao: string;
  modalidade: string;
};

export default function ProvasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['provas'],
    queryFn: async () => {
      const res = await api.get('/provas');
      return res.data;
    },
  });

  const deletarProva = useMutation({
    mutationFn: (id: number) => api.delete(`/provas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provas'] }),
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Provas</Typography>

        <Button
          variant="contained"
          onClick={() => router.push('/provas/nova')}
        >
          Nova Prova
        </Button>
      </Stack>

      <Stack spacing={2}>
        {data?.map((prova: Prova) => (
          <Card key={prova.id}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography fontWeight="bold">
                    {prova.instituicao}
                  </Typography>

                  <Typography variant="body2">
                    {prova.banca} • {prova.ano} • {prova.modalidade}
                  </Typography>
                </Box>

                <IconButton
                  onClick={() => deletarProva.mutate(prova.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}