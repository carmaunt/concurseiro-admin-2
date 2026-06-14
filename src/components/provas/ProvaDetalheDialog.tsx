import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { SafeMarkdown } from '@/components/content/SafeMarkdown';
import TextoApoioViewer from '@/components/questoes/TextoApoioViewer';
import type { ProvaListItem, QuestaoListItem } from '@/types/api';

type ProvaDetalheDialogProps = {
  prova: ProvaListItem | null;
  questoes: QuestaoListItem[];
  loadingQuestoes: boolean;
  erroQuestoes: string;
  respostaSelecionada: string | null;
  respondeu: boolean;
  questaoEmResolucao: string | null;
  onClose: () => void;
  onSelecionarQuestao: (questaoId: string) => void;
  onSelecionarResposta: (letra: string | null) => void;
  onResponder: () => void;
  onResetResposta: () => void;
};

function isGabaritoAnulada(gabarito: string | null | undefined) {
  const normalizado = String(gabarito || '').toUpperCase();
  return normalizado === 'X' || normalizado === 'ANULADA';
}

function normalizarGabarito(gabarito: string | null | undefined) {
  const valor = String(gabarito || '').toUpperCase();
  if (valor === 'ERRADO') return 'E';
  if (valor === 'CERTO') return 'C';
  return valor;
}

export function ProvaDetalheDialog({
  prova,
  questoes,
  loadingQuestoes,
  erroQuestoes,
  respostaSelecionada,
  respondeu,
  questaoEmResolucao,
  onClose,
  onSelecionarQuestao,
  onSelecionarResposta,
  onResponder,
  onResetResposta,
}: ProvaDetalheDialogProps) {
  const handleAlternativaClick = (questaoId: string, letra: string, respondeuQuestao: boolean) => {
    if (respondeuQuestao) return;

    if (questaoEmResolucao !== questaoId) {
      onSelecionarQuestao(questaoId);
      onSelecionarResposta(letra);
      onResetResposta();
      return;
    }

    onSelecionarResposta(letra);
  };

  return (
    <Dialog
      open={Boolean(prova)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)',
          backgroundColor: '#f8fafc',
        },
      }}
    >
      {prova && (
        <>
          <DialogContent sx={{ p: 3, pt: 4, backgroundColor: '#f8fafc' }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                backgroundColor: '#fff',
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                  >
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#334155' }}>
                      {prova.instituicao}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                      Prova #{prova.id}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ color: '#475569' }}>
                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        Banca:
                      </Box>{' '}
                      {prova.banca}
                    </Typography>

                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        Ano:
                      </Box>{' '}
                      {prova.ano}
                    </Typography>

                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        Modalidade:
                      </Box>{' '}
                      {prova.modalidade}
                    </Typography>

                    {prova.nivel && (
                      <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          Nível:
                        </Box>{' '}
                        {prova.nivel}
                      </Typography>
                    )}

                    {prova.cargo && (
                      <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          Cargo:
                        </Box>{' '}
                        {prova.cargo}
                      </Typography>
                    )}

                    {typeof prova.totalQuestoes === 'number' && (
                      <Typography variant="body2">
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          Questões:
                        </Box>{' '}
                        {prova.totalQuestoes}
                      </Typography>
                    )}
                  </Stack>

                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#334155', mb: 2 }}>
                      Questões cadastradas
                    </Typography>

                    {loadingQuestoes && (
                      <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                      </Box>
                    )}

                    {!loadingQuestoes && erroQuestoes && (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {erroQuestoes}
                      </Alert>
                    )}

                    {!loadingQuestoes && !erroQuestoes && questoes.length === 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#fcfcfd',
                        }}
                      >
                        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                          Nenhuma questão cadastrada para esta prova.
                        </Typography>
                      </Paper>
                    )}

                    {!loadingQuestoes && !erroQuestoes && questoes.length > 0 && (
                      <Stack spacing={2}>
                        {questoes.map((questao) => (
                          <Paper
                            key={questao.idQuestion}
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#fcfcfd',
                            }}
                          >
                            <Stack spacing={1.25}>
                              <Stack spacing={0.5} alignItems="flex-start">
                                <Stack direction="row" spacing={3} flexWrap="wrap">
                                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    <strong>Disciplina:</strong> {questao.disciplina}
                                  </Typography>

                                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    <strong>Assunto:</strong> {questao.assunto}
                                  </Typography>
                                </Stack>

                                {questao.subassunto && (
                                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    <strong>Subassunto:</strong> {questao.subassunto}
                                  </Typography>
                                )}
                              </Stack>

                              {(questao.textoApoioConteudo || questao.textoApoioJson) && (
                                <TextoApoioViewer
                                  titulo={questao.textoApoioTitulo}
                                  tipo={questao.textoApoioTipo}
                                  conteudo={questao.textoApoioConteudo}
                                  conteudoJson={questao.textoApoioJson}
                                  compact
                                />
                              )}

                              <SafeMarkdown value={questao.enunciado} sx={{ color: '#374151' }} />
                              <SafeMarkdown value={questao.questao} sx={{ color: '#374151' }} />

                              {isGabaritoAnulada(questao.gabarito) && (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>Questão anulada.</Alert>
                              )}

                              <Stack spacing={1.5}>
                                {(questao.alternativas || 'C) CERTO\nE) ERRADO')
                                  .split('\n')
                                  .filter((item) => item.trim())
                                  .map((alternativa, index) => {
                                    const letra = alternativa.trim().charAt(0).replace(')', '');
                                    const isAnulada = isGabaritoAnulada(questao.gabarito);
                                    const isSelecionada =
                                      questaoEmResolucao === questao.idQuestion && respostaSelecionada === letra;
                                    const isCorreta =
                                      !isAnulada && letra.toUpperCase() === normalizarGabarito(questao.gabarito);
                                    const respondeuQuestao = questaoEmResolucao === questao.idQuestion && respondeu;

                                    return (
                                      <Box
                                        key={`${letra}-${index}`}
                                        onClick={() => handleAlternativaClick(questao.idQuestion, letra, respondeuQuestao)}
                                        sx={{
                                          p: 2,
                                          borderRadius: 3,
                                          border: respondeuQuestao && !isAnulada
                                            ? isCorreta
                                              ? '2px solid #16a34a'
                                              : isSelecionada
                                              ? '2px solid #dc2626'
                                              : '1px solid #e5e7eb'
                                            : isSelecionada
                                            ? '2px solid #2563eb'
                                            : '1px solid #e5e7eb',
                                          backgroundColor: respondeuQuestao && !isAnulada
                                            ? isCorreta
                                              ? '#dcfce7'
                                              : isSelecionada
                                              ? '#fee2e2'
                                              : '#fff'
                                            : isSelecionada
                                            ? '#eff6ff'
                                            : '#fff',
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: 1.5,
                                          cursor: respondeuQuestao ? 'default' : 'pointer',
                                          transition: 'all 0.2s ease',
                                          '&:hover': respondeuQuestao
                                            ? {}
                                            : {
                                                borderColor: '#2563eb',
                                                backgroundColor: '#f1f5f9',
                                              },
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            width: 22,
                                            height: 22,
                                            minWidth: 22,
                                            borderRadius: '50%',
                                            border: respondeuQuestao && !isAnulada
                                              ? isCorreta
                                                ? '2px solid #16a34a'
                                                : isSelecionada
                                                ? '2px solid #dc2626'
                                                : '2px solid #cbd5e1'
                                              : isSelecionada
                                              ? '2px solid #2563eb'
                                              : '2px solid #cbd5e1',
                                            mt: '2px',
                                            position: 'relative',
                                            '&::after':
                                              (respondeuQuestao && !isAnulada && (isCorreta || isSelecionada)) ||
                                              (!respondeuQuestao && isSelecionada) ||
                                              (respondeuQuestao && isAnulada && isSelecionada)
                                                ? {
                                                    content: '""',
                                                    position: 'absolute',
                                                    inset: 4,
                                                    borderRadius: '50%',
                                                    backgroundColor: respondeuQuestao && !isAnulada
                                                      ? isCorreta
                                                        ? '#16a34a'
                                                        : '#dc2626'
                                                      : '#2563eb',
                                                  }
                                                : undefined,
                                          }}
                                        />

                                        <Box sx={{ flex: 1 }}>
                                          <SafeMarkdown
                                            value={alternativa}
                                            variant="body1"
                                            sx={{
                                              fontWeight: 400,
                                              color: '#374151',
                                              lineHeight: 1.7,
                                            }}
                                          />
                                        </Box>
                                      </Box>
                                    );
                                  })}
                              </Stack>

                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1.5}
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                pt={1}
                              >
                                <Button
                                  variant="contained"
                                  disableElevation
                                  onClick={onResponder}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    px: 2.5,
                                    backgroundColor: '#2563eb',
                                  }}
                                >
                                  Responder
                                </Button>

                                <Button
                                  variant="text"
                                  onClick={() => {
                                    onSelecionarQuestao(questao.idQuestion);
                                    onSelecionarResposta(null);
                                    onResetResposta();
                                  }}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: '#64748b',
                                  }}
                                >
                                  Limpar
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                borderRadius: 2,
                px: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
              }}
            >
              Fechar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
