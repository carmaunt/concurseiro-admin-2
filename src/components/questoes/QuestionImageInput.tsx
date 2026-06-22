'use client';

import { useEffect, useState } from 'react';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';

type Props = {
  file: File | null;
  altText: string;
  onFileChange: (file: File | null) => void;
  onAltTextChange: (value: string) => void;
};

export default function QuestionImageInput({ file, altText, onFileChange, onAltTextChange }: Props) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        setPreview({ file, url: reader.result });
      }
    });
    reader.readAsDataURL(file);

    return () => reader.abort();
  }, [file]);

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: '#fcfcfd' }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography fontWeight={800} color="#334155">Imagem do item</Typography>
          <Typography variant="body2" color="text.secondary">Use quando o item possuir uma figura própria.</Typography>
        </Box>

        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}>
          Selecionar imagem
          <Box component="input" type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onFileChange(event.target.files?.[0] ?? null);
            event.target.value = '';
          }} />
        </Button>

        {file && (
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <ImageOutlinedIcon color="action" />
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{file.name}</Typography>
            <Typography variant="caption" color="text.secondary">{(file.size / 1024).toFixed(1)} KB</Typography>
            <Button size="small" color="error" onClick={() => onFileChange(null)} sx={{ textTransform: 'none' }}>Remover</Button>
          </Stack>
        )}

        <TextField
          label="Texto alternativo"
          multiline
          minRows={2}
          fullWidth
          disabled={!file}
          inputProps={{ maxLength: 500 }}
          helperText={`${altText.length}/500`}
          value={altText}
          onChange={(event) => onAltTextChange(event.target.value)}
        />

        {file && preview?.file === file && (
          <Box component="img" src={preview.url} alt={altText} sx={{ display: 'block', width: 'auto', maxWidth: '100%', maxHeight: 420, mx: 'auto', objectFit: 'contain', border: '1px solid #dbe3ef', borderRadius: 1 }} />
        )}
      </Stack>
    </Paper>
  );
}
