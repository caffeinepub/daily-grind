import { useEffect } from 'react';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import AppLayout from './components/AppLayout';
import AuthGuard from './components/AuthGuard';
import TodaysWorkout from './pages/TodaysWorkout';
import Schedule from './pages/Schedule';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import { registerServiceWorker } from './utils/notificationService';

function RootLayout() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ThemeProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <AuthGuard>
      <TodaysWorkout />
    </AuthGuard>
  ),
});

const todayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/today',
  component: () => (
    <AuthGuard>
      <TodaysWorkout />
    </AuthGuard>
  ),
});

const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedule',
  component: () => (
    <AuthGuard>
      <Schedule />
    </AuthGuard>
  ),
});

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/progress',
  component: () => (
    <AuthGuard>
      <Progress />
    </AuthGuard>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <AuthGuard>
      <Settings />
    </AuthGuard>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute, todayRoute, scheduleRoute, progressRoute, settingsRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
