import { Box, Paper, Stack, Typography } from '@mui/material';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';

type ProvasStatsProps = {
  stats: {
    total: number;
    bancas: number;
    instituicoes: number;
    anos: number;
  };
};

const items = [
  { key: 'total', label: 'Total', Icon: DescriptionOutlinedIcon },
  { key: 'bancas', label: 'Bancas', Icon: AccountBalanceOutlinedIcon },
  { key: 'instituicoes', label: 'Instituições', Icon: SchoolOutlinedIcon },
  { key: 'anos', label: 'Anos', Icon: CalendarTodayOutlinedIcon },
] as const;

export function ProvasStats({ stats }: ProvasStatsProps) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      {items.map(({ key, label, Icon }) => (
        <Paper
          key={key}
          elevation={0}
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid #e8edf3',
            bgcolor: '#fff',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Icon color="primary" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {stats[key]}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
