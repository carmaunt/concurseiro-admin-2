// src/app/(dashboard)/questoes/page.tsx
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

type Questao = {
  id: number;
  enunciado: string;
  banca: string;
  ano: number;
  assunto: string;
  modalidade: string;
};

export default function QuestoesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['questoes'],
    queryFn: async () => {
      const res = await api.get('/questoes');
      return res.data;
    },
  });

  const deletarQuestao = useMutation({
    mutationFn: (id: number) => api.delete(`/questoes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questoes'] }),
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Questões</Typography>

        <Button
          variant="contained"
          onClick={() => router.push('/questoes/nova')}
        >
          Nova Questão
        </Button>
      </Stack>

      <Stack spacing={2}>
        {data?.map((q: Questao) => (
          <Card key={q.id}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="start"
              >
                <Box>
                  <Typography fontWeight="bold">
                    {q.enunciado}
                  </Typography>

                  <Typography variant="body2">
                    {q.banca} • {q.ano} • {q.assunto} • {q.modalidade}
                  </Typography>
                </Box>

                <IconButton
                  onClick={() => deletarQuestao.mutate(q.id)}
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