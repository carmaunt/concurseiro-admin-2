import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { ListPanel, ListPagination, ListTableEmptyState } from '@/components/listing/ListLayout';
import type { ProvaListItem } from '@/types/api';

type ProvasTableProps = {
  provas: ProvaListItem[];
  totalElements: number;
  pageAtual: number;
  sizeAtual: number;
  isAdmin: boolean;
  isDeleting: boolean;
  onView: (prova: ProvaListItem) => void;
  onAddQuestion: (provaId: number) => void;
  onDelete: (provaId: number) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
};

function formatModalidade(modalidade: string) {
  if (modalidade === 'CERTO_ERRADO') return 'CERTO ERRADO';
  if (modalidade === 'A_E' || modalidade === 'A_D') return 'MULTIPLA ESCOLHA';
  return modalidade;
}

export function ProvasTable({
  provas,
  totalElements,
  pageAtual,
  sizeAtual,
  isAdmin,
  isDeleting,
  onView,
  onAddQuestion,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}: ProvasTableProps) {
  return (
    <ListPanel title="Lista de provas" description="Exibindo banca, instituição, ano e modalidade.">
      <Table sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#fafbfc' }}>
            <TableCell sx={{ width: '25%' }}>
              <strong>Instituição</strong>
            </TableCell>
            <TableCell sx={{ width: '15%' }}>
              <strong>Banca</strong>
            </TableCell>
            <TableCell sx={{ width: '10%' }}>
              <strong>Ano</strong>
            </TableCell>
            <TableCell sx={{ width: '20%' }}>
              <strong>Modalidade</strong>
            </TableCell>
            <TableCell sx={{ width: '10%' }}>
              <strong>Questões</strong>
            </TableCell>
            <TableCell align="right" sx={{ width: '20%' }}>
              <strong>Ações</strong>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {provas.length === 0 ? (
            <ListTableEmptyState
              colSpan={6}
              title="Nenhuma prova encontrada."
              description="Cadastre uma nova prova para começar a montar simulados e vincular questões."
            />
          ) : (
            provas.map((prova) => (
              <TableRow key={prova.id} hover>
                <TableCell>{prova.instituicao}</TableCell>
                <TableCell>{prova.banca}</TableCell>
                <TableCell>{prova.ano}</TableCell>
                <TableCell>{formatModalidade(prova.modalidade)}</TableCell>
                <TableCell>{prova.totalQuestoes ?? 0}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Ver prova completa">
                      <IconButton color="primary" onClick={() => onView(prova)}>
                        <VisibilityOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Adicionar questão nesta prova">
                      <IconButton color="success" onClick={() => onAddQuestion(prova.id)}>
                        <AddCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={isAdmin ? 'Excluir prova' : 'Apenas administradores podem excluir provas'}>
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => onDelete(prova.id)}
                          disabled={!isAdmin || isDeleting}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {provas.length > 0 && (
        <ListPagination
          count={totalElements}
          page={pageAtual}
          rowsPerPage={sizeAtual}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </ListPanel>
  );
}
