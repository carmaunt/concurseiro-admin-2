// src/components/layout/AppLayout.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUserRole } from '@/hooks/useAuthSession';
import { clearAuthSession } from '@/services/auth';
import { logout } from '@/services/authService';

const drawerWidth = 240;
const headerHeight = 64;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const userRole = useCurrentUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    clearAuthSession();
    router.push('/login');
  };

  const isAdmin = userRole === 'ADMIN';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <List sx={{ px: 1.5, py: 2 }}>
        <ListItemButton selected={pathname === '/questoes'} onClick={() => router.push('/questoes')} sx={{ borderRadius: 2, mb: 0.5 }}>
          <ListItemText primary="Questões" />
        </ListItemButton>

        <ListItemButton selected={pathname === '/provas'} onClick={() => router.push('/provas')} sx={{ borderRadius: 2, mb: 0.5 }}>
          <ListItemText primary="Provas" />
        </ListItemButton>

        <ListItemButton selected={pathname === '/catalogo/importacao'} onClick={() => router.push('/catalogo/importacao')} sx={{ borderRadius: 2, mb: 0.5 }}>
          <ListItemText primary="Importar catálogo" />
        </ListItemButton>

        <ListItemButton
          selected={pathname === '/usuarios'}
          onClick={() => {
            if (isAdmin) router.push('/usuarios');
          }}
          disabled={!isAdmin}
          sx={{ borderRadius: 2, opacity: !isAdmin ? 0.5 : 1, cursor: !isAdmin ? 'not-allowed' : 'pointer' }}
        >
          <ListItemText primary="Usuários" />
        </ListItemButton>

        <ListItemButton
          selected={pathname === '/estatisticas'}
          onClick={() => {
            if (isAdmin) router.push('/estatisticas');
          }}
          disabled={!isAdmin}
          sx={{ borderRadius: 2, mt: 0.5, opacity: !isAdmin ? 0.5 : 1, cursor: !isAdmin ? 'not-allowed' : 'pointer' }}
        >
          <ListItemText primary="Analytics" />
        </ListItemButton>
      </List>

      <Box sx={{ mt: 'auto', p: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2, mt: 1, color: '#d32f2f', '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.08)' } }}
        >
          <ListItemText primary="Sair" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f8fb' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: headerHeight,
          justifyContent: 'center',
          backgroundColor: '#1e344d',
          backgroundImage: 'linear-gradient(90deg, #122033 0%, #1e344d 58%, #263f5d 100%)',
          boxShadow: '0 8px 24px rgba(18, 32, 51, 0.16)',
        }}
      >
        <Toolbar sx={{ minHeight: `${headerHeight}px !important`, px: { xs: 2, sm: 3 } }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5 }} aria-label="Abrir menu">
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                flexShrink: 0,
              }}
            >
              <MenuBookOutlinedIcon sx={{ fontSize: 22, color: '#f5edd5' }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} noWrap sx={{ lineHeight: 1.1 }}>
                Painel Admin
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  color: 'rgba(248,250,252,0.72)',
                  letterSpacing: 1.4,
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                CONCURSEIRO
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" aria-label="Menu principal">
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              [`& .MuiDrawer-paper`]: {
                width: 'min(82vw, 300px)',
                boxSizing: 'border-box',
                pt: `${headerHeight}px`,
                borderRight: '1px solid #e8edf3',
                backgroundColor: '#ffffff',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
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
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: `${drawerWidth}px` },
          pt: `${headerHeight}px`,
          minHeight: '100vh',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
