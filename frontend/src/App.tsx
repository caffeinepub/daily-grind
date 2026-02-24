import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import AppLayout from './components/AppLayout';
import AuthGuard from './components/AuthGuard';
import TodaysWorkout from './pages/TodaysWorkout';
import Schedule from './pages/Schedule';
import Progress from './pages/Progress';

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ThemeProvider>
  ),
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

const routeTree = rootRoute.addChildren([indexRoute, todayRoute, scheduleRoute, progressRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
