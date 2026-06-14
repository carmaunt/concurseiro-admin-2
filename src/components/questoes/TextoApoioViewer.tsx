import CodeIcon from '@mui/icons-material/Code';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TableRowsIcon from '@mui/icons-material/TableRows';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { SafeMarkdown } from '@/components/content/SafeMarkdown';
import {
  normalizarTipoTextoApoio,
  parseImagemJson,
  parseTabelaJson,
  type TextoApoioTipo,
} from './textoApoio';

type Props = {
  titulo?: string | null;
  tipo?: TextoApoioTipo | string | null;
  conteudo?: string | null;
  conteudoJson?: string | null;
  compact?: boolean;
};

const labels: Record<TextoApoioTipo, string> = {
  TEXTO: 'Texto',
  CODIGO: 'Código',
  TABELA: 'Tabela',
  IMAGEM: 'Imagem',
};

export default function TextoApoioViewer({
  titulo,
  tipo,
  conteudo,
  conteudoJson,
  compact = false,
}: Props) {
  const tipoNormalizado = normalizarTipoTextoApoio(tipo);

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 1.5 : { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: '1px solid #bfdbfe',
        bgcolor: '#f8fbff',
        minWidth: 0,
      }}
    >
      <Stack spacing={1.5} minWidth={0}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography variant="subtitle2" fontWeight={800} color="#1e40af" sx={{ wordBreak: 'break-word' }}>
            {titulo || 'Texto de apoio'}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label={labels[tipoNormalizado]}
            icon={
              tipoNormalizado === 'TABELA'
                ? <TableRowsIcon />
                : tipoNormalizado === 'IMAGEM'
                  ? <ImageOutlinedIcon />
                  : tipoNormalizado === 'CODIGO'
                    ? <CodeIcon />
                    : undefined
            }
          />
        </Stack>

        <ConteudoTextoApoio
          tipo={tipoNormalizado}
          conteudo={conteudo}
          conteudoJson={conteudoJson}
        />
      </Stack>
    </Paper>
  );
}
function ConteudoTextoApoio({
  tipo,
  conteudo,
  conteudoJson,
}: {
  tipo: TextoApoioTipo;
  conteudo?: string | null;
  conteudoJson?: string | null;
}) {
  if (tipo === 'CODIGO') {
    return (
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflowX: 'auto',
          borderRadius: 1,
          bgcolor: '#111827',
          color: '#f8fafc',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: '0.875rem',
          lineHeight: 1.65,
          whiteSpace: 'pre',
        }}
      >
        {conteudo || ''}
      </Box>
    );
  }

  if (tipo === 'TABELA') {
    const tabela = parseTabelaJson(conteudoJson, conteudo || '');
    const possuiConteudo = tabela.colunas.some(Boolean) || tabela.linhas.some((linha) => linha.some(Boolean));

    if (!possuiConteudo) return <Alert severity="warning">Tabela sem conteúdo estruturado.</Alert>;

    return (
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', border: '1px solid #dbe3ef', borderRadius: 1 }}>
        <Table size="small" sx={{ tableLayout: 'auto', minWidth: Math.max(360, tabela.colunas.length * 150) }}>
          <TableHead>
            <TableRow>
              {tabela.colunas.map((coluna, index) => (
                <TableCell key={`${coluna}-${index}`} sx={{ fontWeight: 800, bgcolor: '#eff6ff', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {coluna}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tabela.linhas.map((linha, rowIndex) => (
              <TableRow key={rowIndex}>
                {tabela.colunas.map((_, colIndex) => (
                  <TableCell key={`${rowIndex}-${colIndex}`} sx={{ whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                    {linha[colIndex] || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (tipo === 'IMAGEM') {
    const imagem = parseImagemJson(conteudoJson);
    if (!imagem) return <Alert severity="warning">Imagem sem dados válidos.</Alert>;

    return (
      <Box
        component="img"
        src={imagem.url}
        alt={imagem.alt || conteudo || ''}
        width={imagem.largura}
        height={imagem.altura}
        sx={{
          display: 'block',
          width: 'auto',
          maxWidth: '100%',
          height: 'auto',
          maxHeight: 640,
          mx: 'auto',
          objectFit: 'contain',
          borderRadius: 1,
        }}
      />
    );
  }

  return <SafeMarkdown value={conteudo} sx={{ color: '#334155', lineHeight: 1.8 }} />;
}
