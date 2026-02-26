import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/AppLayout';
import TodaysWorkout from './pages/TodaysWorkout';
import Schedule from './pages/Schedule';
import Progress from './pages/Progress';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function RootLayout() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TodaysWorkout,
});

const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedule',
  component: Schedule,
});

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/progress',
  component: Progress,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
});

const routeTree = rootRoute.addChildren([indexRoute, scheduleRoute, progressRoute, settingsRoute]);
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
