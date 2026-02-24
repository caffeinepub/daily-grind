import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      variant={isAuthenticated ? 'outline' : 'default'}
      size="sm"
      className={isAuthenticated ? 'border-border/60 text-muted-foreground hover:text-foreground' : 'btn-primary'}
    >
      {isLoggingIn ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span className="ml-1.5">Logging in...</span>
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut size={14} />
          <span className="ml-1.5">Logout</span>
        </>
      ) : (
        <>
          <LogIn size={14} />
          <span className="ml-1.5">Login</span>
        </>
      )}
    </Button>
  );
}
