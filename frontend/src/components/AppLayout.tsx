import { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Flame, Calendar, TrendingUp, Dumbbell, Settings2 } from 'lucide-react';
import LoginButton from './LoginButton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface AppLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { to: '/today', label: 'Today', icon: Flame },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings2 },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <img
                src="/assets/generated/app-logo.dim_256x256.png"
                alt="Daily Grind"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-lg">🔥</span>';
                }}
              />
            </div>
            <span className="font-black text-xl tracking-tight text-foreground">
              Daily<span className="text-primary">Grind</span>
            </span>
          </Link>

          {/* Nav */}
          {isAuthenticated && (
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const isActive = currentPath === to || (to === '/today' && currentPath === '/');
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          <LoginButton />
        </div>
      </header>

      {/* Mobile Nav */}
      {isAuthenticated && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-around h-16">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = currentPath === to || (to === '/today' && currentPath === '/');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-all ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-semibold">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24 sm:pb-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1">
          <Dumbbell size={12} className="text-primary" />
          <span>
            © {new Date().getFullYear()} Daily Grind — Built with{' '}
            <span className="text-primary">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'daily-grind'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
