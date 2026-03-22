// src/components/layout/AppLayout.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';

const drawerWidth = 240;
const headerHeight = 64;

function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    return payload.role ?? payload.authorities?.[0] ?? null;
  } catch {
    return null;
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = getRoleFromToken(token);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const isAdmin = userRole === 'ADMIN';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f8fb' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: headerHeight,
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Toolbar sx={{ minHeight: `${headerHeight}px !important` }}>
          <Typography variant="h6" fontWeight={700}>
            Painel Admin
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: `${headerHeight}px`,
            height: `calc(100vh - ${headerHeight}px)`,
            borderRight: '1px solid #e8edf3',
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List sx={{ px: 1.5, py: 2 }}>
            <ListItemButton
              selected={pathname === '/questoes'}
              onClick={() => router.push('/questoes')}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText primary="Questões" />
            </ListItemButton>

            <ListItemButton
              selected={pathname === '/provas'}
              onClick={() => router.push('/provas')}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText primary="Provas" />
            </ListItemButton>

            <ListItemButton
              selected={pathname === '/usuarios'}
              onClick={() => {
                if (isAdmin) router.push('/usuarios');
              }}
              disabled={!isAdmin}
              sx={{
                borderRadius: 2,
                opacity: !isAdmin ? 0.5 : 1,
                cursor: !isAdmin ? 'not-allowed' : 'pointer',
              }}
            >
              <ListItemText primary="Usuários" />
            </ListItemButton>
          </List>

          <Box sx={{ mt: 'auto', p: 1.5 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                mt: 1,
                color: '#d32f2f',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.08)',
                },
              }}
            >
              <ListItemText
                primary="Sair"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: `${drawerWidth}px`,
          pt: `${headerHeight}px`,
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}