import type { TypographyProps } from '@mui/material';
import { Typography } from '@mui/material';
import { renderSafeMarkdown } from './safeMarkdown';

type SafeMarkdownProps = {
  value: string | null | undefined;
  variant?: TypographyProps['variant'];
  sx?: TypographyProps['sx'];
};

export function SafeMarkdown({ value, variant = 'body1', sx }: SafeMarkdownProps) {
  return (
    <Typography
      variant={variant}
      sx={[
        { whiteSpace: 'normal', wordBreak: 'break-word' },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
      dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(value) }}
    />
  );
}
